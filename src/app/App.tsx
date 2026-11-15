import { useEffect, useState } from 'react';
import { MarsWorld } from './scene/MarsWorld';
import { HUD } from './ui/HUD';
import { ReportScreen } from './ui/ReportScreen';
import { TouchControls } from './ui/TouchControls';
import {
  AnalysisPanel,
  HelpPanelWrapper,
  InventoryPanel,
  MapPanel,
  ObjectivesPanel,
  PPPanel,
  PauseScreen,
  SettingsPanel,
} from './ui/Panels';
import { Briefing, BootScreen, MainMenu, MissionSelect } from './ui/Menus';
import { MISSIONS } from '../game/data/missions';
import { audioManager } from '../game/core/AudioManager';
import { inputManager } from '../game/player/InputManager';
import { useGameStore } from '../stores/gameStore';
import { terrainGenerator } from '../world/TerrainGenerator';

// Dev-only inspection hook used by the automated playtest harness (and handy in the console).
if (import.meta.env.DEV) {
  (window as unknown as Record<string, unknown>).__OLYMPUS__ = { useGameStore, inputManager, terrainGenerator };
}

function PlayingOverlays() {
  const activePanel = useGameStore((s) => s.activePanel);
  const analysisPoiId = useGameStore((s) => s.analysisPoiId);

  return (
    <>
      {activePanel === 'map' && <MapPanel />}
      {activePanel === 'objectives' && <ObjectivesPanel />}
      {activePanel === 'inventory' && <InventoryPanel />}
      {activePanel === 'pp' && <PPPanel />}
      {activePanel === 'help' && <HelpPanelWrapper />}
      {activePanel === 'settings' && <SettingsPanel />}
      {analysisPoiId && <AnalysisPanel />}
    </>
  );
}

export default function App() {
  const phase = useGameStore((s) => s.phase);
  const settings = useGameStore((s) => s.settings);
  const setPhase = useGameStore((s) => s.setPhase);
  const startMission = useGameStore((s) => s.startMission);
  const setTouchMode = useGameStore((s) => s.setTouchMode);

  const [missionId, setMissionId] = useState(() => {
    const state = useGameStore.getState();
    const lastUnlocked = [...MISSIONS].reverse().find((mission) => state.unlocked.includes(mission.id));
    return (lastUnlocked ?? MISSIONS[0]).id;
  });

  // Audio needs a user gesture once; keep the graph volume in sync afterwards.
  useEffect(() => {
    const unlock = () => {
      audioManager.unlock();
      const current = useGameStore.getState().settings;
      audioManager.setVolume(current.volume, current.muted);
    };
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, []);

  useEffect(() => {
    audioManager.setVolume(settings.volume, settings.muted);
  }, [settings.volume, settings.muted]);

  // Touch hardware gets the on-screen controls by default; the setting remains manual.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window) {
      setTouchMode(true);
    }
  }, [setTouchMode]);

  // Reset the selected mission if the last unlocked changed between sessions.
  useEffect(() => {
    return useGameStore.subscribe((state, prev) => {
      if (state.unlocked !== prev.unlocked && !state.unlocked.includes(missionId)) {
        setMissionId(state.unlocked[0] ?? MISSIONS[0].id);
      }
    });
  }, [missionId]);

  function openBriefing(id: string) {
    setMissionId(id);
    setPhase('briefing');
  }

  function beginTraverse() {
    startMission(missionId);
    // Called directly from a user gesture so pointer lock is allowed.
    window.setTimeout(() => inputManager.requestLock(), 60);
  }

  return (
    <div className="app-shell">
      <MarsWorld />
      <div className="scene-vignette" />
      <div className="scanlines" />

      {(phase === 'playing' || phase === 'paused') && <HUD />}
      <TouchControls />

      {phase === 'boot' && <BootScreen />}
      {phase === 'menu' && <MainMenu />}
      {phase === 'mission-select' && <MissionSelect onSelect={openBriefing} />}
      {phase === 'briefing' && (
        <Briefing
          missionId={missionId}
          onStart={beginTraverse}
          onBack={() => setPhase('mission-select')}
        />
      )}

      {phase === 'playing' && <PlayingOverlays />}
      {phase === 'paused' && <PauseScreen />}
      {phase === 'report' && <ReportScreen />}
    </div>
  );
}
