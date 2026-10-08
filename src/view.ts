import { elapsedTime, installmentTooLow, toYearMonth, type MonthRow, type SimInputs, type SimResult } from "./calc";
import type { ParamDef } from "./params";

export const CURRENCY = "HUF";
export const LOCALE = "hu-HU";

const money = new Intl.NumberFormat(LOCALE, { style: "currency", currency: CURRENCY, maximumFractionDigits: 0 });
export const fmtMoney = (v: number) => money.format(v);
export const fmtMillions = (v: number) => `${(v / 1e6).toLocaleString(LOCALE, { maximumFractionDigits: 1 })} M`;

export function formatParam(def: ParamDef, value: number): string {
  if (def.unit === "money") return fmtMoney(value);
  if (def.unit === "percent") return `${value.toFixed(def.decimals ?? 1)} %`;
  return String(value);
}

/** "Year 11, month 10" (1-based) or "Not within horizon". */
export function describePayoff(month: number | null): string {
  if (month === null) return "Not within horizon";
  const ym = toYearMonth(month);
  return `Year ${ym.year}, month ${ym.month}`;
}

/** "after 10 years 10 months"; empty when there is no payoff. */
export function describeElapsed(month: number | null): string {
  if (month === null) return "";
  const { years, months } = elapsedTime(month);
  const parts = [];
  if (years > 0) parts.push(`${years} ${years === 1 ? "year" : "years"}`);
  if (months > 0) parts.push(`${months} ${months === 1 ? "month" : "months"}`);
  return `after ${parts.join(" ")}`;
}

export interface Card {
  title: string;
  value: string;
  notes: string[];
  tone?: "a" | "b";
}

export function summaryCards(res: SimResult): Card[] {
  const last = res.rows[res.rows.length - 1];
  const diff = last.netB - last.netA;
  const winner = Math.abs(diff) < 1 ? "Tie" : diff > 0 ? "Path B wins by" : "Path A wins by";
  return [
    { title: "Path A final net wealth", value: fmtMoney(last.netA), notes: [], tone: "a" },
    { title: "Path B final net wealth", value: fmtMoney(last.netB), notes: [], tone: "b" },
    { title: winner, value: fmtMoney(Math.abs(diff) < 1 ? 0 : Math.abs(diff)), notes: [] },
    {
      title: "Path B mortgage-free",
      value: describePayoff(res.payoffMonthB),
      notes: [describeElapsed(res.payoffMonthB), `Path A: ${describePayoff(res.payoffMonthA)}`].filter(Boolean),
    },
  ];
}

export interface SeriesDef {
  key: "netA" | "netB" | "loanB";
  label: string;
  /** CSS custom property holding the series colour. */
  colorVar: string;
  dashed: boolean;
}

export const SERIES: SeriesDef[] = [
  { key: "netA", label: "Path A net wealth", colorVar: "--series-a", dashed: false },
  { key: "netB", label: "Path B net wealth", colorVar: "--series-b", dashed: false },
  { key: "loanB", label: "Path B remaining loan", colorVar: "--series-loan", dashed: true },
];

export interface ChartSeries extends SeriesDef {
  /** x = years elapsed, one point per month including the start. */
  points: { x: number; y: number }[];
}

export function chartSeries(res: SimResult): ChartSeries[] {
  return SERIES.map((s) => ({ ...s, points: res.rows.map((r: MonthRow) => ({ x: r.month / 12, y: r[s.key] })) }));
}

/** Vertical marker where Path B's mortgage reaches zero (x in years elapsed). */
export function payoffMarker(res: SimResult): { x: number; label: string } | null {
  if (res.payoffMonthB === null) return null;
  return { x: res.payoffMonthB / 12, label: `B mortgage-free: ${describePayoff(res.payoffMonthB)}` };
}

export interface TableRow {
  year: number;
  extra: number;
  netA: number;
  netB: number;
  diff: number;
  loanA: number;
  loanB: number;
  investedB: number;
  invA: number;
  invB: number;
  isPayoffYear: boolean;
}

/** One row per year, taken at the end of the year. */
export function yearlyTable(res: SimResult): TableRow[] {
  const payoffYear = res.payoffMonthB === null ? null : toYearMonth(res.payoffMonthB).year;
  return res.rows
    .filter((r) => r.month > 0 && r.month % 12 === 0)
    .map((r) => {
      const year = r.month / 12;
      return {
        year,
        extra: r.extra,
        netA: r.netA,
        netB: r.netB,
        diff: r.netB - r.netA,
        loanA: r.loanA,
        loanB: r.loanB,
        investedB: res.rows.slice(r.month - 11, r.month + 1).reduce((sum, row) => sum + row.contribB, 0),
        invA: r.invA,
        invB: r.invB,
        isPayoffYear: year === payoffYear,
      };
    });
}

export function warningMessage(inputs: SimInputs): string | null {
  return installmentTooLow(inputs)
    ? "The monthly installment doesn't cover the first month's interest, so the Path A loan never shrinks. Raise the installment or lower the loan amount or interest rate."
    : null;
}
