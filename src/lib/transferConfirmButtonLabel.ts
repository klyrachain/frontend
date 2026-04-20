import type { TokenSelection } from "@/components/Exchange/TokenChainSelectModal";
import type { ReceiveAccountFormat } from "@/lib/receiveAccountByChain";
import { isEvmChainId } from "@/lib/receiveAccountByChain";

const STABLE_OR_WRAPPED = new Set([
  "USDC",
  "USDT",
  "DAI",
  "BUSD",
  "TUSD",
  "USDD",
  "FRAX",
  "USDP",
  "GUSD",
  "LUSD",
  "FDUSD",
  "PYUSD",
  "USDE",
  "EURC",
  "USDBC",
  "WXDAI",
  "CRVUSD",
]);

/** Three-letter symbols that are crypto assets, not ISO fiat. */
const THREE_LETTER_CRYPTO = new Set([
  "ETH",
  "BTC",
  "BNB",
  "SOL",
  "XRP",
  "ADA",
  "DOT",
  "LTC",
  "XLM",
  "EOS",
  "ZEC",
  "XMR",
  "APT",
  "SUI",
  "SEI",
  "INJ",
  "TON",
  "ARB",
  "OP",
  "NEAR",
  "FTM",
  "HBAR",
  "VET",
  "ICP",
  "TRX",
  "XTZ",
  "EGLD",
  "RVN",
  "ENJ",
  "BAT",
  "ZIL",
  "ONE",
  "GMT",
  "WBNB",
  "AXS",
]);

function chainAndTokenBlob(sel: TokenSelection): string {
  const c = sel.chain;
  return `${c.id} ${c.name} ${c.shortName ?? ""} ${sel.token.name}`.toLowerCase();
}

/**
 * Best-effort fiat leg detection (Squid tokens do not carry an explicit flag).
 * Prefer explicit “fiat / morapay / ramp” wording on chain or token, else
 * non-EVM + 3-letter symbol that is not a known stablecoin or major crypto ticker.
 */
export function transferSelectionLooksFiat(sel: TokenSelection): boolean {
  const blob = chainAndTokenBlob(sel);
  if (
    blob.includes("fiat") ||
    blob.includes("offramp") ||
    blob.includes("off-ramp") ||
    blob.includes("onramp") ||
    blob.includes("on-ramp") ||
    blob.includes("morapay") ||
    blob.includes("paystack") ||
    blob.includes("mobile money") ||
    blob.includes("bank transfer")
  ) {
    return true;
  }

  const sym = sel.token.symbol.trim().toUpperCase();
  if (sym.length !== 3 || !/^[A-Z]{3}$/.test(sym)) return false;
  if (STABLE_OR_WRAPPED.has(sym) || THREE_LETTER_CRYPTO.has(sym)) return false;
  if (!isEvmChainId(sel.chain.id)) return true;
  return false;
}

function evmAddressesEqual(a: string, b: string): boolean {
  const ta = a.trim().toLowerCase();
  const tb = b.trim().toLowerCase();
  if (!ta.startsWith("0x") || !tb.startsWith("0x")) return false;
  return ta === tb;
}

export type TransferConfirmButtonIntent = "swap" | "offramp" | "onramp" | "confirm";

export interface TransferConfirmButtonLabelParams {
  left: TokenSelection | null;
  right: TokenSelection | null;
  trimmedReceiver: string;
  connectedEvmAddress: string | undefined;
  receiveFormat: ReceiveAccountFormat | null;
  receiverValid: boolean;
}

export function getTransferConfirmButtonIntent(
  p: TransferConfirmButtonLabelParams
): TransferConfirmButtonIntent {
  const { left, right, trimmedReceiver, connectedEvmAddress, receiveFormat, receiverValid } = p;
  if (!left || !right) return "confirm";

  const differentAssets = left.token.id !== right.token.id;
  const wallet = connectedEvmAddress?.trim() ?? "";
  const selfEvmReceive =
    receiverValid &&
    receiveFormat === "evm" &&
    wallet !== "" &&
    evmAddressesEqual(trimmedReceiver, wallet);

  if (differentAssets && selfEvmReceive) return "swap";

  const fromFiat = transferSelectionLooksFiat(left);
  const toFiat = transferSelectionLooksFiat(right);
  if (!fromFiat && toFiat) return "offramp";
  if (fromFiat && !toFiat) return "onramp";

  return "confirm";
}

export function transferConfirmButtonText(intent: TransferConfirmButtonIntent): string {
  switch (intent) {
    case "swap":
      return "Swap";
    case "offramp":
      return "Offramp";
    case "onramp":
      return "Onramp";
    default:
      return "Confirm";
  }
}
