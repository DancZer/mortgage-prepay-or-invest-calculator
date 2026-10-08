import type { SimInputs } from "./calc";

export type ParamUnit = "money" | "percent" | "years";

export interface ParamDef {
  key: keyof SimInputs;
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
 * Slider definitions. Steps differ from the original spec in two places so the defaults sit on the
 * slider grid: mortgage rate uses 0.01 (default 6.18) and investment return uses 0.1 (min 0.1, default 10).
 */
export const PARAMS: ParamDef[] = [
  { key: "initial", label: "Loan amount / property value", min: 10_000_000, max: 100_000_000, step: 1_000_000, defaultValue: 45_000_000, unit: "money" },
  { key: "installment", label: "Monthly installment", min: 100_000, max: 600_000, step: 10_000, defaultValue: 300_000, unit: "money" },
  { key: "extra", label: "Monthly extra savings", min: 20_000, max: 500_000, step: 10_000, defaultValue: 150_000, unit: "money" },
  { key: "prepay", label: "…of which prepayment (Path B)", min: 0, max: 500_000, step: 5_000, defaultValue: 75_000, unit: "money" },
  { key: "inf", label: "Annual savings growth / inflation", min: 0, max: 15, step: 0.5, defaultValue: 4, unit: "percent", decimals: 1 },
  { key: "inv", label: "Investment annual return", min: 0.1, max: 20, step: 0.1, defaultValue: 10, unit: "percent", decimals: 1 },
  { key: "mort", label: "Mortgage interest rate", min: 0.1, max: 15, step: 0.01, defaultValue: 6.18, unit: "percent", decimals: 2 },
  { key: "penalty", label: "Prepayment penalty", min: 0, max: 5, step: 0.1, defaultValue: 1.5, unit: "percent", decimals: 1 },
  { key: "years", label: "Time horizon (years)", min: 15, max: 30, step: 1, defaultValue: 25, unit: "years" },
];

export function paramDef(key: keyof SimInputs): ParamDef {
  return PARAMS.find((p) => p.key === key)!;
}

export function defaultInputs(): SimInputs {
  return Object.fromEntries(PARAMS.map((p) => [p.key, p.defaultValue])) as unknown as SimInputs;
}

/** Highest prepayment the slider allows: never more than the extra savings. */
export function prepayMax(inputs: SimInputs): number {
  return Math.min(paramDef("prepay").max, inputs.extra);
}

/** Applies one slider change; prepayment is clamped so it never exceeds the extra savings. */
export function applyInput(inputs: SimInputs, key: keyof SimInputs, value: number): SimInputs {
  const next = { ...inputs, [key]: value };
  if (next.prepay > next.extra) next.prepay = next.extra;
  return next;
}
