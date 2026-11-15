import { WORLD } from '../game/config';
import { terrainGenerator } from './TerrainGenerator';

export interface TerrainMeshData {
  positions: Float32Array;
  colors: Float32Array;
  uvs: Float32Array;
  indices: Uint32Array;
  heights: Float32Array;
  vertexSlopes: Float32Array;
  gridN: number;
}

let cached: TerrainMeshData | null = null;

/** Builds the shared render/physics terrain exactly once. */
export function getTerrainMeshData(): TerrainMeshData {
  if (!cached) cached = terrainGenerator.buildMeshData(WORLD.segments);
  return cached;
}
