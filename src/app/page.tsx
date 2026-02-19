"use client";

import { useRef, useCallback, useState } from "react";
import dynamic from "next/dynamic";
import * as THREE from "three";
import { Sidebar } from "@/components/Layout/Sidebar";
import { BentoContent } from "@/components/Home/BentoContent";
import { Button } from "@/components/ui/button";
import { ThemeSelector } from "@/components/Theme/ThemeSelector";
import { RightSidebar } from "@/components/Layout/RightSidebar";
import { getInitialTokens } from "@/config/tokenPlayground";
import type { PlaygroundTokenInstance } from "@/types/tokenPlayground";

const ShaderGradientBackground = dynamic(
  () =>
    import("@/components/Background/ShaderGradientBackground").then((mod) => ({
      default: mod.ShaderGradientBackground,
    })),
  { ssr: false }
);

const TokenCanvas = dynamic(
  () =>
    import("@/components/TokenPlayground/TokenCanvas").then((mod) => ({
      default: mod.TokenCanvas,
    })),
  { ssr: false }
);

export default function Home() {
  const tokenCanvasContainerRef = useRef<HTMLDivElement>(null);
  const [tokens] = useState<PlaygroundTokenInstance[]>(() =>
    getInitialTokens()
  );
  const [fxSwapPosition, setFxSwapPosition] = useState<THREE.Vector3 | null>(
    null
  );

  const handleFxSwap = useCallback(
    (
      _tokenId: string,
      _otherTokenId: string,
      position: [number, number, number]
    ) => {
      setFxSwapPosition(new THREE.Vector3(...position));
      setTimeout(() => setFxSwapPosition(null), 1500);
    },
    []
  );

  return (
    <>
      <ShaderGradientBackground />
      <div
        ref={tokenCanvasContainerRef}
        className="fixed inset-0 z-[-1] h-full w-full pointer-events-none [&_canvas]:pointer-events-none"
        aria-hidden
      >
        {/* <TokenCanvas
          key="home-token-canvas"
          eventSource={tokenCanvasContainerRef}
          tokens={tokens}
          onFxSwap={handleFxSwap}
          fxSwapPosition={fxSwapPosition}
          background
          backgroundLayer
        /> */}
      </div>
      <main className="relative z-0 min-h-screen flex ">
        <div className="glass-panel px-2 py-20 w-64">
          <Sidebar />
        </div>
        <div className="flex flex-col flex-1 gap-5">
          <header className="sticky top-0 z-10 flex items-center justify-between bg-transparent px-6 py-4">
            <h1 className="text-xl font-semibold">Klyra</h1>
            <Button size="sm" className="rounded-xl">
              Connect wallet
            </Button>
          </header>
          <div className="bg-green-00 flex flex-1">
            <BentoContent />
            <RightSidebar />
          </div>
        </div>
      </main>
      <ThemeSelector />
    </>
  );
}
