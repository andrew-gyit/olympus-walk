/**
 * Thin bridge between the React field instruments and the R3F runtime.
 * The runtime registers its capabilities after the WebGL scene is ready.
 */
export interface RuntimeApi {
  capturePhoto: (poiId?: string | null) => boolean;
  isPointerLocked: () => boolean;
  unlockPointer: () => void;
  lockPointer: () => void;
  openPanel: (panel: 'map' | 'inventory' | 'objectives' | 'pp' | 'settings' | 'pause' | 'help') => void;
  closePanel: () => void;
}

export const runtimeBridge: { api: RuntimeApi | null } = { api: null };
