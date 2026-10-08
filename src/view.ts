import { AUTHOR, AUTHOR_URL, COPYRIGHT_YEAR, LICENSE_URL } from "./about";
import { elapsedTime, installmentTooLow, toYearMonth, type MonthRow, type SimResult } from "./calc";
import { formatMoney, type CurrencyCode } from "./currency";
import { STRINGS, type Language } from "./i18n";
import type { ParamDef, TypedError } from "./params";
import { BREAK_EVEN_MAX, BREAK_EVEN_MIN, type AppInputs, type BreakEven, type Case, type Scenarios } from "./scenarios";

const locale = (lang: Language) => STRINGS[lang].locale;

export const money = (v: number, currency: CurrencyCode, lang: Language) => formatMoney(v, currency, locale(lang));

export const fmtMillions = (v: number, lang: Language) =>
  `${(v / 1e6).toLocaleString(locale(lang), { maximumFractionDigits: 1 })} M`;

/** A percentage in the language's format, e.g. "6.18%" (en), "6,18 %" (de), "6,18%" (hu). */
export function fmtPct(v: number, lang: Language, minDecimals = 1, maxDecimals = minDecimals): string {
  return new Intl.NumberFormat(locale(lang), {
    style: "percent",
    minimumFractionDigits: minDecimals,
    maximumFractionDigits: Math.max(minDecimals, maxDecimals),
  }).format(v / 100);
}

/** Slider value as text, e.g. "Ft 45,000,000", "6.18%" or "50% (Ft 75,000)"; read out by screen readers. */
export function formatParam(def: ParamDef, inputs: AppInputs, lang: Language): string {
  const value = inputs[def.key];
  if (def.key === "prepayPct")
    return `${fmtPct(value, lang, 0, 2)} (${money((inputs.extra * value) / 100, inputs.currency, lang)})`;
  if (def.unit === "money") return money(value, inputs.currency, lang);
  if (def.unit === "percent") return fmtPct(value, lang, def.decimals ?? 1, 2);
  return `${value} ${STRINGS[lang].yearsUnit}`;
}

/** Text shown in an input field, without the unit: "45 000 000" / "45.000.000" / "45,000,000", "6,18". */
export function formatInputValue(def: ParamDef, value: number, lang: Language): string {
  if (def.unit === "percent") return value.toLocaleString(locale(lang), { maximumFractionDigits: 2 });
  if (def.unit === "money") return value.toLocaleString(locale(lang), { maximumFractionDigits: 0 });
  return String(value);
}

/** Unit shown after an input field: "Ft" / "€" / "$", "%" or the word for years. */
export function unitLabel(def: ParamDef, currency: CurrencyCode, lang: Language): string {
  if (def.unit === "money") return { HUF: "Ft", EUR: "€", USD: "$" }[currency];
  if (def.unit === "percent") return "%";
  return STRINGS[lang].yearsUnit;
}

/** Extra line under a field; the prepayment share shows the resulting monthly amount. */
export function inputHint(def: ParamDef, inputs: AppInputs, lang: Language): string {
  return def.key === "prepayPct"
    ? STRINGS[lang].prepayHint(money((inputs.extra * inputs.prepayPct) / 100, inputs.currency, lang))
    : "";
}

/** Message for a typed value that cannot be used. */
export function describeInputError(def: ParamDef, error: TypedError, currency: CurrencyCode, lang: Language): string {
  const t = STRINGS[lang].errors;
  if (error.kind === "notNumber") return t.notNumber;
  const limit =
    def.unit === "money"
      ? money(error.limit, currency, lang)
      : def.unit === "percent"
        ? fmtPct(error.limit, lang, 0, 2)
        : `${error.limit} ${STRINGS[lang].yearsUnit}`;
  return error.kind === "belowMin" ? t.min(limit) : t.max(limit);
}

/** Difference with an explicit sign, e.g. "+Ft 12,423,253" or "-38 888 517 Ft"; 0 has no sign. */
export function signedMoney(v: number, currency: CurrencyCode, lang: Language): string {
  return formatMoney(Math.abs(v) < 1 ? 0 : v, currency, locale(lang), true);
}

/** "Year 11, month 10" (1-based, in the chosen language), "Not within horizon", or "No mortgage" for month 0. */
export function describePayoff(month: number | null, lang: Language): string {
  if (month === null) return STRINGS[lang].notWithinHorizon;
  if (month === 0) return STRINGS[lang].noMortgage;
  const ym = toYearMonth(month);
  return STRINGS[lang].payoffDate(ym.year, ym.month);
}

/** "after 10 years 10 months" in the chosen language; empty when there is no payoff. */
export function describeElapsed(month: number | null, lang: Language): string {
  if (month === null || month === 0) return "";
  const { years, months } = elapsedTime(month);
  return STRINGS[lang].elapsed(years, months);
}

const final = (res: SimResult) => res.rows[res.rows.length - 1];

export interface CardLine {
  label: string;
  value: string;
  /** Colour of the value; overrides the card's tone. */
  tone?: "a" | "b";
  /** Path and case to highlight in the chart and table while this value is hovered or focused. */
  highlight?: Highlight;
}

export type PathName = "A" | "B";

export interface Highlight {
  path: PathName;
  scenario: Case;
}

export interface Card {
  title: string;
  lines: CardLine[];
  notes: string[];
  tone?: "a" | "b";
}

/** The break-even return as text; used by the requirement scenarios (the app states it in the verdict). */
export function describeBreakEven(be: BreakEven, lang: Language): string {
  const t = STRINGS[lang].cards;
  switch (be.kind) {
    case "identical":
      return "—";
    case "at":
      return fmtPct(be.rate, lang, 2);
    case "investAlways":
      return t.below(fmtPct(BREAK_EVEN_MIN, lang, 0));
    case "prepayAlways":
      return t.above(fmtPct(BREAK_EVEN_MAX, lang, 0));
  }
}

export function summaryCards(a: AppInputs, sc: Scenarios, lang: Language): Card[] {
  const t = STRINGS[lang].cards;
  const caseLines = (key: "netA" | "netB") => {
    const path: PathName = key === "netA" ? "A" : "B";
    return [
      {
        label: t.worstCase(fmtPct(a.invWorst, lang)),
        value: money(final(sc.worst)[key], a.currency, lang),
        highlight: { path, scenario: "worst" as Case },
      },
      {
        label: t.bestCase(fmtPct(a.invBest, lang)),
        value: money(final(sc.best)[key], a.currency, lang),
        highlight: { path, scenario: "best" as Case },
      },
    ];
  };
  // The loan does not depend on the investment return, so either scenario gives the payoff dates.
  const { payoffMonthA, payoffMonthB } = sc.worst;
  return [
    { title: t.netA, lines: caseLines("netA"), notes: [], tone: "a" },
    { title: t.netB, lines: caseLines("netB"), notes: [], tone: "b" },
    {
      title: t.difference,
      lines: (["worst", "best"] as Case[]).map((c) => {
        const diff = final(sc[c]).netB - final(sc[c]).netA;
        const rate = fmtPct(c === "worst" ? a.invWorst : a.invBest, lang);
        return {
          label: c === "worst" ? t.worstCase(rate) : t.bestCase(rate),
          value: signedMoney(diff, a.currency, lang),
          tone: diff >= 1 ? "b" : diff <= -1 ? "a" : undefined,
        };
      }),
      notes: [],
    },
    {
      title: t.mortgageFree,
      lines: [{ label: "", value: describePayoff(payoffMonthB, lang) }],
      notes: [describeElapsed(payoffMonthB, lang), t.pathAPayoff(describePayoff(payoffMonthA, lang))].filter(Boolean),
    },
  ];
}

/** A plain-language summary of who wins, in both cases, and the break-even return. */
export function verdict(a: AppInputs, sc: Scenarios, be: BreakEven, lang: Language): string {
  const t = STRINGS[lang].verdict;
  if (be.kind === "identical") return t.identical;
  const amount = (v: number) => money(Math.abs(v), a.currency, lang);
  const advantage = (c: Case) => final(sc[c]).netA - final(sc[c]).netB;
  const winner = (d: number) => (d >= 1 ? "A" : d <= -1 ? "B" : "tie");
  const dw = advantage("worst");
  const db = advantage("best");
  const rw = fmtPct(a.invWorst, lang);
  const rb = fmtPct(a.invBest, lang);

  const ww = winner(dw);
  const wb = winner(db);
  let first: string;
  if (ww === wb) first = ww === "tie" ? t.bothTie : t.both(ww, amount(dw), rw, amount(db), rb);
  else first = t.depends(t.part(rw, ww, amount(dw)), t.part(rb, wb, amount(db)));

  const min = fmtPct(BREAK_EVEN_MIN, lang, 0);
  const max = fmtPct(BREAK_EVEN_MAX, lang, 0);
  const second =
    be.kind === "at"
      ? t.breakEvenAt(fmtPct(be.rate, lang, 2))
      : be.kind === "investAlways"
        ? t.investAlways(min, max)
        : t.prepayAlways(min, max);
  return `${first} ${second}`;
}

export interface SeriesDef {
  key: "netA" | "netB" | "loanB";
  scenario: Case;
  label: keyof (typeof STRINGS)["en"]["chart"];
  /** CSS custom property holding the series colour. */
  colorVar: string;
  dashed: boolean;
  /** Shade the area between this series and the previous one (the worst-to-best band). */
  fillToPrevious: boolean;
}

export const SERIES: SeriesDef[] = [
  { key: "netA", scenario: "worst", label: "aWorst", colorVar: "--series-a", dashed: false, fillToPrevious: false },
  { key: "netA", scenario: "best", label: "aBest", colorVar: "--series-a", dashed: false, fillToPrevious: true },
  { key: "netB", scenario: "worst", label: "bWorst", colorVar: "--series-b", dashed: false, fillToPrevious: false },
  { key: "netB", scenario: "best", label: "bBest", colorVar: "--series-b", dashed: false, fillToPrevious: true },
  { key: "loanB", scenario: "worst", label: "loanB", colorVar: "--series-loan", dashed: true, fillToPrevious: false },
];

export function seriesLabel(s: SeriesDef, lang: Language): string {
  return STRINGS[lang].chart[s.label] as string;
}

export interface ChartSeries extends SeriesDef {
  /** Translated legend label. */
  text: string;
  /** x = years elapsed, one point per month including the start. */
  points: { x: number; y: number }[];
}

export function chartSeries(sc: Scenarios, lang: Language): ChartSeries[] {
  return SERIES.map((s) => ({
    ...s,
    text: seriesLabel(s, lang),
    points: sc[s.scenario].rows.map((r: MonthRow) => ({ x: r.month / 12, y: r[s.key] })),
  }));
}

/** Vertical marker where Path B's mortgage reaches zero (x in years elapsed). */
export function payoffMarker(res: SimResult, lang: Language): { x: number; label: string } | null {
  if (res.payoffMonthB === null || res.payoffMonthB === 0) return null;
  return { x: res.payoffMonthB / 12, label: STRINGS[lang].chart.marker(describePayoff(res.payoffMonthB, lang)) };
}

/** Table columns (indexes into the header row) that belong to each path. */
export const PATH_COLUMNS: Record<PathName, number[]> = {
  A: [3, 6, 9], // Net wealth A, Loan A, Investments A
  B: [4, 7, 8, 10], // Net wealth B, Loan B, Invested B (year), Investments B
};

export interface HighlightTargets {
  /** Index into SERIES of the line to emphasise; all other lines are faded. */
  seriesIndex: number;
  /** Table columns to highlight. */
  columns: number[];
  /** Case the table shows while highlighting. */
  tableCase: Case;
}

/** What to emphasise in the chart and table for a hovered result value. */
export function highlightTargets(h: Highlight): HighlightTargets {
  const key = h.path === "A" ? "netA" : "netB";
  return {
    seriesIndex: SERIES.findIndex((s) => s.key === key && s.scenario === h.scenario),
    columns: PATH_COLUMNS[h.path],
    tableCase: h.scenario,
  };
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
  const payoffYear = !res.payoffMonthB ? null : toYearMonth(res.payoffMonthB).year;
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

export function warningMessage(a: AppInputs, lang: Language): string | null {
  return installmentTooLow(a) ? STRINGS[lang].warning : null;
}

/** Formats an ISO date (YYYY-MM-DD) in the language, e.g. "8 October 2026" or "2026. október 8.". */
export function formatDate(iso: string, lang: Language): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString(locale(lang), {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

export interface Credits {
  createdBy: string;
  copyright: string;
  version: string;
  authorUrl: string;
  authorLinkText: string;
  license: string;
  licenseUrl: string;
}

/** The credits shown at the bottom of the input panel. `buildDate` is an ISO date (YYYY-MM-DD). */
export function credits(lang: Language, buildDate: string): Credits {
  const t = STRINGS[lang].credits;
  return {
    createdBy: t.createdBy(AUTHOR),
    copyright: `© ${COPYRIGHT_YEAR} ${AUTHOR}`,
    version: t.version(formatDate(buildDate, lang)),
    authorUrl: AUTHOR_URL,
    authorLinkText: AUTHOR_URL.replace(/^https:\/\//, ""),
    license: t.license,
    licenseUrl: LICENSE_URL,
  };
}
