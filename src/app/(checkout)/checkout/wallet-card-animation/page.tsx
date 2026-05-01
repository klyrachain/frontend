"use client";

import dynamic from "next/dynamic";

const Rive = dynamic(() => import("@rive-app/react-canvas").then((m) => m.default), {
  ssr: false,
  loading: () => (
    <div
      className="mx-auto aspect-[16/10] w-full max-w-md animate-pulse rounded-2xl bg-muted/40"
      aria-hidden
    />
  ),
});

const RIVE_SRC = "/rive/22947-42884-card-balance-widget.riv";

export default function CheckoutWalletCardAnimationPage() {
  return (
    <div className="flex w-full max-w-lg flex-col items-center gap-6 px-4 py-10">
      <h1 className="sr-only">Payment card animation</h1>
      <div className="aspect-[16/10] w-full max-w-md [&_canvas]:!h-full [&_canvas]:!w-full">
        <Rive
          src={RIVE_SRC}
          className="size-full"
          shouldResizeCanvasToContainer
          aria-hidden
        />
      </div>
      <p className="text-center text-sm leading-relaxed text-muted-foreground">
        Return to the checkout tab and confirm the transfer in your wallet when you are ready.
      </p>
    </div>
  );
}
