# FinanceApp

Mortgage vs. Investment wealth simulator: compares Path A (invest all extra savings) with Path B
(prepay the mortgage with part of the savings, then invest everything after payoff). Sliders → live
line chart, summary cards and a yearly table. Will be sold commercially; source is proprietary.

## Simulation rules (src/calc.ts)
- Monthly engine; extra savings and prepayment budget grow by `inf` each year; prepayment capped at extra.
- Net wealth = initial (property value) + investments − remaining loan.
- Prepayment penalty: only `prepay / (1 + penalty)` reaches principal.
- Payoff month (both paths): money the bank doesn't need is invested (no double counting).
- After payoff (both paths): installment + inflated extra savings are invested every month.
  (Changed from the original spec for Path A, agreed with the user on 2026-10-08.)
- Currency/locale: `CURRENCY` / `LOCALE` constants in `src/view.ts` (HUF, hu-HU).

## Stack
- TypeScript (strict), Vite, Chart.js (tree-shaken: register only the components used), Vitest.
- No UI framework — plain DOM in `src/main.ts`. Styles in `src/style.css` (colors as CSS variables on `:root`).

## Layout
- `index.html` — page shell.
- `src/calc.ts` — pure simulation (`simulate`, no DOM). Keep all math here and unit-test it in `src/*.test.ts`.
- `src/params.ts` — slider definitions (defaults, ranges, steps) and `applyInput` (prepayment cap).
- `src/view.ts` — pure display logic: cards, chart series, payoff marker, yearly table, warning, formatting.
- `src/main.ts` — DOM/Chart.js rendering only; no logic that the requirement scenarios can't reach.
- `features/*.feature` — the requirements as Cucumber scenarios (human-readable spec, source of truth).
  Step definitions in `features/step_definitions/`. `@manual` scenarios are not automated;
  `@regression` values are recorded from the model. Keep every requirement change in a feature file.

## Commands
- `npm run dev` — dev server (port 5173; also in `.claude/launch.json` as `dev`)
- `npm test`, `npm run typecheck`, `npm run build`
- `npm run licenses` — license gate; `npm run notices` — regenerate THIRD_PARTY_NOTICES.md

## Rules
- **Dependency licenses:** only add packages whose license permits closed-source commercial use.
  Runtime deps: MIT / Apache-2.0 / BSD / ISC / 0BSD / CC0 / BlueOak only. Never GPL, AGPL, LGPL, SSPL,
  Commons Clause, or "free for non-commercial use" (e.g. Highcharts, amCharts, AG Grid Enterprise, Handsontable).
  Check the license before installing; after any install run `npm run licenses` and `npm run notices`.
- Prefer no dependency over a new dependency for small things.
- Run `npm run typecheck` and `npm run test:all` before committing.
