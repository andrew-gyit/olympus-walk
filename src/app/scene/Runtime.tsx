import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { RESOURCES, WORLD } from '../../game/config';
import { MAP_LAYERS } from '../../game/config';
import { gameSimulation } from '../../game/core/GameSimulation';
import { audioManager } from '../../game/core/AudioManager';
import { runtimeBridge } from '../../game/core/RuntimeBridge';
import { footprintEmitter } from '../../game/core/FootprintEmitter';
import { inputManager, type InputAction } from '../../game/player/InputManager';
import { PlayerController } from '../../game/player/PlayerController';
import { CameraController } from '../../game/player/CameraController';
import { physicsManager } from '../../game/physics/PhysicsManager';
import { getTerrainMeshData } from '../../world/terrainData';
import { campColliders, getRockField } from '../../world/WorldProps';
import { terrainGenerator } from '../../world/TerrainGenerator';
import { useGameStore } from '../../stores/gameStore';

export function Runtime() {
  const { gl, scene, camera } = useThree();
  const [player, setPlayer] = useState<PlayerController | null>(null);
  const playerRef = useRef<PlayerController | null>(null);
  const readyRef = useRef(false);
  const cameraController = useMemo(() => new CameraController(), []);
  const initRef = useRef(false);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    let disposed = false;

    const boot = async () => {
      const data = getTerrainMeshData();
      const spawnY = terrainGenerator.height(WORLD.spawn.x, WORLD.spawn.z);
      await physicsManager.init(data.positions, data.indices, { x: WORLD.spawn.x, y: spawnY, z: WORLD.spawn.z });
      if (disposed) return;
      physicsManager.addObstacles([...getRockField().colliders, ...campColliders()]);

      const controller = new PlayerController();
      if (import.meta.env.DEV) {
        (window as unknown as Record<string, unknown>).__OW_PLAYER__ = controller;
      }
      controller.setCallbacks({
        onFootstep: (x, z, heading, running) => {
          gameSimulation.onFootstep(x, z, heading, running);
          footprintEmitter.emit(x, z, heading, running);
        },
        onTeleport: (heading) => cameraController.reset(heading),
        onLand: (impact) => gameSimulation.onLand(impact),
      });
      cameraController.attachScene(scene);
      controller.rig.group.visible = false;
      playerRef.current = controller;
      setPlayer(controller);
      readyRef.current = true;
      if (import.meta.env.DEV) {
        (window as unknown as Record<string, unknown>).__OW_VIEW__ = { scene, camera, cameraController };
      }
      useGameStore.getState().bootComplete();

      runtimeBridge.api = {
        capturePhoto: (poiId) => {
          const s = useGameStore.getState();
          if (s.phase !== 'playing') return false;
          if (s.resources.battery < RESOURCES.batteryPhoto) {
            s.addAlert('warning', 'INSUFFICIENT BATTERY', 'The camera needs power. Recharge at camp.', 'battery-photo', 4200);
            return false;
          }
          try {
            gl.render(scene, camera);
            const source = gl.domElement;
            const targetW = 720;
            const targetH = Math.max(240, Math.round((source.height / source.width) * targetW));
            const thumb = document.createElement('canvas');
            thumb.width = targetW;
            thumb.height = targetH;
            const ctx = thumb.getContext('2d')!;
            ctx.drawImage(source, 0, 0, targetW, targetH);
            ctx.fillStyle = 'rgba(20,12,8,0.72)';
            ctx.fillRect(0, targetH - 46, targetW, 46);
            ctx.fillStyle = '#ffcf9d';
            ctx.font = 'bold 17px Consolas, monospace';
            const st = useGameStore.getState();
            ctx.fillText(
              `OLYMPUS WALK · ZONE A · SIMULATION DATA · ${Math.round(st.telemetry.heading)}°`,
              18,
              targetH - 17
            );
            const dataUrl = thumb.toDataURL('image/jpeg', 0.72);
            st.addPhoto(dataUrl, poiId ?? undefined);
            playerRef.current?.triggerAction('photo', 1.6);
            audioManager.shutter();
            return true;
          } catch {
            useGameStore.getState().addAlert('warning', 'CAMERA ERROR', 'Frame capture failed. Try again after moving.', 'capture-fail', 4000);
            return false;
          }
        },
        isPointerLocked: () => inputManager.locked,
        unlockPointer: () => inputManager.releaseForUI(),
        lockPointer: () => inputManager.requestLock(),
        openPanel: (panel) => useGameStore.getState().openPanel(panel),
        closePanel: () => useGameStore.getState().closePanel(),
      };
    };

    boot().catch((error) => {
      console.error('Olympus Walk runtime failed to initialise', error);
      useGameStore.setState({
        engineReady: true,
        bootProgress: 1,
        bootMessage: 'RUNTIME DEGRADED',
      });
      window.setTimeout(() => {
        if (useGameStore.getState().phase === 'boot') useGameStore.setState({ phase: 'menu' });
      }, 600);
    });

    return () => {
      disposed = true;
      runtimeBridge.api = null;
      playerRef.current = null;
      readyRef.current = false;
      inputManager.dispose();
    };
  }, [camera, gl, scene, cameraController]);

  useEffect(() => {
    const unsubscribe = useGameStore.subscribe((state, prev) => {
      if (!prev) return;
      if (state.sessionNonce !== prev.sessionNonce) {
        gameSimulation.reset();
        cameraController.reset(state.teleportRequest?.heading ?? 0);
      }
      if (state.phase === 'report' && prev.phase !== 'report') {
        inputManager.releaseForUI();
      }
    });
    return unsubscribe;
  }, [cameraController]);

  useEffect(() => {
    const handleAction = (action: InputAction) => {
      const s = useGameStore.getState();
      const playerNow = playerRef.current;
      if (s.phase !== 'playing' && s.phase !== 'paused') return;

      const toggleMap: Partial<Record<InputAction, 'map' | 'inventory' | 'objectives' | 'pp' | 'help'>> = {
        map: 'map',
        inventory: 'inventory',
        objectives: 'objectives',
        pp: 'pp',
        help: 'help',
      };
      const targetPanel = toggleMap[action];
      if (targetPanel) {
        if (s.activePanel === targetPanel) s.closePanel();
        else if (s.phase === 'playing') s.openPanel(targetPanel);
        return;
      }

      if (action === 'pause' || action === 'escape') {
        if (s.analysisPoiId) {
          s.closeAnalysis();
          return;
        }
        if (s.activePanel && s.activePanel !== 'pause') {
          s.closePanel();
          return;
        }
        if (s.phase === 'paused') {
          s.resumeGame();
          return;
        }
        s.pauseGame();
        return;
      }

      if (s.phase !== 'playing') return;
      if (s.activePanel || s.analysisPoiId) return;

      switch (action) {
        case 'interact': {
          if (s.tool === 'camera') {
            const ok = s.interaction ? gameSimulation.interact() : gameSimulation.captureLandscape();
            if (ok) playerNow?.triggerAction('photo', 1.5);
            return;
          }
          gameSimulation.interact();
          playerNow?.triggerAction(s.interaction?.action === 'SAMPLE' ? 'collect' : 'inspect', 1.6);
          break;
        }
        case 'scan':
          s.triggerScan();
          gameSimulation.onScan();
          playerNow?.triggerAction('scan', 1.7);
          break;
        case 'camera':
          s.toggleCameraMode();
          break;
        case 'tool1':
          s.setTool('scanner');
          break;
        case 'tool2':
          s.setTool('analyzer');
          break;
        case 'tool3':
          s.setTool('camera');
          break;
        case 'cycle-layer': {
          const order = MAP_LAYERS.map((l) => l.id);
          const idx = order.indexOf(s.scanLayer);
          const next = order[(idx + 1) % order.length];
          s.setScanLayer(next);
          s.setHint(`Wrist display layer: ${MAP_LAYERS.find((l) => l.id === next)?.label ?? next.toUpperCase()}`, 3000);
          break;
        }
        case 'toggle-labels':
          s.updateSettings({ showMarkerLabels: !s.settings.showMarkerLabels });
          break;
        default:
          break;
      }
    };

    inputManager.bind(gl.domElement, handleAction, (locked) => {
      document.body.dataset.pointer = locked ? 'locked' : 'free';
    });
    return () => {
      /* InputManager is shared for the lifetime of the app. */
    };
  }, [gl]);

  useFrame((state, delta) => {
    // Dev-only time-scale hook lets the automated playtest advance the sim at software-renderer frame rates.
    const devScale = import.meta.env.DEV ? Number((window as unknown as { __OW_DT_SCALE__?: number }).__OW_DT_SCALE__ ?? 1) : 1;
    const dt = Math.min(delta, 0.05) * (Number.isFinite(devScale) && devScale > 0 ? devScale : 1);
    const s = useGameStore.getState();
    const phase = s.phase;
    const cinematic = phase === 'boot' || phase === 'menu' || phase === 'mission-select' || phase === 'briefing' || phase === 'report';
    if (cinematic) {
      cameraController.cinematic(state.clock.elapsedTime * 4.2, camera as THREE.PerspectiveCamera);
      if (playerRef.current) playerRef.current.rig.group.visible = false;
      return;
    }
    const controller = playerRef.current;
    if (!readyRef.current || !controller) return;

    controller.update(dt, cameraController.yaw, s.cameraMode === 'first');
    controller.rig.group.visible = s.phase === 'playing' || s.phase === 'paused' ? s.cameraMode !== 'first' : false;
    cameraController.update(dt, camera as THREE.PerspectiveCamera, s.cameraMode === 'first', controller.getFeetPosition());
    gameSimulation.update(dt);

    const fog = scene.fog as THREE.Fog | null;
    if (fog) {
      const storm = s.environment.dustStorm;
      fog.near += ((storm ? 22 : 78) - fog.near) * Math.min(1, dt * 1.5);
      fog.far += ((storm ? 360 : 760) - fog.far) * Math.min(1, dt * 1.5);
      fog.color.lerp(new THREE.Color(storm ? '#8e6048' : '#b97a58'), Math.min(1, dt * 1.2));
    }
  });

  return player ? <primitive object={player.rig.group} /> : null;
}
