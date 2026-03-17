import {
  Header,
  HeroSection,
  BuiltForBuildersSection,
  TailoredBusinessSection,
  PaymentEngineFeatures,
  CommerceStandardSection,
  PricingSection,
  InsightsSection,
  Footer,
} from "@/components/Landing";
import { HeroShaderBackground } from "@/components/Landing/HeroShaderBackground";
import { HERO_CONFIG } from "@/config/hero";

export default function LandingPage() {
  return (
    <>
    <div className="landing-page relative min-h-screen bg-transparent text-foreground">
      <HeroShaderBackground
        backgroundImage={HERO_CONFIG.backgroundImage}
        backgroundImageOpacity={HERO_CONFIG.backgroundImageOpacity}
        // embeddedText={HERO_CONFIG.embeddedText}
        embeddedTextAnimation={HERO_CONFIG.embeddedTextAnimation}
        // embeddedImages={[...HERO_CONFIG.embeddedImages]}
        embeddedImageDefaultSize={HERO_CONFIG.embeddedImageDefaultSize}
      />
      <div className="relative z-10">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-[var(--g2)] focus:top-[var(--g2)] focus:z-[100] focus:rounded focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:outline-none"
        >
          Skip to main content
        </a>
        <Header />
        <main id="main-content" role="main" tabIndex={-1}>
          <HeroSection />
          
          <div className="relative z-10 bg-[#023436] pb-2">
            <BuiltForBuildersSection />
            <TailoredBusinessSection />
            <PaymentEngineFeatures />
            <CommerceStandardSection />
            {/* <PricingSection /> */}
            <InsightsSection />
            <Footer />
          </div>
        </main>
        <div className="bg-white/10 h-[var(--g4)] fixed bottom-0 left-0 right-0 blur-lg" aria-hidden />
      </div>
    </div>
        {/* </HeroShaderBackground> */}
    </>
  );
}
