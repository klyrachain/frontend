"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useDisconnect } from "wagmi";
import { DynamicConnectButton, useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getDynamicEnvironmentId } from "@/lib/dynamic/dynamic-app-config";
import { usePrimaryEvmWallet } from "@/hooks/use-primary-evm-wallet";

function truncateAddress(addr: string): string {
  if (addr.length < 12) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

/**
 * App / Pay / Receive flows: same wallet affordances as checkout (address + switch + disconnect),
 * using Dynamic primary wallet so the label updates when the user switches connector.
 */
export function FlowsWalletHeaderAction() {
  const envId = getDynamicEnvironmentId();
  if (!envId) {
    return (
      <p className="max-w-[10rem] text-right text-xs text-card-foreground/70">
        Wallet unavailable
      </p>
    );
  }
  return <FlowsWalletHeaderInner />;
}

function FlowsWalletHeaderInner() {
  const { address, isConnected } = usePrimaryEvmWallet();
  const { disconnect } = useDisconnect();
  const { handleLogOut } = useDynamicContext();
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied">("idle");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!menuRef.current || (target && menuRef.current.contains(target))) return;
      setMenuOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  const openMenu = useCallback(() => {
    setCopyStatus("idle");
    setMenuOpen((prev) => !prev);
  }, []);

  if (!isConnected || !address) {
    return (
      <DynamicConnectButton
        buttonClassName={cn(
          buttonVariants({ variant: "outline", size: "sm" }),
          "rounded-xl border-border bg-card text-xs font-medium text-card-foreground shadow-sm hover:bg-muted/80"
        )}
      >
        Connect wallet
      </DynamicConnectButton>
    );
  }

  return (
    <div ref={menuRef} className="relative shrink-0">
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="rounded-xl border border-border bg-card text-xs font-medium tabular-nums text-card-foreground shadow-sm hover:bg-muted/80"
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        aria-label="Wallet menu"
        onClick={openMenu}
      >
        {truncateAddress(address)}
      </Button>
      {menuOpen ? (
        <div
          className="absolute right-0 z-50 mt-2 w-52 rounded-xl border border-border bg-popover p-2 shadow-lg"
          role="menu"
          aria-label="Wallet actions"
        >
          <div className="px-2 py-1.5">
            <p className="truncate text-xs font-medium text-popover-foreground" title={address}>
              {address}
            </p>
          </div>
          <div className="my-1 h-px bg-border" />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-9 w-full justify-start rounded-lg text-xs"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(address);
                setCopyStatus("copied");
              } catch {
                setCopyStatus("idle");
              }
            }}
          >
            {copyStatus === "copied" ? "Copied" : "Copy address"}
          </Button>
          <DynamicConnectButton
            buttonClassName={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "h-9 w-full justify-start rounded-lg text-xs"
            )}
          >
            Switch wallet
          </DynamicConnectButton>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-9 w-full justify-start rounded-lg text-xs text-destructive hover:text-destructive"
            onClick={() => {
              void (async () => {
                try {
                  await handleLogOut();
                } catch {
                  /* still try wagmi */
                }
                try {
                  disconnect();
                } catch {
                  /* noop */
                }
                setMenuOpen(false);
              })();
            }}
          >
            Disconnect
          </Button>
        </div>
      ) : null}
    </div>
  );
}
