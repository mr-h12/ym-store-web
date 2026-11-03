"use client";

import { useRef } from "react";
import { CHAPTERS, COPY } from "@/lib/chapters";
import { SCENE_LAYERS } from "@/lib/scene-config";
import { counterTween } from "./Counter";
import { useGSAP } from "./gsap";
import { KineticHeadline, headlineChars } from "./KineticHeadline";
import { $all, PHASE, chapterTimeline } from "./layout";
import { SpecCard, type ConnectorDirection } from "./SpecCard";

const chapter = CHAPTERS[1];
const CONNECTORS: ConnectorDirection[] = ["down", "flat", "up"];

export function ChapterDeconstruct() {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const section = sectionRef.current;
      if (!section) return;

      const tl = chapterTimeline(section, chapter.id);
      const R = PHASE.revealEnd;
      const E = PHASE.exitStart;

      const scrim = $all(section, "[data-scrim]");
      const content = $all(section, "[data-content]");
      const eyebrow = $all(section, "[data-eyebrow]");
      const body = $all(section, "[data-body]");
      const cards = $all(section, "[data-spec-card]");
      const counters = $all(section, "[data-counter]");
      const connectors = $all<SVGPathElement>(section, "[data-connector]");
      const dots = $all(section, "[data-connector-dot]");
      const legendRows = $all(section, "[data-legend-row]");
      const legendRule = $all(section, "[data-legend-rule]");
      const legend = $all(section, "[data-legend]");
      const chars = headlineChars(section);

      // ── Reveal (0 → ~0.3)
      tl.fromTo(scrim, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.14 }, 0)
        .fromTo(eyebrow, { autoAlpha: 0, x: -24 }, { autoAlpha: 1, x: 0, duration: 0.08, ease: "power2.out" }, 0.02)
        .fromTo(chars, { yPercent: 118 }, { yPercent: 0, duration: 0.13, stagger: 0.008, ease: "power3.out" }, 0.03)
        .fromTo(body, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.1, ease: "power2.out" }, 0.1)
        .fromTo(
          cards,
          { autoAlpha: 0, y: 70, rotateX: -32, transformPerspective: 900, transformOrigin: "50% 0%" },
          { autoAlpha: 1, y: 0, rotateX: 0, duration: 0.12, stagger: 0.035, ease: "power2.out" },
          0.11,
        )
        .fromTo(connectors, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.1, stagger: 0.035, ease: "power1.inOut" }, 0.16)
        .fromTo(dots, { scale: 0 }, { scale: 1, duration: 0.04, stagger: 0.035, ease: "back.out(3)" }, 0.24)
        .fromTo(legend, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.06 }, 0.12)
        .fromTo(legendRule, { scaleX: 0, transformOrigin: "100% 50%" }, { scaleX: 1, duration: 0.1 }, 0.14)
        .fromTo(legendRows, { autoAlpha: 0, x: 18 }, { autoAlpha: 1, x: 0, duration: 0.07, stagger: 0.022, ease: "power2.out" }, 0.15);
      counters.forEach((el, i) => tl.add(counterTween(el, 0.14), 0.13 + i * 0.035));

      // ── Hold (R → E): a slow drift keeps the stage alive without moving content out of place.
      tl.fromTo(cards, { x: 0 }, { x: 10, duration: E - R, stagger: 0.01 }, R);

      // ── Exit (E → 1)
      tl.to(chars, { yPercent: -118, duration: 0.1, stagger: 0.004, ease: "power2.in" }, E)
        .to(content, { autoAlpha: 0, y: -56, duration: 0.17, ease: "power1.in" }, E + 0.03)
        .to(scrim, { autoAlpha: 0, duration: 0.15 }, E + 0.05);
    },
    { scope: sectionRef },
  );

  return (
    <section
      ref={sectionRef}
      id={chapter.anchor}
      aria-labelledby={`${chapter.id}-title`}
      className="relative h-svh w-full overflow-hidden"
    >
      <div
        data-scrim
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-linear-to-b from-obsidian/75 via-obsidian/45 to-obsidian/80 lg:inset-y-0 lg:right-auto lg:w-[64%] lg:bg-linear-to-r lg:from-obsidian/85 lg:via-obsidian/45 lg:to-transparent"
      />

      <div data-content className="gutter-x relative flex h-full flex-col pt-[72px] pb-16">
        <div className="flex min-h-0 flex-1 flex-col lg:w-[40%] lg:min-w-[26rem]">
          <p data-eyebrow className="type-label flex items-center gap-2.5 text-chalk">
            <span className="text-accent">{chapter.index}</span>
            <span aria-hidden className="h-px w-6 bg-white/30" />
            {COPY.deconstruct.eyebrow}
          </p>

          <div className="mt-3 lg:mt-5">
            <KineticHeadline id={`${chapter.id}-title`} lines={COPY.deconstruct.title} accent="." className="type-h2 text-chalk" />
          </div>

          <p data-body className="mt-3 max-w-[44ch] text-chalk/75 max-sm:text-[0.875rem] max-sm:leading-snug lg:mt-5">
            {COPY.deconstruct.body}
          </p>

          <div className="mt-5 flex flex-col gap-2.5 sm:gap-3 lg:mt-auto lg:max-w-[30rem]">
            {COPY.deconstruct.specs.map((spec, i) => (
              <SpecCard
                key={spec.label}
                index={String(i + 1).padStart(2, "0")}
                value={spec.value}
                suffix={spec.suffix}
                label={spec.label}
                detail={spec.detail}
                connector={CONNECTORS[i]}
              />
            ))}
          </div>
        </div>

        {/* Technical legend of the five cloth layers */}
        <aside
          data-legend
          aria-label="Fabric layers"
          className="mt-5 lg:absolute lg:right-[var(--gutter)] lg:bottom-16 lg:mt-0 lg:w-[min(30rem,34vw)] lg:border lg:border-white/10 lg:bg-obsidian/60 lg:p-4 lg:backdrop-blur-md"
        >
          <div className="type-label mb-2 flex items-center justify-between gap-4 text-dim">
            <span>Layer index</span>
            <span className="text-accent">{SCENE_LAYERS.length.toString().padStart(2, "0")} plies</span>
          </div>
          <span data-legend-rule aria-hidden className="mb-2 block h-px w-full bg-white/15" />
          <ol className="flex flex-col gap-1 font-mono text-[0.625rem] leading-tight tracking-[0.08em] uppercase sm:text-[0.6875rem]">
            {SCENE_LAYERS.map((layer, i) => (
              <li key={layer.id} data-legend-row className="flex items-center gap-2.5 text-chalk/85">
                <span aria-hidden className="size-2 shrink-0 border border-white/20" style={{ background: layer.color }} />
                <span className="text-accent">L{i + 1}</span>
                <span className="text-dim">—</span>
                <span className="truncate">{layer.fabric}</span>
                <span className="text-dim">—</span>
                <span className="truncate text-dim">{layer.spec}</span>
              </li>
            ))}
          </ol>
        </aside>
      </div>
    </section>
  );
}
