# 4. Gameplay systems

## 4.1 Player controller

The player controller is responsible for input, movement intent, acceleration, orientation, and interaction state. Actual physics integration should be documented from the code after implementation. Movement must be consistent with the selected camera mode and must respect collisions.

## 4.2 Camera controller

Required target behaviour:
- Smooth third-person follow camera.
- Mouse-controlled orbit.
- Configurable sensitivity.
- Zoom limits.
- Camera collision/obstruction handling where feasible.
- Optional first-person view.
- Stable camera state when pausing or switching overlays.

## 4.3 Interaction system

Use an interaction interface or registry so that rocks, sample locations, base equipment, and mission props can expose actions consistently. Interactions should require proximity and may show a prompt such as `[E] ANALYZE ROCK`. Prevent duplicate collection unless the scenario explicitly permits it.

## 4.4 Scientific tools

### Scanner
A handheld or suit-integrated scanner that displays a scan effect and analyses a nearby target or sector. It returns information defined by the target's data record.

### Geological analyzer
Displays a concise profile: observed feature, descriptive classification, mineralogical indicators if available, confidence/provenance, and scientific interest. Do not turn an unverified indicator into a confirmed resource or life detection.

### Camera
Captures or stores a screenshot/image reference with the current mission timestamp, location, target, and description. If browser screenshot capture is technically unavailable, use an explicit simulated photograph record rather than claiming a real camera capture.

### Sample collector
Requires a valid nearby target and scenario permission. On success, creates a sample record with a unique ID and metadata and updates inventory capacity.

## 4.5 Inventory

Tracks collected samples, photographs, and observation records. Each item should include a stable ID, type, mission time, location, and provenance/status. Inventory capacity can be used as a training constraint.

## 4.6 Resource simulation

Possible training variables:
- Oxygen reserve.
- Battery level.
- Suit integrity.
- Thermal regulation state.
- Simplified physical-condition meter.
- Communication state.
- Inventory capacity.

Rates, starting values, warning thresholds, and failure thresholds must be configurable per scenario. They are fictional gameplay parameters and must not be represented as real spacesuit specifications or medical advice.

The simulation clock must be independent of render frame rate. Pausing should stop the simulation consistently. Speed multipliers must apply predictably and should not compound accidentally.

## 4.7 Hazard system

Hazards may include steep slope sectors, obstacles, depressions, environmental caution areas, and planetary-protection zones. A hazard event should be contextual: it must be triggered by proximity, entry, scan results, or mission state, not by unrelated random popups.

Each hazard record should define:
- ID.
- Category.
- Geometry/location.
- Severity.
- Trigger condition.
- Player-facing message.
- Suggested response.
- Whether the region is passable, discouraged, or restricted in the scenario.
- Provenance: verified, derived, or simulated.

## 4.8 Mission system

A mission should define:
- ID and title.
- Briefing.
- Player spawn/base.
- Objectives.
- Allowed tools/actions.
- Points of interest.
- Precaution rules.
- Resource parameters.
- Success/failure/abort conditions.
- Debrief output.

Objectives should support states such as locked, available, active, completed, and failed. Objective progression must be event-driven and saved consistently.

## 4.9 Navigation and pathfinding

A route planner should compute alternatives over a consistent traversability representation. A* or Dijkstra may be used depending on the chosen graph/grid. Route cost may combine distance, slope, roughness, obstacles, precaution proximity, and scientific-interest reward. Restricted zones must be excluded from valid paths.

The player must remain in control. A route is guidance, not an automatic movement path, unless an optional autopilot feature is explicitly designed and labelled.

## 4.10 Mission debrief

On successful completion or abort, create a report with:
- Mission identifier and outcome.
- Objectives completed.
- Distance and elapsed simulated time.
- Samples and observations.
- Photographs/records.
- Hazards encountered.
- Resource consumption and remaining values.
- Precaution/protocol performance.
- Limitations and simulated-data notice.

## 4.11 Save/load

Persist the minimum state needed to resume or review missions: selected mission, objective states, player/checkpoint position, inventory, resources, discoveries, and settings. Document the actual persistence mechanism after implementation. Treat malformed or outdated saves safely.
