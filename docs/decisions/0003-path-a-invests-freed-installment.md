# 0003 – Path A invests its freed installment after payoff

**Status:** accepted, 2026-10-08 (changes the original spec)

**Context:** The original spec redirected the freed installment into investments only for Path B.
Path A kept investing only its extra savings after its own payoff, and discarded the unused part of
its last installment. This made the comparison unfair to Path A, more so with longer horizons.

**Decision:** Path A follows the same payoff rules as Path B (see 0002): the unused part of the last
installment is invested, and from the next month installment + extra savings are invested.

**Consequences:** With no prepayment both paths are identical in every month. Default results moved
in favour of Path A by about 3.7 M Ft.
