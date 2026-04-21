/**
 * Mirrors Core payment instruction discriminant (`GET /api/offramp/calldata`, `POST …/app-transfer/intent` → `data.calldata`).
 */

export type EvmErc20TransferInstruction = {
  kind: "evm_erc20_transfer";
  toAddress: string;
  chainId: number;
  chain: string;
  token: string;
  tokenAddress: string;
  amount: string;
  decimals: number;
  message?: string;
};

export type SolanaSplTransferInstruction = {
  kind: "solana_spl_transfer";
  recipientAddress: string;
  mint: string;
  amountAtomic: string;
  decimals: number;
  message?: string;
  memo?: string;
};

export type StellarPaymentInstruction = {
  kind: "stellar_payment";
  destination: string;
  amount: string;
  assetType: "native" | "credit_alphanum4" | "credit_alphanum12";
  assetCode?: string;
  assetIssuer?: string;
  memo?: string;
  message?: string;
};

export type BitcoinUtxoInstruction = {
  kind: "bitcoin_utxo";
  address: string;
  amountBtc: string;
  amountSats: string;
  message?: string;
};

export type UnsupportedPaymentInstruction = {
  kind: "unsupported";
  chain: string;
  token: string;
  unsupportedReason: string;
  message?: string;
};

export type PaymentInstruction =
  | EvmErc20TransferInstruction
  | SolanaSplTransferInstruction
  | StellarPaymentInstruction
  | BitcoinUtxoInstruction
  | UnsupportedPaymentInstruction;

export function isSolanaSplTransferInstruction(
  c: PaymentInstruction | Record<string, unknown> | null | undefined
): c is SolanaSplTransferInstruction {
  if (!c || typeof c !== "object") return false;
  return (c as { kind?: string }).kind === "solana_spl_transfer";
}

export function isEvmErc20TransferInstruction(
  c: PaymentInstruction | Record<string, unknown> | null | undefined
): c is EvmErc20TransferInstruction {
  if (!c || typeof c !== "object") return false;
  const k = (c as { kind?: string }).kind;
  if (k === "evm_erc20_transfer") return true;
  /** Legacy responses without `kind` but with EVM fields */
  if (
    k == null &&
    typeof (c as { toAddress?: string }).toAddress === "string" &&
    typeof (c as { chainId?: number }).chainId === "number" &&
    typeof (c as { tokenAddress?: string }).tokenAddress === "string"
  ) {
    return true;
  }
  return false;
}

export function normalizeToEvmInstruction(
  c: PaymentInstruction | Record<string, unknown>
): EvmErc20TransferInstruction | null {
  if (!isEvmErc20TransferInstruction(c)) return null;
  if (c.kind === "evm_erc20_transfer") return c;
  const x = c as Record<string, unknown>;
  return {
    kind: "evm_erc20_transfer",
    toAddress: String(x.toAddress ?? ""),
    chainId: Number(x.chainId),
    chain: String(x.chain ?? ""),
    token: String(x.token ?? ""),
    tokenAddress: String(x.tokenAddress ?? ""),
    amount: String(x.amount ?? ""),
    decimals: Number(x.decimals ?? 18),
    message: typeof x.message === "string" ? x.message : undefined,
  };
}
