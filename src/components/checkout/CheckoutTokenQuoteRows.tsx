"use client";

import { useMemo, useState, useCallback, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
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
import type { Chain, Token } from "@/types/token";
import { TokenIconWithChainBadge } from "@/components/Token/TokenIconWithChainBadge";
import { getChainById as getStaticChainById } from "@/config/chainsAndTokens";
import { DEFAULT_CHECKOUT_ROW_SPECS } from "@/types/checkout-row-spec";
import type { CheckoutPayoutRowConfig } from "@/lib/checkout-payout-options";
import {
  buildRowsAfterTokenPick,
  specToDisplayRow,
  tokenSelectionToCheckoutRowSpec,
  type CheckoutDisplayRow,
} from "@/lib/checkout-display-rows";
import type { TokenSelection } from "@/components/Exchange/TokenChainSelectModal";

const SOLANA_CHAIN_ICON =
  "https://assets.coingecko.com/coins/images/4128/small/solana.png";

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

function findTokenForRow(
  tokens: Token[],
  chainId: string,
  symbol: string
): Token | null {
  const upper = symbol.toUpperCase();
  const direct =
    tokens.find(
      (t) => t.chainId === chainId && t.symbol.toUpperCase() === upper
    ) ?? null;
  if (direct) return direct;
  if (chainId === "101" && upper === "SOL") {
    return (
      tokens.find(
        (t) => t.chainId === chainId && t.symbol.toUpperCase() === "WSOL"
      ) ?? null
    );
  }
  return null;
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

  const [rowSpecs, setRowSpecs] = useState(DEFAULT_CHECKOUT_ROW_SPECS);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(
    DEFAULT_CHECKOUT_ROW_SPECS[0]?.id ?? null
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [paymentFlow, setPaymentFlow] = useState<
    "token" | "morapay" | "onramp" | "aggregate"
  >("token");
  const [morapayEmail, setMorapayEmail] = useState("");
  const [onrampDestination, setOnrampDestination] =
    useState<OnrampDestination | null>(null);
  const [aggregateAllocations, setAggregateAllocations] = useState<
    AggregateAllocation[] | null
  >(null);
  const [morapayError, setMorapayError] = useState<string | null>(null);
  const [morapayLoading, setMorapayLoading] = useState(false);

  const chargeKindNormalized =
    invoiceChargeKind.toUpperCase() === "CRYPTO" ? "CRYPTO" : "FIAT";

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

  const { byRowId, loading: balLoading } = useCheckoutBalances(
    walletParam.length > 0 ? walletParam : null,
    payoutConfigs
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
    return displayRowsResolved.map((row) => {
      const q = quotes[row.id];
      return {
        rowId: row.id,
        label: row.label,
        iconSymbol: row.iconSymbol,
        balanceLabel: byRowId[row.id] ?? "—",
        quoteCrypto: q?.cryptoAmount ?? null,
        quoteSymbol: q?.cryptoSymbol ?? null,
        chainId: row.balanceChainId,
      };
    });
  }, [displayRowsResolved, quotes, byRowId]);

  const handleModalSelect = useCallback((selection: TokenSelection) => {
    const spec = tokenSelectionToCheckoutRowSpec(selection.token, selection.chain);
    const next = buildRowsAfterTokenPick(spec);
    setRowSpecs(next);
    setSelectedRowId(spec.id);
    setPaymentFlow("token");
    setAggregateAllocations(null);
  }, []);

  const handleContinue = useCallback(async () => {
    if (paymentFlow === "morapay") {
      if (!payPageId?.trim()) {
        setMorapayError("Payment link is not available.");
        return;
      }
      setMorapayLoading(true);
      setMorapayError(null);
      const result = await initializePaystackCheckout({
        email: morapayEmail,
        paymentLinkId: payPageId,
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
      return;
    }
    if (paymentFlow === "onramp") {
      onContinueToPay?.({
        flow: "onramp",
        quotes,
        onrampDestination: onrampDestination ?? undefined,
      });
      return;
    }
    if (paymentFlow === "aggregate" && aggregateAllocations?.length) {
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
    onContinueToPay?.({ flow: "token", selectedRow: row, quotes });
  }, [
    paymentFlow,
    payPageId,
    morapayEmail,
    onContinueToPay,
    quotes,
    onrampDestination,
    aggregateAllocations,
    selectedRowId,
    displayRowsResolved,
  ]);

  return (
    <>
      <section
        className="mt-4 space-y-2 text-left"
        aria-label="Estimated amounts by token"
      >
        <p className="text-center text-xs font-medium text-muted-foreground">
          Pay with crypto (estimates)
        </p>
        {displayRowsResolved.map((row) => (
          <CheckoutQuoteRow
            key={row.id}
            label={row.label}
            iconSymbol={row.iconSymbol}
            invoiceLabel={invoiceLabel}
            state={quotes[row.id] ?? emptyQuote()}
            balanceLabel={byRowId[row.id] ?? "—"}
            balanceLoading={balLoading && walletParam.length > 0}
            token={tokenByRow.get(row.id) ?? null}
            chain={chainFromList(chains, row.balanceChainId)}
            selected={selectedRowId === row.id}
            onSelect={() => setSelectedRowId(row.id)}
          />
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-2 w-full border-white/15"
          onClick={() => setModalOpen(true)}
        >
          More tokens
        </Button>
        {paymentFlow === "morapay" ? (
          <div className="mt-3 space-y-2 text-left">
            <label className="sr-only" htmlFor="checkout-morapay-email">
              Email for receipt
            </label>
            <Input
              id="checkout-morapay-email"
              type="email"
              name="payer-email"
              autoComplete="email"
              placeholder="Email for receipt"
              value={morapayEmail}
              onChange={(e) => setMorapayEmail(e.target.value)}
              disabled={morapayLoading}
              className="border-white/15 bg-background/40"
            />
            {morapayError ? (
              <p className="text-xs text-destructive" role="alert">
                {morapayError}
              </p>
            ) : null}
          </div>
        ) : null}
        {paymentFlow === "onramp" && onrampDestination ? (
          <p className="mt-2 text-center text-xs text-muted-foreground">
            {onrampDestination === "pay-business"
              ? "Onramp: pay via business (next: connect provider)."
              : "Onramp: fund your wallet, then pay with Tokens above."}
          </p>
        ) : null}
        {paymentFlow === "aggregate" && aggregateAllocations?.length ? (
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Aggregate split ready ({aggregateAllocations.length} legs). Wallet
            signing will be added with your provider.
          </p>
        ) : null}
        <Button
          type="button"
          size="lg"
          className="mt-3 w-full rounded-xl py-6 font-semibold"
          disabled={morapayLoading}
          onClick={() => void handleContinue()}
        >
          {morapayLoading ? "Redirecting…" : "Continue to pay"}
        </Button>
      </section>
      <TransferSelectModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        chains={chains}
        tokens={tokens}
        onSelect={handleModalSelect}
        invoiceChargeKind={chargeKindNormalized}
        onMorapayOfframpSelect={() => {
          setPaymentFlow("morapay");
          setMorapayError(null);
          setAggregateAllocations(null);
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
      />
    </>
  );
}

function emptyQuote(): PayoutQuoteRowState {
  return {
    loading: false,
    error: null,
    cryptoAmount: null,
    cryptoSymbol: null,
  };
}

function CheckoutQuoteRow({
  label,
  iconSymbol,
  invoiceLabel,
  state,
  balanceLabel,
  balanceLoading,
  token,
  chain,
  selected,
  onSelect,
}: {
  label: string;
  iconSymbol: string;
  invoiceLabel: string;
  state: PayoutQuoteRowState;
  balanceLabel: string;
  balanceLoading: boolean;
  token: Token | null;
  chain: Chain | undefined;
  selected: boolean;
  onSelect: () => void;
}) {
  const fallbackToken: Token | null =
    token ??
    (chain
      ? ({
          id: `fallback-${chain.id}-${iconSymbol}`,
          symbol: iconSymbol,
          name: label,
          chainId: chain.id,
          logoURI: undefined,
        } as Token)
      : null);

  return (
    <article
      className={cn(
        "rounded-lg border px-3 py-2.5 transition-colors",
        selected
          ? "border-primary/70 bg-primary/10 ring-1 ring-primary/30"
          : "border-white/10 bg-white/5"
      )}
    >
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={selected}
        className="flex w-full cursor-pointer items-start justify-between gap-3 text-left"
      >
        <div className="flex min-w-0 flex-1 gap-2.5">
          <TokenIconWithChainBadge
            token={fallbackToken}
            chain={chain}
            size={40}
            className="mt-0.5"
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground">{label}</p>
            <p className="text-[0.65rem] uppercase tracking-wide text-muted-foreground">
              Balance
            </p>
            {balanceLoading ? (
              <Skeleton className="mt-0.5 h-4 w-24" />
            ) : (
              <p className="text-xs tabular-nums text-foreground">
                {balanceLabel}
              </p>
            )}
          </div>
        </div>
        <div className="shrink-0 text-right">
          {state.loading ? (
            <Skeleton className="h-6 w-24" />
          ) : state.error && !state.cryptoAmount ? (
            <p className="max-w-40 text-xs text-destructive">{state.error}</p>
          ) : state.cryptoAmount != null ? (
            <p className="text-base font-semibold tabular-nums text-foreground">
              {state.cryptoAmount}{" "}
              <span className="text-sm font-normal text-muted-foreground">
                {state.cryptoSymbol ?? ""}
              </span>
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">—</p>
          )}
          <p className="mt-1 text-xs font-medium tabular-nums text-muted-foreground">
            {invoiceLabel}
          </p>
        </div>
      </button>
    </article>
  );
}
