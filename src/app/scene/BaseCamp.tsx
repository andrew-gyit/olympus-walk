import { useMemo } from 'react';
import * as THREE from 'three';
import { terrainGenerator } from '../../world/TerrainGenerator';

const g = (x: number, z: number) => terrainGenerator.height(x, z);

const hull = new THREE.MeshStandardMaterial({ color: '#cfc6b6', roughness: 0.62, metalness: 0.16 });
const hullShade = new THREE.MeshStandardMaterial({ color: '#a99f90', roughness: 0.72, metalness: 0.12 });
const trim = new THREE.MeshStandardMaterial({ color: '#a9502e', roughness: 0.55, metalness: 0.18 });
const dark = new THREE.MeshStandardMaterial({ color: '#2f2b27', roughness: 0.78, metalness: 0.3 });
const metal = new THREE.MeshStandardMaterial({ color: '#8f8a80', roughness: 0.42, metalness: 0.66 });
const glass = new THREE.MeshStandardMaterial({
  color: '#ffd39a',
  emissive: '#ffad5e',
  emissiveIntensity: 1.25,
  roughness: 0.18,
  metalness: 0.2,
});
const solar = new THREE.MeshStandardMaterial({ color: '#1f2b39', roughness: 0.32, metalness: 0.5, emissive: '#0a1824', emissiveIntensity: 0.6 });
const lamp = new THREE.MeshStandardMaterial({ color: '#fff0cf', emissive: '#ffc27a', emissiveIntensity: 2.4, roughness: 0.2 });
const beacon = new THREE.MeshStandardMaterial({ color: '#8ff0d2', emissive: '#41cda9', emissiveIntensity: 2.2, roughness: 0.3 });
const red = new THREE.MeshStandardMaterial({ color: '#ff8a6d', emissive: '#ff4d2b', emissiveIntensity: 1.8, roughness: 0.4 });

function makeFlagTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 288;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#b0532f';
  ctx.fillRect(0, 0, 512, 288);
  ctx.fillStyle = '#f4dfc8';
  ctx.fillRect(0, 34, 512, 6);
  ctx.fillRect(0, 250, 512, 6);
  ctx.font = 'bold 62px Bahnschrift, Segoe UI, sans-serif';
  ctx.fillText('OLYMPUS', 34, 128);
  ctx.font = 'bold 34px Consolas, monospace';
  ctx.fillStyle = '#ffd6b5';
  ctx.fillText('WALK / ZONE A', 36, 186);
  ctx.font = '22px Consolas, monospace';
  ctx.fillStyle = '#f8e7d6';
  ctx.fillText('EXPLORATION PERMIT 1967-SIM', 36, 226);
  ctx.strokeStyle = '#f4dfc8';
  ctx.lineWidth = 4;
  ctx.strokeRect(12, 12, 488, 264);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function makePadTexture() {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#2a1a14';
  ctx.fillRect(0, 0, size, size);
  ctx.strokeStyle = '#c77a4d';
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, 214, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, 176, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = '#e7c4a6';
  ctx.font = 'bold 74px Consolas, monospace';
  ctx.textAlign = 'center';
  ctx.fillText('A', size / 2, size / 2 + 26);
  ctx.font = '22px Consolas, monospace';
  ctx.fillText('BASE CAMP', size / 2, size / 2 - 60);
  ctx.fillText('OLYMPUS WALK', size / 2, size / 2 + 100);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function BaseCamp() {
  const flag = useMemo(() => makeFlagTexture(), []);
  const pad = useMemo(() => makePadTexture(), []);
  const ground = g(0, 0);

  return (
    <group>
      {/* Landing / service pad */}
      <mesh position={[0, ground + 0.035, 2.5]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[12, 64]} />
        <meshStandardMaterial map={pad} color="#b9805f" roughness={0.92} transparent opacity={0.94} />
      </mesh>
      <mesh position={[0, ground + 0.055, 2.5]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[12.2, 12.55, 64]} />
        <meshBasicMaterial color="#d9a175" transparent opacity={0.42} />
      </mesh>

      {/* Main habitat module */}
      <group position={[0, 0, -10]}>
        <mesh position={[0, g(0, -10) + 1.62, 0]} rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow>
          <cylinderGeometry args={[1.62, 1.62, 5.8, 28, 1, false]} />
          <primitive object={hull} attach="material" />
        </mesh>
        <mesh position={[0, g(0, -10) + 1.62, -2.92]} castShadow>
          <sphereGeometry args={[1.62, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <primitive object={hullShade} attach="material" />
        </mesh>
        <mesh position={[0, g(0, -10) + 1.62, 2.92]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <sphereGeometry args={[1.62, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <primitive object={hullShade} attach="material" />
        </mesh>
        {[-2.1, -0.7, 0.7, 2.1].map((x) => (
          <mesh key={x} position={[x, g(0, -10) + 1.62, 0]} rotation={[0, 0, Math.PI / 2]}>
            <torusGeometry args={[1.635, 0.055, 8, 28]} />
            <primitive object={trim} attach="material" />
          </mesh>
        ))}
        {/* Windows */}
        {[-1.55, 0.2, 1.8].map((x) => (
          <mesh key={`w${x}`} position={[x, g(0, -10) + 1.86, -1.48]} rotation={[0.1, 0, 0]}>
            <planeGeometry args={[0.7, 0.34]} />
            <primitive object={glass} attach="material" />
          </mesh>
        ))}
        {/* Airlock / entrance */}
        <mesh position={[1.1, g(0, -10) + 0.9, -1.9]} rotation={[0.22, 0, 0]} castShadow>
          <cylinderGeometry args={[0.62, 0.68, 1.8, 18]} />
          <primitive object={hull} attach="material" />
        </mesh>
        <mesh position={[1.1, g(0, -10) + 0.86, -2.53]} rotation={[Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.46, 24]} />
          <primitive object={dark} attach="material" />
        </mesh>
        <mesh position={[1.1, g(0, -10) + 1.48, -2.56]}>
          <boxGeometry args={[0.46, 0.08, 0.05]} />
          <primitive object={lamp} attach="material" />
        </mesh>
        {/* Roof hatch + antenna base */}
        <mesh position={[-0.2, g(0, -10) + 3.3, 0]} castShadow>
          <cylinderGeometry args={[0.5, 0.56, 0.28, 18]} />
          <primitive object={hullShade} attach="material" />
        </mesh>
        <mesh position={[-0.2, g(0, -10) + 4.6, 0]} castShadow>
          <cylinderGeometry args={[0.05, 0.07, 2.4, 8]} />
          <primitive object={metal} attach="material" />
        </mesh>
        <mesh position={[-0.2, g(0, -10) + 5.7, 0]} rotation={[0.5, 0.3, 0.2]} castShadow>
          <coneGeometry args={[0.78, 0.4, 20, 1, true]} />
          <primitive object={metal} attach="material" />
        </mesh>
        <mesh position={[-0.2, g(0, -10) + 6.02, 0]}>
          <sphereGeometry args={[0.075, 10, 8]} />
          <primitive object={red} attach="material" />
        </mesh>
      </group>

      {/* Laboratory dome */}
      <group position={[8.6, 0, -5]}>
        <mesh position={[0, g(8.6, -5) + 0.35, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[3.1, 3.2, 0.7, 28]} />
          <primitive object={hullShade} attach="material" />
        </mesh>
        <mesh position={[0, g(8.6, -5) + 0.7, 0]} castShadow receiveShadow>
          <sphereGeometry args={[3.05, 28, 18, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <primitive object={hull} attach="material" />
        </mesh>
        <mesh position={[0, g(8.6, -5) + 0.72, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[3.3, 3.45, 32]} />
          <primitive object={trim} attach="material" />
        </mesh>
        <mesh position={[0.3, g(8.6, -5) + 1.55, 2.55]} rotation={[-0.32, 0, 0]}>
          <planeGeometry args={[0.85, 0.4]} />
          <primitive object={glass} attach="material" />
        </mesh>
        <mesh position={[1.7, g(8.6, -5) + 1.28, 1.9]} rotation={[-0.2, -0.5, 0]}>
          <planeGeometry args={[0.55, 0.28]} />
          <primitive object={glass} attach="material" />
        </mesh>
      </group>

      {/* Connecting tube */}
      <mesh
        position={[4.3, (g(0, -8) + g(8.6, -6)) / 2 + 0.72, -7.4]}
        rotation={[0, 0.55, Math.PI / 2]}
        castShadow
      >
        <cylinderGeometry args={[0.58, 0.58, 4.6, 16]} />
        <primitive object={hullShade} attach="material" />
      </mesh>

      {/* Storage module */}
      <group position={[-8.2, 0, -3.5]}>
        <mesh position={[0, g(-8.2, -3.5) + 0.95, 0]} rotation={[0, 0.35, Math.PI / 2]} castShadow receiveShadow>
          <cylinderGeometry args={[1.05, 1.05, 3.7, 20]} />
          <primitive object={hull} attach="material" />
        </mesh>
        <mesh position={[0, g(-8.2, -3.5) + 0.9, -1.9]} rotation={[0, 0.35, 0]}>
          <circleGeometry args={[0.9, 20]} />
          <primitive object={hullShade} attach="material" />
        </mesh>
        <mesh position={[0.1, g(-8.2, -3.5) + 1.55, 1.82]} rotation={[0, 0.35, 0]}>
          <planeGeometry args={[0.5, 0.26]} />
          <primitive object={glass} attach="material" />
        </mesh>
      </group>

      {/* Solar array */}
      {[
        [-5.4, 8.4, -0.36],
        [-2.2, 10.2, -0.36],
        [6.8, 8.5, 0.3],
      ].map(([x, z, tilt], i) => {
        const y = g(x, z);
        return (
          <group key={`solar-${i}`} position={[x, y, z]} rotation={[0, i === 2 ? -0.25 : 0.18, 0]}>
            <mesh position={[0, 1.15, 0]} castShadow>
              <cylinderGeometry args={[0.06, 0.08, 2.3, 8]} />
              <primitive object={metal} attach="material" />
            </mesh>
            <mesh position={[0, 2.25, 0]} rotation={[tilt, 0, 0]} castShadow>
              <boxGeometry args={[3.4, 0.06, 1.5]} />
              <primitive object={solar} attach="material" />
            </mesh>
            <mesh position={[0, 2.25, 0]} rotation={[tilt, 0, 0]}>
              <boxGeometry args={[3.42, 0.065, 0.06]} />
              <primitive object={metal} attach="material" />
            </mesh>
          </group>
        );
      })}

      {/* Cargo */}
      <group position={[4.8, g(4.8, 5.4), 5.4]} rotation={[0, 0.28, 0]}>
        <mesh position={[0, 0.62, 0]} castShadow receiveShadow>
          <boxGeometry args={[2.7, 1.24, 1.9]} />
          <primitive object={hullShade} attach="material" />
        </mesh>
        <mesh position={[0, 1.26, 0]} castShadow>
          <boxGeometry args={[2.4, 0.22, 1.65]} />
          <primitive object={trim} attach="material" />
        </mesh>
        <mesh position={[0.9, 0.62, 0.97]}>
          <boxGeometry args={[0.5, 0.36, 0.02]} />
          <primitive object={dark} attach="material" />
        </mesh>
      </group>
      <group position={[-5.2, g(-5.2, 4.2), 4.2]} rotation={[0, -0.4, 0]}>
        {[0, 1, 2].map((i) => (
          <mesh key={i} position={[(i - 1) * 1.1, 0.48, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.96, 0.96, 0.92]} />
            <primitive object={hullShade} attach="material" />
          </mesh>
        ))}
      </group>

      {/* Flag */}
      <group position={[-11.5, g(-11.5, 4.5), 4.5]}>
        <mesh position={[0, 2.2, 0]} castShadow>
          <cylinderGeometry args={[0.035, 0.045, 4.4, 8]} />
          <primitive object={metal} attach="material" />
        </mesh>
        <mesh position={[1.32, 3.5, 0]} rotation={[0, 0, -0.04]}>
          <planeGeometry args={[2.6, 1.45]} />
          <meshStandardMaterial map={flag} side={THREE.DoubleSide} roughness={0.9} />
        </mesh>
      </group>

      {/* Landing beacons */}
      {[0, 1, 2, 3].map((i) => {
        const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
        const x = Math.cos(a) * 12.1;
        const z = Math.sin(a) * 12.1 + 2.5;
        return (
          <group key={`beacon-${i}`} position={[x, g(x, z), z]}>
            <mesh position={[0, 0.35, 0]} castShadow>
              <cylinderGeometry args={[0.05, 0.08, 0.7, 8]} />
              <primitive object={dark} attach="material" />
            </mesh>
            <mesh position={[0, 0.76, 0]}>
              <sphereGeometry args={[0.1, 10, 8]} />
              <primitive object={beacon} attach="material" />
            </mesh>
          </group>
        );
      })}

      {/* Habitat light spill */}
      <pointLight position={[0, ground + 2.6, -8]} color="#ffc78f" intensity={14} distance={17} decay={2} />
      <pointLight position={[8.6, ground + 2.2, -5]} color="#9fd8e8" intensity={8} distance={12} decay={2} />
      <mesh position={[0, ground + 2.45, -8.3]} rotation={[0, 0, 0]}>
        <boxGeometry args={[1.5, 0.06, 0.12]} />
        <primitive object={lamp} attach="material" />
      </mesh>
    </group>
  );
}
