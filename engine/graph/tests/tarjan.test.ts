import { describe, it } from "node:test";
import assert from "node:assert";

import { Graph } from "../graph.ts";
import { tarjan } from "../tarjan.ts";

// A helper that sorts components and their contents
function sorted(cmpts: string[][]) {
    return cmpts.map((cmpt) => cmpt.sort()).sort((a, b) => a[0].localeCompare(b[0]));
}

describe("Graph: tarjan()", () => {
    it("returns an empty array for an empty graph", () => {
        assert.deepEqual(tarjan(Graph.fromRecord({})), []);
    });

    it("returns singletons for nodes not in a strongly connected component", () => {
        var g = Graph.fromRecord({
            a: [],
            b: [],
            c: [],
            d: ["c"],
        });

        assert.deepEqual(sorted(tarjan(g)), [["a"], ["b"], ["c"], ["d"]]);
    });

    it("returns a single component for a cycle of 1 edge", () => {
        var g = Graph.fromRecord({ a: ["b"], b: ["a"] });

        assert.deepEqual(sorted(tarjan(g)), [["a", "b"]]);
    });

    it("returns a single component for a triangle", function () {
        var g = Graph.fromRecord({
            a: ["b"],
            b: ["c"],
            c: ["a"],
        });

        assert.deepEqual(sorted(tarjan(g)), [["a", "b", "c"]]);
    });

    it("can find multiple components", function () {
        var g = Graph.fromRecord({
            a: ["b"],
            b: ["a"],
            c: ["d"],
            d: ["e"],
            e: ["c"],
            f: [],
        });

        assert.deepEqual(sorted(tarjan(g)), [["a", "b"], ["c", "d", "e"], ["f"]]);
    });
});
