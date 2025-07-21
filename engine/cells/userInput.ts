import { BidiError } from "../core/errors.ts";
import { CellModel } from "../mainsolver/cellModel.ts";

// User input types
export type EmptyUserInput = { _type: "UserInput"; kind: "Empty" };
export type TextUserInput = { _type: "UserInput"; kind: "Text"; text: string };
export type NumberUserInput = { _type: "UserInput"; kind: "Number"; value: number };
export type VariableUserInput = { _type: "UserInput"; kind: "Variable"; value: number };
export type ConstantUserInput = { _type: "UserInput"; kind: "Constant"; value: number };
export type FormulaUserInput = {
    _type: "UserInput";
    kind: "Formula";
    model: CellModel;
    expression: string;
};
export type ErrorUserInput = {
    _type: "UserInput";
    kind: "Error";
    error: BidiError;
    recoveryInput: string;
};

export type UserInput =
    | EmptyUserInput
    | TextUserInput
    | NumberUserInput
    | VariableUserInput
    | ConstantUserInput
    | FormulaUserInput
    | ErrorUserInput;

function makeUserInputConstructors() {
    return {
        Empty(): EmptyUserInput {
            return { _type: "UserInput", kind: "Empty" };
        },
        Text(text: string): TextUserInput {
            return { _type: "UserInput", kind: "Text", text };
        },
        Number(value: number): NumberUserInput {
            return { _type: "UserInput", kind: "Number", value };
        },
        Variable(value: number): VariableUserInput {
            return { _type: "UserInput", kind: "Variable", value };
        },
        Constant(value: number): ConstantUserInput {
            return { _type: "UserInput", kind: "Constant", value };
        },
        Formula(model: CellModel, expression: string): FormulaUserInput {
            return { _type: "UserInput", kind: "Formula", model, expression };
        },
        Error(error: BidiError, recoveryInput: string): ErrorUserInput {
            return { _type: "UserInput", kind: "Error", error, recoveryInput };
        },
    };
}

export const UserInput = Object.freeze({
    ...makeUserInputConstructors(),
});
