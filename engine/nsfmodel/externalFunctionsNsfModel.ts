import * as nsf from "not-so-float";

type NsfFunc = (...args: nsf.Union[]) => nsf.Union;

export type ExternalNsfFunction = {
    checkArity: (n: number) => boolean;
    arityText: string;
    nsffunc: NsfFunc;
};

export type ExternalNsfFunctionRegistry = (name: string) => ExternalNsfFunction | null;

// Testing function registry that will approve all functions
export const alwaysRegistry: ExternalNsfFunctionRegistry = (
    _: string
): ExternalNsfFunction | null => {
    return {
        checkArity: (_: number) => true,
        arityText: "any number of",
        nsffunc: (_) => nsf.single(42.42),
    };
};

export const bidiCalcExternalNsfFunctionsRegistry = (name: string): ExternalNsfFunction | null => {
    return bidicalcExternalFunctions[name] || null;
};

function fixedArity(n: number, nsffunc: NsfFunc): ExternalNsfFunction {
    return {
        checkArity: (a: number) => n === a,
        arityText: n.toString(),
        nsffunc: nsffunc,
    };
}

const bidicalcExternalFunctions: Record<string, ExternalNsfFunction> = {
    // 0-ary
    pi: fixedArity(0, () => nsf.single(Math.PI)),

    // Unary
    sqrt: fixedArity(1, nsf.sqrt),
    log: fixedArity(1, nsf.log),
    ln: fixedArity(1, nsf.log),
    exp: fixedArity(1, nsf.exp),
    abs: fixedArity(1, nsf.abs),
    cos: fixedArity(1, nsf.cos),
    sin: fixedArity(1, nsf.sin),
    tan: fixedArity(1, nsf.tan),

    // Binary
    pow: fixedArity(2, nsf.pow),
};
