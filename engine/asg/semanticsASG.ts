import bidicalcGrammar from "../grammar/bidicalc.ohm-bundle.js";
import type { BIDICALCSemantics } from "../grammar/bidicalc.ohm-bundle.js";

import * as ohm from "ohm-js";

import { Result, ok, err } from "neverthrow";

import { BidiError, SyntaxError } from "../core/errors.ts";

import {
    ASGNode,
    ASG,
    Node,
    shiftChildren,
    shiftReferences,
    mergeReferences,
    mergeDuplicateReferences,
} from "./asg.ts";

export type ASGEvalResult = Result<ASG, BidiError>;

// A binary node has two children each with N1 and N2 nodes:
// Left nodes remain [0, N1 - 1]
// Right nodes become [N1, N1 + N2 - 1]
// Current node gets id: N1 + N2
function binaryOperator(node: ASGNode) {
    return (
        arg1: ohm.NonterminalNode,
        _: ohm.TerminalNode,
        arg2: ohm.NonterminalNode,
    ): ASGEvalResult => {
        const [dmLeft, dmRight] = [evalASG(arg1), evalASG(arg2)];

        if (dmLeft.isErr()) return dmLeft;
        if (dmRight.isErr()) return dmRight;

        const [astLeft, astRight] = [dmLeft.value, dmRight.value];
        const [N1, N2] = [astLeft.nodes.length, astRight.nodes.length];

        // Shift the right model node ids by the number of nodes in the left model
        const rightChildren = shiftChildren(N1, astRight.children);
        const rightReferences = shiftReferences(N1, astRight.references);
        const currentChildren = [N1 - 1, N1 + N2 - 1];

        return ok(
            ASG.fromRecord({
                children: astLeft.children.concat(rightChildren).concat([currentChildren]),
                references: mergeReferences([astLeft.references, rightReferences]),
                nodes: [...astLeft.nodes, ...astRight.nodes, node],
            }),
        );
    };
}

function unaryOperator(node: ASGNode) {
    return (_: ohm.TerminalNode, arg: ohm.NonterminalNode): ASGEvalResult => {
        const astResult = evalASG(arg);
        if (astResult.isErr()) return astResult;
        const ast = astResult.value;

        const currentChildren = [ast.nodes.length - 1];

        return ok(
            ASG.fromRecord({
                children: astResult.value.children.concat([currentChildren]),
                references: astResult.value.references,
                nodes: astResult.value.nodes.concat([node]),
            }),
        );
    };
}

function isStringInteger(str: string): boolean {
    return /^-?\d+$/.test(str);
}

function makeSemanticsASG(): BIDICALCSemantics {
    const sem = bidicalcGrammar.createSemantics();

    sem.addOperation("evalASGUntyped", {
        AddExp_plus: binaryOperator(Node.Add()),
        AddExp_minus: binaryOperator(Node.Sub()),
        MulExp_times: binaryOperator(Node.Mul()),
        MulExp_divide: binaryOperator(Node.Div()),
        UnaryExp_neg: unaryOperator(Node.Neg()),

        ExpExp_power(
            baseArg: ohm.NonterminalNode,
            _1: ohm.TerminalNode,
            exponentArg: ohm.NonterminalNode,
        ): ASGEvalResult {
            if (isStringInteger(exponentArg.sourceString)) {
                const node = Node.PowInt(parseInt(exponentArg.sourceString));
                return unaryOperator(node)(_1, baseArg);
            } else {
                return binaryOperator(Node.PowReal())(baseArg, _1, exponentArg);
            }
        },

        UnaryExp_pos(_: ohm.TerminalNode, exp: ohm.NonterminalNode): ASGEvalResult {
            return evalASG(exp);
        },

        PriExp_paren(
            _0: ohm.TerminalNode,
            exp: ohm.NonterminalNode,
            _1: ohm.TerminalNode,
        ): ASGEvalResult {
            return evalASG(exp);
        },

        CellRef_single(identifier: ohm.NonterminalNode): ASGEvalResult {
            return ok(
                ASG.fromRecord({
                    children: [[]],
                    references: { [identifier.sourceString]: [0] },
                    nodes: [Node.Ref(identifier.sourceString)],
                }),
            );
        },

        FunctionExp(
            name: ohm.IterationNode,
            _1: ohm.TerminalNode,
            args: ohm.NonterminalNode,
            _3: ohm.TerminalNode,
        ): ASGEvalResult {
            // Evaluate all children
            const astResults = args.asIteration().children.map((c) => evalASG(c));

            // Note we don't check function existence or arity here,
            // but later when using the ASG.

            // 0-ary function special case
            if (astResults.length === 0) {
                return ok(
                    ASG.fromRecord({
                        children: [[]],
                        references: {},
                        nodes: [Node.Function(name.sourceString)],
                    }),
                );
            }

            // N-ary function
            return Result.combine(astResults).map((asts) => {
                // Compute shifts: 0, N1, N1+N2, ...
                const shifts: number[] = [0];
                asts.slice(0, asts.length - 1).forEach((ast) => {
                    shifts.push(shifts[shifts.length - 1] + ast.nodes.length);
                });

                // Shift children and references node ids
                const shiftedChildren = shifts.map((s, i) => shiftChildren(s, asts[i].children));
                const shiftedReferences = shifts.map((s, i) =>
                    shiftReferences(s, asts[i].references),
                );

                // Current node's children: N1 - 1, N1 + N2 - 1, N1 + N2 + N3 - 1, ... = shift[i] + N[i] - 1
                const currentChildren = shifts.map((s, i) => s + asts[i].nodes.length - 1);
                const total = asts.reduce((acc, ast) => acc + ast.nodes.length, 0);

                return ASG.fromRecord({
                    children: shiftedChildren.flat().concat([currentChildren]),
                    references: mergeReferences(shiftedReferences),
                    nodes: asts
                        .map((model) => model.nodes)
                        .flat()
                        .concat(Node.Function(name.sourceString)),
                });
            });
        },

        number(digits: ohm.NonterminalNode): ASGEvalResult {
            return ok(
                ASG.fromRecord({
                    children: [[]],
                    references: {},
                    nodes: [Node.Number(parseFloat(digits.sourceString))],
                }),
            );
        },
    });
    return sem;
}

// Prefer this to .evalASGUntyped() for stronger typing
function evalASG(arg: ohm.Node): ASGEvalResult {
    return arg.evalASGUntyped();
}

export function constructASG(
    expression: string,
): ASGEvalResult {
    const match = bidicalcGrammar.match(expression);
    if (match.failed()) {
        return err(new SyntaxError(expression, match));
    }

    const sem = makeSemanticsASG();
    const astResult = sem(match).evalASGUntyped();
    return astResult.map(mergeDuplicateReferences);
}
