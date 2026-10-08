import assert from "node:assert/strict";
import type { SimInputs } from "../../src/calc";

/** Human parameter names used in the feature files. */
const PARAM_NAMES: Record<string, keyof SimInputs> = {
  "loan amount": "initial",
  "monthly installment": "installment",
  "monthly extra savings": "extra",
  "monthly prepayment": "prepay",
  "annual savings growth": "inf",
  "investment return": "inv",
  "mortgage rate": "mort",
  "prepayment penalty": "penalty",
  years: "years",
};

export function paramKey(name: string): keyof SimInputs {
  const key = PARAM_NAMES[name.trim().toLowerCase()];
  if (!key) throw new Error(`Unknown parameter "${name}". Known: ${Object.keys(PARAM_NAMES).join(", ")}`);
  return key;
}

/** Collapses all kinds of spaces (including the non-breaking ones used by hu-HU formatting). */
export function normalize(text: string): string {
  return text.replace(/[\s  ]+/g, " ").trim();
}

/** Parses "1 200 000", "1 200 000 Ft", "6.18 %", "−76 039" or "306 040.10". */
export function parseNumber(text: string): number {
  const cleaned = text.replace(/Ft|%/g, "").replace(/[\s  ]/g, "").replace("−", "-");
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
