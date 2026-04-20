"use client";

import { useCallback, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import type { Chain, Token } from "@/types/token";
import type { TokenSelection } from "../Exchange/TokenChainSelectModal";
import { TransferSelectPanel } from "@/components/Transfer/TransferSelectPanel";
import type { OnrampDestination } from "@/components/Transfer/TransferOnrampTab";
import type { AggregateAllocation } from "@/lib/aggregate-payment-plan";
import type { AggregateRowView } from "@/components/Transfer/TransferAggregateTab";
import {
  BOTTOM_SHEET_EDGE_CLASSES,
  BOTTOM_SHEET_MOBILE_SLIDE_CLASSES,
} from "@/components/Transfer/transferSelectSheetClasses";

const MODAL_MAX_HEIGHT_CLASS = "max-h-[90vh]";

/** Desktop: center in viewport (base DialogContent is centered; these overrides previously used top-4, which hugged the top). */
const DESKTOP_MODAL_CLASSES =
  "sm:fixed sm:inset-auto sm:left-1/2 sm:top-1/2 sm:w-full sm:max-w-[min(36rem,calc(100vw-2rem))] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:data-[state=open]:zoom-in-95";
const DRAG_CLOSE_THRESHOLD_PX = 100;

interface TransferSelectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (selection: TokenSelection) => void;
  excludeSymbol?: string;
  chains: Chain[];
  tokens: Token[];
  /** Bumps when the dialog opens so the panel can apply `defaultChainFilterId`. */
  chainFilterResetKey?: number;
  priorityChainIds?: string[];
  defaultChainFilterId?: string | null;
  invoiceChargeKind?: "FIAT" | "CRYPTO";
  onMorapayOfframpSelect?: () => void;
  onOnrampChoice?: (destination: OnrampDestination) => void;
  onAggregateApply?: (allocations: AggregateAllocation[]) => void;
  aggregateContext?: {
    walletAddress: string | null;
    invoiceLabel: string;
    rows: AggregateRowView[];
  };
  tokenBalanceByTokenId?: Record<string, string>;
}

export function TransferSelectModal({
  open,
  onOpenChange,
  onSelect,
  excludeSymbol,
  chains,
  tokens,
  chainFilterResetKey = 0,
  priorityChainIds,
  defaultChainFilterId,
  invoiceChargeKind = "FIAT",
  onMorapayOfframpSelect,
  onOnrampChoice,
  onAggregateApply,
  aggregateContext,
  tokenBalanceByTokenId,
}: TransferSelectModalProps) {
  const [dragOffset, setDragOffset] = useState(0);
  const dragStartY = useRef(0);
  const dragCaptureRef = useRef<HTMLElement | null>(null);

  const handleDragStart = useCallback((e: React.PointerEvent) => {
    dragStartY.current = e.clientY;
    setDragOffset(0);
    const el = e.currentTarget as HTMLElement;
    el.setPointerCapture(e.pointerId);
    dragCaptureRef.current = el;
  }, []);

  const handleDragMove = useCallback((e: React.PointerEvent) => {
    if (e.buttons !== 1 && e.pointerType === "mouse") return;
    const dy = e.clientY - dragStartY.current;
    setDragOffset(dy > 0 ? dy : 0);
  }, []);

  const handleDragEnd = useCallback(
    (e: React.PointerEvent) => {
      const el = dragCaptureRef.current;
      if (el) {
        try {
          el.releasePointerCapture(e.pointerId);
        } catch {
          /* ignore */
        }
        dragCaptureRef.current = null;
      }
      setDragOffset((prev) => {
        if (prev > DRAG_CLOSE_THRESHOLD_PX) onOpenChange(false);
        return 0;
      });
    },
    [onOpenChange]
  );

  const handleSelect = useCallback(
    (selection: TokenSelection) => {
      onSelect(selection);
      onOpenChange(false);
    },
    [onSelect, onOpenChange]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        aria-describedby={undefined}
        contentAnimation="gsap-pop"
        className={cn(
          "z-[var(--z-modal)] flex flex-col p-0 bg-transparent border-none shadow-none focus:outline-none !duration-300 min-h-0 overflow-hidden max-sm:rounded-b-none",
          BOTTOM_SHEET_EDGE_CLASSES,
          BOTTOM_SHEET_MOBILE_SLIDE_CLASSES,
          DESKTOP_MODAL_CLASSES,
          MODAL_MAX_HEIGHT_CLASS
        )}
      >
        <div
          className="flex min-h-0 flex-1 flex-col overflow-hidden bg-(--glass-card) shadow-2xl rounded-t-2xl sm:rounded-t-2xl"
          // style={{
          //   transform:
          //     dragOffset > 0 ? `translateY(${dragOffset}px)` : "translateY(0px)",
          //   transition: dragOffset === 0 ? "transform 250ms ease-out" : "none",
          // }}
        >
          <div
            className="sm:hidden flex shrink-0 cursor-grab select-none flex-col touch-none bg-transparent active:cursor-grabbing"
            style={{ touchAction: "none" }}
            onPointerDown={handleDragStart}
            onPointerMove={handleDragMove}
            onPointerUp={handleDragEnd}
            onPointerCancel={handleDragEnd}
            role="presentation"
          >
            <div className="flex shrink-0 justify-center pt-3 pb-1" aria-hidden>
              <span className="h-1 w-12 shrink-0 rounded-full bg-muted-foreground/30" />
            </div>
            {/* <DialogHeader className="flex shrink-0 flex-row items-center justify-between space-y-0 border-b border-border px-4 py-3">
              <DialogTitle className="text-lg font-semibold text-card-foreground">
                Select token
              </DialogTitle>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-primary/90"
                aria-label="Close"
              >
                <X className="size-5" aria-hidden />
              </button>
            </DialogHeader> */}
          </div>

          <DialogHeader className=" shrink-0 flex-row items-center justify-center space-y-0 px-4 mt-4 py-3 sm:flex relative">
            <DialogTitle className="text-lg font-semibold text-card-foreground ">
              Select token
            </DialogTitle>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-primary/90 absolute right-5 top-0"
              aria-label="Close"
            >
              <X className="size-5" aria-hidden />
            </button>
          </DialogHeader>

          <TransferSelectPanel
            layout="modal"
            chains={chains}
            tokens={tokens}
            excludeSymbol={excludeSymbol}
            resetKey={chainFilterResetKey}
            priorityChainIds={priorityChainIds}
            defaultChainFilterId={defaultChainFilterId ?? null}
            onSelect={handleSelect}
            invoiceChargeKind={invoiceChargeKind}
            onMorapayOfframpSelect={() => {
              onMorapayOfframpSelect?.();
              onOpenChange(false);
            }}
            onOnrampChoice={(dest) => {
              onOnrampChoice?.(dest);
              onOpenChange(false);
            }}
            onAggregateApply={(alloc) => {
              onAggregateApply?.(alloc);
              onOpenChange(false);
            }}
            aggregateContext={aggregateContext}
            tokenBalanceByTokenId={tokenBalanceByTokenId}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
