import { describe, it } from "node:test";
import assert from "node:assert";

import "@tensorflow/tfjs-backend-cpu";

import {
    expectSolve,
    expectExactSolve,
    expectNoSolve,
} from "./mainSolverBackwardsCommonTesting.ts";

describe("mainSolverBackwards expect solve", () => {
    it("one variable, algebraic", () => {
        expectSolve("x", [-1e5, -1, 0, 1, 1e5]);
        expectSolve("(x+1)^2 - 1", [-1, 0, 1, 2, 10, 100]);
        expectSolve("x^2", [0, 1, 10, 100, 1e5]);
        expectSolve("2*x + 3", [-100, -1, 0, 1, 100]);
        expectSolve("x^3", [-1000, -1, 0, 1, 1000]);
        expectSolve("x^2 - 2*x + 1", [0, 1, 4, 9, 16]);
        expectSolve("1/x", [-100, -1, 1, 100]);
        expectSolve("x^4 - x^2", [0, 1, 2, 4, 16]);
        expectSolve("x^3 - 3*x", [-2, -1, 0, 1, 2]);
        expectSolve("x + 5", [-10, -5, 0, 5, 10]);
        expectSolve("x - 7", [-10, -5, 0, 5, 10]);
        expectSolve("3*x - 4", [-10, -5, 0, 5, 10]);
        expectSolve("x/2", [-10, -5, 0, 5, 10]);
        expectSolve("x^2 - 4", [-3, -2, -1, 0, 1, 2, 3]);
        expectSolve("x^2 + x", [-0.25, -0.2, 0, 1, 2, 3]);
        expectSolve("2*x^2 + 3*x + 1", [-0.125, -0.1, 0, 1, 2, 3]);
        expectSolve("x^2 + 2*x + 1", [0, 1]);
        expectSolve("x^3 - 2*x + 2", [-100, -10, 0, 1, 10, 100]);
        expectSolve("-x^3 + 2*x - 2", [-100, -10, 0, 1, 10, 100]);

        expectSolve("(x^2 - 4)^2 + (x+2)^2", [0, 1, 2, 10, 100, 10000]);

        // Variable reuse
        expectSolve("x + x - x - x + x + x + x", [-1000, -50, 0, 50, 150, 3000]);
        expectSolve("2*x + x", [-100, 3, 50]);
        expectSolve("4*x + 3*x + 2*x + x", [-10, 0, 10]);
        expectSolve("4*x + 3*x - 2*x + x", [-10, 0, 10]);

        // Real exponentiation
        expectSolve("2^x", [0.01, 0.1, 1, 10, 100, 1000]);
        expectSolve("x^(1/3)", [1, 2, 3, 10, 1000]);

        // Real exponentiation to zero
        expectSolve("x^(0.0)", [1]);
        expectSolve("x^(1.0)", [1]);
        expectSolve("x^(1.0)", [0]);

        // Real exponentiation: special cases for the value of the base
        expectSolve("1^x", [1]);
        expectSolve("0^x", [0]);
        expectSolve("0^x", [1]);

        // Note this one is special, because F is not differentiable at the solution
        // However it works here because the CSP solver can solve it by itself
        expectSolve("x^(1/2)", [0]);
        expectSolve("x^(1/3)", [0]);
        expectSolve("x^(1/4)", [0]);

        expectSolve("1 + 1/x", [-10, -1, 0, 2, 10]);

        expectSolve("x+1/x", [2, 10]);
        expectSolve("x^2", [0, 1, 100, 1000]);

        // Double root
        expectSolve("(x-2)^2", [0]);
    });

    it("multiple variables, algebraic", () => {
        // works but solution has x=0 always because gradient is partially zero
        expectSolve("x^2 + 50*y", [-1000, 10, 0, 1000]);
        expectSolve("y^2 - 50*x", [-1000, 10, 0, 1000]);

        expectSolve("x+y+z", [-10, 0, 10, 10000]);

        expectSolve("x*y+y*z+z+x+1/a", [-10, 0, 10, 10000]);

        expectSolve("a*b", [-10, -1, 0, 1, 10]);

        expectSolve("(xy)^2", [0, 0.1, 10]);

        expectSolve("x^2 + y^2", [0, 1, 10, 1000]);
        expectSolve("x^2 + y^2 + z^2", [0, 1, 10, 1000]);
        expectSolve("x^3 + y^3 + z^3", [-1000, 10, 0, 1, 10, 1000]);

        expectSolve("1/x^2 + 1/y^2 + 1/z^2", [10, 1000, 10000]);

        expectSolve("(x-100)^3 + (y-100)^3 + (z-100)^3", [-1000, 10, 0, 1, 10, 1000]);

        // Difficult because float32 gradient saturates
        // expectSolve("(x-1000)^3 + (y-1000)^3 + (z-1000)^3", [-1000, 10, 0, 1, 10, 1000]);

        const poly33 =
            "276.727+4.170*z-1.758*z^2-1.938*z^3+1.975*y+2.970*y*z-0.303*y*z^2+3.983*y^2-2.737*y^2*z+3.643*y^3+3.445*x+1.277*x*z-4.573*x*z^2-1.880*x*y+1.048*x*y*z+1.951*x*y^2+4.771*x^2-3.120*x^2*z+4.738*x^2*y-3.936*x^3";
        expectSolve(poly33, [0]);
    });
});

describe("mainSolverBackwards, expect no solution", () => {
    it("one variable, no solution", () => {
        expectNoSolve("x^2 + 1", [0]);
        expectNoSolve("x^2 + 2*x + 1", [-3, -2, -1]);

        // TODO add expectSolveInFewerThanNSplits()

        expectNoSolve("x^(0.0)", [0]);

        // Solution is outside the support range until we can improve it with float64 support
        expectNoSolve("x^(1/3)", [10000]);
    });
});

// For solves that can have multiple solutions
// sometimes we want a specific one, this is what we test here
describe("mainSolverBackwards expect exact solve", () => {
    it("sum of n variables", () => {
        expectExactSolve("a+b", 200, { a: 100, b: 100 });
        expectExactSolve("a+b+c", 300, { a: 100, b: 100, c: 100 });
        expectExactSolve("a+b+c+d", 400, { a: 100, b: 100, c: 100, d: 100 });
    });
});

describe("mainSolverBackwards external functions", () => {
    expectSolve("x - pi()", [0]);
    expectSolve("x - sqrt(2)", [0]);
    expectSolve("sqrt(x)", [2]);
    expectSolve("sqrt(x + y)", [2]);
    expectSolve("ln(x)", [-10, -1, 0, 1, 10]);
    expectSolve("exp(x)", [0.001, 0.01, 1.0, 10, 100, 1000]);
    expectSolve("abs(x)", [0, 1, 100]);
    expectSolve("pow(x, 2)", [0, 1, 2, 3]);
    expectSolve("pow(2, x)", [1, 2, 3, 4]);
});

/*

TODO NEW TEST CASES:

easy solution but grad zero at initial value:
cos(x) = 0 starting at x = pi()

basic newton diverges:
x/sqrt(1 + x^2)
arctan(x)
https://en.wikipedia.org/wiki/Newton%27s_method#Convergence_dependent_on_initialization

https://computingskillset.com/solving-equations/highly-instructive-examples-for-the-newton-raphson-method/#example-5-newtons-method-running-away-into-an-asymptotic-region-of-the-function

page 14 of this paper has many good test cases:
https://www.ime.usp.br/~montanhe/unions.pdf

*/
