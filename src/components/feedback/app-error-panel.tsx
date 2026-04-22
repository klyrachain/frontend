"use client";

import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ErrorPresentation } from "@/lib/app-error-presentation";

const Rive = dynamic(() => import("@rive-app/react-canvas").then((m) => m.default), {
  ssr: false,
  loading: () => (
    <div
      className="mx-auto flex aspect-square w-44 max-w-full animate-pulse rounded-2xl bg-muted/40"
      aria-hidden
    />
  ),
});

export type AppErrorPanelProps = {
  presentation: ErrorPresentation;
  className?: string;
  onDismiss?: () => void;
  dismissLabel?: string;
};

export function AppErrorPanel({
  presentation,
  className,
  onDismiss,
  dismissLabel = "Dismiss",
}: AppErrorPanelProps) {
  return (
    <div
      role="alert"
      className={cn(
        "overflow-hidden rounded-2xl border border-destructive/25 bg-destructive/5 px-4 py-5 text-center shadow-sm",
        className
      )}
    >
      <div className="mx-auto mb-3 h-44 w-full max-w-[220px] [&_canvas]:!h-full [&_canvas]:!w-full">
        <Rive
          src={presentation.rive}
          className="size-full"
          shouldResizeCanvasToContainer
          aria-hidden
        />
      </div>
      <p className="font-display text-base font-semibold tracking-tight text-card-foreground">
        {presentation.title}
      </p>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{presentation.message}</p>
      {onDismiss ? (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="mt-4 rounded-xl"
          onClick={onDismiss}
        >
          {dismissLabel}
        </Button>
      ) : null}
    </div>
  );
}
