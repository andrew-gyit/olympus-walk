import { RESOURCES, WORLD } from '../config';
import { POIS, POI_BY_ID } from '../data/pois';
import { zoneAt } from '../data/zones';
import { useGameStore } from '../../stores/gameStore';
import { terrainGenerator } from '../../world/TerrainGenerator';
import { audioManager } from './AudioManager';
import { runtimeBridge } from './RuntimeBridge';
import type { InteractionTarget, POI } from '../types';

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const rand = (a: number, b: number) => a + Math.random() * (b - a);

function interactionFor(poi: POI, analyzed: boolean, collected: boolean, tool: string): InteractionTarget {
  let prompt = 'Inspect target';
  let action = 'INSPECT';
  if (tool === 'camera') {
    prompt = `Photograph ${poi.shortName}`;
    action = 'PHOTO';
  } else if (!analyzed) {
    if (poi.interaction === 'observe') {
      prompt = `Observe ${poi.shortName} from the perimeter`;
      action = 'OBSERVE';
    } else if (poi.interaction === 'survey') {
      prompt = `Survey ${poi.shortName}`;
      action = 'SURVEY';
    } else {
      prompt = `Analyze ${poi.shortName}`;
      action = 'ANALYZE';
    }
  } else if (poi.canSample && !collected) {
    prompt = `Collect sealed sample · ${poi.sampleType ?? poi.shortName}`;
    action = 'SAMPLE';
  } else if (poi.type === 'ice') {
    prompt = 'Record perimeter observation';
    action = 'OBSERVE';
  } else {
    prompt = `Log observation · ${poi.shortName}`;
    action = 'OBSERVE';
  }
  return { poiId: poi.id, prompt, action, distance: 0 };
}

/**
 * Drives the non-visual simulation: life support, weather, hazard detection,
 * field-target prompts and periodic autosave. Written to be cheap enough to run
 * every frame while only writing to the store at human-visible rates.
 */
export class GameSimulation {
  private missionClock = 0;
  private resourceClock = 0;
  private envClock = 0;
  private interactionClock = 0;
  private alertClock = 0;
  private saveClock = 0;
  private elapsedAccum = 0;
  private campEnteredAt = 0;
  private campAlertAt = 0;
  private stormCooldown = rand(260, 430);
  private stormRemaining = 0;
  private stormWarned = false;
  private radiationWarnAt = 0;
  private slipWarnAt = 0;
  private slopeAlertAt = 0;
  private lowWarnings = new Set<string>();
  private wasAtCamp = false;

  reset() {
    this.missionClock = 0;
    this.resourceClock = 0;
    this.envClock = 0;
    this.interactionClock = 0;
    this.alertClock = 0;
    this.saveClock = 0;
    this.elapsedAccum = 0;
    this.stormCooldown = rand(260, 430);
    this.stormRemaining = 0;
    this.stormWarned = false;
    this.radiationWarnAt = 0;
    this.slipWarnAt = 0;
    this.slopeAlertAt = 0;
    this.lowWarnings.clear();
    this.wasAtCamp = false;
    this.campEnteredAt = 0;
  }

  onLand(impact: number) {
    audioManager.land(impact);
    if (impact < 4.4) return;
    const s = useGameStore.getState();
    if (s.phase !== 'playing') return;
    s.updateResources({ suitIntegrity: s.resources.suitIntegrity - Math.min(8, impact * 1.15) });
    s.logIncident(
      'HARD LANDING',
      `Landing impact of ${impact.toFixed(1)} m/s. Suit integrity reduced. Check suit joints and continue at reduced pace.`,
      -5
    );
  }

  onFootstep(x: number, _z: number, _heading: number, running: boolean) {
    audioManager.footstep(running);
  }

  onScan() {
    audioManager.scan();
  }

  onAnalyze() {
    audioManager.analyze();
  }

  onPhoto() {
    audioManager.shutter();
  }

  interact(): boolean {
    const s = useGameStore.getState();
    if (s.phase !== 'playing' || !s.interaction) return false;
    const target = s.interaction;
    if (target.poiId === 'camp') {
      if (s.mission?.returnPrompt) {
        s.finishMission('complete');
        return true;
      }
      audioManager.success();
      s.addAlert(
        'info',
        'BASE CAMP A',
        'Suit service active. Complete the mission objectives before closing the traverse.',
        'camp-service',
        4200
      );
      return true;
    }
    const poi = POI_BY_ID[target.poiId];
    if (!poi) return false;
    if (s.tool === 'camera') {
      const ok = runtimeBridge.api?.capturePhoto(poi.id) ?? false;
      if (ok) s.setHint('Image added to the scientific record. Open INVENTORY to review photographs.', 4200);
      return ok;
    }
    s.interactWithPoi(poi.id);
    return true;
  }

  captureLandscape(): boolean {
    const s = useGameStore.getState();
    if (s.phase !== 'playing') return false;
    const ok = runtimeBridge.api?.capturePhoto(null) ?? false;
    if (ok) s.setHint('Landscape frame captured. Field cameras use battery power.', 4200);
    return ok;
  }

  update(dt: number) {
    const s = useGameStore.getState();
    if (s.phase !== 'playing') return;
    const safeDt = Math.min(dt, 0.1);
    this.missionClock += safeDt;
    this.resourceClock += safeDt;
    this.envClock += safeDt;
    this.interactionClock += safeDt;
    this.alertClock += safeDt;
    this.saveClock += safeDt;
    this.elapsedAccum += safeDt;

    if (this.elapsedAccum >= 0.45) {
      s.tickMission(this.elapsedAccum);
      this.elapsedAccum = 0;
    }

    const pos = s.telemetry.position;
    const campDistance = Math.hypot(pos.x, pos.z);
    const speed = s.telemetry.speed;

    if (this.resourceClock >= 0.25) {
      this.updateResources(this.resourceClock, campDistance, speed);
      this.resourceClock = 0;
    }

    if (this.envClock >= 1) {
      this.updateEnvironment(this.envClock, pos.x, pos.z, speed);
      this.envClock = 0;
    }

    if (this.interactionClock >= 0.2) {
      this.updateInteraction(pos.x, pos.z);
      this.interactionClock = 0;
    }

    if (this.alertClock >= 1) {
      s.expireAlerts(Date.now());
      const hint = s.hint;
      if (hint && Date.now() > hint.until) s.clearHint();
      if (s.scan.active && Date.now() - s.scan.startedAt > 3400) {
        useGameStore.setState({ scan: { ...s.scan, active: false } });
      }
      if (s.scan.cooldown > 0) {
        useGameStore.setState({ scan: { ...useGameStore.getState().scan, cooldown: Math.max(0, s.scan.cooldown - 1) } });
      }
      this.alertClock = 0;
    }

    if (this.saveClock >= 22) {
      this.saveClock = 0;
      s.saveNow();
    }

    // Steep-ground slip hazard: the risk only materialises when moving on very steep faces.
    if (speed > 0.6 && s.telemetry.slope > 47 && this.stormRemaining <= 0) {
      if (Math.random() < safeDt * 0.035 && performance.now() - this.slipWarnAt > 25000) {
        this.slipWarnAt = performance.now();
        s.updateResources({ suitIntegrity: s.resources.suitIntegrity - 2.5, physical: s.resources.physical - 4 });
        s.logIncident(
          'SLIP ON STEEP GROUND',
          `${Math.round(s.telemetry.slope)}° slope at ${Math.round(pos.x)}, ${Math.round(pos.z)}. Minor suit contact. Move to a gentler line.`,
          -6
        );
        s.addAlert('warning', 'SLIP DETECTED', 'Footing lost on loose steep ground. Reduce pace and find a safer line.', 'slip', 5000);
      }
    }

    if (s.telemetry.slope > 45 && speed > 0.6 && performance.now() - this.slopeAlertAt > 17000) {
      this.slopeAlertAt = performance.now();
      if (!this.lowWarnings.has('slope')) {
        this.lowWarnings.add('slope');
        s.setHint('Steep line. Open the wrist map (M) and enable SLOPE to compare gentler alternatives.', 7000);
      }
    }
  }

  private updateResources(dt: number, campDistance: number, speed: number) {
    const s = useGameStore.getState();
    if (s.phase !== 'playing') return;
    const r = s.resources;
    const moving = speed > 0.2;
    const sprinting = speed > 2.65;
    const atCamp = campDistance <= WORLD.returnRadius + 5;

    let oxygen = r.oxygen;
    let battery = r.battery;
    let thermal = r.thermal;
    let physical = r.physical;
    let suit = r.suitIntegrity;

    if (atCamp) {
      const rate = RESOURCES.campRechargeRate * dt;
      oxygen = clamp(oxygen + rate * 1.1, 0, 100);
      battery = clamp(battery + rate * 0.9, 0, 100);
      thermal = clamp(thermal + rate * 0.7, 0, 100);
      physical = clamp(physical + rate * 0.6, 0, 100);
      suit = clamp(suit + rate * 0.12, 0, 100);
      if (!this.wasAtCamp) {
        this.wasAtCamp = true;
        this.campEnteredAt = performance.now();
        s.addAlert('success', 'BASE CAMP SERVICE', 'Life-support reserves recharging. Sample bay available.', 'camp-recharge', 5000);
        audioManager.success();
      }
    } else {
      this.wasAtCamp = false;
      const exposure = 1 + (s.environment.dustStorm ? 0.55 : 0);
      const oxRate =
        (sprinting
          ? RESOURCES.oxygenSprintPerSec
          : moving
            ? RESOURCES.oxygenWalkPerSec
            : RESOURCES.oxygenIdlePerSec) + (s.scan.active ? RESOURCES.oxygenScanPerSec : 0);
      oxygen -= oxRate * dt * exposure;
      battery -= (RESOURCES.batteryIdlePerSec + (sprinting ? RESOURCES.batterySprintPerSec : 0)) * dt;
      thermal -= (RESOURCES.thermalColdPerSec + (moving ? RESOURCES.thermalExertionPerSec : 0)) * dt * exposure;
      physical -= (sprinting ? 0.05 : moving ? 0.016 : -0.035) * dt;
      suit = clamp(suit + RESOURCES.suitRecoveryPerSec * dt - (s.telemetry.slope > 45 && moving ? 0.012 : 0), 0, 100);
      if (thermal < 24) suit -= 0.018 * dt;
      if (s.environment.dustStorm) suit -= 0.008 * dt;
    }

    s.updateResources({
      oxygen: clamp(oxygen, 0, 100),
      battery: clamp(battery, 0, 100),
      thermal: clamp(thermal, 0, 100),
      physical: clamp(physical, 0, 100),
      suitIntegrity: clamp(suit, 0, 100),
    });

    const warn = (key: string, value: number, level: 'caution' | 'warning' | 'critical', title: string, msg: string) => {
      const band = value <= 6 ? 'critical' : value <= 18 ? 'warning' : value <= 32 ? 'caution' : null;
      if (!band) {
        this.lowWarnings.delete(key);
        return;
      }
      const signature = `${key}-${band}`;
      if (this.lowWarnings.has(signature)) return;
      this.lowWarnings.add(signature);
      for (const old of Array.from(this.lowWarnings)) {
        if (old.startsWith(`${key}-`) && old !== signature) this.lowWarnings.delete(old);
      }
      s.addAlert(band, title, msg, signature, band === 'critical' ? 9000 : 6000);
      if (band !== 'caution') audioManager.alert(band);
    };

    warn(
      'oxygen',
      oxygen,
      'critical',
      'OXYGEN RESERVE LOW',
      `${Math.round(oxygen)}% remaining. Return to Base Camp A immediately.`
    );
    warn(
      'battery',
      battery,
      'caution',
      'BATTERY RESERVE LOW',
      `${Math.round(battery)}% remaining. Instruments will shut down at zero. Recharge at camp.`
    );
    warn(
      'thermal',
      thermal,
      'caution',
      'THERMAL LOAD HIGH',
      `${Math.round(thermal)}% suit thermal margin. Reduce exposure and return toward camp.`
    );
    warn(
      'physical',
      physical,
      'caution',
      'CREW FATIGUE',
      `${Math.round(physical)}% physical reserve. Slow down; support hops are restricted.`
    );
    warn(
      'suit',
      suit,
      'warning',
      'SUIT INTEGRITY',
      `${Math.round(suit)}% integrity. Avoid further impacts and steep loose ground.`
    );

    if (oxygen <= 0) s.failFromResources('Oxygen reserve exhausted. Life-support failure ends the traverse.');
    else if (suit <= 0) s.failFromResources('Suit integrity exhausted. Emergency extraction required.');
    else if (thermal <= 0) s.failFromResources('Thermal reserve exhausted. Crew extraction triggered.');
  }

  private updateEnvironment(dt: number, x: number, z: number, speed: number) {
    const s = useGameStore.getState();
    if (s.phase !== 'playing') return;
    const t = s.environment.timeOfSol + dt / 760;
    const timeOfSol = t % 1;
    const sun = Math.sin(Math.PI * clamp(timeOfSol, 0.03, 0.97));
    const baseTemp = terrainGenerator.temperatureAt(x, z, sun, timeOfSol);

    if (this.stormRemaining > 0) {
      this.stormRemaining -= dt;
      if (this.stormRemaining <= 0) {
        this.stormCooldown = rand(280, 480);
        s.updateEnvironment({ dustStorm: false, stormIntensity: 0, windMs: 6.4, dust: 0.34 });
        s.addAlert('info', 'DUST STORM CLEARING', 'Visibility improving. Resume the planned traverse.', 'storm-end', 5000);
        s.addEvent({
          type: 'storm-end',
          title: 'Dust storm cleared',
          detail: 'Wind dropped below the field threshold. The route remains unchanged.',
          category: 'hazard',
          risk: 'info',
        });
      }
    } else {
      this.stormCooldown -= dt;
      if (this.stormCooldown <= 0) {
        this.stormRemaining = rand(48, 82);
        this.stormWarned = false;
        s.addAlert(
          'warning',
          'DUST STORM INBOUND',
          'Wind and dust rising. Visibility and comms will degrade. Consider returning to camp.',
          'storm-start',
          9500
        );
        s.addEvent({
          type: 'storm-start',
          title: 'Local dust storm',
          detail: 'Simulated weather event. Wind and dust increase suit thermal load and reduce communication quality.',
          category: 'hazard',
          risk: 'warning',
          recommendation: 'Shorten the route, keep camp in line of sight, monitor thermal reserve.',
        });
        audioManager.alert('warning');
      }
    }

    const storming = this.stormRemaining > 0;
    const stormIntensity = storming ? clamp(this.stormRemaining / 80, 0.15, 1) : 0;
    const wind = storming ? 17 + stormIntensity * 11 + Math.sin(t * 41) * 2.4 : 5.4 + Math.sin(t * 27) * 1.7;
    const dust = storming ? 0.58 + stormIntensity * 0.34 : 0.3 + Math.sin(t * 13) * 0.05;
    const zone = zoneAt(x, z);
    const radiation = zone?.type === 'radiation' ? 3.4 + Math.sin(t * 22) * 0.5 : 0.24 + Math.abs(Math.sin(t * 6)) * 0.08;

    s.updateEnvironment({
      ambientTempC: Math.round(baseTemp * 10) / 10,
      windMs: Math.round(wind * 10) / 10,
      windGust: Math.round((wind * 0.32 + Math.random() * 1.2) * 10) / 10,
      dust: Math.round(dust * 100) / 100,
      solarFlux: Math.round(sun * 100) / 100,
      radiationUSvH: Math.round(radiation * 100) / 100,
      pressureKPa: 0.58 + Math.sin(t * 9) * 0.02,
      dustStorm: storming,
      stormIntensity: Math.round(stormIntensity * 100) / 100,
      timeOfSol: Math.round(timeOfSol * 1000) / 1000,
      sunriseIn: Math.round((1 - timeOfSol) * 760),
    });

    if (zone?.type === 'radiation' && performance.now() - this.radiationWarnAt > 30000) {
      this.radiationWarnAt = performance.now();
      s.addAlert(
        'caution',
        'SIMULATED RADIATION SECTOR',
        'Dose rate is a scenario parameter, not a measurement. Reduce dwell time.',
        'rad-sector',
        6500
      );
    }

    audioManager.update(wind, dust, speed, storming);
  }

  private updateInteraction(x: number, z: number) {
    const s = useGameStore.getState();
    if (s.phase !== 'playing') return;
    let nearest: { poi: POI; distance: number } | null = null;
    for (const poi of POIS) {
      const d = Math.hypot(x - poi.x, z - poi.z);
      if (d <= poi.radius + 5.2 && (!nearest || d < nearest.distance)) nearest = { poi, distance: d };
    }
    const campDistance = Math.hypot(x, z);
    if (campDistance <= WORLD.returnRadius + 4 && (!nearest || campDistance < nearest.distance)) {
      const prompt = s.mission?.returnPrompt
        ? 'Close the traverse at Base Camp A'
        : 'Base Camp A · recharge and sample sealing';
      s.setInteraction({ poiId: 'camp', prompt, action: s.mission?.returnPrompt ? 'COMPLETE' : 'CAMP', distance: campDistance });
      return;
    }
    if (!nearest) {
      s.setInteraction(null);
      return;
    }
    const analyzed = !!s.analyzed[nearest.poi.id];
    const collected = !!s.collected[nearest.poi.id];
    const target = interactionFor(nearest.poi, analyzed, collected, s.tool);
    target.distance = Math.round(nearest.distance * 10) / 10;
    s.setInteraction(target);
  }
}

export const gameSimulation = new GameSimulation();
