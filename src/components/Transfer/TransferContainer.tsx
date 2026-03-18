"use client";

import { useState, useMemo, useDeferredValue } from "react";
import { Button } from "@/components/ui/button";
import { Settings, ArrowRight } from "lucide-react";
import { TransferSelectModal } from "./TransferSelectModal";
import type { TokenSelection } from "../Exchange/TokenChainSelectModal";
import { useAppSelector } from "@/store/hooks";
import { useGetChainsQuery, useGetTokensQuery } from "@/store/api/squidApi";
import { CHAINS, TOKENS } from "@/config/chainsAndTokens";
import { useTransferQuote } from "@/hooks/useTransferQuote";
import { TransferTokenColumn, AmountField } from "@/components/flows";
import { buildSuggestedTokenSelections } from "@/lib/flowTokens";

const PRICE_PREVIEW_DEFAULT = "≈ $0.00";

export function TransferContainer() {
  const [leftAmount, setLeftAmount] = useState("");
  const [leftSelection, setLeftSelection] = useState<TokenSelection | null>(null);
  const [rightSelection, setRightSelection] = useState<TokenSelection | null>(null);
  const [selectModalOpen, setSelectModalOpen] = useState(false);
  const [selectingSide, setSelectingSide] = useState<"left" | "right">("left");

  const usedEntries = useAppSelector((s) => s.usedTokens.entries);
  const deferredUsedEntries = useDeferredValue(usedEntries);
  const { data: apiChains = [], isSuccess: chainsSuccess } = useGetChainsQuery();
  const { data: apiTokens = [], isSuccess: tokensSuccess } = useGetTokensQuery();
  const chains = chainsSuccess && apiChains.length > 0 ? apiChains : CHAINS;
  const tokens = tokensSuccess && apiTokens.length > 0 ? apiTokens : TOKENS;

  const suggestedSelections = useMemo(
    () => buildSuggestedTokenSelections(deferredUsedEntries, chains, tokens),
    [deferredUsedEntries, chains, tokens]
  );

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

  const sendRowFooter =
    outputAmount != null && rightSelection
      ? `You get ≈ ${outputAmount} ${rightSelection.token.symbol}`
      : quoteLoading && leftAmount.trim() !== "" && leftSelection && rightSelection
        ? "Getting quote…"
        : quoteError ?? PRICE_PREVIEW_DEFAULT;

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
            className="cursor-pointer rounded-full"
            aria-label="Settings"
          >
            <Settings className="size-5" />
          </Button>
        </header>

        <section className="flex flex-col gap-4">
          <div className="relative flex items-stretch gap-2">
            <TransferTokenColumn
              label="From"
              selection={leftSelection}
              onSelectClick={() => openSelectModal("left")}
              suggestions={suggestedSelections}
              onSuggestedSelect={setLeftSelection}
              excludeSymbol={rightSelection?.token.symbol}
              side="left"
              pricePreview={PRICE_PREVIEW_DEFAULT}
              hideFooterWhenPreviewIs={PRICE_PREVIEW_DEFAULT}
            />
            <div className="absolute left-1/2 top-1/2 z-10 -my-1 flex -translate-x-1/2 -translate-y-1/2 justify-center">
              <button
                type="button"
                className="rounded-full border-2 border-card bg-card p-2 shadow-md transition-colors hover:bg-muted"
                aria-label="Swap direction"
              >
                <ArrowRight className="size-5 text-muted-foreground" />
              </button>
            </div>

            <TransferTokenColumn
              label="To"
              selection={rightSelection}
              onSelectClick={() => openSelectModal("right")}
              suggestions={suggestedSelections}
              onSuggestedSelect={setRightSelection}
              excludeSymbol={leftSelection?.token.symbol}
              side="right"
              pricePreview={toPricePreview}
            />
          </div>

          <AmountField
            label="You send"
            amount={leftAmount}
            onAmountChange={setLeftAmount}
            footer={sendRowFooter}
            ariaLabel="Amount you send"
            variant="transfer"
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
