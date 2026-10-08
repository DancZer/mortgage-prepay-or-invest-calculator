# 0008 – Property value is separate from the loan and grows

**Status:** superseded by 0015 (2026-10-08); was accepted, 2026-10-08 (changes the original spec)

**Context:** The spec used the loan amount as the property value, ignoring the down payment and
house price growth, so net wealth figures were unrealistic.

**Decision:** Separate inputs for property value (default 60 M) and annual property growth
(default 3 %), spread evenly over the months: value × (1 + growth)^(month / 12).

**Consequences:** Net wealth is realistic. The property is identical in both paths, so it never
changes which path wins (tested).
