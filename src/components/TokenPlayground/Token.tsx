"use client";

import { useRef, useCallback, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { RigidBody, CylinderCollider, interactionGroups } from "@react-three/rapier";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import type { PlaygroundTokenConfig, TokenRole } from "@/types/tokenPlayground";
import type { RapierRigidBody } from "@react-three/rapier";

const COIN_RADIUS = 0.6;
const COIN_HEIGHT = 0.12;
const COIN_THICKNESS = COIN_HEIGHT;
const FACE_OFFSET = 0.02;
const LERP_FACTOR = 0.15;
const HOVER_SCALE = 1.1;
const FLOAT_STRENGTH = 0.003;

interface TokenProps {
  instanceId: string;
  config: PlaygroundTokenConfig;
  position: [number, number, number];
  role?: TokenRole;
  stackIndex?: number;
  positionRef?: React.RefObject<[number, number, number] | null>;
  swapScaleRef?: React.RefObject<number>;
  swapRotationYRef?: React.RefObject<number>;
  onDoubleClick?: (rigidBody: RapierRigidBody) => void;
  onFxSwap?: (
    tokenId: string,
    otherTokenId: string,
    position: [number, number, number]
  ) => void;
}

export function Token({
  instanceId,
  config,
  position,
  role = "background",
  stackIndex = 0,
  positionRef,
  swapScaleRef,
  swapRotationYRef,
  onDoubleClick,
  onFxSwap,
}: TokenProps) {
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const hoveredRef = useRef(false);
  const scaleRef = useRef(1);
  const tiltRef = useRef({ x: 0, z: 0 });
  const planeRef = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0));
  const intersectRef = useRef(new THREE.Vector3());
  const dragOffsetRef = useRef(new THREE.Vector3());
  const rayOriginRef = useRef(new THREE.Vector3());
  const rayDirRef = useRef(new THREE.Vector3());
  const rayRef = useRef(new THREE.Ray(new THREE.Vector3(), new THREE.Vector3()));
  const isDraggingRef = useRef(false);
  const floatPhaseRef = useRef(Math.random() * Math.PI * 2);
  const swapSpinRef = useRef(0);
  const isFiat = config.type === "fiat";
  const isSwap = role === "swap_from" || role === "swap_to";

  const handlePointerOver = useCallback(() => {
    hoveredRef.current = true;
  }, []);

  const handlePointerOut = useCallback(() => {
    hoveredRef.current = false;
  }, []);

  const handleDoubleClick = useCallback(() => {
    if (isDraggingRef.current || isSwap) return;
    const rb = rigidBodyRef.current;
    if (rb != null && onDoubleClick != null) {
      onDoubleClick(rb);
    }
  }, [onDoubleClick, isSwap]);

  const handlePointerDown = useCallback(
    (e: { stopPropagation: () => void; raycaster: { ray: THREE.Ray } }) => {
      e.stopPropagation();
      if (!isFiat || rigidBodyRef.current == null || isSwap) return;
      isDraggingRef.current = true;
      const rb = rigidBodyRef.current;
      const pos = rb.translation();
      const ray = e.raycaster.ray;
      planeRef.current.setFromNormalAndCoplanarPoint(
        new THREE.Vector3(0, 1, 0),
        new THREE.Vector3(0, pos.y, 0)
      );
      ray.intersectPlane(planeRef.current, intersectRef.current);
      dragOffsetRef.current.set(
        pos.x - intersectRef.current.x,
        0,
        pos.z - intersectRef.current.z
      );
      rb.setBodyType(2, true);
    },
    [isFiat, isSwap]
  );

  const handlePointerUp = useCallback(() => {
    if (!isDraggingRef.current || rigidBodyRef.current == null) return;
    isDraggingRef.current = false;
    rigidBodyRef.current.setBodyType(0, true);
  }, []);

  useEffect(() => {
    const onUp = () => handlePointerUp();
    window.addEventListener("pointerup", onUp);
    return () => window.removeEventListener("pointerup", onUp);
  }, [handlePointerUp]);

  const handleCollision = useCallback(
    (payload: { other: { rigidBodyObject?: THREE.Object3D | null } }) => {
      const other = payload.other.rigidBodyObject;
      const otherId = other?.userData?.tokenInstanceId as string | undefined;
      if (otherId == null || onFxSwap == null || rigidBodyRef.current == null)
        return;
      const otherType = other?.userData?.configType as string | undefined;
      const isOtherCrypto = otherType === "crypto";
      if (isFiat && isOtherCrypto) {
        const pos = rigidBodyRef.current.translation();
        onFxSwap(instanceId, otherId, [pos.x, pos.y, pos.z]);
      }
    },
    [instanceId, isFiat, onFxSwap]
  );

  useFrame((state, delta) => {
    const mesh = meshRef.current;
    const group = groupRef.current;
    const rb = rigidBodyRef.current;

    if (isSwap) {
      const pos = positionRef?.current;
      if (pos != null && group != null) {
        const stackY = stackIndex * COIN_THICKNESS;
        group.position.set(pos[0], pos[1] + stackY, pos[2]);
      }
      if (swapScaleRef != null && swapRotationYRef != null && group != null) {
        swapSpinRef.current += delta * 0.35;
        const s = swapScaleRef.current ?? 1;
        const ry = swapRotationYRef.current ?? 0;
        group.scale.setScalar(s);
        group.rotation.x = 0;
        group.rotation.z = 0;
        group.rotation.y = ry + swapSpinRef.current;
      }
      return;
    }

    if (mesh == null || rb == null) return;

    if (isDraggingRef.current) {
      const { pointer, camera } = state;
      if (
        !Number.isFinite(pointer.x) ||
        !Number.isFinite(pointer.y)
      ) {
        return;
      }
      rayOriginRef.current.set(pointer.x, pointer.y, 0.5).unproject(camera);
      rayDirRef.current
        .copy(rayOriginRef.current)
        .sub(camera.position)
        .normalize();
      rayRef.current.set(camera.position, rayDirRef.current);
      rayRef.current.intersectPlane(planeRef.current, intersectRef.current);
      if (intersectRef.current != null) {
        const tx = intersectRef.current.x + dragOffsetRef.current.x;
        const ty = rb.translation().y;
        const tz = intersectRef.current.z + dragOffsetRef.current.z;
        if (Number.isFinite(tx) && Number.isFinite(ty) && Number.isFinite(tz)) {
          rb.setNextKinematicTranslation({ x: tx, y: ty, z: tz });
        }
      }
      return;
    }

    if (role === "background") {
      floatPhaseRef.current += delta * 0.8;
      const t = floatPhaseRef.current;
      const fx = Math.sin(t) * FLOAT_STRENGTH;
      const fz = Math.cos(t * 0.7) * FLOAT_STRENGTH;
      const fy = Math.sin(t * 0.5) * FLOAT_STRENGTH * 0.5;
      if (
        Number.isFinite(fx) &&
        Number.isFinite(fy) &&
        Number.isFinite(fz)
      ) {
        rb.applyImpulse({ x: fx, y: fy, z: fz }, true);
      }
    }

    const targetScale = hoveredRef.current ? HOVER_SCALE : 1;
    scaleRef.current += (targetScale - scaleRef.current) * LERP_FACTOR;
    const safeScale = Number.isFinite(scaleRef.current)
      ? scaleRef.current
      : 1;
    mesh.scale.setScalar(safeScale);

    if (hoveredRef.current) {
      const { x, y } = state.pointer;
      if (Number.isFinite(x) && Number.isFinite(y)) {
        const tiltX = -y * 0.15;
        const tiltZ = x * 0.15;
        tiltRef.current.x += (tiltX - tiltRef.current.x) * LERP_FACTOR;
        tiltRef.current.z += (tiltZ - tiltRef.current.z) * LERP_FACTOR;
      }
      mesh.rotation.x = tiltRef.current.x;
      mesh.rotation.z = tiltRef.current.z;
    } else {
      tiltRef.current.x *= 0.9;
      tiltRef.current.z *= 0.9;
      mesh.rotation.x = tiltRef.current.x;
      mesh.rotation.z = tiltRef.current.z;
    }
  });

  if (isSwap) {
    return (
      <group ref={groupRef} position={position}>
        <group rotation={[-Math.PI / 2, 0, 0]}>
          <mesh>
            <cylinderGeometry args={[COIN_RADIUS, COIN_RADIUS, COIN_HEIGHT, 32]} />
            <meshStandardMaterial
              color={config.color}
              metalness={config.metalness}
              roughness={config.roughness}
              envMapIntensity={1.2}
            />
            <Text
              position={[0, 0, COIN_THICKNESS / 2 + FACE_OFFSET]}
              rotation={[Math.PI / 2, 0, 0]}
              fontSize={0.4}
              fontWeight="bold"
              color="#ffffff"
              anchorX="center"
              anchorY="middle"
              outlineWidth={0.02}
              outlineColor="#000000"
              depthOffset={1}
            >
              {config.symbol}
            </Text>
            <Text
              position={[0, 0, -COIN_THICKNESS / 2 - FACE_OFFSET]}
              rotation={[-Math.PI / 2, Math.PI, 0]}
              fontSize={0.4}
              fontWeight="bold"
              color="#ffffff"
              anchorX="center"
              anchorY="middle"
              outlineWidth={0.02}
              outlineColor="#000000"
              depthOffset={1}
            >
              {config.symbol}
            </Text>
          </mesh>
        </group>
      </group>
    );
  }

  return (
    <RigidBody
      ref={rigidBodyRef}
      position={position}
      rotation={[-Math.PI / 2, 0, 0]}
      type="dynamic"
      colliders={false}
      gravityScale={role === "background" ? 0 : 1}
      linearDamping={role === "background" ? 0.85 : 0.3}
      angularDamping={role === "background" ? 0.85 : 0.3}
      restitution={0.4}
      friction={0.6}
      collisionGroups={interactionGroups(1, [0, 1])}
      userData={{
        tokenInstanceId: instanceId,
        configType: config.type,
      }}
    >
      <CylinderCollider
        args={[COIN_HEIGHT / 2, COIN_RADIUS]}
        onCollisionEnter={handleCollision}
      />
      <group ref={groupRef}>
        <mesh
          ref={meshRef}
          raycast={role === "background" ? () => null : undefined}
          userData={{
            tokenInstanceId: instanceId,
            configType: config.type,
          }}
          onPointerOver={handlePointerOver}
          onPointerOut={handlePointerOut}
          onDoubleClick={handleDoubleClick}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          <cylinderGeometry args={[COIN_RADIUS, COIN_RADIUS, COIN_HEIGHT, 32]} />
          <meshStandardMaterial
            color={config.color}
            metalness={config.metalness}
            roughness={config.roughness}
            envMapIntensity={1.2}
          />
          <Text
            position={[0, COIN_THICKNESS / 2 + FACE_OFFSET, 0]}
            rotation={[Math.PI / 2, 0, 0]}
            fontSize={0.4}
            fontWeight="bold"
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.02}
            outlineColor="#000000"
            depthOffset={1}
          >
            {config.symbol}
          </Text>
          <Text
            position={[0, -COIN_THICKNESS / 2 - FACE_OFFSET, 0]}
            rotation={[-Math.PI / 2, Math.PI, 0]}
            fontSize={0.4}
            fontWeight="bold"
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.02}
            outlineColor="#000000"
            depthOffset={1}
          >
            {config.symbol}
          </Text>
        </mesh>
      </group>
    </RigidBody>
  );
}
