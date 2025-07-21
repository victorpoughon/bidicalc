import bidicalcGrammar from "../grammar/bidicalc.ohm-bundle.js";
import type { BIDICALCSemantics } from "../grammar/bidicalc.ohm-bundle.js";
import { BidiError, SyntaxError, UnknownFunction, ArityError } from "../core/errors.ts";
import * as ohm from "ohm-js";
import * as nsf from "not-so-float";
import { Result, ok, err } from "neverthrow";
import {
    ExternalNsfFunctionRegistry,
    bidiCalcExternalNsfFunctionsRegistry,
} from "./externalFunctionsNsfModel.ts";

// A lookup is a function that fetches external references
export type NsfLookup = (ref: string) => nsf.Union;

// A model is a function that evaluates a bidicalc expression into a union,
// given a context of external references (the lookup).
export type NsfModel = (lookup: NsfLookup) => nsf.Union;

export type NsfModelResult = Result<NsfModel, BidiError>;

export const lookupError = (ref: string): never => {
    throw new Error(`Lookup error '${ref}'`);
};

// lookup to use when there are no references
export const neverLookup: NsfLookup = (ref: string) => {
    throw new Error(`neverLookup called with '${ref}' (this should never happen)`);
};

// Prefer this to .evalFuncUntyped() for stronger typing
function nsfeval(arg: ohm.Node): NsfModelResult {
    return arg.evalFuncUntyped();
}

// The identity semantic action
// Can't use the default from ohm-js here because we need to pass lookup
function idEvalFunc(arg: ohm.NonterminalNode): NsfModelResult {
    return nsfeval(arg);
}

// Make a semantic action for a unary operator
function unaryOperator(nsffunc: (a: nsf.Union) => nsf.Union) {
    return (_: ohm.TerminalNode, arg: ohm.NonterminalNode): NsfModelResult => {
        const arg_result = nsfeval(arg);
        return arg_result.map((model) => (lookup: NsfLookup) => nsffunc(model(lookup)));
    };
}

// Generic semantic action for a binary operator
function binaryOperator(nsffunc: (a: nsf.Union, b: nsf.Union) => nsf.Union) {
    return (
        arg0: ohm.NonterminalNode,
        _: ohm.TerminalNode,
        arg1: ohm.NonterminalNode
    ): NsfModelResult => {
        const arg0_result = nsfeval(arg0);
        const arg1_result = nsfeval(arg1);

        return Result.combine([arg0_result, arg1_result]).map(
            ([model0, model1]) =>
                (lookup: NsfLookup) => {
                    return nsffunc(model0(lookup), model1(lookup));
                }
        );
    };
}

function isStringInteger(str: string): boolean {
    return /^-?\d+$/.test(str);
}

function makeSemanticsEvalTf(fregistry: ExternalNsfFunctionRegistry): BIDICALCSemantics {
    const sem = bidicalcGrammar.createSemantics();

    sem.addOperation("evalFuncUntyped", {
        AddExp_plus: binaryOperator(nsf.add),
        AddExp_minus: binaryOperator(nsf.sub),
        MulExp_times: binaryOperator(nsf.mul),
        MulExp_divide: binaryOperator(nsf.div),

        ExpExp_power(
            baseArg: ohm.NonterminalNode,
            _1: ohm.TerminalNode,
            exponentArg: ohm.NonterminalNode
        ): NsfModelResult {
            if (isStringInteger(exponentArg.sourceString)) {
                const exp = parseInt(exponentArg.sourceString);
                return unaryOperator((u) => nsf.powInt(u, exp))(_1, baseArg);
            } else {
                return binaryOperator(nsf.pow)(baseArg, _1, exponentArg);
            }
        },

        PriExp_paren(
            _0: ohm.TerminalNode,
            exp: ohm.NonterminalNode,
            _1: ohm.TerminalNode
        ): NsfModelResult {
            return nsfeval(exp);
        },

        UnaryExp_pos: unaryOperator((a) => a),
        UnaryExp_neg: unaryOperator(nsf.neg),

        CellRef_single(identifier: ohm.NonterminalNode): NsfModelResult {
            return ok((lookup: NsfLookup) => lookup(identifier.sourceString));
        },

        FunctionExp(
            name: ohm.IterationNode,
            _1: ohm.TerminalNode,
            args: ohm.NonterminalNode,
            _3: ohm.TerminalNode
        ): NsfModelResult {
            // Evaluate all children
            const args_results = args.asIteration().children.map((c) => nsfeval(c));

            // Get function from the registry
            const externalFunction = fregistry(name.sourceString);

            // Check function exists
            if (externalFunction === null) {
                return err(new UnknownFunction(name.sourceString));
            }

            // Check arity
            const arity = args.asIteration().numChildren;
            if (!externalFunction.checkArity(arity)) {
                return err(new ArityError(name.sourceString, externalFunction.arityText, arity));
            }

            return Result.combine(args_results).map((models) => (lookup: NsfLookup) => {
                const tensors = models.map((m) => m(lookup));
                return externalFunction.nsffunc(...tensors);
            });
        },

        number(digits: ohm.NonterminalNode): NsfModelResult {
            // Could do prev() next() here for an overflow safe model
            return ok((_: NsfLookup) => nsf.single(parseFloat(digits.sourceString)));
        },
    });
    return sem;
}

export function constructNsfModel(
    formula: string,
    fregistry?: ExternalNsfFunctionRegistry
): NsfModelResult {
    fregistry ??= bidiCalcExternalNsfFunctionsRegistry;
    const match = bidicalcGrammar.match(formula);
    if (match.failed()) {
        return err(new SyntaxError(formula, match));
    }

    const sem = makeSemanticsEvalTf(fregistry);
    return sem(match).evalFuncUntyped();
}

// Bind a reference in a nsf model to another model (i.e. compose models)
export function composeNsfModel(model: NsfModel, refName: string, bind: NsfModel): NsfModel {
    return (lookup: NsfLookup) => {
        // Compute value of the bound reference
        const value = bind(lookup);

        // Augment the lookup function given to model with x evaled
        const l = (ref: string) => (refName === ref ? value : lookup(ref));

        return model(l);
    };
}

// Bind multiple references
export function composeNsfModelRecord(model: NsfModel, binds: Record<string, NsfModel>) {
    return (lookup: NsfLookup) => {
        // Compute value of bound references
        const values = Object.fromEntries(Object.entries(binds).map(([n, m]) => [n, m(lookup)]));

        // Augment the lookup function given to the model with bound eval results
        const l = (ref: string) => (ref in values ? values[ref] : lookup(ref));

        return model(l);
    };
}

// Chained composition: bind multiple reference in order and iteratively
export function composeNsfModelList(model: NsfModel, binds: [string, NsfModel][]): NsfModel {
    let working = model;
    for (const [ref, bind] of binds) {
        working = composeNsfModel(working, ref, bind);
    }
    return working;
}
