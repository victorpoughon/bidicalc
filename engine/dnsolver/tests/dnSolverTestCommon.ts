import { describe, it } from "node:test";
import assert from "node:assert";

import { performance, PerformanceObserver } from "node:perf_hooks";
import { constructTfModel, Lookup } from "../semanticsTfModel.ts";
import { dnConvergeLoop, DNStep, DNStepResult } from "../dnSolver.ts";
import { IntervalDomain } from "../../core/intervalDomain.ts";
import { solverSettings } from "../../mainsolver/solverSettings.ts";

import * as tf from "@tensorflow/tfjs";
import * as nsf from "not-so-float";

export  const cspDefaultDomain = solverSettings.csp.globalDomain;

// Initialize performance measuring
const obs = new PerformanceObserver((items) => {
    items.getEntries().forEach((entry) => {
        console.log(`${entry.name}: ${entry.duration}ms`);
    });
    performance.clearMarks();
});
obs.observe({ type: "measure" });

type Predicate = (
    expression: string,
    finalVars: Record<string, number>,
    finalEval: number,
    tol: number,
    totalIter: number,
) => void;

const debugCallback = (i: number, bestValue: number, step: DNStep) => {
    // Helper to format numbers to fixed width with fixed decimals
    const fmtNum = (num: number, width: number, decimals: number = 4) => {
        const str = num.toFixed(decimals);
        return str.length >= width ? str.slice(0, width) : str.padEnd(width, " ");
    };

    // Format array of numbers to fixed width each
    const fmtArray = (arr: Float32Array, width: number, decimals: number = 6) =>
        Array.from(arr)
            .map((v) => fmtNum(v, width, decimals))
            .join(" ");

    console.log(
        `[${i.toString().padStart(3, " ")}]  ` + // index aligned to width 3
            `F = ${fmtNum(bestValue, 10, 6)}  ` +
            `||G||^2 = ${fmtNum(step.gradNorm2, 12)}  ` +
            `gamma = ${fmtNum(step.gamma, 5, 4)}  ` +
            `vars: [${fmtArray(step.newPoint.dataSync() as Float32Array, 12)}]`,
    );
};

function runSolver(
    expression: string,
    domain: IntervalDomain,
    tol: number,
    maxIter: number,
    predicate: Predicate,
    debug: boolean = false,
) {
    const result = constructTfModel(expression);
    assert.ok(result.isOk(), `model construction failed for expression ${expression}`);
    const tfmodel = result.value;

    if (debug) {
        console.log("\n\n");
        console.log(`Beginning static DN for: ${expression} = 0`);
        performance.mark("start");
    }

    const goal = 0;
    const dnInitPoint = solverSettings.dnInit(domain);
    const dnResult = dnConvergeLoop(
        tfmodel,
        goal,
        dnInitPoint,
        solverSettings.dn.gamma,
        (iter: number, value: number, diff: number) => iter >= maxIter || Math.abs(diff) <= tol,
        debug ? debugCallback : () => {},
    );

    if (debug) {
        performance.mark("end");
        performance.measure(`staticDN | ${expression} `, "start", "end");
    }

    const finalVars = dnResult.point;

    // Evaluate the model with the solution
    const lookup = (ref: string) => tf.tensor(finalVars[ref], [], "float32");
    const finalEval = tfmodel(lookup).dataSync()[0];

    if (debug) {
        console.log("DONE");
        console.log(`Got final values ${JSON.stringify(finalVars)}`);
        console.log(`Which evaluate to ${finalEval}`);
        console.log("\n\n");
    }

    predicate(expression, finalVars, finalEval, tol, dnResult.totalIter);
}

function expectSolvePredicate(expectedIterations: number) {
    return (
        expression: string,
        finalVars: Record<string, number>,
        finalEval: number,
        tol: number,
        totalIter: number,
    ) => {
        const msg = `Solving ${expression} = 0, got final values ${JSON.stringify(
            finalVars,
        )} which evaluate to ${finalEval} (expected less than ${tol})`;

        assert.ok(Math.abs(finalEval) <= tol, msg);
        assert.ok(
            totalIter <= expectedIterations,
            `Solving ${expression} = 0, expected fewer than ${expectedIterations} iterations to reach root, took ${totalIter}`,
        );
    };
}

export function expectSolve(
    expression: string,
    domain: Record<string, nsf.Interval>,
    expectedIterations: number,
    tol: number,
    debug: boolean = false,
) {
    runSolver(
        expression,
        IntervalDomain.fromRecord(domain),
        tol,
        expectedIterations,
        expectSolvePredicate(expectedIterations),
        debug,
    );
}

function expectNoSolvePredicate() {
    return (
        expression: string,
        finalVars: Record<string, number>,
        finalEval: number,
        tol: number,
    ) => {
        const msg = `Solving ${expression} = 0,
    got final values ${JSON.stringify(
        finalVars,
    )} which evaluate to ${finalEval} (expected more than ${tol})`;

        assert.ok(Math.abs(finalEval) > tol, msg);
    };
}

export function expectNoSolve(
    expression: string,
    domain: Record<string, nsf.Interval>,
    tol: number,
    debug: boolean = false,
) {
    runSolver(
        expression,
        IntervalDomain.fromRecord(domain),
        tol,
        50,
        expectNoSolvePredicate(),
        debug,
    );
}