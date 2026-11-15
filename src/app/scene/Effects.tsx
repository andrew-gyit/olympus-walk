import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useGameStore } from '../../stores/gameStore';
import { footprintEmitter } from '../../game/core/FootprintEmitter';
import { terrainGenerator } from '../../world/TerrainGenerator';

const COUNT = 240;
const dummy = new THREE.Object3D();
const normal = new THREE.Vector3();
const up = new THREE.Vector3(0, 1, 0);
const qNormal = new THREE.Quaternion();
const qYaw = new THREE.Quaternion();
const qFlat = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0));

export function Footprints() {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const cursor = useRef(0);
  const step = useRef(0);

  useEffect(() => {
    if (mesh.current) {
      const zero = new THREE.Matrix4().makeScale(0, 0, 0);
      for (let i = 0; i < COUNT; i++) mesh.current.setMatrixAt(i, zero);
      mesh.current.instanceMatrix.needsUpdate = true;
    }
    footprintEmitter.emit = (x, z, heading) => {
      if (!mesh.current) return;
      step.current++;
      const side = step.current % 2 === 0 ? 1 : -1;
      const right = new THREE.Vector3(Math.cos(heading), 0, -Math.sin(heading));
      const px = x + right.x * 0.13 * side;
      const pz = z + right.z * 0.13 * side;
      const y = terrainGenerator.height(px, pz);
      terrainGenerator.normalAt(px, pz, normal);
      qNormal.setFromUnitVectors(up, normal);
      qYaw.setFromAxisAngle(up, heading + (side > 0 ? 0.08 : -0.08));
      dummy.position.set(px, y + 0.035, pz);
      dummy.quaternion.copy(qNormal).multiply(qYaw).multiply(qFlat);
      dummy.scale.set(1, 1.12, 1);
      dummy.updateMatrix();
      mesh.current.setMatrixAt(cursor.current, dummy.matrix);
      mesh.current.instanceMatrix.needsUpdate = true;
      cursor.current = (cursor.current + 1) % COUNT;
    };
    return () => {
      footprintEmitter.emit = () => {};
    };
  }, []);

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, COUNT]} frustumCulled={false}>
      <planeGeometry args={[0.24, 0.4]} />
      <meshBasicMaterial
        color="#1c0f0b"
        transparent
        opacity={0.32}
        depthWrite={false}
        polygonOffset
        polygonOffsetFactor={-2}
        side={THREE.DoubleSide}
      />
    </instancedMesh>
  );
}

export function DustField() {
  const points = useRef<THREE.Points>(null);
  const material = useRef<THREE.PointsMaterial>(null);
  const { positions, base } = useMemo(() => {
    const count = 1600;
    const positions = new Float32Array(count * 3);
    const base = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const x = (Math.random() * 2 - 1) * 70;
      const y = Math.random() * 22;
      const z = (Math.random() * 2 - 1) * 70;
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
      base[i * 3] = 0.4 + Math.random() * 0.6;
      base[i * 3 + 1] = 0.4 + Math.random() * 0.6;
      base[i * 3 + 2] = 0.4 + Math.random() * 0.6;
    }
    return { positions, base };
  }, []);

  useFrame((_, dt) => {
    if (!points.current) return;
    const s = useGameStore.getState();
    const p = s.telemetry.position;
    const env = s.environment;
    const arr = points.current.geometry.attributes.position.array as Float32Array;
    const wind = env.windMs * 0.22 + 0.6;
    const storm = env.dustStorm ? 2.1 : 1;
    for (let i = 0; i < arr.length; i += 3) {
      arr[i] += wind * dt * (0.5 + base[i] * 0.5);
      arr[i + 1] += Math.sin(performance.now() * 0.0005 + i) * dt * 0.16;
      arr[i + 2] += wind * 0.42 * dt * (0.4 + base[i + 2] * 0.6);
      if (arr[i] > 70) arr[i] -= 140;
      if (arr[i] < -70) arr[i] += 140;
      if (arr[i + 2] > 70) arr[i + 2] -= 140;
      if (arr[i + 2] < -70) arr[i + 2] += 140;
      if (arr[i + 1] > 24) arr[i + 1] = 0.1;
    }
    points.current.geometry.attributes.position.needsUpdate = true;
    points.current.position.set(p.x, p.y - 8, p.z);
    if (material.current) {
      material.current.opacity = Math.min(0.75, 0.24 + env.dust * 0.5);
      material.current.size = env.dustStorm ? 0.2 : 0.12;
    }
  });

  return (
    <points ref={points} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[base, 3]} />
      </bufferGeometry>
      <pointsMaterial
        ref={material}
        size={0.13}
        sizeAttenuation
        transparent
        opacity={0.38}
        depthWrite={false}
        color="#e8b48a"
        blending={THREE.NormalBlending}
      />
    </points>
  );
}
