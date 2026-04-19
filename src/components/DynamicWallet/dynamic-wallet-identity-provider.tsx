"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";

type DynamicWalletIdentityValue = {
  /** Dynamic’s active primary wallet when it is an EVM 0x address. */
  primaryEvmAddress: `0x${string}` | undefined;
};

const DynamicWalletIdentityContext = createContext<DynamicWalletIdentityValue | null>(null);

/**
 * Subscribes to Dynamic `primaryWallet` so UI updates when the user switches wallets in the widget.
 * Must render under `DynamicContextProvider` (see `DynamicRootProvider`).
 */
export function DynamicWalletIdentityProvider({ children }: { children: ReactNode }) {
  const { primaryWallet } = useDynamicContext();
  const primaryEvmAddress = useMemo((): `0x${string}` | undefined => {
    const a = primaryWallet?.address?.trim();
    if (a && a.startsWith("0x") && a.length >= 42) return a as `0x${string}`;
    return undefined;
  }, [primaryWallet?.address]);

  const value = useMemo(() => ({ primaryEvmAddress }), [primaryEvmAddress]);

  return (
    <DynamicWalletIdentityContext.Provider value={value}>{children}</DynamicWalletIdentityContext.Provider>
  );
}

export function useOptionalDynamicPrimaryEvmAddress(): `0x${string}` | undefined {
  return useContext(DynamicWalletIdentityContext)?.primaryEvmAddress;
}
