import { describe, expect, it } from "vitest";
import { installmentTooLow, simulate, toYearMonth, type SimInputs } from "./calc";

const defaults: SimInputs = {
  initial: 45_000_000,
  installment: 300_000,
  extra: 150_000,
  prepay: 75_000,
  inf: 4,
  inv: 10,
  mort: 6.18,
  penalty: 1.5,
  years: 25,
};

describe("simulate", () => {
  it("with no prepayment, Path B loan matches Path A loan", () => {
    const { rows, payoffMonthA, payoffMonthB } = simulate({ ...defaults, prepay: 0 });
    expect(payoffMonthB).toBe(payoffMonthA);
    for (const r of rows) expect(r.loanB).toBeCloseTo(r.loanA, 4);
  });

  it("Path A investment matches the annuity-due future value when inflation is 0", () => {
    const p = { ...defaults, inf: 0, years: 10 };
    const r = p.inv / 100 / 12;
    const n = 120;
    const expected = p.extra * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
    expect(simulate(p).rows[n].invA).toBeCloseTo(expected, 2);
  });

  it("grows the extra savings by inflation once per year", () => {
    const { rows } = simulate(defaults);
    expect(rows[1].extra).toBe(150_000);
    expect(rows[12].extra).toBe(150_000);
    expect(rows[13].extra).toBeCloseTo(150_000 * 1.04, 6);
    expect(rows[300].extra).toBeCloseTo(150_000 * Math.pow(1.04, 24), 6);
  });

  it("caps the prepayment at the extra savings", () => {
    const { rows } = simulate({ ...defaults, extra: 100_000, prepay: 500_000 });
    expect(rows[12].invB).toBe(0);
  });

  it("a prepayment penalty slows down the payoff", () => {
    const noPenalty = simulate({ ...defaults, penalty: 0 });
    const withPenalty = simulate({ ...defaults, penalty: 5 });
    expect(withPenalty.rows[12].loanB).toBeGreaterThan(noPenalty.rows[12].loanB);
    expect(withPenalty.payoffMonthB!).toBeGreaterThanOrEqual(noPenalty.payoffMonthB!);
  });

  it("prepaying pays the loan off earlier", () => {
    const { payoffMonthA, payoffMonthB } = simulate(defaults);
    expect(payoffMonthA).not.toBeNull();
    expect(payoffMonthB).not.toBeNull();
    expect(payoffMonthB!).toBeLessThan(payoffMonthA!);
  });

  it("conserves money in the payoff month (zero rates, exact numbers)", () => {
    // 1,000,000 loan, 0% interest. Path A pays 10,000/month -> paid off in month 100.
    // Path B pays 15,000/month -> month 67 needs only 10,000, so 5,000 is invested,
    // then 15,000/month for months 68..120.
    const { rows, payoffMonthA, payoffMonthB } = simulate({
      initial: 1_000_000,
      installment: 10_000,
      extra: 5_000,
      prepay: 5_000,
      inf: 0,
      inv: 0,
      mort: 0,
      penalty: 0,
      years: 10,
    });
    expect(payoffMonthA).toBe(100);
    expect(payoffMonthB).toBe(67);
    const last = rows[120];
    expect(last.netA).toBeCloseTo(1_600_000, 6);
    expect(last.netB).toBeCloseTo(1_800_000, 6);
  });
});

describe("helpers", () => {
  it("toYearMonth", () => {
    expect(toYearMonth(1)).toEqual({ year: 1, month: 1 });
    expect(toYearMonth(12)).toEqual({ year: 1, month: 12 });
    expect(toYearMonth(13)).toEqual({ year: 2, month: 1 });
  });

  it("installmentTooLow", () => {
    expect(installmentTooLow(defaults)).toBe(false);
    expect(installmentTooLow({ initial: 100_000_000, installment: 100_000, mort: 15 })).toBe(true);
  });
});
