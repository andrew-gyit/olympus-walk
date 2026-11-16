import { useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';
import { Camera, Crosshair, Footprints, Map as MapIcon, Pause, ScanLine, Sparkles, MoveUp } from 'lucide-react';
import { gameSimulation } from '../../game/core/GameSimulation';
import { inputManager } from '../../game/player/InputManager';
import { useGameStore } from '../../stores/gameStore';

const STICK_RADIUS = 42;

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
  const stickRef = useRef<HTMLDivElement | null>(null);
  const stickPointer = useRef<number | null>(null);
  const lookPointer = useRef<number | null>(null);
  const lastLook = useRef({ x: 0, y: 0 });

  if (!touchMode || phase !== 'playing' || activePanel || analysisPoiId) return null;

  function updateStick(e: ReactPointerEvent<HTMLDivElement>) {
    const el = stickRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    let dx = e.clientX - cx;
    let dy = e.clientY - cy;
    const len = Math.hypot(dx, dy);
    if (len > STICK_RADIUS) {
      dx = (dx / len) * STICK_RADIUS;
      dy = (dy / len) * STICK_RADIUS;
    }
    setKnob({ x: dx, y: dy });
    inputManager.setTouchMove(dx / STICK_RADIUS, dy / STICK_RADIUS);
  }

  function releaseStick() {
    stickPointer.current = null;
    setKnob({ x: 0, y: 0 });
    inputManager.clearTouch();
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
          lookPointer.current = e.pointerId;
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
          if (lookPointer.current === e.pointerId) lookPointer.current = null;
        }}
        onPointerCancel={(e) => {
          if (lookPointer.current === e.pointerId) lookPointer.current = null;
        }}
      >
        <div className="mono absolute right-4 top-4 text-ui-2xs tracking-[0.16em] text-mars-100/65">DRAG TO LOOK</div>
      </div>

      {/* Thumbstick */}
      <div
        ref={stickRef}
        className="pointer-events-auto absolute bottom-[88px] left-5 h-[116px] w-[116px] rounded-full border"
        style={{
          borderColor: 'rgba(217,145,99,0.32)',
          background: 'radial-gradient(circle, rgba(22,13,10,0.62), rgba(12,8,6,0.38))',
          backdropFilter: 'blur(6px)',
          touchAction: 'none',
        }}
        onPointerDown={(e) => {
          if (e.pointerType === 'mouse') return;
          stickPointer.current = e.pointerId;
          e.currentTarget.setPointerCapture(e.pointerId);
          updateStick(e);
        }}
        onPointerMove={(e) => {
          if (stickPointer.current !== e.pointerId) return;
          updateStick(e);
        }}
        onPointerUp={releaseStick}
        onPointerCancel={releaseStick}
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
        <div className="mono pointer-events-none absolute -bottom-4 left-1/2 -translate-x-1/2 text-ui-2xs tracking-[0.14em] text-mars-200/65">
          MOVE
        </div>
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
    </div>
  );
}
