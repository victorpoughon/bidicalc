import { describe, it } from "node:test";
import assert from "node:assert";

import { Graph } from "../graph.ts";

describe("Graph", () => {
    it("fromRecord throws given an invalid record", () => {
        assert.throws(() => {
            Graph.fromRecord({
                x: ["y", "A"],
            });
        });
    });

    it("can be constructed from a Record", () => {
        const g = Graph.fromRecord({
            x: ["y", "z"],
            y: [],
            z: [],
        });

        // .nodes()
        assert.deepEqual(g.nodes(), ["x", "y", "z"]);

        // .nodeCount()
        assert.deepEqual(g.nodeCount(), 3);

        // .sucessors()
        assert.deepEqual(g.successors("x"), ["y", "z"]);
        assert.deepEqual(g.successors("y"), []);
        assert.deepEqual(g.successors("z"), []);
        assert.throws(() => {
            g.successors("F");
        });

        // .predecessors()
        assert.deepEqual(g.predecessors("x"), []);
        assert.deepEqual(g.predecessors("y"), ["x"]);
        assert.deepEqual(g.predecessors("z"), ["x"]);
        assert.throws(() => {
            g.predecessors("F");
        });

        // .sinks()
        assert.deepEqual(g.sinks().toSorted(), ["y", "z"]);

        // .sources()
        assert.deepEqual(g.sources().toSorted(), ["x"]);

        // .hasEdge()
        assert.ok(g.hasEdge("x", "y"));
        assert.ok(!g.hasEdge("y", "z"));

        // .filterNodes()
        assert.deepEqual(g.filterNodes([]), Graph.fromRecord({}));
        assert.deepEqual(g.filterNodes(["x"]), Graph.fromRecord({ x: [] }));
        assert.deepEqual(g.filterNodes(["y"]), Graph.fromRecord({ y: [] }));
        assert.deepEqual(g.filterNodes(["x", "y"]), Graph.fromRecord({ x: ["y"], y: [] }));
        assert.deepEqual(g.filterNodes(["x", "y", "z"]), g);

        // .withoutNodes()
        assert.deepEqual(g.withoutNodes([]), g);
        assert.deepEqual(g.withoutNodes(["x"]), Graph.fromRecord({ y: [], z: [] }));
        assert.deepEqual(g.withoutNodes(["y"]), Graph.fromRecord({ x: ["z"], z: [] }));
        assert.deepEqual(g.withoutNodes(["x", "y"]), Graph.fromRecord({ z: [] }));
        assert.deepEqual(g.withoutNodes(["x", "y", "z"]), Graph.fromRecord({}));

        // .toString()
        assert.doesNotThrow(() => g.toString());
    });

    // sinks
    // nodeCount
});
