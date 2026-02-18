"use client";

import { ShaderGradient, ShaderGradientCanvas } from "@shadergradient/react";
import { useAppSelector } from "@/store/hooks";
import { GRADIENT_THEME_PRESETS } from "@/config/themePresets";

export function ShaderGradientBackground() {
  const gradientThemeId = useAppSelector((s) => s.theme.gradientThemeId);
  const colors =
    GRADIENT_THEME_PRESETS[gradientThemeId] ??
    GRADIENT_THEME_PRESETS.default;

  return (
    <section
      aria-hidden
      className="fixed inset-0 z-[-1] h-full w-full pointer-events-none"
    >
      <ShaderGradientCanvas>
        <ShaderGradient
          animate="on"
          brightness={0}
          cAzimuthAngle={180}
          cDistance={3.6}
          cPolarAngle={90}
          cameraZoom={1}
          color1={colors.color1}
          color2={colors.color2}
          color3={colors.color3}
          envPreset="city"
          grain="on"
          lightType="3d"
          positionX={-1.4}
          positionY={0}
          positionZ={0}
          range="disabled"
          rangeEnd={40}
          rangeStart={0}
          reflection={0.1}
          rotationX={0}
          rotationY={10}
          rotationZ={50}
          shader="defaults"
          type="plane"
          uAmplitude={1}
          uDensity={1.3}
          uFrequency={5.5}
          uSpeed={0.1}
          uStrength={4}
          uTime={0}
          wireframe={false}
        />
      </ShaderGradientCanvas>
    </section>
  );
}
