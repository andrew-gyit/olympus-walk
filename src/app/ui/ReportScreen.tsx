import { ArrowRight, CheckCircle2, ChevronRight, Footprints, RotateCcw, ShieldCheck, Timer, TriangleAlert, XCircle } from 'lucide-react';
import { MISSIONS, MISSION_BY_ID } from '../../game/data/missions';
import { useGameStore } from '../../stores/gameStore';
import { DataChip, formatClock, formatDuration, Meter, SectionTitle } from './Shared';

const OUTCOME_META = {
  complete: { label: 'TRAVERSE CLOSED', accent: '#8ff0d2', icon: CheckCircle2 },
  failed: { label: 'MISSION FAILED', accent: '#ff6b57', icon: TriangleAlert },
  aborted: { label: 'MISSION ABORTED', accent: '#ffb35c', icon: XCircle },
} as const;

function Metric({ label, value, hint, color = '#f4dfcc' }: { label: string; value: string; hint?: string; color?: string }) {
  return (
    <div className="border px-2.5 py-2" style={{ borderColor: 'rgba(217,145,99,0.2)' }}>
      <div className="label !text-[7.5px]">{label}</div>
      <div className="mono mt-0.5 text-base" style={{ color }}>
        {value}
      </div>
      {hint && <div className="mono mt-0.5 text-[7.5px] tracking-[0.06em] text-mars-200/32">{hint}</div>}
    </div>
  );
}

export function ReportScreen() {
  const report = useGameStore((s) => s.report);
  const phase = useGameStore((s) => s.phase);
  const events = useGameStore((s) => s.events);
  const unlocked = useGameStore((s) => s.unlocked);
  const clearReport = useGameStore((s) => s.clearReport);
  const returnToMenu = useGameStore((s) => s.returnToMenu);
  const startMission = useGameStore((s) => s.startMission);

  if (!report || phase !== 'report') return null;

  const def = MISSION_BY_ID[report.missionId];
  const meta = OUTCOME_META[report.outcome];
  const OutcomeIcon = meta.icon;
  const accent = def?.accent ?? meta.accent;
  const next = MISSIONS.find((m) => m.unlockAfter === report.missionId) ?? null;
  const nextAvailable = !!next && unlocked.includes(next.id);
  const recent = [...events].reverse().filter((e) => e.type !== 'mission-end').slice(0, 6);
  const shownScore = Math.max(0, Math.min(100, report.totalScore));

  function retry() {
    if (!report) return;
    clearReport();
    startMission(report.missionId);
  }

  function nextMission() {
    if (!next || !report) return;
    clearReport();
    startMission(next.id);
  }

  function menu() {
    clearReport();
    returnToMenu();
  }

  return (
    <div className="fixed inset-0 z-30 overflow-y-auto scroll-area" style={{ background: 'linear-gradient(120deg, rgba(10,6,4,0.92), rgba(14,8,6,0.72) 50%, rgba(12,7,5,0.38))' }}>
      <div className="mx-auto flex min-h-full w-full max-w-5xl flex-col px-4 py-5 md:px-8 md:py-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="mono text-[9px] tracking-[0.26em]" style={{ color: accent }}>
              {def?.code ?? 'OW'} / {report.missionName}
            </div>
            <div className="mt-1 flex items-center gap-2.5">
              <OutcomeIcon size={20} style={{ color: meta.accent }} />
              <h1 className="display text-2xl font-semibold tracking-[0.08em] text-mars-100 md:text-3xl">{meta.label}</h1>
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <span className="chip">{def?.difficulty ?? 'FIELD'}</span>
              <span className="chip">{formatDuration(report.elapsed)} ELAPSED</span>
              <span className="chip">{report.distanceWalked} m WALKED</span>
              <DataChip kind="simulation" compact />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative" style={{ width: 104, height: 104 }}>
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  background: `conic-gradient(${accent} ${shownScore * 3.6}deg, rgba(217,145,99,0.16) 0deg)`,
                  boxShadow: `0 0 34px ${accent}22`,
                }}
              />
              <div
                className="absolute inset-[5px] flex flex-col items-center justify-center rounded-full"
                style={{ background: 'rgba(15,9,7,0.94)' }}
              >
                <div className="mono text-2xl leading-none" style={{ color: accent }}>
                  {report.totalScore}
                </div>
                <div className="mono text-[7px] tracking-[0.16em] text-mars-200/40">OF 100</div>
              </div>
            </div>
            <div className="text-center">
              <div className="label !text-[8px]">GRADE</div>
              <div className="display text-5xl leading-none" style={{ color: accent }}>
                {report.grade}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <SectionTitle right={<span className="mono text-[8px] text-mars-200/40">{report.objectivesCompleted}/{report.objectivesTotal} OBJECTIVES</span>}>
              SCORE BREAKDOWN
            </SectionTitle>
            <div className="space-y-1.5">
              {report.breakdown.map((item) => {
                const pct = item.max > 0 ? (item.value / item.max) * 100 : 0;
                return (
                  <div key={item.label} className="border px-3 py-2" style={{ borderColor: 'rgba(217,145,99,0.18)' }}>
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="mono text-[8.5px] tracking-[0.12em] text-mars-100/80">{item.label}</span>
                      <span className="mono text-[10px]" style={{ color: accent }}>
                        {item.value}
                        <span className="text-mars-200/35">/{item.max}</span>
                      </span>
                    </div>
                    <div className="mt-1">
                      <Meter value={pct} color={accent} height={3} warn={-1} />
                    </div>
                    <div className="mt-0.5 text-[8px] leading-relaxed text-mars-200/38">{item.note}</div>
                  </div>
                );
              })}
            </div>

            <div className="mt-3 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
              <Metric label="SAMPLES" value={String(report.samples)} hint="SEALED BAGS" />
              <Metric label="IMAGES" value={String(report.photos)} hint="FIELD FRAMES" />
              <Metric label="OBSERVATIONS" value={String(report.observations)} hint="LOGGED" />
              <Metric label="SCANNED" value={String(report.scanned)} hint="SIGNATURES" />
            </div>
          </div>

          <div className="space-y-3">
            <div className="border p-3" style={{ borderColor: `${meta.accent}55`, background: `${meta.accent}0a` }}>
              <div className="label" style={{ color: meta.accent }}>TRAVERSE ASSESSMENT</div>
              <p className="mt-1 text-[10px] leading-relaxed text-mars-100/62">
                {report.outcome === 'complete'
                  ? 'All required objectives were verified and the walk closed inside Base Camp A. The record chain is stored in the field terminal.'
                  : report.outcome === 'failed'
                    ? 'The traverse ended before the objectives could be secured. Suit reserves or suit integrity reached their failure threshold.'
                    : 'The traverse was closed early by the crew. Partial records were retained for the next attempt.'}
              </p>
              <div className="mt-2 grid grid-cols-2 gap-1.5">
                <Metric label="INCIDENTS" value={String(report.incidents)} color={report.incidents > 0 ? '#ff6b57' : '#8ff0d2'} hint="SAFETY + PROTOCOL" />
                <Metric label="RISK MITIGATED" value={String(report.risksAvoided)} color="#8ff0d2" hint="STEEP GROUND LEFT" />
                <Metric label="PP SCORE" value={`${report.ppScore}/100`} color={report.ppScore >= 80 ? '#8ff0d2' : '#ffcf7a'} hint="COMPLIANCE" />
                <Metric label="RECORD" value={`${report.recordIntegrity}%`} color={report.recordIntegrity >= 80 ? '#8ff0d2' : '#ffcf7a'} hint="CHAIN INTEGRITY" />
              </div>
            </div>

            <div className="border p-3" style={{ borderColor: 'rgba(217,145,99,0.2)' }}>
              <div className="label">SUIT USE</div>
              <div className="mono mt-1.5 space-y-1 text-[9px]">
                <div className="flex justify-between text-mars-200/50">
                  <span>OXYGEN CONSUMED</span>
                  <span className="text-mars-100/80">{report.oxygenUsed}%</span>
                </div>
                <Meter value={report.oxygenUsed} color="#9fd8e8" height={3} warn={-1} />
                <div className="flex justify-between pt-0.5 text-mars-200/50">
                  <span>BATTERY CONSUMED</span>
                  <span className="text-mars-100/80">{report.batteryUsed}%</span>
                </div>
                <Meter value={report.batteryUsed} color="#8ff0d2" height={3} warn={-1} />
              </div>
              <div className="mono mt-2 flex items-center justify-between border-t pt-1.5 text-[8px] text-mars-200/35" style={{ borderColor: 'rgba(217,145,99,0.16)' }}>
                <span className="flex items-center gap-1"><Timer size={9} /> {formatClock(report.elapsed)}</span>
                <span className="flex items-center gap-1"><Footprints size={9} /> {report.distanceWalked} m</span>
                <span className="flex items-center gap-1"><ShieldCheck size={9} /> {report.ppScore}/100</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <SectionTitle right={<span className="mono text-[8px] text-mars-200/35">LAST {recent.length} ENTRIES</span>}>FIELD LOG RECAP</SectionTitle>
          <div className="grid gap-1 md:grid-cols-2">
            {recent.length === 0 && <div className="text-[9px] text-mars-200/35">No recorded events.</div>}
            {recent.map((event) => (
              <div
                key={event.id}
                className="flex items-start gap-2 border-l-2 px-2 py-1"
                style={{
                  borderColor:
                    event.risk === 'critical' ? '#ff6b57' : event.risk === 'warning' ? '#ffb35c' : event.risk === 'caution' ? '#ffcf7a' : '#8ff0d2',
                }}
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[9px] text-mars-100/75">{event.title}</div>
                  <div className="line-clamp-1 text-[8px] leading-relaxed text-mars-200/35">{event.detail}</div>
                </div>
                <span className="mono shrink-0 text-[7px] text-mars-200/25">{new Date(event.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t pt-4" style={{ borderColor: 'rgba(217,145,99,0.2)', marginTop: '1.25rem' }}>
          <div className="mono max-w-md text-[8px] leading-relaxed tracking-[0.08em] text-mars-200/32">
            SCORES ARE TRAINING VALUES COMPUTED FROM THIS SIMULATION. THEY ARE NOT A LEGAL, SAFETY OR SCIENTIFIC CERTIFICATION.
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button className="btn btn-ghost" onClick={menu}>
              FIELD TERMINAL
            </button>
            <button className="btn" onClick={retry}>
              <RotateCcw size={13} /> RETRY WALK
            </button>
            {nextAvailable && next ? (
              <button className="btn btn-primary !px-4" onClick={nextMission}>
                NEXT · {next.name} <ArrowRight size={14} />
              </button>
            ) : (
              report.outcome === 'complete' && (
                <button className="btn btn-primary" onClick={menu}>
                  RETURN TO TERMINAL <ChevronRight size={14} />
                </button>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
