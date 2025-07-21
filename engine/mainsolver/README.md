# bidicalc main solver

## Potential future improvements

* Split on all refs at once using cartesian product

```
W: maintain symmetry
L: More computation expensive, because more intervals will enter the stack
Examples:
1/x^2 + 1/y^2 + 1/z^2 = 1000
Can limit to a fixed amount of variables to limit interval stack explosion.
```

* Interval domain stack ordering

```
W: Can favor regions of the solution space
L: It's problem dependent so it will improve some solutions but worsen others
```

* float64 gradients

```
W: We can increase the global domain and dnsolver convergence
L: Losts of dev work
Examples:
expectSolve("(x-1000)^3 + (y-1000)^3 + (z-1000)^3", [-1000, 10, 0, 1, 10, 1000]);
```

* Support user defined reference domain

```
W: better user control
L: not much!
Examples:
y^2 - 50*x = 1000
```

* DNSolver: support multiple beams

```
W: better convergence for large intervals, and intervals where gradient is
infinity at the midpoint but not other potential beam starts (domain corners)
L: a bit of dev work, perhaps better after float64 gradients
beamed dnsolver inits:
    origin
    midpoint
    midpoint projected to the principal diagonal
    interpolation between midpoint and lowest magnitude corner
    interpolation between lowest and highest corner
```

* Detect inifity gradient as invalid gradient return condition in dnsolver/dnstep

```
W: A bit of compute perf (earlier return from dnsolver)
L: none
```

* Logarithmic scale interval splitting

