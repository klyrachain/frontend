"use client";

import { Mail, Phone, Wallet } from "lucide-react";
import { Input } from "@/components/ui/input";

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
  const showIcon = type !== null;
  return (
    <div className="relative flex items-center">
      {showIcon && (
        <span
          className="pointer-events-none absolute left-3 flex shrink-0 text-muted-foreground"
          aria-hidden
        >
          {type === "email" && <Mail className="size-5" />}
          {type === "phone" && <Phone className="size-5" />}
          {type === "address" && <Wallet className="size-5" />}
        </span>
      )}
      <Input
        type="text"
        inputMode="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`h-12 border-0 shadow-none font-medium focus-visible:ring-0 text-3xl text-black ${showIcon ? "pl-10" : ""}`}
        aria-label={ariaLabel}
      />
    </div>
  );
}
