"use client";

import dynamic from "next/dynamic";
import { ThemeSelector } from "@/components/Theme/ThemeSelector";
import { FontSelector } from "@/components/Theme/FontSelector";

const ShaderGradientBackground = dynamic(
  () =>
    import("@/components/Background/ShaderGradientBackground").then((mod) => ({
      default: mod.ShaderGradientBackground,
    })),
  { ssr: false }
);

export default function Home() {
  return (
    <>
      <ShaderGradientBackground />
      <main className="relative z-0 min-h-screen p-4 flex flex-col gap-6">
        <ThemeSelector />
        <FontSelector />
      </main>
    </>
  );
}
