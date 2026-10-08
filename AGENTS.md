# Mortgage Prepay or Invest Calculator – instructions for developers and AI coding agents

This file is the single source of instructions for anyone (human or AI tool) working on this repo.
Tool-specific files such as `CLAUDE.md` only point here. Keep it tool-neutral.

## Product

**Mortgage vs. Investment simulator.** Helps individuals — especially skeptics who believe a good
investment always beats prepaying — compare two strategies with their own numbers:

- **Path A:** pay the mortgage installment, invest all extra savings.
- **Path B:** use a share of the extra savings to prepay the mortgage (minus a penalty), invest the rest.
- Both paths invest the freed-up installment plus all extra savings once their mortgage is paid off.

Goal: maximise **net wealth = property value + investments − remaining loan**. Results are shown for a
worst-case and a best-case investment return, with a break-even return and a plain-language verdict.
Available in Hungarian, Slovak, German and English. Open source under the MIT license (see `LICENSE`),
created by László Tánczos (https://github.com/DancZer).

## Source of truth

1. **`features/*.feature`** — the requirements as executable Cucumber scenarios. Every behaviour change
   starts here: add or change a scenario first, then the code. Expected values should be checkable by
   hand where possible; values recorded from the model are marked as such (`@regression`, notes).
2. **`docs/decisions/`** — why things are the way they are (numbered decision records). Add one for
   every non-obvious choice or deviation from the original spec.
3. This file — how to work in the repo.

### Out of scope (decided with the product owner, 2026-10-08)

Variable or resetting mortgage rates; lump-sum or fee-based prepayment rules; lowering the installment
instead of the term after a prepayment; taxes and fund fees; results in today's money; liquidity / cash
views; entering the loan term instead of the installment. Do not add these without a new decision record.

## Architecture

Static single-page app, no backend. Everything runs in the browser; inputs are kept in `localStorage`.

| File               | Responsibility                                                                                                                                                                           |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/calc.ts`      | Pure monthly simulation (`simulate`) for one investment return. All money is kept as integers in the currency's smallest unit, so every monthly amount is rounded like a bank statement. |
| `src/scenarios.ts` | App inputs (worst/best return, currency), runs both scenarios, break-even return (bisection).                                                                                            |
| `src/params.ts`    | Slider definitions (defaults, ranges, steps), `applyInput` (keeps worst ≤ best), typed values and slider maximums (`applyTypedValue`, `fitMaxes`).                                       |
| `src/currency.ts`  | Currencies (HUF/EUR/USD), rounding digits, money formatting (only the symbol changes).                                                                                                   |
| `src/storage.ts`   | Save/load inputs; invalid or old data falls back to defaults.                                                                                                                            |
| `src/i18n.ts`      | All user-visible texts in hu/sk/de/en, language detection, reading typed numbers per language.                                                                                           |
| `src/about.ts`     | Author, GitHub link, copyright year and license link shown in the credits.                                                                                                               |
| `src/view.ts`      | Pure display logic: cards, verdict, chart series, payoff marker, yearly table, texts.                                                                                                    |
| `src/tooltip.ts`   | The "?" explanation buttons and their shared tooltip (hover, tap, keyboard).                                                                                                             |
| `src/main.ts`      | DOM and Chart.js wiring only. No logic the scenarios cannot reach.                                                                                                                       |
| `features/`        | Scenarios, step definitions (`step_definitions/`), test world (`support/`).                                                                                                              |

Rule of thumb: if it can be tested without a browser, it does not belong in `main.ts`.

## Commands

| Command                                | What it does                                                                        |
| -------------------------------------- | ----------------------------------------------------------------------------------- |
| `npm run dev`                          | Dev server on http://localhost:5173                                                 |
| `npm run check`                        | **Everything CI runs:** formatting, type check, unit tests, scenarios, license gate |
| `npm run format`                       | Format all files with Prettier                                                      |
| `npm run bdd`                          | Run the scenarios; HTML report in `reports/cucumber-report.html`                    |
| `npm run build`                        | Production build into `dist/`                                                       |
| `npm run licenses` / `npm run notices` | License gate / regenerate `THIRD_PARTY_NOTICES.md`                                  |

Run `npm run check` before every commit. CI (GitHub Actions) and Netlify run it too; Netlify will not
deploy if it fails.

## Rules

- **Explanations:** the app is educational. Every input, result card and panel has a "?" button
  with an explanation in `help` in `src/i18n.ts` (all four languages); add one for anything new.
- **Texts:** never hard-code a user-visible text. Add it to every language in `src/i18n.ts`; the
  scenario "No language is missing a text" fails otherwise. Translations should be checked by native speakers.
- **Dependency licenses:** only permissively licensed packages, so the project stays MIT and anyone may reuse it. Runtime: MIT,
  Apache-2.0, BSD, ISC, 0BSD, CC0, BlueOak. Never GPL, AGPL, LGPL, SSPL, Commons Clause or
  "non-commercial" licenses (e.g. Highcharts, amCharts, AG Grid Enterprise, Handsontable).
  After installing anything: `npm run licenses` and `npm run notices`.
- Prefer no dependency over a new one for small things.
- Keep formatting to Prettier (`npm run format`); LF line endings everywhere.
- Never present results as financial advice; keep the disclaimer visible.
- Commit messages: imperative summary line, body explaining what and why.
