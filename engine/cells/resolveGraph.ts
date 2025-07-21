import { CycleError, InternalError } from "../core/errors.ts";
import { Cell, DirtyCell, CleanCell, GoalCellDirty } from "./cells.ts";
import { CellMap, MutableCellMap } from "./cellMap";
import { resolveNonGoalCell, toDirty } from "./resolve.ts";
import { processUserInput, processUserInputForwardOnly } from "./processUserInput.ts";
import { CellModel } from "../mainsolver/cellModel.ts";
import { composeCellList, cellModelCM } from "./computeModel.ts";

// Main solver
import { mainSolverBackwards } from "../mainsolver/mainSolverBackwards.ts";

import * as graphlib from "../graph";
import { match } from "ts-pattern";

// DEFINITIONS
// focal cell: the cell being interacted with by the user
// focal set: the set of cells updated by the focal cell resolution. Can be the focal cell or a set of upstream cells (variables)
// downstream graph: subgraph reachable from the the focal set following successors
// downstream tree: subset of the downstream graph that's free of any cycles
// upstream graph: subgraph reachable from the focal cell following predecessors
// formula context: set of number or solution cells needed to evaluate a formula
// goal context: set of number cells needed to solve a goal

export function resolveFocalSet(base: CellMap, focalRef: string, dirtyFocal: DirtyCell): CellMap {
    // Non goal resolution, resolve only the focal cell
    if (dirtyFocal.kind !== "Goal") {
        const cleanFocal = resolveNonGoalCell(dirtyFocal, base);
        return CellMap.fromRecord({ [focalRef]: cleanFocal });
    }

    // Goal resolution
    return resolveCompositeGoal(base, focalRef, dirtyFocal);
}

export function resolveCompositeGoal(
    base: CellMap,
    focalRef: string,
    dirtyFocal: GoalCellDirty
): CellMap {
    // Trivial case: goal is equal to the current solution cell value
    if (dirtyFocal.previousValue === dirtyFocal.goal) {
        const baseFocal = base.get(focalRef);
        if (baseFocal.kind === "Solution") {
            return CellMap.fromRecord({});
        }

        if (baseFocal.kind === "NoSolution") {
            const cleanFocal = Cell.SolutionClean(
                dirtyFocal.goal,
                dirtyFocal.model,
                dirtyFocal.expression
            );
            return CellMap.fromRecord({ [focalRef]: cleanFocal });
        }
    }

    // Now handle the actual goal update. We will first build the upstream graph of cells,
    // then compose it into one CellModel, then solve it. The returned focal set is then
    // the set of updated variable cells.

    // The upstream graph should not have cycles at this point
    const baseGraph = cellMapToGraph(base);
    const upstreamTree = baseGraph.filterNodes(graphlib.reachableUpstream(baseGraph, [focalRef]));

    // Compose the upstream tree into a single cell model
    const topoOrder = graphlib
        .topsort(upstreamTree)
        .toReversed()
        .filter((ref) => ref !== focalRef);
    const binds: [string, CleanCell][] = base.extractEntries(topoOrder);
    const composedCellModel = composeCellList<CellModel>(
        cellModelCM,
        (m) => m,
        dirtyFocal.model,
        binds
    );

    // No solution because there are no variables in the composed model
    // This can happen if all source cells are constants, or if there are no
    // dependencies at all to a formula
    if (composedCellModel.refs.singles.length === 0) {
        return CellMap.fromRecord({
            [focalRef]: Cell.NoSolutionClean(
                dirtyFocal.goal,
                dirtyFocal.previousValue,
                dirtyFocal.model,
                composedCellModel,
                dirtyFocal.expression
            ),
        });
    }

    // Goal resolution
    const numericResult = mainSolverBackwards(composedCellModel, dirtyFocal.goal);

    // No solution found by the solver
    if (numericResult === null) {
        return CellMap.fromRecord({
            [focalRef]: Cell.NoSolutionClean(
                dirtyFocal.goal,
                dirtyFocal.previousValue,
                dirtyFocal.model,
                composedCellModel,
                dirtyFocal.expression
            ),
        });
    }

    // Sucessful backwards solution has been found
    const cleanFocal = Cell.SolutionClean(dirtyFocal.goal, dirtyFocal.model, dirtyFocal.expression);

    const cleanLeaves = Object.fromEntries(
        Object.entries(numericResult).map(([ref, newValue]) => [ref, Cell.VariableClean(newValue)])
    );

    return CellMap.fromRecord({ [focalRef]: cleanFocal, ...cleanLeaves });
}

export type ResolutionMode = "Bidirectional" | "ForwardOnly";

/*
Given a graph of cells, resolve a user input into one cell

Args:
base: the current state of the cells
focalRef: reference of the modified cell
    userContent: user input into the modified cell
    
Returns:
    The new state of all cells modified by the resolution
    Input arguments are unchanged
*/
export function resolveGraph(
    base: CellMap,
    focalRef: string,
    userContent: string,
    mode: ResolutionMode
): CellMap {
    // Process user input on the focal cell
    const baseFocal = base.get(focalRef);

    const dirtyFocal = (() => {
        if (mode === "Bidirectional") return processUserInput(baseFocal, userContent);
        else return processUserInputForwardOnly(baseFocal, userContent);
    })();

    // Resolve the focal set: just the focal cell in simple cases, or multiple upstream cells in goal resolution
    const focalSet = resolveFocalSet(base, focalRef, dirtyFocal);

    // Resolve downstream (may include the focal cell again in case of cycles or goal resolution)
    const updatedDownstream = resolveDownstream(base.with(focalSet), focalSet.keys());

    return focalSet.with(updatedDownstream);
}

// Convert a CellMap to a graphlib graph using cell dependencies
export function cellMapToGraph(cellMap: CellMap): graphlib.Graph {
    const rec: Record<string, string[]> = {};
    for (const [ref, cell] of cellMap.entries()) {
        rec[ref] = Cell.deps(cell);
    }
    return graphlib.Graph.fromRecord(rec).reversed();
}

// Skeleton resolveGraph that only resolves the downstream graph
export function resolveGraphDownstream(
    base: CellMap,
    focalRef: string,
    userContent: string
): CellMap {
    const baseFocal = base.get(focalRef);
    const dirtyFocal = processUserInput(baseFocal, userContent);

    if (dirtyFocal.kind === "Goal") {
        console.warn("got goal update in resolveGraphDownstream");
        return CellMap.empty();
    }

    // Resolve focal cell (only formula resolution here)
    const cleanFocal = resolveNonGoalCell(dirtyFocal, base);

    // Resolve downstream (may include the focal cell again in case of cycles or goal resolution)
    const focalSet = CellMap.fromRecord({ [focalRef]: cleanFocal });
    const updatedDownstream = resolveDownstream(base.with(focalSet), focalSet.keys());

    return focalSet.with(updatedDownstream);
}

// Resolve all given references as cycles
export function resolveCycles(base: CellMap, cycles: string[]): CellMap {
    const updated = base.extractKeys(cycles).toMutable();
    const cycleError = new CycleError();
    for (const cyc of cycles) {
        const baseClean = base.get(cyc);
        const recoveryInput = Cell.recoveryInput(baseClean);
        const recoveryDeps = Cell.deps(baseClean);
        const newClean = Cell.ErrorClean(cycleError, recoveryInput, recoveryDeps);
        updated.set(cyc, newClean);
    }
    return updated;
}

/*
Given a graph of cells and a set of focal cells, re-resolve all cells in the
downstream dependency graph of the new cells

Args:
    base: the current state of the cells
    focalKeys: keys of the focal set

Returns:
    The new state of all cells modified, including the focal set
    Input arguments are unchanged
 */
export function resolveDownstream(base: CellMap, focalKeys: string[]): CellMap {
    if (!base.containsKeys(focalKeys)) {
        throw Error(`resolveDownstream: missing keys: ${focalKeys}`);
    }

    // Record of updated cells, to be returned
    const updated: MutableCellMap = CellMap.empty().toMutable();

    // Compute the downstream graph (using the new dependencies of the focal set)
    const baseGraph = cellMapToGraph(base);
    const downstreamGraph = baseGraph.filterNodes(
        graphlib.reachableDownstream(baseGraph, focalKeys)
    );

    // Find all nodes that are either part of a cycle, or have a cycle as a predecessor
    const cycleKeys = graphlib.findCycles(downstreamGraph).flat();
    const downstreamCycles = graphlib.reachableDownstream(baseGraph, cycleKeys);

    // Set cycles to cycle error
    const cleanDownstreamCycles = resolveCycles(base, downstreamCycles);
    updated.update(cleanDownstreamCycles);

    // Compute downstream tree and its topological sort order
    const downstreamTree = downstreamGraph.withoutNodes(downstreamCycles);
    const cycleFreeFocalKeys = focalKeys.filter((k) => !downstreamCycles.includes(k));

    // should I remove the focal set from the topoOrder because its already clean?
    const topoOrder = graphlib.topsort(downstreamTree);

    // Traverse the downstream tree in topological sort order, resolving cells
    const working: MutableCellMap = base.toMutable();
    for (const ref of topoOrder) {
        if (focalKeys.includes(ref)) continue;
        const dirty = toDirty(working.get(ref));
        const clean = match(dirty)
            .with({ kind: "Goal" }, () => {
                // TODO better type safety here should be possible
                return Cell.ErrorClean(
                    new InternalError("goal cell in resolve downstream"),
                    "",
                    []
                );
            })
            .otherwise((cell) => resolveNonGoalCell(cell, working));
        working.set(ref, clean);
        updated.set(ref, clean);
    }

    return updated;
}
