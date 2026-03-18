"use client";

import { ContactIdentifierInput } from "@/components/Pay/ContactIdentifierInput";

export interface ContactIdentifierFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
  placeholder?: string;
  description?: string;
}

export function ContactIdentifierField({
  label,
  value,
  onChange,
  ariaLabel,
  placeholder,
  description,
}: ContactIdentifierFieldProps) {
  const hasDescription = description != null && description !== "";

  return (
    <div className="rounded-xl border border-border bg-muted/10 p-4">
      <p
        className={`text-xs text-muted-foreground ${hasDescription ? "mb-1" : "mb-2"}`}
      >
        {label}
      </p>
      {hasDescription && (
        <p className="mb-3 text-sm text-muted-foreground">{description}</p>
      )}
      <ContactIdentifierInput
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        ariaLabel={ariaLabel}
      />
    </div>
  );
}
