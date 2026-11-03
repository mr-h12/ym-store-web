import type { SceneState } from "./scroll-state";
import { FOCUS_LAYER_INDEX } from "./scene-config";

export type ChapterId = "hero" | "deconstruct" | "deepdive" | "data" | "finale";

export interface Chapter {
  id: ChapterId;
  /** DOM id of the chapter <section>; HUD quick-jump scrolls to `#${anchor}`. */
  anchor: string;
  /** "01" … "05" */
  index: string;
  /** Short HUD label. */
  label: string;
  /** Rough share of the total scroll track (0 – 1, start/end). */
  range: [number, number];
  /** Scene state the master timeline arrives at for this chapter. */
  scene: SceneState;
}

const base: SceneState = {
  camX: 0, camY: 0, camZ: 8,
  targetX: 0, targetY: 0, targetZ: 0,
  rotX: 0, rotY: 0, offsetX: 0,
  explode: 0, fold: 0, fan: 0, focus: 0, focusLayer: FOCUS_LAYER_INDEX,
  light: 1, sweep: 0, wind: 0.4,
};

/** Scene state before the preloader lifts — camera far back, cloth tightly folded. */
export const INTRO_SCENE: SceneState = {
  ...base,
  camX: 0, camY: 0.8, camZ: 16,
  rotX: -0.2, rotY: 1.2,
  fold: 1, light: 0.4, sweep: -1, wind: 0.2,
};

export const CHAPTERS: Chapter[] = [
  {
    id: "hero", anchor: "chapter-hero", index: "01", label: "Hero", range: [0, 0.2],
    scene: { ...base, camX: 0, camY: 0.3, camZ: 7.5, rotX: -0.12, rotY: 0.35, offsetX: 0, fold: 0.85, light: 1, sweep: -0.5, wind: 0.35 },
  },
  {
    id: "deconstruct", anchor: "chapter-deconstruct", index: "02", label: "Fabric", range: [0.2, 0.45],
    scene: { ...base, camX: 5.2, camY: 1.4, camZ: 8.5, targetX: 1.2, rotX: -0.05, rotY: -0.55, offsetX: 1.8, explode: 1, fold: 0.1, light: 1.15, sweep: 0, wind: 0.6 },
  },
  {
    id: "deepdive", anchor: "chapter-deepdive", index: "03", label: "Cut", range: [0.45, 0.7],
    scene: { ...base, camX: -1.4, camY: 0.2, camZ: 3.2, targetX: -1.6, targetY: 0.1, targetZ: -0.6, rotX: 0, rotY: 0.12, offsetX: -1.6, explode: 0.6, fold: 0, focus: 1, light: 1.45, sweep: 0.8, wind: 0.5 },
  },
  {
    id: "data", anchor: "chapter-data", index: "04", label: "Data", range: [0.7, 0.9],
    scene: { ...base, camX: 0, camY: 2.6, camZ: 11, targetY: -0.4, rotX: 0.1, rotY: 0, offsetX: 0, explode: 0.4, fan: 1, light: 0.75, sweep: 0.2, wind: 0.45 },
  },
  {
    id: "finale", anchor: "chapter-finale", index: "05", label: "Order", range: [0.9, 1],
    scene: { ...base, camX: 0, camY: 0.2, camZ: 6.8, rotX: -0.1, rotY: 0.85, offsetX: 0, fold: 1, light: 1.2, sweep: 0.4, wind: 0.4 },
  },
];

/** Copy for each chapter (all facts sourced from lib/store-data.ts). */
export const COPY = {
  hero: {
    eyebrow: "Autumn edit · Est. on Instagram",
    title: ["Y.M", "Store"],
    headline: "Built to be worn often.",
    sub: "Heavy cotton, merino and linen in easy shapes. Pay cash on delivery.",
    scrollHint: "Scroll to unfold",
  },
  deconstruct: {
    eyebrow: "Material study",
    title: ["Unfold", "the fabric."],
    body: "Every piece starts as a cloth we would wear every day. Five fabrics, chosen for weight, hand-feel and how they age.",
    specs: [
      { value: 240, suffix: " GSM", label: "Heavy cotton", detail: "Dense, structured jersey that holds its shape wash after wash." },
      { value: 100, suffix: "%", label: "Washed linen", detail: "Breathable, slub-textured linen for camp shirts, trousers and dresses." },
      { value: 100, suffix: "%", label: "Extra-fine merino", detail: "Lightweight, temperature-regulating knit that is easy to layer." },
    ],
  },
  deepdive: {
    eyebrow: "Fit & cut",
    title: ["Cut", "to last."],
    body: "Four fits, each cut on purpose. Dropped shoulders and boxy bodies for the oversized pieces; clean, true-to-size lines for the everyday ones. Linen is washed before it is cut, so what you try on is what you keep.",
    fits: ["Oversized", "Relaxed", "Regular", "Slim"] as const,
  },
  data: {
    eyebrow: "The numbers",
    title: ["Made", "simple."],
  },
  finale: {
    eyebrow: "Order in a message",
    title: ["Wear it", "often."],
    body: "Pick what you like, send us a message and pay when it arrives. We confirm every order on WhatsApp within a few hours.",
    ctaPrimary: "Order on WhatsApp",
    ctaInstagram: "Follow on Instagram",
    ctaFacebook: "Facebook",
    notice: "Products, prices, delivery rules and the WhatsApp number are placeholders until confirmed by the store.",
  },
} as const;
