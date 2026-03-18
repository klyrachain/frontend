"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { BusinessPayBottomSheet } from "@/components/Business/BusinessPayBottomSheet";
import { BUSINESS_PAY_PAGE_MARGIN_PX } from "@/config/businessPayLayout";

export interface BusinessPayViewProps {
  amountDisplay: string;
  currencyDisplay: string;
  businessName: string;
  businessLogoUrl?: string | null;
  processPayment?: () => Promise<"success" | "failure">;
  paymentSuccessImageSrc?: string;
}

export function BusinessPayView({
  amountDisplay,
  currencyDisplay,
  businessName,
  businessLogoUrl,
  processPayment,
  paymentSuccessImageSrc,
}: BusinessPayViewProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const margin = BUSINESS_PAY_PAGE_MARGIN_PX;

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-zinc-900 focus:px-4 focus:py-2 focus:text-sm focus:text-white focus:outline-none"
      >
        Skip to main content
      </a>
      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto flex min-h-dvh max-w-md flex-col justify-center"
        style={{
          paddingLeft: margin,
          paddingRight: margin,
          paddingTop: margin,
          paddingBottom: margin,
        }}
      >
        <header className="mb-10 text-center">
          <h1 className="text-lg font-normal leading-relaxed text-zinc-700 sm:text-xl">
            Pay{" "}
            <span className="font-semibold text-zinc-900">{amountDisplay}</span>{" "}
            <span className="font-medium uppercase tracking-wide text-zinc-800">
              {currencyDisplay}
            </span>{" "}
            to{" "}
            <span className="font-semibold text-zinc-900">{businessName}</span>
          </h1>
        </header>

        <div className="flex flex-col items-stretch gap-4">
          <Button
            type="button"
            size="lg"
            className="h-14 w-full rounded-full bg-zinc-900 text-base font-semibold text-white shadow-sm hover:bg-zinc-800"
            onClick={() => setSheetOpen(true)}
          >
            Pay now
          </Button>
          <p className="text-center text-sm text-zinc-500">
            Review amount and token, then confirm in the sheet.
          </p>
        </div>
      </main>

      <BusinessPayBottomSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        amountDisplay={amountDisplay}
        currencyDisplay={currencyDisplay}
        businessName={businessName}
        businessLogoUrl={businessLogoUrl}
        processPayment={processPayment}
        paymentSuccessImageSrc={paymentSuccessImageSrc}
      />
    </>
  );
}
