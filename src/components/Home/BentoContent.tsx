"use client";

import { useAppSelector } from "@/store/hooks";
import { AddFundsContainer } from "./AddFundsContainer";
import { TransferContainer } from "@/components/Transfer/TransferContainer";
import { ExchangeContainer } from "@/components/Exchange/ExchangeContainer";
import { ClaimContainer } from "./ClaimContainer";
import type { TabId } from "@/types/navigation";

const TAB_HEADINGS: Record<TabId, string> = {
  add: "Add funds, anytime.",
  transfer: "Send and move value.",
  swap: "Swap & bridge across chains.",
  claim: "Claim rewards and airdrops.",
};

export function BentoContent() {
  const activeTabId = useAppSelector((s) => s.navigation.activeTabId);
  const heading = TAB_HEADINGS[activeTabId] ?? "What would you like to do?";

  return (
    <section
      className="flex flex-col items-center px-4 py-12 flex-1"
      aria-labelledby="bento-heading"
    >
      <h2
        id="bento-heading"
        className="mb-8 text-center text-2xl font-semibold tracking-tight sm:text-3xl"
      >
        {heading}
      </h2>
      {activeTabId === "add" && <AddFundsContainer />}
      {activeTabId === "transfer" && <TransferContainer />}
      {activeTabId === "swap" && <ExchangeContainer />}
      {activeTabId === "claim" && <ClaimContainer />}
    </section>
  );
}
