# 0002 – In the payoff month, money the bank doesn't need is invested

**Status:** accepted, 2026-10-08 (changes the original spec)

**Context:** The original spec invested "installment + full extra savings" from the month the loan
reached zero, while the same month's installment and prepayment were also paid to the bank. That
money was counted twice.

**Decision:** In the payoff month the bank receives only what is still owed (installment first, then
prepayment including its penalty). Whatever is left is invested in that month. From the next month on,
installment + extra savings are invested.

**Consequences:** Money is conserved exactly; with all rates at zero both paths end with the same
net wealth (tested).
