import { CleanCell, Cell } from "./cells";
import { match } from "ts-pattern";


export function renderNumber(value: number): string {
    const precision = 6;

    let s = value.toPrecision(precision);
    return parseFloat(s.toString()).toString();
}

// Render a cell to strings for an input element without focus
export function renderBlur(cleanCell: CleanCell): [string, string] {
    const text = match(cleanCell)
        .returnType<string>()
        .with({ kind: "Empty" }, (cell) => "")
        .with({ kind: "Text" }, (cell) => cell.text)
        .with({ kind: "Variable" }, (cell) => renderNumber(cell.value))
        .with({ kind: "Constant" }, (cell) => renderNumber(cell.value))
        .with({ kind: "Solution" }, (cell) => renderNumber(cell.value))
        .with({ kind: "NoSolution" }, (cell) => "No sol.")
        .with({ kind: "Error" }, (cell) => cell.recoveryInput)
        .exhaustive();

    return [text, cleanCell.kind];
}

// Render a cell to strings for an input element with focus
export function renderFocus(cleanCell: CleanCell): [string, string] {
    const text = match(cleanCell)
        .returnType<string>()
        .with({ kind: "Empty" }, (cell) => "")
        .with({ kind: "Text" }, (cell) => `"${cell.text}"`)
        .with({ kind: "Variable" }, (cell) => renderNumber(cell.value))
        .with({ kind: "Constant" }, (cell) => `#${renderNumber(cell.value)}`)
        .with({ kind: "Solution" }, (cell) => renderNumber(cell.value))
        .with({ kind: "NoSolution" }, (cell) => renderNumber(cell.goal))
        .with({ kind: "Error" }, (cell) => cell.recoveryInput)
        .exhaustive();

    return [text, cleanCell.kind];
}

// Secondary render focus is used to provide an alternate edit mode to cells
// Only really used for solution / nosolution cells for now
export function renderFocusSecondary(cleanCell: CleanCell): [string, string] {
    const text = match(cleanCell)
        .returnType<string>()
        .with({ kind: "Empty" }, (cell) => "")
        .with({ kind: "Text" }, (cell) => `"${cell.text}"`)
        .with({ kind: "Variable" }, (cell) => renderNumber(cell.value))
        .with({ kind: "Constant" }, (cell) => `#${renderNumber(cell.value)}`)
        .with({ kind: "Solution" }, (cell) => cell.expression)
        .with({ kind: "NoSolution" }, (cell) => cell.expression)
        .with({ kind: "Error" }, (cell) => cell.recoveryInput)
        .exhaustive();

    return [text, cleanCell.kind];
}
