"use client";

import { useState, useCallback } from "react";
import * as THREE from "three";
import { TokenCanvas } from "@/components/TokenPlayground/TokenCanvas";
import { TokenPlaygroundUI } from "@/components/TokenPlayground/TokenPlaygroundUI";
import { getInitialTokens } from "@/config/tokenPlayground";
import type { PlaygroundTokenInstance } from "@/types/tokenPlayground";

const POOL_WIDTH = 24;
const POOL_DEPTH = 6;

function generateId(): string {
  return `token-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function randomDropPosition(): [number, number, number] {
  const x = (Math.random() - 0.5) * (POOL_WIDTH - 2);
  const z = (Math.random() - 0.5) * (POOL_DEPTH - 2);
  return [x, 6, z];
}

export default function TokenPlaygroundPage() {
  const [tokens, setTokens] = useState<PlaygroundTokenInstance[]>(() =>
    getInitialTokens()
  );
  const [fxSwapPosition, setFxSwapPosition] = useState<THREE.Vector3 | null>(
    null
  );

  const handleMint = useCallback((configId: string) => {
    setTokens((prev) => [
      ...prev,
      {
        id: generateId(),
        configId,
        position: randomDropPosition(),
      },
    ]);
  }, []);

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
    <main className="relative min-h-screen w-full overflow-hidden bg-background">
      <TokenCanvas
        tokens={tokens}
        onFxSwap={handleFxSwap}
        fxSwapPosition={fxSwapPosition}
      />
      <TokenPlaygroundUI onMint={handleMint} />
    </main>
  );
}
