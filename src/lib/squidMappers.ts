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
    .filter((c) => c.chainId != null && chainIdToString(c.chainId) !== "")
    .map((c) => {
      const id = chainIdToString(c.chainId);
      const name =
        (c.chainName ?? c.networkName ?? c.nativeCurrency?.name ?? id) || "Unknown";
      const shortName =
        c.shortName ?? c.nativeCurrency?.symbol ?? name.slice(0, 8);
      const chainIconURI = normalizeIconUri(
        c.chainIconURI ?? (c as { chainIconUri?: string }).chainIconUri
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
      (t) =>
        t.chainId != null &&
        chainIdToString(t.chainId) !== "" &&
        (t.symbol ?? t.address)
    )
    .map((t) => {
      const chainId = chainIdToString(t.chainId);
      const symbol = t.symbol ?? "?";
      const name = t.name ?? symbol;
      const address = t.address ?? "";
      const normalizedAddress = normalizeAddressForChain(chainId, address);
      const logoURI = normalizeIconUri(t.logoURI);
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
