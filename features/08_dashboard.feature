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

  Rule: Summary cards show both final results, their difference B − A in both cases, and Path B's payoff date
    The break-even return is not a card; it is stated in the verdict.

    Scenario: The four cards
      When I run the simulation
      Then the cards are titled:
        | Path A final net wealth |
        | Path B final net wealth |
        | Difference B − A        |
        | Mortgage-free           |
      And the final net wealth is:
        | path | worst case   | best case    |
        | A    | Ft 3,624,000 | Ft 3,624,000 |
        | B    | Ft 3,616,000 | Ft 3,616,000 |
      And the "Difference B − A" card shows "-Ft 8,000 / -Ft 8,000"
      And the "Difference B − A" card has no notes
      And the difference is shown in the colour of the path that is ahead:
        | worst case | Path A |
        | best case  | Path A |
      And the mortgage-free card shows, for a loan starting in October 2026:
        | path | time     | date           |
        | A    | 1 year   | September 2027 |
        | B    | 8 months | May 2027       |
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
      And the "Difference B − A" card shows "Ft 0 / Ft 0"
      And the difference is shown in the colour of the path that is ahead:
        | worst case | neither |
        | best case  | neither |
      And the mortgage-free card shows, for a loan starting in October 2026:
        | path | time               | date |
        | A    | Not within horizon |      |
        | B    | Not within horizon |      |
      And the verdict is:
        """
        Nothing is prepaid within the time horizon, so both strategies give the same result.
        """

  Scenario Outline: A payoff is shown as the time until it and its calendar month
    Month 1 of the loan is the month the app is used in; here October 2026.
    Then a payoff in month <month> of a loan starting in October 2026 is shown as "<time>" in "<date>"

    Examples:
      | month | time               | date           |
      | 1     | 1 month            | October 2026   |
      | 11    | 11 months          | August 2027    |
      | 12    | 1 year             | September 2027 |
      | 13    | 1 year 1 month     | October 2027   |
      | 130   | 10 years 10 months | July 2037      |
      | 360   | 30 years           | September 2056 |

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

  Rule: Pointing at a final net wealth value highlights that path in the chart and the table
    Hovering with the mouse or focusing with the keyboard emphasises the matching chart line (all
    other lines fade) and highlights the path's columns in the table. The table temporarily shows
    the pointed case; everything returns to normal afterwards.

    Scenario Outline: Highlighting a path and case
      When I point at the <case> value of Path <path>
      Then the chart emphasises "<series>"
      And the table shows the <case> case with these columns highlighted:
        | <columns> |

      Examples:
        | path | case  | series              | columns                                                      |
        | A    | worst | Path A – worst case | Net wealth A, Loan A, Investments A                          |
        | A    | best  | Path A – best case  | Net wealth A, Loan A, Investments A                          |
        | B    | worst | Path B – worst case | Net wealth B, Loan B, Invested B (year), Investments B       |
        | B    | best  | Path B – best case  | Net wealth B, Loan B, Invested B (year), Investments B       |

    Scenario: Only the final net wealth values highlight a path
      When I run the simulation
      Then only the values of the "Path A final net wealth" and "Path B final net wealth" cards highlight a path
