import * as bidi from "bidicalc-engine";

function spreadsheet(rows: number, cols: number): [bidi.GridIndexing, bidi.MutableCellMap] {
    const indexing = bidi.makeSpreadsheetGridIndexing(rows, cols);
    const gridState: bidi.MutableCellMap = bidi.CellMap.emptyMutable(indexing.allRefs());

    return [indexing, gridState];
}

const input = (gridState: bidi.MutableCellMap, ref: string, expr: string) => {
    const updated = bidi.resolveGraph(gridState, ref, expr, "Bidirectional");
    gridState.update(updated);
};

function blankSpreadsheet(rows: number, cols: number) {
    return (): [bidi.GridIndexing, bidi.MutableCellMap] => {
        return spreadsheet(rows, cols);
    };
}

function unitConverter(): [bidi.GridIndexing, bidi.MutableCellMap] {
    const [indexing, gridState] = spreadsheet(8, 2);

    input(gridState, "A1", `"Kilometers"`);
    input(gridState, "B1", "50");
    input(gridState, "A2", `"Miles"`);
    input(gridState, "B2", "B1 / 1.60934");

    input(gridState, "A4", `"Celcius"`);
    input(gridState, "B4", "50");
    input(gridState, "A5", `"Fahrenheit"`);
    input(gridState, "B5", "B4 * 9/5 + 32");

    input(gridState, "A7", `"Miles per gal."`);
    input(gridState, "B7", "15");
    input(gridState, "A8", `"L / 100 km"`);
    input(gridState, "B8", "235.31 / B7");

    return [indexing, gridState];
}

function circle(): [bidi.GridIndexing, bidi.MutableCellMap] {
    const [indexing, gridState] = spreadsheet(3, 2);

    input(gridState, "A1", `"Radius"`);
    input(gridState, "B1", "5.0");
    input(gridState, "A2", `"Perimeter"`);
    input(gridState, "B2", "B1*2*pi()");
    input(gridState, "A3", `"Area"`);
    input(gridState, "B3", "B1^2*pi()");

    return [indexing, gridState];
}

function polynomials(): [bidi.GridIndexing, bidi.MutableCellMap] {
    const indexing = new bidi.GridIndexing(["x", "F(x)"], [""]);
    const gridState: bidi.MutableCellMap = bidi.CellMap.emptyMutable(indexing.allRefs());

    input(gridState, "x", "0");
    input(gridState, "F(x)", "x^3 - 3*x + 10");
    input(gridState, "F(x)", "0");

    return [indexing, gridState];
}

function interest(): [bidi.GridIndexing, bidi.MutableCellMap] {
    const [indexing, gridState] = spreadsheet(8, 4);

    input(gridState, "A1", `"Interest (%)"`);
    input(gridState, "A3", `"Year 1"`);
    input(gridState, "A4", `"Year 2"`);
    input(gridState, "A5", `"Year 3"`);
    input(gridState, "A6", `"Year 4"`);

    input(gridState, "B1", `#3.2`);
    input(gridState, "B3", `100`);
    input(gridState, "B4", `B3*(1+B1/100)`);
    input(gridState, "B5", `B4*(1+B1/100)`);
    input(gridState, "B6", `B5*(1+B1/100)`);

    return [indexing, gridState];
}

function leastsquare(): [bidi.GridIndexing, bidi.MutableCellMap] {
    const [indexing, gridState] = spreadsheet(12, 4);

    input(gridState, "A1", `"X"`);
    input(gridState, "A2", `#1`);
    input(gridState, "A3", `#2`);
    input(gridState, "A4", `#3`);
    input(gridState, "A5", `#4`);
    input(gridState, "A6", `#5`);
    input(gridState, "A7", `#6`);

    input(gridState, "B1", `"Y (observed)"`);
    input(gridState, "B2", `#2.1`);
    input(gridState, "B3", `#2.9`);
    input(gridState, "B4", `#4.2`);
    input(gridState, "B5", `#4.8`);
    input(gridState, "B6", `#5.3`);
    input(gridState, "B7", `#6.1`);

    input(gridState, "C1", `"Y (predict)"`);
    input(gridState, "C2", `B9*A2 + B10`);
    input(gridState, "C3", `B9*A3 + B10`);
    input(gridState, "C4", `B9*A4 + B10`);
    input(gridState, "C5", `B9*A5 + B10`);
    input(gridState, "C6", `B9*A6 + B10`);
    input(gridState, "C7", `B9*A7 + B10`);

    input(gridState, "A9", `"M"`);
    input(gridState, "A10", `"P"`);

    input(gridState, "B9", `1`);
    input(gridState, "B10", `2`);

    return [indexing, gridState];
}

interface Example {
    name: string;
    fn: () => [bidi.GridIndexing, bidi.MutableCellMap];
}

export const examples: Example[] = [
    { name: "Spreadsheet 8x3", fn: blankSpreadsheet(8, 3) },
    { name: "Spreadsheet 12x6", fn: blankSpreadsheet(12, 6) },
    { name: "Unit Converter", fn: unitConverter },
    { name: "Circle", fn: circle },
    { name: "Polynomial", fn: polynomials },
    { name: "Compound Interest", fn: interest },
    // { name: "Least Square", fn: leastsquare },
];
