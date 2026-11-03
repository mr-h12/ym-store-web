"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { scrollState } from "@/lib/scroll-state";
import { brand, policies } from "@/lib/store-data";

if (typeof window !== "undefined") {
  gsap.registerPlugin(useGSAP);
}

const MARQUEE_FACTS = [
  "Heavy cotton 240 GSM",
  "Washed linen",
  "Extra-fine merino",
  `Delivery ${policies.deliveryDaysMin}–${policies.deliveryDaysMax} days`,
  `Free over ${brand.currency} ${policies.freeShippingThreshold.toLocaleString("en-US")}`,
  `${policies.returnsWindowDays}-day returns`,
  "Cash on delivery",
  brand.instagramHandle,
];

/* ── Formatters (fixed width so the readouts don't jitter) ─────────────── */

const fmtPercent = (p: number) => `${(Math.min(1, Math.max(0, p)) * 100).toFixed(1).padStart(5, "0")}%`;

const fmtSignedPadded = (v: number) => {
  const r = Math.min(99.99, Math.abs(Math.round(v * 100) / 100));
  return `${v < 0 && r > 0 ? "-" : "+"}${r.toFixed(2).padStart(5, "0")}`;
};

const fmtCoord = (v: number) => {
  const r = Math.round(v * 100) / 100;
  return `${r < 0 ? "-" : ""}${Math.abs(r).toFixed(2)}`;
};

interface ReadoutProps {
  label: string;
  initial: string;
  valueRef?: React.Ref<HTMLSpanElement>;
  className?: string;
}

function Readout({ label, initial, valueRef, className = "" }: ReadoutProps) {
  return (
    <div data-hud-item className={`items-baseline gap-2 whitespace-nowrap ${className}`}>
      <span className="text-dim">{label}</span>
      <span
        ref={valueRef}
        className="text-chalk tabular-nums transition-colors duration-500 data-[active=true]:text-accent"
      >
        {initial}
      </span>
    </div>
  );
}

/**
 * Bottom HUD bar: full-width progress line, live telemetry readouts and a slow
 * brand-facts marquee. All live values are written straight to the DOM from
 * `gsap.ticker` — no React state per frame.
 */
export function TelemetryBar({ barRef }: { barRef: React.Ref<HTMLElement> }) {
  const fillRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLSpanElement>(null);
  const velRef = useRef<HTMLSpanElement>(null);
  const camRef = useRef<HTMLSpanElement>(null);
  const explodeRef = useRef<HTMLSpanElement>(null);
  const focusRef = useRef<HTMLSpanElement>(null);
  const fpsRef = useRef<HTMLSpanElement>(null);
  const marqueeRef = useRef<HTMLDivElement>(null);

  // Per-frame telemetry.
  useEffect(() => {
    const last = new Map<HTMLElement, string>();
    const write = (el: HTMLElement | null, text: string) => {
      if (!el || last.get(el) === text) return;
      last.set(el, text);
      el.textContent = text;
    };

    let lastFill = -1;
    let lastFocusActive: boolean | null = null;
    let fpsFrames = 0;
    let fpsTime = 0;

    const tick = (_time: number, deltaTime: number) => {
      const { progress, velocity, camera, scene } = scrollState;

      const fill = Math.round(progress * 10000) / 10000;
      if (fill !== lastFill && fillRef.current) {
        lastFill = fill;
        fillRef.current.style.transform = `scaleX(${fill})`;
      }

      write(scrollRef.current, fmtPercent(progress));
      write(velRef.current, fmtSignedPadded(velocity));
      write(camRef.current, `X ${fmtCoord(camera.x)} Y ${fmtCoord(camera.y)} Z ${fmtCoord(camera.z)}`);
      write(explodeRef.current, Math.max(0, scene.explode).toFixed(2));
      write(focusRef.current, `L${Math.round(scene.focusLayer) + 1}`);

      const focusActive = scene.focus > 0.5;
      if (focusActive !== lastFocusActive && focusRef.current) {
        lastFocusActive = focusActive;
        focusRef.current.dataset.active = String(focusActive);
      }

      fpsFrames += 1;
      fpsTime += deltaTime;
      if (fpsTime >= 500) {
        write(fpsRef.current, String(Math.min(999, Math.round((fpsFrames * 1000) / fpsTime))).padStart(3, "0"));
        fpsFrames = 0;
        fpsTime = 0;
      }
    };

    gsap.ticker.add(tick);
    return () => gsap.ticker.remove(tick);
  }, []);

  // Marquee drift.
  useGSAP(() => {
    const track = marqueeRef.current;
    if (!track) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.to(track, { xPercent: -50, duration: 70, ease: "none", repeat: -1 });
  });

  const marqueeCopy = (hidden: boolean) => (
    <span aria-hidden={hidden || undefined} className="flex shrink-0 items-center">
      {MARQUEE_FACTS.map((fact) => (
        <span key={fact} className="flex items-center">
          <span className="px-4">{fact}</span>
          <span className="text-accent/60">—</span>
        </span>
      ))}
    </span>
  );

  return (
    <footer ref={barRef} className="pointer-events-none absolute inset-x-0 bottom-0 h-12">
      <div aria-hidden className="absolute inset-0 bg-linear-to-t from-obsidian/75 via-obsidian/30 to-transparent" />

      {/* Progress line */}
      <div aria-hidden className="absolute inset-x-0 top-0 h-px bg-white/10">
        <div
          ref={fillRef}
          className="absolute inset-0 origin-left bg-accent shadow-[0_0_8px_rgb(196_98_45/0.6)]"
          style={{ transform: "scaleX(0)" }}
        />
      </div>

      <div className="gutter-x type-label relative flex h-full items-center gap-5 lg:gap-6">
        <div className="flex shrink-0 items-center gap-5 lg:gap-6" aria-label="Live telemetry" role="group">
          <Readout label="Scroll" initial="000.0%" valueRef={scrollRef} className="flex" />
          <Readout label="Vel" initial="+00.00" valueRef={velRef} className="flex" />
          <Readout label="Cam" initial="X 0.00 Y 0.00 Z 0.00" valueRef={camRef} className="hidden lg:flex" />
          <Readout label="Explode" initial="0.00" valueRef={explodeRef} className="hidden md:flex" />
          <Readout label="Focus" initial="L2" valueRef={focusRef} className="hidden lg:flex" />
          <div data-hud-item className="hidden items-baseline gap-2 whitespace-nowrap xl:flex">
            <span className="text-dim">Lat</span>
            <span className="text-chalk tabular-nums">30.04 N</span>
            <span className="text-dim">· Lon</span>
            <span className="text-chalk tabular-nums">31.24 E</span>
          </div>
          <div data-hud-item className="hidden items-baseline gap-2 whitespace-nowrap md:flex">
            <span className="text-chalk">{brand.currency}</span>
            <span className="text-accent">·</span>
            <span className="text-chalk">COD</span>
          </div>
          <Readout label="FPS" initial="060" valueRef={fpsRef} className="hidden sm:flex" />
        </div>

        <div
          className="relative min-w-0 flex-1 overflow-hidden text-dim/70"
          style={{
            maskImage: "linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent)",
            WebkitMaskImage: "linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent)",
          }}
        >
          <div ref={marqueeRef} data-hud-item className="flex w-max whitespace-nowrap will-change-transform">
            {marqueeCopy(false)}
            {marqueeCopy(true)}
          </div>
        </div>
      </div>
    </footer>
  );
}
