# 14 · Hoja de ruta y trabajo pendiente

Los puntos siguientes no deben confundirse con funcionalidades presentes.

## Prioridad 0 — Validar esta copia

- Ejecutar `npm install`, generar y subir `package-lock.json`.
- Pasar `npm run typecheck` y `npm run build` en un equipo con conexión.
- Revisar errores de consola, compatibilidad WebGL y entrada táctil.
- Confirmar que los archivos reconstruidos coinciden con el directorio original si todavía existe.
- Realizar un recorrido completo de FIRST STEPS y registrar resultados.

## Prioridad 1 — Calidad de software

- Incorporar pruebas versionadas unitarias de cálculo de pendientes, rutas, eventos, guardado, objetivos y restricciones.
- Automatizar pruebas end-to-end en navegador (Playwright, por ejemplo).
- Medir FPS, consumo de memoria y bundle en dispositivos reales.
- Refactorizar `src/stores/gameStore.ts` en slices más pequeños.
- Refinar accesibilidad de paneles, contraste, subtítulos/sonido y controles.

## Prioridad 2 — Confiabilidad científica

- Crear adaptadores para fuentes reales verificadas y acotadas espacialmente.
- Incluir metadatos de instrumento, resolución, fecha, error, datum y proyección.
- Revisar la clasificación real/derivada/simulación en toda la interfaz.
- Auditar cómo se comportan las rutas al encontrarse con **zonas restringidas**.
- Mejorar los niveles de incertidumbre y trazabilidad de hallazgos simulados.

## Prioridad 3 — Distribución y presentación

- Publicar sitio público y comprobar desde otro navegador/dispositivo.
- Añadir capturas auténticas y un video de demo al repositorio.
- Revisar derechos del PDF y activos; seleccionar licencia.
- Fijar pruebas reproducibles, releases y un changelog por versiones.

## Futuro opcional

- Mayor contenido científico, pruebas de usabilidad, nuevas misiones, validación geográfica, telemetría más rigurosa, multilenguaje y soporte de hardware adicional.
