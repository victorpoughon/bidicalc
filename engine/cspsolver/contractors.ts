import * as nsf from "not-so-float";

// A contractor is a function that computes the domain for a node given others nodes domains
export type ZeroaryContractor = () => nsf.Union;
export type UnaryContractor = (U: nsf.Union) => nsf.Union;
export type BinaryContractor = (U: nsf.Union, V: nsf.Union) => nsf.Union;

// A linker is a list of contractors associated with an operation
// The list order is implicit and expected to be the same for all linkers

// Node: y = f()
// List: Y = C()
export type ZeroaryLinker = {
    kind: "ZeroaryLinker";
    contractors: [ZeroaryContractor];
};

const zeroaryLinker = (C: [ZeroaryContractor]): ZeroaryLinker => {
    return {
        kind: "ZeroaryLinker",
        contractors: C,
    };
};

// Node: y = f(x)
// List: Y = C0(X), X = C1(Y)
export type UnaryLinker = {
    kind: "UnaryLinker";
    contractors: [UnaryContractor, UnaryContractor];
};

const unaryLinker = (C: [UnaryContractor, UnaryContractor]): UnaryLinker => {
    return {
        kind: "UnaryLinker",
        contractors: C,
    };
};

// Node: y = f(a, b)
// List: Y = C0(A, B), A = C1(Y, B), B = C2(Y, A)
export type BinaryLinker = {
    kind: "BinaryLinker";
    contractors: [BinaryContractor, BinaryContractor, BinaryContractor];
};

const binaryLinker = (C: [BinaryContractor, BinaryContractor, BinaryContractor]): BinaryLinker => {
    return {
        kind: "BinaryLinker",
        contractors: C,
    };
};

export type Linker = ZeroaryLinker | UnaryLinker | BinaryLinker;

// Constant linker (zeroary)
function lconst(c: number): ZeroaryLinker {
    return zeroaryLinker([() => nsf.single(c)]);
}

// Binary addition
const ladd = binaryLinker([
    nsf.add, // y = a + b
    nsf.sub, // a = y - b
    nsf.sub, // b = y - a
]);

// Binary subtraction
const lsub = binaryLinker([
    nsf.sub, // y = a - b
    nsf.add, // a = y + b
    (Y, A) => nsf.sub(A, Y), // b = a - y
]);

// Binary multiplication
const lmul = binaryLinker([
    nsf.mul, // y = a * b
    (Y, B) => (B.contains(0) && !Y.isEmpty() ? nsf.FULL : nsf.div(Y, B)), // a = y / b
    (Y, A) => (A.contains(0) && !Y.isEmpty() ? nsf.FULL : nsf.div(Y, A)), // b = y / a
]);

// Binary division
const ldiv = binaryLinker([
    nsf.div, // y = a / b
    (Y, B) => (B.contains(0) && !Y.isEmpty() ? nsf.FULL : nsf.mul(Y, B)), // a = y * b
    (Y, A) => (Y.contains(0) && !A.isEmpty() ? nsf.FULL : nsf.div(A, Y)), // b = a / y
]);

// Unary negation
const lneg = unaryLinker([nsf.neg, nsf.neg]);

// Integral exponentiation y = x^n (unary operation)
function lpowInt(n: number): UnaryLinker {
    if (n === 0) {
        return unaryLinker([
            (X) => (!X.isEmpty() ? nsf.single(1, 1) : nsf.EMPTY),
            (Y) => (Y.contains(1) && !Y.isEmpty() ? nsf.FULL : nsf.EMPTY),
        ]);
    }

    return unaryLinker([
        (X) => nsf.powInt(X, n), // y = x^n
        (Y) => nsf.powIntInv(Y, n), // x = y^(1/n)
    ]);
}

// Real exponentiation y = a^b (binary operation)
const lpowReal = binaryLinker([
    nsf.pow, // y = a^b
    (Y, B) => {
        // a = y^(1/b)
        if (Y.isEmpty() || B.isEmpty()) return nsf.EMPTY;
        if (Y.equalsSingle(0, 0) && B.equalsSingle(0, 0)) return nsf.EMPTY;

        if (B.contains(0) && Y.contains(1)) return nsf.FULL;
        if (B.equalsSingle(0, 0)) return nsf.EMPTY;

        const base = nsf.pow(Y, nsf.div(nsf.single(1, 1), B));
        if (Y.contains(0)) return nsf.union([nsf.single(0, 0), base]);

        return base;
    },

    (Y, A) => {
        // b = ln(y) / ln(a)
        if (Y.isEmpty() || A.isEmpty()) return nsf.EMPTY;
        if (A.contains(1) && Y.contains(1)) return nsf.FULL;
        if (A.equalsSingle(1, 1)) return nsf.EMPTY;
        if (Y.equalsSingle(1, 1)) return nsf.single(0, 0);
        if (Y.contains(0) && A.contains(0)) return nsf.FULL;
        if (Y.equalsSingle(0, 0) || A.equalsSingle(0, 0)) return nsf.EMPTY;

        const logs = nsf.div(nsf.log(Y), nsf.log(A));
        if (Y.contains(1)) return nsf.union([nsf.single(0, 0), logs]);
        return logs;
    },
]);

const lsqrt = unaryLinker([nsf.sqrt, (Y) => nsf.powInt(Y, 2)]);
const llog = unaryLinker([nsf.log, nsf.exp]);
const lexp = unaryLinker([nsf.exp, nsf.log]);
const labs = unaryLinker([nsf.abs, (Y) => nsf.union([Y, nsf.neg(Y)])]);

const lcos = unaryLinker([
    nsf.cos,
    (Y) => {
        const kspace = nsf.union([
            nsf.single(-2),
            nsf.single(-1),
            nsf.single(0),
            nsf.single(1),
            nsf.single(2),
        ]);
        return nsf.add(nsf.acos(Y), nsf.mul(nsf.single(Math.PI), kspace));
    },
]);

const lsin = unaryLinker([
    nsf.sin,
    (Y) => {
        // restricted version of the true inverse of y = sin(x) which is
        // x = arcsin(y) + k*pi where k is any integer
        const kspace = nsf.union([
            nsf.single(-2),
            nsf.single(-1),
            nsf.single(0),
            nsf.single(1),
            nsf.single(2),
        ]);
        return nsf.add(nsf.asin(Y), nsf.mul(nsf.single(Math.PI), kspace));
    },
]);

const ltan = unaryLinker([nsf.tan, nsf.atan]);

export const linkers = {
    lconst,
    ladd,
    lsub,
    lmul,
    ldiv,
    lneg,
    lpowInt,
    lpowReal,
    lsqrt,
    lexp,
    llog,
    labs,
    lcos,
    lsin,
    ltan,
};
