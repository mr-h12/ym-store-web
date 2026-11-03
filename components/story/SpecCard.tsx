import { Counter } from "./Counter";

export type ConnectorDirection = "down" | "flat" | "up";

export interface SpecCardProps {
  /** "01" … */
  index: string;
  value: number;
  suffix?: string;
  label: string;
  detail: string;
  /** Where the connector line bends toward the cloth (desktop only). */
  connector?: ConnectorDirection;
  className?: string;
}

const CONNECTOR_END: Record<ConnectorDirection, number> = { down: 88, flat: 50, up: 12 };

/**
 * Glass spec card with corner ticks, an accent index, a scrubbed counter and an
 * SVG connector (stroke drawn on scroll by the parent chapter) pointing at the cloth.
 * Timeline hooks: [data-spec-card], [data-connector], [data-connector-dot].
 */
export function SpecCard({ index, value, suffix, label, detail, connector = "flat", className }: SpecCardProps) {
  const endY = CONNECTOR_END[connector];
  return (
    <article data-spec-card className={`relative ${className ?? ""}`}>
      <div className="glass ticks relative isolate grid grid-cols-[auto_1fr] items-start gap-x-4 gap-y-1 rounded-none px-4 py-3 sm:px-5 sm:py-4">
        <span aria-hidden className="absolute inset-0 -z-10 bg-obsidian/55" />
        <span className="type-label pt-1 text-accent">{index}</span>
        <div className="flex min-w-0 flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5">
          <span className="font-display text-[clamp(1.75rem,2.6vw,2.75rem)] leading-none text-chalk uppercase">
            <Counter value={value} suffix={suffix} label={`${value}${suffix ?? ""}`} />
          </span>
          <span className="type-label text-chalk/80">{label}</span>
        </div>
        <p className="col-start-2 max-w-[34ch] text-[0.8125rem] leading-snug text-dim max-sm:hidden [@media(max-height:760px)]:hidden">
          {detail}
        </p>
      </div>

      {/* Connector toward the cloth (right side) */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-full hidden h-[120%] w-[clamp(3rem,13vw,15rem)] -translate-y-1/2 lg:block"
      >
        <svg className="absolute inset-0 h-full w-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
          <path
            data-connector
            d={`M0 50 H38 L72 ${endY} H100`}
            pathLength={1}
            fill="none"
            stroke="var(--accent)"
            strokeWidth={1}
            strokeDasharray="1"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        <span
          data-connector-dot
          className="absolute right-0 block size-2 translate-x-1/2 -translate-y-1/2 rounded-full border border-accent bg-obsidian"
          style={{ top: `${endY}%` }}
        >
          <span className="absolute inset-[2px] rounded-full bg-accent" />
        </span>
      </div>
    </article>
  );
}
