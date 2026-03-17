"use client";

import { useState, useEffect, useRef } from "react";
import { fetchKlyraQuote, type KlyraQuoteResponse } from "@/lib/klyraQuote";
import type { TokenSelection } from "@/components/Exchange/TokenChainSelectModal";

const DEBOUNCE_MS = 400;

export interface UseTransferQuoteParams {
  fromSelection: TokenSelection | null;
  toSelection: TokenSelection | null;
  inputAmount: string;
}

export interface UseTransferQuoteResult {
  quote: KlyraQuoteResponse | null;
  outputAmount: string | null;
  isLoading: boolean;
  error: string | null;
}

function parseOutputAmount(quote: KlyraQuoteResponse | null): string | null {
  if (!quote?.output?.amount) return null;
  const amount = quote.output.amount;
  if (typeof amount === "string" && amount.trim() !== "") return amount.trim();
  if (typeof amount === "number" && Number.isFinite(amount)) return String(amount);
  return null;
}

export function useTransferQuote({
  fromSelection,
  toSelection,
  inputAmount,
}: UseTransferQuoteParams): UseTransferQuoteResult {
  const [quote, setQuote] = useState<KlyraQuoteResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const chainId = fromSelection?.chain?.id?.trim();
    const canFetch =
      fromSelection &&
      toSelection &&
      chainId != null &&
      chainId !== "" &&
      inputAmount.trim() !== "" &&
      parseFloat(inputAmount) > 0 &&
      fromSelection.token.id !== toSelection.token.id;

    if (!canFetch) {
      setQuote(null);
      setError(null);
      return;
    }

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }

    debounceRef.current = setTimeout(async () => {
      debounceRef.current = null;
      setIsLoading(true);
      setError(null);
      try {
        const request = {
          action: "SWAP" as const,
          inputAmount: inputAmount.trim(),
          inputCurrency: fromSelection.token.symbol,
          outputCurrency: toSelection.token.symbol,
          chain: chainId,
          inputSide: "from" as const,
        };
        const response = await fetchKlyraQuote(request);
        setQuote(response);
      } catch (err) {
        setQuote(null);
        setError(err instanceof Error ? err.message : "Failed to get quote");
      } finally {
        setIsLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
    };
  }, [fromSelection?.token.id, fromSelection?.chain?.id, toSelection?.token.id, inputAmount]);

  const outputAmount = parseOutputAmount(quote);

  return { quote, outputAmount, isLoading, error };
}
