Feature: Input parameters
  The user adjusts ten parameters with sliders. Every slider has a default value,
  a minimum, a maximum and a step size. Money amounts are the same numbers in every
  currency; only the symbol changes (see 09_currency.feature).

  Every input accepts 0 (decision 0014); only the returns go below 0, down to −5%.
  Reasons for values that differ from the original spec are in docs/decisions/.

  Scenario: Sliders have the specified defaults, ranges and steps, in this order
    Then the sliders are:
      | parameter             | default    | min        | max         | step      |
      | loan amount           | 45 000 000 | 0          | 100 000 000 | 1 000 000 |
      | monthly installment   | 300 000    | 0          | 600 000     | 10 000    |
      | monthly extra savings | 150 000    | 0          | 500 000     | 10 000    |
      | prepayment share      | 50%       | 0%        | 100%       | 5%       |
      | annual savings growth | 4.0%      | 0%        | 15%        | 0.5%     |
      | worst-case return     | 3.0%      | −5%       | 20%        | 0.1%     |
      | best-case return      | 10.0%     | −5%       | 20%        | 0.1%     |
      | mortgage rate         | 6.18%     | 0%        | 15%        | 0.01%    |
      | prepayment penalty    | 1.5%      | 0%        | 5%         | 0.1%     |
      | years                 | 25         | 0          | 30          | 1         |

  Scenario: Every default value can actually be selected on its slider
    Then every default value lies within its range and on its slider's step grid

  Rule: The prepayment is a share of the extra savings, so it can never exceed them
    Both the extra savings and the prepayment grow with the annual savings growth, so the
    prepayment is always the same share of the savings (decision 0005).

    Scenario: The prepayment slider shows the share and the resulting amount
      Given the default parameters
      Then the "prepayment share" slider shows "50% (Ft 75,000)"

    Scenario: Changing the extra savings changes the prepaid amount, not the share
      Given the default parameters
      When I set the monthly extra savings to 200 000
      Then the prepayment share is set to 50
      And the "prepayment share" slider shows "50% (Ft 100,000)"

  Rule: The worst-case return can never be higher than the best-case return

    Scenario: Raising the worst case above the best case raises the best case too
      Given the default parameters
      When I set the worst-case return to 12
      Then the worst-case return is set to 12
      And the best-case return is set to 12

    Scenario: Lowering the best case below the worst case lowers the worst case too
      Given the default parameters
      When I set the best-case return to 2
      Then the best-case return is set to 2
      And the worst-case return is set to 2

    Scenario: Equal worst and best cases are allowed
      Given the default parameters
      When I set the worst-case return to 10
      Then the worst-case return is set to 10
      And the best-case return is set to 10
