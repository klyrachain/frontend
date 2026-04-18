/**
 * Payer-safe quote shape: no debug, fees, or provider pricing (from Core pricing engine).
 */
export function toPayerQuoteData(data: unknown): unknown {
  if (!data || typeof data !== "object") return data;
  const d = data as Record<string, unknown>;
  const out =
    d.output && typeof d.output === "object"
      ? (d.output as Record<string, unknown>)
      : {};
  const inn =
    d.input && typeof d.input === "object"
      ? (d.input as Record<string, unknown>)
      : {};
  return {
    quoteId: d.quoteId,
    expiresAt: d.expiresAt,
    input: {
      amount: inn.amount,
      currency: inn.currency,
      ...(typeof inn.chain === "string" && inn.chain ? { chain: inn.chain } : {}),
    },
    output: { amount: out.amount, currency: out.currency, chain: out.chain },
  };
}
