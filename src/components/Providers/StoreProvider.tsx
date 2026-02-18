"use client";

import { useRef } from "react";
import { Provider } from "react-redux";
import { persistStore } from "redux-persist";
import { makeStore } from "@/store";
import type { AppStore } from "@/store";

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const storeRef = useRef<AppStore | null>(null);

  if (typeof window === "undefined") {
    return <Provider store={makeStore()}>{children}</Provider>;
  }

  if (storeRef.current === null) {
    storeRef.current = makeStore();
    persistStore(storeRef.current);
  }

  return <Provider store={storeRef.current}>{children}</Provider>;
}
