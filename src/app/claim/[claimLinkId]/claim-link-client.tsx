"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { isRequestLinkIdHex } from "@/lib/checkout-link-code";

type Step = "recipient" | "otp" | "code" | "payout";

type UnlockedDetails = {
  claim_link_id: string;
  kind: string;
  claim_id?: string;
  transaction_id?: string | null;
  value: string;
  token: string;
  payer_identifier: string;
  to_identifier?: string;
  payout_type_hint?: string;
};

function unwrapData<T>(raw: unknown): T | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as { success?: boolean; data?: unknown };
  if (o.success === true && o.data != null) return o.data as T;
  return null;
}

function OtpSixBoxes({
  value,
  onChange,
  disabled,
  idPrefix,
}: {
  value: string;
  onChange: (six: string) => void;
  disabled?: boolean;
  idPrefix: string;
}) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const digits = (value.replace(/\D/g, "").slice(0, 6) + "      ").slice(0, 6).split("");

  const setAt = (idx: number, d: string) => {
    const cur = value.replace(/\D/g, "").slice(0, 6);
    const arr = cur.padEnd(6, " ").split("");
    arr[idx] = d;
    onChange(arr.join("").replace(/\s/g, ""));
  };

  const onKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (!digits[idx]?.trim() && idx > 0) {
        refs.current[idx - 1]?.focus();
        setAt(idx - 1, "");
      } else {
        setAt(idx, "");
      }
      e.preventDefault();
    }
    if (e.key === "ArrowLeft" && idx > 0) {
      refs.current[idx - 1]?.focus();
      e.preventDefault();
    }
    if (e.key === "ArrowRight" && idx < 5) {
      refs.current[idx + 1]?.focus();
      e.preventDefault();
    }
  };

  const onChangeDigit = (idx: number, raw: string) => {
    const d = raw.replace(/\D/g, "").slice(-1);
    if (!d) {
      setAt(idx, "");
      return;
    }
    setAt(idx, d);
    if (idx < 5) refs.current[idx + 1]?.focus();
  };

  const onPaste = (e: React.ClipboardEvent) => {
    const t = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (t) {
      e.preventDefault();
      onChange(t);
      const next = Math.min(t.length, 5);
      refs.current[next]?.focus();
    }
  };

  return (
    <div className="flex justify-center gap-2" onPaste={onPaste}>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <Input
          key={i}
          id={`${idPrefix}-${i}`}
          ref={(el) => {
            refs.current[i] = el;
          }}
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          maxLength={1}
          disabled={disabled}
          className="h-12 w-11 rounded-lg border-border text-center font-mono text-lg tabular-nums"
          value={digits[i]?.trim() ?? ""}
          onChange={(e) => onChangeDigit(i, e.target.value)}
          onKeyDown={(e) => onKeyDown(i, e)}
        />
      ))}
    </div>
  );
}

const CLAIM_CODE_CHARS = /^[A-Z0-9]$/;

function ClaimCodeBoxes({
  value,
  onChange,
  disabled,
  idPrefix,
}: {
  value: string;
  onChange: (six: string) => void;
  disabled?: boolean;
  idPrefix: string;
}) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const chars = (value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6) + "      ").slice(0, 6).split("");

  const setAt = (idx: number, ch: string) => {
    const cur = value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
    const arr = cur.padEnd(6, " ").split("");
    arr[idx] = ch;
    onChange(arr.join("").replace(/\s/g, ""));
  };

  const onKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (!chars[idx]?.trim() && idx > 0) {
        refs.current[idx - 1]?.focus();
        setAt(idx - 1, "");
      } else {
        setAt(idx, "");
      }
      e.preventDefault();
    }
    if (e.key === "ArrowLeft" && idx > 0) {
      refs.current[idx - 1]?.focus();
      e.preventDefault();
    }
    if (e.key === "ArrowRight" && idx < 5) {
      refs.current[idx + 1]?.focus();
      e.preventDefault();
    }
  };

  const onChangeCh = (idx: number, raw: string) => {
    const u = raw.toUpperCase().slice(-1);
    if (!u) {
      setAt(idx, "");
      return;
    }
    if (!CLAIM_CODE_CHARS.test(u)) return;
    setAt(idx, u);
    if (idx < 5) refs.current[idx + 1]?.focus();
  };

  const onPaste = (e: React.ClipboardEvent) => {
    const t = e.clipboardData
      .getData("text")
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 6);
    if (t.length >= 4) {
      e.preventDefault();
      onChange(t);
      const next = Math.min(t.length, 5);
      refs.current[next]?.focus();
    }
  };

  return (
    <div className="flex justify-center gap-2" onPaste={onPaste}>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <Input
          key={i}
          id={`${idPrefix}-cc-${i}`}
          ref={(el) => {
            refs.current[i] = el;
          }}
          autoComplete="off"
          maxLength={1}
          disabled={disabled}
          className="h-12 w-11 rounded-lg border-border text-center font-mono text-lg uppercase tabular-nums"
          value={chars[i]?.trim() ?? ""}
          onChange={(e) => onChangeCh(i, e.target.value)}
          onKeyDown={(e) => onKeyDown(i, e)}
        />
      ))}
    </div>
  );
}

export function ClaimLinkClient() {
  const params = useParams();
  const claimLinkIdRaw = typeof params?.claimLinkId === "string" ? params.claimLinkId : "";
  const claimLinkId = claimLinkIdRaw.trim().toLowerCase();

  const [linkOk, setLinkOk] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<Step>("recipient");

  const [recipient, setRecipient] = useState("");
  const [otpDigits, setOtpDigits] = useState("");
  const [claimCode, setClaimCode] = useState("");
  const [unlockToken, setUnlockToken] = useState<string | null>(null);
  const [details, setDetails] = useState<UnlockedDetails | null>(null);

  const [busy, setBusy] = useState(false);

  const [payoutType, setPayoutType] = useState<"crypto" | "fiat">("crypto");
  const [payoutAddress, setPayoutAddress] = useState("");
  const [fiatType, setFiatType] = useState<"nuban" | "mobile_money">("mobile_money");
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [bankCode, setBankCode] = useState("");
  const [currency, setCurrency] = useState("GHS");

  const [claimBusy, setClaimBusy] = useState(false);
  const [doneMessage, setDoneMessage] = useState<string | null>(null);

  const loadDetails = useCallback(async (token: string): Promise<boolean> => {
    const res = await fetch(`/api/core/claims/unlocked/${encodeURIComponent(token)}`, { cache: "no-store" });
    const json: unknown = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError((json as { error?: string })?.error ?? "Could not load claim details.");
      return false;
    }
    const data = unwrapData<UnlockedDetails>(json);
    if (!data) {
      setError("Invalid response.");
      return false;
    }
    setDetails(data);
    const hint = (data.payout_type_hint ?? "").toLowerCase();
    if (hint === "fiat" || data.token === "GHS") {
      setPayoutType("fiat");
    }
    setError(null);
    return true;
  }, []);

  useEffect(() => {
    if (!claimLinkId || !isRequestLinkIdHex(claimLinkId)) {
      setLoading(false);
      setError("Invalid claim link.");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/core/claims/by-link/${encodeURIComponent(claimLinkId)}`, {
          cache: "no-store",
        });
        const json: unknown = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (!res.ok) {
          setError((json as { error?: string })?.error ?? "Claim not found.");
          setLinkOk(false);
          return;
        }
        if (!unwrapData<{ claim_link_id?: string }>(json)) {
          setError("Invalid response.");
          return;
        }
        setLinkOk(true);
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
  }, [claimLinkId]);

  const submitRecipient = async () => {
    if (!recipient.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/core/claims/verify-recipient", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ claim_link_id: claimLinkId, recipient: recipient.trim() }),
      });
      const json: unknown = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((json as { error?: string })?.error ?? "Recipient does not match.");
        return;
      }
      setStep("otp");
    } catch {
      setError("Network error.");
    } finally {
      setBusy(false);
    }
  };

  const submitOtp = async () => {
    const otp = otpDigits.replace(/\D/g, "").slice(0, 6);
    if (otp.length !== 6) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/core/claims/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          claim_link_id: claimLinkId,
          recipient: recipient.trim(),
          otp,
        }),
      });
      const json: unknown = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((json as { error?: string })?.error ?? "OTP verification failed.");
        return;
      }
      setStep("code");
    } catch {
      setError("Network error.");
    } finally {
      setBusy(false);
    }
  };

  const submitClaimCode = async () => {
    const code = claimCode.toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (code.length !== 6) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/core/claims/verify-claim-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          claim_link_id: claimLinkId,
          recipient: recipient.trim(),
          code,
        }),
      });
      const json: unknown = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((json as { error?: string })?.error ?? "Invalid claim code.");
        return;
      }
      const data = unwrapData<{ unlock_token?: string }>(json);
      const tok = data?.unlock_token?.trim();
      if (!tok) {
        setError("Invalid response.");
        return;
      }
      setUnlockToken(tok);
      const okDetails = await loadDetails(tok);
      if (okDetails) setStep("payout");
    } catch {
      setError("Network error.");
    } finally {
      setBusy(false);
    }
  };

  const handleClaim = async () => {
    if (!unlockToken || !details) return;
    setClaimBusy(true);
    setError(null);
    try {
      const body =
        payoutType === "crypto"
          ? {
              unlock_token: unlockToken,
              recipient: recipient.trim(),
              payout_type: "crypto" as const,
              payout_target: payoutAddress.trim(),
            }
          : {
              unlock_token: unlockToken,
              recipient: recipient.trim(),
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

  if (doneMessage) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-lg font-medium text-primary">{doneMessage}</p>
      </div>
    );
  }

  return (
    <article className="glass-card mx-auto w-full max-w-lg overflow-visible p-6 shadow-xl">
      <header className="mb-4 border-b border-border/60 pb-3">
        <h1 className="text-xl font-semibold text-card-foreground">Receive payment</h1>
        <p className="mt-1 text-sm text-muted-foreground">Verify your identity, then choose how you receive funds.</p>
      </header>

      {loading && step !== "payout" ? (
        <p className="py-8 text-center text-sm text-muted-foreground" aria-busy="true">
          Loading…
        </p>
      ) : null}

      {error ? (
        <p className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {!loading && linkOk && step === "recipient" ? (
        <section className="space-y-3">
          <Label htmlFor="claim-recipient">Your email or phone</Label>
          <p className="text-xs text-muted-foreground">
            Use the same contact the claim notification was sent to. We use it to match your OTP.
          </p>
          <Input
            id="claim-recipient"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="you@example.com or +233…"
            autoComplete="email"
          />
          <Button type="button" className="w-full" disabled={busy || recipient.trim().length < 3} onClick={() => void submitRecipient()}>
            {busy ? "Checking…" : "Continue"}
          </Button>
        </section>
      ) : null}

      {linkOk && step === "otp" ? (
        <section className="space-y-4">
          <p className="text-sm text-muted-foreground">Enter the 6-digit code from your email or SMS.</p>
          <OtpSixBoxes idPrefix="claim-otp" value={otpDigits} onChange={setOtpDigits} disabled={busy} />
          <Button
            type="button"
            className="w-full"
            disabled={busy || otpDigits.replace(/\D/g, "").length !== 6}
            onClick={() => void submitOtp()}
          >
            {busy ? "Verifying…" : "Verify OTP"}
          </Button>
          <Button type="button" variant="ghost" className="w-full text-muted-foreground" onClick={() => setStep("recipient")}>
            Back
          </Button>
        </section>
      ) : null}

      {linkOk && step === "code" ? (
        <section className="space-y-4">
          <p className="text-sm text-muted-foreground">Enter the 6-character claim code (from the payer or your notification).</p>
          <ClaimCodeBoxes idPrefix="claim-code" value={claimCode} onChange={setClaimCode} disabled={busy} />
          <Button
            type="button"
            className="w-full"
            disabled={busy || claimCode.replace(/[^A-Z0-9]/gi, "").length !== 6}
            onClick={() => void submitClaimCode()}
          >
            {busy ? "Verifying…" : "Verify code"}
          </Button>
          <Button type="button" variant="ghost" className="w-full text-muted-foreground" onClick={() => setStep("otp")}>
            Back
          </Button>
        </section>
      ) : null}

      {linkOk && step === "payout" && details ? (
        <section className="space-y-6">
          <div className="space-y-1 text-center">
            <p className="text-[1.65rem] font-semibold tabular-nums text-card-foreground sm:text-[1.8rem]">
              {details.value} {details.token}
            </p>
            <p className="text-sm text-muted-foreground">
              from{" "}
              <span className="font-medium text-foreground">{details.payer_identifier}</span>
            </p>
            {details.transaction_id ? (
              <p className="text-xs text-muted-foreground">Reference {details.transaction_id.slice(0, 8)}…</p>
            ) : null}
          </div>

          <div className="space-y-4 rounded-xl border border-border/80 bg-background/30 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Receive as</p>
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
                <input type="radio" name="payout" checked={payoutType === "fiat"} onChange={() => setPayoutType("fiat")} />
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
                    <input type="radio" name="fiatType" checked={fiatType === "nuban"} onChange={() => setFiatType("nuban")} />
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
                  <Input value={bankCode} onChange={(e) => setBankCode(e.target.value)} placeholder="" />
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
          </div>
        </section>
      ) : null}

      <footer className={cn("mt-8 text-center text-xs text-muted-foreground", step === "payout" && "pt-4")}>
        Powered by Morapay
      </footer>
    </article>
  );
}
