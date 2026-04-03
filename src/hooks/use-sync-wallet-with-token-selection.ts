"use client";

import { useEffect, useRef } from "react";
import { useSwitchChain } from "wagmi";
import type { TokenSelection } from "@/components/Exchange/TokenChainSelectModal";
import {
  getViemChainIdFromTokenSelection,
  isEvmTokenSelection,
} from "@/lib/dynamic/sync-wallet-chain";

/**
 * When the user picks a token on an EVM chain, align the connected wallet network.
 */
export function useSyncWalletWithTokenSelection(selection: TokenSelection | null): void {
  const { switchChainAsync } = useSwitchChain();
  const lastKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!selection || !isEvmTokenSelection(selection)) return;
    const chainId = getViemChainIdFromTokenSelection(selection);
    if (chainId == null) return;
    const key = `${selection.token.id}:${chainId}`;
    if (lastKeyRef.current === key) return;
    lastKeyRef.current = key;

    void switchChainAsync({ chainId }).catch(() => {
      /* user rejected or wallet cannot switch — keep UX non-blocking */
    });
  }, [selection, switchChainAsync]);
}
