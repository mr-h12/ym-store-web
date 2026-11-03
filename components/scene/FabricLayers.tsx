"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { SCENE, SCENE_LAYERS, WEAVES } from "@/lib/scene-config";
import { INTRO_SCENE } from "@/lib/chapters";
import { scrollState, type SceneState } from "@/lib/scroll-state";
import {
  createFabricMaterial,
  createFabricUniforms,
  createOutlineGeometry,
  createOutlineMaterial,
  type FabricUniforms,
  type OutlineUniforms,
} from "./fabricShader";
import { createLayerPose, solveLayerPose } from "./layerLayout";
import {
  NARROW_BREAKPOINT,
  SCENE_DAMPING,
  clampDelta,
  dampSceneState,
  useReducedMotionRef,
  velocityAmount,
} from "./sceneUtils";

const LAYER_COUNT = SCENE_LAYERS.length;
/** Seconds after mount before the cloth reveals itself even if the preloader never unlocks. */
const REVEAL_FALLBACK_DELAY = 6;
const REVEAL_DURATION = 1.4;
const REVEAL_STAGGER = 0.12;
/** Normal offset between neighbouring layers when folded into one garment. */
const SHELL_GAP = 0.045;

interface LayerResources {
  uniforms: FabricUniforms;
  material: THREE.ShaderMaterial;
  outlineUniforms: OutlineUniforms;
  outlineMaterial: THREE.ShaderMaterial;
}

const smoothstep = (a: number, b: number, x: number) => {
  const t = THREE.MathUtils.clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};

/**
 * Procedural centerpiece: five cloth panels (one per SCENE_LAYERS entry) with a
 * custom cloth shader, choreographed from `scrollState.scene` — stacked and
 * folded into a garment, exploded like a technical drawing, fanned into an
 * arc, or with one layer isolated for a close-up.
 */
export function FabricLayers() {
  const groupRef = useRef<THREE.Group>(null);
  const layerRefs = useRef<(THREE.Group | null)[]>([]);
  const reducedMotion = useReducedMotionRef();

  const local = useRef({
    scene: { ...INTRO_SCENE } as SceneState,
    focusWeights: SCENE_LAYERS.map((_, i): number => (i === INTRO_SCENE.focusLayer ? 1 : 0)),
    velocity: 0,
    pointerX: 0,
    pointerY: 0,
    time: 0,
    reveal: 0,
    sinceMount: 0,
    pose: createLayerPose(),
  });

  const resources = useMemo(() => {
    const compact = typeof window !== "undefined" && window.innerWidth < NARROW_BREAKPOINT;
    const geometry = new THREE.PlaneGeometry(
      SCENE.layerWidth,
      SCENE.layerHeight,
      compact ? 48 : 96,
      compact ? 64 : 128,
    );
    const outlineGeometry = createOutlineGeometry(SCENE.layerWidth, SCENE.layerHeight);
    const layers: LayerResources[] = SCENE_LAYERS.map((layer, i) => {
      const uniforms = createFabricUniforms({
        color: layer.color,
        accent: SCENE.accent,
        weave: Math.max(0, WEAVES.indexOf(layer.weave)),
        layerIndex: i,
        width: SCENE.layerWidth,
        height: SCENE.layerHeight,
      });
      uniforms.uOpacity.value = 0;
      const material = createFabricMaterial(uniforms);
      const outline = createOutlineMaterial(uniforms);
      return {
        uniforms,
        material,
        outlineUniforms: outline.uniforms,
        outlineMaterial: outline.material,
      };
    });
    return { geometry, outlineGeometry, layers };
  }, []);

  useEffect(
    () => () => {
      resources.geometry.dispose();
      resources.outlineGeometry.dispose();
      for (const layer of resources.layers) {
        layer.material.dispose();
        layer.outlineMaterial.dispose();
      }
    },
    [resources],
  );

  useFrame((state, delta) => {
    const dt = clampDelta(delta);
    const l = local.current;
    const cur = l.scene;
    const reduced = reducedMotion.current;

    dampSceneState(cur, scrollState.scene, SCENE_DAMPING, dt);
    for (let i = 0; i < LAYER_COUNT; i++) {
      l.focusWeights[i] = THREE.MathUtils.damp(
        l.focusWeights[i],
        i === cur.focusLayer ? 1 : 0,
        SCENE_DAMPING,
        dt,
      );
    }
    l.velocity = THREE.MathUtils.damp(
      l.velocity,
      reduced ? 0 : velocityAmount(scrollState.velocity),
      6,
      dt,
    );
    l.pointerX = THREE.MathUtils.damp(l.pointerX, scrollState.pointer.x, 3, dt);
    l.pointerY = THREE.MathUtils.damp(l.pointerY, scrollState.pointer.y, 3, dt);
    l.time += reduced ? dt * 0.4 : dt;
    l.sinceMount += dt;
    if (scrollState.ready || l.sinceMount > REVEAL_FALLBACK_DELAY) {
      l.reveal = Math.min(l.reveal + dt, REVEAL_DURATION + REVEAL_STAGGER * LAYER_COUNT);
    }

    // ── Group: scroll rotation, idle sway, pointer parallax, layout offset ──
    const group = groupRef.current;
    if (group) {
      const narrow = state.size.width < NARROW_BREAKPOINT;
      const sway = reduced ? 0 : Math.sin(l.time * 0.23) * 0.05;
      group.rotation.x = cur.rotX - l.pointerY * 0.08;
      group.rotation.y = cur.rotY + sway + l.pointerX * 0.08;
      group.position.x = cur.offsetX * (narrow ? 0.25 : 1);
      group.position.y = reduced ? 0 : Math.sin(l.time * 0.5) * 0.035;
      group.scale.setScalar(narrow ? 0.72 : 1);
    }

    // ── Layers ──────────────────────────────────────────────────────────────
    const spread = Math.min(1, cur.explode + cur.fan);
    const lineBase = 0.1 + 0.5 * smoothstep(0.5, 1, cur.explode) * (1 - 0.5 * cur.fan);
    for (let i = 0; i < LAYER_COUNT; i++) {
      const pose = solveLayerPose(i, LAYER_COUNT, cur, l.focusWeights[i], l.pose);
      const obj = layerRefs.current[i];
      if (obj) {
        obj.position.set(pose.x, pose.y, pose.z);
        obj.rotation.set(pose.rx, pose.ry, pose.rz);
        obj.scale.setScalar(pose.scale);
      }

      const opacity = smoothstep(0, REVEAL_DURATION, l.reveal - i * REVEAL_STAGGER);
      const u = resources.layers[i].uniforms;
      u.uTime.value = l.time;
      u.uWind.value = cur.wind;
      u.uFold.value = cur.fold;
      u.uVelocity.value = l.velocity;
      u.uLight.value = cur.light;
      u.uSweep.value = cur.sweep;
      u.uDim.value = pose.dim;
      u.uOpacity.value = opacity;
      u.uSpread.value = spread;
      u.uShell.value = (i - (LAYER_COUNT - 1) / 2) * SHELL_GAP * cur.fold * (1 - cur.explode);
      resources.layers[i].outlineUniforms.uLineOpacity.value = lineBase;
    }
  });

  return (
    <group ref={groupRef}>
      {resources.layers.map((layer, i) => (
        <group
          key={SCENE_LAYERS[i].id}
          ref={(node) => {
            layerRefs.current[i] = node;
          }}
        >
          <mesh
            geometry={resources.geometry}
            material={layer.material}
            frustumCulled={false}
          />
          <lineSegments
            geometry={resources.outlineGeometry}
            material={layer.outlineMaterial}
            frustumCulled={false}
          />
        </group>
      ))}
    </group>
  );
}
