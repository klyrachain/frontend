/**
 * PNG flag URL from ISO 3166-1 alpha-2 (e.g. GH, NG) via flagcdn — no emoji.
 * Returns null if the code is not a plausible ISO-2 value.
 */
export function countryFlagImgSrc(isoCode: string): string | null {
  const normalized = isoCode.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(normalized)) return null;
  return `https://flagcdn.com/w40/${normalized.toLowerCase()}.png`;
}
