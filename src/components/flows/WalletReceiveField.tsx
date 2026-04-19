"use client";

import { Input } from "@/components/ui/input";
import { Wallet } from "lucide-react";
import type { ReceiveAccountSpec } from "@/lib/receiveAccountByChain";

export interface WalletReceiveFieldProps {
  chainDisplayName: string;
  accountSpec: ReceiveAccountSpec;
  value: string;
  onChange: (value: string) => void;
  addressValid: boolean;
  showError: boolean;
}

export function WalletReceiveField({
  chainDisplayName,
  accountSpec,
  value,
  onChange,
  addressValid,
  showError,
}: WalletReceiveFieldProps) {
  return (
    <div className="rounded-xl border border-border bg-muted/10 p-4">
      <p className="mb-2 text-xs text-card-foreground/70">On this account</p>
      <p id="receive-account-hint" className="mb-3 text-sm text-card-foreground/70">
        {accountSpec.helperText}
      </p>
      <div className="relative flex items-center">
        <span
          className="pointer-events-none absolute left-3 flex shrink-0 text-card-foreground/55"
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
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-12 border-0 bg-transparent pl-10 font-mono text-3xl font-medium text-card-foreground placeholder:text-muted-foreground shadow-none focus-visible:ring-0"
          aria-label={`Your ${accountSpec.addressLabel} on ${chainDisplayName}`}
          aria-describedby="receive-account-hint"
        />
      </div>
      {showError && value.trim().length > 0 && !addressValid && (
        <p className="mt-2 text-sm text-destructive" role="alert">
          {accountSpec.format === "evm"
            ? "Enter a valid EVM address (0x + 40 hex characters)."
            : "Enter a valid wallet address for this network."}
        </p>
      )}
    </div>
  );
}

export function WalletReceiveFieldPlaceholder({
  message,
}: {
  message: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-muted/10 p-4">
      <p className="mb-2 text-xs text-card-foreground/70">On this account</p>
      <p className="text-sm text-card-foreground/70">{message}</p>
    </div>
  );
}
