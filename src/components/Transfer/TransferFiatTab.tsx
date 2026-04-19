"use client";

import {
  TransferOnrampTab,
  type OnrampDestination,
} from "@/components/Transfer/TransferOnrampTab";
import { TransferOfframpTab } from "@/components/Transfer/TransferOfframpTab";

export type TransferFiatTabProps = {
  morapayEnabled: boolean;
  onOnrampChoice: (destination: OnrampDestination) => void;
  onSelectMorapay: () => void;
  /** Checkout (fiat-denominated links): hide receive/offramp — not applicable on that surface. */
  hideReceiveFiat?: boolean;
  onrampLockedChoice?: OnrampDestination | null;
};

/**
 * Single “Fiat” surface: buy crypto to settle the invoice, or cash out via Morapay where enabled.
 */
export function TransferFiatTab({
  morapayEnabled,
  onOnrampChoice,
  onSelectMorapay,
  hideReceiveFiat = false,
  onrampLockedChoice = null,
}: TransferFiatTabProps) {
  return (
    <div
      className="checkout-token-scroll flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-2 py-4 sm:px-4"
      aria-label="Fiat options"
    >
      <section className="space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Pay with fiat
        </h3>
        <p className="text-sm text-muted-foreground">
          Onramp into crypto to complete checkout, or fund your wallet first.
        </p>
        <TransferOnrampTab
          onChoose={onOnrampChoice}
          lockedChoice={onrampLockedChoice}
        />
      </section>
      {!hideReceiveFiat ? (
        <section className="space-y-2 border-t border-border pt-6">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Receive fiat
          </h3>
          <TransferOfframpTab
            morapayEnabled={morapayEnabled}
            onSelectMorapay={onSelectMorapay}
            hideDescription
          />
        </section>
      ) : null}
    </div>
  );
}
