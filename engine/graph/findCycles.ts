import { Graph } from "./graph.ts";
import { tarjan } from "./tarjan.ts";

export function findCycles(g: Graph): string[][] {
    return tarjan(g).filter((cmpt: string[]) => {
        return cmpt.length > 1 || (cmpt.length === 1 && g.hasEdge(cmpt[0], cmpt[0]));
    });
}
