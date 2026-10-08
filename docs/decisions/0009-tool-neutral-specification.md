# 0009 – Requirements as Cucumber scenarios, tool-neutral agent instructions

**Status:** accepted, 2026-10-08

**Context:** The app is developed with AI coding agents; the owner wants to be able to switch tools
without losing the specification or the workflow.

**Decision:**

- Requirements live in `features/*.feature` as human-readable, executable scenarios.
- Agent instructions live in `AGENTS.md` (an open convention read by many tools); tool-specific files
  such as `CLAUDE.md` only point to it.
- Reasons for decisions live in `docs/decisions/`.
- One command, `npm run check`, verifies everything; CI and Netlify run the same command.
- `.editorconfig`, `.nvmrc`, `.gitattributes` (LF) and Prettier make formatting and the Node version
  independent of tool and machine.

**Consequences:** Any tool or developer can pick up the project from the repository alone.
