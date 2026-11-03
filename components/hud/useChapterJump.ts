"use client";

import { useCallback } from "react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { Chapter } from "@/lib/chapters";
import { useLenis } from "@/components/providers/SmoothScroll";

const JUMP_DURATION = 1.6;
const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4);

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Returns `{ jumpTo, scrollToTop }` for HUD quick-jump navigation.
 *
 * Chapter targets come from the pinned chapter ScrollTriggers (registered by the
 * story layer with `id: chapter.id`). We land 40% into the pin so the chapter's
 * content has already revealed. Falls back to the chapter's DOM anchor.
 */
export function useChapterJump() {
  const lenis = useLenis();

  const scrollTo = useCallback(
    (target: number | HTMLElement) => {
      const reduced = prefersReducedMotion();
      if (lenis) {
        lenis.scrollTo(target, {
          duration: JUMP_DURATION,
          easing: easeOutQuart,
          immediate: reduced,
          force: true,
        });
        return;
      }
      const behavior: ScrollBehavior = reduced ? "auto" : "smooth";
      if (typeof target === "number") {
        window.scrollTo({ top: target, behavior });
      } else {
        target.scrollIntoView({ behavior, block: "start" });
      }
    },
    [lenis],
  );

  const jumpTo = useCallback(
    (chapter: Chapter) => {
      const st = ScrollTrigger.getById(chapter.id);
      if (st) {
        scrollTo(chapter.id === "hero" ? 0 : st.start + (st.end - st.start) * 0.4);
        return;
      }
      const el = document.getElementById(chapter.anchor);
      if (el) {
        scrollTo(el);
      } else if (chapter.id === "hero") {
        scrollTo(0);
      }
    },
    [scrollTo],
  );

  const scrollToTop = useCallback(() => scrollTo(0), [scrollTo]);

  return { jumpTo, scrollToTop };
}
