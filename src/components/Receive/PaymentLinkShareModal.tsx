"use client";

import { useCallback, useEffect, useId, useState } from "react";
import Image from "next/image";
import { Copy, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { buildReceiveShareMessage } from "@/config/paymentLinkShare";

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
        "flex min-h-14 min-w-0 flex-1 flex-col items-center justify-center gap-2 rounded-full bg-primary/[0.06] px-2 py-4 transition-colors hover:bg-primary/[0.1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 sm:px-4",
        className
      )}
    >
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/[0.08]">
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
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [dispatchChannel, setDispatchChannel] = useState<"EMAIL" | "SMS">("EMAIL");
  const [dispatchDestination, setDispatchDestination] = useState("");
  const [dispatchBusy, setDispatchBusy] = useState(false);
  const [dispatchError, setDispatchError] = useState<string | null>(null);
  const [dispatchOk, setDispatchOk] = useState(false);
  const linkFieldId = useId();
  const message = buildReceiveShareMessage(paymentLink, amount, tokenSymbol);

  useEffect(() => {
    if (!open || !paymentLink.trim()) {
      setQrDataUrl(null);
      return;
    }
    let cancelled = false;
    void import("qrcode")
      .then((mod) =>
        mod.default.toDataURL(paymentLink, {
          width: 176,
          margin: 2,
          color: { dark: "#0f172a", light: "#ffffff" },
        })
      )
      .then((url) => {
        if (!cancelled) setQrDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setQrDataUrl(null);
      });
    return () => {
      cancelled = true;
    };
  }, [open, paymentLink]);

  useEffect(() => {
    if (!open) {
      setCopied(false);
      setDispatchDestination("");
      setDispatchError(null);
      setDispatchOk(false);
    }
  }, [open]);

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
    try {
      await navigator.clipboard.writeText(paymentLink);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }, [paymentLink]);

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
        contentAnimation="gsap-pop"
        className={cn(
          "flex max-h-[85vh] flex-col gap-0 overflow-hidden border border-border bg-card p-0 text-card-foreground shadow-2xl",
          "max-sm:left-2 max-sm:right-2 max-sm:bottom-2 max-sm:top-auto max-sm:w-[calc(100%-1rem)] max-sm:max-w-none max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-b-none max-sm:rounded-t-3xl max-sm:data-[state=open]:slide-in-from-bottom max-sm:data-[state=closed]:slide-out-to-bottom",
          "sm:left-[50%] sm:top-4 sm:w-full sm:max-w-3xl sm:-translate-x-1/2 sm:translate-y-0 sm:rounded-3xl sm:data-[state=open]:slide-in-from-top-0"
        )}
      >
        <DialogTitle className="sr-only">Your payment link</DialogTitle>
        <DialogDescription className="sr-only">
          Share your Morapay payment link with copy, WhatsApp, or email.
        </DialogDescription>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-8 sm:px-6">
          <p className="mb-4 text-lg font-semibold text-foreground">Share payment link</p>
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            <div className="flex shrink-0 justify-center sm:justify-start">
              {qrDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- data URL from qrcode
                <img
                  src={qrDataUrl}
                  alt="QR code for payment link"
                  width={176}
                  height={176}
                  className="size-44 rounded-xl border border-border bg-white p-2"
                />
              ) : (
                <div
                  className="size-44 shrink-0 rounded-xl border border-border bg-muted/40"
                  aria-hidden
                />
              )}
            </div>
            <div className="min-w-0 flex-1 space-y-4">
              <div>
                <label
                  htmlFor={linkFieldId}
                  className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                >
                  Link
                </label>
                <output
                  id={linkFieldId}
                  className="block max-h-40 overflow-y-auto rounded-xl border border-border bg-muted/20 px-3 py-3 font-mono text-xs leading-relaxed text-foreground sm:text-sm"
                  aria-live="polite"
                >
                  {paymentLink}
                </output>
              </div>
              <div
                role="group"
                aria-label="Share payment link"
                className="flex flex-wrap gap-2 sm:gap-4"
              >
                <SharePlatformButton
                  onClick={handleCopy}
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
            </div>
          </div>

          <section
            className="mt-8 space-y-3 border-t border-border pt-6"
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
              placeholder={dispatchChannel === "EMAIL" ? "payer@example.com" : "+233541234567"}
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
              <p className="text-xs text-muted-foreground">Sent. Dispatch is logged on the server.</p>
            ) : null}
          </section>
        </div>

        <footer className="shrink-0 px-4 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-6">
          <Button
            type="button"
            className="h-14 w-full rounded-2xl text-base font-semibold"
            onClick={() => onOpenChange(false)}
          >
            Done
          </Button>
        </footer>
      </DialogContent>
    </Dialog>
  );
}
