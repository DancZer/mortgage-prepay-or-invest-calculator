# FinanceApp – Mortgage vs. Investment

Should you prepay your mortgage or invest? This browser app compares two strategies with your own numbers:

- **Path A:** pay the mortgage installment and invest all extra monthly savings.
- **Path B:** use a share of the extra savings to prepay the mortgage (after a prepayment penalty) and invest the rest.
- Both paths invest the freed-up installment plus all extra savings once their mortgage is paid off.

Results — net wealth (property + investments − loan) — are shown for a worst-case and a best-case investment
return, together with the **break-even return** above which investing wins, a plain-language verdict, a chart
and a year-by-year table. Amounts can be shown in forint, euro or dollar. Inputs are remembered in the browser.

Available in **Hungarian, Slovak, German and English** — numbers and dates follow the chosen language.

Built with TypeScript, [Vite](https://vite.dev) and [Chart.js](https://www.chartjs.org).

## Getting started

Requires Node.js 22 (see `.nvmrc`).

```bash
npm install
npm run dev        # http://localhost:5173
```

## Scripts

| Command                                | What it does                                                                |
| -------------------------------------- | --------------------------------------------------------------------------- |
| `npm run dev`                          | Dev server with hot reload                                                  |
| `npm run check`                        | Everything CI runs: formatting, type check, unit tests, scenarios, licenses |
| `npm run format`                       | Format all files (Prettier)                                                 |
| `npm test`                             | Unit tests (Vitest)                                                         |
| `npm run bdd`                          | Requirement scenarios in `features/` (Cucumber); report in `reports/`       |
| `npm run build`                        | Type-check and build to `dist/`                                             |
| `npm run licenses` / `npm run notices` | License gate / regenerate `THIRD_PARTY_NOTICES.md`                          |

## Project documentation

- [`features/`](features) – the requirements as human-readable, executable scenarios.
- [`docs/decisions/`](docs/decisions) – why things are the way they are.
- [`AGENTS.md`](AGENTS.md) – architecture and working rules for developers and AI coding tools.

## Deployment

Netlify builds every push to GitHub using [`netlify.toml`](netlify.toml): it runs `npm run check`, builds, and
publishes `dist/`. GitHub Actions ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)) runs the same checks on
pushes and pull requests.

## Contributing

Issues and pull requests are welcome. Please describe new behaviour as a scenario in `features/` first, add any
new text in all four languages in `src/i18n.ts`, and run `npm run check` before opening a pull request.

## License

[MIT](LICENSE) © 2026 [László Tánczos](https://github.com/DancZer). Dependencies are restricted to permissive
licenses ([decision 0001](docs/decisions/0001-stack-and-licensing.md)); `THIRD_PARTY_NOTICES.md` lists the ones
shipped with the app.

The app is for illustration and education only and is not financial advice.
