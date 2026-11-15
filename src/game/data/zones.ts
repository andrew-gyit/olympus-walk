import type { PrecautionZone } from '../types';

/**
 * Precaution zones are scenario layers. All spatial boundaries here are SIMULATED
 * training boundaries for Olympus Mons Exploration Zone A. They are not official
 * COSPAR special regions and must not be read as real geospatial data.
 */
export const ZONES: PrecautionZone[] = [
  {
    id: 'zone-ice-t1',
    code: 'T-1 / UNCERTAIN',
    name: 'Uncertain Region T-1',
    type: 'uncertain',
    center: { x: 151, z: 115 },
    radius: 58,
    categories: ['environmental', 'planetary'],
    level: 'warning',
    dataClass: 'simulation',
    description:
      'A shallow depression with a cool-toned, polygonised surface and an unconfirmed volatile signature. It is classified UNCERTAIN in this training scenario: not a confirmed special region, but sensitive enough to require observation-only conduct.',
    measures: [
      'Observe and document from the marked perimeter; do not sample or excavate.',
      'Do not disturb polygon cracks or expose subsurface material.',
      'Record the observation and coordinate with the science team before any intervention.',
      'If a sample is ever authorised, use sealed, clean tools and log the chain of custody.',
    ],
    source: 'COSPAR Planetary Protection Policy (2020), special-region precautionary approach (technical guidance).',
    access: 'observe-only',
  },
  {
    id: 'zone-uncertain-u2',
    code: 'U-2 / UNCERTAIN',
    name: 'Uncertain Region U-2',
    type: 'uncertain',
    center: { x: -214, z: -176 },
    radius: 48,
    categories: ['environmental', 'planetary'],
    level: 'warning',
    dataClass: 'simulation',
    description:
      'A fractured slope with ambiguous spectral indicators. The available data are insufficient to classify it as a special region. The precautionary approach applies until a proper assessment is available.',
    measures: [
      'Treat ambiguous indicators as potentially sensitive.',
      'Remain on the survey marker and record observations only.',
      'Do not collect, drill or disturb surface material.',
      'Report the uncertainty explicitly in the field log.',
    ],
    source: 'COSPAR (2020); NASA Planetary Protection Handbook (NASA/SP-20240016475), uncertain-region guidance (technical).',
    access: 'observe-only',
  },
  {
    id: 'zone-crater',
    code: 'C-1 / CRATER',
    name: 'Crater Rim Precaution',
    type: 'topographic',
    center: { x: -152, z: 28 },
    radius: 67,
    categories: ['topographical', 'environmental'],
    level: 'caution',
    dataClass: 'derived',
    description:
      'Impact crater with a broken rim, loose talus and steep inner slopes. The floor is a cold trap in the thermal model. Rockfall and unstable footing are the dominant risks.',
    measures: [
      'Stay on the stable rim and keep away from talus fans.',
      'Check slope and elevation layers before descending.',
      'Maintain line of sight with your traverse partner or base.',
      'Do not enter the steep inner bowl on foot.',
    ],
    source: 'Simulated slope/elevation analysis derived from the Zone A height field.',
    access: 'traverse-with-care',
  },
  {
    id: 'zone-scarp',
    code: 'S-1 / SCARP',
    name: 'Southern Scarp',
    type: 'topographic',
    center: { x: -20, z: 176 },
    radius: 72,
    categories: ['topographical'],
    level: 'warning',
    dataClass: 'derived',
    description:
      'A steep east–west scarp with loose debris. The direct ascent exceeds the configured comfortable slope threshold; a gentler pass exists to the east near x ≈ 82.',
    measures: [
      'Evaluate the slope layer before choosing an approach.',
      'Prefer the eastern pass for the traverse.',
      'Keep a wide margin from the break in slope.',
      'Turn back if the surface is loose or the slope exceeds your configured limit.',
    ],
    source: 'Simulated terrain analysis (slope derived from the Zone A height field).',
    access: 'traverse-with-care',
  },
  {
    id: 'zone-rough',
    code: 'R-1 / REGOLITH',
    name: 'Rough Regolith Field',
    type: 'topographic',
    center: { x: -18, z: 160 },
    radius: 42,
    categories: ['topographical', 'environmental'],
    level: 'caution',
    dataClass: 'simulation',
    description:
      'Loose, poorly sorted regolith with brittle crust and small pits. Bearing strength is variable. This is a mobility hazard, not a biological restriction.',
    measures: [
      'Test footing before committing weight.',
      'Avoid pit margins and freshly disturbed dust.',
      'Reduce speed and increase step spacing.',
      'Log any surface collapse or unstable ground as an incident.',
    ],
    source: 'Simulation scenario; mobility parameters are fictional training values.',
    access: 'traverse-with-care',
  },
  {
    id: 'zone-rad-r1',
    code: 'RAD-SIM / R-2',
    name: 'High Radiation Sector (SIM)',
    type: 'radiation',
    center: { x: 252, z: -46 },
    radius: 54,
    categories: ['environmental'],
    level: 'caution',
    dataClass: 'simulation',
    description:
      'A simulated sector used to demonstrate a radiation layer. The displayed dose rate is a scenario parameter, not a measurement from a Mars instrument. Real surface radiation depends on altitude, atmosphere and solar activity.',
    measures: [
      'Limit dwell time in the sector in this training scenario.',
      'Monitor the suit environmental display.',
      'Do not treat the simulated values as operational guidance.',
      'Return to base if the scenario dose counter rises.',
    ],
    source: 'SIMULATION DATA — scenario parameter. Not a real radiation measurement.',
    access: 'traverse-with-care',
  },
  {
    id: 'zone-camp',
    code: 'BC-A / CONTROL',
    name: 'Base Camp A Controlled Area',
    type: 'controlled',
    center: { x: 0, z: 0 },
    radius: 54,
    categories: ['planetary'],
    level: 'info',
    dataClass: 'simulation',
    description:
      'The immediate camp perimeter is treated as a controlled area to limit forward contamination and keep equipment access clear. Recharge, sample sealing and suit checks happen here.',
    measures: [
      'Seal samples before entering the habitat module.',
      'Keep the airlock approach clear.',
      'Report any suit damage or contamination event.',
      'Do not cache unsealed equipment outside the marked storage zone.',
    ],
    source: 'Mission protocol (training scenario); informed by NASA planetary protection practice (technical guidance).',
    access: 'restricted',
  },
];

export const ZONE_BY_ID = Object.fromEntries(ZONES.map((z) => [z.id, z])) as Record<string, PrecautionZone>;

export function zoneAt(x: number, z: number): PrecautionZone | null {
  let best: PrecautionZone | null = null;
  let bestScore = Infinity;
  for (const zone of ZONES) {
    if (zone.id === 'zone-camp') continue;
    const d = Math.hypot(x - zone.center.x, z - zone.center.z);
    if (d <= zone.radius && d / zone.radius < bestScore) {
      best = zone;
      bestScore = d / zone.radius;
    }
  }
  return best;
}
