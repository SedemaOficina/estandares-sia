# Estándar de geovisores del SIA · propuesta (14 oct 2026)

Borrador para que la Secretaría decida. Cuando se apruebe, este archivo pasa a `docs/09-trazabilidad.md` y deja de ser propuesta.

## Para qué

Que cada visor nuevo de SEDEMA arranque de código probado y no desde cero: el mismo panel, los mismos controles, la misma simbología, la misma ficha, el mismo comportamiento en el celular y las mismas pruebas, con las trampas ya resueltas (iPhone, deck.gl, Leaflet, nginx, Windows). Material de origen: `docs/00-aprendizajes.md` (cinco proyectos).

## Cómo se relaciona con lo que ya existe

| Pieza | Qué pone |
|---|---|
| Estándar de formularios (`SedemaOficina/estandar-formularios`) | Colores, letra, tamaños, cortes de ancho, foco, avisos y formularios. **El de geovisores no los redefine: los toma de ahí.** |
| Estándar de geovisores (este) | Lo que solo tiene un mapa: armazón panel + mapa, dos pantallas, controles, capas, simbología, ficha, buscador geográfico, etiquetas, fondo propio, datos geográficos, rendimiento del mapa y sus pruebas |
| Skill `proyecto-sia` | Base de datos, servidor, cuentas, paquete de entrega al SIA |
| Skill `construir-sistema-nuevo` | Orden de etapas y método de trabajo |

## Estructura del repositorio

```
README.md · CHANGELOG.md · package.json        (Node ≥ 22; Playwright y axe-core solo para verificar)
codigo/
  css/          tokens-mapa.css (lo propio del mapa; usa tokens.css de formularios) · armazon.css
  js/           armazon.js: pantalla(), alto real, aviso(), anunciar(), ventanas, historial, turnos, tx()
  motores/
    leaflet/    marcador propio, dos dedos, menú de capas, invalidateSize, tabindex, en español
    deckgl/     irA(), despiertas, dedos fantasma, colocador de etiquetas, lector del formato binario
  modulos/      controles · capas · simbologia · ficha · buscador · ubicacion · escala · lista ·
                filtros · descargas · compartir · fondo-propio
  plantillas/   visor-consulta (panel + mapa, dos pantallas) · mapa-en-pagina (ficha o formulario)
  fuentes/ · iconos/ · imagenes/
datos/          Python: validar, reproyectar, simplificar, formato binario, punto del nombre, fondo propio
servidor/       encabezados.conf (CSP), nginx y Express de ejemplo
herramientas/   armar.mjs (une piezas, huellas, textos, solo-prueba) · auditor-css · contraste · verificar · empaquetar
pruebas/        tamaños, dos pantallas, sin terceros, CSP, sin WebGL, sin red, datos tardíos, etiquetas, dedos, axe
reglas/         reglas.json (GEO-01 … con nivel BASE / RECOMENDADO / OPCIONAL y proyecto de origen)
docs/           00 aprendizajes · 01 reglas · 02 guía de estilo del mapa · 03 guía de decisión ·
                04 componentes · 05 datos geográficos · 06 código · 07 bibliotecas · 08 verificación · 09 trazabilidad
guia-visual/    (desde la fase 1) estilo del mapa en vivo; cada componente entra al extraerse, como en formularios
vendor/         (fase 2) Leaflet, deck.gl y axe-core; formularios no se copia: vive en ../formularios (carpeta común estandares-sia, decisión del 14 oct 2026)
```

## Fases

| Fase | Qué se cierra | Cómo se prueba que terminó |
|---|---|---|
| 0 · Aprendizajes y decisiones | `00-aprendizajes.md` y las decisiones D1–D12 | La Secretaría aprueba las decisiones |
| 1 · Reglas y estilo | `reglas.json` (GEO-xx), `01-reglas.md`, `02-guia-de-estilo.md`, `03-guia-de-decision.md`, `tokens-mapa.css` y la guía visual del estilo (pedido de la Secretaría, 14 oct 2026) | Cada regla con nivel y origen; tokens medidos con `contraste` y `rampas`; `npm run verificar` en verde |
| 2 · Armazón y plantilla Leaflet | Panel + mapa, dos pantallas, controles, capas, simbología, ficha, buscador, con datos ficticios de la CDMX | Pruebas en 1440, 360, 390 y 430 px y en WebKit; axe en 0; CSP sin violaciones |
| 3 · Motor deck.gl | La misma plantilla con deck.gl, formato binario, etiquetas, fondo propio, dedos fantasma | Las mismas pruebas, más etiquetas estables y rendimiento con procesador lento |
| 4 · Datos, servidor y guía | Scripts de datos en Python, servidor de ejemplo, empaquetado; la guía visual se completa (cada componente entra a ella en las fases 2 y 3, al extraerse) | Cadena de datos de ejemplo de punta a punta; paquete que pasa `verificar` |
| 5 · Skill y piloto | Repositorio en GitHub, skill `geovisor-sia`, un proyecto migrado como piloto | El piloto pasa sus pruebas sin perder nada |

Las fases 2 y 3 se extraen de código que ya funciona (Guardianes y priorización para deck.gl; categorías y plantación para Leaflet), no se escriben de nuevo.

## Decisiones (sección 17 de los aprendizajes)

Tomadas por la Secretaría el 14 oct 2026; ver «Decisiones tomadas» en `00-aprendizajes.md`. **Fase 0 cerrada.** Sigue la fase 1.
