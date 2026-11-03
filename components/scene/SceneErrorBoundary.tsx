"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { markSceneReady } from "@/lib/scroll-state";

interface Props {
  children: ReactNode;
  /** Rendered instead of the children after an error. Defaults to nothing. */
  fallback?: ReactNode;
  /** When true (outer boundary), report the scene as ready so the preloader is never stuck. */
  releasePreloader?: boolean;
}

interface State {
  failed: boolean;
}

/**
 * Catches WebGL / scene failures. The outer boundary (around the whole canvas)
 * renders nothing and still calls markSceneReady(); an inner one can swap in a
 * fallback (e.g. procedural layers when a .glb fails to load).
 */
export class SceneErrorBoundary extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: unknown, info: ErrorInfo): void {
    console.warn("[scene] WebGL scene disabled:", error, info.componentStack);
    if (this.props.releasePreloader) markSceneReady();
  }

  render(): ReactNode {
    if (this.state.failed) return this.props.fallback ?? null;
    return this.props.children;
  }
}
