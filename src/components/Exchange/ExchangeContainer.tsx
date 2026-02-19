"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Settings, ArrowDown, ChevronDown } from "lucide-react";
import { TokenChainSelectModal } from "./TokenChainSelectModal";
import type { TokenSelection } from "./TokenChainSelectModal";

const PRICE_PREVIEW = "≈ $0.00";

function TokenSelectorButton({
  symbol,
  chainName,
  onClick,
}: {
  symbol: string;
  chainName?: string;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={onClick}
      className="shrink-0 gap-1.5 rounded-xl border-white/10 bg-white/5 px-3 py-2 hover:bg-white/10"
    >
      <span className="font-medium">{symbol}</span>
      {chainName != null && (
        <span className="text-xs text-muted-foreground">({chainName})</span>
      )}
      <ChevronDown className="size-4 text-muted-foreground" />
    </Button>
  );
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
      <div className="flex items-center justify-between gap-2">
        <Input
          type="text"
          inputMode="decimal"
          placeholder="0"
          value={amount}
          onChange={(e) => onAmountChange(e.target.value)}
          className="input-text h-12 max-w-full border-0 bg-transparent text-[var(--text-3xl-size)] font-medium placeholder:text-muted-foreground focus-visible:ring-0"
        />
        <TokenSelectorButton
          symbol={tokenSymbol}
          chainName={chainName}
          onClick={onTokenClick}
        />
      </div>
      {pricePreview != null && (
        <p className="mt-2 text-sm text-muted-foreground">{pricePreview}</p>
      )}
    </div>
  );
}

export function ExchangeContainer() {
  const [sellAmount, setSellAmount] = useState("");
  const [buyAmount, setBuyAmount] = useState("");
  const [sellToken, setSellToken] = useState({ symbol: "ETH", chainName: "Ethereum" });
  const [buyToken, setBuyToken] = useState({ symbol: "USDC", chainName: "Ethereum" });
  const [tokenModalOpen, setTokenModalOpen] = useState(false);
  const [selectingFor, setSelectingFor] = useState<"sell" | "buy">("sell");

  const handleSettings = () => {
    // TODO: open settings panel or modal
  };

  const openTokenModal = (side: "sell" | "buy") => {
    setSelectingFor(side);
    setTokenModalOpen(true);
  };

  const handleTokenSelect = (selection: TokenSelection) => {
    if (selectingFor === "sell") {
      setSellToken({ symbol: selection.token.symbol, chainName: selection.chain.name });
    } else {
      setBuyToken({ symbol: selection.token.symbol, chainName: selection.chain.name });
    }
  };

  return (
    <article className="glass-card tab-modal overflow-hidden p-2 shadow-xl">
      <header className="mb-6 flex flex-row items-center justify-between pl-2">
        <h3 className="text-xl font-semibold">Swap</h3>
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

      <section className="flex flex-col gap-2 relative">
        <SwapRow
          label="Sell"
          amount={sellAmount}
          onAmountChange={setSellAmount}
          tokenSymbol={sellToken.symbol}
          chainName={sellToken.chainName}
          onTokenClick={() => openTokenModal("sell")}
          pricePreview={PRICE_PREVIEW}
        />

        <div className="flex justify-center -my-1 absolute z-10 left-1/2 -translate-x-1/2 top-[calc(45%-10px)] -translate-y-1/2">
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
          tokenSymbol={buyToken.symbol}
          chainName={buyToken.chainName}
          onTokenClick={() => openTokenModal("buy")}
          pricePreview={PRICE_PREVIEW}
        />

        <Button
          size="lg"
          className="mt-2 w-full rounded-xl py-6 text-base font-semibold"
        >
          Confirm
        </Button>
      </section>

      <TokenChainSelectModal
        open={tokenModalOpen}
        onOpenChange={setTokenModalOpen}
        onSelect={handleTokenSelect}
        excludeSymbol={selectingFor === "sell" ? buyToken.symbol : sellToken.symbol}
      />
    </article>
  );
}
