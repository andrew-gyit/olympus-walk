import { useMemo, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  Camera,
  CheckCircle2,
  Circle,
  Compass,
  Database,
  ExternalLink,
  FileText,
  FlaskConical,
  Gauge,
  Globe2,
  Image as ImageIcon,
  Layers,
  Map as MapIcon,
  MapPin,
  Microscope,
  NotebookPen,
  Pause,
  Play,
  RotateCcw,
  Scale,
  Settings as SettingsIcon,
  ShieldAlert,
  ShieldCheck,
  TriangleAlert,
  Volume2,
} from 'lucide-react';
import { RESOURCES, DATA_LABELS, MAP_LAYERS } from '../../game/config';
import { CONTROL_HELP } from '../../game/config';
import { DISCLAIMER, LEGAL_SOURCES, PROTECTION_PRINCIPLES, DATA_SOURCES, REAL_VS_SIM } from '../../game/data/scientificContent';
import { ZONES, ZONE_BY_ID, zoneAt } from '../../game/data/zones';
import { POI_BY_ID } from '../../game/data/pois';
import { runtimeBridge } from '../../game/core/RuntimeBridge';
import { audioManager } from '../../game/core/AudioManager';
import { DEFAULT_SETTINGS, SaveManager } from '../../game/core/SaveManager';
import { selectCurrentObjective, useGameStore } from '../../stores/gameStore';
import { formatClock, formatDuration, DataChip, EmptyState, Kbd, Meter, PanelShell, SectionTitle } from './Shared';
import { WristMapContent } from './WristMap';
import type { RiskLevel } from '../../game/types';

const LEVEL_COLOR: Record<string, string> = {
  info: '#8ff0d2',
  success: '#8ff0d2',
  caution: '#ffcf7a',
  warning: '#ffb35c',
  critical: '#ff6b57',
};

function isLevel(value: string): value is RiskLevel {
  return value in LEVEL_COLOR;
}

/* ------------------------------------------------------------------ settings */

export function SettingsContent() {
  const settings = useGameStore((s) => s.settings);
  const updateSettings = useGameStore((s) => s.updateSettings);
  const touchMode = useGameStore((s) => s.touchMode);
  const setTouchMode = useGameStore((s) => s.setTouchMode);

  function changeVolume(volume: number) {
    updateSettings({ volume });
    audioManager.setVolume(volume, settings.muted);
  }

  return (
    <div className="grid gap-5 p-5 md:grid-cols-2">
      <div>
        <SectionTitle right={<SettingsIcon size={17} className="text-mars-300/80" />}>CONTROL</SectionTitle>
        <div className="space-y-3">
          <SliderRow label="LOOK SENSITIVITY" value={settings.sensitivity} min={0.3} max={2.4} step={0.05} suffix="×" onChange={(v) => updateSettings({ sensitivity: v })} />
          <ToggleRow label="INVERT VERTICAL LOOK" value={settings.invertY} onChange={(v) => updateSettings({ invertY: v })} />
          <ToggleRow label="CAMERA SHAKE" value={settings.cameraShake} onChange={(v) => updateSettings({ cameraShake: v })} />
          <ToggleRow label="WORLD MARKER LABELS" value={settings.showMarkerLabels} onChange={(v) => updateSettings({ showMarkerLabels: v })} />
        </div>
      </div>

      <div>
        <SectionTitle right={<Volume2 size={17} className="text-mars-300/80" />}>AUDIO & DISPLAY</SectionTitle>
        <div className="space-y-3">
          <SliderRow label="MASTER VOLUME" value={settings.volume} min={0} max={1} step={0.05} suffix="" percent onChange={changeVolume} />
          <ToggleRow label="MUTE FIELD AUDIO" value={settings.muted} onChange={(v) => updateSettings({ muted: v })} />
          <SliderRow label="HUD SCALE" value={settings.hudScale} min={0.8} max={1.3} step={0.05} suffix="×" onChange={(v) => updateSettings({ hudScale: v })} />
          <ToggleRow label="TOUCH CONTROLS" value={touchMode} onChange={setTouchMode} hint="Shows the on-screen thumbstick, look pad and action buttons." />
        </div>
      </div>

      <div className="md:col-span-2">
        <SectionTitle>RENDER QUALITY</SectionTitle>
        <div className="grid grid-cols-3 gap-2">
          {(['low', 'medium', 'high'] as const).map((q) => (
            <button
              key={q}
              onClick={() => updateSettings({ quality: q })}
              className={`btn !py-2.5 ${settings.quality === q ? 'btn-primary' : ''}`}
            >
              {q.toUpperCase()}
            </button>
          ))}
        </div>
        <p className="mt-2 text-ui-md leading-relaxed text-mars-200/65">
          Lower quality reduces the internal render resolution and shadow cost. It does not change the simulation.
        </p>
      </div>

      <div className="md:col-span-2 border-t pt-4" style={{ borderColor: 'rgba(217,145,99,0.18)' }}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2 text-ui-sm">
            <DataChip kind="real" compact />
            <DataChip kind="derived" compact />
            <DataChip kind="simulation" compact />
            <span className="mono text-mars-200/65">SETTINGS PERSIST LOCALLY</span>
          </div>
          <button
            className="btn btn-ghost !py-1.5 !text-ui-sm"
            onClick={() => {
              updateSettings({ ...DEFAULT_SETTINGS });
              SaveManager.saveSettings(DEFAULT_SETTINGS);
            }}
          >
            <RotateCcw size={16} /> RESET TO DEFAULTS
          </button>
        </div>
      </div>
    </div>
  );
}

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  suffix,
  percent,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  suffix?: string;
  percent?: boolean;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="label !text-ui-xs">{label}</span>
        <span className="mono text-ui-sm text-mars-100/70">{percent ? `${Math.round(value * 100)}%` : `${value.toFixed(2)}${suffix ?? ''}`}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1.5 w-full cursor-pointer accent-mars-400"
        style={{ accentColor: '#d99163' }}
      />
    </div>
  );
}

function ToggleRow({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  hint?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <div className="label !text-ui-xs">{label}</div>
        {hint && <div className="mt-0.5 text-ui-sm leading-relaxed text-mars-200/65">{hint}</div>}
      </div>
      <button
        onClick={() => onChange(!value)}
        className="relative h-5 w-10 shrink-0 border"
        style={{
          borderColor: value ? 'rgba(143,240,210,0.7)' : 'rgba(217,145,99,0.35)',
          background: value ? 'rgba(143,240,210,0.2)' : 'rgba(34,20,15,0.6)',
        }}
        aria-pressed={value}
      >
        <span
          className="absolute top-0.5 h-3.5 w-4.5 transition-all"
          style={{
            left: value ? 20 : 3,
            width: 16,
            background: value ? '#8ff0d2' : '#a97755',
            boxShadow: value ? '0 0 8px rgba(143,240,210,0.65)' : 'none',
          }}
        />
      </button>
    </div>
  );
}

/* ---------------------------------------------------------------- objectives */

export function ObjectivesContent() {
  const mission = useGameStore((s) => s.mission);
  const events = useGameStore((s) => s.events);
  const current = useGameStore(selectCurrentObjective);
  const hint = useGameStore((s) => s.hint);
  const navigation = useGameStore((s) => s.navigation);
  const telemetry = useGameStore((s) => s.telemetry);
  const openPanel = useGameStore((s) => s.openPanel);

  if (!mission) return <EmptyState title="No active traverse" body="Start a mission from the expedition terminal." />;
  const required = mission.objectives.filter((o) => o.required);
  const completed = required.filter((o) => o.completed).length;
  const recent = [...events].reverse().slice(0, 9);

  return (
    <div className="grid gap-5 p-5 md:grid-cols-[1.25fr_0.75fr]">
      <div>
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="label">{mission.code} · FIELD OBJECTIVES</div>
            <div className="display mt-1 text-xl text-mars-100">{mission.name}</div>
          </div>
          <div className="text-right">
            <div className="mono text-2xl" style={{ color: '#8ff0d2' }}>{completed}<span className="text-sm text-mars-300/80">/{required.length}</span></div>
            <div className="label">REQUIRED</div>
          </div>
        </div>
        <div className="mt-3">
          <Meter value={required.length ? (completed / required.length) * 100 : 0} color="#8ff0d2" height={6} warn={-1} />
        </div>

        <div className="mt-4 space-y-1">
          {mission.objectives.map((objective, index) => {
            const pct = Math.min(100, (objective.progress / Math.max(1, objective.count ?? 1)) * 100);
            const isCurrent = current?.id === objective.id;
            return (
              <div
                key={objective.id}
                className="border px-3 py-2"
                style={{
                  borderColor: objective.completed ? 'rgba(143,240,210,0.32)' : isCurrent ? 'rgba(255,207,122,0.42)' : 'rgba(217,145,99,0.14)',
                  background: objective.completed ? 'rgba(143,240,210,0.05)' : isCurrent ? 'rgba(255,207,122,0.05)' : 'transparent',
                }}
              >
                <div className="flex items-start gap-2.5">
                  <span className="mt-0.5 shrink-0">
                    {objective.completed ? (
                      <CheckCircle2 size={18} style={{ color: '#8ff0d2' }} />
                    ) : (
                      <Circle size={18} style={{ color: isCurrent ? '#ffcf7a' : '#b08a72' }} />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="mono text-ui-sm text-mars-300/80">{String(index + 1).padStart(2, '0')}</span>
                      <span className={`text-ui-lg ${objective.completed ? 'text-mars-200/65 line-through' : 'text-mars-100'}`}>{objective.label}</span>
                      {!objective.required && <span className="chip !py-0 !text-ui-xs">OPTIONAL</span>}
                      {(objective.count ?? 1) > 1 && (
                        <span className="mono text-ui-xs text-mars-200/65">{Math.min(objective.progress, objective.count ?? 1)}/{objective.count}</span>
                      )}
                    </div>
                    <div className="text-ui-md leading-relaxed text-mars-200/65">{objective.detail}</div>
                    {!objective.completed && pct > 0 && (objective.count ?? 1) > 1 && (
                      <div className="mt-1.5"><Meter value={pct} color="#ffcf7a" height={3} warn={-1} /></div>
                    )}
                    {isCurrent && objective.hint && (
                      <div className="mt-1.5 border-l-2 pl-2 text-ui-sm leading-relaxed text-warn/80" style={{ borderColor: '#ffb35c' }}>
                        {objective.hint}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Metric label="ELAPSED" value={formatClock(mission.elapsed)} />
          <Metric label="DISTANCE" value={`${Math.round(mission.distanceWalked)} m`} />
          <Metric label="TO CAMP" value={`${Math.round(telemetry.campDistance)} m`} />
          <Metric label="INCIDENTS" value={String(mission.incidents)} warn={mission.incidents > 0} />
        </div>
      </div>

      <div className="space-y-4">
        <div className="glass p-3">
          <div className="label">ACTIVE GUIDANCE</div>
          <div className="mt-1 text-ui-lg leading-relaxed text-mars-100/75">
            {hint?.text ?? current?.hint ?? current?.detail ?? 'All required objectives are complete. Return to Base Camp A.'}
          </div>
          {navigation.destination && (
            <div className="mt-2 flex items-center justify-between border-t pt-2" style={{ borderColor: 'rgba(217,145,99,0.16)' }}>
              <span className="mono text-ui-sm text-mars-200/65">{navigation.destinationLabel}</span>
              <span className="mono text-ui-md text-signal">{telemetry.destinationDistance !== null ? `${Math.round(telemetry.destinationDistance)} m` : '—'}</span>
            </div>
          )}
          <button className="btn btn-ghost mt-2 w-full !py-1.5 !text-ui-sm" onClick={() => openPanel('map')}>
            <MapIcon size={16} /> OPEN WRIST MAP
          </button>
        </div>

        <div>
          <SectionTitle right={<span className="mono text-ui-sm text-mars-200/65">{events.length} EVENTS</span>}>FIELD LOG</SectionTitle>
          <div className="space-y-1">
            {recent.length === 0 && <div className="text-ui-md text-mars-200/65">No events recorded yet.</div>}
            {recent.map((event) => (
              <div key={event.id} className="border-l-2 py-1 pl-2" style={{ borderColor: LEVEL_COLOR[event.risk] ?? '#b08a72' }}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-ui-md text-mars-100/85">{event.title}</span>
                  <span className="mono text-ui-xs text-mars-200/65">{new Date(event.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="line-clamp-2 text-ui-sm leading-relaxed text-mars-200/65">{event.detail}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value, warn = false }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="border px-2.5 py-2" style={{ borderColor: 'rgba(217,145,99,0.18)' }}>
      <div className="label !text-ui-xs">{label}</div>
      <div className="mono mt-0.5 text-sm" style={{ color: warn ? '#ff6b57' : '#f4dfcc' }}>{value}</div>
    </div>
  );
}

/* ----------------------------------------------------------------- inventory */

type InventoryTab = 'samples' | 'photos' | 'observations';

export function InventoryContent() {
  const [tab, setTab] = useState<InventoryTab>('samples');
  const samples = useGameStore((s) => s.samples);
  const photos = useGameStore((s) => s.photos);
  const observations = useGameStore((s) => s.observations);
  const resources = useGameStore((s) => s.resources);
  const addAlert = useGameStore((s) => s.addAlert);

  const used = resources.inventoryUsed;
  const capacity = resources.inventoryCapacity;

  return (
    <div className="p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <ChipTab active={tab === 'samples'} onClick={() => setTab('samples')} icon={<FlaskConical size={16} />} label={`SAMPLES ${samples.length}`} />
          <ChipTab active={tab === 'photos'} onClick={() => setTab('photos')} icon={<ImageIcon size={16} />} label={`IMAGES ${photos.length}`} />
          <ChipTab active={tab === 'observations'} onClick={() => setTab('observations')} icon={<NotebookPen size={16} />} label={`OBSERVATIONS ${observations.length}`} />
        </div>
        <div className="w-full max-w-xs">
          <div className="flex items-center justify-between">
            <span className="label">SAMPLE BAY</span>
            <span className="mono text-ui-md text-mars-100/75">{used} / {capacity} units</span>
          </div>
          <div className="mt-1"><Meter value={(used / Math.max(1, capacity)) * 100} color="#8ff0d2" warn={-1} /></div>
        </div>
      </div>

      <div className="mt-4">
        {tab === 'samples' && (
          samples.length === 0 ? (
            <EmptyState title="Sample bay empty" body="Scan and analyze a target, then collect a sealed sample. The protocol chain is recorded for each bag." />
          ) : (
            <div className="grid gap-2 md:grid-cols-2">
              {samples.map((sample) => (
                <div key={sample.id} className="border p-3" style={{ borderColor: 'rgba(217,145,99,0.2)' }}>
                  <div className="flex items-center justify-between">
                    <span className="mono text-ui-md text-signal">{sample.id}</span>
                    <DataChip kind={sample.dataClass} compact />
                  </div>
                  <div className="display mt-1 text-sm text-mars-100">{sample.name}</div>
                  <div className="mt-1 text-ui-md text-mars-200/65">{sample.type}</div>
                  <div className="mono mt-2 flex flex-wrap gap-x-3 gap-y-1 text-ui-sm text-mars-200/65">
                    <span>{sample.units} UNIT(S)</span>
                    <span>{sample.composition || 'COMPOSITION PENDING'}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between border-t pt-1.5 text-ui-sm" style={{ borderColor: 'rgba(217,145,99,0.14)' }}>
                    <span className="mono text-mars-200/65">AT {formatClock(sample.missionTime)} · {Math.round(sample.position.x)}, {Math.round(sample.position.z)}</span>
                    <span className="mono" style={{ color: sample.protocolFollowed ? '#8ff0d2' : '#ffb35c' }}>
                      {sample.protocolFollowed ? 'PROTOCOL CHAIN' : 'INCOMPLETE CHAIN'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {tab === 'photos' && (
          photos.length === 0 ? (
            <EmptyState title="No photographs" body="Select the camera tool and press E, or use the capture action inside an analysis panel. Each frame is labelled simulation data." />
          ) : (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {photos.map((photo) => (
                <div key={photo.id} className="border" style={{ borderColor: 'rgba(217,145,99,0.2)' }}>
                  <img src={photo.dataUrl} alt={photo.caption} className="aspect-video w-full object-cover" />
                  <div className="p-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="mono text-ui-sm text-signal">{photo.id}</span>
                      <DataChip kind={photo.dataClass} compact />
                    </div>
                    <div className="mt-1 line-clamp-2 text-ui-md leading-relaxed text-mars-100/75">{photo.caption}</div>
                    <div className="mono mt-1 flex justify-between text-ui-xs text-mars-200/65">
                      <span>{formatClock(photo.missionTime)}</span>
                      <span>{Math.round(photo.position.x)}, {Math.round(photo.position.z)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {tab === 'observations' && (
          observations.length === 0 ? (
            <EmptyState title="No observations" body="Analysis and observation actions append records here. Each entry states its confidence and data classification." />
          ) : (
            <div className="space-y-2">
              {[...observations].reverse().map((observation) => (
                <div key={observation.id} className="border p-3" style={{ borderColor: 'rgba(217,145,99,0.2)' }}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="mono text-ui-md text-signal">{observation.id}</span>
                      <span className="text-ui-lg text-mars-100">{observation.title}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="chip !py-0 !text-ui-xs">{observation.category}</span>
                      <DataChip kind={observation.dataClass} compact />
                    </div>
                  </div>
                  <p className="mt-1.5 text-ui-md leading-relaxed text-mars-100/65">{observation.text}</p>
                  <div className="mono mt-1.5 flex flex-wrap justify-between gap-2 text-ui-xs text-mars-200/65">
                    <span>T+{formatClock(observation.missionTime)}</span>
                    <span>{Math.round(observation.position.x)}, {Math.round(observation.position.z)}</span>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      <div className="mt-4 flex items-center justify-between border-t pt-3" style={{ borderColor: 'rgba(217,145,99,0.18)' }}>
        <div className="flex flex-wrap gap-1.5">
          <DataChip kind="simulation" compact />
          <span className="mono text-ui-sm text-mars-200/65">FIELD RECORDS ARE FICTIONAL TRAINING DATA</span>
        </div>
        <button className="btn btn-ghost !py-1.5 !text-ui-sm" onClick={() => addAlert('info', 'RECORD', 'Records are held in the local field terminal for this traverse.', 'record-note', 3000)}>
          <FileText size={16} /> RECORD NOTE
        </button>
      </div>
    </div>
  );
}

function ChipTab({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button className={`btn !py-1.5 ${active ? 'btn-primary' : 'btn-ghost'}`} onClick={onClick}>
      {icon} {label}
    </button>
  );
}

/* -------------------------------------------------------- planetary protection */

type PPTab = 'principles' | 'zones' | 'legal' | 'sources';

export function PPContent() {
  const pp = useGameStore((s) => s.pp);
  const acknowledgePP = useGameStore((s) => s.acknowledgePP);
  const reviewPrinciple = useGameStore((s) => s.reviewPrinciple);
  const openId = useGameStore((s) => s.ppOpenPrinciple);
  const setPPPrinciple = useGameStore((s) => s.setPPPrinciple);
  const updatePP = useGameStore((s) => s.adjustPP);
  const [tab, setTab] = useState<PPTab>(() => (openId && ZONE_BY_ID[openId] ? 'zones' : 'principles'));
  const [expanded, setExpanded] = useState<string | null>(() => (openId && !ZONE_BY_ID[openId] ? openId : openId && ZONE_BY_ID[openId] ? null : PROTECTION_PRINCIPLES[0].id));

  const scoreColor = pp.score >= 80 ? '#8ff0d2' : pp.score >= 55 ? '#ffcf7a' : '#ff6b57';
  const openZone = openId ? ZONE_BY_ID[openId] : null;

  const actions = useMemo(() => [...pp.actions].reverse().slice(0, 12), [pp.actions]);

  return (
    <div className="p-5">
      <div className="grid gap-3 lg:grid-cols-[1fr_280px]">
        <div className="border p-4" style={{ borderColor: 'rgba(143,240,210,0.22)', background: 'linear-gradient(120deg, rgba(24,44,38,0.35), rgba(20,12,10,0.4))' }}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="label" style={{ color: '#8ff0d2' }}>PLANETARY PROTECTION / FIELD PROTOCOL</div>
              <div className="display mt-1 text-lg text-mars-100">Observe more. Disturb less.</div>
              <p className="mt-1 max-w-2xl text-ui-md leading-relaxed text-mars-100/65">
                Four principles guide this traverse. Legal obligations and technical recommendations are kept distinct:
                a treaty binds States, while COSPAR policy and NASA standards translate the obligation into technical practice.
              </p>
            </div>
            <div className="text-right">
              <div className="mono text-3xl" style={{ color: scoreColor }}>{pp.score}</div>
              <div className="label">COMPLIANCE / 100</div>
            </div>
          </div>
          <div className="mt-3"><Meter value={pp.score} color={scoreColor} height={6} warn={-1} /></div>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
            <SmallMetric label="PRINCIPLES" value={`${pp.reviewedPrinciples.length}/4`} />
            <SmallMetric label="PROTOCOL" value={pp.protocolsAcknowledged ? 'ACTIVE' : 'REVIEW'} good={pp.protocolsAcknowledged} />
            <SmallMetric label="INCIDENTS" value={String(pp.incidents)} warn={pp.incidents > 0} />
            <SmallMetric label="OBSERVATIONS" value={String(pp.observationsInSensitiveZones)} />
            <SmallMetric label="RESTRICTED ENTRIES" value={String(pp.restrictedEntries)} warn={pp.restrictedEntries > 0} />
          </div>
        </div>
        <div className="border p-4" style={{ borderColor: 'rgba(217,145,99,0.2)' }}>
          <div className="label">ACKNOWLEDGE THE PROTOCOL</div>
          <p className="mt-1 text-ui-md leading-relaxed text-mars-200/65">
            Confirm that you will protect the environment, watch for special and uncertain regions, assess terrain before moving
            and follow mission protection measures.
          </p>
          <button className="btn btn-primary mt-2 w-full !py-2" onClick={acknowledgePP} disabled={pp.protocolsAcknowledged}>
            <ShieldCheck size={17} /> {pp.protocolsAcknowledged ? 'PROTOCOL ACTIVE' : 'ACKNOWLEDGE FOUR PRINCIPLES'}
          </button>
          <button
            className="btn btn-ghost mt-1 w-full !py-1.5 !text-ui-sm"
            onClick={() => updatePP(0, 'Protocol reviewed in the field terminal')}
          >
            <BookOpen size={16} /> LOG A REVIEW
          </button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        <ChipTab active={tab === 'principles'} onClick={() => setTab('principles')} icon={<ShieldCheck size={16} />} label="PRINCIPLES" />
        <ChipTab active={tab === 'zones'} onClick={() => setTab('zones')} icon={<ShieldAlert size={16} />} label="PRECAUTION ZONES" />
        <ChipTab active={tab === 'legal'} onClick={() => setTab('legal')} icon={<Scale size={16} />} label="LEGAL & TECHNICAL" />
        <ChipTab active={tab === 'sources'} onClick={() => setTab('sources')} icon={<Database size={16} />} label="DATA SOURCES" />
      </div>

      <div className="mt-3">
        {tab === 'principles' && (
          <div className="grid gap-2 lg:grid-cols-2">
            {PROTECTION_PRINCIPLES.map((principle) => {
              const reviewed = pp.reviewedPrinciples.includes(principle.id);
              const isOpen = expanded === principle.id;
              return (
                <div
                  key={principle.id}
                  className="border"
                  style={{
                    borderColor: reviewed ? 'rgba(143,240,210,0.34)' : 'rgba(217,145,99,0.2)',
                    background: isOpen ? 'rgba(28,22,16,0.72)' : 'rgba(17,10,8,0.42)',
                  }}
                >
                  <button
                    className="flex w-full items-start gap-3 px-3 py-2.5 text-left"
                    onClick={() => {
                      setExpanded(isOpen ? null : principle.id);
                      reviewPrinciple(principle.id);
                      setPPPrinciple(principle.id);
                    }}
                  >
                    <span className="mono mt-0.5 text-lg" style={{ color: reviewed ? '#8ff0d2' : '#d99163' }}>{String(principle.index).padStart(2, '0')}</span>
                    <span className="min-w-0 flex-1">
                      <span className="display block text-ui-lg tracking-wide text-mars-100">{principle.title}</span>
                      <span className="mt-0.5 block text-ui-sm leading-relaxed text-mars-200/65">{principle.objective}</span>
                    </span>
                    {reviewed ? <CheckCircle2 size={18} className="shrink-0" style={{ color: '#8ff0d2' }} /> : <Circle size={18} className="shrink-0 text-mars-300/80" />}
                  </button>
                  {isOpen && (
                    <div className="border-t px-3 pb-3 pt-2" style={{ borderColor: 'rgba(217,145,99,0.14)' }}>
                      <p className="text-ui-md leading-relaxed text-mars-100/65">{principle.summary}</p>
                      <ul className="mt-2 space-y-1">
                        {principle.measures.map((measure) => (
                          <li key={measure} className="flex gap-1.5 text-ui-sm leading-relaxed text-mars-200/65">
                            <span className="mt-1 h-1 w-1 shrink-0 bg-mars-300/60" /> {measure}
                          </li>
                        ))}
                      </ul>
                      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t pt-2" style={{ borderColor: 'rgba(217,145,99,0.14)' }}>
                        <span className="mono text-ui-xs leading-relaxed text-mars-200/65">{principle.source}</span>
                        <span className={`chip !py-0 !text-ui-xs ${principle.classification === 'legal obligation' ? 'chip-warn' : ''}`}>{principle.classification.toUpperCase()}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {tab === 'zones' && (
          <div className="grid gap-2 md:grid-cols-2">
            {ZONES.map((zone) => {
              const highlighted = openZone?.id === zone.id;
              const color = LEVEL_COLOR[zone.level] ?? '#d99163';
              return (
                <div
                  key={zone.id}
                  className="border p-3"
                  style={{
                    borderColor: highlighted ? `${color}99` : 'rgba(217,145,99,0.2)',
                    background: highlighted ? `${color}0d` : 'rgba(17,10,8,0.4)',
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="mono text-ui-sm tracking-[0.16em]" style={{ color }}>{zone.code}</div>
                      <div className="display mt-0.5 text-sm text-mars-100">{zone.name}</div>
                    </div>
                    <DataChip kind={zone.dataClass} compact />
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    <span className={`chip !py-0 !text-ui-xs ${zone.access === 'observe-only' ? 'chip-danger' : zone.access === 'restricted' ? 'chip-warn' : ''}`}>{zone.access.replace(/-/g, ' ').toUpperCase()}</span>
                    <span className="chip !py-0 !text-ui-xs">R {zone.radius} m</span>
                    {zone.categories.map((c) => <span key={c} className="chip !py-0 !text-ui-xs">{c}</span>)}
                  </div>
                  <p className="mt-2 text-ui-md leading-relaxed text-mars-100/65">{zone.description}</p>
                  <ul className="mt-2 space-y-1">
                    {zone.measures.map((measure) => (
                      <li key={measure} className="flex gap-1.5 text-ui-sm leading-relaxed text-mars-200/65">
                        <span className="mt-1 h-1 w-1 shrink-0" style={{ background: color }} /> {measure}
                      </li>
                    ))}
                  </ul>
                  <div className="mono mt-2 border-t pt-1.5 text-ui-xs leading-relaxed text-mars-200/65" style={{ borderColor: 'rgba(217,145,99,0.14)' }}>
                    SOURCE: {zone.source}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {tab === 'legal' && (
          <div className="space-y-2">
            <div className="border-l-2 p-3" style={{ borderColor: '#ffcf7a', background: 'rgba(92,57,19,0.12)' }}>
              <div className="label" style={{ color: '#ffcf7a' }}>LEGAL OBLIGATION VS TECHNICAL RECOMMENDATION</div>
              <p className="mt-1 text-ui-md leading-relaxed text-mars-100/65">
                The Outer Space Treaty is a binding instrument between States. COSPAR policy, NASA standards and handbooks are
                technical implementation guidance. This simulator translates both into field mechanics for education; it does not
                make legal determinations or certify compliance.
              </p>
            </div>
            {LEGAL_SOURCES.map((source) => (
              <div key={source.id} className="border p-3" style={{ borderColor: 'rgba(217,145,99,0.2)' }}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-ui-lg text-mars-100">{source.title}</div>
                    <div className="mono mt-0.5 text-ui-sm text-mars-200/65">{source.year} · {source.type.toUpperCase()}</div>
                  </div>
                  <a href={source.url} target="_blank" rel="noreferrer" className="btn btn-ghost !px-2 !py-1 !text-ui-xs">
                    SOURCE <ExternalLink size={15} />
                  </a>
                </div>
                <p className="mt-1.5 text-ui-md leading-relaxed text-mars-100/65">{source.relevance}</p>
                <div className="mt-1.5 text-ui-sm leading-relaxed text-mars-200/65">{source.note}</div>
              </div>
            ))}
          </div>
        )}

        {tab === 'sources' && (
          <div className="grid gap-3 lg:grid-cols-[1fr_1fr]">
            <div>
              <SectionTitle>REFERENCED ARCHIVES</SectionTitle>
              <div className="space-y-1.5">
                {DATA_SOURCES.map((source) => (
                  <div key={source.name} className="border p-2.5" style={{ borderColor: 'rgba(217,145,99,0.18)' }}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-ui-md text-mars-100">{source.name}</span>
                      <DataChip kind={source.dataClass} compact />
                    </div>
                    <div className="mono mt-0.5 text-ui-xs text-mars-200/65">{source.provider} · {source.types.join(' / ')}</div>
                    <div className="mt-1 text-ui-sm leading-relaxed text-mars-200/65">{source.status}</div>
                    <a href={source.url} target="_blank" rel="noreferrer" className="mono mt-1 inline-flex items-center gap-1 text-ui-xs text-ice/80 hover:underline">
                      OPEN REFERENCE <ExternalLink size={14} />
                    </a>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <SectionTitle>DATA CLASSIFICATION</SectionTitle>
              <div className="space-y-2">
                {REAL_VS_SIM.map((row) => (
                  <div key={row.id} className="glass p-3">
                    <DataChip kind={row.id as keyof typeof DATA_LABELS} />
                    <p className="mt-1.5 text-ui-md leading-relaxed text-mars-200/65">{row.body}</p>
                  </div>
                ))}
              </div>
              <div className="mt-3 border p-3" style={{ borderColor: 'rgba(255,107,87,0.3)' }}>
                <div className="flex items-center gap-2 text-danger">
                  <TriangleAlert size={17} />
                  <span className="mono text-ui-sm tracking-[0.14em]">SCIENTIFIC NOTICE</span>
                </div>
                <p className="mt-1.5 text-ui-sm leading-relaxed text-mars-200/65">{DISCLAIMER}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 grid gap-2 md:grid-cols-2">
        <div>
          <SectionTitle right={<ShieldAlert size={17} className="text-mars-300/80" />}>COMPLIANCE ACTIONS</SectionTitle>
          <div className="max-h-44 space-y-1 overflow-y-auto scroll-area pr-1">
            {actions.length === 0 && <div className="text-ui-md text-mars-200/65">No protocol actions recorded.</div>}
            {actions.map((action) => (
              <div key={action.id} className="flex items-center justify-between gap-2 border-b py-1 text-ui-sm" style={{ borderColor: 'rgba(217,145,99,0.12)' }}>
                <span className="text-mars-100/70">{action.label}</span>
                <span className="mono shrink-0" style={{ color: action.points >= 0 ? '#8ff0d2' : '#ff6b57' }}>{action.points >= 0 ? '+' : ''}{action.points}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <SectionTitle right={<Gauge size={17} className="text-mars-300/80" />}>PROTOCOL NOTES</SectionTitle>
          <div className="space-y-1.5 text-ui-sm leading-relaxed text-mars-200/65">
            <div>Observation-only regions: {ZONES.filter((z) => z.access === 'observe-only').map((z) => z.code).join(' · ') || 'none'}.</div>
            <div>Observation in a sensitive zone is a positive action. A blocked sampling attempt is logged as an incident.</div>
            <div>Unknown or ambiguous terrain is treated with the precautionary approach until evidence is sufficient.</div>
            <div>Data labels: <span style={{ color: '#8ff0d2' }}>REAL</span> · <span style={{ color: '#ffcf7a' }}>DERIVED</span> · <span style={{ color: '#8db7ff' }}>SIMULATION</span>.</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SmallMetric({ label, value, good = false, warn = false }: { label: string; value: string; good?: boolean; warn?: boolean }) {
  return (
    <div className="border px-2 py-1.5" style={{ borderColor: 'rgba(217,145,99,0.16)' }}>
      <div className="label !text-ui-2xs">{label}</div>
      <div className="mono mt-0.5 text-ui-md" style={{ color: warn ? '#ff6b57' : good ? '#8ff0d2' : '#f4dfcc' }}>{value}</div>
    </div>
  );
}

/* ------------------------------------------------------------- poi analysis */

export function AnalysisContent() {
  const poiId = useGameStore((s) => s.analysisPoiId);
  const analyzed = useGameStore((s) => s.analyzed);
  const scanned = useGameStore((s) => s.scanned);
  const collected = useGameStore((s) => s.collected);
  const telemetry = useGameStore((s) => s.telemetry);
  const resources = useGameStore((s) => s.resources);
  const analyzePoi = useGameStore((s) => s.analyzePoi);
  const collectSample = useGameStore((s) => s.collectSample);
  const addObservation = useGameStore((s) => s.addObservation);
  const addZoneObservation = useGameStore((s) => s.addZoneObservation);
  const closeAnalysis = useGameStore((s) => s.closeAnalysis);
  const setDestination = useGameStore((s) => s.setDestination);
  const openPanel = useGameStore((s) => s.openPanel);
  const setMapFocus = useGameStore((s) => s.setMapFocus);
  const addAlert = useGameStore((s) => s.addAlert);

  const poi = poiId ? POI_BY_ID[poiId] : null;
  if (!poi) return null;
  const zone = poi.zoneId ? ZONE_BY_ID[poi.zoneId] : zoneAt(poi.x, poi.z);
  const distance = Math.hypot(telemetry.position.x - poi.x, telemetry.position.z - poi.z);
  const isAnalyzed = analyzed[poi.id] !== undefined;
  const isScanned = scanned[poi.id] !== undefined;
  const isCollected = !!collected[poi.id];
  const observeOnly = zone?.access === 'observe-only';

  const capturePhoto = () => {
    const ok = runtimeBridge.api?.capturePhoto(poi.id) ?? false;
    if (!ok) addAlert('warning', 'CAMERA UNAVAILABLE', 'The runtime frame capture is not ready yet. Try again in a moment.', 'photo-api', 4000);
  };

  const observe = () => {
    if (poi.zoneId) addZoneObservation(poi.zoneId);
    else addObservation(poi.id);
  };

  const planRoute = () => {
    setDestination(poi.x, poi.z, poi.shortName, poi.id);
    setMapFocus(poi.id);
    closeAnalysis();
    window.setTimeout(() => openPanel('map'), 30);
  };

  return (
    <div className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="mono text-ui-md tracking-[0.2em]" style={{ color: '#d99163' }}>{poi.code} · {poi.type.toUpperCase()}</div>
          <div className="display mt-1 text-xl text-mars-100">{poi.name}</div>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <DataChip kind="simulation" compact />
            {isScanned && <span className="chip chip-signal !py-0 !text-ui-xs">SCANNED</span>}
            {isAnalyzed && <span className="chip chip-signal !py-0 !text-ui-xs">ANALYZED</span>}
            {isCollected && <span className="chip !py-0 !text-ui-xs">SAMPLE SEALED</span>}
            {observeOnly && <span className="chip chip-danger !py-0 !text-ui-xs">OBSERVE ONLY</span>}
          </div>
        </div>
        <div className="text-right">
          <div className="mono text-ui-md text-mars-200/65">{distance.toFixed(1)} m AWAY</div>
          <div className="mono mt-1 text-2xl" style={{ color: poi.analysis.interest === 'exceptional' ? '#8ff0d2' : '#ffcf7a' }}>{poi.analysis.confidence}<span className="text-xs text-mars-300/80">%</span></div>
          <div className="label">CONFIDENCE</div>
        </div>
      </div>

      <div className="mt-3"><Meter value={poi.analysis.confidence} color={poi.analysis.interest === 'exceptional' ? '#8ff0d2' : '#ffcf7a'} height={5} warn={-1} /></div>

      <div className="mt-4 grid gap-4 md:grid-cols-[1.15fr_0.85fr]">
        <div>
          <SectionTitle right={<Microscope size={17} className="text-mars-300/80" />}>FIELD ANALYSIS</SectionTitle>
          <div className="space-y-2 text-ui-lg leading-relaxed text-mars-100/72">
            <div><span className="label mr-2">CLASS</span>{poi.analysis.classification}</div>
            <div><span className="label mr-2">FORMATION</span>{poi.analysis.formationType}</div>
            <div><span className="label mr-2">OBSERVED</span>{poi.analysis.observed}</div>
            <div><span className="label mr-2">INTERPRETATION</span>{poi.analysis.interpretation}</div>
          </div>
          <div className="mt-3">
            <SectionTitle>INDICATORS</SectionTitle>
            <div className="flex flex-wrap gap-1.5">
              {poi.analysis.indicators.map((indicator) => <span key={indicator} className="chip">{indicator}</span>)}
            </div>
          </div>
          <div className="mt-3 border-l-2 p-2.5" style={{ borderColor: observeOnly ? '#ffb35c' : '#8ff0d2', background: observeOnly ? 'rgba(92,57,19,0.16)' : 'rgba(28,74,64,0.14)' }}>
            <div className="label" style={{ color: observeOnly ? '#ffb35c' : '#8ff0d2' }}>PLANETARY PROTECTION NOTE</div>
            <p className="mt-1 text-ui-md leading-relaxed text-mars-100/70">{poi.analysis.ppNote}</p>
            {zone && (
              <div className="mono mt-1.5 border-t pt-1.5 text-ui-xs leading-relaxed text-mars-200/65" style={{ borderColor: 'rgba(217,145,99,0.16)' }}>
                {zone.code} · {zone.name} · {zone.access.toUpperCase()} · {zone.dataClass.toUpperCase()}
              </div>
            )}
          </div>
        </div>

        <div>
          <SectionTitle right={<Camera size={17} className="text-mars-300/80" />}>FIELD ACTIONS</SectionTitle>
          <div className="grid gap-1.5">
            {!isAnalyzed && (
              <button
                className="btn btn-primary !py-2"
                onClick={() => analyzePoi(poi.id)}
                disabled={resources.battery < RESOURCES.batteryAnalyze}
                title={resources.battery < RESOURCES.batteryAnalyze ? 'Insufficient battery' : 'Run the geological analyzer'}
              >
                <FlaskConical size={17} /> RUN ANALYZER <span className="mono text-ui-xs opacity-60">E</span>
              </button>
            )}
            {poi.canSample && (
              <button
                className="btn !py-2"
                onClick={() => collectSample(poi.id)}
                disabled={!isAnalyzed || isCollected || observeOnly || resources.inventoryUsed >= resources.inventoryCapacity}
                title={observeOnly ? 'Sampling is not permitted in an observation-only region.' : 'Collect a sealed sample'}
              >
                <Layers size={17} /> {isCollected ? 'SAMPLE SEALED' : observeOnly ? 'SAMPLING NOT PERMITTED' : 'COLLECT SAMPLE'}
              </button>
            )}
            <button className="btn !py-2" onClick={observe}>
              <NotebookPen size={17} /> {observeOnly ? 'RECORD PERIMETER OBSERVATION' : 'LOG OBSERVATION'}
            </button>
            <button className="btn !py-2" onClick={capturePhoto}>
              <Camera size={17} /> CAPTURE PHOTOGRAPH
            </button>
            <button className="btn btn-ghost !py-2" onClick={planRoute}>
              <Compass size={17} /> ROUTE TO TARGET
            </button>
            <button className="btn btn-ghost !py-2" onClick={closeAnalysis}>
              <ArrowRight size={17} /> RETURN TO TRAVERSE
            </button>
          </div>

          <div className="mt-3 glass p-3">
            <div className="label">PROTOCOL CHAIN</div>
            <div className="mt-1.5 space-y-1">
              <ChainStep done={isScanned} label="1 · SCAN" detail="Remote signature confirmed" />
              <ChainStep done={isAnalyzed} label="2 · ANALYZE" detail="Field triage and observation" />
              <ChainStep done={isCollected || !poi.canSample} label="3 · SAMPLE / OBSERVE" detail={poi.canSample ? 'Sealed material collected' : 'Observation-only target'} />
            </div>
          </div>

          <div className="mt-2 text-ui-sm leading-relaxed text-mars-200/65">
            {poi.description}
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t pt-3" style={{ borderColor: 'rgba(217,145,99,0.18)' }}>
        <div className="flex flex-wrap items-center gap-2">
          <DataChip kind="derived" compact />
          <span className="mono text-ui-xs text-mars-200/65">CONFIDENCE IS A TRAINING VALUE, NOT A LABORATORY MEASUREMENT</span>
        </div>
        <span className="mono text-ui-xs text-mars-200/65">BATTERY {Math.round(resources.battery)}% · INVENTORY {resources.inventoryUsed}/{resources.inventoryCapacity}</span>
      </div>
    </div>
  );
}

function ChainStep({ done, label, detail }: { done: boolean; label: string; detail: string }) {
  return (
    <div className="flex items-start gap-2">
      {done ? <CheckCircle2 size={17} className="mt-0.5 shrink-0" style={{ color: '#8ff0d2' }} /> : <Circle size={17} className="mt-0.5 shrink-0 text-mars-300/80" />}
      <div className="min-w-0">
        <div className="mono text-ui-sm" style={{ color: done ? '#8ff0d2' : 'rgba(232,186,150,0.88)' }}>{label}</div>
        <div className="text-ui-xs leading-relaxed text-mars-200/65">{detail}</div>
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- help panel */

export function HelpPanel() {
  return (
    <div className="grid gap-5 p-5 md:grid-cols-2">
      <div>
        <SectionTitle right={<BookOpen size={17} className="text-mars-300/80" />}>FIELD CONTROLS</SectionTitle>
        <div className="space-y-1">
          {CONTROL_HELP.map((row) => (
            <div key={row.keys} className="flex items-start gap-2.5 border-b py-1.5" style={{ borderColor: 'rgba(217,145,99,0.1)' }}>
              <span className="kbd w-24 shrink-0 justify-center">{row.keys}</span>
              <div className="min-w-0">
                <div className="text-ui-md text-mars-100">{row.action}</div>
                <div className="text-ui-sm leading-relaxed text-mars-200/65">{row.note}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-4">
        <div>
          <SectionTitle>FIELD METHOD</SectionTitle>
          <ol className="space-y-2 text-ui-md leading-relaxed text-mars-100/65">
            <li><span className="mono text-signal">01</span> Scan before you approach. The scanner reveals contacts inside 85 m.</li>
            <li><span className="mono text-signal">02</span> Analyze at close range. Analysis creates a field observation.</li>
            <li><span className="mono text-signal">03</span> Sample only after analysis. Scan → analyze → sample preserves the record chain.</li>
            <li><span className="mono text-signal">04</span> Plan the line. Compare safest, balanced and scientific routes.</li>
            <li><span className="mono text-signal">05</span> Observe uncertain regions. Do not sample observation-only terrain.</li>
          </ol>
        </div>
        <div>
          <SectionTitle>DATA LABELS</SectionTitle>
          {(Object.keys(DATA_LABELS) as Array<keyof typeof DATA_LABELS>).map((key) => (
            <div key={key} className="mb-1.5 glass px-3 py-2">
              <DataChip kind={key} compact />
              <p className="mt-1 text-ui-sm leading-relaxed text-mars-200/65">
                {key === 'real'
                  ? 'Published datasets and archives. No NASA raster tiles are bundled in this offline build.'
                  : key === 'derived'
                    ? 'Computed from the procedural height field: slope, elevation, thermal model and routes.'
                    : 'Scenario values authored for the game: reserves, boundaries, signatures and events.'}
              </p>
            </div>
          ))}
        </div>
        <p className="text-ui-sm leading-relaxed text-mars-200/65">{DISCLAIMER}</p>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------- wrappers */

export function MapPanel() {
  const closePanel = useGameStore((s) => s.closePanel);
  return (
    <PanelShell
      title="WRIST MAP"
      subtitle="OW / NAVIGATION"
      code="MAP · M"
      onClose={closePanel}
      width="max-w-[1400px]"
      accent="#8ff0d2"
      headerRight={<div className="flex items-center gap-1.5"><DataChip kind="derived" compact /><DataChip kind="simulation" compact /></div>}
    >
      <WristMapContent />
    </PanelShell>
  );
}

export function ObjectivesPanel() {
  const closePanel = useGameStore((s) => s.closePanel);
  return (
    <PanelShell title="OBJECTIVES" subtitle="OW / MISSION CONTROL" code="TAB" onClose={closePanel} width="max-w-5xl">
      <ObjectivesContent />
    </PanelShell>
  );
}

export function InventoryPanel() {
  const closePanel = useGameStore((s) => s.closePanel);
  return (
    <PanelShell title="FIELD INVENTORY" subtitle="OW / SAMPLE BAY" code="I" onClose={closePanel} width="max-w-5xl" accent="#9fd8e8">
      <InventoryContent />
    </PanelShell>
  );
}

export function PPPanel() {
  const closePanel = useGameStore((s) => s.closePanel);
  return (
    <PanelShell title="PLANETARY PROTECTION" subtitle="OW / FIELD PROTOCOL" code="P" onClose={closePanel} width="max-w-6xl" accent="#8ff0d2">
      <PPContent />
    </PanelShell>
  );
}

export function HelpPanelWrapper() {
  const closePanel = useGameStore((s) => s.closePanel);
  return (
    <PanelShell title="FIELD MANUAL" subtitle="OW / OPERATIONS" code="H" onClose={closePanel} width="max-w-4xl">
      <HelpPanel />
    </PanelShell>
  );
}

export function SettingsPanel() {
  const closePanel = useGameStore((s) => s.closePanel);
  return (
    <PanelShell title="SYSTEM SETTINGS" subtitle="OW / CONFIGURATION" onClose={closePanel} width="max-w-3xl">
      <SettingsContent />
    </PanelShell>
  );
}

export function AnalysisPanel() {
  const closeAnalysis = useGameStore((s) => s.closeAnalysis);
  const poiId = useGameStore((s) => s.analysisPoiId);
  const poi = poiId ? POI_BY_ID[poiId] : null;
  if (!poi) return null;
  return (
    <PanelShell title={poi.name} subtitle="OW / GEOLOGICAL ANALYZER" code={poi.code} onClose={closeAnalysis} width="max-w-3xl" accent="#ffcf7a" headerRight={<DataChip kind="simulation" compact />}>
      <AnalysisContent />
    </PanelShell>
  );
}

/* ------------------------------------------------------------------- pause */

export function PauseScreen() {
  const phase = useGameStore((s) => s.phase);
  const panel = useGameStore((s) => s.activePanel);
  if (phase !== 'paused') return null;
  if (panel === 'settings') return <SettingsPanel />;
  if (panel === 'objectives') return <ObjectivesPanel />;
  if (panel === 'map') return <MapPanel />;
  if (panel === 'inventory') return <InventoryPanel />;
  if (panel === 'pp') return <PPPanel />;
  if (panel === 'help') return <HelpPanelWrapper />;
  return <PauseMenu />;
}

function PauseMenu() {
  const mission = useGameStore((s) => s.mission);
  const resources = useGameStore((s) => s.resources);
  const resumeGame = useGameStore((s) => s.resumeGame);
  const openPanel = useGameStore((s) => s.openPanel);
  const returnToMenu = useGameStore((s) => s.returnToMenu);
  const restartMission = useGameStore((s) => s.restartMission);
  const finishMission = useGameStore((s) => s.finishMission);
  const saveNow = useGameStore((s) => s.saveNow);
  const decide = useGameStore((s) => s.settings);
  const [confirm, setConfirm] = useState<'abort' | 'restart' | null>(null);

  return (
    <PanelShell
      title="TRAVERSE PAUSED"
      subtitle="OW / FIELD TERMINAL"
      code={mission?.code ?? 'OW'}
      onClose={resumeGame}
      width="max-w-2xl"
      headerRight={<span className="mono text-ui-sm text-mars-200/65">SIMULATION HELD</span>}
    >
      <div className="p-5">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b pb-3" style={{ borderColor: 'rgba(217,145,99,0.16)' }}>
          <div>
            <div className="label">{mission ? `${mission.code} · ACTIVE TRAVERSE` : 'NO ACTIVE TRAVERSE'}</div>
            <div className="display mt-1 text-lg text-mars-100">{mission?.name ?? 'Olympus Walk'}</div>
          </div>
          <div className="mono text-right text-ui-sm leading-relaxed text-mars-200/65">
            <div>{formatDuration(mission?.elapsed ?? 0)} ELAPSED</div>
            <div>{Math.round(mission?.distanceWalked ?? 0)} m WALKED</div>
            <div>O2 {Math.round(resources.oxygen)}% · PWR {Math.round(resources.battery)}%</div>
          </div>
        </div>

        <div className="mt-4 grid gap-1.5 sm:grid-cols-2">
          <button className="btn btn-primary !justify-start !py-2.5 sm:col-span-2" onClick={resumeGame}>
            <Play size={18} /> RESUME TRAVERSE
          </button>
          <button className="btn !justify-start" onClick={() => openPanel('map')}><MapIcon size={17} /> WRIST MAP</button>
          <button className="btn !justify-start" onClick={() => openPanel('objectives')}><CheckCircle2 size={17} /> OBJECTIVES</button>
          <button className="btn !justify-start" onClick={() => openPanel('inventory')}><FlaskConical size={17} /> INVENTORY</button>
          <button className="btn !justify-start" onClick={() => openPanel('pp')}><ShieldCheck size={17} /> PLANETARY PROTECTION</button>
          <button className="btn !justify-start" onClick={() => openPanel('settings')}><SettingsIcon size={17} /> SETTINGS</button>
          <button className="btn !justify-start" onClick={() => openPanel('help')}><BookOpen size={17} /> FIELD MANUAL</button>
        </div>

        <div className="mt-4 border-t pt-3" style={{ borderColor: 'rgba(217,145,99,0.16)' }}>
          <div className="label mb-2">TRAVERSE CONTROL</div>
          <div className="grid gap-1.5 sm:grid-cols-2">
            <button className="btn btn-ghost !justify-start" onClick={() => { saveNow(); returnToMenu(); }}>
              <Pause size={17} /> SAVE & EXIT TO MENU
            </button>
            <button
              className="btn btn-danger !justify-start"
              onClick={() => {
                if (confirm === 'abort') finishMission('aborted');
                else setConfirm('abort');
              }}
            >
              <TriangleAlert size={17} /> {confirm === 'abort' ? 'CONFIRM ABORT — END TRAVERSE' : 'ABORT TRAVERSE'}
            </button>
            <button
              className="btn btn-danger !justify-start sm:col-span-2"
              onClick={() => {
                if (confirm === 'restart') restartMission();
                else setConfirm('restart');
              }}
            >
              <RotateCcw size={17} /> {confirm === 'restart' ? 'CONFIRM RESTART — LOSE CURRENT PROGRESS' : 'RESTART MISSION FROM CAMP'}
            </button>
          </div>
          <div className="mono mt-2 text-ui-xs leading-relaxed tracking-[0.1em] text-mars-200/65">
            {decide.quality.toUpperCase()} QUALITY · HUD {Math.round(decide.hudScale * 100)}% · {decide.muted ? 'AUDIO MUTED' : `VOLUME ${Math.round(decide.volume * 100)}%`}
          </div>
        </div>
      </div>
    </PanelShell>
  );
}
