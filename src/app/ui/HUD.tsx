import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import {
  BatteryMedium,
  Camera,
  Compass,
  Crosshair,
  Droplets,
  FlaskConical,
  Footprints,
  HeartPulse,
  Layers,
  Map as MapIcon,
  Pause,
  Radio,
  ScanLine,
  Shield,
  ShieldCheck,
  Sun,
  Thermometer,
  Timer,
  TriangleAlert,
  Wind,
  Zap,
} from 'lucide-react';
import { WORLD } from '../../game/config';
import { POIS } from '../../game/data/pois';
import { ZONES } from '../../game/data/zones';
import { selectCurrentObjective, selectReturnReady, useGameStore } from '../../stores/gameStore';
import type { RouteOption } from '../../game/types';
import { formatClock, formatDuration, Meter } from './Shared';

const LEVEL_COLOR: Record<string, string> = {
  info: '#8ff0d2',
  success: '#8ff0d2',
  caution: '#ffcf7a',
  warning: '#ffb35c',
  critical: '#ff6b57',
};

const TOOL_META = [
  { id: 'scanner' as const, label: 'SCANNER', key: 'F', icon: ScanLine, color: '#8ff0d2' },
  { id: 'analyzer' as const, label: 'ANALYZER', key: 'E', icon: FlaskConical, color: '#ffcf7a' },
  { id: 'camera' as const, label: 'CAMERA', key: 'E', icon: Camera, color: '#9fd8e8' },
];

function usePointerLocked() {
  const [locked, setLocked] = useState(false);
  useEffect(() => {
    const update = () => setLocked(!!document.pointerLockElement);
    update();
    document.addEventListener('pointerlockchange', update);
    return () => document.removeEventListener('pointerlockchange', update);
  }, []);
  return locked;
}

function Panel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`border px-3 py-2.5 ${className}`}
      style={{
        borderColor: 'rgba(217,145,99,0.28)',
        background: 'linear-gradient(160deg, rgba(24,14,11,0.78), rgba(11,7,6,0.62))',
        boxShadow: '0 10px 30px rgba(0,0,0,0.32), inset 0 1px 0 rgba(255,225,197,0.05)',
        backdropFilter: 'blur(9px)',
      }}
    >
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ mission */

function MissionCard() {
  const mission = useGameStore((s) => s.mission);
  const current = useGameStore(selectCurrentObjective);
  const returnReady = useGameStore(selectReturnReady);
  const telemetry = useGameStore((s) => s.telemetry);
  const navigation = useGameStore((s) => s.navigation);
  const openPanel = useGameStore((s) => s.openPanel);

  if (!mission) return null;
  const required = mission.objectives.filter((o) => o.required);
  const completed = required.filter((o) => o.completed).length;
  const count = current?.count ?? 1;
  const progress = Math.min(100, ((current?.progress ?? 0) / Math.max(1, count)) * 100);
  const distance = navigation.destination ? telemetry.destinationDistance : telemetry.campDistance;
  const distanceLabel = navigation.destination ? 'TO TARGET' : 'TO CAMP';

  const headline = returnReady
    ? 'RETURN TO BASE CAMP A'
    : current?.label ?? 'All required objectives complete';
  const detail = returnReady
    ? 'Enter the 14 m camp perimeter to close the traverse.'
    : current?.hint ?? current?.detail ?? 'Check the objectives panel for the next step.';

  return (
    <Panel className="w-full">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="mono text-[8px] tracking-[0.22em]" style={{ color: '#d99163' }}>
              {mission.code}
            </span>
            <span className="mono text-[8px] text-mars-200/35">/ FIELD MISSION</span>
          </div>
          <div className="display truncate text-[13px] font-semibold tracking-wide text-mars-100">{mission.name}</div>
        </div>
        <button
          className="mono shrink-0 border px-1.5 py-0.5 text-[8px] tracking-[0.12em]"
          style={{ borderColor: 'rgba(143,240,210,0.35)', color: '#8ff0d2' }}
          onClick={() => openPanel('objectives')}
          title="Open objectives (Tab)"
        >
          {completed}/{required.length}
        </button>
      </div>

      <div
        className="mt-2 border-l-2 pl-2"
        style={{ borderColor: returnReady ? '#8ff0d2' : current ? '#ffcf7a' : 'rgba(217,145,99,0.4)' }}
      >
        <div className="flex items-center gap-1.5">
          {returnReady ? (
            <ShieldCheck size={11} style={{ color: '#8ff0d2' }} />
          ) : (
            <Crosshair size={11} style={{ color: current ? '#ffcf7a' : '#8e6b57' }} />
          )}
          <span className="text-[10px] leading-tight" style={{ color: returnReady ? '#b9f5e2' : '#f8ddc8' }}>
            {headline}
          </span>
        </div>
        <div className="mt-0.5 line-clamp-2 text-[8.5px] leading-relaxed text-mars-200/50">{detail}</div>
        {!returnReady && count > 1 && (
          <div className="mt-1 flex items-center gap-1.5">
            <Meter value={progress} color="#ffcf7a" height={2} warn={-1} />
            <span className="mono shrink-0 text-[7px] text-mars-200/45">
              {Math.min(current?.progress ?? 0, count)}/{count}
            </span>
          </div>
        )}
      </div>

      <div className="mono mt-2 grid grid-cols-3 gap-1 border-t pt-1.5 text-[8px]" style={{ borderColor: 'rgba(217,145,99,0.16)' }}>
        <span className="text-mars-200/45">
          <span className="text-mars-100/80">{distanceLabel}</span> {distance !== null ? `${Math.round(distance)} m` : '—'}
        </span>
        <span className="text-center text-mars-200/45">
          <span className="text-mars-100/80">WALK</span> {Math.round(mission.distanceWalked)} m
        </span>
        <span className="text-right text-mars-200/45">
          <span className="text-mars-100/80">T+</span> {formatClock(mission.elapsed)}
        </span>
      </div>
    </Panel>
  );
}

/* ------------------------------------------------------------------- alerts */

function AlertStack() {
  const alerts = useGameStore((s) => s.alerts);
  if (alerts.length === 0) return null;
  return (
    <div className="pointer-events-none flex flex-col gap-1.5">
      {alerts.slice(-3).map((alert) => {
        const color = LEVEL_COLOR[alert.level] ?? '#ffcf7a';
        return (
          <div
            key={alert.id}
            className="toast border-l-2 px-2.5 py-1.5"
            style={{
              borderColor: color,
              background: 'linear-gradient(100deg, rgba(22,13,10,0.9), rgba(14,9,7,0.7))',
              boxShadow: `0 6px 22px rgba(0,0,0,0.36), inset 0 0 22px ${color}0a`,
            }}
          >
            <div className="flex items-center gap-1.5">
              {alert.level === 'critical' || alert.level === 'warning' ? (
                <TriangleAlert size={10} style={{ color }} />
              ) : (
                <span className="inline-block h-1.5 w-1.5" style={{ background: color, boxShadow: `0 0 6px ${color}` }} />
              )}
              <span className="mono text-[8px] tracking-[0.16em]" style={{ color }}>
                {alert.title}
              </span>
            </div>
            <div className="mt-0.5 text-[9px] leading-relaxed text-mars-100/65">{alert.message}</div>
          </div>
        );
      })}
    </div>
  );
}

/* -------------------------------------------------------------- environment */

function EnvironmentCard() {
  const environment = useGameStore((s) => s.environment);
  const telemetry = useGameStore((s) => s.telemetry);
  const paused = useGameStore((s) => s.phase === 'paused');
  const pauseGame = useGameStore((s) => s.pauseGame);
  const openPanel = useGameStore((s) => s.openPanel);

  const solHours = environment.timeOfSol * 24;
  const hh = Math.floor(solHours);
  const mm = Math.floor((solHours - hh) * 60);
  const storm = environment.dustStorm;

  return (
    <Panel className="w-full">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Sun size={11} className="text-mars-300/80" />
          <span className="label !text-[8px]">SURFACE CONDITIONS</span>
        </div>
        <span className="mono text-[8px] text-mars-200/45">
          SOL {String(hh).padStart(2, '0')}:{String(mm).padStart(2, '0')}
        </span>
      </div>

      {storm && (
        <div
          className="mt-1.5 flex items-center gap-1.5 border px-1.5 py-1"
          style={{ borderColor: 'rgba(255,179,92,0.45)', background: 'rgba(92,57,19,0.28)' }}
        >
          <TriangleAlert size={10} className="text-warn" />
          <span className="mono text-[8px] tracking-[0.14em] text-warn">
            DUST STORM · {Math.round(environment.stormIntensity * 100)}%
          </span>
        </div>
      )}

      <div className="mono mt-1.5 grid grid-cols-2 gap-x-2 gap-y-1 text-[9px]">
        <div className="flex items-center gap-1 text-mars-200/50">
          <Thermometer size={9} /> <span className="text-mars-100/85">{environment.ambientTempC.toFixed(1)}°C</span>
        </div>
        <div className="flex items-center gap-1 text-mars-200/50">
          <Wind size={9} /> <span className="text-mars-100/85">{environment.windMs.toFixed(1)} m/s</span>
        </div>
        <div className="flex items-center gap-1 text-mars-200/50">
          <Layers size={9} /> <span className="text-mars-100/85">DUST {Math.round(environment.dust * 100)}%</span>
        </div>
        <div className="flex items-center gap-1 text-mars-200/50">
          <Radio size={9} /> <span className="text-mars-100/85">{Math.round(telemetry.commQuality)}% LINK</span>
        </div>
        <div className="flex items-center gap-1 text-mars-200/50">
          <Zap size={9} /> <span className="text-mars-100/85">{environment.radiationUSvH.toFixed(2)} µSv/h</span>
        </div>
        <div className="flex items-center gap-1 text-mars-200/50">
          <GaugeIcon /> <span className="text-mars-100/85">{environment.solarFlux.toFixed(2)} FLUX</span>
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between gap-1 border-t pt-1.5" style={{ borderColor: 'rgba(217,145,99,0.16)' }}>
        <span className="mono text-[7px] tracking-[0.08em] text-mars-200/30">SIMULATED METEOROLOGY</span>
        <div className="flex items-center gap-1">
          <button className="btn btn-ghost !px-1.5 !py-1" onClick={() => openPanel('map')} title="Wrist map (M)">
            <MapIcon size={11} />
          </button>
          <button className="btn btn-ghost !px-1.5 !py-1" onClick={() => openPanel('pp')} title="Planetary protection (P)">
            <Shield size={11} />
          </button>
          <button className="btn btn-ghost !px-1.5 !py-1" onClick={paused ? undefined : pauseGame} title="Pause (Esc)">
            <Pause size={11} />
          </button>
        </div>
      </div>
    </Panel>
  );
}

function GaugeIcon() {
  return <Compass size={9} />;
}

/* --------------------------------------------------------------------- suit */

function SuitRow({ icon, label, value, color }: { icon: ReactNode; label: string; value: number; color: string }) {
  const low = value <= 28;
  return (
    <div className="flex items-center gap-2">
      <span className="shrink-0" style={{ color: value <= 12 ? '#ff6b57' : low ? '#ffb35c' : color, opacity: 0.9 }}>
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-1">
          <span className="mono text-[7.5px] tracking-[0.14em] text-mars-200/48">{label}</span>
          <span className="mono text-[9px]" style={{ color: value <= 12 ? '#ff6b57' : low ? '#ffb35c' : '#f4dfcc' }}>
            {Math.round(value)}
          </span>
        </div>
        <Meter value={value} color={color} height={2.5} warn={28} />
      </div>
    </div>
  );
}

function SuitCard() {
  const resources = useGameStore((s) => s.resources);
  const suit = useGameStore((s) => s.resources.suitIntegrity);
  const inventoryPct = (resources.inventoryUsed / Math.max(1, resources.inventoryCapacity)) * 100;

  return (
    <Panel className="w-full">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <ShieldCheck size={11} className="text-signal/80" />
          <span className="label !text-[8px]">SUIT / LIFE SUPPORT</span>
        </div>
        <span
          className="mono text-[8px]"
          style={{ color: suit < 40 ? '#ffb35c' : '#8ff0d2' }}
        >
          {suit >= 70 ? 'NOMINAL' : suit >= 40 ? 'DEGRADED' : 'CRITICAL'}
        </span>
      </div>

      <div className="mt-1.5 grid gap-1">
        <SuitRow icon={<Droplets size={9} />} label="OXYGEN" value={resources.oxygen} color="#9fd8e8" />
        <SuitRow icon={<BatteryMedium size={9} />} label="BATTERY" value={resources.battery} color="#8ff0d2" />
        <SuitRow icon={<Shield size={9} />} label="SUIT" value={resources.suitIntegrity} color="#ffcf7a" />
        <SuitRow icon={<Thermometer size={9} />} label="THERMAL" value={resources.thermal} color="#d88744" />
        <SuitRow icon={<HeartPulse size={9} />} label="PHYSICAL" value={resources.physical} color="#b9e6c6" />
        <SuitRow icon={<Radio size={9} />} label="COMMS" value={resources.communication} color="#b49bff" />
      </div>

      <div className="mt-2 flex items-center gap-2 border-t pt-1.5" style={{ borderColor: 'rgba(217,145,99,0.16)' }}>
        <Layers size={9} className="text-mars-300/70" />
        <div className="flex flex-1 items-center gap-1.5">
          <div className="flex-1">
            <Meter value={inventoryPct} color="#8ff0d2" height={2.5} warn={85} />
          </div>
          <span className="mono text-[8px] text-mars-200/55">
            BAY {resources.inventoryUsed}/{resources.inventoryCapacity}
          </span>
        </div>
      </div>
    </Panel>
  );
}

/* ------------------------------------------------------------------ minimap */

const POI_FALLBACK = 'rgba(248,221,200,0.42)';

function routeColor(route: RouteOption | null): string {
  if (!route) return '#8ff0d2';
  return route.id === 'safest' ? '#8ff0d2' : route.id === 'balanced' ? '#ffcf7a' : '#9fd8e8';
}

function Minimap() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const telemetry = useGameStore((s) => s.telemetry);
  const scanned = useGameStore((s) => s.scanned);
  const analyzed = useGameStore((s) => s.analyzed);
  const reached = useGameStore((s) => s.reached);
  const navigation = useGameStore((s) => s.navigation);
  const openPanel = useGameStore((s) => s.openPanel);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = 166;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    if (canvas.width !== Math.round(size * dpr)) {
      canvas.width = Math.round(size * dpr);
      canvas.height = Math.round(size * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size, size);

    const cx = size / 2;
    const cy = size / 2;
    const radius = size / 2 - 8;
    const range = 150;
    const scale = (radius - 4) / range;
    const px = telemetry.position.x;
    const pz = telemetry.position.z;
    const toX = (x: number) => cx + (x - px) * scale;
    const toY = (z: number) => cy + (z - pz) * scale;

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.clip();

    const bg = ctx.createRadialGradient(cx, cy, 5, cx, cy, radius);
    bg.addColorStop(0, 'rgba(30,20,15,0.95)');
    bg.addColorStop(1, 'rgba(12,8,6,0.96)');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, size, size);

    // Range rings.
    ctx.strokeStyle = 'rgba(217,145,99,0.16)';
    ctx.lineWidth = 0.8;
    for (const meters of [50, 100, 150]) {
      ctx.beginPath();
      ctx.arc(cx, cy, meters * scale, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(cx - radius, cy);
    ctx.lineTo(cx + radius, cy);
    ctx.moveTo(cx, cy - radius);
    ctx.lineTo(cx, cy + radius);
    ctx.strokeStyle = 'rgba(217,145,99,0.1)';
    ctx.stroke();

    // Precaution zones.
    for (const zone of ZONES) {
      const zx = toX(zone.center.x);
      const zy = toY(zone.center.z);
      const zr = zone.radius * scale;
      const color = LEVEL_COLOR[zone.level] ?? '#d99163';
      if (Math.hypot(zx - cx, zy - cy) - zr > radius) continue;
      ctx.beginPath();
      ctx.arc(zx, zy, zr, 0, Math.PI * 2);
      ctx.fillStyle = `${color}0f`;
      ctx.fill();
      ctx.strokeStyle = `${color}55`;
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Selected route.
    const route = navigation.selectedRoute;
    if (route && route.points.length > 1) {
      ctx.beginPath();
      route.points.forEach((p, i) => {
        const x = toX(p.x);
        const y = toY(p.z);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.strokeStyle = routeColor(route);
      ctx.lineWidth = 1.8;
      ctx.stroke();
    }

    // Points of interest.
    for (const poi of POIS) {
      const x = toX(poi.x);
      const y = toY(poi.z);
      if (Math.hypot(x - cx, y - cy) > radius) continue;
      const known = analyzed[poi.id] !== undefined;
      const seen = scanned[poi.id] !== undefined;
      const visited = reached[poi.id] !== undefined;
      const color = known ? '#ffcf7a' : seen ? '#8ff0d2' : POI_FALLBACK;
      ctx.beginPath();
      ctx.arc(x, y, known ? 2.6 : seen ? 2.2 : 1.6, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      if (visited) {
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.strokeStyle = `${color}70`;
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }
      if (navigation.destinationPoiId === poi.id) {
        ctx.beginPath();
        ctx.arc(x, y, 6.5, 0, Math.PI * 2);
        ctx.strokeStyle = '#ffcf7a';
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }
    }

    // Camp node.
    const campX = toX(WORLD.camp.x);
    const campY = toY(WORLD.camp.z);
    if (Math.hypot(campX - cx, campY - cy) < radius) {
      ctx.beginPath();
      ctx.arc(campX, campY, 4.2, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(143,240,210,0.12)';
      ctx.fill();
      ctx.strokeStyle = '#8ff0d2';
      ctx.lineWidth = 1.3;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(campX, campY, 1.4, 0, Math.PI * 2);
      ctx.fillStyle = '#8ff0d2';
      ctx.fill();
    }

    // Destination bearing, clamped to the rim when out of range.
    const destination = navigation.destination;
    if (destination) {
      let dx = toX(destination.x) - cx;
      let dy = toY(destination.z) - cy;
      const len = Math.hypot(dx, dy);
      if (len > radius - 9) {
        dx = (dx / len) * (radius - 9);
        dy = (dy / len) * (radius - 9);
      }
      const dxp = cx + dx;
      const dyp = cy + dy;
      ctx.beginPath();
      ctx.arc(dxp, dyp, 3.2, 0, Math.PI * 2);
      ctx.fillStyle = '#ffcf7a';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(dxp, dyp, 6, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255,207,122,0.5)';
      ctx.lineWidth = 0.9;
      ctx.stroke();
    }

    ctx.restore();

    // Frame.
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(217,145,99,0.42)';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, radius - 3.5, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(143,240,210,0.1)';
    ctx.lineWidth = 0.6;
    ctx.stroke();

    // Player arrow.
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((telemetry.heading * Math.PI) / 180);
    ctx.beginPath();
    ctx.moveTo(0, -6.5);
    ctx.lineTo(4.2, 5);
    ctx.lineTo(0, 2.8);
    ctx.lineTo(-4.2, 5);
    ctx.closePath();
    ctx.fillStyle = '#f8ddc8';
    ctx.fill();
    ctx.strokeStyle = 'rgba(20,12,8,0.8)';
    ctx.lineWidth = 0.8;
    ctx.stroke();
    ctx.restore();

    // North marker.
    ctx.fillStyle = 'rgba(248,221,200,0.7)';
    ctx.font = 'bold 8px Consolas, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('N', cx, 11);
    ctx.fillStyle = 'rgba(248,221,200,0.35)';
    ctx.font = '7px Consolas, monospace';
    ctx.fillText('150 m', cx, size - 4);
    ctx.textAlign = 'left';
  }, [telemetry, scanned, analyzed, reached, navigation.selectedRoute, navigation.destination, navigation.destinationPoiId]);

  return (
    <button
      className="relative block cursor-pointer"
      onClick={() => openPanel('map')}
      title="Open wrist map (M)"
      style={{ width: 166, height: 166, background: 'transparent' }}
    >
      <canvas ref={canvasRef} style={{ width: 166, height: 166, display: 'block' }} />
      <span className="mono absolute left-1/2 top-1/2 hidden -translate-x-1/2 translate-y-8 text-[7px] tracking-[0.16em] text-mars-200/35">
        MAP
      </span>
    </button>
  );
}

function ToolBelt() {
  const tool = useGameStore((s) => s.tool);
  const setTool = useGameStore((s) => s.setTool);
  const cameraMode = useGameStore((s) => s.cameraMode);
  const toggleCameraMode = useGameStore((s) => s.toggleCameraMode);

  return (
    <div className="mt-1.5 w-full">
      <div className="grid grid-cols-3 gap-1">
        {TOOL_META.map((meta) => {
          const active = tool === meta.id;
          const Icon = meta.icon;
          return (
            <button
              key={meta.id}
              onClick={() => setTool(meta.id)}
              className="flex flex-col items-center gap-0.5 border px-1 py-1.5 transition-colors"
              style={{
                borderColor: active ? `${meta.color}88` : 'rgba(217,145,99,0.2)',
                background: active ? `${meta.color}14` : 'rgba(15,9,8,0.55)',
              }}
              title={`Select ${meta.label.toLowerCase()} (${meta.key})`}
            >
              <Icon size={13} style={{ color: active ? meta.color : 'rgba(226,178,141,0.55)' }} />
              <span className="mono text-[6.5px] tracking-[0.08em]" style={{ color: active ? meta.color : 'rgba(226,178,141,0.45)' }}>
                {meta.label}
              </span>
            </button>
          );
        })}
      </div>
      <button className="btn btn-ghost mt-1 w-full !justify-between !px-2 !py-1" onClick={toggleCameraMode}>
        <span className="mono text-[7.5px] tracking-[0.1em]">VIEW · {cameraMode === 'third' ? 'THIRD PERSON' : 'HELMET'}</span>
        <span className="mono text-[7px] text-mars-200/35">C</span>
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ compass */

function CompassStrip() {
  const heading = useGameStore((s) => s.telemetry.heading);
  const bearing = ((heading % 360) + 360) % 360;
  const base = Math.round(bearing / 15) * 15;
  const marks = Array.from({ length: 9 }, (_, i) => base + (i - 4) * 15);
  const cardinals: Record<number, string> = { 0: 'N', 90: 'E', 180: 'S', 270: 'W' };

  return (
    <div
      className="relative h-9 w-[300px] overflow-hidden border-x border-b"
      style={{
        borderColor: 'rgba(217,145,99,0.22)',
        background: 'linear-gradient(180deg, rgba(14,8,6,0.62), rgba(14,8,6,0.12))',
        maskImage: 'linear-gradient(90deg, transparent, #000 16%, #000 84%, transparent)',
        WebkitMaskImage: 'linear-gradient(90deg, transparent, #000 16%, #000 84%, transparent)',
      }}
    >
      {marks.map((deg) => {
        const normalized = ((deg % 360) + 360) % 360;
        const delta = deg - bearing;
        const left = 50 + (delta / 60) * 50;
        if (left < 2 || left > 98) return null;
        const cardinal = cardinals[normalized];
        const major = normalized % 45 === 0;
        return (
          <div key={deg} className="absolute bottom-0 -translate-x-1/2" style={{ left: `${left}%` }}>
            <div style={{ width: 1, height: major ? 8 : 4, background: cardinal ? 'rgba(143,240,210,0.8)' : 'rgba(248,221,200,0.32)' }} />
            {major && (
              <span
                className="mono absolute -top-3 left-1/2 -translate-x-1/2 text-[7px]"
                style={{ color: cardinal ? '#8ff0d2' : 'rgba(248,221,200,0.42)' }}
              >
                {cardinal ?? String(normalized).padStart(3, '0')}
              </span>
            )}
          </div>
        );
      })}
      <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2" style={{ background: 'rgba(255,207,122,0.55)' }} />
      <div className="mono absolute bottom-0.5 left-1/2 -translate-x-1/2 text-[8px]" style={{ color: '#ffcf7a' }}>
        {String(Math.round(bearing)).padStart(3, '0')}°
      </div>
    </div>
  );
}

/* ------------------------------------------------------------- interactions */

function InteractionPrompt() {
  const interaction = useGameStore((s) => s.interaction);
  const tool = useGameStore((s) => s.tool);
  const activePanel = useGameStore((s) => s.activePanel);
  const analysisPoiId = useGameStore((s) => s.analysisPoiId);
  const locked = usePointerLocked();
  const cameraMode = useGameStore((s) => s.cameraMode);

  if (activePanel || analysisPoiId) return null;

  const hint = !locked
    ? 'CLICK THE WORLD TO CAPTURE THE MOUSE · ESC PAUSES'
    : cameraMode === 'first'
      ? 'HELMET VIEW · C TO RETURN TO THIRD PERSON'
      : null;

  return (
    <div className="flex w-full flex-col items-center gap-1.5">
      {hint && (
        <div className="mono border px-2 py-1 text-[7.5px] tracking-[0.14em] text-mars-200/45" style={{ borderColor: 'rgba(217,145,99,0.2)', background: 'rgba(11,7,6,0.55)' }}>
          {hint}
        </div>
      )}
      {interaction ? (
        <div
          className="flex items-center gap-2.5 border px-3 py-1.5"
          style={{
            borderColor: 'rgba(255,207,122,0.55)',
            background: 'linear-gradient(100deg, rgba(30,19,13,0.94), rgba(16,10,8,0.82))',
            boxShadow: '0 8px 26px rgba(0,0,0,0.4)',
          }}
        >
          <span className="kbd !px-2 !py-0.5 !text-[10px]">E</span>
          <div className="min-w-0">
            <div className="label !text-[7px]">FIELD ACTION</div>
            <div className="max-w-[46vw] truncate text-[10px] text-mars-100 md:max-w-[360px]">{interaction.prompt}</div>
          </div>
          <span className="chip chip-warn shrink-0 !py-0 !text-[7px]">{interaction.action}</span>
          <span className="mono hidden shrink-0 text-[8px] text-mars-200/45 sm:block">{Math.round(interaction.distance)} m</span>
        </div>
      ) : (
        <div className="mono flex items-center gap-1.5 text-[7.5px] tracking-[0.12em] text-mars-200/30">
          <Crosshair size={9} /> APPROACH A MARKED TARGET TO INTERACT
          {tool === 'camera' && <span className="text-ice/60">· E CAPTURES THE FRAME</span>}
        </div>
      )}
    </div>
  );
}

function HintLine() {
  const hint = useGameStore((s) => s.hint);
  if (!hint) return null;
  return (
    <div
      className="max-w-[min(560px,82vw)] border-l-2 px-2.5 py-1"
      style={{ borderColor: '#ffb35c', background: 'linear-gradient(90deg, rgba(30,19,13,0.82), transparent)' }}
    >
      <div className="text-[9px] leading-relaxed text-mars-100/75">{hint.text}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ scanner */

function ScanPanel() {
  const scan = useGameStore((s) => s.scan);
  if (!scan.active || scan.results.length === 0) return null;
  return (
    <Panel className="w-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <ScanLine size={10} style={{ color: '#8ff0d2' }} />
          <span className="mono text-[8px] tracking-[0.16em]" style={{ color: '#8ff0d2' }}>
            SWEEP · {scan.results.length} CONTACTS
          </span>
        </div>
        <span className="mono text-[7px] text-mars-200/35">&lt;85 m</span>
      </div>
      <div className="mt-1 space-y-0.5">
        {scan.results.slice(0, 5).map((result) => (
          <div key={result.poiId} className="flex items-center justify-between gap-2 text-[8px]">
            <span className="min-w-0 flex-1 truncate text-mars-100/70">{result.signature}</span>
            <span className="mono shrink-0 text-mars-200/45">{result.distance} m</span>
            <div className="h-1 w-10 shrink-0 bg-mars-100/10">
              <div style={{ width: `${result.strength}%`, height: '100%', background: '#8ff0d2' }} />
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

/* ------------------------------------------------------------------- flashes */

function ScanFlash() {
  const scanFlash = useGameStore((s) => s.scanFlash);
  const [pulse, setPulse] = useState(0);
  const prev = useRef(0);
  useEffect(() => {
    if (scanFlash > prev.current) setPulse((p) => p + 1);
    prev.current = scanFlash;
  }, [scanFlash]);
  if (pulse === 0) return null;
  return (
    <div key={pulse} className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden>
      <div
        className="rounded-full border"
        style={{
          width: '58vmax',
          height: '58vmax',
          borderColor: 'rgba(143,240,210,0.5)',
          background: 'radial-gradient(circle, rgba(143,240,210,0.08), transparent 62%)',
          animation: 'scanPulse 950ms ease-out forwards',
        }}
      />
    </div>
  );
}

function PhotoFlash() {
  const photoFlash = useGameStore((s) => s.photoFlash);
  const [pulse, setPulse] = useState(0);
  const prev = useRef(0);
  useEffect(() => {
    if (photoFlash > prev.current) setPulse((p) => p + 1);
    prev.current = photoFlash;
  }, [photoFlash]);
  if (pulse === 0) return null;
  return <div key={pulse} className="flash-white" aria-hidden />;
}

/* ---------------------------------------------------------------------- HUD */

export function HUD() {
  const phase = useGameStore((s) => s.phase);
  const settings = useGameStore((s) => s.settings);
  const environment = useGameStore((s) => s.environment);
  const scan = useGameStore((s) => s.scan);
  const analysisPoiId = useGameStore((s) => s.analysisPoiId);
  const resources = useGameStore((s) => s.resources);
  const mission = useGameStore((s) => s.mission);
  const telemetry = useGameStore((s) => s.telemetry);

  if (phase !== 'playing' && phase !== 'paused') return null;

  const zoomStyle = { zoom: settings.hudScale } as CSSProperties;

  return (
    <div className="hud-layer" style={zoomStyle}>
      {/* Dust storm tint */}
      {environment.dustStorm && (
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            boxShadow: `inset 0 0 ${120 + environment.stormIntensity * 180}px rgba(142,96,72,${0.18 + environment.stormIntensity * 0.16})`,
            background: `radial-gradient(ellipse at center, transparent 40%, rgba(120,78,58,${environment.stormIntensity * 0.12}) 100%)`,
          }}
        />
      )}

      {/* Reticle */}
      {phase === 'playing' && !analysisPoiId && (
        <div className={`reticle ${scan.active ? 'opacity-100' : ''}`} style={{ opacity: scan.active ? 1 : 0.72 }}>
          <div className="reticle-dot" />
        </div>
      )}

      {/* Compass ribbon */}
      <div className="pointer-events-none absolute left-1/2 top-2 hidden -translate-x-1/2 md:block">
        <CompassStrip />
      </div>

      {/* Alerts */}
      <div className="pointer-events-none absolute left-1/2 top-[52px] z-20 w-[min(380px,86vw)] -translate-x-1/2">
        <AlertStack />
      </div>

      {/* Mission + scanner stack */}
      <div className="absolute left-3 top-3 flex w-[300px] max-w-[80vw] flex-col gap-1.5">
        <MissionCard />
        <ScanPanel />
      </div>

      {/* Environment + quick access */}
      <div className="absolute right-3 top-3 hidden w-[244px] flex-col gap-1.5 sm:flex">
        <EnvironmentCard />
      </div>

      {/* Suit */}
      <div className="absolute bottom-3 left-3 hidden w-[252px] flex-col gap-1.5 md:flex">
        <SuitCard />
        <div className="mono flex items-center justify-between px-0.5 text-[7px] tracking-[0.08em] text-mars-200/28">
          <span className="flex items-center gap-1"><Footprints size={8} /> {Math.round(mission?.distanceWalked ?? 0)} m</span>
          <span className="flex items-center gap-1"><Timer size={8} /> {formatDuration(mission?.elapsed ?? 0)}</span>
          <span className="flex items-center gap-1"><Crosshair size={8} /> {Math.round(telemetry.slope)}°</span>
        </div>
      </div>

      {/* Minimap + tools */}
      <div className="absolute bottom-3 right-3 hidden w-[184px] flex-col items-center md:flex">
        <div
          className="border p-1.5"
          style={{
            borderColor: 'rgba(217,145,99,0.28)',
            background: 'linear-gradient(160deg, rgba(24,14,11,0.78), rgba(11,7,6,0.62))',
            backdropFilter: 'blur(9px)',
          }}
        >
          <div className="flex items-center justify-between px-0.5 pb-1">
            <span className="label !text-[7.5px]">WRIST MAP</span>
            <span className="mono text-[7px] text-mars-200/35">M</span>
          </div>
          <Minimap />
        </div>
        <ToolBelt />
      </div>

      {/* Center bottom guidance */}
      <div className="pointer-events-none absolute bottom-4 left-1/2 flex w-[min(680px,92vw)] -translate-x-1/2 flex-col items-center gap-1.5 px-2 md:bottom-3">
        <HintLine />
        <div className="pointer-events-auto w-full">
          <InteractionPrompt />
        </div>
      </div>

      {/* Bottom-left compact resource strip on small screens */}
      <div className="absolute bottom-3 left-3 right-3 md:hidden">
        <div
          className="flex items-center gap-2 border px-2.5 py-1.5"
          style={{ borderColor: 'rgba(217,145,99,0.25)', background: 'rgba(13,8,6,0.7)', backdropFilter: 'blur(8px)' }}
        >
          <MobileMeter icon={<Droplets size={9} />} value={resources.oxygen} label="O2" color="#9fd8e8" />
          <MobileMeter icon={<BatteryMedium size={9} />} value={resources.battery} label="PWR" color="#8ff0d2" />
          <MobileMeter icon={<Shield size={9} />} value={resources.suitIntegrity} label="SUIT" color="#ffcf7a" />
          <MobileMeter icon={<Thermometer size={9} />} value={resources.thermal} label="THM" color="#d88744" />
          <div className="mono ml-auto shrink-0 text-right text-[7px] leading-tight text-mars-200/40">
            <div>{Math.round(telemetry.campDistance)} m CAMP</div>
            <div className="text-signal/70">{Math.round(telemetry.commQuality)}% LINK</div>
          </div>
        </div>
      </div>

      <ScanFlash />
      <PhotoFlash />
    </div>
  );
}

function MobileMeter({ icon, value, label, color }: { icon: ReactNode; value: number; label: string; color: string }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
      <div className="flex items-center gap-1">
        <span style={{ color: value <= 28 ? '#ffb35c' : color }}>{icon}</span>
        <span className="mono text-[6.5px] text-mars-200/45">{label}</span>
        <span className="mono ml-auto text-[7.5px] text-mars-100/75">{Math.round(value)}</span>
      </div>
      <Meter value={value} color={color} height={2} warn={28} />
    </div>
  );
}
