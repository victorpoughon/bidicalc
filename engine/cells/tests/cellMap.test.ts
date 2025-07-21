import { describe, it } from "node:test";
import assert from "node:assert";

import { Cell } from "../cells.ts";
import { CellMap } from "../cellMap.ts";

describe("cellMap", () => {
    const context = CellMap.fromRecord({
        x: Cell.EmptyClean(),
        y: Cell.VariableClean(5.5),
        z: Cell.ConstantClean(5.0),
    });

    it("CellMap.ofKind()", () => {
        const contextEmpty = context.ofKind("Empty");
        const contextText = context.ofKind("Text");
        const contextVariable = context.ofKind("Variable");
        const contextConstant = context.ofKind("Constant");
        const contextSolution = context.ofKind("Solution");
        const contextNoSolution = context.ofKind("NoSolution");
        const contextError = context.ofKind("Error");

        assert.deepEqual(contextEmpty.size(), 1);
        assert.deepEqual(contextText.size(), 0);
        assert.deepEqual(contextVariable.size(), 1);
        assert.deepEqual(contextConstant.size(), 1);
        assert.deepEqual(contextSolution.size(), 0);
        assert.deepEqual(contextNoSolution.size(), 0);
        assert.deepEqual(contextError.size(), 0);
    });

    it("CellMap.notOfKind()", () => {
        const contextEmpty = context.notOfKind("Empty");
        const contextText = context.notOfKind("Text");
        const contextVariable = context.notOfKind("Variable");
        const contextConstant = context.notOfKind("Constant");
        const contextSolution = context.notOfKind("Solution");
        const contextNoSolution = context.notOfKind("NoSolution");
        const contextError = context.notOfKind("Error");

        assert.deepEqual(contextEmpty.size(), 2);
        assert.deepEqual(contextText.size(), 3);
        assert.deepEqual(contextVariable.size(), 2);
        assert.deepEqual(contextConstant.size(), 2);
        assert.deepEqual(contextSolution.size(), 3);
        assert.deepEqual(contextNoSolution.size(), 3);
        assert.deepEqual(contextError.size(), 3);
    });

    it("CellMap.mapToRecord()", () => {
        assert.deepEqual(
            context.mapToRecord<number>(([ref, cell]) => {
                return 42;
            }),
            { x: 42, y: 42, z: 42 },
        );
    });

    it("CellMap.every()", () => {
        const context = CellMap.fromRecord({
            x: Cell.VariableClean(5.5),
            y: Cell.VariableClean(5.5),
            z: Cell.VariableClean(5.5),
        });

        assert.ok(context.every(([key, cell]) => cell.kind === "Variable"));
    });
});
