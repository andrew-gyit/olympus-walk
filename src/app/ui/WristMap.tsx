import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowUpRight,
  Crosshair,
  Layers,
  LocateFixed,
  MapPin,
  Navigation,
  Route as RouteIcon,
  ScanLine,
  ShieldAlert,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { MAP_LAYERS, SLOPE_BANDS, WORLD } from '../../game/config';
import { POIS } from '../../game/data/pois';
import { ZONES, zoneAt } from '../../game/data/zones';
import { useGameStore } from '../../stores/gameStore';
import { terrainGenerator, type TerrainSampleGrid } from '../../world/TerrainGenerator';
import type { MapLayer, POI, RouteOption } from '../../game/types';
import { DataChip, SectionTitle } from './Shared';

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

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

const LEVEL_COLOR: Record<string, string> = {
  info: '#8ff0d2',
  success: '#8ff0d2',
  caution: '#ffcf7a',
  warning: '#ffb35c',
  critical: '#ff6b57',
};

type RampStop = [number, [number, number, number]];

const ELEVATION_RAMP: RampStop[] = [
  [0, [42, 31, 39]],
  [0.28, [96, 57, 49]],
  [0.52, [151, 91, 61]],
  [0.74, [199, 137, 93]],
  [0.9, [231, 181, 128]],
  [1, [247, 224, 187]],
];

const TEMPERATURE_RAMP: RampStop[] = [
  [0, [62, 78, 148]],
  [0.3, [111, 89, 167]],
  [0.55, [183, 104, 107]],
  [0.78, [224, 133, 90]],
  [1, [255, 213, 143]],
];

function hexRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function ramp(stops: RampStop[], t: number): [number, number, number] {
  const v = clamp01(t);
  for (let i = 0; i < stops.length - 1; i++) {
    const [a, ca] = stops[i];
    const [b, cb] = stops[i + 1];
    if (v <= b) {
      const f = b === a ? 0 : (v - a) / (b - a);
      return [ca[0] + (cb[0] - ca[0]) * f, ca[1] + (cb[1] - ca[1]) * f, ca[2] + (cb[2] - ca[2]) * f];
    }
  }
  return stops[stops.length - 1][1];
}

function shadeAt(grid: TerrainSampleGrid, ix: number, iz: number): number {
  const n = grid.n;
  const step = grid.size / (n - 1);
  const at = (x: number, z: number) => {
    const cx = Math.max(0, Math.min(n - 1, x));
    const cz = Math.max(0, Math.min(n - 1, z));
    return grid.heights[cz * n + cx];
  };
  const dx = (at(ix + 1, iz) - at(ix - 1, iz)) / (2 * step);
  const dz = (at(ix, iz + 1) - at(ix, iz - 1)) / (2 * step);
  const inv = 1 / Math.sqrt(dx * dx + dz * dz + 1);
  const light = -dx * inv * -0.45 + inv * 0.78 + -dz * inv * 0.44;
  return 0.58 + Math.max(0, light) * 0.7;
}

function makeLayerImage(
  grid: TerrainSampleGrid,
  layer: MapLayer,
  timeOfSol: number
): HTMLCanvasElement | null {
  if (layer === 'minerals') return null;
  const n = grid.n;
  const canvas = document.createElement('canvas');
  canvas.width = n;
  canvas.height = n;
  const ctx = canvas.getContext('2d')!;
  const img = ctx.createImageData(n, n);
  const data = img.data;
  const step = grid.size / (n - 1);
  const bandData = new Int16Array(n * n);
  const range = Math.max(1, grid.maxHeight - grid.minHeight);
  if (layer === 'elevation') {
    for (let i = 0; i < n * n; i++) {
      bandData[i] = Math.floor(clamp01((grid.heights[i] - grid.minHeight) / range) * 18);
    }
  }

  for (let iz = 0; iz < n; iz++) {
    const z = -grid.size / 2 + iz * step;
    for (let ix = 0; ix < n; ix++) {
      const i = iz * n + ix;
      const x = -grid.size / 2 + ix * step;
      const p = i * 4;
      let r = 22;
      let g = 16;
      let b = 14;
      let a = 255;

      if (layer === 'elevation') {
        const t = clamp01((grid.heights[i] - grid.minHeight) / range);
        [r, g, b] = ramp(ELEVATION_RAMP, t);
        const band = bandData[i];
        const left = ix > 0 ? bandData[i - 1] : band;
        const up = iz > 0 ? bandData[i - n] : band;
        const shade = shadeAt(grid, ix, iz) * (band !== left || band !== up ? 0.7 : 1);
        r *= shade;
        g *= shade;
        b *= shade;
      } else if (layer === 'surface') {
        const shade = shadeAt(grid, ix, iz);
        r = grid.colors[i * 3] * 255 * shade;
        g = grid.colors[i * 3 + 1] * 255 * shade;
        b = grid.colors[i * 3 + 2] * 255 * shade;
      } else if (layer === 'slope') {
        const slope = grid.slopes[i];
        const band = SLOPE_BANDS.find((s) => slope <= s.max) ?? SLOPE_BANDS[SLOPE_BANDS.length - 1];
        [r, g, b] = hexRgb(band.color);
        const shade = 0.72 + shadeAt(grid, ix, iz) * 0.28;
        r *= shade;
        g *= shade;
        b *= shade;
      } else if (layer === 'temperature') {
        const temp = terrainGenerator.temperatureAt(x, z, 1, timeOfSol);
        [r, g, b] = ramp(TEMPERATURE_RAMP, (temp + 98) / 108);
        const shade = 0.8 + shadeAt(grid, ix, iz) * 0.2;
        r *= shade;
        g *= shade;
        b *= shade;
      } else if (layer === 'radiation') {
        const d = Math.hypot(x - 252, z + 46);
        const t = clamp01(1 - d / 82);
        if (t <= 0.001) {
          a = 0;
        } else {
          r = 160 + 40 * t;
          g = 110 + 20 * t;
          b = 230;
          a = 40 + 105 * t;
        }
      } else if (layer === 'hazards') {
        const slope = grid.slopes[i];
        const zone = zoneAt(x, z);
        const steep = clamp01((slope - 32) / 20);
        if (steep <= 0.001 && !zone) {
          a = 0;
        } else {
          const zoneBoost = zone ? (zone.access === 'observe-only' ? 0.4 : 0.22) : 0;
          const strength = clamp01(steep * 0.85 + zoneBoost);
          r = 255;
          g = 92 + (1 - strength) * 70;
          b = 70 + (1 - strength) * 40;
          a = 32 + strength * 150;
        }
      }

      data[p] = Math.max(0, Math.min(255, r));
      data[p + 1] = Math.max(0, Math.min(255, g));
      data[p + 2] = Math.max(0, Math.min(255, b));
      data[p + 3] = Math.max(0, Math.min(255, a));
    }
  }
  ctx.putImageData(img, 0, 0);
  return canvas;
}

function drawTerrainRegion(
  ctx: CanvasRenderingContext2D,
  image: HTMLCanvasElement,
  view: { minX: number; maxX: number; minZ: number; maxZ: number },
  width: number,
  height: number
) {
  const worldMin = -WORLD.size / 2;
  const full = WORLD.size;
  const vx0 = Math.max(view.minX, worldMin);
  const vx1 = Math.min(view.maxX, worldMin + full);
  const vz0 = Math.max(view.minZ, worldMin);
  const vz1 = Math.min(view.maxZ, worldMin + full);
  if (vx1 <= vx0 || vz1 <= vz0) return;
  const dx = ((vx0 - view.minX) / (view.maxX - view.minX)) * width;
  const dy = ((vz0 - view.minZ) / (view.maxZ - view.minZ)) * height;
  const dw = ((vx1 - vx0) / (view.maxX - view.minX)) * width;
  const dh = ((vz1 - vz0) / (view.maxZ - view.minZ)) * height;
  const sx = ((vx0 - worldMin) / full) * image.width;
  const sy = ((vz0 - worldMin) / full) * image.height;
  const sw = ((vx1 - vx0) / full) * image.width;
  const sh = ((vz1 - vz0) / full) * image.height;
  ctx.drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh);
}

interface PendingDestination {
  x: number;
  z: number;
  label: string;
  poiId?: string | null;
}

type PoiFilter = 'all' | 'mission' | 'mineral' | 'sensitive';

export function WristMapContent() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const grid = useMemo(() => terrainGenerator.sampleGrid(161), []);
  const mapLayers = useGameStore((s) => s.mapLayers);
  const toggleMapLayer = useGameStore((s) => s.toggleMapLayer);
  const telemetry = useGameStore((s) => s.telemetry);
  const navigation = useGameStore((s) => s.navigation);
  const scanned = useGameStore((s) => s.scanned);
  const analyzed = useGameStore((s) => s.analyzed);
  const reached = useGameStore((s) => s.reached);
  const mission = useGameStore((s) => s.mission);
  const mapFocus = useGameStore((s) => s.mapFocus);
  const setMapFocus = useGameStore((s) => s.setMapFocus);
  const setDestination = useGameStore((s) => s.setDestination);
  const selectRoute = useGameStore((s) => s.selectRoute);
  const clearRoute = useGameStore((s) => s.clearRoute);
  const openPanel = useGameStore((s) => s.openPanel);
  const setPPPrinciple = useGameStore((s) => s.setPPPrinciple);
  const environment = useGameStore((s) => s.environment);

  const [zoom, setZoom] = useState<'zone' | 'local'>('zone');
  const [pending, setPending] = useState<PendingDestination | null>(() =>
    navigation.destination
      ? {
          x: navigation.destination.x,
          z: navigation.destination.z,
          label: navigation.destinationLabel || 'Saved destination',
          poiId: navigation.destinationPoiId,
        }
      : null
  );
  const [planning, setPlanning] = useState(false);
  const [filter, setFilter] = useState<PoiFilter>('all');

  const solKey = Math.round(environment.timeOfSol * 100) / 100;
  const layerImages = useMemo(() => {
    const images: Partial<Record<MapLayer, HTMLCanvasElement>> = {};
    for (const layer of MAP_LAYERS) {
      if (layer.id === 'minerals') continue;
      if (mapLayers[layer.id]) {
        const image = makeLayerImage(grid, layer.id, solKey);
        if (image) images[layer.id] = image;
      }
    }
    return images;
  }, [grid, mapLayers, solKey]);

  const view = useMemo(() => {
    if (zoom === 'local') {
      return {
        minX: telemetry.position.x - 165,
        maxX: telemetry.position.x + 165,
        minZ: telemetry.position.z - 165,
        maxZ: telemetry.position.z + 165,
      };
    }
    return { minX: -WORLD.playable, maxX: WORLD.playable, minZ: -WORLD.playable, maxZ: WORLD.playable };
  }, [zoom, telemetry.position.x, telemetry.position.z]);

  const selectedPoi = useMemo(() => POIS.find((p) => p.id === mapFocus) ?? null, [mapFocus]);
  const pendingZone = pending ? zoneAt(pending.x, pending.z) : null;

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = canvas.width;
    const H = canvas.height;
    // The canvas is drawn at a fixed 760px and shown scaled to fit the panel (≈0.6x on a laptop),
    // so text is scaled back up to stay about 13px on screen.
    const shown = canvas.getBoundingClientRect().width || W;
    const font = (px: number, bold = false) => `${bold ? 'bold ' : ''}${Math.round(px * 1.3 * (W / shown))}px Consolas, monospace`;
    const spanX = view.maxX - view.minX;
    const spanZ = view.maxZ - view.minZ;
    const w2c = (x: number, z: number) => [
      ((x - view.minX) / spanX) * W,
      ((z - view.minZ) / spanZ) * H,
    ];
    const scale = W / spanX;

    ctx.clearRect(0, 0, W, H);
    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, '#170d0a');
    bg.addColorStop(1, '#0d0706');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Terrain layers in declared order so the last enabled layer is dominant.
    for (const meta of MAP_LAYERS) {
      const image = layerImages[meta.id];
      if (!image) continue;
      ctx.globalAlpha = meta.id === 'radiation' ? 0.9 : meta.id === 'hazards' ? 0.85 : 0.96;
      drawTerrainRegion(ctx, image, view, W, H);
    }
    ctx.globalAlpha = 1;

    // Kill the map to a shallow vignette at the edges.
    const vignette = ctx.createRadialGradient(W / 2, H / 2, W * 0.18, W / 2, H / 2, W * 0.72);
    vignette.addColorStop(0, 'rgba(0,0,0,0)');
    vignette.addColorStop(1, 'rgba(6,3,2,0.5)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, W, H);

    // Coordinate grid.
    const spacing = zoom === 'local' ? 25 : 50;
    ctx.font = font(10);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    for (let x = Math.ceil(view.minX / spacing) * spacing; x <= view.maxX; x += spacing) {
      const [px] = w2c(x, view.minZ);
      ctx.strokeStyle = x % (spacing * 2) === 0 ? 'rgba(217,145,99,0.18)' : 'rgba(217,145,99,0.08)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(px, 0);
      ctx.lineTo(px, H);
      ctx.stroke();
      if (x % (spacing * 2) === 0) {
        ctx.fillStyle = 'rgba(232,186,150,0.78)';
        ctx.fillText(`${Math.round(x)}`, px + 3, 3);
      }
    }
    for (let z = Math.ceil(view.minZ / spacing) * spacing; z <= view.maxZ; z += spacing) {
      const [, py] = w2c(view.minX, z);
      ctx.strokeStyle = z % (spacing * 2) === 0 ? 'rgba(217,145,99,0.18)' : 'rgba(217,145,99,0.08)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, py);
      ctx.lineTo(W, py);
      ctx.stroke();
      if (z % (spacing * 2) === 0) {
        ctx.fillStyle = 'rgba(232,186,150,0.78)';
        ctx.fillText(`${Math.round(z)}`, 3, py + 2);
      }
    }

    // Precaution zones.
    const zoneAlpha = mapLayers.hazards ? 1 : 0.42;
    for (const zone of ZONES) {
      if (zone.id === 'zone-camp') continue;
      const [cx, cy] = w2c(zone.center.x, zone.center.z);
      const r = zone.radius * scale;
      if (cx + r < 0 || cx - r > W || cy + r < 0 || cy - r > H) continue;
      ctx.globalAlpha = zoneAlpha;
      ctx.setLineDash(zone.access === 'observe-only' ? [3, 6] : [9, 7]);
      ctx.lineWidth = zone.access === 'observe-only' ? 2.2 : 1.4;
      ctx.strokeStyle = LEVEL_COLOR[zone.level] ?? '#d99163';
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      if (mapLayers.hazards) {
        ctx.fillStyle = `${LEVEL_COLOR[zone.level] ?? '#d99163'}12`;
        ctx.fill();
      }
      ctx.font = font(10, true);
      ctx.fillStyle = LEVEL_COLOR[zone.level] ?? '#d99163';
      ctx.textAlign = 'center';
      ctx.fillText(zone.code, cx, cy - r - 12);
      ctx.textAlign = 'left';
    }
    ctx.globalAlpha = 1;

    // Base camp.
    {
      const [cx, cy] = w2c(0, 0);
      ctx.strokeStyle = '#8ff0d2';
      ctx.fillStyle = 'rgba(143,240,210,0.14)';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.rect(cx - 7, cy - 7, 14, 14);
      ctx.fill();
      ctx.stroke();
      ctx.font = font(10, true);
      ctx.fillStyle = '#8ff0d2';
      ctx.textAlign = 'center';
      ctx.fillText('BC-A', cx, cy + 30);
      ctx.textAlign = 'left';
    }

    // Route alternatives.
    if (navigation.routes.length) {
      for (const route of navigation.routes) {
        const selected = route.id === navigation.selectedRouteId;
        ctx.strokeStyle = route.color;
        ctx.globalAlpha = selected ? 0.98 : 0.4;
        ctx.lineWidth = selected ? 3.5 : 1.5;
        ctx.beginPath();
        route.points.forEach((point, index) => {
          const [px, py] = w2c(point.x, point.z);
          if (index === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        });
        ctx.stroke();
        if (selected) {
          ctx.globalAlpha = 0.5;
          ctx.strokeStyle = '#fff3e2';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;
    }

    // Destination marker.
    if (navigation.destination) {
      const [dx, dy] = w2c(navigation.destination.x, navigation.destination.z);
      ctx.strokeStyle = '#8ff0d2';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(dx, dy, 8, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(dx - 12, dy);
      ctx.lineTo(dx + 12, dy);
      ctx.moveTo(dx, dy - 12);
      ctx.lineTo(dx, dy + 12);
      ctx.stroke();
    }

    // Scanner-confirmed mineral signatures only.
    if (mapLayers.minerals) {
      for (const poi of POIS) {
        if (!poi.mineral || scanned[poi.id] === undefined) continue;
        const [px, py] = w2c(poi.x, poi.z);
        const glow = ctx.createRadialGradient(px, py, 0, px, py, 22);
        glow.addColorStop(0, 'rgba(143,240,210,0.55)');
        glow.addColorStop(1, 'rgba(143,240,210,0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(px, py, 22, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Field targets.
    for (const poi of POIS) {
      const [px, py] = w2c(poi.x, poi.z);
      if (px < -30 || px > W + 30 || py < -30 || py > H + 30) continue;
      const focused = poi.id === mapFocus;
      const known = scanned[poi.id] !== undefined || reached[poi.id] !== undefined || analyzed[poi.id] !== undefined;
      const color = TYPE_COLOR[poi.type];
      ctx.globalAlpha = known ? 1 : 0.66;
      if (focused) {
        ctx.strokeStyle = '#fff3e2';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(px, py, 11, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(px, py, focused ? 6 : 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(12,7,5,0.85)';
      ctx.lineWidth = 1;
      ctx.stroke();
      if (analyzed[poi.id] !== undefined) {
        ctx.strokeStyle = '#8ff0d2';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.arc(px, py, 8, 0, Math.PI * 2);
        ctx.stroke();
      }
      if (zoom === 'local' || focused) {
        ctx.font = focused ? font(11, true) : font(9);
        ctx.fillStyle = focused ? '#fff3e2' : 'rgba(246,226,205,0.82)';
        ctx.textAlign = 'center';
        ctx.fillText(poi.code, px, py - (focused ? 16 : 12));
        ctx.textAlign = 'left';
      }
      ctx.globalAlpha = 1;
    }

    // Player position and heading.
    {
      const [px, py] = w2c(telemetry.position.x, telemetry.position.z);
      const heading = (telemetry.heading * Math.PI) / 180;
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(heading);
      ctx.fillStyle = '#ffcf7a';
      ctx.strokeStyle = 'rgba(20,12,8,0.9)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, -10);
      ctx.lineTo(7, 7);
      ctx.lineTo(0, 4);
      ctx.lineTo(-7, 7);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
      ctx.strokeStyle = 'rgba(255,207,122,0.55)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(px, py, 15, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Scale bar and orientation.
    const barMeters = zoom === 'local' ? 50 : 100;
    const barPx = barMeters * scale;
    const by = H - 22;
    ctx.strokeStyle = 'rgba(246,226,205,0.75)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(18, by);
    ctx.lineTo(18 + barPx, by);
    ctx.moveTo(18, by - 4);
    ctx.lineTo(18, by + 4);
    ctx.moveTo(18 + barPx, by - 4);
    ctx.lineTo(18 + barPx, by + 4);
    ctx.stroke();
    ctx.font = font(10);
    ctx.fillStyle = 'rgba(246,226,205,0.75)';
    ctx.fillText(`${barMeters} m`, 20, by - 24);

    ctx.strokeStyle = 'rgba(246,226,205,0.55)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(W - 28, 46);
    ctx.lineTo(W - 28, 18);
    ctx.moveTo(W - 33, 26);
    ctx.lineTo(W - 28, 18);
    ctx.lineTo(W - 23, 26);
    ctx.stroke();
    ctx.font = font(10, true);
    ctx.fillStyle = 'rgba(246,226,205,0.65)';
    ctx.textAlign = 'center';
    ctx.fillText('N', W - 28, 58);
    ctx.textAlign = 'left';

    ctx.strokeStyle = 'rgba(217,145,99,0.36)';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, W - 2, H - 2);
  }, [
    view,
    layerImages,
    mapLayers,
    zoom,
    telemetry.position.x,
    telemetry.position.z,
    telemetry.heading,
    navigation.routes,
    navigation.selectedRouteId,
    navigation.destination,
    scanned,
    analyzed,
    reached,
    mapFocus,
  ]);

  useEffect(() => {
    draw();
  }, [draw]);

  function handleCanvasClick(event: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const px = ((event.clientX - rect.left) / rect.width) * canvas.width;
    const py = ((event.clientY - rect.top) / rect.height) * canvas.height;
    const x = view.minX + (px / canvas.width) * (view.maxX - view.minX);
    const z = view.minZ + (py / canvas.height) * (view.maxZ - view.minZ);
    let nearest: POI | null = null;
    let nearestPx = 18;
    for (const poi of POIS) {
      const nx = ((poi.x - view.minX) / (view.maxX - view.minX)) * canvas.width;
      const ny = ((poi.z - view.minZ) / (view.maxZ - view.minZ)) * canvas.height;
      const d = Math.hypot(nx - px, ny - py);
      if (d < nearestPx) {
        nearestPx = d;
        nearest = poi;
      }
    }
    if (nearest) {
      setMapFocus(nearest.id);
      setPending({ x: nearest.x, z: nearest.z, label: nearest.shortName, poiId: nearest.id });
    } else {
      setMapFocus(null);
      setPending({ x, z, label: `Point ${Math.round(x)}, ${Math.round(z)}`, poiId: null });
    }
  }

  function planToPending() {
    if (!pending) return;
    setPlanning(true);
    window.setTimeout(() => {
      setDestination(pending.x, pending.z, pending.label, pending.poiId ?? null);
      setPlanning(false);
    }, 60);
  }

  const distanceToCamp = Math.hypot(telemetry.position.x, telemetry.position.z);
  const distanceToPending = pending
    ? Math.hypot(telemetry.position.x - pending.x, telemetry.position.z - pending.z)
    : null;

  const filteredPois = useMemo(() => {
    const list = POIS.filter((poi) => {
      if (filter === 'mineral') return poi.mineral;
      if (filter === 'sensitive') return !!poi.zoneId;
      if (filter === 'mission') return !!mission && poi.missionTags.includes(mission.id);
      return true;
    });
    return list.sort(
      (a, b) =>
        Math.hypot(telemetry.position.x - a.x, telemetry.position.z - a.z) -
        Math.hypot(telemetry.position.x - b.x, telemetry.position.z - b.z)
    );
  }, [filter, mission, telemetry.position.x, telemetry.position.z]);

  const shownRoute = navigation.selectedRoute ?? null;

  return (
    <div className="grid h-full min-h-0 gap-0 lg:grid-cols-[minmax(0,1fr)_380px]">
      <div className="flex min-h-0 flex-col border-b lg:border-b-0 lg:border-r" style={{ borderColor: 'rgba(217,145,99,0.2)' }}>
        <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-2.5" style={{ borderColor: 'rgba(217,145,99,0.14)' }}>
          <div className="flex items-center gap-2">
            <span className="label">TACTICAL CARTOGRAPHY</span>
            <DataChip kind="derived" compact />
          </div>
          <div className="flex items-center gap-1.5">
            <button
              className={`btn !px-2 !py-1 ${zoom === 'zone' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setZoom('zone')}
              title="Show the whole exploration zone"
            >
              <ZoomOut size={17} /> ZONE
            </button>
            <button
              className={`btn !px-2 !py-1 ${zoom === 'local' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setZoom('local')}
              title="Show a local window around the astronaut"
            >
              <ZoomIn size={17} /> LOCAL
            </button>
            <button
              className="btn btn-ghost !px-2 !py-1"
              onClick={() => {
                setZoom('local');
                setMapFocus(null);
              }}
              title="Centre on the astronaut"
            >
              <LocateFixed size={17} />
            </button>
          </div>
        </div>
        <div className="relative min-h-0 flex-1 p-3">
          <canvas
            ref={canvasRef}
            width={760}
            height={760}
            onClick={handleCanvasClick}
            className="mx-auto block h-full max-h-[62vh] w-auto max-w-full cursor-crosshair border"
            style={{ borderColor: 'rgba(217,145,99,0.25)', imageRendering: 'auto' }}
          />
          <div className="mono pointer-events-none absolute bottom-5 left-6 flex flex-wrap items-center gap-2 text-ui-sm tracking-[0.12em] text-mars-100/65">
            <span>X {Math.round(telemetry.position.x)}</span>
            <span>Z {Math.round(telemetry.position.z)}</span>
            <span>EL {Math.round(telemetry.elevation)} m</span>
            <span>HDG {Math.round(telemetry.heading)}°</span>
          </div>
          <div className="mono pointer-events-none absolute right-5 top-5 text-right text-ui-sm leading-relaxed tracking-[0.1em] text-mars-200/65">
            <div>ZONE A · OLYMPUS MONS</div>
            <div>{zoom === 'zone' ? 'FULL SURVEY' : 'LOCAL WINDOW'}</div>
            <div className="text-signal/80">CLICK TO SELECT TARGET</div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t px-4 py-2 text-ui-sm" style={{ borderColor: 'rgba(217,145,99,0.14)' }}>
          {MAP_LAYERS.filter((l) => mapLayers[l.id]).map((l) => (
            <span key={l.id} className="mono flex items-center gap-1.5 tracking-[0.1em]" style={{ color: l.color }}>
              <span className="inline-block h-1.5 w-1.5" style={{ background: l.color }} />
              {l.label}
            </span>
          ))}
          {MAP_LAYERS.every((l) => !mapLayers[l.id]) && (
            <span className="mono text-mars-200/65">NO ANALYSIS LAYERS ACTIVE — BASE PLATE ONLY</span>
          )}
        </div>
      </div>

      <div className="scroll-area min-h-0 overflow-y-auto p-4">
        <SectionTitle right={<span className="mono text-ui-sm text-mars-200/65">{distanceToCamp.toFixed(0)} m TO CAMP</span>}>
          LAYERS
        </SectionTitle>
        <div className="grid grid-cols-2 gap-1.5">
          {MAP_LAYERS.map((layer) => {
            const active = mapLayers[layer.id];
            return (
              <button
                key={layer.id}
                onClick={() => toggleMapLayer(layer.id)}
                className="flex items-start gap-2 border px-2 py-1.5 text-left transition-colors"
                style={{
                  borderColor: active ? `${layer.color}66` : 'rgba(217,145,99,0.16)',
                  background: active ? `${layer.color}0f` : 'rgba(17,10,8,0.45)',
                }}
                title={layer.description}
              >
                <span
                  className="mt-1 inline-block h-2 w-2 shrink-0"
                  style={{ background: active ? layer.color : 'transparent', border: `1px solid ${layer.color}99` }}
                />
                <span className="min-w-0">
                  <span className="mono block text-ui-sm tracking-[0.1em]" style={{ color: active ? layer.color : 'rgba(232,186,150,0.88)' }}>
                    {layer.label}
                  </span>
                  <span className="block text-ui-sm leading-tight text-mars-200/65">{layer.description}</span>
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-4">
          <SectionTitle right={<span className="mono text-ui-sm text-mars-200/65">{filteredPois.length} CONTACTS</span>}>
            TARGETS
          </SectionTitle>
          <div className="mb-2 flex flex-wrap gap-1">
            {([
              ['mission', 'MISSION'],
              ['mineral', 'MINERAL'],
              ['sensitive', 'SENSITIVE'],
              ['all', 'ALL'],
            ] as Array<[PoiFilter, string]>).map(([id, label]) => (
              <button
                key={id}
                className={`btn !px-2 !py-1 !text-ui-xs ${filter === id ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setFilter(id)}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="max-h-60 space-y-1 overflow-y-auto scroll-area pr-1">
            {filteredPois.map((poi) => {
              const d = Math.hypot(telemetry.position.x - poi.x, telemetry.position.z - poi.z);
              const state = analyzed[poi.id] !== undefined ? 'ANALYZED' : scanned[poi.id] !== undefined ? 'SCANNED' : reached[poi.id] !== undefined ? 'REACHED' : 'UNKNOWN';
              return (
                <button
                  key={poi.id}
                  onClick={() => {
                    setMapFocus(poi.id);
                    setPending({ x: poi.x, z: poi.z, label: poi.shortName, poiId: poi.id });
                  }}
                  className="flex w-full items-center gap-2 border px-2 py-1.5 text-left"
                  style={{
                    borderColor: mapFocus === poi.id ? 'rgba(255,207,122,0.55)' : 'rgba(217,145,99,0.14)',
                    background: mapFocus === poi.id ? 'rgba(255,207,122,0.08)' : 'transparent',
                  }}
                >
                  <span className="h-1.5 w-1.5 shrink-0" style={{ background: TYPE_COLOR[poi.type] }} />
                  <span className="min-w-0 flex-1">
                    <span className="mono block truncate text-ui-md text-mars-100">{poi.code} · {poi.shortName}</span>
                    <span className="mono block text-ui-xs tracking-[0.08em] text-mars-200/65">{state} · {d.toFixed(0)} m</span>
                  </span>
                  <ArrowUpRight size={16} className="shrink-0 text-mars-300/80" />
                </button>
              );
            })}
          </div>
        </div>

        {selectedPoi && (
          <div className="mt-4 border p-3" style={{ borderColor: 'rgba(217,145,99,0.2)' }}>
            <div className="flex items-center justify-between">
              <span className="mono text-ui-sm tracking-[0.18em]" style={{ color: TYPE_COLOR[selectedPoi.type] }}>{selectedPoi.code}</span>
              <DataChip kind="simulation" compact />
            </div>
            <div className="display mt-1 text-sm text-mars-100">{selectedPoi.name}</div>
            <p className="mt-1 text-ui-md leading-relaxed text-mars-200/65">{selectedPoi.description}</p>
            <div className="mt-2 flex flex-wrap gap-1">
              <span className="chip">{selectedPoi.type}</span>
              <span className="chip">{selectedPoi.interaction}</span>
              {selectedPoi.mineral && <span className="chip chip-signal">MINERAL</span>}
            </div>
            <div className="mt-2 flex gap-1.5">
              <button
                className="btn btn-ghost !flex-1 !py-1.5"
                onClick={() => {
                  setPending({ x: selectedPoi.x, z: selectedPoi.z, label: selectedPoi.shortName, poiId: selectedPoi.id });
                  planToPending();
                }}
              >
                <Navigation size={16} /> ROUTE HERE
              </button>
              {selectedPoi.zoneId && (
                <button
                  className="btn btn-ghost !py-1.5"
                  onClick={() => {
                    setPPPrinciple(selectedPoi.zoneId ?? null);
                    openPanel('pp');
                  }}
                  title="Open the protection record for this region"
                >
                  <ShieldAlert size={16} />
                </button>
              )}
            </div>
          </div>
        )}

        <div className="mt-4 border-t pt-3" style={{ borderColor: 'rgba(217,145,99,0.16)' }}>
          <SectionTitle right={<RouteIcon size={17} className="text-mars-300/80" />}>ROUTE PLAN</SectionTitle>
          {pending ? (
            <div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="mono text-ui-md text-mars-100">{pending.label}</div>
                  <div className="mono text-ui-sm text-mars-200/65">
                    {Math.round(pending.x)}, {Math.round(pending.z)} · {distanceToPending?.toFixed(0)} m
                  </div>
                </div>
                {pendingZone && (
                  <span className="chip chip-warn !text-ui-xs" style={{ color: LEVEL_COLOR[pendingZone.level] }}>
                    {pendingZone.access.toUpperCase()}
                  </span>
                )}
              </div>
              {pendingZone && (
                <div className="mt-2 border-l-2 pl-2 text-ui-sm leading-relaxed text-mars-200/65" style={{ borderColor: LEVEL_COLOR[pendingZone.level] }}>
                  {pendingZone.name}. {pendingZone.measures[0]}
                </div>
              )}
              <button className="btn btn-primary mt-2 w-full !py-2" onClick={planToPending} disabled={planning}>
                {planning ? 'COMPUTING ROUTES…' : 'COMPUTE 3 ROUTES'} <RouteIcon size={17} />
              </button>
            </div>
          ) : (
            <div className="border border-dashed px-3 py-4 text-ui-md leading-relaxed text-mars-200/65" style={{ borderColor: 'rgba(217,145,99,0.2)' }}>
              Click the map or choose a target, then compute the safest, balanced and scientific alternatives.
            </div>
          )}

          {navigation.routes.length > 0 && (
            <div className="mt-3 space-y-1.5">
              {navigation.routes.map((route) => (
                <RouteCard
                  key={route.id}
                  route={route}
                  active={navigation.selectedRouteId === route.id}
                  onSelect={() => selectRoute(route.id)}
                />
              ))}
              {navigation.selectedRouteId && (
                <button className="btn btn-ghost w-full !py-1.5 !text-ui-sm" onClick={clearRoute}>
                  CLEAR ACTIVE ROUTE
                </button>
              )}
            </div>
          )}
          {shownRoute?.warning && (
            <div className="mt-2 flex gap-1.5 border-l-2 pl-2 text-ui-sm leading-relaxed text-warn/80" style={{ borderColor: '#ffb35c' }}>
              <ShieldAlert size={16} className="mt-0.5 shrink-0" /> {shownRoute.warning}
            </div>
          )}
        </div>

        <div className="mt-4 border-t pt-3" style={{ borderColor: 'rgba(217,145,99,0.16)' }}>
          <SectionTitle>FIELD NOTES</SectionTitle>
          <div className="space-y-1.5 text-ui-sm leading-relaxed text-mars-200/65">
            <div className="flex gap-2"><Layers size={16} className="mt-0.5 shrink-0 text-mars-300/80" /> Layers are derived from the procedural height field. Mineral signatures appear only after a scanner confirmation.</div>
            <div className="flex gap-2"><MapPin size={16} className="mt-0.5 shrink-0 text-mars-300/80" /> Precaution rings are simulation boundaries, not official COSPAR special regions.</div>
            <div className="flex gap-2"><Crosshair size={16} className="mt-0.5 shrink-0 text-mars-300/80" /> Route plans guide the walk; the astronaut remains responsible for local conditions.</div>
            <div className="flex gap-2"><ScanLine size={16} className="mt-0.5 shrink-0 text-mars-300/80" /> {Object.keys(scanned).length} targets scanned · {Object.keys(analyzed).length} analyzed in this traverse.</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RouteCard({ route, active, onSelect }: { route: RouteOption; active: boolean; onSelect: () => void }) {
  const riskColor = route.stats.risk > 62 ? '#ff6b57' : route.stats.risk > 40 ? '#ffb35c' : '#8ff0d2';
  return (
    <button
      onClick={onSelect}
      className="w-full border px-2.5 py-2 text-left transition-colors"
      style={{
        borderColor: active ? `${route.color}88` : 'rgba(217,145,99,0.18)',
        background: active ? `${route.color}12` : 'rgba(17,10,8,0.42)',
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="mono flex items-center gap-1.5 text-ui-sm tracking-[0.12em]" style={{ color: route.color }}>
          <span className="inline-block h-1.5 w-4" style={{ background: route.color }} />
          {route.name}
        </span>
        <span className="mono text-ui-xs" style={{ color: active ? route.color : 'rgba(232,186,150,0.82)' }}>
          {active ? 'ACTIVE' : 'ACTIVATE'}
        </span>
      </div>
      <div className="mono mt-1 grid grid-cols-4 gap-1 text-ui-sm text-mars-200/65">
        <span>{route.stats.distance} m</span>
        <span>{route.stats.estimatedMinutes} min</span>
        <span>{route.stats.maxSlope}° max</span>
        <span style={{ color: riskColor }}>RISK {route.stats.risk}</span>
      </div>
      <div className="mono mt-1 flex items-center justify-between text-ui-xs text-mars-200/65">
        <span>ASCENT {route.stats.ascent} m · STOPS {route.stats.poiCount}</span>
        <span>HAZARD CELLS {route.stats.hazardCells}</span>
      </div>
    </button>
  );
}
