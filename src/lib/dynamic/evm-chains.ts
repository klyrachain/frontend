import type { EvmNetwork } from "@dynamic-labs/sdk-react-core";
import { defineChain, type Chain } from "viem";
import {
  abstract,
  abstractTestnet,
  apeChain,
  arbitrum,
  arbitrumSepolia,
  aurora,
  avalanche,
  avalancheFuji,
  base,
  baseSepolia,
  berachainTestnet,
  berachainTestnetbArtio,
  blast,
  bob,
  bobSepolia,
  bsc,
  bscTestnet,
  celo,
  celoAlfajores,
  chiliz,
  cronos,
  cronosTestnet,
  curtis,
  degen,
  eon,
  ethernity,
  fantom,
  filecoin,
  filecoinCalibration,
  flowMainnet,
  flowTestnet,
  gnosis,
  gobi,
  holesky,
  hoodi,
  ink,
  linea,
  lineaSepolia,
  lightlinkPhoenix,
  mainnet,
  mantle,
  mantleSepoliaTestnet,
  matchain,
  matchainTestnet,
  mode,
  modeTestnet,
  monad,
  monadTestnet,
  moonbaseAlpha,
  moonbeam,
  morphHolesky,
  odysseyTestnet,
  optimism,
  optimismSepolia,
  opBNB,
  opBNBTestnet,
  palm,
  plasma,
  polygon,
  polygonAmoy,
  root,
  sapphire,
  scroll,
  scrollSepolia,
  sepolia,
  shardeumSphinx,
  tempo,
  tempoAndantino,
  tempoModerato,
  sophon,
  sophonTestnet,
  stable,
  story,
  storyAeneid,
  storyOdyssey,
  storyTestnet,
  sei,
  seiTestnet,
  xdc,
  xdcTestnet,
  xLayer,
  xLayerTestnet,
  zksync,
  zksyncSepoliaTestnet,
  zora,
  zoraSepolia,
} from "viem/chains";

/** Dynamic may enable 1Money testnet; Wagmi must list the same chain id. */
const oneMoneyTestnet = defineChain({
  id: 1_212_101,
  name: "1Money Testnet",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc.testnet.1money.network"] },
  },
  blockExplorers: {
    default: {
      name: "1Money Explorer",
      url: "https://explorer.testnet.1money.network",
    },
  },
});

function dedupeById(chains: readonly Chain[]): [Chain, ...Chain[]] {
  const map = new Map<number, Chain>();
  for (const c of chains) {
    if (!map.has(c.id)) map.set(c.id, c);
  }
  const list = [...map.values()];
  const main = list.find((c) => c.id === mainnet.id) ?? list[0];
  const rest = list.filter((c) => c.id !== main.id);
  return [main, ...rest];
}

function viemChainToDynamicEvmNetwork(chain: Chain): EvmNetwork {
  const http = chain.rpcUrls.default.http;
  const rpcUrls = http.length > 0 ? [...http] : [];
  const explorerUrl = chain.blockExplorers?.default?.url;
  const blockExplorerUrls = explorerUrl ? [explorerUrl] : [];
  return {
    name: chain.name,
    chainId: chain.id,
    networkId: chain.id,
    nativeCurrency: {
      name: chain.nativeCurrency.name,
      symbol: chain.nativeCurrency.symbol,
      decimals: chain.nativeCurrency.decimals,
    },
    rpcUrls,
    iconUrls: [],
    blockExplorerUrls,
    ...(chain.testnet !== undefined ? { isTestnet: chain.testnet } : {}),
  };
}

/**
 * EVM chains for Wagmi + DynamicWagmiConnector. Includes chains commonly enabled in Dynamic
 * alongside Klyra checkout chains; deduped by chain id (mainnet first).
 */
export const klyraEvmChains = dedupeById([
  mainnet,
  base,
  optimism,
  arbitrum,
  polygon,
  sepolia,
  polygonAmoy,
  arbitrumSepolia,
  optimismSepolia,
  palm,
  aurora,
  bsc,
  bscTestnet,
  gnosis,
  baseSepolia,
  plasma,
  avalancheFuji,
  avalanche,
  celo,
  celoAlfajores,
  chiliz,
  fantom,
  flowMainnet,
  flowTestnet,
  eon,
  gobi,
  abstract,
  abstractTestnet,
  berachainTestnet,
  berachainTestnetbArtio,
  opBNB,
  opBNBTestnet,
  zksync,
  zksyncSepoliaTestnet,
  cronos,
  cronosTestnet,
  scroll,
  scrollSepolia,
  sophon,
  sophonTestnet,
  matchain,
  matchainTestnet,
  mode,
  modeTestnet,
  stable,
  moonbeam,
  moonbaseAlpha,
  zora,
  zoraSepolia,
  degen,
  blast,
  root,
  shardeumSphinx,
  oneMoneyTestnet,
  tempo,
  tempoAndantino,
  tempoModerato,
  sapphire,
  morphHolesky,
  holesky,
  hoodi,
  xdc,
  xdcTestnet,
  bob,
  bobSepolia,
  lightlinkPhoenix,
  linea,
  lineaSepolia,
  mantle,
  mantleSepoliaTestnet,
  curtis,
  storyTestnet,
  story,
  storyAeneid,
  storyOdyssey,
  xLayerTestnet,
  xLayer,
  sei,
  seiTestnet,
  ethernity,
  odysseyTestnet,
  apeChain,
  filecoinCalibration,
  filecoin,
  monad,
  monadTestnet,
  ink,
]);

/**
 * Same chain set as {@link klyraEvmChains}, passed to Dynamic `settings.overrides.evmNetworks` so
 * the SDK does not merge dashboard-only networks (which caused Dynamic↔Wagmi mismatch warnings).
 */
export const klyraDynamicEvmNetworks: EvmNetwork[] =
  klyraEvmChains.map(viemChainToDynamicEvmNetwork);

const slugToId: Record<string, number> = {
  ethereum: mainnet.id,
  eth: mainnet.id,
  mainnet: mainnet.id,
  base: base.id,
  optimism: optimism.id,
  op: optimism.id,
  arbitrum: arbitrum.id,
  arb: arbitrum.id,
  polygon: polygon.id,
  matic: polygon.id,
};

export function getEvmChainIdFromSlug(slug: string): number | undefined {
  const k = slug.trim().toLowerCase();
  return slugToId[k];
}
