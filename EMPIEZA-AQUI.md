# Empieza aquí — Entregar Olympus Walk a una competencia

Este archivo explica qué hacer con el repositorio recuperado del historial de OpenCode.

**1. Descomprime** `OLYMPUS-WALK-repositorio-completo.zip`. La carpeta que debes abrir es `olympus-walk/` (contiene `package.json` y `src/`). No la confundas con el otro juego que había en la computadora original.

**2. Instala dependencias** en una terminal desde esa carpeta:

```bash
npm install
```

Esto genera `node_modules/` y normalmente `package-lock.json`. No subas `node_modules/`, pero **sí conserva `package-lock.json`**. Para instalar npm se requiere Internet la primera vez.

**3. Comprueba** el proyecto:

```bash
npm run check:structure
npm run typecheck
npm run build
npm run dev
```

Prueba WASD, cámara, F, E, M, volver a la base y el informe en tu navegador. Si aparecen errores de compilación, el archivo `docs/implementation/08-pruebas-y-evidencia.md` distingue las pruebas realizadas y las pendientes.

**4. Crea tu repositorio en GitHub.** No subas el ZIP como único archivo: **sube su contenido** (carpetas `src/`, `docs/`, `prompts/`, scripts, configuración). Puedes seguir los comandos de `docs/implementation/09-publicacion.md` o usar la interfaz de GitHub.

**5. Habilita el enlace jugable.** Ve a GitHub → `Settings` → `Pages` → `GitHub Actions`. El workflow `.github/workflows/pages.yml` compilará y desplegará el videojuego si la instalación y el build terminan sin errores. Tu URL pública todavía no se ha creado desde aquí.

**6. Revisa los derechos del PDF.** El archivo original se incluye como evidencia del proceso. Confirma que puedes redistribuirlo públicamente (incluidas sus imágenes) antes de hacer el repositorio público; si no, retíralo de la publicación.

## Qué entregas tendrás

- **Repositorio GitHub:** código + prompt maestro + documentación del diseño y desarrollo + trazabilidad + fuentes de referencia.
- **Sitio web jugable:** URL de GitHub Pages o un hosting equivalente.
- **Transparencia:** el código y la documentación distinguen lo implementado, lo simulado y lo que queda pendiente.

## Limitación conocida

La reconstrucción se hizo a partir de instrucciones de escritura/edición del historial JSON, no de un clon Git original. La sintaxis y la estructura fueron comprobadas; el build propio de esta copia requiere `npm install` en un equipo con acceso al registro de npm. El log original de OpenCode registra compilaciones satisfactorias, pero debes repetirlas antes de presentar el enlace.
