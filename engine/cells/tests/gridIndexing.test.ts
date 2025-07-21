import { describe, it } from "node:test";
import assert from "node:assert";

import { makeSpreadsheetGridIndexing, GridIndexing } from "../gridIndexing";

describe("grid indexing", () => {
    const gi = makeSpreadsheetGridIndexing(2, 3);
    // A1 B1 C1
    // A2 B2 C2
    assert.deepStrictEqual(gi.allRefs(), ["A1", "B1", "C1", "A2", "B2", "C2"]);
    assert.deepStrictEqual(gi.byRef("A2")?.index, 3);
    assert.deepStrictEqual(gi.byIndex(2)?.ref, "C1");
    assert.deepStrictEqual(gi.byIndex(-1), null);
    assert.deepStrictEqual(gi.byIndex(6), null);


    assert.deepStrictEqual(gi.navLeft("A1")?.ref, "C2");
    assert.deepStrictEqual(gi.navLeft("A2")?.ref, "C1");
    assert.deepStrictEqual(gi.navLeft("C1")?.ref, "B1");
    assert.deepStrictEqual(gi.navLeft("C2")?.ref, "B2");

    assert.deepStrictEqual(gi.navRight("A1")?.ref, "B1");
    assert.deepStrictEqual(gi.navRight("A2")?.ref, "B2");
    assert.deepStrictEqual(gi.navRight("C1")?.ref, "A2");
    assert.deepStrictEqual(gi.navRight("C2")?.ref, "A1");

    assert.deepStrictEqual(gi.navUp("A1")?.ref, "C2");
    assert.deepStrictEqual(gi.navUp("A2")?.ref, "A1");
    assert.deepStrictEqual(gi.navUp("C1")?.ref, "B2");
    assert.deepStrictEqual(gi.navUp("C2")?.ref, "C1");

    assert.deepStrictEqual(gi.navDown("A1")?.ref, "A2");
    assert.deepStrictEqual(gi.navDown("A2")?.ref, "B1");
    assert.deepStrictEqual(gi.navDown("C1")?.ref, "C2");
    assert.deepStrictEqual(gi.navDown("C2")?.ref, "A1");
});
