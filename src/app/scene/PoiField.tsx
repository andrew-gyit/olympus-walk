import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { POIS } from '../../game/data/pois';
import { terrainGenerator } from '../../world/TerrainGenerator';
import { useGameStore } from '../../stores/gameStore';
import type { POI } from '../../game/types';

const TYPE_COLOR: Record<POI['type'], string> = {
  boulder: '#d99163',
  outcrop: '#ffcf7a',
  deposit: '#8ff0d2',
  crater: '#c98b6e',
  rover: '#9fd8e8',
  viewpoint: '#b9e6c6',
  ice: '#9fd8e8',
  beacon: '#ffb35c',
  scarp: '#d88744',
};

function makeLabel(poi: POI) {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 176;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, 640, 176);
  ctx.fillStyle = 'rgba(18,10,8,0.86)';
  ctx.fillRect(0, 0, 640, 176);
  ctx.strokeStyle = 'rgba(217,145,99,0.65)';
  ctx.lineWidth = 4;
  ctx.strokeRect(2, 2, 636, 172);
  ctx.fillStyle = TYPE_COLOR[poi.type];
  ctx.fillRect(2, 2, 10, 172);
  ctx.font = 'bold 36px Consolas, monospace';
  ctx.fillText(poi.code, 34, 58);
  ctx.font = 'bold 46px Bahnschrift, Segoe UI, sans-serif';
  ctx.fillStyle = '#f6e2cd';
  ctx.fillText(poi.shortName.toUpperCase(), 34, 116);
  ctx.font = '24px Consolas, monospace';
  ctx.fillStyle = 'rgba(217,145,99,0.8)';
  ctx.fillText(`${poi.type.toUpperCase()} · SIMULATED TARGET`, 34, 154);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function Marker({ poi }: { poi: POI }) {
  const label = useMemo(() => makeLabel(poi), [poi]);
  const color = TYPE_COLOR[poi.type];
  const ring = useRef<THREE.Mesh>(null);
  const beam = useRef<THREE.Mesh>(null);
  const diamond = useRef<THREE.Mesh>(null);
  const showLabels = useGameStore((s) => s.settings.showMarkerLabels);
  const scanned = useGameStore((s) => !!s.scanned[poi.id]);
  const analyzed = useGameStore((s) => !!s.analyzed[poi.id]);
  const reached = useGameStore((s) => !!s.reached[poi.id]);
  const focused = useGameStore(
    (s) => s.navigation.destinationPoiId === poi.id || s.analysisPoiId === poi.id || s.interaction?.poiId === poi.id
  );
  const baseY = terrainGenerator.height(poi.x, poi.z);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (ring.current) {
      ring.current.rotation.z = t * 0.32;
      const scale = focused ? 1.14 + Math.sin(t * 3.4) * 0.06 : 1;
      ring.current.scale.setScalar(scale);
    }
    if (beam.current) {
      const mat = beam.current.material as THREE.MeshBasicMaterial;
      mat.opacity = (focused ? 0.42 : 0.2) + Math.sin(t * 2.2 + poi.x * 0.05) * 0.06;
    }
    if (diamond.current) {
      diamond.current.position.y = poi.markerHeight + 0.72 + Math.sin(t * 1.6 + poi.z * 0.03) * 0.12;
      diamond.current.rotation.y = t * 0.7;
    }
  });

  const status = analyzed ? 'ANALYZED' : scanned ? 'SCANNED' : reached ? 'REACHED' : null;
  const statusTexture = useMemo(() => {
    if (!status) return null;
    const c = document.createElement('canvas');
    c.width = 256;
    c.height = 68;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = 'rgba(18,10,8,0.8)';
    ctx.fillRect(0, 0, 256, 68);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, 254, 66);
    ctx.fillStyle = color;
    ctx.font = 'bold 28px Consolas, monospace';
    ctx.fillText(status, 18, 44);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    return tex;
  }, [status, color]);

  return (
    <group position={[poi.x, baseY, poi.z]}>
      <mesh ref={ring} position={[0, 0.08, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[poi.radius * 0.72, poi.radius * 0.78, 48]} />
        <meshBasicMaterial color={color} transparent opacity={0.58} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[poi.radius * 0.7, 40]} />
        <meshBasicMaterial color={color} transparent opacity={0.05} depthWrite={false} />
      </mesh>
      <mesh ref={beam} position={[0, (poi.markerHeight + 1) / 2 + 0.2, 0]}>
        <cylinderGeometry args={[0.045, 0.16, poi.markerHeight + 1, 8, 1, true]} />
        <meshBasicMaterial color={color} transparent opacity={0.22} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={diamond} position={[0, poi.markerHeight + 0.72, 0]}>
        <octahedronGeometry args={[0.19, 0]} />
        <meshBasicMaterial color={color} />
      </mesh>
      {showLabels && (
        <sprite position={[0, poi.markerHeight + 2.5, 0]} scale={[8.6, 2.36, 1]}>
          <spriteMaterial map={label} transparent depthTest depthWrite={false} opacity={0.95} />
        </sprite>
      )}
      {statusTexture && showLabels && (
        <sprite position={[0, poi.markerHeight + 3.9, 0]} scale={[2.8, 0.74, 1]}>
          <spriteMaterial map={statusTexture} transparent depthTest depthWrite={false} />
        </sprite>
      )}
    </group>
  );
}

function Model({ poi }: { poi: POI }) {
  const baseY = terrainGenerator.height(poi.x, poi.z);
  const tint = poi.model.tint ?? '#5a3c2e';
  const scale = poi.model.scale;
  const variant = poi.model.variant;

  const rockMat = useMemo(() => new THREE.MeshStandardMaterial({ color: tint, roughness: 0.94, metalness: 0.03 }), [tint]);
  const paleMat = new THREE.MeshStandardMaterial({ color: '#b98e6c', roughness: 0.9, metalness: 0.02 });
  const greenMat = new THREE.MeshStandardMaterial({ color: '#5c6650', roughness: 0.82, metalness: 0.08 });
  const darkMat = new THREE.MeshStandardMaterial({ color: '#2f2924', roughness: 0.78, metalness: 0.28 });
  const metalMat = new THREE.MeshStandardMaterial({ color: '#9b968c', roughness: 0.36, metalness: 0.7 });
  const glowMat = new THREE.MeshStandardMaterial({ color: '#8ff0d2', emissive: '#41cda9', emissiveIntensity: 1.6, roughness: 0.25 });
  const iceMat = new THREE.MeshStandardMaterial({ color: '#a9dce4', roughness: 0.28, metalness: 0.16, transparent: true, opacity: 0.88 });

  if (poi.type === 'crater' || poi.type === 'scarp') return null;

  if (poi.type === 'rover') {
    return (
      <group position={[poi.x, baseY, poi.z]} rotation={[0, -0.45, 0]} scale={scale}>
        <mesh position={[0, 0.42, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.5, 0.5, 0.92]} />
          <primitive object={metalMat} attach="material" />
        </mesh>
        <mesh position={[0, 0.7, -0.06]} rotation={[-0.4, 0, 0]} castShadow>
          <boxGeometry args={[1.35, 0.06, 0.78]} />
          <primitive object={darkMat} attach="material" />
        </mesh>
        <mesh position={[0.42, 0.95, 0.08]}>
          <cylinderGeometry args={[0.035, 0.045, 1.2, 8]} />
          <primitive object={metalMat} attach="material" />
        </mesh>
        <mesh position={[0.42, 1.53, 0.08]} rotation={[0.3, 0, 0.1]}>
          <coneGeometry args={[0.28, 0.22, 12, 1, true]} />
          <primitive object={paleMat} attach="material" />
        </mesh>
        {[-0.52, 0.52].map((x) =>
          [-0.55, 0.55].map((z) => (
            <mesh key={`${x}-${z}`} position={[x, 0.22, z]} rotation={[0, 0, Math.PI / 2]} castShadow>
              <cylinderGeometry args={[0.22, 0.22, 0.16, 14]} />
              <primitive object={darkMat} attach="material" />
            </mesh>
          ))
        )}
        <mesh position={[-0.1, 0.79, 0.28]} rotation={[-0.2, 0, 0]}>
          <boxGeometry args={[0.72, 0.03, 0.5]} />
          <primitive object={darkMat} attach="material" />
        </mesh>
        <mesh position={[-0.1, 0.95, 0.28]} rotation={[-0.2, 0, 0]}>
          <boxGeometry args={[0.68, 0.025, 0.44]} />
          <meshStandardMaterial color="#1c2a3a" roughness={0.3} metalness={0.6} />
        </mesh>
      </group>
    );
  }

  if (poi.type === 'beacon') {
    return (
      <group position={[poi.x, baseY, poi.z]} scale={scale}>
        <mesh position={[0, 0.72, 0]} castShadow>
          <cylinderGeometry args={[0.07, 0.12, 1.44, 10]} />
          <primitive object={metalMat} attach="material" />
        </mesh>
        <mesh position={[0, 1.46, 0]} castShadow>
          <boxGeometry args={[0.5, 0.16, 0.5]} />
          <primitive object={darkMat} attach="material" />
        </mesh>
        <mesh position={[0, 1.62, 0]}>
          <sphereGeometry args={[0.11, 12, 10]} />
          <primitive object={glowMat} attach="material" />
        </mesh>
        {[-0.35, 0.35].map((x) => (
          <mesh key={x} position={[x, 0.44, 0]} rotation={[0, 0, 0.6]}>
            <boxGeometry args={[0.5, 0.035, 0.035]} />
            <primitive object={metalMat} attach="material" />
          </mesh>
        ))}
        <mesh position={[0.26, 1.22, 0]}>
          <planeGeometry args={[0.38, 0.22]} />
          <meshBasicMaterial color="#ffb35c" side={THREE.DoubleSide} />
        </mesh>
      </group>
    );
  }

  if (poi.type === 'viewpoint') {
    return (
      <group position={[poi.x, baseY, poi.z]} scale={scale}>
        {[0.55, 0.95, 1.3].map((y, i) => (
          <mesh key={y} position={[i * 0.04, y * 0.55, 0]} rotation={[0, i * 0.7, 0]} castShadow receiveShadow>
            <dodecahedronGeometry args={[0.44 - i * 0.08, 0]} />
            <primitive object={rockMat} attach="material" />
          </mesh>
        ))}
        <mesh position={[0.02, 1.55, 0]}>
          <sphereGeometry args={[0.08, 10, 8]} />
          <primitive object={glowMat} attach="material" />
        </mesh>
      </group>
    );
  }

  if (poi.type === 'ice') {
    return (
      <group position={[poi.x, baseY, poi.z]} scale={scale}>
        <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[8.2, 32]} />
          <meshStandardMaterial color="#9fc6cb" roughness={0.44} metalness={0.12} transparent opacity={0.36} />
        </mesh>
        {Array.from({ length: 8 }).map((_, i) => {
          const a = (i / 8) * Math.PI * 2;
          const r = 3.2 + (i % 3) * 1.3;
          return (
            <mesh key={i} position={[Math.cos(a) * r, 0.04, Math.sin(a) * r]} rotation={[-Math.PI / 2, 0, a]}>
              <planeGeometry args={[2.5, 0.16]} />
              <meshBasicMaterial color="#c9eef2" transparent opacity={0.35} />
            </mesh>
          );
        })}
        <mesh position={[2.1, 0.38, -1.6]} rotation={[0.18, 0.4, 0.1]} castShadow>
          <coneGeometry args={[0.22, 0.7, 5]} />
          <primitive object={iceMat} attach="material" />
        </mesh>
        <mesh position={[-1.8, 0.28, 1.2]} rotation={[-0.1, 0.7, -0.16]} castShadow>
          <coneGeometry args={[0.18, 0.55, 5]} />
          <primitive object={iceMat} attach="material" />
        </mesh>
      </group>
    );
  }

  if (poi.type === 'deposit') {
    return (
      <group position={[poi.x, baseY, poi.z]} scale={scale}>
        <mesh position={[0, 0.12, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <circleGeometry args={[4.2, 24]} />
          <meshStandardMaterial color={tint} roughness={0.98} />
        </mesh>
        {Array.from({ length: 14 }).map((_, i) => {
          const a = i * 2.4;
          const r = 0.6 + ((i * 7) % 13) * 0.24;
          return (
            <mesh
              key={i}
              position={[Math.cos(a) * r, 0.11 + (i % 3) * 0.03, Math.sin(a) * r]}
              rotation={[i * 0.3, i * 0.7, 0]}
              scale={0.12 + (i % 5) * 0.055}
              castShadow
            >
              <dodecahedronGeometry args={[1, 0]} />
              <primitive object={i % 4 === 0 ? greenMat : rockMat} attach="material" />
            </mesh>
          );
        })}
      </group>
    );
  }

  if (poi.type === 'outcrop') {
    return (
      <group position={[poi.x, baseY, poi.z]} rotation={[0, 0.42, 0]} scale={scale}>
        {[0, 1, 2, 3].map((i) => (
          <mesh
            key={i}
            position={[(i - 1.5) * 0.72, 0.28 + i * 0.09, (i % 2 ? 0.24 : -0.22) * i]}
            rotation={[0.04 * i, -0.12 + i * 0.07, 0.03]}
            castShadow
            receiveShadow
          >
            <boxGeometry args={[2.8 - i * 0.36, 0.62 - i * 0.07, 1.65 - i * 0.16]} />
            <primitive object={i % 2 === 0 ? rockMat : paleMat} attach="material" />
          </mesh>
        ))}
        <mesh position={[-0.9, 0.72, 0.6]} rotation={[0.3, 0.4, 0.2]} castShadow>
          <dodecahedronGeometry args={[0.42, 0]} />
          <primitive object={rockMat} attach="material" />
        </mesh>
      </group>
    );
  }

  // Boulder-style clusters.
  return (
    <group position={[poi.x, baseY, poi.z]} scale={scale} rotation={[0, 0.3, 0]}>
      <mesh position={[0, 0.62, 0]} rotation={[0.1, 0.4, 0.06]} castShadow receiveShadow>
        <dodecahedronGeometry args={[1.05, 1]} />
        <primitive object={rockMat} attach="material" />
      </mesh>
      <mesh position={[1.0, 0.34, 0.34]} rotation={[0.2, 1.2, -0.1]} scale={0.62} castShadow receiveShadow>
        <dodecahedronGeometry args={[1.0, 0]} />
        <primitive object={rockMat} attach="material" />
      </mesh>
      <mesh position={[-0.86, 0.27, -0.24]} rotation={[0.4, 0.5, 0.2]} scale={0.48} castShadow receiveShadow>
        <dodecahedronGeometry args={[1.0, 0]} />
        <primitive object={variant === 'layered' ? paleMat : rockMat} attach="material" />
      </mesh>
      {variant === 'vesicular' &&
        Array.from({ length: 7 }).map((_, i) => (
          <mesh key={i} position={[Math.cos(i * 2.1) * 0.8, 0.4 + (i % 4) * 0.12, Math.sin(i * 2.1) * 0.7]}>
            <sphereGeometry args={[0.055 + (i % 3) * 0.02, 8, 6]} />
            <meshStandardMaterial color="#271a16" roughness={1} />
          </mesh>
        ))}
    </group>
  );
}

export function PoiField() {
  return (
    <group>
      {POIS.map((poi) => (
        <group key={poi.id}>
          <Model poi={poi} />
          <Marker poi={poi} />
        </group>
      ))}
    </group>
  );
}
