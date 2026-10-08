Feature: Explanations behind the "?" buttons
  The app is educational: every input, result card, the summary, the chart, the table and the
  currency switch has a "?" button. Hovering it (mouse), tapping it (touch) or tabbing to it
  (keyboard) shows a short explanation in the chosen language. How it opens and closes is
  checked by hand (12_interactive_controls.feature).

  Scenario Outline: Everything has an explanation in every language
    Given the language is <language>
    Then every input, result card, the summary, the chart, the table and the currency switch have an explanation
    And all explanations are different from each other and longer than their label

    Examples:
      | language  |
      | Hungarian |
      | Slovak    |
      | German    |
      | English   |

  Scenario: Each result card explains itself
    Given the default parameters
    When I run the simulation
    Then the cards have these explanations:
      | Path A final net wealth | netA         |
      | Path B final net wealth | netB         |
      | Difference B − A        | difference   |
      | Mortgage-free           | mortgageFree |

  Scenario: An explanation says what the input is for
    Then the explanation of the prepayment share is:
      """
      The share of your extra savings that Path B pays to the bank as early repayment. The rest is invested. 0% makes both paths the same.
      """
    And the "?" button of the loan amount is announced as "Explain: Loan amount"

  Scenario: Explanations follow the language
    Given the language is Hungarian
    Then the explanation of the loan amount is:
      """
      A ma még fennálló hiteltartozás. Ha 0-ra állítja, látja, mi történik hitel nélkül.
      """
    And the "?" button of the loan amount is announced as "Magyarázat: Hitelösszeg"
