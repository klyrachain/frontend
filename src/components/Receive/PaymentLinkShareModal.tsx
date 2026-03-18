"use client";

import { useCallback, useEffect, useId, useState } from "react";
import Image from "next/image";
import { ChevronDown, Copy, Mail, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  PAYMENT_LINK_SHARE_INFO,
  PAYMENT_LINK_NEXT_STEPS,
  buildReceiveShareMessage,
} from "@/config/paymentLinkShare";

const FAQ_ITEMS = [
  ...PAYMENT_LINK_NEXT_STEPS.map((item) => ({
    title: item.title,
    body: item.subtitle,
  })),
  ...PAYMENT_LINK_SHARE_INFO.map((item) => ({
    title: item.title,
    body: item.subtitle,
  })),
] as const;

const INITIAL_OPEN: Record<number, boolean> = Object.fromEntries(
  FAQ_ITEMS.map((_, i) => [i, i >= 4])
) as Record<number, boolean>;

export interface PaymentLinkShareModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paymentLink: string;
  amount: string;
  tokenSymbol: string;
}

function SharePlatformButton({
  label,
  onClick,
  ariaLabel,
  children,
  className,
}: {
  label: string;
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
      {/* <span className="line-clamp-2 text-center text-xs font-semibold leading-tight text-primary">
        {label}
      </span> */}
    </button>
  );
}

function CollapsibleFaqItem({
  title,
  body,
  isOpen,
  onToggle,
  id,
}: {
  title: string;
  body: string;
  isOpen: boolean;
  onToggle: () => void;
  id: string;
}) {
  return (
    <div className="rounded-2xl bg-primary/[0.04]">
      <button
        type="button"
        id={`${id}-trigger`}
        aria-expanded={isOpen}
        aria-controls={`${id}-panel`}
        onClick={onToggle}
        className="flex w-full items-center gap-4 px-4 py-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
      >
        <span className="min-w-0 flex-1 text-sm font-semibold leading-snug text-primary">
          {title}
        </span>
        <ChevronDown
          className={cn(
            "size-5 shrink-0 text-primary transition-transform duration-200",
            isOpen && "rotate-180"
          )}
          aria-hidden
        />
      </button>
      <div
        id={`${id}-panel`}
        role="region"
        aria-labelledby={`${id}-trigger`}
        className={cn(
          "grid transition-[grid-template-rows] duration-200 ease-out",
          isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}
      >
        <div className="overflow-hidden">
          <p className="px-4 pb-4 pt-0 text-sm leading-relaxed text-primary/70">
            {body}
          </p>
        </div>
      </div>
    </div>
  );
}

export function PaymentLinkShareModal({
  open,
  onOpenChange,
  paymentLink,
  amount,
  tokenSymbol,
}: PaymentLinkShareModalProps) {
  const [copied, setCopied] = useState(false);
  const [faqOpen, setFaqOpen] = useState<Record<number, boolean>>(INITIAL_OPEN);
  const linkFieldId = useId();
  const faqBaseId = useId();
  const message = buildReceiveShareMessage(paymentLink, amount, tokenSymbol);

  useEffect(() => {
    if (!open) {
      setCopied(false);
      setFaqOpen(INITIAL_OPEN);
    }
  }, [open]);

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
        <DialogDescription className="sr-only">
          Share your Morapay payment link with copy, WhatsApp, or email.
        </DialogDescription>

        {/* <DialogHeader className="flex flex-row items-start justify-between gap-4 space-y-0 border-b border-primary/10 px-6 pb-6 pt-8 text-left">
          <div className="min-w-0 space-y-2 pr-2">
            <DialogTitle className="text-xl font-semibold tracking-tight text-primary">
              Your payment link
            </DialogTitle>
            <p className="text-sm leading-relaxed text-primary/70">
              Share with your payer.
            </p>
          </div>
          <DialogClose
            type="button"
            className="shrink-0 rounded-full p-2 text-primary transition-colors hover:bg-primary/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="Close"
          >
            <X className="size-6" aria-hidden />
          </DialogClose>
        </DialogHeader> */}

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-8 sm:px-6">
              <label
                htmlFor={linkFieldId}
                className="mb-2 block text-xs font-semibold uppercase tracking-wide text-primary"
              >
                Link
              </label>
          <div className="flex gap-8">
            <div className="flex gap-2">
              <output
                id={linkFieldId}
                className="block max-h-5 ellipsis overflow-y-auto break-all rounded-full bg-primary/[0.06] px-4 py-4 font-mono text-xs leading-relaxed text-primary sm:max-h-none sm:text-sm"
                aria-live="polite"
              >
                {paymentLink}
              </output>
                <div
              role="group"
              aria-label="Share payment link"
              className="flex gap-2 sm:gap-4 justify-center items-center"
            >
              <SharePlatformButton
                label={copied ? "Copied" : "Copy"}
                onClick={handleCopy}
                ariaLabel="Copy link to clipboard"
              >
                <Copy className="size-5 text-primary" aria-hidden />
              </SharePlatformButton>
              <SharePlatformButton
                label="WhatsApp"
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
              <SharePlatformButton
                label="Email"
                onClick={handleEmail}
                ariaLabel="Share link via email"
              >
                <Mail className="size-5 text-primary" aria-hidden />
              </SharePlatformButton>
                </div>
            </div>


            {/* <section aria-labelledby={`${faqBaseId}-heading`}>
              <h2
                id={`${faqBaseId}-heading`}
                className="mb-4 text-base font-semibold text-primary"
              >
                What to do next & FAQ
              </h2>
              <div className="flex flex-col gap-4">
                {FAQ_ITEMS.map((item, index) => (
                  <CollapsibleFaqItem
                    key={`${item.title}-${index}`}
                    id={`${faqBaseId}-${index}`}
                    title={item.title}
                    body={item.body}
                    isOpen={faqOpen[index] ?? false}
                    onToggle={() =>
                      setFaqOpen((prev) => ({
                        ...prev,
                        [index]: !prev[index],
                      }))
                    }
                  />
                ))}
              </div>
            </section> */}
          </div>
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
