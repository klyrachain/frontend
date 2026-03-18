"use client";

import Image from "next/image";
import { CircleCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type PaymentProcessingOutcome = "pending" | "success";

export interface BusinessPayProcessingSectionProps {
  outcome: PaymentProcessingOutcome;
  secondsRemaining: number;
  onDone: () => void;
  /** Optional image for success; falls back to icon if omitted */
  successImageSrc?: string;
  successImageAlt?: string;
}

export function BusinessPayProcessingSection({
  outcome,
  secondsRemaining,
  onDone,
  successImageSrc,
  successImageAlt = "Payment successful",
}: BusinessPayProcessingSectionProps) {
  const isSuccess = outcome === "success";

  return (
    <div className="flex min-h-0 flex-1 flex-col px-4">
      <div
        className="flex min-h-0 flex-1 flex-col items-center justify-center gap-6 py-8 text-center"
        role="status"
        aria-live="polite"
        aria-busy={!isSuccess}
      >
        {isSuccess ? (
          <>
            {successImageSrc ? (
              <span className="relative block size-32 shrink-0 overflow-hidden rounded-2xl">
                <Image
                  src={successImageSrc}
                  alt={successImageAlt}
                  width={128}
                  height={128}
                  className="size-32 object-contain"
                />
              </span>
            ) : (
              <span className="flex size-28 shrink-0 items-center justify-center rounded-full bg-emerald-500/15">
                <CircleCheck
                  className="size-16 text-emerald-600"
                  strokeWidth={1.75}
                  aria-hidden
                />
              </span>
            )}
            <div className="space-y-2">
              <p className="text-xl font-semibold text-primary">
                Payment successful
              </p>
              <p className="max-w-xs text-sm text-muted-foreground">
                Your payment has been sent successfully.
              </p>
            </div>
          </>
        ) : (
          <>
            <span
              className={cn(
                "relative flex size-24 shrink-0 items-center justify-center rounded-full bg-primary/10"
              )}
              aria-hidden
            >
              <Loader2 className="size-12 animate-spin text-primary" />
            </span>
            <div className="space-y-2">
              <p className="text-xl font-semibold text-primary">Processing</p>
              <p className="max-w-xs text-sm text-muted-foreground">
                Please wait while we confirm your payment.
              </p>
              <p className="text-sm font-medium tabular-nums text-primary">
                {secondsRemaining > 0
                  ? `About ${secondsRemaining} second${secondsRemaining === 1 ? "" : "s"} left`
                  : "Almost done…"}
              </p>
            </div>
          </>
        )}
      </div>

      {isSuccess && (
        <footer className="shrink-0 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <Button
            type="button"
            size="lg"
            className="h-14 w-full rounded-full text-base font-semibold"
            onClick={onDone}
          >
            Done
          </Button>
        </footer>
      )}
    </div>
  );
}
