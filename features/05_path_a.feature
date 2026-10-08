Feature: Path A – pure investment
  Path A pays the fixed installment and invests all extra savings every month. Like Path B,
  once its mortgage is paid off it invests the freed-up installment plus the extra savings.
    interest    = previous loan × mortgage rate / 12
    loan        = max(0, previous loan − (installment − interest))
    investments = (previous investments + invested this month) × (1 + return / 12)

  Change from the original spec (decision 0003): the spec kept Path A investing only the
  extra savings after its payoff, which made the comparison unfair to Path A.

  Some scenarios use values below the sliders' ranges (small loans, 0% rates) so the
  expected results can be checked by hand. The model accepts any value; only the sliders limit them.

  Scenario: The loan is amortised with the fixed installment, interest first
    Given all rates are zero
    And the parameters:
      | loan amount         | 1 000 000 |
      | monthly installment | 50 000    |
      | mortgage rate       | 12%      |
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
      | investment return     | 12%    |
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
      | monthly installment   | 100 000   |
      | monthly extra savings | 50 000    |
      | prepayment share      | 0%       |
      | years                 | 2         |
    When I run the simulation
    Then the Path A mortgage is paid off in month 12
    And the monthly results are:
      | month | loan A  | investments A | net wealth A |
      | 11    | 100 000 | 550 000       | 450 000      |
      | 12    | 0       | 600 000       | 600 000      |

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
      | monthly installment   | 100 000   |
      | monthly extra savings | 50 000    |
      | years                 | 2         |
    When I run the simulation
    Then the Path A mortgage is paid off in month 12
    And the monthly results are:
      | month | loan A | invested A | investments A | net wealth A |
      | 12    | 0      | 50 000     | 600 000       | 600 000      |
      | 13    | 0      | 150 000    | 750 000       | 750 000      |
      | 24    | 0      | 150 000    | 2 400 000     | 2 400 000    |

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
        | mortgage rate       | 12%      |
        | prepayment share    | 0%       |
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
        | mortgage rate       | 12%      |
        | prepayment share    | 0%       |
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

  Rule: The Mortgage-free card shows when Path A's investments exceed its remaining loan
    From that month on, Path A could repay its loan from its investments. Shown under Path A's
    payoff time, for the worst and the best case, because it depends on the investment return.

    Scenario: Investments overtake the loan earlier with a higher return
      Worst case (0%): 50 000 a month is invested while the loan falls by 100 000 a month from
      1 200 000. In month 8 both are 400 000 (not more), in month 9 the investments are 450 000
      against a loan of 300 000. Best case (12%, 1% a month): by month 8 the investments are about
      418 400, already more than the 400 000 loan.
      Given all rates are zero
      And the parameters:
        | loan amount           | 1 200 000 |
        | monthly installment   | 100 000   |
        | monthly extra savings | 50 000    |
        | worst-case return     | 0%        |
        | best-case return      | 12%       |
        | years                 | 2         |
      When I run the simulation
      Then Path A's investments first exceed its remaining loan in month 9 in the worst case and month 8 in the best case
      And under Path A the mortgage-free card says "Investments > loan: 9 months (worst) · 8 months (best)"

    Scenario: When it does not happen within the horizon, that is stated
      Given the default parameters
      And the parameters:
        | years | 1 |
      When I run the simulation
      Then under Path A the mortgage-free card says "Investments > loan: not within horizon (worst) · not within horizon (best)"

    Scenario: Without a loan there is nothing to overtake
      Given the default parameters
      And the parameters:
        | loan amount | 0 |
      When I run the simulation
      Then there is nothing under Path A on the mortgage-free card
