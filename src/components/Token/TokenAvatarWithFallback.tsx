"use client";

import { useCallback, useState } from "react";
import { cn } from "@/lib/utils";

const DICEBEAR_STYLE = "shapes";
const DICEBEAR_BASE = `https://api.dicebear.com/7.x/${DICEBEAR_STYLE}/svg`;

export function dicebearTokenAvatarUrl(seed: string): string {
  return `${DICEBEAR_BASE}?seed=${encodeURIComponent(seed)}`;
}

export type TokenAvatarWithFallbackProps = {
  logoURI?: string | null;
  symbol: string;
  chainId: string;
  width: number;
  height: number;
  className?: string;
  alt?: string;
};

/**
 * Renders token `logoURI` when present and loadable; otherwise DiceBear from a stable seed.
 * If DiceBear fails, shows two-letter symbol initials.
 */
export function TokenAvatarWithFallback({
  logoURI,
  symbol,
  chainId,
  width,
  height,
  className,
  alt = "",
}: TokenAvatarWithFallbackProps) {
  const seed = `${symbol}:${chainId}`;
  const primary = logoURI?.trim() ?? "";
  const [primaryFailed, setPrimaryFailed] = useState(false);
  const [dicebearFailed, setDicebearFailed] = useState(false);

  const showPrimary = primary.length > 0 && !primaryFailed;

  const handlePrimaryError = useCallback(() => {
    setPrimaryFailed(true);
  }, []);

  const handleDicebearError = useCallback(() => {
    setDicebearFailed(true);
  }, []);

  if (showPrimary) {
    return (
      /* eslint-disable-next-line @next/next/no-img-element */
      <img
        src={primary}
        alt={alt}
        width={width}
        height={height}
        className={cn("shrink-0 rounded-full object-cover", className)}
        onError={handlePrimaryError}
      />
    );
  }

  if (!dicebearFailed) {
    return (
      /* eslint-disable-next-line @next/next/no-img-element */
      <img
        src={dicebearTokenAvatarUrl(seed)}
        alt={alt}
        width={width}
        height={height}
        className={cn("shrink-0 rounded-full object-cover", className)}
        onError={handleDicebearError}
      />
    );
  }

  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-muted font-semibold text-foreground",
        className
      )}
      style={{ width, height, fontSize: Math.max(10, width * 0.35) }}
      aria-hidden={alt === ""}
    >
      {symbol.slice(0, 2).toUpperCase()}
    </span>
  );
}
