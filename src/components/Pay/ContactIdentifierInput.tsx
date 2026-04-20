"use client";

import { Mail, Phone, Wallet } from "lucide-react";
import { Input } from "@/components/ui/input";
import { FLOW_INPUT_TEXT } from "@/components/flows/flow-field-classes";
import { cn } from "@/lib/utils";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PHONE_DIGITS = 7;

export function getContactIdentifierType(
  value: string
): "email" | "phone" | "address" | null {
  const trimmed = value.trim();
  if (trimmed.length === 0) return null;
  if (EMAIL_REGEX.test(trimmed)) return "email";
  const digitsOnly = trimmed.replace(/\D/g, "");
  if (
    digitsOnly.length >= MIN_PHONE_DIGITS &&
    /^[\d\s+\-().]+$/.test(trimmed)
  ) {
    return "phone";
  }
  return "address";
}

export function ContactIdentifierInput({
  value,
  onChange,
  placeholder = "Email, phone or wallet address",
  ariaLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  ariaLabel: string;
}) {
  const type = getContactIdentifierType(value);
  return (
    <div className="flex min-h-12 items-center gap-2">
      <span
        className="flex size-5 shrink-0 items-center justify-center text-card-foreground/55"
        aria-hidden
      >
        {type === "email" && <Mail className="size-5" />}
        {type === "phone" && <Phone className="size-5" />}
        {type === "address" && <Wallet className="size-5" />}
        {type === null ? <span className="size-5" /> : null}
      </span>
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
