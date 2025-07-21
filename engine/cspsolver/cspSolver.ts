import * as nsf from "not-so-float";

import { ASG, ASGNode } from "../asg/asg.ts";
import { UnionDomain } from "../core/unionDomain.ts";
import { ContractorFunction } from "./contractorFunctions.ts";

import { match, P } from "ts-pattern";

// Compute contracted domains width pairs
export function widthPairs(oldDomains: nsf.Union[], newDomains: nsf.Union[]): [number, number][] {
    return Array.from(oldDomains.entries()).map(([i, _]) => {
        return [oldDomains[i].width(), newDomains[i].width()];
    });
}

// Compute domains interval counts
export function intervalCounts(domains: nsf.Union[]): number[] {
    return domains.map((union) => union.intervals.length);
}

export type CSPLoopHalt = (
    iter: number,
    oldDomains: nsf.Union[],
    newDomains: nsf.Union[],
) => boolean;

export type CSPLoopCallback = (
    iter: number,
    oldDomains: nsf.Union[],
    newDomains: nsf.Union[],
) => void;

// Perform one pass of all contractors on nodes domains
// Returns the new domains
export function innerLoop(
    ast: ASG,
    domains: nsf.Union[],
    contractFunctions: ContractorFunction[][],
): nsf.Union[] {
    const newDomains: nsf.Union[] = Array.from(domains);

    ast.nodes.forEach((node, nodeId) => {
        contractFunctions[nodeId].forEach(([targetId, contractionFunction]) => {
            const B = contractionFunction(newDomains);

            // Compute A inter B
            const oldA = newDomains[targetId];
            const newA = nsf.intersection(oldA, B);

            // TODO: I think we could shortcut here, if newA is empty, stop the
            // entire contractor loop and return all empty

            // Assign new domain
            newDomains[targetId] = newA;
        });
    });

    return newDomains;
}

export function contractorLoop(
    ast: ASG,
    contractors: ContractorFunction[][],
    goal: number,
    refsDomain: UnionDomain,
    globalDomain: nsf.Interval,
    halt: CSPLoopHalt,
    callback: CSPLoopCallback | null = null,
): UnionDomain {
    // Assign domain to every node
    const domains = ast.nodes.map((node) => {
        return match(node)
            .returnType<nsf.Union>()
            .with({ kind: "RefNode" }, (node) => refsDomain.get(node.ref))
            .with({ kind: "NumberNode" }, (node) => nsf.single(node.value))
            .otherwise(() => nsf.union([globalDomain]));
    });

    // Set root node to goal
    domains[ast.nodes.length - 1] = nsf.single(goal);

    let newDomains = structuredClone(domains);
    let run = true;
    let iter = 0;
    do {
        newDomains = innerLoop(ast, domains, contractors);
        iter += 1;

        if (callback) callback(iter, domains, newDomains);
        run = !halt(iter, domains, newDomains);

        // assign
        newDomains.forEach((newD, i) => {
            domains[i] = newD;
        });
    } while (run);

    // Return new domain for ref nodes
    return UnionDomain.fromRecord(
        Object.fromEntries(
            Object.entries(ast.references).map(([ref, ids]) => [ref, domains[ids[0]]]),
        ),
    );
}
