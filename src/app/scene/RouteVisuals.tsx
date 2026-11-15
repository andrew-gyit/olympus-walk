import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import { useGameStore } from '../../stores/gameStore';
import { terrainGenerator } from '../../world/TerrainGenerator';

function makeDestinationLabel(text: string) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 104;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = 'rgba(18,10,8,0.86)';
  ctx.fillRect(0, 0, 512, 104);
  ctx.strokeStyle = '#8ff0d2';
  ctx.lineWidth = 3;
  ctx.strokeRect(1.5, 1.5, 509, 101);
  ctx.fillStyle = '#8ff0d2';
  ctx.font = 'bold 22px Consolas, monospace';
  ctx.fillText('DESTINATION', 20, 36);
  ctx.fillStyle = '#f6e2cd';
  ctx.font = 'bold 34px Bahnschrift, Segoe UI, sans-serif';
  ctx.fillText(text.slice(0, 26).toUpperCase(), 20, 78);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

export function RouteVisuals() {
  const navigation = useGameStore((s) => s.navigation);
  const activePanel = useGameStore((s) => s.activePanel);
  const destination = navigation.destination;
  const routes = navigation.routes;
  const selected = navigation.selectedRoute;
  const ring = useRef<THREE.Mesh>(null);
  const beam = useRef<THREE.Mesh>(null);
  const label = useMemo(
    () => (navigation.destinationLabel ? makeDestinationLabel(navigation.destinationLabel) : null),
    [navigation.destinationLabel]
  );

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (ring.current) ring.current.rotation.z = t * 0.9;
    if (beam.current) {
      const mat = beam.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.24 + Math.sin(t * 2.6) * 0.08;
    }
  });

  if (!destination) return null;
  const y = terrainGenerator.height(destination.x, destination.z);

  return (
    <group>
      {activePanel === 'map' &&
        routes
          .filter((r) => r.id !== selected?.id)
          .map((route) => (
            <Line
              key={route.id}
              points={route.points.map((p) => [p.x, p.y + 0.45, p.z] as [number, number, number])}
              color={route.color}
              lineWidth={1.25}
              transparent
              opacity={0.32}
              depthWrite={false}
            />
          ))}
      {selected && (
        <>
          <Line
            points={selected.points.map((p) => [p.x, p.y + 0.55, p.z] as [number, number, number])}
            color={selected.color}
            lineWidth={3}
            transparent
            opacity={0.95}
            depthWrite={false}
          />
          <Line
            points={selected.points.map((p) => [p.x, p.y + 0.62, p.z] as [number, number, number])}
            color="#fff3e2"
            lineWidth={1}
            transparent
            opacity={0.5}
            depthWrite={false}
          />
        </>
      )}
      <group position={[destination.x, y, destination.z]}>
        <mesh ref={ring} position={[0, 0.14, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.2, 1.5, 36]} />
          <meshBasicMaterial color="#8ff0d2" transparent opacity={0.9} depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
        <mesh ref={beam} position={[0, 1.5, 0]}>
          <cylinderGeometry args={[0.06, 0.24, 3, 8, 1, true]} />
          <meshBasicMaterial color="#8ff0d2" transparent opacity={0.28} depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
        {label && (
          <sprite position={[0, 4.4, 0]} scale={[7.2, 1.46, 1]}>
            <spriteMaterial map={label} transparent depthTest depthWrite={false} />
          </sprite>
        )}
      </group>
    </group>
  );
}
