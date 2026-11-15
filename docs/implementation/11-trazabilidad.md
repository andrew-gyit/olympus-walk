# 11 · Trazabilidad de requisitos a módulos

Esta tabla conecta el documento inicial y el prompt de videojuego con **archivos recuperados**. `IMPLEMENTADO EN CÓDIGO` significa que existe una implementación identificable, pero no garantiza por sí solo la ausencia de fallos en ejecución. `NO IDENTIFICADO` significa que no se encontró evidencia de esa característica en el código recuperado.

| ID | Requisito | Archivos | Situación |
|---|---|---|---|
| R-01 | Explorar escena marciana 3D | `src/app/scene/MarsWorld.tsx`, `Terrain.tsx`, `BaseCamp.tsx` | Implementado en código |
| R-02 | Control WASD y cámara | `src/game/player/InputManager.ts`, `PlayerController.ts`, `CameraController.ts` | Implementado en código |
| R-03 | Físicas/colisión | `src/game/physics/PhysicsManager.ts` | Implementado en código |
| R-04 | Astronauta visible | `src/game/player/AstronautRig.ts` | Implementado en código |
| R-05 | Scanner y análisis | `src/game/core/GameSimulation.ts`, `src/app/ui/Panels.tsx` | Implementado en código |
| R-06 | Inventario y muestras | `src/stores/gameStore.ts`, `src/app/ui/Panels.tsx` | Implementado en código |
| R-07 | Fotografías | `src/app/scene/Runtime.tsx`, `src/stores/gameStore.ts` | Implementado en código |
| R-08 | Mapa 2D y capas | `src/app/ui/WristMap.tsx`, `src/game/config.ts` | Implementado en código |
| R-09 | Rutas A* | `src/game/navigation/RoutePlanner.ts` | Implementado en código |
| R-10 | Consumo de recursos | `src/game/core/GameSimulation.ts`, `src/game/config.ts` | Implementado en código |
| R-11 | Cinco misiones | `src/game/data/missions.ts`, `src/game/missions/MissionManager.ts` | Implementado en código |
| R-12 | Protección planetaria | `src/game/data/zones.ts`, `scientificContent.ts`, `src/app/ui/Panels.tsx` | Implementado en código |
| R-13 | Pantallas y HUD | `src/app/App.tsx`, `src/app/ui/HUD.tsx`, `Menus.tsx`, `ReportScreen.tsx` | Implementado en código |
| R-14 | Guardar y continuar | `src/game/core/SaveManager.ts`, `src/stores/gameStore.ts` | Implementado en código |
| R-15 | Controles para móvil | `src/app/ui/TouchControls.tsx` | Implementado en código |
| R-16 | Datos NASA descargados y georreferenciados al terreno | Sin adaptadores reales identificados | No identificado / futuro |
| R-17 | Mundo validado a escala real de Olympus Mons | Terreno procedural, no DEM real | No identificado / no afirmar |
| R-18 | Backend / multiusuario | No recuperado | No requerido en la versión cliente |
| R-19 | Suite de pruebas de regresión versionada | Scripts CDP solo en sesión temporal | No identificada / futura |
| R-20 | Publicación en enlace público | `.github/workflows/pages.yml` preparada aquí | Pendiente de publicación |

**Nota:** Los ítems R-01 a R-15 deben verificarse mediante `npm run build` y pruebas de navegador después de obtener dependencias; el historial original registra algunas de estas pruebas, que no sustituyen las de la entrega final.
