// BIDICALC solver settings

import * as nsf from "not-so-float";
import { intervalCounts, widthPairs } from "../cspsolver/cspSolver";
import { IntervalDomain, midpoint } from "../core/intervalDomain.ts";

const abs = Math.abs;

export const solverSettings = {
    // Verify a backwards update solution
    // currently float32 limited due to gradients
    verifySolution: (actual: number, goal: number) => {
        const atol = 1e-5;
        const rtol = 1e-5;
        return abs(actual - goal) <= atol + rtol * abs(goal);
    },

    // Halt condition for the main loop
    mainHalt: (splits: number) => splits >= 50,

    // Initialization of directional Newton
    dnInit: (I: IntervalDomain): Map<string, number> => {
        // Compute the midpoint of each dimensions interval
        const midpoints = I.map(([ref, inter]) => midpoint(inter));

        // If the midpoint vector projected on the principal diagonal is within the domain, use that
        const avg = midpoints.reduce((a, b) => a + b, 0) / midpoints.length;
        if (I.every(([ref, inter]) => inter.contains(avg))) {
            return new Map(I.map(([ref, inter]) => [ref, avg]));
        }

        // Else return the midpoint
        return new Map(
            I.map(([ref, inter], index) => {
                return [ref, midpoints[index]];
            }),
        );
    },

    dn: {
        // Line search multiplicative factors
        gamma: [1.0, 0.1, 0.01],

        // Halt condition for the DN solver
        // currently float32 limited due to gradients
        halt: (iter: number, value: number, absDiff: number) => iter >= 50 || absDiff > -1e-6,
    },
    csp: {
        // Maximum domain for variables
        refsDomain: nsf.interval(-1e10, 1e10),

        // Maximum domain for intermediate nodes
        globalDomain: nsf.interval(-1e10, 1e10),

        // Halt condition for the contractor loop
        halt: (iter: number, oldDomains: nsf.Union[], newDomains: nsf.Union[]) => {
            if (iter >= 100) return true;

            // Should this be only for ref nodes?
            const icounts = intervalCounts(newDomains);
            if (icounts.some((c) => c > 10)) return true;

            // Compute contraction amount, making sure to always allow contraction to empty
            const contractionHaltCondition = [...Array(oldDomains.length).keys()].every((i) => {
                if (newDomains[i].isEmpty() && !oldDomains[i].isEmpty()) return false;
                return oldDomains[i].width() - newDomains[i].width() < 0.1; // TODO should probably use a multiplicative factor
            });
            if (contractionHaltCondition) return true;

            return false;
        },
    },
};
