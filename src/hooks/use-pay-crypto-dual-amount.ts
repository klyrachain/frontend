"use client";

import { useEffect, useState } from "react";
import type { TokenSelection } from "@/components/Exchange/TokenChainSelectModal";
import { isUsdStablecoinSymbol } from "@/lib/stablecoin-symbols";

function isEvmNumericChainId(chainId: string): boolean {
  const n = Number.parseInt(chainId.trim(), 10);
  return Number.isFinite(n) && n > 0 && n !== 101 && n !== 148 && n !== 8332;
}

function fmtUsd(n: number): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: n >= 100 ? 0 : 2,
  }).format(n);
}

function stripTrailingZeros(s: string): string {
  return s.replace(/(\.\d*?[1-9])0+$/u, "$1").replace(/\.$/u, "");
}

function formatTokenQty(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return "";
  if (n >= 1) return stripTrailingZeros(n.toFixed(10));
  return stripTrailingZeros(n.toPrecision(12));
}

export type PayAmountFieldMode = "token" | "usd";

function readQuote(json: unknown): {
  inputAmount?: string;
  outputAmount?: string;
} | null {
  if (!json || typeof json !== "object") return null;
  if ((json as { success?: boolean }).success !== true) return null;
  const data = (json as { data?: { input?: { amount?: string }; output?: { amount?: string } } })
    .data;
  return {
    inputAmount: data?.input?.amount?.trim(),
    outputAmount: data?.output?.amount?.trim(),
  };
}

/**
 * Pay / “I want to send”: token ↔ USD notionals via `POST /api/core/v1/quotes` (SWAP vs USDC),
 * with 1:1 USD for listed stablecoins. Response amounts are what we sync into `t_amount`.
 */
export function usePayCryptoDualAmount(params: {
  selection: TokenSelection | null;
  fieldMode: PayAmountFieldMode;
  tokenAmountStr: string;
  usdAmountStr: string;
  enabled: boolean;
}): {
  supportsUsdDenom: boolean;
  loading: boolean;
  error: string | null;
  /** Non-primary side, e.g. `$12.34` or `≈ 0.05 ETH`. */
  oppositeLine: string | null;
  /** When `fieldMode === "usd"`, token quantity to charge (from quote or 1:1 stables). */
  suggestedTokenAmount: string | null;
  /** Latest USD number from token→USDC quote (seed USD field when rotating). */
  oppositeNumberUsd: number | null;
} {
  const { selection, fieldMode, tokenAmountStr, usdAmountStr, enabled } = params;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [oppositeLine, setOppositeLine] = useState<string | null>(null);
  const [suggestedTokenAmount, setSuggestedTokenAmount] = useState<string | null>(null);
  const [oppositeNumberUsd, setOppositeNumberUsd] = useState<number | null>(null);

  const sym = selection?.token.symbol.trim().toUpperCase() ?? "";
  const chainId = selection?.chain.id.trim() ?? "";
  const supportsUsdDenom =
    !!selection &&
    enabled &&
    (isUsdStablecoinSymbol(sym) || isEvmNumericChainId(chainId));

  useEffect(() => {
    if (!enabled || !selection) {
      setLoading(false);
      setError(null);
      setOppositeLine(null);
      setSuggestedTokenAmount(null);
      setOppositeNumberUsd(null);
      return;
    }

    if (!isEvmNumericChainId(chainId) && !isUsdStablecoinSymbol(sym)) {
      setLoading(false);
      setError(null);
      setOppositeLine(null);
      setSuggestedTokenAmount(null);
      setOppositeNumberUsd(null);
      return;
    }

    const ac = new AbortController();

    if (fieldMode === "token") {
      setSuggestedTokenAmount(null);
      const amt = Number.parseFloat(tokenAmountStr.trim());
      if (!Number.isFinite(amt) || amt <= 0) {
        setLoading(false);
        setError(null);
        setOppositeLine(null);
        setOppositeNumberUsd(null);
        return;
      }

      if (isUsdStablecoinSymbol(sym)) {
        setLoading(false);
        setError(null);
        setOppositeLine(fmtUsd(amt));
        setOppositeNumberUsd(amt);
        return;
      }

      const t = setTimeout(() => {
        void (async () => {
          setLoading(true);
          setError(null);
          try {
            const res = await fetch("/api/core/v1/quotes", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                action: "SWAP",
                inputAmount: tokenAmountStr.trim(),
                inputCurrency: sym,
                outputCurrency: "USDC",
                chain: chainId,
                toChain: chainId,
                inputSide: "from",
              }),
              signal: ac.signal,
            });
            const json: unknown = await res.json().catch(() => ({}));
            const q = readQuote(json);
            const out = Number.parseFloat(q?.outputAmount ?? "");
            if (!res.ok || !q?.outputAmount || !Number.isFinite(out) || out <= 0) {
              setOppositeLine(null);
              setOppositeNumberUsd(null);
              setError("USD equivalent unavailable for this pair.");
              return;
            }
            setOppositeLine(fmtUsd(out));
            setOppositeNumberUsd(out);
          } catch (e) {
            if ((e as Error).name === "AbortError") return;
            setOppositeLine(null);
            setOppositeNumberUsd(null);
            setError("Could not load USD equivalent.");
          } finally {
            if (!ac.signal.aborted) setLoading(false);
          }
        })();
      }, 450);

      return () => {
        clearTimeout(t);
        ac.abort();
      };
    }

    const usdN = Number.parseFloat(usdAmountStr.trim());
    if (!Number.isFinite(usdN) || usdN <= 0) {
      setLoading(false);
      setError(null);
      setOppositeLine(null);
      setSuggestedTokenAmount(null);
      return;
    }

    if (isUsdStablecoinSymbol(sym)) {
      setLoading(false);
      setError(null);
      const tok = stripTrailingZeros(usdN.toFixed(12));
      setSuggestedTokenAmount(tok);
      setOppositeLine(`≈ ${tok} ${sym}`);
      return;
    }

    if (!isEvmNumericChainId(chainId)) {
      setLoading(false);
      setError(null);
      setOppositeLine(null);
      setSuggestedTokenAmount(null);
      return;
    }

    const t = setTimeout(() => {
      void (async () => {
        setLoading(true);
        setError(null);
        setSuggestedTokenAmount(null);
        try {
          const res = await fetch("/api/core/v1/quotes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "SWAP",
              inputAmount: usdAmountStr.trim(),
              inputCurrency: sym,
              outputCurrency: "USDC",
              chain: chainId,
              toChain: chainId,
              inputSide: "to",
            }),
            signal: ac.signal,
          });
          const json: unknown = await res.json().catch(() => ({}));
          const q = readQuote(json);
          const pay = Number.parseFloat(q?.inputAmount ?? "");
          if (!res.ok || !q?.inputAmount || !Number.isFinite(pay) || pay <= 0) {
            setOppositeLine(null);
            setError("Could not convert this USD amount to the token — try token entry.");
            return;
          }
          const payStr = formatTokenQty(pay);
          setSuggestedTokenAmount(payStr);
          setOppositeLine(`≈ ${payStr} ${sym}`);
        } catch (e) {
          if ((e as Error).name === "AbortError") return;
          setOppositeLine(null);
          setError("Conversion failed — try again.");
        } finally {
          if (!ac.signal.aborted) setLoading(false);
        }
      })();
    }, 450);

    return () => {
      clearTimeout(t);
      ac.abort();
    };
  }, [enabled, selection, sym, chainId, fieldMode, tokenAmountStr, usdAmountStr]);

  return {
    supportsUsdDenom,
    loading,
    error,
    oppositeLine,
    suggestedTokenAmount,
    oppositeNumberUsd,
  };
}
