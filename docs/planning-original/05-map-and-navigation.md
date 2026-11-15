# 5. In-game map and navigation

## 5.1 Purpose

The map is an astronaut instrument inside the game, not the default primary screen. It should be accessible through a wrist-device/tablet-style overlay and a compact minimap/HUD.

## 5.2 Coordinate consistency

The 3D world, player position, map, route graph, hazard geometry, and scientific points must use a shared coordinate convention. Document:
- World axes.
- Units and scale.
- Origin/reference point.
- Transform between local game coordinates and planetary coordinates, if implemented.
- Any map projection or simplified local grid.

Do not display precise latitude/longitude unless the underlying coordinate mapping supports it. For a procedural training map, use local grid coordinates and label them as simulated.

## 5.3 Map controls

Target functionality:
- Pan and zoom.
- Player position marker.
- Heading/compass.
- Base and point-of-interest markers.
- Selected destination.
- Planned route.
- Hazard and precaution overlays.
- Layer toggles.
- Scale/grid/legend.
- Details when a marker is selected.

## 5.4 Scientific layers

- Surface imagery.
- Elevation/topography.
- Slope.
- Temperature/thermal information.
- Mineralogical/resource indicators.
- Radiation (only where supported by measurements or clearly labelled model data).
- Obstacles and hazards.
- Planetary-protection precaution zones.

Each layer must expose a source/status label. Real, derived, and simulated layers must be visually or textually distinguishable.

## 5.5 Layer rendering

Where feasible, a layer may be represented both on the map and as a temporary visualization over the 3D terrain. Examples include slope tinting, elevation shading, mineral markers, thermal overlays, and hazard boundaries. Layer activation should not silently change the underlying terrain physics unless explicitly intended.

## 5.6 Route alternatives

Target alternatives:
- **Safest:** prioritises lower traversal risk and excludes restricted sectors.
- **Balanced:** balances distance and traversal cost.
- **Scientific:** rewards visiting selected scientific points while respecting constraints.

For each route, report distance, estimated time, slope summary, obstacle count, hazard intersections, scientific points visited, and estimated training-resource cost. These values must derive from the route model, not be invented display figures.

## 5.7 Route explainability

The interface should explain why a route is recommended, such as avoiding a steep sector or reducing obstacle crossings. Explanations must be generated from the actual path-analysis result.
