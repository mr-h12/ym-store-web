"use client";

import { useEffect, useRef, type RefObject } from "react";
import * as THREE from "three";
import type { SceneState } from "@/lib/scroll-state";

/** Damping lambda used to smooth scroll-driven scene values (higher = snappier). */
export const SCENE_DAMPING = 5;

/** Breakpoint below which the scene switches to its compact (mobile) layout. */
export const NARROW_BREAKPOINT = 768;

/** Numeric SceneState fields that are damped every frame (focusLayer is an index, handled separately). */
const DAMPED_KEYS = [
  "camX",
  "camY",
  "camZ",
  "targetX",
  "targetY",
  "targetZ",
  "rotX",
  "rotY",
  "offsetX",
  "explode",
  "fold",
  "fan",
  "focus",
  "light",
  "sweep",
  "wind",
] as const satisfies readonly (keyof SceneState)[];

/**
 * Frame delta guard. The first frame after mount (or after a stalled tab)
 * can report a very large delta; clamp so damping never overshoots.
 */
export function clampDelta(delta: number): number {
  if (!Number.isFinite(delta) || delta < 0) return 0;
  return Math.min(delta, 1 / 15);
}

/** Damp every numeric field of `current` toward `target` in place (no allocation). */
export function dampSceneState(
  current: SceneState,
  target: SceneState,
  lambda: number,
  dt: number,
): void {
  for (let i = 0; i < DAMPED_KEYS.length; i++) {
    const key = DAMPED_KEYS[i];
    current[key] = THREE.MathUtils.damp(current[key], target[key], lambda, dt);
  }
  current.focusLayer = target.focusLayer;
}

/** Normalised absolute scroll velocity (0 – 1) used by the cloth ripple and dust. */
export function velocityAmount(velocity: number): number {
  return THREE.MathUtils.clamp(Math.abs(velocity) / 40, 0, 1);
}

/**
 * Tracks `prefers-reduced-motion` in a ref so frame callbacks can read it
 * without causing React re-renders.
 */
export function useReducedMotionRef(): RefObject<boolean> {
  const ref = useRef(false);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    ref.current = query.matches;
    const onChange = (event: MediaQueryListEvent) => {
      ref.current = event.matches;
    };
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);
  return ref;
}
