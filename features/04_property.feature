Feature: Property value
  The property value is entered separately from the loan amount and grows every year.
  It is part of the net wealth of both paths.
    property value in month m = property value × (1 + property growth)^(m / 12)

  Scenario: Net wealth counts the property value, not the loan amount
    Given all rates are zero
    And the parameters:
      | loan amount    | 1 000 000 |
      | property value | 1 500 000 |
    When I run the simulation
    Then the monthly results are:
      | month | property value | loan A    | net wealth A | net wealth B |
      | 0     | 1 500 000      | 1 000 000 | 500 000      | 500 000      |

  Scenario: The property grows by the annual rate, spread evenly over the months
    Given all rates are zero
    And the parameters:
      | property value  | 1 000 000 |
      | property growth | 12%      |
    When I run the simulation
    Then the monthly results are:
      | month | property value |
      | 6     | 1 058 301      |
      | 12    | 1 120 000      |
      | 24    | 1 254 400      |

  Scenario: Property growth adds the same amount to both paths, so it never changes the winner
    Given the default parameters
    And the parameters:
      | property growth | 7% |
    When I run the simulation
    Then the difference between the paths is the same in every month as with 0% property growth
