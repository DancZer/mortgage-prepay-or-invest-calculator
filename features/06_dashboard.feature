Feature: Dashboard – cards, chart and yearly table
  The results are shown as summary cards, a line chart with three series and a yearly table.

  Background:
    Given all rates are zero
    And the parameters:
      | loan amount           | 1 200 000 |
      | monthly installment   | 100 000   |
      | monthly extra savings | 50 000    |
      | monthly prepayment    | 20 000    |
      | years                 | 2         |

  Rule: Summary cards show both final results, the winner and Path B's payoff date

    Scenario: Path B wins
      When I run the simulation
      Then the dashboard cards are:
        | Path A final net wealth | 2 400 000 Ft     |
        | Path B final net wealth | 3 600 000 Ft     |
        | Path B wins by          | 1 200 000 Ft     |
        | Path B mortgage-free    | Year 1, month 10 |
      And the "Path B mortgage-free" card notes:
        | after 10 months          |
        | Path A: Year 1, month 12 |

    Scenario: Equal results are reported as a tie, and a missing payoff is stated
      Given the parameters:
        | monthly installment | 50 000 |
        | monthly prepayment  | 0      |
        | years               | 1      |
      When I run the simulation
      Then the dashboard cards are:
        | Path A final net wealth | 1 200 000 Ft       |
        | Path B final net wealth | 1 200 000 Ft       |
        | Tie                     | 0 Ft               |
        | Path B mortgage-free    | Not within horizon |
      And the "Path B mortgage-free" card notes:
        | Path A: Not within horizon |

    Scenario: Path A wins with the default parameters
      Given the default parameters
      When I run the simulation
      Then the third card is titled "Path A wins by"

  Scenario Outline: Payoff dates are shown as calendar year/month and as elapsed time
    Then a payoff in month <month> is shown as "<date>" and "<elapsed>"

    Examples:
      | month | date              | elapsed                 |
      | 1     | Year 1, month 1   | after 1 month           |
      | 11    | Year 1, month 11  | after 11 months         |
      | 12    | Year 1, month 12  | after 1 year            |
      | 13    | Year 2, month 1   | after 1 year 1 month    |
      | 130   | Year 11, month 10 | after 10 years 10 months |
      | 360   | Year 30, month 12 | after 30 years          |

  Rule: The chart shows Path A and Path B net wealth and Path B's remaining loan

    Scenario: Three series with distinct colours
      When I run the simulation
      Then the chart series are:
        | series                | colour | line   |
        | Path A net wealth     | blue   | solid  |
        | Path B net wealth     | green  | solid  |
        | Path B remaining loan | red    | dashed |
      And every chart series has one point per month including the start, with x in years elapsed

    Scenario: The chart marks the month Path B becomes mortgage-free
      When I run the simulation
      Then the chart marks Path B's payoff after 10 months with the label "B mortgage-free: Year 1, month 10"

    Scenario: No payoff marker when the mortgage is not paid off
      Given the parameters:
        | monthly installment | 10 000 |
        | monthly prepayment  | 0      |
      When I run the simulation
      Then the chart has no payoff marker

  Rule: The yearly table shows the end-of-year state of both paths

    Scenario: One row per year, payoff year highlighted
      When I run the simulation
      Then the yearly table is:
        | year | extra savings / month | net wealth A | net wealth B | B − A     | loan A | loan B | invested B (year) | investments A | investments B | payoff year |
        | 1    | 50 000                | 1 800 000    | 1 800 000    | 0         | 0      | 0      | 600 000           | 600 000       | 600 000       | yes         |
        | 2    | 50 000                | 2 400 000    | 3 600 000    | 1 200 000 | 0      | 0      | 1 800 000         | 1 200 000     | 2 400 000     | no          |
