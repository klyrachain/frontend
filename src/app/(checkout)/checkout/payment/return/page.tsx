"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, CreditCard, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TokenIconWithChainBadge } from "@/components/Token/TokenIconWithChainBadge";
import {
  formatPaymentChannelLabel,
  resolveCryptoPaymentVisual,
} from "@/lib/payment-confirmation-display";

type ConfirmationPayload = {
  transactionId: string;
  paymentReference: string;
  businessName: string | null;
  paymentLinkPublicCode: string | null;
  invoiceAmount: string | null;
  invoiceCurrency: string | null;
  paidAmountMajor: string;
  paidCurrency: string;
  chargeKind: string | null;
  /** Present on newer APIs; infer from chargeKind when missing. */
  paymentRail?: "fiat" | "crypto";
  channel: string | null;
  cryptoToken?: string | null;
  cryptoChain?: string | null;
};

type VerifyResponse = {
  success?: boolean;
  data?: {
    status?: string;
    reference?: string;
    amount?: number;
    currency?: string;
    metadata?: { transaction_id?: string };
    confirmation?: ConfirmationPayload | null;
  };
  error?: string;
};

function formatInvoiceAmount(amount: string | null, currency: string | null): string | null {
  if (amount == null || amount === "") return null;
  const n = Number.parseFloat(amount);
  if (!Number.isFinite(n)) return `${amount} ${currency ?? ""}`.trim();
  return `${n.toLocaleString("en-US", { maximumFractionDigits: 8 })} ${currency ?? ""}`.trim();
}

function paymentRailFromConfirmation(c: ConfirmationPayload): "fiat" | "crypto" {
  if (c.paymentRail === "crypto" || c.paymentRail === "fiat") return c.paymentRail;
  return c.chargeKind === "CRYPTO" ? "crypto" : "fiat";
}

function PaymentMethodSection({ confirmation }: { confirmation: ConfirmationPayload | null }) {
  if (!confirmation) return null;
  const rail = paymentRailFromConfirmation(confirmation);
  if (rail === "crypto" && !confirmation.cryptoToken && !confirmation.cryptoChain) {
    return (
      <div className="w-full text-center">
        <p className="text-sm font-medium text-foreground">Crypto</p>
      </div>
    );
  }
  if (rail === "crypto" && (confirmation.cryptoToken || confirmation.cryptoChain)) {
    const { token, chain } = resolveCryptoPaymentVisual(
      confirmation.cryptoToken ?? null,
      confirmation.cryptoChain ?? null
    );
    const title =
      token.name.trim().toUpperCase() !== token.symbol.trim().toUpperCase()
        ? `${token.name} (${token.symbol})`
        : token.symbol;
    return (
      <div className="flex w-full items-center gap-3">
        <TokenIconWithChainBadge token={token} chain={chain} size={48} className="shrink-0" />
        <div className="min-w-0 flex-1 text-center">
          <p className="text-sm font-medium leading-snug text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground">{chain.name}</p>
        </div>
      </div>
    );
  }
  const sub = formatPaymentChannelLabel(confirmation.channel);
  return (
    <div className="flex w-full items-center gap-3">
      <span className="flex size-12 shrink-0 items-center justify-center rounded-full border border-white/15 bg-background/40">
        <CreditCard className="size-6 text-primary" aria-hidden />
      </span>
      <div className="min-w-0 flex-1 text-center">
        <p className="text-sm font-medium text-foreground">Fiat</p>
        {sub ? <p className="text-xs text-muted-foreground">{sub}</p> : null}
      </div>
    </div>
  );
}

function CopyRow({ label, value }: { label: string; value: string }) {
  const [done, setDone] = useState(false);
  const copy = () => {
    void navigator.clipboard.writeText(value);
    setDone(true);
    setTimeout(() => setDone(false), 2000);
  };
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2">
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="truncate font-mono text-xs text-foreground" title={value}>
          {value}
        </p>
      </div>
      <Button type="button" variant="outline" size="sm" className="shrink-0" onClick={copy}>
        {done ? "Copied" : "Copy"}
      </Button>
    </div>
  );
}

export default function PaymentReturnPage() {
  const searchParams = useSearchParams();
  const reference =
    searchParams.get("reference")?.trim() ||
    searchParams.get("trxref")?.trim() ||
    "";
  const [status, setStatus] = useState<"ok" | "fail" | "loading">("loading");
  const [detail, setDetail] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<ConfirmationPayload | null>(null);
  const [verifyRef, setVerifyRef] = useState<string>("");
  const [fallbackTransactionId, setFallbackTransactionId] = useState<string>("");
  const [verifyAmountSubunits, setVerifyAmountSubunits] = useState<number | null>(null);
  const [verifyCurrency, setVerifyCurrency] = useState<string>("");

  useEffect(() => {
    if (!reference) {
      setStatus("fail");
      setDetail("Missing payment reference.");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/klyra/paystack/transactions/verify/${encodeURIComponent(reference)}`,
          { cache: "no-store" }
        );
        const json = (await res.json()) as VerifyResponse;
        if (cancelled) return;
        if (!res.ok || json.success !== true) {
          setStatus("fail");
          setDetail(json.error ?? "Verification failed.");
          return;
        }
        const st = json.data?.status?.toLowerCase() ?? "";
        if (st !== "success") {
          setStatus("fail");
          setDetail(json.data?.status ?? "Payment not completed.");
          return;
        }
        setVerifyRef((json.data?.reference ?? reference).trim());
        setConfirmation(json.data?.confirmation ?? null);
        setFallbackTransactionId(
          String(json.data?.metadata?.transaction_id ?? "").trim()
        );
        const amt = json.data?.amount;
        setVerifyAmountSubunits(typeof amt === "number" && Number.isFinite(amt) ? amt : null);
        setVerifyCurrency(String(json.data?.currency ?? "").trim().toUpperCase());
        setStatus("ok");
        setDetail(null);
      } catch {
        if (!cancelled) {
          setStatus("fail");
          setDetail("Could not verify payment.");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reference]);

  const invoiceLine = confirmation
    ? formatInvoiceAmount(confirmation.invoiceAmount, confirmation.invoiceCurrency)
    : null;
  const paidLine = confirmation
    ? `${confirmation.paidAmountMajor} ${confirmation.paidCurrency}`.trim()
    : null;
  const fallbackPaidLine =
    verifyAmountSubunits != null
      ? `${(verifyAmountSubunits / 100).toLocaleString("en-US", {
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        })} ${verifyCurrency}`.trim()
      : null;
  const headlineAmount = invoiceLine ?? paidLine ?? fallbackPaidLine;

  const transactionId =
    confirmation?.transactionId ?? fallbackTransactionId;

  const paymentReference = verifyRef || reference;

  return (
    <article className="glass-card relative w-full max-w-md overflow-hidden p-6 shadow-xl">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.12),transparent_55%)]" />

      <header className="relative mb-4 border-b border-white/10 pb-3 text-center">
        <h1 className="text-xl font-semibold text-primary">Payment confirmation</h1>
      </header>

      {status === "loading" ? (
        <div className="flex flex-col items-center justify-center gap-4 py-10">
          <Loader2 className="size-10 animate-spin text-primary" aria-hidden />
          <p className="text-sm text-muted-foreground">Checking your payment…</p>
        </div>
      ) : null}

      {status === "fail" ? (
        <p className="text-sm text-destructive" role="alert">
          {detail}
        </p>
      ) : null}

      {status === "ok" ? (
        <div className="relative space-y-5 text-center">
          <div className="flex flex-col items-center gap-2">
            <CheckCircle2
              className="size-14 text-emerald-500"
              strokeWidth={1.75}
              aria-hidden
            />
            <p className="text-sm font-medium text-primary">Payment successful</p>
          </div>

          {headlineAmount ? (
            <div className="space-y-1">
              <p className="text-[1.65rem] font-semibold leading-tight tabular-nums text-foreground sm:text-[1.8rem]">
                {headlineAmount}
              </p>
              {confirmation?.businessName ? (
                <p className="text-sm text-muted-foreground">
                  to{" "}
                  <span className="font-medium text-foreground">{confirmation.businessName}</span>
                </p>
              ) : null}
              {invoiceLine && paidLine && invoiceLine !== paidLine ? (
                <p className="text-xs text-muted-foreground">Paid {paidLine}</p>
              ) : null}
            </div>
          ) : null}

          <div className="flex flex-col gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-4">
            <p className="w-full text-center text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Payment method
            </p>
            <PaymentMethodSection confirmation={confirmation} />
          </div>

          <div className="space-y-2 text-left">
            {paymentReference ? (
              <CopyRow label="Order reference" value={paymentReference} />
            ) : null}
            {transactionId ? <CopyRow label="Transaction ID" value={transactionId} /> : null}
            {confirmation?.paymentLinkPublicCode ? (
              <CopyRow label="Link code" value={confirmation.paymentLinkPublicCode} />
            ) : null}
          </div>
        </div>
      ) : null}

      <p className="relative mt-8 text-center">
        <Link href="/" className="text-sm text-primary underline underline-offset-2">
          Back to home
        </Link>
      </p>
    </article>
  );
}
