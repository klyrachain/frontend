"use client";

import { useRef, useEffect, useCallback } from "react";

const DENSITY = 0.1;
const GLOW_INTENSITY = 0.2;
const STAR_COLOR = "rgba(191, 210, 255, 0.9)";
const GLOW_COLOR = "rgba(147, 197, 253, 0.15)";

interface Star {
  x: number;
  y: number;
  radius: number;
  glowRadius: number;
  twinklePhase: number;
  speed: number;
}

function useHeroGalaxyCanvas(
  density: number,
  glowIntensity: number
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<Star[]>([]);
  const frameRef = useRef<number>(0);
  const timeRef = useRef(0);

  const initStars = useCallback(
    (width: number, height: number) => {
      const area = width * height;
      const count = Math.min(120, Math.max(35, Math.floor(area * (density / 80000))));
      const stars: Star[] = [];
      for (let i = 0; i < count; i++) {
        stars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          radius: 0.5 + Math.random() * 1.2,
          glowRadius: 8 + Math.random() * 16 * glowIntensity,
          twinklePhase: Math.random() * Math.PI * 2,
          speed: 0.2 + Math.random() * 0.4,
        });
      }
      starsRef.current = stars;
    },
    [density, glowIntensity]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const setSize = () => {
      const dpr = Math.min(window.devicePixelRatio ?? 1, 2);
      const width = canvas.offsetWidth;
      const height = canvas.offsetHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      initStars(width, height);
    };

    setSize();
    const ro = new ResizeObserver(setSize);
    ro.observe(canvas);

    const animate = () => {
      const width = canvas.offsetWidth;
      const height = canvas.offsetHeight;
      timeRef.current += 0.016;

      ctx.clearRect(0, 0, width, height);

      for (const star of starsRef.current) {
        const twinkle = 0.7 + 0.3 * Math.sin(timeRef.current * star.speed + star.twinklePhase);
        const glowR = star.glowRadius * twinkle;

        const gradient = ctx.createRadialGradient(
          star.x, star.y, 0,
          star.x, star.y, glowR
        );
        gradient.addColorStop(0, STAR_COLOR);
        gradient.addColorStop(0.2, GLOW_COLOR);
        gradient.addColorStop(1, "rgba(147, 197, 253, 0)");

        ctx.beginPath();
        ctx.arc(star.x, star.y, glowR, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius * twinkle, 0, Math.PI * 2);
        ctx.fillStyle = STAR_COLOR;
        ctx.fill();
      }

      frameRef.current = requestAnimationFrame(animate);
    };

    frameRef.current = requestAnimationFrame(animate);
    return () => {
      ro.disconnect();
      cancelAnimationFrame(frameRef.current);
    };
  }, [initStars]);

  return canvasRef;
}

/**
 * Minimal starfield galaxy layer that blends with HeroShaderBackground.
 * Inspired by [React Bits Galaxy](https://www.reactbits.dev/backgrounds/galaxy) with
 * density=0.1 and glowIntensity=0.2; colors match hero shader (#150578, #0e0e52, #3f8efc).
 */
export function HeroGalaxy() {
  const canvasRef = useHeroGalaxyCanvas(DENSITY, GLOW_INTENSITY);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 size-full pointer-events-none"
      aria-hidden
    />
  );
}
