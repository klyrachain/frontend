/**
 * Greedy allocation: cover a full invoice using multiple token balances when each token
 * has a known "full invoice" quote (crypto amount to settle 100% of the invoice in that asset).
 * Sorts by coverage efficiency (balance / quoteFull), then drains until cumulative coverage reaches 100%.
 */

export type AggregateQuoteRowInput = {
  rowId: string;
  /** Crypto amount required to pay 100% of the invoice in this asset (human units). */
  quoteFullInvoiceCrypto: number;
  /** Wallet balance in the same human units as quote. */
  balanceHuman: number;
  symbol: string;
};

export type AggregateAllocation = {
  rowId: string;
  /** Amount of this token to send (human units, same basis as quote). */
  sendAmount: number;
  /** Fraction of the invoice this row covers (0–1) when fully spent up to quote. */
  coverFraction: number;
};

const EPS = 1e-10;

export function computeAggregatePlan(
  items: AggregateQuoteRowInput[],
  options?: { maxAssets?: number }
): AggregateAllocation[] {
  const maxAssets = options?.maxAssets ?? 8;
  const usable = items.filter(
    (x) =>
      Number.isFinite(x.quoteFullInvoiceCrypto) &&
      x.quoteFullInvoiceCrypto > EPS &&
      Number.isFinite(x.balanceHuman) &&
      x.balanceHuman > EPS
  );
  const sorted = [...usable].sort((a, b) => {
    const ra = a.balanceHuman / a.quoteFullInvoiceCrypto;
    const rb = b.balanceHuman / b.quoteFullInvoiceCrypto;
    return rb - ra;
  });

  let remaining = 1;
  const out: AggregateAllocation[] = [];

  for (const x of sorted) {
    if (remaining <= EPS) break;
    if (out.length >= maxAssets) break;
    const maxCover = Math.min(1, x.balanceHuman / x.quoteFullInvoiceCrypto);
    if (maxCover <= EPS) continue;
    const take = Math.min(maxCover, remaining);
    const sendAmount = take * x.quoteFullInvoiceCrypto;
    out.push({
      rowId: x.rowId,
      sendAmount,
      coverFraction: take,
    });
    remaining -= take;
  }

  return out;
}

export function parseQuoteAmount(raw: string | null | undefined): number {
  if (raw == null || raw === "") return NaN;
  const n = parseFloat(String(raw).replace(/,/g, ""));
  return Number.isFinite(n) ? n : NaN;
}
