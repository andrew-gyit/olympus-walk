export interface ProtectionPrinciple {
  id: string;
  index: number;
  title: string;
  subtitle: string;
  objective: string;
  summary: string;
  measures: string[];
  source: string;
  classification: 'legal obligation' | 'technical recommendation' | 'mixed';
}

export const PROTECTION_PRINCIPLES: ProtectionPrinciple[] = [
  {
    id: 'environment',
    index: 1,
    title: 'PROTECT THE MARTIAN ENVIRONMENT',
    subtitle: 'Protect the martian environment',
    objective:
      'Prevent biological contamination and preserve the natural conditions of Mars for future scientific investigation.',
    summary:
      'Do not introduce or disperse terrestrial microorganisms. Keep tools clean, limit unnecessary interventions and handle samples as potentially sensitive material.',
    measures: [
      'Avoid introducing or dispersing terrestrial microorganisms on the surface.',
      'Respect equipment cleaning and contamination-control protocols.',
      'Avoid unnecessary interventions in astrobiologically interesting areas.',
      'Maintain special precautions while collecting and handling samples.',
    ],
    source:
      'Outer Space Treaty (1967), Article IX (harmful contamination); COSPAR Planetary Protection Policy (2020) (technical standards).',
    classification: 'mixed',
  },
  {
    id: 'special-regions',
    index: 2,
    title: 'WATCH FOR SPECIAL REGIONS',
    subtitle: 'Watch for special regions',
    objective:
      'Identify areas that may be favourable for the survival or proliferation of terrestrial microorganisms, and areas relevant to the search for martian life.',
    summary:
      'Some areas may be sensitive even if they look ordinary. Verified special regions and uncertain regions are different categories. This training zone uses fictional, clearly marked boundaries.',
    measures: [
      'Recognise special regions identified by COSPAR assessments.',
      'Watch for possible liquid water, geothermal activity and other relevant features.',
      'Do not enter or intervene in these areas without scientific assessment and operational authorisation.',
      'Treat uncertain regions with a precautionary approach until evidence is sufficient.',
    ],
    source:
      'COSPAR Planetary Protection Policy (2020); NASA Planetary Protection Handbook NASA/SP-20240016475, Section 2.1.4 (technical guidance).',
    classification: 'technical recommendation',
  },
  {
    id: 'terrain',
    index: 3,
    title: 'ASSESS THE TERRAIN BEFORE MOVING',
    subtitle: 'Assess the terrain before moving',
    objective:
      'Reduce the physical risks associated with terrain during surface traverses and preserve the scientific context of the site.',
    summary:
      'Read slopes, depressions, obstacles and uncertain surfaces before committing. Possible ice or brine indicators are scientific signals, not proof of water or life.',
    measures: [
      'Review slopes and elevation changes before selecting a route.',
      'Identify steep ground, depressions and possible obstacles.',
      'Evaluate the stability and traversability of each sector.',
      'Prefer routes with conditions appropriate for mobility.',
    ],
    source:
      'Mission terrain-assessment procedure (training scenario); mobility thresholds are simulator parameters, not certified human limits.',
    classification: 'technical recommendation',
  },
  {
    id: 'mission-measures',
    index: 4,
    title: 'FOLLOW MISSION PROTECTION MEASURES',
    subtitle: 'Follow mission protection measures',
    objective:
      'Keep the explorer informed about route conditions, alerts, scientific stops and the protection measures established for the mission.',
    summary:
      'Consult the planned route, check alerts during the traverse and update the assessment when a new risk appears. Record observations rather than intervening when the protocol requires restraint.',
    measures: [
      'Consult the planned route and verify the scientific stops.',
      'Review the condition panel and alerts during the traverse.',
      'Update the route assessment when a new risk is identified.',
      'Record relevant observations for the scientific record.',
    ],
    source:
      'Mission operations protocol (fictional training scenario); NASA planetary-protection implementation practice (technical guidance).',
    classification: 'technical recommendation',
  },
];

export interface LegalSource {
  id: string;
  title: string;
  year: string;
  type: 'binding treaty' | 'technical policy' | 'guidance' | 'convention';
  relevance: string;
  url: string;
  note: string;
}

export const LEGAL_SOURCES: LegalSource[] = [
  {
    id: 'ost-1967',
    title: 'Treaty on Principles Governing the Activities of States in the Exploration and Use of Outer Space, including the Moon and Other Celestial Bodies',
    year: '1967',
    type: 'binding treaty',
    relevance:
      'Article IX requires States to conduct exploration so as to avoid harmful contamination of celestial bodies and adverse changes in the environment of the Earth. Articles I and II frame exploration as benefiting all countries and prohibit national appropriation.',
    url: 'https://www.unoosa.org/oosa/en/ourwork/spacelaw/treaties/outerspacetreaty.html',
    note:
      'This is a legal obligation on States Parties. The simulator translates it into an educational field mechanic; it does not make legal determinations.',
  },
  {
    id: 'cospar-2020',
    title: 'COSPAR Planetary Protection Policy',
    year: '2020',
    type: 'technical policy',
    relevance:
      'Provides the internationally recognised technical framework for planetary protection categories, including Mars categories and the precautionary treatment of special and uncertain regions.',
    url: 'https://cosparhq.cnes.fr/assets/uploads/2020/07/PPPolicyJune-2020_Final_Web.pdf',
    note:
      'Technical policy, not a treaty. Mission implementation and categorisation are separate operational decisions.',
  },
  {
    id: 'nasa-8719',
    title: 'NASA-STD-8719.27 — Standard for Planetary Protection',
    year: 'current revision',
    type: 'technical policy',
    relevance:
      'NASA procedural standard for implementing planetary-protection requirements, contamination control and mission assurance.',
    url: 'https://standards.nasa.gov/standard/NASA/NASA-STD-871927',
    note: 'Agency standard and implementation guidance, not international law.',
  },
  {
    id: 'nasa-handbook',
    title: 'NASA Planetary Protection Handbook (NASA/SP-20240016475)',
    year: '2024',
    type: 'guidance',
    relevance:
      'Guidance on special regions and uncertain regions, including the precautionary approach when evidence is insufficient.',
    url: 'https://ntrs.nasa.gov/api/citations/20240016475/downloads/PlanetaryProtection_Hdbk_2024_Final_For508ing_copy.pdf',
    note: 'Technical guidance; scenario boundaries in this game are fictional.',
  },
  {
    id: 'registration-1975',
    title: 'Convention on Registration of Objects Launched into Outer Space',
    year: '1975',
    type: 'convention',
    relevance:
      'Establishes registration and identification of space objects. Relevant in the scenario to the fictional abandoned relay package, which remains a registered space object.',
    url: 'https://www.unoosa.org/oosa/en/ourwork/spacelaw/treaties/registration-convention.html',
    note: 'Legal instrument. The relay package in Zone A is fictional and clearly labelled as such.',
  },
  {
    id: 'liability-1972',
    title: 'Convention on International Liability for Damage Caused by Space Objects',
    year: '1972',
    type: 'convention',
    relevance:
      'Frames international liability for damage caused by space objects, including on celestial bodies. Relevant context for equipment and site stewardship.',
    url: 'https://www.unoosa.org/oosa/en/ourwork/spacelaw/treaties/liability-convention.html',
    note: 'Legal instrument; this simulation does not assess liability or damages.',
  },
  {
    id: 'artemis-2020',
    title: 'Artemis Accords',
    year: '2020',
    type: 'guidance',
    relevance:
      'Non-binding principles for civil exploration, including transparency, interoperability, emergency assistance, registration and protection of heritage.',
    url: 'https://www.nasa.gov/artemis-accords/',
    note: 'Political commitment / guidance. Not a substitute for the Outer Space Treaty.',
  },
  {
    id: 'unoosa-2019',
    title: 'Guidelines for the Long-term Sustainability of Outer Space Activities',
    year: '2019',
    type: 'guidance',
    relevance:
      'UN guidance on sustainable space operations, information exchange and responsible behaviour. Provides context for long-term stewardship.',
    url: 'https://www.unoosa.org/oosa/en/ourwork/topics/long-term-sustainability-of-outer-space-activities.html',
    note: 'Voluntary guidelines; relevant context, not a field-authorisation rule.',
  },
];

export const DATA_SOURCES = [
  {
    name: 'NASA Mars Trek',
    provider: 'NASA',
    types: ['MOLA topography', 'THEMIS thermal', 'CTX / HiRISE imagery'],
    status: 'Public interactive portal. No direct API is bundled with this offline build.',
    url: 'https://trek.nasa.gov/mars/',
    dataClass: 'real' as const,
  },
  {
    name: 'NASA Mars 2020 Raw Images',
    provider: 'NASA / JPL-Caltech',
    types: ['Surface imagery'],
    status: 'Public image archive. This build uses procedural surface imagery, not mission photographs.',
    url: 'https://mars.nasa.gov/mars2020/multimedia/raw-images/',
    dataClass: 'real' as const,
  },
  {
    name: 'NASA Worldview',
    provider: 'NASA EOSDIS',
    types: ['Earth observation / contextual imagery'],
    status: 'Public portal; not a Mars surface data source for this build.',
    url: 'https://worldview.earthdata.nasa.gov/',
    dataClass: 'real' as const,
  },
  {
    name: 'USGS Astrogeology Mars Maps',
    provider: 'USGS',
    types: ['Geologic maps', 'Interactive Mars maps'],
    status: 'Public portal. Reference material only in this offline prototype.',
    url: 'https://astrogeology-usgs.hub.arcgis.com/pages/interactive-maps-mars/',
    dataClass: 'real' as const,
  },
  {
    name: 'MOLA',
    provider: 'NASA / MGS',
    types: ['Topography'],
    status: 'Informs the concept of a height field. Zone A relief is procedural, not MOLA.',
    url: 'https://pds-geosciences.wustl.edu/missions/mgs/mola.html',
    dataClass: 'derived' as const,
  },
  {
    name: 'THEMIS',
    provider: 'NASA / Mars Odyssey',
    types: ['Thermal inertia', 'Temperature context'],
    status: 'Informs the thermal-layer concept. Displayed temperatures are a local simulation.',
    url: 'https://themis.asu.edu/',
    dataClass: 'derived' as const,
  },
  {
    name: 'HiRISE / CTX',
    provider: 'NASA / UA / MSSS',
    types: ['High-resolution orbital imagery'],
    status: 'Informs the surface-layer concept. No orbital image tiles are loaded offline.',
    url: 'https://www.uahirise.org/',
    dataClass: 'derived' as const,
  },
  {
    name: 'CRISM',
    provider: 'NASA / JHUAPL',
    types: ['Mineralogical spectral indicators'],
    status: 'Informs the mineral-layer concept. Mineral signatures here are training analogues.',
    url: 'https://crism.jhuapl.edu/',
    dataClass: 'derived' as const,
  },
];

export const DISCLAIMER =
  'OLYMPUS WALK is an educational and experimental simulator. Exploration Zone A is a fictional training terrain inspired by the geology of Olympus Mons; it is not a scientifically exact reproduction and must not be used to authorise, plan or certify a real human Marswalk. Resource thresholds, mobility limits, temperatures, radiation values and precaution boundaries are simulator parameters. Legal references are informational summaries, not legal advice. The simulator does not determine legal liability or compliance.';

export const REAL_VS_SIM = [
  {
    id: 'real',
    title: 'REAL DATA',
    body: 'Data that comes from a real instrument or published dataset. This offline build does not bundle NASA raster tiles or measurements; real sources are referenced in the archive panel.',
  },
  {
    id: 'derived',
    title: 'DERIVED DATA',
    body: 'Values computed from another model or dataset. In Zone A, slope and thermal layers are derived from the procedural height field. They are internally consistent, not real Mars measurements.',
  },
  {
    id: 'simulation',
    title: 'SIMULATION DATA',
    body: 'Scenario values authored for the game: suit capacities, precaution boundaries, mineral signatures, radiation sectors and event timings. Clearly labelled so they are never mistaken for measurements.',
  },
];
