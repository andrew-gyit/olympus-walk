import { MISSIONS, MISSION_BY_ID } from '../data/missions';
import type {
  MissionDef,
  MissionReport,
  MissionRuntime,
  ObjectiveState,
  Photo,
  Observation,
  Sample,
  SuitResources,
  PlanetaryProtectionState,
  GameEvent,
} from '../types';

export interface ObjectiveEvent {
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
    | 'enter-zone'
    | 'review-pp'
    | 'plan-route'
    | 'reach'
    | 'observe-zone';
  target?: string;
  amount?: number;
  label?: string;
}

export function createMissionRuntime(missionId: string, now: number): MissionRuntime {
  const def = MISSION_BY_ID[missionId] ?? MISSIONS[0];
  return {
    id: def.id,
    code: def.code,
    name: def.name,
    startedAt: now,
    elapsed: 0,
    objectives: def.objectives.map((o) => ({
      ...o,
      progress: 0,
      completed: false,
      active: true,
    })),
    status: 'active',
    returnPrompt: false,
    score: 0,
    distanceWalked: 0,
    maxDistanceFromCamp: 0,
    incidents: 0,
    risksAvoided: 0,
  };
}

function eventMatches(objective: ObjectiveState, event: ObjectiveEvent): boolean {
  if (!objective.target) return true;
  return objective.target === event.target;
}

export function applyObjectiveEvent(
  mission: MissionRuntime,
  event: ObjectiveEvent
): { mission: MissionRuntime; completed: string[] } {
  if (mission.status !== 'active') return { mission, completed: [] };
  const completed: string[] = [];
  const objectives = mission.objectives.map((o) => {
    if (o.completed || !o.active) return o;
    let progress = o.progress;
    let matches = false;

    switch (o.type) {
      case 'walk':
        if (event.type === 'walk') {
          progress += event.amount ?? 0;
          matches = true;
        }
        break;
      case 'open-map':
        if (event.type === 'open-map') {
          progress += 1;
          matches = true;
        }
        break;
      case 'map-layer':
        if (event.type === 'map-layer' && event.target === o.target) {
          progress += 1;
          matches = true;
        }
        break;
      case 'scan':
        if (event.type === 'scan' && eventMatches(o, event)) {
          progress += 1;
          matches = true;
        }
        break;
      case 'scan-mineral':
        if (event.type === 'scan-mineral') {
          progress += 1;
          matches = true;
        }
        break;
      case 'analyze':
        if (event.type === 'analyze' && eventMatches(o, event)) {
          progress += 1;
          matches = true;
        }
        break;
      case 'sample':
        if (event.type === 'sample' && eventMatches(o, event)) {
          progress += 1;
          matches = true;
        }
        break;
      case 'photo':
        if (event.type === 'photo') {
          progress += 1;
          matches = true;
        }
        break;
      case 'observation':
        if (event.type === 'observation' && eventMatches(o, event)) {
          progress += 1;
          matches = true;
        }
        break;
      case 'enter-zone':
        if (event.type === 'enter-zone' && eventMatches(o, event)) {
          progress += 1;
          matches = true;
        }
        break;
      case 'review-pp':
        if (event.type === 'review-pp') {
          progress += 1;
          matches = true;
        }
        break;
      case 'plan-route':
        if (event.type === 'plan-route' && eventMatches(o, event)) {
          progress += 1;
          matches = true;
        }
        break;
      case 'reach':
        if (event.type === 'reach' && eventMatches(o, event)) {
          progress += 1;
          matches = true;
        }
        break;
      case 'observe-zone':
        if (event.type === 'observe-zone' && eventMatches(o, event)) {
          progress += 1;
          matches = true;
        }
        break;
      default:
        break;
    }

    if (!matches) return o;
    const targetCount = o.count ?? 1;
    const nextProgress = Math.min(progress, targetCount);
    const nowComplete = nextProgress >= targetCount;
    if (nowComplete) completed.push(o.id);
    return { ...o, progress: nextProgress, completed: nowComplete };
  });
  return { mission: { ...mission, objectives }, completed };
}

export function canCompleteAtCamp(mission: MissionRuntime): boolean {
  return mission.objectives
    .filter((o) => o.required && o.type !== 'return')
    .every((o) => o.completed);
}

export function updateReturnAvailability(mission: MissionRuntime, atCamp: boolean): MissionRuntime {
  const ready = atCamp && canCompleteAtCamp(mission);
  if (mission.returnPrompt === ready) return mission;
  return { ...mission, returnPrompt: ready };
}

export function completeMissionAtCamp(mission: MissionRuntime, now: number): MissionRuntime {
  const objectives = mission.objectives.map((o) =>
    o.type === 'return' ? { ...o, progress: o.count ?? 1, completed: true } : o
  );
  return { ...mission, objectives, status: 'complete', returnPrompt: false, completedAt: now };
}

export function failMission(mission: MissionRuntime, now: number): MissionRuntime {
  return { ...mission, status: 'failed', returnPrompt: false, completedAt: now };
}

export function missionDefinition(id: string): MissionDef {
  return MISSION_BY_ID[id] ?? MISSIONS[0];
}

export interface ReportInput {
  mission: MissionRuntime;
  resources: SuitResources;
  samples: Sample[];
  photos: Photo[];
  observations: Observation[];
  scannedCount: number;
  analyzedCount: number;
  pp: PlanetaryProtectionState;
  events: GameEvent[];
  outcome: 'complete' | 'failed' | 'aborted';
  now: number;
}

export function buildMissionReport(input: ReportInput): MissionReport {
  const { mission, resources, samples, photos, observations, scannedCount, analyzedCount, pp, outcome, now } = input;
  const def = missionDefinition(mission.id);
  const required = mission.objectives.filter((o) => o.required);
  const completedRequired = required.filter((o) => o.completed).length;
  const objectiveRatio = required.length ? completedRequired / required.length : 0;

  const sampleScore = Math.min(12, samples.length * 4);
  const analyzedScore = Math.min(9, analyzedCount * 3);
  const photoScore = Math.min(5, photos.length * 2);
  const observationScore = Math.min(6, observations.length * 1.5);
  const scienceScore = Math.round(sampleScore + analyzedScore + photoScore + observationScore);

  const safetyScore = Math.max(
    0,
    Math.min(25, 25 - mission.incidents * 6 + mission.risksAvoided * 2)
  );

  const ppNormalized = Math.max(0, Math.min(20, Math.round(pp.score / 5)));
  const protocolSamples = samples.filter((s) => s.protocolFollowed).length;
  const protocolRatio = samples.length ? protocolSamples / samples.length : 1;
  const recordIntegrity = Math.round(
    Math.max(
      0,
      Math.min(
        100,
        62 +
          (scannedCount > 0 ? 10 : 0) +
          (analyzedCount > 0 ? 8 : 0) +
          (photos.length > 0 ? 6 : 0) +
          protocolRatio * 14 -
          pp.incidents * 6
      )
    )
  );

  const objectivesScore = Math.round(objectiveRatio * 35);
  const recordScore = Math.round((recordIntegrity / 100) * 10);
  const safetyComponent = Math.round((safetyScore / 25) * 20);
  const ppComponent = Math.round((ppNormalized / 20) * 15);
  const scienceComponent = Math.round((scienceScore / 30) * 20);

  let totalScore = objectivesScore + scienceComponent + safetyComponent + ppComponent + recordScore;
  if (outcome !== 'complete') totalScore = Math.round(totalScore * (outcome === 'failed' ? 0.45 : 0.6));
  totalScore = Math.max(0, Math.min(100, totalScore));

  const grade =
    totalScore >= 92 ? 'S' : totalScore >= 82 ? 'A' : totalScore >= 70 ? 'B' : totalScore >= 58 ? 'C' : 'D';

  return {
    missionId: mission.id,
    missionName: def.name,
    outcome,
    elapsed: mission.elapsed,
    objectivesCompleted: completedRequired,
    objectivesTotal: required.length,
    samples: samples.length,
    photos: photos.length,
    observations: observations.length,
    scanned: scannedCount,
    distanceWalked: Math.round(mission.distanceWalked),
    oxygenUsed: Math.round(100 - resources.oxygen),
    batteryUsed: Math.round(100 - resources.battery),
    incidents: mission.incidents + pp.incidents,
    risksAvoided: mission.risksAvoided,
    ppScore: pp.score,
    recordIntegrity,
    scienceScore,
    safetyScore,
    totalScore,
    grade,
    breakdown: [
      {
        label: 'MISSION OBJECTIVES',
        value: objectivesScore,
        max: 35,
        note: `${completedRequired}/${required.length} required objectives completed.`,
      },
      {
        label: 'SCIENTIFIC WORK',
        value: scienceComponent,
        max: 20,
        note: `${samples.length} samples · ${analyzedCount} analyses · ${photos.length} photos · ${observations.length} observations.`,
      },
      {
        label: 'TERRAIN SAFETY',
        value: safetyComponent,
        max: 20,
        note: `${mission.incidents + pp.incidents} incidents · ${mission.risksAvoided} risks mitigated.`,
      },
      {
        label: 'PLANETARY PROTECTION',
        value: ppComponent,
        max: 15,
        note: `Compliance score ${pp.score}/100 · ${pp.incidents} protocol incidents.`,
      },
      {
        label: 'RECORD INTEGRITY',
        value: recordScore,
        max: 10,
        note: `${recordIntegrity}/100. Scan → analyze → sample chain of evidence.`,
      },
    ],
    createdAt: now,
  };
}
