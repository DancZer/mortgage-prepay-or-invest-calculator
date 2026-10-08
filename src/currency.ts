export type CurrencyCode = "HUF" | "EUR" | "USD";

export interface CurrencyDef {
  code: CurrencyCode;
  label: string;
  /** Digits of the smallest unit the model rounds to each month (forint: whole units, euro/dollar: cents). */
  decimals: number;
}

/**
 * Switching currency changes the symbol and the rounding; amounts are not converted
 * (decision: docs/decisions/0006-currency-symbol-and-rounding.md). The number format follows
 * the chosen language (decision 0013).
 */
export const CURRENCIES: Record<CurrencyCode, CurrencyDef> = {
  HUF: { code: "HUF", label: "Ft", decimals: 0 },
  EUR: { code: "EUR", label: "€", decimals: 2 },
  USD: { code: "USD", label: "$", decimals: 2 },
};

export const DEFAULT_CURRENCY: CurrencyCode = "HUF";

export function isCurrencyCode(value: unknown): value is CurrencyCode {
  return typeof value === "string" && value in CURRENCIES;
}

const formatters = new Map<string, Intl.NumberFormat>();

/** Formats an amount in whole units for a locale, e.g. "45 000 000 Ft" (hu-HU) or "€45,000,000" (en-GB). */
export function formatMoney(value: number, currency: CurrencyCode, locale: string): string {
  const key = `${locale}|${currency}`;
  let formatter = formatters.get(key);
  if (!formatter) {
    formatter = new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      currencyDisplay: "narrowSymbol",
      maximumFractionDigits: 0,
    });
    formatters.set(key, formatter);
  }
  return formatter.format(value);
}
