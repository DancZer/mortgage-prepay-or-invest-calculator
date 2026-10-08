# 0007 – Worst-case and best-case returns, break-even and verdict

**Status:** accepted, 2026-10-08 (replaces the single fixed return of the original spec)

**Context:** A single fixed investment return hides the risk that is the core of the
"invest or prepay" question. The target users are skeptics who expect investing to win.

**Decision:** The user sets a worst-case and a best-case annual return (worst ≤ best is enforced).
Both paths are simulated with each. The app shows:

- final net wealth per path for both cases, and the chart as a worst-to-best band per path;
- the break-even return (bisection between −5 % and 30 %, to 0.01 %): above it investing wins;
- a plain-language verdict covering both cases and the break-even return.

**Consequences:** Two simulations per change plus about 30 for the break-even search (fast enough).
Without a prepayment penalty the break-even return equals the mortgage rate, which is a strong
consistency check (tested).
