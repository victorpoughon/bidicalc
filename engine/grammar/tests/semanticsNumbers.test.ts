import { describe, it } from "node:test";
import assert from "node:assert";

import { ok } from "neverthrow";

import { parseNumber } from "../semanticsNumbers.ts";

function expectOk(formula: string, expected: number) {
    const parseResult = parseNumber(formula);
    const err = parseResult.match(
        () => "",
        (err) => err.message,
    );
    assert.ok(parseResult.isOk(), `Syntax error: ${formula}, ${err}`);
    assert.deepEqual(parseResult, ok(expected));
}

function expectErr(formula: string) {
    assert.ok(parseNumber(formula).isErr(), "Expected syntax error but got ok parse");
}

describe("parseNumber ok", () => {
    expectOk("0", 0);
    expectOk("+0", 0);
    expectOk("-0", 0);
    expectOk("50", 50);
    expectOk("-50", -50);
    expectOk("0.", 0);
    expectOk(".0", 0);
    expectOk("0.0", 0);
    expectOk("000.0000", 0);
    expectOk("0.5", 0.5);
    expectOk(".5", 0.5);
    expectOk("5.", 5);
    expectOk("    0", 0);
    expectOk("  +  0", 0);
    expectOk("1e0", 1);
    expectOk("1e1", 10);
    expectOk("1e-1", 0.1);
    expectOk("1e2", 100);
    expectOk("1e-2", 0.01);
    expectOk("1e5", 100000);
    expectOk("1e-5", 0.00001);
});

describe("parseNumber err", () => {
    expectErr("0+0");
    expectErr("ttt0");
    expectErr("5 5");
    expectErr("5 .5");
    expectErr("5+");
    expectErr("1+1");
    expectErr("NaN");
    expectErr("0x0");
    expectErr("-");
    expectErr("+");
    expectErr("");
    expectErr("++0");
    expectErr("--0");
    expectErr("-+0");
    expectErr("+-0");
});
