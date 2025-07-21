import { describe, it } from "node:test";
import assert from "node:assert";

import { Graph } from "../graph.ts";
import { topsort } from "../topsort.ts";

describe("Graph: topsort()", () => {
    it("returns an empty array for an empty graph", () => {
        assert.deepEqual(topsort(Graph.fromRecord({})), []);
    });

    it("sorts nodes such that earlier nodes have directed edges to later nodes", () => {
        const g = Graph.fromRecord({ a: [], b: ["c"], c: ["a"] });
        assert.deepEqual(topsort(g), ["b", "c", "a"]);
    });

    it("works for a diamond", () => {
        const g = Graph.fromRecord({ a: ["b", "c"], b: ["d"], c: ["d"], d: [] });
        const result = topsort(g);

        assert.deepEqual(result.indexOf("a"), 0);
        assert.ok(result.indexOf("b") < result.indexOf("d"));
        assert.ok(result.indexOf("c") < result.indexOf("d"));
        assert.deepEqual(result.indexOf("d"), 3);
    });

    it("throws if there is a cycle", () => {
        assert.throws(() => {
            topsort(Graph.fromRecord({ a: ["b"], b: ["c"], c: ["a"] }));
        });
        assert.throws(() => {
            topsort(Graph.fromRecord({ a: ["b"], b: ["c", "d"], c: ["a"], d: [] }));
        });
        assert.throws(() => {
            topsort(Graph.fromRecord({ a: ["b"], b: ["c"], c: ["a"], d: [] }));
        });
    });
});
