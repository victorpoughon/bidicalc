import { describe, it } from "node:test";
import assert from "node:assert";

import * as nsf from "not-so-float";

import { constructCellModel } from "../cellModel.ts";
import { mainSolverForwards, midpoint } from "../mainSolverForwards.ts";

export function evaluate(expression: string, context: Record<string, number>): nsf.Union {
    const modelResult = constructCellModel(expression);
    assert.ok(modelResult.isOk(), `error constructing cell model for ${expression}`);
    const model = modelResult.value;

    return mainSolverForwards(model, (ref) => context[ref]);
}

const expectSingle = (actual: nsf.Union, expected: number) => {
    const tol = 1e-6;

    assert.ok(actual.isFinite(), `Expected a finite union, got ${actual}`);
    assert.ok(actual.isSingle(), `Expected a singleton union, got ${actual}`);

    const m = midpoint(actual.intervals[0]);
    assert.ok(Math.abs(m - expected) < tol, `expected ${expected}, got ${m}`);
};

const expectEmpty = (actual: nsf.Union) => {
    assert.ok(actual.isEmpty(), `expected empty union, got ${actual}`);
};

const expectInf = (actual: nsf.Union) => {
    assert.ok(!actual.isFinite(), `expected infinite union, got ${actual}`);
};

describe("mainSolverForwards", () => {
    it("expected single result", () => {
        expectSingle(evaluate("1+1", {}), 2);
        expectSingle(evaluate("1+x", { x: 1 }), 2);

        expectSingle(evaluate("10 - x*y", { x: 2, y: 3 }), 4);

        expectSingle(evaluate("x^3", { x: -10 }), -1000);

        expectSingle(evaluate("cos(0)", {}), 1);
        expectSingle(evaluate("sin(0)", {}), 0);
        expectSingle(evaluate("tan(0)", {}), 0);
    });

    it("expected empty", () => {
        expectEmpty(evaluate("0/0", {}));
        expectEmpty(evaluate("1/0", {}));
    });

    it("expected infinite", () => {
        expectInf(evaluate("1e300 * 1e300", {}));
    });
});
