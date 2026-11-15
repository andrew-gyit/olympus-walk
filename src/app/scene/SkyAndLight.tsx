import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useGameStore } from '../../stores/gameStore';

const VERTEX = /* glsl */ `
  varying vec3 vWorld;
  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorld = world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const FRAGMENT = /* glsl */ `
  varying vec3 vWorld;
  uniform vec3 topColor;
  uniform vec3 horizonColor;
  uniform vec3 dustColor;
  uniform vec3 sunDir;
  void main() {
    vec3 dir = normalize(vWorld);
    float h = clamp(dir.y * 0.5 + 0.5, 0.0, 1.0);
    float band = smoothstep(0.48, 0.68, h);
    vec3 col = mix(horizonColor, topColor, pow(band, 0.72));
    float haze = pow(1.0 - clamp(dir.y, 0.0, 1.0), 3.0);
    col = mix(col, dustColor, haze * 0.55);
    float sun = max(dot(dir, normalize(sunDir)), 0.0);
    col += vec3(1.0, 0.62, 0.3) * pow(sun, 22.0) * 0.32;
    col += vec3(1.0, 0.75, 0.45) * pow(sun, 5.0) * 0.06;
    gl_FragColor = vec4(col, 1.0);
  }
`;

function makeSunGlow() {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(size / 2, size / 2, 2, size / 2, size / 2, size / 2);
  grad.addColorStop(0, 'rgba(255,248,228,1)');
  grad.addColorStop(0.12, 'rgba(255,225,184,0.95)');
  grad.addColorStop(0.35, 'rgba(255,178,116,0.4)');
  grad.addColorStop(1, 'rgba(255,150,90,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

const SUN_DIR = new THREE.Vector3(-0.52, 0.62, 0.58).normalize();

export function SkyAndLight() {
  const uniforms = useMemo(
    () => ({
      topColor: { value: new THREE.Color('#221410') },
      horizonColor: { value: new THREE.Color('#b9704a') },
      dustColor: { value: new THREE.Color('#d9a17a') },
      sunDir: { value: SUN_DIR.clone() },
    }),
    []
  );
  const glow = useMemo(() => makeSunGlow(), []);
  const light = useRef<THREE.DirectionalLight>(null);
  const target = useMemo(() => new THREE.Object3D(), []);

  useFrame(() => {
    const telemetry = useGameStore.getState().telemetry;
    const env = useGameStore.getState().environment;
    const p = telemetry.position;
    target.position.set(p.x, p.y - 1.6, p.z);
    target.updateMatrixWorld();
    if (light.current) {
      light.current.position.set(p.x - 88, p.y + 116, p.z + 74);
      light.current.intensity = env.dustStorm ? 1.25 : 2.25;
      light.current.color.set(env.dustStorm ? '#d99b70' : '#ffd9b4');
      light.current.target = target;
      light.current.target.updateMatrixWorld();
    }
  });

  const sunPos = SUN_DIR.clone().multiplyScalar(960);

  return (
    <>
      <mesh renderOrder={-10} frustumCulled={false}>
        <sphereGeometry args={[1500, 32, 20]} />
        <shaderMaterial
          vertexShader={VERTEX}
          fragmentShader={FRAGMENT}
          uniforms={uniforms}
          side={THREE.BackSide}
          depthWrite={false}
          fog={false}
        />
      </mesh>
      <sprite position={sunPos} scale={[126, 126, 1]}>
        <spriteMaterial map={glow} blending={THREE.AdditiveBlending} depthWrite={false} transparent fog={false} opacity={0.9} />
      </sprite>
      <hemisphereLight args={['#e9b48a', '#3a1c12', 0.92]} />
      <ambientLight color="#7a4a38" intensity={0.46} />
      <directionalLight
        ref={light}
        color="#ffd9b4"
        intensity={2.25}
        position={[-88, 130, 76]}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={1}
        shadow-camera-far={330}
        shadow-camera-left={-62}
        shadow-camera-right={62}
        shadow-camera-top={62}
        shadow-camera-bottom={-62}
        shadow-bias={-0.0007}
        shadow-normalBias={0.035}
      />
      <primitive object={target} />
    </>
  );
}
