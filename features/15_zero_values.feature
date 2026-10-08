Feature: Zero as an input
  Every input accepts 0 (decision 0014). The returns can also go below 0, down to −5%.
  Zero values must give sensible results and explanations, not misleading ones.

  Scenario Outline: Every input accepts 0, by slider and by typing
    Given the default parameters
    When I type "0" into the <parameter> field
    Then the typed value is accepted
    And the <parameter> is set to 0
    And 0 is within the <parameter> slider's range

    Examples:
      | parameter             |
      | loan amount           |
      | monthly installment   |
      | monthly extra savings |
      | prepayment share      |
      | annual savings growth |
      | worst-case return     |
      | best-case return      |
      | mortgage rate         |
      | prepayment penalty    |
      | years                 |

  Scenario: Without a loan there is no mortgage, and both paths are the same
    Both paths invest the installment amount plus the extra savings from the first month.
    Given the default parameters
    And the parameters:
      | loan amount | 0 |
    When I run the simulation
    Then the mortgage-free card shows, for a loan starting in October 2026:
      | path | time        | date |
      | A    | No mortgage |      |
      | B    | No mortgage |      |
    And from month 1 to month 300 Path A invests the monthly installment plus that month's extra savings
    And from month 1 to month 300 Path B invests the monthly installment plus that month's extra savings
    And Path B investments equal Path A investments up to month 300
    And the break-even return is "—"
    And the verdict is:
      """
      Nothing is prepaid within the time horizon, so both strategies give the same result.
      """
    And no warning is shown
    And the chart has no payoff marker

  Scenario: Without a loan, an installment of 0 is not a problem
    Given the default parameters
    And the parameters:
      | loan amount         | 0 |
      | monthly installment | 0 |
    When I run the simulation
    Then no warning is shown

  Scenario: Without an installment the loan grows with interest, and a warning is shown
    Interest in month 1 is 45 000 000 × 6.18% / 12 = 231 750.
    Given the default parameters
    And the parameters:
      | monthly installment | 0 |
    When I run the simulation
    Then the monthly results are:
      | month | loan A     |
      | 1     | 45 231 750 |
    And the Path A mortgage is not paid off within the horizon
    And a warning is shown that the installment does not cover the monthly interest

  Scenario: Without an installment and without interest the loan stays the same, and a warning is shown
    Given the default parameters
    And the parameters:
      | monthly installment | 0  |
      | mortgage rate       | 0% |
    When I run the simulation
    Then the monthly results are:
      | month | loan A     |
      | 300   | 45 000 000 |
    And a warning is shown that the installment does not cover the monthly interest

  Scenario: Without interest the installment repays the loan in equal steps
    Given the default parameters
    And the parameters:
      | mortgage rate | 0% |
    When I run the simulation
    Then the monthly results are:
      | month | loan A     |
      | 1     | 44 700 000 |
      | 150   | 0          |
    And the Path A mortgage is paid off in month 150

  Scenario: Without extra savings nothing can be prepaid, and both paths are the same
    Given the default parameters
    And the parameters:
      | monthly extra savings | 0 |
    When I run the simulation
    Then the "prepayment share" slider shows "50% (Ft 0)"
    And the Path B loan equals the Path A loan in every month
    And Path B investments equal Path A investments up to month 300
    And the break-even return is "—"
    And the verdict is:
      """
      Nothing is prepaid within the time horizon, so both strategies give the same result.
      """

  Scenario: With a time horizon of 0 years nothing happens, and both paths are the same
    The result is the starting position: nothing invested yet, minus the loan of 45 000 000.
    Given the default parameters
    And the parameters:
      | years | 0 |
    When I run the simulation
    Then the simulation has 0 monthly steps
    And the yearly table has 0 rows
    And the final net wealth is:
      | path | worst case    | best case     |
      | A    | -Ft 45,000,000 | -Ft 45,000,000 |
      | B    | -Ft 45,000,000 | -Ft 45,000,000 |
    And the mortgage-free card shows, for a loan starting in October 2026:
      | path | time               | date |
      | A    | Not within horizon |      |
      | B    | Not within horizon |      |
    And the break-even return is "—"
    And the verdict is:
      """
      Nothing is prepaid within the time horizon, so both strategies give the same result.
      """
