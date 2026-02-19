import type { GradientColors } from "@/types/theme";

/**
 * Gradient color presets for ShaderGradient background.
 * Never use raw hex in components; select by gradientThemeId from Redux.
 */
export const GRADIENT_THEME_PRESETS: Record<string, GradientColors> = {
  default: {
    color1: "#000088",
    color2: "#878ecc",
    color3: "#b7abe1",
  },
  // default: {
  //   color1: "#553bff",
  //   color2: "#9bc1db",
  //   color3: "#d0bce1",
  // },
  ocean: {
    color1: "#0EA5E9",
    color2: "#06B6D4",
    color3: "#E0F2FE",
  },
  forest: {
    color1: "#059669",
    color2: "#34D399",
    color3: "#D1FAE5",
  },
  sunset: {
    color1: "#F59E0B",
    color2: "#F97316",
    color3: "#FEF3C7",
  },
  minimal: {
    color1: "#F8FAFC",
    color2: "#E2E8F0",
    color3: "#94A3B8",
  },
  vision: {
    color1: "#6366F1",
    color2: "#A5B4FC",
    color3: "#E0E7FF",
  },
};

export const DEFAULT_GRADIENT_THEME_ID = "default";
