import { Graph } from "./graph.ts";
import { errorUnexpectedCycle } from "./graphErrors.ts";

export function topsort(g: Graph): string[] {
    let visited: Record<string, boolean> = {};
    let stack: Record<string, boolean> = {};
    let results: string[] = [];

    function visit(node: string) {
        if (Object.hasOwn(stack, node)) {
            throw errorUnexpectedCycle();
        }

        if (!Object.hasOwn(visited, node)) {
            stack[node] = true;
            visited[node] = true;
            g.predecessors(node).forEach(visit);
            delete stack[node];
            results.push(node);
        }
    }

    g.sinks().forEach(visit);

    if (Object.keys(visited).length !== g.nodeCount()) {
        throw errorUnexpectedCycle();
    }

    return results;
}
