import { SCENE } from "@/lib/scene-config";
import type { SceneState } from "@/lib/scroll-state";

/** Transform offsets for one layer, in the centerpiece group's local space (world units). */
export interface LayerPose {
  x: number;
  y: number;
  z: number;
  rx: number;
  ry: number;
  rz: number;
  scale: number;
  /** 0 = full brightness, 0.75 = dimmed (not the focused layer). */
  dim: number;
}

export function createLayerPose(): LayerPose {
  return { x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0, scale: 1, dim: 0 };
}

/** Radius of the arc the layers fan onto (centre sits towards the camera). */
const FAN_RADIUS = 4.5;
/** Angular spread of the fan, ± radians. */
const FAN_SPREAD = 0.9;
/** Gap between layers when tightly stacked. */
const STACK_GAP = 0.03;

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/**
 * Shared exploded-diagram / fan / focus choreography used by both the
 * procedural FabricLayers and the GLB centerpiece.
 *
 * @param index         layer index, 0 = back
 * @param count         number of layers
 * @param s             damped scene state
 * @param focusWeight   damped 0 – 1 weight: 1 when this layer is `focusLayer`
 * @param out           pose written in place
 */
export function solveLayerPose(
  index: number,
  count: number,
  s: Pick<SceneState, "explode" | "fan" | "focus" | "focusLayer" | "fold">,
  focusWeight: number,
  out: LayerPose,
): LayerPose {
  const half = (count - 1) / 2;
  const c = index - half; // -2 … 2 for five layers
  const e = s.explode;
  const fan = s.fan;
  // While stacked flat, layers peek out from under each other like a pile of
  // swatches; folded into one garment they line up as concentric shells.
  const rest = 1 - 0.85 * s.fold;

  // Stacked → exploded: spread along Z, fan the rotations a little like an
  // exploded technical drawing and step each layer up so every edge reads.
  const stackX = -c * 0.05 * rest + c * 0.08 * e;
  const stackY = c * 0.05 * rest + c * 0.1 * e;
  const stackRx = -c * 0.03 * e;
  const stackRy = c * 0.12 * e;
  const stackRz = c * 0.012 * rest + c * 0.03 * e;

  // Fan: an arc around the Y axis, centre towards the camera, each layer facing it.
  const fanX = FAN_RADIUS * Math.sin(fanAngle(c, half));
  const fanY = c * 0.04;
  const fanRy = -fanAngle(c, half);

  out.x = lerp(stackX, fanX, fan);
  out.y = lerp(stackY, fanY, fan);
  out.z = baseZ(c, half, e, fan);
  out.rx = lerp(stackRx, 0, fan);
  out.ry = lerp(stackRy, fanRy, fan);
  out.rz = lerp(stackRz, 0, fan);

  // Focus: isolate one layer — it slides forward (+1.2) and squares up to the
  // camera. The others dim and recede; layers that were in front of it also
  // slide aside and tuck in behind it so they never block the close-up.
  const isolate = s.focus * focusWeight;
  const recede = s.focus * (1 - focusWeight);
  const cf = clampIndex(s.focusLayer, 0, count - 1) - half;
  if (c > cf) {
    const behind = baseZ(cf, half, e, fan) - 0.4 - 0.3 * (c - cf);
    out.z = lerp(out.z, behind, recede);
    out.x += (c - cf) * 0.55 * recede;
  } else {
    out.z -= 0.6 * recede;
  }
  out.z += 1.2 * isolate;
  out.ry *= 1 - 0.7 * isolate;
  out.rz *= 1 - 0.7 * isolate;
  out.scale = lerp(1, 0.88, fan) * (1 + 0.08 * isolate);
  out.dim = 0.75 * recede;
  return out;
}

function clampIndex(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

function fanAngle(c: number, half: number): number {
  return (half > 0 ? c / half : 0) * FAN_SPREAD;
}

/** Z of a layer (centred index `c`) before focus is applied. */
function baseZ(c: number, half: number, explode: number, fan: number): number {
  const stackZ = c * (SCENE.layerSpacing * explode + STACK_GAP);
  const fanZ = FAN_RADIUS * (1 - Math.cos(fanAngle(c, half))) + c * 0.12;
  return lerp(stackZ, fanZ, fan);
}
