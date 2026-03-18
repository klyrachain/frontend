"use client";

import Image from "next/image";
import type { TokenSelection } from "@/components/Exchange/TokenChainSelectModal";

export interface TokenSelectFieldProps {
  label: string;
  selection: TokenSelection | null;
  onOpenSelect: () => void;
  emptyLabel?: string;
  /** When set, overrides default aria-label for the empty state */
  selectAriaLabel?: string;
}

export function TokenSelectField({
  label,
  selection,
  onOpenSelect,
  emptyLabel = "Select token",
  selectAriaLabel,
}: TokenSelectFieldProps) {
  const ariaLabel = selection
    ? `${selection.token.symbol} on ${selection.chain.name} – change token`
    : (selectAriaLabel ?? emptyLabel);

  return (
    <div className="rounded-xl border border-border bg-muted/30 p-4">
      <p className="mb-2 text-xs text-muted-foreground">{label}</p>
      <button
        type="button"
        onClick={onOpenSelect}
        className="flex w-full cursor-pointer items-center gap-2 rounded-lg text-left transition-colors hover:bg-muted/50"
        aria-label={ariaLabel}
      >
        {selection ? (
          <>
            {selection.token.logoURI ? (
              <Image
                src={selection.token.logoURI}
                alt=""
                width={34}
                height={34}
                className="size-8 shrink-0 rounded-full object-cover"
              />
            ) : (
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                {selection.token.symbol.slice(0, 2)}
              </span>
            )}
            <span className="min-w-0 truncate font-medium text-primary">
              {selection.token.name}
            </span>
            <span className="shrink-0 text-xs text-primary">
              {selection.chain.name}
            </span>
          </>
        ) : (
          <span className="text-muted-foreground">{emptyLabel}</span>
        )}
      </button>
    </div>
  );
}
