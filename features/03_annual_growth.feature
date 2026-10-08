Feature: Annual growth of savings (inflation)
  The monthly extra savings grow by the annual growth rate on every anniversary: they change
  in months 13, 25, 37, … and stay the same within a year. The prepayment is a fixed share of
  the savings, so it grows with them.
    extra savings in year y      = extra × (1 + growth)^(y − 1)
    prepayment in year y         = extra savings in year y × prepayment share
    invested by Path B (loan on) = extra savings − prepayment

  Background:
    Given all rates are zero
    And the parameters:
      | loan amount           | 100 000 000 |
      | monthly installment   | 100 000     |
      | monthly extra savings | 100 000     |
      | prepayment share      | 60 %        |
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

  Scenario: A prepayment share of 100 % prepays all savings, also after growth
    Given the parameters:
      | prepayment share | 100 % |
    When I run the simulation
    Then the monthly results are:
      | month | extra savings | prepayment | invested B |
      | 1     | 100 000       | 100 000    | 0          |
      | 13    | 110 000       | 110 000    | 0          |
