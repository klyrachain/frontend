"use client";

import { useState, useMemo, useDeferredValue, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { TransferSelectModal } from "@/components/Transfer/TransferSelectModal";
import { SuggestedTokensRow } from "@/components/Transfer/SuggestedTokensRow";
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
import {
  getReceiveAccountSpec,
  isValidReceiveAddress,
} from "@/lib/receiveAccountByChain";
import { PaymentLinkShareModal } from "@/components/Receive/PaymentLinkShareModal";

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
  return `${origin}/pay?${search.toString()}`;
}

export function ReceiveContainer() {
  const [receiveSelection, setReceiveSelection] = useState<TokenSelection | null>(null);
  const [amount, setAmount] = useState("");
  const [fromContact, setFromContact] = useState("");
  const [receiveAddress, setReceiveAddress] = useState("");
  const [selectModalOpen, setSelectModalOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [generatedPaymentLink, setGeneratedPaymentLink] = useState("");

  const usedEntries = useAppSelector((s) => s.usedTokens.entries);
  const deferredUsedEntries = useDeferredValue(usedEntries);
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
    () => buildSuggestedTokenSelections(deferredUsedEntries, chains, tokens),
    [deferredUsedEntries, chains, tokens]
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

  const addressValid =
    accountSpec != null &&
    isValidReceiveAddress(receiveAddress, accountSpec.format);

  const amountValid = isValidPositiveAmount(amount);
  const coreReceiveDetailsComplete =
    receiveSelection != null && amountValid && addressValid;
  const canContinue = coreReceiveDetailsComplete;

  const handleContinue = () => {
    if (!receiveSelection || !canContinue) return;
    const origin =
      typeof globalThis.window !== "undefined"
        ? globalThis.window.location.origin
        : "";
    const link = buildReceivePaymentLink(origin, {
      amount,
      tokenSymbol: receiveSelection.token.symbol,
      chainId: String(receiveSelection.chain.id),
      receiveAddress,
      fromContact,
    });
    setGeneratedPaymentLink(link);
    setShareModalOpen(true);
  };

  return (
    <div className="flex flex-col duration-300 ease-out relative w-full items-center justify-center">
      <article className="glass-card overflow-hidden p-2 shadow-xl shrink-0 min-w-0 transition-all duration-300 ease-out h-fit">
        <header className="mb-6 pl-2">
          <h1 className="text-2xl text-primary font-semibold">I want to receive</h1>
        </header>

        <section className="flex flex-col gap-2" aria-label="Receive payment details">
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

      {receiveSelection != null && (
        <PaymentLinkShareModal
          open={shareModalOpen}
          onOpenChange={setShareModalOpen}
          paymentLink={generatedPaymentLink}
          amount={amount}
          tokenSymbol={receiveSelection.token.symbol}
        />
      )}
    </div>
  );
}
