import { describe, it } from "node:test";
import assert from "node:assert";

import { UserInput } from "../userInput.ts";
import { makeUserInput } from "../processUserInput.ts";

function expect(input: string, expectedUserInput: UserInput) {
    const actualUserInput = makeUserInput(input);
    assert.deepEqual(actualUserInput, expectedUserInput);
}

function expectKind(kind: string, input: string) {
    const actualUserInput = makeUserInput(input);
    assert.deepEqual(actualUserInput.kind, kind);
}

describe("makeUserInput", () => {
    // Empty
    expect("", UserInput.Empty());
    expect("   ", UserInput.Empty());

    // Text
    expect('"Hello world!"', UserInput.Text("Hello world!"));

    // Number
    expect("5.5", UserInput.Number(5.5));
    expect("-5.0", UserInput.Number(-5.0));
    expect("+5.0", UserInput.Number(5.0));

    // Constant
    expect("#5", UserInput.Constant(5));
    expect("#+5", UserInput.Constant(5));
    expect("# + 5", UserInput.Constant(5));
    expect("#-5", UserInput.Constant(-5));
    expect("# -5", UserInput.Constant(-5));

    // Variable
    expect("~5", UserInput.Variable(5));
    expect("~+5", UserInput.Variable(5));
    expect("~ + 5", UserInput.Variable(5));
    expect("~-5", UserInput.Variable(-5));
    expect("~ -5", UserInput.Variable(-5));

    // Formula
    // Only check for kind because deep testing of parsing and models is tested elsewhere
    expectKind("Formula", "x+y");
    expectKind("Formula", "=x+y");
    expectKind("Formula", "log(10)");
    expectKind("Formula", "=log(10)");
    expectKind("Formula", " =  log(10)");

    // Error
    expectKind("Error", "#foo");
    expectKind("Error", "~foo");
    expectKind("Error", "=++");
});
