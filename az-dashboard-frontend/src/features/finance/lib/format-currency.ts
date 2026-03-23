import type { CurrencyCode } from "../api/types";

const localeFor: Record<CurrencyCode, string> = {
  ARS: "es-AR",
  USD: "en-US",
};

export function formatCurrency(
  value: number,
  currency: CurrencyCode,
  options?: Intl.NumberFormatOptions,
): string {
  return new Intl.NumberFormat(localeFor[currency], {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    ...options,
  }).format(value);
}

export function formatCompactCurrency(
  value: number,
  currency: CurrencyCode,
): string {
  return new Intl.NumberFormat(localeFor[currency], {
    style: "currency",
    currency,
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}
