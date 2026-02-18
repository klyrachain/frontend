/**
 * Configurable font presets for VisionOS-style payment platform.
 * All fonts loaded via next/font; variable names must match layout font definitions.
 *
 * Recommendation rationale:
 * - Geist: Apple-like, clean; default for seamless feel.
 * - Inter: Fintech standard, excellent tabular figures for amounts.
 * - Plus Jakarta Sans: Friendly, slightly rounded; "easy" NameDrop-like feel.
 * - Outfit: Rounded, modern; strong VisionOS aesthetic.
 * - DM Sans: Clean geometric; good for numbers and trust.
 * - Manrope: Geometric, clear; professional but approachable.
 * - Lexend: Readability-optimized; inclusive and clear.
 * Mono: Geist Mono (match Geist), JetBrains Mono (design system), IBM Plex Mono (readable).
 */

import type { FontPreset } from "@/types/font";

export const SANS_FONT_PRESETS: FontPreset[] = [
  { id: "geist", label: "Geist", variable: "var(--font-geist-sans)", description: "Apple-like, clean default" },
  { id: "inter", label: "Inter", variable: "var(--font-inter)", description: "Fintech standard, excellent for numbers" },
  { id: "plusJakarta", label: "Plus Jakarta Sans", variable: "var(--font-plus-jakarta)", description: "Friendly, approachable" },
  { id: "outfit", label: "Outfit", variable: "var(--font-outfit)", description: "Rounded, VisionOS-style" },
  { id: "dmSans", label: "DM Sans", variable: "var(--font-dm-sans)", description: "Clean geometric" },
  { id: "manrope", label: "Manrope", variable: "var(--font-manrope)", description: "Modern, professional" },
  { id: "lexend", label: "Lexend", variable: "var(--font-lexend)", description: "Readability-optimized" },
];

export const MONO_FONT_PRESETS: FontPreset[] = [
  { id: "geistMono", label: "Geist Mono", variable: "var(--font-geist-mono)", description: "Matches Geist family" },
  { id: "jetbrainsMono", label: "JetBrains Mono", variable: "var(--font-jetbrains-mono)", description: "Code and addresses" },
  { id: "ibmPlexMono", label: "IBM Plex Mono", variable: "var(--font-ibm-plex-mono)", description: "Highly readable mono" },
];

export const DEFAULT_SANS_FONT_ID = "geist" as const;
export const DEFAULT_MONO_FONT_ID = "geistMono" as const;
