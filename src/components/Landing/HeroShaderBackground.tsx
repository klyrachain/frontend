"use client";

import { ShaderGradient, ShaderGradientCanvas } from "@shadergradient/react";
import { GRADIENT_THEME_PRESETS } from "@/config/themePresets";
import Galaxy from "./Galaxy";

const LANDING_PRESET = GRADIENT_THEME_PRESETS.landing ?? GRADIENT_THEME_PRESETS.minimal;

/**
 * Hero-only shader background with grain. Distinct from app ShaderGradientBackground:
 * softer palette, subtler motion, grain on — for a calm, marketing feel.
 */
export function HeroShaderBackground() {
  return (
    <div
      className="fixed inset-0 z-0 size-full overflow-hidden pointer-events-none"
      aria-hidden
    >
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
      <ShaderGradientCanvas className="!absolute !inset-0 !size-full">
      <ShaderGradient
  animate="on"
  axesHelper="off"
  brightness={1}
  cAzimuthAngle={0}
  cDistance={3.6}
  cPolarAngle={90}
  cameraZoom={1}
  // color1="#3b28cc"
  // color1="#1414e3"
  color1="#150578"
  color2="#0e0e52"
  color3="#3f8efc"
  destination="onCanvas"
  embedMode="off"
  envPreset="dawn"
  // format="gif"
  fov={45}
  frameRate={10}
  gizmoHelper="hide"
  grain="on"
  lightType="env"
  pixelDensity={3}
  positionX={-1.4}
  positionY={0}
  positionZ={0}
  range="disabled"
  rangeEnd={40}
  rangeStart={0}
  reflection={0}
  rotationX={0}
  rotationY={10}
  rotationZ={50}
  shader="defaults"
  type="plane"
  uAmplitude={1}
  uDensity={1.8}
  uFrequency={5.5}
  uSpeed={0.1}
  uStrength={0.2}
  uTime={0}
  wireframe={false}
/>
      </ShaderGradientCanvas>
      <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none blur-lg" aria-hidden>
        <Galaxy
          mouseRepulsion={true}
          mouseInteraction={true}
          density={0.05}
          glowIntensity={0.1}
          saturation={0}
          hueShift={230}
          twinkleIntensity={0.3}
          rotationSpeed={0.1}
          repulsionStrength={2}
          autoCenterRepulsion={0}
          starSpeed={0.0001}
          speed={0.2}
          transparent
          starTint={[1, 1, 1]}
        />
      </div>
    </div>
  );
}

