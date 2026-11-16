import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ArrowDown, ArrowDownLeft, ArrowDownRight, ArrowLeft, ArrowRight, ArrowUp, ArrowUpLeft, ArrowUpRight } from 'lucide-react';
import { inputManager } from '../../game/player/InputManager';

// x: +1 = strafe right, y: -1 = walk forward (same convention as InputManager.movementVector).
// Corner keys exist so one thumb can walk diagonally; they are the same as pressing two edge keys.
const KEYS: { id: string; x: number; y: number; col: number; row: number; label: string; icon: ReactNode; diagonal?: boolean }[] = [
  { id: 'ul', x: -1, y: -1, col: 1, row: 1, label: 'Forward left', icon: <ArrowUpLeft size={18} />, diagonal: true },
  { id: 'u', x: 0, y: -1, col: 2, row: 1, label: 'Forward', icon: <ArrowUp size={22} /> },
  { id: 'ur', x: 1, y: -1, col: 3, row: 1, label: 'Forward right', icon: <ArrowUpRight size={18} />, diagonal: true },
  { id: 'l', x: -1, y: 0, col: 1, row: 2, label: 'Strafe left', icon: <ArrowLeft size={22} /> },
  { id: 'r', x: 1, y: 0, col: 3, row: 2, label: 'Strafe right', icon: <ArrowRight size={22} /> },
  { id: 'dl', x: -1, y: 1, col: 1, row: 3, label: 'Back left', icon: <ArrowDownLeft size={18} />, diagonal: true },
  { id: 'd', x: 0, y: 1, col: 2, row: 3, label: 'Back', icon: <ArrowDown size={22} /> },
  { id: 'dr', x: 1, y: 1, col: 3, row: 3, label: 'Back right', icon: <ArrowDownRight size={18} />, diagonal: true },
];

const CELL = 52;
const GAP = 4;
const clamp = (n: number) => Math.max(-1, Math.min(1, n));

/**
 * On-screen direction pad. It writes straight into InputManager.dpadMove (no KeyboardEvent, no pointer
 * capture): a key is held while its pointer is down and released by pointerup/pointercancel, which are also
 * listened to on window, plus blur / page hidden / unmount, so a lost touch can never leave the astronaut walking.
 */
export function Dpad({ center }: { center?: ReactNode }) {
  const held = useRef(new Map<number, string>()); // pointerId -> key id
  const [pressed, setPressed] = useState<Set<string>>(new Set());

  const apply = () => {
    const ids = new Set(held.current.values());
    let x = 0;
    let y = 0;
    for (const k of KEYS) {
      if (ids.has(k.id)) {
        x += k.x;
        y += k.y;
      }
    }
    inputManager.setDpad(clamp(x), clamp(y));
    setPressed(ids);
  };

  useEffect(() => {
    const map = held.current;
    const release = (e: PointerEvent) => {
      if (map.delete(e.pointerId)) apply();
    };
    const releaseAll = () => {
      if (map.size) {
        map.clear();
        apply();
      }
    };
    const touchEnd = (e: TouchEvent) => {
      if (e.touches.length === 0) releaseAll();
    };
    const hidden = () => {
      if (document.hidden) releaseAll();
    };
    window.addEventListener('pointerup', release, true);
    window.addEventListener('pointercancel', release, true);
    window.addEventListener('touchend', touchEnd, { passive: true });
    window.addEventListener('touchcancel', touchEnd, { passive: true });
    window.addEventListener('blur', releaseAll);
    document.addEventListener('visibilitychange', hidden);
    return () => {
      window.removeEventListener('pointerup', release, true);
      window.removeEventListener('pointercancel', release, true);
      window.removeEventListener('touchend', touchEnd);
      window.removeEventListener('touchcancel', touchEnd);
      window.removeEventListener('blur', releaseAll);
      document.removeEventListener('visibilitychange', hidden);
      map.clear();
      inputManager.clearDpad();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="pointer-events-auto absolute select-none"
      style={{
        left: 'max(12px, env(safe-area-inset-left))',
        bottom: 'max(88px, calc(env(safe-area-inset-bottom) + 76px))',
        display: 'grid',
        gridTemplateColumns: `repeat(3, ${CELL}px)`,
        gridTemplateRows: `repeat(3, ${CELL}px)`,
        gap: GAP,
        touchAction: 'none',
        WebkitTouchCallout: 'none',
        WebkitUserSelect: 'none',
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {KEYS.map((k) => {
        const on = pressed.has(k.id);
        return (
          <button
            key={k.id}
            type="button"
            aria-label={k.label}
            className="flex items-center justify-center rounded-md border"
            style={{
              gridColumn: k.col,
              gridRow: k.row,
              width: CELL,
              height: CELL,
              borderColor: on ? 'rgba(143,240,210,0.85)' : k.diagonal ? 'rgba(217,145,99,0.26)' : 'rgba(217,145,99,0.5)',
              background: on ? 'rgba(143,240,210,0.26)' : k.diagonal ? 'rgba(15,9,7,0.42)' : 'rgba(15,9,7,0.62)',
              color: on ? '#8ff0d2' : 'rgba(248,221,200,0.78)',
              backdropFilter: 'blur(6px)',
              boxShadow: on ? '0 0 16px rgba(143,240,210,0.3)' : '0 4px 14px rgba(0,0,0,0.28)',
              touchAction: 'none',
              WebkitTapHighlightColor: 'transparent',
            }}
            onPointerDown={(e) => {
              e.preventDefault();
              held.current.set(e.pointerId, k.id);
              apply();
            }}
            onContextMenu={(e) => e.preventDefault()}
          >
            {k.icon}
          </button>
        );
      })}
      {center && <div style={{ gridColumn: 2, gridRow: 2 }} className="flex items-center justify-center">{center}</div>}
    </div>
  );
}
