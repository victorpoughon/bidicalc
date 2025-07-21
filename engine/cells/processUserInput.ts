import { match, P } from "ts-pattern";

import { constructCellModel, CellModel } from "../mainsolver/cellModel.ts";
import { parseNumber } from "../grammar/semanticsNumbers.ts";
import { BidiError, SyntaxError } from "../core/errors.ts";

import { Cell, CleanCell, DirtyCell, SolutionCellClean, NoSolutionCellClean } from "./cells.ts";
import { UserInput } from "./userInput.ts";

export function makeUserInput(userInput: string): UserInput {
    userInput = userInput.trim();

    // Whitespace input means empty
    if (userInput.length === 0) {
        return UserInput.Empty();
    }

    const [first, last] = [userInput[0], userInput[userInput.length - 1]];

    // Attempt to parse as a number
    const numberResult = parseNumber(userInput);
    if (numberResult.isOk()) {
        return UserInput.Number(numberResult.value);
    }

    // Attempt to parse as text
    if (userInput.length >= 2 && first === '"' && last === '"') {
        return UserInput.Text(userInput.slice(1, -1));
    }

    // Parse constant prefix
    if (first === "#") {
        const numberResult = parseNumber(userInput.slice(1));
        if (numberResult.isOk()) {
            return UserInput.Constant(numberResult.value);
        } else {
            return UserInput.Error(new SyntaxError(userInput, numberResult.error), userInput);
        }
    }

    // Parse variable prefix
    if (first === "~") {
        const numberResult = parseNumber(userInput.slice(1));
        if (numberResult.isOk()) {
            return UserInput.Variable(numberResult.value);
        } else {
            return UserInput.Error(new SyntaxError(userInput, numberResult.error), userInput);
        }
    }

    // Attempt to parse as a formula
    if (first === "=") userInput = userInput.slice(1);
    if (userInput.length === 0) return UserInput.Empty();
    const modelResult = constructCellModel(userInput);

    return modelResult.match(
        (model: CellModel) => UserInput.Formula(model, userInput),
        (err: BidiError) => UserInput.Error(err, userInput)
    );
}

// Process user input when the previous clean cell
// state is to be fully replaced
// Defaults a raw number to a variable i.e. "5" means "~5"
function processUserInputReplacement(input: UserInput): DirtyCell {
    return match(input)
        .returnType<DirtyCell>()
        .with({ kind: "Empty" }, (input) => Cell.EmptyDirty())
        .with({ kind: "Text" }, (input) => Cell.TextDirty(input.text))
        .with({ kind: "Number" }, (input) => Cell.VariableDirty(input.value))
        .with({ kind: "Variable" }, (input) => Cell.VariableDirty(input.value))
        .with({ kind: "Constant" }, (input) => Cell.ConstantDirty(input.value))
        .with({ kind: "Formula" }, (input) => Cell.FormulaDirty(input.model, input.expression))
        .with({ kind: "Error" }, (input) => Cell.ErrorDirty(input.error, input.recoveryInput, []))
        .exhaustive();
}

// Process user input on a solution or no solution clean cell
function processUserInputSolution(
    cleanCell: SolutionCellClean | NoSolutionCellClean,
    userInput: UserInput
): DirtyCell {
    return (
        match(userInput)
            .returnType<DirtyCell>()
            // User input on a solution/nosolution cell: non numeric cases
            .with({ kind: "Empty" }, (input) => Cell.EmptyDirty())
            .with({ kind: "Text" }, (input) => Cell.TextDirty(input.text))
            .with({ kind: "Formula" }, (input) => Cell.FormulaDirty(input.model, input.expression))
            .with({ kind: "Error" }, (input) =>
                Cell.ErrorDirty(input.error, input.recoveryInput, [])
            )

            // User input on a solution/nosolution cell: numeric cases
            .with({ kind: "Number" }, (input) => {
                // If the clean cell has no immediate references, replace the input with a variable,
                // but only if the replacement value is different from the current solution result.
                if (
                    Cell.deps(cleanCell).length === 0 &&
                    cleanCell.kind === "Solution" &&
                    input.value !== cleanCell.value
                ) {
                    return Cell.VariableDirty(input.value);
                }

                // Else, it's a goal
                const previousValue = match(cleanCell)
                    .with({ kind: "Solution" }, (cell) => cell.value)
                    .with({ kind: "NoSolution" }, (cell) => cell.previousValue)
                    .exhaustive();
                return Cell.GoalDirty(
                    input.value,
                    previousValue,
                    cleanCell.model,
                    cleanCell.expression
                );
            })
            .with({ kind: "Constant" }, (input) => Cell.ConstantDirty(input.value))
            .with({ kind: "Variable" }, (input) => Cell.VariableDirty(input.value))
            .exhaustive()
    );
}

// Process user input in bidirectional mode
export function processUserInput(cleanCell: CleanCell, userInputString: string): DirtyCell {
    const userInput = makeUserInput(userInputString);
    return match(cleanCell)
        .returnType<DirtyCell>()
        .with({ kind: "Solution" }, { kind: "NoSolution" }, (cell) =>
            processUserInputSolution(cell, userInput)
        )
        .otherwise(() => processUserInputReplacement(userInput));
}

// Process user input in forward only mode
export function processUserInputForwardOnly(
    cleanCell: CleanCell,
    userInputString: string
): DirtyCell {
    const userInput = makeUserInput(userInputString);
    return processUserInputReplacement(userInput);
}
