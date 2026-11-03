"use client";

import { useRef, type ReactNode } from "react";
import { gsap, useGSAP } from "./gsap";

export interface MagneticLinkProps {
  href: string;
  children: ReactNode;
  icon?: ReactNode;
  variant?: "primary" | "ghost";
  className?: string;
  external?: boolean;
  ariaLabel?: string;
}

/**
 * CTA link with a magnetic pull (gsap.quickTo toward the pointer) and an
 * accent fill sweep on hover. Magnetism only on fine pointers without reduced motion.
 */
export function MagneticLink({
  href,
  children,
  icon,
  variant = "ghost",
  className,
  external = true,
  ariaLabel,
}: MagneticLinkProps) {
  const ref = useRef<HTMLAnchorElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const inner = el.querySelector<HTMLElement>("[data-magnetic-inner]");
      const mm = gsap.matchMedia();
      mm.add("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)", () => {
        const xTo = gsap.quickTo(el, "x", { duration: 0.6, ease: "power3" });
        const yTo = gsap.quickTo(el, "y", { duration: 0.6, ease: "power3" });
        const ixTo = inner ? gsap.quickTo(inner, "x", { duration: 0.6, ease: "power3" }) : null;
        const iyTo = inner ? gsap.quickTo(inner, "y", { duration: 0.6, ease: "power3" }) : null;

        const move = (e: PointerEvent) => {
          const r = el.getBoundingClientRect();
          const dx = e.clientX - (r.left + r.width / 2);
          const dy = e.clientY - (r.top + r.height / 2);
          xTo(dx * 0.28);
          yTo(dy * 0.38);
          ixTo?.(dx * 0.12);
          iyTo?.(dy * 0.16);
        };
        const leave = () => {
          xTo(0);
          yTo(0);
          ixTo?.(0);
          iyTo?.(0);
        };

        el.addEventListener("pointermove", move);
        el.addEventListener("pointerleave", leave);
        return () => {
          el.removeEventListener("pointermove", move);
          el.removeEventListener("pointerleave", leave);
          gsap.set(inner ? [el, inner] : el, { clearProps: "transform" });
        };
      });
      return () => mm.revert();
    },
    { scope: ref },
  );

  const isPrimary = variant === "primary";
  const base = isPrimary
    ? "bg-accent text-obsidian border-accent"
    : "bg-white/[0.03] text-chalk border-white/20 backdrop-blur-md hover:border-accent";
  const sweep = isPrimary ? "bg-chalk" : "bg-accent";

  return (
    <a
      ref={ref}
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      aria-label={ariaLabel}
      className={`group relative inline-flex items-center justify-center overflow-hidden rounded-none border transition-colors duration-500 ${base} ${className ?? ""}`}
    >
      <span
        aria-hidden
        className={`absolute inset-0 origin-left scale-x-0 transition-transform duration-700 ease-cine group-hover:scale-x-100 group-focus-visible:scale-x-100 ${sweep}`}
      />
      <span
        data-magnetic-inner
        className={`relative z-10 inline-flex items-center gap-3 transition-colors duration-500 ${isPrimary ? "" : "group-hover:text-obsidian group-focus-visible:text-obsidian"}`}
      >
        {icon ? <span className="text-[1.15em]">{icon}</span> : null}
        <span>{children}</span>
      </span>
    </a>
  );
}
