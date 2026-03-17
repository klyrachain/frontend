import Link from "next/link";
import { Header } from "@/components/Landing";
import { HeroShaderBackground } from "@/components/Landing/HeroShaderBackground";
import { HERO_CONFIG } from "@/config/hero";
import { FlowsNav } from "@/app/(flows)/FlowsNav";

export default function FlowsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="landing-page relative min-h-screen bg-transparent text-foreground">
      <HeroShaderBackground
        embeddedText={HERO_CONFIG.embeddedText}
        embeddedTextAnimation="pop"
        embeddedTextPosition="bottom"
        embeddedTextOpacity={0.12}
        embeddedImages={[...HERO_CONFIG.embeddedImages]}
        embeddedImageDefaultSize={HERO_CONFIG.embeddedImageDefaultSize}
      />
      <div className="relative z-20">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-[var(--g2)] focus:top-[var(--g2)] focus:z-[100] focus:rounded focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:outline-none"
        >
          Skip to main content
        </a>
        <Header initialCompact />
        <main id="main-content" role="main" tabIndex={-1}>
          <section
            className="relative z-10 flex flex-col items-center justify-center min-h-screen pb-[var(--g10)] bg-transparent"
            aria-label="App flows"
          >
            <div className="relative z-[1] w-full max-w-6xl mx-auto px-2 sm:px-4 bg-transparent flex flex-col items-center gap-6">
              <FlowsNav />
              {children}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
