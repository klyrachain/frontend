"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const SWAP_DURATION = 0.6;

interface SwapAnimationControllerProps {
  triggerRef: React.RefObject<boolean>;
  scaleFromRef: React.RefObject<number>;
  scaleToRef: React.RefObject<number>;
  rotationYRef: React.RefObject<number>;
  onComplete?: () => void;
}

export function SwapAnimationController({
  triggerRef,
  scaleFromRef,
  scaleToRef,
  rotationYRef,
  onComplete,
}: SwapAnimationControllerProps) {
  const startTimeRef = useRef(-1);

  useFrame(() => {
    if (triggerRef.current) {
      triggerRef.current = false;
      startTimeRef.current = performance.now() / 1000;
    }

    if (startTimeRef.current < 0) return;
    const now = performance.now() / 1000;
    const elapsed = now - startTimeRef.current;
    const t = Math.min(elapsed / SWAP_DURATION, 1);

    const easeT = 1 - Math.pow(1 - t, 2);
    scaleFromRef.current = 1;
    scaleToRef.current = 1;
    rotationYRef.current = easeT * Math.PI * 2;

    if (t >= 1) {
      startTimeRef.current = -1;
      scaleFromRef.current = 1;
      scaleToRef.current = 1;
      rotationYRef.current = 0;
      onComplete?.();
    }
  });

  return null;
}
