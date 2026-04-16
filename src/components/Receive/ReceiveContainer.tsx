"use client";

import { useState, useMemo, useDeferredValue, useEffect } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { TransferSelectModal } from "@/components/Transfer/TransferSelectModal";
import {
  TokenSelectField,
  AmountField,
  ContactIdentifierField,
  WalletReceiveField,
  WalletReceiveFieldPlaceholder,
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
    <div className="flex flex-col duration-300 ease-out relative w-full items-center justify-center">
      <article className="glass-card overflow-hidden p-2 shadow-xl shrink-0 min-w-0 transition-all duration-300 ease-out h-fit">
        <header className="mb-6 space-y-4 pl-2">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-2xl text-primary font-semibold">I want to receive</h1>
            <div
              className="flex w-full gap-2 sm:w-auto"
              role="tablist"
              aria-label="Receive as crypto or fiat"
            >
              <Button
                type="button"
                variant={receiveTab === "crypto" ? "default" : "outline"}
                className="flex-1 rounded-xl sm:flex-none"
                onClick={() => setReceiveTab("crypto")}
              >
                Crypto
              </Button>
              <Button
                type="button"
                variant={receiveTab === "fiat" ? "default" : "outline"}
                className="flex-1 rounded-xl sm:flex-none"
                onClick={() => setReceiveTab("fiat")}
              >
                Fiat
              </Button>
            </div>
          </div>
          {receiveTab === "fiat" ? (
            <p className="text-xs text-muted-foreground">
              Payer completes with card or mobile money (no gas). You share a Pay link
              aligned with platform settlement.
            </p>
          ) : null}
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
                  description="Restrict the payment link to a known payer"
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
              <div className="space-y-2 px-1">
                <Label htmlFor="receive-fiat-country">Country</Label>
                <select
                  id="receive-fiat-country"
                  value={selectedCountryId}
                  onChange={(e) => setSelectedCountryId(e.target.value)}
                  disabled={fiatCountriesLoading}
                  className={cn(
                    "flex h-12 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    "disabled:cursor-not-allowed disabled:opacity-50"
                  )}
                >
                  <option value="">
                    {fiatCountriesLoading ? "Loading countries…" : "Select country"}
                  </option>
                  {fiatCountries.map((country) => (
                    <option key={country.id} value={country.id}>
                      {country.name} ({country.code}) — {country.currency}
                    </option>
                  ))}
                </select>
                {fiatCountriesError ? (
                  <p className="text-xs text-destructive">{fiatCountriesError}</p>
                ) : null}
                {selectedFiatCountry ? (
                  <p className="text-xs text-muted-foreground">
                    Paystack settlement currency:{" "}
                    <span className="font-medium text-foreground">
                      {selectedFiatCountry.currency}
                    </span>
                  </p>
                ) : null}
              </div>
              <ContactIdentifierField
                label="From"
                description="Optional: restrict the link to a known payer"
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
            className="w-full rounded-xl py-6 text-base font-semibold bg-black"
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
