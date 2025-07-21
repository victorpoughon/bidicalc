import { describe, it } from "node:test";
import assert from "node:assert";

import { expectSolve, expectNoSolve, cspDefaultDomain } from "./dnSolverTestCommon";

import * as nsf from "not-so-float";

describe("staticDN, perfect solve", () => {
    // Perfect solve: f(x) = 0 exactly
    expectSolve("x", { x: nsf.interval(-100, 100) }, 1, 0);
    expectSolve("x-y", { x: nsf.interval(-100, 100), y: nsf.interval(-100, 100) }, 1, 0);
    expectSolve("x-y", { x: nsf.interval(0, 0), y: nsf.interval(0, 100) }, 1, 0);

    expectSolve("x-y", { x: nsf.interval(-100, 100), y: nsf.interval(-100, 100) }, 1, 0);

    expectSolve(
        "x+y+z+a+b+c",
        {
            x: nsf.interval(-100, 100),
            y: nsf.interval(-100, 100),
            z: nsf.interval(-100, 100),
            a: nsf.interval(-100, 100),
            b: nsf.interval(-100, 100),
            c: nsf.interval(-100, 100),
        },
        1,
        0,
    );

    expectSolve(
        "a+b+c+d+e+f+g+h+i+j-10000",
        {
            a: nsf.interval(-3000, 3000),
            b: nsf.interval(-3000, 3000),
            c: nsf.interval(-3000, 3000),
            d: nsf.interval(-3000, 3000),
            e: nsf.interval(-3000, 3000),
            f: nsf.interval(-3000, 3000),
            g: nsf.interval(-3000, 3000),
            h: nsf.interval(-3000, 3000),
            i: nsf.interval(-3000, 3000),
            j: nsf.interval(-3000, 3000),
        },
        1,
        0,
    );
});

describe("staticDN, single variable", () => {
    // Simple cases, good convergence
    expectSolve("x^2 - 49", { x: nsf.interval(0, 100) }, 10, 1e-6);
    expectSolve("x^2 - 10", { x: nsf.interval(0, 10) }, 10, 1e-6);
    expectSolve("x^2 - 1", { x: nsf.interval(0, 10) }, 10, 1e-6);
    expectSolve("x^4 - 1", { x: nsf.interval(0, 10) }, 10, 1e-6);
    expectSolve("x^2 - x - 1", { x: nsf.interval(-5, 10) }, 10, 1e-6);
    expectSolve("1/(exp(-x) + 1) - 0.5", { x: nsf.interval(-5, 10) }, 10, 1e-6);
    expectSolve("exp(x) - 1", { x: nsf.interval(-5, 10) }, 10, 1e-6);
    expectSolve("exp(x) - 1", { x: nsf.interval(-5, 10) }, 10, 1e-6);
    expectSolve("1/(x+1)+1", { x: nsf.interval(-4, -1) }, 10, 1e-6);
    expectSolve(
        "x^2 + y^2 + z^2 - 1",
        { x: nsf.interval(-5, 10), y: nsf.interval(-5, 10), z: nsf.interval(-5, 10) },
        10,
        1e-6,
    );
    expectSolve("cos(x)", { x: nsf.interval(Math.PI / 3, (2 * Math.PI) / 3) }, 10, 1e-6);
    expectSolve("sin(x)", { x: nsf.interval(-Math.PI / 3, Math.PI / 3) }, 10, 1e-6);
    expectSolve("x-10^10", { x: nsf.interval(0, 2 * 1e10) }, 20, 1e6);

    // Difficult cases: zero gradient at the solution
    expectSolve("x^2", { x: nsf.interval(-1, 2) }, 10, 1e-6);
    expectSolve("x^4", { x: nsf.interval(-1, 2) }, 10, 1e-6);

    // Difficult cases: convergence depends on initialization
    expectSolve("x^3 - 2*x + 2", { x: nsf.interval(-20, 10) }, 10, 1e-1);
});

describe("staticDN, multiple variables", () => {
    expectSolve(
        "x^2 - 0.1*y^2 - 0.1*x - y - 1",
        { x: nsf.interval(-5, 10), y: nsf.interval(-5, 10) },
        5,
        1e-6,
    );

    const poly35 =
        "100.108+0.334*b-1.345*b^2+1.180*b^3-4.095*a+0.850*a*b-1.869*a*b^2+2.749*a^2+0.564*a^2*b-2.974*a^3-3.737*z-0.394*z*b-1.418*z*b^2-0.542*z*a-4.052*z*a*b-0.105*z*a^2+3.819*z^2+0.637*z^2*b-4.398*z^2*a+2.855*z^3-2.613*y-4.006*y*b+2.091*y*b^2+0.755*y*a+1.987*y*a*b-2.476*y*a^2+2.237*y*z+4.237*y*z*b+1.746*y*z*a-1.339*y*z^2-0.405*y^2-4.339*y^2*b+2.907*y^2*a-0.448*y^2*z-0.385*y^3+4.187*x-4.282*x*b+3.400*x*b^2+3.295*x*a+4.871*x*a*b-2.487*x*a^2-1.371*x*z-1.155*x*z*b-4.699*x*z*a-1.974*x*z^2-4.902*x*y-4.752*x*y*b-0.625*x*y*a+3.190*x*y*z+2.776*x*y^2+3.013*x^2-4.696*x^2*b-4.922*x^2*a-4.901*x^2*z+2.008*x^2*y+4.297*x^3";
    expectSolve(
        poly35,
        {
            x: nsf.interval(-5, 10),
            y: nsf.interval(-12, 10),
            z: nsf.interval(-12, 10),
            a: nsf.interval(-1, 1),
            b: nsf.interval(-1, 1),
        },
        15,
        1e-3,
    );
});

describe("staticDN, no convergence", () => {
    expectNoSolve("x^3 - 2*x + 2", { x: nsf.interval(-5, 10) }, 1e-1);
    expectNoSolve("x^3 - 2*x + 2", { x: nsf.interval(-5, 10) }, 1e-1);

    // Zero grad at the midpoint of the domain
    expectNoSolve("x^2 - 49", { x: nsf.interval(-100, 100) }, 1e-1);
    expectNoSolve("x^3 - 49", { x: nsf.interval(-100, 100) }, 1e-1);
    expectNoSolve("x^5 - 49", { x: nsf.interval(-100, 100) }, 1e-1);
    expectNoSolve("cos(x)", { x: nsf.interval(-100, 100) }, 1e-1);

    // Zero grad during iteration
    expectNoSolve("x^3 + 2", { x: nsf.interval(0, 2) }, 1e-1);
});

// To generate a random polynomial:
// console.log(randomPolynomial(3, 5));
