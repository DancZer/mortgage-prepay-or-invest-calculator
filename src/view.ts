import { elapsedTime, installmentTooLow, toYearMonth, type MonthRow, type SimResult } from "./calc";
import { formatMoney, LOCALE } from "./currency";
import type { ParamDef } from "./params";
import { BREAK_EVEN_MAX, BREAK_EVEN_MIN, type AppInputs, type BreakEven, type Case, type Scenarios } from "./scenarios";

export const fmtMillions = (v: number) => `${(v / 1e6).toLocaleString(LOCALE, { maximumFractionDigits: 1 })} M`;
export const fmtPct = (v: number, decimals = 1) => `${v.toFixed(decimals)} %`;

/** Slider value label, e.g. "45 000 000 Ft", "6.18 %" or "50 % (75 000 Ft)". */
export function formatParam(def: ParamDef, inputs: AppInputs): string {
  const value = inputs[def.key];
  if (def.key === "prepayPct")
    return `${fmtPct(value, 0)} (${formatMoney((inputs.extra * value) / 100, inputs.currency)})`;
  if (def.unit === "money") return formatMoney(value, inputs.currency);
  if (def.unit === "percent") return fmtPct(value, def.decimals ?? 1);
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

const final = (res: SimResult) => res.rows[res.rows.length - 1];

export interface CardLine {
  label: string;
  value: string;
}

export interface Card {
  title: string;
  lines: CardLine[];
  notes: string[];
  tone?: "a" | "b";
}

export function describeBreakEven(be: BreakEven): string {
  switch (be.kind) {
    case "identical":
      return "—";
    case "at":
      return fmtPct(be.rate, 2);
    case "investAlways":
      return `Below ${fmtPct(BREAK_EVEN_MIN, 0)}`;
    case "prepayAlways":
      return `Above ${fmtPct(BREAK_EVEN_MAX, 0)}`;
  }
}

export function summaryCards(a: AppInputs, sc: Scenarios, be: BreakEven): Card[] {
  const money = (v: number) => formatMoney(v, a.currency);
  const caseLines = (key: "netA" | "netB") => [
    { label: `Worst case (${fmtPct(a.invWorst)})`, value: money(final(sc.worst)[key]) },
    { label: `Best case (${fmtPct(a.invBest)})`, value: money(final(sc.best)[key]) },
  ];
  // The loan does not depend on the investment return, so either scenario gives the payoff dates.
  const { payoffMonthA, payoffMonthB } = sc.worst;
  return [
    { title: "Path A final net wealth", lines: caseLines("netA"), notes: [], tone: "a" },
    { title: "Path B final net wealth", lines: caseLines("netB"), notes: [], tone: "b" },
    {
      title: "Break-even return",
      lines: [{ label: "", value: describeBreakEven(be) }],
      notes: [be.kind === "identical" ? "Nothing is prepaid" : "Investing wins above it, prepaying below it"],
    },
    {
      title: "Path B mortgage-free",
      lines: [{ label: "", value: describePayoff(payoffMonthB) }],
      notes: [describeElapsed(payoffMonthB), `Path A: ${describePayoff(payoffMonthA)}`].filter(Boolean),
    },
  ];
}

/** A plain-language summary of who wins, in both cases, and the break-even return. */
export function verdict(a: AppInputs, sc: Scenarios, be: BreakEven): string {
  if (be.kind === "identical") return "You prepay nothing, so both strategies give the same result.";
  const money = (v: number) => formatMoney(v, a.currency);
  const advantage = (c: Case) => final(sc[c]).netA - final(sc[c]).netB;
  const winner = (d: number) => (d >= 1 ? "A" : d <= -1 ? "B" : "tie");
  const dw = advantage("worst");
  const db = advantage("best");
  const at = (rate: number) => `at ${fmtPct(rate)} a year`;

  let first: string;
  if (winner(dw) === winner(db)) {
    const who = winner(dw);
    first =
      who === "tie"
        ? "Both strategies give the same result in both cases."
        : `${who === "A" ? "Investing" : "Prepaying"} wins in both cases: by ${money(Math.abs(dw))} ${at(a.invWorst)} and by ${money(Math.abs(db))} ${at(a.invBest)}.`;
  } else {
    const part = (d: number, rate: number) =>
      winner(d) === "tie"
        ? `${at(rate)} both give the same result`
        : `${at(rate)} ${winner(d) === "A" ? "investing" : "prepaying"} wins by ${money(Math.abs(d))}`;
    first = `It depends on your returns: ${part(dw, a.invWorst)}, ${part(db, a.invBest)}.`;
  }

  const range = `from ${fmtPct(BREAK_EVEN_MIN, 0)} to ${fmtPct(BREAK_EVEN_MAX, 0)} a year`;
  const second =
    be.kind === "at"
      ? `Investing comes out ahead only if your investments earn more than ${fmtPct(be.rate, 2)} a year.`
      : be.kind === "investAlways"
        ? `Investing comes out ahead at any return ${range}.`
        : `Prepaying comes out ahead at any return ${range}.`;
  return `${first} ${second}`;
}

export interface SeriesDef {
  key: "netA" | "netB" | "loanB";
  scenario: Case;
  label: string;
  /** CSS custom property holding the series colour. */
  colorVar: string;
  dashed: boolean;
  /** Shade the area between this series and the previous one (the worst-to-best band). */
  fillToPrevious: boolean;
}

export const SERIES: SeriesDef[] = [
  {
    key: "netA",
    scenario: "worst",
    label: "Path A – worst case",
    colorVar: "--series-a",
    dashed: false,
    fillToPrevious: false,
  },
  {
    key: "netA",
    scenario: "best",
    label: "Path A – best case",
    colorVar: "--series-a",
    dashed: false,
    fillToPrevious: true,
  },
  {
    key: "netB",
    scenario: "worst",
    label: "Path B – worst case",
    colorVar: "--series-b",
    dashed: false,
    fillToPrevious: false,
  },
  {
    key: "netB",
    scenario: "best",
    label: "Path B – best case",
    colorVar: "--series-b",
    dashed: false,
    fillToPrevious: true,
  },
  {
    key: "loanB",
    scenario: "worst",
    label: "Path B remaining loan",
    colorVar: "--series-loan",
    dashed: true,
    fillToPrevious: false,
  },
];

export interface ChartSeries extends SeriesDef {
  /** x = years elapsed, one point per month including the start. */
  points: { x: number; y: number }[];
}

export function chartSeries(sc: Scenarios): ChartSeries[] {
  return SERIES.map((s) => ({
    ...s,
    points: sc[s.scenario].rows.map((r: MonthRow) => ({ x: r.month / 12, y: r[s.key] })),
  }));
}

/** Vertical marker where Path B's mortgage reaches zero (x in years elapsed). */
export function payoffMarker(res: SimResult): { x: number; label: string } | null {
  if (res.payoffMonthB === null) return null;
  return { x: res.payoffMonthB / 12, label: `B mortgage-free: ${describePayoff(res.payoffMonthB)}` };
}

export interface TableRow {
  year: number;
  extra: number;
  property: number;
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
        property: r.property,
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

export function warningMessage(a: AppInputs): string | null {
  return installmentTooLow(a)
    ? "The monthly installment doesn't cover the first month's interest, so the loan never shrinks. Raise the installment or lower the loan amount or interest rate."
    : null;
}

export const DISCLAIMER =
  "This calculator is for illustration and education only. It is not financial, investment, tax or legal advice. " +
  "Results depend entirely on the assumptions you enter; real returns, interest rates, fees and taxes will differ. " +
  "Consult a qualified adviser before making financial decisions.";

export const PRIVACY_NOTE =
  "Your inputs are saved only in this browser so they are still here next time. Nothing is sent to a server.";
