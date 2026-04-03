"use client";

import { useMemo } from "react";
import { useMultichainTokenBalances } from "@dynamic-labs/sdk-react-core";
import { ChainEnum } from "@dynamic-labs/sdk-react-core";
import {
  inferChainIdFromNetworkId,
  inferChainNameFromAddress,
  type DynamicChainName,
} from "@/lib/balances/chain-map";
import type { BalanceItem } from "@/lib/balances/types";

type MultichainResponse = {
  networkId?: number;
  chainName?: string;
  tokenBalances?: Array<{
    address?: string;
    symbol?: string;
    balance?: number;
    balanceFormatted?: string;
  }>;
};

function toChainEnum(chain: DynamicChainName): ChainEnum {
  if (chain === "Sol") return ChainEnum.Sol;
  if (chain === "Bitcoin") return ChainEnum.Btc;
  return ChainEnum.Evm;
}

function toDynamicRequest(
  walletAddress: string,
  networkIds: number[],
  tokenAddresses: string[]
): {
  chain: ChainEnum;
  address: string;
  networkIds: number[];
  whitelistedContracts?: string[];
} {
  const chain = inferChainNameFromAddress(walletAddress);
  return {
    chain: toChainEnum(chain),
    address: walletAddress,
    networkIds,
    whitelistedContracts: tokenAddresses.length > 0 ? tokenAddresses : undefined,
  };
}

function toDynamicItems(raw: unknown): BalanceItem[] {
  if (!Array.isArray(raw)) return [];
  const items: BalanceItem[] = [];
  for (const bucket of raw as MultichainResponse[]) {
    const chainName = (bucket.chainName ?? "Evm") as DynamicChainName;
    const chainId = inferChainIdFromNetworkId(bucket.networkId, chainName);
    const balances = bucket.tokenBalances ?? [];
    for (const token of balances) {
      const tokenAddress = token.address?.trim() ?? "";
      if (!chainId || !tokenAddress) continue;
      items.push({
        chainId,
        tokenAddress,
        tokenSymbol: token.symbol,
        balance: token.balanceFormatted ?? String(token.balance ?? 0),
        source: "dynamic",
        updatedAtMs: Date.now(),
      });
    }
  }
  return items;
}

export function useDynamicBalancesAdapter({
  walletAddress,
  networkIds,
  tokenAddresses,
  enabled,
}: {
  walletAddress: string | null;
  networkIds: number[];
  tokenAddresses: string[];
  enabled: boolean;
}): { items: BalanceItem[]; loading: boolean; error: string | null } {
  const safeAddress = walletAddress?.trim() ?? "";
  const request = useMemo(
    () =>
      safeAddress && enabled
        ? [toDynamicRequest(safeAddress, networkIds, tokenAddresses)]
        : [],
    [safeAddress, enabled, networkIds, tokenAddresses]
  );

  const { multichainTokenBalances, isLoading, error } = useMultichainTokenBalances({
    requests: request,
    filterSpamTokens: true,
    forceRefresh: false,
  });

  const items = useMemo(
    () => toDynamicItems(multichainTokenBalances),
    [multichainTokenBalances]
  );

  return {
    items,
    loading: enabled && safeAddress.length > 0 ? isLoading : false,
    error: error ?? null,
  };
}

