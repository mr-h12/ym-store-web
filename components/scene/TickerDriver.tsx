"use client";

import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import { gsap } from "gsap";

/**
 * Drives the R3F render loop (`frameloop="never"`) from gsap.ticker so the DOM
 * (Lenis + ScrollTrigger) and WebGL share a single rAF tick.
 *
 * The callback is added NON-prioritised: the SmoothScroll provider registers
 * Lenis with prioritize=true, so Lenis scrolls first and the scene renders
 * afterwards in the same tick. gsap's ticker pauses on hidden tabs by itself.
 *
 * Note: with frameloop="never", R3F stores the timestamp passed to advance()
 * verbatim as clock.elapsedTime and derives useFrame's `delta` from it, so we
 * pass performance.now() in SECONDS to keep `delta` in seconds.
 */
export function TickerDriver() {
  const advance = useThree((s) => s.advance);

  useEffect(() => {
    const tick = () => {
      advance(performance.now() / 1000);
    };
    gsap.ticker.add(tick);
    return () => {
      gsap.ticker.remove(tick);
    };
  }, [advance]);

  return null;
}
