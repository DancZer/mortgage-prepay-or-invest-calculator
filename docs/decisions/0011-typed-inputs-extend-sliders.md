# 0011 – Typed values; values above the maximum extend the slider

**Status:** accepted, 2026-10-08

**Context:** Slider ranges cover typical cases, but users have loans, savings or horizons outside
them, and want to enter exact values that are not on the slider's step grid.

**Decision:** Every slider has an input field. Typed values are applied on Enter or when the field
loses focus (not on every keystroke, which would apply partial numbers). Spaces, a decimal comma and
a decimal point are accepted. Percentages are rounded to 0.01, amounts and years to whole numbers.

- A value above the slider's current maximum extends the slider to value + 10 %, rounded up to the
  slider's step, so the value never sits at the very end. Maximums never shrink during a session and
  are recalculated from the saved values when the app is reopened.
- Values below the slider minimum are rejected with a message (lowering minimums was not requested).
- Hard upper limits: 100 % for percentages (the prepayment share cannot exceed the savings anyway),
  100 years, and 1 000 000 000 000 for amounts, which keeps the integer arithmetic of the model safe.

**Consequences:** Saved values are no longer required to lie on the slider grid or below the default
maximum; they must be at least the minimum, at most the hard limit, and have allowed decimals.
