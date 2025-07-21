import {
    recordMap,
    arraysEqual,
    arraysEqualPredicate,
    recordsEqualPredicate,
} from "../core/utils.ts";

export type AddNode = { kind: "AddNode" };
export type SubNode = { kind: "SubNode" };
export type MulNode = { kind: "MulNode" };
export type DivNode = { kind: "DivNode" };
export type PowIntNode = { kind: "PowIntNode"; exponent: number };
export type PowRealNode = { kind: "PowRealNode" };
export type NegNode = { kind: "NegNode" };
export type RefNode = { kind: "RefNode"; ref: string };
export type FunctionNode = { kind: "FunctionNode"; name: string };
export type NumberNode = { kind: "NumberNode"; value: number };
export type ASGNode =
    | AddNode
    | SubNode
    | MulNode
    | DivNode
    | NegNode
    | PowIntNode
    | PowRealNode
    | RefNode
    | FunctionNode
    | NumberNode;

export const Node = Object.freeze({
    Add(): AddNode {
        return { kind: "AddNode" };
    },
    Sub(): SubNode {
        return { kind: "SubNode" };
    },
    Mul(): MulNode {
        return { kind: "MulNode" };
    },
    Div(): DivNode {
        return { kind: "DivNode" };
    },
    Neg(): NegNode {
        return { kind: "NegNode" };
    },
    PowInt(exponent: number): PowIntNode {
        return { kind: "PowIntNode", exponent };
    },
    PowReal(): PowRealNode {
        return { kind: "PowRealNode" };
    },
    Ref(ref: string): RefNode {
        return { kind: "RefNode", ref };
    },
    Function(name: string): FunctionNode {
        return { kind: "FunctionNode", name };
    },
    Number(value: number): NumberNode {
        return { kind: "NumberNode", value };
    },
});

export type ASGRecord = {
    children: number[][];
    references: Record<string, number[]>;
    nodes: ASGNode[];
};

// Abstract Semantic Graph
// Models a bidicalc expression as an directed acyclic graph where
// nodes can be shared, i.e. have multiple parents
export class ASG {
    private _kind = "ASG";
    public constructor(
        public readonly children: number[][],
        public readonly references: Record<string, number[]>,
        public readonly nodes: ASGNode[],
    ) {}

    static fromRecord(rec: ASGRecord): ASG {
        return new ASG(rec.children, rec.references, rec.nodes);
    }

    public clone(): ASG {
        return new ASG(
            structuredClone(this.children),
            structuredClone(this.references),
            structuredClone(this.nodes),
        );
    }

    public equals(other: ASG): boolean {
        return (
            arraysEqualPredicate(this.children, other.children, arraysEqual) &&
            recordsEqualPredicate(this.references, other.references, arraysEqual) &&
            arraysEqual(this.nodes, other.nodes)
        );
    }
}

// Shift adjencency list by N
export function shiftChildren(N: number, children: number[][]): number[][] {
    return children.map((c) => c.map((k) => k + N));
}

// Shift references record by N
export function shiftReferences(N: number, record: Record<any, number[]>): Record<number, any> {
    return Object.fromEntries(Object.entries(record).map(([k, v]) => [k, v.map((ref) => ref + N)]));
}

// Shift references record by N, only for references that are above a threshold T
export function shiftReferencesAbove(
    N: number,
    T: number,
    record: Record<any, number[]>,
): Record<number, any> {
    return Object.fromEntries(
        Object.entries(record).map(([k, v]) => [k, v.map((ref) => (ref < T ? ref : ref + N))]),
    );
}

// Merge an array of reference records, without removing duplicates
export function mergeReferences(
    records: Array<Record<string, number[]>>,
): Record<string, number[]> {
    const result: Record<string, number[]> = {};

    for (const rec of records) {
        for (const key in rec) {
            if (result[key]) {
                result[key] = result[key].concat(rec[key]);
            } else {
                result[key] = [...rec[key]];
            }
        }
    }
    return result;
}

// Remove a node from a children list, repointing any parent to a replacement
// children: input adjacency list
// idToRemove: id of the node to remove
// replacement: id to redirect any parent to
// shift: amount to shift the right half by
export function removeNodefromChildren(
    children: number[][],
    idToRemove: number,
    replacement: number,
    shift: number,
) {
    const out: number[][] = [];

    const filter = (chs: number[]) =>
        chs.map((c) => {
            if (c === idToRemove) return replacement;
            else if (c < idToRemove) return c;
            else return c - 1 + shift;
        });

    for (const [id, chs] of children.entries()) {
        if (id !== idToRemove) {
            out.push(filter(chs));
        }
    }
    return out;
}

export function removeNodefromReferences(
    references: Record<string, number[]>,
    idToRemove: number,
): Record<string, number[]> {
    return recordMap(references, (ref, childs) => {
        return childs.filter((c) => c !== idToRemove).map((c) => (c < idToRemove ? c : c - 1));
    });
}

// Find a duplicated reference to remove
export function nextDuplicate(references: Record<string, number[]>): [number, number] | null {
    for (const [ref, childs] of Object.entries(references)) {
        const main = childs[0];
        if (childs.length > 1) {
            return [childs[1], main];
        }
    }
    return null;
}

export function mergeDuplicateReferences(ast: ASG): ASG {
    let newChildren = ast.children;
    let newNodes = ast.nodes;
    let newReferences = ast.references;

    let next: [number, number] | null = null;

    while ((next = nextDuplicate(newReferences)) !== null) {
        const [toReplace, replacement] = next;

        newChildren = removeNodefromChildren(newChildren, toReplace, replacement, 0);
        newNodes = newNodes.slice();
        newNodes.splice(toReplace, 1);
        newReferences = removeNodefromReferences(newReferences, toReplace);
    }

    return ASG.fromRecord({
        children: newChildren,
        references: newReferences,
        nodes: newNodes,
    });
}

// Compose ast with a reference binding
// Assumes there are no duplicated references in the ast
export function composeASG(ast: ASG, refName: string, bind: ASG): ASG {
    if (!(refName in ast.references)) {
        throw `composeASG: missing ref ${refName}`;
    }

    if (ast.references[refName].length != 1) {
        throw Error(
            `composeASG: expected 1 instance of ref ${refName}, got ${ast.references[refName].length}`,
        );
    }

    const [N1, N2] = [ast.nodes.length, bind.nodes.length];
    const originalRefId = ast.references[refName][0];
    const bindRootId = originalRefId + N2 - 1;

    // Nodes: insert the bound ast at the reference node
    const newNodes = ast.nodes.slice();
    newNodes.splice(originalRefId, 1, ...bind.nodes);

    // References: Remove target reference, insert new ones
    let originalReferencesWithoutBind = structuredClone(ast.references);
    delete originalReferencesWithoutBind[refName];
    // shift originalReferences by 0 if < originalRefId, N2 if > originalrefid
    // shift bind.references by originalRefId
    // if they have refs in common, they are actually separate at this step, and will get merged after
    const shiftedOriginalRefs = shiftReferencesAbove(
        N2 - 1,
        originalRefId,
        originalReferencesWithoutBind,
    );
    const shiftedBindRefs = shiftReferences(originalRefId, bind.references);
    const newReferences = mergeReferences([shiftedOriginalRefs, shiftedBindRefs]);

    // Children: remove bound reference and insert bound children links
    let newChildren = removeNodefromChildren(ast.children, originalRefId, bindRootId, N2);
    newChildren.splice(originalRefId, 0, ...shiftChildren(originalRefId, bind.children));

    return mergeDuplicateReferences(
        ASG.fromRecord({
            children: newChildren,
            references: newReferences,
            nodes: newNodes,
        }),
    );
}

// Chained composition: bind multiple references in order and iteratively
export function composeASGList(ast: ASG, binds: [string, ASG][]): ASG {
    let working = ast;
    for (const [ref, bind] of binds) {
        working = composeASG(working, ref, bind).clone(); // TODO remove clone
    }
    return working;
}
