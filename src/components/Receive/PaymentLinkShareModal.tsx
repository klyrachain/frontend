"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Copy, Download, Mail } from "lucide-react";
import { domToBlob, waitUntilLoad } from "modern-screenshot";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { buildReceiveShareMessage } from "@/config/paymentLinkShare";
import { SupportedNetworksCarousel } from "@/components/Receive/supported-networks-carousel";

export interface PaymentLinkShareModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paymentLink: string;
  amount: string;
  tokenSymbol: string;
  receiveMode?: "CRYPTO" | "FIAT";
  chainId?: string;
  optionalSenderContact?: string;
  countryName?: string;
}

function notifySenderEmailFromContact(contact: string | undefined): string | undefined {
  const t = contact?.trim() ?? "";
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t) ? t : undefined;
}

function isSameOriginResourceUrl(url: string): boolean {
  if (!url || url.startsWith("data:")) return true;
  try {
    return new URL(url, window.location.href).origin === window.location.origin;
  } catch {
    return false;
  }
}

function screenshotFilter(node: Node): boolean {
  if (!(node instanceof Element)) return true;
  if (node.closest("[data-screenshot-ignore]")) return false;
  if (node instanceof HTMLImageElement) {
    const src = node.currentSrc || node.src;
    return isSameOriginResourceUrl(src);
  }
  if (typeof SVGImageElement !== "undefined" && node instanceof SVGImageElement) {
    const href =
      node.getAttribute("href") ||
      node.getAttribute("xlink:href") ||
      (node as SVGImageElement).href?.baseVal ||
      "";
    return isSameOriginResourceUrl(href);
  }
  return true;
}

function SharePlatformButton({
  onClick,
  ariaLabel,
  children,
  className,
}: {
  onClick: () => void;
  ariaLabel: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className={cn(
        "flex min-h-14 w-full min-w-0 flex-col items-center justify-center gap-2 rounded-full bg-primary/6 px-2 py-4 transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 sm:px-4",
        className
      )}
    >
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/8">
        {children}
      </span>
    </button>
  );
}

export function PaymentLinkShareModal({
  open,
  onOpenChange,
  paymentLink,
  amount,
  tokenSymbol,
  receiveMode = "CRYPTO",
  chainId,
  optionalSenderContact,
  countryName,
}: PaymentLinkShareModalProps) {
  const [copied, setCopied] = useState(false);
  const [savedCard, setSavedCard] = useState(false);
  const [dispatchChannel, setDispatchChannel] = useState<"EMAIL" | "SMS">("EMAIL");
  const [dispatchDestination, setDispatchDestination] = useState("");
  const [dispatchBusy, setDispatchBusy] = useState(false);
  const [dispatchError, setDispatchError] = useState<string | null>(null);
  const [dispatchOk, setDispatchOk] = useState(false);
  const captureCardRef = useRef<HTMLDivElement>(null);
  const qrMeasureRef = useRef<HTMLDivElement>(null);
  const [qrSize, setQrSize] = useState(248);

  const trimmedLink = paymentLink.trim();
  const message = buildReceiveShareMessage(paymentLink, amount, tokenSymbol);

  const headline = useMemo(() => {
    const amt = amount.trim() || "—";
    return `${amt} ${tokenSymbol}`;
  }, [amount, tokenSymbol]);

  const subtitle = useMemo(() => {
    if (receiveMode === "FIAT") {
      const c = countryName?.trim();
      return c ? `Fiat request · ${c}` : "Fiat payment request";
    }
    return "Crypto payment request";
  }, [receiveMode, countryName]);

  useEffect(() => {
    if (!open) {
      setCopied(false);
      setSavedCard(false);
      setDispatchDestination("");
      setDispatchError(null);
      setDispatchOk(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open || !trimmedLink) return;
    const el = qrMeasureRef.current;
    if (!el) return;
    const measure = () => {
      const w = el.getBoundingClientRect().width;
      const next = Math.max(160, Math.min(268, Math.floor(w)));
      setQrSize((prev) => (prev === next ? prev : next));
    };
    measure();
    const ro = new ResizeObserver(() => measure());
    ro.observe(el);
    return () => ro.disconnect();
  }, [open, trimmedLink]);

  const handleDispatch = async () => {
    const dest = dispatchDestination.trim();
    if (!dest) {
      setDispatchError("Enter an email or phone number.");
      return;
    }
    setDispatchBusy(true);
    setDispatchError(null);
    setDispatchOk(false);
    try {
      const res = await fetch("/api/core/payment-link-dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel: dispatchChannel,
          destination: dest,
          link_url: paymentLink,
          amount,
          token_symbol: tokenSymbol,
          chain_id: chainId,
          receive_mode: receiveMode,
          notify_sender_email: notifySenderEmailFromContact(optionalSenderContact),
          country_name: countryName?.trim() || undefined,
        }),
      });
      const json: unknown = await res.json().catch(() => ({}));
      if (!res.ok) {
        const err =
          json && typeof json === "object" && "error" in json
            ? String((json as { error?: string }).error ?? "")
            : "";
        setDispatchError(err || "Could not send.");
        return;
      }
      setDispatchOk(true);
      setDispatchDestination("");
    } catch {
      setDispatchError("Network error.");
    } finally {
      setDispatchBusy(false);
    }
  };

  const handleCopy = useCallback(async () => {
    if (!trimmedLink) return;
    try {
      await navigator.clipboard.writeText(paymentLink);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }, [paymentLink, trimmedLink]);

  const downloadShareCardPng = useCallback(async () => {
    const node = captureCardRef.current;
    if (!node || !trimmedLink) return;

    const baseName =
      `${headline}-${receiveMode}`
        .trim()
        .replace(/[^a-zA-Z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 64) || "receive-pay-link";

    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => resolve());
      });
    });
    await new Promise<void>((r) => setTimeout(r, 200));
    await waitUntilLoad(node, { timeout: 8000 }).catch(() => {});

    const rect = node.getBoundingClientRect();
    const w = Math.max(1, Math.ceil(rect.width));
    const h = Math.max(1, Math.ceil(rect.height));

    const triggerBlobDownload = (blob: Blob) => {
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = `${baseName}.png`;
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      a.remove();
      queueMicrotask(() => URL.revokeObjectURL(objectUrl));
      setSavedCard(true);
      window.setTimeout(() => setSavedCard(false), 2000);
    };

    const captureOptions = {
      width: w,
      height: h,
      scale: 2,
      backgroundColor: "#ffffff" as const,
      font: false as const,
      filter: screenshotFilter,
      fetch: {
        bypassingCache: true as const,
        requestInit: { mode: "cors" as const, credentials: "omit" as const },
      },
      style: {
        backdropFilter: "none",
        backgroundColor: "rgb(255 255 255 / 0.96)",
        ...({ WebkitBackdropFilter: "none" } as Record<string, string>),
      } as Partial<CSSStyleDeclaration>,
    };

    try {
      const blob = await domToBlob(node, captureOptions);
      if (blob.size > 256) {
        triggerBlobDownload(blob);
        return;
      }
    } catch {
      /* retry smaller */
    }

    try {
      const blob = await domToBlob(node, { ...captureOptions, scale: 1 });
      if (blob.size > 256) {
        triggerBlobDownload(blob);
      }
    } catch {
      /* raster failed */
    }
  }, [headline, receiveMode, trimmedLink]);

  const handleWhatsApp = useCallback(() => {
    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }, [message]);

  const handleEmail = useCallback(() => {
    const subject = encodeURIComponent(`Payment request — ${amount} ${tokenSymbol}`);
    const body = encodeURIComponent(message);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  }, [amount, message, tokenSymbol]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        contentAnimation="fade"
        className={cn(
          "box-border w-full min-w-0 max-w-[min(28rem,calc(100vw-1rem))] max-h-[min(92vh,880px)] overflow-x-hidden overflow-y-auto border-none bg-transparent p-3 shadow-none sm:p-4",
          "text-foreground",
          "max-sm:left-2 max-sm:right-2 max-sm:bottom-2 max-sm:top-auto max-sm:max-h-[85vh] max-sm:w-[calc(100%-1rem)] max-sm:max-w-none max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-t-3xl max-sm:rounded-b-none max-sm:data-[state=open]:slide-in-from-bottom max-sm:data-[state=closed]:slide-out-to-bottom",
          "sm:left-[50%] sm:top-4 sm:max-w-md sm:-translate-x-1/2 sm:translate-y-0 sm:rounded-none sm:data-[state=open]:slide-in-from-top-0"
        )}
      >
        <DialogTitle className="sr-only">Your payment link</DialogTitle>
        <DialogDescription className="sr-only">
          Share your Morapay payment link with copy, WhatsApp, or email.
        </DialogDescription>

        {/* <div
          className="pointer-events-none absolute -inset-4 rounded-full blur-3xl z-0 bg-red-500"
          aria-hidden
        /> */}

        <div className="relative z-10 flex min-h-0 w-full min-w-0 flex-col gap-5">
          <div
            ref={captureCardRef}
            className="flex w-full min-w-0 max-w-full flex-col items-stretch overflow-hidden rounded-[2rem] border border-white/20 bg-white/60 p-4 shadow-[0_20px_50px_rgba(0,0,0,0.28)] backdrop-blur-xl  sm:p-6 md:p-8"
          >
            <div className="flex w-full min-w-0 items-center justify-between gap-2 sm:gap-3">
              <div className="min-w-0 flex-1 overflow-hidden">
                <h3 className="text-lg font-semibold tracking-tight text-black wrap-break-word">
                  {headline}
                </h3>
                <p className="mt-0 text-xs text-black/70">{subtitle}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <p className="hidden text-sm font-medium text-black sm:block">
                  Morapay
                </p>
                <Avatar className="size-9 rounded-2xl">
                  <AvatarFallback className="rounded-2xl text-sm font-semibold">
                    MP
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>

              <div className="relative mt-4 w-full min-w-0 max-w-full rounded-2xl bg-white p-2 shadow-inner ring-1 ring-black/5 sm:mt-5 sm:p-3 md:p-4">
              <div
                className="absolute left-2 top-2 size-4 border-l-2 border-t-2 border-primary"
                aria-hidden
              />
              <div
                className="absolute right-2 top-2 size-4 border-r-2 border-t-2 border-primary"
                aria-hidden
              />
              <div
                className="absolute bottom-2 left-2 size-4 border-b-2 border-l-2 border-primary"
                aria-hidden
              />
              <div
                className="absolute bottom-2 right-2 size-4 border-b-2 border-r-2 border-primary"
                aria-hidden
              />

              {trimmedLink ? (
                <div
                  ref={qrMeasureRef}
                  className="mx-auto flex w-full min-w-0 max-w-full justify-center [&_svg]:max-h-full [&_svg]:max-w-full [&_svg]:shrink-0"
                >
                  <QRCodeSVG
                    value={paymentLink}
                    size={qrSize}
                    level="Q"
                    includeMargin={false}
                    className="block shrink-0 rounded-lg"
                  />
                </div>
              ) : null}
            </div>

            <div className="mb-1 mt-3 flex w-full min-w-0 max-w-full flex-col items-center gap-4 sm:mt-4">
              {receiveMode === "CRYPTO" ? (
                <>
                  <p className="px-1 text-center text-xs font-medium text-black/70">
                    Pay with tokens from supported networks
                  </p>
                  <SupportedNetworksCarousel
                    enabled={open}
                    itemPx={64}
                    gapPx={16}
                    iconSize={48}
                    showCenterFrame
                    showEdgeGradient
                  />
                </>
              ) : (
                <p className="text-center text-xs font-medium text-black/70">
                  Payer completes with card or mobile money (Paystack).
                </p>
              )}
            </div>

            <div className="mt-2 flex w-full min-w-0 max-w-full flex-col gap-3">
              <div className="flex w-full min-w-0 items-center gap-2 rounded-xl bg-black/5 p-2 sm:p-3 ">
                <p className="min-w-0 flex-1 truncate text-left font-mono text-xs font-semibold text-black sm:text-sm">
                  {trimmedLink || "—"}
                </p>
                <div
                  className="flex shrink-0 items-center gap-1.5"
                  data-screenshot-ignore
                >
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="size-8 shrink-0 active:scale-[0.98] bg-black text-white hover:bg-black/90"
                    disabled={!trimmedLink}
                    aria-label="Download share card as PNG"
                    title="Download share card as PNG"
                    onClick={() => void downloadShareCardPng()}
                  >
                    <Download className="size-3.5" aria-hidden />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="size-8 shrink-0 bg-black text-white hover:bg-black/90 active:scale-[0.98]"
                    disabled={!trimmedLink}
                    aria-label={copied ? "Copied" : "Copy pay link"}
                    title={copied ? "Copied" : "Copy pay link"}
                    onClick={() => void handleCopy()}
                  >
                    <Copy className="size-3.5" aria-hidden />
                  </Button>
                </div>
              </div>
              {copied ? (
                <p className="text-center text-xs text-muted-foreground" role="status">
                  Link copied.
                </p>
              ) : null}
              {!copied && savedCard ? (
                <p className="text-center text-xs text-muted-foreground" role="status">
                  Card saved.
                </p>
              ) : null}
            </div>

            <p className="mt-4 text-sm text-black/80 text-center">Powered by morapay</p>
          </div>

          {/* <div className="w-full min-w-0 max-w-full rounded-2xl border border-border/60 bg-card/90 p-3 shadow-lg backdrop-blur-md dark:bg-card/70 sm:p-4 md:p-5">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Share
            </p>
            <div
              role="group"
              aria-label="Share payment link"
              className="grid min-w-0 grid-cols-3 gap-2 sm:gap-3"
            >
              <SharePlatformButton
                onClick={() => void handleCopy()}
                ariaLabel={copied ? "Copied" : "Copy link to clipboard"}
              >
                <Copy className="size-5 text-primary" aria-hidden />
              </SharePlatformButton>
              <SharePlatformButton
                onClick={handleWhatsApp}
                ariaLabel="Share link via WhatsApp"
                className="hover:bg-[#25D366]/8"
              >
                <Image
                  src="/icons/whatsapp.svg"
                  alt=""
                  width={24}
                  height={24}
                  className="size-6"
                />
              </SharePlatformButton>
              <SharePlatformButton onClick={handleEmail} ariaLabel="Share link via email">
                <Mail className="size-5 text-primary" aria-hidden />
              </SharePlatformButton>
            </div>

            <section
              className="mt-6 space-y-3 border-t border-border/60 pt-5"
              aria-label="Send link by email or SMS"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Send link
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={dispatchChannel === "EMAIL" ? "default" : "outline"}
                  className="rounded-full"
                  onClick={() => setDispatchChannel("EMAIL")}
                >
                  Email
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={dispatchChannel === "SMS" ? "default" : "outline"}
                  className="rounded-full"
                  onClick={() => setDispatchChannel("SMS")}
                >
                  SMS
                </Button>
              </div>
              <Input
                value={dispatchDestination}
                onChange={(e) => setDispatchDestination(e.target.value)}
                placeholder={
                  dispatchChannel === "EMAIL" ? "payer@example.com" : "+233541234567"
                }
                className="rounded-xl font-mono text-sm"
                autoComplete={dispatchChannel === "EMAIL" ? "email" : "tel"}
              />
              <Button
                type="button"
                variant="secondary"
                className="w-full rounded-xl"
                disabled={dispatchBusy || !dispatchDestination.trim()}
                onClick={() => void handleDispatch()}
              >
                {dispatchBusy ? "Sending…" : `Send via ${dispatchChannel === "EMAIL" ? "email" : "SMS"}`}
              </Button>
              {dispatchError ? (
                <p className="text-xs text-destructive">{dispatchError}</p>
              ) : null}
              {dispatchOk ? (
                <p className="text-xs text-muted-foreground">
                  Sent. Dispatch is logged on the server.
                </p>
              ) : null}
            </section>
          </div> */}

          <Button
            type="button"
            className="h-14 w-full min-w-0 max-w-full shrink-0 rounded-2xl text-base font-semibold"
            onClick={() => onOpenChange(false)}
          >
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
