# 13 · Guion de demostración para jurado

**Duración orientativa:** breve demostración guiada. No presentar capacidades que no funcionen al momento de evaluar; primero completar la matriz QA.

## Presentación del problema

“Los datos de Marte proceden de diversas misiones y fuentes. Olympus Walk propone aprender a integrar información de terreno, riesgos y ciencia mediante una caminata virtual inmersiva, no solo visualizando un mapa.”

## Demostración de videojuego

1. Abrir el enlace público y mostrar el menú OLYMPUS WALK.
2. Entrar a FIRST STEPS y mostrar Base Camp A y la cámara 3D.
3. Caminar con WASD y explicar que el terreno procedural usa físicas y pendientes.
4. Acercarse a un objetivo, activar el escáner con F y analizar con E.
5. Abrir M; mostrar capas de pendiente, elevación y riesgos.
6. Explicar la ruta asistida y la necesidad de evaluar terreno.
7. Mostrar recursos del traje: oxígeno, batería e integridad.
8. Abrir el panel de protección planetaria y explicar las regiones de demostración.
9. Registrar una observación/muestra y regresar al campamento.
10. Mostrar informe final y repositorio documentado.

## Transparencia técnica ante preguntas

- **¿Usan datos reales de NASA?** “La propuesta está inspirada en fuentes NASA/USGS y documentación científica. El escenario jugable actual es procedural y claramente simulado; no afirmamos que sea un relieve real de Olympus Mons.”
- **¿Cómo se desarrolló?** “Mediante un prompt maestro, iteraciones con OpenCode, programación en React/Three.js/Rapier, pruebas de navegador y documentación con trazabilidad.”
- **¿Qué se puede verificar?** “Código completo, archivos de misiones, algoritmos de rutas, historial resumido de desarrollo y workflows de CI.”
- **¿Es apto para astronautas?** “No. Es un simulador educativo y de demostración de conceptos.”

## Antes de presentar

El proyecto debe pasar QA-01 a QA-12 en `08-pruebas-y-evidencia.md` y contar con una URL pública que otros dispositivos puedan abrir sin acceso a tu computadora. Ten un vídeo propio de respaldo si la competición permite subirlo.
