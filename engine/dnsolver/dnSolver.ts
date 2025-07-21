import { neverLookup, TfModel, Lookup } from "./semanticsTfModel.ts";
import * as tf from "@tensorflow/tfjs";
import { assert } from "../core/utils.ts";

// Directional Newton
// Returns NaN if the gradient is zero
function directionalNewton(value: tf.Scalar, grad: tf.Tensor1D): tf.Tensor1D {
    const denom = tf.dot(grad, grad);
    return tf.div(tf.mul(value, grad), denom) as tf.Tensor1D;
}

function isScalar(t: tf.Tensor): t is tf.Scalar {
    return t.rank === 0;
}

function isTensor1D(t: tf.Tensor): t is tf.Tensor1D {
    return t.rank === 1;
}

// Step vector when gradient is too close to zero
function perturbationStep(value: tf.Scalar, theta: tf.Tensor1D): tf.Tensor1D {
    return tf.add(tf.mul(0.5, theta), 1.0) as tf.Tensor1D;
}

export type DNStep = {
    absDiff: number;
    newPoint: tf.Tensor;
    gradNorm2: number;
    gamma: number;
};

export type DNStepResult = {
    bestValue: number;
    step: DNStep | null;
};

/* DNstep: Directional Newton with line search

Compute a single update step of directional newton (aka gradient method),
with backtracking line search over a fixed multiplicative sequence.

Note that this implementation depends on Tensor.dataSync() and therefore only
really works with the CPU backend.

Args:
    f: the scalar function to perform root-finding
    point: a point as a trainable tensor
    indexing: index of references used in the tfmodel
    gamma: list of multiplicative factors for line search

Returns a result where:
    DNStep, the computed step that sucessfully improves |f(x)|
    
    null if no improvement can be found on the line, or if the line doesn't even
    exist due to a zero gradient
*/
export function DNstep(
    f: (lookup: Lookup) => tf.Scalar,
    point: tf.Variable,
    indexing: Map<string, number>,
    gamma: number[]
): DNStepResult {
    assert(isTensor1D(point));
    // Make a lookup context using the indexing map
    const lookup = (ref: string) => {
        return point.slice(indexing.get(ref)!, 1);
    };

    // Compute function value and gradient
    const { value: currentValue, grads } = tf.variableGrads(() => f(lookup), [point]);
    const grad = Object.values(grads)[0];
    const gradNorm2 = tf.dot(grad, grad) as tf.Scalar;
    assert(isTensor1D(grad));

    // Zero gradient check
    const epsilon = 0.0;
    if (tf.lessEqual(gradNorm2, epsilon).dataSync()[0]) {
        return {
            bestValue: currentValue.dataSync()[0],
            step: null,
        };
    }

    // The full directional newton step vector
    const step = tf.neg(directionalNewton(currentValue, grad));

    // Evaluate on the line
    for (let gi = 0; gi < gamma.length; gi++) {
        const newPoint = tf.add(point, tf.mul(gamma[gi], step));
        const newLookup = (ref: string) => newPoint.slice(indexing.get(ref)!, 1);
        const newValue = f(newLookup);

        const absImprovement = tf.sub(tf.abs(newValue), tf.abs(currentValue)).dataSync()[0];
        const isImprovement = absImprovement < 0;

        if (isImprovement) {
            return {
                bestValue: newValue.dataSync()[0],
                step: {
                    absDiff: absImprovement,
                    newPoint: newPoint,
                    gamma: gamma[gi],
                    gradNorm2: gradNorm2.dataSync()[0], // of previous step
                },
            };
        }
    }

    return {
        bestValue: currentValue.dataSync()[0],
        step: null,
    };
}

function variablesToRecord(
    variables: tf.Variable,
    indexing: Map<string, number>
): Record<string, number> {
    const data = variables.dataSync();
    return Object.fromEntries(
        Array.from(indexing.entries()).map(([ref, index]) => [ref, data[index]])
    );
}

function toIndexingPair(init: Map<string, number>): [tf.Tensor, Map<string, number>] {
    const V = [...init.values()];
    const P = tf.tensor(V, [V.length], "float32");
    const indexing = new Map([...init.entries()].map(([ref, _], index) => [ref, index]));
    return [P, indexing];
}

export type DNResult = {
    value: number;
    point: Record<string, number>;
    totalIter: number;
};

// Attempt to converge to a root
export function dnConvergeLoop(
    model: TfModel,
    goal: number,
    init: Map<string, number>,
    gamma: number[],
    halt: (iter: number, value: number, absDiff: number) => boolean,
    stepcallback: (i: number, bestValue: number, step: DNStep) => void = () => {}
): DNResult {
    const [initialPoint, indexing] = toIndexingPair(init);
    const scalarModel = (lookup: Lookup) => tf.sub(model(lookup), goal).asScalar();

    tf.disposeVariables();
    assert(isTensor1D(initialPoint));
    const point = tf.variable(initialPoint, true, "point");

    let iter = 0;

    while (true) {
        // Attempt a step
        const stepResult = DNstep(scalarModel, point, indexing, gamma);

        // If we can't find an improving step, return current point
        if (stepResult.step === null) {
            return {
                value: stepResult.bestValue,
                point: variablesToRecord(point, indexing),
                totalIter: iter,
            };
        }

        // Else, update current point
        assert(isTensor1D(stepResult.step.newPoint));
        point.assign(stepResult.step.newPoint);

        stepcallback(iter, stepResult.bestValue, stepResult.step);
        iter += 1;

        // Check halt condition
        if (halt(iter, stepResult.bestValue, stepResult.step.absDiff)) {
            return {
                value: stepResult.bestValue,
                point: variablesToRecord(point, indexing),
                totalIter: iter,
            };
        }
    }
}
