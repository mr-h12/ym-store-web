"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { SCENE } from "@/lib/scene-config";
import { scrollState } from "@/lib/scroll-state";
import { INTRO_SCENE } from "@/lib/chapters";
import {
  dustFragmentShader,
  dustVertexShader,
  glowFragmentShader,
  glowVertexShader,
  gridFragmentShader,
  gridVertexShader,
  vignetteFragmentShader,
  vignetteVertexShader,
} from "./backdropShaders";
import {
  NARROW_BREAKPOINT,
  SCENE_DAMPING,
  clampDelta,
  useReducedMotionRef,
  velocityAmount,
} from "./sceneUtils";

const DUST_COUNT = 600;
const FLOOR_Y = -3;

/** Deterministic PRNG so the dust field is identical on every load. */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function createDustGeometry(count: number): THREE.BufferGeometry {
  const rand = mulberry32(0x5eed);
  const positions = new Float32Array(count * 3);
  const seeds = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (rand() - 0.5) * 24;
    positions[i * 3 + 1] = -3.4 + rand() * 9;
    positions[i * 3 + 2] = -12 + rand() * 18;
    seeds[i * 3] = rand();
    seeds[i * 3 + 1] = rand();
    seeds[i * 3 + 2] = rand();
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 3));
  return geometry;
}

/**
 * Atmosphere around the cloth: fading floor grid with an accent hairline,
 * ~600 drifting dust motes, a faint rust glow behind the cloth and a
 * full-screen vignette. The cloth shader lights itself, so no lights here.
 */
export function Backdrop() {
  const glowRef = useRef<THREE.Mesh>(null);
  const reducedMotion = useReducedMotionRef();
  const local = useRef({ time: 0, lift: 0, light: INTRO_SCENE.light, offsetX: INTRO_SCENE.offsetX });

  const res = useMemo(() => {
    const accent = new THREE.Color(SCENE.accent);

    const gridGeometry = new THREE.PlaneGeometry(140, 140, 1, 1);
    const gridMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uAccent: { value: accent.clone() },
        uLineColor: { value: new THREE.Color("#c9c9d2") },
        uOpacity: { value: 1 },
        uCenter: { value: new THREE.Vector2(0, -1) },
      },
      vertexShader: gridVertexShader,
      fragmentShader: gridFragmentShader,
      transparent: true,
      depthWrite: false,
      toneMapped: false,
    });

    const dustGeometry = createDustGeometry(DUST_COUNT);
    const dustMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uLift: { value: 0 },
        uPixelRatio: { value: 1 },
        uSize: { value: 30 },
        uAccent: { value: accent.clone() },
        uOpacity: { value: 0.7 },
      },
      vertexShader: dustVertexShader,
      fragmentShader: dustFragmentShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    });

    const glowGeometry = new THREE.PlaneGeometry(22, 22, 1, 1);
    const glowMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uAccent: { value: accent.clone() },
        uIntensity: { value: 0.2 },
      },
      vertexShader: glowVertexShader,
      fragmentShader: glowFragmentShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    });

    const vignetteGeometry = new THREE.PlaneGeometry(1, 1, 1, 1);
    const vignetteMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: new THREE.Color(SCENE.background) },
        uStrength: { value: 0.85 },
        uAspect: { value: 1 },
      },
      vertexShader: vignetteVertexShader,
      fragmentShader: vignetteFragmentShader,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      toneMapped: false,
    });

    return {
      gridGeometry,
      gridMaterial,
      dustGeometry,
      dustMaterial,
      glowGeometry,
      glowMaterial,
      vignetteGeometry,
      vignetteMaterial,
    };
  }, []);

  useEffect(
    () => () => {
      res.gridGeometry.dispose();
      res.gridMaterial.dispose();
      res.dustGeometry.dispose();
      res.dustMaterial.dispose();
      res.glowGeometry.dispose();
      res.glowMaterial.dispose();
      res.vignetteGeometry.dispose();
      res.vignetteMaterial.dispose();
    },
    [res],
  );

  useFrame((state, delta) => {
    const dt = clampDelta(delta);
    const l = local.current;
    const target = scrollState.scene;
    const narrow = state.size.width < NARROW_BREAKPOINT;

    l.time += dt;
    l.light = THREE.MathUtils.damp(l.light, target.light, SCENE_DAMPING, dt);
    l.offsetX = THREE.MathUtils.damp(l.offsetX, target.offsetX, SCENE_DAMPING, dt);
    if (!reducedMotion.current) {
      // Dust streams a little with the scroll.
      l.lift += velocityAmount(scrollState.velocity) * Math.sign(scrollState.velocity || 0) * dt * 1.6;
    }

    const dust = res.dustMaterial.uniforms;
    dust.uTime.value = reducedMotion.current ? l.time * 0.3 : l.time;
    dust.uLift.value = l.lift;
    dust.uPixelRatio.value = state.viewport.dpr;

    res.glowMaterial.uniforms.uIntensity.value = 0.12 + 0.12 * l.light;
    res.vignetteMaterial.uniforms.uAspect.value = state.size.width / Math.max(state.size.height, 1);

    const glow = glowRef.current;
    if (glow) {
      glow.position.set(l.offsetX * (narrow ? 0.2 : 0.75), 0.4, -6);
      glow.quaternion.copy(state.camera.quaternion);
    }
  });

  return (
    <>
      <mesh
        geometry={res.gridGeometry}
        material={res.gridMaterial}
        position={[0, FLOOR_Y, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        renderOrder={-2}
      />
      <mesh ref={glowRef} geometry={res.glowGeometry} material={res.glowMaterial} renderOrder={-1} />
      <points geometry={res.dustGeometry} material={res.dustMaterial} frustumCulled={false} />
      <mesh
        geometry={res.vignetteGeometry}
        material={res.vignetteMaterial}
        frustumCulled={false}
        renderOrder={1000}
      />
    </>
  );
}
