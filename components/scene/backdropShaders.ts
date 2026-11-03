/* Shaders for the floor grid, dust, glow plane and screen vignette. */

export const gridVertexShader = /* glsl */ `
varying vec3 vWorld;

void main() {
  vec4 world = modelMatrix * vec4(position, 1.0);
  vWorld = world.xyz;
  gl_Position = projectionMatrix * viewMatrix * world;
}
`;

export const gridFragmentShader = /* glsl */ `
uniform vec3 uAccent;
uniform vec3 uLineColor;
uniform float uOpacity;
uniform vec2 uCenter;

varying vec3 vWorld;

float gridLine(vec2 p, float cell, float width) {
  vec2 q = p / cell;
  vec2 fw = max(fwidth(q), vec2(1e-5));
  vec2 g = abs(fract(q - 0.5) - 0.5) / fw;
  float line = 1.0 - min(min(g.x, g.y) / width, 1.0);
  // Fade before the lines get denser than the pixels (moiré at grazing angles).
  float density = max(fw.x, fw.y);
  return line * (1.0 - smoothstep(0.12, 0.45, density));
}

void main() {
  vec2 p = vWorld.xz;
  float minor = gridLine(p, 0.5, 1.0);
  float major = gridLine(p, 2.5, 1.2);

  float dist = length(p - uCenter);
  float fade = exp(-dist * dist * 0.0035) * (1.0 - smoothstep(18.0, 42.0, dist));

  // Accent hairline running away from the viewer through the centre (x = 0).
  float fx = max(fwidth(p.x), 1e-5);
  float center = (1.0 - min(abs(p.x) / (fx * 1.1), 1.0)) * (1.0 - smoothstep(0.08, 0.35, fx));
  float centerFade = exp(-abs(p.y - uCenter.y) * 0.045);

  float gridA = (minor * 0.045 + major * 0.1) * fade;
  float accentA = center * 0.6 * centerFade * fade;

  vec3 col = mix(uLineColor, uAccent * 1.4, accentA / max(gridA + accentA, 1e-4));
  gl_FragColor = vec4(col, clamp(gridA + accentA, 0.0, 1.0) * uOpacity);
  #include <colorspace_fragment>
}
`;

export const dustVertexShader = /* glsl */ `
attribute vec3 aSeed;

uniform float uTime;
uniform float uLift;
uniform float uPixelRatio;
uniform float uSize;

varying float vAlpha;
varying float vTint;

const float FLOOR_Y = -3.4;
const float SPAN_Y = 9.0;

void main() {
  vec3 p = position;
  float t = uTime;
  // Slow upward drift (plus a scroll-driven lift), wrapped inside the volume.
  p.y = FLOOR_Y + mod(p.y - FLOOR_Y + t * (0.04 + aSeed.x * 0.1) + uLift * (0.6 + aSeed.z), SPAN_Y);
  p.x += sin(t * 0.21 + aSeed.y * 6.2831) * 0.35;
  p.z += cos(t * 0.17 + aSeed.z * 6.2831) * 0.35;

  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;

  float depth = max(-mv.z, 0.001);
  gl_PointSize = uSize * (0.45 + aSeed.z * 1.1) * uPixelRatio / depth;

  float yFade = smoothstep(FLOOR_Y, FLOOR_Y + 0.8, p.y) * (1.0 - smoothstep(FLOOR_Y + SPAN_Y - 1.0, FLOOR_Y + SPAN_Y, p.y));
  float twinkle = 0.35 + 0.65 * (0.5 + 0.5 * sin(t * (0.5 + aSeed.x * 1.3) + aSeed.y * 20.0));
  float depthFade = smoothstep(0.6, 2.0, depth) * (1.0 - smoothstep(16.0, 30.0, depth));
  vAlpha = yFade * twinkle * depthFade;
  vTint = step(0.8, aSeed.y);
}
`;

export const dustFragmentShader = /* glsl */ `
uniform vec3 uAccent;
uniform float uOpacity;

varying float vAlpha;
varying float vTint;

void main() {
  float d = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.0, d);
  a *= a;
  vec3 col = mix(vec3(1.0, 0.9, 0.78), uAccent * 1.6, vTint);
  gl_FragColor = vec4(col, a * vAlpha * uOpacity);
  #include <colorspace_fragment>
}
`;

export const glowVertexShader = /* glsl */ `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const glowFragmentShader = /* glsl */ `
uniform vec3 uAccent;
uniform float uIntensity;

varying vec2 vUv;

void main() {
  vec2 c = vUv - 0.5;
  float d2 = dot(c, c) * 4.0;
  float halo = exp(-d2 * 3.2);
  float core = exp(-d2 * 14.0);
  vec3 col = uAccent * halo * 0.55 + mix(uAccent, vec3(1.0, 0.82, 0.66), 0.35) * core * 0.35;
  // Additive blending: rgb * alpha is added to the frame.
  gl_FragColor = vec4(col, uIntensity);
  #include <colorspace_fragment>
}
`;

/** Full-screen quad drawn in clip space, last, to darken the frame edges. */
export const vignetteVertexShader = /* glsl */ `
varying vec2 vNdc;

void main() {
  vNdc = position.xy * 2.0;
  gl_Position = vec4(position.xy * 2.0, 0.0, 1.0);
}
`;

export const vignetteFragmentShader = /* glsl */ `
uniform vec3 uColor;
uniform float uStrength;
uniform float uAspect;

varying vec2 vNdc;

void main() {
  vec2 p = vNdc;
  p.x *= mix(1.0, uAspect, 0.35);
  float r = length(p);
  float vig = smoothstep(0.55, 1.55, r);
  // Slight letterbox weight at the top and bottom for a filmic frame.
  float bars = smoothstep(0.75, 1.0, abs(vNdc.y)) * 0.22;
  float a = clamp(vig * uStrength + bars, 0.0, 0.92);
  gl_FragColor = vec4(uColor, a);
  #include <colorspace_fragment>
}
`;
