"use client";

import { useRef, type CSSProperties } from "react";
import { CHAPTERS, INTRO_SCENE } from "@/lib/chapters";
import { onReady, scrollState, type SceneState } from "@/lib/scroll-state";
import { ChapterDataGrid } from "./ChapterDataGrid";
import { ChapterDeconstruct } from "./ChapterDeconstruct";
import { ChapterDeepDive } from "./ChapterDeepDive";
import { ChapterFinale } from "./ChapterFinale";
import { ChapterHero } from "./ChapterHero";
import { gsap, ScrollTrigger, useGSAP } from "./gsap";
import { $all, PHASE, PIN, pinStarts } from "./layout";

type NumericSceneKey = Exclude<keyof SceneState, "focusLayer">;

const SCENE_KEYS = (Object.keys(INTRO_SCENE) as (keyof SceneState)[]).filter(
  (k): k is NumericSceneKey => k !== "focusLayer",
);

function numericScene(s: SceneState): Record<NumericSceneKey, number> {
  const out = {} as Record<NumericSceneKey, number>;
  for (const k of SCENE_KEYS) out[k] = s[k];
  return out;
}

/** Story-layer type scale: headings also respect viewport HEIGHT so pinned chapters never overflow 100svh. */
const TRACK_STYLE = {
  "--fs-h2": "clamp(2.75rem, min(8vw, 14svh), 8.5rem)",
  "--fs-h3": "clamp(1.375rem, min(3vw, 5svh), 2.75rem)",
} as CSSProperties;

/**
 * Layer 1 — the tall scrollable story.
 *
 * Geometry (in section heights, see ./layout.ts):
 *   hero 1+0.7 · deconstruct 1+1.2 · deepdive 1+1.1 · data 1+1 · finale 1+0.6  = 9.6 → 8.6 of scroll.
 *
 * Owns scrollState.scene (master scrub timeline + intro blend) and
 * scrollState.chapter / chapterProgress (one range trigger per chapter wrapper).
 */
export function StoryTrack() {
  const rootRef = useRef<HTMLDivElement>(null);

  useGSAP(
    (context) => {
      const root = rootRef.current;
      if (!root) return;

      // Chapter pin triggers were created by the children (their layout effects run first),
      // so everything below is measured after the pin spacers exist.

      // ── Master scene timeline ──────────────────────────────────────────────
      // Authored in section-height units; the timeline length equals the scroll range
      // in the same units, so position p ↔ scrollY = p × sectionHeight.
      const ids = CHAPTERS.map((c) => c.id);
      const starts = pinStarts(ids);
      const last = ids.length - 1;
      const total = starts[last] + PIN[ids[last]];

      /** Scene has fully arrived at chapter i (its content has just finished revealing). */
      const arrive = (i: number) => (i === 0 ? 0 : starts[i] + PIN[ids[i]] * PHASE.sceneArrive);
      /** Chapter i's content starts leaving → scene may start moving on. */
      const depart = (i: number) =>
        starts[i] + PIN[ids[i]] * (i === 0 ? PHASE.heroExitStart : PHASE.exitStart);

      const proxy: SceneState = { ...CHAPTERS[0].scene };
      const master = gsap.timeline({
        defaults: { ease: "power1.inOut" },
        scrollTrigger: {
          id: "story-scene",
          trigger: root,
          start: "top top",
          end: "bottom bottom",
          scrub: 1,
          refreshPriority: -1,
        },
      });
      for (let i = 1; i < CHAPTERS.length; i++) {
        const from = depart(i - 1);
        master.to(
          proxy,
          { ...numericScene(CHAPTERS[i].scene), focusLayer: CHAPTERS[i].scene.focusLayer, duration: arrive(i) - from },
          from,
        );
      }
      // Hold the finale keyframe until the very end of the track.
      master.set({}, {}, total);

      // ── Intro blend: INTRO_SCENE → scroll-driven scene once the preloader lifts ──
      const blend = { v: 0 };
      const offReady = onReady(() => {
        context.add(() => {
          gsap.to(blend, { v: 1, duration: 2.6, ease: "expo.inOut" });
        });
      });

      const scene = scrollState.scene;
      const writeScene = () => {
        const b = blend.v;
        for (const k of SCENE_KEYS) {
          const from = INTRO_SCENE[k];
          scene[k] = from + (proxy[k] - from) * b;
        }
        scene.focusLayer = Math.round(proxy.focusLayer);
      };
      writeScene();
      gsap.ticker.add(writeScene);

      // ── Chapter index for the HUD: contiguous ranges covering every wrapper ──
      $all(root, "[data-chapter-wrap]").forEach((wrap, i) => {
        ScrollTrigger.create({
          trigger: wrap,
          start: "top center",
          end: "bottom center",
          refreshPriority: -1,
          onToggle: (self) => {
            if (self.isActive) {
              scrollState.chapter = i;
              scrollState.chapterProgress = self.progress;
            }
          },
          onUpdate: (self) => {
            if (self.isActive) scrollState.chapterProgress = self.progress;
          },
        });
      });

      // Webfonts can change text metrics after first layout: re-measure once they settle.
      let alive = true;
      if (typeof document !== "undefined" && document.fonts) {
        document.fonts.ready.then(() => {
          if (alive) ScrollTrigger.refresh();
        });
      }

      return () => {
        alive = false;
        offReady();
        gsap.ticker.remove(writeScene);
      };
    },
    { scope: rootRef },
  );

  return (
    <div ref={rootRef} className="relative z-10" style={TRACK_STYLE}>
      <div data-chapter-wrap>
        <ChapterHero />
      </div>
      <div data-chapter-wrap>
        <ChapterDeconstruct />
      </div>
      <div data-chapter-wrap>
        <ChapterDeepDive />
      </div>
      <div data-chapter-wrap>
        <ChapterDataGrid />
      </div>
      <div data-chapter-wrap>
        <ChapterFinale />
      </div>
    </div>
  );
}
