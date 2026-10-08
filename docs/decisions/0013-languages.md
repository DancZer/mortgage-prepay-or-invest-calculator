# 0013 – Hungarian, Slovak, German and English; number format follows the language

**Status:** accepted, 2026-10-08 (supersedes the "one number format" part of 0006)

**Context:** The target users are in Hungary, Slovakia and German-speaking countries, plus English
speakers.

**Decision:**

- All user-visible texts live in `src/i18n.ts` in four languages. The switch is at the bottom of the
  input panel, followed by the credits.
- First visit: the browser's preferred languages are checked in order; the first of hu/sk/de/en wins,
  otherwise English. The user's choice is stored in `localStorage` and wins afterwards.
- Numbers, percentages and dates use the language's format (`hu-HU`, `sk-SK`, `de-DE`, `en-GB`), e.g.
  "45 000 000 Ft", "45.000.000 Ft", "Ft 45,000,000"; "6,18%", "6,18 %", "6.18%".
- Typed numbers are read with the same separators. Spaces are always ignored, and the other decimal
  mark is accepted when it cannot be a thousands separator ("6.5" in German, "6,5" in English).
- Amounts are still not converted between currencies (0006).

**Consequences:** Every new text must be added in all four languages (a scenario checks this). The
scenarios use English unless they test a language. Translations were written without a native-speaker
review; they should be reviewed before wide publication.
