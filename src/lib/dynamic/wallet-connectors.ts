import { AlgorandWalletConnectors } from "@dynamic-labs/algorand";
import { BitcoinWalletConnectors } from "@dynamic-labs/bitcoin";
import { CosmosWalletConnectors } from "@dynamic-labs/cosmos";
import { EthereumWalletConnectors } from "@dynamic-labs/ethereum";
import { FlowWalletConnectors } from "@dynamic-labs/flow";
import { SolanaWalletConnectors } from "@dynamic-labs/solana";
import { SparkWalletConnectors } from "@dynamic-labs/spark";
import { StarknetWalletConnectors } from "@dynamic-labs/starknet";
import { StellarWalletConnectors } from "@dynamic-labs/stellar";
import { SuiWalletConnectors } from "@dynamic-labs/sui";
import { TempoWalletConnectors } from "@dynamic-labs/tempo";
import { TonWalletConnectors } from "@dynamic-labs/ton";
import { TronWalletConnectors } from "@dynamic-labs/tron";

/** Dynamic multi-chain connectors; enable matching chains in the Dynamic dashboard. */
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
    StellarWalletConnectors,
    SuiWalletConnectors,
    TempoWalletConnectors,
    TonWalletConnectors,
    TronWalletConnectors,
  ];
}
