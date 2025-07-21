import { describe, it } from "node:test";
import assert from "node:assert";

import * as nsf from "not-so-float";

import { expect, defaultDomain, zero, one } from "./cspSolverTestCommon.ts";
import { cspDefaultDomain } from "../../dnsolver/tests/dnSolverTestCommon.ts";

describe("csp debug", () => {
    // const du = nsf.union([cspDefaultDomain]);
    // const du = nsf.single(-1000, 1000);

    // it's because of globalDomain constraining the right most sum

    // expect("a+b+c+d", 400, 30, { a: du, b: du, c: du, d: du }, { a: du, b: du, c: du, d: du }, true);
    // expect(
    //     "x^3 + y^3 + z^3",
    //     -1000,
    //     10,
    //     {
    //         x: defaultDomain,
    //         y: defaultDomain,
    //         z: defaultDomain,
    //     },
    //     {
    //         x: nsf.EMPTY,
    //         y: nsf.EMPTY,
    //         z: nsf.EMPTY,
    //     },
    //     true,
    // );

    // dependence problem
    // actually works, but contracts very slowly
    // expect("2*x + x ", 10, 3, { x: defaultDomain }, { x: nsf.single(1, 1) }, true);

    // this works, but contraction convergence is slow (needs about 60 contraction loops)
    // expect("3*x + 2*x", 10, 3, { x: defaultDomain }, { x: nsf.single(1, 3) });

    // no contraction at all?
    // expect("4*x + 3*x + 2*x + x", 10, 3, { x: defaultDomain }, { x: nsf.single(0.5, 1.5) }, true);

    // expect("x^2 + x", 0, 5, { x: defaultDomain }, { x: nsf.single(1, 1) }, true);

    //     const dom = {
    //         x: nsf.single(1695.911224876269, 1695.9112248762692),
    //         y: nsf.single(1626.8297549399122, 1626.8297549399124),
    //         z: nsf.single(164.458771586258, 164.45877158625802),
    //     };
    //    (1695.9112248762692-1000)^3 + (1626.8297549399124-1000)^3 + (164.45877158625802-1000)^3
    //     expect("(x-1000)^3 + (y-1000)^3 + (z-1000)^3", 10, 3, dom, {
    //         x: nsf.EMPTY,
    //         y: nsf.EMPTY,
    //         z: nsf.EMPTY,
    //     }, true);

    // expect(
    //     "x^3 + y^3 + z^3",
    //     10,
    //     3,
    //     { x: defaultDomain, y: defaultDomain, z: defaultDomain },
    //     { x: nsf.single(-1, 1), y: nsf.single(-1, 1), z: nsf.single(-1, 1) },
    //     true,
    // );
});
