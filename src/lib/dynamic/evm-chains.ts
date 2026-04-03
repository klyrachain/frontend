import { arbitrum, base, mainnet, optimism, polygon } from "viem/chains";

/** EVM chains aligned with checkout token support (extend as tokens grow). */
export const klyraEvmChains = [mainnet, base, optimism, arbitrum, polygon] as const;

const slugToId: Record<string, number> = {
  ethereum: mainnet.id,
  eth: mainnet.id,
  mainnet: mainnet.id,
  base: base.id,
  optimism: optimism.id,
  op: optimism.id,
  arbitrum: arbitrum.id,
  arb: arbitrum.id,
  polygon: polygon.id,
  matic: polygon.id,
};

export function getEvmChainIdFromSlug(slug: string): number | undefined {
  const k = slug.trim().toLowerCase();
  return slugToId[k];
}
