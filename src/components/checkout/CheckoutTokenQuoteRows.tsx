"use client";

import { useMemo, useState, useCallback, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useAccount, useSwitchChain } from "wagmi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { initializePaystackCheckout } from "@/lib/paystack-checkout";
import type { AggregateAllocation } from "@/lib/aggregate-payment-plan";
import type { OnrampDestination } from "@/components/Transfer/TransferOnrampTab";
import {
  useCheckoutPayoutQuotes,
  type PayoutQuoteRowState,
} from "@/hooks/use-checkout-payout-quotes";
import { useCheckoutBalances } from "@/hooks/use-checkout-balances";
import { useGetChainsQuery, useGetTokensQuery } from "@/store/api/squidApi";
import { TransferSelectModal } from "@/components/Transfer/TransferSelectModal";
import { FlagSelect } from "@/components/flows";
import type { Chain, Token } from "@/types/token";
import { getChainById as getStaticChainById } from "@/config/chainsAndTokens";
import { DEFAULT_CHECKOUT_ROW_SPECS } from "@/types/checkout-row-spec";
import type { CheckoutPayoutRowConfig } from "@/lib/checkout-payout-options";
import {
  buildRowsAfterTokenPick,
  reorderCheckoutRowsForEvmChain,
  specToDisplayRow,
  tokenSelectionToCheckoutRowSpec,
  type CheckoutDisplayRow,
} from "@/lib/checkout-display-rows";
import {
  CheckoutQuoteRow,
  emptyCheckoutQuote,
} from "@/components/checkout/CheckoutQuoteRow";
import { CheckoutNonEvmLinkedAddresses } from "@/components/checkout/CheckoutNonEvmLinkedAddresses";
import { isNonEvmCheckoutChainId } from "@/lib/checkout-chain-family";
import type { TokenSelection } from "@/components/Exchange/TokenChainSelectModal";
import { ChevronDown } from "lucide-react";

const SOLANA_CHAIN_ICON =
  "https://assets.coingecko.com/coins/images/4128/small/solana.png";
const BITCOIN_TOKEN_ICON =
  "https://assets.coingecko.com/coins/images/1/standard/bitcoin.png?1696501400";
const DEFAULT_FIAT_QUOTE_CHAIN = "BASE";

export type CheckoutContinuePayload = {
  quotes: Record<string, PayoutQuoteRowState>;
  flow: "token" | "morapay" | "onramp" | "aggregate";
  selectedRow?: CheckoutDisplayRow;
  morapayEmail?: string;
  onrampDestination?: OnrampDestination;
  aggregateAllocations?: AggregateAllocation[];
};

export type CheckoutTokenQuoteRowsProps = {
  enabled: boolean;
  fiatAmount: string | null;
  fiatCurrency: string | null;
  invoiceLabel: string;
  /** FIAT invoice: offramp Morapay is disabled in the modal; CRYPTO charge: enabled. */
  invoiceChargeKind?: string;
  /** Commerce payment link id for Morapay / card flow. */
  payPageId?: string;
  onContinueToPay?: (payload: CheckoutContinuePayload) => void;
};

type PaystackCountry = {
  code: string;
  name: string;
  currency: string;
  supportedPaystack: boolean;
};

function findTokenForRow(
  tokens: Token[],
  chainId: string,
  symbol: string
): Token | null {
  const upper = symbol.toUpperCase();
  const direct = tokens.find(
    (t) => t.chainId === chainId && t.symbol.toUpperCase() === upper
  );
  if (direct) return direct;
  const aliasesBySymbol: Record<string, string[]> = {
    BTC: ["BTC", "WBTC", "BTCB", "XBT"],
    WBTC: ["WBTC", "BTC", "BTCB", "XBT"],
    BTCB: ["BTCB", "BTC", "WBTC", "XBT"],
    XBT: ["XBT", "BTC", "WBTC", "BTCB"],
  };
  const aliases = aliasesBySymbol[upper] ?? [upper];
  const aliasMatch = tokens.find(
    (t) => t.chainId === chainId && aliases.includes(t.symbol.toUpperCase())
  );
  if (aliasMatch) return aliasMatch;
  if (chainId === "101" && upper === "SOL") {
    return (
      tokens.find(
        (t) => t.chainId === chainId && t.symbol.toUpperCase() === "WSOL"
      ) ?? null
    );
  }
  if (upper === "BTC" || upper === "WBTC" || upper === "BTCB" || upper === "XBT") {
    return {
      id: `btc-fallback-${chainId}`,
      chainId,
      symbol: "BTC",
      name: "Bitcoin",
      logoURI: BITCOIN_TOKEN_ICON,
    };
  }
  return null;
}

function addressFromTokenId(tokenId: string, chainId: string): string | null {
  const idx = tokenId.lastIndexOf("-");
  if (idx <= 0) return null;
  const tail = tokenId.slice(idx + 1);
  if (tail !== chainId) return null;
  return tokenId.slice(0, idx);
}

function balanceIdentityKey(chainId: string, tokenAddress: string): string {
  const normalizedChainId = chainId.trim();
  const normalizedAddress =
    normalizedChainId === "101"
      ? tokenAddress.trim()
      : tokenAddress.trim().toLowerCase();
  return `${normalizedChainId}:${normalizedAddress}`;
}

const CHECKOUT_CHAIN_FALLBACK: Record<string, Chain> = {
  "8453": { id: "8453", name: "Base", shortName: "Base" },
  "56": { id: "56", name: "BNB Chain", shortName: "BNB" },
  "101": {
    id: "101",
    name: "Solana",
    shortName: "SOL",
    iconURI: SOLANA_CHAIN_ICON,
  },
  "1": { id: "1", name: "Ethereum", shortName: "ETH" },
  "8332": {
    id: "8332",
    name: "Bitcoin",
    shortName: "BTC",
    iconURI: BITCOIN_TOKEN_ICON,
  },
  btc: {
    id: "btc",
    name: "Bitcoin",
    shortName: "BTC",
    iconURI: BITCOIN_TOKEN_ICON,
  },
  bitcoin: {
    id: "bitcoin",
    name: "Bitcoin",
    shortName: "BTC",
    iconURI: BITCOIN_TOKEN_ICON,
  },
};

function chainFromList(
  chains: Chain[],
  chainId: string
): Chain | undefined {
  const found = chains.find((c) => c.id === chainId);
  const fallback =
    CHECKOUT_CHAIN_FALLBACK[chainId] ?? getStaticChainById(chainId);
  if (!found) return fallback;
  const fbIcon = fallback?.iconURI?.trim();
  if (fbIcon && !(found.iconURI?.trim() ?? "")) {
    return { ...found, iconURI: fbIcon };
  }
  return found;
}

export function CheckoutTokenQuoteRows({
  enabled,
  fiatAmount,
  fiatCurrency,
  invoiceLabel,
  invoiceChargeKind = "FIAT",
  payPageId,
  onContinueToPay,
}: CheckoutTokenQuoteRowsProps) {
  const searchParams = useSearchParams();
  const walletParam = searchParams.get("wallet")?.trim() ?? "";
  const evmFromAddress =
    walletParam.startsWith("0x") && walletParam.length >= 42
      ? walletParam
      : null;

  const { chainId: walletChainId, address: connectedEvmAddress } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const userCustomizedRowsRef = useRef(false);

  const [rowSpecs, setRowSpecs] = useState(DEFAULT_CHECKOUT_ROW_SPECS);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(
    DEFAULT_CHECKOUT_ROW_SPECS[0]?.id ?? null
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [modalChainFilterKey, setModalChainFilterKey] = useState(0);
  const [paymentFlow, setPaymentFlow] = useState<
    "token" | "morapay" | "onramp" | "aggregate"
  >("token");
  const [morapayEmail, setMorapayEmail] = useState("");
  const [fiatExpanded, setFiatExpanded] = useState(false);
  /** CRYPTO invoice + Paystack: exclusive "crypto quotes" vs "fiat / Morapay" panel (no accordion). */
  const [cryptoFiatTab, setCryptoFiatTab] = useState<"crypto" | "fiat">("crypto");
  const [onrampDestination, setOnrampDestination] =
    useState<OnrampDestination | null>(null);
  const [aggregateAllocations, setAggregateAllocations] = useState<
    AggregateAllocation[] | null
  >(null);
  const [morapayError, setMorapayError] = useState<string | null>(null);
  const [morapayLoading, setMorapayLoading] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paystackCountries, setPaystackCountries] = useState<PaystackCountry[]>([]);
  const [selectedFiatCurrency, setSelectedFiatCurrency] = useState<string>("");
  const [fiatQuoteAmount, setFiatQuoteAmount] = useState<string>("");
  const [fiatQuoteLoading, setFiatQuoteLoading] = useState(false);
  const [fiatQuoteError, setFiatQuoteError] = useState<string | null>(null);

  const chargeKindNormalized =
    invoiceChargeKind.toUpperCase() === "CRYPTO" ? "CRYPTO" : "FIAT";
  const invoiceCurrencyUpper = (fiatCurrency ?? "").trim().toUpperCase();
  const invoiceAmountNumber = Number.parseFloat((fiatAmount ?? "").trim());

  useEffect(() => {
    if (!payPageId?.trim() || chargeKindNormalized !== "CRYPTO") {
      setCryptoFiatTab("crypto");
    }
  }, [payPageId, chargeKindNormalized]);

  const quotes = useCheckoutPayoutQuotes(
    enabled,
    fiatAmount,
    fiatCurrency,
    evmFromAddress,
    rowSpecs
  );

  const { data: chains = [] } = useGetChainsQuery(undefined);
  const { data: tokens = [] } = useGetTokensQuery(undefined);

  const displayRowsResolved = useMemo(() => {
    return rowSpecs.map((spec) => specToDisplayRow(spec, tokens));
  }, [rowSpecs, tokens]);

  const selectedDisplayRow = useMemo(() => {
    const id = selectedRowId ?? displayRowsResolved[0]?.id;
    if (!id) return null;
    return displayRowsResolved.find((r) => r.id === id) ?? null;
  }, [displayRowsResolved, selectedRowId]);

  const quoteChainForFiat = useMemo(() => {
    const baseRow = displayRowsResolved.find((row) => row.id === "base-usdc");
    const chainId = baseRow?.balanceChainId?.trim() ?? "";
    if (chainId === "8453" || chainId.toUpperCase() === "BASE") {
      return "BASE";
    }
    return DEFAULT_FIAT_QUOTE_CHAIN;
  }, [displayRowsResolved]);

  const payoutConfigs = useMemo(
    () =>
      displayRowsResolved.map(({ spec: _s, ...rest }) => rest as CheckoutPayoutRowConfig),
    [displayRowsResolved]
  );

  useEffect(() => {
    const ids = new Set(rowSpecs.map((r) => r.id));
    if (selectedRowId != null && !ids.has(selectedRowId)) {
      setSelectedRowId(rowSpecs[0]?.id ?? null);
    }
  }, [rowSpecs, selectedRowId]);

  const reorderedDefaults = useMemo(
    () =>
      reorderCheckoutRowsForEvmChain(
        DEFAULT_CHECKOUT_ROW_SPECS,
        walletChainId
      ),
    [walletChainId]
  );

  useEffect(() => {
    if (userCustomizedRowsRef.current) return;
    setRowSpecs(reorderedDefaults);
    setSelectedRowId(reorderedDefaults[0]?.id ?? null);
  }, [reorderedDefaults]);

  const { byRowId, loading: balLoading, items: allBalanceItems } = useCheckoutBalances(
    walletParam.length > 0 ? walletParam : null,
    payoutConfigs,
    modalChainFilterKey
  );

  const tokenByRow = useMemo(() => {
    const m = new Map<string, Token | null>();
    for (const row of displayRowsResolved) {
      m.set(
        row.id,
        findTokenForRow(tokens, row.balanceChainId, row.iconSymbol)
      );
    }
    return m;
  }, [tokens, displayRowsResolved]);

  const aggregateRows = useMemo(() => {
    const quoteByIdentity = new Map<
      string,
      { cryptoAmount: string | null; cryptoSymbol: string | null }
    >();
    for (const row of displayRowsResolved) {
      const identity = balanceIdentityKey(
        row.balanceChainId,
        row.balanceTokenAddress
      );
      const q = quotes[row.id];
      quoteByIdentity.set(identity, {
        cryptoAmount: q?.cryptoAmount ?? null,
        cryptoSymbol: q?.cryptoSymbol ?? null,
      });
    }

    const tokenByIdentity = new Map<
      string,
      { name: string; symbol: string }
    >();
    for (const token of tokens) {
      const address = addressFromTokenId(token.id, token.chainId);
      if (!address) continue;
      tokenByIdentity.set(balanceIdentityKey(token.chainId, address), {
        name: token.name,
        symbol: token.symbol,
      });
    }

    const rows = allBalanceItems
      .filter((item) => {
        const value = Number.parseFloat(item.balance?.trim() ?? "0");
        return Number.isFinite(value) && value > 0;
      })
      .map((item) => {
        const chainId = item.chainId?.trim() ?? "";
        const tokenAddress = item.tokenAddress?.trim() ?? "";
        const key = balanceIdentityKey(chainId, tokenAddress);
        const token = tokenByIdentity.get(key);
        const quote = quoteByIdentity.get(key);
        const balanceLabelRaw = item.balance?.trim() ?? "";
        return {
          rowId: key,
          label: token?.name ?? item.tokenSymbol ?? "Token",
          iconSymbol: token?.symbol ?? item.tokenSymbol ?? "TOKEN",
          balanceLabel: balanceLabelRaw === "" ? "0" : balanceLabelRaw,
          quoteCrypto: quote?.cryptoAmount ?? null,
          quoteSymbol:
            quote?.cryptoSymbol ?? token?.symbol ?? item.tokenSymbol ?? null,
          chainId,
        };
      })
      .filter((row) => row.chainId !== "");

    return rows;
  }, [allBalanceItems, displayRowsResolved, quotes, tokens]);

  const tokenBalanceByTokenId = useMemo(() => {
    const out: Record<string, string> = {};
    for (const token of tokens) {
      const tokenAddress = addressFromTokenId(token.id, token.chainId);
      if (!tokenAddress) continue;
      const hit = allBalanceItems.find((item) => {
        const chainMatch = (item.chainId?.trim() ?? "") === token.chainId;
        if (!chainMatch) return false;
        const left = item.tokenAddress?.trim() ?? "";
        const right = tokenAddress.trim();
        if (token.chainId === "101") return left === right;
        return left.toLowerCase() === right.toLowerCase();
      });
      out[token.id] = hit?.balance?.trim() || "0";
    }
    return out;
  }, [allBalanceItems, tokens]);

  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    const nonZeroFromDynamic = allBalanceItems.filter((item) => {
      const value = Number.parseFloat(item.balance ?? "0");
      if (!Number.isFinite(value) || value <= 0) return false;
      return item.source === "dynamic" || item.source === "merged";
    }).length;
    const totalNonZero = allBalanceItems.filter((item) => {
      const value = Number.parseFloat(item.balance ?? "0");
      return Number.isFinite(value) && value > 0;
    }).length;
    // Dev-only observability so we can confirm Dynamic fallback contribution.
    console.debug("[checkout] balance sources", {
      totalItems: allBalanceItems.length,
      totalNonZero,
      nonZeroFromDynamic,
    });
  }, [allBalanceItems]);

  useEffect(() => {
    if (!enabled || !payPageId?.trim() || paystackCountries.length > 0) return;
    let cancelled = false;
    const run = async () => {
      try {
        const res = await fetch("/api/core/countries", { cache: "no-store" });
        const json = (await res.json().catch(() => ({}))) as {
          success?: boolean;
          data?: { countries?: PaystackCountry[] };
        };
        if (cancelled || !res.ok || json.success !== true) return;
        const countries = (json.data?.countries ?? []).filter(
          (country) => country.supportedPaystack
        );
        setPaystackCountries(countries);
        const availableCurrencies = Array.from(
          new Set(
            countries
              .map((country) => country.currency?.trim().toUpperCase())
              .filter((currency) => currency && currency.length === 3)
          )
        );
        if (availableCurrencies.length === 0) return;
        const selectable =
          chargeKindNormalized === "FIAT" && invoiceCurrencyUpper
            ? availableCurrencies.filter((c) => c !== invoiceCurrencyUpper)
            : availableCurrencies;
        if (selectable.length === 0) return;
        setSelectedFiatCurrency((prev) =>
          prev && selectable.includes(prev) ? prev : selectable[0]
        );
      } catch {
        if (!cancelled) {
          setFiatQuoteError("Unable to load fiat currencies right now.");
        }
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [enabled, payPageId, paystackCountries.length, invoiceCurrencyUpper]);

  const fiatCurrencyOptions = useMemo(() => {
    const raw = Array.from(
      new Set(
        paystackCountries
          .map((country) => country.currency?.trim().toUpperCase())
          .filter((currency) => currency && currency.length === 3)
      )
    );
    /** Fiat-denominated invoice: payer must use a **different** fiat than the invoice (no same-currency fiat-to-fiat). */
    if (chargeKindNormalized === "FIAT" && invoiceCurrencyUpper) {
      return raw.filter((c) => c !== invoiceCurrencyUpper);
    }
    return raw;
  }, [paystackCountries, chargeKindNormalized, invoiceCurrencyUpper]);

  const fiatCurrencyFlagItems = useMemo(() => {
    return fiatCurrencyOptions.map((currency) => {
      const country = paystackCountries.find(
        (c) => c.currency?.trim().toUpperCase() === currency
      );
      return {
        value: currency,
        label: country ? `${currency} · ${country.name}` : currency,
        flagCode: country?.code?.trim() ?? "",
      };
    });
  }, [fiatCurrencyOptions, paystackCountries]);

  useEffect(() => {
    if (!selectedFiatCurrency) return;
    if (!fiatAmount || !fiatCurrency) return;
    let cancelled = false;
    const run = async () => {
      setFiatQuoteLoading(true);
      setFiatQuoteError(null);
      setFiatQuoteAmount("");
      if (chargeKindNormalized === "FIAT") {
        if (!selectedFiatCurrency || selectedFiatCurrency === invoiceCurrencyUpper) {
          setFiatQuoteError(
            "Choose a payer currency different from the invoice currency. Same-currency fiat checkout is not available here."
          );
          setFiatQuoteLoading(false);
          return;
        }
        try {
          const res = await fetch("/api/core/v1/quotes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "ONRAMP",
              inputAmount: fiatAmount,
              inputCurrency: selectedFiatCurrency,
              outputCurrency: "USDC",
              inputSide: "to",
              chain: quoteChainForFiat,
            }),
          });
          const json = (await res.json().catch(() => ({}))) as {
            success?: boolean;
            data?: { input?: { amount?: string } };
            error?: string;
          };
          if (cancelled) return;
          if (!res.ok || json.success !== true) {
            setFiatQuoteError(json.error ?? "Unable to quote this currency pair right now.");
            return;
          }
          const quoted = json.data?.input?.amount?.trim() ?? "";
          if (!quoted) {
            setFiatQuoteError("Fiat quote was empty. Try another currency.");
            return;
          }
          setFiatQuoteAmount(quoted);
        } catch {
          if (!cancelled) {
            setFiatQuoteError("Unable to fetch fiat quote right now.");
          }
        } finally {
          if (!cancelled) setFiatQuoteLoading(false);
        }
        return;
      }
      try {
        const res = await fetch("/api/core/v1/quotes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "ONRAMP",
            inputAmount: fiatAmount,
            inputCurrency: selectedFiatCurrency,
            outputCurrency: fiatCurrency,
            inputSide: "to",
            chain: quoteChainForFiat,
          }),
        });
        const json = (await res.json().catch(() => ({}))) as {
          success?: boolean;
          data?: { input?: { amount?: string } };
          error?: string;
        };
        if (cancelled) return;
        if (!res.ok || json.success !== true) {
          setFiatQuoteError(json.error ?? "Unable to quote this fiat currency right now.");
          return;
        }
        const quoted = json.data?.input?.amount?.trim() ?? "";
        if (!quoted) {
          setFiatQuoteError("Fiat quote was empty. Please try another currency.");
          return;
        }
        setFiatQuoteAmount(quoted);
      } catch {
        if (!cancelled) {
          setFiatQuoteError("Unable to fetch fiat quote right now.");
        }
      } finally {
        if (!cancelled) setFiatQuoteLoading(false);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [
    selectedFiatCurrency,
    fiatAmount,
    fiatCurrency,
    chargeKindNormalized,
    invoiceCurrencyUpper,
    quoteChainForFiat,
  ]);

  const handleModalSelect = useCallback((selection: TokenSelection) => {
    userCustomizedRowsRef.current = true;
    const spec = tokenSelectionToCheckoutRowSpec(selection.token, selection.chain);
    const next = buildRowsAfterTokenPick(spec);
    setRowSpecs(next);
    setSelectedRowId(spec.id);
    setPaymentFlow("token");
    setAggregateAllocations(null);
    setPaymentError(null);
    if (payPageId?.trim() && chargeKindNormalized === "CRYPTO") {
      setCryptoFiatTab("crypto");
      setFiatExpanded(false);
    }
  }, [payPageId, chargeKindNormalized]);

  const submitMorapay = useCallback(async () => {
    setPaymentError(null);
    if (!payPageId?.trim()) {
      setMorapayError("Payment link is not available.");
      return;
    }
    if (!selectedFiatCurrency) {
      setMorapayError("Select a fiat currency before continuing.");
      return;
    }
    if (fiatQuoteLoading) {
      setMorapayError("Fiat quote is still loading. Please wait.");
      return;
    }
    if (fiatQuoteError) {
      setMorapayError(fiatQuoteError);
      return;
    }
    const amountForInitialize = Number.parseFloat(fiatQuoteAmount);
    if (!Number.isFinite(amountForInitialize) || amountForInitialize <= 0) {
      setMorapayError("Fiat quote is unavailable. Choose another currency.");
      return;
    }
    setMorapayLoading(true);
    setMorapayError(null);
    const cryptoSettlement =
      chargeKindNormalized === "CRYPTO"
        ? Number.parseFloat((fiatAmount ?? "").trim())
        : NaN;
    const payerWallet =
      evmFromAddress ??
      (connectedEvmAddress?.startsWith("0x") && connectedEvmAddress.length >= 42
        ? connectedEvmAddress
        : undefined);
    const result = await initializePaystackCheckout({
      email: morapayEmail,
      ...(payerWallet ? { payer_wallet: payerWallet } : {}),
      paymentLinkId: payPageId,
      amount: amountForInitialize,
      currency: selectedFiatCurrency,
      ...(Number.isFinite(cryptoSettlement) && cryptoSettlement > 0
        ? { settlement_crypto_amount: cryptoSettlement }
        : {}),
      channels: ["card", "mobile_money", "bank_transfer"],
    });
    if (!result.ok) {
      setMorapayError(result.error);
      setMorapayLoading(false);
      return;
    }
    onContinueToPay?.({
      flow: "morapay",
      quotes,
      morapayEmail: morapayEmail.trim(),
    });
    window.location.href = result.authorizationUrl;
  }, [
    payPageId,
    selectedFiatCurrency,
    fiatQuoteLoading,
    fiatQuoteError,
    fiatQuoteAmount,
    morapayEmail,
    onContinueToPay,
    quotes,
    chargeKindNormalized,
    fiatAmount,
    connectedEvmAddress,
    evmFromAddress,
  ]);

  const handleContinue = useCallback(async () => {
    setPaymentError(null);
    if (
      paymentFlow === "morapay" ||
      (paymentFlow === "onramp" &&
        onrampDestination === "pay-business" &&
        chargeKindNormalized === "FIAT")
    ) {
      await submitMorapay();
      return;
    }
    if (paymentFlow === "onramp") {
      if (!onContinueToPay) {
        setPaymentError("Onramp flow is not wired yet on this checkout page.");
        return;
      }
      onContinueToPay?.({
        flow: "onramp",
        quotes,
        onrampDestination: onrampDestination ?? undefined,
      });
      return;
    }
    if (paymentFlow === "aggregate" && aggregateAllocations?.length) {
      if (!onContinueToPay) {
        setPaymentError("Aggregate flow is not wired yet on this checkout page.");
        return;
      }
      onContinueToPay?.({
        flow: "aggregate",
        quotes,
        aggregateAllocations,
      });
      return;
    }
    const id = selectedRowId ?? displayRowsResolved[0]?.id;
    if (!id) return;
    const row = displayRowsResolved.find((r) => r.id === id);
    if (!row) return;
    const targetCid = Number.parseInt(row.balanceChainId, 10);
    if (Number.isNaN(targetCid)) {
      setPaymentError(
        "This token is on a non-EVM network. Automatic wallet switching is only available for EVM chains right now."
      );
      return;
    }
    if (
      walletChainId != null &&
      !Number.isNaN(targetCid) &&
      targetCid !== walletChainId &&
      switchChainAsync
    ) {
      try {
        await switchChainAsync({ chainId: targetCid });
      } catch {
        setPaymentError(
          "Network switch was cancelled or unsupported in your current wallet."
        );
        return;
      }
    }
    if (!onContinueToPay) {
      setPaymentError("Token payment flow is not wired yet on this checkout page.");
      return;
    }
    onContinueToPay({ flow: "token", selectedRow: row, quotes });
  }, [
    paymentFlow,
    submitMorapay,
    onContinueToPay,
    quotes,
    onrampDestination,
    aggregateAllocations,
    selectedRowId,
    displayRowsResolved,
    walletChainId,
    switchChainAsync,
  ]);

  const morapayFields = (idSuffix: string) => (
    <div className="mt-3 space-y-2 text-left">
      <label
        id={`checkout-fiat-currency-label-${idSuffix}`}
        htmlFor={`checkout-fiat-currency-${idSuffix}`}
        className="text-xs text-card-foreground/70"
      >
        Currency
      </label>
      <FlagSelect
        id={`checkout-fiat-currency-${idSuffix}`}
        labelId={`checkout-fiat-currency-label-${idSuffix}`}
        items={fiatCurrencyFlagItems}
        value={selectedFiatCurrency}
        onChange={(v) => setSelectedFiatCurrency(v.trim().toUpperCase())}
        disabled={morapayLoading || fiatCurrencyOptions.length === 0}
        placeholder="Select currency"
        className="[&_button]:h-10 [&_button]:rounded-md"
      />
      {fiatQuoteLoading ? (
        <p className="text-xs text-card-foreground/70">Fetching quote…</p>
      ) : null}
      {!fiatQuoteLoading && fiatQuoteAmount ? (
        <p className="text-xs text-card-foreground/70">
          You will pay about {fiatQuoteAmount} {selectedFiatCurrency}.
        </p>
      ) : null}
      <label className="sr-only" htmlFor={`checkout-morapay-email-${idSuffix}`}>
        Email for receipt
      </label>
      <Input
        id={`checkout-morapay-email-${idSuffix}`}
        type="email"
        name="payer-email"
        autoComplete="email"
        placeholder="user@email.com"
        value={morapayEmail}
        onChange={(e) => setMorapayEmail(e.target.value)}
        disabled={morapayLoading}
        className="border-border bg-card/90 text-card-foreground placeholder:text-muted-foreground"
      />
      {morapayError ? (
        <p className="text-xs text-destructive" role="alert">
          {morapayError}
        </p>
      ) : null}
      {!morapayError && fiatQuoteError ? (
        <p className="text-xs text-destructive" role="alert">
          {fiatQuoteError}
        </p>
      ) : null}
    </div>
  );

  /** Card/mobile (Morapay) only when the link is charged in crypto — never for FIAT-denominated links. */
  const showCryptoFiatCollapsible =
    payPageId?.trim() && chargeKindNormalized === "CRYPTO";
  const showCryptoMorapayFiatTab =
    showCryptoFiatCollapsible && cryptoFiatTab === "fiat";
  const showCryptoQuotesBlock =
    !showCryptoFiatCollapsible || cryptoFiatTab === "crypto";
  const showCryptoFiatFields =
    paymentFlow === "morapay" && fiatExpanded && !showCryptoFiatCollapsible;
  /** Fiat invoice + “settle through business checkout”: same payer fields as card/MoMo, without the crypto collapsible. */
  const showFiatOnrampBusinessFields =
    chargeKindNormalized === "FIAT" &&
    !!payPageId?.trim() &&
    paymentFlow === "onramp" &&
    onrampDestination === "pay-business";
  const showFiatPayerFields = showCryptoFiatFields || showFiatOnrampBusinessFields;
  const showBottomMorapayButton =
    (paymentFlow === "morapay" && fiatExpanded) || showFiatOnrampBusinessFields;

  const fiatMorapaySwitchButtonClass =
    "w-full justify-center px-1 text-muted-foreground bg-white p-4 border-none hover:bg-white/40";

  return (
    <>
      <section
        className="mt-4 space-y-2 text-left"
        aria-label={
          showCryptoMorapayFiatTab
            ? "Pay with card or mobile money"
            : "Estimated amounts by token"
        }
      >
        {showCryptoMorapayFiatTab ? (
          <div className="space-y-2">
            <p className="text-center text-xs font-medium text-muted-foreground">
              Pay with fiat
            </p>
            <div className="rounded-lg border border-white/10">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className={fiatMorapaySwitchButtonClass}
                onClick={() => {
                  setCryptoFiatTab("crypto");
                  setPaymentFlow("token");
                  setFiatExpanded(false);
                  setMorapayError(null);
                }}
              >
                Pay with crypto
              </Button>
            </div>
            {morapayFields("crypto")}
            {showBottomMorapayButton ? (
              <Button
                type="button"
                size="lg"
                className="mt-3 w-full rounded-xl py-6 font-semibold"
                disabled={
                  morapayLoading ||
                  !selectedFiatCurrency ||
                  fiatQuoteLoading ||
                  !!fiatQuoteError
                }
                onClick={() => void handleContinue()}
              >
                {morapayLoading ? "Redirecting…" : "Continue to pay"}
              </Button>
            ) : null}
            {paymentError ? (
              <p className="text-center text-xs text-destructive" role="alert">
                {paymentError}
              </p>
            ) : null}
          </div>
        ) : (
          <>
            {showCryptoQuotesBlock ? (
              <>
                <p className="text-center text-xs font-medium text-muted-foreground">
                  Pay with crypto
                </p>
                {displayRowsResolved.map((row) => (
                  <CheckoutQuoteRow
                    key={row.id}
                    label={row.label}
                    iconSymbol={row.iconSymbol}
                    invoiceLabel={invoiceLabel}
                    state={quotes[row.id] ?? emptyCheckoutQuote()}
                    balanceLabel={byRowId[row.id] ?? "—"}
                    balanceLoading={balLoading && walletParam.length > 0}
                    token={tokenByRow.get(row.id) ?? null}
                    chain={chainFromList(chains, row.balanceChainId)}
                    selected={selectedRowId === row.id}
                    onSelect={() => {
                      setSelectedRowId(row.id);
                      setPaymentFlow("token");
                    }}
                  />
                ))}
                {paymentFlow === "token" &&
                selectedDisplayRow &&
                isNonEvmCheckoutChainId(selectedDisplayRow.balanceChainId) ? (
                  <CheckoutNonEvmLinkedAddresses
                    balanceChainId={selectedDisplayRow.balanceChainId}
                    chainName={
                      chainFromList(chains, selectedDisplayRow.balanceChainId)?.name
                    }
                    className="mt-2"
                  />
                ) : null}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full justify-center px-1 text-muted-foreground bg-white p-4 border-none hover:bg-white/40"
                  onClick={() => setModalOpen(true)}
                >
                  <ChevronDown size={7} />
                  More tokens
                </Button>
                {showCryptoFiatCollapsible ? (
                  <div className="mt-2 rounded-lg border border-white/10">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className={fiatMorapaySwitchButtonClass}
                      onClick={() => {
                        setCryptoFiatTab("fiat");
                        setPaymentFlow("morapay");
                        setFiatExpanded(true);
                        setMorapayError(null);
                      }}
                    >
                      Pay with fiat
                    </Button>
                  </div>
                ) : null}
              </>
            ) : null}
            {showFiatPayerFields ? morapayFields(showFiatOnrampBusinessFields ? "fiat-onramp" : "crypto") : null}
            {showCryptoQuotesBlock &&
            paymentFlow === "aggregate" &&
            aggregateAllocations?.length ? (
              <p className="mt-2 text-center text-xs text-muted-foreground">
                Aggregate split ready ({aggregateAllocations.length} legs). Wallet
                signing will be added with your provider.
              </p>
            ) : null}
            {showBottomMorapayButton ? (
              <Button
                type="button"
                size="lg"
                className="mt-3 w-full rounded-xl py-6 font-semibold"
                disabled={
                  morapayLoading ||
                  !selectedFiatCurrency ||
                  fiatQuoteLoading ||
                  !!fiatQuoteError
                }
                onClick={() => void handleContinue()}
              >
                {morapayLoading ? "Redirecting…" : "Continue to pay"}
              </Button>
            ) : (
              <Button
                type="button"
                size="lg"
                className="mt-3 w-full rounded-xl py-6 font-semibold"
                disabled={morapayLoading}
                onClick={() => void handleContinue()}
              >
                Continue to pay
              </Button>
            )}
            {paymentError ? (
              <p className="text-center text-xs text-destructive" role="alert">
                {paymentError}
              </p>
            ) : null}
          </>
        )}
      </section>
      <TransferSelectModal
        open={modalOpen}
        onOpenChange={(o) => {
          setModalOpen(o);
          if (o) setModalChainFilterKey((k) => k + 1);
        }}
        chains={chains}
        tokens={tokens}
        chainFilterResetKey={modalChainFilterKey}
        priorityChainIds={
          walletChainId != null ? [String(walletChainId)] : undefined
        }
        defaultChainFilterId={null}
        onSelect={handleModalSelect}
        invoiceChargeKind={chargeKindNormalized}
        onMorapayOfframpSelect={() => {
          setPaymentFlow("morapay");
          setMorapayError(null);
          setAggregateAllocations(null);
          if (payPageId?.trim() && chargeKindNormalized === "CRYPTO") {
            setCryptoFiatTab("fiat");
            setFiatExpanded(true);
          }
        }}
        onOnrampChoice={(dest) => {
          setPaymentFlow("onramp");
          setOnrampDestination(dest);
          setAggregateAllocations(null);
        }}
        onAggregateApply={(alloc) => {
          setPaymentFlow("aggregate");
          setAggregateAllocations(alloc);
        }}
        aggregateContext={{
          walletAddress: walletParam.length > 0 ? walletParam : null,
          invoiceLabel,
          rows: aggregateRows,
        }}
        tokenBalanceByTokenId={tokenBalanceByTokenId}
      />
    </>
  );
}
