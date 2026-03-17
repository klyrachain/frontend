/**
 * Maps a token's chain to the address format the user must use to receive on that network.
 * EVM chains share the same address format (0x…).
 */

const EVM_CHAIN_ID_SLUGS = new Set([
  "ethereum",
  "eth",
  "base",
  "optimism",
  "op",
  "arbitrum",
  "arb",
  "polygon",
  "matic",
  "bnb",
  "bsc",
  "avalanche",
  "avax",
  "linea",
  "scroll",
  "zksync",
  "blast",
  "mantle",
]);

export type ReceiveAccountFormat = "evm" | "unknown";

export interface ReceiveAccountSpec {
  format: ReceiveAccountFormat;
  /** Short label for the field, e.g. "EVM address" */
  addressLabel: string;
  inputPlaceholder: string;
  /** Explains why this address type (ties token + chain to account type). */
  helperText: string;
}

function normalizeChainId(chainId: string): string {
  return chainId.trim().toLowerCase();
}

/** Common EVM L1/L2 numeric chain IDs (Squid may expose numeric chainId). */
const EVM_NUMERIC_CHAIN_IDS = new Set([
  1, 10, 56, 100, 137, 250, 324, 1101, 8453, 42161, 43114, 59144, 534352,
]);

function chainIdLooksEvm(chainId: string): boolean {
  const id = normalizeChainId(chainId);
  if (EVM_CHAIN_ID_SLUGS.has(id)) return true;
  if (id.endsWith("-mainnet")) return true;
  const eip = /^eip155:(\d+)$/.exec(id);
  if (eip && EVM_NUMERIC_CHAIN_IDS.has(Number(eip[1]))) return true;
  const n = Number(chainId);
  if (Number.isInteger(n) && n > 0 && EVM_NUMERIC_CHAIN_IDS.has(n)) return true;
  return false;
}

export function getReceiveAccountSpec(
  chainId: string,
  chainDisplayName: string
): ReceiveAccountSpec {
  const isEvm = chainIdLooksEvm(chainId);

  if (isEvm) {
    return {
      format: "evm",
      addressLabel: "EVM address",
      inputPlaceholder: "0x…",
      helperText: ``,
    };
  }

  return {
    format: "unknown",
    addressLabel: "Wallet address",
    inputPlaceholder: `Address on ${chainDisplayName}`,
    helperText: `Enter the wallet address where you want to receive on ${chainDisplayName}.`,
  };
}

const EVM_ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;

export function isValidReceiveAddress(value: string, format: ReceiveAccountFormat): boolean {
  const v = value.trim();
  if (v.length === 0) return false;
  if (format === "evm") return EVM_ADDRESS_REGEX.test(v);
  return v.length >= 26;
}
