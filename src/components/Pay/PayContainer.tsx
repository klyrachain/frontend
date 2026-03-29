"use client";

import { useState, useMemo, useDeferredValue, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { TransferSelectModal } from "@/components/Transfer/TransferSelectModal";
import { SuggestedTokensRow } from "@/components/Transfer/SuggestedTokensRow";
import {
  TokenSelectField,
  AmountField,
  ContactIdentifierField,
} from "@/components/flows";
import type { TokenSelection } from "@/components/Exchange/TokenChainSelectModal";
import { useAppSelector } from "@/store/hooks";
import { useGetChainsQuery, useGetTokensQuery } from "@/store/api/squidApi";
import { CHAINS, TOKENS } from "@/config/chainsAndTokens";
import { buildSuggestedTokenSelections } from "@/lib/flowTokens";
import { useClientMounted } from "@/hooks/use-client-mounted";
import type { PublicCommercePaymentLink } from "@/types/checkout-public.types";

/** Matches Core `GET /api/public/payment-links/by-id/:id` UUID validation */
const PAY_PAGE_UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type RequestByLinkSummary = {
  linkId?: string;
  transaction?: {
    t_amount?: string;
    t_token?: string;
    t_chain?: string;
    toIdentifier?: string;
  };
};

type CommercePayPageSummary = Pick<
  PublicCommercePaymentLink,
  "id" | "publicCode" | "type" | "amount" | "currency" | "businessName" | "slug"
>;

export function PayContainer() {
  const searchParams = useSearchParams();
  const payPageIdRaw = searchParams.get("payPageId")?.trim() ?? "";
  const payPageId = PAY_PAGE_UUID_RE.test(payPageIdRaw) ? payPageIdRaw : "";
  const payPageIdInvalid =
    payPageIdRaw.length > 0 && !PAY_PAGE_UUID_RE.test(payPageIdRaw);
  const requestLinkId = payPageId
    ? ""
    : (searchParams.get("requestLinkId")?.trim() ?? "");
  const prefillAmount = searchParams.get("prefillAmount")?.trim() ?? "";

  const [sendSelection, setSendSelection] = useState<TokenSelection | null>(null);
  const [amount, setAmount] = useState("");
  const [to, setTo] = useState("");
  const [selectModalOpen, setSelectModalOpen] = useState(false);
  const [requestSummary, setRequestSummary] = useState<RequestByLinkSummary | null>(
    null
  );
  const [requestLoadErr, setRequestLoadErr] = useState<string | null>(null);
  const [commerceSummary, setCommerceSummary] =
    useState<CommercePayPageSummary | null>(null);
  const [commerceLoadErr, setCommerceLoadErr] = useState<string | null>(null);

  const amountLocked =
    commerceSummary?.type === "fixed" && commerceSummary.amount != null;

  const clientMounted = useClientMounted();
  const usedEntries = useAppSelector((s) => s.usedTokens.entries);
  const deferredUsedEntries = useDeferredValue(usedEntries);
  const entriesForSuggestions = clientMounted ? deferredUsedEntries : [];
  const { data: apiChains = [], isSuccess: chainsSuccess } = useGetChainsQuery();
  const { data: apiTokens = [], isSuccess: tokensSuccess } = useGetTokensQuery();
  const chains = useMemo(
    () => (chainsSuccess && apiChains.length > 0 ? apiChains : CHAINS),
    [apiChains, chainsSuccess]
  );
  const tokens = useMemo(
    () => (tokensSuccess && apiTokens.length > 0 ? apiTokens : TOKENS),
    [apiTokens, tokensSuccess]
  );
  const suggestedSelections = useMemo(
    () => buildSuggestedTokenSelections(entriesForSuggestions, chains, tokens),
    [entriesForSuggestions, chains, tokens]
  );

  useEffect(() => {
    if (payPageId) return;
    if (prefillAmount) setAmount(prefillAmount);
  }, [prefillAmount, payPageId]);

  useEffect(() => {
    if (!payPageId) {
      setCommerceSummary(null);
      setCommerceLoadErr(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/core/public/payment-links/by-id/${encodeURIComponent(payPageId)}`,
          { cache: "no-store" }
        );
        const json: unknown = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (!res.ok) {
          setCommerceLoadErr("Could not load linked checkout.");
          setCommerceSummary(null);
          return;
        }
        const data =
          json &&
          typeof json === "object" &&
          "success" in json &&
          (json as { success?: boolean }).success === true &&
          "data" in json
            ? ((json as { data: PublicCommercePaymentLink }).data ?? null)
            : null;
        if (!data || data.linkKind !== "commerce") {
          setCommerceLoadErr("Checkout link not found.");
          setCommerceSummary(null);
          return;
        }
        setCommerceSummary({
          id: data.id,
          publicCode: data.publicCode,
          type: data.type,
          amount: data.amount,
          currency: data.currency,
          businessName: data.businessName,
          slug: data.slug,
        });
        setCommerceLoadErr(null);
      } catch {
        if (!cancelled) {
          setCommerceLoadErr("Could not load linked checkout.");
          setCommerceSummary(null);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [payPageId]);

  useEffect(() => {
    if (!commerceSummary) return;
    if (commerceSummary.type === "fixed" && commerceSummary.amount != null) {
      setAmount(commerceSummary.amount);
    } else {
      setAmount("");
    }
  }, [commerceSummary]);

  useEffect(() => {
    if (!requestLinkId) {
      setRequestSummary(null);
      setRequestLoadErr(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/core/requests/by-link/${encodeURIComponent(requestLinkId)}`,
          { cache: "no-store" }
        );
        const json: unknown = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (!res.ok) {
          setRequestLoadErr("Could not load payment request.");
          setRequestSummary(null);
          return;
        }
        const data =
          json &&
          typeof json === "object" &&
          "success" in json &&
          (json as { success?: boolean }).success === true &&
          "data" in json
            ? ((json as { data: RequestByLinkSummary }).data ?? null)
            : null;
        setRequestSummary(data);
        setRequestLoadErr(null);
      } catch {
        if (!cancelled) {
          setRequestLoadErr("Could not load payment request.");
          setRequestSummary(null);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [requestLinkId]);

  const checkoutBackCode =
    commerceSummary?.publicCode?.trim() || commerceSummary?.slug?.trim() || "";

  return (
    <div className="flex flex-col duration-300 ease-out relative w-full items-center justify-center">
      {payPageIdInvalid ? (
        <p
          className="mb-4 w-full max-w-md rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          Invalid checkout reference. Open Pay from your checkout link again.
        </p>
      ) : null}
      {payPageId ? (
        <section
          className="mb-4 w-full max-w-md rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm"
          role="region"
          aria-label="Linked checkout"
        >
          {commerceLoadErr ? (
            <p className="text-destructive">{commerceLoadErr}</p>
          ) : null}
          {commerceSummary ? (
            <>
              <p className="font-medium">You are paying a checkout link</p>
              <p className="mt-2 text-muted-foreground">
                To: {commerceSummary.businessName}
              </p>
              {commerceSummary.type === "fixed" && commerceSummary.amount != null ? (
                <p className="mt-1 font-medium tabular-nums">
                  {commerceSummary.amount} {commerceSummary.currency}
                </p>
              ) : (
                <p className="mt-1 text-muted-foreground">
                  Enter the amount you want to pay below.
                </p>
              )}
              <p className="mt-3 text-xs text-muted-foreground">
                Amount and currency for fixed-price links come from our servers, not
                from the URL.
              </p>
            </>
          ) : !commerceLoadErr ? (
            <p className="text-muted-foreground">Loading checkout…</p>
          ) : null}
          {checkoutBackCode ? (
            <p className="mt-3">
              <Link
                href={`/checkout/${encodeURIComponent(checkoutBackCode)}`}
                className="text-xs text-primary underline underline-offset-2"
              >
                Back to checkout summary
              </Link>
            </p>
          ) : null}
        </section>
      ) : null}
      {requestLinkId ? (
        <section
          className="mb-4 w-full max-w-md rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm"
          role="region"
          aria-label="Linked payment request"
        >
          {requestLoadErr ? (
            <p className="text-destructive">{requestLoadErr}</p>
          ) : null}
          {requestSummary?.transaction ? (
            <>
              <p className="font-medium">You are paying a request</p>
              <p className="mt-2 text-muted-foreground">
                {requestSummary.transaction.t_amount}{" "}
                {requestSummary.transaction.t_token ?? ""}
                {requestSummary.transaction.t_chain
                  ? ` · ${requestSummary.transaction.t_chain}`
                  : ""}
              </p>
              {requestSummary.transaction.toIdentifier ? (
                <p className="mt-1 text-muted-foreground">
                  To: {requestSummary.transaction.toIdentifier}
                </p>
              ) : null}
              <p className="mt-3 text-xs text-muted-foreground">
                Use the form below to choose what you send. Settlement paths (fiat or
                crypto) follow your operator configuration on Core.
              </p>
            </>
          ) : !requestLoadErr ? (
            <p className="text-muted-foreground">Loading request…</p>
          ) : null}
          <p className="mt-3">
            <Link
              href={`/checkout/${encodeURIComponent(requestLinkId)}`}
              className="text-xs text-primary underline underline-offset-2"
            >
              Back to checkout summary
            </Link>
          </p>
        </section>
      ) : null}
      <article className="glass-card overflow-hidden p-2 shadow-xl shrink-0 min-w-0 transition-all duration-300 ease-out h-fit">
        <header className="mb-6 pl-2">
          <h1 className="text-2xl text-primary font-semibold">I want to send</h1>
        </header>

        <section className="flex flex-col gap-2">
          <div className="flex flex-col gap-2">
            {suggestedSelections.length > 0 && (
              <SuggestedTokensRow
                suggestions={suggestedSelections}
                onSelect={setSendSelection}
                side="left"
              />
            )}
            <TokenSelectField
              label="Select token"
              selection={sendSelection}
              onOpenSelect={() => setSelectModalOpen(true)}
            />
          </div>

          <AmountField
            label="Amount"
            amount={amount}
            onAmountChange={setAmount}
            readOnly={amountLocked}
            footer={
              amountLocked && commerceSummary
                ? `Locked to merchant link (${commerceSummary.currency})`
                : undefined
            }
          />

          <ContactIdentifierField
            label="To"
            value={to}
            onChange={setTo}
            ariaLabel="Recipient: email, phone number or crypto address"
          />

          <Button
            size="lg"
            className="w-full rounded-xl py-6 text-base font-semibold bg-black"
          >
            Send
          </Button>
        </section>
      </article>

      <TransferSelectModal
        open={selectModalOpen}
        onOpenChange={setSelectModalOpen}
        onSelect={(selection) => {
          setSendSelection(selection);
          setSelectModalOpen(false);
        }}
        chains={chains}
        tokens={tokens}
      />
    </div>
  );
}
