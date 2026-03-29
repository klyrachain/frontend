/**
 * Default checkout payout tokens (aligned with Core `buildCheckoutPayoutQuotes` row ids).
 * Balance lookup uses chainId + token address for `/api/squid/balances`.
 */
export const BASE_USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
/** BNB Chain USDC — Fonbnk supports BNB_USDC, not native BNB for this flow */
export const BNB_CHAIN_USDC_ADDRESS =
  "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d";
/** Wrapped SOL mint — matches Core SupportedToken for SOL / Fonbnk SOLANA_NATIVE */
export const SOLANA_SOL_MINT = "So11111111111111111111111111111111111111112";
/** Wrapped XRP on Ethereum (Squid route / balances) */
export const ETHEREUM_WXRP_ADDRESS =
  "0x39fBBABf11738317a448031930706cd3e612e1B9";

export const CHAIN_ID_BASE = 8453;
export const CHAIN_ID_BNB = 56;
export const CHAIN_ID_ETHEREUM = 1;
export const CHAIN_ID_SOLANA = 101;

export type CheckoutPayoutRowConfig = {
  id: string;
  label: string;
  /** For token icon lookup in Squid token list */
  iconSymbol: string;
  balanceChainId: string;
  balanceTokenAddress: string;
};

export const CHECKOUT_PAYOUT_ROWS: CheckoutPayoutRowConfig[] = [
  {
    id: "base-usdc",
    label: "USDC",
    iconSymbol: "USDC",
    balanceChainId: String(CHAIN_ID_BASE),
    balanceTokenAddress: BASE_USDC_ADDRESS,
  },
  {
    id: "bnb-usdc",
    label: "USDC",
    iconSymbol: "USDC",
    balanceChainId: String(CHAIN_ID_BNB),
    balanceTokenAddress: BNB_CHAIN_USDC_ADDRESS,
  },
  {
    id: "solana-sol",
    label: "SOL",
    iconSymbol: "SOL",
    balanceChainId: String(CHAIN_ID_SOLANA),
    balanceTokenAddress: SOLANA_SOL_MINT,
  },
  {
    id: "eth-wxrp",
    label: "wXRP",
    iconSymbol: "WXRP",
    balanceChainId: String(CHAIN_ID_ETHEREUM),
    balanceTokenAddress: ETHEREUM_WXRP_ADDRESS,
  },
];
