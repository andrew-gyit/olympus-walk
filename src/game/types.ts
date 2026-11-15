export type Phase =
  | 'boot'
  | 'menu'
  | 'mission-select'
  | 'briefing'
  | 'playing'
  | 'paused'
  | 'report';

export type CameraMode = 'third' | 'first';
export type ToolId = 'scanner' | 'analyzer' | 'camera';
export type PanelId = 'map' | 'inventory' | 'objectives' | 'pp' | 'settings' | 'pause' | 'help' | null;

export type MapLayer =
  | 'elevation'
  | 'slope'
  | 'surface'
  | 'temperature'
  | 'minerals'
  | 'radiation'
  | 'hazards';

export type DataClass = 'real' | 'derived' | 'simulation';

export type PrecautionCategory = 'topographical' | 'environmental' | 'planetary';

export type RiskLevel = 'success' | 'info' | 'caution' | 'warning' | 'critical';

export interface Vec2 {
  x: number;
  z: number;
}

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface AlertMessage {
  id: string;
  level: RiskLevel;
  title: string;
  message: string;
  ttl: number;
  createdAt: number;
  code?: string;
}

export interface GameEvent {
  id: string;
  time: number;
  type: string;
  title: string;
  detail: string;
  category: 'mission' | 'science' | 'hazard' | 'resources' | 'planetary' | 'navigation' | 'system';
  risk: RiskLevel;
  position?: Vec3;
  recommendation?: string;
}

export interface POIAnalysis {
  classification: string;
  formationType: string;
  observed: string;
  indicators: string[];
  interest: 'low' | 'moderate' | 'high' | 'exceptional';
  confidence: number;
  interpretation: string;
  ppNote: string;
}

export interface POI {
  id: string;
  code: string;
  name: string;
  shortName: string;
  type: 'boulder' | 'outcrop' | 'deposit' | 'crater' | 'rover' | 'viewpoint' | 'ice' | 'beacon' | 'scarp';
  interaction: 'analyze' | 'inspect' | 'survey' | 'observe' | 'collect';
  x: number;
  z: number;
  markerHeight: number;
  radius: number;
  mineral: boolean;
  canSample: boolean;
  sampleType?: string;
  sampleUnits?: number;
  zoneId?: string;
  missionTags: string[];
  description: string;
  analysis: POIAnalysis;
  model: {
    scale: number;
    tint?: string;
    variant?: string;
  };
  simulated: true;
}

export interface PrecautionZone {
  id: string;
  code: string;
  name: string;
  type: 'special' | 'uncertain' | 'topographic' | 'environmental' | 'radiation' | 'controlled';
  center: Vec2;
  radius: number;
  categories: PrecautionCategory[];
  level: RiskLevel;
  dataClass: DataClass;
  description: string;
  measures: string[];
  source: string;
  access: 'observe-only' | 'traverse-with-care' | 'restricted';
}

export interface MissionObjectiveDef {
  id: string;
  label: string;
  detail: string;
  type:
    | 'walk'
    | 'open-map'
    | 'map-layer'
    | 'scan'
    | 'scan-mineral'
    | 'analyze'
    | 'sample'
    | 'photo'
    | 'observation'
    | 'return'
    | 'enter-zone'
    | 'review-pp'
    | 'plan-route'
    | 'reach'
    | 'avoid-incidents'
    | 'observe-zone';
  target?: string;
  count?: number;
  required: boolean;
  hint?: string;
  eventType?: string;
}

export interface MissionDef {
  id: string;
  code: string;
  index: number;
  name: string;
  subtitle: string;
  description: string;
  brief: string;
  difficulty: 'Introductory' | 'Standard' | 'Advanced' | 'Specialist';
  duration: string;
  distance: string;
  equipment: string[];
  unlockAfter?: string;
  objectives: MissionObjectiveDef[];
  startZone: string;
  scienceFocus: string;
  accent: string;
}

export interface ObjectiveState extends MissionObjectiveDef {
  progress: number;
  completed: boolean;
  active: boolean;
}

export interface MissionRuntime {
  id: string;
  code: string;
  name: string;
  startedAt: number;
  elapsed: number;
  objectives: ObjectiveState[];
  status: 'active' | 'complete' | 'failed' | 'aborted';
  returnPrompt: boolean;
  score: number;
  distanceWalked: number;
  maxDistanceFromCamp: number;
  incidents: number;
  risksAvoided: number;
  completedAt?: number;
}

export interface Sample {
  id: string;
  poiId: string;
  name: string;
  type: string;
  composition: string;
  position: Vec3;
  missionTime: number;
  units: number;
  protocolFollowed: boolean;
  dataClass: DataClass;
}

export interface Photo {
  id: string;
  poiId?: string;
  caption: string;
  dataUrl: string;
  position: Vec3;
  heading: number;
  missionTime: number;
  dataClass: DataClass;
}

export interface Observation {
  id: string;
  poiId?: string;
  zoneId?: string;
  title: string;
  text: string;
  position: Vec3;
  missionTime: number;
  category: 'geology' | 'mineralogy' | 'terrain' | 'planetary' | 'equipment' | 'survey';
  dataClass: DataClass;
}

export interface SuitResources {
  oxygen: number;
  battery: number;
  suitIntegrity: number;
  thermal: number;
  physical: number;
  communication: number;
  inventoryUsed: number;
  inventoryCapacity: number;
}

export interface Telemetry {
  position: Vec3;
  heading: number;
  speed: number;
  slope: number;
  elevation: number;
  onGround: boolean;
  campDistance: number;
  destinationDistance: number | null;
  commQuality: number;
  insideZoneId: string | null;
  nearbyPoiId: string | null;
  targetPoiId: string | null;
  fps: number;
}

export interface InteractionTarget {
  poiId: string;
  prompt: string;
  action: string;
  distance: number;
}

export interface ScanResult {
  poiId: string;
  distance: number;
  signature: string;
  strength: number;
  mineral: boolean;
}

export interface ScanState {
  active: boolean;
  pulse: number;
  layer: MapLayer;
  results: ScanResult[];
  startedAt: number;
  lastScanAt: number;
  cooldown: number;
}

export interface RouteStats {
  distance: number;
  ascent: number;
  maxSlope: number;
  estimatedMinutes: number;
  risk: number;
  poiCount: number;
  hazardCells: number;
}

export interface RouteOption {
  id: 'safest' | 'balanced' | 'scientific';
  name: string;
  color: string;
  points: Vec3[];
  stats: RouteStats;
  warning?: string;
}

export interface NavigationState {
  destination: Vec2 | null;
  destinationLabel: string;
  destinationPoiId: string | null;
  routes: RouteOption[];
  selectedRouteId: RouteOption['id'] | null;
  selectedRoute: RouteOption | null;
  planning: boolean;
  autoPilotGuidance: boolean;
}

export interface PlanetaryProtectionState {
  score: number;
  incidents: number;
  observationsInSensitiveZones: number;
  protocolsAcknowledged: boolean;
  reviewedPrinciples: string[];
  actions: Array<{ id: string; label: string; points: number; time: number }>;
  restrictedEntries: number;
  lastZoneId: string | null;
}

export interface EnvironmentState {
  ambientTempC: number;
  windMs: number;
  windGust: number;
  dust: number;
  solarFlux: number;
  radiationUSvH: number;
  pressureKPa: number;
  dustStorm: boolean;
  stormIntensity: number;
  timeOfSol: number;
  sunriseIn: number;
}

export interface HintState {
  id: string;
  text: string;
  until: number;
}

export interface Settings {
  sensitivity: number;
  invertY: boolean;
  volume: number;
  muted: boolean;
  quality: 'low' | 'medium' | 'high';
  showMarkerLabels: boolean;
  cameraShake: boolean;
  hudScale: number;
}

export interface MissionReport {
  missionId: string;
  missionName: string;
  outcome: 'complete' | 'failed' | 'aborted';
  elapsed: number;
  objectivesCompleted: number;
  objectivesTotal: number;
  samples: number;
  photos: number;
  observations: number;
  scanned: number;
  distanceWalked: number;
  oxygenUsed: number;
  batteryUsed: number;
  incidents: number;
  risksAvoided: number;
  ppScore: number;
  recordIntegrity: number;
  scienceScore: number;
  safetyScore: number;
  totalScore: number;
  grade: string;
  breakdown: Array<{ label: string; value: number; max: number; note: string }>;
  createdAt: number;
}
