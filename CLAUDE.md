# FinanceApp

Browser-based financial calculator: sliders → live chart + table. Will be sold commercially; source is proprietary.

## Stack
- TypeScript (strict), Vite, Chart.js (tree-shaken: register only the components used), Vitest.
- No UI framework — plain DOM in `src/main.ts`. Styles in `src/style.css` (colors as CSS variables on `:root`).

## Layout
- `index.html` — page shell.
- `src/calc.ts` — pure financial calculations (no DOM). Keep all math here and unit-test it in `src/*.test.ts`.
- `src/main.ts` — sliders, chart, table, wiring.

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
- Run `npm run typecheck` and `npm test` before committing.
