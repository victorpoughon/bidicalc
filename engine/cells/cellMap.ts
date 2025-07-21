import { CleanCell, Cell } from "./cells";

abstract class BaseCellMap {
    protected constructor(public readonly _map: Map<string, CleanCell>) {}

    static fromRecord(cells: Record<string, CleanCell>): CellMap {
        return new CellMap(new Map(Object.entries(cells)));
    }

    static empty(keys: string[] = []): CellMap {
        return new CellMap(new Map<string, CleanCell>(keys.map((k) => [k, Cell.EmptyClean()])));
    }

    static emptyMutable(keys: string[] = []): MutableCellMap {
        return new MutableCellMap(
            new Map<string, CleanCell>(keys.map((k) => [k, Cell.EmptyClean()])),
        );
    }

    public has(key: string): boolean {
        return this._map.has(key);
    }

    public isEmpty(): boolean {
        return this._map.size === 0;
    }

    public size(): number {
        return this._map.size;
    }

    public keys(): string[] {
        return Array.from(this._map.keys());
    }

    public get(key: string): CleanCell {
        return this._map.get(key) as CleanCell;
    }

    public every(predicate: (elem: [string, CleanCell]) => boolean): boolean {
        return Array.from(this._map).every(predicate);
    }

    // True iff all given keys are in the map
    public containsKeys(keys: string[]): boolean {
        for (const k of keys) {
            if (!this.has(k)) return false;
        }
        return true;
    }

    // True iff the given keys match the stored keys exactly
    // Assumes there are no duplicate keys in the provided array
    public containsKeysExactly(keys: string[]): boolean {
        const set = new Set(keys);
        if (this.size() !== set.size) return false;
        for (const k of this._map.keys()) {
            if (!set.has(k)) return false;
        }
        return true;
    }

    public entries(): [string, CleanCell][] {
        return Array.from(this._map.entries());
    }

    public forEach(callback: (ref: string, value: CleanCell) => void): void {
        this._map.forEach((v, k) => callback(k, v));
    }

    public filter(predicate: (elem: [string, CleanCell]) => boolean): CellMap {
        return new CellMap(new Map(Array.from(this._map).filter(predicate)));
    }

    public mapToRecord<T>(fn: (elem: [string, CleanCell], i: number) => T): Record<string, T> {
        return Object.fromEntries(Array.from(this._map).map(([k, v], i) => [k, fn([k, v], i)]));
    }

    public extractKeys(keys: string[]): CellMap {
        const result = new Map<string, CleanCell>();
        for (const key of keys) {
            if (this._map.has(key)) {
                result.set(key, this._map.get(key)!);
            }
        }
        return new CellMap(result);
    }

    public extractEntries(keys: string[]): [string, CleanCell][] {
        return keys.map((ref) => [ref, this._map.get(ref)!]);
    }

    public withoutKeys(keys: string[]): CellMap {
        const exclude = new Set(keys);
        const result = new Map<string, CleanCell>();
        for (const key of this.keys()) {
            if (!exclude.has(key)) {
                result.set(key, this._map.get(key)!);
            }
        }
        return new CellMap(result);
    }

    public isAllKind(kind: CleanCell["kind"]): boolean {
        return this.every(([key, cell]) => kind === cell.kind);
    }

    public isAllKinds(kinds: CleanCell["kind"][]): boolean {
        const set = new Set(kinds);
        return this.every(([key, cell]) => set.has(cell.kind));
    }

    public ofKind(kind: CleanCell["kind"]): CellMap {
        return this.filter(([key, cell]) => kind === cell.kind);
    }

    public notOfKind(kind: CleanCell["kind"]): CellMap {
        return this.filter(([key, cell]) => kind !== cell.kind);
    }

    public notOfKinds(kinds: CleanCell["kind"][]): CellMap {
        const set = new Set(kinds);
        return this.filter(([key, cell]) => !set.has(cell.kind));
    }

    public first(): [string, CleanCell] {
        return this._map.entries().next().value!;
    }

    public with(other: CellMap): CellMap {
        const n = this.toMutable();
        n.update(other);
        return n;
    }

    public toMutable(): MutableCellMap {
        return new MutableCellMap(new Map(this._map));
    }
}

export class CellMap extends BaseCellMap {
    constructor(cells: Map<string, CleanCell>) {
        super(cells);
    }
}

export class MutableCellMap extends BaseCellMap {
    constructor(cells: Map<string, CleanCell>) {
        super(cells);
    }

    public set(key: string, cell: CleanCell): void {
        this._map.set(key, cell);
    }

    public update(other: CellMap): void {
        other._map.forEach((cell, key) => {
            this._map.set(key, cell);
        });
    }
}
