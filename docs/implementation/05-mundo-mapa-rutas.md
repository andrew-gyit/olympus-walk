# 05 · Mundo, terreno, mapa y cálculo de rutas

## Geometría del escenario

El mundo usa `TerrainGenerator.ts` y datos compartidos en `terrainData.ts`. `WORLD` en `src/game/config.ts` fija un parche de **900 × 900 unidades tratadas como metros**, una malla de **200 subdivisiones por eje**, un área jugable aproximada de **±355** en X/Z y semilla **1967**. Este escenario es una región ficticia inspirada en Olympus Mons, no un DEM certificado ni una reconstrucción exacta.

La campana geográfica, el terreno y los POIs se utilizan por el motor de movimiento, la presentación visual y el planificador de rutas. `BaseCamp.tsx`, `RockField.tsx`, `PoiField.tsx` y `SkyAndLight.tsx` aportan la escena de exploración.

## Instrumento de muñeca

`WristMap.tsx` dibuja un mapa de campo que conserva coordenadas relativas a la escena 3D y representa posición, rutas y puntos de interés. Las capas configuradas en `src/game/config.ts` son:

| Capa | Etiqueta y significado |
|---|---|
| elevation | Relieve y elevación derivados de la geometría |
| slope | Bandas de pendiente derivadas del campo de alturas |
| surface | Aspecto de superficie simulado |
| temperature | Modelo térmico simulado/derivado |
| minerals | Indicadores de composición simulados |
| radiation | Sectores de radiación simulados; no mediciones |
| hazards | Obstáculos y zonas de precaución del escenario |

Los umbrales de color de pendiente en la configuración son 0–12°, 12–25°, 25–35°, 35–45° y ≥45°. Son categorías de esta demo, no normas de NASA.

## Rutas

`RoutePlanner.ts` calcula rutas con una rejilla de **161 × 161 celdas** (`WORLD.size / 160` por celda), un campo de pendientes y un mapa de coste. Emplea una cola mínima (`MinHeap`) para la búsqueda de caminos y considera zonas y cercanía a POIs.

Los perfiles visibles para el jugador son:

- **SAFEST ROUTE:** ponderación orientada a reducir peligros.
- **BALANCED ROUTE:** equilibrio de distancia y coste.
- **SCIENTIFIC ROUTE:** prioriza oportunidades científicas dentro de las restricciones del algoritmo.

Las rutas no son recomendaciones reales para astronautas. La selección de destino desde el mapa no significa piloto automático obligatorio: el usuario controla manualmente al personaje.

## Precaución sobre zonas

En el cálculo recuperado se bloquean celdas fuera del área jugable y pendientes por encima de un umbral configurado; las zonas también introducen penalizaciones según el tipo. Por tanto, **no conviene afirmar sin una auditoría adicional que todo polígono restringido se trata siempre como obstáculo geométrico absoluto durante cada perfil de ruta**. Esa consistencia es una prueba de regresión prioritaria si el simulador se utiliza para una evaluación formal.

## Siguientes mejoras

Para integrar fuentes espaciales reales habría que normalizar sistemas de referencia, elevaciones, resolución y georreferenciación; establecer incertidumbre y procedencia; y reemplazar las capas de demostración sin romper el movimiento, colisiones y A*.
