import { describe, it } from "node:test";
import assert from "node:assert";

import { UnknownFunction, ArityError } from "../../core/errors.ts";
import { constructASG } from "../../asg/semanticsASG.ts";
import { initCFs } from "../contractorFunctions.ts";

describe("initCFs", () => {
    it("supported contractors", () => {
        const expectOk = (expr: string) => {
            const asgResult = constructASG(expr);
            assert.ok(asgResult.isOk(), "failed to construct asg");
            if (asgResult.isErr()) return;
            const asg = asgResult.value;

            const CFResult = initCFs(asg);
            const err = CFResult.match(
                () => "",
                (err) => err.short(),
            );
            assert.ok(CFResult.isOk(), `failed to init CFs: ${err}`);
        };

        expectOk("1+1");
        expectOk("pi()");
        expectOk("sqrt(4)");
        expectOk("sqrt(x)");
        expectOk("ln(x)");
        expectOk("log(x)");
        expectOk("exp(x)");
        expectOk("abs(x)");
        expectOk("pow(x, 2)");
        expectOk("pow(x, y)");
        expectOk("cos(1)");
        expectOk("sin(1)");
        expectOk("tan(1)");
    });

    it("unsuported function", () => {
        const expectUnknown = (expr: string) => {
            const asgResult = constructASG(expr);
            assert.ok(asgResult.isOk(), "failed to construct asg");
            if (asgResult.isErr()) return;
            const asg = asgResult.value;

            const CFResult = initCFs(asg);
            assert.ok(CFResult.isErr(), "expected to fail but initCFs but succeeded");
            assert.ok(CFResult._unsafeUnwrapErr() instanceof UnknownFunction);
        };

        expectUnknown("foo()");
    });

    it("wrong arity", () => {
        const expectArityError = (expr: string) => {
            const asgResult = constructASG(expr);
            assert.ok(asgResult.isOk(), "failed to construct asg");
            if (asgResult.isErr()) return;
            const asg = asgResult.value;

            const CFResult = initCFs(asg);
            assert.ok(CFResult.isErr(), "expected to fail initCFs but succeeded");
            assert.ok(CFResult._unsafeUnwrapErr() instanceof ArityError);
        };

        expectArityError("pi(1)");
        expectArityError("pi(1, 2)");
        expectArityError("sqrt(4, 2)");
        expectArityError("sqrt()");
        expectArityError("ln(x, y)");
        expectArityError("log(x, y)");
        expectArityError("exp(x, y)");
        expectArityError("abs(x, y)");
        expectArityError("pow(x, 2, 3)");
        expectArityError("pow(x, y, z)");
    });
});
