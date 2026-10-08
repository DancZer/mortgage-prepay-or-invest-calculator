import { DEFAULT_CURRENCY, isCurrencyCode } from "./currency";
import { applyInput, defaultInputs, isValidValue, PARAMS } from "./params";
import type { AppInputs } from "./scenarios";

/** Where the user's last inputs are kept in the browser. Bump the version if the format changes. */
export const STORAGE_KEY = "mortgage-vs-investment:inputs:v1";

/** The part of the browser's `localStorage` this app uses (lets tests pass an in-memory store). */
export interface KeyValueStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

/** Saves the inputs; storage can be full or blocked (private mode), which is ignored. */
export function saveInputs(store: KeyValueStore | null, inputs: AppInputs): void {
  try {
    store?.setItem(STORAGE_KEY, JSON.stringify(inputs));
  } catch {
    // Not being able to remember the inputs must never break the calculator.
  }
}

/**
 * Loads the last inputs. Anything missing, unreadable, out of range or off the slider grid
 * falls back to its default, so old or tampered data can never produce an invalid state.
 */
export function loadInputs(store: KeyValueStore | null): AppInputs {
  let saved: Record<string, unknown> = {};
  try {
    const raw = store?.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : {};
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) saved = parsed as Record<string, unknown>;
  } catch {
    saved = {};
  }

  let inputs = defaultInputs();
  inputs.currency = isCurrencyCode(saved.currency) ? saved.currency : DEFAULT_CURRENCY;
  for (const def of PARAMS) {
    const value = saved[def.key];
    if (isValidValue(def, value)) inputs = applyInput(inputs, def.key, value);
  }
  return inputs;
}

/** The browser's localStorage, or null when it isn't available. */
export function browserStore(): KeyValueStore | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}
