import { Result } from "neverthrow";
import { BidiError } from "../core/errors.ts";

// TFMODEL
import {
    TfModel,
    Lookup,
    constructTfModel,
    composeTfModel,
} from "../dnsolver/semanticsTfModel.ts";
import * as tf from "@tensorflow/tfjs";

// NSF MODEL
import * as nsf from "not-so-float";
import { constructNsfModel, composeNsfModel, NsfModel, NsfLookup, NsfModelResult } from "../nsfmodel/semanticsNsfModel.ts";

// ASG
import { ASG, composeASG, Node } from "../asg/asg.ts";
import { constructASG } from "../asg/semanticsASG.ts";

// ExternalRefs
import {
    ExternalRefs,
    constructExternalRefs,
    norefs,
    composeExternalRefs,
} from "../grammar/semanticsExternalRefs.ts";

// CELLS
import { CellModel, constructCellModel } from "../mainsolver/cellModel.ts";
import { CleanCell } from "./cells.ts";

import { match } from "ts-pattern";

// Abstract compute model interface
export interface ComputeModel<M> {
    constant(c: number): M;
    construct(expr: string): Result<M, BidiError>;
    compose(base: M, ref: string, bind: M): M;
}

// Implement the compute model interface for tfmodel
export const tfModelCM: ComputeModel<TfModel> = {
    constant(c: number): TfModel {
        return (lookup: Lookup) => tf.tensor(c, [], "float32");
    },
    construct(expr: string): Result<TfModel, BidiError> {
        return constructTfModel(expr);
    },
    compose(base: TfModel, ref: string, bind: TfModel): TfModel {
        return composeTfModel(base, ref, bind);
    },
};

// Implement the compute model interface for nsfmodel
export const nsfModelCM: ComputeModel<NsfModel> = {
    constant(c: number): NsfModel {
        return (lookup: NsfLookup) => nsf.single(c);
    },
    construct(expr: string): Result<NsfModel, BidiError> {
        return constructNsfModel(expr);
    },
    compose(base: NsfModel, ref: string, bind: NsfModel): NsfModel {
        return composeNsfModel(base, ref, bind);
    },
};


// Implement the compute model interface for ASG
export const ASGCM: ComputeModel<ASG> = {
    constant(c: number): ASG {
        return ASG.fromRecord({ children: [[]], references: {}, nodes: [Node.Number(c)] });
    },
    construct(expr: string): Result<ASG, BidiError> {
        return constructASG(expr);
    },
    compose(base: ASG, ref: string, bind: ASG): ASG {
        return composeASG(base, ref, bind);
    },
};

// Implement the compute model interface for ExternalRefs
export const externalRefsCM: ComputeModel<ExternalRefs> = {
    constant(c: number): ExternalRefs {
        return norefs();
    },
    construct(expr: string): Result<ExternalRefs, BidiError> {
        return constructExternalRefs(expr);
    },
    compose(base: ExternalRefs, ref: string, bind: ExternalRefs): ExternalRefs {
        return composeExternalRefs(base, ref, bind);
    },
};

// Implement the compute model interface for CellModel
export const cellModelCM: ComputeModel<CellModel> = {
    constant(c: number): CellModel {
        return {
            tfmodel: tfModelCM.constant(c),
            nsfmodel: nsfModelCM.constant(c),
            asg: ASGCM.constant(c),
            refs: externalRefsCM.constant(c),
        };
    },
    construct(expr: string): Result<CellModel, BidiError> {
        return constructCellModel(expr);
    },
    compose(base: CellModel, ref: string, bind: CellModel): CellModel {
        return {
            tfmodel: tfModelCM.compose(base.tfmodel, ref, bind.tfmodel),
            nsfmodel: nsfModelCM.compose(base.nsfmodel, ref, bind.nsfmodel),
            asg: ASGCM.compose(base.asg, ref, bind.asg),
            refs: externalRefsCM.compose(base.refs, ref, bind.refs),
        };
    },
};

// Chained composition: bind multiple references in order and iteratively
export function composeModelList<M>(tc: ComputeModel<M>, model: M, binds: [string, M][]): M {
    let working: M = model;
    for (const [ref, bind] of binds) {
        working = tc.compose(working, ref, bind);
    }
    return working;
}

/* composeCellList
Compose a list of upstream cells into a single model suitable for goal resolution

Args:
    tc: Implementation of the compute model interface
    getter: getter function for the cell model to compose
    base: initial model to start composition, typically the model of the goal cell
    binds: list of (ref, CleanCell) tuples to compose

The binds array must be in reverse topological sort order, meaning that an element of
the list at index i can only depend on elements at indices greater than i.
*/
export function composeCellList<M>(
    tc: ComputeModel<M>,
    getter: (m: CellModel) => M,
    base: M,
    binds: [string, CleanCell][],
): M {
    // Make a list of (ref: string, model: M) tuples from the binds
    const bindsModels: [string, M][] = binds.flatMap(([ref, cell]) => {
        return match(cell)
            .returnType<[string, M][]>()
            .with({ kind: "Variable" }, () => []) // Keep variables in the model
            .with({ kind: "Constant" }, (cell) => [[ref, tc.constant(cell.value)]])
            .with({ kind: "Solution" }, (cell) => [[ref, getter(cell.model)]])
            .otherwise((cell) => {
                throw Error(
                    `internal error: unexpected cell kind '${cell.kind}' in compose cell list`,
                );
            });
    });

    // Compose the list
    return composeModelList<M>(tc, base, bindsModels);
}
