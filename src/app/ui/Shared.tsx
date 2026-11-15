import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import type { DataClass } from '../../game/types';
import { DATA_LABELS } from '../../game/config';

export function DataChip({ kind, compact = false }: { kind: DataClass; compact?: boolean }) {
  const meta = DATA_LABELS[kind];
  return (
    <span
      className="chip"
      style={{ color: meta.color, borderColor: `${meta.color}55`, background: `${meta.color}12` }}
      title={`${meta.label} — classification of this information`}
    >
      <span style={{ width: 5, height: 5, background: meta.color, display: 'inline-block', borderRadius: 1 }} />
      {compact ? kind.toUpperCase() : meta.label}
    </span>
  );
}

export function Meter({
  value,
  color,
  height = 5,
  warn = 30,
}: {
  value: number;
  color: string;
  height?: number;
  warn?: number;
}) {
  const v = Math.max(0, Math.min(100, value));
  const c = v <= warn ? (v <= 12 ? '#ff6b57' : '#ffb35c') : color;
  return (
    <div className="stat-bar" style={{ height }}>
      <span style={{ width: `${v}%`, background: c, color: c }} />
    </div>
  );
}

export function Kbd({ children }: { children: ReactNode }) {
  return <span className="kbd">{children}</span>;
}

export function PanelShell({
  title,
  subtitle,
  code,
  onClose,
  children,
  width = 'max-w-6xl',
  accent = '#d99163',
  headerRight,
}: {
  title: string;
  subtitle?: string;
  code?: string;
  onClose: () => void;
  children: ReactNode;
  width?: string;
  accent?: string;
  headerRight?: ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center p-3 md:p-6"
      style={{ background: 'radial-gradient(ellipse at center, rgba(10,5,4,0.48), rgba(7,3,2,0.78))' }}
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={`panel scale-in flex max-h-[92vh] w-full flex-col ${width}`}>
        <div className="flex items-start justify-between gap-4 border-b px-4 py-3 md:px-5" style={{ borderColor: 'rgba(217,145,99,0.2)' }}>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              {code && <span className="mono text-[9px] tracking-[0.24em]" style={{ color: accent }}>{code}</span>}
              <span className="label">{subtitle}</span>
            </div>
            <h2 className="display mt-0.5 truncate text-xl font-semibold tracking-wide text-mars-100 md:text-2xl">{title}</h2>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {headerRight}
            <button className="btn btn-ghost !px-2.5 !py-2" onClick={onClose} aria-label="Close panel">
              <X size={15} />
            </button>
          </div>
        </div>
        <div className="scroll-area min-h-0 flex-1">{children}</div>
      </div>
    </div>
  );
}

export function SectionTitle({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="mb-2 flex items-center justify-between gap-3">
      <div className="label">{children}</div>
      {right}
    </div>
  );
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 border border-dashed px-6 py-12 text-center" style={{ borderColor: 'rgba(217,145,99,0.22)' }}>
      <div className="label">NO RECORDS</div>
      <div className="display text-base text-mars-100">{title}</div>
      <p className="max-w-sm text-xs leading-relaxed text-mars-200/55">{body}</p>
    </div>
  );
}

export function formatDuration(seconds: number) {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}` : `${m}:${String(sec).padStart(2, '0')}`;
}

export function formatClock(seconds: number) {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}
