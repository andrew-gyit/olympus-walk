# Cómo publicar OLYMPUS WALK

OLYMPUS WALK es una aplicación **100 % del lado del cliente**: no necesita backend, base de datos ni servidor propio. Solo hay que servir archivos estáticos. Por eso se puede publicar gratis en Netlify, itch.io, Cloudflare Pages, Vercel o GitHub Pages.

## Qué archivos subir

Ya está generado el paquete listo:

- **`olympus-walk-web.zip`** → contiene `index.html` y la carpeta `assets/` en la raíz. Es el que debes subir.
- **`dist/`** → la misma carpeta sin comprimir, por si el hosting pide arrastrar una carpeta.
- **`OLYMPUS-WALK.html`** → versión de un solo archivo para abrir con doble clic sin servidor (demostración offline o respaldo para jueces).

No subas `node_modules/`, `src/` ni el proyecto completo. Para jugar solo hacen falta los archivos de `dist/`.

> Importante: el `index.html` debe quedar en la **raíz** del sitio, no dentro de una subcarpeta. El ZIP ya está armado así.

---

## Opción 1 — Netlify Drop (la más rápida, sin instalar nada)

Ideal para obtener un enlace público en menos de un minuto.

1. Abre <https://app.netlify.com/drop>.
2. Arrastra **`olympus-walk-web.zip`** (o la carpeta `dist`) a la zona de carga.
3. Espera a que termine el despliegue. Netlify te dará una URL tipo `https://nombre-aleatorio.netlify.app`.
4. Abre esa URL en una ventana de incógnito para comprobar que carga sin tu sesión.
5. Si quieres conservar el sitio, editarlo o ponerle un nombre bonito, crea una cuenta gratuita y reclama el proyecto.

**Ventaja:** enlace directo, sin iframe, el mouse/pointer-lock funciona igual que en local.

---

## Opción 2 — itch.io (muy buena para una competición de juegos)

1. Crea una cuenta gratis en <https://itch.io>.
2. Ve a **Dashboard → Create new project**.
3. En **Kind of project** elige **HTML**.
4. Sube **`olympus-walk-web.zip`** en la sección de archivos.
5. Marca la casilla **“This file will be played in the browser”**.
6. En **Embed options** configura:
   - Viewport: **1280 × 720** (o “Fullscreen”).
   - Activa **Fullscreen button**.
   - Activa **Mobile friendly** si quieres que se pueda probar en teléfono.
7. Guarda y publica. itch.io te da una página pública tipo `https://tu-usuario.itch.io/olympus-walk`.

**Nota:** itch.io ejecuta el juego dentro de un iframe. Si el ratón no captura el puntero en algún navegador, usa el botón de pantalla completa o comparte también el enlace directo de Netlify.

---

## Opción 3 — Cloudflare Pages o Vercel (cuenta gratuita)

### Cloudflare Pages
1. Entra en <https://pages.cloudflare.com>.
2. **Create a project → Direct Upload**.
3. Sube la carpeta `dist` o el ZIP.
4. Obtendrás `https://tu-proyecto.pages.dev`.

### Vercel
1. Entra en <https://vercel.com>.
2. **Add New → Project → Upload** (o conecta un repositorio).
3. Si conectas el repositorio, usa:
   - Build command: `npm run build`
   - Output directory: `dist`
4. Obtendrás `https://tu-proyecto.vercel.app`.

---

## Opción 4 — GitHub Pages (gratis y permanente)

Útil si quieres que el proyecto quede en tu portafolio y se actualice con cada push.

1. Crea un repositorio en GitHub y sube **el contenido de la carpeta `olympus-walk`** (no la carpeta padre con otros proyectos).
2. En el repositorio: **Settings → Pages → Source: GitHub Actions**.
3. Añade el workflow de despliegue (o pídelo y lo dejo configurado).
4. La URL será `https://tu-usuario.github.io/tu-repositorio/`.

El proyecto ya usa `base: './'`, así que funciona tanto en la raíz de un dominio como en una subcarpeta de GitHub Pages o itch.io.

---

## Lista de comprobación antes de entregar

- [ ] Abrir el enlace en **ventana de incógnito** (sin caché ni extensiones).
- [ ] Probarlo en **otro dispositivo** o al menos en otro navegador.
- [ ] Confirmar que el canvas 3D se ve y que se puede iniciar la primera misión.
- [ ] Probar **WASD + ratón**, `F` (escáner), `E` (analizador), `M` (mapa) y `Esc` (pausa).
- [ ] En teléfono: confirmar que aparecen los controles táctiles.
- [ ] Comprobar que el enlace es **público** y no pide iniciar sesión.
- [ ] Tener a mano la versión `OLYMPUS-WALK.html` y/o un video corto como respaldo para los jueces.
- [ ] Revisar que el texto de la competición permita enlaces externos (Netlify, itch.io, etc.).

## Problemas frecuentes

| Síntoma | Causa probable | Solución |
| --- | --- | --- |
| Pantalla en negro | El navegador no tiene WebGL2 o lo tiene desactivado | Usar Chrome/Edge/Firefox actualizado; activar aceleración por hardware |
| El juego carga pero no responde al ratón | El iframe del hosting no captura el puntero | Abrir en pestaña completa o usar el enlace directo de Netlify |
| 404 al entrar | Se subió la carpeta padre en vez del contenido de `dist` | Volver a subir el ZIP; `index.html` debe estar en la raíz |
| No guarda el progreso | localStorage bloqueado o navegación privada | Permitir almacenamiento local; el guardado es por navegador/dispositivo |
| Va lento en un equipo modesto | Renderizado por software | Cerrar otras pestañas; usar un equipo con GPU; reducir la ventana |

## Enlaces útiles

- Netlify Drop: <https://app.netlify.com/drop>
- itch.io: <https://itch.io>
- Cloudflare Pages: <https://pages.cloudflare.com>
- Vercel: <https://vercel.com>
- GitHub Pages: <https://pages.github.com>
