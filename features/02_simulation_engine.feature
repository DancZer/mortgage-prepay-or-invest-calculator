Feature: Monthly simulation engine
  The simulation runs month by month, from month 1 to (years × 12).
  Net wealth = loan amount (used as property value) + investments − remaining loan.

  Background:
    Given the default parameters

  Scenario Outline: The simulation runs one step per month for the whole horizon
    Given the parameters:
      | years | <years> |
    When I run the simulation
    Then the simulation has <months> monthly steps
    And the yearly table has <years> rows

    Examples:
      | years | months |
      | 15    | 180    |
      | 25    | 300    |
      | 30    | 360    |

  Scenario: At the start, the loan is untouched and nothing is invested
    When I run the simulation
    Then the monthly results are:
      | month | loan A     | investments A | net wealth A | loan B     | investments B | net wealth B |
      | 0     | 45 000 000 | 0             | 0            | 45 000 000 | 0             | 0            |

  Scenario: Net wealth follows the formula in every month
    When I run the simulation
    Then in every month, net wealth equals the loan amount plus investments minus the remaining loan, for both paths

  Scenario: The remaining loan never goes below zero
    Given the parameters:
      | monthly prepayment | 150 000 |
      | years              | 30      |
    When I run the simulation
    Then the remaining loans are never negative
