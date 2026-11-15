import { terrainGenerator } from '../../world/TerrainGenerator';
import { ZONES, zoneAt } from '../data/zones';
import { POIS } from '../data/pois';
import { WORLD } from '../config';
import type { RouteOption, RouteStats, Vec3 } from '../types';

type Profile = 'safest' | 'balanced' | 'scientific';

interface Node {
  index: number;
  g: number;
  f: number;
}

class MinHeap {
  private data: Node[] = [];
  push(node: Node) {
    this.data.push(node);
    let i = this.data.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (this.data[p].f <= node.f) break;
      this.data[i] = this.data[p];
      i = p;
    }
    this.data[i] = node;
  }
  pop(): Node | undefined {
    if (this.data.length === 0) return undefined;
    const top = this.data[0];
    const last = this.data.pop()!;
    if (this.data.length > 0) {
      let i = 0;
      const n = this.data.length;
      while (true) {
        const l = i * 2 + 1;
        const r = l + 1;
        if (l >= n) break;
        let c = l;
        if (r < n && this.data[r].f < this.data[l].f) c = r;
        if (this.data[c].f >= last.f) break;
        this.data[i] = this.data[c];
        i = c;
      }
      this.data[i] = last;
    }
    return top;
  }
  get size() {
    return this.data.length;
  }
}

const PROFILE_META: Record<Profile, { name: string; color: string }> = {
  safest: { name: 'SAFEST ROUTE', color: '#8ff0d2' },
  balanced: { name: 'BALANCED ROUTE', color: '#ffcf7a' },
  scientific: { name: 'SCIENTIFIC ROUTE', color: '#9fd8e8' },
};

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

export class RoutePlanner {
  readonly n = 161;
  readonly cell = WORLD.size / 160;
  readonly half = WORLD.size / 2;
  readonly heights = new Float32Array(this.n * this.n);
  readonly slopes = new Float32Array(this.n * this.n);
  readonly blocked = new Uint8Array(this.n * this.n);
  readonly zonePenalty = new Float32Array(this.n * this.n);
  readonly nearPoi = new Uint8Array(this.n * this.n);
  private built = false;
  private building = false;

  ensureBuilt() {
    if (this.built || this.building) return;
    this.building = true;
    for (let iz = 0; iz < this.n; iz++) {
      const z = -this.half + iz * this.cell;
      for (let ix = 0; ix < this.n; ix++) {
        const x = -this.half + ix * this.cell;
        const i = iz * this.n + ix;
        const h = terrainGenerator.height(x, z);
        const s = terrainGenerator.slope(x, z, this.cell * 0.5);
        this.heights[i] = h;
        this.slopes[i] = s;
        const outside = Math.abs(x) > WORLD.playable || Math.abs(z) > WORLD.playable;
        this.blocked[i] = outside || s > 53 ? 1 : 0;
        const zone = zoneAt(x, z);
        let penalty = 0;
        if (zone) {
          if (zone.type === 'uncertain') penalty = 5;
          else if (zone.type === 'special') penalty = 7;
          else if (zone.type === 'radiation') penalty = 2.5;
          else if (zone.type === 'topographic') penalty = 3;
          else penalty = 1;
        }
        // Additional cost for the steep scarp core.
        if (s > 35) penalty += (s - 35) * 0.22;
        this.zonePenalty[i] = penalty;
        for (const p of POIS) {
          if (Math.hypot(x - p.x, z - p.z) < 11) {
            this.nearPoi[i] = 1;
            break;
          }
        }
      }
    }
    this.built = true;
    this.building = false;
  }

  worldToCell(x: number, z: number): { ix: number; iz: number } {
    return {
      ix: clamp(Math.round((x + this.half) / this.cell), 0, this.n - 1),
      iz: clamp(Math.round((z + this.half) / this.cell), 0, this.n - 1),
    };
  }

  cellToWorld(ix: number, iz: number): { x: number; z: number } {
    return { x: -this.half + ix * this.cell, z: -this.half + iz * this.cell };
  }

  private nearestOpen(ix: number, iz: number): { ix: number; iz: number } {
    if (!this.blocked[iz * this.n + ix]) return { ix, iz };
    for (let r = 1; r < 12; r++) {
      for (let dz = -r; dz <= r; dz++) {
        for (let dx = -r; dx <= r; dx++) {
          if (Math.abs(dx) !== r && Math.abs(dz) !== r) continue;
          const nx = ix + dx;
          const nz = iz + dz;
          if (nx < 0 || nz < 0 || nx >= this.n || nz >= this.n) continue;
          if (!this.blocked[nz * this.n + nx]) return { ix: nx, iz: nz };
        }
      }
    }
    return { ix, iz };
  }

  private aStar(
    start: { ix: number; iz: number },
    goal: { ix: number; iz: number },
    profile: Profile
  ): number[] | null {
    const { n } = this;
    const startIdx = start.iz * n + start.ix;
    const goalIdx = goal.iz * n + goal.ix;
    if (this.blocked[startIdx] || this.blocked[goalIdx]) return null;

    const gScore = new Float32Array(n * n).fill(Infinity);
    const cameFrom = new Int32Array(n * n).fill(-1);
    const closed = new Uint8Array(n * n);
    const open = new MinHeap();
    gScore[startIdx] = 0;
    const h = (idx: number) => {
      const ix = idx % n;
      const iz = (idx / n) | 0;
      const dx = Math.abs(ix - goal.ix);
      const dz = Math.abs(iz - goal.iz);
      return (dx + dz + (Math.SQRT2 - 2) * Math.min(dx, dz)) * this.cell;
    };
    open.push({ index: startIdx, g: 0, f: h(startIdx) });

    const dirs = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
      [1, 1],
      [1, -1],
      [-1, 1],
      [-1, -1],
    ];

    let iterations = 0;
    while (open.size > 0 && iterations++ < n * n * 2) {
      const current = open.pop()!;
      if (closed[current.index]) continue;
      if (current.index === goalIdx) {
        const path: number[] = [];
        let idx = goalIdx;
        while (idx !== -1) {
          path.push(idx);
          idx = cameFrom[idx];
        }
        return path.reverse();
      }
      closed[current.index] = 1;
      const cx = current.index % n;
      const cz = (current.index / n) | 0;
      const ch = this.heights[current.index];
      const cs = this.slopes[current.index];

      for (const [dx, dz] of dirs) {
        const nx = cx + dx;
        const nz = cz + dz;
        if (nx < 0 || nz < 0 || nx >= n || nz >= n) continue;
        const ni = nz * n + nx;
        if (this.blocked[ni] || closed[ni]) continue;
        const ns = this.slopes[ni];
        const diagonal = dx !== 0 && dz !== 0;
        let step = this.cell * (diagonal ? Math.SQRT2 : 1);
        const dh = this.heights[ni] - ch;
        step += Math.abs(dh) * (profile === 'safest' ? 2.8 : 1.5);

        const slopePenalty =
          profile === 'safest'
            ? Math.pow(Math.max(0, ns - 12) / 10, 2.1) * 4.0
            : profile === 'balanced'
              ? Math.pow(Math.max(0, ns - 18) / 12, 2.0) * 2.0
              : Math.pow(Math.max(0, ns - 20) / 14, 2.0) * 1.25;
        step += slopePenalty;

        const zp = this.zonePenalty[ni];
        step +=
          profile === 'safest' ? zp * 5.0 : profile === 'balanced' ? zp * 2.0 : zp * 1.15;

        // The safest route avoids very steep cells almost entirely.
        if (profile === 'safest' && (cs > 39 || ns > 39)) step += 38;
        if (profile === 'safest' && (cs > 45 || ns > 45)) step += 120;

        const tentative = current.g + step;
        if (tentative < gScore[ni]) {
          gScore[ni] = tentative;
          cameFrom[ni] = current.index;
          open.push({ index: ni, g: tentative, f: tentative + h(ni) });
        }
      }
    }
    return null;
  }

  private pathPoints(indices: number[], start: Vec3, destination: { x: number; z: number }): Vec3[] {
    const points: Vec3[] = [{ x: start.x, y: start.y, z: start.z }];
    let lastX = start.x;
    let lastZ = start.z;
    for (let i = 0; i < indices.length; i++) {
      const ix = indices[i] % this.n;
      const iz = (indices[i] / this.n) | 0;
      const w = this.cellToWorld(ix, iz);
      if (Math.hypot(w.x - lastX, w.z - lastZ) < this.cell * 1.5 && i !== indices.length - 1) continue;
      points.push({ x: w.x, y: terrainGenerator.height(w.x, w.z) + 0.35, z: w.z });
      lastX = w.x;
      lastZ = w.z;
    }
    const end = { x: destination.x, y: terrainGenerator.height(destination.x, destination.z) + 0.35, z: destination.z };
    if (Math.hypot(lastX - end.x, lastZ - end.z) > 1.2) points.push(end);
    else points[points.length - 1] = end;
    if (points.length < 2) points.push(end);
    return points;
  }

  private stats(points: Vec3[]): RouteStats {
    let distance = 0;
    let ascent = 0;
    let maxSlope = 0;
    let hazardCells = 0;
    let poiCount = 0;
    const seen = new Set<string>();
    for (let i = 1; i < points.length; i++) {
      const a = points[i - 1];
      const b = points[i];
      const d = Math.hypot(b.x - a.x, b.z - a.z);
      distance += d;
      if (b.y > a.y) ascent += b.y - a.y;
      if (i % 2 === 0) {
        const s = terrainGenerator.slope(b.x, b.z, 2);
        maxSlope = Math.max(maxSlope, s);
        if (zoneAt(b.x, b.z)) hazardCells++;
        for (const p of POIS) {
          if (Math.hypot(b.x - p.x, b.z - p.z) < 13 && !seen.has(p.id)) {
            seen.add(p.id);
            poiCount++;
          }
        }
      }
    }
    const effectiveSpeed = 1.34 - Math.min(0.55, maxSlope / 90);
    const estimatedMinutes = distance / effectiveSpeed / 60 + ascent / 6 / 60;
    const risk = clamp(
      Math.round(maxSlope * 1.05 + hazardCells * 2.1 + Math.max(0, distance - 250) * 0.02),
      0,
      100
    );
    return {
      distance: Math.round(distance),
      ascent: Math.round(ascent),
      maxSlope: Math.round(maxSlope),
      estimatedMinutes: Math.max(1, Math.round(estimatedMinutes)),
      risk,
      poiCount,
      hazardCells,
    };
  }

  plan(
    start: { x: number; z: number; y: number },
    destination: { x: number; z: number },
    destinationLabel: string
  ): RouteOption[] {
    this.ensureBuilt();
    const startRaw = this.worldToCell(start.x, start.z);
    const goalRaw = this.worldToCell(destination.x, destination.z);
    const startCell = this.nearestOpen(startRaw.ix, startRaw.iz);
    const goalCell = this.nearestOpen(goalRaw.ix, goalRaw.iz);
    const startVec = { x: start.x, y: start.y, z: start.z };

    // Scientific route is routed through one nearby scientific stop when one is on the way.
    let sciVia: { x: number; z: number } | null = null;
    const dx = destination.x - start.x;
    const dz = destination.z - start.z;
    const len = Math.hypot(dx, dz) || 1;
    for (const poi of POIS) {
      const t = ((poi.x - start.x) * dx + (poi.z - start.z) * dz) / (len * len);
      if (t <= 0.12 || t >= 0.92) continue;
      const px = start.x + dx * t;
      const pz = start.z + dz * t;
      const off = Math.hypot(poi.x - px, poi.z - pz);
      if (off < 80) {
        if (!sciVia || off < Math.hypot(sciVia.x - px, sciVia.z - pz)) sciVia = { x: poi.x, z: poi.z };
      }
    }

    return (['safest', 'balanced', 'scientific'] as Profile[]).map((profile) => {
      let path: number[] | null;
      let viaLabel = '';
      if (profile === 'scientific' && sciVia) {
        const viaRaw = this.worldToCell(sciVia.x, sciVia.z);
        const viaCell = this.nearestOpen(viaRaw.ix, viaRaw.iz);
        const a = this.aStar(startCell, viaCell, profile);
        const b = this.aStar(viaCell, goalCell, profile);
        if (a && b) {
          path = [...a, ...b.slice(1)];
          viaLabel = ' · via nearby science stop';
        } else {
          path = this.aStar(startCell, goalCell, profile);
        }
      } else {
        path = this.aStar(startCell, goalCell, profile);
      }
      let warning: string | undefined;
      let fallback = false;
      if (!path) {
        fallback = true;
        path = [startCell.iz * this.n + startCell.ix, goalCell.iz * this.n + goalCell.ix];
        warning = 'No continuous walkable corridor found. Direct line shown; verify locally.';
      }
      const points = this.pathPoints(path, startVec, destination);
      const stats = this.stats(points);
      const meta = PROFILE_META[profile];
      if (stats.maxSlope > 45) {
        warning = warning ?? 'Route includes slopes above the comfortable walking threshold.';
      }
      if (profile === 'safest' && stats.risk > 55) {
        warning = warning ?? 'Terrain constrains all approaches. Take local readings before committing.';
      }
      return {
        id: profile,
        name: meta.name + viaLabel,
        color: meta.color,
        points,
        stats,
        warning,
      };
    });
  }
}

export const routePlanner = new RoutePlanner();

export function routeSummary(route: RouteOption): string {
  return `${route.stats.distance} m · ${route.stats.estimatedMinutes} min · max ${route.stats.maxSlope}° · risk ${route.stats.risk}`;
}
