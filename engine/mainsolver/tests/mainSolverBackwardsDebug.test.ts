import { describe, it } from "node:test";
import assert from "node:assert";

import { TurboCallback } from "../mainSolverBackwards.ts";
import { IntervalDomain } from "../../core/intervalDomain.ts";
import { UnionDomain } from "../../core/unionDomain.ts";
import { DNResult } from "../../dnsolver/dnSolver.ts";
import { BidiError } from "../../core/errors.ts";
import { Result, ok, err } from "neverthrow";

import { expectSolve, expectExactSolve } from "./mainSolverBackwardsCommonTesting.ts";

function stackToString(idstack: IntervalDomain[]) {
    let str = "";
    for (const id of idstack) {
        for (const [ref, inter] of id.intervals.entries()) {
            str += `${ref}: ${inter.toString()} `;
        }
        str += "\n";
    }
    return str;
}

const debug: TurboCallback = {
    loopStart: (loc: string, idstack: IntervalDomain[], splits: number) => {
        console.log();
        console.log(loc, splits);
        console.log(stackToString(idstack));
    },
    step1: (loc: string, candidate: IntervalDomain) => {
        console.log(loc, candidate.intervals);
    },
    step2: (loc: string, domain: UnionDomain) => {
        console.log(loc);
        console.dir(domain, { depth: null });
    },
    step3: (loc: string, dnresult: DNResult) => {
        console.log(loc);
        console.log(dnresult);
    },
    step4: (loc: string, verifiedResult: Result<number, BidiError>, goal: number) => {
        console.log(loc);
        console.log(verifiedResult);
    },
    step5: (loc: string, ref: string) => {
        console.log(loc);
    },
    loopEnd: (loc: string, splits: number) => {
        console.log(loc, splits);
    },
    return: (loc: string, ret: null | Record<string, number>) => {
        console.log(loc, ret);
        console.log();
    },
};

describe("debug", () => {

    // dnsolver struggles so close to 0: maybe a float32 issue? not sure
    // expectSolve("ln(x)", [-100], debug);

    // fails
    // expectExactSolve("x", 0.1, { x: 0.1 }, debug);
    
    // work in progress
    // expectExactSolve("a*b*c*d", 16, { a: 2, b: 2, c: 2, d: 2 }, debug);

    // prioritize variables equal when possible
    // prioritize close to the midpoint
    // kinda just undoing the overflow csp contraction

    // choosing origin (an endpoint of the interval) means that splitting doesnt
    // change the init point, which is a problem if the init point has zero gradient

    // what about midpoint, but equalized?
    // if mean/median(midpoint) is in domain, use it

    // csp: keep finite domain for refs: easy to split
    //      but infinite domain for nodes

    // overflow csp contraction shouldn't happen, it's an artifact

    // could change main algo:
    // start with dn from origin as a first step

    // how to maintain symmetry:
    // symmetric splits?
    // expectSolve("x^3 + y^3 + z^3", [10], debug);
});
