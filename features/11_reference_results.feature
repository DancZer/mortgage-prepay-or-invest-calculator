@regression
Feature: Reference results for the default parameters
  These values were recorded from the model on 2026-10-08 (property value, worst/best returns
  and currency rounding added). They guard against unintended changes: if the model is changed
  on purpose, update them after checking the new numbers.
  Independent cross-check: Path A's payoff in month 289 follows from the annuity formula
  n = −ln(1 − r·P / A) / ln(1 + r) = 288.2 with P = 45 000 000, A = 300 000, r = 6.18% / 12.

  Scenario: Default parameters
    Given the default parameters
    When I run the simulation
    Then the Path A mortgage is paid off in month 289
    And the Path B mortgage is paid off in month 174
    And the final net wealth is:
      | path | worst case     | best case      |
      | A    | Ft 234,359,337 | Ft 405,154,714 |
      | B    | Ft 246,782,590 | Ft 366,266,197 |
    And the break-even return is "6.05%"
    And the "Difference B − A" card shows "+Ft 12,423,253 / -Ft 38,888,517"
    And the difference is shown in the colour of the path that is ahead:
      | worst case | Path B |
      | best case  | Path A |
    And the mortgage-free card shows, for a loan starting in October 2026:
      | path | time              | date         |
      | A    | 24 years 1 month  | October 2050 |
      | B    | 14 years 6 months | March 2041   |
