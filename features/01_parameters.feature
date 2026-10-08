Feature: Input parameters
  The user adjusts nine parameters with sliders. Every slider has a default value,
  a minimum, a maximum and a step size.

  Deviation from the original spec (agreed): the mortgage rate moves in 0.01 % steps and the
  investment return in 0.1 % steps. With the spec's 0.1 % / 0.5 % steps the defaults 6.18 % and
  10 % would not lie on the slider grid and the browser would silently change them.

  Scenario: Sliders have the specified defaults, ranges and steps
    Then the sliders are:
      | parameter             | default    | min        | max         | step      |
      | loan amount           | 45 000 000 | 10 000 000 | 100 000 000 | 1 000 000 |
      | monthly installment   | 300 000    | 100 000    | 600 000     | 10 000    |
      | monthly extra savings | 150 000    | 20 000     | 500 000     | 10 000    |
      | monthly prepayment    | 75 000     | 0          | 500 000     | 5 000     |
      | annual savings growth | 4.0 %      | 0 %        | 15 %        | 0.5 %     |
      | investment return     | 10.0 %     | 0.1 %      | 20 %        | 0.1 %     |
      | mortgage rate         | 6.18 %     | 0.1 %      | 15 %        | 0.01 %    |
      | prepayment penalty    | 1.5 %      | 0 %        | 5 %         | 0.1 %     |
      | years                 | 25         | 15         | 30          | 1         |

  Scenario: Every default value can actually be selected on its slider
    Then every default value lies within its range and on its slider's step grid

  Rule: The monthly prepayment can never exceed the monthly extra savings

    Scenario: Lowering the extra savings below the prepayment lowers the prepayment too
      Given the default parameters
      When I set the monthly extra savings to 50 000
      Then the monthly prepayment is set to 50 000
      And the prepayment slider cannot go above 50 000

    Scenario: Raising the extra savings leaves the prepayment unchanged
      Given the default parameters
      When I set the monthly extra savings to 300 000
      Then the monthly prepayment is set to 75 000
      And the prepayment slider cannot go above 300 000

    Scenario: Trying to prepay more than the extra savings is capped
      Given the default parameters
      When I set the monthly prepayment to 200 000
      Then the monthly prepayment is set to 150 000

    Scenario: Prepaying exactly the extra savings is allowed
      Given the default parameters
      When I set the monthly prepayment to 150 000
      Then the monthly prepayment is set to 150 000

    Scenario: Prepaying nothing is allowed
      Given the default parameters
      When I set the monthly prepayment to 0
      Then the monthly prepayment is set to 0
