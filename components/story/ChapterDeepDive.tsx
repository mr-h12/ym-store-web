"use client";

import { useRef, useState } from "react";
import { CHAPTERS, COPY } from "@/lib/chapters";
import { FOCUS_LAYER_INDEX, SCENE_LAYERS } from "@/lib/scene-config";
import { fitNotes } from "@/lib/store-data";
import { useGSAP } from "./gsap";
import { KineticHeadline, headlineChars } from "./KineticHeadline";
import { $all, PHASE, chapterTimeline } from "./layout";

const chapter = CHAPTERS[2];
const FITS = COPY.deepdive.fits;
const focusLayer = SCENE_LAYERS[FOCUS_LAYER_INDEX];
const focusSpec = focusLayer.spec.split("·")[0]?.trim() ?? focusLayer.spec;
const READOUT = `Focus: L${FOCUS_LAYER_INDEX + 1} ${focusLayer.fabric} · ${focusLayer.weave} weave · ${focusSpec}`;
const MAGNIFICATION = (CHAPTERS[0].scene.camZ / chapter.scene.camZ).toFixed(1);

export function ChapterDeepDive() {
  const sectionRef = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  const activeRef = useRef(0);

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
      const pills = $all(section, "[data-fit-pill]");
      const note = $all(section, "[data-fit-note]");
      const reticle = $all(section, "[data-reticle]");
      const scan = $all(section, "[data-scan]");
      const readout = $all(section, "[data-readout]");
      const cross = $all(section, "[data-cross]");
      const chars = headlineChars(section);

      // ── Reveal
      tl.fromTo(scrim, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.14 }, 0)
        .fromTo(reticle, { autoAlpha: 0, scale: 1.25 }, { autoAlpha: 1, scale: 1, duration: 0.16, ease: "power3.out" }, 0.02)
        .fromTo(cross, { scaleX: 0, scaleY: 0 }, { scaleX: 1, scaleY: 1, duration: 0.1, ease: "power2.out" }, 0.1)
        .fromTo(eyebrow, { autoAlpha: 0, x: 24 }, { autoAlpha: 1, x: 0, duration: 0.08, ease: "power2.out" }, 0.03)
        .fromTo(chars, { yPercent: 118 }, { yPercent: 0, duration: 0.13, stagger: 0.012, ease: "power3.out" }, 0.04)
        .fromTo(body, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.1, ease: "power2.out" }, 0.12)
        .fromTo(pills, { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 0.07, stagger: 0.025, ease: "power2.out" }, 0.16)
        .fromTo(note, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.08 }, 0.22)
        .fromTo(
          readout,
          { clipPath: "inset(0% 100% 0% 0%)" },
          { clipPath: "inset(0% 0% 0% 0%)", duration: 0.14, ease: "steps(24)" },
          0.14,
        );

      // ── Hold: the scan line sweeps the weave while the fits highlight in sequence.
      tl.fromTo(scan, { yPercent: 0 }, { yPercent: 100, duration: E - R, ease: "sine.inOut" }, R);
      const cycle = { i: 0 };
      tl.fromTo(
        cycle,
        { i: 0 },
        {
          i: FITS.length - 0.001,
          duration: E - 0.04 - R,
          onUpdate: () => {
            const next = Math.min(FITS.length - 1, Math.floor(cycle.i));
            if (next !== activeRef.current) {
              activeRef.current = next;
              setActive(next);
            }
          },
        },
        R,
      );

      // ── Exit
      tl.to(chars, { yPercent: -118, duration: 0.1, stagger: 0.006, ease: "power2.in" }, E)
        .to(content, { autoAlpha: 0, y: -56, duration: 0.17, ease: "power1.in" }, E + 0.03)
        .to(reticle, { autoAlpha: 0, scale: 0.85, duration: 0.15, ease: "power1.in" }, E + 0.02)
        .to(scrim, { autoAlpha: 0, duration: 0.15 }, E + 0.05);
    },
    { scope: sectionRef },
  );

  const choose = (i: number) => {
    activeRef.current = i;
    setActive(i);
  };

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
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[72%] bg-linear-to-t from-obsidian/90 via-obsidian/60 to-transparent lg:inset-y-0 lg:right-0 lg:left-auto lg:h-full lg:w-[62%] lg:bg-linear-to-l lg:from-obsidian/90 lg:via-obsidian/70 lg:to-transparent"
      />

      {/* Focus reticle over the linen close-up (cloth sits left) */}
      <div
        data-reticle
        aria-hidden
        className="ticks pointer-events-none absolute top-[13svh] left-[8%] h-[30svh] w-[84%] lg:top-[19svh] lg:left-[7%] lg:h-[54svh] lg:w-[34vw]"
        style={{ ["--tick" as string]: "22px" }}
      >
        <div className="absolute inset-0 overflow-hidden">
          <div data-scan className="absolute inset-0">
            <span className="absolute inset-x-0 top-0 block h-px bg-accent/80 shadow-[0_0_14px_2px_rgba(196,98,45,0.45)]" />
          </div>
        </div>
        <span data-cross className="absolute top-1/2 left-1/2 block h-px w-8 -translate-x-1/2 bg-white/50" />
        <span data-cross className="absolute top-1/2 left-1/2 block h-8 w-px -translate-y-1/2 bg-white/50" />
        <span className="type-label absolute -top-6 left-0 text-dim">
          Mag <span className="text-chalk">×{MAGNIFICATION}</span>
        </span>
        <span className="type-label absolute -top-6 right-0 text-dim">
          L{FOCUS_LAYER_INDEX + 1} <span className="text-accent">●</span>
        </span>
        <p
          data-readout
          className="absolute top-full left-0 mt-3 font-mono text-[0.625rem] tracking-[0.16em] whitespace-nowrap text-chalk uppercase max-lg:hidden"
        >
          {READOUT}
        </p>
      </div>

      <div data-content className="gutter-x relative flex h-full flex-col justify-end pt-[72px] pb-16 lg:justify-center">
        <div className="relative isolate flex flex-col lg:ml-auto lg:w-[44%] lg:max-w-[40rem] lg:border lg:border-white/10 lg:p-8 lg:backdrop-blur-md">
          <span aria-hidden className="absolute inset-0 -z-10 hidden bg-obsidian/55 lg:block" />
          <p data-eyebrow className="type-label flex items-center gap-2.5 text-chalk">
            <span className="text-accent">{chapter.index}</span>
            <span aria-hidden className="h-px w-6 bg-white/30" />
            {COPY.deepdive.eyebrow}
          </p>

          <div className="mt-3 lg:mt-5">
            <KineticHeadline id={`${chapter.id}-title`} lines={COPY.deepdive.title} accent="." className="type-h2 text-chalk" />
          </div>

          <p data-body className="mt-3 max-w-[48ch] text-dim max-sm:line-clamp-4 max-sm:text-[0.875rem] max-sm:leading-snug lg:mt-5">
            {COPY.deepdive.body}
          </p>

          {/* Fit selector — scrubbed by scroll, clickable too */}
          <div className="mt-5 lg:mt-7">
            <div className="type-label mb-2.5 flex items-center justify-between text-dim">
              <span>Fit</span>
              <span>
                <span className="text-chalk">{String(active + 1).padStart(2, "0")}</span> / {String(FITS.length).padStart(2, "0")}
              </span>
            </div>
            <div role="group" aria-label="Fits" className="grid grid-cols-4 gap-1.5">
              {FITS.map((fit, i) => {
                const on = i === active;
                return (
                  <button
                    key={fit}
                    type="button"
                    data-fit-pill
                    aria-pressed={on}
                    onClick={() => choose(i)}
                    className={`type-label relative overflow-hidden rounded-none border px-1 py-2.5 text-center transition-colors duration-500 max-sm:tracking-[0.06em] ${
                      on ? "border-accent bg-accent text-obsidian" : "border-white/15 bg-white/[0.03] text-dim hover:border-white/40 hover:text-chalk"
                    }`}
                  >
                    {fit}
                  </button>
                );
              })}
            </div>
            <div data-fit-note className="mt-3 grid min-h-[2.8em] border-l border-accent pl-3" aria-live="polite">
              {FITS.map((fit, i) => (
                <p
                  key={fit}
                  aria-hidden={i !== active}
                  className={`col-start-1 row-start-1 text-[0.875rem] leading-snug text-chalk/90 transition-[opacity,transform] duration-500 ease-out-expo ${
                    i === active ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-2 opacity-0"
                  }`}
                >
                  <span className="type-label mr-2 text-accent">{fit}</span>
                  {fitNotes[fit]}
                </p>
              ))}
            </div>
          </div>

          <p className="mt-4 font-mono text-[0.5625rem] tracking-[0.14em] text-dim uppercase lg:hidden">{READOUT}</p>
        </div>
      </div>
    </section>
  );
}
