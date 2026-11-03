"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { SCENE } from "@/lib/scene-config";
import { INTRO_SCENE } from "@/lib/chapters";
import { scrollState, type SceneState } from "@/lib/scroll-state";
import { createLayerPose, solveLayerPose } from "./layerLayout";
import {
  NARROW_BREAKPOINT,
  SCENE_DAMPING,
  clampDelta,
  dampSceneState,
  useReducedMotionRef,
} from "./sceneUtils";

/** Target height of the normalised model, in world units. */
const MODEL_HEIGHT = 4;

interface TintRecord {
  material: THREE.Material & { color: THREE.Color };
  base: THREE.Color;
}

interface ModelLayer {
  object: THREE.Object3D;
  basePosition: THREE.Vector3;
  baseQuaternion: THREE.Quaternion;
  baseScale: THREE.Vector3;
  tints: TintRecord[];
}

interface PreparedModel {
  model: THREE.Object3D;
  /** Uniform scale that normalises the model to MODEL_HEIGHT. */
  scale: number;
  /** Offset (already scaled) that centres the model at the origin. */
  offset: THREE.Vector3;
  layers: ModelLayer[];
  /** Converts world-unit offsets into the layer container's local units. */
  unit: number;
  materials: THREE.Material[];
}

const hasColor = (m: THREE.Material): m is THREE.Material & { color: THREE.Color } =>
  "color" in m && (m as { color?: unknown }).color instanceof THREE.Color;

const isMesh = (o: THREE.Object3D): o is THREE.Mesh => (o as THREE.Mesh).isMesh === true;

function containsMesh(o: THREE.Object3D): boolean {
  let found = false;
  o.traverse((child) => {
    if (isMesh(child)) found = true;
  });
  return found;
}

function prepareModel(source: THREE.Object3D): PreparedModel {
  const model = source.clone(true);
  const materials: THREE.Material[] = [];

  // Per-instance materials so focus dimming never leaks into the GLTF cache.
  model.traverse((child) => {
    if (!isMesh(child)) return;
    if (Array.isArray(child.material)) {
      child.material = child.material.map((m) => {
        const c = m.clone();
        materials.push(c);
        return c;
      });
    } else {
      const c = child.material.clone();
      materials.push(c);
      child.material = c;
    }
  });

  model.position.set(0, 0, 0);
  model.quaternion.identity();
  model.scale.set(1, 1, 1);
  model.updateMatrixWorld(true);

  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const ref = size.y > 1e-6 ? size.y : Math.max(size.x, size.z, 1e-6);
  const scale = MODEL_HEIGHT / ref;
  const offset = center.multiplyScalar(-scale);

  // Unwrap single-child wrapper nodes (typical "Scene" / "RootNode" chains)
  // until we reach the node whose children are the layers.
  let container: THREE.Object3D = model;
  while (container.children.length === 1 && !isMesh(container.children[0])) {
    container = container.children[0];
  }
  let layerObjects = container.children.filter(containsMesh);
  if (layerObjects.length === 0 && isMesh(container)) layerObjects = [container];

  const containerScale = container.getWorldScale(new THREE.Vector3());
  const unit = 1 / (scale * Math.max(containerScale.x, 1e-6));

  const layers: ModelLayer[] = layerObjects.map((object) => {
    const tints: TintRecord[] = [];
    object.traverse((child) => {
      if (!isMesh(child)) return;
      const list = Array.isArray(child.material) ? child.material : [child.material];
      for (const m of list) {
        if (hasColor(m)) tints.push({ material: m, base: m.color.clone() });
      }
    });
    return {
      object,
      basePosition: object.position.clone(),
      baseQuaternion: object.quaternion.clone(),
      baseScale: object.scale.clone(),
      tints,
    };
  });

  return { model, scale, offset, layers, unit, materials };
}

/**
 * Optional .glb centerpiece (used when MODEL_URL is set). The model is centred
 * and normalised to ~4 units tall; each direct child mesh/group is treated as a
 * layer and gets the same explode / fan / focus choreography as FabricLayers.
 * Standard materials need light, so this component brings its own rig.
 */
export function GlbCenterpiece({ url }: { url: string }) {
  const gltf = useGLTF(url);
  const prepared = useMemo(() => prepareModel(gltf.scene), [gltf.scene]);
  const rootRef = useRef<THREE.Group>(null);
  const keyRef = useRef<THREE.DirectionalLight>(null);
  const reducedMotion = useReducedMotionRef();

  const local = useRef({
    scene: { ...INTRO_SCENE } as SceneState,
    focusWeights: prepared.layers.map((_, i): number => (i === INTRO_SCENE.focusLayer ? 1 : 0)),
    pointerX: 0,
    pointerY: 0,
    time: 0,
    pose: createLayerPose(),
    euler: new THREE.Euler(),
    quat: new THREE.Quaternion(),
  });

  useEffect(
    () => () => {
      for (const m of prepared.materials) m.dispose();
    },
    [prepared],
  );

  useFrame((state, delta) => {
    const dt = clampDelta(delta);
    const l = local.current;
    const cur = l.scene;
    const reduced = reducedMotion.current;
    const count = prepared.layers.length;

    dampSceneState(cur, scrollState.scene, SCENE_DAMPING, dt);
    if (l.focusWeights.length !== count) {
      l.focusWeights = prepared.layers.map((_, i): number => (i === cur.focusLayer ? 1 : 0));
    }
    for (let i = 0; i < count; i++) {
      l.focusWeights[i] = THREE.MathUtils.damp(
        l.focusWeights[i],
        i === cur.focusLayer ? 1 : 0,
        SCENE_DAMPING,
        dt,
      );
    }
    l.pointerX = THREE.MathUtils.damp(l.pointerX, scrollState.pointer.x, 3, dt);
    l.pointerY = THREE.MathUtils.damp(l.pointerY, scrollState.pointer.y, 3, dt);
    l.time += reduced ? dt * 0.4 : dt;

    const root = rootRef.current;
    if (root) {
      const narrow = state.size.width < NARROW_BREAKPOINT;
      const sway = reduced ? 0 : Math.sin(l.time * 0.23) * 0.05;
      root.rotation.x = cur.rotX - l.pointerY * 0.08;
      root.rotation.y = cur.rotY + sway + l.pointerX * 0.08;
      root.position.x = cur.offsetX * (narrow ? 0.25 : 1);
      root.position.y = reduced ? 0 : Math.sin(l.time * 0.5) * 0.035;
      root.scale.setScalar(narrow ? 0.72 : 1);
    }

    for (let i = 0; i < count; i++) {
      const layer = prepared.layers[i];
      const pose = solveLayerPose(i, count, cur, l.focusWeights[i], l.pose);
      const o = layer.object;
      o.position.set(
        layer.basePosition.x + pose.x * prepared.unit,
        layer.basePosition.y + pose.y * prepared.unit,
        layer.basePosition.z + pose.z * prepared.unit,
      );
      l.euler.set(pose.rx, pose.ry, pose.rz);
      l.quat.setFromEuler(l.euler);
      o.quaternion.copy(layer.baseQuaternion).multiply(l.quat);
      o.scale.copy(layer.baseScale).multiplyScalar(pose.scale);
      const dimFactor = 1 - pose.dim;
      for (const tint of layer.tints) {
        tint.material.color.copy(tint.base).multiplyScalar(dimFactor);
      }
    }

    const key = keyRef.current;
    if (key) {
      const ang = cur.sweep * 1.15;
      key.position.set(Math.sin(ang) * 6, 4, Math.cos(ang) * 5 + 2);
      key.intensity = 2.4 * cur.light;
    }
  });

  return (
    <>
      <hemisphereLight args={["#d9d4ca", SCENE.background, 0.55]} />
      <directionalLight ref={keyRef} color="#fff1df" intensity={2.4} position={[0, 4, 6]} />
      <directionalLight color={SCENE.accent} intensity={1.6} position={[-5, 2, -4]} />
      <group ref={rootRef}>
        <group
          scale={prepared.scale}
          position={[prepared.offset.x, prepared.offset.y, prepared.offset.z]}
        >
          <primitive object={prepared.model} />
        </group>
      </group>
    </>
  );
}
