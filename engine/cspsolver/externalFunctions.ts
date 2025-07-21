import { Linker, ZeroaryLinker, UnaryLinker, BinaryLinker, linkers } from "./contractors.ts";

export type ExternalFunction = {
    checkArity: (n: number) => boolean;
    arityText: string;
    name: string;
    linker: Linker;
};

export type ExternalFunctionRegistry = (name: string) => ExternalFunction | null;

export const bidiCalcExternalFunctionsRegistry = (name: string): ExternalFunction | null => {
    return bidicalcExternalFunctions[name] || null;
};

function zeroaryFunction(name: string, linker: ZeroaryLinker): ExternalFunction {
    return {
        checkArity: (a: number) => a === 0,
        arityText: "0",
        name: name,
        linker: linker,
    };
}

function unaryFunction(name: string, linker: UnaryLinker): ExternalFunction {
    return {
        checkArity: (a: number) => a === 1,
        arityText: "1",
        name: name,
        linker: linker,
    };
}

function binaryFunction(name: string, linker: BinaryLinker): ExternalFunction {
    return {
        checkArity: (a: number) => a === 2,
        arityText: "2",
        name: name,
        linker: linker,
    };
}

const bidicalcExternalFunctions: Record<string, ExternalFunction> = {
    // Zeroary functions
    pi: zeroaryFunction("pi", linkers.lconst(Math.PI)),

    // Unary functions
    sqrt: unaryFunction("sqrt", linkers.lsqrt),
    log: unaryFunction("log", linkers.llog),
    ln: unaryFunction("ln", linkers.llog),
    exp: unaryFunction("exp", linkers.lexp),
    abs: unaryFunction("abs", linkers.labs),
    cos: unaryFunction("cos", linkers.lcos),
    sin: unaryFunction("cos", linkers.lsin),
    tan: unaryFunction("cos", linkers.ltan),

    // Binary functions
    pow: binaryFunction("pow", linkers.lpowReal),
};
