import { describe, it } from "node:test";
import assert from "node:assert";

import { ASG, ASGRecord, Node } from "../asg.ts";
import { constructASG } from "../semanticsASG.ts";

export function assertASGEqual(actual: ASG, expected: ASGRecord, contextExpr: string) {
    assert.deepStrictEqual(
        actual.children,
        expected.children,
        `children don't match expected ASG children (context: '${contextExpr}')`,
    );
    assert.deepStrictEqual(
        actual.references,
        expected.references,
        `references don't match expected ASG references (context: '${contextExpr}')`,
    );
    assert.deepStrictEqual(
        actual.nodes,
        expected.nodes,
        `nodes don't match expected ASG nodes (context: '${contextExpr}')`,
    );
}

// Construct an ASG, throw an exception if invalid
// Only to be used in testing
export function constructASGExpectValid(expr: string): ASG {
    const result = constructASG(expr);
    if (result.isErr()) throw Error(`Cannot construct ASG for expression '${expr}'`);
    return result.value;
}
