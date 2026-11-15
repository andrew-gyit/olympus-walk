import { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { getRockField, type RockInstance } from '../../world/WorldProps';

const dummy = new THREE.Object3D();
const color = new THREE.Color();

function fillInstances(mesh: THREE.InstancedMesh, rocks: RockInstance[], yScale = 1) {
  for (let i = 0; i < rocks.length; i++) {
    const r = rocks[i];
    dummy.position.set(r.x, r.y, r.z);
    dummy.rotation.set(r.tilt, r.rotation, r.tilt * 0.4);
    dummy.scale.set(r.scale, r.scale * yScale, r.scale);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
    mesh.setColorAt(i, color.set(r.color));
  }
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
}

export function RockField() {
  const field = useMemo(() => getRockField(), []);
  const pebbles = useRef<THREE.InstancedMesh>(null);
  const boulders = useRef<THREE.InstancedMesh>(null);
  const slabs = useRef<THREE.InstancedMesh>(null);

  useLayoutEffect(() => {
    if (pebbles.current) fillInstances(pebbles.current, field.pebbles, 0.65);
    if (boulders.current) fillInstances(boulders.current, field.boulders, 0.9);
    if (slabs.current) fillInstances(slabs.current, field.slabs, 0.55);
  }, [field]);

  return (
    <group>
      <instancedMesh ref={pebbles} args={[undefined, undefined, field.pebbles.length]} frustumCulled>
        <dodecahedronGeometry args={[0.5, 0]} />
        <meshStandardMaterial color="#ffffff" roughness={0.98} metalness={0.02} />
      </instancedMesh>
      <instancedMesh
        ref={boulders}
        args={[undefined, undefined, field.boulders.length]}
        castShadow
        receiveShadow
        frustumCulled
      >
        <dodecahedronGeometry args={[0.62, 1]} />
        <meshStandardMaterial color="#ffffff" roughness={0.94} metalness={0.03} />
      </instancedMesh>
      <instancedMesh
        ref={slabs}
        args={[undefined, undefined, field.slabs.length]}
        castShadow
        receiveShadow
        frustumCulled
      >
        <boxGeometry args={[1.05, 0.42, 0.75]} />
        <meshStandardMaterial color="#ffffff" roughness={0.97} metalness={0.02} />
      </instancedMesh>
    </group>
  );
}
