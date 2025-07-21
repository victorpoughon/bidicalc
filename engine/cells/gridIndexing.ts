export type GridIterator = {
    index: number;
    ref: string;
    row: number;
    col: number;
    isLastCol: boolean;
    isLastRow: boolean;
};

// Abstract management of a spreadsheet grid with labels, indexing helpers, etc.
export class GridIndexing {
    private _ncells: number;
    private _indexing: GridIterator[];
    private _refIndexing: Record<string, GridIterator>;

    public constructor(public readonly rows: string[], public readonly cols: string[]) {
        this._ncells = rows.length * cols.length;
        this._indexing = [...Array(this._ncells).keys()].map((index) => {
            const row = Math.floor(index / this.ncols());
            const col = index % this.ncols();
            const isLastCol = col === this.ncols() - 1;
            const isLastRow = row === this.nrows() - 1;
            const ref = `${this.cols[col]}${this.rows[row]}`;

            return {
                index,
                ref,
                row,
                col,
                isLastCol,
                isLastRow,
            };
        });

        this._refIndexing = Object.fromEntries(
            Array.from(this._indexing.entries()).map(([i, iterator]) => [iterator.ref, iterator])
        );
    }

    public nrows(): number {
        return this.rows.length;
    }

    public ncols(): number {
        return this.cols.length;
    }

    public ncells(): number {
        return this._ncells;
    }

    public *entries(): Generator<GridIterator> {
        const indices = [...Array(this.ncells()).keys()];
        for (const i of indices) {
            yield this._indexing[i];
        }
    }

    public allEntries(): Array<GridIterator> {
        return [...this.entries()];
    }

    public byIndex(index: number): null | GridIterator {
        if (index < 0 || index >= this.ncells()) return null;
        return this._indexing[index];
    }

    public byRef(ref: string): null | GridIterator {
        if (ref in this._refIndexing) return this._refIndexing[ref];
        return null;
    }

    public byRowCol(row: number, col: number): null | GridIterator {
        return this.byIndex(row * this.ncols() + col);
    }

    public allRefs(): string[] {
        return this._indexing.map((iterator) => iterator.ref);
    }

    public navDown(ref: string): null | GridIterator {
        const it = this.byRef(ref);
        if (it === null) return null;

        if (it.row === this.nrows() - 1) {
            if (it.col === this.ncols() - 1) return this.byRowCol(0, 0);
            return this.byRowCol(0, it.col + 1);
        }
        return this.byRowCol(it.row + 1, it.col);
    }

    public navUp(ref: string): null | GridIterator {
        const it = this.byRef(ref);
        if (it === null) return null;

        if (it.row === 0) {
            if (it.col === 0) return this.byRowCol(this.nrows() - 1, this.ncols() - 1);
            return this.byRowCol(this.nrows() - 1, it.col - 1);
        }
        return this.byRowCol(it.row - 1, it.col);
    }

    public navRight(ref: string): null | GridIterator {
        const it = this.byRef(ref);
        if (it === null) return null;

        if (it.col === this.ncols() - 1) {
            if (it.row === this.nrows() - 1) return this.byRowCol(0, 0);
            return this.byRowCol(it.row + 1, 0);
        }
        return this.byRowCol(it.row, it.col + 1);
    }

    public navLeft(ref: string): null | GridIterator {
        const it = this.byRef(ref);
        if (it === null) return null;

        if (it.col === 0) {
            if (it.row === 0) return this.byRowCol(this.nrows() - 1, this.ncols() - 1);
            return this.byRowCol(it.row - 1, this.ncols() - 1);
        }
        return this.byRowCol(it.row, it.col - 1);
    }
}

export function makeSpreadsheetGridIndexing(nrows: number, ncols: number): GridIndexing {
    const rows = [...Array(nrows).keys()].map((i) => (i + 1).toString());
    const cols = [...Array(ncols).keys()].map((i) => String.fromCharCode("A".charCodeAt(0) + i));
    return new GridIndexing(rows, cols);
}
