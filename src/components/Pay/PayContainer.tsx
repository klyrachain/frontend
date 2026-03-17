"use client";

import { useState, useMemo, useDeferredValue } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import { TransferSelectModal } from "@/components/Transfer/TransferSelectModal";
import { ContactIdentifierInput } from "@/components/Pay/ContactIdentifierInput";
import { SuggestedTokensRow } from "@/components/Transfer/SuggestedTokensRow";
import type { TokenSelection } from "@/components/Exchange/TokenChainSelectModal";
import type { Chain } from "@/types/token";
import { useAppSelector } from "@/store/hooks";
import { useGetChainsQuery, useGetTokensQuery } from "@/store/api/squidApi";
import { CHAINS, TOKENS, getChainById as getStaticChainById } from "@/config/chainsAndTokens";

function getChainByIdFromList(chains: Chain[], chainId: string): Chain | undefined {
  return chains.find((c) => c.id === chainId);
}

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
  const suggestedSelections = useMemo(() => {
    const out: TokenSelection[] = [];
    for (const e of deferredUsedEntries) {
      const chain = getChainByIdFromList(chains, e.chainId) ?? getStaticChainById(e.chainId);
      const token = tokens.find((t) => t.id === e.tokenId);
      if (chain && token) out.push({ chain, token });
    }
    return out;
  }, [deferredUsedEntries, chains, tokens]);

  return (
    <div className="flex flex-col duration-300 ease-out relative w-full items-center justify-center">
      <article className="glass-card max-w-full overflow-hidden p-2 shadow-xl shrink-0 min-w-0 transition-all duration-300 ease-out h-fit">
        <header className="mb-6 pl-2">
          <h1 className="text-2xl text-primary font-semibold">I want to send</h1>
        </header>

        <section className="flex flex-col gap-2">
          <div className="flex flex-col gap-2">

          {suggestedSelections.length > 0 && (
            // <div className="rounded-xl border border-border bg-muted/30 p-4">
            // <p className="mb-2 text-xs text-muted-foreground">Quick select</p>
           
              <SuggestedTokensRow
                suggestions={suggestedSelections}
                onSelect={setSendSelection}
                side="left"
              />
            // </div>
          )}
          <div className="rounded-xl border border-border bg-muted/30 p-4">
            <p className="mb-2 text-xs text-muted-foreground">Select token</p>
            <button
              type="button"
              onClick={() => setSelectModalOpen(true)}
              className="flex w-full cursor-pointer items-center gap-2 rounded-lg text-left transition-colors hover:bg-muted/50"
              aria-label={sendSelection ? `${sendSelection.token.symbol} on ${sendSelection.chain.name} – change token` : "Select token"}
            >
              {sendSelection ? (
                <>
                  {sendSelection.token.logoURI ? (
                    <Image
                      src={sendSelection.token.logoURI}
                      alt=""
                      width={34}
                      height={34}
                      className="size-8 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                      {sendSelection.token.symbol.slice(0, 2)}
                    </span>
                  )}
                  <span className="min-w-0 truncate font-medium text-primary">
                    {sendSelection.token.name}
                  </span>
                  <span className="shrink-0 text-xs text-primary">
                    {sendSelection.chain.name}
                  </span>
                </>
              ) : (
                <span className="text-muted-foreground">Select token</span>
              )}
            </button>
          </div>
          </div>

          <div className="rounded-xl border border-border bg-muted/10 p-4">
            <p className="mb-2 text-xs text-muted-foreground">Amount</p>
            <Input
              type="text"
              inputMode="decimal"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="input-text h-12 border-0 shadow-none text-[var(--text-3xl-size)] font-medium focus-visible:ring-0"
            />
          </div>

          <div className="rounded-xl border border-border bg-muted/10 p-4">
            <p className="mb-2 text-xs text-muted-foreground">To</p>
            <ContactIdentifierInput
              value={to}
              onChange={setTo}
              ariaLabel="Recipient: email, phone number or crypto address"
            />
          </div>

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
