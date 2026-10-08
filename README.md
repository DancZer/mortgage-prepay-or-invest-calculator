# FinanceApp

Interactive financial calculator in the browser: adjust parameters with sliders and see the results as a chart and a year-by-year table.

Built with TypeScript, [Vite](https://vite.dev) and [Chart.js](https://www.chartjs.org).

## Getting started

Requires Node.js 20+.

```bash
npm install
npm run dev        # start dev server at http://localhost:5173
```

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Type-check and build to `dist/` |
| `npm run preview` | Serve the production build |
| `npm test` | Run unit tests (Vitest) |
| `npm run typecheck` | TypeScript check only |
| `npm run licenses` | Fail if any dependency has a disallowed license |
| `npm run notices` | Regenerate `THIRD_PARTY_NOTICES.md` |

## Licensing

This project is proprietary — see [LICENSE](LICENSE).

Dependencies are restricted to licenses that allow closed-source commercial use:

- **Shipped (runtime) dependencies:** MIT, Apache-2.0, BSD, ISC, 0BSD, CC0, BlueOak only.
- **Build tools (dev dependencies, not shipped):** additionally MPL-2.0 and CC-BY (e.g. Vite's `lightningcss`).
- GPL, AGPL, LGPL, SSPL and "non-commercial" licenses are never allowed.

Run `npm run licenses` after adding any dependency. When distributing, include `THIRD_PARTY_NOTICES.md`.
