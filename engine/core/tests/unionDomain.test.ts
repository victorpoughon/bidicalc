import { describe, it } from "node:test";
import assert from "node:assert";

import { UnionDomain, breakupUnionDomain } from "../unionDomain.ts";
import { IntervalDomain } from "../intervalDomain.ts";

import * as nsf from "not-so-float";

describe("UnionDomain", () => {
    it("breakupUnionDomain, trivial input", () => {
        const orig = UnionDomain.fromRecord({
            x: nsf.single(1, 2),
            y: nsf.single(100, 200),
        });

        const broken = breakupUnionDomain(orig);
        assert.deepEqual(broken.length, 1);
        assert.deepEqual(orig, UnionDomain.fromIntervalDomain(broken[0]));
    });

    it("breakupUnionDomain, disjoint input", () => {
        const orig = UnionDomain.fromRecord({
            x: nsf.union([nsf.single(1, 2), nsf.single(50, 60)]),
            y: nsf.union([nsf.single(-10, -8), nsf.single(0, 0.1)]),
        });

        const broken = breakupUnionDomain(orig);

        assert.deepEqual(broken, [
            IntervalDomain.fromRecord({
                x: nsf.interval(1, 2),
                y: nsf.interval(-10, -8),
            }),
            IntervalDomain.fromRecord({
                x: nsf.interval(1, 2),
                y: nsf.interval(0, 0.1),
            }),
            IntervalDomain.fromRecord({
                x: nsf.interval(50, 60),
                y: nsf.interval(-10, -8),
            }),
            IntervalDomain.fromRecord({
                x: nsf.interval(50, 60),
                y: nsf.interval(0, 0.1),
            }),
        ]);
    });
});
