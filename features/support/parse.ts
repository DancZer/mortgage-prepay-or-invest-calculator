import assert from "node:assert/strict";
import type { NumericKey } from "../../src/params";
import type { AppInputs } from "../../src/scenarios";

/** Human parameter names used in the feature files. */
const PARAM_NAMES: Record<string, NumericKey> = {
  "property value": "property",
  "property growth": "appr",
  "loan amount": "loan",
  "monthly installment": "installment",
  "monthly extra savings": "extra",
  "prepayment share": "prepayPct",
  "annual savings growth": "inf",
  "worst-case return": "invWorst",
  "best-case return": "invBest",
  "mortgage rate": "mort",
  "prepayment penalty": "penalty",
  years: "years",
};

export function paramKey(name: string): NumericKey {
  const key = PARAM_NAMES[name.trim().toLowerCase()];
  if (!key) throw new Error(`Unknown parameter "${name}". Known: ${Object.keys(PARAM_NAMES).join(", ")}`);
  return key;
}

/**
 * Turns one "| name | value |" row into input changes. Besides the slider names it accepts
 * "investment return" (sets the worst and best case to the same value) and "currency".
 */
export function parameterChange(name: string, value: string): Partial<AppInputs> {
  const lower = name.trim().toLowerCase();
  if (lower === "currency") return { currency: value.trim() as AppInputs["currency"] };
  if (lower === "investment return") return { invWorst: parseNumber(value), invBest: parseNumber(value) };
  return { [paramKey(name)]: parseNumber(value) };
}

/** Collapses all kinds of spaces (including the non-breaking ones used by hu-HU formatting). */
export function normalize(text: string): string {
  return text.replace(/[\s  ]+/g, " ").trim();
}

/** Ignores digit grouping: hu-HU writes "8000" but "18 000", and the scenarios may use either. */
export function ungroup(text: string): string {
  return normalize(text)
    .replace(/(\d) (?=\d)/g, "$1")
    .replace(/−/g, "-");
}

/** Parses "1 200 000", "1 200 000 Ft", "6.18 %", "−76 039" or "306 040.10". */
export function parseNumber(text: string): number {
  const cleaned = text
    .replace(/Ft|%|€|\$/g, "")
    .replace(/[\s  ]/g, "")
    .replace("−", "-");
  const value = Number(cleaned);
  if (cleaned === "" || Number.isNaN(value)) throw new Error(`Not a number: "${text}"`);
  return value;
}

/** Asserts a value matches the number written in the feature file, to the precision written there. */
export function assertAmount(actual: number, expectedText: string, what: string) {
  const expected = parseNumber(expectedText);
  const decimals = expectedText.match(/\.(\d+)/)?.[1].length ?? 0;
  const tolerance = 0.5 * Math.pow(10, -decimals);
  assert.ok(
    Math.abs(actual - expected) <= tolerance,
    `${what}: expected ${expectedText.trim()}, got ${actual.toFixed(Math.max(decimals, 2))}`,
  );
}
