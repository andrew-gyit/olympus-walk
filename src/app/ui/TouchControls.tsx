import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';
import { Camera, Crosshair, Footprints, Map as MapIcon, Pause, ScanLine, Sparkles, MoveUp } from 'lucide-react';
import { gameSimulation } from '../../game/core/GameSimulation';
import { inputManager } from '../../game/player/InputManager';
import { useGameStore } from '../../stores/gameStore';

const STICK_RADIUS = 42;
// Thumb travel (px) ignored around the touch point, so a resting thumb never walks the astronaut.
const STICK_DEADZONE = 8;
const PAD_SIZE = 116;

// Temporary on-device diagnostics: only active with ?touchDebug=1 in the URL.
const TOUCH_DEBUG = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('touchDebug') === '1';
const dbg = {
  state: 'idle',
  pointerId: null as number | null,
  pointerType: '-',
  dx: 0,
  dy: 0,
  last: '-',
  down: 0,
  move: 0,
  up: 0,
  cancel: 0,
  lost: 0,
  ignored: 0,
  look: 'idle',
  touches: 0,
};
if (TOUCH_DEBUG) (window as unknown as Record<string, unknown>).__OW_TOUCH_DEBUG__ = dbg;

function TouchDebug() {
  const [, tick] = useState(0);
  const prev = useRef({ x: 0, z: 0, t: performance.now() });
  const eff = useRef(0);
  useEffect(() => {
    const count = (e: TouchEvent) => {
      dbg.touches = e.touches.length;
    };
    window.addEventListener('touchstart', count, { passive: true });
    window.addEventListener('touchend', count, { passive: true });
    window.addEventListener('touchcancel', count, { passive: true });
    const id = window.setInterval(() => {
      const p = useGameStore.getState().telemetry.position;
      const now = performance.now();
      eff.current = Math.hypot(p.x - prev.current.x, p.z - prev.current.z) / Math.max(0.001, (now - prev.current.t) / 1000);
      prev.current = { x: p.x, z: p.z, t: now };
      tick((n) => n + 1);
    }, 150);
    return () => {
      window.clearInterval(id);
      window.removeEventListener('touchstart', count);
      window.removeEventListener('touchend', count);
      window.removeEventListener('touchcancel', count);
    };
  }, []);
  const st = useGameStore.getState();
  const mv = inputManager.movementVector();
  const f = (n: number) => (n >= 0 ? '+' : '') + n.toFixed(2);
  return (
    <pre
      className="pointer-events-none absolute left-1 top-1 z-50 m-0 max-w-[96vw] whitespace-pre-wrap rounded bg-black/75 p-1.5 font-mono leading-tight text-[#8ff0d2]"
      style={{ fontSize: 10 }}
    >
      {[
        `JOYSTICK  ${dbg.state}  id=${dbg.pointerId ?? '-'} ${dbg.pointerType}`,
        `raw px    dx=${dbg.dx.toFixed(0)} dy=${dbg.dy.toFixed(0)}`,
        `stick     x=${f(inputManager.touchMove.x)} y=${f(inputManager.touchMove.y)}`,
        `-> player x=${f(mv.x)} y=${f(mv.y)}  blocked=${!!(st.activePanel || st.analysisPoiId)}`,
        `moved     ${eff.current.toFixed(2)} m/s  speed=${st.telemetry.speed.toFixed(2)}  fps=${Math.round(st.telemetry.fps)}`,
        `events    d${dbg.down} m${dbg.move} u${dbg.up} c${dbg.cancel} lost${dbg.lost} ign${dbg.ignored} last=${dbg.last}`,
        `look ${dbg.look}  touches=${dbg.touches}`,
        `view ${window.innerWidth}x${window.innerHeight} dpr=${window.devicePixelRatio} ${window.innerWidth > window.innerHeight ? 'landscape' : 'portrait'}`,
      ].join('\n')}
    </pre>
  );
}

function ActionButton({
  icon,
  label,
  active = false,
  color = '#f8ddc8',
  onPress,
}: {
  icon: ReactNode;
  label: string;
  active?: boolean;
  color?: string;
  onPress: () => void;
}) {
  return (
    <button
      className="flex h-[50px] w-[50px] flex-col items-center justify-center gap-0.5 rounded-full border"
      style={{
        borderColor: active ? `${color}aa` : 'rgba(217,145,99,0.42)',
        background: active ? `${color}22` : 'rgba(15,9,7,0.55)',
        color: active ? color : 'rgba(248,221,200,0.72)',
        backdropFilter: 'blur(7px)',
        boxShadow: active ? `0 0 16px ${color}33` : '0 4px 14px rgba(0,0,0,0.28)',
        touchAction: 'none',
      }}
      onPointerDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onPress();
      }}
    >
      {icon}
      <span className="mono text-ui-2xs tracking-[0.08em]">{label}</span>
    </button>
  );
}

export function TouchControls() {
  const phase = useGameStore((s) => s.phase);
  const touchMode = useGameStore((s) => s.touchMode);
  const activePanel = useGameStore((s) => s.activePanel);
  const analysisPoiId = useGameStore((s) => s.analysisPoiId);
  const tool = useGameStore((s) => s.tool);
  const triggerScan = useGameStore((s) => s.triggerScan);
  const cycleTool = useGameStore((s) => s.cycleTool);
  const openPanel = useGameStore((s) => s.openPanel);
  const pauseGame = useGameStore((s) => s.pauseGame);
  const setHint = useGameStore((s) => s.setHint);

  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const [sprinting, setSprinting] = useState(false);
  // Floating stick: the centre is wherever the thumb lands, so left/right/up/down are all equally reachable.
  const [origin, setOrigin] = useState<{ x: number; y: number } | null>(null);
  const originRef = useRef<{ x: number; y: number } | null>(null);
  const stickPointer = useRef<number | null>(null);
  const lookPointer = useRef<number | null>(null);
  const lastLook = useRef({ x: 0, y: 0 });

  const hidden = !touchMode || phase !== 'playing' || !!activePanel || !!analysisPoiId;

  // The pad unmounts while a panel or the pause screen is open, so its pointerup never arrives.
  // Drop any held touch input then; otherwise the last stick vector stays in InputManager and the
  // astronaut keeps walking on its own after the panel closes (and it overrides WASD).
  useEffect(() => {
    if (!hidden) return;
    stickPointer.current = null;
    lookPointer.current = null;
    originRef.current = null;
    setOrigin(null);
    setKnob({ x: 0, y: 0 });
    inputManager.clearTouch();
    dbg.state = 'idle';
    dbg.pointerId = null;
  }, [hidden]);
  useEffect(() => () => inputManager.clearTouch(), []);

  if (hidden) return null;

  function updateStick(e: ReactPointerEvent<HTMLDivElement>) {
    const o = originRef.current;
    if (!o) return;
    let dx = e.clientX - o.x;
    let dy = e.clientY - o.y;
    dbg.dx = dx;
    dbg.dy = dy;
    const len = Math.hypot(dx, dy);
    if (len > STICK_RADIUS) {
      dx = (dx / len) * STICK_RADIUS;
      dy = (dy / len) * STICK_RADIUS;
    }
    setKnob({ x: dx, y: dy });
    const reach = Math.min(len, STICK_RADIUS);
    if (reach < STICK_DEADZONE) {
      inputManager.setTouchMove(0, 0);
      return;
    }
    // Rescale so the vector grows smoothly from 0 at the deadzone edge to 1 at full travel.
    const k = (reach - STICK_DEADZONE) / (STICK_RADIUS - STICK_DEADZONE) / reach;
    inputManager.setTouchMove(dx * k, dy * k);
  }

  function releaseStick() {
    stickPointer.current = null;
    originRef.current = null;
    setOrigin(null);
    setKnob({ x: 0, y: 0 });
    inputManager.clearTouch();
    dbg.state = 'idle';
    dbg.pointerId = null;
    dbg.dx = 0;
    dbg.dy = 0;
  }

  function doInteract() {
    const state = useGameStore.getState();
    if (state.phase !== 'playing') return;
    if (!state.interaction) {
      setHint('Move close to a marked field target, then press USE.', 3200);
      return;
    }
    gameSimulation.interact();
  }

  function doJump() {
    inputManager.jumpQueued = true;
  }

  return (
    <div className="pointer-events-none fixed inset-0 z-20 select-none">
      {/* Look area: drag on the right side of the screen. */}
      <div
        className="pointer-events-auto absolute bottom-[86px] right-0 top-[72px] w-[52%]"
        style={{ touchAction: 'none' }}
        onPointerDown={(e) => {
          if (e.pointerType === 'mouse') return;
          // A second finger must not take over a drag that is still in progress.
          if (lookPointer.current !== null && e.currentTarget.hasPointerCapture(lookPointer.current)) return;
          lookPointer.current = e.pointerId;
          dbg.look = 'drag';
          lastLook.current = { x: e.clientX, y: e.clientY };
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (lookPointer.current !== e.pointerId) return;
          const dx = e.clientX - lastLook.current.x;
          const dy = e.clientY - lastLook.current.y;
          lastLook.current = { x: e.clientX, y: e.clientY };
          inputManager.mouseDX += dx * 1.25;
          inputManager.mouseDY += dy * 1.25;
        }}
        onPointerUp={(e) => {
          if (lookPointer.current === e.pointerId) {
            lookPointer.current = null;
            dbg.look = 'idle';
          }
        }}
        onPointerCancel={(e) => {
          if (lookPointer.current === e.pointerId) {
            lookPointer.current = null;
            dbg.look = 'idle';
          }
        }}
        onLostPointerCapture={(e) => {
          if (lookPointer.current === e.pointerId) {
            lookPointer.current = null;
            dbg.look = 'idle';
          }
        }}
      >
        <div className="mono absolute right-4 top-4 text-ui-2xs tracking-[0.16em] text-mars-100/65">DRAG TO LOOK</div>
      </div>

      {/* Thumbstick: touch zone on the left; the ring is drawn where the thumb lands. */}
      <div
        className="pointer-events-auto absolute bottom-[60px] left-0 top-[35%] w-[48%]"
        style={{ touchAction: 'none' }}
        onPointerDown={(e) => {
          if (e.pointerType === 'mouse') return;
          // A second finger (or a palm) must not hijack the stick: it would overwrite the tracked
          // pointer and, on release, stop the movement while the first finger is still down.
          if (stickPointer.current !== null && e.currentTarget.hasPointerCapture(stickPointer.current)) {
            dbg.ignored++;
            return;
          }
          stickPointer.current = e.pointerId;
          originRef.current = { x: e.clientX, y: e.clientY };
          setOrigin(originRef.current);
          e.currentTarget.setPointerCapture(e.pointerId);
          dbg.state = 'active';
          dbg.pointerId = e.pointerId;
          dbg.pointerType = e.pointerType;
          dbg.down++;
          dbg.last = 'down';
          updateStick(e);
        }}
        onPointerMove={(e) => {
          if (stickPointer.current !== e.pointerId) return;
          dbg.move++;
          dbg.last = 'move';
          updateStick(e);
        }}
        onPointerUp={(e) => {
          if (stickPointer.current !== e.pointerId) return;
          dbg.up++;
          dbg.last = 'up';
          releaseStick();
        }}
        onPointerCancel={(e) => {
          if (stickPointer.current !== e.pointerId) return;
          dbg.cancel++;
          dbg.last = 'cancel';
          releaseStick();
          dbg.state = 'cancelled';
        }}
        onLostPointerCapture={(e) => {
          if (stickPointer.current !== e.pointerId) return;
          dbg.lost++;
          dbg.last = 'lostcapture';
          releaseStick();
        }}
      />
      <div
        className={`pointer-events-none absolute rounded-full border ${origin ? '' : 'bottom-[88px] left-5'}`}
        style={{
          width: PAD_SIZE,
          height: PAD_SIZE,
          ...(origin ? { left: origin.x - PAD_SIZE / 2, top: origin.y - PAD_SIZE / 2 } : {}),
          borderColor: 'rgba(217,145,99,0.32)',
          background: 'radial-gradient(circle, rgba(22,13,10,0.62), rgba(12,8,6,0.38))',
          backdropFilter: 'blur(6px)',
        }}
      >
        <div className="pointer-events-none absolute inset-0 rounded-full border" style={{ borderColor: 'rgba(217,145,99,0.1)' }} />
        <div className="pointer-events-none absolute inset-[34%] rounded-full border" style={{ borderColor: 'rgba(217,145,99,0.16)' }} />
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 h-11 w-11 rounded-full border"
          style={{
            transform: `translate(calc(-50% + ${knob.x}px), calc(-50% + ${knob.y}px))`,
            borderColor: 'rgba(143,240,210,0.55)',
            background: 'radial-gradient(circle, rgba(143,240,210,0.2), rgba(22,13,10,0.7))',
            boxShadow: '0 0 16px rgba(143,240,210,0.16)',
          }}
        />
        {!origin && (
          <div className="mono pointer-events-none absolute -bottom-4 left-1/2 -translate-x-1/2 text-ui-2xs tracking-[0.14em] text-mars-200/65">
            MOVE
          </div>
        )}
      </div>

      {/* Sprint toggle */}
      <div className="pointer-events-auto absolute bottom-[104px] left-[148px]">
        <ActionButton
          icon={<Footprints size={15} />}
          label="SPRINT"
          active={sprinting}
          color="#ffcf7a"
          onPress={() => {
            const next = !sprinting;
            setSprinting(next);
            inputManager.setTouchSprint(next);
          }}
        />
      </div>

      {/* Action cluster */}
      <div className="pointer-events-auto absolute bottom-[92px] right-3 grid grid-cols-2 gap-2">
        <ActionButton icon={<ScanLine size={16} />} label="SCAN" color="#8ff0d2" onPress={() => triggerScan()} />
        <ActionButton
          icon={tool === 'camera' ? <Camera size={16} /> : <Crosshair size={16} />}
          label={tool === 'camera' ? 'FRAME' : 'USE'}
          color="#ffcf7a"
          onPress={doInteract}
        />
        <ActionButton icon={<MoveUp size={16} />} label="HOP" onPress={doJump} />
        <ActionButton icon={<MapIcon size={16} />} label="MAP" color="#9fd8e8" onPress={() => openPanel('map')} />
        <ActionButton icon={<Sparkles size={16} />} label="TOOL" onPress={cycleTool} />
        <ActionButton icon={<Pause size={15} />} label="PAUSE" color="#ffb35c" onPress={pauseGame} />
      </div>
      {TOUCH_DEBUG && <TouchDebug />}
    </div>
  );
}
