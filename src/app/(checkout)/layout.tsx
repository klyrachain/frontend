"use client";
import dynamic from "next/dynamic";
import { HERO_CONFIG } from "@/config/hero";
import { DynamicRootProvider } from "@/components/DynamicWallet/DynamicRootProvider";
import { PaintedBackground } from "@/components/Landing/Paintedbackground";

/** WebGL / R3F stack in HeroShaderBackground is not safe to run during SSR (window / canvas). */
const HeroShaderBackground = dynamic(
  () =>
    import("@/components/Landing/HeroShaderBackground").then(
      (m) => m.HeroShaderBackground
    ),
  {
    ssr: false,
    loading: () => (
      <div
        className="fixed inset-0 z-0 bg-gradient-to-b from-[#023436] via-[#034d4f] to-[#037971]"
        aria-hidden
      />
    ),
  }
);

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DynamicRootProvider>
    <div className="landing-page relative min-h-screen bg-transparent text-foreground">
      {/* <HeroShaderBackground
        embeddedText={HERO_CONFIG.embeddedText}
        embeddedTextAnimation="pop"
        embeddedTextPosition="bottom"
        embeddedTextOpacity={0.12}
        embeddedImages={[...HERO_CONFIG.embeddedImages]}
        embeddedImageDefaultSize={HERO_CONFIG.embeddedImageDefaultSize}
      /> */}
      <PaintedBackground />
      <div className="relative z-20">
        <a
          href="#checkout-main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-[var(--g2)] focus:top-[var(--g2)] focus:z-[100] focus:rounded focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:outline-none"
        >
          Skip to checkout
        </a>
        <main
          id="checkout-main"
          role="main"
          tabIndex={-1}
          className="flex min-h-screen flex-col items-center justify-center px-1 py-12"
        >
          {children}
        </main>
      </div>
    </div>
    </DynamicRootProvider>
  );
}
