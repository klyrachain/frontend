import type { Chain, Token } from "@/types/token";

export const CHAINS: Chain[] = [
  { id: "ethereum", name: "Ethereum", shortName: "ETH" },
  { id: "base", name: "Base", shortName: "Base" },
  { id: "optimism", name: "OP Mainnet", shortName: "OP" },
  { id: "arbitrum", name: "Arbitrum One", shortName: "ARB" },
  { id: "polygon", name: "Polygon", shortName: "MATIC" },
];

export const TOKENS: Token[] = [
  { id: "eth-ethereum", symbol: "ETH", name: "Ethereum", chainId: "ethereum" },
  { id: "usdc-ethereum", symbol: "USDC", name: "USD Coin", chainId: "ethereum" },
  { id: "usdt-ethereum", symbol: "USDT", name: "Tether USD", chainId: "ethereum" },
  { id: "weth-ethereum", symbol: "WETH", name: "Wrapped Ether", chainId: "ethereum" },
  { id: "eth-base", symbol: "ETH", name: "Ethereum", chainId: "base" },
  { id: "usdc-base", symbol: "USDC", name: "USD Coin", chainId: "base" },
  { id: "eth-optimism", symbol: "ETH", name: "Ethereum", chainId: "optimism" },
  { id: "usdc-optimism", symbol: "USDC", name: "USD Coin", chainId: "optimism" },
  { id: "eth-arbitrum", symbol: "ETH", name: "Ethereum", chainId: "arbitrum" },
  { id: "usdc-arbitrum", symbol: "USDC", name: "USD Coin", chainId: "arbitrum" },
  { id: "matic-polygon", symbol: "MATIC", name: "Polygon", chainId: "polygon" },
  { id: "usdc-polygon", symbol: "USDC", name: "USD Coin", chainId: "polygon" },
];

export function getTokensByChain(chainId: string): Token[] {
  return TOKENS.filter((t) => t.chainId === chainId);
}

export function getChainById(chainId: string): Chain | undefined {
  return CHAINS.find((c) => c.id === chainId);
}
