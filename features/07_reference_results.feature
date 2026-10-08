@regression
Feature: Reference results for the default parameters
  These values were recorded from the model on 2026-10-08 (after Path A was changed to invest
  its freed installment; Path A went from 320 805 163 to 324 527 949, Path B was unchanged). They guard against unintended changes:
  if the model is changed on purpose, update them after checking the new numbers.
  Independent cross-check: Path A's payoff in month 289 follows from the annuity formula
  n = −ln(1 − r·P / A) / ln(1 + r) = 288.2 with P = 45 000 000, A = 300 000, r = 6.18 % / 12.

  Scenario: Default parameters
    Given the default parameters
    When I run the simulation
    Then the Path A mortgage is paid off in month 289
    And the Path B mortgage is paid off in month 174
    And the dashboard cards are:
      | Path A final net wealth | 324 527 949 Ft   |
      | Path B final net wealth | 285 639 629 Ft   |
      | Path A wins by          | 38 888 320 Ft    |
      | Path B mortgage-free    | Year 15, month 6 |
