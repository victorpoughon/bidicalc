import { describe, it } from "node:test";
import assert from "node:assert";

import bidicalcGrammar from '../bidicalc.ohm-bundle.js';
import { validGrammar, invalidGrammar } from "./grammarTestCases.ts";

describe("Syntax: expected matches", () => {
  for (const str of validGrammar) {
    const matchResult = bidicalcGrammar.match(str);

    assert.deepEqual(
      matchResult.succeeded(),
      true,
      `Expected "${str}" to match the grammar.`
    );
  }
});

describe("Syntax: expected non matches", () => {
  for (const str of invalidGrammar) {
    const matchResult = bidicalcGrammar.match(str);
    assert.deepEqual(
      matchResult.succeeded(),
      false,
      `Expected "${str}" not to match the grammar.`
    );
  }
});

