import * as THREE from 'three';
import { WORLD } from '../game/config';

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const smoothstep = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};

function hash2(ix: number, iz: number, seed: number): number {
  let h = Math.imul(ix, 374761393) + Math.imul(iz, 668265263) + Math.imul(seed, 1442695041);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h = h ^ (h >>> 16);
  return (h >>> 0) / 4294967295;
}

function valueNoise(x: number, z: number, seed: number): number {
  const ix = Math.floor(x);
  const iz = Math.floor(z);
  const fx = x - ix;
  const fz = z - iz;
  const ux = fx * fx * (3 - 2 * fx);
  const uz = fz * fz * (3 - 2 * fz);
  const a = hash2(ix, iz, seed);
  const b = hash2(ix + 1, iz, seed);
  const c = hash2(ix, iz + 1, seed);
  const d = hash2(ix + 1, iz + 1, seed);
  return lerp(lerp(a, b, ux), lerp(c, d, ux), uz);
}

export function fbm(x: number, z: number, octaves = 4, seed = WORLD.seed, lacunarity = 2.03, gain = 0.5): number {
  let amp = 0.5;
  let freq = 1;
  let sum = 0;
  let norm = 0;
  for (let i = 0; i < octaves; i++) {
    sum += amp * valueNoise(x * freq, z * freq, seed + i * 131);
    norm += amp;
    amp *= gain;
    freq *= lacunarity;
  }
  return sum / norm;
}

function ridged(x: number, z: number, octaves = 4, seed = WORLD.seed + 71): number {
  let amp = 0.5;
  let freq = 1;
  let sum = 0;
  let norm = 0;
  for (let i = 0; i < octaves; i++) {
    const n = 1 - Math.abs(valueNoise(x * freq, z * freq, seed + i * 97) * 2 - 1);
    sum += amp * n * n;
    norm += amp;
    amp *= 0.5;
    freq *= 2.07;
  }
  return sum / norm;
}

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface TerrainSampleGrid {
  n: number;
  size: number;
  heights: Float32Array;
  slopes: Float32Array;
  colors: Float32Array;
  minHeight: number;
  maxHeight: number;
}

/**
 * Deterministic Olympus Mons exploration-zone terrain.
 * This is an educational reconstruction INSPIRED by the geology of Olympus Mons,
 * not a scientifically exact reproduction. All values are simulator parameters.
 */
export class TerrainGenerator {
  readonly size = WORLD.size;
  readonly half = WORLD.size / 2;
  readonly campHeight: number;
  private readonly seed = WORLD.seed;

  constructor() {
    this.campHeight = this.rawHeight(WORLD.camp.x, WORLD.camp.z);
  }

  /** Unflattened volcano-flank relief. */
  private rawHeight(x: number, z: number): number {
    // Broad volcanic flank + multi-scale regolith relief.
    let h = 7.5;
    h += fbm(x * 0.0031 + 19, z * 0.0031 - 7, 4, this.seed) * 17.0;
    h += fbm(x * 0.0105, z * 0.0105, 3, this.seed + 9) * 3.2;
    h += fbm(x * 0.047, z * 0.047, 2, this.seed + 23) * 0.62;

    // The flank rises toward the huge massif to the north.
    h += smoothstep(-70, -390, z) * 24;

    // Distant north wall of the Olympus massif, beyond the playable limit.
    const wall = Math.exp(-Math.pow((z + 418) / 76, 2));
    h += wall * (48 + 105 * fbm(x * 0.0058 + 4, z * 0.002, 3, this.seed + 61));
    h += Math.exp(-Math.pow((z + 392) / 48, 2)) * ridged(x * 0.012, z * 0.012, 3) * 42;

    // East escarpment and broken rim.
    h += smoothstep(246, 420, x) * (34 + 30 * fbm(z * 0.007, x * 0.004, 3, this.seed + 11));
    h += Math.exp(-Math.pow((x - 338) / 58, 2)) * ridged(z * 0.013, x * 0.006, 3) * 16;
    // West ridge.
    h += smoothstep(-264, -438, x) * (28 + 22 * fbm(z * 0.006, x * 0.003, 3, this.seed + 31));
    // Southern boundary ridge, softened to keep it out of the main traverse.
    h += Math.exp(-Math.pow((z - 425) / 54, 2)) * 28;

    // Impact crater (west of base camp), with an irregular rim.
    const cdx = x + 152;
    const cdz = z - 28;
    const cd = Math.sqrt(cdx * cdx + cdz * cdz) * (1 + 0.045 * (fbm(x * 0.05, z * 0.05, 2) - 0.5));
    const bowl = -20 * (1 - smoothstep(0, 54, cd));
    const rim = 6.5 * Math.exp(-Math.pow((cd - 59) / 8, 2));
    h += bowl + rim;

    // Ice-signature depression (south-east): shallow, flat-floored, uncertain.
    const idx = x - 150;
    const idz = z - 120;
    const id = Math.sqrt(idx * idx + idz * idz) * (1 + 0.07 * (fbm(x * 0.031 + 4, z * 0.031, 2) - 0.5));
    h += -12.5 * (1 - smoothstep(0, 46, id));
    h += 2.8 * Math.exp(-Math.pow((id - 51) / 7, 2));

    // Steep scarp across the southern approach. A gentler pass exists to the east.
    const scarpAmp = 23 * (1 - 0.7 * Math.exp(-Math.pow((x - 82) / 40, 2)));
    h += smoothstep(144, 181, z) * scarpAmp;

    // Rocky viewpoint hill to the north.
    h += 12 * Math.exp(-(Math.pow((x - 116) / 48, 2) + Math.pow((z + 205) / 62, 2)));

    // Formation Beta mound.
    h += 6.5 * Math.exp(-(Math.pow((x - 94) / 32, 2) + Math.pow((z + 119) / 27, 2)));

    // Rough regolith apron near the scarp.
    const rough = Math.exp(-(Math.pow((x + 28) / 62, 2) + Math.pow((z - 201) / 43, 2)));
    h += rough * (fbm(x * 0.085 + 8, z * 0.085, 3, this.seed + 44) * 3.4 - 1.15);

    // Eroded gully / old channel (north-east).
    const channel = Math.exp(-Math.pow((x - 196 + (z + 40) * 0.14) / 20, 2)) * smoothstep(-230, 80, z);
    h -= channel * 5.5;

    return h;
  }

  /** Final height after the base-camp pad is flattened into the terrain. */
  height(x: number, z: number): number {
    const raw = this.rawHeight(x, z);
    const d = Math.sqrt((x - WORLD.camp.x) ** 2 + (z - WORLD.camp.z) ** 2);
    const blend = 1 - smoothstep(WORLD.campPadInner, WORLD.campPadOuter, d);
    if (blend <= 0) return raw;
    const pad = this.campHeight + 0.22 + 0.1 * (fbm(x * 0.06, z * 0.06, 2) - 0.5);
    return lerp(raw, pad, blend);
  }

  slope(x: number, z: number, eps = 0.7): number {
    const hL = this.height(x - eps, z);
    const hR = this.height(x + eps, z);
    const hD = this.height(x, z - eps);
    const hU = this.height(x, z + eps);
    const dx = (hR - hL) / (2 * eps);
    const dz = (hU - hD) / (2 * eps);
    return (Math.atan(Math.sqrt(dx * dx + dz * dz)) * 180) / Math.PI;
  }

  normalAt(x: number, z: number, out = new THREE.Vector3(), eps = 0.7): THREE.Vector3 {
    const hL = this.height(x - eps, z);
    const hR = this.height(x + eps, z);
    const hD = this.height(x, z - eps);
    const hU = this.height(x, z + eps);
    out.set(hL - hR, 2 * eps, hD - hU).normalize();
    return out;
  }

  isPlayable(x: number, z: number): boolean {
    return Math.abs(x) < WORLD.playable && Math.abs(z) < WORLD.playable;
  }

  /** Approximate thermal map value (°C, simulation data). */
  temperatureAt(x: number, z: number, sunGain = 1, timeOfSol = 0.5): number {
    const h = this.height(x, z);
    const n = this.normalAt(x, z);
    const sunDir = new THREE.Vector3(-0.45, 0.78, 0.44).normalize();
    const incidence = Math.max(0, n.dot(sunDir));
    const sol = Math.sin(Math.PI * clamp(timeOfSol, 0, 1));
    return -82 + sol * (52 * incidence + 13) - (h - 8) * 0.09 + 3.2 * fbm(x * 0.02, z * 0.02, 2);
  }

  /** Surface type identifier used by HUD / science copy. */
  surfaceKind(x: number, z: number): string {
    const h = this.height(x, z);
    const s = this.slope(x, z);
    const dIce = Math.hypot(x - 150, z - 120);
    const dCrater = Math.hypot(x + 152, z - 28);
    if (dIce < 40) return 'POSSIBLE ICE-BEARING DEPRESSION';
    if (dCrater < 48) return 'CRATER FLOOR / IMPACT DEPOSIT';
    if (dCrater < 66) return 'CRATER RIM / EJECTA';
    if (s > 35) return 'STEEP BASALTIC SLOPE';
    if (h > 30) return 'ELEVATED VOLCANIC FLANK';
    if (this.slope(x, z) < 3) return 'DUST-MANTLED PLAIN';
    return 'ROCKY REGOLITH';
  }

  /** Vertex colour: oxidised dust, dark basalt, sediment and volcanic units. */
  colorAt(x: number, z: number, h = this.height(x, z), slope = this.slope(x, z), out = new THREE.Color()): THREE.Color {
    const n = fbm(x * 0.028 + 7, z * 0.028 - 2, 3);
    const n2 = fbm(x * 0.004 - 9, z * 0.004 + 4, 2);

    // Base palette (linear-ish sRGB values chosen for a dusty butterscotch Mars).
    let r = 0.49 + n * 0.15 + n2 * 0.07;
    let g = 0.235 + n * 0.085 + n2 * 0.035;
    let b = 0.145 + n * 0.05 + n2 * 0.02;

    // Dark basaltic units on steep faces.
    const steep = smoothstep(20, 44, slope);
    r = lerp(r, 0.235 + n * 0.05, steep * 0.8);
    g = lerp(g, 0.155 + n * 0.035, steep * 0.8);
    b = lerp(b, 0.125 + n * 0.03, steep * 0.8);

    // Pale sediment / dust traps in lows.
    const low = 1 - smoothstep(9, 21, h);
    r = lerp(r, 0.66 + n * 0.08, low * 0.28);
    g = lerp(g, 0.37 + n * 0.06, low * 0.28);
    b = lerp(b, 0.235 + n * 0.04, low * 0.28);

    // Volcanic high ground.
    const high = smoothstep(34, 74, h);
    r = lerp(r, 0.3 + n * 0.06, high * 0.4);
    g = lerp(g, 0.185 + n * 0.04, high * 0.4);
    b = lerp(b, 0.14 + n * 0.03, high * 0.4);

    // Crater / ejecta tint.
    const dCrater = Math.hypot(x + 152, z - 28);
    if (dCrater < 80) {
      const t = 1 - smoothstep(44, 78, dCrater);
      r = lerp(r, 0.31 + n * 0.06, t * 0.55);
      g = lerp(g, 0.21 + n * 0.04, t * 0.55);
      b = lerp(b, 0.18 + n * 0.03, t * 0.55);
    }

    // Ice-signature depression: cool grey-blue surface patch, clearly uncertain.
    const dIce = Math.hypot(x - 150, z - 120);
    if (dIce < 54) {
      const t = (1 - smoothstep(36, 54, dIce)) * 0.7;
      r = lerp(r, 0.46 + n * 0.07, t);
      g = lerp(g, 0.47 + n * 0.07, t);
      b = lerp(b, 0.49 + n * 0.08, t);
    }

    // Fine mineral grain.
    const grain = (fbm(x * 0.31, z * 0.31, 2) - 0.5) * 0.035;
    r += grain;
    g += grain * 0.7;
    b += grain * 0.5;

    return out.setRGB(clamp(r, 0.06, 0.92), clamp(g, 0.04, 0.82), clamp(b, 0.03, 0.74));
  }

  /** Builds the shared terrain mesh and the heightfield used by navigation. */
  buildMeshData(segments = WORLD.segments): {
    positions: Float32Array;
    colors: Float32Array;
    uvs: Float32Array;
    indices: Uint32Array;
    heights: Float32Array;
    vertexSlopes: Float32Array;
    gridN: number;
  } {
    const n = segments + 1;
    const step = this.size / segments;
    const positions = new Float32Array(n * n * 3);
    const colors = new Float32Array(n * n * 3);
    const uvs = new Float32Array(n * n * 2);
    const heights = new Float32Array(n * n);
    const slopes = new Float32Array(n * n);
    const indices = new Uint32Array(segments * segments * 6);
    const tmpColor = new THREE.Color();
    let p = 0;
    for (let iz = 0; iz < n; iz++) {
      const z = -this.half + iz * step;
      for (let ix = 0; ix < n; ix++) {
        const x = -this.half + ix * step;
        const h = this.height(x, z);
        const s = this.slope(x, z, step * 0.65);
        const idx = iz * n + ix;
        positions[p] = x;
        positions[p + 1] = h;
        positions[p + 2] = z;
        heights[idx] = h;
        slopes[idx] = s;
        this.colorAt(x, z, h, s, tmpColor);
        colors[p] = tmpColor.r;
        colors[p + 1] = tmpColor.g;
        colors[p + 2] = tmpColor.b;
        uvs[(iz * n + ix) * 2] = ix / segments;
        uvs[(iz * n + ix) * 2 + 1] = iz / segments;
        p += 3;
      }
    }
    let i = 0;
    for (let iz = 0; iz < segments; iz++) {
      for (let ix = 0; ix < segments; ix++) {
        const a = iz * n + ix;
        const b = a + 1;
        const c = a + n;
        const d = c + 1;
        indices[i++] = a;
        indices[i++] = c;
        indices[i++] = b;
        indices[i++] = b;
        indices[i++] = c;
        indices[i++] = d;
      }
    }
    return { positions, colors, uvs, indices, heights, vertexSlopes: slopes, gridN: n };
  }

  sampleGrid(n = 128): TerrainSampleGrid {
    const heights = new Float32Array(n * n);
    const slopes = new Float32Array(n * n);
    const colors = new Float32Array(n * n * 3);
    let minHeight = Infinity;
    let maxHeight = -Infinity;
    const step = this.size / (n - 1);
    const color = new THREE.Color();
    for (let iz = 0; iz < n; iz++) {
      const z = -this.half + iz * step;
      for (let ix = 0; ix < n; ix++) {
        const x = -this.half + ix * step;
        const h = this.height(x, z);
        const s = this.slope(x, z, step * 0.7);
        const i = iz * n + ix;
        heights[i] = h;
        slopes[i] = s;
        minHeight = Math.min(minHeight, h);
        maxHeight = Math.max(maxHeight, h);
        this.colorAt(x, z, h, s, color);
        colors[i * 3] = color.r;
        colors[i * 3 + 1] = color.g;
        colors[i * 3 + 2] = color.b;
      }
    }
    return { n, size: this.size, heights, slopes, colors, minHeight, maxHeight };
  }
}

export const terrainGenerator = new TerrainGenerator();
