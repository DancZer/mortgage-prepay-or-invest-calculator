export interface SimInputs {
  /** Initial loan amount, also used as the property value. */
  initial: number;
  /** Fixed monthly mortgage installment. */
  installment: number;
  /** Total monthly extra savings in year 1 (grows with `inf`). */
  extra: number;
  /** Part of `extra` used for prepayment in year 1 (grows with `inf`, capped at current extra). */
  prepay: number;
  /** Annual growth of extra savings and prepayment budget, %. */
  inf: number;
  /** Annual investment return, %. */
  inv: number;
  /** Annual mortgage interest rate, %. */
  mort: number;
  /** Prepayment penalty, % of the prepaid amount. */
  penalty: number;
  /** Simulation horizon in years. */
  years: number;
}

export interface MonthRow {
  month: number;
  /** Inflation-adjusted monthly extra savings in effect this month (0 for month 0). */
  extra: number;
  loanA: number;
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
  /** Month (1-based) in which the Path A loan reaches zero, or null if not within the horizon. */
  payoffMonthA: number | null;
  /** Month (1-based) in which the Path B loan reaches zero, or null if not within the horizon. */
  payoffMonthB: number | null;
}

/**
 * Month-by-month simulation of two strategies:
 * - Path A: pay the baseline installment, invest all extra savings.
 * - Path B: put `prepay` of the extra savings toward the loan (minus penalty), invest the rest;
 *   after payoff invest installment + full extra.
 * Contributions are invested at the start of the month, then the month's return is applied.
 */
export function simulate(p: SimInputs): SimResult {
  const rm = p.mort / 100 / 12;
  const ri = p.inv / 100 / 12;
  const g = p.inf / 100;
  const penaltyFactor = 1 + p.penalty / 100;
  const totalMonths = Math.round(p.years * 12);

  let loanA = p.initial;
  let invA = 0;
  let loanB = p.initial;
  let invB = 0;
  let payoffMonthA: number | null = null;
  let payoffMonthB: number | null = null;

  const rows: MonthRow[] = [
    { month: 0, extra: 0, loanA, invA, netA: p.initial - loanA, loanB, contribB: 0, invB, netB: p.initial - loanB },
  ];

  for (let m = 1; m <= totalMonths; m++) {
    const yearIndex = Math.floor((m - 1) / 12);
    const growth = Math.pow(1 + g, yearIndex);
    const curExtra = p.extra * growth;
    const curPrepay = Math.min(p.prepay * growth, curExtra);
    const curInvExtra = curExtra - curPrepay;

    // Path A
    if (loanA > 0) {
      const interest = loanA * rm;
      loanA = Math.max(0, loanA - (p.installment - interest));
      if (loanA === 0) payoffMonthA = m;
    }
    invA = (invA + curExtra) * (1 + ri);

    // Path B
    let toInvestB: number;
    if (loanB > 0) {
      const owed = loanB + loanB * rm;
      // The installment is applied first; the prepayment covers what is left, net of penalty.
      // In the payoff month any money not needed by the bank is invested instead.
      const installmentUsed = Math.min(p.installment, owed);
      const prepayCashUsed = Math.min(curPrepay, (owed - installmentUsed) * penaltyFactor);
      loanB = owed - installmentUsed - prepayCashUsed / penaltyFactor;
      if (loanB <= 1e-6) {
        loanB = 0;
        payoffMonthB = m;
      }
      const unused = p.installment - installmentUsed + (curPrepay - prepayCashUsed);
      toInvestB = curInvExtra + unused;
    } else {
      toInvestB = p.installment + curExtra;
    }
    invB = (invB + toInvestB) * (1 + ri);

    rows.push({
      month: m,
      extra: curExtra,
      loanA,
      invA,
      netA: p.initial + invA - loanA,
      loanB,
      contribB: toInvestB,
      invB,
      netB: p.initial + invB - loanB,
    });
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

/** True when the installment does not even cover the first month's interest. */
export function installmentTooLow(p: Pick<SimInputs, "initial" | "installment" | "mort">): boolean {
  return p.installment <= p.initial * (p.mort / 100 / 12);
}
