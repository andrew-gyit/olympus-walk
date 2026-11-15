# 06 · Ciencia, fuentes y procedencia de los datos

## Principio de honestidad científica

OLYMPUS WALK tiene inspiración científica, pero su escenario es **simulado**. La presencia de una referencia bibliográfica en pantalla no significa que el terreno se haya descargado de esa institución o que la medición haya sido tomada en el punto ficticio del juego.

La interfaz y configuración distinguen tres etiquetas:

| Etiqueta | Uso previsto | Ejemplo en este proyecto |
|---|---|---|
| `REAL DATA` | Referencias científicas o legales publicadas, usadas como contexto | Gravedad marciana aproximada y textos citados |
| `DERIVED DATA` | Cálculos obtenidos a partir de modelos/datos de partida | Pendiente derivada del *terreno procedural*; no significa dato NASA |
| `SIMULATION DATA` | Datos inventados para el escenario didáctico | Relieve procedural, radiación por sector, minerales ficticios, muestras |

Esta división se refleja en `src/game/config.ts` (`DATA_LABELS`) y `src/game/types.ts` (`DataClass`). Conviene revisar que **cada panel** la preserve al incorporar futuras fuentes.

## Proveedores mencionados en la propuesta

- [NASA Mars Trek](https://trek.nasa.gov/mars/) — herramienta cartográfica marciana de referencia.
- [NASA Mars 2020 Raw Images](https://mars.nasa.gov/mars2020/multimedia/raw-images/) — material visual de Perseverance.
- [USGS Astrogeology](https://astrogeology-usgs.hub.arcgis.com/pages/interactive-maps-mars) — cartografía y recursos geológicos.
- [NASA Worldview](https://worldview.earthdata.nasa.gov/) — plataforma de visualización de datos de la Tierra. Su mención en el PDF no demuestra cobertura útil de Olympus Mons.
- MOLA, THEMIS, HiRISE, CTX y CRISM fueron propuestos como instrumentos/datasets para una posible integración futura, **no** declarados como APIs conectadas en la versión recuperada.

## Qué usa actualmente el programa

El código genera la topografía con `TerrainGenerator.ts`, configura POIs/minerales en `src/game/data/pois.ts` y zonas de precaución en `zones.ts`. La temperatura y radiación de la sesión de entrenamiento se simulan en las estructuras de estado/ambiente. `RoutePlanner.ts` obtiene pendientes del terreno generado.

No se identificó en los archivos recuperados una implementación que descargue mosaicos cartográficos georreferenciados reales desde NASA, ni un backend para almacenar datos oficiales. No se debe prometer al jurado que el mundo 3D es una réplica científica exacta.

## Protocolo de una futura integración científica

1. Identificar dataset oficial, licencia, resolución y fecha de adquisición.
2. Verificar que la región cubierta sea realmente la del escenario.
3. Declarar referencia espacial, datum y unidad de altura.
4. Implementar un proveedor separado con validación de respuesta y manejo de errores.
5. Interpolar/resamplear únicamente con control de incertidumbre.
6. Identificar fuente y transformación en el HUD y mapa.
7. Dejar un modo demostrativo funcional sin conexión.
8. Probar la consistencia entre terreno visual, físicas y rutas.

## Restricciones de seguridad

Los umbrales de pendientes, consumos del traje, recursos y los sectores de precaución tienen fines de **entrenamiento** y nunca deben utilizarse para planificación real de una caminata humana en Marte. La aplicación no ha sido certificada ni validada por NASA.
