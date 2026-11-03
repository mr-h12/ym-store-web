"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { INTRO_SCENE } from "@/lib/chapters";
import { scrollState } from "@/lib/scroll-state";
import { NARROW_BREAKPOINT, clampDelta } from "./sceneUtils";

/** Camera damping is a touch softer than the cloth for a heavier, filmic feel. */
const CAMERA_DAMPING = 3.6;
const POINTER_PARALLAX = 0.3;
/** Narrow / portrait viewports pull the camera back so the cloth fits. */
const PORTRAIT_ASPECT = 0.8;
const PORTRAIT_PUSH = 1.35;
/** Matches FabricLayers' compact horizontal offset (offsetX * 0.25). */
const NARROW_X_SCALE = 0.25;

/**
 * Damps the camera toward the scroll-driven keyframe (position + look-at),
 * adds pointer parallax and publishes the real camera position for the HUD.
 */
export function CameraRig() {
  const pos = useRef(new THREE.Vector3(INTRO_SCENE.camX, INTRO_SCENE.camY, INTRO_SCENE.camZ));
  const look = useRef(new THREE.Vector3(INTRO_SCENE.targetX, INTRO_SCENE.targetY, INTRO_SCENE.targetZ));
  const pointer = useRef({ x: 0, y: 0 });

  useFrame((state, delta) => {
    const dt = clampDelta(delta);
    const s = scrollState.scene;
    const { width, height } = state.size;
    const aspect = width / Math.max(height, 1);
    const narrow = width < NARROW_BREAKPOINT;

    // Desired camera and target. On narrow screens the cloth sits closer to
    // centre, so shift camera + target together to keep the same framing.
    const shiftX = narrow ? s.targetX * (NARROW_X_SCALE - 1) : 0;
    const zPush = aspect < PORTRAIT_ASPECT ? PORTRAIT_PUSH : 1;
    const camX = s.camX + shiftX;
    const camY = s.camY;
    const camZ = s.targetZ + (s.camZ - s.targetZ) * zPush;
    const tX = s.targetX + shiftX;

    const p = pos.current;
    const t = look.current;
    p.x = THREE.MathUtils.damp(p.x, camX, CAMERA_DAMPING, dt);
    p.y = THREE.MathUtils.damp(p.y, camY, CAMERA_DAMPING, dt);
    p.z = THREE.MathUtils.damp(p.z, camZ, CAMERA_DAMPING, dt);
    t.x = THREE.MathUtils.damp(t.x, tX, CAMERA_DAMPING, dt);
    t.y = THREE.MathUtils.damp(t.y, s.targetY, CAMERA_DAMPING, dt);
    t.z = THREE.MathUtils.damp(t.z, s.targetZ, CAMERA_DAMPING, dt);

    const ptr = pointer.current;
    ptr.x = THREE.MathUtils.damp(ptr.x, scrollState.pointer.x, 2.5, dt);
    ptr.y = THREE.MathUtils.damp(ptr.y, scrollState.pointer.y, 2.5, dt);

    const camera = state.camera;
    camera.position.set(
      p.x + ptr.x * POINTER_PARALLAX,
      p.y + ptr.y * POINTER_PARALLAX,
      p.z,
    );
    camera.lookAt(t);

    scrollState.camera.x = camera.position.x;
    scrollState.camera.y = camera.position.y;
    scrollState.camera.z = camera.position.z;
  });

  return null;
}
