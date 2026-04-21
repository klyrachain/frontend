"use client";

import type { ClipboardEvent, FormEvent, KeyboardEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useParams, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { isRequestLinkIdHex } from "@/lib/checkout-link-code";
import { usePrimaryEvmWallet } from "@/hooks/use-primary-evm-wallet";
import { CheckoutTokenQuoteRows } from "@/components/checkout/CheckoutTokenQuoteRows";
import type { CheckoutDisplayRow } from "@/lib/checkout-display-rows";
import type { PayoutQuoteRowState } from "@/hooks/use-checkout-payout-quotes";
import { FlagSelect } from "@/components/flows";
import { resolveCheckoutPaystackFiat } from "@/lib/paystack-market-fiat";

const CheckoutWalletHeaderAction = dynamic(
  () =>
    import("@/components/checkout/CheckoutWalletHeaderAction").then(
      (m) => m.CheckoutWalletHeaderAction
    ),
  {
    ssr: false,
    loading: () => <span className="h-9 w-28 animate-pulse rounded-xl bg-muted/40" />,
  }
);

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
  sent_summary?: string;
  f_chain?: string;
  f_token?: string;
  f_amount?: string;
  t_chain?: string;
  t_token?: string;
  t_amount?: string;
  crypto_payout_allowed?: boolean;
  /** Payer settled with Paystack fiat (MOMO/BANK leg). */
  sender_paid_fiat?: boolean;
  claim_fiat_allowed?: boolean;
  claim_crypto_allowed?: boolean;
};

function unwrapData<T>(raw: unknown): T | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as { success?: boolean; data?: unknown };
  if (o.success === true && o.data != null) return o.data as T;
  return null;
}

/** Maps Core/BFF errors to a clearer line for the claim UI (see `code` on 500 responses). */
function claimApiErrorMessage(
  status: number,
  json: unknown,
  fallback: string
): string {
  const o = json && typeof json === "object" ? (json as { error?: string; code?: string }) : {};
  const err = o.error?.trim();
  if (status === 503 && o.code === "BACKEND_NOT_CONFIGURED") {
    return err || "Payment API is not configured for this deployment.";
  }
  if (status === 502) {
    return err || "Could not reach the payment service. Check your network or try again.";
  }
  if (status === 500 && o.code === "CLAIM_LINK_LOOKUP_FAILED") {
    return err || "Could not load this claim page. Try again in a moment.";
  }
  if (status === 500 && o.code === "CLAIM_UNLOCK_LOAD_FAILED") {
    return err || "Could not load claim details after verification. Try again in a moment.";
  }
  if (status === 404) {
    return err || "Claim not found or no longer available.";
  }
  if (status === 400) {
    return err || fallback;
  }
  return err || fallback;
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

  const onKeyDown = (idx: number, e: KeyboardEvent<HTMLInputElement>) => {
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

  const onPaste = (e: ClipboardEvent) => {
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

  const onKeyDown = (idx: number, e: KeyboardEvent<HTMLInputElement>) => {
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

  const onPaste = (e: ClipboardEvent) => {
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

/** Headline amount/token — aligned with what the payer sent (`f_*` / fiat), not stale `claim.value` / `claim.token`. */
function payerSentHeadline(d: UnlockedDetails): string {
  if (d.sender_paid_fiat && d.f_amount?.trim() && d.f_token?.trim()) {
    return `${d.f_amount.trim()} ${d.f_token.trim()}`;
  }
  if (d.f_amount?.trim() && d.f_token?.trim() && d.f_chain?.trim()) {
    return `${d.f_amount.trim()} ${d.f_token.trim()} on ${d.f_chain.trim()}`;
  }
  const amt = (d.t_amount ?? d.value).trim();
  const tok = (d.t_token ?? d.token).trim();
  const ch = (d.t_chain ?? "").trim();
  if (amt && tok && ch) return `${amt} ${tok} on ${ch}`;
  if (amt && tok) return `${amt} ${tok}`;
  return "";
}

function settlementMatchesQuote(
  details: UnlockedDetails,
  row: CheckoutDisplayRow,
  quotes: Record<string, PayoutQuoteRowState>
): boolean {
  const st = quotes[row.id];
  if (!st || st.loading || st.error) return false;
  const amt = st.cryptoAmount?.trim() ?? "";
  if (!amt || !(st.cryptoSymbol ?? "").trim()) return false;
  const { t_chain, t_token } = coreSettlementFromDisplayRow(row);
  const dChain = (details.t_chain ?? "").trim().toUpperCase();
  const dToken = (details.t_token ?? "").trim().toUpperCase();
  const dAmt = (details.t_amount ?? "").trim();
  if (!dChain || !dToken || !dAmt) return false;
  if (dChain !== t_chain.toUpperCase() || dToken !== t_token.toUpperCase()) return false;
  const nQ = Number(amt);
  const nD = Number(dAmt);
  if (!Number.isFinite(nQ) || !Number.isFinite(nD)) return amt === dAmt;
  return Math.abs(nQ - nD) <= Math.max(1e-9, 1e-6 * Math.abs(nD));
}

function coreSettlementFromDisplayRow(row: CheckoutDisplayRow): { t_chain: string; t_token: string } {
  const spec = row.spec;
  if (spec.kind === "composite_wxrp") {
    return { t_chain: "ETHEREUM", t_token: "WXRP" };
  }
  return {
    t_chain: spec.chain.trim().toUpperCase(),
    t_token: spec.symbol.trim().toUpperCase(),
  };
}

type PaystackCountryRow = {
  code: string;
  name: string;
  currency: string;
  supportedPaystack: boolean;
};

export function ClaimLinkClient() {
  const params = useParams();
  const searchParams = useSearchParams();
  const recipientPref = searchParams.get("recipient");
  const claimLinkIdRaw = typeof params?.claimLinkId === "string" ? params.claimLinkId : "";
  const claimLinkId = claimLinkIdRaw.trim().toLowerCase();
  const { address: walletAddress, isConnected } = usePrimaryEvmWallet();

  const [linkOk, setLinkOk] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<Step>("recipient");
  const [recipientHint, setRecipientHint] = useState<string | null>(null);

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
  const [claimQuoteCtx, setClaimQuoteCtx] = useState<{
    selectedRow: CheckoutDisplayRow | null;
    quotes: Record<string, PayoutQuoteRowState>;
  } | null>(null);
  const [paystackCountries, setPaystackCountries] = useState<PaystackCountryRow[]>([]);
  const [bankOptions, setBankOptions] = useState<Array<{ name: string; code: string }>>([]);
  const [banksLoading, setBanksLoading] = useState(false);
  const [resolveLoading, setResolveLoading] = useState(false);

  const loadDetails = useCallback(async (token: string): Promise<UnlockedDetails | null> => {
    const res = await fetch(`/api/core/claims/unlocked/${encodeURIComponent(token)}`, { cache: "no-store" });
    const json: unknown = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(claimApiErrorMessage(res.status, json, "Could not load claim details."));
      return null;
    }
    const data = unwrapData<UnlockedDetails>(json);
    if (!data) {
      setError("Invalid response.");
      return null;
    }
    setDetails(data);
    setError(null);
    return data;
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
          setError(claimApiErrorMessage(res.status, json, "Claim not found."));
          setLinkOk(false);
          return;
        }
        const payload = unwrapData<{ claim_link_id?: string; recipient_hint?: string | null }>(json);
        if (!payload) {
          setError("Invalid response.");
          return;
        }
        setRecipientHint(payload.recipient_hint ?? null);
        const pref = recipientPref?.trim();
        if (pref) {
          try {
            setRecipient(decodeURIComponent(pref));
          } catch {
            setRecipient(pref);
          }
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
  }, [claimLinkId, recipientPref]);

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
      const refreshed = await loadDetails(tok);
      if (refreshed) setStep("payout");
    } catch {
      setError("Network error.");
    } finally {
      setBusy(false);
    }
  };

  const onClaimQuoteContextChange = useCallback(
    (ctx: { selectedRow: CheckoutDisplayRow | null; quotes: Record<string, PayoutQuoteRowState> }) => {
      setClaimQuoteCtx(ctx);
    },
    []
  );

  const handleClaim = async () => {
    if (!unlockToken || !details) return;
    const claimCryptoOk = details.claim_crypto_allowed !== false;
    setClaimBusy(true);
    setError(null);
    try {
      let detailRef: UnlockedDetails = details;

      if (payoutType === "crypto" && claimCryptoOk) {
        const row = claimQuoteCtx?.selectedRow ?? null;
        const q = claimQuoteCtx?.quotes ?? {};
        const mustSync =
          detailRef.crypto_payout_allowed === false ||
          (row != null && !settlementMatchesQuote(detailRef, row, q));

        if (mustSync) {
          if (!row) {
            setError("Choose a receive asset.");
            return;
          }
          const st = q[row.id];
          const amt = st?.cryptoAmount?.trim() ?? "";
          if (!amt || st?.loading || st?.error) {
            setError("Wait for the quote to load, or pick another asset.");
            return;
          }
          const { t_chain, t_token } = coreSettlementFromDisplayRow(row);
          const res = await fetch("/api/core/claims/settlement-selection", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              unlock_token: unlockToken,
              recipient: recipient.trim(),
              t_chain,
              t_token,
              t_amount: amt,
            }),
          });
          const json: unknown = await res.json().catch(() => ({}));
          if (!res.ok) {
            setError((json as { error?: string })?.error ?? "Could not save settlement choice.");
            return;
          }
          const refreshed = await loadDetails(unlockToken);
          if (!refreshed) return;
          detailRef = refreshed;
        }

        if (detailRef.crypto_payout_allowed === false) {
          setError("Pick a different receive asset than what the payer sent, or switch to Receive fiat.");
          return;
        }
      }

      const useCrypto =
        payoutType === "crypto" &&
        claimCryptoOk &&
        detailRef.crypto_payout_allowed !== false;

      const body = useCrypto
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

  const onRecipientSubmit = (e: FormEvent) => {
    e.preventDefault();
    void submitRecipient();
  };

  const onOtpSubmit = (e: FormEvent) => {
    e.preventDefault();
    void submitOtp();
  };

  const onCodeSubmit = (e: FormEvent) => {
    e.preventDefault();
    void submitClaimCode();
  };

  const onPayoutSubmit = (e: FormEvent) => {
    e.preventDefault();
    void handleClaim();
  };

  const claimQuoteInputs = useMemo(() => {
    if (!details) return { amount: "", currency: "" };
    const fiatSender = Boolean(details.sender_paid_fiat);
    if (fiatSender) {
      return { amount: details.value.trim(), currency: details.token.trim() };
    }
    return {
      amount: (details.f_amount ?? "").trim(),
      currency: (details.f_token ?? "").trim(),
    };
  }, [details]);

  const selectedClaimQuoteState = useMemo(() => {
    if (!claimQuoteCtx?.selectedRow) return null;
    return claimQuoteCtx.quotes[claimQuoteCtx.selectedRow.id] ?? null;
  }, [claimQuoteCtx]);

  const claimQuotesEnabled = Boolean(
    unlockToken && claimQuoteInputs.amount && claimQuoteInputs.currency
  );

  const claimCryptoQuoteBlocked = useMemo(() => {
    if (!claimQuotesEnabled) return true;
    const st = selectedClaimQuoteState;
    return Boolean(
      st?.loading || st?.error || !st?.cryptoAmount?.trim() || !st?.cryptoSymbol?.trim()
    );
  }, [claimQuotesEnabled, selectedClaimQuoteState]);

  const fiatCurrencyFlagItems = useMemo(() => {
    const currencies = Array.from(
      new Set(
        paystackCountries
          .map((c) => resolveCheckoutPaystackFiat(c))
          .filter((x) => x && x.length === 3)
      )
    ).sort((a, b) => a.localeCompare(b));
    return currencies.map((cur) => {
      const country = paystackCountries.find((row) => resolveCheckoutPaystackFiat(row) === cur);
      return {
        value: cur,
        label: country ? `${cur} · ${country.name}` : cur,
        flagCode: country?.code?.trim() ?? "",
      };
    });
  }, [paystackCountries]);

  useEffect(() => {
    if (step !== "payout" || !linkOk) return;
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/core/countries?supported=paystack", { cache: "no-store" });
        const json = (await res.json()) as { success?: boolean; data?: { countries?: PaystackCountryRow[] } };
        if (cancelled || !res.ok || json.success !== true) return;
        setPaystackCountries((json.data?.countries ?? []).filter((c) => c.supportedPaystack));
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [step, linkOk]);

  useEffect(() => {
    if (step !== "payout" || payoutType !== "fiat" || !currency.trim()) return;
    let cancelled = false;
    void (async () => {
      setBanksLoading(true);
      setBankOptions([]);
      setBankCode("");
      try {
        const qs = new URLSearchParams({ currency: currency.trim().toUpperCase() });
        if (fiatType === "mobile_money") qs.set("type", "mobile_money");
        const res = await fetch(`/api/core/paystack/banks?${qs}`, { cache: "no-store" });
        const json = (await res.json()) as {
          success?: boolean;
          data?: { banks?: Array<{ name?: string; code?: string | number }> };
        };
        if (cancelled || !res.ok || json.success !== true) return;
        const banks = json.data?.banks ?? [];
        setBankOptions(
          banks
            .filter((b) => b?.name && b.code != null)
            .map((b) => ({ name: String(b.name), code: String(b.code) }))
        );
      } catch {
        setBankOptions([]);
      } finally {
        if (!cancelled) setBanksLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [step, payoutType, currency, fiatType]);

  const tryPaystackResolve = useCallback(async () => {
    const acct = accountNumber.replace(/\D/g, "").trim();
    const bc = bankCode.trim();
    if (acct.length < 6 || !bc) return;
    setResolveLoading(true);
    try {
      const qs = new URLSearchParams({ account_number: acct, bank_code: bc });
      const res = await fetch(`/api/core/paystack/banks/resolve?${qs}`, { cache: "no-store" });
      const json = (await res.json()) as { success?: boolean; data?: { account_name?: string } };
      if (res.ok && json.success === true && json.data?.account_name) {
        setAccountName(String(json.data.account_name).trim());
      }
    } catch {
      /* ignore */
    } finally {
      setResolveLoading(false);
    }
  }, [accountNumber, bankCode]);

  useEffect(() => {
    if (!details) return;
    const senderFiat = Boolean(details.sender_paid_fiat);
    const fiatOk = details.claim_fiat_allowed ?? !senderFiat;
    const cryptoOk = details.claim_crypto_allowed !== false;
    if (senderFiat || !fiatOk) setPayoutType("crypto");
    else if (!cryptoOk) setPayoutType("fiat");
  }, [details]);

  const senderPaidFiat = Boolean(details?.sender_paid_fiat);
  const claimFiatOk = details?.claim_fiat_allowed ?? !senderPaidFiat;
  const claimCryptoOk = details ? details.claim_crypto_allowed !== false : false;
  const showCryptoTab = claimCryptoOk;
  const showFiatTab = claimFiatOk;

  if (doneMessage) {
    return (
      <article className="glass-card w-full max-w-lg overflow-visible p-6 shadow-xl">
        <p className="text-center text-lg font-medium text-primary">{doneMessage}</p>
        <footer className="mt-8 pt-4 text-center text-xs text-muted-foreground">Powered by Morapay</footer>
      </article>
    );
  }

  return (
    <article className="glass-card w-full max-w-lg overflow-visible p-6 shadow-xl">
      <header className="mb-4 flex flex-wrap items-start justify-between gap-3 border-b border-border/60 pb-3">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold text-card-foreground">Receive payment</h1>
          <p className="mt-1 text-sm text-muted-foreground">Verify your identity, then choose how you receive funds.</p>
        </div>
        {step === "payout" ? (
          <CheckoutWalletHeaderAction connectButtonLabel="Link wallet to receive" />
        ) : null}
      </header>

      {loading && step !== "payout" ? (
        <section className="space-y-4" aria-busy="true" aria-label="Loading claim">
          <div className="space-y-2 text-center">
            <Skeleton className="mx-auto h-9 w-40 rounded-lg" />
            <Skeleton className="mx-auto h-4 w-48 rounded-md" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-11 w-full rounded-lg" />
            <Skeleton className="h-11 w-full rounded-lg" />
            <Skeleton className="mt-2 h-12 w-full rounded-xl" />
          </div>
        </section>
      ) : null}

      {!loading && error ? (
        <p className="mb-4 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      {!loading && linkOk && step === "recipient" ? (
        <form className="space-y-3" onSubmit={onRecipientSubmit}>
          <Label htmlFor="claim-recipient">Your email or phone</Label>
          {recipientHint ? (
            <p className="text-xs text-muted-foreground">
              This link was sent to <span className="font-medium text-foreground">{recipientHint}</span>. Enter the same
              contact so we can send your OTP. You cannot claim using the payer&apos;s contact.
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Use the same email or phone the claim notification was sent to. We match it to your OTP and block self-claims.
            </p>
          )}
          <Input
            id="claim-recipient"
            name="recipient"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="you@example.com or +233…"
            autoComplete="email"
          />
          <Button type="submit" className="w-full rounded-xl" disabled={busy || recipient.trim().length < 3}>
            {busy ? "Checking…" : "Continue"}
          </Button>
        </form>
      ) : null}

      {linkOk && step === "otp" ? (
        <form className="space-y-4" onSubmit={onOtpSubmit}>
          <p className="text-sm text-muted-foreground">Enter the 6-digit code from your email or SMS.</p>
          <OtpSixBoxes idPrefix="claim-otp" value={otpDigits} onChange={setOtpDigits} disabled={busy} />
          <Button type="submit" className="w-full rounded-xl" disabled={busy || otpDigits.replace(/\D/g, "").length !== 6}>
            {busy ? "Verifying…" : "Verify OTP"}
          </Button>
          <Button type="button" variant="ghost" className="w-full text-muted-foreground" onClick={() => setStep("recipient")}>
            Back
          </Button>
        </form>
      ) : null}

      {linkOk && step === "code" ? (
        <form className="space-y-4" onSubmit={onCodeSubmit}>
          <p className="text-sm text-muted-foreground">Enter the 6-character claim code (from the payer or your notification).</p>
          <ClaimCodeBoxes idPrefix="claim-code" value={claimCode} onChange={setClaimCode} disabled={busy} />
          <Button
            type="submit"
            className="w-full rounded-xl"
            disabled={busy || claimCode.replace(/[^A-Z0-9]/gi, "").length !== 6}
          >
            {busy ? "Verifying…" : "Verify code"}
          </Button>
          <Button type="button" variant="ghost" className="w-full text-muted-foreground" onClick={() => setStep("otp")}>
            Back
          </Button>
        </form>
      ) : null}

      {linkOk && step === "payout" && details ? (
        <form className="space-y-6" onSubmit={onPayoutSubmit}>
          <div className="space-y-2 text-center" aria-label="Claim amount">
            <p className="text-[1.65rem] font-semibold leading-tight tabular-nums text-card-foreground sm:text-[1.8rem]">
              {payerSentHeadline(details)}
            </p>
            <p className="text-sm text-muted-foreground">
              from <span className="font-medium text-card-foreground">{details.payer_identifier}</span>
            </p>
            {details.transaction_id ? (
              <p className="text-xs text-muted-foreground">Reference {details.transaction_id.slice(0, 10)}…</p>
            ) : null}
          </div>

          <div className="space-y-4 rounded-xl border border-border/80 bg-background/30 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Receive as</p>

            {showCryptoTab && showFiatTab ? (
              <div
                className="flex w-full gap-1 rounded-xl border border-border/60 bg-background/40 p-1"
                role="tablist"
                aria-label="Receive payout type"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={payoutType === "crypto"}
                  className={cn(
                    "min-h-10 flex-1 rounded-lg px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    payoutType === "crypto"
                      ? "bg-card text-card-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  onClick={() => setPayoutType("crypto")}
                >
                  Receive crypto
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={payoutType === "fiat"}
                  className={cn(
                    "min-h-10 flex-1 rounded-lg px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    payoutType === "fiat"
                      ? "bg-card text-card-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  onClick={() => setPayoutType("fiat")}
                >
                  Receive fiat
                </button>
              </div>
            ) : showCryptoTab ? (
              <p className="text-sm text-muted-foreground">
                {senderPaidFiat
                  ? "The payer used fiat (e.g. Paystack). You receive on-chain crypto to your linked wallet."
                  : "Receive cryptocurrency to your wallet (different from what the payer sent on-chain)."}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Receive by bank or mobile money—we send a transfer to the account you enter (no checkout page).
              </p>
            )}

            {payoutType === "crypto" && claimCryptoOk ? (
              <>
                <div className="w-full space-y-3 text-left">
                  <CheckoutTokenQuoteRows
                    enabled={Boolean(
                      unlockToken && claimQuoteInputs.amount && claimQuoteInputs.currency
                    )}
                    fiatAmount={claimQuoteInputs.amount}
                    fiatCurrency={claimQuoteInputs.currency}
                    invoiceLabel={`${claimQuoteInputs.amount} ${claimQuoteInputs.currency}`}
                    invoiceChargeKind="CRYPTO"
                    variant="claim_receive"
                    claimSendChain={details.f_chain ?? null}
                    claimSendToken={details.f_token ?? null}
                    claimSuppressPrimaryCta
                    onClaimQuoteContextChange={onClaimQuoteContextChange}
                  />
                </div>
                <div className="space-y-3 border-t border-border/60 pt-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      className="rounded-xl"
                      disabled={!isConnected || !walletAddress?.startsWith("0x") || walletAddress.length !== 42}
                      onClick={() => setPayoutAddress(walletAddress ?? "")}
                    >
                      Use connected address
                    </Button>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="claim-payout-address">Receiving wallet (0x…)</Label>
                    <Input
                      id="claim-payout-address"
                      name="payout_address"
                      value={payoutAddress}
                      onChange={(e) => setPayoutAddress(e.target.value)}
                      placeholder="0x…"
                      className="font-mono text-sm"
                      autoComplete="off"
                    />
                  </div>
                </div>
              </>
            ) : payoutType === "fiat" ? (
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="claim-fiat-method">Method</Label>
                  <select
                    id="claim-fiat-method"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={fiatType}
                    onChange={(e) => setFiatType(e.target.value === "nuban" ? "nuban" : "mobile_money")}
                  >
                    <option value="mobile_money">Mobile money</option>
                    <option value="nuban">Bank account</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label id="claim-fiat-currency-label" htmlFor="claim-fiat-currency-trigger">
                    Currency
                  </Label>
                  <FlagSelect
                    id="claim-fiat-currency-trigger"
                    labelId="claim-fiat-currency-label"
                    items={fiatCurrencyFlagItems}
                    value={currency.trim().toUpperCase()}
                    onChange={(v) => setCurrency(v.trim().toUpperCase())}
                    disabled={fiatCurrencyFlagItems.length === 0}
                    placeholder={fiatCurrencyFlagItems.length ? "Select currency" : "Loading currencies…"}
                    className="[&_button]:h-10 [&_button]:rounded-md"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="claim-bank-select">{fiatType === "mobile_money" ? "Mobile provider" : "Bank"}</Label>
                  <select
                    id="claim-bank-select"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={bankCode}
                    onChange={(e) => setBankCode(e.target.value)}
                    disabled={banksLoading || bankOptions.length === 0}
                  >
                    <option value="">{banksLoading ? "Loading…" : "Select…"}</option>
                    {bankOptions.map((b) => (
                      <option key={b.code} value={b.code}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="claim-account-number">Account number</Label>
                  <Input
                    id="claim-account-number"
                    inputMode="numeric"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    onBlur={() => void tryPaystackResolve()}
                    autoComplete="off"
                  />
                  {resolveLoading ? <p className="text-xs text-muted-foreground">Verifying account…</p> : null}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="claim-account-name">Account name</Label>
                  <Input
                    id="claim-account-name"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    placeholder="Account name"
                    autoComplete="off"
                  />
                </div>
              </div>
            ) : null}
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full rounded-xl py-6 font-semibold"
            disabled={
              claimBusy ||
              (payoutType === "crypto" &&
                claimCryptoOk &&
                (!payoutAddress.startsWith("0x") ||
                  payoutAddress.length !== 42 ||
                  claimCryptoQuoteBlocked)) ||
              (payoutType === "fiat" &&
                (!accountName.trim() || !accountNumber.trim() || !bankCode.trim() || !currency.trim()))
            }
          >
            {claimBusy ? "Submitting…" : "Claim"}
          </Button>
        </form>
      ) : null}

      <footer className="mt-8 pt-4 text-center text-xs text-muted-foreground">Powered by Morapay</footer>
    </article>
  );
}
