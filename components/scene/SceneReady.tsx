"use client";

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { markSceneReady, scrollState } from "@/lib/scroll-state";

/**
 * Pre-compiles every material in the scene once the centerpiece is mounted,
 * then reports `sceneReady` once a frame has actually been drawn.
 * Mount it inside the same Suspense boundary as the centerpiece.
 */
export function SceneReady() {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  const frames = useRef(0);

  useEffect(() => {
    try {
      gl.compile(scene, camera);
    } catch (error) {
      console.warn("[scene] shader pre-compile failed", error);
    }
  }, [gl, scene, camera]);

  useFrame(() => {
    if (scrollState.sceneReady) return;
    // useFrame runs before R3F renders; on the second call the first frame is on screen.
    frames.current += 1;
    if (frames.current >= 2) markSceneReady();
  });

  return null;
}
