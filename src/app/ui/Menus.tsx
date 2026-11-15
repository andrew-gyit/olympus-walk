import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Compass,
  Database,
  Lock,
  Map,
  Play,
  Settings,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
} from 'lucide-react';
import { MISSIONS, MISSION_BY_ID } from '../../game/data/missions';
import { DISCLAIMER } from '../../game/data/scientificContent';
import { useGameStore } from '../../stores/gameStore';
import { SaveManager } from '../../game/core/SaveManager';
import { CONTROL_HELP, DATA_LABELS } from '../../game/config';
import { DataChip, Kbd, PanelShell, SectionTitle, formatDuration } from './Shared';
import { SettingsContent } from './Panels';

export function BootScreen() {
  const bootProgress = useGameStore((s) => s.bootProgress);
  const bootMessage = useGameStore((s) => s.bootMessage);
  const bootComplete = useGameStore((s) => s.bootComplete);
  const phase = useGameStore((s) => s.phase);
  const [pulse, setPulse] = useState(0);

  useEffect(() => {
    const t = window.setInterval(() => setPulse((p) => (p + 1) % 4), 620);
    const guard = window.setTimeout(() => {
      if (useGameStore.getState().phase === 'boot') bootComplete();
    }, 12000);
    return () => {
      window.clearInterval(t);
      window.clearTimeout(guard);
    };
  }, [bootComplete]);

  const steps = [
    'ESTABLISHING LOCAL LINK',
    'BUILDING EXPLORATION ZONE A',
    'SEEDING REGOLITH AND BEACONS',
    'PRESSURIZING FIELD INSTRUMENTS',
  ];

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden" style={{ background: '#100806' }}>
      <div
        className="absolute inset-0 opacity-70"
        style={{
          background:
            'radial-gradient(ellipse at 50% 40%, rgba(156,84,48,0.22), transparent 55%), radial-gradient(ellipse at 20% 90%, rgba(72,38,28,0.45), transparent 60%)',
        }}
      />
      <div className="hex-grid absolute inset-0 opacity-40" />
      <div className="scan-sweep opacity-30" />
      <div className="relative z-10 w-full max-w-xl px-6">
        <div className="mb-2 flex items-end justify-between">
          <div>
            <div className="label" style={{ color: '#d99163' }}>MARS SURFACE OPERATIONS / TERMINAL 04</div>
            <h1 className="display title-glow mt-2 text-4xl font-bold tracking-[0.16em] text-mars-100 md:text-6xl">OLYMPUS<br />WALK</h1>
          </div>
          <div className="mono text-right text-[9px] leading-relaxed tracking-[0.2em] text-mars-300/60">
            ZONE A<br />OLYMPUS MONS<br />SIMULATION
          </div>
        </div>
        <div className="logo-line my-6" />
        <div className="flex items-center justify-between text-[10px]">
          <span className="mono tracking-[0.2em] text-mars-200/80">{bootMessage}</span>
          <span className="mono text-mars-300">{Math.round(bootProgress * 100)}%</span>
        </div>
        <div className="mt-2 h-[3px] w-full overflow-hidden bg-mars-100/10">
          <div
            className="h-full transition-all duration-500"
            style={{ width: `${Math.max(4, bootProgress * 100)}%`, background: 'linear-gradient(90deg,#b35d33,#ffcf7a,#8ff0d2)' }}
          />
        </div>
        <div className="mt-5 grid grid-cols-1 gap-1.5">
          {steps.map((step, i) => (
            <div key={step} className="mono flex items-center gap-2 text-[9px] tracking-[0.16em] text-mars-200/40">
              <span
                className="inline-block h-1 w-1 rounded-full"
                style={{
                  background: bootProgress >= 1 || pulse > i ? '#8ff0d2' : '#5c3a2a',
                  boxShadow: bootProgress >= 1 || pulse > i ? '0 0 8px #8ff0d2' : 'none',
                }}
              />
              {step}
            </div>
          ))}
        </div>
        <div className="mt-8 flex items-center justify-between gap-3 text-[9px] text-mars-200/35">
          <span className="mono">PROCEDURAL TERRAIN · NOT A SCIENTIFIC REPRODUCTION</span>
          <span className="mono">BUILD 1.0 / 2026</span>
        </div>
        {phase === 'boot' && bootProgress >= 1 && (
          <button className="btn btn-primary mt-6 w-full" onClick={bootComplete}>
            ENTER TERMINAL <ArrowRight size={14} />
          </button>
        )}
      </div>
    </div>
  );
}

export function MainMenu() {
  const hasSave = useGameStore((s) => s.hasSave);
  const continueGame = useGameStore((s) => s.continueGame);
  const setPhase = useGameStore((s) => s.setPhase);
  const unlocked = useGameStore((s) => s.unlocked);
  const reports = useGameStore((s) => s.reports);
  const [overlay, setOverlay] = useState<'manual' | 'settings' | null>(null);
  const best = reports.length ? Math.max(...reports.map((r) => r.totalScore)) : null;
  const muted = useGameStore((s) => s.settings.muted);
  const updateSettings = useGameStore((s) => s.updateSettings);

  return (
    <div className="fixed inset-0 z-20">
      <div
        className="absolute inset-y-0 left-0 w-full md:w-[56%]"
        style={{
          background:
            'linear-gradient(90deg, rgba(12,6,4,0.94) 0%, rgba(12,6,4,0.76) 48%, rgba(12,6,4,0.18) 82%, transparent 100%)',
        }}
      />
      <div className="relative flex h-full flex-col justify-between px-6 py-6 md:px-12 md:py-9">
        <div className="flex items-start justify-between">
          <div>
            <div className="label text-mars-300">MARS SURFACE OPERATIONS / ZONE A</div>
            <h1 className="display title-glow mt-1 text-4xl font-bold tracking-[0.14em] text-mars-100 md:text-6xl">
              OLYMPUS<span className="text-mars-400">WALK</span>
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="chip">EXPLORE SMARTER</span>
              <span className="chip">WALK SAFER</span>
              <span className="chip">DISCOVER MARS</span>
            </div>
          </div>
          <div className="hidden text-right md:block">
            <div className="mono text-[9px] tracking-[0.24em] text-mars-200/40">FIELD TERMINAL</div>
            <div className="mono mt-1 text-[10px] text-signal">LINK STABLE</div>
            <div className="mono mt-1 text-[9px] text-mars-200/40">12 TARGETS · 5 MISSIONS</div>
          </div>
        </div>

        <div className="max-w-xl">
          <div className="mb-6 max-w-lg text-sm leading-relaxed text-mars-100/70">
            A playable third-person Mars exploration simulator. Walk a procedural Olympus Mons training
            zone, read the terrain, run scientific instruments, manage life support and follow
            planetary-protection protocol.
          </div>
          <div className="flex flex-col gap-2.5">
            {hasSave && (
              <button
                className="btn btn-primary justify-between !py-3.5 text-left"
                onClick={() => {
                  continueGame();
                }}
              >
                <span className="flex items-center gap-3">
                  <Play size={16} /> CONTINUE WALK
                </span>
                <span className="mono text-[9px] tracking-[0.16em] opacity-70">RESTORE LAST SUIT STATE</span>
              </button>
            )}
            <button className="btn justify-between !py-3.5 text-left" onClick={() => setPhase('mission-select')}>
              <span className="flex items-center gap-3">
                <Compass size={16} /> {hasSave ? 'NEW EXPEDITION' : 'BEGIN EXPEDITION'}
              </span>
              <span className="mono text-[9px] tracking-[0.16em] opacity-50">MISSION SELECT</span>
            </button>
            <div className="grid grid-cols-2 gap-2.5">
              <button className="btn justify-start" onClick={() => setOverlay('manual')}>
                <BookOpen size={14} /> FIELD MANUAL
              </button>
              <button className="btn justify-start" onClick={() => setOverlay('settings')}>
                <Settings size={14} /> SETTINGS
              </button>
            </div>
          </div>

          <div className="mt-7 grid max-w-lg grid-cols-3 gap-2">
            <div className="glass px-3 py-2.5">
              <div className="label">MISSIONS OPEN</div>
              <div className="mono mt-1 text-xl text-mars-100">{unlocked.length}<span className="text-xs text-mars-300/50"> / 5</span></div>
            </div>
            <div className="glass px-3 py-2.5">
              <div className="label">WALKS LOGGED</div>
              <div className="mono mt-1 text-xl text-mars-100">{reports.length}</div>
            </div>
            <div className="glass px-3 py-2.5">
              <div className="label">BEST SCORE</div>
              <div className="mono mt-1 text-xl" style={{ color: best !== null ? '#8ff0d2' : '#6e4a39' }}>{best !== null ? best : '—'}</div>
            </div>
          </div>
        </div>

        <div className="max-w-2xl">
          <div className="flex flex-wrap items-center gap-2 text-[9px]">
            <DataChip kind="simulation" />
            <span className="mono text-mars-200/35">Procedural terrain · fictional training zone · not a real Marswalk plan</span>
          </div>
          <div className="mt-3 flex items-center gap-3">
            <button
              className="btn btn-ghost !px-2.5 !py-1.5"
              onClick={() => updateSettings({ muted: !muted })}
              title="Toggle ambient audio"
            >
              <span className="mono text-[9px]">{muted ? 'AUDIO OFF' : 'AUDIO ON'}</span>
            </button>
            <span className="mono text-[9px] tracking-[0.14em] text-mars-200/25">CLICK THE WORLD TO CAPTURE POINTER · ESC TO PAUSE</span>
          </div>
        </div>
      </div>

      {overlay === 'manual' && <ManualOverlay onClose={() => setOverlay(null)} />}
      {overlay === 'settings' && (
        <PanelShell title="FIELD TERMINAL SETTINGS" subtitle="SYSTEM / CONFIGURATION" onClose={() => setOverlay(null)} width="max-w-3xl">
          <SettingsContent />
        </PanelShell>
      )}
    </div>
  );
}

function ManualOverlay({ onClose }: { onClose: () => void }) {
  return (
    <PanelShell title="FIELD MANUAL" subtitle="OW / OPERATIONS" code="REV 1.0" onClose={onClose} width="max-w-4xl">
      <div className="grid gap-6 p-5 md:grid-cols-[1.2fr_0.8fr]">
        <div>
          <SectionTitle>CONTROLS</SectionTitle>
          <div className="space-y-1.5">
            {CONTROL_HELP.map((row) => (
              <div key={row.keys} className="flex items-start gap-3 border-b py-1.5 last:border-0" style={{ borderColor: 'rgba(217,145,99,0.12)' }}>
                <div className="w-24 shrink-0">
                  <span className="kbd whitespace-nowrap">{row.keys}</span>
                </div>
                <div className="min-w-0">
                  <div className="text-xs text-mars-100">{row.action}</div>
                  <div className="text-[10px] leading-relaxed text-mars-200/45">{row.note}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-5">
          <div>
            <SectionTitle>FIELD METHOD</SectionTitle>
            <ol className="space-y-2 text-[11px] leading-relaxed text-mars-100/70">
              <li><span className="mono text-signal">01</span> Scan before you approach. The scanner reveals contacts inside 85 m.</li>
              <li><span className="mono text-signal">02</span> Analyze at close range. Analysis creates a field observation.</li>
              <li><span className="mono text-signal">03</span> Sample only after analysis. Scan → analyze → sample preserves the record chain.</li>
              <li><span className="mono text-signal">04</span> Plan the line. Compare safest, balanced and scientific routes.</li>
              <li><span className="mono text-signal">05</span> Observe uncertain regions. Do not sample observation-only terrain.</li>
            </ol>
          </div>
          <div>
            <SectionTitle>DATA LABELS</SectionTitle>
            <div className="space-y-2">
              {(Object.keys(DATA_LABELS) as Array<keyof typeof DATA_LABELS>).map((k) => (
                <div key={k} className="glass px-3 py-2">
                  <DataChip kind={k} compact />
                  <p className="mt-1.5 text-[10px] leading-relaxed text-mars-200/50">
                    {k === 'real'
                      ? 'Published instrument datasets and public archives. No NASA raster tiles are bundled in this offline build.'
                      : k === 'derived'
                        ? 'Computed from the procedural height field: slope, elevation, thermal model and routes.'
                        : 'Scenario values authored for the game: suit reserves, boundaries, signatures and events.'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="md:col-span-2 border-t pt-4 text-[10px] leading-relaxed text-mars-200/40" style={{ borderColor: 'rgba(217,145,99,0.18)' }}>
          {DISCLAIMER}
        </div>
      </div>
    </PanelShell>
  );
}

export function MissionSelect({ onSelect }: { onSelect: (id: string) => void }) {
  const unlocked = useGameStore((s) => s.unlocked);
  const reports = useGameStore((s) => s.reports);
  const setPhase = useGameStore((s) => s.setPhase);
  const bestScores = SaveManager.loadProgress().bestScores;

  return (
    <div className="fixed inset-0 z-20 flex flex-col overflow-hidden">
      <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg,rgba(12,6,4,0.93),rgba(12,6,4,0.55) 55%,rgba(12,6,4,0.2))' }} />
      <div className="relative flex min-h-0 flex-1 flex-col px-5 py-5 md:px-10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="label">EXPEDITION CONTROL / ZONE A</div>
            <h1 className="display mt-1 text-3xl font-semibold tracking-[0.1em] text-mars-100 md:text-4xl">SELECT A MISSION</h1>
            <p className="mt-2 max-w-2xl text-xs leading-relaxed text-mars-200/55">
              Five sequential traverses around Base Camp A. Complete the objectives and return inside the
              camp perimeter to close each walk. Missions unlock in order.
            </p>
          </div>
          <button className="btn btn-ghost" onClick={() => setPhase('menu')}>
            <ArrowLeft size={14} /> MAIN MENU
          </button>
        </div>

        <div className="mt-5 grid min-h-0 flex-1 gap-3 overflow-y-auto scroll-area pr-1 md:grid-cols-2 xl:grid-cols-3">
          {MISSIONS.map((mission) => {
            const isUnlocked = unlocked.includes(mission.id);
            const report = reports.filter((r) => r.missionId === mission.id).slice(-1)[0];
            const locked = !isUnlocked;
            return (
              <button
                key={mission.id}
                disabled={locked}
                onClick={() => isUnlocked && onSelect(mission.id)}
                className={`mission-card group relative flex min-h-[230px] flex-col justify-between overflow-hidden border p-4 text-left ${
                  locked ? 'cursor-not-allowed opacity-55' : 'cursor-pointer'
                }`}
                style={{
                  borderColor: locked ? 'rgba(217,145,99,0.16)' : `${mission.accent}55`,
                  background: `linear-gradient(155deg, rgba(30,17,13,0.88), rgba(13,8,6,0.82))`,
                }}
              >
                <div className="absolute inset-x-0 top-0 h-[2px]" style={{ background: locked ? 'rgba(217,145,99,0.25)' : mission.accent }} />
                <div>
                  <div className="flex items-center justify-between">
                    <span className="mono text-[9px] tracking-[0.22em]" style={{ color: locked ? '#7b5a49' : mission.accent }}>
                      {mission.code} / MISSION {String(mission.index).padStart(2, '0')}
                    </span>
                    {locked ? <Lock size={13} className="text-mars-300/50" /> : report ? <CheckCircle2 size={14} style={{ color: mission.accent }} /> : <ChevronRight size={14} className="text-mars-300/60" />}
                  </div>
                  <h2 className="display mt-2 text-lg font-semibold tracking-wide text-mars-100">{mission.name}</h2>
                  <div className="text-[10px] text-mars-200/50">{mission.subtitle}</div>
                  <p className="mt-2 line-clamp-3 text-[11px] leading-relaxed text-mars-100/60">{mission.description}</p>
                </div>
                <div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <span className="chip">{mission.difficulty}</span>
                    <span className="chip">{mission.duration}</span>
                    <span className="chip">{mission.distance}</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t pt-2" style={{ borderColor: 'rgba(217,145,99,0.14)' }}>
                    <span className="mono text-[9px] text-mars-200/40">
                      {locked ? `REQUIRES ${MISSION_BY_ID[mission.unlockAfter ?? '']?.name ?? 'EARLIER WALK'}` : `${mission.objectives.filter((o) => o.required).length} REQUIRED OBJECTIVES`}
                    </span>
                    <span className="mono text-[9px]" style={{ color: mission.accent }}>
                      {report ? `LAST ${report.totalScore}/100 · ${report.grade}` : bestScores[mission.id] ? `BEST ${bestScores[mission.id]}` : isUnlocked ? 'READY' : 'LOCKED'}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
          <div className="relative flex min-h-[230px] flex-col justify-between border border-dashed p-4" style={{ borderColor: 'rgba(217,145,99,0.18)' }}>
            <div>
              <div className="flex items-center gap-2">
                <TriangleAlert size={13} className="text-warn" />
                <span className="mono text-[9px] tracking-[0.2em] text-warn">SCIENTIFIC NOTICE</span>
              </div>
              <p className="mt-3 text-[11px] leading-relaxed text-mars-100/55">{DISCLAIMER}</p>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <DataChip kind="real" compact />
              <DataChip kind="derived" compact />
              <DataChip kind="simulation" compact />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Briefing({ missionId, onStart, onBack }: { missionId: string; onStart: () => void; onBack: () => void }) {
  const mission = MISSION_BY_ID[missionId] ?? MISSIONS[0];
  const reports = useGameStore((s) => s.reports);
  const last = reports.filter((r) => r.missionId === mission.id).slice(-1)[0];
  return (
    <div className="fixed inset-0 z-20 flex items-stretch">
      <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg,rgba(11,6,4,0.95),rgba(12,7,5,0.7) 58%,rgba(12,7,5,0.12))' }} />
      <div className="relative flex w-full max-w-4xl flex-col overflow-y-auto scroll-area px-6 py-6 md:px-10 md:py-8">
        <div className="flex items-center justify-between">
          <div className="label">MISSION BRIEFING / {mission.code}</div>
          <button className="btn btn-ghost" onClick={onBack}><ArrowLeft size={13} /> MISSIONS</button>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <div className="mono text-5xl font-bold" style={{ color: mission.accent }}>{String(mission.index).padStart(2, '0')}</div>
          <div>
            <h1 className="display text-3xl font-bold tracking-[0.08em] text-mars-100 md:text-4xl">{mission.name}</h1>
            <p className="text-xs text-mars-200/55">{mission.subtitle}</p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-1.5">
          <span className="chip">{mission.difficulty}</span>
          <span className="chip">{mission.duration}</span>
          <span className="chip">{mission.distance}</span>
          <span className="chip chip-signal">{mission.startZone}</span>
          <DataChip kind="simulation" compact />
        </div>

        <div className="mt-5 grid gap-5 md:grid-cols-[1.1fr_0.9fr]">
          <div>
            <SectionTitle>BRIEF</SectionTitle>
            <p className="text-[12px] leading-relaxed text-mars-100/72">{mission.brief}</p>
            <div className="mt-4 glass p-3">
              <div className="label mb-1">SCIENCE FOCUS</div>
              <div className="text-[11px] text-mars-100/70">{mission.scienceFocus}</div>
              <div className="mt-3 label mb-1">FIELD EQUIPMENT</div>
              <div className="flex flex-wrap gap-1.5">
                {mission.equipment.map((e) => <span key={e} className="chip">{e}</span>)}
              </div>
            </div>
            <div className="mt-4 border-l-2 pl-3 text-[10px] leading-relaxed text-mars-200/45" style={{ borderColor: mission.accent }}>
              Return inside Base Camp A (14 m radius) to close the traverse. Mission completion is confirmed
              automatically when every required objective is complete. Field values are simulation data.
            </div>
          </div>
          <div>
            <SectionTitle right={<span className="mono text-[9px] text-mars-200/40">{mission.objectives.length} TASKS</span>}>OBJECTIVES</SectionTitle>
            <div className="space-y-1.5">
              {mission.objectives.map((obj, i) => (
                <div key={obj.id} className="flex items-start gap-2.5 border-b py-2 last:border-0" style={{ borderColor: 'rgba(217,145,99,0.12)' }}>
                  <div className="mono mt-0.5 w-5 text-[10px]" style={{ color: obj.required ? mission.accent : '#8e6b57' }}>{String(i + 1).padStart(2, '0')}</div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-mars-100">{obj.label}</span>
                      {!obj.required && <span className="chip !py-0 !text-[8px]">OPTIONAL</span>}
                    </div>
                    <div className="text-[10px] leading-relaxed text-mars-200/45">{obj.detail}</div>
                  </div>
                </div>
              ))}
            </div>
            {last && (
              <div className="mt-3 glass px-3 py-2">
                <div className="label">LAST ATTEMPT</div>
                <div className="mono mt-1 text-[11px] text-mars-100">
                  {last.totalScore}/100 · GRADE {last.grade} · {last.outcome.toUpperCase()} · {formatDuration(last.elapsed)}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t pt-4" style={{ borderColor: 'rgba(217,145,99,0.18)' }}>
          <div className="mono max-w-md text-[9px] leading-relaxed tracking-[0.1em] text-mars-200/35">
            BY STARTING YOU ACCEPT THE FIELD PROTOCOL: OBSERVE MORE, DISTURB LESS. THE ZONE IS PROCEDURAL AND FICTIONAL.
          </div>
          <button className="btn btn-primary !px-6 !py-3" onClick={onStart}>
            <Play size={15} /> BEGIN TRAVERSE
          </button>
        </div>
      </div>
    </div>
  );
}
