"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { cn } from "@/lib/utils";
import type { TokenSelection } from "@/components/Exchange/TokenChainSelectModal";

const SUGGESTED_TOKENS_MAX = 5;

export interface SuggestedTokensRowProps {
  suggestions: TokenSelection[];
  onSelect: (s: TokenSelection) => void;
  excludeSymbol?: string;
  side: "left" | "right";
}

export function SuggestedTokensRow({
  suggestions,
  onSelect,
  excludeSymbol,
  side,
}: SuggestedTokensRowProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const list = excludeSymbol
    ? suggestions.filter((s) => s.token.symbol !== excludeSymbol)
    : suggestions;
  const displayList = list.slice(0, SUGGESTED_TOKENS_MAX);

  useGSAP(
    () => {
      if (displayList.length === 0) return;
      const items = containerRef.current?.querySelectorAll("[data-suggest-item]");
      if (!items?.length) return;
      const fromX = side === "left" ? -20 : 20;
      gsap.set(items, { opacity: 0, x: fromX });
      gsap.to(items, {
        opacity: 1,
        x: 0,
        duration: 0.35,
        stagger: { each: 0.05, from: side === "left" ? "start" : "end" },
        ease: "power2.out",
      });
    },
    { dependencies: [displayList.length, side], scope: containerRef }
  );

  if (suggestions.length === 0) return null;
  if (displayList.length === 0) return null;
  return (
    <div
      ref={containerRef}
      className={cn(
        "flex flex-wrap gap-1 px-2 bg-red-500",
        side === "left" ? "justify-start" : "justify-end"
      )}
      role="group"
      aria-label="Quick select token"
    >
      {displayList.map((sel) => (
        <button
          key={sel.token.id}
          data-suggest-item
          type="button"
          onClick={() => onSelect(sel)}
          aria-label={`Select ${sel.token.symbol} on ${sel.chain.shortName ?? sel.chain.name}`}
          className="flex items-center gap-1.5 rounded-full border border-border bg-muted/30 text-sm font-medium text-foreground transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {sel.token.logoURI ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={sel.token.logoURI}
              alt=""
              width={40}
              height={40}
              className="size-6 shrink-0 rounded-full object-cover"
            />
          ) : (
            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
              {sel.token.symbol.slice(0, 2)}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
