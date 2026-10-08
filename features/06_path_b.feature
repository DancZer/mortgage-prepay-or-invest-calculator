Feature: Path B – prepay the mortgage, then invest everything
  While the loan is open, Path B pays the installment plus the prepayment (minus penalty)
  and invests the rest of the extra savings. Once the loan is paid off it invests the
  installment plus all extra savings every month.
    prepayment                      = extra savings × prepayment share
    principal reached by prepayment = prepayment / (1 + penalty)

  Rule: While the loan is open, the prepayment speeds up repayment and the rest is invested

    Scenario: Installment plus prepayment repay the loan, the remaining savings are invested
      Given all rates are zero
      And the parameters:
        | loan amount           | 1 200 000 |
        | monthly installment   | 100 000   |
        | monthly extra savings | 50 000    |
        | prepayment share      | 40%      |
        | years                 | 2         |
      When I run the simulation
      Then the Path B mortgage is paid off in month 10
      And the monthly results are:
        | month | prepayment | loan B    | invested B | investments B |
        | 1     | 20 000     | 1 080 000 | 30 000     | 30 000        |
        | 9     | 20 000     | 120 000   | 30 000     | 270 000       |
        | 10    | 20 000     | 0         | 30 000     | 300 000       |

    Scenario: Interest is charged on the open balance before the payments are applied
      Given all rates are zero
      And the parameters:
        | loan amount           | 1 000 000 |
        | monthly installment   | 50 000    |
        | monthly extra savings | 10 000    |
        | prepayment share      | 100%     |
        | mortgage rate         | 12%      |
      When I run the simulation
      Then the monthly results are:
        | month | loan B  |
        | 1     | 950 000 |
        | 2     | 899 500 |

    Scenario Outline: Only the prepayment minus the penalty reaches the principal
      Given all rates are zero
      And the parameters:
        | loan amount           | 1 000 000 |
        | monthly installment   | 100 000   |
        | monthly extra savings | <prepay>  |
        | prepayment share      | 100%     |
        | prepayment penalty    | <penalty> |
      When I run the simulation
      Then the monthly results are:
        | month | loan B  |
        | 1     | 800 000 |

      Examples:
        | penalty | prepay  |
        | 0%     | 100 000 |
        | 2%     | 102 000 |
        | 5%     | 105 000 |

    Scenario: Prepaying all extra savings leaves nothing to invest until the payoff
      Given the default parameters
      And the parameters:
        | prepayment share | 100% |
      When I run the simulation
      Then Path B invests nothing before month 130

    Scenario: Without prepayment, Path B behaves exactly like Path A
      Path A's payoff month is checked independently with the annuity formula:
      n = −ln(1 − r·P / A) / ln(1 + r) = 288.2, so the last payment falls in month 289.
      Given the default parameters
      And the parameters:
        | prepayment share | 0% |
        | years            | 30  |
      When I run the simulation
      Then the Path A mortgage is paid off in month 289
      And the Path B mortgage is paid off in month 289
      And the Path B loan equals the Path A loan in every month
      And Path B investments equal Path A investments up to month 360
      And the verdict is:
        """
        You prepay nothing, so both strategies give the same result.
        """

  Rule: In the payoff month only what the bank still needs is paid; the remainder is invested
    Deviation from the original spec (decision 0002): the spec would invest the full installment
    plus extra savings in the payoff month AND pay the bank, counting that money twice.
    Path A follows the same rule (see 05_path_a.feature).

    Scenario: The installment alone clears the last balance, so the whole prepayment is invested
      Given all rates are zero
      And the parameters:
        | loan amount           | 1 000 000 |
        | monthly installment   | 100 000   |
        | monthly extra savings | 50 000    |
        | prepayment share      | 100%     |
        | years                 | 1         |
      When I run the simulation
      Then the Path B mortgage is paid off in month 7
      And the monthly results are:
        | month | loan B  | invested B |
        | 6     | 100 000 | 0          |
        | 7     | 0       | 50 000     |
        | 8     | 0       | 150 000    |

    Scenario: Part of the prepayment is needed, and the penalty applies only to that part
      Last balance 120 000: the installment covers 100 000, the remaining 20 000 costs
      20 000 × 1.02 = 20 400 of the 51 000 prepayment budget, so 30 600 is invested.
      Given all rates are zero
      And the parameters:
        | loan amount           | 1 020 000 |
        | monthly installment   | 100 000   |
        | monthly extra savings | 51 000    |
        | prepayment share      | 100%     |
        | prepayment penalty    | 2%       |
        | years                 | 1         |
      When I run the simulation
      Then the Path B mortgage is paid off in month 7
      And the monthly results are:
        | month | loan B  | invested B |
        | 6     | 120 000 | 0          |
        | 7     | 0       | 30 600     |
        | 8     | 0       | 151 000    |

    Scenario: A payoff in the last month of the horizon frees no money within the horizon
      Given all rates are zero
      And the parameters:
        | loan amount           | 1 200 000 |
        | monthly installment   | 100 000   |
        | monthly extra savings | 50 000    |
        | prepayment share      | 0%       |
        | years                 | 1         |
      When I run the simulation
      Then the Path B mortgage is paid off in month 12
      And the monthly results are:
        | month | loan B | invested B |
        | 12    | 0      | 50 000     |

  Rule: After the payoff, the installment plus the grown extra savings are invested every month

    Scenario: Freed installment and extra savings are invested from the month after payoff
      Given all rates are zero
      And the parameters:
        | loan amount           | 1 200 000 |
        | property value        | 1 200 000 |
        | monthly installment   | 100 000   |
        | monthly extra savings | 50 000    |
        | prepayment share      | 40%      |
        | years                 | 2         |
      When I run the simulation
      Then the monthly results are:
        | month | loan B | invested B | investments B | net wealth B |
        | 11    | 0      | 150 000    | 450 000       | 1 650 000    |
        | 24    | 0      | 150 000    | 2 400 000     | 3 600 000    |

    Scenario: The user's case – prepaying all 150 000 pays off in year 11, month 10
      Year 12 is the first full mortgage-free year. The extra savings are 150 000 × 1.04^11 = 230 918.10,
      rounded to Ft 230,918, so 12 × (300 000 + 230 918) = 6 371 016 are invested.
      Year 11 is a partial year: the payoff month's leftover (131 454) plus 2 × (300 000 + 222 037).
      Given the default parameters
      And the parameters:
        | prepayment share | 100% |
      When I run the simulation
      Then the Path B mortgage is paid off in month 130
      And from month 131 to month 300 Path B invests the monthly installment plus that month's extra savings
      And the yearly table is:
        | year | loan B    | invested B (year) |
        | 10   | 4 920 572 | 0                 |
        | 11   | 0         | 1 175 528         |
        | 12   | 0         | 6 371 016         |

    Scenario: The mortgage is not paid off within the horizon
      Given the default parameters
      And the parameters:
        | prepayment share | 0% |
        | years            | 15  |
      When I run the simulation
      Then the Path B mortgage is not paid off within the horizon
      And Path B investments equal Path A investments up to month 180
