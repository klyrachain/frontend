"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useParams, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { isRequestLinkIdHex } from "@/lib/checkout-link-code";
import type { PublicCommercePaymentLink } from "@/types/checkout-public.types";
import { CheckoutTokenQuoteRows } from "@/components/checkout/CheckoutTokenQuoteRows";

const CheckoutWalletHeaderAction = dynamic(
  () =>
    import("@/components/checkout/CheckoutWalletHeaderAction").then(
      (module) => module.CheckoutWalletHeaderAction
    ),
  {
    ssr: false,
    loading: () => <span className="h-9 w-28 animate-pulse rounded-xl bg-muted/40" />,
  }
);

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

type CheckoutCodeClientProps = {
  /** `gas` uses Core gas-checkout route (metadata-gated); default uses public slug lookup. */
  linkFetchVariant?: "commerce" | "gas";
};

async function fetchCheckoutResource(path: string): Promise<Response> {
  const backoffMs = [0, 500, 1400];
  let last: Response | null = null;
  for (let i = 0; i < backoffMs.length; i++) {
    const wait = backoffMs[i] ?? 0;
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    try {
      const res = await fetch(path, { cache: "no-store" });
      last = res;
      if (res.ok) return res;
      if (res.status === 429 || res.status >= 500) continue;
      return res;
    } catch {
      last = null;
      continue;
    }
  }
  return last ?? new Response(JSON.stringify({ success: false, error: "Network error loading checkout." }), {
    status: 502,
    headers: { "Content-Type": "application/json" },
  });
}

export function CheckoutCodeClient({
  linkFetchVariant = "commerce",
}: CheckoutCodeClientProps) {
  const params = useParams();
  const searchParams = useSearchParams();
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
      const wallet = searchParams.get("wallet")?.trim() ?? "";
      const path = hex
        ? `/api/core/requests/by-link/${encodeURIComponent(code.trim())}`
        : linkFetchVariant === "gas"
          ? `/api/core/public/payment-links/gas-checkout/${encodeURIComponent(code.trim())}${
              wallet ? `?wallet=${encodeURIComponent(wallet)}` : ""
            }`
          : `/api/core/public/payment-links/${encodeURIComponent(code.trim())}${
              wallet ? `?wallet=${encodeURIComponent(wallet)}` : ""
            }`;

      try {
        const res = await fetchCheckoutResource(path);
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
  }, [code, searchParams, linkFetchVariant]);

  const payHrefRequest = `/pay?requestLinkId=${encodeURIComponent(code.trim())}`;

  return (
    <article className="glass-card w-full max-w-lg overflow-visible p-4 py-6 shadow-2xl">
      <header className="mb-4 flex flex-wrap items-start justify-between gap-3 pb-3">
        <h1 className="text-xl font-semibold text-card-foreground">Checkout</h1>
        <CheckoutWalletHeaderAction />
      </header>

      {loading ? (
        <section className="space-y-4" aria-busy="true" aria-label="Loading checkout">
          <div className="space-y-2 text-center">
            <Skeleton className="mx-auto h-9 w-40 rounded-lg" />
            <Skeleton className="mx-auto h-4 w-32 rounded-md" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-[68px] w-full rounded-lg" />
            <Skeleton className="h-[68px] w-full rounded-lg" />
            <Skeleton className="h-[68px] w-full rounded-lg" />
            <Skeleton className="h-[68px] w-full rounded-lg" />
            <Skeleton className="mt-2 h-9 w-full rounded-lg" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
        </section>
      ) : null}

      {!loading && error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      {!loading && commerce ? (
        <section className="space-y-4 text-center" aria-label="Payment details">
          
          {shouldShowCheckoutTokenQuotes ? (
            <div className="w-full space-y-3 text-left">
              {/* <div
                className="flex w-full gap-1 rounded-xl border border-border/60 bg-background/40 p-1"
                role="tablist"
                aria-label="Checkout payment steps"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={checkoutPayTab === "methods"}
                  className={cn(
                    "min-h-10 flex-1 rounded-lg px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    checkoutPayTab === "methods"
                      ? "bg-card text-card-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  onClick={() => setCheckoutPayTab("methods")}
                >
                  Payment methods
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={checkoutPayTab === "wallet"}
                  disabled={!walletPayPayload}
                  className={cn(
                    "min-h-10 flex-1 rounded-lg px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-45",
                    checkoutPayTab === "wallet"
                      ? "bg-card text-card-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  onClick={() => {
                    if (walletPayPayload) setCheckoutPayTab("wallet");
                  }}
                >
                  Wallet checkout
                </button>
              </div> */}
              <div className="space-y-2 flex flex-col justify-center items-center">
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
                  to{" "}
                  <span className="font-medium text-card-foreground">
                    {commerce.businessName}
                  </span>
                </p>
              </div>
              <CheckoutTokenQuoteRows
                enabled={shouldShowCheckoutTokenQuotes}
                fiatAmount={commerce.amount}
                fiatCurrency={commerce.currency}
                invoiceLabel={invoiceLabel}
                invoiceChargeKind={commerce.chargeKind}
                payPageId={commerce.id}
              />
            </div>
          ) : null}
          {commerce.isOneTime && commerce.isPaid ? (
            <div className="rounded-md bg-background/40 p-3 text-left text-sm">
              {commerce.alreadyPaidVerifiedByConnectedWallet ? (
                <p className="text-primary">
                  This one-time payment link is already paid and verified for your connected wallet.
                </p>
              ) : (
                <p className="text-muted-foreground">
                  This one-time payment link has already been paid. Connect the same wallet used for payment to view verification.
                </p>
              )}
            </div>
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

      <footer className="mt-8 pt-4 text-center text-xs text-muted-foreground">
        Powered by Morapay
      </footer>
    </article>
  );
}
