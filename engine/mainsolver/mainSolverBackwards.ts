import { dnConvergeLoop, DNResult } from "../dnsolver/dnSolver.ts";
import { UnionDomain, breakupUnionDomain } from "../core/unionDomain.ts";
import { IntervalDomain, splitIntervalDomain } from "../core/intervalDomain.ts";
import { mainSolverForwards, unionToSingleNumber } from "./mainSolverForwards.ts";
import { BidiError } from "../core/errors.ts";
import { Result, ok, err } from "neverthrow";
import { contractorLoop } from "../cspsolver/cspSolver.ts";
import { initCFs } from "../cspsolver/contractorFunctions.ts";
import { CellModel } from "./cellModel.ts";
import { solverSettings } from "./solverSettings.ts";
import * as nsf from "not-so-float";

/*
Find one solution to: f(x) = C using only directional newton

Args:
    model: Composed model where all references are variables
    goal: target value

Returns:
    A solution or null
*/
export function mainSolverBackwardsDNOnly(
    model: CellModel,
    goal: number
): null | Record<string, number> {
    // TEMP SOLVE based on DN only

    const dom = IntervalDomain.fromRecord(
        Object.fromEntries(model.refs.singles.map((ref) => [ref, nsf.interval(0, 1000)]))
    );

    const dnInitPoint = solverSettings.dnInit(dom);

    const dnResult = dnConvergeLoop(
        model.tfmodel,
        goal,
        dnInitPoint,
        solverSettings.dn.gamma,
        solverSettings.dn.halt
    );

    return dnResult.point;
}

// Initialize the domain stack for algo6
function initDomainStack(model: CellModel): IntervalDomain[] {
    const initialDomain = IntervalDomain.fromIterable(
        model.refs.singles.map((ref) => [ref, solverSettings.csp.refsDomain])
    );
    return [initialDomain];
}

export type TurboCallback = {
    loopStart: (loc: string, idstack: IntervalDomain[], splits: number) => void;
    step1: (loc: string, candidate: IntervalDomain) => void;
    step2: (loc: string, domain: UnionDomain) => void;
    step3: (loc: string, dnresult: DNResult) => void;
    step4: (loc: string, verifiedResult: Result<number, BidiError>, goal: number) => void;
    step5: (loc: string, ref: string) => void;
    loopEnd: (loc: string, splits: number) => void;
    return: (loc: string, ret: null | Record<string, number>) => void;
};

/*
Find one solution to: f(x) = C

Args:
    model: Composed model where all references are variables
    goal: target value

Returns:
    A solution or null
*/
export function mainSolverBackwardsAlgo6(
    model: CellModel,
    goal: number,
    debug: TurboCallback | null = null
): null | Record<string, number> {
    // IntervalDomain stack
    const idstack = initDomainStack(model);

    // Contractors
    const contractorsResult = initCFs(model.asg);
    if (contractorsResult.isErr()) {
        debug?.return("return (initCFs error)", null);
        return null;
    }
    const contractors = contractorsResult.value;

    const refs = model.refs.singles;
    let nextSplit = 0;

    let splits = 0;
    do {
        debug?.loopStart("main loop start", idstack, splits);
        // Pop candidate domain from the stack
        if (idstack.length === 0) {
            debug?.return("return (stack empty)", null);
            return null;
        }

        const candidate = idstack.pop() as IntervalDomain;
        debug?.step1("(1) new candidate interval domain", candidate);

        // Contract candidate domain
        const shrunk = contractorLoop(
            model.asg,
            contractors,
            goal,
            UnionDomain.fromIntervalDomain(candidate),
            solverSettings.csp.globalDomain,
            solverSettings.csp.halt
        );
        debug?.step2("(2) csploop done", shrunk);

        if (shrunk.isEmpty()) continue;

        // Attempt to breakup the resulting union
        const shrunkAsIntervalDomain = shrunk.toIntervalDomain();
        if (shrunkAsIntervalDomain === null) {
            const broken = breakupUnionDomain(shrunk);
            idstack.push(...broken);
            continue;
        }

        // Pick DNsolver initial point
        const dnInitPoint = solverSettings.dnInit(shrunkAsIntervalDomain);

        // The shrunk domain is now an interval domain
        // Attempt to converge to a point using DN solver
        const dnResult = dnConvergeLoop(
            model.tfmodel,
            goal,
            dnInitPoint,
            solverSettings.dn.gamma,
            solverSettings.dn.halt
        );
        debug?.step3("(3) dnsolver done", dnResult);

        const verifyLookup = (ref: string) => dnResult.point[ref];
        const verifiedResult = unionToSingleNumber(mainSolverForwards(model, verifyLookup));

        // Check if dn solver converged to a satisfactory solution
        const solutionIsOk =
            !verifiedResult.isErr() && solverSettings.verifySolution(verifiedResult.value, goal);

        if (solutionIsOk) {
            debug?.return("return (dn solver converged)", dnResult.point);
            return dnResult.point;
        }
        debug?.step4("(4) verifySolution is false", verifiedResult, goal);

        // Split domain
        const [a, b] = splitIntervalDomain(shrunkAsIntervalDomain, refs[nextSplit]);
        debug?.step5(`(5) split done on ref ${refs[nextSplit]}`, refs[nextSplit]);
        nextSplit = (nextSplit + 1) % refs.length;
        idstack.push(a, b);

        splits += 1;

        debug?.loopEnd("main loop end", splits);
    } while (!solverSettings.mainHalt(splits));

    debug?.return("return (mainHalt = true)", null);
    return null;
}

export const mainSolverBackwards = mainSolverBackwardsAlgo6;
