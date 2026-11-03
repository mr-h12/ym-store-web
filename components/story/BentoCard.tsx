import type { ReactNode } from "react";

export interface BentoCardProps {
  /** Mono label in the card header. */
  label: string;
  /** Optional right-aligned header meta (index, tag). */
  meta?: ReactNode;
  children: ReactNode;
  className?: string;
  /** Accent-tinted surface for the hero card of the grid. */
  tone?: "glass" | "accent";
  ticks?: boolean;
  /** Low-priority cell: hidden below the lg breakpoint so the grid fits a phone screen. */
  desktopOnly?: boolean;
}

/**
 * Glass bento cell. Timeline hook: [data-bento] (the chapter flies these in with a 3D tilt).
 */
export function BentoCard({ label, meta, children, className, tone = "glass", ticks = true, desktopOnly = false }: BentoCardProps) {
  const surface =
    tone === "accent"
      ? "border border-accent/60 backdrop-blur-md"
      : "glass";
  // Dark underlay keeps copy legible over bright cloth without hiding it.
  const underlay = tone === "accent" ? "bg-[color-mix(in_srgb,var(--accent)_22%,rgb(8_8_10/0.62))]" : "bg-obsidian/55";
  return (
    <article
      data-bento
      className={`group relative isolate ${desktopOnly ? "hidden lg:flex" : "flex"} min-h-0 flex-col overflow-hidden rounded-none p-3 transition-colors duration-500 hover:border-white/25 sm:p-4 xl:p-5 ${surface} ${ticks ? "ticks" : ""} ${className ?? ""}`}
    >
      <span aria-hidden className={`absolute inset-0 -z-10 ${underlay}`} />
      <header className="flex items-start justify-between gap-3">
        <span className="type-label text-dim transition-colors duration-500 group-hover:text-chalk max-sm:tracking-[0.1em]">{label}</span>
        {meta ? <span className="type-label text-accent">{meta}</span> : null}
      </header>
      <div className="mt-auto flex min-h-0 flex-col pt-1.5 sm:pt-2">{children}</div>
    </article>
  );
}
