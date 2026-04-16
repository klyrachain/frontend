"use client";

import type { BalanceItem } from "@/lib/balances/types";
import { makeBalanceIdentityKey } from "@/lib/balances/address-normalization";

function toNum(v: string | undefined): number {
  const n = Number.parseFloat(v ?? "0");
  return Number.isFinite(n) ? n : 0;
}

function itemKey(item: BalanceItem): string {
  return makeBalanceIdentityKey(item.chainId, item.tokenAddress);
}

function pickPreferred(existing: BalanceItem, candidate: BalanceItem): BalanceItem {
  const backendValue = toNum(existing.balance);
  const dynamicValue = toNum(candidate.balance);
  if (backendValue <= 0 && dynamicValue > 0) {
    return { ...existing, ...candidate, source: "merged" };
  }
  return {
    ...candidate,
    ...existing,
    source: "merged",
  };
}

export function mergeBalanceItems(
  backendItems: BalanceItem[],
  dynamicItems: BalanceItem[]
): BalanceItem[] {
  const out = new Map<string, BalanceItem>();
  for (const item of backendItems) {
    out.set(itemKey(item), { ...item, source: item.source ?? "backend" });
  }
  for (const item of dynamicItems) {
    const key = itemKey(item);
    const current = out.get(key);
    if (!current) {
      out.set(key, { ...item, source: item.source ?? "dynamic" });
      continue;
    }
    out.set(key, pickPreferred(current, { ...item, source: item.source ?? "dynamic" }));
  }
  return [...out.values()];
}

