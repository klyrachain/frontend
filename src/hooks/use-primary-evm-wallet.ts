"use client";

import { useMemo } from "react";
import { useAccount } from "wagmi";
import { useOptionalDynamicPrimaryEvmAddress } from "@/components/DynamicWallet/dynamic-wallet-identity-provider";
import { getDynamicEnvironmentId } from "@/lib/dynamic/dynamic-app-config";

/**
 * Single source of truth for the **active EVM address** in Morapay flows.
 * When Dynamic is configured, prefer `primaryWallet` from Dynamic (updates on wallet switch);
 * otherwise use Wagmi `useAccount`.
 */
export function usePrimaryEvmWallet(): {
  address: `0x${string}` | undefined;
  isConnected: boolean;
  chainId: number | undefined;
  status: ReturnType<typeof useAccount>["status"];
} {
  const wagmi = useAccount();
  const dynamicAddr = useOptionalDynamicPrimaryEvmAddress();
  const hasDynamicEnv = Boolean(getDynamicEnvironmentId());

  return useMemo(() => {
    if (hasDynamicEnv && dynamicAddr) {
      return {
        address: dynamicAddr,
        isConnected: true,
        chainId: wagmi.chainId,
        status: wagmi.status,
      };
    }
    return {
      address: wagmi.address,
      isConnected: wagmi.isConnected,
      chainId: wagmi.chainId,
      status: wagmi.status,
    };
  }, [
    hasDynamicEnv,
    dynamicAddr,
    wagmi.address,
    wagmi.isConnected,
    wagmi.chainId,
    wagmi.status,
  ]);
}
