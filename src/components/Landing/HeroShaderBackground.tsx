"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ShaderGradient, ShaderGradientCanvas } from "@shadergradient/react";
import Galaxy from "./Galaxy";

export type EmbeddedTextAnimation = "none" | "writing" | "pop" | "float" | "led";

export interface EmbeddedImageItem {
  src: string;
  /** "small" | "medium" | "large" or pixel width (e.g. 120). Default "medium". */
  size?: "small" | "medium" | "large" | number;
}

export interface HeroShaderBackgroundProps {
  /** Full-bleed background image (fits screen width/height, cover). e.g. /africa.avif */
  backgroundImage?: string;
  /** Opacity of the full-bleed background image (0–1). Default 0.35. */
  backgroundImageOpacity?: number;
  /** Large text embedded in the background. Use \n or <br/> for line breaks. */
  embeddedText?: string;
  /** Animation for embedded text. "led" = words one by one (LED screen style). */
  embeddedTextAnimation?: EmbeddedTextAnimation;
  /** Vertical position of embedded text. "bottom" for /app page ticker. */
  embeddedTextPosition?: "center" | "bottom";
  /** Opacity of embedded text (0–1). Default 0.08. */
  embeddedTextOpacity?: number;
  /** Single image URL (legacy). Prefer embeddedImages for multiple. */
  embeddedImage?: string;
  /** Multiple images as collage. Use with or without embeddedImage. */
  embeddedImages?: EmbeddedImageItem[];
  /** Opacity of embedded image(s) (0–1). Default 0.12. */
  embeddedImageOpacity?: number;
  /** Global image size when using embeddedImages. Overridable per item. */
  embeddedImageDefaultSize?: "small" | "medium" | "large";
}

const IMAGE_SIZE_MAP = {
  small: "clamp(80px, 15vw, 120px)",
  medium: "clamp(120px, 22vw, 200px)",
  large: "clamp(180px, 32vw, 320px)",
} as const;

function getImageSize(size: "small" | "medium" | "large" | number | undefined): string {
  if (size === undefined) return IMAGE_SIZE_MAP.medium;
  if (typeof size === "number") return `${size}px`;
  return IMAGE_SIZE_MAP[size];
}

/** Split by <br/> or \n for multi-line embedded text. */
function splitEmbeddedText(text: string): string[] {
  return text
    .replace(/<br\s*\/?>/gi, "\n")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Split into words for LED-style animation. */
function splitIntoWords(text: string): string[] {
  return text
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/\n/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

/**
 * Hero shader background with optional embedded text (GSAP-animated) and image collage.
 */
export function HeroShaderBackground({
  backgroundImage,
  backgroundImageOpacity = 0.35,
  embeddedText = "",
  embeddedTextAnimation = "pop",
  embeddedTextPosition = "center",
  embeddedTextOpacity = 0.08,
  embeddedImage,
  embeddedImages = [],
  embeddedImageOpacity = 0.12,
  embeddedImageDefaultSize = "medium",
}: HeroShaderBackgroundProps) {
  const textWrapRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<HTMLSpanElement[]>([]);
  const wordRefs = useRef<HTMLSpanElement[]>([]);

  const lines = splitEmbeddedText(embeddedText);
  const words = splitIntoWords(embeddedText);
  const hasText = lines.length > 0 || words.length > 0;
  const isLed = embeddedTextAnimation === "led";

  useGSAP(
    () => {
      if (!hasText || embeddedTextAnimation === "none") return;

      if (isLed && words.length > 0) {
        wordRefs.current = wordRefs.current.slice(0, words.length);
        const wordEls = wordRefs.current.filter(Boolean);
        if (wordEls.length === 0) return;
        const tl = gsap.timeline({ repeat: -1, repeatDelay: 2 });
        tl.set(wordEls, { opacity: 0 });
        tl.to(wordEls, {
          opacity: embeddedTextOpacity,
          duration: 0.22,
          stagger: 0.12,
          ease: "power2.out",
        });
        return () => tl.kill();
      }

      const wrap = textWrapRef.current;
      if (!wrap || lines.length === 0) return;

      lineRefs.current = lineRefs.current.slice(0, lines.length);
      const lineEls = lineRefs.current.filter(Boolean);
      if (lineEls.length === 0) return;

      const duration = 0.6;
      const stagger = 0.12;

      if (embeddedTextAnimation === "writing") {
        lineEls.forEach((el, i) => {
          const chars = el.childNodes;
          gsap.set(chars, { opacity: 0 });
          gsap.to(chars, {
            opacity: embeddedTextOpacity,
            duration: 0.04,
            stagger: 0.03,
            delay: i * stagger,
          });
        });
      } else if (embeddedTextAnimation === "pop") {
        gsap.set(lineEls, { opacity: 0, scale: 0.6 });
        gsap.to(lineEls, {
          opacity: embeddedTextOpacity,
          scale: 1,
          duration,
          stagger,
          ease: "back.out(1.2)",
        });
      } else if (embeddedTextAnimation === "float") {
        gsap.set(lineEls, { opacity: 0, y: 24 });
        gsap.to(lineEls, {
          opacity: embeddedTextOpacity,
          y: 0,
          duration,
          stagger,
          ease: "power2.out",
        });
      }
    },
    {
      scope: textWrapRef,
      dependencies: [embeddedText, embeddedTextAnimation, embeddedTextOpacity, hasText, isLed, words.length],
    }
  );

  const imageList: EmbeddedImageItem[] = embeddedImage
    ? [{ src: embeddedImage, size: embeddedImageDefaultSize }, ...embeddedImages]
    : embeddedImages;
  const hasImages = imageList.length > 0;

  return (
    <div
      className="fixed inset-0 z-0 size-full overflow-hidden pointer-events-none"
      aria-hidden
    >
      <ShaderGradientCanvas className="!absolute !inset-0 !size-full">
        <ShaderGradient
          animate="on"
          brightness={1.2}
          cAzimuthAngle={0}
          cDistance={3.6}
          cPolarAngle={90}
          cameraZoom={1}
          color1="#023436"
          color2="#037971"
          color3="#037971"
          destination="onCanvas"
          embedMode="off"
          envPreset="dawn"
          fov={45}
          frameRate={10}
          gizmoHelper="hide"
          grain="on"
          lightType="env"
          pixelDensity={1}
          positionX={-1.4}
          positionY={0}
          positionZ={0}
          range="disabled"
          rangeEnd={40}
          rangeStart={0}
          reflection={0}
          rotationX={0}
          rotationY={10}
          rotationZ={50}
          shader="defaults"
          type="plane"
          uAmplitude={1}
          uDensity={1.8}
          uFrequency={5.5}
          uSpeed={0.01}
          uStrength={0.2}
          uTime={0}
          wireframe={false}
        />
      </ShaderGradientCanvas>

      {backgroundImage ? (
        <div
          className="absolute inset-0 size-full pointer-events-none"
          aria-hidden
        >
          <img
            src={backgroundImage}
            alt=""
            className="absolute inset-0 size-full object-cover object-center"
            style={{ opacity: backgroundImageOpacity }}
          />
        </div>
      ) : null}

      <div
        className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none blur-lg"
        aria-hidden
      >
        <Galaxy
          mouseRepulsion={true}
          mouseInteraction={true}
          density={0.01}
          glowIntensity={0.08}
          saturation={-4}
          hueShift={230}
          twinkleIntensity={0.2}
          rotationSpeed={0.02}
          repulsionStrength={2}
          autoCenterRepulsion={0}
          starSpeed={0.00002}
          speed={0.04}
          transparent
          starTint={[1, 1, 1]}
        />
      </div>

      {hasText ? (
        <div
          ref={textWrapRef}
          className={`absolute inset-0 flex pointer-events-none select-none ${
            isLed
              ? "flex-row flex-wrap items-end justify-center gap-x-[0.35em] gap-y-0 pb-[clamp(1.5rem,6vh,3rem)] px-4"
              : embeddedTextPosition === "bottom"
                ? "flex-col items-center justify-end pb-[clamp(2rem,8vh,4rem)]"
                : lines.length === 1
                  ? "items-center justify-center"
                  : "flex-col items-center justify-center"
          } ${!isLed && lines.length > 1 ? "flex-col items-center justify-center" : ""}`}
          aria-hidden
          style={
            !isLed && lines.length > 1
              ? { gap: "0.06em" }
              : undefined
          }
        >
          {isLed ? (
            <span
              className="font-shinier text-center text-[clamp(1.25rem,3.5vw,2rem)] font-normal tracking-wide text-white"
              style={{ textShadow: "0 0 40px rgba(255,255,255,0.06)" }}
            >
              {words.map((word, i) => (
                <span
                  key={i}
                  ref={(el) => {
                    if (el) wordRefs.current[i] = el;
                  }}
                  className="inline-block mr-[0.35em]"
                >
                  {word}
                </span>
              ))}
            </span>
          ) : (
            lines.map((line, i) => (
              <span
                key={i}
                ref={(el) => {
                  if (el) lineRefs.current[i] = el;
                }}
                className={
                  lines.length === 1
                    ? "font-shinier whitespace-nowrap text-center text-[clamp(6rem,20vw,18rem)] font-normal tracking-tight text-white"
                    : "font-shinier text-center text-[clamp(5rem,18vw,16rem)] font-normal tracking-tight text-white leading-[1.15]"
                }
                style={{
                  opacity: embeddedTextAnimation === "none" ? embeddedTextOpacity : undefined,
                  textShadow: "0 0 80px rgba(255,255,255,0.03)",
                }}
              >
                {embeddedTextAnimation === "writing"
                  ? line.split("").map((char, j) => (
                      <span key={j} className="inline-block">
                        {char}
                      </span>
                    ))
                  : line}
              </span>
            ))
          )}
        </div>
      ) : null}

      {hasImages ? (
        <div
          className="absolute inset-0 flex flex-wrap items-center justify-center gap-[clamp(12px,3vw,24px)] p-[clamp(16px,5vw,48px)] pointer-events-none"
          aria-hidden
        >
          {imageList.map((item, i) => (
            <div
              key={`${item.src}-${i}`}
              className="shrink-0 rounded-lg overflow-hidden border border-white/10 bg-white/5"
              style={{
                width: getImageSize(item.size ?? embeddedImageDefaultSize),
                height: getImageSize(item.size ?? embeddedImageDefaultSize),
                opacity: embeddedImageOpacity,
              }}
            >
              <img
                src={item.src}
                alt=""
                className="size-full object-cover"
              />
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
