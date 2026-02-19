"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ClaimContainer() {
  return (
    <article className="glass-card tab-modal overflow-hidden p-6 shadow-xl">
      <Button
        variant="outline"
        className={cn(
          "h-auto w-full flex-col items-stretch gap-0.5 rounded-xl border-white/10 py-4 text-left",
          "bg-white/5 hover:bg-white/10 dark:bg-white/5 dark:hover:bg-white/10"
        )}
      >
        <span className="font-medium">Claim</span>
        <span className="text-xs font-normal text-muted-foreground">
          Claim rewards, airdrops or payments
        </span>
      </Button>
    </article>
  );
}
