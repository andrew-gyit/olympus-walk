# 08 · Pruebas, evidencias y limitaciones de verificación

## Una distinción esencial

El historial original muestra pruebas ejecutadas **en la computadora de OpenCode**. Este repositorio fue reconstruido posteriormente a partir de operaciones de archivo exportadas; por tanto, debe evitarse confundir aquellas comprobaciones históricas con pruebas realizadas a la copia entregada.

## Evidencia registrada por OpenCode

En su mensaje de cierre de pruebas, OpenCode informó:

- Flujo de herramientas: escanear → analizar → recoger muestra → observar → fotografiar → volver a base.
- Muestra en inventario, observación en registro y fotografía generada.
- Paneles de pausa, inventario, protección planetaria y configuración visibles a 1280 × 720.
- Guardar y salir; restauración de muestras, observaciones, fotos y posición.
- Limpieza de partida de continuación al finalizar, fallar o abortar.
- Informes con puntuación, desbloqueos y opción de repetir.
- Controles táctiles comprobados en una vista de 430 × 932.
- `npm run typecheck` y `npm run build` informados como correctos.
- Vista de producción WebGL inicializada y funcionando.
- Build desde una subruta `/game/` probado más adelante para publicación.

Se trata de **afirmaciones respaldadas por salidas del historial**, no de un conjunto formal de pruebas reproducibles incluídas con código. El historial también contiene scripts temporales y outputs de CDP; no se exportaron como archivos versionados.

## Pruebas realizadas a la reconstrucción

| Prueba | Estado | Método |
|---|---|---|
| Recuperación de escrituras y ediciones | **PASÓ** | Reaplicación secuencial de las operaciones exportadas: 49 archivos, 63 ediciones |
| Coherencia de edición | **PASÓ** | Ninguna de las 63 sustituciones exitosas quedó sin correspondencia en el texto reconstruido |
| Análisis sintáctico de TypeScript/TSX | **PASÓ** | `typescript.transpileModule` revisó 40 archivos TS/TSX, sin errores de parseo |
| Archivos estructurales mínimos | **PASÓ** | `npm run check:structure` encuentra 17 archivos críticos |
| Instalación real de dependencias en esta sesión | **NO COMPLETADA** | DNS del entorno no pudo resolver `registry.npmjs.org` (`EAI_AGAIN`) |
| `npm run typecheck` de la copia | **PENDIENTE** | Requiere dependencias npm instaladas |
| `npm run build` de la copia | **PENDIENTE** | Requiere dependencias npm instaladas |
| Prueba real WebGL de la copia en navegador | **PENDIENTE** | Requiere build y navegador con WebGL2 |
| Publicación pública | **NO REALIZADA** | Es necesario subirlo a GitHub/hosting y comprobar la URL |

## Matriz de regresión recomendada

| ID | Prueba | Resultado esperado |
|---|---|---|
| QA-01 | Abrir aplicación y empezar FIRST STEPS | Se muestra el astronauta y el HUD |
| QA-02 | Mover con WASD | Cámara sigue al personaje, posición actualiza y colisiones funcionan |
| QA-03 | Abrir mapa (M) y activar pendiente | El mapa cambia de capa y conserva ubicación |
| QA-04 | Escanear y analizar POI | Se registra análisis solo dentro del rango permitido |
| QA-05 | Recoger una muestra | Se refleja en inventario/capacidad |
| QA-06 | Tomar fotografía | Se registra la imagen en inventario de la misión |
| QA-07 | Pausar, guardar y continuar | Recupera progreso y coordenadas |
| QA-08 | Regresar a campamento | Genera informe al completar requisitos |
| QA-09 | Área de protección planetaria | Se muestra la precaución; acciones limitadas donde aplique |
| QA-10 | Móvil táctil | Controles funcionan sin overflow horizontal |
| QA-11 | Build en `/game/` | JS/CSS cargan con rutas relativas |
| QA-12 | Probar el deploy desde incógnito | Otra persona puede entrar sin servicios locales |

## Comandos recomendados

```bash
npm install
npm run check:structure
npm run typecheck
npm run build
npm run preview
```

`npm run check:structure` comprueba **existencia de archivos, no jugabilidad**. El paso de `tsc` comprueba tipos, no la simulación WebGL. Los flujos QA deben ejecutarse en navegador.

## Riesgos de compilación y publicación

El historial original advirtió de un **bundle grande** debido a Three.js y Rapier; esto no impidió su build, pero debe revisarse en equipos modestos. Revisa también compatibilidad de WebGL2, pointer lock, almacenamiento local, rutas bajo subcarpeta e información legal de materiales externos.
