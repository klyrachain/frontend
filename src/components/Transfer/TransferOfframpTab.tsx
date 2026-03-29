"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type TransferOfframpTabProps = {
  /** When false (fiat-denominated invoice), Morapay is listed but not selectable. */
  morapayEnabled: boolean;
  onSelectMorapay: () => void;
};

/**
 * Cash-out style options: Morapay uses the same card/mobile flow as checkout (no provider name in UI).
 */
export function TransferOfframpTab({
  morapayEnabled,
  onSelectMorapay,
}: TransferOfframpTabProps) {
  return (
    <section
      className="checkout-token-scroll flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 py-6"
      aria-label="Offramp"
    >
      <p className="text-sm text-muted-foreground">
        Receive funds to a bank account or mobile money where supported.
      </p>
      <Button
        type="button"
        variant="secondary"
        disabled={!morapayEnabled}
        className={cn(
          "h-auto justify-start rounded-xl py-4 text-left",
          !morapayEnabled && "opacity-50"
        )}
        onClick={() => {
          if (morapayEnabled) onSelectMorapay();
        }}
      >
        <span className="block text-sm font-semibold">Morapay</span>
        <span className="block text-xs font-normal text-muted-foreground">
          {morapayEnabled
            ? "Card and mobile money where available."
            : "Available when this link is charged in crypto, not fiat."}
        </span>
      </Button>
    </section>
  );
}
