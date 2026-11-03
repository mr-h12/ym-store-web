"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { markReady, onSceneReady, scrollState } from "@/lib/scroll-state";
import { brand } from "@/lib/store-data";
import { useLenis } from "@/components/providers/SmoothScroll";

if (typeof window !== "undefined") {
  gsap.registerPlugin(useGSAP);
}

type Check = "fonts" | "webgl" | "shaders" | "scroll";

const CHECKS: { id: Check; label: string }[] = [
  { id: "fonts", label: "Fonts" },
  { id: "webgl", label: "WebGL scene" },
  { id: "shaders", label: "Shaders" },
  { id: "scroll", label: "Scroll engine" },
];

/** Weights of the real progress target (sum = 100). */
const WEIGHT_FONTS = 40;
const WEIGHT_SCENE = 40;
const WEIGHT_TIME = 20;
/** Proceed even if the scene never reports ready. */
const SAFETY_TIMEOUT_MS = 8000;

const pad3 = (n: number) => String(n).padStart(3, "0");

/**
 * Cinematic loader (z-50). Gated on real work:
 *   fonts (40) + WebGL scene ready (40) + minimum duration (20).
 * The displayed counter eases toward that target and never runs backwards.
 * At 100: hold → counter slides up through its mask → panel wipes upward.
 * `markReady()` fires at the start of the wipe so the hero/camera intro overlap it.
 */
export function Preloader() {
  const panelRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLSpanElement>(null);
  const counterInnerRef = useRef<HTMLSpanElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const statusRef = useRef<HTMLSpanElement>(null);

  const lenis = useLenis();
  const [checks, setChecks] = useState<Record<Check, boolean>>({
    fonts: false,
    webgl: false,
    shaders: false,
    scroll: false,
  });
  const [gone, setGone] = useState(false);

  const tick = useCallback(
    (id: Check) => setChecks((prev) => (prev[id] ? prev : { ...prev, [id]: true })),
    [],
  );

  // Scroll engine row is "real": it ticks once the Lenis instance exists.
  useEffect(() => {
    if (lenis) tick("scroll");
  }, [lenis, tick]);

  useGSAP((_context, contextSafe) => {
    if (!contextSafe) return;

    // Already unlocked (e.g. fast refresh) — don't replay the intro.
    if (scrollState.ready) {
      setGone(true);
      return;
    }

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const minDuration = reduced ? 0.8 : 1.8; // seconds
    const hold = reduced ? 0.1 : 0.25;
    const wipe = reduced ? 0.55 : 1.1;
    const counterExit = reduced ? 0.3 : 0.65;
    /** Minimum climb rate (%/s) so the counter never crawls asymptotically. */
    const minRate = reduced ? 40 : 14;

    let fontsDone = false;
    let sceneDone = false;
    let webglSeen = false;
    let displayed = 0;
    let lastShown = -1;
    let finished = false;
    let alive = true;
    const start = performance.now();

    // ── Real gates ────────────────────────────────────────────────────
    const markFonts = () => {
      if (!alive || fontsDone) return;
      fontsDone = true;
      tick("fonts");
    };
    const markScene = () => {
      if (!alive || sceneDone) return;
      sceneDone = true;
      webglSeen = true;
      tick("webgl");
      tick("shaders");
    };

    if ("fonts" in document) {
      document.fonts.ready.then(markFonts, markFonts);
    } else {
      markFonts();
    }
    const offScene = onSceneReady(markScene);
    const safety = window.setTimeout(() => {
      markFonts();
      markScene();
    }, SAFETY_TIMEOUT_MS);

    // ── Exit sequence ─────────────────────────────────────────────────
    const exit = contextSafe(() => {
      const panel = panelRef.current;
      if (!panel) return;
      if (statusRef.current) statusRef.current.textContent = "Ready";

      gsap
        .timeline({ delay: hold })
        .to(counterInnerRef.current, { yPercent: -105, duration: counterExit, ease: "expo.in" })
        .to(
          "[data-preloader-fade]",
          { autoAlpha: 0, y: -12, duration: counterExit * 0.8, ease: "power3.in", stagger: 0.03 },
          "<",
        )
        .addLabel("wipe")
        .call(
          () => {
            panel.style.pointerEvents = "none";
            markReady();
          },
          undefined,
          "wipe",
        )
        .fromTo(
          panel,
          { clipPath: "inset(0% 0% 0% 0%)" },
          { clipPath: "inset(0% 0% 100% 0%)", duration: wipe, ease: "expo.inOut" },
          "wipe",
        )
        .call(() => setGone(true));
    });

    // ── Counter loop ──────────────────────────────────────────────────
    const loop = (_time: number, deltaTime: number) => {
      if (finished) return;
      const dt = Math.min(deltaTime, 100) / 1000;

      if (!webglSeen && document.querySelector("canvas")) {
        webglSeen = true;
        tick("webgl");
      }

      const elapsed = (performance.now() - start) / 1000;
      const target =
        (fontsDone ? WEIGHT_FONTS : 0) +
        (sceneDone ? WEIGHT_SCENE : 0) +
        WEIGHT_TIME * Math.min(1, elapsed / minDuration);

      const diff = target - displayed;
      if (diff > 0) {
        const eased = diff * (1 - Math.exp(-dt * 4.5));
        displayed += Math.min(diff, Math.max(eased, minRate * dt));
      }
      if (target >= 100 && displayed > 99.95) displayed = 100;

      const shown = Math.floor(displayed);
      if (shown !== lastShown) {
        lastShown = shown;
        if (counterRef.current) counterRef.current.textContent = pad3(shown);
      }
      if (lineRef.current) lineRef.current.style.transform = `scaleX(${displayed / 100})`;

      if (displayed >= 100) {
        finished = true;
        gsap.ticker.remove(loop);
        exit();
      }
    };
    gsap.ticker.add(loop);

    return () => {
      alive = false;
      window.clearTimeout(safety);
      offScene();
      gsap.ticker.remove(loop);
    };
  }, { scope: panelRef });

  if (gone) return null;

  return (
    <div
      ref={panelRef}
      aria-busy="true"
      className="pointer-events-auto fixed inset-0 z-50 flex flex-col justify-between overflow-hidden bg-obsidian text-chalk"
      style={{ clipPath: "inset(0% 0% 0% 0%)" }}
    >
      <p role="status" className="sr-only">
        Loading experience
      </p>

      {/* Top row */}
      <div className="gutter-x type-label flex items-start justify-between gap-6 pt-6 sm:pt-8">
        <span data-preloader-fade className="text-chalk">
          {brand.name.toUpperCase()} <span className="text-accent">—</span> Everyday clothing
        </span>
        <span data-preloader-fade className="flex items-center gap-2 text-dim">
          <span aria-hidden className="size-1.5 animate-pulse rounded-full bg-accent motion-reduce:animate-none" />
          <span ref={statusRef}>Loading experience</span>
        </span>
      </div>

      {/* Checklist */}
      <ul
        data-preloader-fade
        className="gutter-x type-label flex w-full flex-col gap-2 self-end sm:w-auto sm:min-w-72"
        aria-label="Loading status"
      >
        {CHECKS.map(({ id, label }) => {
          const done = checks[id];
          return (
            <li key={id} className="flex items-center gap-3 border-b border-white/10 pb-2">
              <span
                aria-hidden
                className={`size-1.5 transition-colors duration-500 ${done ? "bg-accent" : "border border-white/30"}`}
              />
              <span className={`transition-colors duration-500 ${done ? "text-chalk" : "text-dim"}`}>{label}</span>
              <span className={`ml-auto tabular-nums ${done ? "text-accent" : "text-dim/60"}`}>
                {done ? "OK" : "···"}
              </span>
            </li>
          );
        })}
      </ul>

      {/* Counter + progress line */}
      <div className="gutter-x pb-6 sm:pb-8">
        <span className="mask-line font-display leading-none tracking-[-0.02em] text-chalk" aria-hidden>
          <span
            ref={counterInnerRef}
            className="block text-[clamp(7rem,26vw,22rem)] tabular-nums will-change-transform"
          >
            <span ref={counterRef}>000</span>
          </span>
        </span>
        <div className="relative mt-4 h-px w-full bg-white/10" data-preloader-fade>
          <div
            ref={lineRef}
            className="absolute inset-0 origin-left bg-accent shadow-[0_0_10px_rgb(196_98_45/0.7)]"
            style={{ transform: "scaleX(0)" }}
          />
        </div>
        <div data-preloader-fade className="type-label mt-3 flex justify-between text-dim">
          <span>
            {brand.country} · {brand.currency}
          </span>
          <span>Est. on Instagram {brand.instagramHandle}</span>
        </div>
      </div>
    </div>
  );
}
