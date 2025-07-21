// Helper to generate all monomials of total degree up to 'degree' in 'numVar' variables
// We only consider monomials up to total degree (sum of exponents <= degree)
function generateMonomials(degree: number, numVar: number, prefix: number[] = []): number[][] {
    if (numVar === 0) return [prefix];
    let monomials: number[][] = [];
    for (let d = 0; d <= degree; d++) {
        monomials = monomials.concat(generateMonomials(degree - d, numVar - 1, prefix.concat(d)));
    }
    return monomials;
}

export function randomPolynomial(degree: number, numVar: number): string {
    // Variable names for numVar variables: a, b, c, ...
    const varNames = "xyzabcdefghijklmnopqrstuvw".slice(0, numVar).split("");

    // Generate a random point X in R^numVar
    const X = Array.from({ length: numVar }, () => Math.random() * 10 - 5); // random between -5 and 5

    // Get all monomial exponents of total degree <= degree
    // Then filter to those that have degree >= 1 (non-constant) for coefficient assignment
    const allMonomials = generateMonomials(degree, numVar);
    const constantMonomialIndex = allMonomials.findIndex((exps) => exps.every((e) => e === 0));

    // Generate random coefficients for all monomials except the constant term (initially set to 0)
    // Coefficients in range [-5, 5]
    let coeffs: number[] = allMonomials.map(() => 0);
    for (let i = 0; i < coeffs.length; i++) {
        if (i !== constantMonomialIndex) {
            coeffs[i] = Math.random() * 10 - 5;
        }
    }

    // Evaluate polynomial at point X (without constant term)
    function evalMonomial(exps: number[], point: number[]) {
        return exps.reduce((prod, exp, idx) => prod * Math.pow(point[idx], exp), 1);
    }
    let valAtX = 0;
    for (let i = 0; i < coeffs.length; i++) {
        if (i !== constantMonomialIndex) {
            valAtX += coeffs[i] * evalMonomial(allMonomials[i], X);
        }
    }

    // Adjust constant coefficient so polynomial value at X is 0
    coeffs[constantMonomialIndex] = -valAtX;

    // Build polynomial string term by term with explicit '*' multiplication
    function formatTerm(coef: number, exps: number[], varNames: string[]) {
        if (coef === 0) return null;

        // Format coefficient string
        let coefStr = "";
        const absCoef = Math.abs(coef);
        const hasVariables = exps.some((exp) => exp > 0);

        // Always include coefficient except when coef is 1 or -1 and has variables
        if (!hasVariables) {
            coefStr = coef.toFixed(3); // constant term always show number
        } else {
            if (absCoef === 1) {
                coefStr = coef < 0 ? "-" : "";
            } else {
                coefStr = coef.toFixed(3);
            }
        }

        // Format variables with explicit multiplication
        const varsParts = [];
        for (let i = 0; i < varNames.length; i++) {
            if (exps[i] === 0) continue;
            let part = varNames[i];
            if (exps[i] > 1) part += "^" + exps[i];
            varsParts.push(part);
        }

        // Join variables with *
        const varsStr = varsParts.join("*");

        // Join coefStr and varsStr with * if both present and coefStr not just "-"
        if (coefStr === "" || coefStr === "-") {
            return coefStr + varsStr;
        } else if (varsStr.length > 0) {
            return coefStr + "*" + varsStr;
        } else {
            return coefStr;
        }
    }

    // Format all terms into a polynomial string
    const terms = [];
    for (let i = 0; i < coeffs.length; i++) {
        const coef = coeffs[i];
        if (coef === 0) continue;
        const term = formatTerm(coef, allMonomials[i], varNames);
        if (!term) continue;
        terms.push(term);
    }

    // Combine terms with appropriate signs
    const polynomialStr = terms
        .map((term, idx) => {
            // Add + except for first positive term
            if (term.startsWith("-") || idx === 0) return term;
            return "+" + term;
        })
        .join("");

    return polynomialStr;
}