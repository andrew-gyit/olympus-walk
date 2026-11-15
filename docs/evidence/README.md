# Evidencia técnica saneada

- `development-operations.csv`: secuencia de escrituras y ediciones recuperadas, con rutas relativas. **No** es un historial de commits Git.
- `source-hashes.sha256`: huellas SHA-256 de 49 archivos de código y configuración después de la reconstrucción y el ajuste de package.json.
- `recovery-summary.json`: métricas resumidas del export OpenCode y límites de verificación.

El export bruto no se adjunta para evitar exponer rutas locales, identidades de sesión y logs de depuración. Las pruebas del navegador se describen como evidencia histórica, no como una ejecución propia del repositorio entregado.
