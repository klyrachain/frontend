import type { TokenSelection } from "@/components/Exchange/TokenChainSelectModal";
import { getEvmChainIdFromSlug } from "@/lib/dynamic/evm-chains";

/**
 * Resolve a viem/wagmi numeric chain id from checkout token selection.
 * Supports numeric string chain ids (Squid/Core) and slug ids (e.g. ethereum).
 */
export function getViemChainIdFromTokenSelection(sel: TokenSelection): number | undefined {
  const raw = String(sel.chain.id).trim();
  if (/^\d+$/.test(raw)) {
    return parseInt(raw, 10);
  }
  return getEvmChainIdFromSlug(raw);
}

export function isEvmTokenSelection(sel: TokenSelection): boolean {
  return getViemChainIdFromTokenSelection(sel) != null;
}
