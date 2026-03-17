/**
 * Klyra quote API (POST /api/klyra/quotes).
 * See md/backend-api.md – POST /api/klyra/quotes.
 */

export interface KlyraQuoteRequest {
  action: "ONRAMP" | "OFFRAMP" | "SWAP";
  inputAmount: string;
  inputCurrency: string;
  outputCurrency: string;
  chain: string;
  inputSide?: "from" | "to";
}

export interface KlyraQuoteResponse {
  quoteId?: string;
  exchangeRate?: number | string;
  input?: { amount?: string; currency?: string };
  output?: { amount?: string; currency?: string };
  fees?: unknown;
  expiresAt?: string;
  [key: string]: unknown;
}

export async function fetchKlyraQuote(
  request: KlyraQuoteRequest
): Promise<KlyraQuoteResponse> {
  const res = await fetch("/api/klyra/quotes", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(request),
  });
  const data = (await res.json().catch(() => ({}))) as
    | KlyraQuoteResponse
    | { success?: boolean; error?: string };
  if (!res.ok) {
    const message =
      typeof (data as { error?: string }).error === "string"
        ? (data as { error: string }).error
        : "Quote request failed";
    throw new Error(message);
  }
  return data as KlyraQuoteResponse;
}
