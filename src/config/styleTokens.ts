/**
 * Design system tokens from md/product/design.system.md.
 * Base values; density scale can multiply spacing for VisionOS-friendly UI.
 */

import type { StyleConfig } from "@/types/styleConfig";

export const BASE_STYLE_TOKENS: StyleConfig = {
  spacing: {
    space1: "4px",
    space2: "8px",
    space3: "12px",
    space4: "16px",
    space6: "24px",
    space8: "32px",
    space12: "48px",
  },
  typography: {
    textXs: { size: "12px", lineHeight: "16px" },
    textSm: { size: "14px", lineHeight: "20px" },
    textBase: { size: "16px", lineHeight: "24px" },
    textLg: { size: "18px", lineHeight: "28px" },
    textXl: { size: "20px", lineHeight: "28px" },
    text2xl: { size: "24px", lineHeight: "32px" },
    text4xl: { size: "36px", lineHeight: "40px" },
  },
  components: {
    buttonHeightSm: "32px",
    buttonHeightMd: "40px",
    buttonHeightLg: "48px",
    inputHeight: "40px",
    borderRadiusSm: "4px",
    borderRadiusMd: "8px",
    borderRadiusLg: "12px",
  },
  animation: {
    durationFast: "150ms",
    durationNormal: "300ms",
    durationSlow: "500ms",
    ease: "cubic-bezier(0.4, 0, 0.2, 1)",
  },
};

/** Multipliers for density scale (comfortable = larger tap targets). */
export const DENSITY_SCALE_MULTIPLIERS: Record<string, number> = {
  compact: 0.875,
  normal: 1,
  comfortable: 1.125,
};
