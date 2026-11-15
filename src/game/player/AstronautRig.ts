import * as THREE from 'three';
import type { ToolId } from '../../game/types';

const suitWhite = new THREE.MeshStandardMaterial({ color: '#c9c0b1', roughness: 0.78, metalness: 0.06 });
const suitShade = new THREE.MeshStandardMaterial({ color: '#a49a8b', roughness: 0.86, metalness: 0.04 });
const fabric = new THREE.MeshStandardMaterial({ color: '#36322e', roughness: 0.94, metalness: 0.02 });
const accent = new THREE.MeshStandardMaterial({ color: '#b9572d', roughness: 0.65, metalness: 0.1 });
const accentDark = new THREE.MeshStandardMaterial({ color: '#74351f', roughness: 0.72, metalness: 0.08 });
const metal = new THREE.MeshStandardMaterial({ color: '#8a857c', roughness: 0.42, metalness: 0.72 });
const darkMetal = new THREE.MeshStandardMaterial({ color: '#2a2825', roughness: 0.55, metalness: 0.55 });
const visorMat = new THREE.MeshStandardMaterial({
  color: '#c99a42',
  roughness: 0.08,
  metalness: 0.94,
  emissive: '#3a2507',
  emissiveIntensity: 0.7,
});
const glassMat = new THREE.MeshStandardMaterial({
  color: '#7ad9cc',
  emissive: '#2c8f83',
  emissiveIntensity: 1.1,
  roughness: 0.18,
  metalness: 0.35,
  transparent: true,
  opacity: 0.9,
});
const warningLight = new THREE.MeshStandardMaterial({ color: '#ffb35c', emissive: '#ff7a35', emissiveIntensity: 1.8, roughness: 0.35 });
const statusLight = new THREE.MeshStandardMaterial({ color: '#8ff0d2', emissive: '#41cda9', emissiveIntensity: 1.5, roughness: 0.3 });

function mesh(geometry: THREE.BufferGeometry, material: THREE.Material, x = 0, y = 0, z = 0): THREE.Mesh {
  const m = new THREE.Mesh(geometry, material);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

function makePatchTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#221f1b';
  ctx.fillRect(0, 0, 256, 128);
  ctx.strokeStyle = '#b9572d';
  ctx.lineWidth = 5;
  ctx.strokeRect(4, 4, 248, 120);
  ctx.fillStyle = '#f3e6d5';
  ctx.font = 'bold 41px Bahnschrift, Segoe UI, sans-serif';
  ctx.fillText('VANCE', 18, 55);
  ctx.fillStyle = '#d9b48b';
  ctx.font = '24px Consolas, monospace';
  ctx.fillText('OW-01 / SCIENCE', 18, 92);
  ctx.fillStyle = '#b9572d';
  ctx.fillRect(190, 20, 42, 42);
  ctx.fillStyle = '#f3e6d5';
  ctx.font = 'bold 22px Consolas, monospace';
  ctx.fillText('A', 202, 50);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

export type AstronautAction = 'scan' | 'collect' | 'photo' | 'inspect' | null;

export interface AstronautPose {
  speed: number;
  sprint: boolean;
  grounded: boolean;
  moving: boolean;
  slope: number;
  uphill: boolean;
  downhill: boolean;
  action: AstronautAction;
  actionProgress: number;
  tool: ToolId;
  firstPerson: boolean;
}

export class AstronautRig {
  readonly group = new THREE.Group();
  private bodyRoot = new THREE.Group();
  private torso = new THREE.Group();
  private head = new THREE.Group();
  private shoulders: THREE.Group[] = [];
  private elbows: THREE.Group[] = [];
  private hips: THREE.Group[] = [];
  private knees: THREE.Group[] = [];
  private props: Record<ToolId, THREE.Group>;
  private flashlight = new THREE.PointLight('#ffd9a8', 0.9, 7, 2);
  private walkPhase = 0;
  private time = 0;
  private lastAction: AstronautAction = null;
  private actionStart = 0;

  constructor() {
    this.group.name = 'astronaut-rig';
    this.group.add(this.bodyRoot);
    this.props = {
      scanner: new THREE.Group(),
      analyzer: new THREE.Group(),
      camera: new THREE.Group(),
    };
    this.build();
    this.bodyRoot.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;
      }
    });
  }

  private build() {
    // Hips / utility belt.
    const hipsRoot = new THREE.Group();
    hipsRoot.position.y = 0.84;
    this.bodyRoot.add(hipsRoot);

    const pelvis = mesh(new THREE.CapsuleGeometry(0.21, 0.16, 4, 12), suitShade, 0, 0.02, 0);
    pelvis.scale.set(1.12, 1, 0.8);
    hipsRoot.add(pelvis);

    const belt = mesh(new THREE.CylinderGeometry(0.235, 0.25, 0.1, 16, 1, true), fabric, 0, 0.1, 0);
    belt.scale.set(1, 1, 0.82);
    hipsRoot.add(belt);
    for (let i = 0; i < 4; i++) {
      const pouch = mesh(new THREE.BoxGeometry(0.1, 0.13, 0.06), accentDark, -0.17 + i * 0.11, 0.05, -0.18);
      pouch.rotation.x = i % 2 === 0 ? 0.05 : -0.04;
      hipsRoot.add(pouch);
    }
    const buckle = mesh(new THREE.BoxGeometry(0.1, 0.06, 0.03), metal, 0, 0.09, -0.205);
    hipsRoot.add(buckle);

    // Torso.
    this.torso.position.y = 0.88;
    this.bodyRoot.add(this.torso);

    const chest = mesh(new THREE.CapsuleGeometry(0.245, 0.34, 6, 16), suitWhite, 0, 0.27, 0);
    chest.scale.set(1.12, 1, 0.76);
    this.torso.add(chest);

    const lowerTorso = mesh(new THREE.CylinderGeometry(0.22, 0.235, 0.2, 16), fabric, 0, 0.03, 0);
    lowerTorso.scale.set(1.06, 1, 0.78);
    this.torso.add(lowerTorso);

    // Chest harness and control panel.
    const harnessL = mesh(new THREE.BoxGeometry(0.055, 0.5, 0.03), accent, -0.16, 0.3, -0.175);
    harnessL.rotation.z = -0.11;
    harnessL.scale.set(1, 1, 0.6);
    this.torso.add(harnessL);
    const harnessR = harnessL.clone();
    harnessR.position.x = 0.16;
    harnessR.rotation.z = 0.11;
    this.torso.add(harnessR);

    const panel = mesh(new THREE.BoxGeometry(0.27, 0.18, 0.035), darkMetal, 0, 0.31, -0.205);
    panel.rotation.x = 0.02;
    this.torso.add(panel);
    for (let i = 0; i < 4; i++) {
      const light = mesh(new THREE.CircleGeometry(0.013, 10), i === 0 ? warningLight : statusLight, -0.09 + i * 0.045, 0.35, -0.225);
      this.torso.add(light);
    }
    const gauge = mesh(new THREE.RingGeometry(0.035, 0.05, 20), glassMat, 0.075, 0.27, -0.225);
    this.torso.add(gauge);
    const gaugeNeedle = mesh(new THREE.BoxGeometry(0.006, 0.037, 0.003), warningLight, 0.075, 0.28, -0.229);
    gaugeNeedle.rotation.z = 0.55;
    this.torso.add(gaugeNeedle);

    // Name patch.
    const patchMat = new THREE.MeshBasicMaterial({ map: makePatchTexture(), toneMapped: false });
    const patch = mesh(new THREE.PlaneGeometry(0.17, 0.085), patchMat, -0.105, 0.19, -0.198);
    patch.rotation.y = -0.02;
    this.torso.add(patch);

    // Backpack / PLSS.
    const pack = mesh(new THREE.BoxGeometry(0.46, 0.56, 0.22), suitShade, 0, 0.31, 0.27);
    pack.rotation.x = -0.04;
    this.torso.add(pack);
    const packTop = mesh(new THREE.BoxGeometry(0.36, 0.11, 0.18), fabric, 0, 0.62, 0.27);
    this.torso.add(packTop);
    for (const x of [-0.13, 0.13]) {
      const tank = mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.34, 14), metal, x, 0.3, 0.405);
      this.torso.add(tank);
      const cap = mesh(new THREE.CylinderGeometry(0.045, 0.06, 0.06, 12), darkMetal, x, 0.49, 0.405);
      this.torso.add(cap);
    }
    const packPlate = mesh(new THREE.BoxGeometry(0.24, 0.1, 0.03), darkMetal, 0, 0.19, 0.395);
    this.torso.add(packPlate);
    for (let i = 0; i < 3; i++) {
      const vent = mesh(new THREE.BoxGeometry(0.16, 0.018, 0.02), fabric, 0, 0.23 + i * 0.035, 0.402);
      this.torso.add(vent);
    }
    const antenna = mesh(new THREE.CylinderGeometry(0.007, 0.011, 0.62, 6), metal, 0.18, 0.8, 0.28);
    antenna.rotation.z = 0.12;
    this.torso.add(antenna);
    const antennaTip = mesh(new THREE.SphereGeometry(0.022, 8, 8), warningLight, 0.215, 1.1, 0.28);
    this.torso.add(antennaTip);

    // Hose from pack to chest (visible suit detail).
    const hoseCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.29, 0.18, 0.28),
      new THREE.Vector3(0.34, 0.08, 0.08),
      new THREE.Vector3(0.3, 0.12, -0.14),
      new THREE.Vector3(0.22, 0.22, -0.2),
    ]);
    const hose = mesh(new THREE.TubeGeometry(hoseCurve, 24, 0.022, 6, false), fabric);
    this.torso.add(hose);

    // Neck ring and helmet.
    const neckRing = mesh(new THREE.TorusGeometry(0.155, 0.035, 8, 20), metal, 0, 0.585, 0);
    neckRing.rotation.x = Math.PI / 2;
    this.torso.add(neckRing);

    this.head.position.set(0, 0.72, 0);
    this.torso.add(this.head);
    const helmet = mesh(new THREE.SphereGeometry(0.275, 24, 18), suitWhite, 0, 0.02, 0);
    helmet.scale.set(1, 1.04, 1.02);
    this.head.add(helmet);
    const helmetTop = mesh(new THREE.SphereGeometry(0.16, 16, 12), suitShade, 0, 0.13, 0.05);
    helmetTop.scale.set(1.4, 0.5, 1.4);
    this.head.add(helmetTop);

    const visor = mesh(new THREE.SphereGeometry(0.225, 24, 18), visorMat, 0, 0.015, -0.135);
    visor.scale.set(0.88, 0.7, 0.62);
    this.head.add(visor);
    const visorRim = mesh(new THREE.TorusGeometry(0.178, 0.016, 8, 24), darkMetal, 0, 0.012, -0.24);
    visorRim.scale.set(1.12, 0.9, 1);
    this.head.add(visorRim);

    const lamp = mesh(new THREE.BoxGeometry(0.07, 0.055, 0.06), darkMetal, 0.16, 0.09, -0.21);
    this.head.add(lamp);
    const lampGlass = mesh(new THREE.CircleGeometry(0.024, 12), warningLight, 0.16, 0.09, -0.245);
    this.head.add(lampGlass);
    this.flashlight.position.set(0.16, 0.09, -0.3);
    this.head.add(this.flashlight);

    const earPod = mesh(new THREE.CylinderGeometry(0.045, 0.05, 0.035, 12), accent, -0.265, 0.02, 0);
    earPod.rotation.z = Math.PI / 2;
    this.head.add(earPod);

    // Arms.
    for (const side of [-1, 1]) {
      const shoulder = new THREE.Group();
      shoulder.position.set(side * 0.305, 0.48, 0);
      shoulder.rotation.z = side * 0.1;
      this.torso.add(shoulder);
      const cap = mesh(new THREE.SphereGeometry(0.115, 12, 10), suitShade, 0, 0, 0);
      cap.scale.set(1.05, 0.85, 1);
      shoulder.add(cap);
      const upper = mesh(new THREE.CapsuleGeometry(0.075, 0.26, 4, 10), suitWhite, 0, -0.19, 0);
      shoulder.add(upper);
      const stripe = mesh(new THREE.CylinderGeometry(0.077, 0.077, 0.04, 12, 1, true), accent, 0, -0.12, 0);
      shoulder.add(stripe);
      const elbow = new THREE.Group();
      elbow.position.y = -0.36;
      shoulder.add(elbow);
      const elbowJoint = mesh(new THREE.SphereGeometry(0.08, 12, 10), fabric, 0, 0, 0);
      elbow.add(elbowJoint);
      const forearm = mesh(new THREE.CapsuleGeometry(0.07, 0.23, 4, 10), suitWhite, 0, -0.16, 0);
      elbow.add(forearm);
      const cuff = mesh(new THREE.CylinderGeometry(0.08, 0.075, 0.06, 12), accentDark, 0, -0.27, 0);
      elbow.add(cuff);
      const glove = mesh(new THREE.SphereGeometry(0.085, 12, 10), fabric, 0, -0.34, -0.01);
      glove.scale.set(0.9, 1.05, 1.1);
      elbow.add(glove);
      this.shoulders.push(shoulder);
      this.elbows.push(elbow);
    }

    // Props (right hand = index 1).
    const rightElbow = this.elbows[1];

    // Scanner.
    const scannerBody = mesh(new THREE.BoxGeometry(0.1, 0.16, 0.06), darkMetal, 0, -0.04, -0.07);
    scannerBody.rotation.x = -0.15;
    this.props.scanner.add(scannerBody);
    const scannerScreen = mesh(new THREE.PlaneGeometry(0.07, 0.1), glassMat, 0, -0.04, -0.101);
    scannerScreen.rotation.x = -0.15;
    this.props.scanner.add(scannerScreen);
    const scannerGrip = mesh(new THREE.CylinderGeometry(0.02, 0.022, 0.1, 8), metal, 0, -0.12, -0.02);
    this.props.scanner.add(scannerGrip);
    this.props.scanner.position.set(0.02, -0.35, -0.03);

    // Analyzer tablet.
    const tablet = mesh(new THREE.BoxGeometry(0.2, 0.14, 0.025), darkMetal, 0, -0.03, -0.07);
    this.props.analyzer.add(tablet);
    const tabletScreen = mesh(new THREE.PlaneGeometry(0.16, 0.1), glassMat, 0, -0.03, -0.085);
    this.props.analyzer.add(tabletScreen);
    this.props.analyzer.position.set(0.02, -0.36, -0.06);

    // Camera.
    const camBody = mesh(new THREE.BoxGeometry(0.13, 0.09, 0.1), darkMetal, 0, -0.04, -0.09);
    this.props.camera.add(camBody);
    const lens = mesh(new THREE.CylinderGeometry(0.04, 0.045, 0.06, 14), metal, 0, -0.04, -0.16);
    lens.rotation.x = Math.PI / 2;
    this.props.camera.add(lens);
    const lensGlass = mesh(new THREE.CircleGeometry(0.03, 14), glassMat, 0, -0.04, -0.193);
    this.props.camera.add(lensGlass);
    this.props.camera.position.set(0.02, -0.36, -0.08);

    rightElbow.add(this.props.scanner, this.props.analyzer, this.props.camera);
    this.props.analyzer.visible = false;
    this.props.camera.visible = false;

    // Legs.
    for (const side of [-1, 1]) {
      const hip = new THREE.Group();
      hip.position.set(side * 0.145, -0.04, 0);
      hipsRoot.add(hip);
      const thigh = mesh(new THREE.CapsuleGeometry(0.095, 0.3, 4, 10), suitWhite, 0, -0.2, 0);
      hip.add(thigh);
      const thighStripe = mesh(new THREE.CylinderGeometry(0.095, 0.095, 0.028, 12, 1, true), accent, 0, -0.12, 0);
      hip.add(thighStripe);
      const knee = new THREE.Group();
      knee.position.y = -0.42;
      hip.add(knee);
      const kneeJoint = mesh(new THREE.SphereGeometry(0.09, 12, 10), fabric, 0, 0, 0);
      knee.add(kneeJoint);
      const kneePad = mesh(new THREE.BoxGeometry(0.12, 0.13, 0.06), suitShade, 0, -0.03, -0.075);
      knee.add(kneePad);
      const shin = mesh(new THREE.CapsuleGeometry(0.08, 0.27, 4, 10), suitWhite, 0, -0.18, 0);
      knee.add(shin);
      const shinStripe = mesh(new THREE.CylinderGeometry(0.082, 0.082, 0.035, 12, 1, true), accentDark, 0, -0.22, 0);
      knee.add(shinStripe);
      const boot = mesh(new THREE.BoxGeometry(0.17, 0.12, 0.29), suitShade, 0, -0.39, -0.045);
      boot.geometry.translate(0, 0, -0.015);
      knee.add(boot);
      const sole = mesh(new THREE.BoxGeometry(0.18, 0.035, 0.31), fabric, 0, -0.455, -0.05);
      knee.add(sole);
      this.hips.push(hip);
      this.knees.push(knee);
    }

    // Shoulder lamp on the left shoulder.
    const shoulderLamp = mesh(new THREE.BoxGeometry(0.06, 0.05, 0.07), darkMetal, -0.36, 0.54, -0.14);
    this.torso.add(shoulderLamp);
    const shoulderLampGlass = mesh(new THREE.CircleGeometry(0.02, 10), warningLight, -0.36, 0.54, -0.178);
    this.torso.add(shoulderLampGlass);

    // Data tether.
    const tether = mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.2, 6), fabric, 0.17, 0.16, -0.18);
    tether.rotation.z = 0.4;
    this.torso.add(tether);
  }

  setTool(tool: ToolId) {
    Object.entries(this.props).forEach(([key, group]) => {
      group.visible = key === tool;
    });
  }

  resetAction() {
    this.lastAction = null;
  }

  update(dt: number, pose: AstronautPose) {
    this.time += dt;
    this.group.visible = !pose.firstPerson;
    if (pose.firstPerson) return;
    this.setTool(pose.tool);

    if (pose.action && pose.action !== this.lastAction) {
      this.lastAction = pose.action;
      this.actionStart = this.time;
    }
    if (!pose.action) this.lastAction = null;

    const speedRatio = Math.min(1, pose.speed / 3.4);
    const moving = pose.moving && pose.speed > 0.12;
    if (moving) this.walkPhase += dt * (4.2 + pose.speed * 2.2);
    else this.walkPhase += dt * 0.8;

    const stride = moving ? Math.min(1, 0.35 + speedRatio * 0.9) : 0;
    const swing = Math.sin(this.walkPhase) * 0.56 * stride;
    const bounce = Math.abs(Math.sin(this.walkPhase * 2)) * 0.027 * stride;
    const breathing = Math.sin(this.time * 1.55) * 0.006;

    // Root / body.
    this.bodyRoot.position.y = bounce + breathing;
    this.bodyRoot.rotation.z = Math.sin(this.walkPhase) * 0.018 * stride;
    const uphillLean = pose.moving ? (pose.uphill ? -0.11 : pose.downhill ? 0.055 : 0) : 0;
    this.torso.rotation.x = uphillLean - speedRatio * 0.035 + Math.sin(this.walkPhase * 2 + 0.4) * 0.012 * stride;
    this.torso.rotation.y = -Math.sin(this.walkPhase) * 0.045 * stride;

    // Head stabilisation: keep the helmet roughly level while the torso leans.
    this.head.rotation.x = -this.torso.rotation.x * 0.65;

    // Legs.
    this.hips[0].rotation.x = swing;
    this.hips[1].rotation.x = -swing;
    this.knees[0].rotation.x = -Math.max(0, Math.sin(this.walkPhase + 0.4)) * 0.82 * stride;
    this.knees[1].rotation.x = -Math.max(0, Math.sin(this.walkPhase + Math.PI + 0.4)) * 0.82 * stride;

    // Arms counter-swing.
    this.shoulders[0].rotation.x = -swing * 0.7;
    this.shoulders[1].rotation.x = swing * 0.7;
    this.elbows[0].rotation.x = -0.05 - Math.max(0, -swing) * 0.24;
    this.elbows[1].rotation.x = -0.05 - Math.max(0, swing) * 0.24;
    this.shoulders[0].rotation.z = 0.1;
    this.shoulders[1].rotation.z = -0.1;

    // Actions override the right arm and posture.
    let actionT = 0;
    if (pose.action && this.lastAction) {
      const elapsed = this.time - this.actionStart;
      actionT = Math.min(1, elapsed / 0.35) * (elapsed > 2.2 ? Math.max(0, 1 - (elapsed - 2.2) / 0.4) : 1);
    }
    const blend = actionT;

    if (pose.action === 'scan') {
      this.shoulders[1].rotation.x = THREE.MathUtils.lerp(this.shoulders[1].rotation.x, 1.24 + Math.sin(this.time * 7) * 0.025, blend);
      this.shoulders[1].rotation.z = THREE.MathUtils.lerp(this.shoulders[1].rotation.z, -0.2, blend);
      this.elbows[1].rotation.x = THREE.MathUtils.lerp(this.elbows[1].rotation.x, -0.78, blend);
      this.head.rotation.x = THREE.MathUtils.lerp(this.head.rotation.x, 0.12, blend);
      this.shoulders[0].rotation.x = THREE.MathUtils.lerp(this.shoulders[0].rotation.x, 0.15, blend);
    } else if (pose.action === 'collect') {
      this.bodyRoot.position.y -= 0.17 * blend;
      this.torso.rotation.x = THREE.MathUtils.lerp(this.torso.rotation.x, -0.5, blend);
      this.shoulders[1].rotation.x = THREE.MathUtils.lerp(this.shoulders[1].rotation.x, 1.3, blend);
      this.elbows[1].rotation.x = THREE.MathUtils.lerp(this.elbows[1].rotation.x, -0.55, blend);
      this.shoulders[0].rotation.x = THREE.MathUtils.lerp(this.shoulders[0].rotation.x, 0.35, blend);
      this.hips[0].rotation.x = THREE.MathUtils.lerp(this.hips[0].rotation.x, -0.25, blend);
      this.hips[1].rotation.x = THREE.MathUtils.lerp(this.hips[1].rotation.x, -0.25, blend);
      this.knees[0].rotation.x = THREE.MathUtils.lerp(this.knees[0].rotation.x, -0.55, blend);
      this.knees[1].rotation.x = THREE.MathUtils.lerp(this.knees[1].rotation.x, -0.55, blend);
      this.head.rotation.x = THREE.MathUtils.lerp(this.head.rotation.x, 0.28, blend);
    } else if (pose.action === 'photo') {
      this.shoulders[0].rotation.x = THREE.MathUtils.lerp(this.shoulders[0].rotation.x, 1.42, blend);
      this.shoulders[1].rotation.x = THREE.MathUtils.lerp(this.shoulders[1].rotation.x, 1.42, blend);
      this.shoulders[0].rotation.z = THREE.MathUtils.lerp(this.shoulders[0].rotation.z, 0.28, blend);
      this.shoulders[1].rotation.z = THREE.MathUtils.lerp(this.shoulders[1].rotation.z, -0.28, blend);
      this.elbows[0].rotation.x = THREE.MathUtils.lerp(this.elbows[0].rotation.x, -0.75, blend);
      this.elbows[1].rotation.x = THREE.MathUtils.lerp(this.elbows[1].rotation.x, -0.75, blend);
      this.head.rotation.x = THREE.MathUtils.lerp(this.head.rotation.x, 0.08, blend);
    } else if (pose.action === 'inspect') {
      this.shoulders[1].rotation.x = THREE.MathUtils.lerp(this.shoulders[1].rotation.x, 0.75, blend);
      this.elbows[1].rotation.x = THREE.MathUtils.lerp(this.elbows[1].rotation.x, -0.65, blend);
      this.head.rotation.x = THREE.MathUtils.lerp(this.head.rotation.x, 0.16, blend);
    }

    // Small suit shiver when cold or after landing.
    if (pose.grounded && !moving) {
      this.head.rotation.y = Math.sin(this.time * 0.37) * 0.06;
    } else {
      this.head.rotation.y *= 0.95;
    }
  }
}

export function createFirstPersonArms(tool: ToolId): THREE.Group {
  const group = new THREE.Group();
  const left = new THREE.Group();
  const right = new THREE.Group();
  const forearmGeo = new THREE.CapsuleGeometry(0.055, 0.24, 4, 8);
  const gloveGeo = new THREE.SphereGeometry(0.072, 10, 8);
  const lm = new THREE.Mesh(forearmGeo, suitWhite);
  lm.position.set(-0.3, -0.24, -0.5);
  lm.rotation.set(-0.4, 0.1, 0.42);
  const lg = new THREE.Mesh(gloveGeo, fabric);
  lg.position.set(-0.23, -0.1, -0.62);
  lg.scale.set(0.9, 0.8, 1.1);
  left.add(lm, lg);
  right.add(lm.clone(), lg.clone());
  right.scale.x = -1;
  group.add(left, right);

  if (tool === 'scanner') {
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.16, 0.06), darkMetal);
    body.position.set(0.21, -0.06, -0.68);
    body.rotation.x = -0.2;
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.07, 0.1), glassMat);
    screen.position.set(0.21, -0.06, -0.712);
    screen.rotation.x = -0.2;
    group.add(body, screen);
  } else if (tool === 'analyzer') {
    const tablet = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.14, 0.025), darkMetal);
    tablet.position.set(0.12, -0.02, -0.66);
    tablet.rotation.set(-0.3, 0.2, 0.1);
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.1), glassMat);
    screen.position.set(0.12, -0.02, -0.676);
    screen.rotation.set(-0.3, 0.2, 0.1);
    group.add(tablet, screen);
  }
  group.visible = true;
  return group;
}
