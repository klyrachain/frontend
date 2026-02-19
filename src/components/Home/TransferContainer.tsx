"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const ACTIONS = [
  { id: "sendCrypto", label: "Send Crypto", tooltip: "Send to a wallet address" },
  { id: "sendToMobile", label: "Send to Mobile", tooltip: "Send to phone or email" },
  { id: "transfer", label: "Transfer", tooltip: "Move between your wallets" },
  { id: "cashOut", label: "Cash Out", tooltip: "Sell crypto to fiat or bank" },
] as const;

export function TransferContainer() {
  return (
    <article className="glass-card tab-modal overflow-hidden p-6 shadow-xl">
      <ul className="flex flex-col gap-2">
        {ACTIONS.map((action) => (
          <li key={action.id}>
            <Button
              variant="outline"
              className={cn(
                "h-auto w-full flex-col items-stretch gap-0.5 rounded-xl border-white/10 py-3.5 text-left",
                "bg-white/5 hover:bg-white/10 dark:bg-white/5 dark:hover:bg-white/10"
              )}
            >
              <span className="font-medium">{action.label}</span>
              <span className="text-xs font-normal text-muted-foreground">
                {action.tooltip}
              </span>
            </Button>
          </li>
        ))}
      </ul>
    </article>
  );
}
