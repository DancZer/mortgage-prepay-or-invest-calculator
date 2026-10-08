# 0006 – Currency changes symbol and rounding, not amounts

**Status:** accepted, 2026-10-08

**Context:** Users want forint, euro or dollar. Converting amounts would need exchange rates that go
stale.

**Decision:** Switching currency keeps the numbers and changes only the symbol (number format stays
hu-HU, e.g. "45 000 000 €"). The model keeps every amount as an integer in the currency's smallest
unit: whole forints, or cents for euro and dollar. Interest, returns, savings and payments are rounded
each month, like a bank statement. Amounts are displayed in whole units.

**Consequences:** Slider ranges are the same numbers in every currency (a 45 000 000 € default is
unrealistic, accepted). Results can differ by a few units between currencies due to rounding.
