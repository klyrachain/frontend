/**
 * Canonical Paystack settlement fiat per ISO country (alpha-2).
 * Used by checkout so labels and Paystack `currency` stay correct even when
 * `Country.currency` was overwritten by a bad sync (e.g. first bank row showing USD for Ghana).
 */

const PAYSTACK_MARKET_FIAT_BY_COUNTRY: Record<string, string> = {
  GH: "GHS",
  NG: "NGN",
  KE: "KES",
  ZA: "ZAR",
  CI: "XOF",
};

export function resolveCheckoutPaystackFiat(country: {
  code: string;
  currency: string;
}): string {
  const iso = country.code?.trim().toUpperCase() ?? "";
  const canonical = PAYSTACK_MARKET_FIAT_BY_COUNTRY[iso];
  if (canonical) return canonical;
  const c = country.currency?.trim().toUpperCase();
  return c && /^[A-Z]{3}$/.test(c) ? c : "";
}
