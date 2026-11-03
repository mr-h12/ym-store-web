import { palette } from "./store-data";

/**
 * Set to a path in /public (e.g. "/models/garment.glb") to replace the
 * procedural fabric layers with your own model. Child meshes of the model are
 * treated as layers and receive the same explode / fan / focus choreography.
 */
export const MODEL_URL: string | null = null;

/** Weave patterns implemented in the fabric fragment shader (index = uniform value). */
export const WEAVES = ["twill", "slub", "rib", "plain", "canvas"] as const;
export type Weave = (typeof WEAVES)[number];

export interface SceneLayer {
  id: string;
  /** Short fabric name shown in labels. */
  fabric: string;
  /** Spec line shown next to the layer. */
  spec: string;
  color: string;
  weave: Weave;
}

/** Back (index 0) to front (index 4). */
export const SCENE_LAYERS: SceneLayer[] = [
  { id: "cotton", fabric: "Heavy cotton", spec: "240 GSM · boxy tee", color: palette.ecru.hex, weave: "twill" },
  { id: "linen", fabric: "Washed linen", spec: "100% linen · camp shirt", color: palette.sand.hex, weave: "slub" },
  { id: "merino", fabric: "Extra-fine merino", spec: "Rib knit · crewneck", color: palette.olive.hex, weave: "rib" },
  { id: "poplin", fabric: "Cotton poplin", spec: "Crisp plain weave · overshirt", color: palette.navy.hex, weave: "plain" },
  { id: "canvas", fabric: "Cotton canvas", spec: "Heavy canvas · chore jacket", color: "#C4622D", weave: "canvas" },
];

/** Index of the linen layer — the camera's close-up target in chapter 03. */
export const FOCUS_LAYER_INDEX = 1;

/** Visual constants shared by the scene. */
export const SCENE = {
  background: "#08080A",
  accent: "#C4622D",
  layerWidth: 3.2,
  layerHeight: 4.2,
  /** Z distance between layers at explode = 1. */
  layerSpacing: 1.15,
  fov: 35,
} as const;
