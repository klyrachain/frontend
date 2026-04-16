/**
 * Mirrors Core `CheckoutRowSpec` for POST /api/core/v1/quotes/checkout body.rows.
 */

export type CheckoutOfframpRowSpec = {
  id: string;
  kind: "offramp";
  chain: string;
  symbol: string;
  /** Contract / mint from token picker; Core uses this for pool lookup when present. */
  tokenAddress?: string;
};

export type CheckoutCompositeWxrpRowSpec = {
  id: string;
  kind: "composite_wxrp";
};

export type CheckoutRowSpec =
  | CheckoutOfframpRowSpec
  | CheckoutCompositeWxrpRowSpec;

export const DEFAULT_CHECKOUT_ROW_SPECS: CheckoutRowSpec[] = [
  { id: "base-usdc", kind: "offramp", chain: "BASE", symbol: "USDC" },
  { id: "bnb-usdc", kind: "offramp", chain: "BNB", symbol: "USDC" },
  { id: "solana-sol", kind: "offramp", chain: "SOLANA", symbol: "SOL" },
  { id: "eth-wxrp", kind: "composite_wxrp" },
];
