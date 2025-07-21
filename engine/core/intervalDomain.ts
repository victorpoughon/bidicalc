import * as nsf from "not-so-float";

export class IntervalDomain {
    constructor(readonly intervals: Map<string, nsf.Interval>) {}

    static fromIterable(iterable: Iterable<[string, nsf.Interval]>) {
        return new IntervalDomain(new Map(iterable));
    }

    static fromRecord(intervals: Record<string, nsf.Interval>): IntervalDomain {
        return new IntervalDomain(new Map(Object.entries(intervals)));
    }

    public isFinite(): boolean {
        return this.every(([r, u]) => u.isFinite());
    }

    public get(ref: string): nsf.Interval {
        if (!this.has(ref)) throw Error(`IntervalDomain: missing ref '${ref}'`);
        return this.intervals.get(ref) as nsf.Interval;
    }

    public has(ref: string): boolean {
        return this.intervals.has(ref);
    }

    public keys(): string[] {
        return Array.from(this.intervals.keys());
    }

    public entries(): [string, nsf.Interval][] {
        return Array.from(this.intervals.entries());
    }

    public map<T>(f: (elem: [string, nsf.Interval], index: number) => T): T[] {
        return this.entries().map(f);
    }

    public with(ref: string, newInterval: nsf.Interval): IntervalDomain {
        const updated = new Map(this.intervals);
        updated.set(ref, newInterval);
        return new IntervalDomain(updated);
    }

    public every(predicate: (value: [string, nsf.Interval]) => boolean): boolean {
        for (const entry of this.intervals.entries()) {
            if (!predicate(entry)) return false;
        }
        return true;
    }

    public some(predicate: (value: [string, nsf.Interval]) => boolean): boolean {
        for (const entry of this.intervals.entries()) {
            if (predicate(entry)) return true;
        }
        return false;
    }
}

// Eq 18 from : https://hal.science/file/index/docid/576641/filename/computing-midpoint.pdf
export function midpoint(I: nsf.Interval): number {
    if (I.lo === -I.hi) return 0;
    if (I.lo === I.hi) return I.lo;
    return I.lo / 2 + I.hi / 2;
}

// Split a finite interval
export function splitInterval(I: nsf.Interval): [nsf.Interval, nsf.Interval] {
    const m = midpoint(I);
    return [nsf.interval(I.lo, m), nsf.interval(m, I.hi)];
}

// Split a finite domain into two disjoint domains
export function splitIntervalDomain(
    domain: IntervalDomain,
    ref: string,
): [IntervalDomain, IntervalDomain] {
    if (!domain.has(ref)) {
        throw Error(`can't split interval domain on '${ref}': missing ref`);
    }

    // Split the ref union
    const inter = domain.get(ref);
    const [a, b] = splitInterval(inter);

    return [domain.with(ref, a), domain.with(ref, b)];
}
