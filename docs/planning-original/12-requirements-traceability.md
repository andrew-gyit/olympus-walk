# 12. Requirements traceability

This table maps the supplied project brief to the intended game requirements. Implementation status must be filled in by inspecting the actual game source and running tests.

| ID | Source brief theme | Intended game requirement | Evidence to verify | Current status |
|---|---|---|---|---|
| OW-01 | Integrate scattered information in one environment | In-game map/wrist device combines navigation and scientific layers | Map UI, layer providers, provenance metadata | Proposed |
| OW-02 | Topographic information | Elevation/topography layer | Terrain data and map/terrain rendering | Proposed |
| OW-03 | Slope information | Slope calculation/visualisation and traversal warnings | Slope model, overlay, tests | Proposed |
| OW-04 | Surface imagery | Imagery layer or clearly labelled local imagery | Imagery provider and source metadata | Proposed |
| OW-05 | Temperature | Thermal layer/field information | Temperature provider or labelled simulation values | Proposed |
| OW-06 | Minerals/resources | Mineralogical indicators and scientific points | Target data, scanner, evidence labels | Proposed |
| OW-07 | Radiation mentioned in project objective | Radiation information only where supported | Valid dataset/model, units, limitations | Proposed |
| OW-08 | Route planning | Alternative routes with slope/obstacle/precaution costs | Pathfinding implementation and tests | Proposed |
| OW-09 | Route displacement | Player manually traverses the world | Player controller and playable test | Proposed |
| OW-10 | Mission condition panel | HUD/resource/alert information | HUD connected to runtime state | Proposed |
| OW-11 | Precaution zones | In-world/map precaution overlays | Zone model and contextual warning test | Proposed |
| OW-12 | Protect Martian environment | Educational contamination-prevention content | UI content and mission interaction | Proposed |
| OW-13 | Special and uncertain regions | Explicit distinction between verified and uncertain/training zones | Zone provenance/status | Proposed |
| OW-14 | Assess terrain | Terrain obstacles, slope and transitability affect choices | Collision/pathfinding/alert test | Proposed |
| OW-15 | Follow mission protection measures | Route review, alerts, logs and protocol decisions | Mission system and history | Proposed |
| OW-16 | User context: desktop and mobile | Desktop-first 3D controls plus responsive/touch design if scoped | Browser/device tests | Proposed |
| OW-17 | Scientific discovery | Scan, photograph, collect and log observations | Complete interaction loop | Proposed |
| OW-18 | Safe and efficient exploration | Resource-aware return-to-base gameplay | Mission resource simulation and debrief | Proposed |

## How to update this table

For each row, replace the status with one of: Planned, Implemented, Partially implemented, Verified, Deferred, or Blocked. Add links to source files and tests where possible. Never label a feature Verified based only on a visual appearance.
