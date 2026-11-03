"use client";

import { createContext, useContext, useEffect, useState } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { onReady, scrollState } from "@/lib/scroll-state";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const LenisContext = createContext<Lenis | null>(null);

/** The active Lenis instance, or `null` before it is created (SSR / first render). */
export function useLenis(): Lenis | null {
  return useContext(LenisContext);
}

/** Pointer smoothing per 60fps frame (0 – 1). */
const POINTER_EASE = 0.075;
/** Velocity decay per 60fps frame while Lenis is idle. */
const VELOCITY_DECAY = 0.86;
/** Reference frame duration (ms) for frame-rate independent damping. */
const FRAME_MS = 1000 / 60;

/**
 * Unified render loop:
 *   gsap.ticker (one rAF) → Lenis.raf (prioritized) → "scroll" → ScrollTrigger.update
 *   → [other ticker callbacks: WebGL advance(), HUD telemetry …]
 *
 * Lenis starts stopped and is only unlocked when the Preloader calls `markReady()`.
 */
export function SmoothScroll({ children }: { children: React.ReactNode }) {
  const [lenis, setLenis] = useState<Lenis | null>(null);

  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
    window.scrollTo(0, 0);

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const instance = new Lenis({
      autoRaf: false,
      lerp: reduced ? 1 : 0.085,
      smoothWheel: !reduced,
      syncTouch: false,
      wheelMultiplier: 1,
    });
    instance.stop();

    // ── Lenis → scroll state + ScrollTrigger ────────────────────────────
    const handleScroll = (l: Lenis) => {
      const p = l.limit > 0 ? l.progress : 0;
      scrollState.progress = Number.isFinite(p) ? Math.min(1, Math.max(0, p)) : 0;
      scrollState.velocity = Number.isFinite(l.velocity) ? l.velocity : 0;
    };
    const offScroll = instance.on("scroll", handleScroll);
    const offScrollTrigger = instance.on("scroll", ScrollTrigger.update);

    // ── Pointer (raw target, smoothed in the ticker) ─────────────────────
    const pointerTarget = { x: 0, y: 0 };
    const handlePointer = (e: PointerEvent) => {
      const w = window.innerWidth || 1;
      const h = window.innerHeight || 1;
      pointerTarget.x = (e.clientX / w) * 2 - 1;
      pointerTarget.y = -((e.clientY / h) * 2 - 1);
    };
    window.addEventListener("pointermove", handlePointer, { passive: true });

    // ── Ticker: Lenis first (prioritized), then damping ──────────────────
    const raf = (time: number, deltaTime: number) => {
      instance.raf(time * 1000);

      const frames = Math.min(deltaTime, 100) / FRAME_MS;

      if (!instance.isScrolling && scrollState.velocity !== 0) {
        scrollState.velocity *= Math.pow(VELOCITY_DECAY, frames);
        if (Math.abs(scrollState.velocity) < 0.001) scrollState.velocity = 0;
      }

      const k = reduced ? 1 : 1 - Math.pow(1 - POINTER_EASE, frames);
      scrollState.pointer.x += (pointerTarget.x - scrollState.pointer.x) * k;
      scrollState.pointer.y += (pointerTarget.y - scrollState.pointer.y) * k;
    };
    gsap.ticker.add(raf, false, true);
    gsap.ticker.lagSmoothing(0);

    // ── Unlock when the preloader finishes ───────────────────────────────
    const offReady = onReady(() => {
      instance.start();
      ScrollTrigger.refresh();
    });

    // ── Re-measure once web fonts have swapped in ────────────────────────
    let alive = true;
    if (typeof document !== "undefined" && "fonts" in document) {
      document.fonts.ready.then(() => {
        if (alive) ScrollTrigger.refresh();
      });
    }

    setLenis(instance);

    return () => {
      alive = false;
      offReady();
      offScroll();
      offScrollTrigger();
      window.removeEventListener("pointermove", handlePointer);
      gsap.ticker.remove(raf);
      gsap.ticker.lagSmoothing(500, 33);
      instance.destroy();
      setLenis(null);
    };
  }, []);

  return <LenisContext.Provider value={lenis}>{children}</LenisContext.Provider>;
}
