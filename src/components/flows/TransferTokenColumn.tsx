"use client";

import type { TokenSelection } from "@/components/Exchange/TokenChainSelectModal";
import { SuggestedTokensRow } from "@/components/Transfer/SuggestedTokensRow";
import { TokenAvatarWithFallback } from "@/components/Token/TokenAvatarWithFallback";

export interface TransferTokenColumnProps {
  label: string;
  selection: TokenSelection | null;
  onSelectClick: () => void;
  suggestions: TokenSelection[];
  onSuggestedSelect: (s: TokenSelection) => void;
  excludeSymbol?: string;
  side: "left" | "right";
  pricePreview: string;
  /** When pricePreview equals this, the footer line is hidden */
  hideFooterWhenPreviewIs?: string;
}

export function TransferTokenColumn({
  label,
  selection,
  onSelectClick,
  suggestions,
  onSuggestedSelect,
  excludeSymbol,
  side,
  pricePreview,
  hideFooterWhenPreviewIs,
}: TransferTokenColumnProps) {
  const showFooter =
    hideFooterWhenPreviewIs == null || pricePreview !== hideFooterWhenPreviewIs;

  return (
    <div className="flex w-full flex-col gap-2">
      <SuggestedTokensRow
        suggestions={suggestions}
        onSelect={onSuggestedSelect}
        excludeSymbol={excludeSymbol}
        side={side}
      />
      <div className="flex min-w-0 flex-1 flex-col gap-2 rounded-xl border border-border bg-muted/30 p-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <button
          type="button"
          className="flex cursor-pointer items-center justify-between gap-2 text-left"
          onClick={onSelectClick}
          aria-label={
            selection
              ? `${selection.token.symbol} on ${selection.chain.name} – change token`
              : "Select token"
          }
        >
          <div className="flex min-w-0 flex-1 items-center gap-2">
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
                <span className="shrink-0 text-xs text-primary">
                  {selection.chain.name}
                </span>
              </>
            ) : (
              <span className="text-muted-foreground">Select token</span>
            )}
          </div>
        </button>
        {showFooter && pricePreview != null && pricePreview !== "" && (
          <p className="text-xs text-muted-foreground">{pricePreview}</p>
        )}
      </div>
    </div>
  );
}
