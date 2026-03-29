"use client";

import { useEffect, useState } from "react";

/**
 * False on server and first client render; true after mount.
 * Use to avoid hydration mismatches when client-only state (e.g. persisted Redux) differs from SSR.
 */
export function useClientMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  return mounted;
}
