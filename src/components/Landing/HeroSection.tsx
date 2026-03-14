"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { LaunchAppButton } from "./LaunchAppButton";

gsap.registerPlugin(ScrollTrigger);

/** Replace with your own file in /public, e.g. /videos/hero.mp4 */
const HERO_VIDEO_SRC =
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4";

const VIDEO_SCALE_REST = 0.92;
const VIDEO_SCALE_ACTIVE = 1;
const VIDEO_OPACITY_REST = 0.8;
const VIDEO_OPACITY_ACTIVE = 1;

export function HeroSection() {
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

  return (
    <section
      className="relative flex flex-col items-center pt-[var(--g8)] pb-[var(--g10)] md:pt-[var(--g10)] md:pb-[var(--g12) bg-red-500]"
      aria-labelledby="hero-heading"
    >
    
      <div className="h-[var(--g12)] bg-red-500"/>
      <div className="h-[var(--g12)] bg-red-500"/>
      <h1
        id="hero-heading"
        className="text-center text-[48px] font-bold leading-[1.2] tracking-tight text-foreground md:text-[64px] lg:text-[72px]"
        style={{ marginBottom: "var(--g4)" }}
      >
        The Future of Payments is <br/>
        Multi-Rail.
      </h1>
      <p
        className="max-w-2xl text-center text-xl leading-[1.6] text-foreground md:text-2xl"
        style={{ marginBottom: "var(--g6)" }}
      >
        Accept fiat, stablecoins, and crypto with Klyra
        The seamless payment gateway for the next generation of commerce.
      </p>
      <div style={{ marginBottom: "var(--g8)" }}>
        <LaunchAppButton>Launch App</LaunchAppButton>
      </div>
      <div className="h-[var(--g12)] bg-red-500"/>
      <div className="h-[var(--g12)] bg-red-500"/>
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
              "linear-gradient(to bottom, transparent 0%, #000000 70%, #000000 100%)",
          }}
          aria-hidden
        />
    </section>
  );
}
