import { describe, it } from "node:test";
import assert from "node:assert";

import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-backend-cpu";

import { Lookup } from "../../dnsolver/semanticsTfModel.ts";
import { neverLookup, lookupError } from "../../dnsolver/semanticsTfModel.ts";
import { BidiError, InvalidRef } from "../../core/errors.ts";
import { CellModel } from "../../mainsolver/cellModel.ts";
import { Cell, CleanCell, DirtyCell } from "../cells.ts";
import { processUserInput } from "../processUserInput.ts";
import * as nsf from "not-so-float";
import { NsfLookup } from "../../nsfmodel/semanticsNsfModel.ts";

import { ASG, Node } from "../../asg/asg.ts";

// Testing model that always returns its id, use to test equality of models in test cases
function idModel(id: number, refs: string[]): CellModel {
    return {
        tfmodel: (_: Lookup) => tf.tensor(id),
        nsfmodel: (_: NsfLookup) => nsf.single(id),
        asg: ASG.fromRecord({ children: [[]], references: {}, nodes: [Node.Number(id)] }),
        refs: { singles: refs, functions: [] },
    };
}

function expect(cellIn: CleanCell, input: string, expected: DirtyCell, lookup: Lookup) {
    const actual: DirtyCell = processUserInput(cellIn, input);
    assert.deepEqual(actual, expected);
}

function expectAllIn(
    cellsIn: Array<CleanCell>,
    cellsOut: Record<string, DirtyCell>,
    lookup: Lookup
) {
    for (const cellIn of cellsIn) {
        for (const [input, expected] of Object.entries(cellsOut)) {
            expect(cellIn, input, expected, lookup);
        }
    }
}

describe("processUserInput, valid input", () => {
    it("white space input", () => {
        expectAllIn(
            [
                Cell.EmptyClean(),
                Cell.TextClean("bla"),
                Cell.VariableClean(1),
                Cell.ConstantClean(1),
                Cell.SolutionClean(1, idModel(1, ["x"]), "x+1"),
                Cell.NoSolutionClean(1, 2, idModel(1, ["x"]), idModel(1, ["x"]), "x+1"),
                Cell.ErrorClean(new InvalidRef("ref"), "ref+2", ["ref"]),
            ],
            {
                "": Cell.EmptyDirty(),
                "  ": Cell.EmptyDirty(),
                "    ": Cell.EmptyDirty(),
            },
            neverLookup
        );
    });

    it("quoted input", () => {
        expectAllIn(
            [
                Cell.EmptyClean(),
                Cell.TextClean("bla"),
                Cell.VariableClean(1),
                Cell.ConstantClean(1),
                Cell.SolutionClean(1, idModel(1, ["x"]), "x+1"),
                Cell.NoSolutionClean(1, 2, idModel(1, ["x"]), idModel(1, ["x"]), "x+1"),
                Cell.ErrorClean(new InvalidRef("ref"), "ref+2", ["ref"]),
            ],
            {
                '"Hello world!"': Cell.TextDirty("Hello world!"),
                '  "Hello world!"': Cell.TextDirty("Hello world!"),
                '"Hello world!"  ': Cell.TextDirty("Hello world!"),
                '"  Hello world!  "  ': Cell.TextDirty("  Hello world!  "),
            },
            neverLookup
        );
    });

    it("bare number input", () => {
        expectAllIn(
            [
                Cell.EmptyClean(),
                Cell.TextClean("bla"),
                Cell.VariableClean(1),
                Cell.ConstantClean(1),
                Cell.ErrorClean(new InvalidRef("ref"), "ref+2", ["ref"]),
            ],
            {
                "5.5": Cell.VariableDirty(5.5),
                "-5.5": Cell.VariableDirty(-5.5),
                "   5.5": Cell.VariableDirty(5.5),
                "  -  5.5": Cell.VariableDirty(-5.5),
            },
            neverLookup
        );

        // Input on a solution with some immediate references
        const model1 = idModel(1, ["x"]);
        expectAllIn(
            [Cell.SolutionClean(1, model1, "x+1")],
            {
                "5.5": Cell.GoalDirty(5.5, 1, model1, "x+1"),
                "-5.5": Cell.GoalDirty(-5.5, 1, model1, "x+1"),
                "   5.5": Cell.GoalDirty(5.5, 1, model1, "x+1"),
                "  -  5.5": Cell.GoalDirty(-5.5, 1, model1, "x+1"),
            },
            neverLookup
        );

        // Input on a solution with no immediate references
        expectAllIn(
            [Cell.SolutionClean(1, idModel(2, []), "1+1")],
            {
                "5.5": Cell.VariableDirty(5.5),
                "-5.5": Cell.VariableDirty(-5.5),
                "   5.5": Cell.VariableDirty(5.5),
                "  -  5.5": Cell.VariableDirty(-5.5),
            },
            neverLookup
        );

        // TODO no solution
    });

    it("~ prefix input", () => {
        // TODO
    });

    it("# prefix input", () => {
        // TODO
    });

    it("formula input", () => {
        // TODO
    });

    it("invalid syntax input", () => {});
});

// TODO test processUserInputForwardOnly
