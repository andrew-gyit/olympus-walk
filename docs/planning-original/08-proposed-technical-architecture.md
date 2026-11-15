# 8. Proposed technical architecture

> **Important:** This is a proposed architecture based on the intended game. It is not an as-built architecture. OpenCode must inspect the project and replace or annotate this proposal to reflect the actual implementation.

## 8.1 Suggested browser stack

Potential stack for a browser-based 3D simulator:
- React + TypeScript + Vite for the application shell.
- Three.js, optionally through React Three Fiber, for 3D rendering.
- Drei for common R3F helpers where useful.
- Rapier for character/terrain physics.
- Zustand or an equivalent state store for cross-system state.
- Tailwind CSS for interface styling.
- Vitest for unit tests and Playwright for browser-level tests.

OpenCode must document actual package versions from the lockfile and `package.json`, not copy this suggested list blindly.

## 8.2 System boundaries

Suggested boundaries:
- **Application shell:** routing, loading, settings, and menus.
- **Game runtime:** loop, game state, pause/resume, time scale.
- **World runtime:** terrain, props, lighting, atmosphere, world coordinate system.
- **Player runtime:** input, movement, camera, animation, collision.
- **Interaction runtime:** proximity detection and interaction dispatch.
- **Scientific runtime:** scanning, analysis, observations, samples, photos.
- **Mission runtime:** briefings, objectives, progression, debrief.
- **Simulation runtime:** resources, events, hazards, environment parameters.
- **Navigation runtime:** map, coordinates, pathfinding, route display.
- **Planetary-protection runtime:** precaution areas, rules, warning messages, training score.
- **Presentation layer:** HUD, wrist device, inventory, overlays, reports.
- **Data layer:** local scenarios, external data providers, provenance.
- **Persistence:** settings, saves, mission records.

## 8.3 State ownership

Avoid multiple conflicting sources of truth. Document which system owns:
- Player position and orientation.
- Mission state/objectives.
- Simulation clock and time scale.
- Suit resources.
- Selected tools and inventory.
- Active map layers.
- Route and destination.
- Scientific records.
- Hazard/protection state.

Per-frame render state should not be unnecessarily mirrored into React state if that causes performance problems.

## 8.4 Coordinate system

Define and document a common local world coordinate system. The player, map, waypoints, terrain, hazard polygons, and scientific targets must share a consistent transform. If a planetary coordinate system is added, implement and test the mapping rather than displaying invented coordinates.

## 8.5 Game loop and time

The simulation clock should be independent of render frequency. Pause must stop relevant timers, movement, resource drain, and events. Time multipliers must be applied once and deterministically. Document frame/update ordering and how systems communicate.

## 8.6 Data providers

Use a provider/adapter boundary between external data retrieval and game rendering. Validate and normalise units, projections, and metadata before display. Provide local training data for offline operation.

## 8.7 Persistence and saves

Choose a persistence format appropriate to the prototype. Validate save schemas and support versioning if saves may survive code changes. Never store secret API keys in client-side source.

## 8.8 Security and reliability

- Validate imported data.
- Avoid hard-coded secrets.
- Use safe external asset and data URLs.
- Handle failed requests and missing assets.
- Clean up GPU and physics resources.
- Avoid unbounded event listeners and timers.
- Provide an offline/fallback path for the first playable mission.

## 8.9 Architecture diagrams

OpenCode should generate Mermaid diagrams from the actual source structure after inspecting the code. At minimum:
- High-level runtime/component diagram.
- Mission/gameplay state diagram.
- Data-provider flow.
- Player interaction flow.

Do not create diagrams that imply systems that do not exist.
