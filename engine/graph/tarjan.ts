import { Graph } from "./graph.ts";

type Link = {
    onStack: boolean;
    lowlink: number;
    index: number;
};

export function tarjan(g: Graph): string[][] {
    let index = 0;
    let stack: string[] = [];
    let visited: Record<string, Link> = {};
    let results: string[][] = [];

    function dfs(v: string) {
        let entry = (visited[v] = {
            onStack: true,
            lowlink: index,
            index: index++,
        });
        stack.push(v);

        g.successors(v).forEach((w: string) => {
            if (!Object.hasOwn(visited, w)) {
                dfs(w);
                entry.lowlink = Math.min(entry.lowlink, visited[w].lowlink);
            } else if (visited[w].onStack) {
                entry.lowlink = Math.min(entry.lowlink, visited[w].index);
            }
        });

        if (entry.lowlink === entry.index) {
            let cmpt = [];
            let w: string;
            do {
                w = stack.pop()!;
                visited[w].onStack = false;
                cmpt.push(w);
            } while (v !== w);
            results.push(cmpt);
        }
    }

    g.nodes().forEach((v: string) => {
        if (!Object.hasOwn(visited, v)) {
            dfs(v);
        }
    });

    return results;
}
