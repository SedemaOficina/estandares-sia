# Estándar de formularios web del SIA · versión 1.6.0

Paquete genérico de estilos, componentes, validaciones y reglas para construir formularios web del Sistema de Información Ambiental de la Secretaría del Medio Ambiente de la Ciudad de México. Es un **manual para quien programa**: se copia lo que el formulario necesita, se declara cada campo con atributos y se verifica con las herramientas incluidas. Funciona en teléfono y en escritorio, sin dependencias y sin pedir nada a terceros.

## Empezar en diez minutos

1. Abre **`guia-visual/index.html`** en el navegador (desde disco funciona). La primera sección es un árbol de decisión: marca lo que tu formulario pide y copia las etiquetas `<link>` y `<script>` que te da, en ese orden.
2. Copia la carpeta `codigo/` a tu proyecto (o sólo `codigo/css/`, `codigo/js/`, `codigo/fuentes/`, `codigo/iconos/`, `codigo/imagenes/` y las carpetas de `codigo/modulos/` que te indicó el árbol). El visor necesita `vendor/pdfjs-dist/` y el mapa `vendor/leaflet*`, junto a la carpeta que contiene `modulos/`.
3. Copia la plantilla más parecida: `codigo/plantillas/por-pasos.html` (varias pantallas) o `una-pagina.html` (una sola), con su `configuracion-*.js`. Sustituye el contenido; cada pregunta es una envoltura `data-campo` con `data-formato`, `required`, `data-uso` y, si es dato personal, `data-finalidad` y `data-sensible`.
4. En tu archivo de configuración (las plantillas traen `configuracion-por-pasos.js` y `configuracion-una-pagina.js`) declara cómo se envía (`FORMKIT_OPCIONES.enviar`), los catálogos reales (`FORMKIT_CATALOGOS`) y, si hay mapa, su proveedor (`FORMKIT_CONFIG.mapa`).
5. Genera el esquema para tu servidor y valida ahí con las mismas reglas:
   ```sh
   node herramientas/esquema-desde-html.mjs tu-formulario.html esquema.json
   node codigo/servidor/validar.mjs esquema.json payload.json
   ```
6. Antes de liberar: `npm install && npm run verificar`, y la lista de `docs/08-verificacion-y-cierre.md`.

Si prefieres no elegir módulos, `dist/formkit.css` y `dist/formkit.js` traen todo en un archivo cada uno.

## Qué hay en el paquete

| Carpeta | Qué contiene |
|---|---|
| `codigo/` | Núcleo (tokens, base, núcleo, validaciones, iconos, core), 30 módulos, tipografías, plantillas, catálogo de ejemplo, validador para el servidor, `manifiesto.json` |
| `guia-visual/` | Guía interactiva: árbol de decisión, fundamentos, fichas vivas con HTML para copiar, probador de validaciones, pares «sí y no», cuatro formularios de ejemplo a distintos anchos. `artefacto.html` es la misma guía autocontenida |
| `docs/` | 01 reglas (86, generado) · 02 guía de estilo · 03 guía de decisión · 04 catálogo de componentes (generado) · 05 validaciones · 06 código y contrato HTML · 07 bibliotecas y tipografías · 08 verificación y cierre · 09 trazabilidad y decisiones |
| `reglas/reglas.json` | Fuente única de las reglas FRM-01 a FRM-86 con nivel BASE / RECOMENDADO / OPCIONAL |
| `herramientas/` | Construcción, auditor de CSS, contraste, auditoría de campos, esquema desde HTML, generador de reglas, bibliotecas, verificación, capturas |
| `pruebas/` | Pruebas automatizadas en Chromium: dos perfiles (teléfono táctil y escritorio), siete anchos, módulos, axe-core, servidor y una prueba por cada corrección pedida por un proyecto (`07-correcciones`) |
| `vendor/` | Leaflet 1.9.4, leaflet-gesture-handling 1.2.2, pdf.js 4.10.38, axe-core 4.13.0, con sumas |
| `verificacion/capturas/` | 41 capturas de evidencia |
| `dist/` | Todo en uno (generado) |

## Niveles de exigencia

- **BASE**: va en todo formulario (núcleo, campos, validación, botones, avisos, envío, móvil y escritorio).
- **RECOMENDADO**: se cumple salvo justificación escrita (pasos, revisión, acuse, resultado, «Otro», combo, fecha con «Hoy», confirmaciones, archivos, borrador, copiar).
- **OPCIONAL**: se usa si el formulario necesita la pieza (CURP, repetibles, toggle, escala, cascadas, mapa, tabla, paginación, chips, etiquetas de estado, visor…).

Quien programa elige los módulos; el nivel dice cuánto hay que justificar para no usarlos.

## Reglas que no se negocian

Cero valores fijos en el código (todo en configuración) · sin CDN ni recursos externos · sin manejadores en línea · sin `!important` salvo movimiento reducido · un selector, una declaración · ningún color fuera de `tokens.css` · móvil primero (`min-width` únicamente) · 44 px de objetivo táctil · el navegador ayuda y el servidor defiende con las mismas reglas · no se pide un dato sin uso declarado · lo pendiente se ve · ninguna cita normativa sin verificar (se deja `[Art. __, fracc. __]`) · datos de ejemplo siempre ficticios · nada se libera sin «Verificado en móvil y en escritorio».

## Verificar

```sh
npm install                 # sólo herramientas de verificación (Playwright, axe-core); el estándar no tiene dependencias
npm run verificar           # auditor, contraste, campos, bibliotecas, documentos, construcción y pruebas en navegador
npm run probar              # sólo las pruebas
npm run auditar             # sólo el auditor de CSS
npm run construir           # regenera iconos, manifiesto, dist, esquemas y docs/04
npm run artefacto           # además la guía autocontenida
npm run zip                 # el paquete en ../estandar-formularios-vX.Y.Z.zip, con su .sha256: sólo lo guardado en Git (guarda antes los cambios)
npm run capturas            # evidencia visual en verificacion/capturas/
```

Lo que la máquina no puede comprobar (teclado y lector de pantalla reales, iPhone y Android físicos, Firefox y Safari, mapa con teselas, fuentes normativas) está en `docs/08`, sección 2.

## Qué no incluye

Servidor de recepción, almacén de archivos, autenticación, prueba de humanidad remota, geocodificación y cruce de capas: cada proyecto los integra en los puntos previstos. El catálogo de alcaldías y colonias que viaja es **ficticio**; se sustituye por el oficial (`codigo/catalogos/LEEME.md`).

## Historial

`CHANGELOG.md`. Decisiones y origen de cada pieza: `docs/09-trazabilidad.md`.
