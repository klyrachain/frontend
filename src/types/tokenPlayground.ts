export type PlaygroundTokenType = "crypto" | "fiat";

export type TokenRole = "background" | "swap_from" | "swap_to";

export interface PlaygroundTokenConfig {
  id: string;
  symbol: string;
  name: string;
  type: PlaygroundTokenType;
  color: string;
  metalness: number;
  roughness: number;
}

export interface PlaygroundTokenInstance {
  id: string;
  configId: string;
  position: [number, number, number];
}
