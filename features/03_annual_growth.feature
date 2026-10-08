Feature: Annual growth of savings (inflation)
  The monthly extra savings and the prepayment budget grow by the annual growth rate on every
  anniversary: they change in months 13, 25, 37, … and stay the same within a year.
    extra savings in year y      = extra × (1 + growth)^(y − 1)
    prepayment in year y         = min(prepayment × (1 + growth)^(y − 1), extra savings in year y)
    invested by Path B (loan on) = extra savings − prepayment

  Background:
    Given all rates are zero
    And the parameters:
      | loan amount           | 100 000 000 |
      | monthly installment   | 100 000     |
      | monthly extra savings | 100 000     |
      | monthly prepayment    | 60 000      |
      | annual savings growth | 10 %        |
      | years                 | 15          |

  Scenario: Savings and prepayment grow once a year, on the anniversary
    When I run the simulation
    Then the monthly results are:
      | month | extra savings | prepayment | invested B | investments A |
      | 1     | 100 000       | 60 000     | 40 000     | 100 000       |
      | 12    | 100 000       | 60 000     | 40 000     | 1 200 000     |
      | 13    | 110 000       | 66 000     | 44 000     | 1 310 000     |
      | 24    | 110 000       | 66 000     | 44 000     | 2 520 000     |
      | 25    | 121 000       | 72 600     | 48 400     | 2 641 000     |
      | 37    | 133 100       | 79 860     | 53 240     | 4 105 100     |

  Scenario: Without growth the savings stay flat for the whole horizon
    Given the parameters:
      | annual savings growth | 0 % |
    When I run the simulation
    Then the monthly results are:
      | month | extra savings | prepayment | invested B |
      | 1     | 100 000       | 60 000     | 40 000     |
      | 180   | 100 000       | 60 000     | 40 000     |

  Scenario: A prepayment above the extra savings stays capped after growth
    The model caps the prepayment even when it is given a too-high value directly.
    Given the parameters:
      | monthly prepayment | 150 000 |
    When I run the simulation
    Then the monthly results are:
      | month | extra savings | prepayment | invested B |
      | 1     | 100 000       | 100 000    | 0          |
      | 13    | 110 000       | 110 000    | 0          |
