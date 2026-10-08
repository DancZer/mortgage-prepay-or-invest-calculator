# Decision records

Short notes on why the project is the way it is. One file per decision, numbered, never rewritten:
if a decision changes, add a new record and mark the old one as superseded.

Template: **Status**, **Context**, **Decision**, **Consequences**.

| #                                                 | Decision                                                            |
| ------------------------------------------------- | ------------------------------------------------------------------- |
| [0001](0001-stack-and-licensing.md)               | Static TypeScript app with permissively licensed dependencies only  |
| [0002](0002-payoff-month-leftover-is-invested.md) | In the payoff month, money the bank doesn't need is invested        |
| [0003](0003-path-a-invests-freed-installment.md)  | Path A invests its freed installment after payoff                   |
| [0004](0004-slider-steps-match-defaults.md)       | Slider steps chosen so defaults lie on the grid                     |
| [0005](0005-prepayment-as-share.md)               | Prepayment is a share of the extra savings                          |
| [0006](0006-currency-symbol-and-rounding.md)      | Currency changes symbol and rounding, not amounts                   |
| [0007](0007-worst-and-best-case-returns.md)       | Worst-case and best-case returns, break-even and verdict            |
| [0008](0008-property-value-separate-from-loan.md) | Property value is separate from the loan and grows                  |
| [0009](0009-tool-neutral-specification.md)        | Requirements as Cucumber scenarios, tool-neutral agent instructions |
| [0010](0010-client-side-netlify.md)               | Client-side only, inputs in localStorage, hosted on Netlify         |
| [0011](0011-typed-inputs-extend-sliders.md)       | Typed values; values above the maximum extend the slider            |
