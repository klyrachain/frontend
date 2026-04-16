import type { Chain, Token } from "@/types/token";
import { getChainById, TOKENS } from "@/config/chainsAndTokens";

/** Map Core `Transaction.t_chain` codes to frontend `Chain.id` in `chainsAndTokens`. */
const CORE_CHAIN_TO_FRONTEND_ID: Record<string, string> = {
  ETHEREUM: "ethereum",
  BASE: "base",
  POLYGON: "polygon",
  ARBITRUM: "arbitrum",
  OPTIMISM: "optimism",
};

const CHAIN_DISPLAY: Record<string, string> = {
  ETHEREUM: "Ethereum",
  BASE: "Base",
  POLYGON: "Polygon",
  ARBITRUM: "Arbitrum",
  OPTIMISM: "Optimism",
  BNB: "BNB Smart Chain",
  SOLANA: "Solana",
  CELO: "Celo",
  AVALANCHE: "Avalanche",
  GNOSIS: "Gnosis",
  FANTOM: "Fantom",
  LINEA: "Linea",
  SCROLL: "Scroll",
  BLAST: "Blast",
  ZKSYNC: "zkSync Era",
  MATIC: "Polygon",
};

function titleCaseWords(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/** Human-readable chain name for subtitle (never provider names). */
export function displayChainNameFromCoreCode(core: string | null | undefined): string {
  if (core == null || core === "") return "";
  const up = core.trim().toUpperCase();
  if (CHAIN_DISPLAY[up]) return CHAIN_DISPLAY[up];
  return titleCaseWords(up.replace(/_/g, " "));
}

export function coreChainCodeToFrontendChainId(core: string | null | undefined): string {
  if (core == null || core === "") return "ethereum";
  const up = core.trim().toUpperCase();
  return CORE_CHAIN_TO_FRONTEND_ID[up] ?? up.toLowerCase().replace(/\s+/g, "-");
}

function findListedToken(symbolUpper: string, chainId: string): Token | null {
  const sym = symbolUpper.trim().toUpperCase();
  return TOKENS.find((t) => t.chainId === chainId && t.symbol.toUpperCase() === sym) ?? null;
}

/**
 * Token + chain for crypto payment confirmation (matches checkout token row when listed in config).
 */
export function resolveCryptoPaymentVisual(
  cryptoToken: string | null | undefined,
  cryptoChain: string | null | undefined
): { token: Token; chain: Chain } {
  const chainId = coreChainCodeToFrontendChainId(cryptoChain);
  const listed = getChainById(chainId);
  const chain: Chain =
    listed ??
    ({
      id: chainId,
      name: displayChainNameFromCoreCode(cryptoChain),
      shortName: undefined,
    } as Chain);

  const sym = (cryptoToken ?? "?").trim().toUpperCase();
  const token: Token =
    findListedToken(sym, chainId) ??
    ({
      id: `confirm-${chainId}-${sym}`,
      symbol: sym,
      name: sym,
      chainId: chain.id,
    } as Token);

  return { token, chain };
}

/**
 * Turn gateway channel codes into short labels (no provider names).
 */
export function formatPaymentChannelLabel(raw: string | null | undefined): string | null {
  if (raw == null || raw === "") return null;
  const c = raw.trim().toLowerCase().replace(/-/g, "_");
  const map: Record<string, string> = {
    card: "Card",
    bank: "Bank",
    bank_transfer: "Bank transfer",
    mobile_money: "Mobile money",
    ussd: "USSD",
    qr: "QR code",
  };
  if (map[c]) return map[c];
  return titleCaseWords(c.replace(/_/g, " "));
}
