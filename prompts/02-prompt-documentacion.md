# PROMPT FOR OPENCODE — COMPLETE THE OLYMPUS WALK DEVELOPMENT REPOSITORY FROM THE REAL CODEBASE

You are now responsible for turning this repository starter into a complete, professional, evidence-based repository that explains **how Olympus Walk was actually developed**.

The repository includes initial project documentation and a master game-development prompt. The playable source code may be in this repository already or may be added alongside these documents. Your job is to inspect the actual implementation and complete the missing “as-built” documentation so that a reviewer, teacher, evaluator, collaborator, or future developer can understand the project from idea to working game.

## ABSOLUTE RULE: DO NOT INVENT DEVELOPMENT HISTORY OR IMPLEMENTATION DETAILS

You must inspect the actual repository. Never claim that a feature, technology, API, data source, test, screen, asset, milestone, or gameplay mechanic exists unless you find evidence in the code, configuration, Git history, or a test/run that supports the claim.

Distinguish throughout the repository:
- **Design intent:** what the brief and master prompt asked for.
- **Implemented:** what the current source code actually contains.
- **Verified:** what you actually ran or tested successfully.
- **Partial:** what exists but is incomplete or disconnected.
- **Deferred:** what is intentionally left for later.
- **Blocked/unknown:** what cannot currently be verified.

If Git history is absent, do not manufacture dates, commits, contributors, or a chronological story. Instead say that the development timeline is reconstructed from current files and cannot be confirmed from commit history.

## PHASE 1 — AUDIT THE REPOSITORY

1. Inspect the complete directory tree, including hidden files where relevant.
2. Inspect `package.json`, lockfiles, build configuration, TypeScript configuration, lint configuration, assets, environment examples, and test configuration.
3. Identify the actual framework, renderer/game engine, physics engine, state-management solution, UI libraries, storage mechanism, and external integrations.
4. Identify the real entry points and important modules.
5. Inspect Git status, branches, tags, and commit history if available. Do not assume that Git history exists.
6. Identify which features from `prompts/MASTER-PROMPT-VIDEO-GAME.md` exist, are partial, or are missing.
7. Identify all places where simulated data is used and whether the UI labels it correctly.
8. Inspect assets and record their provenance/license status when available.
9. Do not modify gameplay source code during the documentation audit unless a minimal documentation-related correction is necessary and explicitly reported.

Create an audit summary before making large documentation edits.

## PHASE 2 — RUN AND VERIFY THE GAME

Use only commands supported by the actual project configuration.

1. Install dependencies only if appropriate and safe.
2. Start the development server.
3. Open or exercise the app using the available browser/test tooling where possible.
4. Verify the main menu and mission-start flow.
5. Verify movement, camera, terrain collision, and interaction with at least one object if these features exist.
6. Verify map, scanner, inventory, objective, resource, and mission-completion flows if implemented.
7. Run the available type-check, lint, unit/integration tests, end-to-end tests, and production build.
8. Record exactly which commands were run and their actual results.
9. If something cannot be tested in this environment, mark it **Not verified** and explain why.
10. Do not report a test as passing if it was not executed or if it failed.

If the game cannot run, diagnose the cause and document it. Do not cover up a failing build by writing successful instructions.

## PHASE 3 — COMPLETE THE REPOSITORY DOCUMENTATION

Update and expand the existing files rather than creating conflicting duplicate documents.

### A. Root README.md

Make the README suitable for a public GitHub repository. Include:
- project description and game concept;
- screenshots/GIF section (use placeholders only if no screenshots exist; do not invent image paths);
- key features, grouped into Implemented / Planned where necessary;
- tech stack based on actual dependencies;
- verified installation and run instructions;
- controls based on actual key bindings;
- data and simulation disclaimer;
- project structure;
- test/build instructions;
- limitations;
- contribution and license status.

### B. Actual technical architecture

Create `docs/15-actual-technical-architecture.md` describing the architecture as it exists in source code. Include:
- actual stack and versions;
- entry points;
- rendering architecture;
- game loop/update model;
- player movement and camera implementation;
- physics/collision implementation;
- world/terrain generation or loading;
- interaction model;
- mission/objective state;
- resource simulation;
- map and coordinate system;
- scientific data providers;
- persistence/save model;
- UI/HUD layers;
- external integrations.

Add Mermaid diagrams grounded in the real code. At minimum, include a high-level architecture, a gameplay state flow, and one data/interaction flow. Do not diagram systems that do not exist.

### C. Feature implementation matrix

Create `docs/16-implementation-status.md` with a table mapping every major design requirement to:
- status (Implemented / Partial / Planned / Deferred / Blocked);
- source file(s)/module(s);
- test or verification method;
- known limitation.

Cover at minimum:
- 3D world and terrain;
- astronaut model;
- movement and camera;
- physics/collision;
- environment/lighting;
- scientific objects and interactions;
- scanner/analyzer;
- sample collection and inventory;
- camera/photo/observations;
- HUD and menus;
- mission system/objectives;
- resource simulation;
- hazards and events;
- in-game map and coordinates;
- scientific layers;
- route planning;
- planetary-protection zones;
- save/load;
- responsive/touch controls;
- sound;
- real data integrations.

### D. Setup and operations

Complete `docs/14-release-and-run-instructions.md` using verified commands. Include prerequisites, install, dev server, tests, lint/type-check, production build, environment variables (names only; never secrets), deployment/build output, and troubleshooting.

### E. Testing report

Create `docs/17-testing-report.md`. Include:
- environment used (OS/browser/runtime as available);
- date of verification;
- exact commands and exit results;
- test totals if available;
- manual gameplay test steps and outcomes;
- known failures and tests not run;
- screenshots/video evidence only if actually captured.

### F. Development history

Complete `docs/13-development-log.md` using Git history if available. Summarise meaningful commits by actual date and hash. If there is no usable history, clearly state that the log is reconstructed from the present codebase and cannot establish the exact order/date of development. Do not attribute work to individuals unless verified.

### G. Decisions

Add ADR files under `docs/decisions/` for major decisions that are evident from the code or documented project choices, such as:
- browser-based 3D approach;
- renderer/game framework;
- physics and character controller;
- terrain representation;
- coordinate convention;
- state management;
- data-provider strategy;
- procedural training data vs real science data.

If decision rationale cannot be recovered, clearly label the rationale as reconstructed/inferred, not as a confirmed historical statement.

### H. Scientific provenance

Update `docs/07-scientific-data-and-provenance.md` and create `docs/18-data-and-asset-provenance-audit.md`.

For every displayed scientific field or training dataset, identify whether it is real, derived, or simulated. Record source, dataset/product ID, instrument, units, coordinate system, resolution, acquisition date, licence/attribution, and processing where actually available. Missing metadata must be marked unknown/not available.

For all models, textures, fonts, icons, sounds, and other assets, record the origin and license status. Do not assume an asset is redistributable. Identify assets with unknown provenance as a release risk.

### I. Requirements traceability

Update `docs/12-requirements-traceability.md` with the real implementation status and links to code/tests. Preserve the relationship to the original supplied project brief. Do not replace requirements with unrelated features.

### J. Limitations and future roadmap

Update `docs/11-risks-and-open-questions.md` based on the real implementation. Create `docs/19-roadmap.md` with:
- current verified baseline;
- highest-priority gaps;
- suggested next milestones;
- dependencies and risks;
- explicit distinction between essential fixes and optional polish.

### K. Changelog and contribution guide

Update `CHANGELOG.md` with factual changes. Update `CONTRIBUTING.md` to reflect actual lint/test conventions and asset/data contribution policy. Do not add a license without owner approval.

## PHASE 4 — CAPTURE EVIDENCE

If browser access or screenshots are available, capture a small set of clear screenshots showing only features that really work:
1. Main menu.
2. Third-person gameplay view.
3. Player interacting with a scientific target.
4. HUD/resources/objectives.
5. Map or wrist-device, if implemented.
6. Mission report, if implemented.

Save them under `docs/evidence/` with meaningful names. Add captions and describe what each screenshot proves. Do not use generated concept art as evidence of implemented gameplay. If screenshots cannot be captured, leave placeholders and state that evidence capture is pending.

## PHASE 5 — QUALITY REVIEW

Before finishing:
1. Ensure there are no contradictory instructions or duplicate sources of truth.
2. Ensure proposed and actual architecture documents are clearly distinguished.
3. Ensure every feature status is consistent across README, traceability, and implementation matrix.
4. Ensure run commands are verified.
5. Ensure all external links are useful and sources are correctly attributed.
6. Ensure no secrets or private environment values are documented.
7. Ensure the project is not described as certified for real astronaut safety or operational Mars navigation.
8. Ensure the master prompt remains available in `prompts/MASTER-PROMPT-VIDEO-GAME.md`.
9. Ensure this completion prompt remains available in `prompts/OPENCODE-REPOSITORY-COMPLETION-PROMPT.md`.
10. Check Git diff to ensure documentation work did not accidentally remove or overwrite game files.

## REQUIRED FINAL OUTPUT FROM YOU

At the end, provide a concise but detailed report with:

1. Repository audit: actual stack and key source directories.
2. What you tested, with exact commands and real results.
3. Which documents you created or updated.
4. Which requested systems are implemented, partial, or missing.
5. Any missing asset/data licenses or scientific provenance concerns.
6. Any remaining blockers and recommended next steps.
7. A confirmation that no development history, successful test, or data source was invented.

**Your mission is to document the real game that exists, while preserving the original vision and prompt. Do not simply rewrite the design prompt as if every requested feature has already been built.**
