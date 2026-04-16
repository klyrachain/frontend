import type { GasPolicyPublic } from "@/types/gas-policy.types";

export type SponsorSource = "platform" | "business" | "none";

export type ChainFamily = "evm" | "solana" | "other";

export type EvmCall = {
  to: `0x${string}`;
  data?: `0x${string}`;
  value?: bigint;
};

export type TransactEvmInput = {
  calls: EvmCall[];
  /** Estimated USD for ledger reporting (sponsored txs). */
  estimatedUsd: number;
  /** Unique per user action; sent to Core as part of idempotency. */
  idempotencyKey: string;
};

export type TransactEvmResult =
  | { family: "evm"; ok: true; txHash: `0x${string}` }
  | { family: "evm"; ok: false; error: string };

export type TransactNonEvmResult =
  | { family: "solana" | "other"; ok: false; error: "UNSUPPORTED_NON_EVM_BATCH" };

export type KlyraTransactContext = {
  gasPolicy: GasPolicyPublic | undefined;
  gasReportToken: string | null;
  paymentLinkId: string | null;
  sponsorOverride?: boolean;
};
