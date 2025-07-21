import { describe, it } from "node:test";
import assert from "node:assert";

import { expectSolve, expectNoSolve, cspDefaultDomain } from "./dnSolverTestCommon";

import * as nsf from "not-so-float";

describe("dnSolver debug", () => {
    // expectSolve(
    //     "a+b+c+d - 400",
    //     { a: cspDefaultDomain, b: cspDefaultDomain, c: cspDefaultDomain, d: cspDefaultDomain },
    //     10,
    //     0.001,
    //     true
    // );

    // expectSolve(
    //     "x^3 + y^3 + z^3 - 10",
    //     { x: nsf.interval(0, 1e10), y: cspDefaultDomain, z: cspDefaultDomain },
    //     10,
    //     0.001,
    //     true,
    // );

   
});
