import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

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

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
