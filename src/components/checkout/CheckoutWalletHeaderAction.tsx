"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAccount, useDisconnect } from "wagmi";
import { DynamicConnectButton } from "@dynamic-labs/sdk-react-core";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getDynamicEnvironmentId } from "@/lib/dynamic/dynamic-app-config";

function truncateAddress(addr: string): string {
  if (addr.length < 12) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

/**
 * Checkout header: branded link to pay + URL `wallet` sync for quotes and balances.
 * Requires Dynamic env for connect UI; Wagmi is always available on checkout layout.
 */
export function CheckoutWalletHeaderAction() {
  const envId = getDynamicEnvironmentId();
  if (!envId) {
    return (
      <p className="max-w-40 text-right text-xs text-muted-foreground">
        Wallet linking unavailable
      </p>
    );
  }
  return <CheckoutWalletHeaderInner />;
}

function CheckoutWalletHeaderInner() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const walletInUrl = searchParams.get("wallet")?.trim() ?? "";
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied">("idle");
  const [menuOpen, setMenuOpen] = useState(false);

  const syncWalletQuery = useCallback(
    (nextAddress: string | undefined) => {
      const params = new URLSearchParams(searchParams.toString());
      if (nextAddress?.startsWith("0x") && nextAddress.length >= 42) {
        params.set("wallet", nextAddress);
      } else {
        params.delete("wallet");
      }
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  useEffect(() => {
    if (!isConnected || !address) {
      if (walletInUrl.startsWith("0x") && walletInUrl.length >= 42) {
        syncWalletQuery(undefined);
      }
      return;
    }
    if (walletInUrl.toLowerCase() !== address.toLowerCase()) {
      syncWalletQuery(address);
    }
  }, [address, isConnected, syncWalletQuery, walletInUrl]);

  useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!menuRef.current || (target && menuRef.current.contains(target))) return;
      setMenuOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  if (!isConnected || !address) {
    return (
      <DynamicConnectButton
        buttonClassName={cn(
          buttonVariants({ variant: "default", size: "sm" }),
          "rounded-xl font-medium"
        )}
      >
        Link wallet to pay
      </DynamicConnectButton>
    );
  }

  return (
    <div
      ref={menuRef}
      className="relative"
    >
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="rounded-xl border-white/15 bg-background/40 text-xs tabular-nums"
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        aria-label="Wallet menu"
        onClick={() => {
          setCopyStatus("idle");
          setMenuOpen((prev) => !prev);
        }}
      >
        {truncateAddress(address)}
      </Button>
      {menuOpen ? (
        <div
          className="absolute right-0 z-50 mt-2 w-52 rounded-xl border border-white/10 bg-popover p-2 shadow-2xl"
          role="menu"
          aria-label="Wallet actions"
        >
        <div className="px-2 py-1.5">
          <p className="truncate text-xs font-medium text-foreground" title={address}>
            {address}
          </p>
        </div>
        <div className="my-1 h-px bg-white/10" />
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
            disconnect();
            setMenuOpen(false);
          }}
        >
          Disconnect
        </Button>
        </div>
      ) : null}
    </div>
  );
}
