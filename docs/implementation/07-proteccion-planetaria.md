# 07 · Protección planetaria en el simulador

## Origen

El PDF inicial de Olympus Walk dedica varias páginas a las normas de exploración y protección planetaria, el marco jurídico espacial, las regiones especiales e inciertas y las **zonas de precaución**. Esta información se tradujo a contenido educativo y eventos de juego. La fuente implementada principal es `src/game/data/scientificContent.ts`; las áreas concretas del escenario se definen en `src/game/data/zones.ts`.

## Los cuatro principios

| Título en el juego | Objetivo didáctico |
|---|---|
| **PROTECT THE MARTIAN ENVIRONMENT** | Evitar la dispersión de contaminantes biológicos y preservar el contexto científico |
| **WATCH FOR SPECIAL REGIONS** | Reconocer la diferencia entre regiones especiales verificadas e inciertas |
| **ASSESS THE TERRAIN BEFORE MOVING** | Consultar pendientes y obstáculos antes de desplazarse |
| **FOLLOW MISSION PROTECTION MEASURES** | Respetar evaluaciones científicas, ruta, protocolos y registro de observaciones |

## Tres tipos de precaución

1. **Topográfica:** pendiente, desnivel, obstáculo, depresión o escarpe.
2. **Ambiental:** temperatura, hielo potencial, radiación u otra condición relevante.
3. **Protección planetaria:** posible entorno sensible o riesgo de contaminación biológica.

Un punto puede pertenecer a múltiples clases. El código representa esta estructura con `PrecautionZone`, `categories`, `type`, `access` y `dataClass`.

## Restricciones jugables

El escenario puede identificar áreas de observación únicamente (`observe-only`), de tránsito cuidadoso (`traverse-with-care`) o restringidas (`restricted`). Una acción de recolección no autorizada puede bloquearse o registrarse como incidente. La puntuación de protección planetaria es una **mecánica educativa**, no una evaluación jurídica.

## Separación entre tratados y recomendaciones

| Fuente | Naturaleza | Uso en Olympus Walk |
|---|---|---|
| Tratado del Espacio Ultraterrestre (1967), art. IX | Tratado internacional, compromisos para Estados parte | Contexto de prevención de contaminación perjudicial |
| COSPAR Planetary Protection Policy (2020) | Política técnica de protección planetaria | Criterios educativos para precaución y regiones especiales |
| NASA-STD-8719.27 y guía de NASA | Normas y guías técnicas institucionales | Referencias de implementación y consideración operativa |
| Convenios y directrices citados en el PDF | Diversa naturaleza jurídica o de política | Material de contexto, no reglas jurídicas derivadas automáticamente |

La referencia a un tratado **no** certifica que una acción del jugador sea lícita o ilícita bajo derecho espacial. Tampoco puede afirmarse que una zona del terreno procedural sea una región especial oficial de Marte.

## Referencias de consulta

- [Tratado del Espacio Ultraterrestre — UNOOSA](https://www.unoosa.org/oosa/en/ourwork/spacelaw/treaties/outerspacetreaty.html)
- [Política COSPAR (versión PDF 2020)](https://cosparhq.cnes.fr/assets/uploads/2020/07/PPPolicyJune-2020_Final_Web.pdf)
- [NASA-STD-8719.27](https://standards.nasa.gov/standard/NASA/NASA-STD-871927)
- [Planetary Protection Handbook (NASA/SP-20240016475)](https://ntrs.nasa.gov/citations/20240016475)

Los enlaces se aportan como referencias de investigación; no todos se verificaron externamente durante el empaquetado.
