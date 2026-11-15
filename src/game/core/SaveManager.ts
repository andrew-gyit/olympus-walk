import type { MissionReport, Settings } from '../types';

const SAVE_KEY = 'olympus-walk.save.v1';
const PROGRESS_KEY = 'olympus-walk.progress.v1';
const SETTINGS_KEY = 'olympus-walk.settings.v1';

export interface SaveSnapshot {
  version: 1;
  missionId: string;
  savedAt: number;
  missionElapsed: number;
  objectives: unknown;
  distanceWalked: number;
  maxDistanceFromCamp: number;
  incidents: number;
  risksAvoided: number;
  resources: unknown;
  samples: unknown;
  photos: unknown;
  observations: unknown;
  scanned: unknown;
  analyzed: unknown;
  collected: unknown;
  pp: unknown;
  events: unknown;
  position: { x: number; y: number; z: number };
  heading: number;
  cameraYaw: number;
  cameraPitch: number;
  navigation: unknown;
  environment: unknown;
}

export interface ProgressData {
  unlocked: string[];
  reports: MissionReport[];
  bestScores: Record<string, number>;
}

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export const DEFAULT_SETTINGS: Settings = {
  sensitivity: 1.0,
  invertY: false,
  volume: 0.65,
  muted: false,
  quality: 'high',
  showMarkerLabels: true,
  cameraShake: true,
  hudScale: 1,
};

export const SaveManager = {
  hasSave(): boolean {
    try {
      return !!localStorage.getItem(SAVE_KEY);
    } catch {
      return false;
    }
  },

  save(snapshot: SaveSnapshot): void {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(snapshot));
    } catch {
      // Storage can fill up with photo thumbnails; drop the save rather than break play.
      try {
        localStorage.removeItem(SAVE_KEY);
      } catch {
        /* ignore */
      }
    }
  },

  load(): SaveSnapshot | null {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      return safeParse<SaveSnapshot | null>(raw, null);
    } catch {
      return null;
    }
  },

  clear(): void {
    try {
      localStorage.removeItem(SAVE_KEY);
    } catch {
      /* ignore */
    }
  },

  loadProgress(): ProgressData {
    try {
      const data = safeParse<Partial<ProgressData>>(localStorage.getItem(PROGRESS_KEY), {});
      return {
        unlocked: Array.isArray(data.unlocked) ? data.unlocked : ['first-steps'],
        reports: Array.isArray(data.reports) ? data.reports.slice(-20) : [],
        bestScores: data.bestScores && typeof data.bestScores === 'object' ? data.bestScores : {},
      };
    } catch {
      return { unlocked: ['first-steps'], reports: [], bestScores: {} };
    }
  },

  saveProgress(data: ProgressData): void {
    try {
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(data));
    } catch {
      /* ignore */
    }
  },

  loadSettings(): Settings {
    try {
      const data = safeParse<Partial<Settings>>(localStorage.getItem(SETTINGS_KEY), {});
      return { ...DEFAULT_SETTINGS, ...data };
    } catch {
      return { ...DEFAULT_SETTINGS };
    }
  },

  saveSettings(settings: Settings): void {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch {
      /* ignore */
    }
  },
};
