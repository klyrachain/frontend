"use client";

import { useState, useMemo, useDeferredValue } from "react";
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

export function PayContainer() {
  const [sendSelection, setSendSelection] = useState<TokenSelection | null>(null);
  const [amount, setAmount] = useState("");
  const [to, setTo] = useState("");
  const [selectModalOpen, setSelectModalOpen] = useState(false);

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

  return (
    <div className="flex flex-col duration-300 ease-out relative w-full items-center justify-center">
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
