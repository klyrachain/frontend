/**
 * Checkout / Squid chain IDs that are not EVM (wagmi `switchChain` does not apply).
 * Extend as you add non-EVM routes.
 */
const NON_EVM_CHECKOUT_CHAIN_IDS = new Set(["101", "148"]);

export function isNonEvmCheckoutChainId(chainId: string | undefined | null): boolean {
  return NON_EVM_CHECKOUT_CHAIN_IDS.has((chainId ?? "").trim());
}

/**
 * Match Dynamic `wallet.chain` to our balance chain id / API chain name.
 */
export function walletMatchesCheckoutChain(
  walletChain: string,
  targetChainId: string,
  targetChainName?: string
): boolean {
  const wc = walletChain.toLowerCase();
  const tid = targetChainId.trim();
  const name = (targetChainName ?? "").toLowerCase();
  if (tid === "101" || name.includes("solana")) {
    return wc.includes("sol");
  }
  if (tid === "148" || name.includes("stellar")) {
    return wc.includes("stell") || wc.includes("xlm");
  }
  return false;
}

export function isLikelyDynamicEvmChain(walletChain: string | undefined | null): boolean {
  const c = (walletChain ?? "").trim().toLowerCase();
  return c === "evm";
}
