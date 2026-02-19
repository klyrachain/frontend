export interface Chain {
  id: string;
  name: string;
  shortName?: string;
}

export interface Token {
  id: string;
  symbol: string;
  name: string;
  chainId: string;
  /** Optional logo URL from backend (e.g. Squid / tokens API). */
  logoURI?: string;
}
