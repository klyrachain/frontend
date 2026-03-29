"use client";

import { Button } from "@/components/ui/button";

export type OnrampDestination = "pay-business" | "self-custody";

export type TransferOnrampTabProps = {
  onChoose: (destination: OnrampDestination) => void;
};

/**
 * Buy crypto to complete checkout: pay through business rails or fund wallet first, then pay.
 */
export function TransferOnrampTab({ onChoose }: TransferOnrampTabProps) {
  return (
    <section
      className="checkout-token-scroll flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-6"
      aria-label="Onramp"
    >
      <p className="text-sm text-muted-foreground">
        Top up crypto to cover this invoice. Choose how you want to fund before
        completing payment.
      </p>
      <div className="flex flex-col gap-2">
        <Button
          type="button"
          variant="secondary"
          className="h-auto justify-start rounded-xl py-4 text-left"
          onClick={() => onChoose("pay-business")}
        >
          <span className="block text-sm font-semibold">Pay via business</span>
          <span className="block text-xs font-normal text-muted-foreground">
            Route purchase through the merchant checkout (when available).
          </span>
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="h-auto justify-start rounded-xl py-4 text-left"
          onClick={() => onChoose("self-custody")}
        >
          <span className="block text-sm font-semibold">Fund wallet first</span>
          <span className="block text-xs font-normal text-muted-foreground">
            Add crypto to your wallet, then return here to pay the invoice.
          </span>
        </Button>
      </div>
    </section>
  );
}
