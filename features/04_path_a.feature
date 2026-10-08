Feature: Path A – pure investment
  Path A pays the fixed installment and invests all extra savings every month.
    interest  = previous loan × mortgage rate / 12
    loan      = max(0, previous loan − (installment − interest))
    investments = (previous investments + extra savings) × (1 + return / 12)

  Some scenarios use values below the sliders' ranges (small loans, 0 % rates) so the
  expected results can be checked by hand. The model accepts any value; only the sliders limit them.

  Scenario: The loan is amortised with the fixed installment, interest first
    Given all rates are zero
    And the parameters:
      | loan amount         | 1 000 000 |
      | monthly installment | 50 000    |
      | mortgage rate       | 12 %      |
    When I run the simulation
    Then the monthly results are:
      | month | loan A  |
      | 1     | 960 000 |
      | 2     | 919 600 |
      | 3     | 878 796 |

  Scenario: Savings are invested at the start of the month and earn that month's return
    Given all rates are zero
    And the parameters:
      | monthly extra savings | 100 000 |
      | investment return     | 12 %    |
    When I run the simulation
    Then the monthly results are:
      | month | investments A |
      | 1     | 101 000       |
      | 2     | 203 010       |
      | 3     | 306 040.10    |

  Scenario: Path A pays off the loan when the balance reaches zero
    Given all rates are zero
    And the parameters:
      | loan amount           | 1 200 000 |
      | monthly installment   | 100 000   |
      | monthly extra savings | 50 000    |
      | monthly prepayment    | 0         |
      | years                 | 2         |
    When I run the simulation
    Then the Path A mortgage is paid off in month 12
    And the monthly results are:
      | month | loan A  | investments A | net wealth A |
      | 11    | 100 000 | 550 000       | 1 650 000    |
      | 12    | 0       | 600 000       | 1 800 000    |

  # OPEN QUESTION: the unused 50 000 of the last installment is not invested by Path A
  # (Path B does invest it). Investments A in month 11 are only 11 × 50 000.
  Scenario: A last installment larger than the balance leaves the loan at zero, not negative
    Given all rates are zero
    And the parameters:
      | loan amount           | 1 050 000 |
      | monthly installment   | 100 000   |
      | monthly extra savings | 50 000    |
      | years                 | 2         |
    When I run the simulation
    Then the Path A mortgage is paid off in month 11
    And the monthly results are:
      | month | loan A | investments A |
      | 10    | 50 000 | 500 000       |
      | 11    | 0      | 550 000       |
      | 12    | 0      | 600 000       |

  # OPEN QUESTION: as written in the spec, Path A does NOT invest its freed-up installment
  # after its own mortgage is paid off (Path B does). This scenario documents that behaviour.
  Scenario: After its own payoff, Path A keeps investing only the extra savings
    Given all rates are zero
    And the parameters:
      | loan amount           | 1 200 000 |
      | monthly installment   | 100 000   |
      | monthly extra savings | 50 000    |
      | years                 | 2         |
    When I run the simulation
    Then the monthly results are:
      | month | loan A | investments A | net wealth A |
      | 13    | 0      | 650 000       | 1 850 000    |
      | 24    | 0      | 1 200 000     | 2 400 000    |

  Rule: An installment that does not cover the interest is flagged

    Scenario: An installment below the monthly interest makes the loan grow
      Given all rates are zero
      And the parameters:
        | loan amount         | 1 000 000 |
        | monthly installment | 5 000     |
        | mortgage rate       | 12 %      |
        | monthly prepayment  | 0         |
      When I run the simulation
      Then the monthly results are:
        | month | loan A    |
        | 1     | 1 005 000 |
        | 2     | 1 010 050 |
      And the Path A mortgage is not paid off within the horizon
      And a warning is shown that the installment does not cover the monthly interest

    Scenario: An installment exactly equal to the interest keeps the loan flat
      Given all rates are zero
      And the parameters:
        | loan amount         | 1 000 000 |
        | monthly installment | 10 000    |
        | mortgage rate       | 12 %      |
        | monthly prepayment  | 0         |
      When I run the simulation
      Then the monthly results are:
        | month | loan A    |
        | 1     | 1 000 000 |
        | 12    | 1 000 000 |
      And a warning is shown that the installment does not cover the monthly interest

    Scenario: A normal installment shows no warning
      Given the default parameters
      When I run the simulation
      Then no warning is shown
