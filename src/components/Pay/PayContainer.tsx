"use client";

import { useState, useMemo, useDeferredValue, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { parseUnits, type Address } from "viem";
import { useSwitchChain, useWriteContract, usePublicClient } from "wagmi";
import { ArrowLeftRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TransferSelectModal } from "@/components/Transfer/TransferSelectModal";
import {
  TokenSelectField,
  AmountField,
  ContactIdentifierField,
} from "@/components/flows";
import { chainSlugToCore } from "@/lib/core-chain-slug";
import type { TokenSelection } from "@/components/Exchange/TokenChainSelectModal";
import { useAppSelector } from "@/store/hooks";
import { useGetChainsQuery, useGetTokensQuery } from "@/store/api/squidApi";
import { CHAINS, TOKENS } from "@/config/chainsAndTokens";
import { buildSuggestedTokenSelections } from "@/lib/flowTokens";
import {
  getReceiveAccountSpec,
  isValidReceiveAddress,
} from "@/lib/receiveAccountByChain";
import { parseTokenAddressFromSquidId } from "@/lib/checkout-display-rows";
import { isNativeTokenAddress, NATIVE_TOKEN_SEND_BLOCKED } from "@/lib/native-token";
import { useClientMounted } from "@/hooks/use-client-mounted";
import type { PublicCommercePaymentLink } from "@/types/checkout-public.types";
import { FlowsWalletHeaderAction } from "@/app/(flows)/FlowsWalletHeaderAction";
import {
  FLOW_FIELD_SHELL,
  FLOW_FIELD_LABEL,
  FLOW_INPUT_TEXT,
} from "@/components/flows/flow-field-classes";
import { cn } from "@/lib/utils";
import {
  usePayCryptoDualAmount,
  type PayAmountFieldMode,
} from "@/hooks/use-pay-crypto-dual-amount";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { usePrimaryEvmWallet } from "@/hooks/use-primary-evm-wallet";
import { getDynamicEnvironmentId } from "@/lib/dynamic/dynamic-app-config";
import type { PaymentInstruction } from "@/types/payment-instruction";
import {
  isEvmErc20TransferInstruction,
  isSolanaSplTransferInstruction,
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

const erc20DecimalsAbi = [
  {
    type: "function",
    name: "decimals",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint8" }],
  },
] as const;

/** Loose email check aligned with standalone “To” field. */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EVM_ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/i;

function isPhoneRecipient(value: string): boolean {
  const t = value.trim();
  if (!t || EMAIL_RE.test(t) || EVM_ADDRESS_RE.test(t)) return false;
  if (!/^[\d\s+()-]+$/.test(t)) return false;
  const digits = t.replace(/\D/g, "");
  return digits.length >= 10 && digits.length <= 15;
}

function guessTokenDecimals(symbol: string, chainIdStr: string): number {
  const u = symbol.toUpperCase();
  if (u === "USDC" || u === "USDT" || u === "USDC.E") return 6;
  if (chainIdStr.trim() === "101") return 9;
  return 18;
}

type AppTransferIntentSuccess = {
  transaction_id: string;
  calldata: PaymentInstruction;
  next_step?: string;
};

/** Subset of Dynamic `Wallet` used for sends (multi-chain). */
type PrimaryWalletLike = {
  address?: string;
  sync?: () => Promise<void>;
  sendBalance: (p: {
    amount: string;
    toAddress: string;
    token: { address: string; decimals: number };
  }) => Promise<string | undefined>;
};

/** Only mounts under DynamicContextProvider — avoids useDynamicContext when env is unset. */
function DynamicPrimaryWalletCapture({ onWallet }: { onWallet: (w: PrimaryWalletLike | null) => void }) {
  const env = getDynamicEnvironmentId();
  useEffect(() => {
    if (!env) onWallet(null);
  }, [env, onWallet]);
  if (!env) return null;
  return <DynamicPrimaryWalletCaptureInner onWallet={onWallet} />;
}

function DynamicPrimaryWalletCaptureInner({
  onWallet,
}: {
  onWallet: (w: PrimaryWalletLike | null) => void;
}) {
  const { primaryWallet } = useDynamicContext();
  useEffect(() => {
    onWallet((primaryWallet ?? null) as PrimaryWalletLike | null);
  }, [primaryWallet, onWallet]);
  return null;
}

const SuggestedTokensRow = dynamic(
  () =>
    import("@/components/Transfer/SuggestedTokensRow").then(
      (m) => m.SuggestedTokensRow
    ),
  { ssr: false }
);

/** Matches Core `GET /api/public/payment-links/by-id/:id` UUID validation */
const PAY_PAGE_UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type RequestByLinkSummary = {
  linkId?: string;
  transaction?: {
    t_amount?: string;
    t_token?: string;
    t_chain?: string;
    toIdentifier?: string;
  };
};

type CommercePayPageSummary = Pick<
  PublicCommercePaymentLink,
  "id" | "publicCode" | "type" | "amount" | "currency" | "businessName" | "slug"
>;

export function PayContainer() {
  const searchParams = useSearchParams();
  const primaryWalletRef = useRef<PrimaryWalletLike | null>(null);
  const onPrimaryWallet = useCallback((w: PrimaryWalletLike | null) => {
    primaryWalletRef.current = w;
  }, []);
  const { address: walletAddr, isConnected, chainId } = usePrimaryEvmWallet();
  const { switchChainAsync } = useSwitchChain();
  const { writeContractAsync, isPending: walletWritePending } = useWriteContract();
  const payPageIdRaw = searchParams.get("payPageId")?.trim() ?? "";
  const payPageId = PAY_PAGE_UUID_RE.test(payPageIdRaw) ? payPageIdRaw : "";
  const payPageIdInvalid =
    payPageIdRaw.length > 0 && !PAY_PAGE_UUID_RE.test(payPageIdRaw);
  const requestLinkId = payPageId
    ? ""
    : (searchParams.get("requestLinkId")?.trim() ?? "");
  const prefillAmount = searchParams.get("prefillAmount")?.trim() ?? "";
  const receiveMode = searchParams.get("receive") === "1";
  const urlAmount = searchParams.get("amount")?.trim() ?? "";
  const urlTo = searchParams.get("to")?.trim() ?? "";
  const payMode = (searchParams.get("mode")?.trim().toLowerCase() ?? "") as
    | ""
    | "fiat"
    | "crypto";
  const fiatCurrency = searchParams.get("currency")?.trim().toUpperCase() ?? "";

  const [sendSelection, setSendSelection] = useState<TokenSelection | null>(null);
  const [amount, setAmount] = useState("");
  const [to, setTo] = useState("");
  const [selectModalOpen, setSelectModalOpen] = useState(false);
  const [requestSummary, setRequestSummary] = useState<RequestByLinkSummary | null>(
    null
  );
  const [requestLoadErr, setRequestLoadErr] = useState<string | null>(null);
  const [commerceSummary, setCommerceSummary] =
    useState<CommercePayPageSummary | null>(null);
  const [commerceLoadErr, setCommerceLoadErr] = useState<string | null>(null);
  const [payerEmail, setPayerEmail] = useState("");
  const [sendLoading, setSendLoading] = useState(false);
  const [sendResult, setSendResult] = useState<string | null>(null);
  const [fiatCurrencyInput, setFiatCurrencyInput] = useState("GHS");
  const [payAmountFieldMode, setPayAmountFieldMode] =
    useState<PayAmountFieldMode>("token");
  const [usdAmount, setUsdAmount] = useState("");

  const amountLocked =
    commerceSummary?.type === "fixed" && commerceSummary.amount != null;

  const clientMounted = useClientMounted();
  const usedEntries = useAppSelector((s) => s.usedTokens.entries);
  const deferredUsedEntries = useDeferredValue(usedEntries);
  const entriesForSuggestions = clientMounted ? deferredUsedEntries : [];
  const { data: apiChains = [], isSuccess: chainsSuccess } = useGetChainsQuery();
  const { data: apiTokens = [], isSuccess: tokensSuccess } = useGetTokensQuery();
  const chains = useMemo(
    () => (chainsSuccess && apiChains.length > 0 ? apiChains : CHAINS),
    [apiChains, chainsSuccess]
  );
  const tokens = useMemo(
    () => (tokensSuccess && apiTokens.length > 0 ? apiTokens : TOKENS),
    [apiTokens, tokensSuccess]
  );
  const suggestedSelections = useMemo(
    () => buildSuggestedTokenSelections(entriesForSuggestions, chains, tokens),
    [entriesForSuggestions, chains, tokens]
  );

  useEffect(() => {
    if (payPageId) return;
    if (prefillAmount) setAmount(prefillAmount);
    else if (receiveMode && urlAmount) setAmount(urlAmount);
  }, [prefillAmount, payPageId, receiveMode, urlAmount]);

  useEffect(() => {
    if (receiveMode && urlTo) setTo(urlTo);
  }, [receiveMode, urlTo]);

  useEffect(() => {
    if (fiatCurrency) setFiatCurrencyInput(fiatCurrency);
  }, [fiatCurrency]);

  useEffect(() => {
    if (!payPageId) {
      setCommerceSummary(null);
      setCommerceLoadErr(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/core/public/payment-links/by-id/${encodeURIComponent(payPageId)}`,
          { cache: "no-store" }
        );
        const json: unknown = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (!res.ok) {
          setCommerceLoadErr("Could not load linked checkout.");
          setCommerceSummary(null);
          return;
        }
        const data =
          json &&
          typeof json === "object" &&
          "success" in json &&
          (json as { success?: boolean }).success === true &&
          "data" in json
            ? ((json as { data: PublicCommercePaymentLink }).data ?? null)
            : null;
        if (!data || data.linkKind !== "commerce") {
          setCommerceLoadErr("Checkout link not found.");
          setCommerceSummary(null);
          return;
        }
        setCommerceSummary({
          id: data.id,
          publicCode: data.publicCode,
          type: data.type,
          amount: data.amount,
          currency: data.currency,
          businessName: data.businessName,
          slug: data.slug,
        });
        setCommerceLoadErr(null);
      } catch {
        if (!cancelled) {
          setCommerceLoadErr("Could not load linked checkout.");
          setCommerceSummary(null);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [payPageId]);

  useEffect(() => {
    if (!commerceSummary) return;
    if (commerceSummary.type === "fixed" && commerceSummary.amount != null) {
      setAmount(commerceSummary.amount);
    } else {
      setAmount("");
    }
  }, [commerceSummary]);

  useEffect(() => {
    if (!requestLinkId) {
      setRequestSummary(null);
      setRequestLoadErr(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/core/requests/by-link/${encodeURIComponent(requestLinkId)}`,
          { cache: "no-store" }
        );
        const json: unknown = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (!res.ok) {
          setRequestLoadErr("Could not load payment request.");
          setRequestSummary(null);
          return;
        }
        const data =
          json &&
          typeof json === "object" &&
          "success" in json &&
          (json as { success?: boolean }).success === true &&
          "data" in json
            ? ((json as { data: RequestByLinkSummary }).data ?? null)
            : null;
        setRequestSummary(data);
        setRequestLoadErr(null);
      } catch {
        if (!cancelled) {
          setRequestLoadErr("Could not load payment request.");
          setRequestSummary(null);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [requestLinkId]);

  const checkoutBackCode =
    commerceSummary?.publicCode?.trim() || commerceSummary?.slug?.trim() || "";

  const standalonePay = !payPageId && !requestLinkId;
  const fiatStandalone = standalonePay && payMode === "fiat";
  const cryptoStandalone = standalonePay && payMode !== "fiat";

  const sendEvmChainId = useMemo(() => {
    if (!sendSelection) return undefined;
    const n = Number.parseInt(String(sendSelection.chain.id).trim(), 10);
    return Number.isFinite(n) && !Number.isNaN(n) ? n : undefined;
  }, [sendSelection]);

  const publicClient = usePublicClient({ chainId: sendEvmChainId });

  const recvSpecForPayerRule = sendSelection
    ? getReceiveAccountSpec(String(sendSelection.chain.id), sendSelection.chain.name)
    : null;
  const toTrimUi = to.trim();
  const isPlatformRecipientUi =
    EMAIL_RE.test(toTrimUi) || isPhoneRecipient(toTrimUi);
  const isDirectAddressUi =
    !!recvSpecForPayerRule &&
    !isPlatformRecipientUi &&
    isValidReceiveAddress(toTrimUi, recvSpecForPayerRule.format);
  const payerEmailOk = EMAIL_RE.test(payerEmail.trim()) || isDirectAddressUi;

  const handleSendRequest = useCallback(async () => {
    if (!sendSelection) return;
    setSendLoading(true);
    setSendResult(null);
    try {
      const amtStr = amount.trim();
      const amt = Number(amtStr);
      if (!Number.isFinite(amt) || amt <= 0) {
        setSendResult("Enter a valid amount.");
        return;
      }

      const recipient = to.trim();
      if (!recipient) {
        setSendResult("Enter recipient.");
        return;
      }

      if (standalonePay && !receiveMode && cryptoStandalone) {
        const recvSpec = getReceiveAccountSpec(
          String(sendSelection.chain.id),
          sendSelection.chain.name
        );
        const chainIdStr = String(sendSelection.chain.id).trim();
        const isSolanaChain = chainIdStr === "101";
        const emailTo = EMAIL_RE.test(recipient);
        const phoneTo = isPhoneRecipient(recipient);
        const addressTo =
          !emailTo && !phoneTo && isValidReceiveAddress(recipient, recvSpec.format);

        if (!emailTo && !phoneTo && !addressTo) {
          setSendResult("Invalid recipient.");
          return;
        }

        const dynamicEnv = getDynamicEnvironmentId();

        if (emailTo || phoneTo) {
          if (!EMAIL_RE.test(payerEmail.trim())) {
            setSendResult("Enter your email.");
            return;
          }

          let receiverAddressForIntent: string;
          if (isSolanaChain) {
            if (!dynamicEnv || !primaryWalletRef.current?.address) {
              setSendResult("Connect wallet.");
              return;
            }
            receiverAddressForIntent = primaryWalletRef.current.address.trim();
          } else if (recvSpec.format === "evm") {
            if (!isConnected || !EVM_ADDRESS_RE.test(walletAddr ?? "")) {
              setSendResult("Connect wallet.");
              return;
            }
            receiverAddressForIntent = walletAddr!.trim();
          } else {
            setSendResult("Unsupported network.");
            return;
          }

          if (!isSolanaChain && recvSpec.format === "evm") {
            const evmChainIdEmail = Number.parseInt(chainIdStr, 10);
            if (!Number.isFinite(evmChainIdEmail) || Number.isNaN(evmChainIdEmail)) {
              setSendResult("Invalid chain.");
              return;
            }
            if (chainId != null && chainId !== evmChainIdEmail) {
              if (!switchChainAsync) {
                setSendResult("Switch network in your wallet.");
                return;
              }
              try {
                await switchChainAsync({ chainId: evmChainIdEmail });
              } catch {
                setSendResult("Could not switch network.");
                return;
              }
            }
          }

          const intentPayload: Record<string, string> = {
            f_chain_slug: chainIdStr,
            f_token: sendSelection.token.symbol.trim(),
            f_amount: amtStr,
            t_chain_slug: chainIdStr,
            t_token: sendSelection.token.symbol.trim(),
            t_amount: amtStr,
            receiver_address: receiverAddressForIntent,
            payer_email: payerEmail.trim(),
          };
          if (emailTo) intentPayload.recipient_email = recipient;
          if (phoneTo) intentPayload.recipient_phone = recipient.replace(/\s/g, "");

          const intentRes = await fetch("/api/core/app-transfer/intent", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(intentPayload),
          });
          const intentJson: unknown = await intentRes.json().catch(() => ({}));
          const intentErr =
            intentJson && typeof intentJson === "object" && "error" in intentJson
              ? String((intentJson as { error?: string }).error ?? "")
              : "";
          if (!intentRes.ok) {
            setSendResult(intentErr || "Could not prepare send.");
            return;
          }
          const intentData =
            intentJson &&
            typeof intentJson === "object" &&
            "success" in intentJson &&
            (intentJson as { success?: boolean }).success === true &&
            "data" in intentJson
              ? ((intentJson as { data: AppTransferIntentSuccess }).data ?? null)
              : null;
          if (!intentData?.calldata || !intentData.transaction_id) {
            setSendResult("Invalid response.");
            return;
          }

          const cd = intentData.calldata;

          if (isEvmErc20TransferInstruction(cd)) {
            const evmPool = normalizeToEvmInstruction(cd);
            if (!evmPool?.toAddress || !evmPool.tokenAddress) {
              setSendResult("Invalid calldata.");
              return;
            }
            const targetChain = evmPool.chainId;
            if (chainId != null && chainId !== targetChain && switchChainAsync) {
              try {
                await switchChainAsync({ chainId: targetChain });
              } catch {
                setSendResult("Switch network in your wallet.");
                return;
              }
            }
            try {
              const value = parseUnits(evmPool.amount, evmPool.decimals);
              await writeContractAsync({
                address: evmPool.tokenAddress as Address,
                abi: erc20TransferAbi,
                functionName: "transfer",
                args: [evmPool.toAddress as Address, value],
                chainId: targetChain,
              });
              await fetch("/api/core/app-transfer/custodial-notify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ transaction_id: intentData.transaction_id }),
              });
              setSendResult("Done.");
            } catch (e) {
              const msg = e instanceof Error ? e.message : String(e);
              setSendResult(msg);
            }
            return;
          }

          if (isSolanaSplTransferInstruction(cd)) {
            if (!dynamicEnv || !primaryWalletRef.current) {
              setSendResult("Connect wallet.");
              return;
            }
            try {
              await primaryWalletRef.current.sync?.();
              await primaryWalletRef.current.sendBalance({
                amount: amtStr,
                toAddress: cd.recipientAddress,
                token: { address: cd.mint, decimals: cd.decimals },
              });
              await fetch("/api/core/app-transfer/custodial-notify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ transaction_id: intentData.transaction_id }),
              });
              setSendResult("Done.");
            } catch (e) {
              const msg = e instanceof Error ? e.message : String(e);
              setSendResult(msg);
            }
            return;
          }

          setSendResult("Unsupported.");
          return;
        }

        const tokenAddr = parseTokenAddressFromSquidId(sendSelection.token);
        if (!tokenAddr) {
          setSendResult("Pick a token from the list.");
          return;
        }
        if (isNativeTokenAddress(tokenAddr)) {
          setSendResult(NATIVE_TOKEN_SEND_BLOCKED);
          return;
        }

        if (dynamicEnv && primaryWalletRef.current) {
          try {
            await primaryWalletRef.current.sync?.();
            const dec = guessTokenDecimals(sendSelection.token.symbol, chainIdStr);
            const sig = await primaryWalletRef.current.sendBalance({
              amount: amtStr,
              toAddress: recipient,
              token: { address: tokenAddr, decimals: dec },
            });
            if (sig) setSendResult(String(sig));
            else setSendResult("Done.");
            return;
          } catch {
            /* fall through to wagmi on EVM */
          }
        }

        if (recvSpec.format !== "evm") {
          setSendResult("Connect wallet.");
          return;
        }

        const evmChainId = Number.parseInt(chainIdStr, 10);
        if (!Number.isFinite(evmChainId) || Number.isNaN(evmChainId)) {
          setSendResult("Invalid chain.");
          return;
        }

        if (!isConnected || !EVM_ADDRESS_RE.test(walletAddr ?? "")) {
          setSendResult("Connect wallet.");
          return;
        }

        if (chainId != null && chainId !== evmChainId) {
          if (!switchChainAsync) {
            setSendResult("Switch network in your wallet.");
            return;
          }
          try {
            await switchChainAsync({ chainId: evmChainId });
          } catch {
            setSendResult("Could not switch network.");
            return;
          }
        }

        if (!publicClient) {
          setSendResult("Try again.");
          return;
        }

        let decimals: number;
        try {
          const d = await publicClient.readContract({
            address: tokenAddr as Address,
            abi: erc20DecimalsAbi,
            functionName: "decimals",
          });
          decimals = typeof d === "bigint" ? Number(d) : Number(d);
        } catch {
          setSendResult("Could not read token info.");
          return;
        }

        try {
          const value = parseUnits(amtStr, decimals);
          const hash = await writeContractAsync({
            address: tokenAddr as Address,
            abi: erc20TransferAbi,
            functionName: "transfer",
            args: [recipient as Address, value],
            chainId: evmChainId,
          });
          setSendResult(String(hash));
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          setSendResult(msg);
        }
        return;
      }

      const recvSpec = getReceiveAccountSpec(
        String(sendSelection.chain.id),
        sendSelection.chain.name
      );
      if (!isValidReceiveAddress(recipient, recvSpec.format)) {
        setSendResult(`Enter a valid ${recvSpec.addressLabel} for ${sendSelection.chain.name}.`);
        return;
      }

      const tChain = chainSlugToCore(sendSelection.chain.name);
      const res = await fetch("/api/core/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payerEmail: payerEmail.trim(),
          t_amount: amt,
          t_chain: tChain,
          t_token: sendSelection.token.symbol,
          toIdentifier: to.trim(),
          receiveSummary: `${amount.trim()} ${sendSelection.token.symbol} on ${sendSelection.chain.name}`,
          f_chain: tChain,
          f_token: sendSelection.token.symbol,
          f_amount: amt,
          channels: ["EMAIL"],
          skipPaymentRequestNotification: standalonePay && !receiveMode,
        }),
      });
      const json: unknown = await res.json().catch(() => ({}));
      if (!res.ok) {
        const err =
          json && typeof json === "object" && "error" in json
            ? String((json as { error?: string }).error ?? "")
            : "";
        setSendResult(err || "Could not create payment request.");
        return;
      }
      const data =
        json &&
        typeof json === "object" &&
        "data" in json &&
        (json as { data?: { payLink?: string; claimCode?: string } }).data
          ? (json as { data: { payLink?: string; claimCode?: string } }).data
          : null;
      if (data?.payLink) {
        setSendResult(
          `Created. Pay link: ${data.payLink}${
            data.claimCode ? ` · Claim code (recipient): ${data.claimCode}` : ""
          }`
        );
      } else {
        setSendResult("Payment request created.");
      }
    } catch {
      setSendResult("Network error.");
    } finally {
      setSendLoading(false);
    }
  }, [
    amount,
    chainId,
    cryptoStandalone,
    isConnected,
    payerEmail,
    publicClient,
    receiveMode,
    sendSelection,
    standalonePay,
    switchChainAsync,
    to,
    walletAddr,
    writeContractAsync,
  ]);

  const handleSendFiatRequest = useCallback(async () => {
    const amt = Number(amount.trim());
    if (!Number.isFinite(amt) || amt <= 0) {
      setSendResult("Enter a valid amount.");
      return;
    }
    const cur = (fiatCurrencyInput || fiatCurrency || "GHS").trim().toUpperCase();
    setSendLoading(true);
    setSendResult(null);
    try {
      const res = await fetch("/api/core/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payerEmail: payerEmail.trim(),
          t_amount: amt,
          t_chain: "MOMO",
          t_token: cur,
          toIdentifier: to.trim(),
          receiveSummary: `${amount.trim()} ${cur} (fiat)`,
          channels: ["EMAIL"],
          skipPaymentRequestNotification: standalonePay && !receiveMode,
        }),
      });
      const json: unknown = await res.json().catch(() => ({}));
      if (!res.ok) {
        const err =
          json && typeof json === "object" && "error" in json
            ? String((json as { error?: string }).error ?? "")
            : "";
        setSendResult(err || "Could not create payment request.");
        return;
      }
      const data =
        json &&
        typeof json === "object" &&
        "data" in json &&
        (json as { data?: { payLink?: string; claimCode?: string } }).data
          ? (json as { data: { payLink?: string; claimCode?: string } }).data
          : null;
      if (data?.payLink) {
        setSendResult(
          `Created. Pay link: ${data.payLink}${
            data.claimCode ? ` · Claim code (recipient): ${data.claimCode}` : ""
          }`
        );
      } else {
        setSendResult("Payment request created.");
      }
    } catch {
      setSendResult("Network error.");
    } finally {
      setSendLoading(false);
    }
  }, [amount, fiatCurrencyInput, payerEmail, receiveMode, standalonePay, to]);

  const payDual = usePayCryptoDualAmount({
    selection: sendSelection,
    fieldMode: payAmountFieldMode,
    tokenAmountStr: amount,
    usdAmountStr: usdAmount,
    enabled: cryptoStandalone,
  });

  useEffect(() => {
    if (!payDual.supportsUsdDenom && payAmountFieldMode === "usd") {
      setPayAmountFieldMode("token");
    }
  }, [payDual.supportsUsdDenom, payAmountFieldMode]);

  useEffect(() => {
    setUsdAmount("");
    setPayAmountFieldMode("token");
  }, [sendSelection?.token.symbol, sendSelection?.chain.id]);

  useEffect(() => {
    if (!cryptoStandalone || !payDual.supportsUsdDenom) return;
    if (payAmountFieldMode !== "usd") return;
    if (payDual.suggestedTokenAmount) {
      setAmount(payDual.suggestedTokenAmount);
    }
  }, [
    cryptoStandalone,
    payAmountFieldMode,
    payDual.supportsUsdDenom,
    payDual.suggestedTokenAmount,
  ]);

  const onRotatePayAmount = useCallback(() => {
    if (!sendSelection || !payDual.supportsUsdDenom || amountLocked) return;
    if (payAmountFieldMode === "token") {
      if (payDual.oppositeNumberUsd != null && Number.isFinite(payDual.oppositeNumberUsd)) {
        setUsdAmount(
          payDual.oppositeNumberUsd >= 10_000
            ? String(Math.round(payDual.oppositeNumberUsd))
            : payDual.oppositeNumberUsd.toFixed(2)
        );
      } else {
        setUsdAmount("");
      }
      setPayAmountFieldMode("usd");
    } else {
      setPayAmountFieldMode("token");
    }
  }, [
    sendSelection,
    payDual.supportsUsdDenom,
    payDual.oppositeNumberUsd,
    payAmountFieldMode,
    amountLocked,
  ]);

  return (
    <div className="relative mx-auto flex w-full max-w-xl flex-col self-stretch duration-300 ease-out">
      <DynamicPrimaryWalletCapture onWallet={onPrimaryWallet} />
      {payPageIdInvalid ? (
        <p
          className="mb-4 w-full max-w-md rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          Invalid checkout reference. Open Pay from your checkout link again.
        </p>
      ) : null}
      {payPageId ? (
        <section
          className="mb-4 w-full rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm"
          role="region"
          aria-label="Linked checkout"
        >
          {commerceLoadErr ? (
            <p className="text-destructive">{commerceLoadErr}</p>
          ) : null}
          {commerceSummary ? (
            <>
              <p className="font-medium">You are paying a checkout link</p>
              <p className="mt-2 text-muted-foreground">
                To: {commerceSummary.businessName}
              </p>
              {commerceSummary.type === "fixed" && commerceSummary.amount != null ? (
                <p className="mt-1 font-medium tabular-nums">
                  {commerceSummary.amount} {commerceSummary.currency}
                </p>
              ) : (
                <p className="mt-1 text-muted-foreground">
                  Enter the amount you want to pay below.
                </p>
              )}
              <p className="mt-3 text-xs text-muted-foreground">
                Amount and currency for fixed-price links come from our servers, not
                from the URL.
              </p>
            </>
          ) : !commerceLoadErr ? (
            <p className="text-muted-foreground">Loading checkout…</p>
          ) : null}
          {checkoutBackCode ? (
            <p className="mt-3">
              <Link
                href={`/checkout/${encodeURIComponent(checkoutBackCode)}`}
                className="text-xs text-primary underline underline-offset-2"
              >
                Back to checkout summary
              </Link>
            </p>
          ) : null}
        </section>
      ) : null}
      {requestLinkId ? (
        <section
          className="mb-4 w-full max-w-md rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm"
          role="region"
          aria-label="Linked payment request"
        >
          {requestLoadErr ? (
            <p className="text-destructive">{requestLoadErr}</p>
          ) : null}
          {requestSummary?.transaction ? (
            <>
              <p className="font-medium">You are paying a request</p>
              <p className="mt-2 text-muted-foreground">
                {requestSummary.transaction.t_amount}{" "}
                {requestSummary.transaction.t_token ?? ""}
                {requestSummary.transaction.t_chain
                  ? ` · ${requestSummary.transaction.t_chain}`
                  : ""}
              </p>
              {requestSummary.transaction.toIdentifier ? (
                <p className="mt-1 text-muted-foreground">
                  To: {requestSummary.transaction.toIdentifier}
                </p>
              ) : null}
              <p className="mt-3 text-xs text-muted-foreground">
                Use the form below to choose what you send. Settlement paths (fiat or
                crypto) follow your operator configuration on Core.
              </p>
            </>
          ) : !requestLoadErr ? (
            <p className="text-muted-foreground">Loading request…</p>
          ) : null}
          <p className="mt-3">
            <Link
              href={`/checkout/${encodeURIComponent(requestLinkId)}`}
              className="text-xs text-primary underline underline-offset-2"
            >
              Back to checkout summary
            </Link>
          </p>
        </section>
      ) : null}
      {receiveMode ? (
        <p
          className="mb-4 w-full max-w-md rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-muted-foreground"
          role="status"
        >
          Receive link: complete payment details below. The recipient configured amount
          and payout preferences on their side.
        </p>
      ) : null}
      {fiatStandalone ? (
        <p className="mb-4 w-full max-w-md rounded-lg border border-primary/15 bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
          Fiat: payer completes with card or mobile money (Paystack). You still need a
          valid recipient identifier and your email for receipts.
        </p>
      ) : null}
      <article className="glass-card h-fit w-full shrink-0 overflow-hidden p-2 shadow-xl transition-all duration-300 ease-out min-w-0">
        <header className="mb-6 flex flex-row items-center justify-between gap-3 pl-2">
          <h1 className="text-2xl font-semibold text-card-foreground">I want to send</h1>
          <FlowsWalletHeaderAction />
        </header>

        <section className="flex flex-col gap-2">
          {cryptoStandalone ? (
            <div className="flex flex-col gap-2">
              {suggestedSelections.length > 0 && (
                <SuggestedTokensRow
                  suggestions={suggestedSelections}
                  onSelect={setSendSelection}
                  side="left"
                />
              )}
              <TokenSelectField
                label="Select token"
                selection={sendSelection}
                onOpenSelect={() => setSelectModalOpen(true)}
              />
            </div>
          ) : null}

          {fiatStandalone ? (
            <div className={FLOW_FIELD_SHELL}>
              <Label htmlFor="fiat-currency" className={FLOW_FIELD_LABEL}>
                Fiat currency
              </Label>
              <Input
                id="fiat-currency"
                value={fiatCurrencyInput}
                onChange={(e) => setFiatCurrencyInput(e.target.value)}
                placeholder="GHS, NGN, …"
                className={cn(FLOW_INPUT_TEXT, "uppercase")}
                autoCapitalize="characters"
              />
            </div>
          ) : null}

          <AmountField
            label={
              cryptoStandalone && sendSelection && payDual.supportsUsdDenom
                ? payAmountFieldMode === "usd"
                  ? "Amount (USD)"
                  : `Amount (${sendSelection.token.symbol})`
                : "Amount"
            }
            labelRight={
              cryptoStandalone &&
              !amountLocked &&
              sendSelection &&
              payDual.supportsUsdDenom ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 text-muted-foreground"
                  onClick={onRotatePayAmount}
                  aria-label={
                    payAmountFieldMode === "token"
                      ? "Enter amount in USD instead"
                      : "Enter amount in token instead"
                  }
                >
                  <ArrowLeftRight className="h-4 w-4" />
                </Button>
              ) : undefined
            }
            amount={
              cryptoStandalone && payDual.supportsUsdDenom && payAmountFieldMode === "usd"
                ? usdAmount
                : amount
            }
            onAmountChange={(v) => {
              if (
                cryptoStandalone &&
                payDual.supportsUsdDenom &&
                payAmountFieldMode === "usd"
              ) {
                setUsdAmount(v);
              } else {
                setAmount(v);
              }
            }}
            variant="transfer"
            readOnly={amountLocked}
            footer={
              <>
                {cryptoStandalone && sendSelection && payDual.supportsUsdDenom ? (
                  <div className="space-y-1">
                    {payDual.loading ? (
                      <p className="text-xs text-muted-foreground">Updating quote…</p>
                    ) : null}
                    {payDual.error ? (
                      <p className="text-xs text-destructive">{payDual.error}</p>
                    ) : null}
                    {!payDual.loading && payDual.oppositeLine ? (
                      <p className="text-xs tabular-nums text-muted-foreground">
                        {payDual.oppositeLine}
                      </p>
                    ) : null}
                    {!(cryptoStandalone && standalonePay) ? (
                      <p className="text-xs text-muted-foreground">
                        Uses platform pricing — not a guaranteed execution price.
                      </p>
                    ) : null}
                  </div>
                ) : null}
                {amountLocked && commerceSummary ? (
                  <span className="mt-1 block text-xs text-muted-foreground">
                    Locked to merchant link ({commerceSummary.currency})
                  </span>
                ) : null}
              </>
            }
          />

          <ContactIdentifierField
            label="To"
            value={to}
            onChange={setTo}
            ariaLabel="Recipient"
          />

          {standalonePay ? (
            <ContactIdentifierField
              label="Your email"
              description=""
              value={payerEmail}
              onChange={setPayerEmail}
              placeholder="you@example.com"
              ariaLabel="Your email for payment receipt"
            />
          ) : null}

          {sendResult ? (
            <p className="rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-xs text-muted-foreground break-words">
              {sendResult}
            </p>
          ) : null}

          {cryptoStandalone ? (
            <Button
              size="lg"
              className="w-full rounded-xl py-6 text-base font-semibold"
              disabled={
                sendLoading ||
                walletWritePending ||
                !sendSelection ||
                !to.trim() ||
                !payerEmailOk ||
                (payAmountFieldMode === "token" &&
                  (!amount.trim() ||
                    !Number.isFinite(Number(amount.trim())) ||
                    Number(amount.trim()) <= 0)) ||
                (payAmountFieldMode === "usd" &&
                  (!usdAmount.trim() ||
                    !Number.isFinite(Number(usdAmount.trim())) ||
                    Number(usdAmount.trim()) <= 0 ||
                    payDual.loading ||
                    !payDual.suggestedTokenAmount ||
                    !!payDual.error))
              }
              onClick={() => void handleSendRequest()}
            >
              {sendLoading || walletWritePending ? "Sending…" : "Send"}
            </Button>
          ) : null}
          {fiatStandalone ? (
            <Button
              size="lg"
              className="w-full rounded-xl py-6 text-base font-semibold"
              disabled={
                sendLoading ||
                !amount.trim() ||
                !to.trim() ||
                !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payerEmail.trim())
              }
              onClick={() => void handleSendFiatRequest()}
            >
              {sendLoading ? "Creating…" : "Send"}
            </Button>
          ) : null}
          {!standalonePay ? (
            <p className="text-center text-xs text-muted-foreground">
              Complete payment using the checkout summary link above.
            </p>
          ) : null}
        </section>
      </article>

      <TransferSelectModal
        open={selectModalOpen}
        onOpenChange={setSelectModalOpen}
        onSelect={(selection) => {
          setSendSelection(selection);
          setSelectModalOpen(false);
        }}
        chains={chains}
        tokens={tokens}
      />
    </div>
  );
}
