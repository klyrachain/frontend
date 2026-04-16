import type { Token, Chain } from "@/types/token";
import type { CheckoutRowSpec } from "@/types/checkout-row-spec";
import { DEFAULT_CHECKOUT_ROW_SPECS } from "@/types/checkout-row-spec";
import {
  CHECKOUT_PAYOUT_ROWS,
  ETHEREUM_WXRP_ADDRESS,
  type CheckoutPayoutRowConfig,
} from "@/lib/checkout-payout-options";

/**
 * When the wallet is on an EVM chain that matches a default checkout row, show that row first.
 * No-op when the chain does not match any default row (e.g. Polygon).
 */
export function reorderCheckoutRowsForEvmChain(
  specs: CheckoutRowSpec[],
  walletChainId: number | undefined
): CheckoutRowSpec[] {
  if (walletChainId == null || Number.isNaN(walletChainId)) return specs;
  const match = CHECKOUT_PAYOUT_ROWS.find(
    (r) => r.balanceChainId === String(walletChainId)
  );
  if (!match) return specs;
  const idx = specs.findIndex((s) => s.id === match.id);
  if (idx <= 0) return specs;
  const copy = [...specs];
  const [row] = copy.splice(idx, 1);
  return row ? [row, ...copy] : specs;
}

/** Map numeric chain id (Squid) → Core public-quote `chain` code. Extend as needed. */
const CHAIN_ID_TO_QUOTE_CHAIN: Record<string, string> = {
  "1": "ETHEREUM",
  "56": "BNB",
  "101": "SOLANA",
  "137": "POLYGON",
  "8453": "BASE",
  "42161": "ARBITRUM",
  "10": "OPTIMISM",
  "43114": "AVALANCHE",
  "250": "FANTOM",
  "100": "GNOSIS",
  "59144": "LINEA",
  "534352": "SCROLL",
  "81457": "BLAST",
  "5000": "MANTLE",
  "324": "ZKSYNC",
  "1101": "POLYGON_ZKEVM",
};

export function chainIdToOfframpChain(chainId: string): string | null {
  return CHAIN_ID_TO_QUOTE_CHAIN[chainId] ?? null;
}

/** Squid token id is `address-chainId` (EVM lowercased address). */
export function parseTokenAddressFromSquidId(
  token: Token
): string | null {
  const last = token.id.lastIndexOf("-");
  if (last <= 0) return null;
  const addr = token.id.slice(0, last);
  const cid = token.id.slice(last + 1);
  if (cid !== token.chainId) return null;
  return addr.length > 0 ? addr : null;
}

function normalizeEvmAddress(a: string): string {
  return a.startsWith("0x") ? a.toLowerCase() : a;
}

function shortHexLabel(addr: string): string {
  const t = addr.trim();
  if (t.startsWith("0x") && t.length > 12) {
    return `${t.slice(0, 6)}…${t.slice(-4)}`;
  }
  if (t.length > 18) return `${t.slice(0, 8)}…`;
  return t;
}

function makeCustomRowId(chainId: string, address: string): string {
  const a = address.trim();
  if (a.startsWith("0x")) return `sel-${chainId}-${normalizeEvmAddress(a)}`;
  return `sel-${chainId}-${a}`;
}

export function parseCustomRowId(
  id: string
): { chainId: string; address: string } | null {
  if (!id.startsWith("sel-")) return null;
  const rest = id.slice(4);
  const dash = rest.indexOf("-");
  if (dash <= 0) return null;
  const chainId = rest.slice(0, dash);
  const address = rest.slice(dash + 1);
  if (!chainId || !address) return null;
  return { chainId, address };
}

/**
 * After picking a token from "More tokens": selected row first; drop the previous last row;
 * dedupe so four unique rows when possible (re-add wXRP when needed).
 */
export function buildRowsAfterTokenPick(picked: CheckoutRowSpec): CheckoutRowSpec[] {
  const prior = DEFAULT_CHECKOUT_ROW_SPECS;
  const head = prior.slice(0, 3);
  const merged: CheckoutRowSpec[] = [
    picked,
    ...head.filter((r) => r.id !== picked.id),
  ];
  if (merged.length >= 4) {
    return merged.slice(0, 4);
  }
  const last = prior[3];
  if (last && !merged.some((r) => r.id === last.id)) {
    merged.push(last);
  }
  return merged.slice(0, 4);
}

function builtinSpecForPayoutRow(
  row: CheckoutPayoutRowConfig
): CheckoutRowSpec | undefined {
  return DEFAULT_CHECKOUT_ROW_SPECS.find((s) => s.id === row.id);
}

/**
 * Map modal selection → Core row spec (builtin id when same asset as defaults).
 */
export function tokenSelectionToCheckoutRowSpec(
  token: Token,
  chain: Chain
): CheckoutRowSpec {
  const addr = parseTokenAddressFromSquidId(token) ?? "";
  const cid = chain.id;

  if (
    cid === "1" &&
    addr &&
    normalizeEvmAddress(addr) === normalizeEvmAddress(ETHEREUM_WXRP_ADDRESS)
  ) {
    return { id: "eth-wxrp", kind: "composite_wxrp" };
  }

  for (const row of CHECKOUT_PAYOUT_ROWS) {
    const matchAddr =
      cid === "101"
        ? addr === row.balanceTokenAddress
        : normalizeEvmAddress(addr) ===
          normalizeEvmAddress(row.balanceTokenAddress);
    if (row.balanceChainId === cid && matchAddr) {
      const spec = builtinSpecForPayoutRow(row);
      if (spec) return spec;
    }
  }

  const qChain = chainIdToOfframpChain(cid);
  const chainCode =
    qChain ??
    (chain.shortName?.replace(/\s+/g, "_").toUpperCase().slice(0, 24) ||
      "ETHEREUM");

  const custom: CheckoutRowSpec = {
    id: makeCustomRowId(cid, addr || token.symbol),
    kind: "offramp",
    chain: chainCode,
    symbol: token.symbol.toUpperCase(),
  };
  if (addr.length > 0) {
    return { ...custom, tokenAddress: addr };
  }
  return custom;
}

export type CheckoutDisplayRow = CheckoutPayoutRowConfig & {
  spec: CheckoutRowSpec;
};

export function specToDisplayRow(
  spec: CheckoutRowSpec,
  tokens: Token[]
): CheckoutDisplayRow {
  const builtin = CHECKOUT_PAYOUT_ROWS.find((r) => r.id === spec.id);
  if (builtin) {
    return { spec, ...builtin, id: spec.id };
  }
  if (spec.kind === "composite_wxrp") {
    const wx = CHECKOUT_PAYOUT_ROWS.find((r) => r.id === "eth-wxrp")!;
    return { spec, ...wx, id: spec.id };
  }

  const parsed = parseCustomRowId(spec.id);
  if (parsed) {
    const { chainId, address } = parsed;
    const want =
      chainId === "101" ? address : normalizeEvmAddress(address);
    const token =
      tokens.find((t) => {
        if (t.chainId !== chainId) return false;
        const got = parseTokenAddressFromSquidId(t);
        if (!got) return false;
        return chainId === "101"
          ? got === address
          : normalizeEvmAddress(got) === want;
      }) ?? null;
    const rawSym = token?.symbol ?? spec.symbol;
    const sym =
      rawSym && /^0x[a-fA-F0-9]{20,}$/.test(rawSym.trim())
        ? shortHexLabel(rawSym.trim())
        : rawSym;
    return {
      spec,
      id: spec.id,
      label: sym,
      iconSymbol: token?.symbol ?? spec.symbol,
      balanceChainId: chainId,
      balanceTokenAddress: address,
    };
  }

  return {
    spec,
    id: spec.id,
    label: spec.symbol,
    iconSymbol: spec.symbol,
    balanceChainId: "",
    balanceTokenAddress: "",
  };
}
