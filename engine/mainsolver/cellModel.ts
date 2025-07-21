import { BidiError } from "../core/errors.ts";

// TF MODEL
import { constructTfModel, TfModel } from "../dnsolver/semanticsTfModel.ts";
import { constructExternalRefs, ExternalRefs } from "../grammar/semanticsExternalRefs.ts";

// NSF MODEL
import { constructNsfModel, NsfModel, NsfModelResult } from "../nsfmodel/semanticsNsfModel.ts";

// ASG
import { ASG } from "../asg/asg.ts";
import { constructASG } from "../asg/semanticsASG.ts";
import { initCFs, ContractorFunction } from "../cspsolver/contractorFunctions.ts";

import { Result, ok, err } from "neverthrow";

export type CellModel = {
    tfmodel: TfModel;
    nsfmodel: NsfModel;
    asg: ASG;
    refs: ExternalRefs;
};

export function constructCellModel(expression: string): Result<CellModel, BidiError> {
    const modelResult = constructTfModel(expression);
    const nsfResult = constructNsfModel(expression);
    const asgResult = constructASG(expression);
    const refsResult = constructExternalRefs(expression);

    // Make sure contractors can be computed
    // They are unused here but we need to catch any error here because main
    // solver will fail too when constructing the contractors from the composed
    // model, but it cannot do error reporting as well as we can here
    // Also, the error would happen later (during goal resolution) but we
    // want it to happen as soon as possible
    // Result.combine below makes sure any error in initCFs is handled
    const contractors = asgResult.andThen(initCFs);

    return Result.combine([modelResult, nsfResult, asgResult, contractors, refsResult]).match(
        ([tfmodel, nsfmodel, asg, _, refs]) => {
            return ok({
                tfmodel,
                nsfmodel,
                asg,
                refs,
            });
        },
        (error) => err(error)
    );
}
