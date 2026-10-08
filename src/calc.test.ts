import { describe, expect, it } from "vitest";
import { elapsedTime, installmentTooLow, simulate, toYearMonth, type ModelInputs } from "./calc";

const defaults: ModelInputs = {
  loan: 45_000_000,
  installment: 300_000,
  extra: 150_000,
  prepayPct: 50,
  inf: 4,
  inv: 10,
  mort: 6.18,
  penalty: 1.5,
  years: 25,
  decimals: 0,
};

describe("simulate", () => {
  it("with no prepayment, both paths are identical", () => {
    const { rows, payoffMonthA, payoffMonthB } = simulate({ ...defaults, prepayPct: 0, years: 30 });
    expect(payoffMonthB).toBe(payoffMonthA);
    for (const r of rows) {
      expect(r.loanB).toBe(r.loanA);
      expect(r.invB).toBe(r.invA);
    }
  });

  it("Path A investment matches the annuity-due future value when inflation is 0 (to rounding)", () => {
    const p = { ...defaults, inf: 0, years: 10, decimals: 2 };
    const r = p.inv / 100 / 12;
    const n = 120;
    const expected = p.extra * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
    expect(Math.abs(simulate(p).rows[n].invA - expected)).toBeLessThan(1);
  });

  it("grows the extra savings by inflation once per year", () => {
    const { rows } = simulate(defaults);
    expect(rows[1].extra).toBe(150_000);
    expect(rows[12].extra).toBe(150_000);
    expect(rows[13].extra).toBe(156_000);
    expect(rows[300].extra).toBe(Math.round(150_000 * Math.pow(1.04, 24)));
  });

  it("prepaying 100 % leaves nothing to invest while the loan is open", () => {
    const { rows } = simulate({ ...defaults, prepayPct: 100 });
    expect(rows[12].invB).toBe(0);
  });

  it("a prepayment penalty slows down the payoff", () => {
    const noPenalty = simulate({ ...defaults, penalty: 0 });
    const withPenalty = simulate({ ...defaults, penalty: 5 });
    expect(withPenalty.rows[12].loanB).toBeGreaterThan(noPenalty.rows[12].loanB);
    expect(withPenalty.payoffMonthB!).toBeGreaterThanOrEqual(noPenalty.payoffMonthB!);
  });

  it("after Path B payoff, invests installment + inflated extra every month", () => {
    const { rows, payoffMonthB } = simulate({ ...defaults, prepayPct: 100 });
    expect(payoffMonthB).toBe(130);
    for (let m = 1; m < 130; m++) expect(rows[m].contribB).toBe(0);
    for (let m = 131; m <= 300; m++) expect(rows[m].contribB).toBe(300_000 + rows[m].extra);
  });

  it("conserves money (zero rates, exact numbers)", () => {
    // 1,000,000 loan, 0% interest. Path A pays 10,000/month -> paid off in month 100,
    // then invests 15,000/month. Path B pays 15,000/month -> month 67 needs only 10,000,
    // so 5,000 is invested, then 15,000/month. With no rates both end up equal.
    const { rows, payoffMonthA, payoffMonthB } = simulate({
      loan: 1_000_000,
      installment: 10_000,
      extra: 5_000,
      prepayPct: 100,
      inf: 0,
      inv: 0,
      mort: 0,
      penalty: 0,
      years: 10,
      decimals: 0,
    });
    expect(payoffMonthA).toBe(100);
    expect(payoffMonthB).toBe(67);
    expect(rows[120].netA).toBe(800_000);
    expect(rows[120].netB).toBe(800_000);
    expect(rows[67].contribB).toBe(5_000);
    expect(rows[68].contribB).toBe(15_000);
  });

  it("keeps every amount on the currency's smallest unit", () => {
    for (const decimals of [0, 2]) {
      const { rows } = simulate({ ...defaults, decimals });
      const unit = Math.pow(10, decimals);
      for (const r of rows.slice(0, 50)) {
        for (const v of [r.loanA, r.invA, r.loanB, r.invB]) {
          expect(Math.abs(v * unit - Math.round(v * unit))).toBeLessThan(1e-6);
        }
      }
    }
  });
});

describe("helpers", () => {
  it("toYearMonth", () => {
    expect(toYearMonth(1)).toEqual({ year: 1, month: 1 });
    expect(toYearMonth(12)).toEqual({ year: 1, month: 12 });
    expect(toYearMonth(13)).toEqual({ year: 2, month: 1 });
  });

  it("elapsedTime", () => {
    expect(elapsedTime(130)).toEqual({ years: 10, months: 10 });
    expect(elapsedTime(12)).toEqual({ years: 1, months: 0 });
  });

  it("installmentTooLow", () => {
    expect(installmentTooLow(defaults)).toBe(false);
    expect(installmentTooLow({ loan: 100_000_000, installment: 100_000, mort: 15 })).toBe(true);
  });
});
