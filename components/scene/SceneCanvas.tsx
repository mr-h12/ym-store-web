"use client";

import dynamic from "next/dynamic";
import { SCENE } from "@/lib/scene-config";
import { SceneErrorBoundary } from "./SceneErrorBoundary";

// WebGL only exists in the browser: load the canvas (and three.js) client-side.
const Experience = dynamic(() => import("./Experience").then((m) => m.Experience), {
  ssr: false,
  loading: () => null,
});

/** Layer 0: fixed, full-screen WebGL scene behind the scrolling story. */
export function SceneCanvas() {
  return (
    <div
      aria-hidden
      className="fixed inset-0 z-0 pointer-events-none"
      style={{ background: SCENE.background }}
    >
      <SceneErrorBoundary releasePreloader>
        <Experience />
      </SceneErrorBoundary>
    </div>
  );
}
