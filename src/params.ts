import { DEFAULT_CURRENCY } from "./currency";
import type { AppInputs } from "./scenarios";

export type NumericKey = Exclude<keyof AppInputs, "currency">;
export type ParamUnit = "money" | "percent" | "years";

export interface ParamDef {
  key: NumericKey;
  label: string;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  unit: ParamUnit;
  /** Decimals shown for percentages. */
  decimals?: number;
}

/**
 * Slider definitions. Reasons for values that differ from the original spec are in docs/decisions/.
 * Money amounts are the same numbers in every currency (only the symbol changes).
 */
export const PARAMS: ParamDef[] = [
  {
    key: "property",
    label: "Property value",
    min: 10_000_000,
    max: 200_000_000,
    step: 1_000_000,
    defaultValue: 60_000_000,
    unit: "money",
  },
  {
    key: "appr",
    label: "Property value growth / year",
    min: 0,
    max: 10,
    step: 0.5,
    defaultValue: 3,
    unit: "percent",
    decimals: 1,
  },
  {
    key: "loan",
    label: "Loan amount",
    min: 10_000_000,
    max: 100_000_000,
    step: 1_000_000,
    defaultValue: 45_000_000,
    unit: "money",
  },
  {
    key: "installment",
    label: "Monthly installment",
    min: 100_000,
    max: 600_000,
    step: 10_000,
    defaultValue: 300_000,
    unit: "money",
  },
  {
    key: "extra",
    label: "Monthly extra savings",
    min: 20_000,
    max: 500_000,
    step: 10_000,
    defaultValue: 150_000,
    unit: "money",
  },
  {
    key: "prepayPct",
    label: "…of which prepayment (Path B)",
    min: 0,
    max: 100,
    step: 5,
    defaultValue: 50,
    unit: "percent",
    decimals: 0,
  },
  {
    key: "inf",
    label: "Annual savings growth / inflation",
    min: 0,
    max: 15,
    step: 0.5,
    defaultValue: 4,
    unit: "percent",
    decimals: 1,
  },
  {
    key: "invWorst",
    label: "Investment return – worst case",
    min: -5,
    max: 20,
    step: 0.1,
    defaultValue: 3,
    unit: "percent",
    decimals: 1,
  },
  {
    key: "invBest",
    label: "Investment return – best case",
    min: -5,
    max: 20,
    step: 0.1,
    defaultValue: 10,
    unit: "percent",
    decimals: 1,
  },
  {
    key: "mort",
    label: "Mortgage interest rate",
    min: 0.1,
    max: 15,
    step: 0.01,
    defaultValue: 6.18,
    unit: "percent",
    decimals: 2,
  },
  {
    key: "penalty",
    label: "Prepayment penalty",
    min: 0,
    max: 5,
    step: 0.1,
    defaultValue: 1.5,
    unit: "percent",
    decimals: 1,
  },
  { key: "years", label: "Time horizon (years)", min: 15, max: 30, step: 1, defaultValue: 25, unit: "years" },
];

export function paramDef(key: NumericKey): ParamDef {
  return PARAMS.find((p) => p.key === key)!;
}

export function defaultInputs(): AppInputs {
  const numeric = Object.fromEntries(PARAMS.map((p) => [p.key, p.defaultValue]));
  return { ...numeric, currency: DEFAULT_CURRENCY } as AppInputs;
}

/** True when the value is within the slider's range and on its step grid. */
export function isValidValue(def: ParamDef, value: unknown): value is number {
  if (typeof value !== "number" || !Number.isFinite(value)) return false;
  if (value < def.min || value > def.max) return false;
  const steps = (value - def.min) / def.step;
  return Math.abs(steps - Math.round(steps)) < 1e-6;
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
