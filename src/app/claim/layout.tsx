"use client";

import { DynamicRootProvider } from "@/components/DynamicWallet/DynamicRootProvider";
import { PaintedBackground } from "@/components/Landing/Paintedbackground";

export default function ClaimLayout({ children }: { children: React.ReactNode }) {
  return (
    <DynamicRootProvider>
      <div className="app-premium-ui landing-page relative min-h-screen bg-transparent text-foreground">
        <PaintedBackground />
        <div className="relative z-20">
          <main
            id="claim-main"
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
