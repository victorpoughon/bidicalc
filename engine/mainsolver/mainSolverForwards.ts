import * as nsf from "not-so-float";
import { CellModel } from "./cellModel.ts";
import { BidiError, InfinityError, EmptyError, InternalError } from "../core/errors.ts";
import { Result, ok, err } from "neverthrow";

function wrapLookup(f: (ref: string) => number) {
    return (ref: string) => nsf.single(f(ref));
}

export function mainSolverForwards(model: CellModel, lookup: (ref: string) => number): nsf.Union {
    const value = model.nsfmodel(wrapLookup(lookup));
    return value;
}

// Eq 18 from : https://hal.science/file/index/docid/576641/filename/computing-midpoint.pdf
export function midpoint(I: nsf.Interval): number {
    if (I.lo === -I.hi) return 0;
    if (I.lo === I.hi) return I.lo;
    return I.lo / 2 + I.hi / 2;
}

export function unionToSingleNumber(U: nsf.Union): Result<number, BidiError> {
    if (!U.isFinite()) return err(new InfinityError());
    if (U.isEmpty()) return err(new EmptyError());
    if (!U.isSingle()) return err(new InternalError("non single union result"));

    return ok(midpoint(U.intervals[0]));
}
