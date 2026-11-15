import RAPIER from '@dimforge/rapier3d-compat';
import { PLAYER } from '../config';

export interface ObstacleCollider {
  shape: 'ball' | 'cylinder' | 'cuboid';
  x: number;
  y: number;
  z: number;
  r?: number;
  halfHeight?: number;
  hx?: number;
  hy?: number;
  hz?: number;
  rotationY?: number;
}

/**
 * Rapier physics wrapper. The terrain is a static trimesh; the astronaut is a
 * kinematic capsule moved by Rapier's KinematicCharacterController.
 */
export class PhysicsManager {
  world!: RAPIER.World;
  controller!: RAPIER.KinematicCharacterController;
  playerBody!: RAPIER.RigidBody;
  playerCollider!: RAPIER.Collider;
  terrainCollider!: RAPIER.Collider;
  private staticColliders: RAPIER.Collider[] = [];
  private ready = false;

  async init(terrainPositions: Float32Array, terrainIndices: Uint32Array, feet: { x: number; y: number; z: number }) {
    if (this.ready) return;
    await RAPIER.init();
    this.world = new RAPIER.World({ x: 0, y: -3.71, z: 0 });
    this.world.integrationParameters.dt = 1 / 60;

    const terrainBody = this.world.createRigidBody(RAPIER.RigidBodyDesc.fixed());
    const terrainDesc = RAPIER.ColliderDesc.trimesh(terrainPositions, terrainIndices)
      .setFriction(0.94)
      .setRestitution(0.02);
    this.terrainCollider = this.world.createCollider(terrainDesc, terrainBody);

    const centerY = feet.y + PLAYER.capsuleHalfHeight + PLAYER.capsuleRadius;
    this.playerBody = this.world.createRigidBody(
      RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(feet.x, centerY, feet.z)
    );
    const capsule = RAPIER.ColliderDesc.capsule(PLAYER.capsuleHalfHeight, PLAYER.capsuleRadius)
      .setFriction(0.8)
      .setRestitution(0);
    this.playerCollider = this.world.createCollider(capsule, this.playerBody);

    this.controller = this.world.createCharacterController(0.06);
    this.controller.setUp({ x: 0, y: 1, z: 0 });
    this.controller.enableAutostep(PLAYER.stepHeight, 0.28, true);
    this.controller.enableSnapToGround(PLAYER.groundSnap);
    this.controller.setMaxSlopeClimbAngle((PLAYER.maxSlopeClimb * Math.PI) / 180);
    this.controller.setMinSlopeSlideAngle((PLAYER.maxSlopeStop * Math.PI) / 180);
    this.controller.setSlideEnabled(true);
    this.controller.setApplyImpulsesToDynamicBodies(true);

    this.ready = true;
  }

  get isReady() {
    return this.ready;
  }

  addObstacles(obstacles: ObstacleCollider[]) {
    if (!this.ready) return;
    for (const o of obstacles) {
      let desc: RAPIER.ColliderDesc;
      if (o.shape === 'ball') {
        desc = RAPIER.ColliderDesc.ball(o.r ?? 1);
      } else if (o.shape === 'cylinder') {
        desc = RAPIER.ColliderDesc.cylinder(o.halfHeight ?? 1, o.r ?? 1);
      } else {
        desc = RAPIER.ColliderDesc.cuboid(o.hx ?? 1, o.hy ?? 1, o.hz ?? 1);
      }
      desc.setTranslation(o.x, o.y, o.z).setFriction(0.9).setRestitution(0.05);
      if (o.rotationY) {
        const half = o.rotationY / 2;
        desc.setRotation({ x: 0, y: Math.sin(half), z: 0, w: Math.cos(half) });
      }
      this.staticColliders.push(this.world.createCollider(desc));
    }
  }

  addCuboid(x: number, y: number, z: number, hx: number, hy: number, hz: number, rotationY = 0) {
    this.addObstacles([{ shape: 'cuboid', x, y, z, hx, hy, hz, rotationY }]);
  }

  step() {
    if (!this.ready) return;
    this.world.step();
  }

  teleport(feet: { x: number; y: number; z: number }) {
    const centerY = feet.y + PLAYER.capsuleHalfHeight + PLAYER.capsuleRadius;
    this.playerBody.setTranslation({ x: feet.x, y: centerY, z: feet.z }, true);
    this.playerBody.setNextKinematicTranslation({ x: feet.x, y: centerY, z: feet.z });
  }

  feetPosition(): { x: number; y: number; z: number } {
    const p = this.playerBody.translation();
    return { x: p.x, y: p.y - PLAYER.capsuleHalfHeight - PLAYER.capsuleRadius, z: p.z };
  }

  centerPosition(): { x: number; y: number; z: number } {
    const p = this.playerBody.translation();
    return { x: p.x, y: p.y, z: p.z };
  }

  /** Returns ray distance to the first collider (excluding the player). */
  raycast(origin: { x: number; y: number; z: number }, direction: { x: number; y: number; z: number }, maxDistance: number): number | null {
    if (!this.ready) return null;
    const ray = new RAPIER.Ray(origin, direction);
    const hit = this.world.castRay(ray, maxDistance, true, undefined, undefined, this.playerCollider);
    if (!hit) return null;
    return hit.toi;
  }

  /** Height query of the physics terrain via ray downward. */
  groundHeight(x: number, z: number, fromY = 200): number | null {
    if (!this.ready) return null;
    const ray = new RAPIER.Ray({ x, y: fromY, z }, { x: 0, y: -1, z: 0 });
    const hit = this.world.castRay(ray, fromY + 120, true, undefined, undefined, this.playerCollider);
    if (!hit) return null;
    return fromY - hit.toi;
  }

  dispose() {
    this.world?.free();
    this.ready = false;
  }
}

export const physicsManager = new PhysicsManager();
