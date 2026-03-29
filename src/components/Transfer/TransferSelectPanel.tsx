"use client";

import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";
import { getChainById as getStaticChainById } from "@/config/chainsAndTokens";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { recordTokenUsed } from "@/store/slices/usedTokensSlice";
import type { Chain, Token } from "@/types/token";
import type { TokenSelection } from "@/components/Exchange/TokenChainSelectModal";
import { TokenIconWithChainBadge } from "@/components/Token/TokenIconWithChainBadge";
import { TransferOnrampTab } from "@/components/Transfer/TransferOnrampTab";
import type { OnrampDestination } from "@/components/Transfer/TransferOnrampTab";
import { TransferOfframpTab } from "@/components/Transfer/TransferOfframpTab";
import {
  TransferAggregateTab,
  type AggregateRowView,
} from "@/components/Transfer/TransferAggregateTab";
import type { AggregateAllocation } from "@/lib/aggregate-payment-plan";
import { TransferActivitiesTab } from "@/components/Transfer/TransferActivitiesTab";

const INITIAL_TOKEN_LIST_SIZE = 100;

const TAB_IDS = [
  "tokens",
  "onramp",
  "offramp",
  "aggregate",
  "activities",
] as const;
type TabId = (typeof TAB_IDS)[number];

const MODAL_TAB_CONTENT_BOX =
  "flex flex-1 flex-col overflow-hidden min-h-[50vh] max-h-[60vh]";

export interface TransferSelectPanelProps {
  chains: Chain[];
  tokens: Token[];
  excludeSymbol?: string;
  onSelect: (selection: TokenSelection) => void;
  layout: "modal" | "embedded";
  resetKey?: number;
  /** FIAT-denominated invoice: offramp Morapay is disabled; onramp is for buying crypto to pay. */
  invoiceChargeKind?: "FIAT" | "CRYPTO";
  onMorapayOfframpSelect?: () => void;
  onOnrampChoice?: (destination: OnrampDestination) => void;
  onAggregateApply?: (allocations: AggregateAllocation[]) => void;
  aggregateContext?: {
    walletAddress: string | null;
    invoiceLabel: string;
    rows: AggregateRowView[];
  };
}

function getChainByIdFromList(
  chains: Chain[],
  chainId: string
): Chain | undefined {
  return chains.find((c) => c.id === chainId);
}

function tabLabel(tab: TabId): string {
  switch (tab) {
    case "tokens":
      return "Tokens";
    case "onramp":
      return "Onramp";
    case "offramp":
      return "Offramp";
    case "aggregate":
      return "Aggregate";
    case "activities":
      return "Activities";
    default:
      return tab;
  }
}

export function TransferSelectPanel({
  chains,
  tokens,
  excludeSymbol,
  onSelect,
  layout,
  resetKey = 0,
  invoiceChargeKind = "FIAT",
  onMorapayOfframpSelect,
  onOnrampChoice,
  onAggregateApply,
  aggregateContext,
}: TransferSelectPanelProps) {
  const dispatch = useAppDispatch();
  const usedTokensEntries = useAppSelector((s) => s.usedTokens.entries);
  const deferredUsedEntries = useDeferredValue(usedTokensEntries);

  const [activeTab, setActiveTab] = useState<TabId>("tokens");
  const [search, setSearch] = useState("");
  const [selectedChainId, setSelectedChainId] = useState<string | null>(null);

  const morapayEnabled = invoiceChargeKind === "CRYPTO";

  const resetUi = useCallback(() => {
    setActiveTab("tokens");
    setSearch("");
    setSelectedChainId(null);
  }, []);

  useEffect(() => {
    if (layout === "embedded" && resetKey > 0) resetUi();
  }, [resetKey, layout, resetUi]);

  const getChainById = useCallback(
    (chainId: string) =>
      getChainByIdFromList(chains, chainId) ?? getStaticChainById(chainId),
    [chains]
  );

  const suggestedChainIds = useMemo(() => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const e of deferredUsedEntries) {
      if (chains.some((c) => c.id === e.chainId) && !seen.has(e.chainId)) {
        seen.add(e.chainId);
        out.push(e.chainId);
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
  }, [chains, deferredUsedEntries]);

  const usedTokenIdOrder = useMemo(() => {
    const order = new Map<string, number>();
    deferredUsedEntries.forEach((e, i) => order.set(e.tokenId, i));
    return order;
  }, [deferredUsedEntries]);

  const filteredTokens = useMemo(() => {
    let list = tokens;
    if (excludeSymbol) list = list.filter((t) => t.symbol !== excludeSymbol);
    if (selectedChainId) list = list.filter((t) => t.chainId === selectedChainId);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (t) =>
          t.symbol.toLowerCase().includes(q) ||
          t.name.toLowerCase().includes(q)
      );
    }
    list = [...list].sort((a, b) => {
      const aIdx = usedTokenIdOrder.get(a.id) ?? 1e9;
      const bIdx = usedTokenIdOrder.get(b.id) ?? 1e9;
      return aIdx - bIdx;
    });
    return list;
  }, [tokens, search, selectedChainId, excludeSymbol, usedTokenIdOrder]);

  const handleSelectToken = (token: Token) => {
    const chain = getChainById(token.chainId);
    if (chain) {
      dispatch(recordTokenUsed({ tokenId: token.id, chainId: token.chainId }));
      onSelect({ chain, token });
    }
  };

  const isEmbedded = layout === "embedded";
  const tabNavClass = cn(
    "checkout-token-scroll-x flex shrink-0 gap-1 overflow-x-auto px-2 py-2 sm:px-4",
    !isEmbedded && "border-b border-border"
  );

  const tabContentClass = cn(
    "flex flex-col overflow-hidden",
    isEmbedded ? "min-h-0 flex-1" : MODAL_TAB_CONTENT_BOX
  );

  const aggregateRows = aggregateContext?.rows ?? [];
  const aggregateWallet = aggregateContext?.walletAddress ?? null;
  const aggregateInvoice = aggregateContext?.invoiceLabel ?? "";

  return (
    <div
      className={cn(
        "flex min-h-0 w-full flex-col overflow-hidden",
        isEmbedded && "min-h-0 flex-1"
      )}
    >
      <nav className={tabNavClass} aria-label="Token picker sections">
        {TAB_IDS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={cn(
              "shrink-0 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors sm:px-3",
              activeTab === tab
                ? "text-primary"
                : "text-muted-foreground hover:text-card-foreground"
            )}
          >
            {tabLabel(tab)}
          </button>
        ))}
      </nav>

      <div className={tabContentClass}>
        {activeTab === "tokens" && (
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <div className="shrink-0 px-2 pb-2 pt-3 sm:px-4">
              <div className="relative">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden
                />
                <Input
                  type="text"
                  placeholder="Search token or paste address"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className={cn(
                    "pl-9 rounded-xl shadow-none",
                    isEmbedded ? "border border-border" : "border-none"
                  )}
                />
              </div>
            </div>

            <section
              className="shrink-0 px-2 pb-2 sm:px-4"
              aria-label="Chains"
            >
              <ul className="flex flex-wrap gap-2">
                {suggestedChainIds.map((chainId) => {
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
                          "flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                          isActive
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-card-foreground"
                        )}
                      >
                        {chain.iconURI ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={chain.iconURI}
                            alt=""
                            width={18}
                            height={18}
                            className="size-[18px] shrink-0 rounded-full object-cover"
                          />
                        ) : null}
                        <span>{chain.shortName ?? chain.name}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>

            <section
              className="checkout-token-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain px-1 pb-4 sm:px-2"
              aria-label="Token list"
            >
              {filteredTokens.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No tokens found
                </p>
              ) : (
                <ul className="space-y-0">
                  {filteredTokens
                    .slice(0, INITIAL_TOKEN_LIST_SIZE)
                    .map((token) => {
                      const chain = getChainById(token.chainId);
                      return (
                        <li key={token.id}>
                          <button
                            type="button"
                            onClick={() => handleSelectToken(token)}
                            className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-muted/40"
                          >
                            <TokenIconWithChainBadge
                              token={token}
                              chain={chain ?? undefined}
                            />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-medium text-primary">
                                {token.name}
                              </span>
                              <span className="flex items-center gap-1.5 truncate text-xs text-muted-foreground">
                                <span className="truncate">
                                  {chain?.shortName ??
                                    chain?.name ??
                                    token.chainId}
                                </span>
                              </span>
                            </span>
                            <span className="modal-balance tabular-nums text-sm font-semibold text-primary">
                              0.00 {token.symbol}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                </ul>
              )}
            </section>
          </div>
        )}

        {activeTab === "onramp" && (
          <TransferOnrampTab
            onChoose={(dest) => {
              onOnrampChoice?.(dest);
            }}
          />
        )}

        {activeTab === "offramp" && (
          <TransferOfframpTab
            morapayEnabled={morapayEnabled}
            onSelectMorapay={() => {
              onMorapayOfframpSelect?.();
            }}
          />
        )}

        {activeTab === "aggregate" && (
          <TransferAggregateTab
            walletAddress={aggregateWallet}
            invoiceLabel={aggregateInvoice}
            rows={aggregateRows}
            tokens={tokens}
            chains={chains}
            onApply={(alloc) => {
              onAggregateApply?.(alloc);
            }}
          />
        )}

        {activeTab === "activities" && <TransferActivitiesTab />}
      </div>
    </div>
  );
}
