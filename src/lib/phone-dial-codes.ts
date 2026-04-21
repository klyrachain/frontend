/**
 * Calling codes from restcountries.com (same source as core public-currencies).
 */

import { getContactIdentifierType } from "@/lib/utils";

const MIN_PHONE_DIGITS = 7;

export type DialCountry = {
  iso: string;
  name: string;
  dial: string;
};

type RestIdd = { root?: string; suffixes?: string[] };

type RestRow = {
  name?: { common?: string };
  cca2?: string;
  idd?: RestIdd;
};

/** Derive one E.164 prefix per country from restcountries `idd` (handles +49, +233, +1, …). */
export function primaryDialFromIdd(idd?: RestIdd): string | null {
  if (!idd?.root) return null;
  const root = idd.root.trim();
  const suffixes = (idd.suffixes ?? []).filter((s) => s != null && String(s).length > 0);
  if (suffixes.length === 0) return root.startsWith("+") ? root : `+${root}`;
  if (suffixes.length > 1) return root.startsWith("+") ? root : `+${root}`;
  const s = String(suffixes[0]);
  if (s.length >= 3) return root.startsWith("+") ? root : `+${root}`;
  return `${root}${s}`;
}

const REST_FIELDS = "name,cca2,idd";

export async function fetchDialCountries(): Promise<DialCountry[]> {
  const res = await fetch(`https://restcountries.com/v3.1/all?fields=${REST_FIELDS}`, {
    cache: "force-cache",
  });
  if (!res.ok) throw new Error(`restcountries ${res.status}`);
  const raw = (await res.json()) as RestRow[];
  const out: DialCountry[] = [];
  for (const row of raw) {
    const iso = row.cca2?.trim().toUpperCase();
    const name = row.name?.common?.trim();
    const dial = primaryDialFromIdd(row.idd);
    if (!iso || !name || !dial) continue;
    out.push({ iso, name, dial });
  }
  const pref = ["GH", "NG", "KE", "ZA", "US", "GB"];
  out.sort((a, b) => {
    const ia = pref.indexOf(a.iso);
    const ib = pref.indexOf(b.iso);
    if (ia !== -1 || ib !== -1) return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
    return a.name.localeCompare(b.name);
  });
  return out;
}

/** User already entered a full international number (E.164-style). */
export function isLikelyFullInternationalPhone(value: string): boolean {
  const compact = value.trim().replace(/\s/g, "");
  return /^\+\d{8,15}$/.test(compact);
}

/** Strip spaces; ensure single leading +. */
export function normalizeE164(value: string): string {
  const t = value.trim().replace(/\s+/g, "");
  if (t.startsWith("+")) return t;
  if (/^\d+$/.test(t)) return `+${t}`;
  return t;
}

/** Combine selected calling code with national digits (drops a single leading 0 on the national part). */
export function composeE164FromDial(dial: string, nationalInput: string): string {
  const dialDigits = dial.replace(/\D/g, "");
  let n = nationalInput.replace(/\D/g, "");
  if (n.startsWith("0")) n = n.slice(1);
  return `+${dialDigits}${n}`;
}

export function buildPhoneForRequest(
  value: string,
  phoneCountryIso: string,
  dialList: DialCountry[]
): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (isLikelyFullInternationalPhone(trimmed)) return normalizeE164(trimmed);
  const row = dialList.find((c) => c.iso === phoneCountryIso);
  if (!row) return undefined;
  return composeE164FromDial(row.dial, trimmed);
}

/** Email is always OK; phone needs full +… or national digits + selected country. */
export function isReceiveContactIdentityComplete(value: string, phoneCountryIso: string): boolean {
  const t = getContactIdentifierType(value);
  if (t === "email") return true;
  if (t !== "phone") return false;
  const trimmed = value.trim();
  if (isLikelyFullInternationalPhone(trimmed)) return true;
  const digits = trimmed.replace(/\D/g, "");
  return digits.length >= MIN_PHONE_DIGITS && phoneCountryIso.length > 0;
}
