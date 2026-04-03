const CASE_SENSITIVE_CHAIN_IDS = new Set([
  "101", // Solana
  "148", // Stellar
  "8332", // Bitcoin-style ids
  "bitcoin",
  "btc",
  "stellar",
]);

function normalizeChainId(chainId: string | null | undefined): string {
  return chainId?.trim().toLowerCase() ?? "";
}

export function isCaseSensitiveChainId(chainId: string | null | undefined): boolean {
  const normalized = normalizeChainId(chainId);
  if (!normalized) return false;
  return CASE_SENSITIVE_CHAIN_IDS.has(normalized);
}

export function normalizeAddressForChain(
  chainId: string | null | undefined,
  address: string | null | undefined
): string {
  const raw = address?.trim() ?? "";
  if (!raw) return "";
  return isCaseSensitiveChainId(chainId) ? raw : raw.toLowerCase();
}

export function makeBalanceIdentityKey(
  chainId: string | null | undefined,
  tokenAddress: string | null | undefined
): string {
  const chain = chainId?.trim() ?? "";
  const token = normalizeAddressForChain(chain, tokenAddress);
  return `${chain}|${token}`;
}
