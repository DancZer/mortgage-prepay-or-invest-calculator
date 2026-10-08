# 0001 – Static TypeScript app with permissively licensed dependencies only

**Status:** accepted, 2026-10-08

**Context:** The app will be sold later, possibly closed-source. Copyleft licenses (GPL, AGPL, LGPL)
could force the source to be published.

**Decision:** HTML + TypeScript built with Vite, charts with Chart.js, tests with Vitest and Cucumber.
Runtime dependencies must be MIT, Apache-2.0, BSD, ISC, 0BSD, CC0 or BlueOak. Build tools may also
use MPL-2.0 and CC-BY (e.g. Vite's `lightningcss`), because they are not shipped. `npm run licenses`
enforces this; `THIRD_PARTY_NOTICES.md` lists shipped dependencies.

**Consequences:** Some popular libraries (Highcharts, AG Grid Enterprise) are excluded. Every new
dependency needs a license check.
