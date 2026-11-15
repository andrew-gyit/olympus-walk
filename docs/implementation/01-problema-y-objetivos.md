# 01 · Problema, objetivo y evolución de la idea

## Problema de origen

El PDF inicial describe un problema de **fragmentación de información científica sobre Marte**: topografía, imágenes orbitales, temperatura y mineralogía están distribuidas entre plataformas y no ofrecen por sí solas una interfaz unificada a escala de una caminata humana. La planificación de Marswalks exige considerar obstáculos, desniveles y otras precauciones sin sobrecarga cognitiva.

## Objetivo planteado en el documento original

Diseñar Olympus Walk como un mapa web responsivo e integrado por capas para preparar y ejecutar caminatas, analizar el relieve, localizar puntos de interés y comunicar precauciones de seguridad y protección planetaria.

## Giro de diseño hacia videojuego

Durante la definición con el usuario se decidió que un dashboard o mapa no bastaba. El **entorno 3D sería el centro de la experiencia**: controlar un astronauta, recorrer pendientes, usar instrumentos, observar, fotografiar, recolectar, administrar recursos y regresar a una base. La interfaz cartográfica permanece como instrumento del personaje, no como interfaz dominante.

## Personas usuarias

- Perfil del documento: Dra. Elena Vance, geóloga planetaria y exploradora de superficie, que planifica desde la base y consulta información en campo.
- Grupos previstos: exploradores, equipos de misión, científicos, estudiantes y público interesado.
- Versión construida: **prototipo educativo** jugable, no herramienta operativa de navegación humana real.

## Hipótesis de diseño

Integrar las capas geológicas y ambientales en un recorrido interactivo podría ayudar a comprender los riesgos y decisiones de una misión. En el prototipo esto es una hipótesis de valor educativo; **no se realizó una evaluación científica con astronautas reales**.

## Relación problema → mecánica

| Problema | Respuesta de diseño | Código |
|---|---|---|
| Información dispersa | Mapa con varias capas y pantalla de datos | `src/app/ui/WristMap.tsx` |
| Riesgo topográfico | Pendientes, colisiones, planificación y alertas | `src/world/TerrainGenerator.ts`, `src/game/navigation/RoutePlanner.ts` |
| Sobrecarga cognitiva | HUD, herramientas y objetivos contextualizados | `src/app/ui/HUD.tsx` |
| Descubrimiento científico | POIs, escaneo, muestras y observaciones | `src/game/data/pois.ts`, `src/stores/gameStore.ts` |
| Protección del entorno | Zonas, reglas de demostración y panel explicativo | `src/game/data/zones.ts`, `src/game/data/scientificContent.ts` |

**Fuente documental principal:** `docs/source-material/olympus-walk-brief-original.pdf`. Ver también los prompts de `prompts/` para la transición conceptual.
