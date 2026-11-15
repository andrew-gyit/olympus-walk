# Changelog

## 2026-11-15 — Versión reconstruida y documentada

- Recuperación de 49 archivos de código y configuración desde escrituras y ediciones registradas en el historial de OpenCode.
- Recuperación del prompt maestro original del videojuego y del documento de requisitos.
- Documentación de arquitectura, decisiones, trazabilidad, pruebas, limitaciones y publicación.
- Reconstrucción de `package.json` con las versiones exactas de dependencias declaradas en los comandos de instalación de OpenCode (el archivo exportado no incluía `package-lock.json`).
- Incorporación de comprobación estructural y automatización de CI/Pages para GitHub.

### Origen y límites

El historial de OpenCode indica que su versión compiló y fue probada visualmente. Esta copia fue reconstruida del registro exportado, **no** clonada desde un repositorio Git original; por tanto no afirma conservar los commits originales, binarios `dist`, capturas ni el historial Git. La verificación sintáctica local pasó, pero la instalación npm y la compilación completa están pendientes de una máquina con conexión al registro de npm.
