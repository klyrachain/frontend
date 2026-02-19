"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Settings, ArrowRight, ChevronDown, ArrowDown } from "lucide-react";
import { TransferSelectModal } from "./TransferSelectModal";
import type { TokenSelection } from "../Exchange/TokenChainSelectModal";
import type { Token } from "@/types/token";
import Image from "next/image";
const PRICE_PREVIEW = "≈ $0.00";


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
  amount,
  onAmountChange,
  selection,
  onSelectClick,
  pricePreview,
}: {
  label: string;
  amount: string;
  onAmountChange: (v: string) => void;
  selection: TokenSelection | null;
  onSelectClick: () => void;
  pricePreview: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-muted/30 p-4 min-w-0 flex-1 cursor-pointer " onClick={onSelectClick}>
      <p className="mb-2 text-xs text-muted-foreground">{label}</p>
      <div className="flex items-center justify-between gap-2">
        {/* <TokenSelectorButton
          token={selection?.token ?? null}
          chainShortName={
            selection?.chain.shortName ?? selection?.chain.name ?? undefined
          }
          onClick={onSelectClick}
        /> */}
        <div className="flex items-center justify-between gap-2" >
          <Image src="/images/tokens/eth.png" alt="ETH" width={24} height={24} />
          <span className="font-medium">ETH</span>
          <span className="text-xs text-muted-foreground">(Ethereum)</span>

        </div>
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
    <article className="glass-card tab-modal overflow-hidden p-2 shadow-xl">
      <header className="mb-6 flex flex-row items-center justify-between pl-2">
        <h3 className="text-xl font-semibold">Transfer</h3>
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
            pricePreview={PRICE_PREVIEW}
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
            pricePreview={PRICE_PREVIEW}
          />
        </div>
        <SwapRow
          label="Buy"
          amount={rightAmount}
          onAmountChange={setRightAmount}
          tokenSymbol={rightSelection?.token.symbol ?? ""}
          chainName={rightSelection?.chain.name ?? ""}
          onTokenClick={() => openSelectModal("right")}
          pricePreview={PRICE_PREVIEW}
        />

        <Button
          size="lg"
          className="w-full rounded-xl py-6 text-base font-semibold"
        >
          Confirm
        </Button>
      </section>

      <TransferSelectModal
        open={selectModalOpen}
        onOpenChange={setSelectModalOpen}
        onSelect={handleSelect}
        excludeSymbol={
          selectingSide === "left"
            ? rightSelection?.token.symbol
            : leftSelection?.token.symbol
        }
      />
    </article>
  );
}
