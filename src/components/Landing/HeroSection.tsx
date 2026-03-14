import { LaunchAppButton } from "./LaunchAppButton";
import Galaxy from "./Galaxy";

/** Replace with your own file in /public, e.g. /videos/hero.mp4 */
const HERO_VIDEO_SRC =
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4";

export function HeroSection() {
  return (
    <section
      className="relative mx-auto flex max-w-7xl flex-col items-center px-[var(--g2)] pt-[var(--g8)] pb-[var(--g10)] md:px-[var(--g4)] md:pt-[var(--g10)] md:pb-[var(--g12)]"
      aria-labelledby="hero-heading"
    >
      <div className="h-[var(--g12)] bg-red-500"/>
      {/* <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none" aria-hidden> */}
        {/* <Galaxy
          mouseRepulsion={false}
          mouseInteraction={false}
          density={0.1}
          glowIntensity={0.2}
          saturation={0}
          hueShift={230}
          twinkleIntensity={0.3}
          rotationSpeed={0.1}
          repulsionStrength={2}
          autoCenterRepulsion={0}
          starSpeed={0.1}
          speed={0.2}
          transparent
        /> */}
      {/* </div> */}
      <h1
        id="hero-heading"
        className="text-center text-[48px] font-bold leading-[1.2] tracking-tight text-foreground md:text-[48px] lg:text-[64px]"
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
      <figure className="w-full max-w-10xl overflow-hidden rounded-xl border border-border bg-muted shadow-2xl ring-1 ring-black/5">
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
    </section>
  );
}
