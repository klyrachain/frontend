/**
 * Cookie helpers for tab persistence and used-tokens persistence.
 * Uses a single cookie per feature to avoid exceeding browser limits.
 */

const TAB_COOKIE_NAME = "morapay-tab";
const USED_TOKENS_COOKIE_NAME = "morapay-used-tokens";
const COOKIE_MAX_AGE_DAYS = 365;

export function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp("(?:^|; )" + name.replace(/([.$?*|{}()[\]\\/+^])/g, "\\$1") + "=([^;]*)")
  );
  return match != null ? decodeURIComponent(match[1]) : null;
}

export function setCookie(name: string, value: string, maxAgeDays: number): void {
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

/**
 * Returns a redux-persist Storage that persists to the used-tokens cookie.
 * Used so most-used tokens survive refresh and are available for default suggestions.
 */
export function getUsedTokensCookieStorage(): { getItem: (key: string) => Promise<string | null>; setItem: (key: string, value: string) => Promise<void>; removeItem: (key: string) => Promise<void> } {
  return {
    getItem: (key: string) =>
      Promise.resolve(getCookie(USED_TOKENS_COOKIE_NAME)),
    setItem: (_key: string, value: string) => {
      setCookie(USED_TOKENS_COOKIE_NAME, value, COOKIE_MAX_AGE_DAYS);
      return Promise.resolve();
    },
    removeItem: () => {
      setCookie(USED_TOKENS_COOKIE_NAME, "", 0);
      return Promise.resolve();
    },
  };
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
