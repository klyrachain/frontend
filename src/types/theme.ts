/**
 * Theme mode: light, dark, or follow system preference.
 */
export type ThemeMode = "light" | "dark" | "system";

/**
 * Resolved theme for actual application (after resolving "system").
 */
export type ResolvedTheme = "light" | "dark";

/**
 * Identifiers for color theme presets (surfaces, text, primary, etc.).
 */
export type ColorThemeId = "default" | "ocean" | "forest" | "sunset";

/**
 * Identifiers for background gradient presets (ShaderGradient colors).
 */
export type GradientThemeId =
  | "default"
  | "ocean"
  | "forest"
  | "sunset"
  | "minimal"
  | "vision"
  | "landing";

/**
 * Single gradient color set for ShaderGradient (color1, color2, color3).
 */
export interface GradientColors {
  color1: string;
  color2: string;
  color3: string;
}

/**
 * UI density: compact (smaller tap targets), normal, comfortable (VisionOS-friendly).
 */
export type DensityScale = "compact" | "normal" | "comfortable";

/** Re-export font IDs for theme slice. */
export type { SansFontId, MonoFontId } from "./font";
