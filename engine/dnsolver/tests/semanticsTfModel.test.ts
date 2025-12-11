import { describe, it } from "node:test";
import assert from "node:assert";

import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-backend-cpu";

import { validGrammar } from "../../grammar/tests/grammarTestCases.ts";
import {
    constructTfModel,
    ModelResult,
    Lookup,
    TfModel,
    neverLookup,
    lookupError,
} from "../semanticsTfModel.ts";
import { alwaysRegistry } from "../externalFunctionsTfModel.ts";

// Testing lookup function that always returns zero
const zeroLookup: Lookup = (_: string) => tf.tensor(0);

function resultToString(result: ModelResult): string {
    return result.match(
        (ok) => `ok(Model)`,
        (e) => `err(${e})`,
    );
}

function evalAndExpectOk(formula: string): TfModel {
    const result = constructTfModel(formula);
    assert.ok(
        result.isOk(),
        `constructModel not ok on: "${formula}, got ${resultToString(result)}"`,
    );

    return result._unsafeUnwrap();
}

const expectStrictResult = (formula: string, expected: number, lookup: Lookup = neverLookup) => {
    const model = evalAndExpectOk(formula);
    const tensor = model(lookup);

    const actual = tensor.dataSync();

    assert.deepEqual(
        actual,
        new Float32Array([expected]),
        `Formula: "${formula}", evaluates to ${actual} but expected ${expected}`,
    );
};

const expectApproxResult = (formula: string, expected: number, lookup: Lookup = neverLookup) => {
    const model = evalAndExpectOk(formula);
    const tensor = model(lookup);

    const actual = tensor.dataSync()[0];

    assert.ok(
        Math.abs(actual - expected) < 0.0001,
        `Formula: "${formula}", evaluates to ${actual} but expected ${expected}`,
    );
};

describe("constructModel, on all valid grammar examples", () => {
    for (const str of validGrammar) {
        // Special eval with zeroLookup and alwaysRegistry
        const result = constructTfModel(str, alwaysRegistry);
        assert.ok(
            result.isOk(),
            `constructModel not ok on: "${str}, got ${resultToString(result)}"`,
        );
        const tensor_result = result.map((model) => model(zeroLookup));
        assert.ok(tensor_result.isOk(), `Cannot evaluate model constructed from ${str}`);
    }
});

describe("constructModel, simple math (no lookup)", () => {
    expectStrictResult("4+5", 9);
    expectStrictResult("2*3", 6);
    expectStrictResult("10-4", 6);
    expectStrictResult("8/2", 4);
    expectStrictResult("2^3", 8);
    expectStrictResult("3+4*2", 11);
    expectStrictResult("(3+4)*2", 14);
    expectStrictResult("10/3", 3.333333333);
    expectStrictResult("5-10", -5);
    expectStrictResult("2^0", 1);
    expectStrictResult("0+0", 0);
    expectStrictResult("0*5", 0);
    expectStrictResult("7-0", 7);
    expectStrictResult("0/1", 0);
    expectStrictResult("1^0", 1);
    expectStrictResult("0^1", 0);
    expectStrictResult("2^10", 1024);
    expectStrictResult("100/25", 4);
    expectStrictResult("1+2+3+4", 10);
    expectStrictResult("10-2-3", 5);
    expectStrictResult("2*3*4", 24);
    expectStrictResult("100/2/5", 10);
    expectStrictResult("(2+3)*(4+5)", 45);
    expectStrictResult("2^(1+1)", 4);
    expectStrictResult("10/(2+3)", 2);
    expectStrictResult("3+4*2/2", 7);
    expectStrictResult("(3+4)*(2+1)", 21);
    expectStrictResult("2^3^2", 512);
    expectStrictResult("2^(3^2)", 512);
    expectStrictResult("(2^3)^2", 64);
    expectStrictResult("10/4", 2.5);
    expectStrictResult("10/(2+3*2)", 1.25);
    expectStrictResult("3+4*(2+1)", 15);
    expectStrictResult("0.1+0.2", 0.3);
    expectStrictResult("1.5*2", 3);
    expectStrictResult("5.5-2.2", 3.3);
    expectStrictResult("4.4/2", 2.2);
    expectStrictResult("2.5^2", 6.25);
    expectStrictResult("1+2*3^2", 19);
    expectStrictResult("(1+2)*(3^2)", 27);
    expectStrictResult("((1+2)*3)^2", 81);
    expectStrictResult("2^(2^(1+1))", 16);
    expectStrictResult("10/(5-3)", 5);
    expectStrictResult("10/(2*(1+1))", 2.5);
    expectStrictResult("+5", 5);
    expectStrictResult("-5", -5);
    expectStrictResult("-5+5", 0);
    expectStrictResult("-(3+4)", -7);
    expectStrictResult("+(-3+4)", 1);
    expectStrictResult("-(-3+4)", -1);
    expectStrictResult("-(2^3)", -8);
    expectStrictResult("+2^3", 8);
    expectStrictResult("-(2^3^2)", -512);
    expectStrictResult("+2^3^2", 512);
    expectStrictResult("-(3+4*2)", -11);
    expectStrictResult("+3+4*2", 11);
    expectStrictResult("-(3+4)*(2+1)", -21);
    expectStrictResult("+(3+4)*(2+1)", 21);
    expectStrictResult("-((1+2)*3)^2", -81);
    expectStrictResult("+((1+2)*3)^2", 81);
    expectStrictResult("-(2^(2^(1+1)))", -16);
    expectStrictResult("+(2^(2^(1+1)))", 16);
    expectStrictResult("-10/(5-3)", -5);
    expectStrictResult("+10/(5-3)", 5);
    expectStrictResult("-(10/(2*(1+1)))", -2.5);
    expectStrictResult("+(10/(2*(1+1)))", 2.5);
    expectStrictResult("1/0", Infinity);
    expectStrictResult("-1/0", -Infinity);
});

describe("constructModel, valid external functions", () => {
    expectStrictResult("sqrt(16)", 4);
    expectStrictResult("abs(-4)", 4);
    expectStrictResult("abs(4)", 4);
    expectStrictResult("exp(1)", 2.71828182846);
    expectStrictResult("exp(4)", 54.5981500331);
    expectStrictResult("sign(-5)", -1);
    expectStrictResult("sign(5)", 1);
    expectStrictResult("sign(0)", 0);
    expectStrictResult("round(5.1)", 5);
    expectStrictResult("round(5.11, 1)", 5.1);
    expectStrictResult("round(5.111, 2)", 5.11);
    expectStrictResult("pi()", 3.141592653589793);
    
    expectApproxResult("cos(0)", 1);
    expectApproxResult("sin(0)", 0);
    expectApproxResult("tan(0)", 0);

    expectApproxResult("ln(exp(1))", 1.0);
    expectApproxResult("exp(ln(1))", 1.0);
    expectApproxResult("log(exp(1))", 1.0);
    expectApproxResult("exp(log(1))", 1.0);
});

describe("constructModel, with lookup", () => {
    const lookup = (ref: string): tf.Tensor => {
        const val = {
            x: 10,
            y: 100,
            z: -5,
            a: -10,
        }[ref];
        return tf.tensor(val ?? lookupError(ref));
    };

    expectStrictResult("x+y+z", 105, lookup);
    expectStrictResult("x*y+z", 995, lookup);
    expectStrictResult("pow(x, 2) - y + -z", 5, lookup);
    expectStrictResult("a^3", -1000, lookup);
});

describe("constructModel, expects NaN", () => {
    const expectNaN = (formula: string, lookup: Lookup = neverLookup) => {
        const model = evalAndExpectOk(formula);
        const tensor = model(lookup);

        const actual = tensor.dataSync();

        assert.deepEqual(
            actual.length,
            1,
            `Formula: "${formula}", evaluates to buffer of length ${actual.length} but expected 1 (NaN)`,
        );

        assert.deepEqual(
            isNaN(actual[0]),
            true,
            `Formula: "${formula}", evaluates to ${actual} but expected NaN`,
        );
    };

    expectNaN("sqrt(-1)");
});

describe("constructModel, evaluation should fail", () => {
    const expectEvalErr = (formula: string) => {
        const result = constructTfModel(formula);
        assert.ok(
            result.isErr(),
            `Expected construction of model for '${formula}' to be an error, got ${resultToString(
                result,
            )}`,
        );
    };

    expectEvalErr("foo(16)");
    expectEvalErr("SQRT(16)");
    expectEvalErr("sqrt(16, 15)");
});
