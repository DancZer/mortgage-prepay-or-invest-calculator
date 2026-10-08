Feature: Typing values into the inputs
  Every slider has an input field next to it. A typed value is applied when the user presses
  Enter or leaves the field, written in the number format of the chosen language (these scenarios
  use English; see 14_languages.feature for the others). A value above the slider's maximum is accepted, and the slider is
  extended to that value + 10%, rounded up to the slider's step, so the typed value never sits
  at the very end of the slider (decision 0011).

  Background:
    Given the default parameters

  Rule: Typed values are used as entered

    Scenario: A value between two slider steps is kept exactly
      When I type "45 500 000" into the loan amount field
      Then the typed value is accepted
      And the loan amount is set to 45 500 000
      And the loan amount slider goes up to 100 000 000

    Scenario Outline: Spaces, a decimal comma and a decimal point are all understood
      When I type "<typed>" into the <parameter> field
      Then the <parameter> is set to <value>

      Examples:
        | parameter             | typed      | value      |
        | mortgage rate         | 6,5        | 6.5        |
        | mortgage rate         | 6.5        | 6.5        |
        | monthly extra savings | 175 000    | 175 000    |
        | monthly extra savings | 175000     | 175 000    |
        | worst-case return     | -2,5       | -2.5       |

    Scenario Outline: Percentages are rounded to two decimals, amounts and years to whole numbers
      When I type "<typed>" into the <parameter> field
      Then the <parameter> is set to <value>

      Examples:
        | parameter             | typed       | value     |
        | mortgage rate         | 6.183       | 6.18      |
        | monthly extra savings | 175 000.6   | 175 001   |
        | years                 | 20.4        | 20        |

  Rule: A value above the slider's maximum extends the slider

    Scenario Outline: The new maximum is the value + 10%, rounded up to the slider's step
      When I type "<typed>" into the <parameter> field
      Then the typed value is accepted
      And the <parameter> is set to <typed>
      And the <parameter> slider goes up to <new maximum>

      Examples:
        | parameter             | typed       | new maximum |
        | loan amount           | 150 000 000 | 165 000 000 |
        | loan amount           | 123 456 789 | 136 000 000 |
        | monthly extra savings | 600 000     | 660 000     |
        | mortgage rate         | 20          | 22          |
        | prepayment penalty    | 7           | 7.7         |
        | years                 | 40          | 44          |

    Scenario: A value equal to the maximum does not extend the slider
      When I type "100 000 000" into the loan amount field
      Then the loan amount is set to 100 000 000
      And the loan amount slider goes up to 100 000 000

    Scenario: An extended slider does not shrink back when a smaller value is entered
      When I type "150 000 000" into the loan amount field
      And I type "50 000 000" into the loan amount field
      Then the loan amount is set to 50 000 000
      And the loan amount slider goes up to 165 000 000

    Scenario: Raising the worst case above the best-case maximum extends both sliders
      The best case follows the worst case (see 01_parameters.feature), so both sliders need room.
      When I type "30" into the worst-case return field
      Then the worst-case return is set to 30
      And the best-case return is set to 30
      And the worst-case return slider goes up to 33
      And the best-case return slider goes up to 33

    Scenario: An extended slider is still extended after reopening the app
      Given I used the app before with:
        | loan amount | 150 000 000 |
      When I open the app
      Then the loan amount is set to 150 000 000
      And the loan amount slider goes up to 165 000 000

  Rule: Values that cannot be used are rejected with a message and change nothing
    Below the slider minimum is not allowed. The upper limits keep the model meaningful:
    100% for percentages (the prepayment share cannot exceed the savings), 100 years,
    and 1 000 000 000 000 for amounts.

    Scenario Outline: Rejected values
      When I type "<typed>" into the <parameter> field
      Then the input is rejected with "<message>"
      And no parameter has changed

      Examples:
        | parameter          | typed             | message                         |
        | loan amount        | 5 000 000         | Minimum is Ft 10,000,000        |
        | worst-case return  | -6                | Minimum is -5%                 |
        | prepayment share   | 120               | Maximum is 100%                |
        | mortgage rate      | 101               | Maximum is 100%                |
        | years              | 101               | Maximum is 100 years            |
        | loan amount        | 2 000 000 000 000 | Maximum is Ft 1,000,000,000,000 |
        | loan amount        | abc               | Enter a number                  |
        | loan amount        |                   | Enter a number                  |
        | loan amount        | 12.34.56          | Enter a number                  |

    Scenario: The message uses the chosen currency
      Given the parameters:
        | currency | EUR |
      When I type "5 000 000" into the loan amount field
      Then the input is rejected with "Minimum is €10,000,000"
