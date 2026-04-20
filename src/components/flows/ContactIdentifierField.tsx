"use client";

import { ContactIdentifierInput } from "@/components/Pay/ContactIdentifierInput";
import {
  FLOW_FIELD_SHELL,
  FLOW_FIELD_LABEL_TEXT,
} from "@/components/flows/flow-field-classes";
import { cn } from "@/lib/utils";

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
    <div className={FLOW_FIELD_SHELL}>
      <p
        className={cn(
          FLOW_FIELD_LABEL_TEXT,
          hasDescription ? "mb-1" : "mb-2"
        )}
      >
        {label}
      </p>
      {hasDescription && (
        <p className="mb-3 text-sm text-card-foreground/70">{description}</p>
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
