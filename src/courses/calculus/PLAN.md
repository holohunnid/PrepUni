# Calculus course — plan and status

Built 2026-08-31 to cover **blocks 1 and 3** of the official USI refresher syllabus
(`Syllabus2026.pdf`, Claudia Ravanelli, 7–10 September 2026):

- **Block 1 — Fundamentals:** elementary algebra, basic set theory, functions, limits, continuous functions.
- **Block 3 — Calculus:** one-variable differentiation and integration (definition of the derivative,
  rate of change, continuity vs differentiability, derivative tables and rules, the definite integral
  and its geometric meaning, the Fundamental Theorem, primitives, integration techniques); several
  variables (partial derivatives, gradient, multiple integrals).

Block 2 is the linear algebra course; block 5 is the probability course. **Block 4 (Optimization) is
still unbuilt** — see "Next" below.

## Module map

| # | File | Covers |
|---|---|---|
| 01 | `01-functions.html` | sets, intervals, absolute value, functions and domains, the standard function library, transformations, composition, inverses, the algebra toolkit |
| 02 | `02-limits.html` | informal and ε–δ definitions, one-sided limits, algebra of limits, killing 0/0 (factor / conjugate / compound fraction), limits at infinity, growth hierarchy, asymptotes, squeeze |
| 03 | `03-continuity.html` | three-part definition, removable/jump/infinite discontinuities, which functions are continuous, IVT, EVT |
| 04 | `04-derivative.html` | difference quotient, the definition, first principles, tangent line, linear approximation, differentiable ⇒ continuous (not conversely), notation, higher derivatives |
| 05 | `05-rules.html` | the table, linearity, product, quotient, chain (in depth), implicit, logarithmic differentiation, decision procedure |
| 06 | `06-using-derivative.html` | monotonicity, MVT, critical points, both classification tests, concavity and inflection, closed-interval method, L'Hôpital, Taylor, curve-sketching checklist, marginal analysis and elasticity |
| 07 | `07-integral.html` | antiderivatives and +C, the basic table, Riemann sums, properties, net vs total area, FTC parts 1 and 2, accumulation function |
| 08 | `08-techniques.html` | substitution (incl. changing limits), by parts (LIATE), partial fractions, improper integrals and the p-test, decision procedure |
| 09 | `09-partials.html` | functions of several variables, level curves, partial derivatives, gradient, directional derivatives, Young's theorem, Hessian, total differential, chain rules, tangent plane, MRS |
| 10 | `10-multiple-integrals.html` | double integrals, Fubini, Type I / Type II regions, reversing the order, area and average value, polar coordinates, triple integrals, joint densities |
| 11 | `11-finance.html` | continuous compounding and log returns, PV/annuities/perpetuities as integrals, duration and convexity as a Taylor expansion, marginal analysis, elasticity, the Greeks, integrals as expectations |
| 12 | `12-quick-reference.html` | one-page memory dump: six formula panels, "things that are NOT true", exam routines |
| 13 | `13-worked-examples.html` | 32 exam-style problems with full solutions and an Insight box each, ordered to follow modules 01–11 |

## Interactive figures (`interactive.js`)

Twelve, all vanilla SVG, all repainted on `themechange`. Element-id prefixes:

| prefix | figure | module |
|---|---|---|
| `fn` | function transformer `a·f(b(x−c))+d` over 8 base functions | 01 |
| `lm` | four fates at `x=a` (hole / jump / blow-up / continuous) with a δ band | 02 |
| `ct` | piecewise function; slide `k` until the gap closes | 03 |
| `sc` | secant → tangent as `h → 0` | 04 |
| `dr` | `f` and `f′` stacked, with the tangent and the zeros of `f′` | 05 |
| `cs` | cubic `x³+bx²+cx` with sign bars for `f′` and `f″` | 06 |
| `ri` | Riemann sums, left/right/midpoint/trapezoid | 07 |
| `ac` | accumulation function `A(x)=∫₀ˣ f` next to `f` | 07 |
| `im` | `∫₁^b x^(−p)` converging or diverging | 08 |
| `gr` | contour map (marching squares) + gradient arrow, 5 surfaces | 09 |
| `db` | one region, Type I vs Type II slabs | 10 |
| `bd` | bond price with duration (tangent) and convexity (quadratic) overlays | 11 |

The contour figure uses a compact marching-squares implementation (`contourPath`) so any
`f(x,y)` can be added by extending the `GRS` table; `NaN` corners are skipped, which is how
the Cobb–Douglas surface is restricted to the positive quadrant.

## Style

Same house style as the other two courses, and it should stay that way: a plain-words
**READ FIRST** panel per module, **IDEA n** teaching panels that give the intuition before the
formula and always say *why*, "check yourself" one-liners, `TRAP` callouts for the standard
lost marks, and a `Finance link` note wherever the material actually connects to the MSc.

## Next

- **Optimization course** (syllabus block 4): unconstrained optimisation in one and several
  dimensions, first- and second-order conditions and their geometry, concave/convex optimisation,
  Lagrange with equality constraints. It should lean on calculus module 09 (gradient, Hessian) and
  linear algebra module 08 (definiteness of quadratic forms) rather than re-deriving them.
- Two small patches to the probability course, also from the syllabus: the formal probability space
  (Ω, 𝓕, ℙ) including the collection of events, and **random vectors** (mean vector, covariance
  matrix) as named objects.
- Statistics is **not** on this syllabus — do not build it before the above.
