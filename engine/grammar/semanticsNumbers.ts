import numbersGrammar from "./numbers.ohm-bundle.js";
import { BidiError, SyntaxError } from "../core/errors.ts";

import * as ohm from "ohm-js";
import { Result, ok, err } from "neverthrow";

const semanticsNumbers = numbersGrammar.createSemantics();

export type NumbersResult = Result<number, ohm.MatchResult>;

semanticsNumbers.addOperation("eval", {
    UnaryExp_pos(_, arg): number {
        return arg.eval();
    },
    UnaryExp_neg(_, arg): number {
        return -arg.eval();
    },
    number(digits: ohm.NonterminalNode): number {
        return parseFloat(digits.sourceString);
    },
});

export function parseNumber(formula: string): NumbersResult {
    const match = numbersGrammar.match(formula);
    if (match.failed()) {
        return err(match);
    }

    const adapter = semanticsNumbers(match);
    const value: number = adapter.eval();

    return ok(value);
}
