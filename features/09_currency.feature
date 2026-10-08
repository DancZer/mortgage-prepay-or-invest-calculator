Feature: Currency
  The user chooses forint, euro or dollar. Switching changes the symbol and the rounding;
  amounts are not converted (decision 0006). The number format follows the language; these
  scenarios use English (see 14_languages.feature). Every monthly amount (interest, return, payment)
  is rounded to the currency's smallest unit: whole forints, or cents for euro and dollar.

  Scenario: Forint is the default currency
    Given the default parameters
    Then the currency is HUF

  Scenario Outline: Amounts are shown with the chosen currency's symbol
    Given I use the currency <currency>
    Then the amount "45 000 000" is shown as "<shown>"

    Examples:
      | currency | shown         |
      | HUF      | Ft 45,000,000 |
      | EUR      | €45,000,000  |
      | USD      | $45,000,000  |

  Scenario: Switching currency keeps the numbers and changes the symbol
    Given the default parameters
    When I switch the currency to EUR
    Then the loan amount is set to 45 000 000
    And the "loan amount" slider shows "€45,000,000"

  Scenario Outline: Investment returns are rounded to the currency's smallest unit each month
    Month 3 return is 303 010 × 1% = 3 030.10: forint rounds it to 3 030, euro and dollar keep the cents.
    Given all rates are zero
    And the parameters:
      | currency              | <currency> |
      | monthly extra savings | 100 000    |
      | investment return     | 12%       |
    When I run the simulation
    Then the monthly results are:
      | month | investments A |
      | 3     | <month 3>     |

    Examples:
      | currency | month 3    |
      | HUF      | 306 040    |
      | EUR      | 306 040.10 |
      | USD      | 306 040.10 |

  Scenario Outline: Mortgage interest is rounded to the currency's smallest unit each month
    Interest on 1 000 001 at 1% a month is 10 000.01.
    Given all rates are zero
    And the parameters:
      | currency            | <currency> |
      | loan amount         | 1 000 001  |
      | monthly installment | 50 000     |
      | mortgage rate       | 12%       |
    When I run the simulation
    Then the monthly results are:
      | month | loan A    |
      | 1     | <month 1> |

    Examples:
      | currency | month 1    |
      | HUF      | 960 001    |
      | EUR      | 960 001.01 |
