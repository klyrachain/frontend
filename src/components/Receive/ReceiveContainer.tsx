"use client";

import { useState, useMemo, useDeferredValue, useEffect } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { TransferSelectModal } from "@/components/Transfer/TransferSelectModal";
import {
  TokenSelectField,
  AmountField,
  ContactIdentifierField,
  WalletReceiveField,
  WalletReceiveFieldPlaceholder,
  FlagSelect,
  FLOW_FIELD_SHELL,
  FLOW_FIELD_LABEL,
} from "@/components/flows";
import type { TokenSelection } from "@/components/Exchange/TokenChainSelectModal";
import { useAppSelector } from "@/store/hooks";
import { useGetChainsQuery, useGetTokensQuery } from "@/store/api/squidApi";
import { CHAINS, TOKENS } from "@/config/chainsAndTokens";
import {
  buildSuggestedTokenSelections,
  isValidPositiveAmount,
} from "@/lib/flowTokens";
import { useClientMounted } from "@/hooks/use-client-mounted";
import {
  getReceiveAccountSpec,
  isValidReceiveAddress,
} from "@/lib/receiveAccountByChain";
import { PaymentLinkShareModal } from "@/components/Receive/PaymentLinkShareModal";
import { FlowsWalletHeaderAction } from "@/app/(flows)/FlowsWalletHeaderAction";

const SuggestedTokensRow = dynamic(
  () =>
    import("@/components/Transfer/SuggestedTokensRow").then(
      (m) => m.SuggestedTokensRow
    ),
  { ssr: false }
);

function buildReceivePaymentLink(
  origin: string,
  params: {
    amount: string;
    tokenSymbol: string;
    chainId: string;
    receiveAddress: string;
    fromContact: string;
  }
): string {
  const search = new URLSearchParams({
    amount: params.amount.trim(),
    token: params.tokenSymbol,
    chain: params.chainId,
    to: params.receiveAddress.trim(),
  });
  if (params.fromContact.trim() !== "") {
    search.set("from", params.fromContact.trim());
  }
  search.set("receive", "1");
  search.set("mode", "crypto");
  return `${origin}/pay?${search.toString()}`;
}

function buildFiatReceivePaymentLink(
  origin: string,
  params: { amount: string; currency: string; fromContact: string }
): string {
  const search = new URLSearchParams({
    amount: params.amount.trim(),
    currency: params.currency.trim().toUpperCase(),
    receive: "1",
    mode: "fiat",
  });
  if (params.fromContact.trim() !== "") {
    search.set("from", params.fromContact.trim());
  }
  return `${origin}/pay?${search.toString()}`;
}

type ReceiveTab = "crypto" | "fiat";

type CountryRow = {
  id: string;
  code: string;
  name: string;
  currency: string;
};

export function ReceiveContainer() {
  const [receiveTab, setReceiveTab] = useState<ReceiveTab>("crypto");
  const [receiveSelection, setReceiveSelection] = useState<TokenSelection | null>(null);
  const [amount, setAmount] = useState("");
  const [fiatCountries, setFiatCountries] = useState<CountryRow[]>([]);
  const [fiatCountriesLoading, setFiatCountriesLoading] = useState(false);
  const [fiatCountriesError, setFiatCountriesError] = useState<string | null>(null);
  const [selectedCountryId, setSelectedCountryId] = useState("");
  const [fromContact, setFromContact] = useState("");
  const [receiveAddress, setReceiveAddress] = useState("");
  const [selectModalOpen, setSelectModalOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [generatedPaymentLink, setGeneratedPaymentLink] = useState("");
  const [fiatTokenLabel, setFiatTokenLabel] = useState("GHS");

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

  const accountSpec = useMemo(() => {
    if (!receiveSelection) return null;
    return getReceiveAccountSpec(
      String(receiveSelection.chain.id),
      receiveSelection.chain.name
    );
  }, [receiveSelection]);

  const prevChainKey = receiveSelection?.chain.id ?? "";
  useEffect(() => {
    setReceiveAddress("");
  }, [prevChainKey]);

  useEffect(() => {
    if (receiveTab !== "fiat") {
      setSelectedCountryId("");
    }
  }, [receiveTab]);

  useEffect(() => {
    if (receiveTab !== "fiat") return;
    let cancelled = false;
    setFiatCountriesLoading(true);
    setFiatCountriesError(null);
    void fetch("/api/core/countries?supported=paystack", { cache: "no-store" })
      .then(async (res) => {
        const json: unknown = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (!res.ok) {
          setFiatCountries([]);
          setFiatCountriesError("Could not load countries.");
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
        if (!cancelled) {
          setFiatCountries([]);
          setFiatCountriesError("Could not load countries.");
        }
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

  const addressValid =
    accountSpec != null &&
    isValidReceiveAddress(receiveAddress, accountSpec.format);

  const amountValid = isValidPositiveAmount(amount);
  const fiatAmountValid = isValidPositiveAmount(amount);
  const coreReceiveDetailsComplete =
    receiveSelection != null && amountValid && addressValid;
  const fiatReceiveComplete =
    fiatAmountValid && selectedCountryId !== "" && selectedFiatCountry != null;
  const canContinue =
    receiveTab === "crypto" ? coreReceiveDetailsComplete : fiatReceiveComplete;

  const handleContinue = () => {
    const origin =
      typeof globalThis.window !== "undefined"
        ? globalThis.window.location.origin
        : "";
    if (receiveTab === "crypto") {
      if (!receiveSelection || !coreReceiveDetailsComplete) return;
      const link = buildReceivePaymentLink(origin, {
        amount,
        tokenSymbol: receiveSelection.token.symbol,
        chainId: String(receiveSelection.chain.id),
        receiveAddress,
        fromContact,
      });
      setFiatTokenLabel(receiveSelection.token.symbol);
      setGeneratedPaymentLink(link);
      setShareModalOpen(true);
      return;
    }
    if (!fiatReceiveComplete || !selectedFiatCountry) return;
    const cur = selectedFiatCountry.currency.trim().toUpperCase();
    setFiatTokenLabel(cur);
    const link = buildFiatReceivePaymentLink(origin, {
      amount,
      currency: cur,
      fromContact,
    });
    setGeneratedPaymentLink(link);
    setShareModalOpen(true);
  };

  return (
    <div className="relative mx-auto flex w-full max-w-xl flex-col self-stretch duration-300 ease-out">
      <article className="glass-card h-fit w-full shrink-0 overflow-hidden p-2 shadow-xl transition-all duration-300 ease-out min-w-0">
        <header className="mb-6 space-y-4 pl-2">
          <div className="flex flex-row items-center justify-between gap-3">
            <h1 className="text-3xl font-semibold text-card-foreground">I want to receive</h1>
            <FlowsWalletHeaderAction />
          </div>
          <div
            className="w-full gap-2 space-x-2 flex-row items-center justify-start"
            role="tablist"
            aria-label="Receive as crypto or fiat"
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
          {/* {receiveTab === "fiat" ? (
            <p className="text-xs text-card-foreground/70">
              Payer completes with card or mobile money (no gas).
              <br/> You share a Pay link
              aligned with platform settlement.
            </p>
          ) : null} */}
        </header>

        <section className="flex flex-col gap-2" aria-label="Receive payment details">
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
                label="Amount"
                amount={amount}
                onAmountChange={setAmount}
                ariaLabel="Amount to receive"
              />

              {receiveSelection && accountSpec ? (
                <WalletReceiveField
                  chainDisplayName={receiveSelection.chain.name}
                  accountSpec={accountSpec}
                  value={receiveAddress}
                  onChange={setReceiveAddress}
                  addressValid={addressValid}
                  showError
                />
              ) : (
                <WalletReceiveFieldPlaceholder message="Enter the wallet address where you want to receive." />
              )}

              {coreReceiveDetailsComplete && (
                <ContactIdentifierField
                  label="From"
                  // description="Restrict the payment link to a known payer"
                  value={fromContact}
                  onChange={setFromContact}
                  placeholder="Email, phone or wallet of sender"
                  ariaLabel="Optional sender: email, phone number or wallet address"
                />
              )}
            </>
          ) : (
            <>
              <AmountField
                label="Amount"
                amount={amount}
                onAmountChange={setAmount}
                ariaLabel="Amount to receive in fiat"
              />
              <div className={FLOW_FIELD_SHELL}>
                <Label
                  id="receive-fiat-country-label"
                  htmlFor="receive-fiat-country"
                  className={FLOW_FIELD_LABEL}
                >
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
                  placeholder="Select country"
                  loadingPlaceholder="Loading countries…"
                  variant="flow"
                />
                {fiatCountriesError ? (
                  <p className="text-xs text-destructive">{fiatCountriesError}</p>
                ) : null}
                {selectedFiatCountry ? (
                  <p className="text-xs text-card-foreground/70">
                    Paystack settlement currency:{" "}
                    <span className="font-medium text-card-foreground">
                      {selectedFiatCountry.currency}
                    </span>
                  </p>
                ) : null}
              </div>
              <ContactIdentifierField
                label="From"
                // description="Optional: restrict the link to a known payer"
                value={fromContact}
                onChange={setFromContact}
                placeholder="Email, phone or wallet of sender"
                ariaLabel="Optional sender: email, phone number or wallet address"
              />
            </>
          )}

          <Button
            type="button"
            size="lg"
            className="w-full rounded-xl py-6 text-base font-semibold"
            disabled={!canContinue}
            onClick={handleContinue}
          >
            Generate link
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
          amount={amount}
          tokenSymbol={fiatTokenLabel}
          receiveMode={receiveTab === "fiat" ? "FIAT" : "CRYPTO"}
          chainId={
            receiveTab === "crypto" && receiveSelection
              ? String(receiveSelection.chain.id)
              : undefined
          }
          optionalSenderContact={fromContact}
          countryName={receiveTab === "fiat" ? selectedFiatCountry?.name : undefined}
        />
      )}
    </div>
  );
}
