"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import type { CheckoutRowSpec } from "@/types/checkout-row-spec";

export type PayoutQuoteRowState = {
  loading: boolean;
  error: string | null;
  cryptoAmount: string | null;
  cryptoSymbol: string | null;
};

type CheckoutRowPayload = {
  id?: string;
  cryptoAmount?: string | null;
  cryptoSymbol?: string | null;
  error?: string | null;
};

function emptyRowState(): PayoutQuoteRowState {
  return {
    loading: false,
    error: null,
    cryptoAmount: null,
    cryptoSymbol: null,
  };
}

export function useCheckoutPayoutQuotes(
  enabled: boolean,
  fiatAmount: string | null,
  fiatCurrency: string | null,
  evmWalletAddress: string | null,
  rowSpecs: CheckoutRowSpec[]
): Record<string, PayoutQuoteRowState> {
  const [rows, setRows] = useState<Record<string, PayoutQuoteRowState>>({});

  const rowSig = rowSpecs
    .map((r) =>
      [
        r.id,
        r.kind,
        "chain" in r ? r.chain : "",
        "symbol" in r ? r.symbol : "",
        "tokenAddress" in r ? (r.tokenAddress ?? "") : "",
      ].join(":")
    )
    .join("|");
  const fiatSig = `${fiatAmount?.trim() ?? ""}|${fiatCurrency?.trim() ?? ""}|${evmWalletAddress ?? ""}`;

  const run = useCallback(
    async (partialRefetchIds: string[] | null) => {
      if (!fiatAmount?.trim() || !fiatCurrency?.trim()) {
        return;
      }

      const inputAmount = fiatAmount.trim();
      const inputCurrency = fiatCurrency.trim().toUpperCase();

      setRows((prev) => {
        const next = { ...prev };
        const targetIds =
          partialRefetchIds != null && partialRefetchIds.length > 0
            ? partialRefetchIds
            : rowSpecs.map((r) => r.id);
        for (const id of targetIds) {
          next[id] = {
            ...(next[id] ?? emptyRowState()),
            loading: true,
            error: null,
          };
        }
        return next;
      });

      const body: Record<string, unknown> = {
        inputAmount,
        inputCurrency,
        rows: rowSpecs,
      };
      const w = evmWalletAddress?.trim();
      if (w?.startsWith("0x") && w.length >= 42) {
        body.fromAddress = w;
      }
      if (partialRefetchIds != null && partialRefetchIds.length > 0) {
        body.refetchRowIds = partialRefetchIds;
      }

      try {
        const res = await fetch("/api/core/v1/quotes/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const json = (await res.json()) as {
          success?: boolean;
          data?: { rows?: CheckoutRowPayload[] };
        };

        setRows((prev) => {
          const next = { ...prev };
          const incoming = Array.isArray(json.data?.rows) ? json.data!.rows! : [];
          const targetIds =
            partialRefetchIds != null && partialRefetchIds.length > 0
              ? partialRefetchIds
              : rowSpecs.map((r) => r.id);

          if (!res.ok || json.success !== true) {
            const erroredIncomingIds = new Set<string>();
            for (const r of incoming) {
              const id = r.id?.trim() ?? "";
              if (!id) continue;
              erroredIncomingIds.add(id);
              next[id] = {
                loading: false,
                error: "Quote unavailable",
                cryptoAmount: null,
                cryptoSymbol: null,
              };
            }
            for (const id of targetIds) {
              if (erroredIncomingIds.has(id)) continue;
              next[id] = {
                ...(next[id] ?? emptyRowState()),
                loading: false,
                error: "Quote unavailable",
                cryptoAmount: null,
                cryptoSymbol: null,
              };
            }
            return next;
          }

          for (const row of incoming) {
            const id = row.id?.trim();
            if (!id) continue;
            if (row.error) {
              next[id] = {
                loading: false,
                error: String(row.error),
                cryptoAmount: null,
                cryptoSymbol: null,
              };
            } else if (row.cryptoAmount != null && row.cryptoAmount !== "") {
              next[id] = {
                loading: false,
                error: null,
                cryptoAmount: row.cryptoAmount,
                cryptoSymbol: row.cryptoSymbol ?? null,
              };
            } else {
              next[id] = {
                loading: false,
                error: "Quote unavailable",
                cryptoAmount: null,
                cryptoSymbol: null,
              };
            }
          }
          return next;
        });
      } catch {
        setRows((prev) => {
          const next = { ...prev };
          const ids =
            partialRefetchIds != null && partialRefetchIds.length > 0
              ? partialRefetchIds
              : rowSpecs.map((r) => r.id);
          for (const id of ids) {
            next[id] = {
              loading: false,
              error: "Quote unavailable",
              cryptoAmount: null,
              cryptoSymbol: null,
            };
          }
          return next;
        });
      }
    },
    [fiatAmount, fiatCurrency, evmWalletAddress, rowSpecs]
  );

  const runRef = useRef(run);
  runRef.current = run;

  const prevFiatSigRef = useRef<string | null>(null);
  const prevRowSigRef = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled || !fiatAmount?.trim() || !fiatCurrency?.trim()) {
      setRows({});
      prevFiatSigRef.current = null;
      prevRowSigRef.current = null;
      return;
    }

    const fiatChanged =
      prevFiatSigRef.current !== null && prevFiatSigRef.current !== fiatSig;
    prevFiatSigRef.current = fiatSig;

    const prevRow = prevRowSigRef.current;
    const rowChanged = prevRow !== null && prevRow !== rowSig;

    if (fiatChanged) {
      prevRowSigRef.current = rowSig;
      void runRef.current(null);
      return;
    }

    if (prevRow === null) {
      prevRowSigRef.current = rowSig;
      void runRef.current(null);
      return;
    }

    if (!rowChanged) {
      return;
    }

    prevRowSigRef.current = rowSig;

    const prevIds = new Set(prevRow.split("|").filter(Boolean));
    const newIds = rowSpecs.map((r) => r.id);
    const added = newIds.filter((id) => !prevIds.has(id));
    const prevCount = prevRow.split("|").filter(Boolean).length;

    if (added.length === 1 && newIds.length === prevCount) {
      void runRef.current([added[0]!]);
    } else {
      void runRef.current(null);
    }
  }, [enabled, fiatAmount, fiatCurrency, fiatSig, rowSig, rowSpecs]);

  useEffect(() => {
    if (!enabled || !fiatAmount?.trim() || !fiatCurrency?.trim()) {
      return;
    }
    const intervalMs = 30_000;
    const tick = () => {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") {
        return;
      }
      void runRef.current(null);
    };
    const id = window.setInterval(tick, intervalMs);
    return () => window.clearInterval(id);
  }, [enabled, fiatAmount, fiatCurrency, fiatSig]);

  return rows;
}
