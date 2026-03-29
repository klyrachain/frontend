"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { isRequestLinkIdHex } from "@/lib/checkout-link-code";
import type { PublicCommercePaymentLink } from "@/types/checkout-public.types";
import { CheckoutTokenQuoteRows } from "@/components/checkout/CheckoutTokenQuoteRows";
import { CheckoutFiatPaystackSection } from "@/components/checkout/CheckoutFiatPaystackSection";

type RequestByLinkPayload = {
  linkId?: string;
  transaction?: {
    id?: string;
    t_amount?: string;
    t_token?: string;
    t_chain?: string;
    toIdentifier?: string;
  };
};

function unwrapData<T>(raw: unknown): T | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as { success?: boolean; data?: unknown };
  if (o.success === true && o.data != null) return o.data as T;
  return null;
}

export function CheckoutCodeClient() {
  const params = useParams();
  const code = typeof params?.code === "string" ? params.code : "";
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [commerce, setCommerce] = useState<PublicCommercePaymentLink | null>(
    null
  );
  const [requestPayload, setRequestPayload] =
    useState<RequestByLinkPayload | null>(null);
  /** Fixed-amount links: FIAT or CRYPTO — both get token quotes + modal (offramp Morapay only for CRYPTO). */
  const shouldShowCheckoutTokenQuotes = useMemo(() => {
    if (!commerce || commerce.amount == null) {
      return false;
    }
    if (commerce.type !== "fixed") return false;
    const kind = (commerce.chargeKind ?? "FIAT").toString().toUpperCase();
    return kind === "FIAT" || kind === "CRYPTO";
  }, [commerce]);

  const invoiceLabel = useMemo(() => {
    if (!commerce?.amount || !commerce.currency) return "";
    return `${commerce.amount} ${commerce.currency}`;
  }, [commerce?.amount, commerce?.currency]);

  useEffect(() => {
    if (!code.trim()) {
      setLoading(false);
      setError("Missing checkout code.");
      return;
    }

    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setError(null);
      setCommerce(null);
      setRequestPayload(null);

      const hex = isRequestLinkIdHex(code);
      const path = hex
        ? `/api/core/requests/by-link/${encodeURIComponent(code.trim())}`
        : `/api/core/public/payment-links/${encodeURIComponent(code.trim())}`;

      try {
        const res = await fetch(path, { cache: "no-store" });
        const json: unknown = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (!res.ok) {
          const msg =
            json && typeof json === "object" && "error" in json
              ? String((json as { error: string }).error)
              : "Could not load this link.";
          setError(msg);
          setLoading(false);
          return;
        }
        if (hex) {
          const data = unwrapData<RequestByLinkPayload>(json);
          if (!data?.transaction) {
            setError("Invalid payment request.");
          } else {
            setRequestPayload(data);
          }
        } else {
          const data = unwrapData<PublicCommercePaymentLink>(json);
          if (!data || data.linkKind !== "commerce") {
            setError("Payment link not found.");
          } else {
            setCommerce(data);
          }
        }
      } catch {
        if (!cancelled) setError("Network error loading checkout.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [code]);

  const payHrefRequest = `/pay?requestLinkId=${encodeURIComponent(code.trim())}`;

  return (
    <article className="glass-card w-full max-w-md overflow-hidden p-6 shadow-xl">
      <header className="mb-4 border-b border-white/10 pb-3">
        <h1 className="text-xl font-semibold text-primary">Checkout</h1>
      </header>

      {loading ? (
        <p className="text-sm text-muted-foreground" aria-busy="true">
          Loading…
        </p>
      ) : null}

      {!loading && error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      {!loading && commerce ? (
        <section className="space-y-4 text-center" aria-label="Payment details">
          <div className="space-y-2">
            <p className="text-[1.65rem] font-semibold leading-tight tabular-nums sm:text-[1.8rem]">
              {commerce.type === "open" ? (
                <span className="text-base font-normal text-muted-foreground">
                  Amount set by payer
                </span>
              ) : (
                <>
                  {commerce.amount} {commerce.currency}
                </>
              )}
            </p>
            <p className="text-sm text-muted-foreground">
              To{" "}
              <span className="font-medium text-foreground">
                {commerce.businessName}
              </span>
            </p>
          </div>
          {shouldShowCheckoutTokenQuotes ? (
            <CheckoutTokenQuoteRows
              enabled={shouldShowCheckoutTokenQuotes}
              fiatAmount={commerce.amount}
              fiatCurrency={commerce.currency}
              invoiceLabel={invoiceLabel}
              invoiceChargeKind={commerce.chargeKind}
              payPageId={commerce.id}
              onContinueToPay={() => {
                /* Wallet / onramp / aggregate signing: extend from payload.flow */
              }}
            />
          ) : null}
          {commerce.type === "fixed" &&
          (commerce.chargeKind ?? "").toString().toUpperCase() === "CRYPTO" &&
          commerce.id ? (
            <CheckoutFiatPaystackSection payPageId={commerce.id} />
          ) : null}
        </section>
      ) : null}

      {!loading && requestPayload?.transaction ? (
        <section className="space-y-4 text-center" aria-label="Payment request">
          <p className="text-sm text-muted-foreground">Payment request</p>
          <p className="text-[1.65rem] font-semibold tabular-nums sm:text-[1.8rem]">
            {requestPayload.transaction.t_amount}{" "}
            {requestPayload.transaction.t_token ?? ""}
          </p>
          <p className="text-sm text-muted-foreground">
            {requestPayload.transaction.t_chain
              ? `On ${requestPayload.transaction.t_chain}`
              : null}
          </p>
          {requestPayload.transaction.toIdentifier ? (
            <p className="text-sm text-muted-foreground">
              To{" "}
              <span className="font-medium text-foreground">
                {requestPayload.transaction.toIdentifier}
              </span>
            </p>
          ) : null}
          <Button asChild size="lg" className="w-full rounded-xl py-6 font-semibold">
            <Link href={payHrefRequest}>Pay this request</Link>
          </Button>
        </section>
      ) : null}

      <footer className="mt-8 border-t border-white/10 pt-4 text-center text-xs text-muted-foreground">
        Powered by Morapay
      </footer>
    </article>
  );
}
