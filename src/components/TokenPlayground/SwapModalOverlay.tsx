"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TOKEN_CONFIGS } from "@/config/tokenPlayground";
import type { PlaygroundTokenConfig } from "@/types/tokenPlayground";

interface SwapModalOverlayProps {
  swapFromConfigId: string;
  swapToConfigId: string;
  sellAmount: string;
  buyAmount: string;
  onSellAmountChange: (value: string) => void;
  onBuyAmountChange: (value: string) => void;
  onSwapFromChange: (configId: string) => void;
  onSwapToChange: (configId: string) => void;
  onConfirm: () => void;
  tokenFromRef: React.RefObject<HTMLElement | null>;
  tokenToRef: React.RefObject<HTMLElement | null>;
}

function TokenPill({
  config,
  isSelected,
  onClick,
}: {
  config: PlaygroundTokenConfig;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${isSelected
        ? "bg-primary text-primary-foreground"
        : "bg-muted/50 hover:bg-muted text-foreground"
        }`}
    >
      {config.symbol}
    </button>
  );
}

export function SwapModalOverlay({
  swapFromConfigId,
  swapToConfigId,
  sellAmount,
  buyAmount,
  onSellAmountChange,
  onBuyAmountChange,
  onSwapFromChange,
  onSwapToChange,
  onConfirm,
  tokenFromRef,
  tokenToRef,
}: SwapModalOverlayProps) {
  return (
    <div className="fixed left-1/2 top-1/2 z-20 flex -translate-x-1/2 -translate-y-1/2 flex-row items-center justify-center gap-6">
      <div
        ref={tokenFromRef as React.RefObject<HTMLDivElement>}
        className="flex size-20 shrink-0 items-center justify-center"
        aria-hidden
      />
      <motion.article
        className="glass-card tab-modal w-[var(--modal-width)] max-w-[95vw] shrink-0 overflow-hidden p-6 shadow-xl"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <header className="mb-6">
          <h2 className="text-xl font-semibold">Swap</h2>
        </header>
        <section className="flex flex-col gap-4">
          <div className="rounded-xl border border-border bg-muted/10 p-4">
            <p className="mb-2 text-xs text-muted-foreground">Sell</p>
            <div className="flex items-center justify-between gap-2">
              <Input
                type="text"
                inputMode="decimal"
                placeholder="0"
                value={sellAmount}
                onChange={(e) => onSellAmountChange(e.target.value)}
                className="h-12 max-w-full border-0 bg-transparent text-lg font-medium placeholder:text-muted-foreground focus-visible:ring-0"
              />
              <div className="flex gap-1">
                {TOKEN_CONFIGS.map((tokenConfig) => (
                  <TokenPill
                    key={tokenConfig.id}
                    config={tokenConfig}
                    isSelected={swapFromConfigId === tokenConfig.id}
                    onClick={() => onSwapFromChange(tokenConfig.id)}
                  />
                ))}
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-muted/10 p-4">
            <p className="mb-2 text-xs text-muted-foreground">Buy</p>
            <div className="flex items-center justify-between gap-2">
              <Input
                type="text"
                inputMode="decimal"
                placeholder="0"
                value={buyAmount}
                onChange={(e) => onBuyAmountChange(e.target.value)}
                className="h-12 max-w-full border-0 bg-transparent text-lg font-medium placeholder:text-muted-foreground focus-visible:ring-0"
              />
              <div className="flex gap-1">
                {TOKEN_CONFIGS.map((tokenConfig) => (
                  <TokenPill
                    key={tokenConfig.id}
                    config={tokenConfig}
                    isSelected={swapToConfigId === tokenConfig.id}
                    onClick={() => onSwapToChange(tokenConfig.id)}
                  />
                ))}
              </div>
            </div>
          </div>
          <Button
            size="lg"
            className="mt-2 w-full rounded-xl py-6 text-base font-semibold"
            onClick={onConfirm}
          >
            Confirm Swap
          </Button>
        </section>
      </motion.article>
      <div
        ref={tokenToRef as React.RefObject<HTMLDivElement>}
        className="flex size-20 shrink-0 items-center justify-center"
        aria-hidden
      />
    </div>
  );
}
