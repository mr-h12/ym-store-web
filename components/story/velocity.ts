import { scrollState } from "@/lib/scroll-state";
import { gsap } from "./gsap";

/**
 * One shared ticker drives the velocity skew of every KineticHeadline.
 * scrollState.velocity (Lenis px/frame, signed) → skewY clamped to ±8°, eased back
 * with gsap.quickTo, plus a hair of vertical stretch.
 */
const MAX_SKEW = 8;
const SKEW_PER_PX = 0.2;
const STRETCH_PER_PX = 0.0016;
const MAX_STRETCH = 0.06;

interface SkewEntry {
  skew: gsap.QuickToFunc;
  stretch: gsap.QuickToFunc;
}

const entries = new Set<SkewEntry>();
let lastSkew = Number.NaN;

function tick() {
  const v = scrollState.velocity || 0;
  const skew = gsap.utils.clamp(-MAX_SKEW, MAX_SKEW, v * SKEW_PER_PX);
  // Skip re-targeting when nothing meaningful changed (idle page = zero work).
  if (Math.abs(skew - lastSkew) < 0.02) return;
  lastSkew = skew;
  const stretch = 1 + Math.min(Math.abs(v) * STRETCH_PER_PX, MAX_STRETCH);
  entries.forEach((e) => {
    e.skew(skew);
    e.stretch(stretch);
  });
}

/** Attach the velocity skew to `el`. Returns the detach function. */
export function registerVelocitySkew(el: HTMLElement): () => void {
  const entry: SkewEntry = {
    skew: gsap.quickTo(el, "skewY", { duration: 0.5, ease: "power3" }),
    stretch: gsap.quickTo(el, "scaleY", { duration: 0.5, ease: "power3" }),
  };
  if (entries.size === 0) gsap.ticker.add(tick);
  entries.add(entry);
  lastSkew = Number.NaN; // make sure the newcomer receives the current value
  return () => {
    entries.delete(entry);
    entry.skew.tween.kill();
    entry.stretch.tween.kill();
    gsap.set(el, { clearProps: "transform" });
    if (entries.size === 0) gsap.ticker.remove(tick);
  };
}
