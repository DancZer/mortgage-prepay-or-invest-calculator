/** Inputs for one run of the model, with a single investment return. */
export interface ModelInputs {
  /** Initial loan amount. */
  loan: number;
  /** Fixed monthly mortgage installment. */
  installment: number;
  /** Total monthly extra savings in year 1 (grows with `inf`). */
  extra: number;
  /** Share of the extra savings Path B uses for prepayment, % (0–100). */
  prepayPct: number;
  /** Annual growth of the extra savings, %. */
  inf: number;
  /** Annual investment return, %. */
  inv: number;
  /** Annual mortgage interest rate, %. */
  mort: number;
  /** Prepayment penalty, % of the prepaid amount. */
  penalty: number;
  /** Simulation horizon in years. */
  years: number;
  /** Decimals of the currency's smallest unit; every monthly amount is rounded to it. */
  decimals: number;
}

export interface MonthRow {
  month: number;
  /** Inflation-adjusted monthly extra savings in effect this month (0 for month 0). */
  extra: number;
  /** Path B's prepayment budget this month (0 for month 0). */
  prepay: number;
  loanA: number;
  /** Money paid into the Path A investments this month (before returns). */
  contribA: number;
  invA: number;
  netA: number;
  loanB: number;
  /** Money paid into the Path B investments this month (before returns). */
  contribB: number;
  invB: number;
  netB: number;
}

export interface SimResult {
  rows: MonthRow[];
  /** Month (1-based) in which the Path A loan reaches zero; 0 when there is no loan; null if not within the horizon. */
  payoffMonthA: number | null;
  /** Month (1-based) in which the Path B loan reaches zero; 0 when there is no loan; null if not within the horizon. */
  payoffMonthB: number | null;
}

/**
 * Month-by-month simulation of two strategies:
 * - Path A: pay the baseline installment, invest all extra savings.
 * - Path B: put `prepayPct` of the extra savings toward the loan (minus penalty), invest the rest.
 * In both paths, money the bank doesn't need in the payoff month is invested, and after payoff
 * the installment + full extra is invested every month.
 * Contributions are invested at the start of the month, then the month's return is applied.
 * Net wealth = investments − remaining loan (the home is left out: it is the same in both paths).
 *
 * All amounts are kept as integers in the currency's smallest unit (e.g. cents), so every
 * monthly interest, return and payment is rounded the way a bank statement would be.
 */
export function simulate(p: ModelInputs): SimResult {
  const unit = Math.pow(10, p.decimals);
  const toMinor = (x: number) => Math.round(x * unit);
  const fromMinor = (x: number) => x / unit;

  const rm = p.mort / 100 / 12;
  const ri = p.inv / 100 / 12;
  const g = p.inf / 100;
  const penaltyFactor = 1 + p.penalty / 100;
  const share = Math.min(Math.max(p.prepayPct, 0), 100) / 100;
  const installment = toMinor(p.installment);
  const totalMonths = Math.round(p.years * 12);

  let loanA = toMinor(p.loan);
  let loanB = loanA;
  let invA = 0;
  let invB = 0;
  // Without a loan both paths are mortgage-free from the start (month 0).
  let payoffMonthA: number | null = loanA === 0 ? 0 : null;
  let payoffMonthB: number | null = loanB === 0 ? 0 : null;

  const row = (month: number, extra: number, prepay: number, contribA: number, contribB: number) => ({
    month,
    extra: fromMinor(extra),
    prepay: fromMinor(prepay),
    loanA: fromMinor(loanA),
    contribA: fromMinor(contribA),
    invA: fromMinor(invA),
    netA: fromMinor(invA - loanA),
    loanB: fromMinor(loanB),
    contribB: fromMinor(contribB),
    invB: fromMinor(invB),
    netB: fromMinor(invB - loanB),
  });

  const rows: MonthRow[] = [row(0, 0, 0, 0, 0)];

  for (let m = 1; m <= totalMonths; m++) {
    const yearIndex = Math.floor((m - 1) / 12);
    const curExtra = toMinor(p.extra * Math.pow(1 + g, yearIndex));
    const curPrepay = Math.round(curExtra * share);
    const curInvExtra = curExtra - curPrepay;

    // Path A
    let contribA: number;
    if (loanA > 0) {
      const owed = loanA + Math.round(loanA * rm);
      // In the payoff month the part of the installment the bank doesn't need is invested.
      const installmentUsed = Math.min(installment, owed);
      loanA = owed - installmentUsed;
      if (loanA === 0) payoffMonthA = m;
      contribA = curExtra + (installment - installmentUsed);
    } else {
      contribA = installment + curExtra;
    }
    invA += contribA;
    invA += Math.round(invA * ri);

    // Path B
    let contribB: number;
    if (loanB > 0) {
      const owed = loanB + Math.round(loanB * rm);
      // The installment is applied first; the prepayment covers what is left, net of penalty.
      // In the payoff month any money not needed by the bank is invested instead.
      const installmentUsed = Math.min(installment, owed);
      const remaining = owed - installmentUsed;
      const netPrepay = Math.round(curPrepay / penaltyFactor);
      let prepayCashUsed: number;
      if (netPrepay >= remaining) {
        prepayCashUsed = Math.min(curPrepay, Math.round(remaining * penaltyFactor));
        loanB = 0;
      } else {
        prepayCashUsed = curPrepay;
        loanB = remaining - netPrepay;
      }
      if (loanB === 0) payoffMonthB = m;
      contribB = curInvExtra + (installment - installmentUsed) + (curPrepay - prepayCashUsed);
    } else {
      contribB = installment + curExtra;
    }
    invB += contribB;
    invB += Math.round(invB * ri);

    rows.push(row(m, curExtra, curPrepay, contribA, contribB));
  }

  return { rows, payoffMonthA, payoffMonthB };
}

/** Converts a 1-based month index into year and month-of-year (both 1-based). */
export function toYearMonth(month: number): { year: number; month: number } {
  return { year: Math.floor((month - 1) / 12) + 1, month: ((month - 1) % 12) + 1 };
}

/** Time elapsed at the end of a 1-based month index, in whole years and remaining months. */
export function elapsedTime(month: number): { years: number; months: number } {
  return { years: Math.floor(month / 12), months: month % 12 };
}

/** True when there is a loan and the installment does not even cover the first month's interest. */
export function installmentTooLow(p: Pick<ModelInputs, "loan" | "installment" | "mort">): boolean {
  return p.loan > 0 && p.installment <= p.loan * (p.mort / 100 / 12);
}
