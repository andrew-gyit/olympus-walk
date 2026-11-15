import { mulberry32 } from './TerrainGenerator';
import { WORLD } from '../game/config';
import { POIS } from '../game/data/pois';
import { terrainGenerator } from './TerrainGenerator';
import type { ObstacleCollider } from '../game/physics/PhysicsManager';

export interface RockInstance {
  x: number;
  y: number;
  z: number;
  scale: number;
  rotation: number;
  tilt: number;
  color: string;
}

export interface RockField {
  pebbles: RockInstance[];
  boulders: RockInstance[];
  slabs: RockInstance[];
  colliders: ObstacleCollider[];
}

const PALETTE = ['#5a3c2e', '#6a4634', '#4a3229', '#7a5140', '#3b2b26', '#8a5b42', '#634238'];

function blockedByPoi(x: number, z: number, pad: number) {
  for (const p of POIS) {
    if (Math.hypot(x - p.x, z - p.z) < p.radius + pad) return true;
  }
  return false;
}

let cached: RockField | null = null;

export function getRockField(): RockField {
  if (cached) return cached;
  const random = mulberry32(872311);
  const pebbles: RockInstance[] = [];
  const boulders: RockInstance[] = [];
  const slabs: RockInstance[] = [];
  const colliders: ObstacleCollider[] = [];
  const limit = WORLD.playable + 24;

  let attempts = 0;
  while (pebbles.length < 1050 && attempts < 9000) {
    attempts++;
    const x = (random() * 2 - 1) * limit;
    const z = (random() * 2 - 1) * limit;
    const campD = Math.hypot(x, z);
    if (campD < 24) continue;
    if (blockedByPoi(x, z, 3)) continue;
    const slope = terrainGenerator.slope(x, z, 1.1);
    if (slope > 41) continue;
    const h = terrainGenerator.height(x, z);
    const scale = 0.12 + Math.pow(random(), 2.2) * 0.55;
    pebbles.push({
      x,
      y: h + scale * 0.14,
      z,
      scale,
      rotation: random() * Math.PI * 2,
      tilt: (random() - 0.5) * 0.7,
      color: PALETTE[(random() * PALETTE.length) | 0],
    });
  }

  attempts = 0;
  while (boulders.length < 150 && attempts < 3500) {
    attempts++;
    const x = (random() * 2 - 1) * limit * 0.93;
    const z = (random() * 2 - 1) * limit * 0.93;
    const campD = Math.hypot(x, z);
    if (campD < 27) continue;
    if (blockedByPoi(x, z, 5)) continue;
    const slope = terrainGenerator.slope(x, z, 1.2);
    if (slope > 34) continue;
    const h = terrainGenerator.height(x, z);
    const scale = 0.6 + Math.pow(random(), 1.8) * 2.4;
    const boulder: RockInstance = {
      x,
      y: h + scale * 0.26,
      z,
      scale,
      rotation: random() * Math.PI * 2,
      tilt: (random() - 0.5) * 0.5,
      color: PALETTE[(random() * PALETTE.length) | 0],
    };
    boulders.push(boulder);
    if (scale > 1.05) {
      colliders.push({
        shape: 'ball',
        x,
        y: h + scale * 0.3,
        z,
        r: Math.max(0.55, scale * 0.62),
      });
    }
  }

  attempts = 0;
  while (slabs.length < 90 && attempts < 2400) {
    attempts++;
    const x = (random() * 2 - 1) * limit * 0.9;
    const z = (random() * 2 - 1) * limit * 0.9;
    if (Math.hypot(x, z) < 30) continue;
    if (blockedByPoi(x, z, 6)) continue;
    const slope = terrainGenerator.slope(x, z, 1.2);
    if (slope > 38) continue;
    const h = terrainGenerator.height(x, z);
    const scale = 0.7 + random() * 2.2;
    slabs.push({
      x,
      y: h + scale * 0.16,
      z,
      scale,
      rotation: random() * Math.PI * 2,
      tilt: (random() - 0.5) * 0.35,
      color: PALETTE[(random() * PALETTE.length) | 0],
    });
    if (scale > 1.2) {
      colliders.push({ shape: 'cuboid', x, y: h + scale * 0.2, z, hx: scale * 0.55, hy: scale * 0.24, hz: scale * 0.42 });
    }
  }

  cached = { pebbles, boulders, slabs, colliders };
  return cached;
}

export interface CampPart {
  x: number;
  y: number;
  z: number;
  hx: number;
  hy: number;
  hz: number;
}

export const CAMP_MODULE: CampPart = {
  x: 0,
  y: terrainGenerator.height(0, -10) + 1.5,
  z: -10,
  hx: 2.2,
  hy: 1.55,
  hz: 3.6,
};

export function campColliders(): ObstacleCollider[] {
  const colliders: ObstacleCollider[] = [];
  const module = CAMP_MODULE;
  colliders.push({ shape: 'cuboid', x: module.x, y: module.y, z: module.z, hx: module.hx, hy: module.hy, hz: module.hz });
  colliders.push({ shape: 'cylinder', x: 8.6, y: terrainGenerator.height(8.6, -5) + 1.2, z: -5, r: 3.1, halfHeight: 1.2 });
  colliders.push({ shape: 'cylinder', x: -8.2, y: terrainGenerator.height(-8.2, -3.5) + 0.9, z: -3.5, r: 2.5, halfHeight: 0.9 });
  colliders.push({ shape: 'cuboid', x: 4.8, y: terrainGenerator.height(4.8, 5.4) + 0.75, z: 5.4, hx: 1.5, hy: 0.75, hz: 1.1 });
  colliders.push({ shape: 'cuboid', x: -5.2, y: terrainGenerator.height(-5.2, 4.2) + 0.6, z: 4.2, hx: 1.1, hy: 0.6, hz: 0.9 });
  return colliders;
}
