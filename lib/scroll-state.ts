/**
 * Shared, mutable scroll/scene state.
 *
 * Written and read every frame by GSAP / Lenis / R3F without React re-renders.
 * Ownership (who WRITES each field):
 *  - SmoothScroll provider: progress, velocity, pointer
 *  - StoryTrack (master scrub timeline + chapter triggers): chapter, chapterProgress, scene.*
 *  - Scene (R3F frame loop): camera, sceneReady
 *  - Preloader: ready (via markReady())
 * Everyone else only READS.
 */

export interface SceneState {
  /** Camera position (world units). */
  camX: number;
  camY: number;
  camZ: number;
  /** Camera look-at target. */
  targetX: number;
  targetY: number;
  targetZ: number;
  /** Rotation of the whole fabric group (radians). */
  rotX: number;
  rotY: number;
  /** Horizontal offset of the fabric group, used to make room for DOM copy. */
  offsetX: number;
  /** 0 = layers stacked tight, 1 = fully exploded apart along Z. */
  explode: number;
  /** 0 = flat panels, 1 = draped / folded into a garment-like form. */
  fold: number;
  /** 0 = layers in a stack, 1 = layers fanned into an arc. */
  fan: number;
  /** 0 = all layers equal, 1 = `focusLayer` isolated (others dim + recede). */
  focus: number;
  /** Index into SCENE_LAYERS of the layer to isolate when focus > 0. */
  focusLayer: number;
  /** Key light intensity multiplier (~0.6 – 1.6). */
  light: number;
  /** Light sweep position across the cloth, -1 (left) … 1 (right). */
  sweep: number;
  /** Wind amplitude for the cloth shader (0 – 1). */
  wind: number;
}

export interface ScrollState {
  /** Overall page scroll progress 0 – 1. */
  progress: number;
  /** Lenis scroll velocity (px / frame, signed). */
  velocity: number;
  /** Active chapter index 0 – 4. */
  chapter: number;
  /** Progress through the active chapter 0 – 1. */
  chapterProgress: number;
  /** Pointer position in normalised device coords (-1 … 1). */
  pointer: { x: number; y: number };
  /** Actual camera position each frame (for HUD telemetry). */
  camera: { x: number; y: number; z: number };
  /** True once the WebGL scene has compiled its shaders and rendered a frame. */
  sceneReady: boolean;
  /** True once the preloader has finished and the experience is unlocked. */
  ready: boolean;
  /** Tweened by the master scroll timeline; read by the 3D scene. */
  scene: SceneState;
}

import { CHAPTERS } from "./chapters";

export const scrollState: ScrollState = {
  progress: 0,
  velocity: 0,
  chapter: 0,
  chapterProgress: 0,
  pointer: { x: 0, y: 0 },
  camera: { x: 0, y: 0, z: 0 },
  sceneReady: false,
  ready: false,
  scene: { ...CHAPTERS[0].scene },
};

type Listener = () => void;
const readyListeners = new Set<Listener>();
const sceneReadyListeners = new Set<Listener>();

/** Called by the Preloader once the intro is done. */
export function markReady(): void {
  if (scrollState.ready) return;
  scrollState.ready = true;
  readyListeners.forEach((fn) => fn());
  readyListeners.clear();
}

/** Run `fn` once the experience is unlocked (immediately if already). Returns an unsubscribe. */
export function onReady(fn: Listener): () => void {
  if (scrollState.ready) {
    fn();
    return () => {};
  }
  readyListeners.add(fn);
  return () => readyListeners.delete(fn);
}

/** Called by the Scene once shaders are compiled and the first frame is drawn. */
export function markSceneReady(): void {
  if (scrollState.sceneReady) return;
  scrollState.sceneReady = true;
  sceneReadyListeners.forEach((fn) => fn());
  sceneReadyListeners.clear();
}

/** Run `fn` once the WebGL scene is ready (immediately if already). Returns an unsubscribe. */
export function onSceneReady(fn: Listener): () => void {
  if (scrollState.sceneReady) {
    fn();
    return () => {};
  }
  sceneReadyListeners.add(fn);
  return () => sceneReadyListeners.delete(fn);
}
