import { Graph } from "./graph.ts";
import { errorMissingNode } from "./graphErrors.ts";

/*
 * A helper that preforms a pre- or post-order traversal on the input graph
 * and returns the nodes in the order they were visited. If the graph is
 * undirected then this algorithm will navigate using neighbors. If the graph
 * is directed then this algorithm will navigate using successors.
 */
function dfs(g: Graph, vs: string[], order: "post" | "pre") {
    var acc: string[] = [];
    var visited = {};
    vs.forEach((v) => {
        if (!g.hasNode(v)) {
            throw errorMissingNode(v);
        }

        const orderFunc = order === "post" ? postOrderDfs : preOrderDfs;
        orderFunc(g, v, visited, acc);
    });

    return acc;
}

function postOrderDfs(g: Graph, v: string, visited: Record<string, boolean>, acc: string[]) {
    var stack: [string, boolean][] = [[v, false]];
    while (stack.length > 0) {
        var curr = stack.pop()!;
        if (curr[1]) {
            acc.push(curr[0]);
        } else {
            if (!Object.hasOwn(visited, curr[0])) {
                visited[curr[0]] = true;
                stack.push([curr[0], true]);
                forEachRight(g.successors(curr[0]), (w) => stack.push([w, false]));
            }
        }
    }
}

function preOrderDfs(g: Graph, v: string, visited: Record<string, boolean>, acc: string[]) {
    var stack = [v];
    while (stack.length > 0) {
        var curr = stack.pop()!;
        if (!Object.hasOwn(visited, curr)) {
            visited[curr] = true;
            acc.push(curr);
            forEachRight(g.successors(curr), (w) => stack.push(w));
        }
    }
}

function forEachRight(array: string[], iteratee: (n: string, l: number, a: string[]) => void) {
    var length = array.length;
    while (length--) {
        iteratee(array[length], length, array);
    }

    return array;
}

export function preorder(g: Graph, vs: string[]) {
    return dfs(g, vs, "pre");
}

export function postorder(g: Graph, vs: string[]) {
    return dfs(g, vs, "post");
}

export function reachableDownstream(g: Graph, nodes: string[]): string[] {
    return preorder(g, nodes);
}

export function reachableUpstream(g: Graph, nodes: string[]): string[] {
    return preorder(g.reversed(), nodes);
}
