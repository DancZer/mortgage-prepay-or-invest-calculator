# 0004 – Slider steps chosen so defaults lie on the grid

**Status:** accepted, 2026-10-08 (changes the original spec)

**Context:** The spec's steps (mortgage rate 0.1 %, investment return 0.5 % from 0.1 %) do not contain
the defaults 6.18 % and 10 %; browsers silently snap such values to the nearest step.

**Decision:** Mortgage rate steps by 0.01 %, investment returns by 0.1 %. A scenario checks that every
default is selectable.

**Consequences:** Finer sliders; defaults are shown exactly as specified.
