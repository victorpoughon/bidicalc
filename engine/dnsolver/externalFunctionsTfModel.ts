import * as tf from "@tensorflow/tfjs";

type TfFunc = (...args: tf.Tensor[]) => tf.Tensor;

export type ExternalFunction = {
    checkArity: (n: number) => boolean;
    arityText: string;
    tffunc: TfFunc;
};

export type ExternalFunctionRegistry = (name: string) => ExternalFunction | null;

// Testing function registry that will approve all functions
export const alwaysRegistry: ExternalFunctionRegistry = (_: string): ExternalFunction | null => {
    return {
        checkArity: (_: number) => true,
        arityText: "any number of",
        tffunc: (_) => tf.tensor(42.),
    }
};


export const bidiCalcExternalFunctionsRegistry = (name: string): ExternalFunction | null => {
    return bidicalcExternalFunctions[name] || null;
};

function fixedArity(n: number, tffunc: TfFunc): ExternalFunction {
    return {
        checkArity: (a: number) => n === a,
        arityText: n.toString(),
        tffunc: tffunc,
    };
}

const bidicalcExternalFunctions: Record<string, ExternalFunction> = {
    // 0-ary
    "pi": fixedArity(0, () => tf.tensor(Math.PI)),

    // Unary
    "abs": fixedArity(1, tf.abs),
    "acos": fixedArity(1, tf.acos),
    "asin": fixedArity(1, tf.asin),
    "atan": fixedArity(1, tf.atan),
    "ceil": fixedArity(1, tf.ceil),
    "cos": fixedArity(1, tf.cos),
    "cosh": fixedArity(1, tf.cosh),
    "exp": fixedArity(1, tf.exp),
    "floor": fixedArity(1, tf.floor),
    "log": fixedArity(1, tf.log),
    "ln": fixedArity(1, tf.log),
    "log1p": fixedArity(1, tf.log1p),
    "neg": fixedArity(1, tf.neg),
    "rsqrt": fixedArity(1, tf.rsqrt),
    "sigmoid": fixedArity(1, tf.sigmoid),
    "sign": fixedArity(1, tf.sign),
    "sin": fixedArity(1, tf.sin),
    "sinh": fixedArity(1, tf.sinh),
    "softplus": fixedArity(1, tf.softplus),
    "sqrt": fixedArity(1, tf.sqrt),
    "square": fixedArity(1, tf.square),
    "tan": fixedArity(1, tf.tan),
    "tanh": fixedArity(1, tf.tanh),

    // Binary
    "pow": fixedArity(2, tf.pow),
    "mod": fixedArity(2, tf.mod),
    "max": fixedArity(2, tf.maximum),
    "min": fixedArity(2, tf.minimum),
    "atan2": fixedArity(2, tf.atan2),

    // Variable arity
    "round": {
        checkArity: n => n === 1 || n === 2,
        arityText: "1 or 2",
        tffunc: (...args: tf.Tensor[]): tf.Tensor => {
            if (args.length === 1) {
                return tf.round(args[0]);
            } else {
                const x = args[0];
                const decimals = args[1];
                const factor = tf.pow(tf.scalar(10), tf.cast(decimals, 'float32'));
                return tf.div(tf.round(tf.mul(x, factor)), factor);
            }
        }
    }
};
