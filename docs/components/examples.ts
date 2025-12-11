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

function cookies(): [bidi.GridIndexing, bidi.MutableCellMap] {
    const [indexing, gridState] = spreadsheet(12, 5);

    input(gridState, "B1", `"Qty for 4 (g)"`);
    input(gridState, "C1", `"g per cup"`);
    input(gridState, "D1", `"Qty (g)"`);
    input(gridState, "E1", `"Qty (Cups)"`);

    input(gridState, "A2", `"Flour"`);
    input(gridState, "A3", `"Butter"`);
    input(gridState, "A4", `"Sugar"`);
    input(gridState, "A5", `"Eggs"`);
    input(gridState, "A6", `"Chocolate"`);
    input(gridState, "A7", `"Salt"`);

    input(gridState, "B2", `#200`);
    input(gridState, "B3", `#220`);
    input(gridState, "B4", `#160`);
    input(gridState, "B5", `#100`);
    input(gridState, "B6", `#250`);
    input(gridState, "B7", `#3`);

    input(gridState, "C2", `#120`);
    input(gridState, "C3", `#225`);
    input(gridState, "C4", `#210`);
    input(gridState, "C5", `#50`);
    input(gridState, "C6", `#175`);
    input(gridState, "C7", `#290`);

    input(gridState, "D2", `B2/B10*E10`);
    input(gridState, "D3", `B3/B10*E10`);
    input(gridState, "D4", `B4/B10*E10`);
    input(gridState, "D5", `B5/B10*E10`);
    input(gridState, "D6", `B6/B10*E10`);
    input(gridState, "D7", `B7/B10*E10`);

    input(gridState, "E2", `D2/C2`);
    input(gridState, "E3", `D3/C3`);
    input(gridState, "E4", `D4/C4`);
    input(gridState, "E5", `D5/C5`);
    input(gridState, "E6", `D6/C6`);
    input(gridState, "E7", `D7/C7`);

    input(gridState, "A9", `"Recipe"`);
    input(gridState, "A10", `"Servings"`);
    input(gridState, "B10", "#4");

    input(gridState, "D9", `"Preparation"`);
    input(gridState, "D10", `"Servings"`);
    input(gridState, "E10", "4");

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
    { name: "Cookies Recipe", fn: cookies },
    { name: "Compound Interest", fn: interest },
    { name: "Polynomial", fn: polynomials },
    // { name: "Least Square", fn: leastsquare },
];
