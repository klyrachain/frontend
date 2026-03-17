/**
 * Response shapes for backend Squid proxy:
 * GET /api/squid/chains, GET /api/squid/tokens
 * See: https://github.com/morapaychain/backend/blob/main/API.md
 */

export interface SquidChainNativeCurrency {
  name?: string;
  symbol?: string;
  decimals?: number;
  icon?: string;
}

export interface SquidChain {
  chainId?: number | string;
  chainName?: string;
  networkName?: string;
  shortName?: string;
  nativeCurrency?: SquidChainNativeCurrency;
}

export interface SquidChainsResponse {
  chains?: SquidChain[];
  data?: { chains?: SquidChain[] };
}

export interface SquidToken {
  chainId?: number | string;
  address?: string;
  name?: string;
  symbol?: string;
  decimals?: number;
  logoURI?: string;
  commonKey?: string;
}

export interface SquidTokensResponse {
  tokens?: SquidToken[];
  data?: { tokens?: SquidToken[] };
}
