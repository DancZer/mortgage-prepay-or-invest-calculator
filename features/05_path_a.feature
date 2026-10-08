Feature: Path A – pure investment
  Path A pays the fixed installment and invests all extra savings every month. Like Path B,
  once its mortgage is paid off it invests the freed-up installment plus the extra savings.
    interest    = previous loan × mortgage rate / 12
    loan        = max(0, previous loan − (installment − interest))
    investments = (previous investments + invested this month) × (1 + return / 12)

  Change from the original spec (decision 0003): the spec kept Path A investing only the
  extra savings after its payoff, which made the comparison unfair to Path A.

  Some scenarios use values below the sliders' ranges (small loans, 0 % rates) so the
  expected results can be checked by hand. The model accepts any value; only the sliders limit them.
  Where net wealth is checked, the property value is set equal to the loan amount.

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
      | 3     | 306 040       |

  Scenario: Path A pays off the loan when the balance reaches zero
    Given all rates are zero
    And the parameters:
      | loan amount           | 1 200 000 |
      | property value        | 1 200 000 |
      | monthly installment   | 100 000   |
      | monthly extra savings | 50 000    |
      | prepayment share      | 0 %       |
      | years                 | 2         |
    When I run the simulation
    Then the Path A mortgage is paid off in month 12
    And the monthly results are:
      | month | loan A  | investments A | net wealth A |
      | 11    | 100 000 | 550 000       | 1 650 000    |
      | 12    | 0       | 600 000       | 1 800 000    |

  Scenario: In the payoff month, the part of the installment the bank doesn't need is invested
    The last balance is 50 000, so 50 000 of the 100 000 installment is left over and invested.
    Given all rates are zero
    And the parameters:
      | loan amount           | 1 050 000 |
      | monthly installment   | 100 000   |
      | monthly extra savings | 50 000    |
      | years                 | 2         |
    When I run the simulation
    Then the Path A mortgage is paid off in month 11
    And the monthly results are:
      | month | loan A | invested A | investments A |
      | 10    | 50 000 | 50 000     | 500 000       |
      | 11    | 0      | 100 000    | 600 000       |
      | 12    | 0      | 150 000    | 750 000       |

  Scenario: After its own payoff, Path A invests the installment plus the extra savings
    Given all rates are zero
    And the parameters:
      | loan amount           | 1 200 000 |
      | property value        | 1 200 000 |
      | monthly installment   | 100 000   |
      | monthly extra savings | 50 000    |
      | years                 | 2         |
    When I run the simulation
    Then the Path A mortgage is paid off in month 12
    And the monthly results are:
      | month | loan A | invested A | investments A | net wealth A |
      | 12    | 0      | 50 000     | 600 000       | 1 800 000    |
      | 13    | 0      | 150 000    | 750 000       | 1 950 000    |
      | 24    | 0      | 150 000    | 2 400 000     | 3 600 000    |

  Scenario: After payoff, Path A's investment grows with inflation like Path B's
    Given the default parameters
    And the parameters:
      | years | 30 |
    When I run the simulation
    Then the Path A mortgage is paid off in month 289
    And from month 290 to month 360 Path A invests the monthly installment plus that month's extra savings

  Rule: An installment that does not cover the interest is flagged

    Scenario: An installment below the monthly interest makes the loan grow
      Given all rates are zero
      And the parameters:
        | loan amount         | 1 000 000 |
        | monthly installment | 5 000     |
        | mortgage rate       | 12 %      |
        | prepayment share    | 0 %       |
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
        | prepayment share    | 0 %       |
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
