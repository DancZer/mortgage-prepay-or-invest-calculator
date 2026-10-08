Feature: Worst-case and best-case returns, break-even return and verdict
  Investment returns are uncertain, so the user enters a worst-case and a best-case annual
  return instead of one fixed return (decision 0007). Both paths are simulated with each.
  The break-even return is the annual return at which both paths end with the same net wealth:
  above it investing wins, below it prepaying wins. It is searched between −5 % and 30 %.

  Rule: Each path is simulated with both returns

    Scenario: The worst case uses the worst-case return, the best case the best-case return
      Given all rates are zero
      And the parameters:
        | monthly extra savings | 100 000 |
        | worst-case return     | 0 %     |
        | best-case return      | 12 %    |
      When I run the simulation
      Then the monthly results are:
        | month | investments A |
        | 2     | 200 000       |
      And the best-case monthly results are:
        | month | investments A |
        | 2     | 203 010       |

    Scenario: The loan does not depend on the investment return
      Given the default parameters
      When I run the simulation
      Then the loan and the payoff months are the same in the worst and the best case

  Rule: The break-even return tells the user how much investing has to earn to win

    Scenario: With no mortgage interest and no penalty, any positive return makes investing win
      Prepaying an interest-free loan earns nothing, so investing earlier wins at any return above 0 %.
      Given all rates are zero
      And the parameters:
        | loan amount           | 1 200 000 |
        | monthly installment   | 100 000   |
        | monthly extra savings | 50 000    |
        | prepayment share      | 40 %      |
        | years                 | 2         |
      Then the break-even return is "0.00 %"

    Scenario Outline: Without a penalty, the break-even return equals the mortgage rate
      Prepaying saves exactly the mortgage rate, so investing must earn more than that to win.
      The installment is chosen so the loan is actually repaid (at 10 % a 300 000 installment
      would not even cover the interest on 45 000 000).
      Given the default parameters
      And the parameters:
        | prepayment penalty  | 0 %           |
        | mortgage rate       | <mortgage>    |
        | monthly installment | <installment> |
      Then the break-even return is "<break-even>"

      Examples:
        | mortgage | installment | break-even |
        | 3 %      | 300 000     | 3.00 %     |
        | 6.18 %   | 300 000     | 6.18 %     |
        | 10 %     | 600 000     | 10.00 %    |
        | 14 %     | 600 000     | 14.00 %    |

    Scenario: A prepayment penalty lowers the break-even return
      The penalty makes prepaying more expensive, so investing needs a lower return to win.
      Given the default parameters
      Then the break-even return is "6.05 %"
      And the break-even return is lower than without a penalty

    Scenario: At the break-even return both paths end with practically the same net wealth
      Given the default parameters
      Then with that return both paths end within 0.01 % of each other

    Scenario: When nothing is prepaid there is no break-even return
      Given the default parameters
      And the parameters:
        | prepayment share | 0 % |
      Then the break-even return is "—"

    Scenario: When prepaying wins even at a 30 % return, that is stated instead of a rate
      A 40 % mortgage is outside the slider range; the model is tested with it to reach this case.
      Given the default parameters
      And the parameters:
        | mortgage rate       | 40 %      |
        | monthly installment | 2 000 000 |
      Then the break-even return is "Above 30 %"

  Rule: A plain-language verdict explains the result
    The amounts in these verdicts were recorded from the model (2026-10-08); the wording is the requirement.

    Scenario: Investing wins in both cases
      Given the default parameters
      And the parameters:
        | worst-case return | 8 %  |
        | best-case return  | 12 % |
      Then the verdict is:
        """
        Investing wins in both cases: by 14 722 116 Ft at 8.0 % a year and by 77 028 902 Ft at 12.0 % a year.
        Investing comes out ahead only if your investments earn more than 6.05 % a year.
        """

    Scenario: Prepaying wins in both cases
      Given the default parameters
      And the parameters:
        | worst-case return | 2 % |
        | best-case return  | 4 % |
      Then the verdict is:
        """
        Prepaying wins in both cases: by 14 663 000 Ft at 2.0 % a year and by 9 418 358 Ft at 4.0 % a year.
        Investing comes out ahead only if your investments earn more than 6.05 % a year.
        """

    Scenario: The winner depends on the return
      Given the default parameters
      Then the verdict is:
        """
        It depends on your returns: at 3.0 % a year prepaying wins by 12 423 253 Ft, at 10.0 % a year investing wins by 38 888 517 Ft.
        Investing comes out ahead only if your investments earn more than 6.05 % a year.
        """

    Scenario: Prepaying wins at any realistic return
      Given the default parameters
      And the parameters:
        | mortgage rate       | 40 %      |
        | monthly installment | 2 000 000 |
      Then the verdict starts with "Prepaying wins in both cases"
      And the verdict is:
        """
        Prepaying wins in both cases: by 6 038 374 Ft at 3.0 % a year and by 23 561 237 Ft at 10.0 % a year.
        Prepaying comes out ahead at any return from -5 % to 30 % a year.
        """
