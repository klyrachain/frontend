"use client";

import { Input } from "@/components/ui/input";
import {
  FLOW_FIELD_SHELL,
  FLOW_FIELD_LABEL,
  FLOW_INPUT_AMOUNT_TRANSFER,
} from "@/components/flows/flow-field-classes";

export interface AmountFieldProps {
  label: string;
  /** Shown on the same row as the label (e.g. token / USD toggle). */
  labelRight?: React.ReactNode;
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
  labelRight,
  amount,
  onAmountChange,
  footer,
  ariaLabel,
  variant = "default",
  readOnly = false,
}: AmountFieldProps) {
  // const inputClass =
  //   variant === "transfer" ? FLOW_INPUT_AMOUNT_TRANSFER : FLOW_INPUT_AMOUNT_DEFAULT;
  const inputClass = FLOW_INPUT_AMOUNT_TRANSFER;
  return (
    <div className={`${FLOW_FIELD_SHELL}`}>
      <div className="flex items-center justify-between gap-2">
        <p className={FLOW_FIELD_LABEL}>{label}</p>
        {labelRight != null ? <div className="shrink-0">{labelRight}</div> : null}
      </div>
      <div className="flex items-center justify-between text-card-foreground p-0">
        <Input
          type="text"
          inputMode="decimal"
          placeholder="0"
          value={amount}
          readOnly={readOnly}
          onChange={(e) => {
            if (!readOnly) onAmountChange(e.target.value);
          }}
          className={`${inputClass}${readOnly ? " cursor-default" : "bg-transparent"}`}
          aria-label={ariaLabel ?? label}
        />
      </div>
      {footer != null && footer !== "" && (
        <div className="mt-2 text-sm text-card-foreground/70">{footer}</div>
      )}
    </div>
  );
}
