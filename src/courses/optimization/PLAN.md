# Optimization course — plan and status

Built 2026-08-31 to cover **block 4** of the official USI refresher syllabus
(`Syllabus2026.pdf`, Claudia Ravanelli, 7–10 September 2026):

- Unconstrained optimisation: one dimension and several dimensions. Terminology. Necessary and
  sufficient conditions for optimality and their geometric interpretations. Concave and convex
  optimisation.
- Optimisation with equality constraints. The Lagrange method and its geometric interpretation.

References given by the syllabus: Osborne ch. 4–6; Simon–Blume ch. 17, 18.

This completes the syllabus: block 1 + 3 = calculus course, block 2 = linear algebra course,
block 4 = this course, block 5 = probability course.

## Module map

| # | File | Covers |
|---|---|---|
| 01 | `01-the-problem.html` | standard form, objective/feasible set/choice variables, maximum vs maximiser, local vs global, sup vs max, Weierstrass, min-as-max, monotone transformations |
| 02 | `02-one-variable.html` | necessary vs sufficient, FOC and the role of "interior", SOC and the silent case, closed-interval method, corner solutions, coercivity, word-problem setup |
| 03 | `03-convexity.html` | convex sets, chord and tangent characterisations, $f''$/Hessian tests, the three theorems (local⇒global, FOC sufficient, uniqueness), operations preserving concavity, Jensen, quasi-concavity |
| 04 | `04-first-order.html` | $\nabla f=0$ from directional derivatives, stationary points, solving linear and nonlinear FOC systems, where the FOC does not apply, matrix form and gradient rules |
| 05 | `05-second-order.html` | Hessian, the classification theorem, the 2×2 rule, leading principal minors, eigenvalue test, saddle points, the semidefinite (inconclusive) case |
| 06 | `06-global.html` | the three global arguments (concavity, finite candidate list, coercivity), concave programming, the write-up checklist, life without concavity |
| 07 | `07-lagrange.html` | why $\nabla f=0$ fails, the tangency argument, $\nabla f=\lambda\nabla g$, the Lagrangian, the recipe, sign conventions, constraint qualification, several constraints |
| 08 | `08-constrained-soc.html` | feasible directions, the bordered Hessian and its determinant rule, the general $n,m$ pattern, and the three ways to avoid it |
| 09 | `09-shadow-prices.html` | the value function, $\lambda=V'(c)$ with proof, the envelope theorem (unconstrained and constrained), Hotelling, Roy, units and sign of $\lambda$, comparative statics |
| 10 | `10-inequality.html` | KKT conditions, complementary slackness, the sign of $\lambda$, case-checking method, non-negativity form, sufficiency under convexity |
| 11 | `11-finance.html` | minimum-variance portfolio (matrix and two-asset), efficient frontier with two constraints, two-fund separation, tangency portfolio, mean–variance utility, OLS, MLE, consumer choice |
| 12 | `12-quick-reference.html` | one-page memory dump: six formula panels, "things that are NOT true", exam routines |
| 13 | `13-worked-examples.html` | 30 exam-style problems with full solutions and an Insight box each, ordered to follow modules 01–11 |

**Module 10 (inequality constraints / KKT) is one step past the strict syllabus** — the syllabus
lists equality constraints only. It is included because the listed reference Osborne ch. 5 covers it
and every later finance course assumes it; the module says so explicitly in a scope note.

## Interactive figures (`interactive.js`)

Eleven, all vanilla SVG, all repainted on `themechange`. Element-id prefixes:

| prefix | figure | module |
|---|---|---|
| `os` | local vs global on an interval, with an open/closed toggle (shows sup-without-max) | 01 |
| `ci` | closed-interval method with a live candidate table | 02 |
| `cx` | chord test for concavity/convexity over 7 functions, plus the tangent | 03 |
| `fo` | contour map plus the two axis slices — the FOC is "both slices flat" | 04 |
| `hs` | quadratic form: contours with eigenvector axes, and $h^\mathsf{T}Hh$ over a full turn of directions | 05 |
| `ga` | gradient ascent from a movable start: concave vs multimodal | 06 |
| `lg` | Lagrange tangency — walk along the constraint and watch $\nabla f$ and $\nabla g$ line up | 07 |
| `bh` | feasible vs infeasible direction profiles at a constrained optimum | 08 |
| `sp` | constraint level $c$ vs the value function $V(c)$, with $\lambda$ as its slope | 09 |
| `kk` | KKT on a triangle: drag the target, watch constraints bind and multipliers appear | 10 |
| `pf` | two-asset efficient frontier as correlation varies | 11 |

The contour machinery (`contourPath` / `drawContours`, marching squares) is the same implementation
as the calculus course's module-09 figure; the two courses are separate bundles, so it is duplicated
rather than shared. Extend a figure's function table (`FOS`, `LGS`, `SPS`, …) to add cases.

## Style

Same house style as the other three courses, and it should stay that way: a plain-words
**READ FIRST** panel per module, **IDEA n** teaching panels that give the intuition before the
formula and always say *why*, "check yourself" one-liners, `TRAP` callouts for the standard lost
marks, and a `Finance link` note wherever the material connects to the MSc.

One pedagogical thread runs through the whole course and should be preserved in any edit:
**first-order conditions generate candidates, second-order conditions classify them, and convexity
is the only thing that ever upgrades a local answer to a global one.** Every module refers back to
it, and modules 06 and 12 make "which global argument are you using?" an explicit checklist item.

## Cross-course dependencies

- Calculus module 09 (gradient, Hessian, Young's theorem) — assumed, not re-derived.
- Calculus module 06 (one-variable FOC/SOC, Taylor) — module 02 reframes it as optimisation.
- Linear algebra module 08 (definiteness of quadratic forms, leading principal minors) — module 05
  cites it directly rather than repeating the tests.
- Probability (Jensen's inequality, covariance matrices) — modules 03 and 11.

## Next

The syllabus is now fully covered. Remaining ideas, in rough priority order:

- Two small patches to the **probability** course, also from the syllabus: the formal probability
  space (Ω, 𝓕, ℙ) including the collection of events, and **random vectors** (mean vector,
  covariance matrix) as named objects.
- Cross-course links: the courses now reference each other in prose ("linear algebra module 08",
  "calculus module 09") but not as hyperlinks. Making those clickable would be a small, high-value
  change.
- Earlier ideas from the probability plan: flashcards from the Quick Reference tables, Pagefind
  search, "mark example as done" checkboxes.
- Statistics is **not** on this syllabus — do not build it.
