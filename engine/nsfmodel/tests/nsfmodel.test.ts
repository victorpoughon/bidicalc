import { describe, it } from "node:test";
import assert from "node:assert";

import * as nsf from "not-so-float";

import { validGrammar } from "../../grammar/tests/grammarTestCases.ts";
import {
    constructNsfModel,
    composeNsfModelList,
    NsfLookup,
    NsfModel,
    NsfModelResult,
    neverLookup,
    lookupError,
} from "../semanticsNsfModel.ts";

import { Result, ok, err } from "neverthrow";

function resultToString(result: NsfModelResult): string {
    return result.match(
        (ok) => `ok(Model)`,
        (e) => `err(${e})`
    );
}

function evalAndExpectOk(formula: string): NsfModel {
    const result = constructNsfModel(formula);
    assert.ok(
        result.isOk(),
        `constructNsfModel not ok on: "${formula}, got ${resultToString(result)}"`
    );

    return result._unsafeUnwrap();
}

// Eq 18 from : https://hal.science/file/index/docid/576641/filename/computing-midpoint.pdf
function midpoint(I: nsf.Interval): number {
    if (I.lo === -I.hi) return 0;
    if (I.lo === I.hi) return I.lo;
    return I.lo / 2 + I.hi / 2;
}

const expectSingle = (expr: string, expected: number, lookup: NsfLookup = neverLookup) => {
    const tol = 1e-6;
    const model = evalAndExpectOk(expr);
    const actual = model(lookup);

    assert.ok(
        actual.isFinite(),
        `Expected nsfmodel for ${expr} to result in a finite union, got ${actual}`
    );
    assert.ok(
        actual.isSingle(),
        `Expected nsfmodel for ${expr} to result in a singleton union, got ${actual}`
    );
    const m = midpoint(actual.intervals[0]);
    assert.ok(
        Math.abs(m - expected) < tol,
        `nsfmodel evaluation of "${expr}" is ${m}, expected ${expected}`
    );
};

const expectEmpty = (expr: string, lookup: NsfLookup = neverLookup) => {
    const tol = 1e-6;
    const model = evalAndExpectOk(expr);
    const actual = model(lookup);

    assert.ok(
        actual.isEmpty(),
        `Expected nsfmodel for ${expr} to result in an empty union, got ${actual}`
    );
};

const expectConstructErr = (formula: string) => {
    const result = constructNsfModel(formula);
    assert.ok(
        result.isErr(),
        `Expected construction of nsf model for '${formula}' to be an error, got ${resultToString(
            result
        )}`
    );
};

describe("nsfmodel, simple math (no lookup)", () => {
    expectSingle("4+5", 9);
    expectSingle("2*3", 6);
    expectSingle("10-4", 6);
    expectSingle("8/2", 4);
    expectSingle("2^3", 8);
    expectSingle("3+4*2", 11);
    expectSingle("(3+4)*2", 14);
    expectSingle("10/3", 3.333333333);
    expectSingle("5-10", -5);
    expectSingle("2^0", 1);
    expectSingle("0+0", 0);
    expectSingle("0*5", 0);
    expectSingle("7-0", 7);
    expectSingle("0/1", 0);
    expectSingle("1^0", 1);
    expectSingle("0^1", 0);
    expectSingle("2^10", 1024);
    expectSingle("100/25", 4);
    expectSingle("1+2+3+4", 10);
    expectSingle("10-2-3", 5);
    expectSingle("2*3*4", 24);
    expectSingle("100/2/5", 10);
    expectSingle("(2+3)*(4+5)", 45);
    expectSingle("2^(1+1)", 4);
    expectSingle("10/(2+3)", 2);
    expectSingle("3+4*2/2", 7);
    expectSingle("(3+4)*(2+1)", 21);
    expectSingle("2^3^2", 512);
    expectSingle("2^(3^2)", 512);
    expectSingle("(2^3)^2", 64);
    expectSingle("10/4", 2.5);
    expectSingle("10/(2+3*2)", 1.25);
    expectSingle("3+4*(2+1)", 15);
    expectSingle("0.1+0.2", 0.3);
    expectSingle("1.5*2", 3);
    expectSingle("5.5-2.2", 3.3);
    expectSingle("4.4/2", 2.2);
    expectSingle("2.5^2", 6.25);
    expectSingle("1+2*3^2", 19);
    expectSingle("(1+2)*(3^2)", 27);
    expectSingle("((1+2)*3)^2", 81);
    expectSingle("2^(2^(1+1))", 16);
    expectSingle("10/(5-3)", 5);
    expectSingle("10/(2*(1+1))", 2.5);
    expectSingle("+5", 5);
    expectSingle("-5", -5);
    expectSingle("-5+5", 0);
    expectSingle("-(3+4)", -7);
    expectSingle("+(-3+4)", 1);
    expectSingle("-(-3+4)", -1);
    expectSingle("-(2^3)", -8);
    expectSingle("+2^3", 8);
    expectSingle("-(2^3^2)", -512);
    expectSingle("+2^3^2", 512);
    expectSingle("-(3+4*2)", -11);
    expectSingle("+3+4*2", 11);
    expectSingle("-(3+4)*(2+1)", -21);
    expectSingle("+(3+4)*(2+1)", 21);
    expectSingle("-((1+2)*3)^2", -81);
    expectSingle("+((1+2)*3)^2", 81);
    expectSingle("-(2^(2^(1+1)))", -16);
    expectSingle("+(2^(2^(1+1)))", 16);
    expectSingle("-10/(5-3)", -5);
    expectSingle("+10/(5-3)", 5);
    expectSingle("-(10/(2*(1+1)))", -2.5);
    expectSingle("+(10/(2*(1+1)))", 2.5);
});

describe("nsfmodel, nan and infinities", () => {
    expectEmpty("1/0");
    expectEmpty("-1/0");
    expectEmpty("sqrt(-1)");
});

describe("nsfmodel, valid external functions", () => {
    expectSingle("sqrt(16)", 4);
    expectSingle("abs(-4)", 4);
    expectSingle("abs(4)", 4);
    expectSingle("exp(1)", 2.71828182846);
    expectSingle("exp(4)", 54.5981500331);
    expectSingle("pi()", 3.141592653589793);

    expectSingle("cos(0)", 1);
    expectSingle("sin(0)", 0);
    expectSingle("tan(0)", 0)

    expectSingle("ln(exp(1))", 1.0);
    expectSingle("exp(ln(1))", 1.0);
    expectSingle("log(exp(1))", 1.0);
    expectSingle("exp(log(1))", 1.0);
});

describe("nsfmodel, with lookup", () => {
    const lookup = (ref: string): nsf.Union => {
        const val = {
            x: 10,
            y: 100,
            z: -5,
            a: -10,
        }[ref];
        return nsf.single(val ?? lookupError(ref));
    };

    expectSingle("x+y+z", 105, lookup);
    expectSingle("x*y+z", 995, lookup);
    expectSingle("pow(x, 2) - y + -z", 5, lookup);

    expectSingle("a^3", -1000, lookup);
});

describe("nsfmodel, evaluation should fail", () => {
    expectConstructErr("foo(16)");
    expectConstructErr("SQRT(16)");
    expectConstructErr("sqrt(16, 15)");
});

function expectChainedCompose(expr: string, binds: [string, string][], expected: number) {
    // Construct initial model
    const initialModelResult = constructNsfModel(expr);
    assert.ok(initialModelResult.isOk(), "Initial model invalid");
    if (initialModelResult.isErr()) return;
    const initialModel = initialModelResult.value;

    // Construct all intermediate models
    const bindModelsResults = binds.map(([ref, expr]) => constructNsfModel(expr));
    const bindModelsCombined = Result.combine(bindModelsResults);
    assert.ok(bindModelsCombined.isOk(), "Intermediate bind model invalid");
    if (bindModelsCombined.isErr()) return;
    const bindModels = bindModelsCombined.value;

    // Compose models
    const modelBinds: [string, NsfModel][] = [...Array(binds.length).keys()].map((i) => [
        binds[i][0],
        bindModels[i],
    ]);
    const composedModel = composeNsfModelList(initialModel, modelBinds);

    // Evaluate the composed model
    const actual = composedModel(neverLookup);

    const tol = 1e-6;

    assert.ok(
        actual.isFinite(),
        `Expected nsfmodel for ${expr} to result in a finite union, got ${actual}`
    );
    assert.ok(
        actual.isSingle(),
        `Expected nsfmodel for ${expr} to result in a singleton union, got ${actual}`
    );
    const m = midpoint(actual.intervals[0]);
    assert.ok(
        Math.abs(m - expected) < tol,
        `nsfmodel evaluation of "${expr}" is ${m}, expected ${expected}`
    );
}

describe("compose nsf models", () => {
    it("can be chained composed", () => {
        expectChainedCompose(
            "A*B",
            [
                ["A", "X+1"],
                ["B", "Y+3"],
                ["Y", "2*X"],
                ["X", "1"],
            ],
            10
        );

        expectChainedCompose(
            "x*y + z",
            [
                ["x", "5"],
                ["y", "7"],
                ["z", "0.5"],
            ],
            35.5
        );
    });
});
