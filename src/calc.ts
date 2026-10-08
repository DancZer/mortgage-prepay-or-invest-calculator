export interface InvestmentInputs {
  initial: number;
  monthlyContribution: number;
  annualReturnPct: number;
  years: number;
}

export interface YearRow {
  year: number;
  contributions: number;
  growth: number;
  balance: number;
}

/**
 * Month-by-month compounding. Contributions are added at the end of each month.
 * Returns one row per year (year 0 = starting point).
 */
export function projectInvestment(inputs: InvestmentInputs): YearRow[] {
  const { initial, monthlyContribution, annualReturnPct, years } = inputs;
  const monthlyRate = annualReturnPct / 100 / 12;

  let balance = initial;
  let contributions = initial;
  const rows: YearRow[] = [{ year: 0, contributions, growth: 0, balance }];

  for (let year = 1; year <= years; year++) {
    for (let m = 0; m < 12; m++) {
      balance = balance * (1 + monthlyRate) + monthlyContribution;
      contributions += monthlyContribution;
    }
    rows.push({ year, contributions, growth: balance - contributions, balance });
  }
  return rows;
}
