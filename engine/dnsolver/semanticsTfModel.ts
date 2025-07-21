import bidicalcGrammar from "../grammar/bidicalc.ohm-bundle.js";
import type { BIDICALCSemantics } from "../grammar/bidicalc.ohm-bundle.js";
import {
    ExternalFunctionRegistry,
    bidiCalcExternalFunctionsRegistry,
} from "./externalFunctionsTfModel.ts";
import { BidiError, SyntaxError, UnknownFunction, ArityError } from "../core/errors.ts";

import * as ohm from "ohm-js";
import * as tf from "@tensorflow/tfjs-core";

import { Result, ok, err } from "neverthrow";

// A lookup is a function that fetches external references
export type Lookup = (ref: string) => tf.Tensor;

// A model is a function that evaluates a bidicalc expression into a tensor,
// given a context of external references (the lookup).
export type TfModel = (lookup: Lookup) => tf.Tensor;

/*
Note: lookup and model evaluation must not fail.

This is so that model evaluation can be used in a tensorflow context which
requires the operations that use variables to be inside the function f passed to
tf.variableGrads().

All possible failures of model evaluation must be checked ahead of time:
    * non-existing reference
    * ref exists but is in error state
    * ref exists but its tensor is empty
    * invalid tensor shape
*/

/*
The result of model construction

Can fail:
    * syntax error
    * unknown function
    * function arity error
*/
export type ModelResult = Result<TfModel, BidiError>;

export const lookupError = (ref: string): never => {
    throw new Error(`Lookup error '${ref}'`);
};

// lookup to use when there are no references
export const neverLookup: Lookup = (ref: string) => {
    throw new Error(`neverLookup called with '${ref}' (this should never happen)`);
};

// Prefer this to .evalFuncUntyped() for stronger typing
function tfeval(arg: ohm.Node): ModelResult {
    return arg.evalFuncUntyped();
}

// The identity semantic action
// Can't use the default from ohm-js here because we need to pass lookup
function idEvalFunc(arg: ohm.NonterminalNode): ModelResult {
    return tfeval(arg);
}

// Make a semantic action for a unary operator
function unaryOperator(tffunc: (a: tf.Tensor) => tf.Tensor) {
    return (_: ohm.TerminalNode, arg: ohm.NonterminalNode): ModelResult => {
        const arg_result = tfeval(arg);
        return arg_result.map((model) => (lookup: Lookup) => tffunc(model(lookup)));
    };
}

// Generic semantic action for a binary operator
function binaryOperator(tffunc: (a: tf.Tensor, b: tf.Tensor) => tf.Tensor) {
    return (
        arg0: ohm.NonterminalNode,
        _: ohm.TerminalNode,
        arg1: ohm.NonterminalNode
    ): ModelResult => {
        const arg0_result = tfeval(arg0);
        const arg1_result = tfeval(arg1);

        return Result.combine([arg0_result, arg1_result]).map(
            ([model0, model1]) =>
                (lookup: Lookup) => {
                    return tffunc(model0(lookup), model1(lookup));
                }
        );
    };
}

function makeSemanticsEvalTf(fregistry: ExternalFunctionRegistry): BIDICALCSemantics {
    const sem = bidicalcGrammar.createSemantics();

    sem.addOperation("evalFuncUntyped", {
        AddExp_plus: binaryOperator(tf.add),
        AddExp_minus: binaryOperator(tf.sub),
        MulExp_times: binaryOperator(tf.mul),
        MulExp_divide: binaryOperator(tf.div),
        ExpExp_power: binaryOperator(tf.pow),

        PriExp_paren(
            _0: ohm.TerminalNode,
            exp: ohm.NonterminalNode,
            _1: ohm.TerminalNode
        ): ModelResult {
            return tfeval(exp);
        },

        UnaryExp_pos: unaryOperator((a) => a),
        UnaryExp_neg: unaryOperator(tf.neg),

        CellRef_single(identifier: ohm.NonterminalNode): ModelResult {
            return ok((lookup: Lookup) => lookup(identifier.sourceString));
        },

        FunctionExp(
            name: ohm.IterationNode,
            _1: ohm.TerminalNode,
            args: ohm.NonterminalNode,
            _3: ohm.TerminalNode
        ): ModelResult {
            // Evaluate all children
            const args_results = args.asIteration().children.map((c) => tfeval(c));

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

            return Result.combine(args_results).map((models) => (lookup: Lookup) => {
                const tensors = models.map((m) => m(lookup));
                return externalFunction.tffunc(...tensors);
            });
        },

        number(digits: ohm.NonterminalNode): ModelResult {
            return ok((_: Lookup) => tf.scalar(parseFloat(digits.sourceString), "float32"));
        },
    });
    return sem;
}

export function constructTfModel(
    formula: string,
    fregistry?: ExternalFunctionRegistry
): ModelResult {
    fregistry ??= bidiCalcExternalFunctionsRegistry;
    const match = bidicalcGrammar.match(formula);
    if (match.failed()) {
        return err(new SyntaxError(formula, match));
    }

    const sem = makeSemanticsEvalTf(fregistry);
    return sem(match).evalFuncUntyped();
}

// Bind a reference in a tf model to another model (i.e. compose models)
export function composeTfModel(model: TfModel, refName: string, bind: TfModel): TfModel {
    return (lookup: Lookup) => {
        // Compute value of the bound reference
        const value = bind(lookup);

        // Augment the lookup function given to model with x evaled
        const l = (ref: string) => (refName === ref ? value : lookup(ref));

        return model(l);
    };
}

// Bind multiple references
export function composeTfModelRecord(model: TfModel, binds: Record<string, TfModel>) {
    return (lookup: Lookup) => {
        // Compute value of bound references
        const values = Object.fromEntries(Object.entries(binds).map(([n, m]) => [n, m(lookup)]));

        // Augment the lookup function given to the model with bound eval results
        const l = (ref: string) => (ref in values ? values[ref] : lookup(ref));

        return model(l);
    };
}

// Chained composition: bind multiple reference in order and iteratively
export function composeTfModelList(model: TfModel, binds: [string, TfModel][]): TfModel {
    let working = model;
    for (const [ref, bind] of binds) {
        working = composeTfModel(working, ref, bind);
    }
    return working;
}