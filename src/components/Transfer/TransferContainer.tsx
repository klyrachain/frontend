"use client";

import { useState, useMemo, useDeferredValue } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Settings, ArrowRight, ChevronDown } from "lucide-react";
import { TransferSelectModal } from "./TransferSelectModal";
import type { TokenSelection } from "../Exchange/TokenChainSelectModal";
import type { Chain, Token } from "@/types/token";
import Image from "next/image";
import { useAppSelector } from "@/store/hooks";
import { useGetChainsQuery, useGetTokensQuery } from "@/store/api/squidApi";
import { CHAINS, TOKENS, getChainById as getStaticChainById } from "@/config/chainsAndTokens";
import { useTransferQuote } from "@/hooks/useTransferQuote";
import { cn } from "@/lib/utils";
import { SuggestedTokensRow } from "./SuggestedTokensRow";

const PRICE_PREVIEW_DEFAULT = "≈ $0.00";

function getChainByIdFromList(chains: Chain[], chainId: string): Chain | undefined {
  return chains.find((c) => c.id === chainId);
}

function SwapRow({
  label,
  amount,
  onAmountChange,
  tokenSymbol,
  chainName,
  onTokenClick,
  pricePreview,
}: {
  label: string;
  amount: string;
  onAmountChange: (v: string) => void;
  tokenSymbol: string;
  chainName?: string;
  onTokenClick: () => void;
  pricePreview: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-muted/10 p-4">
      <p className="mb-2 text-xs text-muted-foreground">{label}</p>
      <div className="flex items-center justify-between gap-2 text-black">
        <Input
          type="text"
          inputMode="decimal"
          placeholder="0"
          value={amount}
          onChange={(e) => onAmountChange(e.target.value)}
          className="input-text h-12 max-w-full border-0 shadow-none text-[var(--text-3xl-size)] font-medium focus-visible:ring-0"
        />

      </div>
      {pricePreview != null && (
        <p className="mt-2 text-sm text-muted-foreground">{pricePreview}</p>
      )}
    </div>
  );
}

function TokenSelectorButton({
  token,
  chainShortName,
  onClick,
}: {
  token: Token | null;
  chainShortName?: string;
  onClick: () => void;
}) {
  const symbol = token?.symbol ?? "Select";
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={onClick}
      className="shrink-0 gap-1.5 rounded-xl border-white/10 bg-white/5 px-3 py-2 hover:bg-white/10"
    >
      {token?.logoURI != null && token.logoURI !== "" ? (
        <span className="relative flex size-6 shrink-0 overflow-hidden rounded-full bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element -- external token logo URLs from API */}
          <img
            src={token.logoURI}
            alt=""
            width={24}
            height={24}
            className="size-6 object-cover"
          />
        </span>
      ) : (
        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
          {symbol.slice(0, 2)}
        </span>
      )}
      <span className="font-medium">{symbol}</span>
      {chainShortName != null && (
        <span className="text-xs text-muted-foreground">({chainShortName})</span>
      )}
      <ChevronDown className="size-4 text-muted-foreground" />
    </Button>
  );
}

function SelectMode({
  label,
  selection,
  onSelectClick,
  pricePreview,
  suggestions,
  onSuggestedSelect,
  excludeSymbol,
  side,
}: {
  label: string;
  amount: string;
  onAmountChange: (v: string) => void;
  selection: TokenSelection | null;
  onSelectClick: () => void;
  pricePreview: string;
  suggestions: TokenSelection[];
  onSuggestedSelect: (s: TokenSelection) => void;
  excludeSymbol?: string;
  side: "left" | "right";
}) {
  return (
    <div className="flex flex-col gap-2 w-full">
     <SuggestedTokensRow
        suggestions={suggestions}
        onSelect={onSuggestedSelect}
        excludeSymbol={excludeSymbol}
        side={side}
      />
  
    <div className="flex min-w-0 flex-1 flex-col gap-2 rounded-xl border border-border bg-muted/30 p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
     
      <button
        type="button"
        className="flex cursor-pointer items-center justify-between gap-2 text-left"
        onClick={onSelectClick}
        aria-label={selection ? `${selection.token.symbol} on ${selection.chain.name} – change token` : "Select token"}
      >
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {selection ? (
            <>
              {selection.token.logoURI ? (
                <Image
                  src={selection.token.logoURI}
                  alt=""
                  width={34}
                  height={34}
                  className="size-8 shrink-0 rounded-full object-cover"
                />
              ) : (
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                  {selection.token.symbol.slice(0, 2)}
                </span>
              )}
              <span className="min-w-0 truncate font-medium text-primary">{selection.token.name}</span>
              <span className="shrink-0 text-xs text-primary">{selection.chain.name}</span>
            </>
          ) : (
            <span className="text-muted-foreground">Select token</span>
          )}
        </div>
      </button>
      {pricePreview != null && pricePreview !== PRICE_PREVIEW_DEFAULT && (
        <p className="text-xs text-muted-foreground">{pricePreview}</p>
      )}
    </div>
    </div>
  );
}

export function TransferContainer() {
  const [leftAmount, setLeftAmount] = useState("");
  const [rightAmount, setRightAmount] = useState("");
  const [leftSelection, setLeftSelection] = useState<TokenSelection | null>(
    null
  );
  const [rightSelection, setRightSelection] = useState<TokenSelection | null>(
    null
  );
  const [selectModalOpen, setSelectModalOpen] = useState(false);
  const [selectingSide, setSelectingSide] = useState<"left" | "right">("left");

  const usedEntries = useAppSelector((s) => s.usedTokens.entries);
  const deferredUsedEntries = useDeferredValue(usedEntries);
  const { data: apiChains = [], isSuccess: chainsSuccess } = useGetChainsQuery();
  const { data: apiTokens = [], isSuccess: tokensSuccess } = useGetTokensQuery();
  const chains = chainsSuccess && apiChains.length > 0 ? apiChains : CHAINS;
  const tokens = tokensSuccess && apiTokens.length > 0 ? apiTokens : TOKENS;

  const suggestedSelections = useMemo(() => {
    const out: TokenSelection[] = [];
    for (const e of deferredUsedEntries) {
      const chain = getChainByIdFromList(chains, e.chainId) ?? getStaticChainById(e.chainId);
      const token = tokens.find((t) => t.id === e.tokenId);
      if (chain && token) out.push({ chain, token });
    }
    return out;
  }, [deferredUsedEntries, chains, tokens]);

  const { outputAmount, isLoading: quoteLoading, error: quoteError } = useTransferQuote({
    fromSelection: leftSelection,
    toSelection: rightSelection,
    inputAmount: leftAmount,
  });

  const toPricePreview = useMemo(() => {
    if (quoteError) return quoteError;
    if (quoteLoading && leftAmount.trim() !== "" && leftSelection && rightSelection)
      return "Getting quote…";
    if (outputAmount != null && rightSelection)
      return `≈ ${outputAmount} ${rightSelection.token.symbol}`;
    return PRICE_PREVIEW_DEFAULT;
  }, [outputAmount, rightSelection, quoteLoading, quoteError, leftAmount, leftSelection]);

  const handleSettings = () => {
    // TODO: open settings panel or modal
  };

  const openSelectModal = (side: "left" | "right") => {
    setSelectingSide(side);
    setSelectModalOpen(true);
  };

  const handleSelect = (selection: TokenSelection) => {
    if (selectingSide === "left") {
      setLeftSelection(selection);
    } else {
      setRightSelection(selection);
    }
    setSelectModalOpen(false);
  };

  return (
    <div className="flex flex-col duration-300 ease-out relative w-full items-center justify-center">
      <article className="glass-card overflow-hidden p-2 shadow-xl shrink-0 min-w-0 transition-all duration-300 ease-out h-fit">
        <header className="mb-6 flex flex-row items-center justify-between pl-2">
          <h3 className="text-xl text-primary font-semibold">Transfer</h3>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleSettings}
            className="rounded-full cursor-pointer"
            aria-label="Settings"
          >
            <Settings className="size-5" />
          </Button>
        </header>

        <section className="flex flex-col gap-4">
          <div className="flex items-stretch gap-2 relative">
            <SelectMode
              label="From"
              amount={leftAmount}
              onAmountChange={setLeftAmount}
              selection={leftSelection}
              onSelectClick={() => openSelectModal("left")}
              pricePreview={PRICE_PREVIEW_DEFAULT}
              suggestions={suggestedSelections}
              onSuggestedSelect={setLeftSelection}
              excludeSymbol={rightSelection?.token.symbol}
              side="left"
            />
            <div className="flex justify-center -my-1 absolute z-10 left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2">
              <button
                type="button"
                className="rounded-full border-2 border-card bg-card p-2 shadow-md hover:bg-muted transition-colors"
                aria-label="Swap direction"
              >
                <ArrowRight className="size-5 text-muted-foreground" />
              </button>
            </div>

            <SelectMode
              label="To"
              amount={rightAmount}
              onAmountChange={setRightAmount}
              selection={rightSelection}
              onSelectClick={() => openSelectModal("right")}
              pricePreview={toPricePreview}
              suggestions={suggestedSelections}
              onSuggestedSelect={setRightSelection}
              excludeSymbol={leftSelection?.token.symbol}
              side="right"
            />
          </div>

          <SwapRow
            label="You send"
            amount={leftAmount}
            onAmountChange={setLeftAmount}
            tokenSymbol={leftSelection?.token.symbol ?? ""}
            chainName={leftSelection?.chain.name ?? ""}
            onTokenClick={() => openSelectModal("left")}
            pricePreview={
              outputAmount != null && rightSelection
                ? `You get ≈ ${outputAmount} ${rightSelection.token.symbol}`
                : quoteLoading && leftAmount.trim() !== "" && leftSelection && rightSelection
                  ? "Getting quote…"
                  : quoteError ?? PRICE_PREVIEW_DEFAULT
            }
          />

          <Button
            size="lg"
            className="w-full rounded-xl py-6 text-base font-semibold bg-black"
          >
            Confirm
          </Button>
        </section>
      </article>

      <TransferSelectModal
        open={selectModalOpen}
        onOpenChange={setSelectModalOpen}
        onSelect={handleSelect}
        excludeSymbol={
          selectingSide === "left"
            ? rightSelection?.token.symbol
            : leftSelection?.token.symbol
        }
        chains={chains}
        tokens={tokens}
      />
    </div>
  );
}
