export function assert(condition: any, msg?: string): asserts condition {
    if (!condition) {
        throw new Error(msg || "Assertion failed");
    }
}

export function recordMap<A, B>(
    obj: Record<string, A>,
    fn: (k: string, v: A, i: number) => B,
): Record<string, B> {
    return Object.fromEntries(Object.entries(obj).map(([k, v], i) => [k, fn(k, v, i)]));
}

export function recordZip<A, B>(
    a: Record<string, A>,
    b: Record<string, B>,
): Record<string, [A, B]> {
    const keys1 = Object.keys(a);
    const keys2 = Object.keys(b);

    // Ensure both have the same set of keys
    if (
        keys1.length !== keys2.length ||
        !keys1.every((k) => k in b) ||
        !keys2.every((k) => k in a)
    ) {
        throw new Error("recordZip: records must have identical keys");
    }

    return Object.fromEntries(keys1.map((k) => [k, [a[k], b[k]]] as const));
}

// Note this includes record order
export function recordsEqualPredicate<T>(
    a: Record<string, T>,
    b: Record<string, T>,
    pred: (a: T, b: T) => boolean,
): boolean {
    return arraysEqualPredicate(
        Object.entries(a),
        Object.entries(b),
        (a, b) => a[0] === b[0] && pred(a[1], b[1]),
    );
}

export function arraysEqual<T>(a: Array<T>, b: Array<T>): boolean {
    return a.length === b.length && a.every((e, i) => e === b[i]);
}

// Like arraysEqual but with custom equality testing for elements
export function arraysEqualPredicate<T>(
    a: Array<T>,
    b: Array<T>,
    pred: (a: T, b: T) => boolean,
): boolean {
    return a.length === b.length && a.every((e, i) => pred(e, b[i]));
}

// Set equality
export function setsEqual<T>(a: Set<T>, b: Set<T>): boolean {
    return a.size === b.size && [...a].every((x) => b.has(x));
}
