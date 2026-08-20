# Probability · Course Plan

Prep course for the MSc Finance assessment (PrepUSI Study Hub). Same format as the
Linear Algebra course: a dense cheat-sheet page with numbered modules, panel-based
layout (DEF / THM / EX / TRAP pills), KaTeX formulas, inline SVG figures, a quick
reference, and a bank of worked examples at exam level.

## Goals

- Cover everything a probability entrance/assessment test for an MSc in Finance can
  reasonably ask: combinatorics through the CLT, with the standard distribution zoo.
- Keep the finance thread running through every module (returns, portfolios, option
  payoffs, risk), culminating in a dedicated finance-applications module.
- Exam-first: every module states definitions, the theorems in usable form, the traps
  examiners like, and at least 2 worked examples; module 12 collects ~25 more.

## Module structure (12 modules, mirroring LinAlg)

### 01 · Foundations & counting
- Sample space, events, set operations (union/intersection/complement, De Morgan).
- Kolmogorov axioms; consequences: complement rule, inclusion–exclusion (2 and 3 events),
  monotonicity, union bound.
- Classical (equally likely) probability.
- Counting: multiplication rule, permutations, combinations, binomial coefficients,
  Pascal's triangle/binomial theorem; sampling with/without replacement, ordered/unordered
  (the 2×2 table).
- Traps: "at least one" via complement; birthday-problem style; overcounting.
- Figure: Venn diagram (interactive: toggle A∪B, A∩B, Aᶜ shading).

### 02 · Conditional probability & independence
- Definition P(A|B), multiplication rule, law of total probability.
- Bayes' theorem (standard + odds form); base-rate fallacy / false-positive example.
- Independence vs mutual exclusivity (classic trap); pairwise vs mutual independence.
- Tree diagrams; sequential experiments.
- Finance hook: default probabilities conditional on rating; regime probabilities.
- Figure: probability tree (interactive: adjust branch probabilities, see posteriors).

### 03 · Random variables
- Definition, discrete vs continuous.
- PMF, PDF, CDF and their properties; relations (CDF ↔ PDF/PMF); support.
- P(a < X ≤ b) from the CDF; continuity correction of language (P(X=x)=0 for continuous).
- Quantiles / percentiles; median, mode.
- Mixed note: indicator random variables (used constantly later).
- Figure: PDF ↔ CDF linked plot (interactive: drag interval, see area = probability).

### 04 · Expectation, variance & moments
- E[X] discrete/continuous; LOTUS (E[g(X)]).
- Linearity of expectation (no independence needed — highlight).
- Variance, standard deviation; Var(aX+b); E[X²] = Var+E².
- Moments, skewness, kurtosis (definitions, what they mean for return distributions).
- Moment generating function: definition, extracting moments, MGF of sums.
- Inequalities: Markov, Chebyshev, Jensen (convexity → E[g(X)] vs g(E[X]); utility/
  risk-aversion connection).
- Traps: E[1/X] ≠ 1/E[X]; Var of sums needs covariance.

### 05 · Discrete distributions
One panel per distribution with PMF, mean, variance, MGF, "use when", finance example:
- Bernoulli, Binomial (incl. normal/Poisson approximations — pointer to 09),
- Geometric (both conventions — flag the trap), Negative binomial,
- Poisson (law of rare events; Poisson process teaser),
- Hypergeometric (vs binomial: without replacement),
- Discrete uniform.
- Summary table of all discrete distributions.
- Figure: binomial PMF (interactive: sliders n, p; overlay normal approx).

### 06 · Continuous distributions
Same panel format:
- Continuous uniform, Exponential (memorylessness — with proof sketch),
- Normal: standardization, z-table use, symmetry tricks, 68–95–99.7;
  sums of independent normals,
- Lognormal (X = e^Y; mean/median distinction — key finance trap; asset prices),
- Gamma & Beta (brief), Chi-square, Student t (fat tails vs normal), F (pointers to
  statistics course).
- Summary table of all continuous distributions.
- Figure: normal density (interactive: sliders μ, σ; shaded tail probabilities);
  t vs normal overlay showing fat tails.

### 07 · Joint distributions, covariance & correlation
- Joint PMF/PDF, marginals, conditionals; independence criterion (factorization).
- Conditional expectation E[X|Y]; law of iterated expectations (tower rule);
  law of total variance (variance decomposition).
- Covariance: definition, bilinearity, Cov(X,X)=Var; correlation ρ ∈ [−1,1].
- Var(aX+bY) — the two-asset portfolio formula; n-asset version with Σ (link back to
  LinAlg quadratic forms).
- Uncorrelated ≠ independent (classic counterexample) — except joint normal.
- Bivariate normal: brief (conditional mean is linear — regression preview).
- Figure: scatter clouds at different ρ (interactive: slider ρ).

### 08 · Transformations & sums of random variables
- g(X) for monotone g: change-of-variable formula (univariate); CDF method.
- Common cases: aX+b, X², e^X (→ lognormal derivation, done properly).
- Sums of independent RVs: convolution idea (no heavy computation), MGF shortcut;
  stability results: Binomial+Binomial, Poisson+Poisson, Normal+Normal, Gamma.
- Min/max of independent RVs via CDFs (order statistics, light version —
  e.g. first default among n loans, exponential min).
- Probability integral transform (uniform ↔ any CDF; simulation link).

### 09 · Limit theorems
- iid samples; sample mean X̄ₙ: E[X̄ₙ], Var(X̄ₙ) = σ²/n.
- Weak law of large numbers (via Chebyshev); intuition + what it does NOT say
  (gambler's fallacy trap).
- Central limit theorem: statement, standardization, when to apply; normal
  approximation to binomial with continuity correction.
- Convergence concepts, light: in probability vs in distribution (one panel, exam level).
- Monte Carlo idea: LLN justifies simulation-based pricing (finance hook).
- Figure: CLT interactive — sample means of skewed distribution converging to normal
  as n grows (slider n).

### 10 · Finance applications
- Returns as random variables: simple vs log returns; expected return & volatility.
- Lognormal model of prices: S_T = S_0 e^(μ+σZ); E[S_T], median vs mean.
- Two-asset portfolio: mean, variance, diversification effect as ρ varies;
  minimum-variance weights (link to LinAlg module 10).
- Value-at-Risk as a quantile: normal VaR formula, worked example.
- Binomial model: one-step and two-step price tree, risk-neutral probability,
  expected payoff of a call (probability mechanics, not full derivatives theory).
- Sharpe ratio; skewness/kurtosis of real returns vs normal assumption.
- Simulation: inverse-transform sampling of returns (ties to 08/09).

### 11 · Quick reference
- One-glance tables: axioms & rules; counting formulas; Bayes; expectation/variance
  rules; covariance rules; the full distribution zoo (discrete + continuous, one row
  each: PMF/PDF, E, Var, MGF); limit theorems; z-table excerpt or key z-values
  (1.645, 1.96, 2.326, 2.576).
- "Trap list": the ~15 classic mistakes flagged across modules, collected.

### 12 · Worked examples
~25–27 exam-level problems with full solutions, grouped by module, each in a
collapsible panel (same as LinAlg module 12). Mix: counting (3), conditional/Bayes (4),
RVs & expectation (4), discrete distributions (3), continuous/normal (4), joint &
portfolio (4), transformations (2), CLT (2), finance (2–3).

## Interactive figures (interactive.js)

Priority order — build at least the first four:
1. Venn diagram region toggler (01)
2. Bayes tree with sliders (02)
3. PDF/CDF area-drag (03)
4. Normal density with μ, σ sliders + shaded tails (06)
5. Binomial PMF with normal overlay (05)
6. Correlation scatter slider (07)
7. CLT convergence demo (09)

Static SVG fallbacks for all figures, same pattern as LinAlg (SVG with CSS variables
for theming, `<figure>` blocks).

## Files & wiring

```
src/courses/probability/
  meta.json          # id "probability", brand "PROB · CHEAT SHEET", modules s1–s12
  hero.html          # hero panel: course pitch, how-to-use, stats line
  interactive.js     # figures above
  modules/
    01-foundations.html
    02-conditional-probability.html
    03-random-variables.html
    04-expectation-moments.html
    05-discrete-distributions.html
    06-continuous-distributions.html
    07-joint-distributions.html
    08-transformations.html
    09-limit-theorems.html
    10-finance-applications.html
    11-quick-reference.html
    12-worked-examples.html
src/pages/probability.astro   # copy of linear-algebra.astro pointed at this course
```

- `meta.json` anchors follow the s1…s12 convention used by CourseLayout's sidebar.
- Update `src/pages/index.astro`: Probability card goes from PLANNED (dim) to LIVE,
  linking to /probability, with a stats line and topic trail.
- Reuse global.css panel/pill/table classes verbatim — no new styles unless a
  distribution-zoo table needs a wide variant.

## Build order

1. Scaffold: meta.json, hero, empty module files, probability.astro, index card.
2. Modules 01–04 (core theory).
3. Modules 05–06 (distribution zoo) + summary tables.
4. Modules 07–09.
5. Module 10 (finance) — cross-link LinAlg where relevant.
6. Modules 11–12 (reference + worked examples) last, harvesting from 01–10.
7. interactive.js figures.
8. Verify in dev server (KaTeX rendering, sidebar anchors, print/light theme), build.
