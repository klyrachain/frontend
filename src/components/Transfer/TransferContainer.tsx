"use client";

import { useState, useMemo, useDeferredValue, useEffect } from "react";
import Link from "next/link";
import { usePrimaryEvmWallet } from "@/hooks/use-primary-evm-wallet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, ArrowRight, Wallet } from "lucide-react";
import { TransferSelectModal } from "./TransferSelectModal";
import type { TokenSelection } from "../Exchange/TokenChainSelectModal";
import { useAppSelector } from "@/store/hooks";
import { useGetChainsQuery, useGetTokensQuery } from "@/store/api/squidApi";
import { CHAINS, TOKENS } from "@/config/chainsAndTokens";
import { useTransferQuote } from "@/hooks/useTransferQuote";
import { TransferTokenColumn, AmountField } from "@/components/flows";
import { buildSuggestedTokenSelections } from "@/lib/flowTokens";
import {
  getReceiveAccountSpec,
  isValidReceiveAddress,
} from "@/lib/receiveAccountByChain";
import { cn } from "@/lib/utils";
import { FlowsWalletHeaderAction } from "@/app/(flows)/FlowsWalletHeaderAction";
import {
  FLOW_FIELD_SHELL,
  FLOW_FIELD_LABEL,
} from "@/components/flows/flow-field-classes";
import {
  getTransferConfirmButtonIntent,
  transferConfirmButtonText,
} from "@/lib/transferConfirmButtonLabel";

const PRICE_PREVIEW_DEFAULT = "≈ $0.00";

function shortAddr(a: string): string {
  const t = a.trim();
  if (t.length <= 14) return t;
  return `${t.slice(0, 6)}…${t.slice(-4)}`;
}

export function TransferContainer() {
  const { address: evmAddress, isConnected } = usePrimaryEvmWallet();
  const [leftAmount, setLeftAmount] = useState("");
  const [leftSelection, setLeftSelection] = useState<TokenSelection | null>(null);
  const [rightSelection, setRightSelection] = useState<TokenSelection | null>(null);
  const [selectModalOpen, setSelectModalOpen] = useState(false);
  const [selectingSide, setSelectingSide] = useState<"left" | "right">("left");
  const [receiverAddress, setReceiverAddress] = useState("");
  const [recipientError, setRecipientError] = useState(false);
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

  useEffect(() => {
    setReceiverAddress("");
    setRecipientError(false);
  }, [rightSelection?.chain.id, rightSelection?.token.symbol]);

  const trimmedReceiver = receiverAddress.trim();
  const receiverValid =
    receiveSpec != null &&
    trimmedReceiver !== "" &&
    isValidReceiveAddress(trimmedReceiver, receiveSpec.format);

  const confirmIntent = useMemo(
    () =>
      getTransferConfirmButtonIntent({
        left: leftSelection,
        right: rightSelection,
        trimmedReceiver,
        connectedEvmAddress: evmAddress,
        receiveFormat: receiveSpec?.format ?? null,
        receiverValid,
      }),
    [
      leftSelection,
      rightSelection,
      trimmedReceiver,
      evmAddress,
      receiveSpec?.format,
      receiverValid,
    ]
  );
  const confirmButtonLabel = transferConfirmButtonText(confirmIntent);

  const handleUseConnectedWallet = () => {
    if (!receiveSpec || receiveSpec.format !== "evm") return;
    const addr = evmAddress?.trim();
    if (!addr) return;
    setReceiverAddress(addr);
    setRecipientError(false);
  };

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

  const deliveryLine =
    trimmedReceiver !== "" &&
    receiveSpec &&
    isValidReceiveAddress(trimmedReceiver, receiveSpec.format)
      ? ` · Estimated delivery to ${shortAddr(trimmedReceiver)}`
      : "";

  const handleConfirm = async () => {
    if (!leftSelection || !rightSelection || !outputAmount || intentLoading) {
      return;
    }
    if (!receiveSpec || !receiverValid) {
      setRecipientError(true);
      return;
    }
    setRecipientError(false);
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
          receiver_address: trimmedReceiver,
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
        `Order ${tid.slice(0, 8)}… created.
        Send tokens to pool ${pool.slice(0, 10)}… then confirm in your wallet flow (offramp confirm).`
      );
    } catch {
      setIntentMessage("Network error. Try again.");
    } finally {
      setIntentLoading(false);
    }
  };

  return (
    <div className="relative mx-auto flex w-full max-w-xl flex-col self-stretch duration-300 ease-out">
      <article className="glass-card h-fit w-full shrink-0 overflow-hidden p-2 shadow-xl transition-all duration-300 ease-out min-w-0">
        <header className="mb-6 flex flex-row items-center justify-between gap-2 pl-2">
          <h3 className="text-xl font-semibold text-card-foreground">Transfer</h3>
          <div className="flex shrink-0 items-center gap-2">
            <FlowsWalletHeaderAction />
            <div className="relative shrink-0">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setSettingsOpen((o) => !o)}
                className="cursor-pointer rounded-full border-border bg-card text-card-foreground shadow-sm hover:bg-muted"
                aria-label="Settings"
                aria-expanded={settingsOpen}
              >
                <Settings className="size-5" aria-hidden />
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
                    className="absolute right-0 top-full z-50 mt-1 min-w-44 rounded-lg border border-border bg-popover p-1 text-sm shadow-md"
                    role="menu"
                  >
                    <p className="px-2 py-1.5 text-xs text-card-foreground/70">Preferences</p>
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
            <div className="absolute left-1/2 top-1/2 z-10 -my-1 flex -translate-x-1/2 justify-center">
              <button
                type="button"
                className="rounded-full border-2 border-card bg-green-950/90 p-[0.45rem] shadow-md transition-colors"
                aria-label="Swap direction"
              >
                <ArrowRight className="size-[1.1875rem] shrink-0 text-foreground" />
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
            footer={`${sendRowFooter}
            `}
            // ${deliveryLine}
            ariaLabel="Amount you send"
            variant="transfer"
          />

          {rightSelection && receiveSpec ? (
            <div className={FLOW_FIELD_SHELL}>
              <Label className={FLOW_FIELD_LABEL}>Receiver</Label>
              <div className="flex flex-row gap-2">
                <Input
                  value={receiverAddress}
                  onChange={(e) => {
                    setReceiverAddress(e.target.value);
                    if (recipientError) setRecipientError(false);
                  }}
                  placeholder={receiveSpec.inputPlaceholder}
                  aria-invalid={recipientError && !receiverValid}
                  className={cn(
                    // FLOW_INPUT_MONO,
                    "sm:min-w-0 sm:flex-1 input-text shadow-none outline-none border-none active:ring-0 focus:ring-0 focus-visible:ring-0 focus-visible:ring-ring/50 ",
                    ((recipientError && !receiverValid) ||
                      (trimmedReceiver !== "" &&
                        !isValidReceiveAddress(trimmedReceiver, receiveSpec.format))) &&
                      "ring-2 ring-destructive/60"
                  )}
                  autoComplete="off"
                />
                {receiveSpec.format === "evm" ? (
                  <Button
                    type="button"
                    variant="default"
                    // size="sm"
                    className="shrink-0 whitespace-nowrap"
                    onClick={handleUseConnectedWallet}
                    disabled={!isConnected || !evmAddress}
                  >
                    <Wallet className="size-5" />
                  </Button>
                ) : null}
              </div>
              {recipientError ? (
                <p className="text-sm text-destructive" role="alert">
                  {trimmedReceiver === ""
                    ? "Provide a recipient address to confirm this transfer."
                    : "Enter a valid address for this network."}
                </p>
              ) : receiveSpec.helperText ? (
                <p className="text-xs text-card-foreground/70">{receiveSpec.helperText}</p>
              ) : null}
            </div>
          ) : null}

          {intentMessage ? (
            <p className="rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-xs text-card-foreground/75">
              {intentMessage}
            </p>
          ) : null}

          <Button
            size="lg"
            className="w-full rounded-xl py-6 text-base font-semibold"
            disabled={intentLoading || !leftSelection || !rightSelection || !outputAmount}
            onClick={() => void handleConfirm()}
          >
            {intentLoading ? "Creating…" : confirmButtonLabel}
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
