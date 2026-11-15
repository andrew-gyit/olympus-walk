# 3. World and level design

## 3.1 First environment: Olympus Mons — Exploration Zone A

The first level is a bounded training region inspired by Olympus Mons. It is not required to reproduce the entire volcano at planetary scale. The goal is to build an explorable region with enough variety to demonstrate route planning, slope awareness, obstacle avoidance, scientific points of interest, and a safe return loop.

## 3.2 Required landmarks

- **Base Camp A:** mission start and return point.
- **Geological Formation Beta:** target for a geological survey.
- **Mineral Interest Gamma:** training location with a fictional mineralogical indicator.
- **Observation Point Delta:** elevated viewpoint or landmark.
- **Rough Terrain Sector:** area with increased traversal difficulty.
- **Precaution Zone Epsilon:** clearly labelled training polygon/area for planetary-protection learning.
- **Depression/Crater Feature:** terrain landmark and navigation challenge.

Names above are scenario labels, not claims of actual mapped features on Olympus Mons.

## 3.3 World composition

The level should contain:
- A readable base silhouette.
- Short- and medium-distance landmarks.
- A varied terrain height profile.
- Rocks of several sizes and shapes.
- At least one slope challenge.
- At least one alternative route around an obstacle.
- Scientific interaction targets.
- A region that demonstrates precaution-zone overlays.

## 3.4 Scale and traversal

Choose a compact play area that supports a meaningful field walk without overwhelming browser performance. Distances displayed in the UI must be derived from the same world coordinate system as player movement. If the terrain is scaled for gameplay, document the scale factor and do not present it as a real-world survey measurement.

## 3.5 Terrain generation

Procedural terrain should use a stable seed and coherent multi-scale features. Elevation, slope, surface materials, and pathfinding costs should derive from a shared height/terrain representation where possible. Do not create a visual mountain while route planning uses unrelated random values.

## 3.6 Collision and traversal

The player must collide with terrain and obstacles. Rock placements should have collision geometry appropriate to their visible scale. The player should not pass through terrain, float above it, or become trapped by invisible collision volumes. Validate slope transitions and camera collision.

## 3.7 Visual storytelling

The environment should communicate the mission context through the camp, equipment, beacons, tracks, scientific objects, and distant geological forms. Use labels and markers sparingly so the landscape remains the focal point.

## 3.8 Level expansion

Future regions may add new terrain types, scientific targets, and precaution scenarios. New levels should reuse terrain, interaction, navigation, mission, and data systems instead of duplicating core logic.
