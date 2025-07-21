/*
How to derive a contractor

1. Derive subsolvers for each variable
2. Write equation 4.15 from jaulin2001
3. Simplify the computed union algorithm
*/

// thoughts on how to test contractors more:
// - test union contractor equation with sampling?
// - implement the forward subsolver to check?

import { describe, it } from "node:test";
import assert from "node:assert";

import * as nsf from "not-so-float";

import {
    UnaryLinker,
    BinaryLinker,
    linkers,
} from "../contractors.ts";

describe("contractors yield empty with empty inputs", () => {
    const expectEmptyUnary = (L: UnaryLinker) => {
        const [C0, C1] = L.contractors;
        assert.deepStrictEqual(nsf.EMPTY, C0(nsf.EMPTY));
        assert.deepStrictEqual(nsf.EMPTY, C1(nsf.EMPTY));
    };

    const expectEmptyBinary = (L: BinaryLinker) => {
        const [C0, C1, C2] = L.contractors;
        const emptyWithOther = (other: nsf.Union) => {
            assert.deepStrictEqual(nsf.EMPTY, C0(nsf.EMPTY, other));
            assert.deepStrictEqual(nsf.EMPTY, C0(other, nsf.EMPTY));
            assert.deepStrictEqual(nsf.EMPTY, C1(nsf.EMPTY, other));
            assert.deepStrictEqual(nsf.EMPTY, C1(other, nsf.EMPTY));
            assert.deepStrictEqual(nsf.EMPTY, C2(nsf.EMPTY, other));
            assert.deepStrictEqual(nsf.EMPTY, C2(other, nsf.EMPTY));
        };

        emptyWithOther(nsf.single(1, 1));
        emptyWithOther(nsf.single(-1, -1));
        emptyWithOther(nsf.single(0, 0));
        emptyWithOther(nsf.single(0, 1));
        emptyWithOther(nsf.single(-1, 0));
        emptyWithOther(nsf.single(-1, 1));
        emptyWithOther(nsf.FULL);
        emptyWithOther(nsf.EMPTY);
    };

    it("ladd", () => {
        expectEmptyBinary(linkers.ladd);
    });

    it("lsub", () => {
        expectEmptyBinary(linkers.lsub);
    });

    it("lmul", () => {
        expectEmptyBinary(linkers.lmul);
    });

    it("ldiv", () => {
        expectEmptyBinary(linkers.ldiv);
    });

    it("lneg", () => {
        expectEmptyUnary(linkers.lneg);
    });

    it("lpowInt", () => {
        expectEmptyUnary(linkers.lpowInt(0));
        expectEmptyUnary(linkers.lpowInt(1));
        expectEmptyUnary(linkers.lpowInt(2));
        expectEmptyUnary(linkers.lpowInt(3));
        expectEmptyUnary(linkers.lpowInt(4));
        expectEmptyUnary(linkers.lpowInt(-1));
        expectEmptyUnary(linkers.lpowInt(-2));
        expectEmptyUnary(linkers.lpowInt(-3));
        expectEmptyUnary(linkers.lpowInt(-4));
    });

    it("lpowReal", () => {
        expectEmptyBinary(linkers.lpowReal);
    });

    it("lsqrt", () => {
        expectEmptyUnary(linkers.lsqrt);
    });

    it("llog / lexp", () => {
        expectEmptyUnary(linkers.llog);
        expectEmptyUnary(linkers.lexp);
    });

    it("abs", () => {
        expectEmptyUnary(linkers.labs);
    });

    it("cos", () => {
        expectEmptyUnary(linkers.lcos);
    });

    it("sin", () => {
        expectEmptyUnary(linkers.lsin);
    });

    it("tan", () => {
        expectEmptyUnary(linkers.ltan);
    });
});
