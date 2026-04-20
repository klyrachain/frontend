"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { cn } from "@/lib/utils";
import type { TokenSelection } from "@/components/Exchange/TokenChainSelectModal";
import { TokenAvatarWithFallback } from "@/components/Token/TokenAvatarWithFallback";

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
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const containerRef = useRef<HTMLDivElement>(null);
  const list = excludeSymbol
    ? suggestions.filter((s) => s.token.symbol !== excludeSymbol)
    : suggestions;
  const displayList = list.slice(0, SUGGESTED_TOKENS_MAX);

  const suggestionFingerprint = useMemo(() => {
    const row = excludeSymbol
      ? suggestions.filter((s) => s.token.symbol !== excludeSymbol)
      : suggestions;
    return row
      .slice(0, SUGGESTED_TOKENS_MAX)
      .map((s) => `${String(s.chain.id)}:${String(s.token.id)}`)
      .join("|");
  }, [suggestions, excludeSymbol]);

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
    {
      dependencies: [displayList.length, side, pathname, suggestionFingerprint],
      scope: containerRef,
    }
  );

  // Avoid hydration mismatch: RTK/cache + deferred used-tokens often differ SSR vs first client paint.
  if (!mounted) return null;
  if (suggestions.length === 0) return null;
  if (displayList.length === 0) return null;
  return (
    <div
      ref={containerRef}
      className={cn(
        "flex flex-wrap gap-1 px-2",
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
          className="flex items-center gap-1.5 rounded-full border border-border bg-muted/30 text-sm font-medium text-card-foreground transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <TokenAvatarWithFallback
            logoURI={sel.token.logoURI}
            symbol={sel.token.symbol}
            chainId={String(sel.chain.id)}
            width={24}
            height={24}
            className="size-6"
            alt=""
          />
        </button>
      ))}
    </div>
  );
}
