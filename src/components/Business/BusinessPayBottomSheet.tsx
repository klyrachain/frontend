"use client";

import {
  useCallback,
  useDeferredValue,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import dynamic from "next/dynamic";
import { ArrowLeft, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { TokenSelectField } from "@/components/flows";
import type { TokenSelection } from "@/components/Exchange/TokenChainSelectModal";
import { TransferSelectPanel } from "@/components/Transfer/TransferSelectPanel";
import { BUSINESS_PAY_BOTTOM_SHEET_SHELL } from "@/components/Transfer/transferSelectSheetClasses";
import { CHAINS, TOKENS } from "@/config/chainsAndTokens";
import { buildSuggestedTokenSelections } from "@/lib/flowTokens";
import { useAppSelector } from "@/store/hooks";
import { useGetChainsQuery, useGetTokensQuery } from "@/store/api/squidApi";
import { formatBusinessFiatTitle } from "@/lib/formatBusinessFiat";
import { cn } from "@/lib/utils";
import { BusinessPayProcessingSection } from "@/components/Business/BusinessPayProcessingSection";
import { useClientMounted } from "@/hooks/use-client-mounted";

const SuggestedTokensRow = dynamic(
  () =>
    import("@/components/Transfer/SuggestedTokensRow").then(
      (m) => m.SuggestedTokensRow
    ),
  { ssr: false }
);

const DRAG_CLOSE_THRESHOLD_PX = 80;
const PAY_PROCESS_DURATION_MS = 20_000;

async function defaultProcessPayment(): Promise<"success" | "failure"> {
  return "success";
}

/** Fixed sheet height so pay / business panels do not shift layout when switching. */
const SHEET_FIXED_HEIGHT_CLASS = "h-[min(85dvh,85vh)] max-h-[85vh]";
type SheetPanel = "pay" | "business" | "selectToken" | "processing";

export interface BusinessPayBottomSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  amountDisplay: string;
  currencyDisplay: string;
  businessName: string;
  businessLogoUrl?: string | null;
  /** Shown on the business detail panel when provided */
  businessDescription?: string | null;
  /**
   * Runs in parallel with the ~20s countdown; result shown after the wait completes.
   * Return `"failure"` to send the user back to pay with “Try one more time”.
   */
  processPayment?: () => Promise<"success" | "failure">;
  /** Optional success illustration (e.g. `/image.png` from public) */
  paymentSuccessImageSrc?: string;
}

function businessInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
}

function SheetRow({
  label,
  labelSuffix,
  onClick,
  children,
  showTrailingChevron,
}: {
  label: string;
  labelSuffix?: React.ReactNode;
  onClick?: () => void;
  children: React.ReactNode;
  showTrailingChevron?: boolean;
}) {
  const interactive = Boolean(onClick);
  const Comp = interactive ? "button" : "div";
  return (
    <Comp
      type={interactive ? "button" : undefined}
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 py-4 text-left ",
        interactive &&
          "cursor-pointer transition-colors"
      )}
    >
      <span className="min-w-0 flex-1 text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          {label}
          {labelSuffix}
        </span>
      </span>
      <div className="flex min-w-0 shrink-0 items-center gap-2">{children}</div>
      {(interactive || showTrailingChevron) && (
        <ChevronRight
          className="size-5 shrink-0 text-muted-foreground/60"
          aria-hidden
        />
      )}
    </Comp>
  );
}

export function BusinessPayBottomSheet({
  open,
  onOpenChange,
  amountDisplay,
  currencyDisplay,
  businessName,
  businessLogoUrl,
  businessDescription,
  processPayment,
  paymentSuccessImageSrc,
}: BusinessPayBottomSheetProps) {
  const payTitleId = useId();
  const businessTitleId = useId();
  const selectTokenTitleId = useId();
  const processingTitleId = useId();
  const [panel, setPanel] = useState<SheetPanel>("pay");
  const [sendSelection, setSendSelection] = useState<TokenSelection | null>(null);
  const [tokenPickerSession, setTokenPickerSession] = useState(0);
  const [payRetrySuggested, setPayRetrySuggested] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(20);
  const [processingPhase, setProcessingPhase] = useState<"working" | "success">(
    "working"
  );
  const [dragOffset, setDragOffset] = useState(0);
  const dragStartY = useRef(0);
  const dragCaptureRef = useRef<HTMLElement | null>(null);
  const processPaymentRef = useRef(processPayment);
  processPaymentRef.current = processPayment;

  const clientMounted = useClientMounted();
  const usedEntries = useAppSelector((s) => s.usedTokens.entries);
  const deferredUsedEntries = useDeferredValue(usedEntries);
  const entriesForSuggestions = clientMounted ? deferredUsedEntries : [];

  useEffect(() => {
    if (open) {
      setPanel("pay");
      setPayRetrySuggested(false);
    }
  }, [open]);

  useEffect(() => {
    if (panel !== "processing") return;

    let cancelled = false;
    setSecondsRemaining(20);
    setProcessingPhase("working");

    const interval = setInterval(() => {
      setSecondsRemaining((s) => Math.max(0, s - 1));
    }, 1000);

    const run = async () => {
      const fn = processPaymentRef.current ?? defaultProcessPayment;
      const paymentPromise = fn();
      await new Promise<void>((r) => setTimeout(r, PAY_PROCESS_DURATION_MS));
      if (cancelled) return;
      try {
        const result = await paymentPromise;
        if (cancelled) return;
        if (result === "success") {
          setProcessingPhase("success");
        } else {
          setPanel("pay");
          setPayRetrySuggested(true);
        }
      } catch {
        if (!cancelled) {
          setPanel("pay");
          setPayRetrySuggested(true);
        }
      }
    };
    void run();

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [panel]);

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

  const { data: apiChains = [], isSuccess: chainsSuccess } = useGetChainsQuery();
  const { data: apiTokens = [], isSuccess: tokensSuccess } = useGetTokensQuery();

  const chains = useMemo(
    () => (chainsSuccess && apiChains.length > 0 ? apiChains : CHAINS),
    [apiChains, chainsSuccess]
  );
  const tokens = useMemo(
    () => (tokensSuccess && apiTokens.length > 0 ? apiTokens : TOKENS),
    [apiTokens, tokensSuccess]
  );

  const suggestedSelections = useMemo(
    () => buildSuggestedTokenSelections(entriesForSuggestions, chains, tokens),
    [entriesForSuggestions, chains, tokens]
  );

  const fiatTitle = formatBusinessFiatTitle(amountDisplay, currencyDisplay);
  const tokenLine = sendSelection
    ? `${amountDisplay} $${sendSelection.token.symbol}`
    : "Select a token";

  const handleSend = useCallback(() => {
    if (!sendSelection) return;
    setPanel("processing");
  }, [sendSelection]);

  const handleProcessingDone = useCallback(() => {
    setPayRetrySuggested(false);
    onOpenChange(false);
  }, [onOpenChange]);

  const isPayPanel = panel === "pay";
  const chromeCloseOnly =
    panel === "pay" || panel === "processing";
  const labelledBy =
    panel === "pay"
      ? payTitleId
      : panel === "business"
        ? businessTitleId
        : panel === "selectToken"
          ? selectTokenTitleId
          : processingTitleId;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          contentAnimation="fade"
          aria-labelledby={labelledBy}
          className={cn(
            "z-[var(--z-modal)] flex flex-col p-0 bg-transparent border-none shadow-none focus:outline-none !duration-300 min-h-0 overflow-hidden !translate-x-0 !translate-y-0",
            SHEET_FIXED_HEIGHT_CLASS,
            BUSINESS_PAY_BOTTOM_SHEET_SHELL
          )}
          style={{ top: "auto" }}
        >
          <div
            className="flex min-h-0 flex-1 flex-col overflow-hidden bg-card shadow-2xl rounded-4xl"
            style={{
              transform:
                dragOffset > 0 ? `translateY(${dragOffset}px)` : "translateY(0px)",
              transition: dragOffset === 0 ? "transform 250ms ease-out" : "none",
            }}
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
              {chromeCloseOnly ? (
                <div className="flex shrink-0 items-center justify-end px-4 pb-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (panel === "processing" && processingPhase === "working") {
                        setPanel("pay");
                        return;
                      }
                      if (panel === "processing" && processingPhase === "success") {
                        handleProcessingDone();
                        return;
                      }
                      onOpenChange(false);
                    }}
                    className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-primary/90"
                    aria-label={
                      panel === "processing" && processingPhase === "working"
                        ? "Cancel payment"
                        : panel === "processing"
                          ? "Close"
                          : "Close"
                    }
                  >
                    <X className="size-5" aria-hidden />
                  </button>
                </div>
              ) : (
                <nav
                  className="flex shrink-0 items-center justify-between gap-3 px-4 pb-3"
                  aria-label="Sheet screen navigation"
                >
                  <button
                    type="button"
                    onClick={() => setPanel("pay")}
                    className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    aria-label="Back to payment"
                  >
                    <ArrowLeft className="size-5" aria-hidden />
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenChange(false)}
                    className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-primary/90"
                    aria-label="Close"
                  >
                    <X className="size-5" aria-hidden />
                  </button>
                </nav>
              )}
            </div>

            <div className="hidden sm:block">
              {chromeCloseOnly ? (
                <div className="flex shrink-0 items-center justify-end px-4 pt-2 pb-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (panel === "processing" && processingPhase === "working") {
                        setPanel("pay");
                        return;
                      }
                      if (panel === "processing" && processingPhase === "success") {
                        handleProcessingDone();
                        return;
                      }
                      onOpenChange(false);
                    }}
                    className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-primary/90"
                    aria-label={
                      panel === "processing" && processingPhase === "working"
                        ? "Cancel payment"
                        : "Close"
                    }
                  >
                    <X className="size-5" aria-hidden />
                  </button>
                </div>
              ) : (
                <nav
                  className="flex shrink-0 items-center justify-between gap-3 px-4 pb-3 pt-2"
                  aria-label="Sheet screen navigation"
                >
                  <button
                    type="button"
                    onClick={() => setPanel("pay")}
                    className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    aria-label="Back to payment"
                  >
                    <ArrowLeft className="size-5" aria-hidden />
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenChange(false)}
                    className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-primary/90"
                    aria-label="Close"
                  >
                    <X className="size-5" aria-hidden />
                  </button>
                </nav>
              )}
            </div>

            <DialogDescription className="sr-only">
              {panel === "pay"
                ? "Confirm payment amount, token, and recipient before sending."
                : panel === "business"
                  ? `Details for recipient ${businessName}.`
                  : panel === "selectToken"
                    ? "Choose a token and network to pay with."
                    : processingPhase === "success"
                      ? "Payment completed successfully."
                      : "Payment is processing, please wait."}
            </DialogDescription>

            {isPayPanel ? (
              <>
                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4">
                  <div className="flex flex-col pt-2 pb-2 sm:pt-4">
                    <DialogTitle
                      id={payTitleId}
                      className="text-left text-[48px] font-bold tracking-tight text-primary w-full"
                    >
                      {fiatTitle}
                    </DialogTitle>
                    <p className="mt-1 text-left text-base text-muted-foreground w-full">
                      {tokenLine}
                    </p>
                  </div>

                  <section
                    className=" space-y-2 pt-4"
                    aria-label="Payment token"
                  >
                    {suggestedSelections.length > 0 && (
                      <SuggestedTokensRow
                        suggestions={suggestedSelections}
                        onSelect={setSendSelection}
                        side="left"
                      />
                    )}
                    <TokenSelectField
                      label="Pay with"
                      selection={sendSelection}
                      onOpenSelect={() => {
                        setTokenPickerSession((k) => k + 1);
                        setPanel("selectToken");
                      }}
                      emptyLabel="Select token"
                      selectAriaLabel="Choose token to pay with"
                    />
                  </section>

                  <div className="mt-4">
                    <SheetRow
                      label="Recipient"
                      showTrailingChevron
                      onClick={() => setPanel("business")}
                      labelSuffix={
                        <span
                          className="inline-flex text-muted-foreground/70"
                          title="View business details"
                        >
                          {/* <Info className="size-3.5" aria-hidden /> */}
                        </span>
                      }
                    >
                      {businessLogoUrl ? (
                        <span className="relative size-5 overflow-hidden rounded-full bg-muted">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={businessLogoUrl}
                            alt=""
                            className="size-4 object-cover"
                          />
                        </span>
                      ) : (
                        <span className="flex size-5 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                          {businessInitials(businessName)}
                        </span>
                      )}
                      <span className="max-w-[10rem] truncate text-right text-sm font-semibold text-primary">
                        {businessName}
                      </span>
                    </SheetRow>

                    <SheetRow label="Total pay">
                      <span className="text-sm font-semibold text-primary">
                        {sendSelection
                          ? `${amountDisplay} $${sendSelection.token.symbol}`
                          : "—"}
                      </span>
                    </SheetRow>
                  </div>

                  <div className="mt-4 flex items-center justify-between rounded-2xl bg-muted/50 px-4 py-3">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Wallet
                      </p>
                      <p className="text-sm font-semibold text-primary">
                        {sendSelection
                          ? `0.00 ${sendSelection.token.symbol}`
                          : "—"}
                      </p>
                    </div>
                    <span className="rounded-lg bg-primary/10 px-2 py-1 text-[10px] font-medium text-primary">
                      {sendSelection?.chain.shortName ?? "—"}
                    </span>
                  </div>
                </div>

                <footer className="shrink-0 px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
                  <Button
                    type="button"
                    size="lg"
                    disabled={!sendSelection}
                    className="h-14 w-full rounded-full text-base font-semibold disabled:opacity-50"
                    onClick={handleSend}
                  >
                    {payRetrySuggested ? "Try one more time" : "Pay"}
                  </Button>
                </footer>
              </>
            ) : panel === "processing" ? (
              <>
                <DialogTitle id={processingTitleId} className="sr-only">
                  {processingPhase === "success"
                    ? "Payment successful"
                    : "Processing payment"}
                </DialogTitle>
                <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
                  <BusinessPayProcessingSection
                    outcome={
                      processingPhase === "success" ? "success" : "pending"
                    }
                    secondsRemaining={secondsRemaining}
                    onDone={handleProcessingDone}
                    successImageSrc={paymentSuccessImageSrc}
                  />
                </div>
                {processingPhase === "working" && (
                  <footer
                    className="shrink-0 px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
                    aria-hidden
                  >
                    <div className="h-14 w-full" />
                  </footer>
                )}
              </>
            ) : panel === "selectToken" ? (
              <>
                <DialogTitle id={selectTokenTitleId} className="sr-only">
                  Select token
                </DialogTitle>
                <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden px-1 sm:px-2">
                  <TransferSelectPanel
                    layout="embedded"
                    chains={chains}
                    tokens={tokens}
                    resetKey={tokenPickerSession}
                    onSelect={(selection) => {
                      setSendSelection(selection);
                      setPanel("pay");
                    }}
                  />
                </div>
                <footer
                  className="shrink-0 px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
                  aria-hidden
                >
                  <div className="h-14 w-full" />
                </footer>
              </>
            ) : (
              <>
                <article className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain px-4">
                  <header className="flex flex-col items-center pt-2 pb-6 text-center sm:pt-4">
                    {businessLogoUrl ? (
                      <span className="relative mb-4 size-24 overflow-hidden rounded-full bg-muted shadow-sm">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={businessLogoUrl}
                          alt=""
                          className="size-24 object-cover"
                        />
                      </span>
                    ) : (
                      <span className="mb-4 flex size-24 items-center justify-center rounded-full bg-muted text-2xl font-bold text-muted-foreground shadow-sm">
                        {businessInitials(businessName)}
                      </span>
                    )}
                    <DialogTitle
                      id={businessTitleId}
                      className="text-2xl font-bold tracking-tight text-primary"
                    >
                      {businessName}
                    </DialogTitle>
                    <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                      {businessDescription?.trim()
                        ? businessDescription
                        : "You are paying this business. Return to the previous screen to choose your token and complete payment."}
                    </p>
                  </header>
                </article>
                <footer
                  className="shrink-0 px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
                  aria-hidden
                >
                  <div className="h-14 w-full" />
                </footer>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
