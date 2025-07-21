import { describe, it } from "node:test";
import assert from "node:assert";

import { validGrammar } from "./grammarTestCases.ts";
import {
    constructExternalRefs,
    composeExternalRefs,
    ExternalRefs,
    ExternalRefsResult,
} from "../semanticsExternalRefs.ts";

import { setsEqual } from "../../core/utils.ts";
import { Result, ok, err } from "neverthrow";

function resultToString(result: ExternalRefsResult): string {
    return result.match(
        (ok) => `ok(${ok})`,
        (e) => `err(${e})`,
    );
}

describe("Semantics refs of valid grammar examples", () => {
    for (const str of validGrammar) {
        const refs = constructExternalRefs(str);

        assert.ok(
            refs.isOk(),
            `extractExternalRefs() not ok on valid grammar example: ${resultToString(refs)}`,
        );
    }
});

describe("extractExternalRefs", () => {
    const expect = (formula: string, expectedRefs: ExternalRefs) => {
        const actualRefs = constructExternalRefs(formula);
        assert.ok(actualRefs.isOk(), `extractExternalRefs() not ok: ${resultToString(actualRefs)}`);

        assert.deepStrictEqual(
            actualRefs,
            ok(expectedRefs),
            `Error extracting external ref from "${formula}`,
        );
    };

    expect("foo(A1, A2, 5.0)", {
        singles: ["A1", "A2"],
        functions: ["foo"],
    });

    expect("baz()", {
        singles: [],
        functions: ["baz"],
    });

    expect("qux(F4, G5, H9)", {
        singles: ["F4", "G5", "H9"],
        functions: ["qux"],
    });

    expect("inv(123, 456)", {
        singles: [],
        functions: ["inv"],
    });

    expect("mixed(A1, 5.0, pow(C3^5 + 10), E6)", {
        singles: ["A1", "C3", "E6"],
        functions: ["pow", "mixed"],
    });

    expect("mixed(A1, (Z3*5.0 + Z50), pow(C3^5 + 10), pow(C3), E6)", {
        singles: ["A1", "Z3", "Z50", "C3", "E6"],
        functions: ["pow", "mixed"],
    });

    expect("Med(a1, b2, a, b, x, y+5, ATAN2(C3^5 + 10), pow(D5), E6)", {
        singles: ["a1", "b2", "a", "b", "x", "y", "C3", "D5", "E6"],
        functions: ["ATAN2", "pow", "Med"],
    });
});

function assertExternalRefsEqual(a: ExternalRefs, b: ExternalRefs) {
    assert.ok(setsEqual(new Set(a.singles), new Set(b.singles)));
    assert.ok(setsEqual(new Set(a.functions), new Set(b.functions)));
}

describe("composeExternalRefs", () => {
    const base = {
        singles: ["x", "y", "z"],
        functions: ["foo", "bar"],
    };

    const bind = {
        singles: ["a", "b"],
        functions: ["zar", "bar"],
    };

    const composed = composeExternalRefs(base, "x", bind);

    assertExternalRefsEqual(composed, {
        singles: ["a", "b", "y", "z"],
        functions: ["foo", "zar", "bar"],
    });
});
