"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function PaystackReturnPage() {
  const searchParams = useSearchParams();
  const reference =
    searchParams.get("reference")?.trim() ||
    searchParams.get("trxref")?.trim() ||
    "";
  const [status, setStatus] = useState<"idle" | "ok" | "fail" | "loading">(
    "loading"
  );
  const [detail, setDetail] = useState<string | null>(null);

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
        const json = (await res.json()) as {
          success?: boolean;
          data?: { status?: string };
          error?: string;
        };
        if (cancelled) return;
        if (res.ok && json.success === true) {
          const st = json.data?.status?.toLowerCase() ?? "";
          if (st === "success") {
            setStatus("ok");
            setDetail("Payment verified.");
          } else {
            setStatus("fail");
            setDetail(json.data?.status ?? "Payment not completed.");
          }
        } else {
          setStatus("fail");
          setDetail(json.error ?? "Verification failed.");
        }
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

  return (
    <article className="glass-card w-full max-w-md overflow-hidden p-6 shadow-xl">
      <header className="mb-4 border-b border-white/10 pb-3">
        <h1 className="text-xl font-semibold text-primary">Payment</h1>
      </header>
      {status === "loading" ? (
        <p className="text-sm text-muted-foreground">Verifying…</p>
      ) : null}
      {status === "ok" ? (
        <p className="text-sm text-primary">{detail}</p>
      ) : null}
      {status === "fail" ? (
        <p className="text-sm text-destructive" role="alert">
          {detail}
        </p>
      ) : null}
      <p className="mt-6 text-center">
        <Link
          href="/"
          className="text-sm text-primary underline underline-offset-2"
        >
          Back to home
        </Link>
      </p>
    </article>
  );
}
