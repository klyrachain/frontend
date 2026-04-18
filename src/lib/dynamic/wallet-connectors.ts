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

/**
 * All first-party React wallet connector packages from Dynamic’s docs (Enabling Chains & Networks),
 * plus Stellar/Spark/Tron which use dedicated packages. Enable each chain in the Dynamic dashboard.
 *
 * Optional EVM add-ons (not included — need product keys / config): `@dynamic-labs/magic`,
 * `@dynamic-labs/blocto-evm`, `@dynamic-labs/ethereum-aa` (ZeroDev).
 */
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
