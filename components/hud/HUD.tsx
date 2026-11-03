"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { CHAPTERS, type Chapter } from "@/lib/chapters";
import { onReady, scrollState } from "@/lib/scroll-state";
import { brand, whatsappLink } from "@/lib/store-data";
import { useLenis } from "@/components/providers/SmoothScroll";
import { ChapterDigit } from "./ChapterDigit";
import { TelemetryBar } from "./TelemetryBar";
import { useChapterJump } from "./useChapterJump";

if (typeof window !== "undefined") {
  gsap.registerPlugin(useGSAP);
}

const clampChapter = (i: number) =>
  Number.isFinite(i) ? Math.min(CHAPTERS.length - 1, Math.max(0, Math.round(i))) : 0;

/**
 * Layer 2 — fixed telemetry overlay.
 * Only interactive parts take pointer events; everything else lets the story through.
 */
export function HUD() {
  const rootRef = useRef<HTMLDivElement>(null);
  const topRef = useRef<HTMLElement>(null);
  const bottomRef = useRef<HTMLElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const railFillRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const firstMenuItemRef = useRef<HTMLButtonElement>(null);

  const [chapter, setChapter] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  const lenis = useLenis();
  const { jumpTo, scrollToTop } = useChapterJump();

  /* ── Per-frame: chapter (state only on change) + rail fill (ref) ─────── */
  useEffect(() => {
    let lastChapter = 0;
    let lastFill = -1;
    const tick = () => {
      const c = clampChapter(scrollState.chapter);
      if (c !== lastChapter) {
        lastChapter = c;
        setChapter(c);
      }
      const fill = Math.round(Math.min(1, Math.max(0, scrollState.progress)) * 10000) / 10000;
      if (fill !== lastFill && railFillRef.current) {
        lastFill = fill;
        railFillRef.current.style.transform = `scaleY(${fill})`;
      }
    };
    gsap.ticker.add(tick);
    return () => gsap.ticker.remove(tick);
  }, []);

  /* ── Entrance: hidden until the preloader hands over ─────────────────── */
  useGSAP(
    (_context, contextSafe) => {
      const top = topRef.current;
      const bottom = bottomRef.current;
      const rail = railRef.current;
      if (!top || !bottom || !rail || !contextSafe) return;

      gsap.set(top, { yPercent: -100, autoAlpha: 0 });
      gsap.set(bottom, { yPercent: 100, autoAlpha: 0 });
      gsap.set(rail, { scaleY: 0, transformOrigin: "50% 0%" });
      gsap.set("[data-hud-item]", { autoAlpha: 0, y: 6 });

      const play = contextSafe(() => {
        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const d = reduced ? 0.35 : 1.1;
        gsap
          .timeline({ delay: reduced ? 0.1 : 0.55, defaults: { ease: "expo.out", duration: d } })
          .to(top, { yPercent: 0, autoAlpha: 1 })
          .to(bottom, { yPercent: 0, autoAlpha: 1 }, "<0.08")
          .to(rail, { scaleY: 1, duration: reduced ? 0.35 : 1.4, ease: "expo.inOut" }, "<0.1")
          .to("[data-hud-item]", { autoAlpha: 1, y: 0, stagger: reduced ? 0 : 0.045, duration: d * 0.8 }, "<0.15");
      });

      return onReady(play);
    },
    { scope: rootRef },
  );

  /* ── Mobile menu ─────────────────────────────────────────────────────── */
  const openMenu = useCallback(() => {
    lenis?.stop();
    setMenuOpen(true);
  }, [lenis]);

  const closeMenu = useCallback(() => {
    if (scrollState.ready) lenis?.start();
    setMenuOpen(false);
  }, [lenis]);

  const selectChapter = useCallback(
    (c: Chapter) => {
      closeMenu();
      jumpTo(c);
    },
    [closeMenu, jumpTo],
  );

  useEffect(() => {
    if (!menuOpen) return;
    firstMenuItemRef.current?.focus({ preventScroll: true });

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeMenu();
        menuButtonRef.current?.focus({ preventScroll: true });
      }
    };
    const desktop = window.matchMedia("(min-width: 1024px)");
    const onBreakpoint = () => {
      if (desktop.matches) closeMenu();
    };
    window.addEventListener("keydown", onKey);
    desktop.addEventListener("change", onBreakpoint);
    return () => {
      window.removeEventListener("keydown", onKey);
      desktop.removeEventListener("change", onBreakpoint);
    };
  }, [menuOpen, closeMenu]);

  return (
    <div ref={rootRef} className="pointer-events-none fixed inset-0 z-40 select-none text-chalk">
      {/* ── Mobile chapter overlay ─────────────────────────────────────── */}
      <div
        id="hud-menu"
        role="dialog"
        aria-modal="true"
        aria-label="Chapters"
        aria-hidden={!menuOpen}
        className={`glass fixed inset-0 z-10 flex flex-col transition-[opacity,visibility] duration-500 ease-out-expo lg:hidden ${
          menuOpen ? "pointer-events-auto visible opacity-100" : "pointer-events-none invisible opacity-0"
        }`}
      >
        <div aria-hidden className="absolute inset-0 bg-obsidian/80" />
        <nav aria-label="Chapters" className="gutter-x relative flex flex-1 flex-col justify-center pt-14">
          <p className="type-label mb-6 text-dim">Chapters</p>
          <ol className="flex flex-col">
            {CHAPTERS.map((c, i) => {
              const active = i === chapter;
              return (
                <li
                  key={c.id}
                  className={`transition-[opacity,translate] duration-700 ease-out-expo ${
                    menuOpen ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
                  }`}
                  style={{ transitionDelay: menuOpen ? `${90 + i * 55}ms` : "0ms" }}
                >
                  <button
                    ref={i === 0 ? firstMenuItemRef : undefined}
                    type="button"
                    tabIndex={menuOpen ? 0 : -1}
                    onClick={() => selectChapter(c)}
                    aria-current={active ? "step" : undefined}
                    className="group flex w-full items-baseline gap-5 border-b border-white/10 py-4 text-left"
                  >
                    <span
                      className={`font-display text-6xl leading-[0.85] tabular-nums transition-colors ${
                        active ? "text-accent" : "text-chalk/25 group-hover:text-chalk/60"
                      }`}
                    >
                      {c.index}
                    </span>
                    <span className={`type-label ${active ? "text-chalk" : "text-dim"}`}>{c.label}</span>
                    {active && <span aria-hidden className="ml-auto size-1.5 self-center rounded-full bg-accent" />}
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>
        <div className="gutter-x type-label relative flex items-center justify-between border-t border-white/10 py-5 text-dim">
          <span>{brand.name} — Everyday clothing</span>
          <span>{brand.currency} · COD</span>
        </div>
      </div>

      {/* ── Top bar ────────────────────────────────────────────────────── */}
      <header ref={topRef} className="absolute inset-x-0 top-0 z-20 h-14">
        <div aria-hidden className="absolute inset-0 bg-linear-to-b from-obsidian/70 via-obsidian/25 to-transparent" />
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-px bg-linear-to-r from-transparent via-white/10 to-transparent"
        />

        <div className="gutter-x relative flex h-full items-center justify-between gap-4">
          {/* Logo */}
          <button
            type="button"
            onClick={() => {
              if (menuOpen) closeMenu();
              scrollToTop();
            }}
            aria-label={`${brand.name} — back to top`}
            className="pointer-events-auto flex items-baseline gap-2"
            data-hud-item
          >
            <span className="flex items-baseline font-display text-[1.65rem] leading-none tracking-tight text-chalk">
              Y.M
              <span aria-hidden className="ml-0.5 inline-block size-1.5 rounded-full bg-accent" />
            </span>
            <span className="font-mono text-[0.625rem] tracking-[0.32em] text-dim">STORE</span>
          </button>

          {/* Desktop quick-jump */}
          <nav aria-label="Chapters" className="absolute left-1/2 hidden -translate-x-1/2 lg:block">
            <ol className="flex items-center gap-7 xl:gap-10">
              {CHAPTERS.map((c, i) => {
                const active = i === chapter;
                return (
                  <li key={c.id} data-hud-item>
                    <button
                      type="button"
                      onClick={() => jumpTo(c)}
                      aria-current={active ? "step" : undefined}
                      className={`type-label group pointer-events-auto relative flex items-center gap-2 py-2 transition-colors duration-300 ${
                        active ? "text-chalk" : "text-dim hover:text-chalk"
                      }`}
                    >
                      <span className={active ? "text-accent" : undefined}>{c.index}</span>
                      <span>{c.label}</span>
                      <span
                        aria-hidden
                        className={`absolute inset-x-0 bottom-0.5 h-px origin-left bg-accent transition-transform duration-500 ease-out-expo ${
                          active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-40"
                        }`}
                      />
                    </button>
                  </li>
                );
              })}
            </ol>
          </nav>

          {/* Indicator + order + menu */}
          <div className="flex items-center gap-3 sm:gap-5">
            <div data-hud-item>
              <ChapterDigit chapter={chapter} />
            </div>
            <a
              data-hud-item
              href={whatsappLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="type-label group pointer-events-auto hidden items-center gap-1.5 border border-white/15 px-3 py-1.5 text-chalk transition-colors duration-300 hover:border-accent hover:bg-accent hover:text-obsidian min-[400px]:inline-flex"
            >
              Order
              <ArrowUpRight
                aria-hidden
                strokeWidth={1.5}
                className="size-3 transition-transform duration-300 group-hover:translate-x-px group-hover:-translate-y-px"
              />
            </a>
            <button
              ref={menuButtonRef}
              type="button"
              data-hud-item
              onClick={menuOpen ? closeMenu : openMenu}
              aria-expanded={menuOpen}
              aria-controls="hud-menu"
              aria-label={menuOpen ? "Close chapter menu" : "Open chapter menu"}
              className="pointer-events-auto grid size-9 place-items-center border border-white/15 text-chalk transition-colors hover:border-accent lg:hidden"
            >
              {menuOpen ? <X aria-hidden strokeWidth={1.5} className="size-4" /> : <Menu aria-hidden strokeWidth={1.5} className="size-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* ── Left progress rail (desktop) ───────────────────────────────── */}
      <div
        ref={railRef}
        aria-hidden
        className="absolute top-1/2 left-5 hidden h-[44vh] w-px -translate-y-1/2 md:block lg:left-6"
      >
        <div className="absolute inset-0 bg-white/10" />
        <div ref={railFillRef} className="absolute inset-0 origin-top bg-accent" style={{ transform: "scaleY(0)" }} />
        {CHAPTERS.map((c, i) => (
          <span
            key={c.id}
            className={`absolute left-1/2 h-px -translate-x-1/2 transition-[width,background-color] duration-500 ${
              i === chapter ? "w-3 bg-accent" : i < chapter ? "w-2 bg-chalk/60" : "w-2 bg-white/30"
            }`}
            style={{ top: `${c.range[0] * 100}%` }}
          />
        ))}
        <span className="absolute bottom-0 left-1/2 h-px w-2 -translate-x-1/2 bg-white/30" />
      </div>

      {/* ── Bottom bar ─────────────────────────────────────────────────── */}
      <TelemetryBar barRef={bottomRef} />
    </div>
  );
}
