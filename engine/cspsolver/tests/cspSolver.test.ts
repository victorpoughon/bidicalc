import { describe, it } from "node:test";
import assert from "node:assert";

import * as nsf from "not-so-float";

import {
    expect,
    plusorminus,
    approx10,
    sqrt,
    defaultDomain,
    zero,
    one,
} from "./cspSolverTestCommon.ts";

// TODO test with Union as init
// TODO test with non zero goal

describe("static contractor loop, single variable", () => {
    // 1 epoch, full start
    expect("x", 0, 1, { x: nsf.FULL }, { x: nsf.single(0) });
    expect("x - 10", 0, 1, { x: nsf.FULL }, { x: nsf.single(10) });
    expect("2*x", 0, 1, { x: nsf.FULL }, { x: nsf.single(0) });
    expect("x^2", 0, 1, { x: nsf.FULL }, { x: nsf.single(0) });

    // 1 epoch: half open start
    expect("x+x", 0, 1, { x: nsf.single(0, Infinity) }, { x: nsf.single(0) });
    expect("2*x+x", 0, 1, { x: nsf.single(0, Infinity) }, { x: nsf.single(0) });
    expect("x+(x+1)", 0, 1, { x: nsf.single(0, Infinity) }, { x: nsf.EMPTY });
    expect("x+(x+1)", 0, 1, { x: nsf.single(-Infinity, 0) }, { x: nsf.single(-1, 0) });

    // 2 epochs: full start
    expect("x^2 - 1", 0, 2, { x: nsf.FULL }, { x: nsf.union([nsf.interval(1), nsf.interval(-1)]) });
    expect("x^2 - 100000", 0, 2, { x: nsf.FULL }, { x: plusorminus(approx10(sqrt(100000))) });
    expect("2*x + 10", 0, 2, { x: nsf.FULL }, { x: nsf.single(-5.1, -4.9) });

    // 3 epochs
    expect("1/(x+1)+1", 0, 3, { x: nsf.single(-Infinity, 0) }, { x: nsf.single(-2.1, -1.9) });
    expect("1/(x+1)+1", 0, 3, { x: nsf.single(0, Infinity) }, { x: nsf.EMPTY });
    expect(
        "(x+1)^2 - 101",
        0,
        3,
        { x: nsf.FULL },
        { x: nsf.union([nsf.interval(-11.5, -10.5), nsf.interval(8.5, 9.5)]) }
    );

    // More difficult cases
    expect("x^2 + x", 0, 3, { x: nsf.single(0, 1000) }, { x: nsf.single(0) });
    expect("x^2 + x", 0, 5, { x: nsf.single(-1000, 0) }, { x: nsf.single(-2, 0) });
    expect("x^2 - x", 0, 5, { x: nsf.single(-10, 10) }, { x: nsf.single(-1, 2) });

    expect("x^2 - x - 1", 0, 5, { x: nsf.single(0, 1000) }, { x: nsf.single(0, 3) });
    expect("x^2 - x - 1", 0, 5, { x: nsf.single(-1000, 0) }, { x: nsf.single(-3, 0) });

    expect("x^2 - 2*x + 1", 0, 10, { x: nsf.single(-1e10, 1e10) }, { x: nsf.single(-10, 10) });

    expect("x^2 - 2*x - 15", 0, 10, { x: nsf.single(-1e10, 1e10) }, { x: nsf.single(-10, 10) });
    expect(
        "x^2 - 2*x - 15",
        0,
        10,
        { x: nsf.single(-5.005826386282812, -4.864197375589832) },
        { x: nsf.EMPTY }
    );

    // This expression produces an exponential number of disjoint intervals per node after 15-ish iterations
    expect("x^2 - 2*x + 1", 16, 15, { x: nsf.single(-1e10, 1e10) }, { x: nsf.single(-10, 10) });

    // Real exponentiation
    expect("x^(1/3)", 0, 5, { x: nsf.FULL }, { x: nsf.single(0, 0) });
    expect("x^(1/3)", 1, 5, { x: nsf.FULL }, { x: nsf.single(1, 1) });
    expect("2^x", 1, 10, { x: nsf.single(0, 1e10) }, { x: nsf.single(0, 0) });
    expect("2^x", 1000, 10, { x: nsf.single(0, 1e10) }, { x: nsf.single(9, 10) });

    // Real exponentiation to zero
    expect("x^(0.0)", 1, 1, { x: defaultDomain }, { x: defaultDomain });
    expect("x^(0.0)", 0, 1, { x: defaultDomain }, { x: nsf.EMPTY });
    expect("x^(1.0)", 1, 1, { x: defaultDomain }, { x: one });
    expect("x^(1.0)", 0, 1, { x: defaultDomain }, { x: zero });

    // Real exponentiation: special cases for the value of the base
    expect("1^x", 1, 1, { x: defaultDomain }, { x: defaultDomain });
    expect("1^x", 0, 1, { x: defaultDomain }, { x: nsf.EMPTY });
    expect("0^x", 0, 1, { x: defaultDomain }, { x: defaultDomain });
    expect("0^x", 1, 1, { x: defaultDomain }, { x: zero });

    expect("(x^2 - 4)^2 + (x+2)^2", 0, 3, { x: defaultDomain }, { x: nsf.single(-2, -2) });
    expect("(x^2 - 4)^2 + (x+2)^2", 10, 3, { x: defaultDomain }, { x: nsf.single(-5, 5) });

    // should contract to empty
    expect("(x^2 - 4)^2 + (x+2)^2", 10, 5, { x: nsf.single(1, 1) }, { x: nsf.EMPTY });
    expect("(x^2 - 4)^2 + (x+2)^2", 10, 5, { x: nsf.single(1.01, 1.01) }, { x: nsf.EMPTY });
    expect(
        "(x^2 - 4)^2 + (x+2)^2",
        10,
        5,
        { x: nsf.single(1.0146847374711236, 1.0146847374711239) },
        { x: nsf.EMPTY }
    );

    // integral exponentiation to zero
    expect("x^0", 1, 3, { x: defaultDomain }, { x: defaultDomain });
    expect("x^0", 0, 3, { x: defaultDomain }, { x: nsf.EMPTY });
});

describe("static contractor loop, multiple variables", () => {
    expect(
        "x^2 + y^2 - 1",
        0,
        3,
        { x: nsf.single(-Infinity, Infinity), y: nsf.single(-Infinity, Infinity) },
        { x: nsf.single(-1, 1), y: nsf.single(-1, 1) }
    );

    expect(
        "x^2 + y^2 + z^2 - 1",
        0,
        4,
        {
            x: nsf.single(-Infinity, Infinity),
            y: nsf.single(-Infinity, Infinity),
            z: nsf.single(-Infinity, Infinity),
        },
        { x: nsf.single(-1, 1), y: nsf.single(-1, 1), z: nsf.single(-1, 1) }
    );

    expect(
        "x+y+x+y",
        0,
        3,
        { x: nsf.single(0, Infinity), y: nsf.single(0, Infinity) },
        { x: nsf.single(0), y: nsf.single(0) }
    );

    expect(
        "x^2 + 50*y",
        10,
        5,
        { x: nsf.single(0, 100), y: nsf.single(0, 100) },
        { x: nsf.single(0, 10), y: nsf.single(0, 10) }
    );

    expect(
        "a*b",
        -10,
        3,
        { a: nsf.single(5, 100), b: nsf.single(5, 100) },
        { a: nsf.EMPTY, b: nsf.EMPTY }
    );

    expect(
        "a*b",
        10,
        3,
        { a: nsf.single(5, 100), b: nsf.single(5, 100) },
        { a: nsf.EMPTY, b: nsf.EMPTY }
    );

    expect(
        "a*b",
        -10,
        2,
        { a: nsf.single(0, 0.000017763568394002505), b: nsf.single(0, 0.00003552713678800501) },
        { a: nsf.EMPTY, b: nsf.EMPTY }
    );

    expect(
        "a/b",
        -10,
        2,
        { a: nsf.single(0, 0.1), b: nsf.single(0, 0.01) },
        { a: nsf.EMPTY, b: nsf.EMPTY }
    );
});

describe("external functions", () => {
    const approx = (x: number) => nsf.single(x - 0.0001, x + 0.0001);

    // zeroary
    expect("x - pi()", 0, 2, { x: defaultDomain }, { x: approx(Math.PI) });

    // unary: sqrt
    expect("x - sqrt(4)", 0, 2, { x: defaultDomain }, { x: approx(2) });
    expect("4 - sqrt(x)", 0, 2, { x: defaultDomain }, { x: approx(16) });
    expect("sqrt(x - 2)", 0, 2, { x: defaultDomain }, { x: approx(2) });
    expect("sqrt(-1) + x", 0, 2, { x: defaultDomain }, { x: nsf.EMPTY });

    // unary: log and exp
    expect("exp(x)", 1, 2, { x: defaultDomain }, { x: approx(0) });
    expect("exp(ln(x))", 1, 2, { x: defaultDomain }, { x: approx(1) });
    expect("exp(log(x))", 1, 2, { x: defaultDomain }, { x: approx(1) });
    expect("ln(exp(x))", 1, 2, { x: defaultDomain }, { x: approx(1) });
    expect("ln(x)", -100, 2, { x: defaultDomain }, { x: approx(Math.exp(-100)) });
    expect("abs(x)", 1, 1, { x: defaultDomain }, { x: nsf.union([nsf.single(-1), nsf.single(1)]) });

    // unary: trigonometric functions
    // TODO figure out how to test trig function which return unions
    // expect("cos(x)", 0, 2, { x: defaultDomain }, { x: approx(1) });
    // expect("sin(x)", 0, 2, { x: defaultDomain }, { x: approx(0) });
    // expect("tan(x)", 0, 2, { x: defaultDomain }, { x: approx(0) });
});
