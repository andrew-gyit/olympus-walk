import { create } from 'zustand';
import { CAMERA, PLAYER, RESOURCES, WORLD, touchHint } from '../game/config';
import { POIS, POI_BY_ID } from '../game/data/pois';
import { ZONE_BY_ID, zoneAt } from '../game/data/zones';
import { MISSIONS, MISSION_BY_ID } from '../game/data/missions';
import { terrainGenerator } from '../world/TerrainGenerator';
import { routePlanner } from '../game/navigation/RoutePlanner';
import {
  applyObjectiveEvent,
  buildMissionReport,
  canCompleteAtCamp,
  completeMissionAtCamp,
  createMissionRuntime,
  failMission,
  missionDefinition,
  updateReturnAvailability,
  type ObjectiveEvent,
} from '../game/missions/MissionManager';
import { SaveManager, type ProgressData } from '../game/core/SaveManager';
import { inputManager } from '../game/player/InputManager';
import type {
  AlertMessage,
  CameraMode,
  EnvironmentState,
  GameEvent,
  HintState,
  InteractionTarget,
  MapLayer,
  MissionReport,
  MissionRuntime,
  NavigationState,
  Observation,
  PanelId,
  Photo,
  PlanetaryProtectionState,
  POI,
  PrecautionZone,
  RiskLevel,
  Sample,
  ScanState,
  Settings,
  SuitResources,
  Telemetry,
  ToolId,
  Vec3,
} from '../game/types';

const uid = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

const initialResources = (): SuitResources => ({
  oxygen: RESOURCES.oxygenStart,
  battery: RESOURCES.batteryStart,
  suitIntegrity: RESOURCES.suitStart,
  thermal: RESOURCES.thermalStart,
  physical: RESOURCES.physicalStart,
  communication: RESOURCES.commStart,
  inventoryUsed: 0,
  inventoryCapacity: RESOURCES.inventoryCapacity,
});

const initialEnvironment = (): EnvironmentState => ({
  ambientTempC: -61,
  windMs: 6.2,
  windGust: 2.1,
  dust: 0.32,
  solarFlux: 0.43,
  radiationUSvH: 0.28,
  pressureKPa: 0.61,
  dustStorm: false,
  stormIntensity: 0,
  timeOfSol: 0.42,
  sunriseIn: 11640,
});

const initialPP = (): PlanetaryProtectionState => ({
  score: 85,
  incidents: 0,
  observationsInSensitiveZones: 0,
  protocolsAcknowledged: false,
  reviewedPrinciples: [],
  actions: [],
  restrictedEntries: 0,
  lastZoneId: null,
});

const initialNavigation = (): NavigationState => ({
  destination: null,
  destinationLabel: '',
  destinationPoiId: null,
  routes: [],
  selectedRouteId: null,
  selectedRoute: null,
  planning: false,
  autoPilotGuidance: true,
});

const initialTelemetry = (): Telemetry => ({
  position: {
    x: WORLD.spawn.x,
    y: terrainGenerator.height(WORLD.spawn.x, WORLD.spawn.z) + PLAYER.eyeHeight,
    z: WORLD.spawn.z,
  },
  heading: 0,
  speed: 0,
  slope: 0,
  elevation: terrainGenerator.height(WORLD.spawn.x, WORLD.spawn.z),
  onGround: true,
  campDistance: Math.hypot(WORLD.spawn.x, WORLD.spawn.z),
  destinationDistance: null,
  commQuality: 100,
  insideZoneId: null,
  nearbyPoiId: null,
  targetPoiId: null,
  fps: 60,
});

const initialScan = (): ScanState => ({
  active: false,
  pulse: 0,
  layer: 'slope',
  results: [],
  startedAt: 0,
  lastScanAt: 0,
  cooldown: 0,
});

const progress = SaveManager.loadProgress();
const savedSettings = SaveManager.loadSettings();

const defaultLayers: Record<MapLayer, boolean> = {
  elevation: true,
  slope: false,
  surface: false,
  temperature: false,
  minerals: true,
  radiation: false,
  hazards: true,
};

export interface TeleportRequest {
  x: number;
  y: number;
  z: number;
  heading: number;
  nonce: number;
}

interface GameStore {
  phase: 'boot' | 'menu' | 'mission-select' | 'briefing' | 'playing' | 'paused' | 'report';
  activePanel: PanelId;
  engineReady: boolean;
  bootProgress: number;
  bootMessage: string;
  sessionNonce: number;

  mission: MissionRuntime | null;
  report: MissionReport | null;
  reports: MissionReport[];
  unlocked: string[];
  hasSave: boolean;

  resources: SuitResources;
  environment: EnvironmentState;
  telemetry: Telemetry;
  alerts: AlertMessage[];
  events: GameEvent[];
  hint: HintState | null;

  interaction: InteractionTarget | null;
  analysisPoiId: string | null;
  scan: ScanState;
  scanFlash: number;
  photoFlash: number;

  samples: Sample[];
  photos: Photo[];
  observations: Observation[];
  scanned: Record<string, number>;
  analyzed: Record<string, number>;
  collected: Record<string, boolean>;
  reached: Record<string, number>;

  navigation: NavigationState;
  pp: PlanetaryProtectionState;
  mapLayers: Record<MapLayer, boolean>;
  scanLayer: MapLayer;
  mapFocus: string | null;
  ppOpenPrinciple: string | null;

  tool: ToolId;
  cameraMode: CameraMode;
  settings: Settings;
  touchMode: boolean;
  showControls: boolean;

  teleportRequest: TeleportRequest | null;
  lastSavedAt: number;
  missionStartResources: { oxygen: number; battery: number };
  currentZoneId: string | null;
  stormWarningIssued: boolean;

  // lifecycle
  bootComplete: () => void;
  setPhase: (phase: GameStore['phase']) => void;
  openPanel: (panel: PanelId) => void;
  closePanel: () => void;
  pauseGame: () => void;
  resumeGame: () => void;
  startMission: (id: string) => void;
  restartMission: () => void;
  returnToMenu: () => void;
  finishMission: (outcome: 'complete' | 'failed' | 'aborted') => void;
  clearReport: () => void;
  continueGame: () => void;
  saveNow: () => void;
  unlockAllMissions: () => void;

  // simulation
  tickMission: (dt: number) => void;
  updateTelemetry: (patch: Partial<Telemetry>) => void;
  updateResources: (patch: Partial<SuitResources>) => void;
  updateEnvironment: (patch: Partial<EnvironmentState>) => void;
  addDistance: (meters: number) => void;
  checkCampAndReach: () => void;
  registerZoneEntry: (zone: PrecautionZone | null) => void;
  recordRiskAvoided: () => void;
  logIncident: (title: string, detail: string, ppPoints?: number) => void;
  failFromResources: (reason: string) => void;

  // alerts/events/hints
  addAlert: (level: RiskLevel, title: string, message: string, code?: string, ttl?: number) => void;
  expireAlerts: (now: number) => void;
  addEvent: (event: Omit<GameEvent, 'id' | 'time'>) => void;
  setHint: (text: string, durationMs?: number) => void;
  clearHint: () => void;

  // interaction
  setInteraction: (target: InteractionTarget | null) => void;
  interactWithPoi: (poiId: string) => void;
  inspectPoi: (poi: POI) => void;
  analyzePoi: (poiId: string) => void;
  collectSample: (poiId: string) => void;
  addObservation: (poiId: string, text?: string) => void;
  addZoneObservation: (zoneId: string) => void;
  addPhoto: (dataUrl: string, poiId?: string, caption?: string) => void;
  closeAnalysis: () => void;
  markReached: (poiId: string) => void;

  // scanner/tools
  triggerScan: () => void;
  setScanLayer: (layer: MapLayer) => void;
  setTool: (tool: ToolId) => void;
  cycleTool: () => void;
  setCameraMode: (mode: CameraMode) => void;
  toggleCameraMode: () => void;

  // navigation/map
  toggleMapLayer: (layer: MapLayer) => void;
  setDestination: (x: number, z: number, label: string, poiId?: string | null) => void;
  selectRoute: (id: 'safest' | 'balanced' | 'scientific') => void;
  clearRoute: () => void;
  focusMap: (poiId: string | null) => void;
  setMapFocus: (poiId: string | null) => void;

  // planetary protection
  acknowledgePP: () => void;
  reviewPrinciple: (id: string) => void;
  setPPPrinciple: (id: string | null) => void;
  adjustPP: (points: number, label: string, incident?: boolean) => void;

  // settings/misc
  updateSettings: (patch: Partial<Settings>) => void;
  setTouchMode: (touch: boolean) => void;
  setShowControls: (show: boolean) => void;
  setFps: (fps: number) => void;
  emitObjectiveEvent: (event: ObjectiveEvent) => void;
}

function withObjectiveOutcome(
  state: GameStore,
  nextMission: MissionRuntime,
  completed: string[],
  set: (partial: Partial<GameStore> | ((s: GameStore) => Partial<GameStore>)) => void,
  get: () => GameStore
) {
  if (completed.length === 0) {
    set({ mission: nextMission });
    return;
  }
  const completedObjectives = nextMission.objectives.filter((o) => completed.includes(o.id));
  const remaining = nextMission.objectives.filter((o) => o.required && !o.completed && o.type !== 'return');
  set({ mission: nextMission });
  completedObjectives.forEach((objective) => {
    get().addAlert('success', 'OBJECTIVE COMPLETE', objective.label, `obj-${objective.id}`, 4200);
    get().addEvent({
      type: 'objective',
      title: 'Objective complete',
      detail: objective.label,
      category: 'mission',
      risk: 'info',
    });
  });
  if (remaining.length === 0 && canCompleteAtCamp(nextMission)) {
    get().addAlert('info', 'ALL OBJECTIVES COMPLETE', 'Return to Base Camp A to close the traverse.', 'return-ready', 8000);
    get().setHint('All required objectives complete. Return to Base Camp A.', 12000);
  } else if (nextMission.id === 'first-steps') {
    const next = nextMission.objectives.find((o) => o.required && !o.completed && o.type !== 'return');
    if (next) get().setHint(next.hint ?? next.detail, 9000);
  }
}

export const useGameStore = create<GameStore>((set, get) => ({
  phase: 'boot',
  activePanel: null,
  engineReady: false,
  bootProgress: 0,
  bootMessage: 'PRESSURIZING FIELD SYSTEMS',
  sessionNonce: 0,

  mission: null,
  report: null,
  reports: progress.reports,
  unlocked: progress.unlocked.includes('first-steps') ? progress.unlocked : ['first-steps', ...progress.unlocked],
  hasSave: SaveManager.hasSave(),

  resources: initialResources(),
  environment: initialEnvironment(),
  telemetry: initialTelemetry(),
  alerts: [],
  events: [],
  hint: null,

  interaction: null,
  analysisPoiId: null,
  scan: initialScan(),
  scanFlash: 0,
  photoFlash: 0,

  samples: [],
  photos: [],
  observations: [],
  scanned: {},
  analyzed: {},
  collected: {},
  reached: {},

  navigation: initialNavigation(),
  pp: initialPP(),
  mapLayers: { ...defaultLayers },
  scanLayer: 'slope',
  mapFocus: null,
  ppOpenPrinciple: null,

  tool: 'scanner',
  cameraMode: 'third',
  settings: savedSettings,
  touchMode: false,
  showControls: false,

  teleportRequest: null,
  lastSavedAt: 0,
  missionStartResources: { oxygen: 100, battery: 100 },
  currentZoneId: null,
  stormWarningIssued: false,

  bootComplete: () => {
    set({ engineReady: true, bootProgress: 1, bootMessage: 'ZONE A READY' });
    setTimeout(() => {
      if (get().phase === 'boot') set({ phase: 'menu' });
    }, 300);
  },

  setPhase: (phase) => set({ phase }),

  openPanel: (panel) => {
    inputManager.releaseForUI();
    if (panel === 'map') {
      set({ activePanel: 'map', mapFocus: null });
      get().emitObjectiveEvent({ type: 'open-map' });
      return;
    }
    if (panel === 'pp') {
      set({ activePanel: 'pp' });
      return;
    }
    set({ activePanel: panel });
  },

  closePanel: () => {
    const phase = get().phase;
    set({
      activePanel: phase === 'paused' ? 'pause' : null,
      analysisPoiId: null,
      ppOpenPrinciple: null,
    });
    if (phase === 'playing') window.setTimeout(() => inputManager.requestLock(), 40);
  },

  pauseGame: () => {
    if (get().phase !== 'playing') return;
    inputManager.releaseForUI();
    set({ phase: 'paused', activePanel: 'pause', interaction: null });
    get().saveNow();
  },

  resumeGame: () => {
    if (get().phase !== 'paused') return;
    set({ phase: 'playing', activePanel: null });
    window.setTimeout(() => inputManager.requestLock(), 40);
  },

  startMission: (id) => {
    const def = MISSION_BY_ID[id] ?? MISSIONS[0];
    const now = Date.now();
    const mission = createMissionRuntime(def.id, now);
    const spawnH =
      def.id === 'first-steps' ? terrainGenerator.height(WORLD.spawn.x, WORLD.spawn.z) : terrainGenerator.height(0, 17);
    set({
      phase: 'playing',
      activePanel: null,
      report: null,
      mission,
      resources: initialResources(),
      environment: initialEnvironment(),
      telemetry: {
        ...initialTelemetry(),
        position: { x: WORLD.spawn.x, y: spawnH + PLAYER.eyeHeight, z: WORLD.spawn.z },
        elevation: spawnH,
        campDistance: 17,
      },
      alerts: [],
      events: [],
      hint: null,
      interaction: null,
      analysisPoiId: null,
      scan: initialScan(),
      samples: [],
      photos: [],
      observations: [],
      scanned: {},
      analyzed: {},
      collected: {},
      reached: {},
      navigation: initialNavigation(),
      pp: initialPP(),
      mapLayers: { ...defaultLayers },
      scanLayer: 'slope',
      tool: 'scanner',
      cameraMode: 'third',
      teleportRequest: { x: WORLD.spawn.x, y: spawnH, z: WORLD.spawn.z, heading: WORLD.spawn.heading, nonce: now },
      lastSavedAt: 0,
      missionStartResources: { oxygen: 100, battery: 100 },
      currentZoneId: null,
      stormWarningIssued: false,
      sessionNonce: get().sessionNonce + 1,
    });
    get().addAlert('info', `${def.code} · ${def.name}`, 'Traverse started. Check your suit reserves before moving.', 'mission-start', 7000);
    get().addEvent({
      type: 'mission-start',
      title: 'Mission started',
      detail: `${def.code} ${def.name}. ${def.description}`,
      category: 'mission',
      risk: 'info',
      position: { x: WORLD.spawn.x, y: spawnH + PLAYER.eyeHeight, z: WORLD.spawn.z },
    });
    const first = def.objectives.find((o) => o.required);
    if (first) get().setHint(touchHint(first.hint ?? first.detail, get().touchMode), 12000);
    setTimeout(() => get().saveNow(), 800);
    setTimeout(() => inputManager.requestLock(), 120);
  },

  restartMission: () => {
    const id = get().mission?.id ?? 'first-steps';
    SaveManager.clear();
    get().startMission(id);
  },

  returnToMenu: () => {
    if (get().phase === 'playing' || get().phase === 'paused') get().saveNow();
    inputManager.releaseLock();
    set({ phase: 'menu', activePanel: null, interaction: null, analysisPoiId: null, hint: null });
  },

  finishMission: (outcome) => {
    const state = get();
    if (!state.mission || state.phase === 'report') return;
    const now = Date.now();
    const base = outcome === 'complete' ? completeMissionAtCamp(state.mission, now) : state.mission;
    const mission = outcome === 'failed' ? failMission(base, now) : { ...base, status: outcome };
    const report = buildMissionReport({
      mission,
      resources: state.resources,
      samples: state.samples,
      photos: state.photos,
      observations: state.observations,
      scannedCount: Object.keys(state.scanned).length,
      analyzedCount: Object.keys(state.analyzed).length,
      pp: state.pp,
      events: state.events,
      outcome,
      now,
    });
    const progressData: ProgressData = {
      unlocked: state.unlocked,
      reports: [...state.reports, report].slice(-20),
      bestScores: { ...SaveManager.loadProgress().bestScores, [mission.id]: Math.max(report.totalScore, SaveManager.loadProgress().bestScores[mission.id] ?? 0) },
    };
    if (outcome === 'complete') {
      const def = MISSION_BY_ID[mission.id];
      const next = MISSIONS.find((m) => m.unlockAfter === def.id);
      if (next && !progressData.unlocked.includes(next.id)) {
        progressData.unlocked = [...progressData.unlocked, next.id];
        get().addAlert('success', 'NEW MISSION UNLOCKED', `${next.code} · ${next.name}`, 'unlock', 9000);
      }
    }
    // The traverse has closed for every outcome; never offer to resume a finished run.
    SaveManager.clear();
    SaveManager.saveProgress(progressData);
    set({
      mission,
      report,
      reports: progressData.reports,
      unlocked: progressData.unlocked,
      phase: 'report',
      activePanel: null,
      interaction: null,
      hint: null,
      hasSave: false,
    });
    get().addEvent({
      type: 'mission-end',
      title: `Mission ${outcome}`,
      detail: `${report.missionName}: ${report.totalScore}/100, grade ${report.grade}.`,
      category: 'mission',
      risk: outcome === 'complete' ? 'info' : 'warning',
    });
  },

  clearReport: () => set({ report: null }),

  continueGame: () => {
    const snap = SaveManager.load();
    if (!snap) {
      get().addAlert('warning', 'NO SAVE FOUND', 'Start a new mission.', 'no-save', 4000);
      return;
    }
    try {
      const def = missionDefinition(snap.missionId);
      const mission = createMissionRuntime(snap.missionId, Date.now() - snap.missionElapsed * 1000);
      mission.elapsed = snap.missionElapsed;
      mission.distanceWalked = snap.distanceWalked;
      mission.maxDistanceFromCamp = snap.maxDistanceFromCamp;
      mission.incidents = snap.incidents;
      mission.risksAvoided = snap.risksAvoided;
      mission.objectives = snap.objectives as MissionRuntime['objectives'];
      const pos = snap.position;
      set({
        phase: 'playing',
        activePanel: null,
        mission,
        report: null,
        resources: snap.resources as SuitResources,
        samples: snap.samples as Sample[],
        photos: snap.photos as Photo[],
        observations: snap.observations as Observation[],
        scanned: snap.scanned as Record<string, number>,
        analyzed: snap.analyzed as Record<string, number>,
        collected: snap.collected as Record<string, boolean>,
        pp: snap.pp as PlanetaryProtectionState,
        events: (snap.events as GameEvent[]) ?? [],
        environment: (snap.environment as EnvironmentState) ?? initialEnvironment(),
        navigation: (snap.navigation as NavigationState) ?? initialNavigation(),
        tool: 'scanner',
        cameraMode: 'third',
        telemetry: {
          ...initialTelemetry(),
          position: { x: pos.x, y: pos.y, z: pos.z },
          elevation: terrainGenerator.height(pos.x, pos.z),
        },
        teleportRequest: {
          x: pos.x,
          y: terrainGenerator.height(pos.x, pos.z),
          z: pos.z,
          heading: snap.heading,
          nonce: Date.now(),
        },
        lastSavedAt: Date.now(),
        sessionNonce: get().sessionNonce + 1,
      });
      get().addAlert('info', 'WALK RESTORED', `${def.code} · ${def.name}. Suit state reloaded.`, 'restored', 5000);
      window.setTimeout(() => inputManager.requestLock(), 140);
    } catch {
      get().addAlert('warning', 'SAVE COULD NOT BE RESTORED', 'The stored walk is incompatible. Start a new mission.', 'bad-save', 6000);
    }
  },

  saveNow: () => {
    const s = get();
    // Paused traverses must still persist so SAVE & EXIT and pause autosaves keep current progress.
    if (!s.mission || (s.phase !== 'playing' && s.phase !== 'paused')) return;
    const snapshot = {
      version: 1 as const,
      missionId: s.mission.id,
      savedAt: Date.now(),
      missionElapsed: s.mission.elapsed,
      objectives: s.mission.objectives,
      distanceWalked: s.mission.distanceWalked,
      maxDistanceFromCamp: s.mission.maxDistanceFromCamp,
      incidents: s.mission.incidents,
      risksAvoided: s.mission.risksAvoided,
      resources: s.resources,
      samples: s.samples.slice(0, 12),
      photos: s.photos.slice(-8).map((p) => ({ ...p, dataUrl: p.dataUrl })),
      observations: s.observations.slice(-30),
      scanned: s.scanned,
      analyzed: s.analyzed,
      collected: s.collected,
      pp: s.pp,
      events: s.events.slice(-40),
      position: s.telemetry.position,
      heading: s.telemetry.heading,
      cameraYaw: 0,
      cameraPitch: CAMERA.defaultPitch,
      navigation: { ...s.navigation, planning: false },
      environment: s.environment,
    };
    SaveManager.save(snapshot);
    set({ hasSave: true, lastSavedAt: Date.now() });
  },

  unlockAllMissions: () => {
    const all = MISSIONS.map((m) => m.id);
    const data = SaveManager.loadProgress();
    SaveManager.saveProgress({ ...data, unlocked: all });
    set({ unlocked: all });
  },

  tickMission: (dt) => {
    const s = get();
    if (!s.mission || s.phase !== 'playing') return;
    set({
      mission: {
        ...s.mission,
        elapsed: s.mission.elapsed + dt,
      },
    });
  },

  updateTelemetry: (patch) => {
    const prev = get().telemetry;
    const next = { ...prev, ...patch };
    const s = get();
    let mission = s.mission;
    if (mission && s.phase === 'playing') {
      const atCamp = next.campDistance <= WORLD.returnRadius;
      const updated = updateReturnAvailability(mission, atCamp);
      if (updated !== mission) mission = updated;
      if (atCamp && canCompleteAtCamp(mission) && mission.status === 'active') {
        set({ telemetry: next, mission });
        get().finishMission('complete');
        return;
      }
      if (atCamp && mission.status === 'active' && !mission.returnPrompt) {
        // Keep the return target visible but do not complete until objectives are done.
      }
    }
    set({ telemetry: next, mission });

    // Reach detection and mission objective updates.
    if (s.phase === 'playing') {
      for (const poi of POIS) {
        if (s.reached[poi.id]) continue;
        const d = Math.hypot(next.position.x - poi.x, next.position.z - poi.z);
        if (d <= poi.radius + 2.5) get().markReached(poi.id);
      }
      const zone = zoneAt(next.position.x, next.position.z);
      if ((zone?.id ?? null) !== s.currentZoneId) {
        get().registerZoneEntry(zone);
      }
    }
  },

  updateResources: (patch) => {
    const current = get().resources;
    const next = { ...current, ...patch };
    next.oxygen = clamp(next.oxygen, 0, 100);
    next.battery = clamp(next.battery, 0, 100);
    next.suitIntegrity = clamp(next.suitIntegrity, 0, 100);
    next.thermal = clamp(next.thermal, 0, 100);
    next.physical = clamp(next.physical, 0, 100);
    next.communication = clamp(next.communication, 0, 100);
    next.inventoryUsed = clamp(next.inventoryUsed, 0, next.inventoryCapacity);
    set({ resources: next });
  },

  updateEnvironment: (patch) => set({ environment: { ...get().environment, ...patch } }),

  addDistance: (meters) => {
    const s = get();
    if (!s.mission || s.phase !== 'playing' || meters <= 0) return;
    const d = s.mission.distanceWalked + meters;
    const maxD = Math.max(s.mission.maxDistanceFromCamp, s.telemetry.campDistance);
    let mission = { ...s.mission, distanceWalked: d, maxDistanceFromCamp: maxD };
    const { mission: nextMission, completed } = applyObjectiveEvent(mission, {
      type: 'walk',
      amount: meters,
    });
    withObjectiveOutcome(s, nextMission, completed, set, get);
    if (meters > 0.01) {
      const p = s.telemetry.position;
      const zone = zoneAt(p.x, p.z);
      if (zone && zone.access === 'traverse-with-care' && Math.random() < 0.015) {
        get().addEvent({
          type: 'zone-traverse',
          title: 'Precaution zone traverse',
          detail: `${zone.code} — ${zone.name}. ${zone.measures[0]}`,
          category: 'planetary',
          risk: zone.level === 'warning' ? 'warning' : 'caution',
          position: p,
          recommendation: zone.measures[0],
        });
      }
    }
  },

  checkCampAndReach: () => {
    const s = get();
    if (s.phase !== 'playing' || !s.mission) return;
    get().updateTelemetry({});
  },

  registerZoneEntry: (zone) => {
    const s = get();
    set({ currentZoneId: zone?.id ?? null });
    if (!zone) return;
    set({ pp: { ...s.pp, lastZoneId: zone.id } });
    get().emitObjectiveEvent({ type: 'enter-zone', target: zone.id });
    const dataNote =
      zone.dataClass === 'simulation'
        ? 'SIMULATION boundary — not an official special region.'
        : zone.dataClass === 'derived'
          ? 'Derived from the Zone A terrain model.'
          : 'Real-data reference.';
    get().addEvent({
      type: 'zone-entry',
      title: `${zone.code} · ${zone.name}`,
      detail: `${zone.description} ${dataNote}`,
      category: 'planetary',
      risk: zone.level,
      position: s.telemetry.position,
      recommendation: zone.measures[0],
    });
    if (zone.access === 'observe-only') {
      get().addAlert(
        'caution',
        'PLANETARY PROTECTION PRECAUTION',
        `${zone.name}: observation only. Do not sample or disturb the surface.`,
        `zone-${zone.id}`,
        9000
      );
      set({ pp: { ...get().pp, restrictedEntries: get().pp.restrictedEntries + 1 } });
    } else if (zone.access === 'traverse-with-care') {
      get().addAlert(
        zone.level === 'warning' ? 'warning' : 'caution',
        'PRECAUTION ZONE',
        `${zone.name}. ${zone.measures[0]}`,
        `zone-${zone.id}`,
        7000
      );
    }
  },

  recordRiskAvoided: () => {
    const s = get();
    if (!s.mission) return;
    set({ mission: { ...s.mission, risksAvoided: s.mission.risksAvoided + 1 } });
    get().addAlert('success', 'RISK MITIGATED', 'You left the steep ground. The safer line was chosen.', 'risk-avoided', 4200);
  },

  logIncident: (title, detail, ppPoints = -8) => {
    const s = get();
    if (!s.mission || s.phase === 'report') return;
    set({ mission: { ...s.mission, incidents: s.mission.incidents + 1 } });
    get().adjustPP(ppPoints, title, true);
    get().addAlert('warning', 'INCIDENT LOGGED', title, `incident-${uid('x')}`, 7000);
    get().addEvent({
      type: 'incident',
      title,
      detail,
      category: 'hazard',
      risk: 'warning',
      position: s.telemetry.position,
      recommendation: detail,
    });
  },

  failFromResources: (reason) => {
    const s = get();
    if (!s.mission || s.phase !== 'playing') return;
    get().addAlert('critical', 'MISSION ABORT', reason, 'mission-fail', 9000);
    get().addEvent({
      type: 'resource-failure',
      title: 'Life-support reserve exhausted',
      detail: reason,
      category: 'resources',
      risk: 'critical',
      position: s.telemetry.position,
      recommendation: 'Emergency return protocol. Mission ends with a safety failure.',
    });
    get().finishMission('failed');
  },

  addAlert: (level, title, message, code, ttl = 6000) => {
    const s = get();
    const now = Date.now();
    if (code) {
      const existing = s.alerts.find((a) => a.code === code && now - a.createdAt < Math.min(ttl, 3500));
      if (existing) return;
    }
    const alert: AlertMessage = {
      id: uid('alert'),
      level,
      title,
      message,
      code,
      ttl,
      createdAt: now,
    };
    set({ alerts: [...s.alerts, alert].slice(-5) });
  },

  expireAlerts: (now) => {
    const s = get();
    const remaining = s.alerts.filter((a) => now - a.createdAt < a.ttl);
    if (remaining.length !== s.alerts.length) set({ alerts: remaining });
  },

  addEvent: (event) => {
    const s = get();
    const full: GameEvent = { ...event, id: uid('evt'), time: Date.now() };
    set({ events: [...s.events, full].slice(-120) });
  },

  setHint: (text, durationMs = 7000) => {
    set({ hint: { id: uid('hint'), text, until: Date.now() + durationMs } });
  },

  clearHint: () => set({ hint: null }),

  setInteraction: (target) => {
    const current = get().interaction;
    if (current?.poiId === target?.poiId && current?.prompt === target?.prompt) return;
    set({ interaction: target });
  },

  interactWithPoi: (poiId) => {
    const poi = POI_BY_ID[poiId];
    if (!poi) return;
    const s = get();
    const dist = Math.hypot(s.telemetry.position.x - poi.x, s.telemetry.position.z - poi.z);
    if (dist > poi.radius + 4.5) {
      get().addAlert('warning', 'OUT OF RANGE', 'Move closer to the target to interact.', 'range', 3000);
      return;
    }
    const analyzed = !!s.analyzed[poiId];
    const collected = !!s.collected[poiId];

    if (s.tool === 'camera') {
      get().setHint('Camera ready. Aim the reticle and press E again after the frame is composed.', 3000);
      return;
    }

    if (poi.interaction === 'observe') {
      if (!analyzed) {
        get().analyzePoi(poiId);
        return;
      }
      if (poi.zoneId) get().addZoneObservation(poi.zoneId);
      else get().addObservation(poiId);
      return;
    }

    if (!analyzed) {
      get().analyzePoi(poiId);
      return;
    }
    if (poi.canSample && !collected) {
      get().collectSample(poiId);
      return;
    }
    get().inspectPoi(poi);
  },

  inspectPoi: (poi) => {
    get().addObservation(
      poi.id,
      `Field inspection: ${poi.shortName}. ${poi.analysis.observed} Context checked at ${Math.round(get().telemetry.elevation)} m elevation.`
    );
  },

  analyzePoi: (poiId) => {
    const poi = POI_BY_ID[poiId];
    if (!poi) return;
    const s = get();
    if (s.resources.battery < RESOURCES.batteryAnalyze) {
      get().addAlert('warning', 'INSUFFICIENT BATTERY', 'Return to camp to recharge before running the analyzer.', 'battery-analyze', 5000);
      return;
    }
    const now = Date.now();
    const firstAnalysis = !s.analyzed[poiId];
    const zone = poi.zoneId ? ZONE_BY_ID[poi.zoneId] : null;
    const newPp = { ...s.pp };
    if (firstAnalysis && s.scanned[poiId]) {
      newPp.score = clamp(newPp.score + 2, 0, 100);
      newPp.actions = [...newPp.actions, { id: uid('pp'), label: `Scanned before analysis: ${poi.code}`, points: 2, time: now }].slice(-40);
    }
    inputManager.releaseForUI();
    set({
      analyzed: { ...s.analyzed, [poiId]: now },
      analysisPoiId: poiId,
      resources: { ...s.resources, battery: clamp(s.resources.battery - RESOURCES.batteryAnalyze, 0, 100) },
      pp: newPp,
    });
    if (firstAnalysis) {
      get().emitObjectiveEvent({ type: 'analyze', target: poiId });
      get().addAlert('info', 'ANALYSIS COMPLETE', `${poi.code} · ${poi.shortName}. ${poi.analysis.confidence}% confidence.`, `analyze-${poiId}`, 6000);
      get().addEvent({
        type: 'analysis',
        title: `Analysis · ${poi.shortName}`,
        detail: `${poi.analysis.classification}. Indicators: ${poi.analysis.indicators.join(', ')}.`,
        category: 'science',
        risk: 'info',
        position: s.telemetry.position,
        recommendation: zone?.access === 'observe-only' ? zone.measures[0] : poi.analysis.ppNote,
      });
    }
    const observationText = `${poi.analysis.classification}. ${poi.analysis.observed} Interpretation: ${poi.analysis.interpretation}`;
    get().addObservation(poiId, observationText);
  },

  collectSample: (poiId) => {
    const poi = POI_BY_ID[poiId];
    if (!poi || !poi.canSample) return;
    const s = get();
    if (s.collected[poiId]) {
      get().addAlert('info', 'SAMPLE ALREADY COLLECTED', 'One sample per marked target in this training scenario.', 'sample-dup', 3500);
      return;
    }
    const units = poi.sampleUnits ?? 1;
    if (s.resources.inventoryUsed + units > s.resources.inventoryCapacity) {
      get().addAlert('warning', 'INVENTORY FULL', 'Seal the current load at camp before collecting more samples.', 'inventory-full', 5500);
      return;
    }
    if (!s.analyzed[poiId]) {
      get().addAlert('caution', 'PROTOCOL', 'Analyze or scan the target before collecting. The triage record must be complete.', 'sample-protocol', 5000);
      return;
    }
    const zone = poi.zoneId ? ZONE_BY_ID[poi.zoneId] : zoneAt(poi.x, poi.z);
    if (zone && zone.access === 'observe-only') {
      get().logIncident(
        'SAMPLE ATTEMPT IN SENSITIVE REGION',
        `${zone.name} is observation-only. The sample was not collected; the attempt is logged as a protocol incident.`,
        -14
      );
      set({
        pp: {
          ...get().pp,
          actions: [
            ...get().pp.actions,
            { id: uid('pp'), label: `Blocked sample attempt · ${zone.code}`, points: -14, time: Date.now() },
          ].slice(-40),
        },
      });
      return;
    }
    const now = Date.now();
    const protocolFollowed = !!s.scanned[poiId] && !!s.analyzed[poiId];
    const sample: Sample = {
      id: `SMP-${String(s.samples.length + 1).padStart(2, '0')}-${poi.code.slice(-3)}`,
      poiId,
      name: poi.name,
      type: poi.sampleType ?? poi.type,
      composition: poi.analysis.indicators.slice(0, 3).join(' · '),
      position: { ...s.telemetry.position },
      missionTime: s.mission?.elapsed ?? 0,
      units,
      protocolFollowed,
      dataClass: 'simulation',
    };
    const pp = { ...s.pp };
    if (protocolFollowed) {
      pp.score = clamp(pp.score + 3, 0, 100);
      pp.actions = [...pp.actions, { id: uid('pp'), label: `Protocol chain complete: ${poi.code}`, points: 3, time: now }].slice(-40);
    } else {
      pp.score = clamp(pp.score - 8, 0, 100);
      pp.incidents += 1;
      pp.actions = [...pp.actions, { id: uid('pp'), label: `Sample without scan: ${poi.code}`, points: -8, time: now }].slice(-40);
    }
    inputManager.releaseForUI();
    set({
      samples: [...s.samples, sample],
      collected: { ...s.collected, [poiId]: true },
      resources: { ...s.resources, inventoryUsed: s.resources.inventoryUsed + units },
      pp,
      analysisPoiId: poiId,
    });
    get().emitObjectiveEvent({ type: 'sample', target: poiId, amount: units });
    get().addAlert('success', 'SAMPLE SEALED', `${sample.id} · ${poi.sampleType}. ${protocolFollowed ? 'Protocol chain complete.' : 'Scan missing from chain.'}`, `sample-${poiId}`, 6500);
    get().addEvent({
      type: 'sample',
      title: `Sample collected · ${sample.id}`,
      detail: `${poi.name}. ${units} unit(s). Protocol ${protocolFollowed ? 'followed' : 'incomplete (no prior scan)'}.`,
      category: 'science',
      risk: protocolFollowed ? 'info' : 'caution',
      position: s.telemetry.position,
      recommendation: 'Seal the sample and keep it in the external sample bay until camp.',
    });
    if (protocolFollowed) get().addObservation(poiId, `Sample ${sample.id} collected after scanner and analyzer triage. Material logged as ${sample.type}.`);
  },

  addObservation: (poiId, text) => {
    const poi = POI_BY_ID[poiId];
    const s = get();
    if (!poi) return;
    const now = Date.now();
    const zone = poi.zoneId ? ZONE_BY_ID[poi.zoneId] : zoneAt(poi.x, poi.z);
    const observation: Observation = {
      id: `OBS-${String(s.observations.length + 1).padStart(2, '0')}`,
      poiId,
      zoneId: zone?.id,
      title: `${poi.code} · ${poi.shortName}`,
      text:
        text ??
        `${poi.analysis.observed} ${poi.analysis.interpretation} (${poi.analysis.confidence}% confidence, simulation record).`,
      position: { ...s.telemetry.position },
      missionTime: s.mission?.elapsed ?? 0,
      category: poi.type === 'deposit' ? 'mineralogy' : poi.type === 'crater' || poi.type === 'scarp' ? 'terrain' : 'geology',
      dataClass: 'simulation',
    };
    let pp = s.pp;
    if (zone?.access === 'observe-only') {
      pp = {
        ...pp,
        score: clamp(pp.score + 4, 0, 100),
        observationsInSensitiveZones: pp.observationsInSensitiveZones + 1,
        actions: [...pp.actions, { id: uid('pp'), label: `Observation in ${zone.code} instead of intervention`, points: 4, time: now }].slice(-40),
      };
    }
    set({ observations: [...s.observations, observation], pp });
    get().emitObjectiveEvent({ type: 'observation', target: poiId });
    if (zone) get().emitObjectiveEvent({ type: 'observe-zone', target: zone.id });
    get().addAlert('success', 'OBSERVATION LOGGED', `${observation.id} · ${poi.shortName}`, `obs-${poiId}-${s.observations.length}`, 3800);
    get().addEvent({
      type: 'observation',
      title: `Observation · ${poi.shortName}`,
      detail: observation.text,
      category: 'science',
      risk: 'info',
      position: s.telemetry.position,
    });
  },

  addZoneObservation: (zoneId) => {
    const zone = ZONE_BY_ID[zoneId];
    if (!zone) return;
    const s = get();
    const now = Date.now();
    const observation: Observation = {
      id: `OBS-${String(s.observations.length + 1).padStart(2, '0')}`,
      zoneId,
      title: `${zone.code} · perimeter observation`,
      text: `Observation from the marked perimeter: ${zone.description} No surface disturbance. Classification remains ${zone.type.toUpperCase()} in this training scenario; no sample or subsurface access.`,
      position: { ...s.telemetry.position },
      missionTime: s.mission?.elapsed ?? 0,
      category: 'planetary',
      dataClass: 'simulation',
    };
    const pp = {
      ...s.pp,
      score: clamp(s.pp.score + 4, 0, 100),
      observationsInSensitiveZones: s.pp.observationsInSensitiveZones + 1,
      actions: [...s.pp.actions, { id: uid('pp'), label: `Perimeter observation · ${zone.code}`, points: 4, time: now }].slice(-40),
    };
    set({ observations: [...s.observations, observation], pp });
    get().emitObjectiveEvent({ type: 'observation', target: zoneId });
    get().emitObjectiveEvent({ type: 'observe-zone', target: zoneId });
    get().addAlert('success', 'OBSERVATION LOGGED', `${observation.id} · ${zone.name}. Surface left undisturbed.`, `obs-zone-${zoneId}-${s.observations.length}`, 4500);
    get().addEvent({
      type: 'observation',
      title: `Observation · ${zone.code}`,
      detail: observation.text,
      category: 'planetary',
      risk: 'info',
      position: s.telemetry.position,
      recommendation: 'Observation-only protocol satisfied. Do not sample in an uncertain region.',
    });
  },

  addPhoto: (dataUrl, poiId, caption) => {
    const s = get();
    if (s.resources.battery < RESOURCES.batteryPhoto) {
      get().addAlert('warning', 'INSUFFICIENT BATTERY', 'The camera requires power. Return to camp or free capacity.', 'battery-photo', 4500);
      return;
    }
    const poi = poiId ? POI_BY_ID[poiId] : null;
    const photo: Photo = {
      id: `IMG-${String(s.photos.length + 1).padStart(2, '0')}`,
      poiId,
      caption: caption ?? `${poi ? poi.shortName : 'Field context'} · ${Math.round(s.telemetry.elevation)} m · heading ${Math.round(s.telemetry.heading)}°`,
      dataUrl,
      position: { ...s.telemetry.position },
      heading: s.telemetry.heading,
      missionTime: s.mission?.elapsed ?? 0,
      dataClass: 'simulation',
    };
    set({
      photos: [...s.photos, photo],
      photoFlash: s.photoFlash + 1,
      resources: { ...s.resources, battery: clamp(s.resources.battery - RESOURCES.batteryPhoto, 0, 100) },
    });
    get().emitObjectiveEvent({ type: 'photo', target: poiId });
    get().addAlert('success', 'IMAGE CAPTURED', `${photo.id} added to the scientific record.`, `photo-${photo.id}`, 4000);
    get().addEvent({
      type: 'photo',
      title: `Photograph · ${photo.id}`,
      detail: photo.caption,
      category: 'science',
      risk: 'info',
      position: s.telemetry.position,
    });
  },

  closeAnalysis: () => {
    set({ analysisPoiId: null });
    if (get().phase === 'playing') window.setTimeout(() => inputManager.requestLock(), 40);
  },

  markReached: (poiId) => {
    const poi = POI_BY_ID[poiId];
    if (!poi) return;
    const s = get();
    if (s.reached[poiId] !== undefined) return;
    set({ reached: { ...s.reached, [poiId]: Date.now() } });
    get().emitObjectiveEvent({ type: 'reach', target: poiId });
    get().addAlert('info', 'SITE REACHED', `${poi.code} · ${poi.shortName}`, `reached-${poiId}`, 4500);
    get().addEvent({
      type: 'reach',
      title: `Reached ${poi.shortName}`,
      detail: poi.description,
      category: 'navigation',
      risk: 'info',
      position: s.telemetry.position,
    });
  },

  triggerScan: () => {
    const s = get();
    if (s.phase !== 'playing') return;
    if (s.scan.cooldown > 0) {
      get().addAlert('info', 'SCANNER RECYCLING', 'Wait for the sensor head to cool down.', 'scan-cooldown', 1800);
      return;
    }
    if (s.resources.battery < RESOURCES.batteryScanPerScan) {
      get().addAlert('warning', 'INSUFFICIENT BATTERY', 'Scanner disabled. Return to camp to recharge.', 'battery-scan', 5000);
      return;
    }
    const now = Date.now();
    const pos = s.telemetry.position;
    const results = POIS.map((poi) => {
      const distance = Math.hypot(pos.x - poi.x, pos.z - poi.z);
      return { poi, distance };
    })
      .filter((r) => r.distance < 85)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 8)
      .map((r) => ({
        poiId: r.poi.id,
        distance: Math.round(r.distance),
        signature:
          r.poi.type === 'deposit'
            ? r.poi.analysis.indicators[0] ?? 'MINERAL LAG'
            : r.poi.type === 'ice'
              ? 'UNCERTAIN VOLATILE SIGNATURE'
              : r.poi.type === 'rover'
                ? 'METALLIC / REGOLITH CONTACT'
                : 'MAFIC SURFACE SIGNATURE',
        strength: clamp(Math.round(92 - r.distance * 0.75), 12, 96),
        mineral: r.poi.mineral,
      }));

    let scanned = { ...s.scanned };
    let pp = s.pp;
    let newMinerals = 0;
    results.forEach((r) => {
      if (scanned[r.poiId] !== undefined) return;
      scanned[r.poiId] = now;
      const poi = POI_BY_ID[r.poiId];
      get().emitObjectiveEvent({ type: 'scan', target: r.poiId });
      if (poi.mineral) {
        newMinerals++;
        get().emitObjectiveEvent({ type: 'scan-mineral', target: r.poiId });
      }
      get().addEvent({
        type: 'scan',
        title: `Scanner contact · ${poi.code}`,
        detail: `${poi.analysis.indicators.slice(0, 2).join(', ')}. ${r.distance} m away, signal strength ${r.strength}%.`,
        category: 'science',
        risk: 'info',
        position: pos,
      });
      if (poi.zoneId && ZONE_BY_ID[poi.zoneId]?.access === 'observe-only') {
        pp = {
          ...pp,
          score: clamp(pp.score + 1, 0, 100),
          actions: [...pp.actions, { id: uid('pp'), label: `Remote scan before approach · ${poi.code}`, points: 1, time: now }].slice(-40),
        };
      }
    });
    const battery = clamp(s.resources.battery - RESOURCES.batteryScanPerScan, 0, 100);
    set({
      scanned,
      pp,
      scan: {
        ...s.scan,
        active: true,
        pulse: s.scan.pulse + 1,
        results,
        startedAt: now,
        lastScanAt: now,
        cooldown: 3.2,
      },
      scanFlash: s.scanFlash + 1,
      resources: { ...s.resources, battery },
      tool: 'scanner',
    });
    get().addAlert(
      results.length ? 'info' : 'caution',
      'SCANNER SWEEP',
      results.length
        ? `${results.length} contacts logged within 85 m${newMinerals ? ` · ${newMinerals} new mineral signature(s)` : ''}.`
        : 'No registered targets in range. Move closer or continue the traverse.',
      'scan-result',
      5500
    );
  },

  setScanLayer: (layer) => set({ scanLayer: layer }),

  setTool: (tool) => {
    set({ tool });
    if (tool !== 'scanner') set({ scan: { ...get().scan, active: false } });
    get().addAlert(
      'info',
      'FIELD TOOL',
      tool === 'scanner' ? 'Scientific scanner selected. Press F to sweep.' : tool === 'analyzer' ? 'Geological analyzer selected. Press E at a target.' : 'Field camera selected. Frame the reticle and press E to capture.',
      'tool-select',
      2600
    );
  },

  cycleTool: () => {
    const order: ToolId[] = ['scanner', 'analyzer', 'camera'];
    const idx = order.indexOf(get().tool);
    get().setTool(order[(idx + 1) % order.length]);
  },

  setCameraMode: (mode) => set({ cameraMode: mode }),
  toggleCameraMode: () => {
    const next = get().cameraMode === 'third' ? 'first' : 'third';
    set({ cameraMode: next });
    get().addAlert('info', next === 'first' ? 'HELMET VIEW' : 'THIRD PERSON', next === 'first' ? 'First-person suit camera.' : 'External suit camera.', 'camera-mode', 2400);
  },

  toggleMapLayer: (layer) => {
    const s = get();
    const layers = { ...s.mapLayers, [layer]: !s.mapLayers[layer] };
    set({ mapLayers: layers });
    if (layer === 'slope' && layers.slope) get().emitObjectiveEvent({ type: 'map-layer', target: 'slope' });
    if (layer === 'minerals' && layers.minerals) {
      get().setHint('Minerals layer shows only scanner-confirmed signatures. Scan targets in the field to add them.', 6000);
    }
  },

  setDestination: (x, z, label, poiId = null) => {
    const s = get();
    if (!s.mission) return;
    set({
      navigation: {
        ...s.navigation,
        destination: { x, z },
        destinationLabel: label,
        destinationPoiId: poiId,
        planning: true,
        routes: [],
        selectedRouteId: null,
        selectedRoute: null,
      },
    });
    const start = {
      x: s.telemetry.position.x,
      y: terrainGenerator.height(s.telemetry.position.x, s.telemetry.position.z),
      z: s.telemetry.position.z,
    };
    try {
      const routes = routePlanner.plan(start, { x, z }, label);
      set({
        navigation: {
          ...get().navigation,
          routes,
          planning: false,
        },
      });
      get().addAlert('info', 'ROUTES COMPUTED', 'Compare distance, slope, risk and science stops, then activate a route.', 'routes-ready', 5500);
      get().addEvent({
        type: 'route-plan',
        title: 'Route alternatives computed',
        detail: `${label}. ${routes.map((r) => `${r.id}: ${r.stats.distance} m / risk ${r.stats.risk}`).join(' · ')}`,
        category: 'navigation',
        risk: 'info',
        position: s.telemetry.position,
      });
    } catch {
      set({ navigation: { ...get().navigation, planning: false } });
      get().addAlert('warning', 'ROUTE COMPUTATION FAILED', 'Use the map to choose a different destination.', 'route-fail', 5000);
    }
  },

  selectRoute: (id) => {
    const s = get();
    const route = s.navigation.routes.find((r) => r.id === id) ?? null;
    if (!route) return;
    set({
      navigation: {
        ...s.navigation,
        selectedRouteId: id,
        selectedRoute: route,
      },
    });
    get().emitObjectiveEvent({ type: 'plan-route', target: s.navigation.destinationPoiId ?? undefined });
    get().addAlert(
      'success',
      `${route.name} ACTIVE`,
      `${route.stats.distance} m · ${route.stats.estimatedMinutes} min · max slope ${route.stats.maxSlope}° · risk ${route.stats.risk}/100. You still control the walk.`,
      'route-active',
      7000
    );
    get().addEvent({
      type: 'route-selected',
      title: `${route.name} activated`,
      detail: `Destination ${s.navigation.destinationLabel}. Distance ${route.stats.distance} m, ascent ${route.stats.ascent} m, ${route.stats.poiCount} science contacts on corridor.`,
      category: 'navigation',
      risk: route.stats.risk > 60 ? 'caution' : 'info',
      position: s.telemetry.position,
      recommendation: route.warning,
    });
  },

  clearRoute: () =>
    set({
      navigation: {
        ...get().navigation,
        destination: null,
        destinationLabel: '',
        destinationPoiId: null,
        routes: [],
        selectedRouteId: null,
        selectedRoute: null,
      },
    }),

  focusMap: (poiId) => set({ mapFocus: poiId }),
  setMapFocus: (poiId) => set({ mapFocus: poiId }),

  acknowledgePP: () => {
    const s = get();
    if (s.pp.protocolsAcknowledged) {
      get().addAlert('info', 'PROTOCOL ALREADY ACKNOWLEDGED', 'The field protocol is active.', 'pp-ack', 3000);
      return;
    }
    set({
      pp: {
        ...s.pp,
        protocolsAcknowledged: true,
        score: clamp(s.pp.score + 5, 0, 100),
        reviewedPrinciples: ['environment', 'special-regions', 'terrain', 'mission-measures'],
        actions: [...s.pp.actions, { id: uid('pp'), label: 'Field protocol acknowledged', points: 5, time: Date.now() }].slice(-40),
      },
    });
    get().emitObjectiveEvent({ type: 'review-pp' });
    get().addAlert('success', 'FIELD PROTOCOL ACTIVE', 'Four principles acknowledged. Observation-only boundaries remain in force.', 'pp-ack', 6000);
    get().addEvent({
      type: 'pp-ack',
      title: 'Planetary protection protocol acknowledged',
      detail: 'Protect the environment · watch for special regions · assess terrain · follow mission measures.',
      category: 'planetary',
      risk: 'info',
    });
  },

  reviewPrinciple: (id) => {
    const s = get();
    const reviewed = s.pp.reviewedPrinciples.includes(id)
      ? s.pp.reviewedPrinciples
      : [...s.pp.reviewedPrinciples, id];
    set({ pp: { ...s.pp, reviewedPrinciples: reviewed } });
  },

  setPPPrinciple: (id) => set({ ppOpenPrinciple: id }),

  adjustPP: (points, label, incident = false) => {
    const s = get();
    const pp: PlanetaryProtectionState = {
      ...s.pp,
      score: clamp(s.pp.score + points, 0, 100),
      incidents: s.pp.incidents + (incident ? 1 : 0),
      actions: [...s.pp.actions, { id: uid('pp'), label, points, time: Date.now() }].slice(-40),
    };
    set({ pp });
  },

  updateSettings: (patch) => {
    const settings = { ...get().settings, ...patch };
    set({ settings });
    SaveManager.saveSettings(settings);
  },

  setTouchMode: (touch) => set({ touchMode: touch }),
  setShowControls: (show) => set({ showControls: show }),
  setFps: (fps) => {
    if (Math.abs(fps - get().telemetry.fps) > 4) set({ telemetry: { ...get().telemetry, fps } });
  },

  emitObjectiveEvent: (event) => {
    const s = get();
    if (!s.mission || s.mission.status !== 'active') return;
    const { mission, completed } = applyObjectiveEvent(s.mission, event);
    withObjectiveOutcome(s, mission, completed, set, get);
  },
}));

export const selectCurrentObjective = (s: GameStore) =>
  s.mission?.objectives.find((o) => o.required && !o.completed) ?? null;

export const selectReturnReady = (s: GameStore) => !!s.mission?.returnPrompt;
