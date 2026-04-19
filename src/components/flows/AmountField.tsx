"use client";

import { Input } from "@/components/ui/input";

export interface AmountFieldProps {
  label: string;
  amount: string;
  onAmountChange: (value: string) => void;
  /** Shown below the input (e.g. quote or price preview) */
  footer?: React.ReactNode;
  ariaLabel?: string;
  /** Use transfer-style input class */
  variant?: "default" | "transfer";
  /** When true, amount comes from server (e.g. fixed checkout link) and cannot be edited */
  readOnly?: boolean;
}

export function AmountField({
  label,
  amount,
  onAmountChange,
  footer,
  ariaLabel,
  variant = "default",
  readOnly = false,
}: AmountFieldProps) {
  const inputClass =
    variant === "transfer"
      ? "input-amount-transfer h-12 max-w-full border-0 shadow-none !text-card-foreground placeholder:text-muted-foreground focus-visible:ring-0 md:text-[2.5rem] md:leading-none"
      : "input-text h-12 border-0 shadow-none text-[var(--text-3xl-size)] font-medium focus-visible:ring-0";

  return (
    <div className="rounded-xl border border-border bg-muted/10 p-4">
      <p className="mb-2 text-xs text-card-foreground/70">{label}</p>
      <div className="flex items-center justify-between gap-2 text-card-foreground">
        <Input
          type="text"
          inputMode="decimal"
          placeholder="0"
          value={amount}
          readOnly={readOnly}
          onChange={(e) => {
            if (!readOnly) onAmountChange(e.target.value);
          }}
          className={`${inputClass}${readOnly ? " cursor-default bg-muted/30" : ""}`}
          aria-label={ariaLabel ?? label}
        />
      </div>
      {footer != null && footer !== "" && (
        <div className="mt-2 text-sm text-card-foreground/70">{footer}</div>
      )}
    </div>
  );
}
