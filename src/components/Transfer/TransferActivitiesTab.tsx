"use client";

export function TransferActivitiesTab() {
  return (
    <section
      className="checkout-token-scroll min-h-0 flex flex-col flex-1 overflow-y-auto px-4 py-6 justify-center gap-2 items-center"
      aria-label="Activities"
    >
      <p className="text-sm text-muted-foreground text-center">
        Recent transfer and swap activity will appear here.
      </p>
    </section>
  );
}
