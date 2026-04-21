"use client";

import { useState, useMemo, useDeferredValue, useEffect, useCallback, useId } from "react";
import dynamic from "next/dynamic";
import { ArrowLeftRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { TransferSelectModal } from "@/components/Transfer/TransferSelectModal";
import {
  TokenSelectField,
  AmountField,
  ContactIdentifierField,
  FlagSelect,
  FLOW_FIELD_SHELL,
  FLOW_FIELD_LABEL,
} from "@/components/flows";
import type { TokenSelection } from "@/components/Exchange/TokenChainSelectModal";
import { useAppSelector } from "@/store/hooks";
import { useGetChainsQuery, useGetTokensQuery } from "@/store/api/squidApi";
import { CHAINS, TOKENS } from "@/config/chainsAndTokens";
import { buildSuggestedTokenSelections, isValidPositiveAmount } from "@/lib/flowTokens";
import { useClientMounted } from "@/hooks/use-client-mounted";
import { PaymentLinkShareModal } from "@/components/Receive/PaymentLinkShareModal";
import { FlowsWalletHeaderAction } from "@/app/(flows)/FlowsWalletHeaderAction";
import { usePayCryptoDualAmount, type PayAmountFieldMode } from "@/hooks/use-pay-crypto-dual-amount";
import { chainSlugToCore } from "@/lib/core-chain-slug";
import { getContactIdentifierType } from "@/lib/utils";
import {
  fetchDialCountries,
  buildPhoneForRequest,
  isReceiveContactIdentityComplete,
  isLikelyFullInternationalPhone,
  type DialCountry,
} from "@/lib/phone-dial-codes";
import { DialCodeSelect } from "@/components/Receive/DialCodeSelect";

const SuggestedTokensRow = dynamic(
  () =>
    import("@/components/Transfer/SuggestedTokensRow").then((m) => m.SuggestedTokensRow),
  { ssr: false }
);

type ReceiveTab = "crypto" | "fiat";

type CountryRow = {
  id: string;
  code: string;
  name: string;
  currency: string;
};

function unwrapData<T>(raw: unknown): T | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as { success?: boolean; data?: unknown };
  if (o.success === true && o.data != null) return o.data as T;
  return null;
}

function GeneratingButtonLabel() {
  return (
    <span className="inline-flex items-center justify-center gap-2.5">
      <span className="font-medium">Generating</span>
      <span className="inline-flex h-6 items-center gap-1.5" aria-hidden>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="inline-block h-2.5 w-2.5 rounded-full bg-primary-foreground/95 motion-safe:animate-bounce"
            style={{
              animationDelay: `${i * 180}ms`,
              animationDuration: "0.65s",
            }}
          />
        ))}
      </span>
    </span>
  );
}

export function ReceiveContainer() {
  const dialFromId = useId();
  const dialBeneficiaryId = useId();
  const dialFromLabelId = useId();
  const dialBeneficiaryLabelId = useId();

  const [receiveTab, setReceiveTab] = useState<ReceiveTab>("crypto");
  const [receiveSelection, setReceiveSelection] = useState<TokenSelection | null>(null);
  const [amount, setAmount] = useState("");
  const [usdAmount, setUsdAmount] = useState("");
  const [payAmountFieldMode, setPayAmountFieldMode] = useState<PayAmountFieldMode>("token");
  const [fiatCountries, setFiatCountries] = useState<CountryRow[]>([]);
  const [fiatCountriesLoading, setFiatCountriesLoading] = useState(false);
  const [selectedCountryId, setSelectedCountryId] = useState("");
  const [fromContact, setFromContact] = useState("");
  const [beneficiaryContact, setBeneficiaryContact] = useState("");
  const [dialCountries, setDialCountries] = useState<DialCountry[]>([]);
  const [dialCountriesLoading, setDialCountriesLoading] = useState(false);
  const [dialCountriesError, setDialCountriesError] = useState<string | null>(null);
  const [fromPhoneCountryIso, setFromPhoneCountryIso] = useState("");
  const [beneficiaryPhoneCountryIso, setBeneficiaryPhoneCountryIso] = useState("");
  const [selectModalOpen, setSelectModalOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [generatedPaymentLink, setGeneratedPaymentLink] = useState("");
  const [fiatTokenLabel, setFiatTokenLabel] = useState("GHS");
  const [submitBusy, setSubmitBusy] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

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

  const payDual = usePayCryptoDualAmount({
    selection: receiveSelection,
    fieldMode: payAmountFieldMode,
    tokenAmountStr: amount,
    usdAmountStr: usdAmount,
    enabled: receiveTab === "crypto",
  });

  useEffect(() => {
    if (!payDual.supportsUsdDenom && payAmountFieldMode === "usd") {
      setPayAmountFieldMode("token");
    }
  }, [payDual.supportsUsdDenom, payAmountFieldMode]);

  useEffect(() => {
    setUsdAmount("");
    setPayAmountFieldMode("token");
  }, [receiveSelection?.token.symbol, receiveSelection?.chain.id]);

  useEffect(() => {
    if (receiveTab !== "crypto" || !payDual.supportsUsdDenom) return;
    if (payAmountFieldMode !== "usd") return;
    if (payDual.suggestedTokenAmount) {
      setAmount(payDual.suggestedTokenAmount);
    }
  }, [receiveTab, payAmountFieldMode, payDual.supportsUsdDenom, payDual.suggestedTokenAmount]);

  useEffect(() => {
    if (receiveTab !== "fiat") {
      setSelectedCountryId("");
    }
  }, [receiveTab]);

  useEffect(() => {
    let cancelled = false;
    setDialCountriesLoading(true);
    setDialCountriesError(null);
    void fetchDialCountries()
      .then((rows) => {
        if (!cancelled) setDialCountries(rows);
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setDialCountries([]);
          setDialCountriesError(e instanceof Error ? e.message : "Could not load calling codes");
        }
      })
      .finally(() => {
        if (!cancelled) setDialCountriesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (getContactIdentifierType(fromContact) !== "phone") {
      setFromPhoneCountryIso("");
    }
  }, [fromContact]);

  useEffect(() => {
    if (getContactIdentifierType(beneficiaryContact) !== "phone") {
      setBeneficiaryPhoneCountryIso("");
    }
  }, [beneficiaryContact]);

  useEffect(() => {
    if (receiveTab !== "fiat") return;
    let cancelled = false;
    setFiatCountriesLoading(true);
    void fetch("/api/core/countries?supported=paystack", { cache: "no-store" })
      .then(async (res) => {
        const json: unknown = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (!res.ok) {
          setFiatCountries([]);
          return;
        }
        const data =
          json &&
          typeof json === "object" &&
          "data" in json &&
          (json as { data?: { countries?: CountryRow[] } }).data?.countries;
        setFiatCountries(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!cancelled) setFiatCountries([]);
      })
      .finally(() => {
        if (!cancelled) setFiatCountriesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [receiveTab]);

  const selectedFiatCountry = useMemo(
    () => fiatCountries.find((c) => c.id === selectedCountryId) ?? null,
    [fiatCountries, selectedCountryId]
  );

  const fiatCountryFlagItems = useMemo(
    () =>
      fiatCountries.map((c) => ({
        value: c.id,
        label: `${c.name} (${c.code}) — ${c.currency}`,
        flagCode: c.code,
      })),
    [fiatCountries]
  );

  const fromOk =
    getContactIdentifierType(fromContact) === "email" ||
    isReceiveContactIdentityComplete(fromContact, fromPhoneCountryIso);
  const showBeneficiary = fromOk;
  const beneficiaryOk =
    getContactIdentifierType(beneficiaryContact) === "email" ||
    isReceiveContactIdentityComplete(beneficiaryContact, beneficiaryPhoneCountryIso);

  const phoneDialListReady = dialCountries.length > 0;

  const tokenAmountForRequest = useMemo(() => {
    if (receiveTab !== "crypto" || !receiveSelection) return "";
    if (payAmountFieldMode === "usd") {
      return payDual.suggestedTokenAmount?.trim() ?? "";
    }
    return amount.trim();
  }, [receiveTab, receiveSelection, payAmountFieldMode, payDual.suggestedTokenAmount, amount]);

  const amountValidCrypto =
    receiveTab === "crypto" &&
    isValidPositiveAmount(tokenAmountForRequest) &&
    (payAmountFieldMode !== "usd" || Boolean(payDual.suggestedTokenAmount?.trim()));

  const fiatAmountValid = receiveTab === "fiat" && isValidPositiveAmount(amount);
  const needsDialListForContacts =
    (getContactIdentifierType(fromContact) === "phone" &&
      !isLikelyFullInternationalPhone(fromContact)) ||
    (getContactIdentifierType(beneficiaryContact) === "phone" &&
      !isLikelyFullInternationalPhone(beneficiaryContact));

  const dialListOkForSubmit = !needsDialListForContacts || phoneDialListReady;

  const fiatReceiveComplete =
    fiatAmountValid &&
    selectedCountryId !== "" &&
    selectedFiatCountry != null &&
    fromOk &&
    beneficiaryOk &&
    dialListOkForSubmit;

  const coreReceiveComplete =
    receiveTab === "crypto" &&
    receiveSelection != null &&
    amountValidCrypto &&
    fromOk &&
    beneficiaryOk &&
    dialListOkForSubmit &&
    !payDual.loading &&
    !payDual.error;

  const canContinue =
    receiveTab === "crypto" ? coreReceiveComplete : fiatReceiveComplete;

  const onRotateAmount = useCallback(() => {
    if (!receiveSelection || !payDual.supportsUsdDenom) return;
    if (payAmountFieldMode === "token") {
      if (payDual.oppositeNumberUsd != null && Number.isFinite(payDual.oppositeNumberUsd)) {
        setUsdAmount(
          payDual.oppositeNumberUsd >= 10_000
            ? String(Math.round(payDual.oppositeNumberUsd))
            : payDual.oppositeNumberUsd.toFixed(2)
        );
      } else {
        setUsdAmount("");
      }
      setPayAmountFieldMode("usd");
    } else {
      setPayAmountFieldMode("token");
    }
  }, [receiveSelection, payDual.supportsUsdDenom, payDual.oppositeNumberUsd, payAmountFieldMode]);

  const handleContinue = async () => {
    if (!canContinue || submitBusy) return;
    setSubmitBusy(true);
    setSubmitError(null);
    try {
      if (receiveTab === "crypto") {
        if (!receiveSelection) return;
        const sym = receiveSelection.token.symbol.trim();
        const tChain = chainSlugToCore(receiveSelection.chain.name);
        const amt = Number(tokenAmountForRequest);
        if (!Number.isFinite(amt) || amt <= 0) return;

        const fromT = getContactIdentifierType(fromContact);
        const benT = getContactIdentifierType(beneficiaryContact);
        const payerEmail = fromT === "email" ? fromContact.trim() : undefined;
        const payerPhone =
          fromT === "phone" ? buildPhoneForRequest(fromContact, fromPhoneCountryIso, dialCountries) : undefined;
        const toIdentifier =
          benT === "phone"
            ? buildPhoneForRequest(beneficiaryContact, beneficiaryPhoneCountryIso, dialCountries) ??
              beneficiaryContact.trim()
            : beneficiaryContact.trim();

        const res = await fetch("/api/core/requests", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            payerEmail,
            payerPhone,
            t_amount: amt,
            t_chain: tChain,
            t_token: sym,
            toIdentifier,
            receiveSummary: `${tokenAmountForRequest} ${sym} on ${receiveSelection.chain.name}`,
            f_chain: tChain,
            f_token: sym,
            f_amount: amt,
          }),
        });
        const json: unknown = await res.json().catch(() => ({}));
        if (!res.ok) {
          const err =
            json && typeof json === "object" && "error" in json
              ? String((json as { error?: string }).error ?? "")
              : "";
          setSubmitError(err || "—");
          return;
        }
        const data = unwrapData<{ payLink?: string }>(json);
        const link = data?.payLink?.trim();
        if (!link) {
          setSubmitError("—");
          return;
        }
        setFiatTokenLabel(sym);
        setGeneratedPaymentLink(link);
        setShareModalOpen(true);
        return;
      }

      if (!selectedFiatCountry) return;
      const cur = selectedFiatCountry.currency.trim().toUpperCase();
      const amt = Number(amount.trim());
      if (!Number.isFinite(amt) || amt <= 0) return;

      const fromT = getContactIdentifierType(fromContact);
      const benT = getContactIdentifierType(beneficiaryContact);
      const payerEmail = fromT === "email" ? fromContact.trim() : undefined;
      const payerPhone =
        fromT === "phone" ? buildPhoneForRequest(fromContact, fromPhoneCountryIso, dialCountries) : undefined;
      const toIdentifier =
        benT === "phone"
          ? buildPhoneForRequest(beneficiaryContact, beneficiaryPhoneCountryIso, dialCountries) ??
            beneficiaryContact.trim()
          : beneficiaryContact.trim();

      const res = await fetch("/api/core/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payerEmail,
          payerPhone,
          t_amount: amt,
          t_chain: "MOMO",
          t_token: cur,
          toIdentifier,
          receiveSummary: `${amount.trim()} ${cur}`,
        }),
      });
      const json: unknown = await res.json().catch(() => ({}));
      if (!res.ok) {
        const err =
          json && typeof json === "object" && "error" in json
            ? String((json as { error?: string }).error ?? "")
            : "";
        setSubmitError(err || "—");
        return;
      }
      const data = unwrapData<{ payLink?: string }>(json);
      const link = data?.payLink?.trim();
      if (!link) {
        setSubmitError("—");
        return;
      }
      setFiatTokenLabel(cur);
      setGeneratedPaymentLink(link);
      setShareModalOpen(true);
    } finally {
      setSubmitBusy(false);
    }
  };

  return (
    <div className="relative mx-auto flex w-full max-w-xl flex-col self-stretch duration-300 ease-out">
      <article className="glass-card h-fit w-full shrink-0 overflow-hidden p-2 shadow-xl transition-all duration-300 ease-out min-w-0">
        <header className="mb-6 space-y-4 pl-2">
          <div className="flex flex-row items-center justify-between gap-3">
            <h1 className="text-2xl font-semibold text-card-foreground">I want to receive</h1>
            <FlowsWalletHeaderAction />
          </div>
          <div
            className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-start"
            role="tablist"
          >
            <Button
              type="button"
              variant={receiveTab === "crypto" ? "default" : "outline"}
              className={
                receiveTab === "crypto"
                  ? "flex-1 rounded-xl sm:flex-none"
                  : "flex-1 rounded-xl border-border bg-card text-card-foreground hover:bg-muted/70 sm:flex-none"
              }
              onClick={() => setReceiveTab("crypto")}
            >
              Crypto
            </Button>
            <Button
              type="button"
              variant={receiveTab === "fiat" ? "default" : "outline"}
              className={
                receiveTab === "fiat"
                  ? "flex-1 rounded-xl sm:flex-none"
                  : "flex-1 rounded-xl border-border bg-card text-card-foreground hover:bg-muted/70 sm:flex-none"
              }
              onClick={() => setReceiveTab("fiat")}
            >
              Fiat
            </Button>
          </div>
        </header>

        <section className="flex flex-col gap-2" aria-label="Receive">
          {receiveTab === "crypto" ? (
            <>
              <div className="flex flex-col gap-2">
                {suggestedSelections.length > 0 && (
                  <SuggestedTokensRow
                    suggestions={suggestedSelections}
                    onSelect={setReceiveSelection}
                    side="left"
                  />
                )}
                <TokenSelectField
                  label="Token to receive"
                  selection={receiveSelection}
                  onOpenSelect={() => setSelectModalOpen(true)}
                  selectAriaLabel="Select token to receive"
                />
              </div>

              <AmountField
                label={
                  receiveSelection && payDual.supportsUsdDenom
                    ? payAmountFieldMode === "usd"
                      ? "Amount (USD)"
                      : `Amount (${receiveSelection.token.symbol})`
                    : "Amount"
                }
                labelRight={
                  receiveSelection && payDual.supportsUsdDenom ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0 text-muted-foreground"
                      onClick={onRotateAmount}
                      aria-label="Toggle"
                    >
                      <ArrowLeftRight className="h-4 w-4" />
                    </Button>
                  ) : undefined
                }
                amount={
                  receiveSelection && payDual.supportsUsdDenom && payAmountFieldMode === "usd"
                    ? usdAmount
                    : amount
                }
                onAmountChange={(v) => {
                  if (receiveSelection && payDual.supportsUsdDenom && payAmountFieldMode === "usd") {
                    setUsdAmount(v);
                  } else {
                    setAmount(v);
                  }
                }}
                variant="transfer"
                footer={
                  receiveSelection && payDual.supportsUsdDenom ? (
                    <div className="space-y-1">
                      {payDual.loading ? <span className="sr-only" aria-live="polite">Loading</span> : null}
                      {payDual.error ? <p className="text-xs text-destructive">{payDual.error}</p> : null}
                      {!payDual.loading && payDual.oppositeLine ? (
                        <p className="text-xs tabular-nums text-muted-foreground">{payDual.oppositeLine}</p>
                      ) : null}
                    </div>
                  ) : null
                }
                ariaLabel="Amount"
              />

              <ContactIdentifierField
                label="From"
                value={fromContact}
                onChange={setFromContact}
                placeholder="Email or phone number"
                ariaLabel="From"
                phoneDialAccessory={
                  <DialCodeSelect
                    id={dialFromId}
                    labelId={dialFromLabelId}
                    items={dialCountries}
                    valueIso={fromPhoneCountryIso}
                    onChangeIso={setFromPhoneCountryIso}
                    loading={dialCountriesLoading}
                    errorText={dialCountriesError}
                  />
                }
              />

              {showBeneficiary ? (
                <ContactIdentifierField
                  label="On this account"
                  value={beneficiaryContact}
                  onChange={setBeneficiaryContact}
                  placeholder="Email or phone number"
                  ariaLabel="On this account"
                  phoneDialAccessory={
                    <DialCodeSelect
                      id={dialBeneficiaryId}
                      labelId={dialBeneficiaryLabelId}
                      items={dialCountries}
                      valueIso={beneficiaryPhoneCountryIso}
                      onChangeIso={setBeneficiaryPhoneCountryIso}
                      loading={dialCountriesLoading}
                      errorText={dialCountriesError}
                    />
                  }
                />
              ) : null}
            </>
          ) : (
            <>
              <AmountField
                label="Amount"
                amount={amount}
                onAmountChange={setAmount}
                ariaLabel="Amount"
              />
              <div className={FLOW_FIELD_SHELL}>
                <Label id="receive-fiat-country-label" htmlFor="receive-fiat-country" className={FLOW_FIELD_LABEL}>
                  Country
                </Label>
                <FlagSelect
                  id="receive-fiat-country"
                  labelId="receive-fiat-country-label"
                  items={fiatCountryFlagItems}
                  value={selectedCountryId}
                  onChange={setSelectedCountryId}
                  disabled={fiatCountriesLoading}
                  loading={fiatCountriesLoading}
                  placeholder=""
                  loadingPlaceholder=""
                  variant="flow"
                />
              </div>
              <ContactIdentifierField
                label="From"
                value={fromContact}
                onChange={setFromContact}
                placeholder="Email or phone number"
                ariaLabel="From"
                phoneDialAccessory={
                  <DialCodeSelect
                    id={dialFromId}
                    labelId={dialFromLabelId}
                    items={dialCountries}
                    valueIso={fromPhoneCountryIso}
                    onChangeIso={setFromPhoneCountryIso}
                    loading={dialCountriesLoading}
                    errorText={dialCountriesError}
                  />
                }
              />
              {showBeneficiary ? (
                <ContactIdentifierField
                  label="On this account"
                  value={beneficiaryContact}
                  onChange={setBeneficiaryContact}
                  placeholder="Email or phone number"
                  ariaLabel="On this account"
                  phoneDialAccessory={
                    <DialCodeSelect
                      id={dialBeneficiaryId}
                      labelId={dialBeneficiaryLabelId}
                      items={dialCountries}
                      valueIso={beneficiaryPhoneCountryIso}
                      onChangeIso={setBeneficiaryPhoneCountryIso}
                      loading={dialCountriesLoading}
                      errorText={dialCountriesError}
                    />
                  }
                />
              ) : null}
            </>
          )}

          {submitError ? (
            <p className="text-center text-xs text-destructive" role="alert">
              {submitError}
            </p>
          ) : null}

          <Button
            type="button"
            size="lg"
            className="w-full rounded-xl py-6 text-base font-semibold"
            disabled={!canContinue || submitBusy}
            onClick={() => void handleContinue()}
          >
            {submitBusy ? <GeneratingButtonLabel /> : "Generate link"}
          </Button>
        </section>
      </article>

      <TransferSelectModal
        open={selectModalOpen}
        onOpenChange={setSelectModalOpen}
        onSelect={(selection) => {
          setReceiveSelection(selection);
          setSelectModalOpen(false);
        }}
        chains={chains}
        tokens={tokens}
      />

      {(receiveTab === "fiat" || receiveSelection != null) && (
        <PaymentLinkShareModal
          open={shareModalOpen}
          onOpenChange={setShareModalOpen}
          paymentLink={generatedPaymentLink}
          amount={receiveTab === "crypto" ? tokenAmountForRequest : amount}
          tokenSymbol={fiatTokenLabel}
          receiveMode={receiveTab === "fiat" ? "FIAT" : "CRYPTO"}
          chainId={
            receiveTab === "crypto" && receiveSelection ? String(receiveSelection.chain.id) : undefined
          }
          optionalSenderContact={fromContact}
          countryName={receiveTab === "fiat" ? selectedFiatCountry?.name : undefined}
        />
      )}
    </div>
  );
}
