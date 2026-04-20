"use client";

import type { TokenSelection } from "@/components/Exchange/TokenChainSelectModal";
import { TokenAvatarWithFallback } from "@/components/Token/TokenAvatarWithFallback";
import {
  FLOW_FIELD_SHELL,
  FLOW_FIELD_LABEL,
  FLOW_TOKEN_TRIGGER,
} from "@/components/flows/flow-field-classes";

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
    <div className={FLOW_FIELD_SHELL}>
      <p className={FLOW_FIELD_LABEL}>{label}</p>
      <button
        type="button"
        onClick={onOpenSelect}
        className={FLOW_TOKEN_TRIGGER}
        aria-label={ariaLabel}
      >
        {selection ? (
          <>
            <TokenAvatarWithFallback
              logoURI={selection.token.logoURI}
              symbol={selection.token.symbol}
              chainId={selection.token.chainId}
              width={34}
              height={34}
              className="size-8"
              alt=""
            />
            <span className="min-w-0 truncate font-medium text-primary">
              {selection.token.name}
            </span>
            <span className="shrink-0 text-xs font-medium text-card-foreground/90">
              {selection.chain.name}
            </span>
          </>
        ) : (
          <span className="text-card-foreground/60">{emptyLabel}</span>
        )}
      </button>
    </div>
  );
}
