"use client";

export type DynamicChainName = "Evm" | "Sol" | "Bitcoin";

export function inferChainNameFromAddress(address: string): DynamicChainName {
  const addr = address.trim();
  if (addr.startsWith("0x")) return "Evm";
  if (addr.toLowerCase().startsWith("bc1")) return "Bitcoin";
  return "Sol";
}

export function inferChainIdFromNetworkId(
  networkId: number | undefined,
  chainName: DynamicChainName
): string {
  if (typeof networkId === "number" && Number.isFinite(networkId)) {
    return String(networkId);
  }
  if (chainName === "Sol") return "101";
  if (chainName === "Bitcoin") return "1";
  return "";
}

