"use client";

import { useDeferredValue, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { Chain, Token } from "@/types/token";
import { TokenAvatarWithFallback } from "@/components/Token/TokenAvatarWithFallback";
import { Search } from "lucide-react";
import { useHybridBalances } from "@/hooks/use-hybrid-balances";

type ModalVariant = "checkout" | "pay";

type BalanceItem = {
  chainId?: string;
  tokenAddress?: string;
  balance?: string;
};

function addressFromTokenId(tokenId: string, chainId: string): string | null {
  const idx = tokenId.lastIndexOf("-");
  if (idx <= 0) return null;
  const tail = tokenId.slice(idx + 1);
  if (tail !== chainId) return null;
  return tokenId.slice(0, idx);
}

function matchBalance(
  items: BalanceItem[],
  chainId: string,
  tokenAddress: string,
  fallback: "0" | "—"
): string {
  const formatFetchedBalance = (balance: string | undefined): string => {
    const raw = balance?.trim() ?? "";
    return raw === "" ? "0" : raw;
  };
  const want = tokenAddress.trim();
  for (const it of items) {
    const ic = it.chainId?.trim() ?? "";
    if (ic !== chainId.trim()) continue;
    const ta = it.tokenAddress?.trim() ?? "";
    if (chainId === "101") {
      if (ta === want) return formatFetchedBalance(it.balance);
    } else if (ta.toLowerCase() === want.toLowerCase()) {
      return formatFetchedBalance(it.balance);
    }
  }
  return fallback;
}

export interface CheckoutTokenSelectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chains: Chain[];
  tokens: Token[];
  variant: ModalVariant;
  walletAddress: string | null;
  onSelectToken?: (token: Token) => void;
}

export function CheckoutTokenSelectModal({
  open,
  onOpenChange,
  chains,
  tokens,
  variant,
  walletAddress,
  onSelectToken,
}: CheckoutTokenSelectModalProps) {
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const networkIds = useMemo(
    () => [...new Set(tokens.map((token) => Number.parseInt(token.chainId, 10)))],
    [tokens]
  );
  const tokenAddresses = useMemo(
    () =>
      [
        ...new Set(
          tokens
            .map((token) => addressFromTokenId(token.id, token.chainId))
            .filter((addr): addr is string => Boolean(addr))
            .map((addr) => addr.toLowerCase())
        ),
      ],
    [tokens]
  );
  const { items: balances, loading: balLoading, error: balError } = useHybridBalances({
    walletAddress: open ? walletAddress : null,
    networkIds,
    tokenAddresses,
    refreshKey: open ? 1 : 0,
  });

  const chainById = useMemo(
    () => new Map(chains.map((chain) => [chain.id, chain] as const)),
    [chains]
  );

  const filtered = useMemo(() => {
    const q = deferredSearch.trim().toLowerCase();
    if (!q) return tokens.slice(0, 120);
    return tokens
      .filter(
        (token) =>
          token.symbol.toLowerCase().includes(q) ||
          token.name.toLowerCase().includes(q) ||
          token.chainId.includes(q)
      )
      .slice(0, 120);
  }, [tokens, deferredSearch]);

  const showBalanceCol = variant === "checkout" && walletAddress?.trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-hidden sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {variant === "checkout" ? "Tokens" : "Select token"}
          </DialogTitle>
        </DialogHeader>
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search"
            className="pl-9"
            aria-label="Search tokens"
          />
        </div>
        <ul
          className="max-h-[55vh] space-y-1 overflow-y-auto pr-1"
          role="listbox"
        >
          {filtered.map((token) => {
            const chain = chainById.get(token.chainId);
            const addr = addressFromTokenId(token.id, token.chainId);
            const bal =
              showBalanceCol && addr
                ? matchBalance(
                    balances,
                    token.chainId,
                    addr,
                    balError ? "—" : "0"
                  )
                : null;
            return (
              <li key={token.id}>
                <button
                  type="button"
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg border border-transparent px-2 py-2 text-left hover:bg-muted/40",
                    onSelectToken ? "cursor-pointer" : "cursor-default"
                  )}
                  onClick={() => onSelectToken?.(token)}
                >
                  <TokenAvatarWithFallback
                    logoURI={token.logoURI ?? null}
                    symbol={token.symbol}
                    chainId={token.chainId}
                    width={40}
                    height={40}
                    className="size-10 shrink-0"
                    alt=""
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {token.symbol}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {chain?.name ?? `Chain ${token.chainId}`}
                    </p>
                  </div>
                  {variant === "checkout" ? (
                    <div className="shrink-0 text-right text-xs tabular-nums">
                      {showBalanceCol ? (
                        balLoading ? (
                          <span className="text-muted-foreground">…</span>
                        ) : (
                          <span>{bal ?? "—"}</span>
                        )
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </div>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
