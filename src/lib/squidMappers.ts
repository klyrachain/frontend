import type { Chain, Token } from "@/types/token";
import type { SquidChain, SquidToken } from "@/types/squidApi";
import { normalizeAddressForChain } from "@/lib/balances/address-normalization";

function pickChains(raw: SquidChain[]): SquidChain[] {
  return Array.isArray(raw) ? raw : [];
}

function pickTokens(raw: SquidToken[]): SquidToken[] {
  return Array.isArray(raw) ? raw : [];
}

function chainIdToString(id: number | string | undefined): string {
  if (id == null) return "";
  if (typeof id === "number" && Number.isFinite(id)) return String(id);
  if (typeof id === "string" && id !== "") return id;
  return "";
}

function dynamicSpriteChainIcon(anchor: string): string {
  if (anchor === "stellar") {
    return "https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/xlm.png";
  }
  if (anchor === "bitcoin") {
    return "https://assets.coingecko.com/coins/images/1/standard/bitcoin.png?1696501400";
  }
  return "";
}

function normalizeIconUri(input: string | undefined): string {
  const raw = input?.trim() ?? "";
  if (!raw) return "";
  if (raw.startsWith("https://github.com/") && raw.includes("/tree/")) {
    return raw
      .replace("https://github.com/", "https://raw.githubusercontent.com/")
      .replace("/tree/", "/");
  }
  return raw;
}

function isBitcoinLikeSymbol(symbol: string): boolean {
  const s = symbol.trim().toUpperCase();
  return s === "BTC" || s === "WBTC" || s === "BTCB" || s === "XBT";
}

function inferChainIconFallback(chainName: string, chainId: string): string {
  const normalizedName = chainName.trim().toLowerCase();
  const normalizedId = chainId.trim().toLowerCase();
  if (normalizedName.includes("stellar") || normalizedId === "148") {
    return dynamicSpriteChainIcon("stellar");
  }
  if (normalizedName.includes("bitcoin") || normalizedId === "8332" || normalizedId === "btc") {
    return dynamicSpriteChainIcon("bitcoin");
  }
  return "";
}

/**
 * Maps backend Squid chains response to app Chain[].
 * Accepts { data: { chains } }, { chains }, or raw array.
 */
export function mapSquidChainsToChains(
  response: { chains?: SquidChain[]; data?: { chains?: SquidChain[] } } | SquidChain[] = {}
): Chain[] {
  const raw = Array.isArray(response)
    ? response
    : (response?.data?.chains ?? response?.chains ?? []);
  const list = pickChains(raw);
  return list
    .filter(
      (squidChain) =>
        squidChain.chainId != null && chainIdToString(squidChain.chainId) !== ""
    )
    .map((squidChain) => {
      const id = chainIdToString(squidChain.chainId);
      const name =
        (squidChain.chainName ??
          squidChain.networkName ??
          squidChain.nativeCurrency?.name ??
          id) || "Unknown";
      const shortName =
        squidChain.shortName ??
        squidChain.nativeCurrency?.symbol ??
        name.slice(0, 8);
      const chainIconURI = normalizeIconUri(
        squidChain.chainIconURI ??
          (squidChain as { chainIconUri?: string }).chainIconUri
      );
      const fallbackChainIcon =
        chainIconURI === "" ? inferChainIconFallback(name, id) : "";
      return {
        id,
        name,
        shortName,
        ...((chainIconURI !== "" ? chainIconURI : fallbackChainIcon) !== ""
          ? { iconURI: chainIconURI !== "" ? chainIconURI : fallbackChainIcon }
          : {}),
      };
    });
}

/**
 * Maps backend Squid tokens response to app Token[] (with logoURI when present).
 * Accepts { data: { tokens } }, { tokens }, or raw array.
 */
export function mapSquidTokensToTokens(
  response: { tokens?: SquidToken[]; data?: { tokens?: SquidToken[] } } | SquidToken[] = {}
): Token[] {
  const raw = Array.isArray(response)
    ? response
    : (response?.data?.tokens ?? response?.tokens ?? []);
  const list = pickTokens(raw);
  return list
    .filter(
      (squidToken) =>
        squidToken.chainId != null &&
        chainIdToString(squidToken.chainId) !== "" &&
        (squidToken.symbol ?? squidToken.address)
    )
    .map((squidToken) => {
      const chainId = chainIdToString(squidToken.chainId);
      const symbol = squidToken.symbol ?? "?";
      const name = squidToken.name ?? symbol;
      const address = squidToken.address ?? "";
      const normalizedAddress = normalizeAddressForChain(chainId, address);
      const logoURI = normalizeIconUri(squidToken.logoURI);
      const bitcoinFallbackLogo =
        isBitcoinLikeSymbol(symbol) &&
        (logoURI === "" || logoURI.includes("sprite.svg#bitcoin"))
          ? "https://assets.coingecko.com/coins/images/1/standard/bitcoin.png?1696501400"
          : "";
      const id =
        address && chainId
          ? `${normalizedAddress}-${chainId}`
          : `${symbol}-${chainId}`.toLowerCase();
      return {
        id,
        symbol,
        name,
        chainId,
        ...((logoURI !== "" ? logoURI : bitcoinFallbackLogo) !== ""
          ? { logoURI: logoURI !== "" ? logoURI : bitcoinFallbackLogo }
          : {}),
      };
    });
}
