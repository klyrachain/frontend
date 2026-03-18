import type { TokenSelection } from "@/components/Exchange/TokenChainSelectModal";
import type { Chain, Token } from "@/types/token";
import type { UsedTokenEntry } from "@/store/slices/usedTokensSlice";
import { getChainById as getStaticChainById } from "@/config/chainsAndTokens";

export function getChainByIdFromList(
  chains: Chain[],
  chainId: string
): Chain | undefined {
  return chains.find((c) => c.id === chainId);
}

export function buildSuggestedTokenSelections(
  usedEntries: UsedTokenEntry[],
  chains: Chain[],
  tokens: Token[]
): TokenSelection[] {
  const out: TokenSelection[] = [];
  for (const e of usedEntries) {
    const chain =
      getChainByIdFromList(chains, e.chainId) ?? getStaticChainById(e.chainId);
    const token = tokens.find((t) => t.id === e.tokenId);
    if (chain && token) out.push({ chain, token });
  }
  return out;
}

export function isValidPositiveAmount(value: string): boolean {
  const normalized = value.trim().replace(",", ".");
  if (normalized === "") return false;
  const n = Number(normalized);
  return Number.isFinite(n) && n > 0;
}
