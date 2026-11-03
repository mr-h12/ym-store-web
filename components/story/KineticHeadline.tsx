"use client";

import { Fragment, useRef, type CSSProperties, type ReactNode } from "react";
import { onReady } from "@/lib/scroll-state";
import { gsap, SplitText, useGSAP } from "./gsap";
import { registerVelocitySkew } from "./velocity";

export const KH_CHAR = "kh-char";
export const KH_LINE = "kh-line";

type HeadlineTag = "h1" | "h2" | "h3" | "p" | "div";

export interface KineticHeadlineProps {
  /** One entry per visual line. */
  lines: readonly string[];
  as?: HeadlineTag;
  /** Type class, e.g. "type-display" or "type-h2". */
  className?: string;
  style?: CSSProperties;
  /** Characters to render in the accent colour (e.g. "./"). */
  accent?: string;
  /**
   * "scrub" (default): the parent chapter drives the reveal in its pinned timeline,
   *   targeting the split chars via `headlineChars(container)`.
   * "play": the headline hides itself and plays its own reveal once the experience is ready.
   */
  mode?: "scrub" | "play";
  /** Delay (s) before the "play" reveal starts after ready. */
  delay?: number;
  /** Per-char stagger (s) for the "play" reveal. */
  stagger?: number;
  /** Velocity skew on/off (always off under prefers-reduced-motion). */
  skew?: boolean;
  id?: string;
}

/** The split characters of every KineticHeadline inside `scope` (document order). */
export function headlineChars(scope: Element | null): HTMLElement[] {
  if (!scope) return [];
  return Array.from(scope.querySelectorAll<HTMLElement>(`.${KH_CHAR}`));
}

function renderLine(line: string, accent: string | undefined, lineIndex: number): ReactNode {
  if (!accent) return line;
  const out: ReactNode[] = [];
  let buffer = "";
  Array.from(line).forEach((ch, i) => {
    if (accent.includes(ch)) {
      if (buffer) out.push(buffer);
      buffer = "";
      out.push(
        <span key={`${lineIndex}-${i}`} className="text-accent">
          {ch}
        </span>,
      );
    } else {
      buffer += ch;
    }
  });
  if (buffer) out.push(buffer);
  return out;
}

/**
 * Brutalist kinetic headline: SplitText line-masked char reveal + shared velocity skew.
 */
export function KineticHeadline({
  lines,
  as: Tag = "h2",
  className = "type-h2",
  style,
  accent,
  mode = "scrub",
  delay = 0,
  stagger = 0.035,
  skew = true,
  id,
}: KineticHeadlineProps) {
  const ref = useRef<HTMLHeadingElement>(null);

  useGSAP(
    (context) => {
      const el = ref.current;
      if (!el) return;

      const split = SplitText.create(el, {
        type: "lines,chars",
        mask: "lines",
        linesClass: KH_LINE,
        charsClass: KH_CHAR,
        aria: "auto",
      });

      // Give the line masks some head/foot room: Anton caps are taller than the tight
      // display line-height, so a bare mask would shave the top of the glyphs.
      gsap.set(split.masks, {
        paddingTop: "0.12em",
        marginTop: "-0.12em",
        paddingBottom: "0.06em",
        marginBottom: "-0.06em",
      });

      let offReady: (() => void) | undefined;
      if (mode === "play") {
        gsap.set(split.chars, { yPercent: 118 });
        offReady = onReady(() => {
          context.add(() => {
            gsap.to(split.chars, {
              yPercent: 0,
              duration: 1.5,
              ease: "expo.out",
              stagger,
              delay,
            });
          });
        });
      }

      const mm = gsap.matchMedia();
      if (skew) {
        mm.add("(prefers-reduced-motion: no-preference)", () => {
          gsap.set(el, { transformOrigin: "0% 60%" });
          return registerVelocitySkew(el);
        });
      }

      return () => {
        offReady?.();
        mm.revert();
        if (split.isSplit) split.revert();
      };
    },
    { scope: ref },
  );

  return (
    <Tag ref={ref} id={id} className={className} style={style}>
      {lines.map((line, i) => (
        <Fragment key={i}>
          {i > 0 && <br />}
          {renderLine(line, accent, i)}
        </Fragment>
      ))}
    </Tag>
  );
}
