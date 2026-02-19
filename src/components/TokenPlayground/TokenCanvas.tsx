"use client";

import { useRef, memo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Physics, RigidBody, CuboidCollider } from "@react-three/rapier";
import { Environment, Sparkles } from "@react-three/drei";
import * as THREE from "three";
import { Token } from "./Token";
import { getTokenConfigById } from "@/config/tokenPlayground";
import type { PlaygroundTokenInstance } from "@/types/tokenPlayground";
import type { RapierRigidBody } from "@react-three/rapier";
const POOL_WIDTH = 24;
const POOL_DEPTH = 2;
const POOL_HEIGHT = 10;

const noRaycast = () => null;

/**
 * No-op event manager for background layer: no pointer listeners, no raycasting.
 * Prevents main-thread blocking and event-source conflicts when canvas is non-interactive.
 */
function createNoOpEvents() {
  return {
    enabled: false,
    priority: 0,
    connect: () => {},
    disconnect: () => {},
  };
}

function CursorLight({ staticPosition }: { staticPosition?: boolean }) {
  const lightRef = useRef<THREE.PointLight>(null);
  const posRef = useRef(new THREE.Vector3(0, 2, 5));
  useFrame((state) => {
    const light = lightRef.current;
    if (light == null) return;
    if (staticPosition) {
      light.position.set(2, 3, 5);
    } else {
      const { pointer, camera } = state;
      if (
        Number.isFinite(pointer.x) &&
        Number.isFinite(pointer.y)
      ) {
        posRef.current.set(pointer.x, pointer.y, 2).unproject(camera);
        light.position.copy(posRef.current);
      }
    }
  });
  return (
    <pointLight
      ref={lightRef}
      intensity={80}
      distance={12}
      decay={2}
      color="#ffffff"
    />
  );
}

function GlassBoundary() {
  const halfW = POOL_WIDTH / 6 + 0.05;
  const halfD = POOL_DEPTH / 6 + 0.05;
  const halfH = POOL_HEIGHT / 6;
  return (
    <RigidBody type="fixed" friction={0.4} restitution={0.2}>
      <CuboidCollider
        args={[halfW, 0.05, halfD]}
        position={[0, -0.05, 0]}
      />
      <CuboidCollider
        args={[0.05, halfH, halfD]}
        position={[-halfW, halfH, 0]}
      />
      <CuboidCollider
        args={[0.05, halfH, halfD]}
        position={[halfW, halfH, 0]}
      />
      <CuboidCollider
        args={[halfW, halfH, 0.05]}
        position={[0, halfH, -halfD]}
      />
      <CuboidCollider
        args={[halfW, halfH, 0.05]}
        position={[0, halfH, halfD]}
      />
    </RigidBody>
  );
}

function Floor() {
  return (
    <mesh position={[0, -0.05, 0]} receiveShadow raycast={noRaycast}>
      <planeGeometry args={[POOL_WIDTH * 2, POOL_DEPTH * 2]} />
      <meshStandardMaterial
        color="#1a1a2e"
        roughness={0.8}
        metalness={0.2}
        transparent
        opacity={0.6}
      />
    </mesh>
  );
}

interface SceneContentProps {
  tokens: PlaygroundTokenInstance[];
  onFxSwap: (
    tokenId: string,
    otherTokenId: string,
    position: [number, number, number]
  ) => void;
  fxSwapPosition: THREE.Vector3 | null;
  background?: boolean;
}

function SceneContent({
  tokens,
  onFxSwap,
  fxSwapPosition,
  background = false,
}: SceneContentProps) {
  const handleCoinToss = (rb: RapierRigidBody) => {
    void rb;
    // Reserved for future coin-toss interaction
  };

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[5, 10, 5]}
        intensity={1}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-far={50}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />
      <CursorLight staticPosition={background} />
      <Environment preset="studio" />
      {!background && <Floor />}
      <Physics gravity={[0, -9.81, 0]}>
        <GlassBoundary />
        {tokens.map((t) => {
          const config = getTokenConfigById(t.configId);
          if (config == null) return null;
          return (
            <Token
              key={t.id}
              instanceId={t.id}
              config={config}
              position={t.position}
              role="background"
              onDoubleClick={handleCoinToss}
              onFxSwap={onFxSwap}
            />
          );
        })}
      </Physics>
      {fxSwapPosition != null && (
        <group raycast={noRaycast}>
          <Sparkles
            position={[fxSwapPosition.x, fxSwapPosition.y, fxSwapPosition.z]}
            count={40}
            scale={2}
            size={2}
            speed={0.3}
            color="#00ffa3"
          />
        </group>
      )}
    </>
  );
}

interface TokenCanvasProps {
  tokens: PlaygroundTokenInstance[];
  onFxSwap: (
    tokenId: string,
    otherTokenId: string,
    position: [number, number, number]
  ) => void;
  fxSwapPosition: THREE.Vector3 | null;
  background?: boolean;
  overlay?: boolean;
  backgroundLayer?: boolean;
  eventSource?: React.RefObject<HTMLElement | null>;
}

function getWrapperClassName(
  overlay: boolean,
  backgroundLayer: boolean
): string {
  if (overlay) {
    return "fixed inset-0 z-[5] w-full h-screen pointer-events-none [&_canvas]:pointer-events-none";
  }
  if (backgroundLayer) {
    return "fixed inset-0 z-[-1] w-full h-screen pointer-events-none [&_canvas]:pointer-events-none";
  }
  return "absolute inset-0 w-full h-full";
}

function TokenCanvasInner({
  tokens,
  onFxSwap,
  fxSwapPosition,
  background = false,
  overlay = false,
  backgroundLayer = false,
  eventSource,
}: TokenCanvasProps) {
  if (typeof window !== "undefined") {
    console.log("Canvas re-rendered");
  }

  const canvasEvents = backgroundLayer ? createNoOpEvents : undefined;
  const canvasEventSource =
    !backgroundLayer && eventSource != null
      ? (eventSource as React.RefObject<HTMLElement>)
      : undefined;

  const canvas = (
    <Canvas
      shadows
      frameloop="always"
      events={canvasEvents}
      eventSource={canvasEventSource}
      camera={{ position: [0, 5, 10], fov: 55 }}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      }}
      dpr={[1, 2]}
      onCreated={({ scene }) => {
        if (background) scene.background = null;
      }}
    >
      <SceneContent
        tokens={tokens}
        onFxSwap={onFxSwap}
        fxSwapPosition={fxSwapPosition}
        background={background}
      />
    </Canvas>
  );

  if (eventSource != null) {
    return canvas;
  }

  return (
    <div
      className={getWrapperClassName(overlay, backgroundLayer)}
    >
      {canvas}
    </div>
  );
}

export const TokenCanvas = memo(TokenCanvasInner);
TokenCanvas.displayName = "TokenCanvas";
