"use client";

import { Suspense, useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import { MODEL_URL, SCENE } from "@/lib/scene-config";
import { INTRO_SCENE } from "@/lib/chapters";
import { markSceneReady } from "@/lib/scroll-state";
import { Backdrop } from "./Backdrop";
import { CameraRig } from "./CameraRig";
import { FabricLayers } from "./FabricLayers";
import { GlbCenterpiece } from "./GlbCenterpiece";
import { SceneErrorBoundary } from "./SceneErrorBoundary";
import { SceneReady } from "./SceneReady";
import { TickerDriver } from "./TickerDriver";

/** Fog range: the intro camera (z = 16) sees the cloth through a light haze. */
const FOG_NEAR = 10;
const FOG_FAR = 34;

function detectWebGL(): boolean {
  if (typeof document === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("webgl2") ?? canvas.getContext("webgl");
    if (!ctx) return false;
    ctx.getExtension("WEBGL_lose_context")?.loseContext();
    return true;
  } catch {
    return false;
  }
}

/**
 * The R3F canvas. Rendering is driven by gsap.ticker (see TickerDriver), so the
 * canvas never runs its own rAF loop.
 */
export function Experience() {
  const [supported] = useState(detectWebGL);

  useEffect(() => {
    // No WebGL at all: render nothing, but never leave the preloader waiting.
    if (!supported) markSceneReady();
  }, [supported]);

  if (!supported) return null;

  return (
    <Canvas
      frameloop="never"
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
      camera={{
        fov: SCENE.fov,
        near: 0.1,
        far: 120,
        position: [INTRO_SCENE.camX, INTRO_SCENE.camY, INTRO_SCENE.camZ],
      }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.05;
        gl.outputColorSpace = THREE.SRGBColorSpace;
        gl.setClearColor(SCENE.background, 1);
      }}
      style={{ position: "absolute", inset: 0 }}
    >
      <color attach="background" args={[SCENE.background]} />
      <fog attach="fog" args={[SCENE.background, FOG_NEAR, FOG_FAR]} />
      <TickerDriver />
      <CameraRig />
      <Backdrop />
      <Suspense fallback={null}>
        {MODEL_URL ? (
          <SceneErrorBoundary fallback={<FabricLayers />}>
            <GlbCenterpiece url={MODEL_URL} />
          </SceneErrorBoundary>
        ) : (
          <FabricLayers />
        )}
        <SceneReady />
      </Suspense>
    </Canvas>
  );
}
