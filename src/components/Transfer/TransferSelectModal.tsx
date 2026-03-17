"use client";

import { useState, useMemo, useRef, useCallback, useDeferredValue } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Search, X } from "lucide-react";
import { getChainById as getStaticChainById } from "@/config/chainsAndTokens";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { recordTokenUsed } from "@/store/slices/usedTokensSlice";
import type { Chain, Token } from "@/types/token";
import type { TokenSelection } from "../Exchange/TokenChainSelectModal";

const MODAL_MAX_HEIGHT_CLASS = "max-h-[85vh]";
/** Tab content min/max height so sheet height stays consistent when switching tabs (e.g. offramp has little content). */
const TAB_CONTENT_MIN_H = "min-h-[50vh]";
const TAB_CONTENT_MAX_H = "max-h-[60vh]";

/** Mobile: bottom sheet width = viewport minus margin (inset-x-2, bottom-2). */
const BOTTOM_SHEET_MOBILE_CLASSES =
  "fixed left-2 right-2 bottom-2 top-auto w-[calc(100%-1rem)] max-w-none translate-x-0 translate-y-0 data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom";
const DESKTOP_MODAL_CLASSES =
  "sm:fixed sm:inset-auto sm:left-[50%] sm:top-4 sm:w-full sm:max-w-[var(--modal-width)] sm:-translate-x-1/2 sm:translate-y-0 sm:data-[state=open]:zoom-in-95 sm:data-[state=open]:slide-in-from-top-0";
const DRAG_CLOSE_THRESHOLD_PX = 80;
const TAB_IDS = ["tokens", "offramp", "activities"] as const;
type TabId = (typeof TAB_IDS)[number];

/** Initial token list size to avoid DOM freeze; search still uses full filtered list. */
const INITIAL_TOKEN_LIST_SIZE = 100;

interface TransferSelectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (selection: TokenSelection) => void;
  excludeSymbol?: string;
  chains: Chain[];
  tokens: Token[];
}

function getChainByIdFromList(chains: Chain[], chainId: string): Chain | undefined {
  return chains.find((c) => c.id === chainId);
}

function TokenIconWithChainBadge({ token, chain }: { token: Token; chain: Chain | undefined }) {
  const chainInitials = chain?.shortName?.slice(0, 2) ?? chain?.name?.slice(0, 2) ?? "?";
  const chainIcon = chain?.iconURI;
  return (
    <span className="relative flex size-12 shrink-0">
      <span className="flex size-12 overflow-hidden rounded-full bg-muted ring-1 ring-border/50">
        {token.logoURI != null && token.logoURI !== "" ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={token.logoURI} alt="" width={48} height={48} className="size-12 object-cover" />
        ) : (
          <span className="flex size-12 items-center justify-center text-base font-semibold text-muted-foreground">
            {token.symbol.slice(0, 2)}
          </span>
        )}
      </span>
      {chain != null && (
        <span
          className="absolute -bottom-0.5 -right-0.5 z-10 flex size-5 overflow-hidden rounded-full border-0 border-background bg-muted ring-1 ring-border/50"
          aria-hidden
        >
          {chainIcon ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={chainIcon} alt="" width={20} height={20} className="size-5 object-cover" />
          ) : (
            <span className="flex size-5 items-center justify-center text-[10px] font-medium text-muted-foreground">
              {chainInitials}
            </span>
          )}
        </span>
      )}
    </span>
  );
}

export function TransferSelectModal({
  open,
  onOpenChange,
  onSelect,
  excludeSymbol,
  chains,
  tokens,
}: TransferSelectModalProps) {
  const dispatch = useAppDispatch();
  const usedTokensEntries = useAppSelector((s) => s.usedTokens.entries);
  const deferredUsedEntries = useDeferredValue(usedTokensEntries);

  const [activeTab, setActiveTab] = useState<TabId>("tokens");
  const [search, setSearch] = useState("");
  const [selectedChainId, setSelectedChainId] = useState<string | null>(null);

  const [dragOffset, setDragOffset] = useState(0);
  const dragStartY = useRef(0);
  const dragCaptureRef = useRef<HTMLElement | null>(null);

  const handleDragStart = useCallback((e: React.PointerEvent) => {
    dragStartY.current = e.clientY;
    setDragOffset(0);
    const el = e.currentTarget as HTMLElement;
    el.setPointerCapture(e.pointerId);
    dragCaptureRef.current = el;
  }, []);

  const handleDragMove = useCallback((e: React.PointerEvent) => {
    if (e.buttons !== 1 && e.pointerType === "mouse") return;
    const dy = e.clientY - dragStartY.current;
    // Only allow dragging downward
    setDragOffset(dy > 0 ? dy : 0);
  }, []);

  const handleDragEnd = useCallback((e: React.PointerEvent) => {
    const el = dragCaptureRef.current;
    if (el) {
      try { el.releasePointerCapture(e.pointerId); } catch {}
      dragCaptureRef.current = null;
    }
    setDragOffset((prev) => {
      if (prev > DRAG_CLOSE_THRESHOLD_PX) onOpenChange(false);
      return 0;
    });
  }, [onOpenChange]);

  const getChainById = (chainId: string) => getChainByIdFromList(chains, chainId) ?? getStaticChainById(chainId);

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
      list = list.filter((t) => t.symbol.toLowerCase().includes(q) || t.name.toLowerCase().includes(q));
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
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "z-[var(--z-modal)] flex flex-col p-0 bg-transparent border-none shadow-none focus:outline-none !duration-300 min-h-0 overflow-hidden",
          BOTTOM_SHEET_MOBILE_CLASSES,
          DESKTOP_MODAL_CLASSES,
          MODAL_MAX_HEIGHT_CLASS
        )}
      >
        <div
          className="flex min-h-0 flex-1 flex-col overflow-hidden bg-card border border-border shadow-2xl rounded-t-2xl sm:rounded-2xl"
          style={{
            // Apply drag offset here so it doesn't fight Tailwind positioning
            transform: dragOffset > 0 ? `translateY(${dragOffset}px)` : "translateY(0px)",
            transition: dragOffset === 0 ? "transform 250ms ease-out" : "none",
          }}
        >
          {/* Draggable zone: handle + header (mobile bottom sheet) */}
          <div
            className="sm:hidden flex shrink-0 cursor-grab active:cursor-grabbing select-none flex-col touch-none bg-transparent"
            style={{ touchAction: "none" }}
            onPointerDown={handleDragStart}
            onPointerMove={handleDragMove}
            onPointerUp={handleDragEnd}
            onPointerCancel={handleDragEnd}
            role="presentation"
          >
            <div className="flex shrink-0 justify-center pt-3 pb-1" aria-hidden>
              <span className="h-1 w-12 shrink-0 rounded-full bg-muted-foreground/30" />
            </div>
            <DialogHeader className="flex shrink-0 flex-row items-center justify-between space-y-0 border-b border-border px-4 py-3">
              <DialogTitle className="text-lg font-semibold text-card-foreground">Select token</DialogTitle>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-primary/90"
              >
                <X className="size-5" />
              </button>
            </DialogHeader>
          </div>

          {/* Desktop: non-draggable header (no handle) */}
          <DialogHeader className="hidden shrink-0 flex-row items-center justify-between space-y-0 border-b border-border px-4 py-3 sm:flex">
            <DialogTitle className="text-lg font-semibold text-card-foreground">Select token</DialogTitle>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-primary/90"
            >
              <X className="size-5" />
            </button>
          </DialogHeader>

          <nav className="flex shrink-0 gap-1 border-b border-border px-4 py-2" aria-label="Sections">
            {TAB_IDS.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-medium capitalize transition-colors",
                  activeTab === tab ? "text-primary" : "text-muted-foreground hover:text-card-foreground"
                )}
              >
                {tab === "offramp" ? "Offramp" : tab === "activities" ? "Activities" : "Tokens"}
              </button>
            ))}
          </nav>

          {/* Tab content: min/max height keeps sheet height consistent when switching tabs. */}
          <div className={cn("flex flex-1 flex-col overflow-hidden", TAB_CONTENT_MIN_H, TAB_CONTENT_MAX_H)}>
          {activeTab === "tokens" && (
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
              <div className="shrink-0 px-4 pt-3 pb-2">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                  <Input
                    type="text"
                    placeholder="Search token or paste address"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="border-none pl-9 rounded-xl shadow-none"
                  />
                </div>
              </div>

              <section className="shrink-0 px-4 pb-2" aria-label="Chains">
                <ul className="flex flex-wrap gap-2">
                  {suggestedChainIds.map((chainId) => {
                    const chain = getChainById(chainId);
                    if (chain == null) return null;
                    const isActive = selectedChainId === chain.id;
                    return (
                      <li key={chain.id}>
                        <button
                          type="button"
                          onClick={() => setSelectedChainId(isActive ? null : chain.id)}
                          className={cn(
                            "flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                            isActive ? "bg-primary text-primary-foreground" : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-card-foreground"
                          )}
                        >
                          {chain.iconURI ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img src={chain.iconURI} alt="" width={18} height={18} className="size-[18px] shrink-0 rounded-full object-cover" />
                          ) : null}
                          <span>{chain.shortName ?? chain.name}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>

              <section className="min-h-0 flex-1 overflow-y-auto px-2 pb-4" aria-label="Token list">
                {filteredTokens.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">No tokens found</p>
                ) : (
                  <ul className="space-y-0">
                    {filteredTokens.slice(0, INITIAL_TOKEN_LIST_SIZE).map((token) => {
                      const chain = getChainById(token.chainId);
                      return (
                        <li key={token.id}>
                          <button
                            type="button"
                            onClick={() => handleSelectToken(token)}
                            className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-muted/40"
                          >
                            <TokenIconWithChainBadge token={token} chain={chain ?? undefined} />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-medium text-primary">{token.name}</span>
                              <span className="flex items-center gap-1.5 truncate text-xs text-muted-foreground">
                                <span className="truncate">{chain?.shortName ?? chain?.name ?? token.chainId}</span>
                              </span>
                            </span>
                            <span className="modal-balance tabular-nums text-sm font-semibold text-primary">0.00 {token.symbol}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>
            </div>
          )}

          {activeTab === "offramp" && (
            <section className="min-h-0 flex-1 overflow-y-auto px-4 py-6">
              <p className="text-sm text-muted-foreground">Offramp options: Mobile money (Momo), banks, and other payout methods will appear here.</p>
            </section>
          )}

          {activeTab === "activities" && (
            <section className="min-h-0 flex-1 overflow-y-auto px-4 py-6">
              <p className="text-sm text-muted-foreground">Recent transfer and swap activity will appear here.</p>
            </section>
          )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}