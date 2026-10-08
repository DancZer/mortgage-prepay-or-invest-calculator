# 0010 – Client-side only, inputs in localStorage, hosted on Netlify

**Status:** accepted, 2026-10-08; business-model notes superseded by 0012

**Context:** The product is being validated with individual users first; the business model is not
decided yet (recommendation: free public version first, white-label licensing for mortgage brokers and
financial advisors later).

**Decision:** No backend. Inputs are saved in the browser's `localStorage` (only on the user's device,
never sent anywhere); invalid or old saved data falls back to defaults. Netlify builds from GitHub,
runs `npm run check` and deploys `dist/` with security headers (`netlify.toml`). A visible disclaimer
states that the app is not financial advice.

**Consequences:** No server cost and no personal data processing on our side. The calculation code is
visible to anyone; protecting it would require moving it to a server (revisit when selling). Terms of
use should be reviewed by a lawyer before the app is sold.
