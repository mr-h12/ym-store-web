"use client";

import { useRef } from "react";
import { ArrowUpRight } from "lucide-react";
import { CHAPTERS, COPY } from "@/lib/chapters";
import { brand, categories, formatPrice, policies, whatsappLink } from "@/lib/store-data";
import { useGSAP } from "./gsap";
import { FacebookIcon, InstagramIcon, WhatsAppIcon } from "./icons";
import { KineticHeadline, headlineChars } from "./KineticHeadline";
import { $all, chapterTimeline } from "./layout";
import { MagneticLink } from "./Magnetic";

const chapter = CHAPTERS[4];

const footLink =
  "relative inline-block w-fit text-chalk/85 transition-colors duration-300 hover:text-chalk after:absolute after:-bottom-0.5 after:left-0 after:h-px after:w-full after:origin-right after:scale-x-0 after:bg-accent after:transition-transform after:duration-500 after:ease-cine hover:after:origin-left hover:after:scale-x-100 focus-visible:after:scale-x-100";

export function ChapterFinale() {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const section = sectionRef.current;
      if (!section) return;

      // Finale: reveal over the first ~30% of the pin, then hold to the very end (no exit).
      const tl = chapterTimeline(section, chapter.id);

      const scrim = $all(section, "[data-scrim]");
      const eyebrow = $all(section, "[data-eyebrow]");
      const body = $all(section, "[data-body]");
      const ctas = $all(section, "[data-cta]");
      const rule = $all(section, "[data-foot-rule]");
      const cols = $all(section, "[data-foot-col]");
      const chars = headlineChars(section);

      tl.fromTo(scrim, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.16 }, 0)
        .fromTo(eyebrow, { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.08, ease: "power2.out" }, 0.01)
        .fromTo(chars, { yPercent: 118 }, { yPercent: 0, duration: 0.14, stagger: 0.012, ease: "power3.out" }, 0.02)
        .fromTo(body, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.1, ease: "power2.out" }, 0.1)
        .fromTo(
          ctas,
          { autoAlpha: 0, y: 36, scale: 0.94 },
          { autoAlpha: 1, y: 0, scale: 1, duration: 0.1, stagger: 0.025, ease: "back.out(1.6)" },
          0.13,
        )
        .fromTo(rule, { scaleX: 0, transformOrigin: "0% 50%" }, { scaleX: 1, duration: 0.14, ease: "power2.inOut" }, 0.12)
        .fromTo(cols, { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.08, stagger: 0.02, ease: "power2.out" }, 0.16);
    },
    { scope: sectionRef },
  );

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
        className="pointer-events-none absolute inset-0 bg-linear-to-t from-obsidian/90 via-obsidian/40 to-obsidian/20"
      />

      <div className="gutter-x relative flex h-full flex-col pt-[72px] pb-16">
        {/* Call to action */}
        <div className="flex min-h-0 flex-1 flex-col justify-center">
          <p data-eyebrow className="type-label flex items-center gap-2.5 text-chalk">
            <span className="text-accent">{chapter.index}</span>
            <span aria-hidden className="h-px w-6 bg-white/30" />
            {COPY.finale.eyebrow}
          </p>

          <div className="mt-3 lg:mt-4">
            <KineticHeadline
              id={`${chapter.id}-title`}
              lines={COPY.finale.title}
              accent="."
              className="type-display text-chalk"
              style={{ fontSize: "clamp(4rem, min(15vw, 22svh), 16rem)" }}
            />
          </div>

          <div className="mt-4 grid gap-5 lg:mt-7 lg:grid-cols-12 lg:items-end lg:gap-8">
            <p data-body className="max-w-[46ch] text-dim max-sm:line-clamp-3 max-sm:text-[0.875rem] max-sm:leading-snug lg:col-span-5 lg:text-[length:var(--fs-lead)]">
              {COPY.finale.body}
            </p>
            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-3 lg:col-span-7 lg:justify-end">
              <div data-cta className="col-span-2">
                <MagneticLink
                  href={whatsappLink()}
                  variant="primary"
                  icon={<WhatsAppIcon />}
                  className="type-label h-14 w-full px-7 text-[0.75rem] sm:w-auto lg:h-16 lg:px-9"
                >
                  {COPY.finale.ctaPrimary}
                </MagneticLink>
              </div>
              <div data-cta>
                <MagneticLink
                  href={brand.instagram}
                  icon={<InstagramIcon />}
                  ariaLabel={`${COPY.finale.ctaInstagram} ${brand.instagramHandle}`}
                  className="type-label h-12 w-full px-5 sm:w-auto lg:h-16 lg:px-7"
                >
                  <span className="max-sm:hidden">{COPY.finale.ctaInstagram}</span>
                  <span className="sm:hidden">Instagram</span>
                </MagneticLink>
              </div>
              <div data-cta>
                <MagneticLink
                  href={brand.facebook}
                  icon={<FacebookIcon />}
                  className="type-label h-12 w-full px-5 sm:w-auto lg:h-16 lg:px-7"
                >
                  {COPY.finale.ctaFacebook}
                </MagneticLink>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-5 shrink-0 lg:mt-8">
          <span data-foot-rule aria-hidden className="block h-px w-full bg-white/15" />
          <div className="grid grid-cols-2 gap-x-4 gap-y-3 pt-3 text-[0.75rem] leading-snug lg:grid-cols-12 lg:gap-x-8 lg:pt-5 lg:text-[0.8125rem]">
            <nav data-foot-col aria-label="Categories" className="lg:col-span-3">
              <p className="type-label mb-1.5 text-dim lg:mb-2.5">Shop</p>
              <ul className="grid grid-cols-1 gap-x-4 gap-y-0.5 sm:grid-cols-2 lg:gap-y-1">
                {categories.map((c) => (
                  <li key={c.slug}>
                    <a
                      href={whatsappLink(`Hello ${brand.name}, I'd like to see your ${c.name.toLowerCase()}.`)}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={c.blurb}
                      className={footLink}
                    >
                      {c.name}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            <div data-foot-col className="lg:col-span-4">
              <p className="type-label mb-1.5 text-dim lg:mb-2.5">Policies</p>
              <ul className="flex flex-col gap-0.5 text-chalk/85 lg:gap-1">
                <li>
                  Delivery {policies.deliveryEstimate}
                  <span className="text-dim max-sm:hidden">
                    {" "}
                    · {formatPrice(policies.shippingFee)}, free over {formatPrice(policies.freeShippingThreshold)}
                  </span>
                </li>
                <li>{policies.returnsWindowDays}-day returns</li>
                <li className="flex flex-wrap gap-x-1.5">
                  {policies.payment.map((p, i) => (
                    <span key={p.label} title={p.detail} className={i === policies.payment.length - 1 ? "text-dim" : ""}>
                      {p.label}
                      {i === policies.payment.length - 1 ? ` (${p.detail.replace(/\.$/, "").toLowerCase()})` : " ·"}
                    </span>
                  ))}
                </li>
              </ul>
            </div>

            <div data-foot-col className="max-lg:hidden lg:col-span-2">
              <p className="type-label mb-2.5 text-dim">Social</p>
              <ul className="flex flex-col gap-1">
                <li>
                  <a href={brand.instagram} target="_blank" rel="noopener noreferrer" className={`${footLink} inline-flex items-center gap-2`}>
                    <InstagramIcon className="text-accent" /> {brand.instagramHandle}
                  </a>
                </li>
                <li>
                  <a href={brand.facebook} target="_blank" rel="noopener noreferrer" className={`${footLink} inline-flex items-center gap-2`}>
                    <FacebookIcon className="text-accent" /> Facebook
                  </a>
                </li>
                <li>
                  <a href={whatsappLink()} target="_blank" rel="noopener noreferrer" className={`${footLink} inline-flex items-center gap-2`}>
                    <WhatsAppIcon className="text-accent" /> WhatsApp <ArrowUpRight aria-hidden className="size-3" />
                  </a>
                </li>
              </ul>
            </div>

            <div data-foot-col className="col-span-2 flex flex-col justify-end gap-1.5 lg:col-span-3 lg:text-right">
              <p className="type-label text-chalk">
                © <span suppressHydrationWarning>{new Date().getFullYear()}</span> {brand.name}
              </p>
              <p className="font-mono text-[0.5625rem] leading-relaxed tracking-[0.08em] text-dim uppercase lg:text-[0.625rem]">
                {COPY.finale.notice}
              </p>
            </div>
          </div>
        </footer>
      </div>
    </section>
  );
}
