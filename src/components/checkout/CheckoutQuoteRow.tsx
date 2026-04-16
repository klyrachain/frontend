"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { Token, Chain } from "@/types/token";
import { TokenIconWithChainBadge } from "@/components/Token/TokenIconWithChainBadge";
import type { PayoutQuoteRowState } from "@/hooks/use-checkout-payout-quotes";

export function emptyCheckoutQuote(): PayoutQuoteRowState {
  return {
    loading: false,
    error: null,
    cryptoAmount: null,
    cryptoSymbol: null,
  };
}

export function CheckoutQuoteRow({
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
          ? "border-primary bg-primary/15 ring-2 ring-primary/40"
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
            <p
              className="truncate text-sm font-medium text-foreground"
              title={label.length > 40 ? label : undefined}
            >
              {label}
            </p>
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
