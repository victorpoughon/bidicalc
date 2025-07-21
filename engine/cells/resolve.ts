import {
    Cell,
    CleanCell,
    FormulaCellDirty,
    GoalCellDirty,
    DirtyCell,
    ErrorCellClean,
    VariableCellClean,
} from "./cells";
import { CellMap } from "./cellMap.ts";
import { InvalidRef, InvalidKindOfRef, InternalError } from "../core/errors.ts";

// Main solver
import { mainSolverBackwards } from "../mainsolver/mainSolverBackwards.ts";
import { mainSolverForwards, unionToSingleNumber } from "../mainsolver/mainSolverForwards.ts";
import { solverSettings } from "../mainsolver/solverSettings.ts";

import { match } from "ts-pattern";
import { processUserInput } from "./processUserInput";

// Make a cell dirty because one of its upstream cell is dirty
export function toDirty(cleanCell: CleanCell): DirtyCell {
    return match(cleanCell)
        .returnType<DirtyCell>()
        .with({ kind: "Empty" }, () => Cell.EmptyDirty())
        .with({ kind: "Text" }, (cell) => Cell.TextDirty(cell.text))
        .with({ kind: "Variable" }, (cell) => Cell.VariableDirty(cell.value))
        .with({ kind: "Constant" }, (cell) => Cell.ConstantDirty(cell.value))
        .with({ kind: "Solution" }, (cell) => Cell.FormulaDirty(cell.model, cell.expression))
        .with({ kind: "NoSolution" }, (cell) => Cell.FormulaDirty(cell.model, cell.expression))
        .with({ kind: "Error" }, (cell) => processUserInput(cell, cell.recoveryInput))
        .exhaustive();
}

// Check for any InvalidRef error in a cell with a model
function checkInvalidRef(
    cell: FormulaCellDirty | GoalCellDirty,
    context: CellMap
): null | ErrorCellClean {
    const missingSingles = cell.model.refs.singles.filter((ref) => !context.has(ref));

    // Check external refs are available
    if (missingSingles.length > 0) {
        const recoveryInput = cell.expression;
        const recoveryDeps = Cell.deps(cell).filter((ref) => context.has(ref)); // keep only valid references
        return Cell.ErrorClean(new InvalidRef(missingSingles[0]), recoveryInput, recoveryDeps);
    }
    return null;
}

function lookupError(ref: string): never {
    throw new Error(`Lookup error '${ref}'`);
}

// Convert a context to a lookup function (that cannot fail)
export function lookupContext(context: CellMap) {
    function lookup(ref: string): number {
        const target = context.get(ref);

        return match(target)
            .with({ kind: "Variable" }, (cell) => cell.value)
            .with({ kind: "Constant" }, (cell) => cell.value)
            .with({ kind: "Solution" }, (cell) => cell.value)
            .otherwise(() => lookupError(ref));
    }

    return lookup;
}

// Resolve a single FormulaCell (DirtyCell) into a CleanCell
function resolveFormula(cellFormula: FormulaCellDirty, context: CellMap): CleanCell {
    // Check for invalid references
    const invalidRefError: ErrorCellClean | null = checkInvalidRef(cellFormula, context);
    if (invalidRefError) {
        return invalidRefError;
    }

    // Check external refs can be used as formula input
    const refContext = context.extractKeys(cellFormula.model.refs.singles);
    const validReferenceKinds: CleanCell["kind"][] = ["Constant", "Variable", "Solution"];
    if (!refContext.isAllKinds(validReferenceKinds)) {
        const [invalidRef, invalidCell] = refContext.notOfKinds(validReferenceKinds).first();
        const error = new InvalidKindOfRef(invalidRef, invalidCell.kind);
        return Cell.ErrorClean(error, cellFormula.expression, Cell.deps(cellFormula));
    }

    const result = unionToSingleNumber(
        mainSolverForwards(cellFormula.model, lookupContext(context))
    );

    if (result.isErr()) {
        return Cell.ErrorClean(result.error, cellFormula.expression, Cell.deps(cellFormula));
    }

    return Cell.SolutionClean(result.value, cellFormula.model, cellFormula.expression);
}

/* Resolve a single dirty cell that's not a goal
Args:
    formulaContext: the immediate evaluation context for formula resolution
Returns:
    the clean cell after resolution
*/
export function resolveNonGoalCell(
    dirty: Exclude<DirtyCell, GoalCellDirty>,
    formulaContext: CellMap
): CleanCell {
    return match(dirty)
        .returnType<CleanCell>()
        .with({ kind: "Empty" }, () => Cell.EmptyClean())
        .with({ kind: "Text" }, (cell) => Cell.TextClean(cell.text))
        .with({ kind: "Variable" }, (cell) => Cell.VariableClean(cell.value))
        .with({ kind: "Constant" }, (cell) => Cell.ConstantClean(cell.value))
        .with({ kind: "Formula" }, (cell) => resolveFormula(cell, formulaContext))
        .with({ kind: "Error" }, (cell) =>
            Cell.ErrorClean(cell.error, cell.recoveryInput, cell.deps)
        )
        .exhaustive();
}
