"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { parseUnits, type Address } from "viem";
import { useSwitchChain, useWriteContract } from "wagmi";
import { usePrimaryEvmWallet } from "@/hooks/use-primary-evm-wallet";
import { Button } from "@/components/ui/button";
import type { CheckoutContinuePayload } from "@/components/checkout/CheckoutTokenQuoteRows";
import type { PublicCommercePaymentLink } from "@/types/checkout-public.types";
import { isNonEvmCheckoutChainId } from "@/lib/checkout-chain-family";
import type { PaymentInstruction } from "@/types/payment-instruction";
import {
  isEvmErc20TransferInstruction,
  normalizeToEvmInstruction,
} from "@/types/payment-instruction";

function evmChainShortLabel(chainId: number): string {
  const m: Record<number, string> = {
    1: "Ethereum",
    8453: "Base",
    42161: "Arbitrum",
    10: "Optimism",
    137: "Polygon",
    56: "BNB Chain",
  };
  return m[chainId] ?? `chain ${chainId}`;
}

const erc20TransferAbi = [
  {
    type: "function",
    name: "transfer",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "value", type: "uint256" },
    ],
    outputs: [{ type: "bool" }],
  },
] as const;

type IntentSuccess = {
  transaction_id: string;
  calldata: PaymentInstruction;
  next_step?: string;
};

export type CommerceCheckoutWalletPayProps = {
  commerce: Pick<
    PublicCommercePaymentLink,
    "id" | "amount" | "currency" | "chargeKind"
  >;
  payload: CheckoutContinuePayload;
  onClose: () => void;
  /**
   * When true (default), fetches transfer intent as soon as this block mounts so the user only
   * confirms rates once (quotes page) then taps Approve when calldata is ready.
   */
  autoPrepareIntent?: boolean;
  /** Tighter layout when rendered under token quotes on the same card. */
  embedded?: boolean;
};

export function CommerceCheckoutWalletPay({
  commerce,
  payload,
  onClose,
  autoPrepareIntent = true,
  embedded = false,
}: CommerceCheckoutWalletPayProps) {
  const { address, isConnected, chainId } = usePrimaryEvmWallet();
  const { switchChainAsync } = useSwitchChain();
  const { writeContractAsync, isPending: isSending } = useWriteContract();

  const [intentLoading, setIntentLoading] = useState(false);
  const [intentError, setIntentError] = useState<string | null>(null);
  const [intentResult, setIntentResult] = useState<IntentSuccess | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  /** One automatic prepare per mount (parent should remount with `key` when the payer retries from quotes). */
  const didAutoPrepareRef = useRef(false);

  const row = payload.selectedRow;
  const quoteState = row ? payload.quotes[row.id] : undefined;
  const cryptoAmount = quoteState?.cryptoAmount?.trim() ?? "";
  const cryptoSymbol = quoteState?.cryptoSymbol?.trim() ?? row?.iconSymbol ?? "";

  const isTokenFlow = payload.flow === "token" && row != null;
  const chargeUpper = (commerce.chargeKind ?? "FIAT").toUpperCase();
  const evmChainId = useMemo(() => {
    if (!row?.balanceChainId) return null;
    const n = Number.parseInt(row.balanceChainId, 10);
    return Number.isNaN(n) ? null : n;
  }, [row?.balanceChainId]);

  const nonEvm =
    row?.balanceChainId && isNonEvmCheckoutChainId(row.balanceChainId);

  const tAmountForIntent = (commerce.amount ?? "").trim();

  const createIntent = useCallback(async () => {
    setIntentError(null);
    setIntentResult(null);
    setSendError(null);
    setTxHash(null);
    if (!isTokenFlow || !row || !evmChainId || nonEvm) {
      setIntentError("This payment path needs the Transfer app.");
      return;
    }
    if (!cryptoAmount || Number.parseFloat(cryptoAmount) <= 0) {
      setIntentError("Quote is not ready. Wait for amounts or pick another token.");
      return;
    }
    if (!isConnected || !address?.startsWith("0x") || address.length !== 42) {
      setIntentError("Connect an EVM wallet (e.g. MetaMask) on the same network as this token.");
      return;
    }
    if (!tAmountForIntent || Number.parseFloat(tAmountForIntent) <= 0) {
      setIntentError("Invalid invoice amount for this link.");
      return;
    }
    setIntentLoading(true);
    try {
      if (chainId != null && chainId !== evmChainId) {
        if (!switchChainAsync) {
          setIntentError(
            `Switch your wallet to ${evmChainShortLabel(evmChainId)} — this token pays on that network only.`
          );
          return;
        }
        try {
          await switchChainAsync({ chainId: evmChainId });
        } catch {
          setIntentError(
            `Could not switch networks. Open your wallet and select ${evmChainShortLabel(evmChainId)}, then try again.`
          );
          return;
        }
      }

      const res = await fetch("/api/core/app-transfer/intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          f_chain_slug: String(evmChainId),
          f_token: row.iconSymbol.trim().toUpperCase(),
          f_amount: cryptoAmount,
          t_chain_slug: "8453",
          t_token: "USDC",
          t_amount: tAmountForIntent,
          receiver_address: address.trim(),
          payment_link_id: commerce.id,
        }),
      });
      const json: unknown = await res.json().catch(() => ({}));
      const err =
        json && typeof json === "object" && "error" in json
          ? String((json as { error?: string }).error ?? "")
          : "";
      if (!res.ok) {
        setIntentError(err || "Could not prepare payment.");
        return;
      }
      const data =
        json &&
        typeof json === "object" &&
        "success" in json &&
        (json as { success?: boolean }).success === true &&
        "data" in json
          ? ((json as { data: IntentSuccess }).data ?? null)
          : null;
      if (!data?.transaction_id || !data.calldata) {
        setIntentError("Invalid response from payment service.");
        return;
      }
      if (isEvmErc20TransferInstruction(data.calldata)) {
        const evm = normalizeToEvmInstruction(data.calldata);
        if (!evm?.toAddress || !evm.tokenAddress) {
          setIntentError("Invalid response from payment service.");
          return;
        }
      }
      setIntentResult(data);
    } catch {
      setIntentError("Network error. Try again.");
    } finally {
      setIntentLoading(false);
    }
  }, [
    address,
    chainId,
    commerce.id,
    cryptoAmount,
    evmChainId,
    isConnected,
    isTokenFlow,
    nonEvm,
    row,
    switchChainAsync,
    tAmountForIntent,
  ]);

  useEffect(() => {
    if (!autoPrepareIntent) return;
    if (didAutoPrepareRef.current) return;
    if (intentResult) return;
    if (!isTokenFlow || !row || !evmChainId || nonEvm) return;
    if (!cryptoAmount || Number.parseFloat(cryptoAmount) <= 0) return;
    if (!isConnected || !address?.startsWith("0x") || address.length !== 42) return;
    didAutoPrepareRef.current = true;
    void createIntent();
  }, [
    address,
    autoPrepareIntent,
    createIntent,
    cryptoAmount,
    evmChainId,
    intentResult,
    isConnected,
    isTokenFlow,
    nonEvm,
    row,
  ]);

  const sendToPool = useCallback(async () => {
    setSendError(null);
    if (!intentResult?.calldata || !address) return;
    const cd = normalizeToEvmInstruction(intentResult.calldata);
    if (!cd) {
      setSendError("Wallet signing in checkout is only available for EVM ERC-20 instructions.");
      return;
    }
    const targetChain = cd.chainId;
    if (chainId != null && chainId !== targetChain && switchChainAsync) {
      try {
        await switchChainAsync({ chainId: targetChain });
      } catch {
        setSendError("Switch network in your wallet, then try again.");
        return;
      }
    }
    try {
      const value = parseUnits(cd.amount, cd.decimals);
      const hash = await writeContractAsync({
        address: cd.tokenAddress as Address,
        abi: erc20TransferAbi,
        functionName: "transfer",
        args: [cd.toAddress as Address, value],
        chainId: targetChain,
      });
      setTxHash(hash);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Transaction failed.";
      setSendError(msg);
    }
  }, [address, chainId, intentResult, switchChainAsync, writeContractAsync]);

  const primaryButton = useMemo(() => {
    if (!isTokenFlow || chargeUpper === "CRYPTO") return null;
    if (nonEvm) return null;
    if (txHash) {
      return (
        <p className="text-center text-sm font-medium text-primary" role="status">
          Payment submitted. Your wallet broadcast this transaction.
        </p>
      );
    }
    if (!intentResult) {
      return (
        <Button
          type="button"
          size="lg"
          className="w-full rounded-xl py-6 text-base font-semibold"
          disabled={intentLoading || !cryptoAmount || !isConnected}
          onClick={() => void createIntent()}
        >
          {intentLoading ? "Preparing…" : "Pay"}
        </Button>
      );
    }
    if (!isEvmErc20TransferInstruction(intentResult.calldata)) {
      return (
        <div className="space-y-2 rounded-md border border-amber-500/25 bg-amber-500/10 p-3 text-xs text-muted-foreground">
          <p className="font-medium text-card-foreground">Instruction prepared (non-EVM)</p>
          <p>
            Kind:{" "}
            <span className="font-mono text-card-foreground">
              {(intentResult.calldata as { kind?: string }).kind ?? "unknown"}
            </span>
            . Sign in wallet from this screen is only wired for{" "}
            <span className="font-medium text-card-foreground">evm_erc20_transfer</span>. Use the
            Morapay Transfer app or your wallet for this chain, then confirm with your operator flow
            if needed.
          </p>
          {intentResult.next_step ? (
            <p className="text-[11px] leading-snug">{intentResult.next_step}</p>
          ) : null}
        </div>
      );
    }
    return (
      <Button
        type="button"
        size="lg"
        className="w-full rounded-xl py-6 text-base font-semibold"
        disabled={isSending || !isConnected}
        onClick={() => void sendToPool()}
      >
        {isSending ? "Confirm in wallet…" : "Approve"}
      </Button>
    );
  }, [
    chargeUpper,
    createIntent,
    cryptoAmount,
    intentLoading,
    intentResult,
    isConnected,
    isSending,
    isTokenFlow,
    nonEvm,
    sendToPool,
    txHash,
  ]);

  if (!isTokenFlow || chargeUpper === "CRYPTO") {
    return (
      <section
        className={embedded ? "mt-3 space-y-2" : "mt-4 space-y-3"}
        aria-label="Continue payment"
      >
        <div
          className={
            embedded
              ? "space-y-2 rounded-lg border border-primary/25 bg-primary/5 p-3 text-left text-sm"
              : "space-y-3 rounded-lg border border-primary/25 bg-primary/5 p-4 text-left text-sm"
          }
        >
          <p className="font-medium text-card-foreground">Continue on Transfer</p>
          <p className="text-muted-foreground">
            {chargeUpper === "CRYPTO" && isTokenFlow
              ? "Crypto-denominated checkout uses card or mobile money from this page, or complete from the Transfer app. Wallet checkout here is only wired for fiat-denominated invoices (USD, EUR, …)."
              : "This checkout option is completed from the Morapay Transfer page (fund wallet, split pay, or onramp)."}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm" variant="secondary">
              <Link href="/app">Open Transfer</Link>
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
      </section>
    );
  }

  if (nonEvm) {
    return (
      <section
        className={embedded ? "mt-3" : "mt-4"}
        role="alert"
        aria-label="Non-EVM token"
      >
        <div className="space-y-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-left text-sm">
          <p className="font-medium">Non-EVM token selected</p>
          <p className="text-muted-foreground">
            Wallet signing for this network is not available in checkout yet. Choose an EVM token
            above or use Transfer from the home app.
          </p>
          <Button type="button" size="sm" variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section
      className={embedded ? "mt-3 space-y-3" : "mt-4 space-y-4"}
      aria-label="Wallet payment"
    >
      <div
        className={
          embedded
            ? "space-y-3 rounded-lg border border-primary/25 bg-primary/5 p-3 text-left text-sm"
            : "space-y-4 rounded-lg border border-primary/25 bg-primary/5 p-4 text-left text-sm"
        }
      >
        {!embedded ? (
          <div className="flex flex-wrap items-center justify-center gap-2">
            <p className="font-medium text-card-foreground">Pay with your wallet</p>
          </div>
        ) : null}
        {!embedded ? (
          <p className="text-muted-foreground text-center">
            Send{" "}
            <span className="font-medium text-card-foreground">
              {cryptoAmount || "—"} {cryptoSymbol}
            </span>{" "}
            for {commerce.amount} {commerce.currency}.
          </p>
        ) : (
          <p className="text-center text-xs text-muted-foreground">
            {intentLoading && !intentResult ? (
              <span className="font-medium text-card-foreground">Preparing payment...</span>
            ) : intentResult && isEvmErc20TransferInstruction(intentResult.calldata) && !txHash ? (
              <span>Approve the transfer in your wallet.</span>
            ) : null}
          </p>
        )}
        {evmChainId != null &&
        isConnected &&
        chainId != null &&
        chainId !== evmChainId &&
        !intentResult &&
        !intentLoading ? (
          <p
            className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-center text-xs text-amber-950 dark:text-amber-100"
            role="status"
          >
            Your wallet is on {evmChainShortLabel(chainId)}; this payment uses{" "}
            {evmChainShortLabel(evmChainId)}. <span className="font-medium">Pay</span> will switch
            networks first, then prepare the transaction.
          </p>
        ) : null}
        {primaryButton}
        {txHash ? (
          <p className="text-center text-xs text-primary">
            <span className="font-mono break-all">{txHash}</span>
          </p>
        ) : null}
        {intentError ? (
          <p className="text-xs text-destructive" role="alert">
            {intentError}
          </p>
        ) : null}
        {sendError ? (
          <p className="text-xs text-destructive" role="alert">
            {sendError}
          </p>
        ) : null}
        {!embedded ? (
          <p className="text-[0.7rem] leading-snug text-muted-foreground text-center">
            Complete settlement using your operator.
          </p>
        ) : null}
        <div className="flex justify-center">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="px-0 text-muted-foreground"
            onClick={onClose}
            disabled={intentLoading || isSending}
          >
            {txHash ? "Close" : "Cancel"}
          </Button>
        </div>
      </div>
    </section>
  );
}
