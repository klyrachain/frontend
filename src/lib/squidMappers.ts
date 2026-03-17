import type { Chain, Token } from "@/types/token";
import type { SquidChain, SquidToken } from "@/types/squidApi";

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
      const chainIconURI =
        c.chainIconURI ?? (c as { chainIconUri?: string }).chainIconUri ?? "";
      return {
        id,
        name,
        shortName,
        ...(chainIconURI !== "" ? { iconURI: chainIconURI } : {}),
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
      const id =
        address && chainId
          ? `${address.toLowerCase()}-${chainId}`
          : `${symbol}-${chainId}`.toLowerCase();
      return {
        id,
        symbol,
        name,
        chainId,
        ...(t.logoURI != null && t.logoURI !== ""
          ? { logoURI: t.logoURI }
          : {}),
      };
    });
}
