Feature: Dashboard – cards, verdict, chart and yearly table
  The results are shown as summary cards, a plain-language verdict, a line chart with a
  worst-to-best band per path, and a yearly table that can show either case.

  The example below has no interest and no investment return, only a 2% prepayment penalty.
  Both paths pay in the same money, so the only difference is the penalty Path B pays:
  8 months × 1 000 = 8 000.
    Path A: pays 100 000 a month, mortgage-free in month 12.
    Path B: pays 100 000 + 51 000 (of which 50 000 reaches the principal), mortgage-free in month 8.

  Background:
    Given all rates are zero
    And the parameters:
      | loan amount           | 1 200 000 |
      | property value        | 1 200 000 |
      | monthly installment   | 100 000   |
      | monthly extra savings | 51 000    |
      | prepayment share      | 100%     |
      | prepayment penalty    | 2%       |
      | years                 | 2         |

  Rule: Summary cards show both final results in both cases, the break-even return and Path B's payoff date

    Scenario: The four cards
      When I run the simulation
      Then the cards are titled:
        | Path A final net wealth |
        | Path B final net wealth |
        | Break-even return       |
        | Path B mortgage-free    |
      And the final net wealth is:
        | path | worst case   | best case    |
        | A    | Ft 3,624,000 | Ft 3,624,000 |
        | B    | Ft 3,616,000 | Ft 3,616,000 |
      And the "Break-even return" card shows "-3.96%"
      And the "Break-even return" card notes:
        | Investing wins above it, prepaying below it |
      And the "Path B mortgage-free" card shows "Year 1, month 8"
      And the "Path B mortgage-free" card notes:
        | after 8 months           |
        | Path A: Year 1, month 12 |
      And the verdict is:
        """
        Investing wins in both cases: by Ft 8,000 at 0.0% a year and by Ft 8,000 at 0.0% a year.
        Investing comes out ahead only if your investments earn more than -3.96% a year.
        """

    Scenario: Identical results and a missing payoff are stated plainly
      Given the parameters:
        | monthly installment | 50 000 |
        | prepayment share    | 0%    |
        | years               | 1      |
      When I run the simulation
      Then the final net wealth is:
        | path | worst case   | best case    |
        | A    | Ft 1,212,000 | Ft 1,212,000 |
        | B    | Ft 1,212,000 | Ft 1,212,000 |
      And the "Break-even return" card shows "—"
      And the "Break-even return" card notes:
        | Nothing is prepaid |
      And the "Path B mortgage-free" card shows "Not within horizon"
      And the "Path B mortgage-free" card notes:
        | Path A: Not within horizon |
      And the verdict is:
        """
        You prepay nothing, so both strategies give the same result.
        """

  Scenario Outline: Payoff dates are shown as calendar year/month and as elapsed time
    Then a payoff in month <month> is shown as "<date>" and "<elapsed>"

    Examples:
      | month | date              | elapsed                  |
      | 1     | Year 1, month 1   | after 1 month            |
      | 11    | Year 1, month 11  | after 11 months          |
      | 12    | Year 1, month 12  | after 1 year             |
      | 13    | Year 2, month 1   | after 1 year 1 month     |
      | 130   | Year 11, month 10 | after 10 years 10 months |
      | 360   | Year 30, month 12 | after 30 years           |

  Rule: The chart shows each path as a band from worst to best case, plus Path B's remaining loan

    Scenario: Five series with distinct colours
      When I run the simulation
      Then the chart series are:
        | series                | colour | line   | shaded band |
        | Path A – worst case   | blue   | solid  | no          |
        | Path A – best case    | blue   | solid  | yes         |
        | Path B – worst case   | green  | solid  | no          |
        | Path B – best case    | green  | solid  | yes         |
        | Path B remaining loan | red    | dashed | no          |
      And every chart series has one point per month including the start, with x in years elapsed

    Scenario: The chart marks the month Path B becomes mortgage-free
      When I run the simulation
      Then the chart marks Path B's payoff after 8 months with the label "B mortgage-free: Year 1, month 8"

    Scenario: No payoff marker when the mortgage is not paid off
      Given the parameters:
        | monthly installment | 10 000 |
        | prepayment share    | 0%    |
      When I run the simulation
      Then the chart has no payoff marker

  Rule: The yearly table shows the end-of-year state of both paths

    Scenario: One row per year, payoff year highlighted
      When I run the simulation
      Then the yearly table is:
        | year | extra savings / month | property value | net wealth A | net wealth B | B − A  | loan A | loan B | invested B (year) | investments A | investments B | payoff year |
        | 1    | 51 000                | 1 200 000      | 1 812 000    | 1 804 000    | −8 000 | 0      | 0      | 604 000           | 612 000       | 604 000       | yes         |
        | 2    | 51 000                | 1 200 000      | 3 624 000    | 3 616 000    | −8 000 | 0      | 0      | 1 812 000         | 2 424 000     | 2 416 000     | no          |

    Scenario: The table can show the best case
      Best case: 51 000 invested at the start of each month, 1% return a month rounded to whole
      forints: 51 510, 103 535, 156 080, … 595 809, 653 277.
      Given the parameters:
        | best-case return | 12% |
      When I run the simulation
      Then the yearly table is:
        | year | investments A |
        | 1    | 612 000       |
      And the best-case yearly table is:
        | year | investments A |
        | 1    | 653 277       |
