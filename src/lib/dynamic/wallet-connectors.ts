import { EthereumWalletConnectors } from "@dynamic-labs/ethereum";
import { SolanaWalletConnectors } from "@dynamic-labs/solana";

export function getWalletConnectors() {
  return [EthereumWalletConnectors, SolanaWalletConnectors];
}
