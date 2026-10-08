# 0005 – Prepayment is a share of the extra savings

**Status:** accepted, 2026-10-08 (replaces the fixed prepayment amount of the original spec)

**Context:** The spec defined the prepayment as an amount that grows with inflation and is capped at
the extra savings. Since both grow at the same rate, the prepayment is always the same share of the
savings; the amount slider needed a clamping rule to stay below the savings.

**Decision:** The slider is a percentage (0–100 %, step 5 %, default 50 %). Its label also shows the
resulting amount in year 1.

**Consequences:** No clamping logic; the prepayment can never exceed the savings by construction.
