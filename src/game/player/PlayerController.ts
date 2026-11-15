import * as THREE from 'three';
import { PLAYER, RESOURCES, WORLD } from '../../game/config';
import { terrainGenerator } from '../../world/TerrainGenerator';
import { useGameStore } from '../../stores/gameStore';
import { AstronautRig, type AstronautAction } from './AstronautRig';
import { inputManager } from './InputManager';
import { physicsManager } from '../physics/PhysicsManager';
import { zoneAt } from '../data/zones';

export class PlayerController {
  readonly rig = new AstronautRig();
  private velocity = new THREE.Vector3();
  private verticalVelocity = 0;
  private grounded = true;
  private visualYaw = 0;
  private walkPhase = 0;
  private action: AstronautAction = null;
  private actionEndsAt = 0;
  private lastTeleportNonce = 0;
  private distanceAccum = 0;
  private footAccum = 0;
  private lastTelemetryAt = 0;
  private wasGrounded = true;
  private fallSpeed = 0;
  private slopeWarnAt = 0;
  private boundaryWarnAt = 0;
  private steepSince = 0;
  private exposureLogged = false;
  private lastPos = new THREE.Vector3();
  private cameraYaw = 0;
  private moving = false;
  private speed = 0;
  private slope = 0;
  private elevation = 0;
  private onFootstep: ((x: number, z: number, heading: number, running: boolean) => void) | null = null;
  private onTeleport: ((heading: number) => void) | null = null;
  private onLand: ((impact: number) => void) | null = null;

  constructor() {
    this.rig.group.position.set(WORLD.spawn.x, terrainGenerator.height(WORLD.spawn.x, WORLD.spawn.z), WORLD.spawn.z);
    this.lastPos.copy(this.rig.group.position);
  }

  setCallbacks(cb: {
    onFootstep?: (x: number, z: number, heading: number, running: boolean) => void;
    onTeleport?: (heading: number) => void;
    onLand?: (impact: number) => void;
  }) {
    this.onFootstep = cb.onFootstep ?? null;
    this.onTeleport = cb.onTeleport ?? null;
    this.onLand = cb.onLand ?? null;
  }

  triggerAction(action: Exclude<AstronautAction, null>, duration = 2.4) {
    this.action = action;
    this.actionEndsAt = performance.now() / 1000 + duration;
  }

  teleport(x: number, z: number, heading = 0) {
    const y = terrainGenerator.height(x, z);
    physicsManager.teleport({ x, y, z });
    this.velocity.set(0, 0, 0);
    this.verticalVelocity = 0;
    this.visualYaw = heading;
    this.rig.group.position.set(x, y, z);
    this.rig.group.rotation.y = heading;
    this.lastPos.set(x, y, z);
    this.onTeleport?.(heading);
    const s = useGameStore.getState();
    s.updateTelemetry({
      position: { x, y: y + PLAYER.eyeHeight, z },
      elevation: y,
      slope: terrainGenerator.slope(x, z),
      speed: 0,
      campDistance: Math.hypot(x, z),
      onGround: true,
    });
  }

  getFeetPosition(): { x: number; y: number; z: number } {
    return { x: this.rig.group.position.x, y: this.rig.group.position.y, z: this.rig.group.position.z };
  }

  update(dt: number, cameraYaw: number, firstPerson: boolean) {
    this.cameraYaw = cameraYaw;
    const now = performance.now() / 1000;
    if (this.action && now > this.actionEndsAt) this.action = null;

    const store = useGameStore.getState();
    if (store.phase !== 'playing') {
      this.updateVisual(dt, 0, false, false, false, firstPerson);
      return;
    }

    // Teleport request from mission start / saved-game restore.
    if (store.teleportRequest && store.teleportRequest.nonce !== this.lastTeleportNonce) {
      this.lastTeleportNonce = store.teleportRequest.nonce;
      this.teleport(store.teleportRequest.x, store.teleportRequest.z, store.teleportRequest.heading);
    }

    const blocked = store.activePanel !== null || store.analysisPoiId !== null;
    const mv = blocked ? { x: 0, y: 0 } : inputManager.movementVector();
    const wantsMove = Math.hypot(mv.x, mv.y) > 0.08;

    const feet = physicsManager.feetPosition();
    this.elevation = terrainGenerator.height(feet.x, feet.z);
    this.slope = terrainGenerator.slope(feet.x, feet.z, 0.8);

    // Camera-relative basis.
    const forward = new THREE.Vector3(-Math.sin(cameraYaw), 0, -Math.cos(cameraYaw));
    const right = new THREE.Vector3(Math.cos(cameraYaw), 0, -Math.sin(cameraYaw));
    const wish = new THREE.Vector3()
      .addScaledVector(forward, -mv.y)
      .addScaledVector(right, mv.x);
    if (wish.lengthSq() > 1) wish.normalize();

    let maxSpeed = inputManager.sprinting && !blocked ? PLAYER.sprintSpeed : PLAYER.walkSpeed;
    // Slope-aware speed model: firm on gentle ground, cautious on steep ground.
    if (this.slope > PLAYER.maxSlopeWalk) {
      const t = Math.min(1, (this.slope - PLAYER.maxSlopeWalk) / (PLAYER.maxSlopeStop - PLAYER.maxSlopeWalk));
      maxSpeed *= 1 - t * 0.62;
      if (now - this.slopeWarnAt > 12) {
        this.slopeWarnAt = now;
        if (this.slope > PLAYER.maxSlopeStop) {
          store.addAlert('warning', 'SLOPE LIMIT', `${Math.round(this.slope)}° — exceeding the configured walking limit. Find a gentler line.`, 'slope-critical', 5000);
        } else {
          store.addAlert('caution', 'STEEP TERRAIN', `${Math.round(this.slope)}° slope. Speed reduced. Test each step.`, 'slope-warn', 5000);
        }
      }
    }
    if (mv.y > 0.5) maxSpeed = Math.min(maxSpeed, PLAYER.backSpeed);

    const desiredVel = wish.multiplyScalar(wantsMove ? maxSpeed : 0);
    const accel = wantsMove ? PLAYER.acceleration : PLAYER.deceleration;
    const blend = 1 - Math.exp(-accel * dt);
    this.velocity.x += (desiredVel.x - this.velocity.x) * blend;
    this.velocity.z += (desiredVel.z - this.velocity.z) * blend;
    if (Math.hypot(this.velocity.x, this.velocity.z) < 0.015) this.velocity.set(0, 0, 0);

    // Jump / support hop.
    if (!blocked && inputManager.consumeJump() && this.grounded && store.resources.physical > 8 && store.resources.suitIntegrity > 12) {
      this.verticalVelocity = PLAYER.jumpVelocity;
      this.grounded = false;
      store.updateResources({
        physical: store.resources.physical - 1.4,
        oxygen: store.resources.oxygen - 0.12,
      });
    }

    if (!this.grounded) {
      this.verticalVelocity += WORLD.gravity * dt;
    } else if (this.verticalVelocity < 0) {
      this.verticalVelocity = -0.7;
    }

    const desired = {
      x: this.velocity.x * dt,
      y: this.verticalVelocity * dt,
      z: this.velocity.z * dt,
    };

    physicsManager.controller.computeColliderMovement(physicsManager.playerCollider, desired);
    const corrected = physicsManager.controller.computedMovement();
    const center = physicsManager.centerPosition();
    physicsManager.playerBody.setNextKinematicTranslation({
      x: center.x + corrected.x,
      y: center.y + corrected.y,
      z: center.z + corrected.z,
    });
    physicsManager.step();

    const newFeet = physicsManager.feetPosition();
    const horizontal = Math.hypot(newFeet.x - feet.x, newFeet.z - feet.z);
    const actualSpeed = dt > 0 ? horizontal / dt : 0;
    this.speed = actualSpeed;
    this.moving = horizontal > 0.002 && wantsMove;

    const wasGrounded = this.grounded;
    this.grounded = physicsManager.controller.computedGrounded();
    if (!this.grounded && this.verticalVelocity < this.fallSpeed) this.fallSpeed = this.verticalVelocity;
    if (this.grounded && !wasGrounded) {
      const impact = Math.abs(this.fallSpeed);
      this.fallSpeed = 0;
      if (impact > 1.2) this.onLand?.(impact);
    }

    // Keep the character inside the play area even if a collider is bypassed.
    let px = newFeet.x;
    let pz = newFeet.z;
    const limit = WORLD.playable - 3;
    if (Math.abs(px) > limit || Math.abs(pz) > limit) {
      px = THREE.MathUtils.clamp(px, -limit, limit);
      pz = THREE.MathUtils.clamp(pz, -limit, limit);
      physicsManager.teleport({ x: px, y: newFeet.y, z: pz });
      if (now - this.boundaryWarnAt > 14) {
        this.boundaryWarnAt = now;
        store.addAlert('caution', 'ZONE BOUNDARY', 'Exploration Zone A ends here. Plan a route back inside the surveyed area.', 'boundary', 6000);
      }
    }

    const visualTargetYaw = this.moving
      ? Math.atan2(-(newFeet.x - feet.x), -(newFeet.z - feet.z))
      : this.visualYaw;
    let delta = visualTargetYaw - this.visualYaw;
    while (delta > Math.PI) delta -= Math.PI * 2;
    while (delta < -Math.PI) delta += Math.PI * 2;
    this.visualYaw += delta * Math.min(1, dt * PLAYER.turnRate);

    this.rig.group.position.set(px, newFeet.y, pz);
    this.rig.group.rotation.y = this.visualYaw;
    this.rig.group.visible = !firstPerson;

    const moveDirX = newFeet.x - feet.x;
    const moveDirZ = newFeet.z - feet.z;
    let uphill = false;
    let downhill = false;
    if (Math.hypot(moveDirX, moveDirZ) > 0.001) {
      const look = 1.1;
      const ahead =
        terrainGenerator.height(px + (moveDirX / Math.max(0.001, horizontal)) * look, pz + (moveDirZ / Math.max(0.001, horizontal)) * look);
      const dh = ahead - this.elevation;
      uphill = dh > 0.07;
      downhill = dh < -0.07;
    }

    this.updateVisual(dt, actualSpeed, wantsMove, uphill, downhill, firstPerson);

    // Distance odometer / objective events.
    this.distanceAccum += horizontal;
    if (this.distanceAccum > 0.3) {
      store.addDistance(this.distanceAccum);
      this.distanceAccum = 0;
    }

    // Footprints and footsteps.
    if (this.grounded && actualSpeed > 0.35) {
      this.footAccum += horizontal;
      if (this.footAccum > PLAYER.footprintInterval) {
        this.footAccum = 0;
        this.onFootstep?.(px, pz, this.visualYaw, inputManager.sprinting);
      }
    }

    // Steep-ground exposure tracking: leaving a dangerous slope is a mitigated risk.
    if (this.slope > 42 && this.moving) {
      if (this.steepSince === 0) this.steepSince = now;
      if (now - this.steepSince > 5 && !this.exposureLogged) {
        this.exposureLogged = true;
        store.addEvent({
          type: 'steep-exposure',
          title: 'Sustained steep-ground exposure',
          detail: `You remained on a ${Math.round(this.slope)}° slope for several seconds. Move to a gentler line.`,
          category: 'hazard',
          risk: 'warning',
          position: { x: px, y: this.elevation, z: pz },
          recommendation: 'Use the slope layer to identify a lower-angle traverse.',
        });
      }
    } else if (this.slope < 29) {
      if (this.exposureLogged && now - this.steepSince > 6) {
        store.recordRiskAvoided();
      }
      this.steepSince = 0;
      this.exposureLogged = false;
    }

    // Telemetry: 10 Hz is enough for the HUD and avoids re-rendering every frame.
    const t = performance.now() / 1000;
    if (t - this.lastTelemetryAt > 0.1) {
      this.lastTelemetryAt = t;
      const commBase = 96 - Math.min(55, Math.hypot(px, pz) * 0.075);
      const zone = zoneAt(px, pz);
      const commQuality = Math.max(18, commBase - (zone?.type === 'topographic' ? 18 : 0));
      store.updateTelemetry({
        position: { x: px, y: newFeet.y + PLAYER.eyeHeight * 0.55, z: pz },
        elevation: this.elevation,
        slope: this.slope,
        speed: actualSpeed,
        onGround: this.grounded,
        campDistance: Math.hypot(px, pz),
        destinationDistance: store.navigation.destination
          ? Math.hypot(px - store.navigation.destination.x, pz - store.navigation.destination.z)
          : null,
        commQuality,
        heading: ((-this.cameraYaw * 180) / Math.PI + 360) % 360,
      });
    }
  }

  private updateVisual(
    dt: number,
    speed: number,
    moving: boolean,
    uphill: boolean,
    downhill: boolean,
    firstPerson: boolean
  ) {
    const store = useGameStore.getState();
    this.rig.update(dt, {
      speed,
      sprint: inputManager.sprinting,
      grounded: this.grounded,
      moving,
      slope: this.slope,
      uphill,
      downhill,
      action: this.action,
      actionProgress: 0,
      tool: store.tool,
      firstPerson,
    });
  }
}

