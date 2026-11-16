export const WORLD = {
  /** Size of the rendered terrain patch, metres. */
  size: 900,
  /** Terrain mesh subdivisions per axis. */
  segments: 200,
  /** Maximum playable coordinate magnitude. */
  playable: 355,
  seed: 1967,
  camp: { x: 0, z: 0 },
  spawn: { x: 0, z: 17, heading: 0 },
  /** Base camp flattened radius. */
  campPadInner: 18,
  campPadOuter: 44,
  gravity: -3.71,
  fixedStep: 1 / 90,
  returnRadius: 14,
};

export const PLAYER = {
  height: 1.82,
  capsuleRadius: 0.34,
  capsuleHalfHeight: 0.54,
  eyeHeight: 1.66,
  walkSpeed: 2.15,
  sprintSpeed: 3.55,
  backSpeed: 1.45,
  acceleration: 7.5,
  deceleration: 9.0,
  turnRate: 9.0,
  jumpVelocity: 2.55,
  maxSlopeWalk: 30,
  maxSlopeSlow: 40,
  maxSlopeClimb: 44,
  maxSlopeStop: 50,
  stepHeight: 0.42,
  groundSnap: 0.6,
  slopeSpeedPenalty: 0.035,
  footprintInterval: 0.72,
  footprintLife: 150,
};

export const CAMERA = {
  distance: 5.4,
  minDistance: 2.4,
  maxDistance: 10.5,
  height: 1.45,
  pitchMin: -0.62,
  pitchMax: 0.72,
  defaultPitch: 0.16,
  minCollision: 0.45,
  smooth: 11,
  fov: 58,
  fpFov: 70,
};

export const RESOURCES = {
  oxygenStart: 100,
  batteryStart: 100,
  suitStart: 100,
  thermalStart: 100,
  physicalStart: 100,
  commStart: 100,
  oxygenIdlePerSec: 0.058,
  oxygenWalkPerSec: 0.083,
  oxygenSprintPerSec: 0.13,
  oxygenScanPerSec: 0.028,
  batteryIdlePerSec: 0.014,
  batteryScanPerScan: 0.72,
  batteryAnalyze: 0.85,
  batteryPhoto: 0.5,
  batterySprintPerSec: 0.018,
  thermalColdPerSec: 0.032,
  thermalExertionPerSec: 0.026,
  suitRecoveryPerSec: 0.015,
  campRechargeRate: 8.0,
  inventoryCapacity: 8,
};

export const SLOPE_BANDS = [
  { max: 12, color: '#5e9968', label: 'FLAT / 0–12°' },
  { max: 25, color: '#93a85a', label: 'LOW / 12–25°' },
  { max: 35, color: '#d8bb5c', label: 'MODERATE / 25–35°' },
  { max: 45, color: '#d88744', label: 'HIGH / 35–45°' },
  { max: 90, color: '#b84336', label: 'CRITICAL / 45°+' },
];

export const MAP_LAYERS: Array<{ id: 'elevation' | 'slope' | 'surface' | 'temperature' | 'minerals' | 'radiation' | 'hazards'; label: string; color: string; description: string }> = [
  { id: 'elevation', label: 'ELEVATION', color: '#e7c58d', description: 'Hypsometric relief, contour intervals and depressions.' },
  { id: 'slope', label: 'SLOPE', color: '#d8bb5c', description: 'Walkability bands derived from the local height field.' },
  { id: 'surface', label: 'SURFACE', color: '#c67a4e', description: 'Simulated surface imagery with relief shading.' },
  { id: 'temperature', label: 'TEMPERATURE', color: '#e08a5a', description: 'Local thermal model from elevation, slope and solar angle.' },
  { id: 'minerals', label: 'MINERALS', color: '#8ff0d2', description: 'Scanner-confirmed mineral signatures only.' },
  { id: 'radiation', label: 'RADIATION', color: '#b49bff', description: 'Simulated radiation sector overlay. Not a real measurement.' },
  { id: 'hazards', label: 'HAZARDS', color: '#ff6b57', description: 'Precaution zones, steep terrain and obstacle fields.' },
];

export const DATA_LABELS = {
  real: { label: 'REAL DATA', color: '#8ff0d2' },
  derived: { label: 'DERIVED DATA', color: '#ffcf7a' },
  simulation: { label: 'SIMULATION DATA', color: '#8db7ff' },
} as const;

// Mission hints are written for keyboard + mouse; on touch devices show the on-screen equivalent.
export const touchHint = (text: string, touch: boolean) =>
  touch ? text.replace('W A S D to move, mouse to look.', 'Walk with the pad on the left, drag the right side to look.') : text;

export const CONTROL_HELP = [
  { keys: 'W A S D', action: 'Walk / strafe', note: 'Camera-relative movement with suit inertia.' },
  { keys: 'MOUSE', action: 'Look / orbit camera', note: 'Click the world to capture the pointer.' },
  { keys: 'SHIFT', action: 'Brisk walk', note: 'Limited by suit speed and slope.' },
  { keys: 'SPACE', action: 'Support hop', note: 'Short, low-gravity step; does not clear large rocks.' },
  { keys: 'E', action: 'Interact', note: 'Analyze, sample, observe or end walk at camp.' },
  { keys: 'F', action: 'Scientific scanner', note: 'Consumes battery and sweeps nearby signatures.' },
  { keys: '1 / 2 / 3', action: 'Field tool', note: 'Scanner, geological analyzer, camera.' },
  { keys: 'C', action: 'Camera mode', note: 'Third person / helmet view.' },
  { keys: 'M', action: 'Wrist map', note: 'Layers, routes, points of interest.' },
  { keys: 'I', action: 'Inventory', note: 'Samples, photographs, observations.' },
  { keys: 'TAB', action: 'Objectives', note: 'Mission progress and field hints.' },
  { keys: 'P', action: 'Planetary protection', note: 'Principles, precaution zones and compliance.' },
  { keys: 'ESC', action: 'Pause', note: 'Simulation pauses while the menu is open.' }
];
