# 0015 – The property value is not part of the model

**Status:** accepted, 2026-10-08 (supersedes 0008)

**Context:** 0008 added the property value and its yearly growth as inputs and counted the home in
net wealth. The home is the same in both paths, so it never changed the difference between them, the
winner or the break-even return; it only added two inputs and made the net wealth figures depend on a
house-price guess.

**Decision:** The property value and property growth inputs are removed. Net wealth is
**investments − remaining loan** for both paths. The table no longer has a property value column.

**Consequences:**

- Net wealth starts at minus the loan (e.g. −45 000 000) and is lower than before by the former
  property value; the difference B − A, the break-even return, the verdict and the payoff dates are
  unchanged (the reference scenario shows every net wealth dropping by exactly 125 626 676).
- Old saved inputs that still contain `property` or `appr` load normally; those values are ignored.
