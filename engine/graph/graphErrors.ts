export function errorMissingNode(node: string) {
    return new Error(`Graph error: missing node ${node}`);
}

export function errorInvalidRecord() {
    return new Error("Graph: invalid record argument");
}

export function errorUnexpectedCycle() {
    return new Error("Graph: unexpected cycle");
}