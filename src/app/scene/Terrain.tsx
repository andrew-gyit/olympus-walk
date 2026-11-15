import { useMemo } from 'react';
import * as THREE from 'three';
import { getTerrainMeshData } from '../../world/terrainData';

function makeRegolithTexture() {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const image = ctx.createImageData(size, size);
  const data = image.data;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const fine = Math.random() * 46;
      const broad =
        Math.sin(x * 0.045 + Math.sin(y * 0.018) * 2.1) * 14 + Math.cos(y * 0.061 - x * 0.017) * 11;
      const v = 150 + fine + broad;
      data[i] = v;
      data[i + 1] = v * 0.93;
      data[i + 2] = v * 0.84;
      data[i + 3] = 255;
    }
  }
  ctx.putImageData(image, 0, 0);
  // Wind streaks.
  ctx.globalAlpha = 0.16;
  for (let i = 0; i < 120; i++) {
    ctx.strokeStyle = i % 2 ? '#f0c49e' : '#5b3527';
    ctx.lineWidth = 0.6 + Math.random() * 2.2;
    const y = Math.random() * size;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(size * 0.3, y - 20, size * 0.7, y + 18, size, y - 4);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(46, 46);
  tex.anisotropy = 8;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function Terrain() {
  const data = useMemo(() => getTerrainMeshData(), []);
  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(data.positions, 3));
    g.setAttribute('color', new THREE.BufferAttribute(data.colors, 3));
    g.setAttribute('uv', new THREE.BufferAttribute(data.uvs, 2));
    g.setIndex(new THREE.BufferAttribute(data.indices, 1));
    g.computeVertexNormals();
    g.computeBoundingSphere();
    return g;
  }, [data]);

  const detail = useMemo(() => makeRegolithTexture(), []);

  return (
    <mesh geometry={geometry} receiveShadow castShadow={false} frustumCulled={false}>
      <meshStandardMaterial
        vertexColors
        roughness={0.97}
        metalness={0.015}
        map={detail}
        bumpMap={detail}
        bumpScale={0.16}
        dithering
      />
    </mesh>
  );
}
