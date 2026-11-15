import fs from 'node:fs';
import path from 'node:path';
const root = path.resolve(import.meta.dirname, '..');
const required = [
  'index.html', 'package.json', 'vite.config.ts', 'tsconfig.json',
  'src/main.tsx', 'src/app/App.tsx', 'src/app/scene/MarsWorld.tsx',
  'src/app/scene/Runtime.tsx', 'src/game/player/PlayerController.ts',
  'src/game/physics/PhysicsManager.ts', 'src/game/navigation/RoutePlanner.ts',
  'src/game/missions/MissionManager.ts', 'src/game/core/SaveManager.ts',
  'src/game/core/GameSimulation.ts', 'src/app/ui/WristMap.tsx',
  'src/game/data/scientificContent.ts', 'src/stores/gameStore.ts',
];
let failures = 0;
for (const file of required) {
  const target = path.join(root, file);
  if (!fs.existsSync(target) || !fs.statSync(target).isFile()) {
    console.error(`MISSING: ${file}`); failures++;
  }
}
if (failures) {
  console.error(`${failures} required file(s) missing`);
  process.exitCode = 1;
} else {
  console.log(`OK: ${required.length} required files exist (structural check only)`);
}
