"use client";

import { useEffect, useRef } from "react";
import { useAppStore } from "@/store/hooks";
import { setActiveTab } from "@/store/slices/navigationSlice";
import { getTabFromCookie, setTabCookie } from "@/lib/cookie";

/**
 * Syncs active tab with cookie: rehydrates from cookie on mount,
 * persists to cookie whenever the user changes tab.
 */
export function TabCookieSync() {
  const store = useAppStore();
  const didRehydrate = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!didRehydrate.current) {
      didRehydrate.current = true;
      const saved = getTabFromCookie();
      if (saved != null) {
        store.dispatch(setActiveTab(saved));
      }
    }

    const unsubscribe = store.subscribe(() => {
      const state = store.getState();
      const tabId = state.navigation?.activeTabId;
      if (tabId != null) {
        setTabCookie(tabId);
      }
    });

    return unsubscribe;
  }, [store]);

  return null;
}
