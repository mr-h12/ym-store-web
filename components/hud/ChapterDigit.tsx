"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { CHAPTERS } from "@/lib/chapters";

if (typeof window !== "undefined") {
  gsap.registerPlugin(useGSAP);
}

const TOTAL = String(CHAPTERS.length).padStart(2, "0");

/** `0X // 05` chapter indicator; the X digit rolls vertically when the chapter changes. */
export function ChapterDigit({ chapter }: { chapter: number }) {
  const columnRef = useRef<HTMLSpanElement>(null);
  const firstRun = useRef(true);

  useGSAP(
    () => {
      const col = columnRef.current;
      if (!col) return;
      const yPercent = (-100 * chapter) / CHAPTERS.length;
      if (firstRun.current) {
        firstRun.current = false;
        gsap.set(col, { yPercent });
        return;
      }
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      gsap.to(col, {
        yPercent,
        duration: reduced ? 0 : 0.75,
        ease: "expo.out",
        overwrite: true,
      });
    },
    { dependencies: [chapter] },
  );

  return (
    <div className="flex items-center font-mono text-[0.8125rem] leading-none tracking-[0.12em] tabular-nums">
      <span className="sr-only">
        Chapter {chapter + 1} of {CHAPTERS.length}
      </span>
      <span aria-hidden className="flex items-center">
        <span className="text-chalk">0</span>
        <span className="relative inline-block h-[1.25em] overflow-hidden">
          <span ref={columnRef} className="flex flex-col text-accent will-change-transform">
            {CHAPTERS.map((c) => (
              <span key={c.id} className="block h-[1.25em] leading-[1.25em]">
                {c.index.slice(-1)}
              </span>
            ))}
          </span>
        </span>
        <span className="mx-2 text-dim">{"//"}</span>
        <span className="text-dim">{TOTAL}</span>
      </span>
    </div>
  );
}
