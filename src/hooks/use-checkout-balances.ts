"use client";

import { useMemo } from "react";
import type { CheckoutPayoutRowConfig } from "@/lib/checkout-payout-options";
import { useHybridBalances } from "@/hooks/use-hybrid-balances";
import type { BalanceItem } from "@/lib/balances/types";
import { normalizeAddressForChain } from "@/lib/balances/address-normalization";

function tokenMatch(
  item: BalanceItem,
  chainId: string,
  tokenAddress: string
): boolean {
  const ic = item.chainId?.trim() ?? "";
  if (ic !== chainId.trim()) return false;
  const ta = item.tokenAddress?.trim() ?? "";
  const want = tokenAddress.trim();
  if (chainId === "101") {
    return ta === want;
  }
  return ta.toLowerCase() === want.toLowerCase();
}

function formatFetchedBalance(balance: string | undefined): string {
  const raw = balance?.trim() ?? "";
  if (raw === "") return "0";
  return raw;
}

export function useCheckoutBalances(
  walletAddress: string | null,
  payoutRows: CheckoutPayoutRowConfig[],
  refreshKey: number = 0
): {
  byRowId: Record<string, string>;
  loading: boolean;
  error: string | null;
  items: BalanceItem[];
} {
  const walletSig = walletAddress?.trim() ?? "";
  const networkIds = useMemo(
    () =>
      [...new Set(payoutRows.map((row) => Number.parseInt(row.balanceChainId, 10)))].filter(
        (id) => Number.isFinite(id)
      ),
    [payoutRows]
  );
  const tokenAddresses = useMemo(
    () =>
      [
        ...new Set(
          payoutRows.map((row) =>
            normalizeAddressForChain(row.balanceChainId, row.balanceTokenAddress)
          )
        ),
      ].filter((address) => address.length > 0),
    [payoutRows]
  );
  const { items, loading, error } = useHybridBalances({
    walletAddress: walletSig || null,
    networkIds,
    tokenAddresses,
    refreshKey,
  });

  const byRowId = useMemo(() => {
    const out: Record<string, string> = {};
    for (const row of payoutRows) {
      const hit = items.find((it) =>
        tokenMatch(it, row.balanceChainId, row.balanceTokenAddress)
      );
      if (hit) {
        out[row.id] = formatFetchedBalance(hit.balance);
        continue;
      }
      out[row.id] = error ? "—" : "0";
    }
    return out;
  }, [items, payoutRows, error]);

  return { byRowId, loading, error, items };
}
