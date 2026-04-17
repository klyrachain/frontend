import { AlgorandWalletConnectors } from "@dynamic-labs/algorand";
import { BitcoinWalletConnectors } from "@dynamic-labs/bitcoin";
import { CosmosWalletConnectors } from "@dynamic-labs/cosmos";
import { EthereumWalletConnectors } from "@dynamic-labs/ethereum";
import { FlowWalletConnectors } from "@dynamic-labs/flow";
import { SolanaWalletConnectors } from "@dynamic-labs/solana";
import { SparkWalletConnectors } from "@dynamic-labs/spark";
import { StarknetWalletConnectors } from "@dynamic-labs/starknet";
import { SuiWalletConnectors } from "@dynamic-labs/sui";
import { TonWalletConnectors } from "@dynamic-labs/ton";
import { TronWalletConnectors } from "@dynamic-labs/tron";

/** Enable matching chains in the Dynamic dashboard. No Stellar package in @dynamic-labs v4 here. */
export function getWalletConnectors() {
  return [
    AlgorandWalletConnectors,
    BitcoinWalletConnectors,
    CosmosWalletConnectors,
    EthereumWalletConnectors,
    FlowWalletConnectors,
    SolanaWalletConnectors,
    SparkWalletConnectors,
    StarknetWalletConnectors,
    SuiWalletConnectors,
    TonWalletConnectors,
    TronWalletConnectors,
  ];
}
