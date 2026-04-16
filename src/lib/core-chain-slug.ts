/** Map UI chain id (e.g. from token config) to Core `t_chain` / `f_chain` codes. */

const SLUG_TO_CORE: Record<string, string> = {
  ethereum: "ETHEREUM",
  eth: "ETHEREUM",
  mainnet: "ETHEREUM",
  base: "BASE",
  optimism: "OPTIMISM",
  op: "OPTIMISM",
  arbitrum: "ARBITRUM",
  arb: "ARBITRUM",
  polygon: "POLYGON",
  matic: "POLYGON",
};

export function chainSlugToCore(slug: string): string {
  const k = slug.trim().toLowerCase();
  return SLUG_TO_CORE[k] ?? slug.trim().toUpperCase();
}
