# 1. Project basis

## 1.1 Project identity

**Name:** Olympus Walk  
**Tagline:** Explore smarter. Walk safer. Discover Mars.  
**Format:** 3D game-like planetary exploration simulator, initially designed for browser execution.  
**Primary setting:** A training environment inspired by Olympus Mons, Mars.

## 1.2 Problem described by the original brief

The supplied project brief explains that NASA has accumulated substantial scientific information about Mars through robotic missions, but that information is distributed across different platforms and commonly presented at global or regional scales. The brief identifies a need for a more localised, human-scale environment that can bring terrain, imagery, temperature, mineralogical/resource information, routes, and precaution information together.

The brief highlights the operational challenge of interpreting scattered scientific information while wearing a heavy spacesuit and carrying limited equipment. It calls out uncertainty around local terrain, steep slopes, large rocks, and other hazards.

## 1.3 Project objective

The original objective is to design and prototype a responsive software system integrating scientific layers over a specific Martian location to help plan and execute Marswalks more efficiently and safely.

The game direction developed from that brief changes the primary interface: rather than making a map dashboard the product, the user enters a 3D environment and controls an astronaut. Maps, scientific layers, route planning, alerts, and planetary-protection information become in-world instruments and supporting systems.

## 1.4 Product vision

Create a playable 3D simulator where the player:

1. Starts a mission from a Martian base camp.
2. Controls an astronaut in third person, with an optional first-person view.
3. Walks over a varied, interactive terrain.
4. Inspects rocks and geological formations.
5. Uses scientific tools to collect observations and samples.
6. Consults a map and scientific layers.
7. Plans routes while considering slope, hazards, and precaution zones.
8. Monitors simulated suit resources.
9. Completes scientific and safety objectives.
10. Returns to base and receives a mission report.

## 1.5 Intended users

The brief identifies astronauts/explorers, mission-planning teams, scientists, and students/public audiences as beneficiaries. The primary user persona is Dr. Elena Vance, a planetary-geology specialist and surface explorer who uses the system at a desktop for planning and on a vertical mobile device for field reference.

For the game prototype, the user is represented as a player controlling an astronaut. The application may also be useful as an educational demonstration for students and the general public.

## 1.6 Product principles

- **World first:** the 3D Martian environment is the main interface.
- **Player agency:** the player moves and makes decisions; the game does not merely animate a route.
- **Scientific context:** tools and discoveries communicate geological information.
- **Operational awareness:** movement, resource limits, route choices, and hazards influence play.
- **Planetary protection:** precaution concepts appear in exploration decisions.
- **Truthful data:** real, derived, and simulated information are distinguished.
- **Playable scope:** prioritise one coherent playable region before attempting a planet-scale recreation.

## 1.7 Scope of the first playable slice

The first playable slice should focus on a compact, coherent region called **Olympus Mons — Exploration Zone A**. It should include:

- A visible base camp.
- A navigable 3D terrain.
- A controllable astronaut.
- A third-person camera.
- Terrain collision and basic slope handling.
- Several rocks/geological objects to inspect.
- At least one scientific interaction loop.
- A basic resource HUD.
- A map/device overlay.
- A short mission with a clear return-to-base condition.

Later features such as multiple scenarios, advanced atmospheric simulation, scientific API integrations, extensive animation, and mobile controls can follow once the core loop is playable.

## 1.8 Non-goals and safety boundary

Olympus Walk is a demonstrative/educational simulator. It is not a certified mission-planning tool, medical system, spacesuit simulator, or operational navigation system. Heuristic slope thresholds, resource consumption, movement limits, and hazard consequences are game mechanics and must not be represented as NASA-approved human-safety thresholds.

## 1.9 Status notation

Use these labels throughout this repository:

- **Proposed:** described in design documents but not yet verified in code.
- **Implemented:** present in the source code and connected to the running application.
- **Partially implemented:** some behaviour exists, but the complete requirement is not met.
- **Verified:** implementation has passed a documented automated or repeatable manual test.
- **Deferred:** intentionally postponed.
- **Blocked:** cannot be completed until a dependency, decision, or source is available.

OpenCode must update statuses only after inspecting the actual repository and testing the application where possible.
