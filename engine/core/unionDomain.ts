import * as nsf from "not-so-float";

import { splitInterval, IntervalDomain } from "./intervalDomain.ts";

export class UnionDomain {
    constructor(readonly unions: Map<string, nsf.Union>) {}

    static fromIterable(iterable: Iterable<[string, nsf.Union]>) {
        return new UnionDomain(new Map(iterable));
    }

    static fromRecord(unions: Record<string, nsf.Union>): UnionDomain {
        return new UnionDomain(new Map(Object.entries(unions)));
    }

    static fromIntervalDomain(domain: IntervalDomain): UnionDomain {
        const lift = new Map(domain.entries().map(([ref, inter]) => [ref, nsf.union([inter])]));
        return new UnionDomain(lift);
    }

    // True iff at least one union is empty
    public isEmpty(): boolean {
        for (const union of this.unions.values()) {
            if (union.isEmpty()) return true;
        }
        return false;
    }

    public isFinite(): boolean {
        return this.every(([r, u]) => u.isFinite());
    }

    public get(ref: string): nsf.Union {
        if (!this.has(ref)) throw Error(`UnionDomain: missing ref '${ref}'`);
        return this.unions.get(ref) as nsf.Union;
    }

    public has(ref: string): boolean {
        return this.unions.has(ref);
    }

    public keys(): string[] {
        return Array.from(this.unions.keys());
    }

    public entries(): [string, nsf.Union][] {
        return Array.from(this.unions.entries());
    }

    public with(ref: string, newUnion: nsf.Union): UnionDomain {
        const updated = new Map(this.unions);
        updated.set(ref, newUnion);
        return new UnionDomain(updated);
    }

    public withDomain(domain: UnionDomain): UnionDomain {
        const updated = new Map(this.unions);
        for (const [ref, union] of domain.entries()) {
            updated.set(ref, union);
        }
        return new UnionDomain(updated);
    }

    public every(predicate: (value: [string, nsf.Union]) => boolean): boolean {
        for (const entry of this.unions.entries()) {
            if (!predicate(entry)) return false;
        }
        return true;
    }

    public some(predicate: (value: [string, nsf.Union]) => boolean): boolean {
        for (const entry of this.unions.entries()) {
            if (predicate(entry)) return true;
        }
        return false;
    }

    public isIntervalDomain(): boolean {
        return this.every(([ref, union]) => union.intervals.length === 1);
    }

    public toIntervalDomain(): IntervalDomain | null {
        if (!this.isIntervalDomain()) return null;
        const down = new Map(this.entries().map(([ref, union]) => [ref, union.intervals[0]]));
        return new IntervalDomain(down);
    }
}

export function breakupUnionDomain(domain: UnionDomain): IntervalDomain[] {
    const a = new Map(domain.entries().map(([ref, un]) => [ref, un.intervals]));
    return cartesianProductIterative(a).map((l) => new IntervalDomain(l));
}

function cartesianProductIterative<T>(input: Map<string, T[]>): Map<string, T>[] {
    if (input.size === 0) return [];

    let result: Map<string, T>[] = [new Map()]; // Start with one empty map

    for (const [key, values] of input.entries()) {
        const temp: Map<string, T>[] = [];
        for (const partial of result) {
            for (const value of values) {
                const newMap = new Map(partial);
                newMap.set(key, value);
                temp.push(newMap);
            }
        }
        result = temp;
    }

    return result;
}
