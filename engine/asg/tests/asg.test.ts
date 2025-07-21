import { describe, it } from "node:test";
import assert from "node:assert";

import { validGrammar } from "../../grammar/tests/grammarTestCases.ts";

import { constructASG } from "../semanticsASG.ts";
import { ASG, ASGRecord, Node, composeASG, composeASGList } from "../asg.ts";

import { assertASGEqual, constructASGExpectValid } from "./asgTestCommon.ts";

describe("construct and compose ASG", () => {
    it("can construct ASG on any valid grammar", () => {
        validGrammar.forEach((expression) => {
            const dmResult = constructASG(expression);
            assert.ok(dmResult);
            const dm = dmResult._unsafeUnwrap();
            // As many entries in children and nodes arrays
            assert.deepEqual(dm.children.length, dm.nodes.length, `${expression} -> ${dm}`);
        });
    });

    it("construct ASG yields expected ASG", () => {
        const expect = (expr: string, expected: ASGRecord) => {
            const actual = constructASGExpectValid(expr);
            assertASGEqual(actual, expected, expr);
        };

        expect("x+x", {
            children: [[], [0, 0]],
            references: { x: [0] },
            nodes: [Node.Ref("x"), Node.Add()],
        });

        expect("1+1", {
            children: [[], [], [0, 1]],
            references: {},
            nodes: [Node.Number(1), Node.Number(1), Node.Add()],
        });

        expect("x^2", {
            children: [[], [0]],
            references: { x: [0] },
            nodes: [Node.Ref("x"), Node.PowInt(2)],
        });

        expect("x^2 + x^2", {
            children: [[], [0], [0], [1, 2]],
            references: { x: [0] },
            nodes: [Node.Ref("x"), Node.PowInt(2), Node.PowInt(2), Node.Add()],
        });

        expect("(x + y + x + y + z)*(x + y)", {
            children: [[], [], [0, 1], [2, 0], [3, 1], [], [4, 5], [0, 1], [6, 7]],
            references: { x: [0], y: [1], z: [5] },
            nodes: [
                Node.Ref("x"),
                Node.Ref("y"),
                Node.Add(),
                Node.Add(),
                Node.Add(),
                Node.Ref("z"),
                Node.Add(),
                Node.Add(),
                Node.Mul(),
            ],
        });

        expect("1+2+3+4", {
            children: [[], [], [0, 1], [], [2, 3], [], [4, 5]],
            references: {},
            nodes: [
                Node.Number(1),
                Node.Number(2),
                Node.Add(),
                Node.Number(3),
                Node.Add(),
                Node.Number(4),
                Node.Add(),
            ],
        });

        expect("1 + (5 + 2) * 5^2", {
            children: [[], [], [], [1, 2], [], [4], [3, 5], [0, 6]],
            references: {},
            nodes: [
                Node.Number(1),
                Node.Number(5),
                Node.Number(2),
                Node.Add(),
                Node.Number(5),
                Node.PowInt(2),
                Node.Mul(),
                Node.Add(),
            ],
        });

        expect("foo(x, y, x, 12)", {
            children: [[], [], [], [0, 1, 0, 2]],
            references: { x: [0], y: [1] },
            nodes: [Node.Ref("x"), Node.Ref("y"), Node.Number(12), Node.Function("foo")],
        });

        expect("foo(x, bar(x, y) - 10 - pi())", {
            children: [[], [], [0, 1], [], [2, 3], [], [4, 5], [0, 6]],
            references: { x: [0], y: [1] },
            nodes: [
                Node.Ref("x"),
                Node.Ref("y"),
                Node.Function("bar"),
                Node.Number(10),
                Node.Sub(),
                Node.Function("pi"),
                Node.Sub(),
                Node.Function("foo"),
            ],
        });
    });

    // Test cases can specify the expected ASG result either as an
    // expression or an explicit object

    it("compose ASG", () => {
        const asgOf = constructASGExpectValid;
        const expect = (baseExpr: string, bindRef: string, bindExpr: string, expected: ASG) => {
            const baseASG = asgOf(baseExpr);
            const bindASG = asgOf(bindExpr);
            const composed = composeASG(baseASG, bindRef, bindASG);
            assertASGEqual(composed, expected, baseExpr);
        };

        expect("(X+1)*B", "B", "Y+3", asgOf("(X+1)*(Y+3)"));
        expect(
            "A*B",
            "A",
            "X+1",
            ASG.fromRecord({
                children: [[], [], [0, 1], [], [2, 3]],
                references: { X: [0], B: [3] },
                nodes: [Node.Ref("X"), Node.Number(1), Node.Add(), Node.Ref("B"), Node.Mul()],
            }),
        );

        expect(
            "x+x",
            "x",
            "1",
            ASG.fromRecord({
                children: [[], [0, 0]],
                references: {},
                nodes: [Node.Number(1), Node.Add()],
            }),
        );
    });

    it("chain compose ASG", () => {
        const asgOf = constructASGExpectValid;
        // Test case is:
        // baseExpr: expression for the initial ASG
        // binds: array of 3-tuples that are each:
        //     - reference to bind
        //     - expression that makes the ASG to bind it to
        //     - expected ASG at this stage when chaining compose
        const expect = (baseExpr: string, binds: [string, string, ASG][]) => {
            const baseASG = asgOf(baseExpr);
            const bindASGs: [string, ASG][] = binds.map(([ref, expr, _2]) => [ref, asgOf(expr)]);

            for (const [i, [_1, _2, expected]] of binds.entries()) {
                const composed = composeASGList(baseASG, bindASGs.slice(0, i + 1));
                assertASGEqual(composed, expected, baseExpr);
            }
        };

        expect("(X+1)*B", [["B", "Y+3", asgOf("(X+1)*(Y+3)")]]);
        expect("A*B", [["A", "X+1", asgOf("(X+1)*B")]]);
        expect("(X+1)*B", [["B", "Y", asgOf("(X+1)*Y")]]);

        expect("A*B", [
            ["A", "X+1", asgOf("(X+1)*B")],
            ["B", "Y", asgOf("(X+1)*Y")],
            ["Y", "2*X + 3", asgOf("(X+1)*(2*X+3)")],
        ]);

        // Note that reference deduplication in the ASG results in other nodes
        // than references being shared when the refence is bound to another ASG
        // This means that some correct results of composition cannot always be
        // compared to the result of parsing a single expression
        expect("A+B-C*D*E", [
            ["A", "X+1", asgOf("(X+1)+B-C*D*E")],
            ["B", "X^2", asgOf("(X+1)+X^2-C*D*E")],
            ["C", "0", asgOf("(X+1)+X^2-0*D*E")],
            ["D", "1", asgOf("(X+1)+X^2-0*1*E")],
            ["E", "ZZ+ZZ+ZZ", asgOf("(X+1)+X^2-0*1*(ZZ+ZZ+ZZ)")],
            [
                "ZZ",
                "42",
                ASG.fromRecord({
                    children: [
                        [],
                        [],
                        [0, 1],
                        [0],
                        [2, 3],
                        [],
                        [],
                        [5, 6],
                        [],
                        [8, 8],
                        [9, 8],
                        [7, 10],
                        [4, 11],
                    ],
                    references: { X: [0] },
                    nodes: [
                        Node.Ref("X"),
                        Node.Number(1),
                        Node.Add(),
                        Node.PowInt(2),
                        Node.Add(),
                        Node.Number(0),
                        Node.Number(1),
                        Node.Mul(),
                        Node.Number(42),
                        Node.Add(),
                        Node.Add(),
                        Node.Mul(),
                        Node.Sub(),
                    ],
                }),
            ],
        ]);
    });
});
