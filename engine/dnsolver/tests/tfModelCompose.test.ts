import { describe, it } from "node:test";
import assert from "node:assert";

import {
    constructTfModel,
    TfModel,
    neverLookup,
    composeTfModelList,
} from "../semanticsTfModel.ts";

import { Result } from "neverthrow";

function expectChainedCompose(
    initialModelExpr: string,
    binds: [string, string][],
    expectedResult: number,
) {
    // Construct initial model
    const initialModelResult = constructTfModel(initialModelExpr);
    assert.ok(initialModelResult.isOk(), "Initial model invalid");
    if (initialModelResult.isErr()) return;
    const initialModel = initialModelResult.value;

    // Construct all intermediate models
    const bindModelsResults = binds.map(([ref, expr]) => constructTfModel(expr));
    const bindModelsCombined = Result.combine(bindModelsResults);
    assert.ok(bindModelsCombined.isOk(), "Intermediate bind model invalid");
    if (bindModelsCombined.isErr()) return;
    const bindModels = bindModelsCombined.value;

    // Compose models
    const modelBinds: [string, TfModel][] = [...Array(binds.length).keys()].map((i) => [
        binds[i][0],
        bindModels[i],
    ]);
    const composedModel = composeTfModelList(initialModel, modelBinds);

    // Evaluate the composed model
    const resultTensor = composedModel(neverLookup);
    const result = resultTensor.dataSync()[0];

    assert.deepEqual(result, expectedResult, "Composed model result does match expected result");
}

describe("compose tf models", () => {
    it("can be chained composed", () => {
        expectChainedCompose(
            "A*B",
            [
                ["A", "X+1"],
                ["B", "Y+3"],
                ["Y", "2*X"],
                ["X", "1"],
            ],
            10,
        );

        expectChainedCompose(
            "x*y + z",
            [
                ["x", "5"],
                ["y", "7"],
                ["z", "0.5"],
            ],
            35.5,
        );
    });
});
