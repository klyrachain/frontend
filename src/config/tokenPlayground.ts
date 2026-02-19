import type {
  PlaygroundTokenConfig,
  PlaygroundTokenInstance,
} from "@/types/tokenPlayground";

const POOL_WIDTH = 24;
const POOL_DEPTH = 6;

export function getInitialTokens(count?: number): PlaygroundTokenInstance[] {
  const n = count ?? TOKEN_CONFIGS.length * 6;
  const positions: [number, number, number][] = [];
  for (let i = 0; i < n; i++) {
    const x = (Math.random() - 0.5) * POOL_WIDTH;
    const z = (Math.random() - 0.5) * POOL_DEPTH;
    positions.push([x, 0.15, z]);
  }
  return positions.map((position, i) => ({
    id: `initial-${TOKEN_CONFIGS[i % TOKEN_CONFIGS.length]?.id ?? "unknown"}-${i}`,
    configId: TOKEN_CONFIGS[i % TOKEN_CONFIGS.length]?.id ?? "eth",
    position,
  }));
}

export const TOKEN_CONFIGS: PlaygroundTokenConfig[] = [
  {
    id: "btc",
    symbol: "BTC",
    name: "Bitcoin",
    type: "crypto",
    color: "#f7931a",
    metalness: 0.9,
    roughness: 0.2,
  },
  {
    id: "eth",
    symbol: "ETH",
    name: "Ethereum",
    type: "crypto",
    color: "#627eea",
    metalness: 0.85,
    roughness: 0.25,
  },
  {
    id: "sol",
    symbol: "SOL",
    name: "Solana",
    type: "crypto",
    color: "#00ffa3",
    metalness: 0.7,
    roughness: 0.3,
  },
  {
    id: "ghs",
    symbol: "GHS",
    name: "Ghanaian Cedi",
    type: "fiat",
    color: "#cd7f32",
    metalness: 0.8,
    roughness: 0.35,
  },
  {
    id: "usd",
    symbol: "USD",
    name: "US Dollar",
    type: "fiat",
    color: "#228b22",
    metalness: 0.75,
    roughness: 0.3,
  },
  {
    id: "ngn",
    symbol: "NGN",
    name: "Nigerian Naira",
    type: "fiat",
    color: "#008751",
    metalness: 0.7,
    roughness: 0.4,
  },
];

export const getTokenConfigById = (id: string): PlaygroundTokenConfig | undefined =>
  TOKEN_CONFIGS.find((c) => c.id === id);
