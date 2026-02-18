/**
 * Font preset identifiers for configurable typography.
 * Aligns with VisionOS-style UI and payment platform readability.
 */

/** Sans-serif (UI, body, headings). */
export type SansFontId =
  | "geist"
  | "inter"
  | "plusJakarta"
  | "outfit"
  | "dmSans"
  | "manrope"
  | "lexend";

/** Monospace (addresses, hashes, code). */
export type MonoFontId = "geistMono" | "jetbrainsMono" | "ibmPlexMono";

export interface FontPreset {
  id: SansFontId | MonoFontId;
  label: string;
  /** CSS variable name for the font (e.g. --font-geist-sans). */
  variable: string;
  /** Short description for accessibility / settings. */
  description?: string;
}
