import * as nsf from "not-so-float";

import {
    ZeroaryLinker,
    UnaryLinker,
    BinaryLinker,
    linkers,
} from "./contractors.ts";

import { ASG, ASGNode } from "../asg/asg.ts";
import { bidiCalcExternalFunctionsRegistry } from "./externalFunctions.ts";

import { BidiError, UnknownFunction, ArityError } from "../core/errors.ts";

import { match, P } from "ts-pattern";
import { Result, ok, err } from "neverthrow";

export type ContractorFunction = [number, (domains: nsf.Union[]) => nsf.Union];

function zeroaryCF(L: ZeroaryLinker, y: number): ContractorFunction[] {
    const [C] = L.contractors;
    return [[y, (dom: nsf.Union[]) => C()]];
}

function unaryCF(L: UnaryLinker, y: number, x: number): ContractorFunction[] {
    const [CY, CX] = L.contractors;
    return [
        [y, (dom: nsf.Union[]) => CY(dom[x])],
        [x, (dom: nsf.Union[]) => CX(dom[y])],
    ];
}

function binaryCF(L: BinaryLinker, y: number, a: number, b: number): ContractorFunction[] {
    const [CY, CA, CB] = L.contractors;
    return [
        [y, (dom: nsf.Union[]) => CY(dom[a], dom[b])],
        [a, (dom: nsf.Union[]) => CA(dom[y], dom[b])],
        [b, (dom: nsf.Union[]) => CB(dom[y], dom[a])],
    ];
}

function functionCF(
    name: string,
    nodeId: number,
    childs: number[],
): Result<ContractorFunction[], BidiError> {
    // Verify function existence and correct arity
    const externalFunction = bidiCalcExternalFunctionsRegistry(name);
    if (externalFunction === null) {
        return err(new UnknownFunction(name));
    }
    const arity = childs.length;
    if (!externalFunction.checkArity(arity)) {
        return err(new ArityError(name, externalFunction.arityText, arity));
    }

    const ctors = match(externalFunction.linker)
        .with({ kind: "ZeroaryLinker" }, (linker) => zeroaryCF(linker, nodeId))
        .with({ kind: "UnaryLinker" }, (linker) => unaryCF(linker, nodeId, childs[0]))
        .with({ kind: "BinaryLinker" }, (linker) => binaryCF(linker, nodeId, childs[0], childs[1]))
        .exhaustive();

    return ok(ctors);
}

// Return the list of linkers that model an ASG node
function nodeToContractFunction(
    node: ASGNode,
    nodeId: number,
    childs: number[],
): Result<ContractorFunction[], BidiError> {
    return match(node)
        .with({ kind: "AddNode" }, () => ok(binaryCF(linkers.ladd, nodeId, childs[0], childs[1])))
        .with({ kind: "SubNode" }, () => ok(binaryCF(linkers.lsub, nodeId, childs[0], childs[1])))
        .with({ kind: "MulNode" }, () => ok(binaryCF(linkers.lmul, nodeId, childs[0], childs[1])))
        .with({ kind: "DivNode" }, () => ok(binaryCF(linkers.ldiv, nodeId, childs[0], childs[1])))
        .with({ kind: "NegNode" }, () => ok(unaryCF(linkers.lneg, nodeId, childs[0])))
        .with({ kind: "PowIntNode" }, (node) =>
            ok(unaryCF(linkers.lpowInt(node.exponent), nodeId, childs[0])),
        )
        .with({ kind: "PowRealNode" }, () => ok(binaryCF(linkers.lpowReal, nodeId, childs[0], childs[1])))
        .with({ kind: "RefNode" }, () => ok([]))
        .with({ kind: "FunctionNode" }, (node) => functionCF(node.name, nodeId, childs))
        .with({ kind: "NumberNode" }, () => ok([])) // handled by domain initialization
        .exhaustive();
}

// Initialize contraction functions for the ASG
export function initCFs(asg: ASG): Result<ContractorFunction[][], BidiError> {
    const results = asg.nodes.map((node, i) => nodeToContractFunction(node, i, asg.children[i]));
    return Result.combine(results);
}
