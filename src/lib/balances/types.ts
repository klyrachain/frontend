"use client";

export type BalanceSource = "backend" | "dynamic" | "merged";

export type BalanceItem = {
  chainId?: string;
  tokenAddress?: string;
  balance?: string;
  tokenSymbol?: string;
  source?: BalanceSource;
  updatedAtMs?: number;
};

export type HybridBalancesResult = {
  items: BalanceItem[];
  loading: boolean;
  error: string | null;
};

