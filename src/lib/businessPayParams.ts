const DEFAULT_AMOUNT = "300";
const DEFAULT_CURRENCY = "GHS";
const DEFAULT_BUSINESS_NAME = "this business";

function sanitizeAmount(raw: string | undefined): string {
  if (raw == null || raw.trim() === "") return DEFAULT_AMOUNT;
  const trimmed = raw.trim();
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) return DEFAULT_AMOUNT;
  return trimmed;
}

function sanitizeCurrency(raw: string | undefined): string {
  if (raw == null || raw.trim() === "") return DEFAULT_CURRENCY;
  const c = raw.trim().slice(0, 8).toUpperCase();
  return /^[A-Z0-9]+$/.test(c) ? c : DEFAULT_CURRENCY;
}

function sanitizeBusinessName(raw: string | undefined): string {
  if (raw == null || raw.trim() === "") return DEFAULT_BUSINESS_NAME;
  let decoded = raw.trim();
  try {
    decoded = decodeURIComponent(decoded);
  } catch {
    /* keep trimmed value */
  }
  if (decoded.length > 80) return `${decoded.slice(0, 77)}…`;
  return decoded;
}

function sanitizeLogoUrl(raw: string | undefined): string | null {
  if (raw == null || raw.trim() === "") return null;
  let decoded = raw.trim();
  try {
    decoded = decodeURIComponent(decoded);
  } catch {
    return null;
  }
  if (decoded.length > 2048) return null;
  try {
    const u = new URL(decoded);
    if (u.protocol !== "https:" && u.protocol !== "http:") return null;
    return decoded;
  } catch {
    return null;
  }
}

export function parseBusinessPaySearchParams(
  params: Record<string, string | string[] | undefined>
): {
  amountDisplay: string;
  currencyDisplay: string;
  businessName: string;
  businessLogoUrl: string | null;
} {
  const get = (key: string): string | undefined => {
    const v = params[key];
    return Array.isArray(v) ? v[0] : v;
  };

  return {
    amountDisplay: sanitizeAmount(get("amount")),
    currencyDisplay: sanitizeCurrency(get("currency")),
    businessName: sanitizeBusinessName(get("name") ?? get("business")),
    businessLogoUrl: sanitizeLogoUrl(get("logo")),
  };
}
