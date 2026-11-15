# 10. Testing and acceptance

## 10.1 Testing principle

A visible scene is not sufficient evidence that the game is playable. Validate controls, collision, interactions, game-state transitions, map consistency, save/load behaviour, and at least one complete mission loop.

## 10.2 Automated test categories

The final test plan should reflect the chosen implementation. Candidate categories:
- Unit tests: route costs, resource simulation, mission objective transitions, coordinate transforms, data validation.
- Component/integration tests: HUD reflects game state, inventory updates after collection, map layers toggle correctly.
- Browser/end-to-end tests: start game, move player, interact with target, complete objective, return to base, view debrief.
- Build checks: type-check, lint, test, production build.

Do not claim tests pass unless commands were executed and results recorded.

## 10.3 Manual acceptance checklist

### Launch and world
- [ ] Game launches without fatal console errors.
- [ ] Main menu can start a mission.
- [ ] 3D environment loads.
- [ ] Base camp and landmarks are visible.
- [ ] Terrain has meaningful variation.

### Player and camera
- [ ] WASD movement works.
- [ ] Mouse camera control works.
- [ ] Camera does not behave erratically at terrain/obstacle boundaries.
- [ ] Player collides with terrain and obstacles.
- [ ] Player does not fall through the ground or remain floating.
- [ ] Camera mode changes work if included.

### Exploration
- [ ] Nearby objects expose interaction prompts.
- [ ] Interaction requires appropriate proximity.
- [ ] Scanner produces a result for a valid target.
- [ ] Sample collection updates inventory.
- [ ] Observations are recorded with mission context.

### Simulation
- [ ] Resource meters update consistently.
- [ ] Pausing stops the simulation clock and resource drain.
- [ ] Resume continues from the paused state.
- [ ] Alerts appear only when relevant.
- [ ] Mission can end successfully or be aborted.
- [ ] Debrief displays the recorded mission results.

### Map and scientific layers
- [ ] Map opens and closes.
- [ ] Player position corresponds to world position.
- [ ] Destination selection is consistent with world coordinates.
- [ ] Route calculation respects obstacles/restricted regions where implemented.
- [ ] Layer toggles visibly change map/terrain information.
- [ ] Data provenance/status is visible.

### Planetary protection
- [ ] Precaution zones display correct labels/status.
- [ ] A location can have multiple precaution categories.
- [ ] Training polygons are not labelled as verified official boundaries.
- [ ] Player decisions are recorded where the mechanic exists.

### Reliability and performance
- [ ] Game can run with network disabled if local demo mode is intended.
- [ ] Missing external assets/data result in clear fallback behaviour.
- [ ] No runaway memory/GPU allocation during normal play.
- [ ] Production build succeeds.

## 10.4 Evidence capture

Record exact test date, browser/device, build or commit, steps, expected result, actual result, and pass/fail. Screenshots or short recordings may be stored in a dedicated `docs/evidence/` directory if appropriate and if they do not expose private data.
