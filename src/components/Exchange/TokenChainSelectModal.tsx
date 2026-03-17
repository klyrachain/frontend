"use client";

import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Search, X } from "lucide-react";
import { CHAINS, TOKENS, getChainById as getStaticChainById } from "@/config/chainsAndTokens";
import { useGetChainsQuery, useGetTokensQuery } from "@/store/api/squidApi";
import { useAppDispatch } from "@/store/hooks";
import { recordTokenUsed } from "@/store/slices/usedTokensSlice";
import type { Chain, Token } from "@/types/token";

export interface TokenSelection {
  chain: Chain;
  token: Token;
}

interface TokenChainSelectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (selection: TokenSelection) => void;
  /** Exclude this token symbol from the list (e.g. the other side of the swap) */
  excludeSymbol?: string;
}

function getChainByIdFromList(chains: Chain[], chainId: string): Chain | undefined {
  return chains.find((c) => c.id === chainId);
}

export function TokenChainSelectModal({
  open,
  onOpenChange,
  onSelect,
  excludeSymbol,
}: TokenChainSelectModalProps) {
  const dispatch = useAppDispatch();
  const [search, setSearch] = useState("");
  const [selectedChainId, setSelectedChainId] = useState<string | null>(null);

  const { data: apiChains = [], isSuccess: chainsSuccess } = useGetChainsQuery(undefined, {
    skip: !open,
  });
  const { data: apiTokens = [], isSuccess: tokensSuccess } = useGetTokensQuery(undefined, {
    skip: !open,
  });

  const chains = chainsSuccess && apiChains.length > 0 ? apiChains : CHAINS;
  const tokens = tokensSuccess && apiTokens.length > 0 ? apiTokens : TOKENS;
  const getChainById = (chainId: string) =>
    getChainByIdFromList(chains, chainId) ?? getStaticChainById(chainId);

  const filteredTokens = useMemo(() => {
    let list = tokens;
    if (excludeSymbol) {
      list = list.filter((t) => t.symbol !== excludeSymbol);
    }
    if (selectedChainId) {
      list = list.filter((t) => t.chainId === selectedChainId);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (t) =>
          t.symbol.toLowerCase().includes(q) ||
          t.name.toLowerCase().includes(q)
      );
    }
    return list;
  }, [tokens, search, selectedChainId, excludeSymbol]);

  const handleSelectToken = (token: Token) => {
    const chain = getChainById(token.chainId);
    if (chain) {
      dispatch(recordTokenUsed({ tokenId: token.id, chainId: token.chainId }));
      onSelect({ chain, token });
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} >
      <DialogContent className="max-h-[85vh] w-[var(--modal-width)] flex flex-col overflow-hidden p-0 bg-card text-card-foreground">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 border-b border-border py-3 px-4 w-full">
          <DialogTitle className="text-lg font-semibold text-card-foreground">
            Select token
          </DialogTitle>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-full p-1.5 hover:bg-muted transition-colors"
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
        </DialogHeader>

        <div className="space-y-4 flex flex-col min-h-0 flex-1 w-full p-4 pt-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search token or paste address"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 rounded-xl"
            />
          </div>

          <section aria-label="Chains" className="px-4">
            <p className="modal-subtitle text-xs font-medium text-muted-foreground mb-2">
              Chain
            </p>
            <ul className="flex flex-wrap gap-2">
              <li>
                <button
                  type="button"
                  onClick={() => setSelectedChainId(null)}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                    selectedChainId === null
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted/50 hover:bg-muted text-card-foreground"
                  )}
                >
                  All
                </button>
              </li>
              {chains.map((chain) => (
                <li key={chain.id}>
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedChainId(
                        selectedChainId === chain.id ? null : chain.id
                      )
                    }
                    className={cn(
                      "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                      selectedChainId === chain.id
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted/50 hover:bg-muted text-card-foreground"
                    )}
                  >
                    {chain.shortName ?? chain.name}
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <section
            className="flex-1 min-h-0 overflow-y-auto rounded-xl"
            aria-label="Token list"
          >
            <ul className="divide-y divide-border">
              {filteredTokens.length === 0 ? (
                <li className="px-4 py-8 text-center text-sm text-muted-foreground">
                  No tokens found
                </li>
              ) : (
                filteredTokens.map((token) => {
                  const chain = getChainById(token.chainId);
                  return (
                    <li key={token.id}>
                      <button
                        type="button"
                        onClick={() => handleSelectToken(token)}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/50 transition-colors"
                      >
                        {token.logoURI != null && token.logoURI !== "" ? (
                          <span className="relative flex size-9 shrink-0 overflow-hidden rounded-full bg-muted">
                            <img
                              src={token.logoURI}
                              alt=""
                              width={36}
                              height={36}
                              className="size-9 object-cover"
                            />
                          </span>
                        ) : (
                          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold">
                            {token.symbol.slice(0, 2)}
                          </span>
                        )}
                        <span className="flex-1 min-w-0">
                          <span className="modal-balance block font-semibold truncate text-card-foreground">
                            {token.symbol}
                          </span>
                          <span className="modal-subtitle block text-xs text-muted-foreground truncate">
                            {token.name}
                          </span>
                        </span>
                        {chain != null && (
                          <span className="shrink-0 rounded-md bg-muted px-2 py-0.5 text-xs font-medium">
                            {chain.shortName ?? chain.name}
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })
              )}
            </ul>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
