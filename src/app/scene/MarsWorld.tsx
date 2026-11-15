import { Suspense } from 'react';
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { useGameStore } from '../../stores/gameStore';
import { SkyAndLight } from './SkyAndLight';
import { Terrain } from './Terrain';
import { BaseCamp } from './BaseCamp';
import { RockField } from './RockField';
import { PoiField } from './PoiField';
import { RouteVisuals } from './RouteVisuals';
import { DustField, Footprints } from './Effects';
import { Runtime } from './Runtime';

function SceneContent() {
  return (
    <>
      <fog attach="fog" args={['#b97a58', 78, 760]} />
      <SkyAndLight />
      <Terrain />
      <BaseCamp />
      <RockField />
      <PoiField />
      <RouteVisuals />
      <DustField />
      <Footprints />
      <Runtime />
    </>
  );
}

export function MarsWorld() {
  const quality = useGameStore((s) => s.settings.quality);
  const dpr: [number, number] = quality === 'high' ? [1, 1.85] : quality === 'medium' ? [0.9, 1.35] : [0.7, 1];
  return (
    <div className="scene-layer">
      <Canvas
        shadows
        dpr={dpr}
        camera={{ fov: 58, near: 0.08, far: 2200, position: [46, 32, 64] }}
        gl={{
          antialias: true,
          powerPreference: 'high-performance',
          preserveDrawingBuffer: true,
          alpha: false,
          stencil: false,
        }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.03;
          gl.outputColorSpace = THREE.SRGBColorSpace;
          gl.shadowMap.type = THREE.PCFSoftShadowMap;
          gl.setClearColor('#2a1712');
        }}
      >
        <Suspense fallback={null}>
          <SceneContent />
        </Suspense>
      </Canvas>
    </div>
  );
}
