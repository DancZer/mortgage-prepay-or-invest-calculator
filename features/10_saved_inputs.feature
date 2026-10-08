Feature: Remembering the user's inputs
  The inputs are saved in the browser (local storage) on every change, so a returning user
  sees their previous values. Nothing is sent to a server. Saved data that is missing,
  damaged or out of range must never break the app: such values fall back to their defaults.

  Scenario: A first-time user sees the defaults
    Given I have never used the app before
    When I open the app
    Then all parameters have their default values

  Scenario: A returning user gets their previous values back
    Given I used the app before with:
      | loan amount      | 30 000 000 |
      | prepayment share | 80%       |
      | best-case return | 7%        |
      | currency         | EUR        |
    When I open the app
    Then the loan amount is set to 30 000 000
    And the prepayment share is set to 80
    And the best-case return is set to 7
    And the currency is EUR

  Scenario: Damaged saved data is ignored
    Given the saved data is '{not json'
    When I open the app
    Then all parameters have their default values

  Scenario: A value above the highest allowed value falls back to its default, the others are kept
    Given the saved data is '{"loan": 2000000000000, "years": 20}'
    When I open the app
    Then the loan amount is set to 45 000 000
    And the years is set to 20

  Scenario: A value below the slider minimum falls back to its default
    Given the saved data is '{"loan": -1}'
    When I open the app
    Then the loan amount is set to 45 000 000

  Scenario: A value with more decimals than allowed falls back to its default
    Given the saved data is '{"years": 20.5}'
    When I open the app
    Then the years is set to 25

  Scenario: A typed value between slider steps is restored exactly
    Given the saved data is '{"loan": 45500000}'
    When I open the app
    Then the loan amount is set to 45 500 000

  Scenario: An unknown currency falls back to forint
    Given the saved data is '{"currency": "GBP"}'
    When I open the app
    Then the currency is HUF

  Scenario: Data saved by an older version without the newer parameters still loads
    Given the saved data is '{"loan": 30000000}'
    When I open the app
    Then the loan amount is set to 30 000 000
    And the monthly installment is set to 300 000

  Scenario: Values of removed inputs in old saved data are ignored
    Older versions also saved the property value and its growth (removed in decision 0015).
    Given the saved data is '{"loan": 30000000, "property": 80000000, "appr": 5}'
    When I open the app
    Then the loan amount is set to 30 000 000
    And no removed inputs are kept

  Scenario: Saved worst and best cases in the wrong order are put back in order
    Given the saved data is '{"invWorst": 12, "invBest": 5}'
    When I open the app
    Then the worst-case return is set to 5
    And the best-case return is set to 5

  Scenario: A browser that blocks storage still runs the calculator
    Given the default parameters
    Then saving does not fail when the browser blocks storage
