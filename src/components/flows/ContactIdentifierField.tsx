"use client";

import type { ReactNode } from "react";
import { ContactIdentifierInput } from "@/components/Pay/ContactIdentifierInput";
import {
  FLOW_FIELD_SHELL,
  FLOW_FIELD_LABEL_TEXT,
} from "@/components/flows/flow-field-classes";
import { cn, getContactIdentifierType } from "@/lib/utils";
import { isLikelyFullInternationalPhone } from "@/lib/phone-dial-codes";
import { Mail, Phone, Wallet } from "lucide-react";

export interface ContactIdentifierFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
  placeholder?: string;
  description?: string;
  /** Shown to the left of the input when the value is a national phone (no +country prefix). */
  phoneDialAccessory?: ReactNode;
}

export function ContactIdentifierField({
  label,
  value,
  onChange,
  ariaLabel,
  placeholder,
  description,
  phoneDialAccessory,
}: ContactIdentifierFieldProps) {
  const hasDescription = description != null && description !== "";

  const type = getContactIdentifierType(value);
  const showPhoneDial =
    type === "phone" && phoneDialAccessory != null && !isLikelyFullInternationalPhone(value);
  return (
    <div className={FLOW_FIELD_SHELL}>
      <p
        className={cn(
          FLOW_FIELD_LABEL_TEXT,
          // hasDescription ? "mb-1" : "mb-2"
        )}
      >
        {
          type !== null && 
        <span
        className="flex size-5 shrink-0 items-center justify-center text-card-foreground/55"
        aria-hidden
        >
        {type === "email" && <Mail className="size-5" />}
        {type === "phone" && <Phone className="size-5" />}
        {type === "address" && <Wallet className="size-5" />}
        {/* {type === null ? <span className="size-5" /> : null} */}
      </span>
      }
        {label} 
      </p>
      {hasDescription && (
        <p className="mb-3 text-sm text-card-foreground/70">{description}</p>
      )}
      <div className="flex min-h-12 w-full min-w-0 items-stretch gap-2">
        {showPhoneDial ? <div className="flex shrink-0 items-stretch">{phoneDialAccessory}</div> : null}
        <ContactIdentifierInput
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          ariaLabel={ariaLabel}
        />
      </div>
    </div>
  );
}
