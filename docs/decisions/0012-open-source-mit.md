# 0012 – Open source under the MIT license

**Status:** accepted, 2026-10-08 (supersedes the "proprietary, to be sold" parts of 0001 and 0010)

**Context:** The app was first planned as a commercial product. The owner decided not to sell it and
to publish it as open source instead.

**Decision:** The project is licensed under MIT (`LICENSE`, `package.json`). The credits in the app
name the author (László Tánczos), link to https://github.com/DancZer, show the copyright year and the
build date, and link to the MIT license text.

- The dependency license gate from 0001 stays: permissive dependencies keep the whole project MIT-
  compatible, while a copyleft (GPL/AGPL) dependency would force a different license on everything.
- The white-label / paid-feature ideas and the "terms of use by a lawyer" note from 0010 no longer apply.
  The "not financial advice" disclaimer stays, because users still act on the results.

**Consequences:** Anyone may use, change and redistribute the app, including commercially, as long as
the copyright notice is kept. `THIRD_PARTY_NOTICES.md` still lists the shipped dependencies.
