import * as THREE from "three";

/* ────────────────────────────────────────────────────────────────────────────
 * Procedural cloth shader for the Y.M Store fabric layers.
 *
 *  Vertex   : layered wind (simplex + sines) · garment fold/drape (cylinder
 *             wrap, collar roll, hem sag + flare, shoulder drop, pleats) ·
 *             vertical velocity ripple · finite-difference normals + a
 *             curvature term used as fold ambient occlusion.
 *  Fragment : procedural weaves (twill, slub linen, rib knit, plain poplin,
 *             canvas basket) with bump-mapped normals · wrapped Lambert key
 *             light following uSweep · cool fill · accent-tinted sheen ·
 *             dashed accent stitched seam · fold AO · focus dimming · fog.
 * ──────────────────────────────────────────────────────────────────────────── */

/** Simplex 3D noise — Ashima Arts / Stefan Gustavson (MIT). */
const SIMPLEX_GLSL = /* glsl */ `
vec3 ym_mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 ym_mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 ym_permute(vec4 x) { return ym_mod289(((x * 34.0) + 10.0) * x); }
vec4 ym_taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float ym_snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = ym_mod289(i);
  vec4 p = ym_permute(ym_permute(ym_permute(
              i.z + vec4(0.0, i1.z, i2.z, 1.0))
            + i.y + vec4(0.0, i1.y, i2.y, 1.0))
            + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = ym_taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;
  vec4 m = max(0.5 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 105.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}
`;

/**
 * Cloth deformation shared by the cloth surface and its outline.
 * Input: rest position on the flat panel (centred, world units).
 */
const DEFORM_GLSL = /* glsl */ `
uniform float uTime;
uniform float uWind;
uniform float uFold;
uniform float uVelocity;
uniform float uLayerIndex;
uniform float uSpread;
uniform float uShell;
uniform vec2 uSize;

${SIMPLEX_GLSL}

// Bend a straight strip of arc length s with curvature k.
// Returns (distance along the original direction, displacement towards the bend).
vec2 ym_bend(float s, float k) {
  if (abs(k) < 1e-3) return vec2(s, 0.5 * k * s * s);
  float a = s * k;
  return vec2(sin(a) / k, (1.0 - cos(a)) / k);
}

vec3 clothDeform(vec2 p) {
  float halfW = 0.5 * uSize.x;
  float halfH = 0.5 * uSize.y;
  float u = clamp(p.x / halfW, -1.4, 1.4);   // -1 … 1 across
  float v = p.y / uSize.y + 0.5;             //  0 bottom … 1 top
  float f = uFold;
  float t = uTime;
  // Layers share one wind field while stacked so they never cut through each
  // other; they get their own phase as they separate.
  float seed = uLayerIndex * 1.731 * uSpread;
  float hem = 1.0 - smoothstep(0.0, 0.38, v);

  float y = p.y;
  // Stacked layers are offset along their own normal, so once folded they
  // nest as concentric shells instead of cutting through each other.
  float z = uShell;

  // ── Fold / drape: garment-like form ───────────────────────────────────────
  // Shoulders drop at the top corners.
  y -= f * 0.34 * smoothstep(0.45, 1.15, abs(u)) * smoothstep(0.55, 1.0, v);
  // Hem sags in the middle.
  y -= f * 0.18 * hem * hem * (1.0 - 0.6 * u * u);
  // A light hem flare, a soft chest, a tucked waist crease.
  z += f * 0.12 * hem * hem * hem * (1.0 - 0.35 * u * u);
  z += f * 0.1 * sin(clamp(v, 0.0, 1.0) * 3.14159265);
  z -= f * 0.07 * exp(-pow((v - 0.36) / 0.07, 2.0));
  // Hanging drape folds: deep and soft at the hem, fading out by the chest.
  float drape = 0.25 + 0.75 * hem;
  z += f * 0.11 * sin(p.x * 5.6 + 0.8 + seed) * drape;
  z += f * 0.035 * sin(p.x * 12.0 + p.y * 1.3 - seed) * drape;
  // A diagonal pull across the body, like cloth gathered at one shoulder.
  z += f * 0.05 * sin((p.x * 0.9 + p.y) * 2.6 + seed) * (1.0 - hem);

  // ── Wind ─────────────────────────────────────────────────────────────────
  float pin = mix(0.3, 1.0, 1.0 - clamp(v, 0.0, 1.0));
  float w = 0.42 * sin(p.x * 1.35 + t * 1.25 + p.y * 0.55 + seed)
          + 0.26 * sin(p.y * 2.3 - t * 1.65 + p.x * 0.7 + seed * 2.0)
          + 0.62 * ym_snoise(vec3(p * 0.5, t * 0.22 + seed));
  float windAmp = uWind * 0.24 * pin * (1.0 - 0.45 * f);
  z += windAmp * w;
  float sway = uWind * 0.05 * pin * ym_snoise(vec3(p * 0.35 + 7.0, t * 0.17 + seed));

  // ── Velocity ripple travelling up the cloth ──────────────────────────────
  float ripple = sin(p.y * 3.4 - t * 7.5 + uLayerIndex * 0.6 * uSpread)
               * (0.65 + 0.35 * sin(p.x * 1.7 + t * 1.3));
  z += uVelocity * 0.26 * ripple * (0.45 + 0.55 * (1.0 - clamp(v, 0.0, 1.0)));

  // ── Collar: the top band rolls forward and lies down as a V-neck lapel ───
  float cu = 1.0 - clamp(abs(u), 0.0, 1.0);
  float collarStart = halfH - 0.45 - f * 0.55 * cu * cu;
  float s = max(y - collarStart, 0.0);
  float kRoll = f * 5.2;
  float sr = min(s, 0.6);
  vec2 roll = ym_bend(sr, kRoll);
  float aRoll = sr * kRoll;
  roll += (s - sr) * vec2(cos(aRoll), sin(aRoll));
  y = min(y, collarStart) + roll.x;
  z += roll.y;

  // ── Wrap around a vertical cylinder (the "body") ─────────────────────────
  float k = f * 0.62;
  vec2 wrap = ym_bend(p.x, k);
  float a = p.x * k;
  float x = wrap.x + z * sin(a) + sway;
  float zz = -wrap.y + z * cos(a);

  return vec3(x, y, zz);
}
`;

const FABRIC_VERTEX = /* glsl */ `
${DEFORM_GLSL}

varying vec2 vPanel;
varying vec3 vWorldPos;
varying vec3 vWorldNormal;
varying float vAO;

#include <fog_pars_vertex>

void main() {
  vec2 p = position.xy;
  const float e = 0.018;
  vec3 c  = clothDeform(p);
  vec3 px = clothDeform(p + vec2(e, 0.0));
  vec3 nx = clothDeform(p - vec2(e, 0.0));
  vec3 py = clothDeform(p + vec2(0.0, e));
  vec3 ny = clothDeform(p - vec2(0.0, e));

  vec3 n = normalize(cross(px - nx, py - ny));
  // Discrete Laplacian along the normal ≈ mean curvature: valleys (positive)
  // get ambient occlusion, ridges stay lit.
  float lap = dot(px + nx + py + ny - 4.0 * c, n) / (e * e);
  vAO = 1.0 - clamp(lap * 0.07, 0.0, 0.55);

  vPanel = p + 0.5 * uSize;
  vec4 worldPos = modelMatrix * vec4(c, 1.0);
  vWorldPos = worldPos.xyz;
  vWorldNormal = normalize(mat3(modelMatrix) * n);

  vec4 mvPosition = viewMatrix * worldPos;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}
`;

const FABRIC_FRAGMENT = /* glsl */ `
uniform vec3 uColor;
uniform vec3 uAccent;
uniform int uWeave;
uniform float uLight;
uniform float uSweep;
uniform float uDim;
uniform float uOpacity;
uniform vec2 uSize;

varying vec2 vPanel;
varying vec3 vWorldPos;
varying vec3 vWorldNormal;
varying float vAO;

#include <fog_pars_fragment>

#define TAU 6.28318530718

float ym_hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float ym_vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(ym_hash12(i), ym_hash12(i + vec2(1.0, 0.0)), u.x),
    mix(ym_hash12(i + vec2(0.0, 1.0)), ym_hash12(i + vec2(1.0, 1.0)), u.x),
    u.y);
}

// Fade a pattern of 'freq' cycles per world unit to its mean before it aliases.
float ym_aa(float freq, float px) {
  return 1.0 - smoothstep(0.22, 0.7, px * freq);
}

// Smooth plain-weave over/under: the warp thread is on top where o > 0, the
// weft where o < 0, with no hard edges (hard edges show up as seams in the bump).
float ym_overUnder(vec2 q, float warp, float weft) {
  float o = cos(q.x * 3.14159265) * cos(q.y * 3.14159265);
  float s = smoothstep(-0.4, 0.4, o);
  return mix(weft, warp, s) * (0.72 + 0.28 * abs(o));
}

// Each weave returns (height 0–1, tone 0–1). Height drives albedo and bump,
// tone adds yarn / heather colour variation.

// Heavy cotton twill: diagonal ribs.
vec2 weaveTwill(vec2 p, float px) {
  float d = 30.0;
  float rib = 0.5 + 0.5 * sin((p.x + p.y) * d * 0.5 * TAU);
  rib = pow(rib, 1.5);
  float weft = 0.5 + 0.5 * cos(p.y * d * TAU);
  float h = rib * 0.8 + weft * 0.2;
  float tone = 0.6 * ym_vnoise(p * vec2(3.0, 34.0)) + 0.4 * ym_vnoise(p * 6.0);
  return vec2(mix(0.5, h, ym_aa(d, px)), mix(0.5, tone, 0.5 + 0.5 * ym_aa(34.0, px)));
}

// Washed linen: crosshatch over/under with irregular slubs.
vec2 weaveSlub(vec2 p, float px) {
  float d = 32.0;
  vec2 q = p * d;
  float warp = 0.5 + 0.5 * cos(q.x * TAU);
  float weft = 0.5 + 0.5 * cos(q.y * TAU);
  float hatch = ym_overUnder(q, warp, weft);
  // Thread ids change where the thread profile is zero, so slubs stay seamless.
  float row = floor(q.y + 0.5);
  float col = floor(q.x + 0.5);
  float slubWeft = smoothstep(0.6, 0.92, ym_vnoise(vec2(p.x * 2.4 + row * 7.31, row * 1.7)));
  float slubWarp = smoothstep(0.68, 0.95, ym_vnoise(vec2(col * 3.1, p.y * 1.8 + col * 5.3)));
  float thick = max(slubWeft * weft, 0.7 * slubWarp * warp);
  float h = hatch * 0.72 + thick * 0.55;
  float fade = ym_aa(d, px);
  float streak = ym_vnoise(vec2(p.x * 1.1, p.y * 9.0));
  float tone = 0.5 + 0.4 * (thick - 0.25) * fade + 0.25 * (streak - 0.5);
  return vec2(mix(0.5, h, fade), tone);
}

// Merino rib knit: vertical wales (1x1 rib) made of stacked V stitches.
vec2 weaveRib(vec2 p, float px) {
  float cols = 10.0;
  float rows = 14.0;
  float cx = p.x * cols;
  float lx = fract(cx) - 0.5;
  float wale = cos(lx * 3.14159265);
  float purl = mod(floor(cx), 2.0);
  float chev = abs(fract(p.y * rows + abs(lx) * 1.5) - 0.5) * 2.0;
  float stitch = smoothstep(0.0, 0.85, 1.0 - chev);
  float knit = wale * (0.5 + 0.5 * stitch);
  float h = mix(knit, wale * 0.32, purl);
  float colsOnly = wale * mix(1.0, 0.45, purl);
  h = mix(colsOnly, h, ym_aa(rows * 1.5, px));
  h = mix(0.5, h, ym_aa(cols * 2.0, px));
  float tone = 0.5 + 0.45 * (ym_vnoise(p * vec2(5.0, 1.6)) - 0.5) + 0.2 * (ym_vnoise(p * 23.0) - 0.5);
  return vec2(h, tone);
}

// Cotton poplin: very fine plain-weave crosshatch.
vec2 weavePlain(vec2 p, float px) {
  float d = 64.0;
  vec2 q = p * d;
  float warp = 0.5 + 0.5 * cos(q.x * TAU);
  float weft = 0.5 + 0.5 * cos(q.y * TAU);
  float h = ym_overUnder(q, warp, weft) * 0.75 + 0.25 * warp * weft;
  float tone = 0.5 + 0.22 * (ym_vnoise(p * 4.0) - 0.5);
  return vec2(mix(0.5, h, ym_aa(d, px)), tone);
}

// Cotton canvas: coarse 2x2 basket weave (pairs of threads over/under).
vec2 weaveCanvas(vec2 p, float px) {
  float d = 26.0;
  vec2 q = p * d;
  float warp = 0.5 + 0.5 * cos(q.x * TAU);
  float weft = 0.5 + 0.5 * cos(q.y * TAU);
  // Over/under switches every two threads.
  float o = cos(q.x * 1.5707963 - 0.785398) * cos(q.y * 1.5707963 - 0.785398);
  float s = smoothstep(-0.35, 0.35, o);
  float h = mix(weft, warp, s) * (0.7 + 0.3 * abs(o));
  float fade = ym_aa(d, px);
  float tone = 0.5 + 0.3 * (ym_vnoise(p * vec2(1.4, 11.0)) - 0.5) + 0.08 * (s - 0.5) * fade;
  return vec2(mix(0.5, h, fade), tone);
}

// Bump mapping from a procedural height (screen-space derivatives).
vec3 ym_bump(vec3 pos, vec3 n, float h, float scale) {
  vec3 dpdx = dFdx(pos);
  vec3 dpdy = dFdy(pos);
  float dhdx = dFdx(h) * scale;
  float dhdy = dFdy(h) * scale;
  vec3 r1 = cross(dpdy, n);
  vec3 r2 = cross(n, dpdx);
  float det = dot(dpdx, r1);
  if (abs(det) < 1e-20) return n;
  vec3 grad = sign(det) * (dhdx * r1 + dhdy * r2);
  return normalize(n - grad / abs(det));
}

void main() {
  vec2 p = vPanel;
  vec2 fw = fwidth(p);
  float px = max(max(fw.x, fw.y), 1e-5);

  vec2 weave;
  float bumpScale;
  if (uWeave == 0) {
    weave = weaveTwill(p, px);
    bumpScale = 0.0036;
  } else if (uWeave == 1) {
    weave = weaveSlub(p, px);
    bumpScale = 0.005;
  } else if (uWeave == 2) {
    weave = weaveRib(p, px);
    bumpScale = 0.0085;
  } else if (uWeave == 3) {
    weave = weavePlain(p, px);
    bumpScale = 0.0016;
  } else {
    weave = weaveCanvas(p, px);
    bumpScale = 0.0045;
  }
  float h = weave.x;
  float tone = weave.y;

  bool front = gl_FrontFacing;
  vec3 N = normalize(vWorldNormal) * (front ? 1.0 : -1.0);
  N = ym_bump(vWorldPos, N, h, bumpScale);
  vec3 V = normalize(cameraPosition - vWorldPos);

  // ── Albedo ───────────────────────────────────────────────────────────────
  vec3 albedo = uColor * (0.76 + 0.36 * h) * (0.88 + 0.24 * tone);
  if (!front) albedo *= 0.6;

  // ── Seam: folded hem band + dashed accent stitches ───────────────────────
  float dX = min(p.x, uSize.x - p.x);
  float dY = min(p.y, uSize.y - p.y);
  float dEdge = min(dX, dY);
  float along = dX < dY ? p.y : p.x;
  const float seamInset = 0.085;
  float edgeW = max(fwidth(dEdge), 1e-5);
  float hemBand = 1.0 - smoothstep(seamInset + 0.035, seamInset + 0.035 + edgeW * 1.5, dEdge);
  float hemCrease = 1.0 - smoothstep(0.0, edgeW * 1.5, abs(dEdge - (seamInset + 0.035)));
  float seamLine = 1.0 - smoothstep(0.007, 0.007 + edgeW * 1.2, abs(dEdge - seamInset));
  const float stitchLen = 0.075;
  float sp = fract(along / stitchLen);
  float dashW = max(fwidth(along / stitchLen), 1e-5);
  float dash = smoothstep(0.18, 0.18 + dashW, sp) * (1.0 - smoothstep(0.72, 0.72 + dashW, sp));
  dash = mix(0.55, dash, 1.0 - smoothstep(0.25, 0.6, dashW));
  float stitch = seamLine * dash;
  albedo *= mix(1.0, 0.82, hemBand) * (1.0 - 0.35 * hemCrease);

  // ── Lighting ─────────────────────────────────────────────────────────────
  float ang = uSweep * 1.15;
  vec3 L = normalize(vec3(sin(ang) * 1.25, 0.6, cos(ang) * 0.85 + 0.3));
  vec3 keyCol = vec3(1.0, 0.92, 0.82);
  const float wrapK = 0.22;
  float ndl = max((dot(N, L) + wrapK) / (1.0 + wrapK), 0.0);
  float band = exp(-pow((vWorldPos.x - uSweep * 3.2) / 1.2, 2.0));

  vec3 Lf = normalize(vec3(-0.85, 0.2, 0.5));
  vec3 fillCol = vec3(0.4, 0.48, 0.64);
  float ndf = max((dot(N, Lf) + 0.4) / 1.4, 0.0);

  float ao = vAO * (0.84 + 0.16 * h);
  vec3 diffuse = albedo * (
      keyCol * ndl * 1.0 * uLight * (0.6 + 0.65 * band)
    + fillCol * ndf * 0.22
    + vec3(0.035)
  ) * ao;

  float ndv = clamp(dot(N, V), 0.0, 1.0);
  float fres = pow(1.0 - ndv, 3.0);
  vec3 sheenCol = mix(albedo * 1.3 + 0.06, uAccent, 0.55);
  vec3 sheen = sheenCol * fres * (0.3 + 0.7 * ndl) * 0.95 * (0.5 + 0.5 * uLight) * ao;

  vec3 H = normalize(L + V);
  float spec = pow(max(dot(N, H), 0.0), 26.0) * 0.06 * uLight * (0.6 + 0.4 * h);

  vec3 col = diffuse + sheen + keyCol * spec;

  vec3 stitchCol = uAccent * (0.35 + 1.1 * ndl * uLight) + uAccent * fres * 0.4;
  col = mix(col, stitchCol * ao, stitch * 0.92);

  // ── Focus dimming ────────────────────────────────────────────────────────
  float luma = dot(col, vec3(0.2126, 0.7152, 0.0722));
  col = mix(col, vec3(luma), uDim * 0.45);
  col *= 1.0 - uDim;

  gl_FragColor = vec4(col, uOpacity);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
  #include <fog_fragment>
}
`;

const OUTLINE_VERTEX = /* glsl */ `
${DEFORM_GLSL}

#include <fog_pars_vertex>

void main() {
  vec2 p = position.xy;
  const float e = 0.02;
  vec3 c = clothDeform(p);
  vec3 n = normalize(cross(
    clothDeform(p + vec2(e, 0.0)) - clothDeform(p - vec2(e, 0.0)),
    clothDeform(p + vec2(0.0, e)) - clothDeform(p - vec2(0.0, e))
  ));
  c += n * 0.006;
  vec4 worldPos = modelMatrix * vec4(c, 1.0);
  vec4 mvPosition = viewMatrix * worldPos;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}
`;

const OUTLINE_FRAGMENT = /* glsl */ `
uniform vec3 uAccent;
uniform float uLineOpacity;
uniform float uDim;
uniform float uOpacity;

#include <fog_pars_fragment>

void main() {
  gl_FragColor = vec4(uAccent * 1.35, uLineOpacity * uOpacity * (1.0 - uDim));
  #include <colorspace_fragment>
  #include <fog_fragment>
}
`;

export const fabricVertexShader = FABRIC_VERTEX;
export const fabricFragmentShader = FABRIC_FRAGMENT;
export const outlineVertexShader = OUTLINE_VERTEX;
export const outlineFragmentShader = OUTLINE_FRAGMENT;

/* ───────────────────────────── Uniforms & materials ───────────────────────── */

export interface FabricUniforms {
  [uniform: string]: THREE.IUniform;
  uTime: THREE.IUniform<number>;
  uColor: THREE.IUniform<THREE.Color>;
  uWeave: THREE.IUniform<number>;
  uWind: THREE.IUniform<number>;
  uFold: THREE.IUniform<number>;
  uVelocity: THREE.IUniform<number>;
  uLight: THREE.IUniform<number>;
  uSweep: THREE.IUniform<number>;
  uDim: THREE.IUniform<number>;
  uAccent: THREE.IUniform<THREE.Color>;
  uLayerIndex: THREE.IUniform<number>;
  uOpacity: THREE.IUniform<number>;
  /** Panel size in world units (width, height). */
  uSize: THREE.IUniform<THREE.Vector2>;
  /** 0 = layers share one wind field (stacked), 1 = independent (exploded / fanned). */
  uSpread: THREE.IUniform<number>;
  /** Offset along the cloth normal (world units) so folded stacks nest as shells. */
  uShell: THREE.IUniform<number>;
}

export interface FabricUniformOptions {
  color: string;
  accent: string;
  weave: number;
  layerIndex: number;
  width: number;
  height: number;
}

export function createFabricUniforms(opts: FabricUniformOptions): FabricUniforms {
  return {
    uTime: { value: 0 },
    uColor: { value: new THREE.Color(opts.color) },
    uWeave: { value: opts.weave },
    uWind: { value: 0 },
    uFold: { value: 0 },
    uVelocity: { value: 0 },
    uLight: { value: 1 },
    uSweep: { value: 0 },
    uDim: { value: 0 },
    uAccent: { value: new THREE.Color(opts.accent) },
    uLayerIndex: { value: opts.layerIndex },
    uOpacity: { value: 1 },
    uSize: { value: new THREE.Vector2(opts.width, opts.height) },
    uSpread: { value: 0 },
    uShell: { value: 0 },
  };
}

export function createFabricMaterial(uniforms: FabricUniforms): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...uniforms },
    vertexShader: fabricVertexShader,
    fragmentShader: fabricFragmentShader,
    side: THREE.DoubleSide,
    transparent: true,
    depthWrite: true,
    fog: true,
    // Push the cloth back a hair so its outline never z-fights with it.
    polygonOffset: true,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 1,
  });
}

export interface OutlineUniforms extends FabricUniforms {
  uLineOpacity: THREE.IUniform<number>;
}

/**
 * The outline material shares the deformation uniforms of its cloth layer
 * (same IUniform objects), so it always follows the cloth.
 */
export function createOutlineMaterial(fabric: FabricUniforms): {
  material: THREE.ShaderMaterial;
  uniforms: OutlineUniforms;
} {
  const uniforms: OutlineUniforms = { ...fabric, uLineOpacity: { value: 0.12 } };
  const material = new THREE.ShaderMaterial({
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...uniforms },
    vertexShader: outlineVertexShader,
    fragmentShader: outlineFragmentShader,
    transparent: true,
    depthWrite: false,
    fog: true,
    toneMapped: false,
  });
  return { material, uniforms };
}

/**
 * Border line (subdivided so it can follow the cloth deformation) plus
 * corner registration ticks for the "technical exploded diagram" look.
 * Built as segment pairs for a single LineSegments draw.
 */
export function createOutlineGeometry(width: number, height: number): THREE.BufferGeometry {
  const hw = width / 2;
  const hh = height / 2;
  const pts: number[] = [];
  const seg = (x0: number, y0: number, x1: number, y1: number) => {
    pts.push(x0, y0, 0, x1, y1, 0);
  };
  const edge = (x0: number, y0: number, x1: number, y1: number, steps: number) => {
    for (let i = 0; i < steps; i++) {
      const a = i / steps;
      const b = (i + 1) / steps;
      seg(x0 + (x1 - x0) * a, y0 + (y1 - y0) * a, x0 + (x1 - x0) * b, y0 + (y1 - y0) * b);
    }
  };
  edge(-hw, -hh, hw, -hh, 48);
  edge(hw, -hh, hw, hh, 64);
  edge(hw, hh, -hw, hh, 48);
  edge(-hw, hh, -hw, -hh, 64);

  // Corner ticks just outside each corner.
  const gap = 0.12;
  const len = 0.22;
  for (const sx of [-1, 1]) {
    for (const sy of [-1, 1]) {
      const cx = sx * (hw + gap);
      const cy = sy * (hh + gap);
      seg(cx, cy, cx - sx * len, cy);
      seg(cx, cy, cx, cy - sy * len);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
  return geometry;
}
