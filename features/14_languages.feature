Feature: Languages and credits
  The app is available in Hungarian, Slovak, German and English (decision 0013). The language
  switch is at the bottom of the input panel, followed by the credits. On the first visit the
  app uses the browser's preferred language when it is one of the four, otherwise English; the
  user's choice is remembered. Numbers, percentages and dates are written the way the chosen
  language writes them, and typed numbers are read the same way.

  All other feature files use English. Translations should be reviewed by native speakers.

  Rule: The language is chosen from the browser and then remembered

    Scenario Outline: The first visit uses the browser's preferred language
      Given I have never used the app before
      When I open the app in a browser set to "<browser languages>"
      Then the app is shown in <language>

      Examples:
        | browser languages | language  |
        | hu-HU, en         | Hungarian |
        | sk                | Slovak    |
        | de-AT, en         | German    |
        | fr-FR, de         | German    |
        | en-US             | English   |
        | fr-FR             | English   |
        |                   | English   |

    Scenario: The user's own choice wins over the browser language
      Given I chose Slovak before
      When I open the app in a browser set to "de-DE"
      Then the app is shown in Slovak

  Rule: Every text exists in every language

    Scenario: No language is missing a text
      Then every language has the same texts as English, none of them empty

    Scenario Outline: The title is translated
      Given the language is <language>
      Then the title is "<title>"

      Examples:
        | language  | title                         |
        | Hungarian | Jelzáloghitel vagy befektetés |
        | Slovak    | Hypotéka alebo investícia     |
        | German    | Hypothek oder Investition     |
        | English   | Mortgage vs. Investment       |

  Rule: Numbers are written the way the language writes them

    Scenario Outline: Amounts
      Given the language is <language>
      And I use the currency <currency>
      Then the amount "45 000 000" is shown as "<shown>"

      Examples:
        | language  | currency | shown         |
        | Hungarian | HUF      | 45 000 000 Ft |
        | Slovak    | EUR      | 45 000 000 €  |
        | German    | HUF      | 45.000.000 Ft |
        | German    | EUR      | 45.000.000 €  |
        | English   | HUF      | Ft 45,000,000 |
        | English   | USD      | $45,000,000   |

    Scenario Outline: Percentages
      Given the language is <language>
      And the default parameters
      Then the "mortgage rate" slider shows "<shown>"

      Examples:
        | language  | shown  |
        | Hungarian | 6,18%  |
        | Slovak    | 6,18 % |
        | German    | 6,18 % |
        | English   | 6.18%  |

    Scenario Outline: Time until payoff and its calendar month
      Given the language is <language>
      Then a payoff in month <month> of a loan starting in October 2026 is shown as "<time>" in "<date>"

      Examples:
        | language  | month | time                 | date           |
        | Hungarian | 130   | 10 év 10 hónap       | 2037. július   |
        | Hungarian | 13    | 1 év 1 hónap         | 2027. október  |
        | Slovak    | 130   | 10 rokov 10 mesiacov | júl 2037       |
        | Slovak    | 13    | 1 rok 1 mesiac       | október 2027   |
        | Slovak    | 27    | 2 roky 3 mesiace     | december 2028  |
        | German    | 130   | 10 Jahre 10 Monate   | Juli 2037      |
        | German    | 13    | 1 Jahr 1 Monat       | Oktober 2027   |
        | German    | 12    | 1 Jahr               | September 2027 |

  Rule: Typed numbers are read the way the language writes them
    Spaces are always ignored. The other decimal mark is also accepted when it cannot be a
    thousands separator, so "6.5" works in German and "6,5" in English.

    Scenario Outline: Accepted input
      Given the default parameters
      And the language is <language>
      When I type "<typed>" into the <parameter> field
      Then the typed value is accepted
      And the <parameter> is set to <value>

      Examples:
        | language  | parameter     | typed        | value      |
        | Hungarian | loan amount   | 45 500 000   | 45 500 000 |
        | Hungarian | mortgage rate | 6,5          | 6.5        |
        | Hungarian | mortgage rate | 6.5          | 6.5        |
        | Slovak    | mortgage rate | 6,5          | 6.5        |
        | German    | loan amount   | 45.500.000   | 45 500 000 |
        | German    | loan amount   | 12.345.678,9 | 12 345 679 |
        | German    | mortgage rate | 6,5          | 6.5        |
        | German    | mortgage rate | 6.5          | 6.5        |
        | English   | loan amount   | 45,500,000   | 45 500 000 |
        | English   | mortgage rate | 6.5          | 6.5        |
        | English   | mortgage rate | 6,5          | 6.5        |

    Scenario Outline: Rejected input, with the message in the language
      Given the default parameters
      And the language is <language>
      When I type "<typed>" into the loan amount field
      Then the input is rejected with "<message>"
      And no parameter has changed

      Examples:
        | language  | typed     | message                   |
        | Hungarian | 1,234,567 | Adjon meg egy számot      |
        | Hungarian | -1        | A minimum 0 Ft            |
        | Slovak    | -1        | Minimum je 0 Ft           |
        | German    | -1        | Minimum ist 0 Ft          |
        | German    | 1.2.3     | Bitte eine Zahl eingeben  |

  Rule: Results are explained in the language
    The amounts were recorded from the model; the wording is the requirement.

    Scenario Outline: Verdict for the default parameters
      Given the default parameters
      And the language is <language>
      Then the verdict is:
        """
        <verdict>
        """

      Examples:
        | language  | verdict                                                                                                                                                                                                                                                      |
        | Hungarian | Ez a hozamtól függ: évi 3,0% hozamnál az előtörlesztés nyer 12 423 253 Ft különbséggel, évi 10,0% hozamnál a befektetés nyer 38 888 517 Ft különbséggel. A befektetéssel, csak akkor jár jobban, ha évente több mint 6,05% hozamot ér el.                        |
        | Slovak    | Závisí to od výnosov: pri výnose 3,0 % ročne vyhráva predčasné splácanie o 12 423 253 Ft, pri výnose 10,0 % ročne vyhráva investovanie o 38 888 517 Ft. Investovanie vychádza lepšie, len ak vaše investície zarobia viac ako 6,05 % ročne.                    |
        | German    | Das hängt von Ihrer Rendite ab: bei 3,0 % pro Jahr gewinnt die Sondertilgung um 12.423.253 Ft, bei 10,0 % pro Jahr gewinnt das Investieren um 38.888.517 Ft. Investieren lohnt sich nur, wenn Ihre Anlagen mehr als 6,05 % pro Jahr erzielen.             |

    Scenario Outline: Difference card (worst case / best case)
      Given the default parameters
      And the language is <language>
      Then the "<card>" card shows "<values>"

      Examples:
        | language  | card              | values                          |
        | Hungarian | Különbség (B − A) | +12 423 253 Ft / -38 888 517 Ft |
        | Slovak    | Rozdiel (B − A)   | +12 423 253 Ft / -38 888 517 Ft |
        | German    | Differenz (B − A) | +12.423.253 Ft / -38.888.517 Ft |
        | English   | Difference B − A  | +Ft 12,423,253 / -Ft 38,888,517 |

  Rule: The credits name the author, date, GitHub profile and license

    Scenario Outline: Credits in every language
      Given the language is <language>
      And the app was built on "2026-10-08"
      Then the credits are:
        | created by   | <created by>                       |
        | copyright    | © 2026 László Tánczos              |
        | version      | <version>                          |
        | author link  | https://github.com/DancZer         |
        | license      | <license>                          |
        | license link | https://opensource.org/license/mit |

      Examples:
        | language  | created by                  | version                   | license     |
        | Hungarian | Készítette: László Tánczos  | Verzió: 2026. október 8.  | MIT licenc  |
        | Slovak    | Autor: László Tánczos       | Verzia z 8. októbra 2026  | Licencia MIT |
        | German    | Erstellt von László Tánczos | Version vom 8. Oktober 2026 | MIT-Lizenz |
        | English   | Created by László Tánczos   | Version of 8 October 2026 | MIT License |
