import * as THREE from 'three';
import { CAMERA, PLAYER } from '../../game/config';
import { useGameStore } from '../../stores/gameStore';
import { terrainGenerator } from '../../world/TerrainGenerator';
import { physicsManager } from '../physics/PhysicsManager';
import { inputManager } from './InputManager';
import { createFirstPersonArms } from './AstronautRig';
import type { ToolId } from '../../game/types';

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const damp = (current: number, target: number, lambda: number, dt: number) =>
  current + (target - current) * (1 - Math.exp(-lambda * dt));

export class CameraController {
  yaw = 0;
  pitch = CAMERA.defaultPitch;
  distance = CAMERA.distance;
  private smoothTarget = new THREE.Vector3();
  private currentDistance = CAMERA.distance;
  private targetFov = CAMERA.fov;
  private shake = 0;
  private menuAngle = 0;
  private arms: THREE.Group | null = null;
  private armsTool: ToolId | null = null;
  private scene: THREE.Scene | null = null;
  private lastYaw = 0;
  private landKick = 0;

  attachScene(scene: THREE.Scene) {
    this.scene = scene;
  }

  reset(heading = 0) {
    this.yaw = heading;
    this.pitch = CAMERA.defaultPitch;
    this.distance = CAMERA.distance;
    this.currentDistance = CAMERA.distance;
    this.smoothTarget.set(0, 0, 0);
    if (this.arms) {
      this.scene?.remove(this.arms);
      this.arms = null;
      this.armsTool = null;
    }
  }

  kick(amount = 0.35) {
    this.shake = Math.min(1, this.shake + amount);
  }

  land(impact: number) {
    this.landKick = Math.min(0.45, impact * 0.08);
  }

  private ensureArms(tool: ToolId) {
    if (this.arms && this.armsTool === tool) return;
    if (this.arms && this.scene) this.scene.remove(this.arms);
    this.arms = createFirstPersonArms(tool);
    this.armsTool = tool;
    this.arms.visible = false;
    if (this.arms) this.scene?.add(this.arms);
  }

  update(dt: number, camera: THREE.PerspectiveCamera, firstPerson: boolean, feetOverride?: { x: number; y: number; z: number }) {
    const store = useGameStore.getState();
    if (store.phase !== 'playing') return;

    this.ensureArms(store.tool);
    if (this.arms) {
      this.arms.visible = firstPerson;
      if (firstPerson) {
        this.arms.position.copy(camera.position);
        this.arms.quaternion.copy(camera.quaternion);
      }
    }

    const feet = feetOverride ?? {
      x: store.telemetry.position.x,
      y: store.telemetry.position.y - PLAYER.eyeHeight * 0.55,
      z: store.telemetry.position.z,
    };
    // While an overlay instrument is open, the pointer is released for UI use.
    if (store.activePanel === null && store.analysisPoiId === null) {
      const mouse = inputManager.consumeMouseDelta();
      const sens = store.settings.sensitivity * 0.0021;
      this.yaw -= mouse.x * sens;
      this.pitch += mouse.y * sens * (store.settings.invertY ? -1 : 1);
      this.pitch = clamp(this.pitch, CAMERA.pitchMin, CAMERA.pitchMax);
      const wheel = inputManager.consumeWheel();
      if (wheel !== 0) {
        this.distance = clamp(this.distance + wheel * 0.8, CAMERA.minDistance, CAMERA.maxDistance);
      }
    }

    this.shake = Math.max(0, this.shake - dt * 2.8);
    this.landKick = Math.max(0, this.landKick - dt * 1.8);
    const sprintShake = store.telemetry.speed > 2.8 ? 0.0015 : 0;
    const shakeAmp = store.settings.cameraShake ? this.shake * 0.045 + this.landKick * 0.08 + sprintShake : 0;
    const sx = Math.sin(performance.now() * 0.061) * shakeAmp;
    const sy = Math.cos(performance.now() * 0.047) * shakeAmp;

    if (firstPerson) {
      const bob = Math.abs(Math.sin(performance.now() * 0.008 * (1 + store.telemetry.speed))) * Math.min(0.025, store.telemetry.speed * 0.006);
      camera.position.set(feet.x + sx * 0.3, feet.y + PLAYER.eyeHeight + bob, feet.z + sy * 0.3);
      camera.rotation.order = 'YXZ';
      camera.rotation.set(-this.pitch + sy * 0.12, this.yaw + sx * 0.12, 0);
      this.targetFov = CAMERA.fpFov + (store.telemetry.speed > 2.8 ? 2 : 0);
      if (this.arms) {
        this.arms.position.copy(camera.position);
        this.arms.quaternion.copy(camera.quaternion);
        this.arms.position.y -= 0.02 + bob * 0.5;
        this.arms.rotation.z = sx * 0.2;
      }
    } else {
      const target = new THREE.Vector3(feet.x, feet.y + CAMERA.height, feet.z);
      if (this.smoothTarget.lengthSq() === 0) this.smoothTarget.copy(target);
      this.smoothTarget.x = damp(this.smoothTarget.x, target.x, CAMERA.smooth, dt);
      this.smoothTarget.y = damp(this.smoothTarget.y, target.y, CAMERA.smooth * 0.72, dt);
      this.smoothTarget.z = damp(this.smoothTarget.z, target.z, CAMERA.smooth, dt);

      const cosPitch = Math.cos(this.pitch);
      const idealOffset = new THREE.Vector3(
        Math.sin(this.yaw) * cosPitch,
        Math.sin(this.pitch) + 0.06,
        Math.cos(this.yaw) * cosPitch
      ).multiplyScalar(this.distance);
      const ideal = this.smoothTarget.clone().add(idealOffset);

      // Camera collision against physics colliders and the terrain.
      let allowed = this.distance;
      const rayDir = ideal.clone().sub(this.smoothTarget);
      const rayLen = rayDir.length();
      if (rayLen > 0.001) {
        rayDir.multiplyScalar(1 / rayLen);
        const hit = physicsManager.raycast(this.smoothTarget, rayDir, rayLen + 0.4);
        if (hit !== null) allowed = Math.max(CAMERA.minCollision, Math.min(allowed, hit - 0.35));
      }
      // Terrain clearance along the boom prevents the camera from clipping a rise.
      for (let i = 4; i <= 12; i++) {
        const t = i / 12;
        const px = this.smoothTarget.x + idealOffset.x * t;
        const pz = this.smoothTarget.z + idealOffset.z * t;
        const py = this.smoothTarget.y + idealOffset.y * t;
        const h = terrainGenerator.height(px, pz) + 0.38;
        if (py < h) {
          allowed = Math.min(allowed, this.distance * Math.max(0.1, t - 0.08));
          break;
        }
      }
      this.currentDistance = damp(this.currentDistance, Math.max(CAMERA.minCollision, allowed), 18, dt);
      const finalOffset = idealOffset.clone().normalize().multiplyScalar(this.currentDistance);
      camera.position.copy(this.smoothTarget).add(finalOffset);
      camera.position.x += sx;
      camera.position.z += sy;
      const ground = terrainGenerator.height(camera.position.x, camera.position.z) + 0.25;
      if (camera.position.y < ground) camera.position.y = ground;
      camera.lookAt(this.smoothTarget.x, this.smoothTarget.y + 0.22, this.smoothTarget.z);
      this.targetFov = CAMERA.fov + (store.telemetry.speed > 2.8 ? 3.5 : 0);
    }

    const fovDelta = this.targetFov - camera.fov;
    if (Math.abs(fovDelta) > 0.01) {
      camera.fov = damp(camera.fov, this.targetFov, 3, dt);
      camera.updateProjectionMatrix();
    }

    // A slow turn of the view can prompt the compass / suit to settle.
    this.lastYaw = this.yaw;
  }

  /** Menu / briefing orbit over Base Camp A. */
  cinematic(t: number, camera: THREE.PerspectiveCamera) {
    this.menuAngle = t * 0.025;
    const radius = 46 + Math.sin(t * 0.017) * 7;
    const x = Math.cos(this.menuAngle) * radius;
    const z = Math.sin(this.menuAngle) * radius + 8;
    const y = terrainGenerator.height(x, z) + 11 + Math.sin(t * 0.03) * 2.2;
    camera.position.set(x, y, z);
    camera.lookAt(8, terrainGenerator.height(8, -20) + 6.5, -38);
    if (camera.fov !== 52) {
      camera.fov = 52;
      camera.updateProjectionMatrix();
    }
  }
}
