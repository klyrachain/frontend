"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { parseUnits, type Address } from "viem";
import { useSwitchChain, useWriteContract } from "wagmi";
import { usePrimaryEvmWallet } from "@/hooks/use-primary-evm-wallet";
import { Button } from "@/components/ui/button";
import type { CheckoutContinuePayload } from "@/components/checkout/CheckoutTokenQuoteRows";
import type { PublicCommercePaymentLink } from "@/types/checkout-public.types";
import { isNonEvmCheckoutChainId } from "@/lib/checkout-chain-family";
import { DynamicConnectTrigger } from "@/components/DynamicWallet/DynamicConnectTrigger";
import type { PaymentInstruction } from "@/types/payment-instruction";
import {
  isEvmErc20TransferInstruction,
  normalizeToEvmInstruction,
} from "@/types/payment-instruction";

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
};

export function CommerceCheckoutWalletPay({
  commerce,
  payload,
  onClose,
}: CommerceCheckoutWalletPayProps) {
  const { address, isConnected, chainId } = usePrimaryEvmWallet();
  const { switchChainAsync } = useSwitchChain();
  const { writeContractAsync, isPending: isSending } = useWriteContract();

  const [intentLoading, setIntentLoading] = useState(false);
  const [intentError, setIntentError] = useState<string | null>(null);
  const [intentResult, setIntentResult] = useState<IntentSuccess | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

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
    if (!address?.startsWith("0x") || address.length !== 42) {
      setIntentError("Connect an EVM wallet to continue.");
      return;
    }
    if (!tAmountForIntent || Number.parseFloat(tAmountForIntent) <= 0) {
      setIntentError("Invalid invoice amount for this link.");
      return;
    }
    setIntentLoading(true);
    try {
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
    commerce.id,
    cryptoAmount,
    evmChainId,
    isTokenFlow,
    nonEvm,
    row,
    tAmountForIntent,
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

  if (!isTokenFlow || chargeUpper === "CRYPTO") {
    return (
      <section
        className="mt-4 space-y-3 rounded-lg border border-primary/25 bg-primary/5 p-4 text-left text-sm"
        aria-label="Continue payment"
      >
        <p className="font-medium text-card-foreground">Continue on Transfer</p>
        <p className="text-muted-foreground">
          {chargeUpper === "CRYPTO" && isTokenFlow
            ? "Crypto-denominated checkout uses card or mobile money from this page, or complete from the Transfer app. Wallet checkout here is only wired for fiat-denominated invoices (USD, EUR, …)."
            : "This checkout option is completed from the Morapay Transfer page (fund wallet, split pay, or onramp). Business checkout stays here; you are not sent to the empty Pay page."}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm" variant="secondary">
            <Link href="/app">Open Transfer</Link>
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={onClose}>
            Back to quotes
          </Button>
        </div>
      </section>
    );
  }

  if (nonEvm) {
    return (
      <section
        className="mt-4 space-y-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-left text-sm"
        role="alert"
      >
        <p className="font-medium">Non-EVM token selected</p>
        <p className="text-muted-foreground">
          Wallet signing for this network is not available in checkout yet. Choose an
          EVM token above or use Transfer from the home app.
        </p>
        <Button type="button" size="sm" variant="outline" onClick={onClose}>
          Back to quotes
        </Button>
      </section>
    );
  }

  return (
    <section
      className="mt-4 space-y-3 rounded-lg border border-primary/25 bg-primary/5 p-4 text-left text-sm"
      aria-label="Wallet payment"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-medium text-card-foreground">Pay with your wallet</p>
        <DynamicConnectTrigger
          variant="outline"
          size="sm"
          className="rounded-full text-xs tabular-nums"
          label={
            isConnected && address
              ? `${address.slice(0, 6)}…${address.slice(-4)}`
              : "Connect"
          }
        />
      </div>
      <p className="text-muted-foreground">
        Send{" "}
        <span className="font-medium text-card-foreground">
          {cryptoAmount || "—"} {cryptoSymbol}
        </span>{" "}
        for {commerce.amount} {commerce.currency}. This creates a linked order and pool
        transfer on-chain.
      </p>
      {!intentResult ? (
        <Button
          type="button"
          size="lg"
          className="w-full rounded-xl py-6 text-base font-semibold"
          disabled={intentLoading || !cryptoAmount}
          onClick={() => void createIntent()}
        >
          {intentLoading ? "Confirming…" : "Confirm Payment"}
        </Button>
      ) : !isEvmErc20TransferInstruction(intentResult.calldata) ? (
        <div className="space-y-2 rounded-md border border-amber-500/25 bg-amber-500/10 p-3 text-xs text-muted-foreground">
          <p className="font-medium text-card-foreground">Instruction prepared (non-EVM)</p>
          <p>
            Kind:{" "}
            <span className="font-mono text-card-foreground">
              {(intentResult.calldata as { kind?: string }).kind ?? "unknown"}
            </span>
            . Sign in wallet from this screen is only wired for{" "}
            <span className="font-medium text-card-foreground">evm_erc20_transfer</span>. Use the
            Morapay Transfer app or your wallet for this chain, then confirm with your
            operator flow if needed.
          </p>
          {intentResult.next_step ? (
            <p className="text-[11px] leading-snug">{intentResult.next_step}</p>
          ) : null}
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            Order{" "}
            <span className="font-mono text-card-foreground">
              {intentResult.transaction_id.slice(0, 8)}…
            </span>
          </p>
          <Button
            type="button"
            size="lg"
            className="w-full rounded-xl py-6 text-base font-semibold"
            disabled={isSending || !isConnected}
            onClick={() => void sendToPool()}
          >
            {isSending ? "Confirm in wallet…" : "Sign & send to pool"}
          </Button>
          {txHash ? (
            <p className="text-xs text-primary">
              Submitted: <span className="font-mono break-all">{txHash}</span>
            </p>
          ) : null}
        </div>
      )}
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
      <p className="text-[0.7rem] leading-snug text-muted-foreground">
        After the transfer confirms, complete settlement using your operator flow (e.g.
        offramp confirm) if required.
      </p>
      <Button type="button" size="sm" variant="ghost" className="px-0" onClick={onClose}>
        Back to quotes
      </Button>
    </section>
  );
}
