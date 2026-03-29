/**
 * Payer-safe swap quote: no raw calldata, permit payloads, or provider internals.
 */
export function toPayerSwapQuoteData(data: unknown): unknown {
  if (!data || typeof data !== "object") return data;
  const d = data as Record<string, unknown>;
  return {
    provider: d.provider,
    from_chain_id: d.from_chain_id,
    to_chain_id: d.to_chain_id,
    cross_chain: d.cross_chain,
    same_chain: d.same_chain,
    token_type: d.token_type,
    from_amount: d.from_amount,
    to_amount: d.to_amount,
    next_quote_timer_seconds: d.next_quote_timer_seconds,
    estimated_duration_seconds: d.estimated_duration_seconds,
  };
}
