"use client";

import { useEffect, useMemo, useState } from "react";
import { mergeBalanceItems } from "@/lib/balances/merge-balances";
import type { BalanceItem, HybridBalancesResult } from "@/lib/balances/types";
import { useDynamicBalancesAdapter } from "@/hooks/use-dynamic-balances-adapter";
import { makeBalanceIdentityKey } from "@/lib/balances/address-normalization";

const BACKEND_BALANCE_CACHE_MS = 10_000;
const ETHEREUM_CHAIN_ID = 1;
const WXRP_ETHEREUM_ADDRESS = "0x39fbbabf11738317a448031930706cd3e612e1b9";

type BackendBalanceResponse = {
  success?: boolean;
  data?: BalanceItem[];
  error?: string;
};

type BackendBalanceFetchResult = {
  data: BalanceItem[];
  error: string | null;
};

const backendBalanceInflight = new Map<string, Promise<BackendBalanceFetchResult>>();
const backendBalanceCache = new Map<
  string,
  { atMs: number; result: BackendBalanceFetchResult }
>();

function fetchBackendBalances(url: string): Promise<BackendBalanceFetchResult> {
  const now = Date.now();
  const cached = backendBalanceCache.get(url);
  if (cached && now - cached.atMs < BACKEND_BALANCE_CACHE_MS) {
    return Promise.resolve(cached.result);
  }
  const inFlight = backendBalanceInflight.get(url);
  if (inFlight) return inFlight;
  const run = (async (): Promise<BackendBalanceFetchResult> => {
    try {
      const response = await fetch(url, { cache: "no-store" });
      const json = (await response.json()) as BackendBalanceResponse;
      if (response.ok && json.success === true && Array.isArray(json.data)) {
        const result = { data: json.data, error: null };
        backendBalanceCache.set(url, { atMs: Date.now(), result });
        return result;
      }
      const result = {
        data: [] as BalanceItem[],
        error: json.error ?? "Backend balance request failed.",
      };
      backendBalanceCache.set(url, { atMs: Date.now(), result });
      return result;
    } catch (error) {
      const result = {
        data: [] as BalanceItem[],
        error:
          error instanceof Error
            ? error.message
            : "Backend balance request failed.",
      };
      backendBalanceCache.set(url, { atMs: Date.now(), result });
      return result;
    } finally {
      backendBalanceInflight.delete(url);
    }
  })();
  backendBalanceInflight.set(url, run);
  return run;
}

function mapWithBackendSource(items: BalanceItem[]): BalanceItem[] {
  const updatedAtMs = Date.now();
  return items.map((item) => ({
    ...item,
    source: "backend",
    updatedAtMs,
  }));
}

function buildBalancesUrl(
  walletAddress: string,
  networkIds: number[],
  tokenAddresses: string[],
  overrides?: { chainId?: number; tokenAddress?: string }
): string {
  const query = new URLSearchParams();
  query.set("address", walletAddress);
  if (networkIds.length > 0) query.set("networkIds", networkIds.join(","));
  if (tokenAddresses.length > 0) query.set("tokenAddresses", tokenAddresses.join(","));
  if (overrides?.chainId != null) query.set("chainId", String(overrides.chainId));
  if (overrides?.tokenAddress) query.set("tokenAddress", overrides.tokenAddress);
  return `/api/squid/balances?${query.toString()}`;
}

function buildMulticallBalancesUrl(
  walletAddress: string,
  overrides?: { chainId?: number; tokenAddress?: string }
): string {
  const query = new URLSearchParams();
  query.set("address", walletAddress);
  if (overrides?.chainId != null) query.set("chainId", String(overrides.chainId));
  if (overrides?.tokenAddress) query.set("tokenAddress", overrides.tokenAddress);
  return `/api/balances/multicall?${query.toString()}`;
}

function hasRequestedWxrp(
  items: BalanceItem[],
  networkIds: number[],
  tokenAddresses: string[]
): boolean {
  const requestsEth = networkIds.includes(ETHEREUM_CHAIN_ID);
  if (!requestsEth) return false;
  const requestsWxrp = tokenAddresses.some(
    (address) => address.trim().toLowerCase() === WXRP_ETHEREUM_ADDRESS
  );
  if (!requestsWxrp) return false;
  return items.some(
    (item) =>
      (item.chainId?.trim() ?? "") === String(ETHEREUM_CHAIN_ID) &&
      (item.tokenAddress?.trim().toLowerCase() ?? "") === WXRP_ETHEREUM_ADDRESS
  );
}

function mergeUniqueBalances(
  primary: BalanceItem[],
  fallback: BalanceItem[]
): BalanceItem[] {
  const out = new Map<string, BalanceItem>();
  for (const item of primary) {
    out.set(makeBalanceIdentityKey(item.chainId, item.tokenAddress), item);
  }
  for (const item of fallback) {
    const key = makeBalanceIdentityKey(item.chainId, item.tokenAddress);
    if (!out.has(key)) out.set(key, item);
  }
  return [...out.values()];
}

export function useHybridBalances({
  walletAddress,
  networkIds,
  tokenAddresses,
  refreshKey,
}: {
  walletAddress: string | null;
  networkIds: number[];
  tokenAddresses: string[];
  refreshKey?: number;
}): HybridBalancesResult {
  const walletSig = walletAddress?.trim() ?? "";
  const normalizedNetworkIds = useMemo(() => {
    return [...new Set(networkIds.filter((id) => Number.isFinite(id)))].sort(
      (a, b) => a - b
    );
  }, [networkIds]);
  const normalizedTokenAddresses = useMemo(() => {
    return [...new Set(tokenAddresses.map((address) => address.trim()).filter(Boolean))].sort(
      (a, b) => a.localeCompare(b, undefined, { sensitivity: "base" })
    );
  }, [tokenAddresses]);
  const networkIdsKey = useMemo(
    () => normalizedNetworkIds.join(","),
    [normalizedNetworkIds]
  );
  const tokenAddressesKey = useMemo(
    () => normalizedTokenAddresses.join("||"),
    [normalizedTokenAddresses]
  );
  const [backendItems, setBackendItems] = useState<BalanceItem[]>([]);
  const [backendLoading, setBackendLoading] = useState(false);
  const [backendError, setBackendError] = useState<string | null>(null);

  useEffect(() => {
    if (!walletSig) {
      setBackendItems((prev) => (prev.length === 0 ? prev : []));
      setBackendLoading(false);
      setBackendError(null);
      return;
    }
    let cancelled = false;
    (async () => {
      setBackendLoading(true);
      setBackendError(null);
      try {
        const primaryUrl = buildBalancesUrl(walletSig, [], []);
        const primaryResult = await fetchBackendBalances(primaryUrl);
        if (cancelled) return;
        let mergedResult = primaryResult.data;
        if (
          !hasRequestedWxrp(
            primaryResult.data,
            normalizedNetworkIds,
            normalizedTokenAddresses
          ) &&
          normalizedNetworkIds.includes(ETHEREUM_CHAIN_ID) &&
          normalizedTokenAddresses.some(
            (address) =>
              address.trim().toLowerCase() === WXRP_ETHEREUM_ADDRESS
          )
        ) {
          const fallbackUrl = buildMulticallBalancesUrl(walletSig, {
            chainId: ETHEREUM_CHAIN_ID,
            tokenAddress: WXRP_ETHEREUM_ADDRESS,
          });
          const fallbackResult = await fetchBackendBalances(fallbackUrl);
          if (!cancelled && fallbackResult.data.length > 0) {
            mergedResult = mergeUniqueBalances(
              primaryResult.data,
              fallbackResult.data
            );
          }
        }
        setBackendItems(mapWithBackendSource(mergedResult));
        setBackendError(primaryResult.error);
      } finally {
        if (!cancelled) setBackendLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [walletSig, refreshKey, networkIdsKey, tokenAddressesKey, normalizedNetworkIds, normalizedTokenAddresses]);

  const dynamic = useDynamicBalancesAdapter({
    walletAddress: walletSig || null,
    networkIds,
    tokenAddresses,
    enabled: walletSig.length > 0,
  });

  const items = useMemo(
    () => mergeBalanceItems(backendItems, dynamic.items),
    [backendItems, dynamic.items]
  );

  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    if (!walletSig) return;
    const sourceCounts = items.reduce<Record<string, number>>((acc, item) => {
      const source = item.source ?? "unknown";
      acc[source] = (acc[source] ?? 0) + 1;
      return acc;
    }, {});
    // Dev-only visibility into backend vs Dynamic contribution.
    console.debug("[balances] hybrid source counts", sourceCounts);
  }, [walletSig, items]);

  return {
    items,
    loading: backendLoading || dynamic.loading,
    error: backendError ?? dynamic.error,
  };
}

