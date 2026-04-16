"use client";

import { useState, useMemo, useDeferredValue, useEffect } from "react";
import Link from "next/link";
import { useAccount } from "wagmi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, ArrowRight, ChevronDown, ChevronUp } from "lucide-react";
import { TransferSelectModal } from "./TransferSelectModal";
import type { TokenSelection } from "../Exchange/TokenChainSelectModal";
import { useAppSelector } from "@/store/hooks";
import { useGetChainsQuery, useGetTokensQuery } from "@/store/api/squidApi";
import { CHAINS, TOKENS } from "@/config/chainsAndTokens";
import { useTransferQuote } from "@/hooks/useTransferQuote";
import { TransferTokenColumn, AmountField } from "@/components/flows";
import { buildSuggestedTokenSelections } from "@/lib/flowTokens";
import { DynamicConnectTrigger } from "@/components/DynamicWallet/DynamicConnectTrigger";
import {
  getReceiveAccountSpec,
  isValidReceiveAddress,
} from "@/lib/receiveAccountByChain";
import { cn } from "@/lib/utils";

const PRICE_PREVIEW_DEFAULT = "≈ $0.00";

function shortAddr(a: string): string {
  const t = a.trim();
  if (t.length <= 14) return t;
  return `${t.slice(0, 6)}…${t.slice(-4)}`;
}

export function TransferContainer() {
  const { address: evmAddress, isConnected } = useAccount();
  const [leftAmount, setLeftAmount] = useState("");
  const [leftSelection, setLeftSelection] = useState<TokenSelection | null>(null);
  const [rightSelection, setRightSelection] = useState<TokenSelection | null>(null);
  const [selectModalOpen, setSelectModalOpen] = useState(false);
  const [selectingSide, setSelectingSide] = useState<"left" | "right">("left");
  const [receiverOpen, setReceiverOpen] = useState(true);
  const [receiverUseCustom, setReceiverUseCustom] = useState(false);
  const [customReceiverAddress, setCustomReceiverAddress] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [intentLoading, setIntentLoading] = useState(false);
  const [intentMessage, setIntentMessage] = useState<string | null>(null);

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

  const receiveSpec = useMemo(() => {
    if (!rightSelection) return null;
    return getReceiveAccountSpec(
      String(rightSelection.chain.id),
      rightSelection.chain.name
    );
  }, [rightSelection]);

  const defaultReceiverAddress = useMemo(() => {
    if (!receiveSpec || receiveSpec.format !== "evm") return "";
    if (isConnected && evmAddress) return evmAddress;
    return "";
  }, [receiveSpec, isConnected, evmAddress]);

  useEffect(() => {
    if (!receiverUseCustom) {
      setCustomReceiverAddress("");
    }
  }, [receiverUseCustom]);

  const effectiveReceiverAddress = receiverUseCustom
    ? customReceiverAddress.trim()
    : defaultReceiverAddress;

  const receiverReady =
    receiveSpec != null &&
    effectiveReceiverAddress !== "" &&
    isValidReceiveAddress(effectiveReceiverAddress, receiveSpec.format);

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

  const receiverSummary =
    rightSelection && receiveSpec && effectiveReceiverAddress
      ? `Estimated delivery to ${shortAddr(effectiveReceiverAddress)}`
      : rightSelection && receiveSpec && !effectiveReceiverAddress
        ? "Connect a wallet or enter a receiver address below."
        : null;

  const handleConfirm = async () => {
    if (
      !leftSelection ||
      !rightSelection ||
      !outputAmount ||
      !receiverReady ||
      intentLoading
    ) {
      return;
    }
    setIntentMessage(null);
    setIntentLoading(true);
    try {
      const res = await fetch("/api/core/app-transfer/intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          f_chain_slug: String(leftSelection.chain.id),
          f_token: leftSelection.token.symbol,
          f_amount: leftAmount.trim(),
          t_chain_slug: String(rightSelection.chain.id),
          t_token: rightSelection.token.symbol,
          t_amount: outputAmount,
          receiver_address: effectiveReceiverAddress.trim(),
        }),
      });
      const json: unknown = await res.json().catch(() => ({}));
      const data =
        json && typeof json === "object" && "data" in json
          ? (json as { data?: { transaction_id?: string; calldata?: { toAddress?: string } } }).data
          : null;
      const err =
        json && typeof json === "object" && "error" in json
          ? String((json as { error?: string }).error ?? "")
          : "";
      if (!res.ok) {
        setIntentMessage(err || "Could not create transfer. Check BACKEND_API_URL and Morapay API / Core configuration.");
        return;
      }
      const tid = data?.transaction_id ?? "";
      const pool = data?.calldata?.toAddress ?? "";
      setIntentMessage(
        `Order ${tid.slice(0, 8)}… created. Send tokens to pool ${pool.slice(0, 10)}… then confirm in your wallet flow (offramp confirm).`
      );
    } catch {
      setIntentMessage("Network error. Try again.");
    } finally {
      setIntentLoading(false);
    }
  };

  return (
    <div className="flex flex-col duration-300 ease-out relative w-full items-center justify-center">
      <article className="glass-card overflow-hidden p-2 shadow-xl shrink-0 min-w-0 transition-all duration-300 ease-out h-fit">
        <header className="mb-6 flex flex-row items-center justify-between gap-2 pl-2">
          <h3 className="text-xl text-primary font-semibold">Transfer</h3>
          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <DynamicConnectTrigger
              variant="outline"
              size="sm"
              className="rounded-full px-3 text-xs sm:text-sm"
              label={isConnected ? "Wallet" : "Connect"}
            />
            <div className="relative">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setSettingsOpen((o) => !o)}
                className="cursor-pointer rounded-full"
                aria-label="Settings"
                aria-expanded={settingsOpen}
              >
                <Settings className="size-5" />
              </Button>
              {settingsOpen ? (
                <>
                  <button
                    type="button"
                    className="fixed inset-0 z-40 cursor-default"
                    aria-label="Close menu"
                    onClick={() => setSettingsOpen(false)}
                  />
                  <div
                    className="absolute right-0 top-full z-50 mt-1 min-w-[11rem] rounded-lg border border-border bg-popover p-1 text-sm shadow-md"
                    role="menu"
                  >
                    <p className="px-2 py-1.5 text-xs text-muted-foreground">Preferences</p>
                    <button
                      type="button"
                      className="w-full rounded-md px-2 py-1.5 text-left text-muted-foreground hover:bg-muted"
                      disabled
                    >
                      Slippage (soon)
                    </button>
                    <Link
                      href="/"
                      className="block rounded-md px-2 py-1.5 hover:bg-muted"
                      onClick={() => setSettingsOpen(false)}
                    >
                      Home
                    </Link>
                  </div>
                </>
              ) : null}
            </div>
          </div>
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
            footer={
              receiverSummary ? `${sendRowFooter} · ${receiverSummary}` : sendRowFooter
            }
            ariaLabel="Amount you send"
            variant="transfer"
          />

          {rightSelection && receiveSpec ? (
            <div className="rounded-xl border border-border/60 bg-muted/20 px-3 py-2">
              <button
                type="button"
                onClick={() => setReceiverOpen((o) => !o)}
                className="flex w-full items-center justify-between gap-2 text-left"
              >
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Receiver
                </span>
                {receiverOpen ? (
                  <ChevronUp className="size-4 shrink-0 text-muted-foreground" />
                ) : (
                  <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
                )}
              </button>
              {receiverOpen ? (
                <div className="mt-3 space-y-3">
                  {!receiverUseCustom && receiveSpec.format === "evm" ? (
                    <p className="text-xs text-muted-foreground">
                      {defaultReceiverAddress
                        ? `Using your connected wallet: ${shortAddr(defaultReceiverAddress)}`
                        : "Connect your wallet to use your address as the receiver."}
                    </p>
                  ) : null}
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="transfer-custom-receiver"
                      checked={receiverUseCustom}
                      onChange={(e) => setReceiverUseCustom(e.target.checked)}
                      className="rounded border-input"
                    />
                    <Label htmlFor="transfer-custom-receiver" className="text-sm font-normal">
                      Send to a different address
                    </Label>
                  </div>
                  {receiverUseCustom || receiveSpec.format !== "evm" ? (
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">
                        {receiveSpec.addressLabel}
                      </Label>
                      <Input
                        value={customReceiverAddress}
                        onChange={(e) => setCustomReceiverAddress(e.target.value)}
                        placeholder={receiveSpec.inputPlaceholder}
                        className={cn(
                          "font-mono text-sm",
                          receiverUseCustom &&
                            customReceiverAddress.trim() !== "" &&
                            !isValidReceiveAddress(customReceiverAddress, receiveSpec.format) &&
                            "border-destructive"
                        )}
                        autoComplete="off"
                      />
                      {receiveSpec.helperText ? (
                        <p className="text-xs text-muted-foreground">{receiveSpec.helperText}</p>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}

          {intentMessage ? (
            <p className="rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-xs text-muted-foreground">
              {intentMessage}
            </p>
          ) : null}

          <Button
            size="lg"
            className="w-full rounded-xl py-6 text-base font-semibold bg-black"
            disabled={
              intentLoading ||
              !leftSelection ||
              !rightSelection ||
              !outputAmount ||
              !receiverReady ||
              (receiverUseCustom &&
                (!customReceiverAddress.trim() ||
                  !isValidReceiveAddress(customReceiverAddress, receiveSpec?.format ?? "evm")))
            }
            onClick={() => void handleConfirm()}
          >
            {intentLoading ? "Creating…" : "Confirm"}
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
