"use client";

import { useCallback, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

const DICEBEAR_STYLE = "shapes";
const DICEBEAR_BASE = `https://api.dicebear.com/7.x/${DICEBEAR_STYLE}/svg`;

function normalizeLogoUri(input: string | null | undefined): string {
  const raw = input?.trim() ?? "";
  if (!raw) return "";
  // GitHub "tree" URLs do not serve raw image bytes; convert to raw host.
  if (raw.startsWith("https://github.com/") && raw.includes("/tree/")) {
    const converted = raw
      .replace("https://github.com/", "https://raw.githubusercontent.com/")
      .replace("/tree/", "/");
    return converted;
  }
  return raw;
}

function getSymbolFallbackUri(symbol: string): string {
  const normalized = symbol.trim().toUpperCase();
  if (
    normalized === "BTC" ||
    normalized === "WBTC" ||
    normalized === "BTCB" ||
    normalized === "XBT"
  ) {
    return "https://assets.coingecko.com/coins/images/1/standard/bitcoin.png?1696501400";
  }
  return "";
}

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
  const primary = normalizeLogoUri(logoURI);
  const symbolFallback = getSymbolFallbackUri(symbol);
  const [primaryFailed, setPrimaryFailed] = useState(false);
  const [symbolFallbackFailed, setSymbolFallbackFailed] = useState(false);
  const [dicebearFailed, setDicebearFailed] = useState(false);

  const showPrimary = primary.length > 0 && !primaryFailed;
  const showSymbolFallback =
    !showPrimary &&
    symbolFallback.length > 0 &&
    !symbolFallbackFailed;

  const handlePrimaryError = useCallback(() => {
    setPrimaryFailed(true);
  }, []);

  const handleDicebearError = useCallback(() => {
    setDicebearFailed(true);
  }, []);

  const handleSymbolFallbackError = useCallback(() => {
    setSymbolFallbackFailed(true);
  }, []);

  if (showPrimary) {
    return (
      <Image
        src={primary}
        alt={alt}
        width={width}
        height={height}
        unoptimized
        referrerPolicy="no-referrer"
        className={cn("shrink-0 rounded-full object-cover", className)}
        onError={handlePrimaryError}
      />
    );
  }

  if (!dicebearFailed) {
    if (showSymbolFallback) {
      return (
        <Image
          src={symbolFallback}
          alt={alt}
          width={width}
          height={height}
          unoptimized
          referrerPolicy="no-referrer"
          className={cn("shrink-0 rounded-full object-cover", className)}
          onError={handleSymbolFallbackError}
        />
      );
    }
    return (
      <Image
        src={dicebearTokenAvatarUrl(seed)}
        alt={alt}
        width={width}
        height={height}
        unoptimized
        referrerPolicy="no-referrer"
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
