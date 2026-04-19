"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type OnrampDestination = "pay-business" | "self-custody";

export type TransferOnrampTabProps = {
  onChoose: (destination: OnrampDestination) => void;
  /** When set (e.g. wallet top-up split view), choices are read-only and the locked row is highlighted. */
  lockedChoice?: OnrampDestination | null;
};

/**
 * Buy crypto to complete checkout: pay through business rails or fund wallet first, then pay.
 */
export function TransferOnrampTab({ onChoose, lockedChoice = null }: TransferOnrampTabProps) {
  const locked = lockedChoice != null;
  return (
    <section
      className="checkout-token-scroll flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-6"
      aria-label="Onramp"
    >
      <div className="flex flex-col gap-2">
        <Button
          type="button"
          variant="secondary"
          disabled={locked}
          className={cn(
            "h-auto flex-col items-start justify-start gap-1 rounded-xl py-4 text-left",
            lockedChoice === "pay-business" && "ring-2 ring-primary ring-offset-2 ring-offset-background"
          )}
          onClick={() => onChoose("pay-business")}
        >
          <span className="block text-sm font-semibold">
            Settle through business checkout
          </span>
          <span className="block text-xs font-normal text-muted-foreground">
            Pay with fiat while Morapay settles the required crypto to the
            business.
          </span>
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={locked}
          className={cn(
            "h-auto flex-col items-start justify-start gap-1 rounded-xl py-4 text-left",
            lockedChoice === "self-custody" && "ring-2 ring-primary ring-offset-2 ring-offset-background"
          )}
          onClick={() => onChoose("self-custody")}
        >
          <span className="block text-sm font-semibold">Fund your wallet first</span>
          <span className="block text-xs font-normal text-muted-foreground">
            Onramp into your wallet first, then return to pay this invoice
            (fiat or crypto).
          </span>
        </Button>
      </div>
    </section>
  );
}
