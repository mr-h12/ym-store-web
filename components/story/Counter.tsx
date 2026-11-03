"use client";

import { useRef } from "react";
import { gsap, ScrollTrigger, useGSAP } from "./gsap";

export const COUNTER_ATTR = "data-counter";

export interface CounterProps {
  value: number;
  prefix?: string;
  suffix?: string;
  /** Zero-pad the integer part to this many digits ("06"). */
  pad?: number;
  /** Thousands separators (1,500). */
  separator?: boolean;
  /**
   * "scrub" (default): the parent timeline animates it via `counterTween()`.
   * "enter": animates by itself once when it scrolls into view.
   */
  mode?: "scrub" | "enter";
  className?: string;
  /** Accessible label read instead of the ticking digits. */
  label?: string;
}

export function formatCounter(n: number, opts: Pick<CounterProps, "prefix" | "suffix" | "pad" | "separator">): string {
  const rounded = Math.round(n);
  let digits = opts.separator ? rounded.toLocaleString("en-US") : String(rounded);
  if (opts.pad && digits.length < opts.pad) digits = digits.padStart(opts.pad, "0");
  return `${opts.prefix ?? ""}${digits}${opts.suffix ?? ""}`;
}

function readOpts(el: HTMLElement) {
  return {
    value: Number(el.dataset.value ?? 0),
    prefix: el.dataset.prefix ?? "",
    suffix: el.dataset.suffix ?? "",
    pad: el.dataset.pad ? Number(el.dataset.pad) : undefined,
    separator: el.dataset.separator === "true",
  };
}

/**
 * A tween that counts `el` (a <Counter>) from 0 to its value. Add it to a scrubbed
 * timeline: `tl.add(counterTween(el, 0.25), 0.1)`.
 */
export function counterTween(el: HTMLElement, duration = 1): gsap.core.Tween {
  const opts = readOpts(el);
  const target = el.querySelector<HTMLElement>("[data-counter-value]") ?? el;
  const state = { n: 0 };
  target.textContent = formatCounter(0, opts);
  return gsap.fromTo(
    state,
    { n: 0 },
    {
      n: opts.value,
      duration,
      ease: "power2.out",
      immediateRender: true,
      onUpdate: () => {
        target.textContent = formatCounter(state.n, opts);
      },
    },
  );
}

/** Animated number with tabular figures. SSR renders the final value. */
export function Counter({
  value,
  prefix,
  suffix,
  pad,
  separator,
  mode = "scrub",
  className,
  label,
}: CounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const finalText = formatCounter(value, { prefix, suffix, pad, separator });

  useGSAP(
    () => {
      const el = ref.current;
      if (!el || mode !== "enter") return;
      const tween = counterTween(el, 1.6);
      tween.pause(0);
      ScrollTrigger.create({
        trigger: el,
        start: "top 88%",
        once: true,
        pinnedContainer: el.closest("section") ?? undefined,
        onEnter: () => {
          tween.play(0);
        },
      });
    },
    { scope: ref, dependencies: [value, mode] },
  );

  return (
    <span
      ref={ref}
      className={`tabular-nums ${className ?? ""}`}
      {...{ [COUNTER_ATTR]: "" }}
      data-value={value}
      data-prefix={prefix}
      data-suffix={suffix}
      data-pad={pad}
      data-separator={separator ? "true" : undefined}
    >
      <span className="sr-only">{label ?? finalText}</span>
      <span data-counter-value aria-hidden>
        {finalText}
      </span>
    </span>
  );
}
