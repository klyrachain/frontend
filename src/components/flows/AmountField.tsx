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
}

export function AmountField({
  label,
  amount,
  onAmountChange,
  footer,
  ariaLabel,
  variant = "default",
}: AmountFieldProps) {
  const inputClass =
    variant === "transfer"
      ? "input-text h-12 max-w-full border-0 shadow-none text-[var(--text-3xl-size)] font-medium focus-visible:ring-0"
      : "input-text h-12 border-0 shadow-none text-[var(--text-3xl-size)] font-medium focus-visible:ring-0";

  return (
    <div className="rounded-xl border border-border bg-muted/10 p-4">
      <p className="mb-2 text-xs text-muted-foreground">{label}</p>
      <div className="flex items-center justify-between gap-2 text-black">
        <Input
          type="text"
          inputMode="decimal"
          placeholder="0"
          value={amount}
          onChange={(e) => onAmountChange(e.target.value)}
          className={inputClass}
          aria-label={ariaLabel ?? label}
        />
      </div>
      {footer != null && footer !== "" && (
        <div className="mt-2 text-sm text-muted-foreground">{footer}</div>
      )}
    </div>
  );
}
