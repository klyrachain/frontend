/**
 * Top-level sidebar tabs (Uniswap / Superbridge inspired).
 */
export type TabId = "add" | "transfer" | "swap" | "claim";

/**
 * Flows within each tab (for future modal/actions).
 */
export type FlowId =
  | "addFunds"
  | "cashOut"
  | "sendCrypto"
  | "sendToMobile"
  | "swap"
  | "claim"
  | "linkAccount"
  | "connectWallet"
  | "transfer";

export interface TabConfig {
  id: TabId;
  label: string;
  flowIds: FlowId[];
}
