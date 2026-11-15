# 12 · Metodología de reconstrucción del repositorio

## Fuente utilizada

Se proporcionó un export JSON de una sesión de OpenCode de aproximadamente 7 MB. Incluye 425 registros (mensajes de usuario, asistente, compaction, estados y operaciones de herramientas). El formato contiene contenidos de `write`, `edit`, `read`, `shell` y otros tipos de herramientas.

## Procedimiento aplicado

1. Se analizó la estructura JSON y se identificaron las operaciones de escritura sobre la carpeta `olympus-walk/`.
2. Se recuperaron en orden cronológico las 49 rutas únicas de proyecto con contenido íntegro desde las entradas `write`.
3. Se aplicaron las ediciones exitosas `edit` en el orden original mediante sustitución del fragmento anterior por el nuevo. Las sustituciones se validaron sobre los textos reconstruidos.
4. Se reprodujo una transformación global explícita realizada desde PowerShell sobre importaciones relativas de `src/app/scene/*.tsx`.
5. Se excluyeron scripts y archivos temporales de depuración ubicados fuera de la carpeta del juego.
6. Se contrastaron `package.json` y el historial de instalación npm; se repusieron las dependencias con versiones fijadas.
7. Se conservó el prompt original completo y el PDF entregado como fuentes de diseño.
8. Se creó documentación actualizada basada en los archivos recuperados y una guía de publicación.
9. Se ejecutó un análisis sintáctico de los archivos TS/TSX y una comprobación estructural.

## Resultado

| Medida | Resultado |
|---|---:|
| Archivos del proyecto recuperados de escrituras | 49 |
| Ediciones recuperadas y aplicadas | 63 |
| Sustituciones faltantes al reconstruir | 0 |
| Archivos TS/TSX comprobados sintácticamente | 40 |
| Errores sintácticos detectados | 0 |

La lista de rutas y huellas SHA-256 se documenta en `docs/evidence/source-hashes.sha256`. El resumen cronológico saneado de operaciones se encuentra en `docs/evidence/development-operations.csv`.

## Qué **no** puede garantizarse desde el JSON

- Que contenga archivos creados manualmente por el usuario y nunca vistos por OpenCode.
- Que incluya una instantánea real del `dist/` final, el `package-lock.json`, la versión HTML independiente o el ZIP de producción.
- Que el estado de la computadora del usuario siguiera siendo exactamente igual después del export.
- Que todos los comandos `shell` hayan sido capturados con sus efectos en binarios externos.
- Que los scripts CDP temporales representen pruebas automatizadas reproducibles adjuntas.
- Que exista una historia de commits Git verificable: **no se deben inventar commits anteriores**.

## Privacidad

No se publica el JSON bruto para evitar difundir rutas privadas del sistema, nombres de usuario locales, ids de sesión, logs del navegador y otros posibles datos sensibles. El documento de operaciones guarda rutas relativas al proyecto y evita el contenido de las entradas de herramientas.

## Verificación pendiente

Instalar dependencias, ejecutar `npm run typecheck` y `npm run build`, iniciar el videojuego, probar una misión y comparar las pantallas con el proyecto original local si está disponible. Si el directorio original aún existe, la comparación de hashes por archivo permitirá detectar diferencias.
