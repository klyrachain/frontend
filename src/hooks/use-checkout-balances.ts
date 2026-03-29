"use client";

import { useEffect, useState, useMemo } from "react";
import type { CheckoutPayoutRowConfig } from "@/lib/checkout-payout-options";

type BalanceItem = {
  chainId?: string;
  tokenAddress?: string;
  balance?: string;
  tokenSymbol?: string;
};

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

export function useCheckoutBalances(
  walletAddress: string | null,
  payoutRows: CheckoutPayoutRowConfig[]
): {
  byRowId: Record<string, string>;
  loading: boolean;
} {
  const [items, setItems] = useState<BalanceItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!walletAddress?.trim()) {
      setItems([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/squid/balances?address=${encodeURIComponent(walletAddress.trim())}`,
          { cache: "no-store" }
        );
        const json = (await res.json()) as {
          success?: boolean;
          data?: BalanceItem[];
        };
        if (cancelled) return;
        if (res.ok && json.success === true && Array.isArray(json.data)) {
          setItems(json.data);
        } else {
          setItems([]);
        }
      } catch {
        if (!cancelled) setItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [walletAddress]);

  const byRowId = useMemo(() => {
    const out: Record<string, string> = {};
    for (const row of payoutRows) {
      const hit = items.find((it) =>
        tokenMatch(it, row.balanceChainId, row.balanceTokenAddress)
      );
      out[row.id] = hit?.balance?.trim() ? hit.balance : "—";
    }
    return out;
  }, [items, payoutRows]);

  return { byRowId, loading };
}
