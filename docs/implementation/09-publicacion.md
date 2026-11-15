# 09 · Guía de publicación en GitHub y web

La competición puede requerir dos entregas: **repositorio de código** (transparencia del desarrollo) y **enlace jugable** (acceso para jueces). Son cosas distintas.

## 1. Publicar código en GitHub

1. Descomprimir este repositorio y abrir la carpeta `olympus-walk` en tu equipo.
2. Ejecutar `npm install` para recuperar dependencias y generar `package-lock.json`.
3. Ejecutar `npm run typecheck`, `npm run build` y probar una misión en `npm run dev`.
4. Revisar derechos del PDF incluido; si hay dudas, quitarlo de `docs/source-material/` antes de subir.
5. Crear un repositorio GitHub vacío llamado `olympus-walk`.
6. En terminal, dentro de la raíz real del proyecto:

```bash
git init
git add .
git commit -m "Initial Olympus Walk source and development documentation"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/olympus-walk.git
git push -u origin main
```

Reemplaza `TU-USUARIO` por tu cuenta. No uses rutas privadas de tu computadora ni subas un proyecto unrelated como CHROMACLAW. GitHub puede pedir autenticación con cuenta, navegador o token.

## 2. GitHub Pages — despliegue automático

Este repositorio incluye `.github/workflows/pages.yml`. En GitHub entra a **Settings → Pages → Build and deployment → Source: GitHub Actions**. Al publicar en `main`, Actions instalará dependencias, comprobará TypeScript, construirá `dist` y desplegará la web.

La URL normalmente sigue el patrón:

`https://TU-USUARIO.github.io/olympus-walk/`

No se ha registrado ningún despliegue público realizado desde esta conversación; no existe URL confirmada que podamos compartir aún. La opción `base: './'` en Vite facilita su uso en subcarpetas.

## 3. Netlify

Conecta el repositorio y configura **Build command: `npm run build`**, **Publish directory: `dist`**. El archivo `netlify.toml` ya contiene esta configuración. Alternativamente, sube manualmente la carpeta `dist` resultante.

## 4. itch.io

Para subir un juego HTML5:

1. Ejecuta `npm run build`.
2. Comprime el **contenido** de `dist/` (no toda la carpeta del proyecto).
3. En itch.io crea un proyecto de tipo HTML, sube el ZIP y marca que se juega en navegador.
4. Configura una resolución inicial cómoda, por ejemplo 1280 × 720, y permite pantalla completa.
5. Verifica pointer lock y el comportamiento en iframe.

Si el ZIP se arma manualmente, `index.html` debe estar en la raíz del ZIP y a su lado debe estar `assets/`.

## 5. HTML independiente opcional

```bash
npm run build:singlefile
```

Este comando crea una variante opcional `OLYMPUS-WALK.html` incrustando JS/CSS de un build compatible. **No se incluye un HTML ya generado** porque no está disponible en el export de OpenCode. Comprueba su apertura con doble clic y con el navegador objetivo; algunas políticas de seguridad bloquean módulos o funcionalidades de archivos locales.

## Checklist para jueces

- [ ] Enlace jugable público, no localhost ni dirección de red privada.
- [ ] Carga en modo incógnito o desde otro dispositivo.
- [ ] Abre el mundo 3D e inicia una misión.
- [ ] WASD + cámara, escáner, interacción, mapa y retorno funcionan.
- [ ] Los controles táctiles no se solapan.
- [ ] Se conserva la distinción SIMULATION / DERIVED / REAL.
- [ ] El repositorio contiene código, documentación y prompt original.
- [ ] Las licencias y permisos del material fuente están revisados.
- [ ] No aparecen tokens ni rutas privadas en documentos públicos.

La guía histórica escrita por OpenCode está disponible en `PUBLICAR.md`; algunas referencias allí describen archivos de distribución que **existieron en su sesión**, pero que deben regenerarse desde esta copia.
