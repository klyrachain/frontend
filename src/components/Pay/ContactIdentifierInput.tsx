"use client";

import { Input } from "@/components/ui/input";
import { FLOW_INPUT_TEXT } from "@/components/flows/flow-field-classes";
import { cn } from "@/lib/utils";


export function ContactIdentifierInput({
  value,
  onChange,
  placeholder = "Email, phone or wallet address",
  ariaLabel,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  ariaLabel: string;
  className?: string;
}) {
  return (
    <div className={cn("flex min-h-12 min-w-0 flex-1 items-center", className)}>
      <Input
        type="text"
        inputMode="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(FLOW_INPUT_TEXT, "flex-1")}
        aria-label={ariaLabel}
      />
    </div>
  );
}
