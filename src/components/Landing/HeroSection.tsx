"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { LaunchAppButton } from "./LaunchAppButton";
import { HERO_CONFIG } from "@/config/hero";

gsap.registerPlugin(ScrollTrigger);

/** Replace with your own file in /public, e.g. /videos/hero.mp4 */
const HERO_VIDEO_SRC =
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4";

const VIDEO_SCALE_REST = 0.92;
const VIDEO_SCALE_ACTIVE = 1;
const VIDEO_OPACITY_REST = 0.8;
const VIDEO_OPACITY_ACTIVE = 1;

export interface HeroSectionProps {
  /** Override title lines (default from HERO_CONFIG). */
  titleLines?: string[];
  /** Override subtitle (default from HERO_CONFIG). Use \n for line breaks. */
  subtitle?: string;
  /** Brand name in subtitle (default from HERO_CONFIG). */
  brandName?: string;
}

export function HeroSection({
  titleLines = [...HERO_CONFIG.titleLines],
  subtitle = HERO_CONFIG.subtitle,
  brandName = HERO_CONFIG.brandName,
}: HeroSectionProps) {
  const videoWrapRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = videoWrapRef.current;
      if (!el) return;

      gsap.set(el, {
        scale: VIDEO_SCALE_REST,
        opacity: VIDEO_OPACITY_REST,
        transformOrigin: "center center",
      });

      const trigger = ScrollTrigger.create({
        trigger: el,
        start: "top bottom",
        end: "bottom top",
        scrub: 1,
        onUpdate: (self) => {
          const p = self.progress;
          const curve = Math.sin(p * Math.PI);
          const scale =
            VIDEO_SCALE_REST +
            (VIDEO_SCALE_ACTIVE - VIDEO_SCALE_REST) * curve;
          const opacity =
            VIDEO_OPACITY_REST +
            (VIDEO_OPACITY_ACTIVE - VIDEO_OPACITY_REST) * curve;
          gsap.set(el, { scale, opacity });
        },
      });

      return () => trigger.kill();
    },
    { scope: videoWrapRef, dependencies: [] }
  );

  const subtitleWithBreaks = subtitle.split("\n");
  const subtitleParts = subtitle.split(brandName);
  const hasBrand = subtitleParts.length > 1;

  return (
    <section
      className="relative flex flex-col items-center pt-[var(--g8)] pb-[var(--g10)] md:pt-[var(--g10)] md:pb-[var(--g12)]"
      aria-labelledby="hero-heading"
    >
      <div className="h-[var(--g12)] shrink-0" aria-hidden />
      <div className="h-[var(--g12)] shrink-0" aria-hidden />
      <h1
        id="hero-heading"
        className="font-shinier text-center text-[48px] font-bold leading-[1.2] tracking-tight text-foreground md:text-[64px] lg:text-[72px]"
        style={{ marginBottom: "var(--g4)" }}
      >
        {titleLines.map((line, i) => (
          <span key={i}>
            {i > 0 ? <br /> : null}
            {line}
          </span>
        ))}
      </h1>
      <p
        className="max-w-2xl text-center text-xl leading-[1.6] text-foreground md:text-2xl"
        style={{ marginBottom: "var(--g6)" }}
      >
        {hasBrand ? (
          <>
            {subtitleParts[0]}
            <span className="font-shinier">{brandName}</span>
            {subtitleParts.slice(1).join(brandName)}
          </>
        ) : (
          <>
            {subtitleWithBreaks.map((line, i) => (
              <span key={i}>
                {i > 0 ? <br /> : null}
                {line}
              </span>
            ))}
          </>
        )}
      </p>
      <div style={{ marginBottom: "var(--g8)" }}>
        <LaunchAppButton>Launch App</LaunchAppButton>
      </div>
      <div className="h-[var(--g12)] shrink-0" aria-hidden />
      <div
        ref={videoWrapRef}
        className="relative w-full max-w-7xl z-[1] will-change-transform"
      >
        <figure className="overflow-hidden rounded-xl border border-border bg-muted shadow-2xl ring-1 ring-black/5">
          <div className="relative aspect-video w-full">
            <video
              src={HERO_VIDEO_SRC}
              autoPlay
              muted
              loop
              playsInline
              className="h-full w-full object-cover"
              aria-label="Product demo video"
            />
          </div>
        </figure>
      </div>
        <div
          className="pointer-events-none absolute left-0 right-0 top-1/2 z-0 min-h-[100vh] w-full"
          style={{
            background:
              "linear-gradient(to bottom, transparent 0%, #023436 70%, #023436 100%)",
          }}
          aria-hidden
        />
    </section>
  );
}
