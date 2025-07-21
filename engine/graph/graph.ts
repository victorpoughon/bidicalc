import { errorMissingNode, errorInvalidRecord } from "./graphErrors.ts";

function reverseAdjacencyList(adjlist: Map<string, string[]>): Map<string, string[]> {
    const reverseAdjacencylist = new Map<string, string[]>();

    for (const node of adjlist.keys()) {
        reverseAdjacencylist.set(node, []);
    }

    for (const [parent, children] of adjlist.entries()) {
        for (const child of children) {
            reverseAdjacencylist.get(child)!.push(parent);
        }
    }
    return reverseAdjacencylist;
}

export class Graph {
    private constructor(
        protected readonly _nodes: string[],
        protected readonly _adjlist: Map<string, string[]>,
        protected readonly _reverseAdjlist: Map<string, string[]>,
    ) {}

    static fromRecord(record: Record<string, string[]>) {
        const nodes = Object.keys(record);

        // Verify all referenced children exist as keys of the record
        for (const [key, children] of Object.entries(record)) {
            for (const child of children) {
                if (!nodes.includes(child)) {
                    throw errorInvalidRecord();
                }
            }
        }

        const adjacencyList = new Map(Object.entries(record));
        const reverseAdjacencylist = reverseAdjacencyList(adjacencyList);
        return new Graph(nodes, adjacencyList, reverseAdjacencylist);
    }

    public nodes(): string[] {
        return this._nodes;
    }

    public nodeCount(): number {
        return this._nodes.length;
    }

    public successors(node: string): string[] {
        const s = this._adjlist.get(node);
        if (s === undefined) throw errorMissingNode(node);
        return s;
    }

    public predecessors(node: string): string[] {
        const s = this._reverseAdjlist.get(node);
        if (s === undefined) throw errorMissingNode(node);
        return s;
    }

    public sinks(): string[] {
        return Array.from(this._adjlist.entries()).flatMap(([key, children]) =>
            children.length === 0 ? [key] : [],
        );
    }

    public sources(): string[] {
        return Array.from(this._reverseAdjlist.entries()).flatMap(([key, children]) =>
            children.length === 0 ? [key] : [],
        );
    }

    public hasNode(node: string): boolean {
        return this._adjlist.has(node);
    }
    
    public hasNodes(nodes: string[]): boolean {
        return nodes.every(n => this._adjlist.has(n));
    }

    public hasEdge(a: string, b: string): boolean {
        return this.successors(a).includes(b);
    }

    public filterNodes(nodes: string[]): Graph {
        const nodeSet = new Set(nodes);

        const F = (adjlist: Map<string, string[]>): Map<string, string[]> => {
            return new Map(
                [...adjlist]
                    .filter(([n]) => nodeSet.has(n))
                    .map(([key, children]) => [key, children.filter((n) => nodeSet.has(n))]),
            );
        };

        return new Graph(
            this._nodes.filter((n) => nodeSet.has(n)),
            F(this._adjlist),
            F(this._reverseAdjlist),
        );
    }

    public withoutNodes(nodes: string[]): Graph {
        const nodeSet = new Set(nodes);

        const F = (adjlist: Map<string, string[]>): Map<string, string[]> => {
            return new Map(
                [...adjlist]
                    .filter(([n]) => !nodeSet.has(n))
                    .map(([key, children]) => [key, children.filter((n) => !nodeSet.has(n))]),
            );
        };

        return new Graph(
            this._nodes.filter((n) => !nodeSet.has(n)),
            F(this._adjlist),
            F(this._reverseAdjlist),
        );
    }

    public reversed(): Graph {
        return new Graph(this._nodes, this._reverseAdjlist, this._adjlist);
    }

    public toString(): string {
        let s = "";
        for (const [node, children] of this._adjlist) {
            s += `${node} -> ${children.join(", ")}\n`;
        }
        return s;
    }
}
