"use client";

import { useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setExchangeModalOpen } from "@/store/slices/navigationSlice";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Settings, ArrowDown, ChevronDown } from "lucide-react";
import { useGetChainsQuery, useGetTokensQuery } from "@/store/api/squidApi";
import { TokenChainSelectModal, type TokenSelection } from "./TokenChainSelectModal";
import type { Token } from "@/types/token";
import { TokenAvatarWithFallback } from "@/components/Token/TokenAvatarWithFallback";

const PRICE_PREVIEW = "≈ $0.00";

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
      {token != null ? (
        <span className="relative flex size-6 shrink-0 overflow-hidden rounded-full bg-muted">
          <TokenAvatarWithFallback
            logoURI={token.logoURI}
            symbol={token.symbol}
            chainId={token.chainId}
            width={24}
            height={24}
            className="size-6"
            alt=""
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

function SwapRow({
  label,
  amount,
  onAmountChange,
  selection,
  onTokenClick,
  pricePreview,
}: {
  label: string;
  amount: string;
  onAmountChange: (v: string) => void;
  selection: TokenSelection | null;
  onTokenClick: () => void;
  pricePreview: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-muted/30 p-4">
      <p className="mb-2 text-xs text-muted-foreground">{label}</p>
      <div className="flex items-center justify-between gap-2">
        <Input
          type="text"
          inputMode="decimal"
          placeholder="0"
          value={amount}
          onChange={(e) => onAmountChange(e.target.value)}
          className="h-12 max-w-[60%] border-0 bg-transparent text-2xl font-medium placeholder:text-muted-foreground focus-visible:ring-0"
        />
        <TokenSelectorButton
          token={selection?.token ?? null}
          chainShortName={selection?.chain.shortName ?? selection?.chain.name}
          onClick={onTokenClick}
        />
      </div>
      {pricePreview != null && (
        <p className="mt-2 text-sm text-muted-foreground">{pricePreview}</p>
      )}
    </div>
  );
}

export function ExchangeModal() {
  const dispatch = useAppDispatch();
  const open = useAppSelector((s) => s.navigation.exchangeModalOpen);
  const [sellAmount, setSellAmount] = useState("");
  const [buyAmount, setBuyAmount] = useState("");
  const [sellSelection, setSellSelection] = useState<TokenSelection | null>(null);
  const [buySelection, setBuySelection] = useState<TokenSelection | null>(null);
  const [tokenSelectFor, setTokenSelectFor] = useState<"sell" | "buy" | null>(null);

  useGetChainsQuery(undefined, { skip: !open });
  useGetTokensQuery(undefined, { skip: !open });

  const handleOpenChange = (next: boolean) => {
    dispatch(setExchangeModalOpen(next));
  };

  const handleSettings = () => {
    // TODO: open settings panel or modal
  };

  const handleTokenSelect = (selection: TokenSelection) => {
    if (tokenSelectFor === "sell") setSellSelection(selection);
    else if (tokenSelectFor === "buy") setBuySelection(selection);
    setTokenSelectFor(null);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent
          contentAnimation="gsap-pop"
          className="glass-card border-border/50 p-0 overflow-hidden sm:max-w-md"
        >
          <DialogHeader className="flex flex-row items-center justify-between space-y-0 border-b border-border px-6 py-4">
            <DialogTitle className="text-xl font-semibold">Swap</DialogTitle>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleSettings}
              className="rounded-full"
              aria-label="Settings"
            >
              <Settings className="size-5" />
            </Button>
          </DialogHeader>

          <section className="flex flex-col gap-2 p-6">
            <SwapRow
              label="Sell"
              amount={sellAmount}
              onAmountChange={setSellAmount}
              selection={sellSelection}
              onTokenClick={() => setTokenSelectFor("sell")}
              pricePreview={PRICE_PREVIEW}
            />

            <div className="flex justify-center -my-1 relative z-10">
              <button
                type="button"
                className="rounded-full border-2 border-card bg-card p-2 shadow-md hover:bg-muted transition-colors"
                aria-label="Swap direction"
              >
                <ArrowDown className="size-5 text-muted-foreground" />
              </button>
            </div>

            <SwapRow
              label="Buy"
              amount={buyAmount}
              onAmountChange={setBuyAmount}
              selection={buySelection}
              onTokenClick={() => setTokenSelectFor("buy")}
              pricePreview={PRICE_PREVIEW}
            />

            <Button
              size="lg"
              className="mt-2 w-full rounded-xl py-6 text-base font-semibold"
            >
              Confirm
            </Button>
          </section>
        </DialogContent>
      </Dialog>

      <TokenChainSelectModal
        open={tokenSelectFor !== null}
        onOpenChange={(next) => !next && setTokenSelectFor(null)}
        onSelect={handleTokenSelect}
        excludeSymbol={
          tokenSelectFor === "sell"
            ? buySelection?.token.symbol
            : tokenSelectFor === "buy"
              ? sellSelection?.token.symbol
              : undefined
        }
      />
    </>
  );
}
