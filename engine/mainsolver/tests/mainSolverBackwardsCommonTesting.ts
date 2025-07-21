import { describe, it } from "node:test";
import assert from "node:assert";

import { solverSettings } from "../solverSettings.ts";

import { mainSolverBackwards, TurboCallback } from "../mainSolverBackwards.ts";
import { mainSolverForwards, unionToSingleNumber } from "../mainSolverForwards.ts";

import { constructCellModel } from "../cellModel.ts";

export function expectSolve(
    expression: string,
    goals: number[] = [0],
    debug: TurboCallback | null = null
) {
    const modelResult = constructCellModel(expression);
    assert.ok(modelResult.isOk(), `error constructing cell model for ${expression}`);
    const model = modelResult.value;

    for (const goal of goals) {
        // console.debug(`[expectSolve] >> ${expression} = ${goal}`);

        const backwardsResult = mainSolverBackwards(model, goal, debug);

        assert.notDeepEqual(
            backwardsResult,
            null,
            `Expected to solve ${expression} = ${goal}, got null result from main backwards solver`
        );
        assert.deepEqual(Object.keys(backwardsResult!).toSorted(), model.refs.singles.toSorted());

        const forwardResult = unionToSingleNumber(
            mainSolverForwards(model, (ref) => backwardsResult![ref])
        );

        assert.ok(forwardResult.isOk(), `Solution is not a single union: ${forwardResult}`);
        const actual = forwardResult.value;

        assert.ok(
            solverSettings.verifySolution(actual, goal),
            `Solution incorrect for ${expression} = ${goal}, found ${JSON.stringify(
                backwardsResult
            )}, F = ${actual}`
        );
    }
}

export function expectExactSolve(
    expression: string,
    goal: number,
    expected: Record<string, number>,
    debug: TurboCallback | null = null
) {
    const modelResult = constructCellModel(expression);
    assert.ok(modelResult.isOk(), `error constructing cell model for ${expression}`);
    const model = modelResult.value;

    const backwardsResult = mainSolverBackwards(model, goal, debug);

    assert.notDeepEqual(
        backwardsResult,
        null,
        `Expected to solve ${expression} = ${goal}, got null result from main backwards solver`
    );
    assert.deepEqual(Object.keys(backwardsResult!).toSorted(), model.refs.singles.toSorted());

    const forwardResult = unionToSingleNumber(
        mainSolverForwards(model, (ref) => backwardsResult![ref])
    );

    assert.ok(forwardResult.isOk(), `Solution is not a single union: ${forwardResult}`);
    const actual = forwardResult.value;

    assert.ok(
        solverSettings.verifySolution(actual, goal),
        `Solution incorrect for ${expression} = ${goal}, found ${JSON.stringify(
            backwardsResult
        )}, F = ${actual}`
    );

    assert.deepStrictEqual(
        backwardsResult,
        expected,
        `backwards solve result not expected for ${expression} = ${goal}`
    );
}

export function expectNoSolve(
    expression: string,
    goals: number[] = [0],
    debug: TurboCallback | null = null
) {
    const modelResult = constructCellModel(expression);
    assert.ok(modelResult.isOk());
    const model = modelResult.value;

    for (const goal of goals) {
        const backwardsResult = mainSolverBackwards(model, goal, debug);

        assert.deepEqual(
            backwardsResult,
            null,
            `Expected to NOT solve ${expression} = ${goal}, got result: ${JSON.stringify(
                backwardsResult
            )}`
        );
    }
}
