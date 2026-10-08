Feature: Monthly simulation engine
  The simulation runs month by month, from month 1 to (years × 12), once with the worst-case
  and once with the best-case investment return.
  Net wealth = investments − remaining loan. The home is not part of it: it would be the same in both
  paths (decision 0015).

  Unless a step says "best-case", results refer to the worst case. Scenarios that set a single
  "investment return" use it for both cases, so both cases are identical there.

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

  Scenario: At the start, the loan is untouched and nothing is invested, so net wealth is minus the loan
    When I run the simulation
    Then the monthly results are:
      | month | loan A     | investments A | net wealth A | loan B     | investments B | net wealth B |
      | 0     | 45 000 000 | 0             | −45 000 000  | 45 000 000 | 0             | −45 000 000  |

  Scenario: Net wealth follows the formula in every month, in both cases
    When I run the simulation
    Then in every month, net wealth equals investments minus the remaining loan, for both paths

  Scenario: The remaining loan never goes below zero
    Given the parameters:
      | prepayment share | 100% |
      | years            | 30    |
    When I run the simulation
    Then the remaining loans are never negative
