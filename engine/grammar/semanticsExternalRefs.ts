import bidicalcGrammar from "./bidicalc.ohm-bundle.js";
import * as ohm from "ohm-js";
import { BidiError, SyntaxError } from "../core/errors.ts";

import { Result, ok, err } from "neverthrow";

const semanticsExternalRefs = bidicalcGrammar.createSemantics();

// TODO might be better to store external refs using Set because order is not
// part of the identity of ExternalRefs model

// The "refs" semantic constructs an object
// that contains the set of external references of a cell formula:
export type ExternalRefs = {
    singles: Array<string>;
    functions: Array<string>;
};

export type ExternalRefsResult = Result<ExternalRefs, BidiError>;

export function norefs(): ExternalRefs {
    return {
        singles: [],
        functions: [],
    };
}

export function noExternalCellRefs(refs: ExternalRefs) {
    return refs.singles.length === 0;
}

// Return the name of a cell ref from a non empty set
export function firstCellRef(refs: ExternalRefs) {
    if (refs.singles.length > 0) {
        return refs.singles[0];
    } else {
        throw Error("firstCellRef called with no cell refs");
    }
}

semanticsExternalRefs.addOperation("refs", {
    CellRef_single(addr1): ExternalRefs {
        return {
            singles: [addr1.sourceString],
            functions: [],
        };
    },
    FunctionExp(name: ohm.Node, _arg1, args: ohm.Node, _arg3): ExternalRefs {
        const refs = args.children.map((c) => c.refs());
        return {
            singles: refs.flatMap((r) => r.singles),
            functions: refs.flatMap((r) => r.functions).concat([name.sourceString]),
        };
    },
    _nonterminal(...args: ohm.Node[]): ExternalRefs {
        const refs = args.map((c) => c.refs());
        return {
            singles: refs.flatMap((r) => r.singles),
            functions: refs.flatMap((r) => r.functions),
        };
    },
    _terminal(): ExternalRefs {
        return { singles: [], functions: [] };
    },
    _iter(...args: ohm.Node[]): ExternalRefs {
        const refs = args.map((c) => c.refs());
        return {
            singles: refs.flatMap((r) => r.singles),
            functions: refs.flatMap((r) => r.functions),
        };
    },
});

export function constructExternalRefs(formula: string): ExternalRefsResult {
    const match = bidicalcGrammar.match(formula);
    if (match.failed()) {
        return err(new SyntaxError(formula, match));
    }

    const adapter = semanticsExternalRefs(match);
    const refs: ExternalRefs = adapter.refs();

    // Remove duplicate refs (Set keeps insertion order)
    refs.singles = Array.from(new Set(refs.singles));
    refs.functions = Array.from(new Set(refs.functions));

    // The order of refs is the parse order
    // Could add a sort step if necessary
    return ok(refs);
}

export function composeExternalRefs(
    base: ExternalRefs,
    ref: string,
    bind: ExternalRefs,
): ExternalRefs {
    // Singles: Remove bound reference and add the new ones
    const singles = new Set(base.singles);
    singles.delete(ref);
    bind.singles.forEach((ref) => singles.add(ref));

    // Functions: add functions from the bound model
    const functions = new Set(base.functions);
    bind.functions.forEach((f) => functions.add(f));

    return {
        singles: Array.from(singles),
        functions: Array.from(functions),
    };
}
