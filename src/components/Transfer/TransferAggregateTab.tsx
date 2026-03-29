"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  computeAggregatePlan,
  parseQuoteAmount,
  type AggregateAllocation,
  type AggregateQuoteRowInput,
} from "@/lib/aggregate-payment-plan";
import type { Chain, Token } from "@/types/token";
import { TokenIconWithChainBadge } from "@/components/Token/TokenIconWithChainBadge";

const INITIAL_VISIBLE = 4;

export type AggregateRowView = {
  rowId: string;
  label: string;
  iconSymbol: string;
  balanceLabel: string;
  quoteCrypto: string | null;
  quoteSymbol: string | null;
  chainId: string;
};

export type TransferAggregateTabProps = {
  walletAddress: string | null;
  invoiceLabel: string;
  rows: AggregateRowView[];
  tokens: Token[];
  chains: Chain[];
  onApply: (allocations: AggregateAllocation[]) => void;
};

function parseBalanceHuman(raw: string): number {
  const t = raw.trim();
  if (t === "" || t === "—" || t === "-") return NaN;
  const n = parseFloat(t.replace(/,/g, ""));
  return Number.isFinite(n) ? n : NaN;
}

function chainFromId(chains: Chain[], chainId: string): Chain | undefined {
  return chains.find((c) => c.id === chainId);
}

function findTokenForAggregate(
  tokens: Token[],
  chainId: string,
  iconSymbol: string
): Token | null {
  const upper = iconSymbol.toUpperCase();
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

export function TransferAggregateTab({
  walletAddress,
  invoiceLabel,
  rows,
  tokens,
  chains,
  onApply,
}: TransferAggregateTabProps) {
  const [expanded, setExpanded] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const inputs: AggregateQuoteRowInput[] = useMemo(() => {
    const out: AggregateQuoteRowInput[] = [];
    for (const r of rows) {
      const q = parseQuoteAmount(r.quoteCrypto);
      const b = parseBalanceHuman(r.balanceLabel);
      if (!Number.isFinite(q) || !Number.isFinite(b)) continue;
      out.push({
        rowId: r.rowId,
        quoteFullInvoiceCrypto: q,
        balanceHuman: b,
        symbol: r.quoteSymbol ?? r.label,
      });
    }
    return out;
  }, [rows]);

  useEffect(() => {
    setSelected(new Set(inputs.map((i) => i.rowId)));
  }, [inputs]);

  const mergedAllocations = useMemo(() => {
    const filtered = inputs.filter((i) => selected.has(i.rowId));
    return computeAggregatePlan(filtered, { maxAssets: 8 });
  }, [inputs, selected]);

  const toggle = useCallback((rowId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(rowId)) next.delete(rowId);
      else next.add(rowId);
      return next;
    });
  }, []);

  const coverage = useMemo(() => {
    return mergedAllocations.reduce((acc, a) => acc + a.coverFraction, 0);
  }, [mergedAllocations]);

  const sortedRows = useMemo(() => {
    return [...rows].sort((a, b) => {
      const ba = parseBalanceHuman(a.balanceLabel);
      const bb = parseBalanceHuman(b.balanceLabel);
      if (!Number.isFinite(ba) && !Number.isFinite(bb)) return 0;
      if (!Number.isFinite(ba)) return 1;
      if (!Number.isFinite(bb)) return -1;
      return bb - ba;
    });
  }, [rows]);

  const visibleList = expanded
    ? sortedRows
    : sortedRows.slice(0, INITIAL_VISIBLE);

  if (!walletAddress?.trim()) {
    return (
      <section
        className="flex min-h-0 flex-1 flex-col px-4 py-6"
        aria-label="Aggregate"
      >
        <p className="text-sm text-muted-foreground">
          Add <span className="font-mono text-xs">?wallet=0x…</span> or your
          Solana address to the page URL to load balances for aggregation.
        </p>
      </section>
    );
  }

  return (
    <section
      className="checkout-token-scroll flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 py-6"
      aria-label="Aggregate payment"
    >
      <p className="text-sm text-muted-foreground">
        Target: <span className="font-medium text-foreground">{invoiceLabel}</span>.
        Suggested amounts use each row&apos;s quote for the full invoice and your
        live balance. Toggle rows to change the set; batching many transfers
        typically needs a dedicated contract or multiple transactions.
      </p>
      <p className="text-xs text-muted-foreground">
        Coverage: {(Math.min(1, coverage) * 100).toFixed(0)}% (quote basis).
      </p>
      <ul className="space-y-2">
        {visibleList.map((r) => {
          const token = findTokenForAggregate(tokens, r.chainId, r.iconSymbol);
          const chain = chainFromId(chains, r.chainId);
          const isOn = selected.has(r.rowId);
          const alloc = mergedAllocations.find((a) => a.rowId === r.rowId);
          return (
            <li key={r.rowId}>
              <button
                type="button"
                onClick={() => toggle(r.rowId)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition-colors",
                  isOn
                    ? "border-primary/50 bg-primary/5"
                    : "border-border bg-muted/20 hover:bg-muted/40"
                )}
              >
                <TokenIconWithChainBadge
                  token={token}
                  chain={chain}
                  size={36}
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">{r.label}</span>
                  <span className="text-xs text-muted-foreground">
                    Balance {r.balanceLabel}{" "}
                    {alloc ? (
                      <>
                        · send{" "}
                        <span className="tabular-nums">
                          {alloc.sendAmount.toFixed(4)}
                        </span>
                      </>
                    ) : null}
                  </span>
                </span>
                <span
                  className={cn(
                    "size-5 shrink-0 rounded border",
                    isOn ? "border-primary bg-primary" : "border-muted-foreground/40"
                  )}
                  aria-hidden
                />
              </button>
            </li>
          );
        })}
      </ul>
      {sortedRows.length > INITIAL_VISIBLE ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-muted-foreground"
          onClick={() => setExpanded((e) => !e)}
        >
          {expanded ? "Show fewer" : "View more balances"}
        </Button>
      ) : null}
      <Button
        type="button"
        className="mt-2"
        disabled={mergedAllocations.length === 0}
        onClick={() => onApply(mergedAllocations)}
      >
        Use selected split
      </Button>
    </section>
  );
}
