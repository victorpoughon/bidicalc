import { describe, it } from "node:test";
import assert from "node:assert";

import { constructASG } from "../../asg/semanticsASG.ts";

import { contractorLoop, intervalCounts, widthPairs } from "../cspSolver.ts";
import { initCFs } from "../contractorFunctions.ts";
import { UnionDomain } from "../../core/unionDomain.ts";

import * as nsf from "not-so-float";

import { solverSettings } from "../../mainsolver/solverSettings.ts";

export function expect(
    expr: string,
    goal: number,
    N: number, // TODO rename to expectedIterations and add assert
    init: Record<string, nsf.Union>,
    expected: Record<string, nsf.Union>,
    debug: boolean = false,
) {
    const initialDomain = UnionDomain.fromRecord(init);
    const expectedDomain = UnionDomain.fromRecord(expected);

    // Construct ASG
    const astResult = constructASG(expr);
    assert.ok(astResult.isOk(), "construct ASG failed");
    if (astResult.isErr()) return;
    const ast = astResult.value;

    // Init contractors from ASG
    const contractorsResult = astResult.andThen(initCFs);
    assert.ok(contractorsResult.isOk(), "init CFs failed");
    if (contractorsResult.isErr()) return;
    const contractors = contractorsResult.value;

    if (debug) {
        console.log(`> ${expr} = ${goal}`);
        console.dir(ast, { depth: null });
        console.log();
    }

    // Check that initial domains and expected domains contains all references
    assert.deepEqual(
        initialDomain.keys().toSorted(),
        Object.keys(ast.references).toSorted(),
        "initial domain references don't match expression references",
    );
    assert.deepEqual(
        expectedDomain.keys().toSorted(),
        Object.keys(ast.references).toSorted(),
        "expected domain references don't match expression references",
    );

    const callback = (iter: number, oldDomains: nsf.Union[], newDomains: nsf.Union[]) => {
        console.log(`>>> CSP iteration ${iter}`);
        console.log("Interval counts:", JSON.stringify(intervalCounts(newDomains)));
        console.log("Width pairs:", widthPairs(oldDomains, newDomains));
        console.log();
        console.log("Domains:");
        newDomains.forEach((dom, i) => console.log(ast.nodes[i].kind, dom.toString()));
        console.log();

        console.log();
    };

    // Run forward backwards constraint propagation (contract loop)
    const newDomain = contractorLoop(
        ast,
        contractors,
        goal,
        initialDomain,
        solverSettings.csp.globalDomain,
        solverSettings.csp.halt,
        debug ? callback : () => {},
    );

    // Check that resulting domains for references are subsets of the expected domains
    for (const [refName, expected] of expectedDomain.entries()) {
        const refId = ast.references[refName][0];
        const actualRefDomain = newDomain.get(refName);

        assert.ok(
            expected.superset(actualRefDomain),
            `After contracting ${expr} = ${goal}, domain of ${refName}: ${actualRefDomain.toString()} not a subset of expected: ${expected.toString()}`,
        );

        if (actualRefDomain.isEmpty()) {
            assert.ok(
                expected.isEmpty(),
                `After contracting ${expr} = ${goal}, domain of ${refName} contracted to empty, but expected non-empty`,
            );
        }
    }
}

export const sqrt = Math.sqrt;
export const defaultDomain = nsf.union([solverSettings.csp.globalDomain]);

export function approx10(x: number): nsf.Union {
    return nsf.mul(nsf.single(0.9, 1.1), nsf.single(x));
}

export function plusorminus(u: nsf.Union): nsf.Union {
    return nsf.union([u, nsf.neg(u)]);
}

export const zero = nsf.single(0, 0);
export const one = nsf.single(1, 1);
