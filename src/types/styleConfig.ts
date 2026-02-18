/**
 * Design system style configuration.
 * All values are used to generate CSS variables for consistent, dynamic styling.
 * Aligns with md/product/design.system.md and supports VisionOS-friendly scaling.
 */

export interface SpacingScale {
  /** 4px - base unit */
  space1: string;
  space2: string;
  space3: string;
  space4: string;
  space6: string;
  space8: string;
  space12: string;
}

export interface TypographyScale {
  textXs: { size: string; lineHeight: string };
  textSm: { size: string; lineHeight: string };
  textBase: { size: string; lineHeight: string };
  textLg: { size: string; lineHeight: string };
  textXl: { size: string; lineHeight: string };
  text2xl: { size: string; lineHeight: string };
  text4xl: { size: string; lineHeight: string };
}

export interface ComponentSizes {
  buttonHeightSm: string;
  buttonHeightMd: string;
  buttonHeightLg: string;
  inputHeight: string;
  borderRadiusSm: string;
  borderRadiusMd: string;
  borderRadiusLg: string;
}

export interface AnimationTokens {
  durationFast: string;
  durationNormal: string;
  durationSlow: string;
  ease: string;
}

export type StyleConfig = {
  spacing: SpacingScale;
  typography: TypographyScale;
  components: ComponentSizes;
  animation: AnimationTokens;
};
