import * as ohm from "ohm-js";

export interface BidiError {
    short: () => string;
    title: () => string;
    long: () => string;
}

export class SyntaxError implements BidiError {
    constructor(private expression: string, private match: ohm.MatchResult) {}
    short(): string {
        return `Err: syntax`;
    }

    title(): string {
        return "Syntax error";
    }

    long(): string {
        return `The expression entered in the cell is not valid syntax.`;
    }
}

export class InvalidRef implements BidiError {
    constructor(private name: string) {}

    short(): string {
        return `Err: ${this.name}`;
    }

    title(): string {
        return "Invalid reference";
    }

    long(): string {
        return `Reference '${this.name}' is not available.`;
    }
}

export class InvalidKindOfRef implements BidiError {
    constructor(private name: string, private kind: string) {}

    short(): string {
        return `Err: ${this.name}`;
    }

    title(): string {
        return "Reference error";
    }

    long(): string {
        return `Reference '${this.name}' is of type '${this.kind}' and cannot be used in a formula.`;
    }
}

export class UnknownFunction implements BidiError {
    constructor(private name: string) {}

    short(): string {
        return `Err: unknown ${this.name}`;
    }

    title(): string {
        return "Unknown function";
    }

    long(): string {
        return `Unknown function '${this.name}'`;
    }
}

export class ArityError implements BidiError {
    constructor(private name: string, private arityText: string, private actualArity: number) {}

    short(): string {
        return `Err: arity ${this.name}`;
    }

    title(): string {
        return "Arity error";
    }

    long(): string {
        return `Function ${this.name}() expects ${this.arityText} arguments, got ${this.actualArity}`;
    }
}

export class CycleError implements BidiError {
    constructor() {}

    short(): string {
        return `Err: cycle`;
    }

    title(): string {
        return "Cycle error";
    }

    long(): string {
        return `This cell is part of a cycle of references and cannot be computed.`;
    }
}

export class InternalError implements BidiError {
    constructor(private msg: string) {}

    short(): string {
        return `Err: internal`;
    }

    title(): string {
        return "Internal error";
    }

    long(): string {
        return `Internal error: ${this.msg}. This should never happen. Congratulations! You have found a bug in bidicalc. Please report it :) Thanks!`;
    }
}

// Result of a union computation is infinite, but a finite result was expected
export class InfinityError implements BidiError {
    constructor() {}

    short(): string {
        return "Err: inf";
    }

    title(): string {
        return "Overflow error";
    }

    long(): string {
        return "Result overflows to infinity.";
    }
}

// Result of a union computation is empty, but non empty was expected
export class EmptyError implements BidiError {
    constructor() {}

    short(): string {
        return "Err: empty";
    }

    title(): string {
        return "Invalid result";
    }

    long(): string {
        return "Invalid result: typically divide by zero, sqtr(-1), etc.";
    }
}
