import { describe, expect, it } from "vitest";
import { projectInvestment } from "./calc";

describe("projectInvestment", () => {
  it("with 0% return the balance equals total contributions", () => {
    const rows = projectInvestment({ initial: 1000, monthlyContribution: 100, annualReturnPct: 0, years: 2 });
    expect(rows).toHaveLength(3);
    expect(rows[2].balance).toBe(1000 + 100 * 24);
    expect(rows[2].growth).toBe(0);
  });

  it("compounds a lump sum monthly", () => {
    const rows = projectInvestment({ initial: 10000, monthlyContribution: 0, annualReturnPct: 12, years: 1 });
    expect(rows[1].balance).toBeCloseTo(10000 * Math.pow(1.01, 12), 6);
  });

  it("matches the future value of an ordinary annuity", () => {
    const r = 0.06 / 12;
    const n = 10 * 12;
    const expected = 200 * ((Math.pow(1 + r, n) - 1) / r);
    const rows = projectInvestment({ initial: 0, monthlyContribution: 200, annualReturnPct: 6, years: 10 });
    expect(rows[10].balance).toBeCloseTo(expected, 6);
    expect(rows[10].contributions).toBe(200 * n);
  });
});
