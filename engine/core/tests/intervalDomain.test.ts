import { describe, it } from "node:test";
import assert from "node:assert";

import { IntervalDomain, splitIntervalDomain } from "../intervalDomain.ts";

import * as nsf from "not-so-float";

describe("IntervalDomain", () => {
    it("splitIntervalDomain", () => {
        const d = IntervalDomain.fromRecord({
            x: nsf.interval(1, 2),
            y: nsf.interval(100, 200),
        });

        const [a, b] = splitIntervalDomain(d, "x");

        assert.deepEqual(
            a,
            IntervalDomain.fromRecord({
                x: nsf.interval(1, 1.5),
                y: nsf.interval(100, 200),
            }),
        );

        assert.deepEqual(
            b,
            IntervalDomain.fromRecord({
                x: nsf.interval(1.5, 2),
                y: nsf.interval(100, 200),
            }),
        );
    });
});
