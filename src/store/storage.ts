import type { Storage } from "redux-persist";
import storage from "redux-persist/lib/storage";

function createNoopStorage(): Storage {
  return {
    getItem: () => Promise.resolve(null),
    setItem: (_key: string, value: unknown) => Promise.resolve(value),
    removeItem: () => Promise.resolve(),
  };
}

export function getPersistStorage(): Storage {
  if (typeof window === "undefined") {
    return createNoopStorage();
  }
  return storage;
}
