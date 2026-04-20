"use client";

import { Input } from "@/components/ui/input";
import { Wallet } from "lucide-react";
import type { ReceiveAccountSpec } from "@/lib/receiveAccountByChain";
import {
  FLOW_FIELD_SHELL,
  FLOW_FIELD_LABEL,
  FLOW_INPUT_MONO,
} from "@/components/flows/flow-field-classes";
import { cn } from "@/lib/utils";

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
    <div className={FLOW_FIELD_SHELL}>
      <p className={FLOW_FIELD_LABEL}>On this account</p>
      <p id="receive-account-hint" className="mb-3 text-sm text-card-foreground/70">
        {accountSpec.helperText}
      </p>
      <div className="flex min-h-12 items-center gap-2">
        <span
          className="flex size-5 shrink-0 items-center justify-center text-card-foreground/55"
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
          className={cn(
            FLOW_INPUT_MONO,
            "flex-1",
            showError && value.trim().length > 0 && !addressValid && "ring-2 ring-destructive/60"
          )}
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
    <div className={FLOW_FIELD_SHELL}>
      <p className={FLOW_FIELD_LABEL}>On this account</p>
      <p className="text-sm text-card-foreground/70">{message}</p>
    </div>
  );
}
