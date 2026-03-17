/**
 * Cookie helpers for tab persistence. Uses a single cookie to avoid
 * exceeding browser limits when storing only small values.
 */

const TAB_COOKIE_NAME = "morapay-tab";
const COOKIE_MAX_AGE_DAYS = 365;

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp("(?:^|; )" + name.replace(/([.$?*|{}()[\]\\/+^])/g, "\\$1") + "=([^;]*)")
  );
  return match != null ? decodeURIComponent(match[1]) : null;
}

function setCookie(name: string, value: string, maxAgeDays: number): void {
  if (typeof document === "undefined") return;
  const maxAge = maxAgeDays * 24 * 60 * 60;
  document.cookie =
    name +
    "=" +
    encodeURIComponent(value) +
    "; path=/; max-age=" +
    String(maxAge) +
    "; SameSite=Lax";
}

import type { TabId } from "@/types/navigation";

const VALID_TAB_IDS: TabId[] = ["add", "transfer", "swap", "claim"];

function isValidTabId(value: string): value is TabId {
  return VALID_TAB_IDS.includes(value as TabId);
}

/**
 * Reads the persisted tab id from cookie. Returns null if missing or invalid.
 */
export function getTabFromCookie(): TabId | null {
  const raw = getCookie(TAB_COOKIE_NAME);
  if (raw == null || !isValidTabId(raw)) return null;
  return raw;
}

/**
 * Writes the active tab id to a cookie for persistence across sessions.
 */
export function setTabCookie(tabId: TabId): void {
  setCookie(TAB_COOKIE_NAME, tabId, COOKIE_MAX_AGE_DAYS);
}
