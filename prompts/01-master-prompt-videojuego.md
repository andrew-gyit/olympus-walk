# MASTER PROMPT — OLYMPUS WALK
## Build a playable 3D Mars exploration simulator (game-first, not dashboard-first)

Act as a professional game-development studio. Your team combines a Game Director, senior gameplay programmer, 3D technical artist, level designer, physics engineer, UX/HUD designer, scientific-visualisation engineer, and full-stack developer.

Your task is to **implement OLYMPUS WALK**, a playable 3D game-like simulator of human exploration on Mars. The player controls an astronaut and physically explores a training environment inspired by Olympus Mons. The 3D world is the main interface. A map, scientific layers, route planner, HUD, scanner, inventory, resource meters, and planetary-protection panel are supporting tools inside the game.

**Do not build a conventional dashboard with a map in the middle. Do not make an astronaut a decorative object. Do not create a static scene with fake buttons. Build a playable game loop.**

The first delivery must allow a player to start a mission, control an astronaut, move around a coherent Martian terrain, interact with at least one scientific target, register an observation or sample, consult navigation, return to base, and receive a mission debrief.

---

# 1. PRODUCT CONCEPT

**Name:** OLYMPUS WALK  
**Tagline:** Explore smarter. Walk safer. Discover Mars.  
**Genre:** 3D exploration simulator, scientific discovery, light survival/resource management, educational planetary exploration.  
**Perspective:** third person by default; optional first person.  
**Initial target:** desktop browser with keyboard and mouse.  
**Secondary target:** responsive tablet/mobile controls if feasible.

The player is an astronaut/scientific explorer. They leave a base camp, walk across an uneven Martian surface, investigate geology, scan potential mineralogical indicators, photograph and document findings, assess slopes and hazards, respect precaution areas, manage training suit resources, and return to base.

Design inspiration may include the immersion and exploration of No Man's Sky, The Planet Crafter, Astroneer, Deliver Us Mars, Star Citizen, and the systemic presentation of Microsoft Flight Simulator. Do not copy copyrighted art, characters, UI, or assets. Create an original Olympus Walk identity.

# 2. FIRST PRINCIPLE: THE WORLD IS THE MAIN INTERFACE

When a mission is active, the player must see a real-time 3D environment. HUD elements should be compact and contextual. Detailed tools open as in-game overlays, wrist-device interfaces, or map screens. Never make a full-screen administrative dashboard the default active gameplay view.

The player must control movement manually. Navigation routes are guidance, not automatic movement rails. If an optional autopilot is later added, it must be clearly separate from ordinary gameplay.

# 3. TECHNICAL FOUNDATION

First inspect the existing repository. Preserve useful code and conventions. If the project is empty, use a suitable modern browser stack such as:
- React + TypeScript + Vite.
- Three.js via React Three Fiber.
- Drei helpers where useful.
- Rapier physics for character/terrain collisions.
- Zustand or equivalent state management.
- Tailwind CSS or a consistent styling system.
- Vitest and Playwright where appropriate.

These are recommendations, not mandatory choices if an existing architecture is better. Use the actual package manager and versions from the project. Do not claim a library is integrated until it is installed and used.

Separate the rendering layer from gameplay logic. Consider systems for game state, world, terrain, player, camera, physics, interaction, missions, objectives, tools, inventory, resources, hazards, pathfinding, planetary protection, scientific data, UI, and persistence. Avoid a monolithic component.

# 4. ART DIRECTION AND MARTIAN WORLD

Create an immersive 3D scene inspired by Olympus Mons and Martian volcanic terrain. The first playable zone is bounded and should not attempt to recreate the entire volcano at planetary scale.

World features:
- varied red/ochre/rust-coloured terrain;
- large distant volcanic landforms and readable horizon;
- rocky outcrops and scattered rocks of different sizes;
- uneven surfaces, small depressions and crater-like features;
- slopes and rough traversal sectors;
- broad open spaces and medium-distance landmarks;
- a visible BASE CAMP A;
- at least three scientific training points;
- one clearly labelled training precaution area.

Avoid a flat red plane or obvious repeated object placement. Use multi-scale terrain variation, stable procedural seeds, and material variation. Where feasible, blend PBR materials for dust, iron-oxide soil, dark volcanic rock, and exposed rock. Use atmospheric haze, sunlight, shadows, and restrained dust effects to create a distinct Martian look. Keep performance practical for ordinary desktop browsers.

Use generated/procedural meshes if external 3D assets are unavailable. Do not use primitive capsules as the final astronaut model. Build a recognisable astronaut from meshes or use a properly licensed model. Track external/generated assets in an asset register.

# 5. ASTRONAUT PLAYER CHARACTER

Create a visible 3D astronaut with helmet, suit, backpack/life-support unit, gloves, boots, visor, and exploration equipment. The character must be legible against the ground.

Third-person camera:
- follow from slightly above and behind;
- orbit using mouse;
- smooth follow with adjustable sensitivity;
- zoom limits;
- avoid clipping through terrain/objects where feasible;
- keep the character visible.

Optional first-person mode:
- view from helmet/eye position;
- keep movement and world state consistent when switching camera.

Character animations or procedural movement states should include idle, walking, faster walk, turning, scanning, inspecting, and collecting a sample. If a suitable rigged model is unavailable, implement restrained procedural animation rather than leaving a static character.

# 6. PLAYER CONTROLS

Desktop target:
- W/A/S/D: move.
- Mouse: rotate camera/look.
- Shift: faster movement within configured training limits.
- Space: optional controlled step/assist action if it can be implemented safely and coherently.
- E: interact with nearby object.
- F: scanner.
- M: wrist device/map.
- I: inventory.
- Tab: objectives.
- C: switch camera mode.
- Esc: pause.

Show a control/help overlay. Do not assume mouse pointer lock without providing a clear start interaction and escape behaviour.

Movement must have acceleration/friction appropriate to a heavy suit, grounded detection, collision, slope handling, and configurable speed. The player must not pass through rocks or terrain, sink into the ground, float, or become permanently stuck. Gravity is configurable and may be set to a Mars-like training value, but label this as a game simulation parameter.

# 7. CORE GAMEPLAY LOOP

1. Select a mission and review briefing.
2. Start at Base Camp A.
3. Walk manually through the 3D environment.
4. Consult map/heading when needed.
5. Approach a scientific object.
6. Scan, inspect, photograph, or collect a permitted training sample.
7. Monitor resources and contextual alerts.
8. Re-evaluate route when hazards or precaution zones are encountered.
9. Return to base.
10. Review mission debrief.

The player should be able to explore off the suggested route where the terrain is traversable. The route planner must not move the player automatically.

# 8. INTERACTIVE OBJECTS

Implement an extensible interaction system. Each object exposes a proximity-gated action and data record. Show prompts such as `[E] ANALYZE ROCK`, `[E] COLLECT SAMPLE`, `[E] INSPECT FORMATION`, or `[E] RECORD OBSERVATION`.

Initial targets may include:
- volcanic rock training specimen;
- geological formation;
- mineralogical-indicator training site;
- observation landmark;
- sample collection point;
- base camp equipment.

Training object names and results must be labelled as simulated. Interaction must have a visible result and update the mission log or inventory. Prevent repeated collection unless allowed by scenario.

# 9. SCIENTIFIC TOOLS

## Scanner
When activated, animate the tool/astronaut, show a scan effect or progress cue, analyse a valid nearby object, and return data attached to that object. Results may include observed surface type, descriptive geology, mineralogical indicator, scientific interest, and a confidence/provenance label where appropriate.

## Geological analyzer
Open a compact in-world instrument panel with target ID, description, observations, indicator type, and data status. Never claim a mineral indicator proves a commercially recoverable resource, water, or life.

## Camera
On use, create a photo/observation record with mission time, coordinates, target ID, and description. If actual canvas capture is not supported, explicitly create a simulated image record rather than pretending to capture a real photograph.

## Sample collector
Require proximity and a valid sample target. Play an interaction animation or visual effect, assign a unique sample ID, attach coordinates/mission time/type/provenance, and update limited inventory capacity.

# 10. IN-GAME MAP AND NAVIGATION

The map is an astronaut tool, opened with M. It should look like a wrist-device/tablet/holographic cartographic interface. Also include a compact minimap/compass in the HUD if practical.

It must show:
- player position and heading;
- Base Camp A;
- scientific points;
- hazards and precaution areas;
- selected destination;
- planned route;
- scale/grid/legend appropriate to the coordinate system.

Provide pan/zoom, layer toggles, marker selection, destination selection, and a details panel. The 3D world and map must use the same coordinate system and transforms. For procedural worlds, use clearly labelled local training coordinates rather than invented planetary coordinates.

# 11. SCIENTIFIC LAYERS

Implement layers in the map and, where feasible, visual overlays on the 3D terrain:

1. Surface imagery.
2. Elevation/topography.
3. Slope.
4. Temperature/thermal information.
5. Mineralogical/resource indicators.
6. Radiation only where a valid dataset or labelled training model exists.
7. Obstacles/hazards.
8. Planetary-protection precaution zones.

Slope colours may use green (low), yellow (moderate), orange (high), and red (critical), but thresholds must be configurable training heuristics, not NASA-certified human mobility thresholds. Elevation, slope, materials, and pathfinding should share consistent terrain data whenever possible.

A layer must say whether it uses REAL DATA, DERIVED DATA, or SIMULATION DATA. Never silently substitute simulated data while showing a real-data label.

# 12. ROUTE PLANNING

Allow the player to select a destination on the map. Compute route alternatives using A*, Dijkstra, or a suitable pathfinding approach over a grid/graph that reflects the actual terrain and traversability.

Consider:
- distance;
- slope and elevation change;
- terrain roughness;
- obstacles;
- restricted areas;
- precaution-zone proximity;
- estimated traversal time;
- training-resource cost;
- optional scientific-point reward.

Offer:
- SAFEST ROUTE;
- BALANCED ROUTE;
- SCIENTIFIC ROUTE.

For each route, show measured/computed distance, estimated training time, slope summary, obstacle count, hazard intersections, scientific points visited, and resource estimate. These figures must come from the route model, not hard-coded display text. Explain why a route is recommended. Restricted scenario zones must never be included in a valid route. The player remains in control.

# 13. RESOURCE AND SUIT SIMULATION

Include configurable training variables:
- oxygen reserve;
- battery;
- suit integrity;
- thermal regulation;
- simplified physical-condition state;
- communication state;
- inventory capacity.

Rates and thresholds must be scenario parameters. Using the scanner may consume battery. Time away from base may consume oxygen. Events may change communication or suit state. Warnings should appear when values cross configured thresholds. Resource depletion/failure conditions must be clear, fair, and appropriate to the training scenario.

These are fictional game mechanics, not real spacesuit specifications, medical advice, or operational survival recommendations.

The simulation clock must be independent of frame rendering. Pause must stop relevant timers and drains. Time multipliers must be deterministic and must not compound accidentally.

# 14. HAZARDS AND CONTEXTUAL EVENTS

Create contextual hazards/events such as:
- steep slope nearby;
- obstacle detected;
- rough terrain;
- precaution-zone approach;
- scientific point detected;
- scan completed;
- low battery/oxygen training warning;
- communication interruption scenario.

An event must be triggered by position, scan, mission state, or a configured scenario trigger—not unrelated random popups. Each alert has ID, location, time, category, severity, description, and suggested action. Distinguish information, caution, warning, and critical. Do not overuse critical warnings.

# 15. PLANETARY PROTECTION — REQUIRED EDUCATIONAL CONTENT

Add an in-game Planetary Protection System linked to the map, mission objectives, and mission log. Include four content blocks derived from the project brief:

### Protect the Martian Environment
Avoid introducing or dispersing terrestrial microorganisms. Respect equipment cleaning and contamination-control procedures. Avoid unnecessary intervention in astrobiological interest areas. Apply precautions when handling samples.

### Watch for Special Regions
Some environments may require special consideration for microbial survival or astrobiological interest. Recognise verified special regions where applicable, consider possible water-related or geothermal indicators, and treat uncertain regions preventively until sufficient evidence exists.

### Assess the Terrain Before Moving
Review slope, elevation changes, rugged ground, depressions, obstacles, and possible ice/brine indicators. The presence of an indicator does not by itself confirm water or life.

### Follow Mission Protection Measures
Review the planned route, scientific stops, alerts, mission assessments, and observation procedures. Record relevant discoveries and update route assessments when risks are found.

Display three overlapping precaution categories:
- TOPOGRAPHICAL PRECAUTION.
- ENVIRONMENTAL PRECAUTION.
- PLANETARY PROTECTION PRECAUTION.

A single location may have multiple categories. Clearly distinguish verified source geometry, derived geometry, uncertain regions, and fictional training zones. Do not present a fictional polygon as an officially designated special region.

Reference the 1967 Outer Space Treaty (especially Article IX), COSPAR Planetary Protection Policy 2020, NASA planetary-protection material, and relevant UN guidance. Distinguish legal obligations from technical policies/guidelines/recommendations. Avoid presenting educational game scoring as a legal determination.

# 16. FIRST PLAYABLE LEVEL

Create **OLYMPUS MONS — EXPLORATION ZONE A**, a bounded, deterministic training environment with:
- Base Camp A;
- varied terrain;
- rocks and geological formations;
- one crater/depression feature;
- at least three scientific points;
- one rough terrain sector;
- one training precaution zone;
- a destination that requires a short but meaningful walk;
- an alternate route around at least one obstacle.

Use a fixed procedural seed so the terrain and object layout remain stable between runs. Document the game-world scale and coordinate convention. Do not claim the procedural scene is a scientifically exact digital elevation model of Olympus Mons.

# 17. MISSIONS

Intended mission set:
1. FIRST STEPS — movement, camera, map, scanner, inspect one rock, return.
2. GEOLOGICAL SURVEY — inspect a formation, take photos, record observations, return.
3. MINERAL EXPLORATION — scan indicators, compare findings, collect training samples, return.
4. TERRAIN SAFETY — assess slopes/obstacles and select a traversable route.
5. PLANETARY PROTECTION — identify training precaution zones, review guidance, record observations, and follow the scenario rules.

At least one mission must be fully playable end-to-end in the first delivery. Other mission cards may be marked planned if they are not yet implemented.

# 18. HUD AND MENUS

Keep the HUD compact so the world remains visible.

Suggested layout:
- upper left: mission ID, state, current objective;
- upper right: mission clock, local coordinates, heading;
- lower left: resource meters;
- lower centre: selected tool and interaction hint;
- lower right: minimap/compass/destination distance.

Provide:
- cinematic main menu with NEW MISSION, CONTINUE if save exists, MISSION SELECT, SETTINGS;
- mission briefing;
- in-game pause menu;
- wrist-device/map overlay;
- inventory;
- objectives;
- mission debrief.

The main menu should transition into the 3D world. Do not open a dashboard as the main mission screen.

# 19. SOUND

Add optional restrained audio for footsteps, suit equipment, scanner, interactions, warning signals, and base communication. Provide volume controls and mute. Do not rely on unlicensed audio. If sounds are unavailable, the game must remain usable with visual cues.

# 20. RESPONSIVE INPUT

Desktop is primary: keyboard and mouse. If touch support is included, provide a left virtual joystick, camera drag zone, interaction/scanner/map controls, and sufficiently large touch targets. Do not merely shrink the desktop HUD. If touch is not implemented, document it as deferred.

# 21. DATA AND SCIENTIFIC PROVENANCE

The original brief lists NASA Mars Trek, NASA Mars 2020 raw images, NASA Worldview, USGS Astrogeology interactive maps, and a NASA Curiosity/Mount Sharp resource. Potential data families to investigate include MOLA topography, THEMIS thermal data, HiRISE/CTX imagery, CRISM mineralogical indicators, and relevant radiation instrument datasets.

These names are research leads, not proof that a usable API is available. Verify access methods, data product IDs, units, coordinate systems, coverage, resolution, acquisition dates, terms, and attribution before integrating. Do not invent endpoints or API responses.

Use data classes:
- REAL DATA: retrieved from a documented source;
- DERIVED DATA: computed from documented input data, such as slope from elevation;
- SIMULATION DATA: fictional training values, procedural terrain, demo mineral indicators, hazard polygons, and resource values.

Make local demo mode available offline. External service failure must not break the core playable loop. Never silently replace a failed real-data layer with simulated values without changing the data-status label.

# 22. PERFORMANCE AND RELIABILITY

Target a stable browser experience on ordinary desktop hardware. Use instancing for repeated rocks, reasonable terrain meshes, LOD/culling where appropriate, optimised textures, controlled shadow quality, cleanup of Three.js resources, and careful physics updates. Avoid unnecessary React state updates per frame. Add loading/error/fallback states. Ensure game state and map state remain consistent.

# 23. PERSISTENCE

Save settings and mission progress where practical. Store objective state, resources, inventory, discoveries, mission status, and a checkpoint/position if safe. Version save data if schema changes are expected. Handle malformed or outdated saves without crashing.

# 24. IMPLEMENTATION ORDER

Work in stages but continue until the first complete playable mission is delivered.

**Stage 1 — playable core:** world, terrain, astronaut, camera, WASD, collision, base camp, basic HUD.

**Stage 2 — exploration:** interaction prompts, scanner, inspectable objects, sample collection, photography/observation records, inventory.

**Stage 3 — simulation:** mission objectives, clock, resource meters, pause/resume, contextual events, return-to-base, debrief.

**Stage 4 — map/navigation:** wrist device, coordinates, points of interest, layers, route planning and hazard overlays.

**Stage 5 — planetary protection:** precaution zones, guidance, warnings, player decisions, log.

**Stage 6 — polish/content:** more missions, animation, sound, terrain detail, performance, optional mobile controls.

Do not spend time polishing decorative panels while player movement and collision remain broken. The first milestone is a controllable astronaut exploring a consistent 3D Mars environment.

# 25. ACCEPTANCE CRITERIA

A minimum complete playable build must satisfy:
- The game launches and a mission can be started.
- A 3D Martian level loads.
- A visible astronaut is controllable with WASD.
- The camera follows and can be controlled.
- Terrain and obstacle collisions work.
- The player can reach an interactive object.
- A scientific tool produces a recorded result.
- The HUD displays current mission/objective and training resources.
- A map/navigation overlay opens and reflects the player position if the map stage is implemented.
- At least one mission objective can be completed.
- The player can return to base and receive a debrief.
- Simulated information is clearly labelled.
- No visible control is left inert; unfinished features are hidden or explicitly marked as unavailable.

# 26. REQUIRED DEVELOPMENT BEHAVIOUR

1. Inspect the existing repository before editing.
2. State the implementation plan briefly, then start building.
3. Work directly in the project files.
4. Run the project during development.
5. Test the actual gameplay flow, not just type-check the components.
6. Fix runtime errors and obvious UX failures.
7. Do not claim a feature is done before verifying it.
8. Do not fabricate NASA data, legal claims, assets, or test results.
9. Record real dependencies and commands in documentation.
10. Keep the code modular and easy to extend.

At completion, report:
- features implemented;
- features partially implemented/deferred;
- exact run/build/test commands executed;
- known bugs and limitations;
- data/assets that are simulated or externally sourced;
- evidence of a complete playable mission.

## FINAL CREATIVE DIRECTION

The user should launch Olympus Walk, choose a mission, appear at a Martian base camp, see the landscape, move the astronaut with WASD, turn the camera, walk across uneven red terrain, approach a rock, press E to inspect it, activate the scanner, record a scientific observation, open the wrist-device map, view slope and hazard information, choose a route, monitor simulated oxygen/battery, respect a training precaution zone, collect a training sample, and return to the camp for a mission report.

**Build a playable 3D exploration simulator. The Mars world is the interface. The astronaut is the player character. Scientific tools are gameplay mechanics. The map is a navigation instrument. The mission is a journey.**
