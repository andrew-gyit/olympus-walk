# 2. Game design document (GDD)

> This is the intended design baseline. OpenCode must reconcile it with the final implementation and label deviations.

## 2.1 High concept

Olympus Walk is a third-person 3D planetary exploration simulator set in a training region inspired by Olympus Mons. The player controls an astronaut, travels over a hazardous and scientifically interesting terrain, uses field instruments, manages simulated spacesuit resources, follows or adapts navigation routes, and returns to base with research observations.

## 2.2 Genre and perspective

- Primary genre: 3D exploration simulator.
- Supporting genres: scientific discovery, light survival/resource management, educational simulation.
- Primary camera: third person.
- Optional camera: first person.
- Primary platform target: desktop browser with keyboard and mouse.
- Secondary target: touch-enabled tablet/mobile interface where performance allows.

## 2.3 Player fantasy

The player should feel like a trained planetary explorer conducting a field investigation on Mars. The feeling comes from scale, isolation, deliberate movement, meaningful instrument use, terrain awareness, and the need to return safely with useful scientific records.

## 2.4 Core gameplay loop

1. **Prepare:** select a mission, review objectives, inspect equipment and known hazards.
2. **Deploy:** leave the base camp and enter the 3D environment.
3. **Navigate:** walk manually, consult the wrist device/map, inspect the terrain, and adjust the route.
4. **Investigate:** scan formations, take photographs, collect permitted samples, and record observations.
5. **Manage:** monitor oxygen/battery/training resource meters and respond to context-sensitive warnings.
6. **Protect:** recognise and respect precaution areas and mission procedures.
7. **Return:** navigate back to base before the scenario's resource or mission constraints are breached.
8. **Review:** receive a mission report showing objectives, findings, hazards, resources, and protocol performance.

## 2.5 Experience pillars

### Pillar A — Immersive planetary presence
The 3D world must be visible and dominant. Terrain, horizon, lighting, rocks, distant landforms, and the astronaut create the primary experience.

### Pillar B — Meaningful scientific interaction
The player physically approaches a location and uses a tool. The scan or observation creates a record that appears in the mission log and, where relevant, on the map.

### Pillar C — Deliberate mobility and navigation
Slope, roughness, obstacles, and restricted areas influence route choice and traversal. The player retains control rather than following a forced animation.

### Pillar D — Resource-aware exploration
Simulated oxygen, battery, thermal regulation, suit integrity, communication, and inventory capacity create understandable exploration trade-offs. These values are training mechanics, not real suit specifications.

### Pillar E — Responsible planetary exploration
The game introduces environmental, topographical, and planetary-protection precautions. The player learns that scientific value does not justify ignoring protective procedures.

## 2.6 Controls — target design

| Input | Intended action |
|---|---|
| W / A / S / D | Move astronaut |
| Mouse | Rotate camera / look |
| Shift | Faster movement within configured game limits |
| Space | Optional controlled step/assist action if supported by movement design |
| E | Interact with nearby object |
| F | Activate scanner |
| M | Open wrist device / map |
| I | Open inventory |
| Tab | View mission objectives |
| C | Switch camera mode |
| Esc | Pause game |

The final controls must match the actual implementation and be shown in an in-game help overlay.

## 2.7 Camera and movement feel

The third-person camera should follow the astronaut smoothly from slightly above and behind. It should avoid clipping through terrain and objects. Movement should feel deliberate and slightly weighted, not like a fast arcade character. The astronaut must remain grounded and collide with the environment. Terrain slope may affect speed or produce warnings within the training model.

## 2.8 Scientific interactions

- Scan a nearby target.
- Inspect a rock or formation.
- Photograph a location.
- Collect a sample where the mission permits.
- Record a field observation.
- Mark a hazard.

Each interaction should be proximity-gated and recorded with a stable identifier, mission timestamp, location, category, and result. Demonstration findings must be labelled simulated.

## 2.9 Mission types

The intended initial mission set is:

1. **First Steps:** movement, camera, map, scanner, basic inspection, and safe return tutorial.
2. **Geological Survey:** investigate a geological formation and record observations.
3. **Mineral Exploration:** visit points of interest, scan indicators, and collect training samples.
4. **Terrain Safety:** evaluate slopes, obstacles, and route alternatives.
5. **Planetary Protection:** identify precaution areas, follow procedures, and record observations without inappropriate intervention.

The first release may implement only one complete mission. The remaining missions can be planned or partially implemented.

## 2.10 Success and failure conditions

Success should depend on objective completion, return to base, useful scientific records, resource management, and compliance with scenario precautions. The game should avoid rewarding speed alone.

A mission may end through:
- Successful return to base.
- Objective completion with a documented debrief.
- Abort initiated by the player.
- Scenario-defined resource threshold or failure event.

Any fail-state threshold is a fictional training parameter and must be configurable and labelled accordingly.

## 2.11 User interface philosophy

Keep the world visible. The HUD should be compact and contextual. Detailed map layers, inventory, objectives, and settings can open as overlays or a wrist-device interface. Avoid a full-screen dashboard as the default gameplay screen.

## 2.12 Art direction

Use an original visual identity with rusty red, iron-oxide, ochre, dusty brown, dark volcanic rock, muted sky tones, and restrained high-contrast UI accents. Build varied terrain materials and silhouettes. Avoid a single flat red plane or obvious repeated rock placements.

## 2.13 Audio direction

Use restrained suit/equipment sounds, footsteps, scanner cues, UI confirmations, and communications. The overall soundscape should convey isolation and suit-mediated perception rather than a familiar terrestrial outdoor ambience. Audio assets must be properly licensed and recorded in the asset register.
