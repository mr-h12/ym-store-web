import type { ChapterId } from "@/lib/chapters";
import { gsap } from "./gsap";

/**
 * Scroll geometry of the story track, in units of ONE SECTION HEIGHT (≈ 1 viewport).
 *
 * Every chapter is a 100svh <section> that is pinned for `PIN[id]` section-heights.
 * Track height = Σ (1 + PIN[id])  →  5 + 4.6 = 9.6 section-heights.
 * Scroll range = track − viewport = 8.6 section-heights.
 *
 * The master scene timeline (StoryTrack) is authored in the same units, so its
 * tween positions line up with the DOM pins whatever the viewport size is.
 */
export const PIN: Record<ChapterId, number> = {
  hero: 0.7,
  deconstruct: 1.2,
  deepdive: 1.1,
  data: 1,
  finale: 0.6,
};

/**
 * Choreography phases inside each chapter's pin timeline (normalised 0 – 1).
 * Content reveals during [0, REVEAL_END], holds, and exits from EXIT_START.
 * The HUD quick-jump lands at 0.4, which is always inside the hold.
 */
export const PHASE = {
  revealEnd: 0.3,
  /** Point in the pin where the master scene timeline has fully arrived at the chapter keyframe. */
  sceneArrive: 0.28,
  exitStart: 0.8,
  /** The hero starts its signature exit earlier (still fully visible at 0.4). */
  heroExitStart: 0.52,
} as const;

/** Scroll units (section heights) at which each chapter's pin starts. */
export function pinStarts(ids: readonly ChapterId[]): number[] {
  const starts: number[] = [];
  let cursor = 0;
  for (const id of ids) {
    starts.push(cursor);
    cursor += 1 + PIN[id];
  }
  return starts;
}

/**
 * Creates the chapter's MAIN pinning ScrollTrigger (id = chapter id, as required by the
 * HUD quick-jump) wrapped around a scrubbed timeline whose duration is exactly 1, so
 * positions inside it are fractions of the pin range.
 */
export function chapterTimeline(section: HTMLElement, id: ChapterId): gsap.core.Timeline {
  const tl = gsap.timeline({
    defaults: { ease: "none" },
    scrollTrigger: {
      id,
      trigger: section,
      start: "top top",
      end: () => `+=${Math.round(section.offsetHeight * PIN[id])}`,
      pin: true,
      scrub: 1,
      anticipatePin: 1,
      invalidateOnRefresh: true,
    },
  });
  // Lock the timeline length to 1 so every position is a fraction of the pin.
  tl.set({}, {}, 1);
  return tl;
}

/** Elements inside `scope` matching `selector`, as a typed array. */
export function $all<T extends Element = HTMLElement>(scope: Element | null, selector: string): T[] {
  if (!scope) return [];
  return Array.from(scope.querySelectorAll<T>(selector));
}

