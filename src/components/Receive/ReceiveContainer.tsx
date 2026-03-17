"use client";

import { useState, useMemo, useDeferredValue, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import { Wallet } from "lucide-react";
import { TransferSelectModal } from "@/components/Transfer/TransferSelectModal";
import { SuggestedTokensRow } from "@/components/Transfer/SuggestedTokensRow";
import { ContactIdentifierInput } from "@/components/Pay/ContactIdentifierInput";
import type { TokenSelection } from "@/components/Exchange/TokenChainSelectModal";
import type { Chain } from "@/types/token";
import { useAppSelector } from "@/store/hooks";
import { useGetChainsQuery, useGetTokensQuery } from "@/store/api/squidApi";
import { CHAINS, TOKENS, getChainById as getStaticChainById } from "@/config/chainsAndTokens";
import {
  getReceiveAccountSpec,
  isValidReceiveAddress,
} from "@/lib/receiveAccountByChain";

function getChainByIdFromList(chains: Chain[], chainId: string): Chain | undefined {
  return chains.find((c) => c.id === chainId);
}

function isValidPositiveAmount(value: string): boolean {
  const normalized = value.trim().replace(",", ".");
  if (normalized === "") return false;
  const n = Number(normalized);
  return Number.isFinite(n) && n > 0;
}

export function ReceiveContainer() {
  const [receiveSelection, setReceiveSelection] = useState<TokenSelection | null>(null);
  const [amount, setAmount] = useState("");
  const [fromContact, setFromContact] = useState("");
  const [receiveAddress, setReceiveAddress] = useState("");
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
            <div className="rounded-xl border border-border bg-muted/30 p-4">
              <p className="mb-2 text-xs text-muted-foreground">Token to receive</p>
              <button
                type="button"
                onClick={() => setSelectModalOpen(true)}
                className="flex w-full cursor-pointer items-center gap-2 rounded-lg text-left transition-colors hover:bg-muted/50"
                aria-label={
                  receiveSelection
                    ? `Receive ${receiveSelection.token.symbol} on ${receiveSelection.chain.name} – change token`
                    : "Select token to receive"
                }
              >
                {receiveSelection ? (
                  <>
                    {receiveSelection.token.logoURI ? (
                      <Image
                        src={receiveSelection.token.logoURI}
                        alt=""
                        width={34}
                        height={34}
                        className="size-8 shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                        {receiveSelection.token.symbol.slice(0, 2)}
                      </span>
                    )}
                    <span className="min-w-0 truncate font-medium text-primary">
                      {receiveSelection.token.name}
                    </span>
                    <span className="shrink-0 text-xs text-primary">
                      {receiveSelection.chain.name}
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
              aria-label="Amount to receive"
            />
          </div>

          <div className="rounded-xl border border-border bg-muted/10 p-4">
            <p className="mb-2 text-xs text-muted-foreground">On this account</p>
            {receiveSelection && accountSpec ? (
              <>
                <p id="receive-account-hint" className="mb-3 text-sm text-muted-foreground">
                  {accountSpec.helperText}
                </p>
                <div className="relative flex items-center">
                  <span
                    className="pointer-events-none absolute left-3 flex shrink-0 text-muted-foreground"
                    aria-hidden
                  >
                    <Wallet className="size-5" />
                  </span>
                  <Input
                    type="text"
                    inputMode="text"
                    autoComplete="off"
                    spellCheck={false}
                    placeholder={accountSpec.inputPlaceholder}
                    value={receiveAddress}
                    onChange={(e) => setReceiveAddress(e.target.value)}
                    className="h-12 border-0 pl-10 shadow-none font-medium focus-visible:ring-0 text-3xl text-black font-mono"
                    aria-label={`Your ${accountSpec.addressLabel} on ${receiveSelection.chain.name}`}
                    aria-describedby="receive-account-hint"
                  />
                </div>
                {receiveAddress.trim().length > 0 && !addressValid && (
                  <p className="mt-2 text-sm text-destructive" role="alert">
                    {accountSpec.format === "evm"
                      ? "Enter a valid EVM address (0x + 40 hex characters)."
                      : "Enter a valid wallet address for this network."}
                  </p>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Enter the wallet address where you want to receive.
              </p>
            )}
          </div>

          {coreReceiveDetailsComplete && (
            <div className="rounded-xl border border-border bg-muted/10 p-4">
              <p className="mb-1 text-xs text-muted-foreground">From</p>
              <p className="mb-3 text-sm text-muted-foreground">
                Restrict the payment link to a known payer 
              </p>
              <ContactIdentifierInput
                value={fromContact}
                onChange={setFromContact}
                placeholder="Email, phone or wallet of sender"
                ariaLabel="Optional sender: email, phone number or wallet address"
              />
            </div>
          )}

          <Button
            size="lg"
            className="w-full rounded-xl py-6 text-base font-semibold bg-black"
            disabled={!canContinue}
          >
            Continue
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
    </div>
  );
}
