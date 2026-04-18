"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ClaimPayload = {
  id: string;
  code: string;
  value: string;
  token: string;
  otpVerified?: boolean;
};

export function ClaimCheckoutClient() {
  const params = useParams();
  const codeFromUrl = String(params.code ?? "").trim().toUpperCase();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [claim, setClaim] = useState<ClaimPayload | null>(null);

  const [otp, setOtp] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpBusy, setOtpBusy] = useState(false);

  const [payoutType, setPayoutType] = useState<"crypto" | "fiat">("crypto");
  const [payoutAddress, setPayoutAddress] = useState("");
  const [fiatType, setFiatType] = useState<"nuban" | "mobile_money">("mobile_money");
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [bankCode, setBankCode] = useState("");
  const [currency, setCurrency] = useState("GHS");

  const [claimBusy, setClaimBusy] = useState(false);
  const [doneMessage, setDoneMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!codeFromUrl) {
      setLoading(false);
      setError("Missing claim code.");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/core/claims/by-code/${encodeURIComponent(codeFromUrl)}`,
          { cache: "no-store" }
        );
        const json: unknown = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (!res.ok) {
          setError((json as { error?: string })?.error ?? "Claim not found.");
          setClaim(null);
          return;
        }
        const data =
          json && typeof json === "object" && "data" in json
            ? (json as { data: ClaimPayload & { otpVerifiedAt?: string | null } }).data
            : null;
        if (!data) {
          setError("Invalid response.");
          return;
        }
        setClaim({
          id: data.id,
          code: data.code,
          value: data.value,
          token: data.token,
          otpVerified: Boolean(data.otpVerifiedAt),
        });
        setOtpVerified(Boolean(data.otpVerifiedAt));
        setError(null);
      } catch {
        if (!cancelled) setError("Could not load claim.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [codeFromUrl]);

  const handleVerifyOtp = async () => {
    if (!claim || !otp.trim()) return;
    setOtpBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/core/claims/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          claim_id: claim.id,
          otp: otp.trim(),
        }),
      });
      const json: unknown = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((json as { error?: string })?.error ?? "OTP verification failed.");
        return;
      }
      setOtpVerified(true);
    } catch {
      setError("Network error.");
    } finally {
      setOtpBusy(false);
    }
  };

  const handleClaim = async () => {
    if (!claim || !otpVerified) return;
    setClaimBusy(true);
    setError(null);
    try {
      const body =
        payoutType === "crypto"
          ? {
              code: claim.code,
              payout_type: "crypto" as const,
              payout_target: payoutAddress.trim(),
            }
          : {
              code: claim.code,
              payout_type: "fiat" as const,
              payout_fiat: {
                type: fiatType,
                account_name: accountName.trim(),
                account_number: accountNumber.trim(),
                bank_code: bankCode.trim(),
                currency: currency.trim(),
              },
            };
      const res = await fetch("/api/core/claims/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json: unknown = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((json as { error?: string })?.error ?? "Claim failed.");
        return;
      }
      const msg =
        json && typeof json === "object" && "data" in json
          ? (json as { data?: { message?: string } }).data?.message
          : null;
      setDoneMessage(msg ?? "Claim completed.");
    } catch {
      setError("Network error.");
    } finally {
      setClaimBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center text-sm text-muted-foreground">
        Loading claim…
      </div>
    );
  }

  if (doneMessage) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <p className="text-lg font-medium text-primary">{doneMessage}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md space-y-6 px-4 py-12">
      <header className="space-y-1 text-center">
        <h1 className="text-2xl font-semibold text-primary">Claim payment</h1>
        {claim ? (
          <p className="text-sm text-muted-foreground">
            {claim.value} {claim.token}
          </p>
        ) : null}
      </header>

      {error ? (
        <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {claim && !otpVerified ? (
        <section className="space-y-3 rounded-xl border border-border p-4">
          <Label htmlFor="claim-otp">OTP from your email or SMS</Label>
          <Input
            id="claim-otp"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder="Enter OTP"
            autoComplete="one-time-code"
          />
          <Button
            type="button"
            className="w-full"
            disabled={otpBusy || otp.trim().length < 4}
            onClick={() => void handleVerifyOtp()}
          >
            {otpBusy ? "Verifying…" : "Verify OTP"}
          </Button>
        </section>
      ) : null}

      {claim && otpVerified ? (
        <section className="space-y-4 rounded-xl border border-border p-4">
          <p className="text-xs font-medium uppercase text-muted-foreground">Payout method</p>
          <div className="flex gap-4">
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="radio"
                name="payout"
                checked={payoutType === "crypto"}
                onChange={() => setPayoutType("crypto")}
              />
              Crypto
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="radio"
                name="payout"
                checked={payoutType === "fiat"}
                onChange={() => setPayoutType("fiat")}
              />
              Fiat
            </label>
          </div>

          {payoutType === "crypto" ? (
            <div className="space-y-1">
              <Label>Receiving wallet (0x…)</Label>
              <Input
                value={payoutAddress}
                onChange={(e) => setPayoutAddress(e.target.value)}
                placeholder="0x…"
                className="font-mono text-sm"
              />
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="fiatType"
                    checked={fiatType === "mobile_money"}
                    onChange={() => setFiatType("mobile_money")}
                  />
                  Mobile money
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="fiatType"
                    checked={fiatType === "nuban"}
                    onChange={() => setFiatType("nuban")}
                  />
                  Bank
                </label>
              </div>
              <div className="space-y-1">
                <Label>Currency</Label>
                <Input value={currency} onChange={(e) => setCurrency(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Account name (verified)</Label>
                <Input value={accountName} onChange={(e) => setAccountName(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Account number</Label>
                <Input value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Bank or provider code</Label>
                <Input
                  value={bankCode}
                  onChange={(e) => setBankCode(e.target.value)}
                  placeholder=""
                />
              </div>
            </div>
          )}

          <Button
            type="button"
            className="w-full"
            disabled={
              claimBusy ||
              (payoutType === "crypto" &&
                (!payoutAddress.startsWith("0x") || payoutAddress.length !== 42)) ||
              (payoutType === "fiat" &&
                (!accountName.trim() || !accountNumber.trim() || !bankCode.trim() || !currency.trim()))
            }
            onClick={() => void handleClaim()}
          >
            {claimBusy ? "Submitting…" : "Complete claim"}
          </Button>
        </section>
      ) : null}
    </div>
  );
}
