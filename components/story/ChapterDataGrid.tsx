"use client";

import { useRef } from "react";
import { CHAPTERS, COPY } from "@/lib/chapters";
import {
  brand,
  categories,
  featured,
  formatPrice,
  policies,
  stats,
  trustPoints,
  whatsappLink,
  type Product,
} from "@/lib/store-data";
import { BentoCard } from "./BentoCard";
import { Counter, counterTween } from "./Counter";
import { gsap, useGSAP } from "./gsap";
import { KineticHeadline, headlineChars } from "./KineticHeadline";
import { $all, PHASE, chapterTimeline } from "./layout";

const chapter = CHAPTERS[3];
const help = trustPoints[3];
const cityCount = brand.deliveryCities.length;

const STATS = [
  { value: stats.categoryCount, label: "Categories" },
  { value: stats.productCount, label: "Pieces" },
  { value: stats.newInCount, label: "New in" },
  { value: stats.colourCount, label: "Colours" },
] as const;

const statSize = "font-display uppercase leading-[0.9] text-chalk text-[clamp(2rem,min(4.2vw,7svh),4.75rem)]";

function FeaturedCard({ product, index, className }: { product: Product; index: number; className: string }) {
  return (
    <BentoCard
      label={`Featured · ${String(index + 1).padStart(2, "0")}`}
      meta={product.isNew ? <span className="border border-accent px-1.5 py-0.5 text-[0.95em] text-accent">New</span> : null}
      className={className}
    >
      <div className="flex min-h-0 flex-col gap-1.5 lg:gap-2.5">
        <div aria-hidden className="relative mb-1 hidden h-[clamp(2rem,9svh,9rem)] overflow-hidden border border-white/10 lg:block">
          {product.colours.map((c, i) => (
            <span
              key={c.name}
              className="absolute inset-y-0 block"
              style={{
                left: `${(i / product.colours.length) * 100}%`,
                width: `${100 / product.colours.length}%`,
                background: `linear-gradient(160deg, ${c.hex}, color-mix(in srgb, ${c.hex} 55%, #08080a))`,
              }}
            />
          ))}
          <span className="type-label absolute bottom-2 left-2 text-chalk mix-blend-difference">{product.category}</span>
        </div>
        <h3 className="type-h3 text-chalk max-sm:text-[1rem]">{product.name}</h3>
        <p className="text-[0.8125rem] leading-snug text-dim max-lg:hidden [@media(max-height:820px)]:hidden">{product.material}</p>
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <span className="type-label text-dim max-sm:hidden">{product.fit} fit</span>
          <span className="font-mono text-[0.8125rem] text-chalk tabular-nums">{formatPrice(product.price)}</span>
        </div>
        <ul className="flex items-center gap-1.5 max-sm:hidden" aria-label="Colours">
          {product.colours.map((c) => (
            <li key={c.name} title={c.name} className="size-3.5 border border-white/25" style={{ background: c.hex }}>
              <span className="sr-only">{c.name}</span>
            </li>
          ))}
          <li className="type-label ml-1 text-dim max-sm:hidden">{product.colours.length} col.</li>
        </ul>
      </div>
    </BentoCard>
  );
}

export function ChapterDataGrid() {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const section = sectionRef.current;
      if (!section) return;

      const tl = chapterTimeline(section, chapter.id);
      const E = PHASE.exitStart;

      const scrim = $all(section, "[data-scrim]");
      const header = $all(section, "[data-header-item]");
      const cards = $all(section, "[data-bento]");
      const counters = $all(section, "[data-counter]");
      const marquee = $all(section, "[data-marquee]");
      const track = $all(section, "[data-marquee-track]");
      const chars = headlineChars(section);

      // ── Reveal: cards fly in from depth with a slight 3D tilt.
      tl.fromTo(scrim, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.14 }, 0)
        .fromTo(header, { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.08, stagger: 0.02, ease: "power2.out" }, 0.01)
        .fromTo(chars, { yPercent: 118 }, { yPercent: 0, duration: 0.12, stagger: 0.01, ease: "power3.out" }, 0.02)
        .fromTo(
          cards,
          {
            autoAlpha: 0,
            y: 140,
            z: -260,
            rotateX: 30,
            rotateY: (i: number) => (i % 2 ? -14 : 14),
            transformPerspective: 1400,
            transformOrigin: "50% 100%",
          },
          { autoAlpha: 1, y: 0, z: 0, rotateX: 0, rotateY: 0, duration: 0.13, stagger: 0.015, ease: "power3.out" },
          0.05,
        )
        .fromTo(marquee, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.08 }, 0.2);
      counters.forEach((el, i) => tl.add(counterTween(el, 0.12), 0.12 + i * 0.012));

      // ── Exit: cards lift off and tip away.
      tl.to(chars, { yPercent: -118, duration: 0.1, stagger: 0.005, ease: "power2.in" }, E)
        .to(header, { autoAlpha: 0, y: -30, duration: 0.1, ease: "power1.in" }, E + 0.02)
        .to(
          cards,
          { autoAlpha: 0, y: -120, rotateX: -22, z: -120, duration: 0.11, stagger: 0.008, ease: "power2.in" },
          E + 0.02,
        )
        .to(marquee, { autoAlpha: 0, duration: 0.08 }, E + 0.04)
        .to(scrim, { autoAlpha: 0, duration: 0.14 }, E + 0.06);

      // Endless category marquee (independent of scroll).
      gsap.fromTo(track, { xPercent: 0 }, { xPercent: -50, duration: 38, ease: "none", repeat: -1 });
    },
    { scope: sectionRef },
  );

  const [a, b] = featured;

  return (
    <section
      ref={sectionRef}
      id={chapter.anchor}
      aria-labelledby={`${chapter.id}-title`}
      className="relative h-svh w-full overflow-hidden"
    >
      <div data-scrim aria-hidden className="pointer-events-none absolute inset-0 bg-linear-to-b from-obsidian/75 via-obsidian/35 to-obsidian/75" />

      <div className="gutter-x relative flex h-full flex-col gap-3 pt-[72px] pb-16 lg:gap-4">
        {/* Header */}
        <div className="flex items-end justify-between gap-6">
          <div>
            <p data-header-item className="type-label flex items-center gap-2.5 text-chalk">
              <span className="text-accent">{chapter.index}</span>
              <span aria-hidden className="h-px w-6 bg-white/30" />
              {COPY.data.eyebrow}
            </p>
            <div className="mt-2 lg:mt-3">
              <KineticHeadline
                id={`${chapter.id}-title`}
                lines={COPY.data.title}
                accent="."
                className="type-h2 text-chalk"
                style={{ fontSize: "clamp(2.25rem, min(5.2vw, 9svh), 5.75rem)" }}
              />
            </div>
          </div>
          <dl data-header-item className="type-label hidden grid-cols-[auto_auto] gap-x-4 gap-y-1 text-right md:grid">
            <dt className="text-dim">Cities</dt>
            <dd className="text-chalk">
              {cityCount} <span className="text-dim">· {brand.deliveryCities.slice(0, 3).join(" · ")} +{cityCount - 3}</span>
            </dd>
            <dt className="text-dim">No delivery</dt>
            <dd className="text-chalk">{policies.noDeliveryDay}</dd>
            <dt className="text-dim">Currency</dt>
            <dd className="text-accent">{brand.currency}</dd>
          </dl>
        </div>

        {/* Bento */}
        <div
          className="grid min-h-0 flex-1 grid-cols-2 grid-rows-[repeat(3,minmax(0,1fr))_minmax(0,1.2fr)] gap-2 sm:gap-3 lg:grid-cols-4 lg:grid-rows-[repeat(3,minmax(0,1fr))]"
          style={{ perspective: "1400px" }}
        >
          {a ? <FeaturedCard product={a} index={0} className="col-start-1 row-start-4 lg:col-start-1 lg:row-span-2 lg:row-start-1" /> : null}

          <BentoCard label="Delivery" meta="01" className="col-start-1 row-start-1 lg:col-start-2 lg:row-start-1">
            <span className={statSize}>
              {policies.deliveryDaysMin}–{policies.deliveryDaysMax}
            </span>
            <span className="type-label mt-1.5 text-dim">Working days</span>
          </BentoCard>

          <BentoCard label="Free delivery" meta="02" tone="accent" className="col-start-2 row-start-1 lg:col-start-3 lg:row-start-1">
            <span className="type-label text-chalk/80">Over</span>
            <span className={statSize}>
              <Counter value={policies.freeShippingThreshold} prefix={`${brand.currency} `} separator />
            </span>
            <span className="type-label mt-1.5 text-chalk/70 max-sm:hidden">Otherwise {formatPrice(policies.shippingFee)}</span>
          </BentoCard>

          <BentoCard label="Returns" meta="03" className="col-start-1 row-start-2 lg:col-start-4 lg:row-start-1">
            <span className={statSize}>
              <Counter value={policies.returnsWindowDays} suffix="-day" />
            </span>
            <span className="type-label mt-1.5 text-dim max-sm:tracking-[0.08em]">{trustPoints[1].detail}</span>
          </BentoCard>

          <BentoCard label="Payment" meta="04" className="col-start-2 row-start-2 lg:col-start-1 lg:row-start-3">
            <span className="font-display text-[clamp(1.5rem,min(2.6vw,5svh),3rem)] leading-[0.95] text-chalk uppercase">
              Cash on
              <br />
              delivery
            </span>
            <span className="type-label mt-1.5 text-dim max-sm:hidden">
              + {policies.payment[1].label.toLowerCase()}
            </span>
          </BentoCard>

          <BentoCard label="The range" meta={brand.shortName} className="col-span-2 col-start-1 row-start-3 lg:col-span-2 lg:col-start-2 lg:row-start-2">
            <dl className="grid grid-cols-4 gap-2 lg:gap-4">
              {STATS.map((s) => (
                <div key={s.label} className="flex flex-col border-l border-white/10 pl-2 lg:pl-3">
                  <dt className="type-label order-2 mt-1.5 text-dim">{s.label}</dt>
                  <dd className={`${statSize} order-1`}>
                    <Counter value={s.value} pad={2} />
                  </dd>
                </div>
              ))}
            </dl>
          </BentoCard>

          {b ? <FeaturedCard product={b} index={1} className="col-start-2 row-start-4 lg:col-start-4 lg:row-span-2 lg:row-start-2" /> : null}

          <BentoCard label="Price from" meta="05" desktopOnly className="lg:col-start-2 lg:row-start-3">
            <span className={statSize}>
              <Counter value={stats.priceFrom} prefix={`${brand.currency} `} separator />
            </span>
            <span className="type-label mt-1.5 text-dim">{stats.productCount} pieces, all in {brand.currency}</span>
          </BentoCard>

          <BentoCard label="Help" meta="06" desktopOnly className="lg:col-start-3 lg:row-start-3">
            <a
              href={whatsappLink(`Hello ${brand.name}, I have a question about sizes.`)}
              target="_blank"
              rel="noopener noreferrer"
              className="group/link flex flex-col gap-1.5"
            >
              <span className="font-display text-[clamp(1.25rem,min(2.1vw,4.2svh),2.25rem)] leading-[0.95] text-chalk uppercase transition-colors group-hover/link:text-accent">
                {help.title}
              </span>
              <span className="text-[0.8125rem] leading-snug text-dim">{help.detail} ↗</span>
            </a>
          </BentoCard>
        </div>

        {/* Category marquee */}
        <div data-marquee className="relative overflow-hidden border-y max-sm:hidden border-white/10 py-2" aria-label="Categories">
          <ul data-marquee-track className="flex w-max">
            {[0, 1].map((dup) =>
              categories.map((cat) => (
                <li
                  key={`${dup}-${cat.slug}`}
                  aria-hidden={dup === 1}
                  className="type-label flex shrink-0 items-center gap-3 pr-8 whitespace-nowrap"
                >
                  <span className="text-accent">✶</span>
                  <span className="text-chalk">{cat.name}</span>
                  <span className="text-dim normal-case tracking-[0.06em]">{cat.blurb}</span>
                </li>
              )),
            )}
          </ul>
        </div>
      </div>
    </section>
  );
}
