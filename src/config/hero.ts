/**
 * Hero section and hero background content.
 * Edit titleLines and subtitle for long text; use multiple lines or \n for line breaks.
 */

export const HERO_CONFIG = {
  /** Full-bleed background image (fits viewport). Public path e.g. /africa.avif */
  backgroundImage: "/image2.png",
  /** Opacity of background image (0–1). */
  backgroundImageOpacity: 0.35,
  /** Title lines (each array item is one line). */
  titleLines: [
    "The Future of Payments is",
    "Multi-Rail.",
  ],
  /** Subtitle: one string; use \n for line breaks when displayed. */
  subtitle: "Accept fiat, stablecoins, and crypto with morapay. The seamless payment gateway for the next generation of commerce.",
  /** Brand name shown in subtitle (wrapped with Shinier font). */
  brandName: "",
  /** Large text embedded in the hero background. Use \n or <br/> for line breaks. */
  embeddedText: "The future of payments is\nmulti-rail.",
  /** GSAP animation for embedded text: "none" | "writing" | "pop" | "float". */
  embeddedTextAnimation: "pop",
  /** Embedded images (collage). Size per image: "small" | "medium" | "large" or px number. */
  embeddedImages: [] as Array<{ src: string; size?: "small" | "medium" | "large" | number }>,
  /** Default image size when using embeddedImages. */
  embeddedImageDefaultSize: "large",
} as const;

export type HeroConfig = typeof HERO_CONFIG;
