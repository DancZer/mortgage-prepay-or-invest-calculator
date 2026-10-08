import { DEFAULT_CURRENCY } from "./currency";
import { parseLocalizedNumber, type Language } from "./i18n";
import type { AppInputs } from "./scenarios";

export type NumericKey = Exclude<keyof AppInputs, "currency">;
export type ParamUnit = "money" | "percent" | "years";

export interface ParamDef {
  key: NumericKey;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  unit: ParamUnit;
  /** Decimals shown for percentages. */
  decimals?: number;
}

/**
 * Slider definitions (labels are translated in i18n.ts). Reasons for values that differ from the original spec are in docs/decisions/.
 * Money amounts are the same numbers in every currency (only the symbol changes).
 */
export const PARAMS: ParamDef[] = [
  {
    key: "property",
    min: 0,
    max: 200_000_000,
    step: 1_000_000,
    defaultValue: 60_000_000,
    unit: "money",
  },
  {
    key: "appr",
    min: 0,
    max: 10,
    step: 0.5,
    defaultValue: 3,
    unit: "percent",
    decimals: 1,
  },
  {
    key: "loan",
    min: 0,
    max: 100_000_000,
    step: 1_000_000,
    defaultValue: 45_000_000,
    unit: "money",
  },
  {
    key: "installment",
    min: 0,
    max: 600_000,
    step: 10_000,
    defaultValue: 300_000,
    unit: "money",
  },
  {
    key: "extra",
    min: 0,
    max: 500_000,
    step: 10_000,
    defaultValue: 150_000,
    unit: "money",
  },
  {
    key: "prepayPct",
    min: 0,
    max: 100,
    step: 5,
    defaultValue: 50,
    unit: "percent",
    decimals: 0,
  },
  {
    key: "inf",
    min: 0,
    max: 15,
    step: 0.5,
    defaultValue: 4,
    unit: "percent",
    decimals: 1,
  },
  {
    key: "invWorst",
    min: -5,
    max: 20,
    step: 0.1,
    defaultValue: 3,
    unit: "percent",
    decimals: 1,
  },
  {
    key: "invBest",
    min: -5,
    max: 20,
    step: 0.1,
    defaultValue: 10,
    unit: "percent",
    decimals: 1,
  },
  {
    key: "mort",
    min: 0,
    max: 15,
    step: 0.01,
    defaultValue: 6.18,
    unit: "percent",
    decimals: 2,
  },
  {
    key: "penalty",
    min: 0,
    max: 5,
    step: 0.1,
    defaultValue: 1.5,
    unit: "percent",
    decimals: 1,
  },
  { key: "years", min: 0, max: 30, step: 1, defaultValue: 25, unit: "years" },
];

export function paramDef(key: NumericKey): ParamDef {
  return PARAMS.find((p) => p.key === key)!;
}

export function defaultInputs(): AppInputs {
  const numeric = Object.fromEntries(PARAMS.map((p) => [p.key, p.defaultValue]));
  return { ...numeric, currency: DEFAULT_CURRENCY } as AppInputs;
}

/**
 * Highest value that can be typed in. Slider maximums are only a starting point (see `extendedMax`);
 * these limits keep the model meaningful and within safe number ranges.
 */
export function hardMax(def: ParamDef): number {
  if (def.key === "prepayPct") return 100;
  if (def.unit === "money") return 1_000_000_000_000;
  return 100; // percentages and years
}

/** Decimals a typed value may have: whole currency units and years, percentages to 0.01. */
export function inputDecimals(def: ParamDef): number {
  return def.unit === "percent" ? 2 : 0;
}

/** True when the value may be used: a number between the minimum and the hard maximum, with allowed decimals. */
export function isAllowedValue(def: ParamDef, value: unknown): value is number {
  if (typeof value !== "number" || !Number.isFinite(value)) return false;
  if (value < def.min || value > hardMax(def)) return false;
  const scaled = value * Math.pow(10, inputDecimals(def));
  return Math.abs(scaled - Math.round(scaled)) < 1e-6;
}

/** Current maximum of every slider. */
export type Maxes = Record<NumericKey, number>;

export function defaultMaxes(): Maxes {
  return Object.fromEntries(PARAMS.map((p) => [p.key, p.max])) as Maxes;
}

/**
 * New slider maximum for a value above the current one: the value + 10 %, rounded up to the
 * slider's step grid, so the value never sits at the very end of the slider (decision 0011).
 */
export function extendedMax(def: ParamDef, value: number): number {
  // The small tolerance stops floating-point noise (20 × 1.1 = 22.000000000000004) adding a step.
  const steps = Math.ceil((value * 1.1 - def.min) / def.step - 1e-6);
  const max = Number((def.min + steps * def.step).toFixed(10));
  return Math.min(max, hardMax(def));
}

/** Extends any slider whose value is above its current maximum. Maximums never shrink. */
export function fitMaxes(inputs: AppInputs, maxes: Maxes): Maxes {
  const next = { ...maxes };
  for (const def of PARAMS) {
    if (inputs[def.key] > next[def.key]) next[def.key] = extendedMax(def, inputs[def.key]);
  }
  return next;
}

/** Slider maximums for inputs loaded at start-up (e.g. saved values above the default maximum). */
export function initialMaxes(inputs: AppInputs): Maxes {
  return fitMaxes(inputs, defaultMaxes());
}

export type TypedError =
  { kind: "notNumber" } | { kind: "belowMin"; limit: number } | { kind: "aboveMax"; limit: number };

export type TypedResult = { ok: true; inputs: AppInputs; maxes: Maxes } | { ok: false; error: TypedError };

/**
 * Applies a value typed into a field. It is rounded to the allowed decimals, must be at least the
 * slider minimum and at most the hard maximum; a value above the slider maximum extends the slider.
 * The text is read with the language's number format (see `parseLocalizedNumber`).
 */
export function applyTypedValue(
  inputs: AppInputs,
  maxes: Maxes,
  key: NumericKey,
  text: string,
  lang: Language,
): TypedResult {
  const def = paramDef(key);
  const parsed = parseLocalizedNumber(text, lang);
  if (parsed === null) return { ok: false, error: { kind: "notNumber" } };
  const factor = Math.pow(10, inputDecimals(def));
  const value = Math.round(parsed * factor) / factor;
  if (value < def.min) return { ok: false, error: { kind: "belowMin", limit: def.min } };
  if (value > hardMax(def)) return { ok: false, error: { kind: "aboveMax", limit: hardMax(def) } };
  const next = applyInput(inputs, key, value);
  return { ok: true, inputs: next, maxes: fitMaxes(next, maxes) };
}

/**
 * Applies one slider change. The worst-case return can never exceed the best case:
 * raising the worst case above the best pushes the best case up, and vice versa.
 */
export function applyInput(inputs: AppInputs, key: NumericKey, value: number): AppInputs {
  const next = { ...inputs, [key]: value };
  if (next.invWorst > next.invBest) {
    if (key === "invBest") next.invWorst = value;
    else next.invBest = next.invWorst;
  }
  return next;
}
