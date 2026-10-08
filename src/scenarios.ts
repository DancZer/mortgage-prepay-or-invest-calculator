import { simulate, type ModelInputs, type SimResult } from "./calc";
import { CURRENCIES, type CurrencyCode } from "./currency";

/** Everything the user can set in the app: model inputs with a worst and best return, plus currency. */
export interface AppInputs extends Omit<ModelInputs, "inv" | "decimals"> {
  /** Annual investment return in the worst case, %. */
  invWorst: number;
  /** Annual investment return in the best case, %. */
  invBest: number;
  currency: CurrencyCode;
}

export type Case = "worst" | "best";

export interface Scenarios {
  worst: SimResult;
  best: SimResult;
}

export function modelInputs(a: AppInputs, inv: number): ModelInputs {
  const { invWorst: _w, invBest: _b, currency, ...rest } = a;
  return { ...rest, inv, decimals: CURRENCIES[currency].decimals };
}

/** Runs the model once with the worst-case and once with the best-case return. */
export function runScenarios(a: AppInputs): Scenarios {
  return {
    worst: simulate(modelInputs(a, a.invWorst)),
    best: simulate(modelInputs(a, a.invBest)),
  };
}

/** Range searched for the break-even return, % per year. */
export const BREAK_EVEN_MIN = -5;
export const BREAK_EVEN_MAX = 30;

export type BreakEven =
  /** Nothing is prepaid, so both paths are identical at any return. */
  | { kind: "identical" }
  /** Investing wins above `rate`, prepaying below it. */
  | { kind: "at"; rate: number }
  /** Investing wins (or ties) even at the lowest return searched. */
  | { kind: "investAlways" }
  /** Prepaying wins (or ties) even at the highest return searched. */
  | { kind: "prepayAlways" };

/**
 * The annual investment return at which both paths end with the same net wealth.
 * Found by bisection, to 0.01 %; a higher return favours Path A, which invests earlier.
 */
export function breakEvenReturn(a: AppInputs): BreakEven {
  if (a.prepayPct <= 0) return { kind: "identical" };
  const advantageA = (inv: number) => {
    const rows = simulate(modelInputs(a, inv)).rows;
    const last = rows[rows.length - 1];
    return last.netA - last.netB;
  };
  if (advantageA(BREAK_EVEN_MIN) >= 0) return { kind: "investAlways" };
  if (advantageA(BREAK_EVEN_MAX) <= 0) return { kind: "prepayAlways" };
  let low = BREAK_EVEN_MIN;
  let high = BREAK_EVEN_MAX;
  while (high - low > 0.001) {
    const mid = (low + high) / 2;
    if (advantageA(mid) > 0) high = mid;
    else low = mid;
  }
  return { kind: "at", rate: Math.round(((low + high) / 2) * 100) / 100 };
}
