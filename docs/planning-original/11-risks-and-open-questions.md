# 11. Risks and open questions

This file lists issues to resolve during implementation. OpenCode should update it based on the actual source and current decisions.

## 11.1 Technical risks

- **Browser 3D performance:** terrain geometry, shadows, particles, and physics may be expensive on standard laptops.
- **Physics/render mismatch:** the visible terrain and collision surface may diverge.
- **Coordinate inconsistency:** the map, player, hazards, routes, and scientific objects may use different transforms.
- **Data complexity:** planetary products may have different projections, resolutions, units, coverage, and formats.
- **External service availability:** remote services may change, throttle, require authentication, or block browser access.
- **Asset licensing:** downloaded models, fonts, textures, and audio may have redistribution restrictions.
- **Simulation credibility:** simplified game mechanics may be mistaken for realistic astronaut operating limits.

## 11.2 Product questions

- Is the first release desktop-only or must touch controls ship in the same milestone?
- Is the final game intended to run fully offline?
- Which visual style is achievable with available art assets: stylised, semi-realistic, or realistic?
- What is the target minimum hardware/browser?
- Will the first demo include one complete mission or several shorter missions?
- Should the game support saving/resuming mid-mission?
- Are external scientific layers required for the first public demonstration, or is a transparent local training scenario sufficient?

## 11.3 Scientific and legal questions

- Which exact data products will be used for each layer?
- What coordinate system and resolution will be used for the chosen region?
- Which areas, if any, can legitimately be labelled as special regions based on verified source material?
- Which legal summaries require review against official current texts?
- What attribution/usage requirements apply to each dataset and asset?

## 11.4 Release boundary

Do not describe the product as safe for real Marswalk planning or as a validated digital twin. The first release is a demonstrative game/simulator unless independently validated for an operational purpose.
