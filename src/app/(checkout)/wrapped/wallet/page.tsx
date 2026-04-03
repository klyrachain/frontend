"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

type WrappedData = {
  wallet: string;
  period: string;
  totals?: { transactions: number; completed: number; successRate: number };
};

export default function WalletWrappedPage() {
  const searchParams = useSearchParams();
  const wallet = searchParams.get("wallet")?.trim() ?? "";
  const [data, setData] = useState<WrappedData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!wallet) {
      setError("Connect a wallet first.");
      return;
    }
    (async () => {
      const res = await fetch(
        `/api/core/public/wrapped/wallet?wallet=${encodeURIComponent(wallet)}&period=year`,
        { cache: "no-store" }
      );
      const json = (await res.json().catch(() => ({}))) as {
        success?: boolean;
        data?: WrappedData;
        error?: string;
      };
      if (cancelled) return;
      if (!res.ok || json.success !== true || !json.data) {
        setError(json.error ?? "Could not load wrapped summary.");
        return;
      }
      setData(json.data);
    })().catch(() => {
      if (!cancelled) setError("Could not load wrapped summary.");
    });
    return () => {
      cancelled = true;
    };
  }, [wallet]);

  return (
    <main className="mx-auto w-full max-w-xl space-y-4 p-6">
      <h1 className="text-2xl font-semibold">Your year in review</h1>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {data ? (
        <section className="rounded-lg border border-white/10 bg-white/5 p-4">
          <p className="text-sm text-muted-foreground">Wallet</p>
          <p className="mb-4 break-all font-mono text-xs">{data.wallet}</p>
          <p className="text-sm">Transactions: {data.totals?.transactions ?? 0}</p>
          <p className="text-sm">Completed: {data.totals?.completed ?? 0}</p>
          <p className="text-sm">
            Success rate:{" "}
            {typeof data.totals?.successRate === "number"
              ? `${(data.totals.successRate * 100).toFixed(1)}%`
              : "0%"}
          </p>
        </section>
      ) : null}
    </main>
  );
}
