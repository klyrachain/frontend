"use client";

import dynamic from "next/dynamic";
import { CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const Rive = dynamic(
  () => import("@rive-app/react-canvas").then((m) => m.default),
  {
    ssr: false,
    loading: () => (
      <div
        className="mx-auto aspect-square w-32 max-w-full animate-pulse rounded-2xl bg-muted/40"
        aria-hidden
      />
    ),
  }
);

export type WalletTxStatus = "awaiting" | "error" | "success";

export type WalletTxStatusPanelProps = {
  status: WalletTxStatus;
  title?: string;
  message?: string;
  txHash?: string | null;
  className?: string;
  onDismiss?: () => void;
  onRetry?: () => void;
  dismissLabel?: string;
  retryLabel?: string;
};

export function WalletTxStatusPanel({
  status,
  title,
  message,
  txHash,
  className,
  onDismiss,
  onRetry,
  dismissLabel = "Close",
  retryLabel = "Try again",
}: WalletTxStatusPanelProps) {
  const defaultTitle =
    status === "awaiting"
      ? "Awaiting transaction"
      : status === "success"
        ? "Payment submitted"
        : "Transaction failed";

  return (
    <div
      role={status === "error" ? "alert" : "status"}
      className={cn(
        "rounded-2xl border px-4 py-5 text-center",
        status === "success" && "border-primary/25 bg-primary/5",
        status === "error" && "border-destructive/25 bg-destructive/5",
        status === "awaiting" && "border-border/60 bg-muted/10",
        className
      )}
    >
      {status === "awaiting" ? (
        <div className="mx-auto mb-3 h-28 w-full max-w-[140px] [&_canvas]:!h-full [&_canvas]:!w-full">
          <Rive
            src="/rive/22947-42884-card-balance-widget.riv"
            className="size-full"
            shouldResizeCanvasToContainer
            aria-hidden
          />
        </div>
      ) : status === "success" ? (
        <div className="mx-auto mb-3 flex size-14 items-center justify-center rounded-full bg-primary/10">
          <CheckCircle2 className="size-7 text-primary" />
        </div>
      ) : (
        <div className="mx-auto mb-3 flex size-14 items-center justify-center rounded-full bg-destructive/10">
          <XCircle className="size-7 text-destructive" />
        </div>
      )}

      <p className="text-base font-semibold tracking-tight text-card-foreground">
        {title ?? defaultTitle}
      </p>

      {message ? (
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
          {message}
        </p>
      ) : null}

      {txHash ? (
        <p className="mt-2 break-all font-mono text-[11px] text-primary">
          {txHash}
        </p>
      ) : null}

      {onRetry ?? onDismiss ? (
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {onRetry ? (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="rounded-xl"
              onClick={onRetry}
            >
              {retryLabel}
            </Button>
          ) : null}
          {onDismiss ? (
            <Button
              type="button"
              variant={onRetry ? "ghost" : "secondary"}
              size="sm"
              className="rounded-xl"
              onClick={onDismiss}
            >
              {dismissLabel}
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
