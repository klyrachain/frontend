"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Search, X } from "lucide-react";
import {
  CHAINS,
  TOKENS,
  getChainById as getStaticChainById,
} from "@/config/chainsAndTokens";
import { useGetChainsQuery, useGetTokensQuery } from "@/store/api/squidApi";
import type { Chain, Token } from "@/types/token";
import type { TokenSelection } from "../Exchange/TokenChainSelectModal";

interface TransferSelectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (selection: TokenSelection) => void;
  excludeSymbol?: string;
}

function getChainByIdFromList(
  chains: Chain[],
  chainId: string
): Chain | undefined {
  return chains.find((c) => c.id === chainId);
}

export function TransferSelectModal({
  open,
  onOpenChange,
  onSelect,
  excludeSymbol,
}: TransferSelectModalProps) {
  const [search, setSearch] = useState("");
  const [selectedChainId, setSelectedChainId] = useState<string | null>(null);
  const [recentChainIds, setRecentChainIds] = useState<string[]>([]);

  const { data: apiChains = [], isSuccess: chainsSuccess } = useGetChainsQuery(
    undefined,
    { skip: !open }
  );
  const { data: apiTokens = [], isSuccess: tokensSuccess } = useGetTokensQuery(
    undefined,
    { skip: !open }
  );

  const chains = chainsSuccess && apiChains.length > 0 ? apiChains : CHAINS;
  const tokens = tokensSuccess && apiTokens.length > 0 ? apiTokens : TOKENS;
  const getChainById = (chainId: string) =>
    getChainByIdFromList(chains, chainId) ?? getStaticChainById(chainId);

  const favoriteOrRecentChainIds = useMemo(() => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const id of recentChainIds) {
      if (chains.some((c) => c.id === id) && !seen.has(id)) {
        seen.add(id);
        out.push(id);
      }
    }
    for (const c of chains) {
      if (out.length >= 6) break;
      if (!seen.has(c.id)) {
        seen.add(c.id);
        out.push(c.id);
      }
    }
    return out;
  }, [chains, recentChainIds]);

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
      setRecentChainIds((prev) => {
        const next = [chain.id, ...prev.filter((id) => id !== chain.id)].slice(
          0,
          5
        );
        return next;
      });
      onSelect({ chain, token });
      onOpenChange(false);
    }
  };

  const handleOverlayClick = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  const handlePanelClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    window.addEventListener("keydown", onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onOpenChange]);

  const modalContent = (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="transfer-select-modal-title"
      className="fixed inset-0 z-[--z-modal] flex justify-center pt-20 p-4 bg-background/85 backdrop-blur-sm"
    >
      {/* Overlay: opaque so Safari/Chrome/Brave match (no alpha) */}
      <button
        type="button"
        tabIndex={-1}
        aria-hidden="true"
        onClick={handleOverlayClick}
      // className={cn(
      //   "absolute inset-0 bg-[oklch(0.15_0_0)] dark:bg-[oklch(0.08_0_0)]",
      //   "focus:outline-none focus:ring-0"
      // )}"
      />

      {/* Modal panel: opaque card background */}
      <div
        onClick={handlePanelClick}
        // className={cn(
        //   "relative flex flex-col w-full max-w-[var(--modal-width)] max-h-[85vh]",
        //   "rounded-2xl border border-border bg-card shadow-2xl",
        //   "animate-in fade-in-0 zoom-in-95 duration-200 ease-out"
        // )}
        className="w-full lg:w-[80vw] md:w-[90vw] sm:w-[95vw] max-h-[85vh] animate-in fade-in-0 zoom-in-95 duration-200 ease-out"
      >
        <header className="flex flex-row items-center justify-between shrink-0 px-4 py-3 rounded-t-2xl">
          <h2
            id="transfer-select-modal-title"
            className="text-lg font-semibold text-foreground"
          >
            Select token
          </h2>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-full p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
        </header>

        <div className="relative shrink-0 px-4 pt-3 pb-2 w-full">
          <Search className="absolute left-7 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input
            type="text"
            placeholder="Search token or paste address"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 rounded-xl"
          />
        </div>

        <section
          className="px-3 pb-2 shrink-0 w-full text-center"
          aria-label="Favorites and recent chains"
        >

          <ul className="flex flex-wrap gap-2">
            {favoriteOrRecentChainIds.map((chainId) => {
              const chain = getChainById(chainId);
              if (chain == null) return null;
              const isActive = selectedChainId === chain.id;
              return (
                <li key={chain.id}>
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedChainId(isActive ? null : chain.id)
                    }
                    className={cn(
                      "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted/50 hover:bg-muted text-foreground"
                    )}
                  >
                    {chain.shortName ?? chain.name}
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        <div className="flex flex-1 min-h-0 overflow-hidden rounded-b-2xl w-full p-4">
          <aside
            className="w-36 lg:w-64 md:w-48 sm:w-36 shrink-0 overflow-y-auto py-2 bg-muted/5 rounded-bl-2xl"
            aria-label="All chains"
          >
            <p className="text-xs font-medium text-muted-foreground px-3 mb-2">
              Chains
            </p>
            <ul className="space-y-0.5">
              <li>
                <button
                  type="button"
                  onClick={() => setSelectedChainId(null)}
                  className={cn(
                    "w-full text-left rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    selectedChainId === null
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted/50 text-foreground"
                  )}
                >
                  All
                </button>
              </li>
              {chains.map((chain) => {
                const isActive = selectedChainId === chain.id;
                return (
                  <li key={chain.id}>
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedChainId(isActive ? null : chain.id)
                      }
                      className={cn(
                        "w-full text-left rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-muted/50 text-foreground"
                      )}
                    >
                      {chain.shortName ?? chain.name}
                    </button>
                  </li>
                );
              })}
            </ul>
          </aside>

          <section
            className="flex-1 min-w-0 overflow-y-auto p-4"
            aria-label="Token grid"
          >
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {filteredTokens.length === 0 ? (
                <p className="col-span-full py-8 text-center text-sm text-muted-foreground">
                  No tokens found
                </p>
              ) : (
                filteredTokens.map((token) => {
                  const chain = getChainById(token.chainId);
                  return (
                    <button
                      key={token.id}
                      type="button"
                      onClick={() => handleSelectToken(token)}
                      className="flex flex-col items-center gap-2 rounded-xl border border-border bg-yellow-500 p-4 hover:bg-muted/30 hover:border-muted-foreground/20 transition-colors cursor-pointer"
                    >
                      {token.logoURI != null && token.logoURI !== "" ? (
                        <span className="relative flex size-12 shrink-0 overflow-hidden rounded-full bg-muted ring-1 ring-border/50">
                          {/* eslint-disable-next-line @next/next/no-img-element -- external token logo URLs */}
                          <img
                            src={token.logoURI}
                            alt=""
                            width={48}
                            height={48}
                            className="size-12 object-cover"
                          />
                        </span>
                      ) : (
                        <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-muted text-lg font-semibold ring-1 ring-border/50">
                          {token.symbol.slice(0, 2)}
                        </span>
                      )}
                      <span className="font-medium text-sm truncate w-full text-center">
                        {token.symbol}
                      </span>
                      {chain != null && (
                        <span className="text-xs text-muted-foreground truncate w-full text-center">
                          {chain.shortName ?? chain.name}
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );

  if (!open) return null;
  if (typeof document === "undefined") return null;

  return createPortal(modalContent, document.body);
}
