# 7. Scientific data and provenance

## 7.1 Principle

Olympus Walk may combine real scientific data, derived calculations, and fictional training data, but it must label them accurately. Never present a procedural map, invented value, interpolated field, or training hazard as a NASA measurement.

## 7.2 Data classes

### Real data
Data fetched from or directly sourced from a documented scientific mission/institution. Store the dataset/product identifier, source link, instrument, acquisition date, coordinate reference, units, spatial resolution if known, and applicable terms/attribution.

### Derived data
Values calculated from a documented source, for example slope derived from an elevation raster. Record the input dataset, calculation method, parameters, units, and software version where useful.

### Simulation data
Fictional training content such as procedural terrain, training temperatures, sample IDs, resource consumption, hazards, or invented mineral indicators. Label it `SIMULATION DATA` in the interface and in exported reports.

## 7.3 Reference sources listed in the original project brief

The supplied brief lists these resources:

- NASA Mars Trek: https://trek.nasa.gov/mars/
- NASA Curiosity's Proposed Path Up Mount Sharp: https://science.nasa.gov/resource/curiositys-proposed-path-up-mount-sharp/
- NASA Mars 2020 Raw Images: https://mars.nasa.gov/mars2020/multimedia/raw-images/
- NASA Worldview: https://worldview.earthdata.nasa.gov/
- USGS Astrogeology interactive maps for Mars: https://astrogeology-usgs.hub.arcgis.com/pages/interactive-maps-mars

These are reference resources from the brief, not a guarantee that each one provides a directly consumable API or a dataset at the required resolution.

## 7.4 Candidate scientific instruments/datasets to investigate

The game-development prompt suggests investigating:
- MOLA for elevation/topography.
- THEMIS for thermal information.
- HiRISE and CTX for orbital imagery.
- CRISM for mineralogical indicators.
- Appropriate radiation instrument datasets where relevant.

Before integration, verify the actual data product, access mechanism, coverage, projection, resolution, units, and usage/attribution requirements. Do not invent endpoints.

## 7.5 Provider architecture

A proposed provider abstraction may include:
- `TerrainDataProvider`.
- `ImageryDataProvider`.
- `TemperatureDataProvider`.
- `MineralDataProvider`.
- `RadiationDataProvider`.
- `MissionDataProvider`.

Each should support a real-data provider where available and a local demo provider for offline play. The actual abstractions must be documented from source code after they exist.

## 7.6 Provenance metadata

For a data layer/feature, expose as many of the following as are genuinely available:
- Source/institution.
- Mission and instrument.
- Product or dataset identifier.
- Acquisition date.
- Processing level.
- Spatial resolution.
- Coordinate reference/projection.
- Units.
- Derived-data method.
- Confidence/uncertainty, if supplied or rigorously calculated.
- Source URL.

Do not invent missing metadata. Use “not available” or omit the field.

## 7.7 Offline behaviour

The first playable slice should run without external network access by using deterministic local training data. External source failure must not make the core game unusable. Provide clear fallback messaging, and do not silently substitute simulation data while retaining a “real data” label.

## 7.8 Scientific limitations

- A mineralogical signature is not proof of a recoverable resource.
- Evidence of hydrated minerals or possible ice is not proof of extant life.
- Sparse local measurements must not be converted into a false high-resolution field without documenting interpolation and uncertainty.
- Procedural training terrain is not a digital elevation model of Olympus Mons.
- Radiation values must only appear where there is an actual measurement or an explicitly labelled scenario model.
