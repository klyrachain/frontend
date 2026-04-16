"use client";

import type { Chain, Token } from "@/types/token";
import { TokenAvatarWithFallback } from "@/components/Token/TokenAvatarWithFallback";
import { cn } from "@/lib/utils";

export type TokenIconWithChainBadgeProps = {
  token: Token | null;
  chain: Chain | undefined;
  /** Outer token circle size in px (default 48). */
  size?: number;
  className?: string;
};

/**
 * Token avatar with small chain badge (bottom-right), matching TransferSelectPanel / pay flow.
 */
export function TokenIconWithChainBadge({
  token,
  chain,
  size = 48,
  className,
}: TokenIconWithChainBadgeProps) {
  const chainIcon = chain?.iconURI;
  const symbol = token?.symbol ?? "?";
  const chainId = token?.chainId ?? chain?.id ?? "0";
  const badge = Math.max(20, Math.round(size * 0.42));

  return (
    <span
      className={cn("relative flex shrink-0", className)}
      style={{ width: size, height: size }}
    >
      <span
        className="flex overflow-hidden rounded-full bg-muted ring-1 ring-border/50"
        style={{ width: size, height: size }}
      >
        <TokenAvatarWithFallback
          logoURI={token?.logoURI}
          symbol={symbol}
          chainId={chainId}
          width={size}
          height={size}
          className="rounded-full"
          alt=""
        />
      </span>
      {chain != null ? (
        <span
          className="absolute -bottom-0.5 -right-0.5 z-10 flex overflow-hidden rounded-full border-0 border-background bg-muted ring-1 ring-border/50"
          style={{ width: badge, height: badge }}
          aria-hidden
        >
          <TokenAvatarWithFallback
            logoURI={chainIcon ?? null}
            symbol={chain.shortName ?? chain.name}
            chainId={`chain:${String(chain.id)}`}
            width={badge}
            height={badge}
            className="rounded-full"
            alt=""
          />
        </span>
      ) : null}
    </span>
  );
}
