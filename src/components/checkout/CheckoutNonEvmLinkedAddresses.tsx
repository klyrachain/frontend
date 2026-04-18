"use client";

import { useMemo } from "react";
import { useUserWallets } from "@dynamic-labs/sdk-react-core";
import { getDynamicEnvironmentId } from "@/lib/dynamic/dynamic-app-config";
import {
  isLikelyDynamicEvmChain,
  isNonEvmCheckoutChainId,
  walletMatchesCheckoutChain,
} from "@/lib/checkout-chain-family";
import { cn } from "@/lib/utils";

export function CheckoutNonEvmLinkedAddresses({
  balanceChainId,
  chainName,
  className,
}: {
  balanceChainId: string;
  chainName?: string | null;
  className?: string;
}) {
  const envId = getDynamicEnvironmentId();
  const userWallets = useUserWallets();

  const { matched, fallbackNonEvm } = useMemo(() => {
    const matched = userWallets.filter((w) =>
      walletMatchesCheckoutChain(w.chain, balanceChainId, chainName ?? undefined)
    );
    const fallbackNonEvm = userWallets.filter((w) => !isLikelyDynamicEvmChain(w.chain));
    return { matched, fallbackNonEvm };
  }, [userWallets, balanceChainId, chainName]);

  const rows = matched.length > 0 ? matched : fallbackNonEvm;

  if (!envId || !isNonEvmCheckoutChainId(balanceChainId)) {
    return null;
  }

  if (rows.length === 0) {
    return (
      <div
        className={cn(
          "rounded-md border border-white/10 bg-white/5 px-3 py-2 text-left text-xs text-muted-foreground",
          className
        )}
      >
        <p className="text-foreground/90">
          For {chainName?.trim() || "this network"}, connect the matching wallet with{" "}
          <span className="font-medium">Link wallet to pay</span> (EVM addresses in the URL do not apply).
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-md border border-white/10 bg-white/5 px-3 py-2 text-left text-xs text-muted-foreground",
        className
      )}
    >
      <p className="font-medium text-foreground/90">Linked addresses (Dynamic)</p>
      {matched.length === 0 ? (
        <p className="mt-1 text-[11px] leading-snug">
          No wallet matched this chain automatically; showing other linked non-EVM addresses.
        </p>
      ) : null}
      <ul className="mt-1 space-y-1 break-all font-mono text-[11px] leading-relaxed">
        {rows.map((w, i) => (
          <li key={`${w.id}-${w.address}-${i}`}>
            <span className="text-muted-foreground">{w.key}: </span>
            <span className="select-all text-foreground/85">{w.address}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
