# 0014 – Every input accepts 0

**Status:** accepted, 2026-10-08 (changes the minimums of the original spec and of 0011)

**Context:** The spec's minimums (e.g. loan 10 000 000, installment 100 000, horizon 15 years) stop
users from exploring simple cases such as "no mortgage" or "no extra savings".

**Decision:** The minimum of every slider is 0; the returns keep −5%. Zero values get explicit
handling so the results stay truthful:

- **Loan 0:** there is no mortgage. Both paths count as mortgage-free from the start ("No mortgage"
  instead of a payoff date, no chart marker) and invest the installment amount plus the extra savings
  from month 1, so they are identical.
- **Installment 0 with a loan:** the loan never shrinks; the existing warning is shown. Without a loan,
  an installment of 0 shows no warning.
- **Extra savings 0, horizon 0 or prepayment share 0:** nothing is prepaid, so both paths are identical.
  The break-even search now recognises "no difference at any return" instead of reporting that
  investing always wins. The verdict says "Nothing is prepaid within the time horizon, so both
  strategies give the same result."
- Typed values below 0 (below −5% for returns) are rejected.

**Consequences:** New scenarios in `features/15_zero_values.feature`; rejection examples now use
negative numbers.
