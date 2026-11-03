"use client";

import { useRef } from "react";
import { CHAPTERS, COPY } from "@/lib/chapters";
import { onReady } from "@/lib/scroll-state";
import { brand } from "@/lib/store-data";
import { gsap, useGSAP } from "./gsap";
import { KineticHeadline, headlineChars } from "./KineticHeadline";
import { $all, PHASE, chapterTimeline } from "./layout";

const chapter = CHAPTERS[0];

/** Cairo, used as the store's telemetry "origin". */
const COORDS = "30.0444° N · 31.2357° E";

export function ChapterHero() {
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);

  useGSAP(
    (context) => {
      const section = sectionRef.current;
      const titleWrap = titleRef.current;
      if (!section || !titleWrap) return;

      const intro = $all(section, "[data-hero-intro]");
      const hintBar = $all(section, "[data-hint-bar]");
      const rule = $all(section, "[data-hero-rule]");

      // Hidden until the preloader hands over (the title chars hide themselves in KineticHeadline "play" mode).
      gsap.set(intro, { autoAlpha: 0, y: 28 });
      gsap.set(rule, { scaleX: 0, transformOrigin: "0% 50%" });

      const offReady = onReady(() => {
        context.add(() => {
          gsap
            .timeline({ delay: 0.75 })
            .to(rule, { scaleX: 1, duration: 1.4, ease: "expo.inOut" }, 0)
            .to(intro, { autoAlpha: 1, y: 0, duration: 1.3, ease: "expo.out", stagger: 0.09 }, 0.25);
          gsap.fromTo(
            hintBar,
            { yPercent: -100 },
            { yPercent: 100, duration: 1.7, ease: "power2.inOut", repeat: -1, repeatDelay: 0.15, delay: 1.6 },
          );
        });
      });

      // ── Scrubbed exit through the pin: the title swells, letters spread and shoot up out of their masks.
      const tl = chapterTimeline(section, chapter.id);
      const X = PHASE.heroExitStart;
      const chars = headlineChars(titleWrap);
      const exitGroups = $all(section, "[data-hero-exit]");
      const scrims = $all(section, "[data-scrim]");
      const center = (chars.length - 1) / 2;

      tl.to(scrims, { autoAlpha: 0, duration: 1 - X, ease: "power1.in" }, X)
        .to(exitGroups, { autoAlpha: 0, y: -48, duration: 0.2, stagger: 0.03, ease: "power2.in" }, X)
        .to(titleWrap, { scale: 1.14, yPercent: -10, duration: 1 - X, ease: "power1.in" }, X)
        // The accent rule lives in the title wrap: fade it so it doesn't linger under the HUD once the letters are gone.
        .to(rule, { autoAlpha: 0, duration: 0.2, ease: "power1.in" }, X + 0.06)
        .to(
          chars,
          {
            x: (i: number) => (i - center) * window.innerWidth * 0.035,
            y: (_i: number, target: HTMLElement) => -target.offsetHeight * 1.3,
            rotation: (i: number) => (i % 2 ? 7 : -5),
            skewX: -12,
            duration: 0.24,
            stagger: { each: 0.026, from: "edges" },
            ease: "power3.in",
          },
          X + 0.06,
        );

      return () => offReady();
    },
    { scope: sectionRef },
  );

  return (
    <section
      ref={sectionRef}
      id={chapter.anchor}
      aria-label={`${chapter.index} — ${brand.name}`}
      className="relative h-svh w-full overflow-hidden"
    >
      {/* Legibility scrims (transparent — the cloth stays visible) */}
      <div data-scrim aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-[70%] bg-linear-to-t from-obsidian/85 via-obsidian/35 to-transparent" />
      <div data-scrim aria-hidden className="pointer-events-none absolute inset-y-0 left-0 w-1/2 bg-linear-to-r from-obsidian/50 to-transparent" />

      <div className="gutter-x relative flex h-full flex-col justify-between pt-[72px] pb-16">
        {/* Top row: eyebrow + telemetry meta */}
        <div data-hero-exit className="flex items-start justify-between gap-6">
          <div className="flex flex-col gap-3">
            <p data-hero-intro className="type-label flex items-center gap-2.5 text-chalk">
              <span aria-hidden className="relative flex size-2">
                <span className="absolute inset-0 animate-ping rounded-full bg-accent/60" />
                <span className="relative size-2 rounded-full bg-accent" />
              </span>
              {COPY.hero.eyebrow}
            </p>
            <p data-hero-intro className="type-label text-dim md:hidden">
              {brand.instagramHandle} <span className="text-accent">/</span> {brand.currency} · COD
            </p>
          </div>
          <dl data-hero-intro className="type-label hidden grid-cols-[auto_auto] gap-x-4 gap-y-1 text-right md:grid">
            <dt className="text-dim">Est.</dt>
            <dd className="text-chalk">
              Instagram <span className="text-accent">{brand.instagramHandle}</span>
            </dd>
            <dt className="text-dim">Pay</dt>
            <dd className="text-chalk">
              {brand.currency} <span className="text-accent">·</span> Cash on delivery
            </dd>
            <dt className="text-dim">Loc</dt>
            <dd className="text-chalk">{COORDS}</dd>
          </dl>
        </div>

        {/* Bottom: giant title + headline column */}
        <div className="flex flex-col gap-6 lg:grid lg:grid-cols-12 lg:items-end lg:gap-8">
          <div ref={titleRef} className="relative origin-[0%_100%] lg:col-span-8">
            <span
              data-hero-rule
              aria-hidden
              className="absolute -top-4 left-0 block h-px w-full bg-linear-to-r from-accent via-white/20 to-transparent"
            />
            <KineticHeadline
              as="h1"
              lines={COPY.hero.title}
              accent="."
              mode="play"
              delay={0.35}
              stagger={0.07}
              className="type-display text-chalk"
              style={{ fontSize: "clamp(5.5rem, min(26vw, 33svh), 20rem)" }}
            />
          </div>

          <div data-hero-exit className="flex max-w-md flex-col gap-3 lg:col-span-4 lg:justify-self-end lg:pb-4">
            <p data-hero-intro className="type-label hidden text-accent lg:block">
              {chapter.index} <span className="text-dim">/ 05 — Index</span>
            </p>
            <p data-hero-intro className="type-h3 text-chalk">
              {COPY.hero.headline}
            </p>
            <p data-hero-intro className="type-lead text-dim">
              {COPY.hero.sub}
            </p>
            <div data-hero-intro className="mt-3 flex items-center gap-4">
              <span aria-hidden className="relative block h-12 w-px overflow-hidden bg-white/15">
                <span data-hint-bar className="absolute inset-0 block bg-accent" />
              </span>
              <span className="type-label text-chalk">{COPY.hero.scrollHint}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
