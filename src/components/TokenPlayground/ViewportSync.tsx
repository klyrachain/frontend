"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const TOKEN_DISTANCE = 5;

interface ViewportSyncProps {
  tokenFromRef: React.RefObject<HTMLElement | null>;
  tokenToRef: React.RefObject<HTMLElement | null>;
  positionFromRef: React.RefObject<[number, number, number] | null>;
  positionToRef: React.RefObject<[number, number, number] | null>;
}

export function ViewportSync({
  tokenFromRef,
  tokenToRef,
  positionFromRef,
  positionToRef,
}: ViewportSyncProps) {
  const vecRef = useRef(new THREE.Vector3());
  const dirRef = useRef(new THREE.Vector3());

  useFrame((state) => {
    const { camera, size } = state;
    const fromEl = tokenFromRef.current;
    const toEl = tokenToRef.current;

    if (fromEl != null) {
      const rect = fromEl.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      vecRef.current.set((cx / size.width) * 2 - 1, -(cy / size.height) * 2 + 1, 0.5);
      vecRef.current.unproject(camera);
      dirRef.current.copy(vecRef.current).sub(camera.position).normalize();
      vecRef.current.copy(camera.position).addScaledVector(dirRef.current, TOKEN_DISTANCE);
      positionFromRef.current = [vecRef.current.x, vecRef.current.y, vecRef.current.z];
    }

    if (toEl != null) {
      const rect = toEl.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      vecRef.current.set((cx / size.width) * 2 - 1, -(cy / size.height) * 2 + 1, 0.5);
      vecRef.current.unproject(camera);
      dirRef.current.copy(vecRef.current).sub(camera.position).normalize();
      vecRef.current.copy(camera.position).addScaledVector(dirRef.current, TOKEN_DISTANCE);
      positionToRef.current = [vecRef.current.x, vecRef.current.y, vecRef.current.z];
    }
  });

  return null;
}
