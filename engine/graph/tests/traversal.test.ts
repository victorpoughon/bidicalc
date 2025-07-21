import { describe, it } from "node:test";
import assert from "node:assert";

import { Graph } from "../graph.ts";
import { preorder, postorder, reachableDownstream } from "../traversal.ts";

describe("Graph preorder() and postorder()", () => {
    it("works with empty input nodes", () => {
        const g = Graph.fromRecord({ a: ["b", "c"], b: ["d"], c: ["d"], d: ["e"], e: [] });
        assert.deepEqual(preorder(g, []), []);
        assert.deepEqual(postorder(g, []), []);
    });

    it("returns the root for a singleton graph", () => {
        const g = Graph.fromRecord({ a: [] });
        assert.deepEqual(preorder(g, ["a"]), ["a"]);
        assert.deepEqual(postorder(g, ["a"]), ["a"]);
    });

    it("visits each node in the graph once", () => {
        const g = Graph.fromRecord({ a: ["b", "c"], b: ["d"], c: ["d"], d: ["e"], e: [] });
        assert.deepEqual(preorder(g, ["a"]), ["a", "b", "d", "e", "c"]);
        assert.deepEqual(postorder(g, ["a"]), ["e", "d", "b", "c", "a"]);
    });

    it("works for a tree #1", () => {
        const g = Graph.fromRecord({ a: ["b", "c"], b: [], c: ["d", "e"], d: [], e: [] });
        assert.deepEqual(preorder(g, ["a"]), ["a", "b", "c", "d", "e"]);
        assert.deepEqual(postorder(g, ["a"]), ["b", "d", "e", "c", "a"]);
    });

    it("works for a tree #2", () => {
        const g = Graph.fromRecord({
            f: ["b", "g"],
            b: ["a", "d"],
            a: [],
            d: ["c", "e"],
            c: [],
            e: [],
            h: [],
            g: ["i"],
            i: ["h"],
        });
        assert.deepEqual(preorder(g, ["f"]), ["f", "b", "a", "d", "c", "e", "g", "i", "h"]);
        assert.deepEqual(postorder(g, ["f"]), ["a", "c", "e", "d", "b", "h", "i", "g", "f"]);
    });

    it("works for an array of roots", () => {
        const g = Graph.fromRecord({ a: ["b"], b: [], c: ["d"], d: [], e: [], f: [] });
        assert.deepEqual(preorder(g, ["a", "b", "c", "e"]), ["a", "b", "c", "d", "e"]);
        assert.deepEqual(postorder(g, ["a", "b", "c", "e"]), ["b", "a", "d", "c", "e"]);
    });

    it("works for multiple connected roots", () => {
        const g = Graph.fromRecord({ a: ["b", "c"], b: [], c: [], d: ["c"] });
        assert.deepEqual(preorder(g, ["a", "d"]), ["a", "b", "c", "d"]);
        assert.deepEqual(postorder(g, ["a", "d"]), ["b", "c", "a", "d"]);
    });

    it("works with cycles #1", () => {
        const g = Graph.fromRecord({ a: ["b"], b: ["c"], c: ["a"] });
        assert.deepEqual(preorder(g, ["a"]), ["a", "b", "c"]);
        assert.deepEqual(postorder(g, ["a"]), ["c", "b", "a"]);
    });

    it("works with cycles #2", () => {
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
        assert.deepEqual(preorder(g, ["a"]), ["a", "b"]);
        assert.deepEqual(postorder(g, ["a"]), ["b", "a"]);

        assert.deepEqual(preorder(g, ["a", "c"]), ["a", "b", "c", "d", "e"]);
        assert.deepEqual(postorder(g, ["a", "c"]), ["b", "a", "e", "d", "c"]);

        assert.deepEqual(preorder(g, ["f"]), ["f", "g"]);
        assert.deepEqual(postorder(g, ["f"]), ["g", "f"]);

        assert.deepEqual(preorder(g, ["g"]), ["g"]);
        assert.deepEqual(postorder(g, ["g"]), ["g"]);
    });

    it("throws if root is not in the graph", () => {
        const g = Graph.fromRecord({ a: [] });
        assert.throws(() => {
            preorder(g, ["b"]);
        });
        assert.throws(() => {
            postorder(g, ["b"]);
        });
    });
});
