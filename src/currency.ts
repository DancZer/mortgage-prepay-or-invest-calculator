export type CurrencyCode = "HUF" | "EUR" | "USD";

export interface CurrencyDef {
  code: CurrencyCode;
  label: string;
  /** Digits of the smallest unit the model rounds to each month (forint: whole units, euro/dollar: cents). */
  decimals: number;
}

/**
 * Switching currency only changes the symbol and the rounding; amounts are not converted
 * (decision: docs/decisions/0006-currency-symbol-and-rounding.md).
 */
export const CURRENCIES: Record<CurrencyCode, CurrencyDef> = {
  HUF: { code: "HUF", label: "Ft", decimals: 0 },
  EUR: { code: "EUR", label: "€", decimals: 2 },
  USD: { code: "USD", label: "$", decimals: 2 },
};

export const DEFAULT_CURRENCY: CurrencyCode = "HUF";

/** Number format shared by all currencies, so only the symbol changes. */
export const LOCALE = "hu-HU";

export function isCurrencyCode(value: unknown): value is CurrencyCode {
  return typeof value === "string" && value in CURRENCIES;
}

const formatters = new Map<CurrencyCode, Intl.NumberFormat>();

/** Formats an amount in whole units, e.g. "45 000 000 Ft", "45 000 000 €", "45 000 000 $". */
export function formatMoney(value: number, currency: CurrencyCode): string {
  let formatter = formatters.get(currency);
  if (!formatter) {
    formatter = new Intl.NumberFormat(LOCALE, {
      style: "currency",
      currency,
      currencyDisplay: "narrowSymbol",
      maximumFractionDigits: 0,
    });
    formatters.set(currency, formatter);
  }
  return formatter.format(value);
}
