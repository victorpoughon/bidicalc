import { describe, it } from "node:test";
import assert from "node:assert";

import { Graph } from "../graph.ts";
import { findCycles } from "../findCycles.ts";

describe("Graph: findCycles()", () => {
    it("returns an empty array for an empty graph", () => {
        assert.deepEqual(findCycles(Graph.fromRecord({})), []);
    });

    it("returns an empty array if the graph has no cycles", () => {
        const g = Graph.fromRecord({ a: ["b"], b: ["c"], c: [] });
        assert.deepEqual(findCycles(g), []);
    });

    it("returns a single entry for a cycle of 1 node", () => {
        const g = Graph.fromRecord({ a: ["a"] });
        assert.deepEqual(sort(findCycles(g)), [["a"]]);
    });

    it("returns a single entry for a cycle of 2 nodes", () => {
        const g = Graph.fromRecord({ a: ["b"], b: ["a"] });
        assert.deepEqual(sort(findCycles(g)), [["a", "b"]]);
    });

    it("returns a single entry for a triangle", () => {
        const g = Graph.fromRecord({ a: ["b"], b: ["c"], c: ["a"] });
        assert.deepEqual(sort(findCycles(g)), [["a", "b", "c"]]);
    });

    it("returns multiple entries for multiple cycles", () => {
        const g = Graph.fromRecord({
            a: ["b"],
            b: ["a"],
            c: ["d"],
            d: ["e"],
            e: ["c"],
            f: ["g"],
            g: ["g"],
            h: [],
        });
        assert.deepEqual(sort(findCycles(g)), [["a", "b"], ["c", "d", "e"], ["g"]]);
    });

    it("works for figure 8 cycle", () => {
        const g = Graph.fromRecord({
            a: ["b", "d"],
            b: ["c"],
            c: ["a"],
            d: ["e"],
            e: ["a"],
        });

        assert.deepEqual(sort(findCycles(g)), [["a", "b", "c", "d", "e"]]);
    });
});

// A helper that sorts components and their contents
function sort(cmpts: string[][]) {
    return cmpts.map((cmpt) => cmpt.sort()).sort((a, b) => a[0].localeCompare(b[0]));
}
