"use client";

import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from "react";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";
import { getChainById as getStaticChainById } from "@/config/chainsAndTokens";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { recordTokenUsed } from "@/store/slices/usedTokensSlice";
import type { Chain, Token } from "@/types/token";
import type { TokenSelection } from "@/components/Exchange/TokenChainSelectModal";
import { TokenIconWithChainBadge } from "@/components/Token/TokenIconWithChainBadge";
import { dicebearTokenAvatarUrl } from "@/components/Token/TokenAvatarWithFallback";
import type { OnrampDestination } from "@/components/Transfer/TransferOnrampTab";
import { TransferFiatTab } from "@/components/Transfer/TransferFiatTab";
import {
  TransferAggregateTab,
  type AggregateRowView,
} from "@/components/Transfer/TransferAggregateTab";
import type { AggregateAllocation } from "@/lib/aggregate-payment-plan";
import { TransferActivitiesTab } from "@/components/Transfer/TransferActivitiesTab";

const INITIAL_TOKEN_LIST_SIZE = 100;

const TAB_IDS = [
  "tokens",
  "fiat",
  "aggregate",
  "activities",
] as const;
export type TransferSelectTabId = (typeof TAB_IDS)[number];
type TabId = TransferSelectTabId;

const MODAL_TAB_CONTENT_BOX =
  "flex flex-1 flex-col overflow-hidden min-h-[50vh] max-h-[60vh]";
type PinnedChainPreference = {
  key: string;
  label: string;
  idCandidates: string[];
  nameCandidates: string[];
};

const PINNED_CHAIN_PREFERENCES: PinnedChainPreference[] = [
  {
    key: "base",
    label: "Base",
    idCandidates: ["8453", "base"],
    nameCandidates: ["base"],
  },
  {
    key: "ethereum",
    label: "Ethereum",
    idCandidates: ["1", "ethereum"],
    nameCandidates: ["ethereum"],
  },
  {
    key: "polygon",
    label: "Polygon",
    idCandidates: ["137", "polygon"],
    nameCandidates: ["polygon"],
  },
  {
    key: "stellar",
    label: "Stellar",
    idCandidates: ["148", "stellar"],
    nameCandidates: ["stellar"],
  },
  {
    key: "celo",
    label: "Celo",
    idCandidates: ["42220", "celo"],
    nameCandidates: ["celo"],
  },
  {
    key: "sui",
    label: "Sui",
    idCandidates: ["784", "sui"],
    nameCandidates: ["sui"],
  },
  {
    key: "bnb",
    label: "BNB Chain",
    idCandidates: ["56", "bnb", "bsc"],
    nameCandidates: ["bnb chain", "binance", "bsc"],
  },
  {
    key: "solana",
    label: "Solana",
    idCandidates: ["101", "solana"],
    nameCandidates: ["solana"],
  },
  {
    key: "monad",
    label: "Monad",
    idCandidates: ["monad", "10143", "34443"],
    nameCandidates: ["monad"],
  },
  {
    key: "bitcoin",
    label: "Bitcoin",
    idCandidates: ["bitcoin", "btc", "8332"],
    nameCandidates: ["bitcoin", "btc"],
  },
];

export interface TransferSelectPanelProps {
  chains: Chain[];
  tokens: Token[];
  excludeSymbol?: string;
  onSelect: (selection: TokenSelection) => void;
  layout: "modal" | "embedded";
  resetKey?: number;
  /** Shown first in the chain chip row (e.g. wallet’s current chain). */
  priorityChainIds?: string[];
  /** When `resetKey` increments, tokens tab filters to this chain if present. */
  defaultChainFilterId?: string | null;
  /** When set, switches the active tab (e.g. desktop wallet top-up split opens on Fiat). */
  forcedActiveTab?: TabId | null;
  /** FIAT-denominated invoice: offramp Morapay is disabled; onramp is for buying crypto to pay. */
  invoiceChargeKind?: "FIAT" | "CRYPTO";
  /** When true (e.g. fiat checkout), hide “Receive fiat” in the Fiat tab. */
  hideReceiveFiat?: boolean;
  /** Highlights / locks onramp rows (e.g. after choosing “Fund your wallet first” in split view). */
  onrampLockedChoice?: OnrampDestination | null;
  onMorapayOfframpSelect?: () => void;
  onOnrampChoice?: (destination: OnrampDestination) => void;
  onAggregateApply?: (allocations: AggregateAllocation[]) => void;
  aggregateContext?: {
    walletAddress: string | null;
    invoiceLabel: string;
    rows: AggregateRowView[];
  };
  tokenBalanceByTokenId?: Record<string, string>;
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
    case "fiat":
      return "Fiat";
    case "aggregate":
      return "Aggregate";
    case "activities":
      return "Activities";
    default:
      return tab;
  }
}

function normalizeChainText(value: string | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

function resolvePinnedChain(chainList: Chain[], pref: PinnedChainPreference): Chain | null {
  const idCandidates = new Set(pref.idCandidates.map((item) => normalizeChainText(item)));
  const nameCandidates = pref.nameCandidates.map((item) => normalizeChainText(item));
  return (
    chainList.find((chain) => {
      const id = normalizeChainText(chain.id);
      if (idCandidates.has(id)) return true;
      const name = normalizeChainText(chain.name);
      const shortName = normalizeChainText(chain.shortName);
      return nameCandidates.some(
        (candidate) => name.includes(candidate) || shortName.includes(candidate)
      );
    }) ?? null
  );
}

function fallbackChainIcon(chain: Chain): string {
  const chainName = normalizeChainText(chain.name);
  const chainId = normalizeChainText(chain.id);
  if (chainName.includes("stellar") || chainId === "148") {
    return "https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/xlm.png";
  }
  if (chainName.includes("bitcoin") || chainId === "8332" || chainId === "btc") {
    return "https://assets.coingecko.com/coins/images/1/standard/bitcoin.png?1696501400";
  }
  return "";
}

function chainAliasKeys(value: string | null | undefined): string[] {
  const normalized = normalizeChainText(value ?? "");
  if (!normalized) return [];
  if (normalized === "8332" || normalized === "bitcoin" || normalized === "btc") {
    return ["8332", "bitcoin", "btc"];
  }
  if (normalized === "148" || normalized === "stellar" || normalized === "xlm") {
    return ["148", "stellar", "xlm"];
  }
  return [normalized];
}

function matchesSelectedChain(tokenChainId: string, selectedChainId: string | null): boolean {
  if (!selectedChainId) return true;
  const left = new Set(chainAliasKeys(tokenChainId));
  const right = chainAliasKeys(selectedChainId);
  return right.some((id) => left.has(id));
}

export function TransferSelectPanel({
  chains,
  tokens,
  excludeSymbol,
  onSelect,
  layout,
  resetKey = 0,
  defaultChainFilterId = null,
  forcedActiveTab = null,
  invoiceChargeKind = "FIAT",
  hideReceiveFiat = false,
  onrampLockedChoice = null,
  onMorapayOfframpSelect,
  onOnrampChoice,
  onAggregateApply,
  aggregateContext,
  tokenBalanceByTokenId,
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
    setSelectedChainId(defaultChainFilterId ?? null);
  }, [defaultChainFilterId]);

  useEffect(() => {
    if (resetKey > 0) resetUi();
  }, [resetKey, resetUi]);

  useEffect(() => {
    if (forcedActiveTab) setActiveTab(forcedActiveTab);
  }, [forcedActiveTab]);

  const getChainById = useCallback(
    (chainId: string) =>
      getChainByIdFromList(chains, chainId) ?? getStaticChainById(chainId),
    [chains]
  );

  const suggestedChains = useMemo(() => {
    const seen = new Set<string>();
    const out: Array<{ id: string; label: string }> = [];
    for (const pref of PINNED_CHAIN_PREFERENCES) {
      const chain = resolvePinnedChain(chains, pref);
      if (!chain) continue;
      if (seen.has(chain.id)) continue;
      seen.add(chain.id);
      out.push({ id: chain.id, label: pref.label });
    }
    return out;
  }, [chains]);

  const usedTokenIdOrder = useMemo(() => {
    const order = new Map<string, number>();
    deferredUsedEntries.forEach((e, i) => order.set(e.tokenId, i));
    return order;
  }, [deferredUsedEntries]);

  const filteredTokens = useMemo(() => {
    let list = tokens;
    if (excludeSymbol) list = list.filter((t) => t.symbol !== excludeSymbol);
    if (selectedChainId) {
      list = list.filter((t) => matchesSelectedChain(t.chainId, selectedChainId));
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (t) =>
          t.symbol.toLowerCase().includes(q) ||
          t.name.toLowerCase().includes(q)
      );
    }
    list = [...list].sort((a, b) => {
      const aBalance = Number.parseFloat(tokenBalanceByTokenId?.[a.id] ?? "0");
      const bBalance = Number.parseFloat(tokenBalanceByTokenId?.[b.id] ?? "0");
      const safeABalance = Number.isFinite(aBalance) ? aBalance : 0;
      const safeBBalance = Number.isFinite(bBalance) ? bBalance : 0;
      if (safeBBalance !== safeABalance) return safeBBalance - safeABalance;
      const aIdx = usedTokenIdOrder.get(a.id) ?? 1e9;
      const bIdx = usedTokenIdOrder.get(b.id) ?? 1e9;
      if (aIdx !== bIdx) return aIdx - bIdx;
      const symbolCompare = a.symbol.localeCompare(b.symbol, undefined, { sensitivity: "base" });
      if (symbolCompare !== 0) return symbolCompare;
      return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
    });
    return list;
  }, [
    tokens,
    search,
    selectedChainId,
    excludeSymbol,
    usedTokenIdOrder,
    tokenBalanceByTokenId,
  ]);

  const handleSelectToken = (token: Token) => {
    const chain = getChainById(token.chainId);
    if (chain) {
      dispatch(recordTokenUsed({ tokenId: token.id, chainId: token.chainId }));
      onSelect({ chain, token });
    }
  };

  const isEmbedded = layout === "embedded";
  const tabNavClass = cn(
    "checkout-token-scroll-x flex shrink-0 gap-1 overflow-x-auto px-2 py-2 sm:px-4 w-full bg-red-00 justify-center",
    // !isEmbedded && "border-b border-border"
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
              "shrink-0 rounded-lg px-2.5 py-1 text-sm font-medium transition-colors sm:px-3",
              activeTab === tab
                ? "text-foreground bg-primary rounded-full px-4 py-0"
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
                {/* <Search
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden
                /> */}
                <Input
                  type="text"
                  placeholder="Search token or paste address"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className={cn(
                    "pl-9 rounded-xl shadow-none text-center bg-primary/80 text-foreground placeholder:text-muted",
                    isEmbedded ? "border border-border" : "border-none"
                  )}
                />
              </div>
            </div>

            <section
              className="shrink-0 px-2 pb-2 sm:px-4"
              aria-label="Chains"
            >
              <div className="flex overflow-x-auto gap-2">
                {suggestedChains.map((chip) => {
                  const chain = getChainById(chip.id);
                  if (chain == null) return null;
                  const isActive = selectedChainId === chain.id;
                  const fallbackIcon = fallbackChainIcon(chain);
                  const chainIconSrc =
                    chain.iconURI?.trim() ||
                    fallbackIcon ||
                    dicebearTokenAvatarUrl(`chain:${chain.id}`);
                  return (
                    <div key={chain.id} className="shrink-0 w-auto">
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
                        <Image
                          src={chainIconSrc}
                          alt=""
                          width={18}
                          height={18}
                          unoptimized
                          referrerPolicy="no-referrer"
                          className="size-[18px] shrink-0 rounded-full object-cover"
                          onError={(event) => {
                            const fallback =
                              fallbackIcon ||
                              dicebearTokenAvatarUrl(`chain:${chain.id}`);
                            const img = event.currentTarget as HTMLImageElement;
                            if (img.src === fallback) return;
                            img.src = fallback;
                          }}
                        />
                        <span>{chip.label}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
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
                              <span className="block truncate text-sm font-medium text-card-foreground">
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
                            <span className="modal-balance tabular-nums text-sm font-semibold text-muted-foreground">
                              {(tokenBalanceByTokenId?.[token.id] ?? "0")} {token.symbol}
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

        {activeTab === "fiat" && (
          <TransferFiatTab
            morapayEnabled={morapayEnabled}
            hideReceiveFiat={hideReceiveFiat}
            onrampLockedChoice={onrampLockedChoice}
            onOnrampChoice={(dest) => {
              onOnrampChoice?.(dest);
            }}
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
