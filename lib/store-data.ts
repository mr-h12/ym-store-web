/**
 * Y.M Store — single source of truth for all site content.
 *
 * Extracted from the original `mr-h12/ym-store` repo (lib/store-config.ts,
 * data/products.ts, components/home/*, components/product/*).
 *
 * Fields marked `PLACEHOLDER` were placeholders in the source repo too.
 * Confirm them with the store owner (Instagram @y_m_storee) before launch.
 */

export interface Colour {
  name: string;
  hex: string;
}

export type CategorySlug = "t-shirts" | "shirts" | "knitwear" | "trousers" | "outerwear" | "dresses";
export type Fit = "Slim" | "Regular" | "Relaxed" | "Oversized";

export interface Category {
  slug: CategorySlug;
  name: string;
  blurb: string;
}

export interface Product {
  slug: string;
  name: string;
  category: CategorySlug;
  /** Price in store currency (EGP). PLACEHOLDER. */
  price: number;
  /** Original price when on sale. */
  compareAt?: number;
  colours: Colour[];
  fit: Fit;
  material: string;
  description: string;
  isNew?: boolean;
  popularity: number;
  addedAt: string;
}

export const brand = {
  name: "Y.M Store",
  shortName: "Y.M",
  /** PLACEHOLDER — tagline written for the demo store. */
  tagline: "Everyday clothing, made to be worn often.",
  instagram: "https://www.instagram.com/y_m_storee",
  instagramHandle: "@y_m_storee",
  facebook: "https://www.facebook.com/share/1SEgUHRtpi/",
  /** PLACEHOLDER — international format without "+" (Egypt +20). */
  whatsapp: "201000000000",
  /** PLACEHOLDER */
  currency: "EGP",
  locale: "en-EG",
  /** PLACEHOLDER — no address in source repo; Egypt is inferred from currency/cities. */
  country: "Egypt",
  /** PLACEHOLDER — checkout city list from the source repo. */
  deliveryCities: ["Cairo", "Giza", "Alexandria", "6th of October", "New Cairo", "Mansoura", "Tanta", "Hurghada"],
} as const;

/** All PLACEHOLDER values from the source repo. */
export const policies = {
  shippingFee: 75,
  freeShippingThreshold: 1500,
  deliveryDaysMin: 2,
  deliveryDaysMax: 4,
  deliveryEstimate: "2–4 working days",
  returnsWindowDays: 14,
  noDeliveryDay: "Friday",
  payment: [
    { label: "Cash on delivery", detail: "Pay the courier in cash when your order arrives." },
    { label: "Card on delivery", detail: "The courier brings a card machine." },
    { label: "Pay online", detail: "Coming soon." },
  ],
  care: "Machine wash cold, inside out. Dry flat. Cool iron.",
} as const;

export const trustPoints = [
  { title: "Delivery in 2–4 working days", detail: "Free over EGP 1,500, otherwise EGP 75" },
  { title: "14-day returns", detail: "Unworn, with tags on" },
  { title: "Cash on delivery", detail: "Pay when your order arrives" },
  { title: "Help on WhatsApp", detail: "Message us about sizes or orders" },
] as const;

export const fitNotes: Record<Fit, string> = {
  Slim: "Cut close to the body. If you are between sizes, take the larger one.",
  Regular: "True to size. Take your usual size.",
  Relaxed: "A little roomier than regular. Take your usual size for an easy fit.",
  Oversized: "Cut generously on purpose. Size down for a closer fit.",
};

export const categories: Category[] = [
  { slug: "t-shirts", name: "T-shirts", blurb: "Heavy cotton, cut to last." },
  { slug: "shirts", name: "Shirts", blurb: "Oxford, poplin and linen." },
  { slug: "knitwear", name: "Knitwear", blurb: "Merino and cotton knits." },
  { slug: "trousers", name: "Trousers", blurb: "Tailored, wide and cargo." },
  { slug: "outerwear", name: "Outerwear", blurb: "Layers for cool evenings." },
  { slug: "dresses", name: "Dresses", blurb: "Easy shapes in soft fabrics." },
];

export const palette = {
  ecru: { name: "Ecru", hex: "#ece6da" },
  black: { name: "Black", hex: "#1c1b1a" },
  navy: { name: "Navy", hex: "#24304a" },
  olive: { name: "Olive", hex: "#5b5e3f" },
  sand: { name: "Sand", hex: "#cdb994" },
  white: { name: "White", hex: "#f7f6f2" },
  grey: { name: "Grey melange", hex: "#a9a8a4" },
  brown: { name: "Chocolate", hex: "#5a3e2e" },
  blue: { name: "Sky blue", hex: "#a9c2db" },
  rust: { name: "Rust", hex: "#a2512f" },
  sage: { name: "Sage", hex: "#a6b39b" },
} satisfies Record<string, Colour>;
const c = palette;

const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

/** PLACEHOLDER catalogue — 24 demo products from the source repo. */
export const products: Product[] = [
  { slug: slugify("Heavyweight Boxy Tee"), name: "Heavyweight Boxy Tee", category: "t-shirts", price: 450, colours: [c.white, c.black, c.olive], fit: "Oversized", material: "100% cotton, 240 gsm", description: "A dense, structured tee with a dropped shoulder and a short, boxy body. It holds its shape wash after wash.", isNew: true, popularity: 98, addedAt: "2026-10-28" },
  { slug: slugify("Everyday Crew Tee"), name: "Everyday Crew Tee", category: "t-shirts", price: 320, colours: [c.white, c.grey, c.navy, c.black], fit: "Regular", material: "100% combed cotton, 180 gsm", description: "Our most-worn tee. A clean crew neck, a regular fit and a soft hand-feel.", popularity: 95, addedAt: "2026-06-02" },
  { slug: slugify("Long-Sleeve Rib Tee"), name: "Long-Sleeve Rib Tee", category: "t-shirts", price: 390, colours: [c.ecru, c.brown], fit: "Slim", material: "95% cotton, 5% elastane rib", description: "A close-fitting rib knit with long sleeves, made for layering under shirts and jackets.", popularity: 71, addedAt: "2026-09-14" },
  { slug: slugify("Pocket Tee"), name: "Pocket Tee", category: "t-shirts", price: 340, compareAt: 420, colours: [c.sand, c.sage], fit: "Relaxed", material: "100% cotton slub", description: "A relaxed tee in textured slub cotton with a single chest pocket.", popularity: 64, addedAt: "2026-04-20" },
  { slug: slugify("Oxford Button-Down"), name: "Oxford Button-Down", category: "shirts", price: 690, colours: [c.blue, c.white], fit: "Regular", material: "100% cotton oxford", description: "A classic button-down collar in a sturdy oxford weave that softens with every wash.", popularity: 90, addedAt: "2026-07-11" },
  { slug: slugify("Linen Camp Shirt"), name: "Linen Camp Shirt", category: "shirts", price: 750, colours: [c.ecru, c.olive, c.rust], fit: "Relaxed", material: "100% linen", description: "An open camp collar and a straight hem in breathable washed linen.", isNew: true, popularity: 86, addedAt: "2026-10-30" },
  { slug: slugify("Poplin Overshirt"), name: "Poplin Overshirt", category: "shirts", price: 820, colours: [c.navy, c.black], fit: "Oversized", material: "100% cotton poplin", description: "A crisp, oversized poplin shirt that also works as a light jacket.", popularity: 58, addedAt: "2026-05-18" },
  { slug: slugify("Striped Popover"), name: "Striped Popover", category: "shirts", price: 640, compareAt: 790, colours: [c.blue], fit: "Regular", material: "100% cotton", description: "A half-placket popover in a fine blue stripe.", popularity: 49, addedAt: "2026-03-09" },
  { slug: slugify("Merino Crewneck"), name: "Merino Crewneck", category: "knitwear", price: 1250, colours: [c.navy, c.grey, c.brown], fit: "Regular", material: "100% extra-fine merino wool", description: "A lightweight, temperature-regulating merino knit that is easy to layer.", isNew: true, popularity: 92, addedAt: "2026-10-25" },
  { slug: slugify("Chunky Cardigan"), name: "Chunky Cardigan", category: "knitwear", price: 1490, colours: [c.ecru, c.olive], fit: "Oversized", material: "60% cotton, 40% wool", description: "A thick, cosy cardigan with horn-effect buttons and deep pockets.", popularity: 77, addedAt: "2026-10-01" },
  { slug: slugify("Cotton Knit Polo"), name: "Cotton Knit Polo", category: "knitwear", price: 890, colours: [c.sand, c.black], fit: "Regular", material: "100% cotton", description: "A textured knit polo with a three-button placket and a ribbed hem.", popularity: 69, addedAt: "2026-08-19" },
  { slug: slugify("Half-Zip Sweater"), name: "Half-Zip Sweater", category: "knitwear", price: 1150, compareAt: 1390, colours: [c.navy], fit: "Relaxed", material: "80% cotton, 20% wool", description: "A mid-weight knit with a funnel neck and a metal half-zip.", popularity: 55, addedAt: "2026-02-03" },
  { slug: slugify("Pleated Wide Trouser"), name: "Pleated Wide Trouser", category: "trousers", price: 980, colours: [c.black, c.sand, c.brown], fit: "Relaxed", material: "68% polyester, 30% viscose, 2% elastane", description: "Front pleats and a wide, fluid leg. Smart enough for work and easy enough for the weekend.", popularity: 94, addedAt: "2026-09-02" },
  { slug: slugify("Straight Chino"), name: "Straight Chino", category: "trousers", price: 790, colours: [c.sand, c.navy, c.olive], fit: "Regular", material: "98% cotton, 2% elastane twill", description: "A straight-leg chino in a soft brushed twill.", popularity: 88, addedAt: "2026-06-21" },
  { slug: slugify("Cargo Parachute Pant"), name: "Cargo Parachute Pant", category: "trousers", price: 860, colours: [c.olive, c.black], fit: "Oversized", material: "100% nylon", description: "A lightweight nylon cargo with drawcord hems and six pockets.", isNew: true, popularity: 81, addedAt: "2026-10-29" },
  { slug: slugify("Linen Drawstring Trouser"), name: "Linen Drawstring Trouser", category: "trousers", price: 720, compareAt: 890, colours: [c.ecru, c.sage], fit: "Relaxed", material: "100% linen", description: "An elasticated drawstring waist with a relaxed linen leg.", popularity: 60, addedAt: "2026-04-07" },
  { slug: slugify("Wool-Blend Overcoat"), name: "Wool-Blend Overcoat", category: "outerwear", price: 2950, colours: [c.black, c.brown], fit: "Relaxed", material: "60% wool, 40% polyester", description: "A single-breasted overcoat that falls just below the knee, with a notch lapel.", isNew: true, popularity: 84, addedAt: "2026-10-27" },
  { slug: slugify("Cotton Chore Jacket"), name: "Cotton Chore Jacket", category: "outerwear", price: 1650, colours: [c.navy, c.sand], fit: "Regular", material: "100% cotton canvas", description: "A workwear-inspired jacket with three patch pockets in a heavy canvas.", popularity: 79, addedAt: "2026-08-30" },
  { slug: slugify("Padded Gilet"), name: "Padded Gilet", category: "outerwear", price: 1290, colours: [c.black, c.olive], fit: "Regular", material: "100% recycled polyester", description: "A lightweight quilted gilet for layering over knits.", popularity: 52, addedAt: "2026-09-25" },
  { slug: slugify("Suede-Effect Trucker"), name: "Suede-Effect Trucker", category: "outerwear", price: 1890, compareAt: 2290, colours: [c.brown, c.sand], fit: "Regular", material: "100% polyester suede-effect", description: "A classic trucker shape in a soft suede-effect fabric.", popularity: 66, addedAt: "2026-01-15" },
  { slug: slugify("Slip Midi Dress"), name: "Slip Midi Dress", category: "dresses", price: 1190, colours: [c.black, c.sage, c.rust], fit: "Regular", material: "100% viscose satin", description: "A bias-cut slip dress in a fluid satin that falls to mid-calf.", isNew: true, popularity: 89, addedAt: "2026-10-26" },
  { slug: slugify("Poplin Shirt Dress"), name: "Poplin Shirt Dress", category: "dresses", price: 1090, colours: [c.white, c.blue], fit: "Relaxed", material: "100% cotton poplin", description: "A relaxed shirt dress with a removable tie belt.", popularity: 80, addedAt: "2026-07-03" },
  { slug: slugify("Knit Maxi Dress"), name: "Knit Maxi Dress", category: "dresses", price: 1350, colours: [c.brown, c.grey], fit: "Slim", material: "70% viscose, 30% polyamide rib", description: "A long ribbed knit dress with a high neck.", popularity: 63, addedAt: "2026-09-10" },
  { slug: slugify("Linen Tiered Dress"), name: "Linen Tiered Dress", category: "dresses", price: 990, compareAt: 1250, colours: [c.ecru, c.sand], fit: "Relaxed", material: "100% linen", description: "A light, airy tiered linen dress with a square neck.", popularity: 57, addedAt: "2026-05-05" },
];

export const newIn = products.filter((p) => p.isNew);
export const featured = ["wool-blend-overcoat", "merino-crewneck"]
  .map((slug) => products.find((p) => p.slug === slug))
  .filter((p): p is Product => Boolean(p));

export const stats = {
  categoryCount: categories.length,
  productCount: products.length,
  newInCount: newIn.length,
  colourCount: Object.keys(palette).length,
  priceFrom: Math.min(...products.map((p) => p.price)),
};

export function formatPrice(amount: number): string {
  return `${brand.currency} ${amount.toLocaleString("en-US")}`;
}

/** Pre-filled WhatsApp chat link. */
export function whatsappLink(message = `Hello ${brand.name}, I'd like to place an order.`): string {
  return `https://wa.me/${brand.whatsapp}?text=${encodeURIComponent(message)}`;
}
