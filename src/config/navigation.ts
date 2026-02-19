import type { TabConfig, FlowId } from "@/types/navigation";

export const TAB_CONFIG: TabConfig[] = [
  { id: "add", label: "Add funds", flowIds: ["addFunds", "linkAccount", "connectWallet"] },
  { id: "transfer", label: "Transfer", flowIds: ["sendCrypto", "sendToMobile", "transfer", "cashOut"] },
  { id: "swap", label: "Swap & Bridge", flowIds: ["swap"] },
  { id: "claim", label: "Claim", flowIds: ["claim"] },
];

export const DEFAULT_TAB_ID = "add" as const;

export function getFlowsForTab(tabId: string): { id: FlowId; label: string; tooltip: string }[] {
  const tab = TAB_CONFIG.find((t) => t.id === tabId);
  if (!tab) return [];
  const labels: Record<FlowId, { label: string; tooltip: string }> = {
    addFunds: { label: "Add Funds", tooltip: "Buy crypto with card or bank" },
    cashOut: { label: "Cash Out", tooltip: "Sell crypto to fiat or bank" },
    sendCrypto: { label: "Send Crypto", tooltip: "Send to a wallet address" },
    sendToMobile: { label: "Send to Mobile", tooltip: "Send to phone or email" },
    swap: { label: "Swap", tooltip: "Convert or route tokens" },
    claim: { label: "Claim", tooltip: "Claim rewards or airdrops" },
    linkAccount: { label: "Link Account", tooltip: "Connect bank or mobile wallet" },
    connectWallet: { label: "Connect Wallet", tooltip: "Link your crypto wallet" },
    transfer: { label: "Transfer", tooltip: "Move between your wallets" },
  };
  return tab.flowIds.map((id) => ({ id, ...labels[id] }));
}
