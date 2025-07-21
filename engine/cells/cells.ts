import { match, P } from "ts-pattern";

import { CellModel } from "../mainsolver/cellModel.ts";
import { BidiError } from "../core/errors.ts";

//    ------------  ----------  ---------
//    kind          DirtyCell   CleanCell
//    ------------  ----------  ---------
//    Empty              X          X
//    Text               X          X
//    Variable           X          X
//    Constant           X          X
//    Formula            X
//    Goal               X
//    Solution                      X
//    NoSolution                    X
//    Error              X          X
//    ------------  ----------  ---------

// Cell types
export type EmptyCellBase = { _type: "Cell"; kind: "Empty" };
export type TextCellBase = { _type: "Cell"; kind: "Text"; text: string };
export type VariableCellBase = { _type: "Cell"; kind: "Variable"; value: number };
export type ConstantCellBase = { _type: "Cell"; kind: "Constant"; value: number };
export type FormulaCellBase = {
    _type: "Cell";
    kind: "Formula";
    model: CellModel;
    expression: string;
};
export type GoalCellBase = {
    _type: "Cell";
    kind: "Goal";
    goal: number;
    previousValue: number;
    model: CellModel;
    expression: string;
};
export type SolutionCellBase = {
    _type: "Cell";
    kind: "Solution";
    value: number;
    model: CellModel;
    expression: string;
};
export type NoSolutionCellBase = {
    _type: "Cell";
    kind: "NoSolution";
    goal: number;
    previousValue: number;
    model: CellModel;
    composedModel: CellModel;
    expression: string;
};
export type ErrorCellBase = {
    _type: "Cell";
    kind: "Error";
    error: BidiError;
    recoveryInput: string;
    deps: string[];
};

export type EmptyCellDirty = EmptyCellBase & { status: "dirty" };
export type EmptyCellClean = EmptyCellBase & { status: "clean" };

export type TextCellDirty = TextCellBase & { status: "dirty" };
export type TextCellClean = TextCellBase & { status: "clean" };

export type VariableCellDirty = VariableCellBase & { status: "dirty" };
export type VariableCellClean = VariableCellBase & { status: "clean" };

export type ConstantCellDirty = ConstantCellBase & { status: "dirty" };
export type ConstantCellClean = ConstantCellBase & { status: "clean" };

export type FormulaCellDirty = FormulaCellBase & { status: "dirty" };
export type GoalCellDirty = GoalCellBase & { status: "dirty" };

export type SolutionCellClean = SolutionCellBase & { status: "clean" };
export type NoSolutionCellClean = NoSolutionCellBase & { status: "clean" };

export type ErrorCellDirty = ErrorCellBase & { status: "dirty" };
export type ErrorCellClean = ErrorCellBase & { status: "clean" };

export type DirtyCell =
    | EmptyCellDirty
    | TextCellDirty
    | VariableCellDirty
    | ConstantCellDirty
    | FormulaCellDirty
    | GoalCellDirty
    | ErrorCellDirty;

export type CleanCell =
    | EmptyCellClean
    | TextCellClean
    | VariableCellClean
    | ConstantCellClean
    | SolutionCellClean
    | NoSolutionCellClean
    | ErrorCellClean;

function makeCellConstructors() {
    return {
        EmptyDirty(): EmptyCellDirty {
            return { _type: "Cell", kind: "Empty", status: "dirty" };
        },
        EmptyClean(): EmptyCellClean {
            return { _type: "Cell", kind: "Empty", status: "clean" };
        },
        TextDirty(text: string): TextCellDirty {
            return { _type: "Cell", kind: "Text", text, status: "dirty" };
        },
        TextClean(text: string): TextCellClean {
            return { _type: "Cell", kind: "Text", text, status: "clean" };
        },
        VariableDirty(value: number): VariableCellDirty {
            return { _type: "Cell", kind: "Variable", value, status: "dirty" };
        },
        VariableClean(value: number): VariableCellClean {
            return { _type: "Cell", kind: "Variable", value, status: "clean" };
        },
        ConstantDirty(value: number): ConstantCellDirty {
            return { _type: "Cell", kind: "Constant", value, status: "dirty" };
        },
        ConstantClean(value: number): ConstantCellClean {
            return { _type: "Cell", kind: "Constant", value, status: "clean" };
        },
        FormulaDirty(model: CellModel, expression: string): FormulaCellDirty {
            return { _type: "Cell", kind: "Formula", model, expression, status: "dirty" };
        },
        GoalDirty(
            goal: number,
            previousValue: number,
            model: CellModel,
            expression: string,
        ): GoalCellDirty {
            return {
                _type: "Cell",
                kind: "Goal",
                goal,
                previousValue,
                model,
                expression,
                status: "dirty",
            };
        },
        SolutionClean(value: number, model: CellModel, expression: string): SolutionCellClean {
            return { _type: "Cell", kind: "Solution", value, model, expression, status: "clean" };
        },
        NoSolutionClean(
            goal: number,
            previousValue: number,
            model: CellModel,
            composedModel: CellModel,
            expression: string,
        ): NoSolutionCellClean {
            return {
                _type: "Cell",
                kind: "NoSolution",
                goal,
                previousValue,
                model,
                composedModel,
                expression,
                status: "clean",
            };
        },
        ErrorDirty(error: BidiError, recoveryInput: string, deps: string[]): ErrorCellDirty {
            return { _type: "Cell", kind: "Error", error, recoveryInput, deps, status: "dirty" };
        },
        ErrorClean(error: BidiError, recoveryInput: string, deps: string[]): ErrorCellClean {
            return { _type: "Cell", kind: "Error", error, recoveryInput, deps, status: "clean" };
        },
    };
}

function cellDebugString(cell: CleanCell | DirtyCell): string {
    const args = match(cell)
        .returnType<string>()
        .with({ kind: "Empty" }, (cell) => ``)
        .with({ kind: "Text" }, (cell) => `'${cell.text}'`)
        .with({ kind: "Variable" }, { kind: "Constant" }, (cell) => `${cell.value}`)
        .with({ kind: "Solution" }, (cell) => `${cell.expression} = ${cell.value}`)
        .with({ kind: "Formula" }, (cell) => `${JSON.stringify(cell.model)}`)
        .with(
            { kind: "Goal" },
            { kind: "NoSolution" },
            (cell) => `${JSON.stringify(cell.expression)}, ${cell.goal}`,
        )
        .with({ kind: "Error" }, (cell) => `${cell.error.short()} | ${cell.error.long()}`)
        .exhaustive();

    return `${cell.kind}(${args})`;
}

// Immediate dependencies of a cell
function cellDeps(cell: CleanCell | DirtyCell): string[] {
    return match(cell)
        .returnType<string[]>()
        .with({ model: P.any }, (cell) => cell.model.refs.singles)
        .with({ kind: "Error" }, (cell) => cell.deps)
        .otherwise(() => []);
}

function recoveryInput(cell: CleanCell | DirtyCell): string {
    return match(cell)
        .returnType<string>()
        .with({ model: P.any }, (cell) => cell.expression)
        .with({ kind: "Error" }, (cell) => cell.recoveryInput)
        .otherwise(() => ""); // Shouldn't be used anywhere
}

export const Cell = Object.freeze({
    ...makeCellConstructors(),

    debugString: cellDebugString,

    deps: cellDeps,
    recoveryInput: recoveryInput,
});
