"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Search, ChevronLeft } from "lucide-react";
import {
  CHAINS,
  TOKENS,
  getChainById as getStaticChainById,
} from "@/config/chainsAndTokens";
import { useGetChainsQuery, useGetTokensQuery } from "@/store/api/squidApi";
import { useAppDispatch } from "@/store/hooks";
import { recordTokenUsed } from "@/store/slices/usedTokensSlice";
import type { Chain, Token } from "@/types/token";
import type { TokenSelection } from "../Exchange/TokenChainSelectModal";

const PANEL_WIDTH = 380;
const TAB_IDS = ["tokens", "offramp", "activities"] as const;
type TabId = (typeof TAB_IDS)[number];

interface TransferSelectPanelProps {
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

function TokenIconWithChainBadge({
  token,
  chain,
}: {
  token: Token;
  chain: Chain | undefined;
}) {
  const chainInitials = chain?.shortName?.slice(0, 2) ?? chain?.name?.slice(0, 2) ?? "?";
  return (
    <span className="relative flex size-12 shrink-0 overflow-hidden rounded-full bg-muted ring-1 ring-border/50">
      {token.logoURI != null && token.logoURI !== "" ? (
        /* eslint-disable-next-line @next/next/no-img-element -- external token logo URLs */
        <img
          src={token.logoURI}
          alt=""
          width={48}
          height={48}
          className="size-12 object-cover"
        />
      ) : (
        <span className="flex size-12 items-center justify-center text-base font-semibold text-muted-foreground">
          {token.symbol.slice(0, 2)}
        </span>
      )}
      {chain != null && (
        <span
          className="absolute bottom-0 right-0 flex size-5 items-center justify-center rounded-full border-2 border-background bg-muted text-[10px] font-medium text-muted-foreground ring-1 ring-border/50"
          aria-hidden
        >
          {chainInitials}
        </span>
      )}
    </span>
  );
}

export function TransferSelectPanel({
  open,
  onOpenChange,
  onSelect,
  excludeSymbol,
}: TransferSelectPanelProps) {
  const dispatch = useAppDispatch();
  const [activeTab, setActiveTab] = useState<TabId>("tokens");
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
      dispatch(recordTokenUsed({ tokenId: token.id, chainId: token.chainId }));
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

  return (
    <div className={cn("flex relative", open ? "" : "hidden")}>

      <button
        type="button"
        onClick={() => onOpenChange(false)}
        className="rounded-full p-3 m-5 bg-muted h-fit text-foreground hover:text-foreground transition-colors cursor-pointer w-20 flex items-center justify-center absolute -left-30"
        aria-label="Close"
      >
        <ChevronLeft className="size-5" /> Back
      </button>
      <aside
        role="region"
        aria-label="Select token"
        className={cn(
          // "flex flex-col shrink-0 border-l border-border bg-card transition-[transform] duration-300 ease-out overflow-hidden ml-2 relative w-[40rem] glass-card",
          "glass-card tab-modal overflow-hidden p-2 shadow-xl shrink-0 min-w-0 transition-all duration-300 ease-out h-fit w-[--modal-width]",
          open ? "translate-x-0" : "translate-x-full hidden"
        )}
      // style={{ width: open ? PANEL_WIDTH : 0, minWidth: open ? PANEL_WIDTH : 0 }}
      >
        <header className="flex items-center gap-2 shrink-0 px-4 py-3">

          <h2 className="text-lg font-semibold text-foreground">Select token</h2>
        </header>

        <nav
          className="flex shrink-0 gap-1 py-2 border-b border-border "
          aria-label="Sections"
        >
          {(["tokens", "offramp", "activities"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-medium capitalize transition-colors cursor-pointer",
                activeTab === tab
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab === "offramp" ? "Offramp" : tab === "activities" ? "Activities" : "Tokens"}
            </button>
          ))}
        </nav>

        {activeTab === "tokens" && (
          <>
            <div className="shrink-0 px-4 pt-3 pb-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                <Input
                  type="text"
                  placeholder="Search token or paste address"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 rounded-xl"
                />
              </div>
            </div>

            <section
              className="px-3 pb-2 shrink-0"
              aria-label="Chains"
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

            <section
              className="flex-1 min-h-0 overflow-y-auto px-2 pb-4"
              aria-label="Token list"
            >
              {filteredTokens.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No tokens found
                </p>
              ) : (
                <ul className="space-y-0">
                  {filteredTokens.map((token) => {
                    const chain = getChainById(token.chainId);
                    return (
                      <li key={token.id}>
                        <button
                          type="button"
                          onClick={() => handleSelectToken(token)}
                          className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left hover:bg-muted/40 transition-colors"
                        >
                          <TokenIconWithChainBadge token={token} chain={chain ?? undefined} />
                          <span className="flex-1 min-w-0">
                            <span className="block text-sm font-medium text-foreground truncate">
                              {token.name}
                            </span>
                            <span className="block text-xs text-muted-foreground truncate">
                              {chain?.shortName ?? chain?.name ?? token.chainId}
                            </span>
                          </span>
                          <span className="text-sm font-semibold text-foreground tabular-nums">
                            0.00 {token.symbol}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </>
        )}

        {activeTab === "offramp" && (
          <section className="flex-1 overflow-y-auto px-4 py-6">
            <p className="text-sm text-muted-foreground">
              Offramp options: Mobile money (Momo), banks, and other payout methods will appear here.
            </p>
          </section>
        )}

        {activeTab === "activities" && (
          <section className="flex-1 overflow-y-auto px-4 py-6">
            <p className="text-sm text-muted-foreground">
              Recent transfer and swap activity will appear here.
            </p>
          </section>
        )}
      </aside>
    </div>
  );
}
