# 07 · Bibliotecas y tipografías

Todo lo que el estándar usa y no escribió. Regla: **todo autoalojado** (FRM-77), cada pieza con versión exacta, licencia y suma de verificación (FRM-79), y nada de lo que sólo sirve para verificar viaja al sitio (FRM-80).

## 1. Bibliotecas del paquete (`vendor/`)

| Paquete | Versión | Licencia | Para qué | Viaja al sitio |
|---|---|---|---|---|
| Leaflet | 1.9.4 | BSD-2-Clause | Mapa del módulo `mapa` (sólo si el formulario pide un punto). | Sólo con el módulo `mapa` |
| leaflet-gesture-handling | 1.2.2 | MIT | Un dedo desplaza la página, dos el mapa; Ctrl + rueda acerca. | Sólo con el módulo `mapa`, que lo carga si Leaflet cargó (su dirección en `FORMKIT_CONFIG.mapa.gestos`); no lleva `<script>` en la página |
| pdfjs-dist | 4.10.38 | Apache-2.0 | Visor de documentos (módulo `visor`); se carga al abrir el primer PDF, con `isEvalSupported: false`. | Sólo con el módulo `visor` |
| axe-core | 4.13.0 | MPL-2.0 | Auditoría de accesibilidad en las pruebas. | **No** (sólo verificación) |

`vendor/MANIFIESTO.json` registra cada archivo con su SHA-256; `node herramientas/vendor.mjs --verificar` comprueba que lo que hay en disco es lo registrado, y `node herramientas/vendor.mjs` lo vuelve a descargar del registro de npm. Las licencias completas están junto a cada biblioteca (`vendor/<paquete>/LICENSE`). Al actualizar una versión: se actualiza `herramientas/vendor.json`, se corre `vendor.mjs`, se revisa el CHANGELOG del paquete y se vuelven a correr las pruebas.

El mapa base (teselas) **no es una biblioteca sino un servicio de datos**: se declara en `FORMKIT_CONFIG.mapa` con `teselas` (la dirección del proveedor, con `{z}/{x}/{y}` y, si la pide, su clave dentro de la dirección) y `atribucion` (el crédito que se muestra en el mapa); `centro` y `zoom` fijan el encuadre inicial (`docs/05`, sección 5). Es la única petición externa admitida. Vacío por omisión: sin teselas el punto sigue pudiendo colocarse y el mapa muestra fondo neutro. Antes de elegir proveedor hay que revisar su licencia y sus condiciones de uso institucional; la atribución se muestra en el mapa.

## 2. Tipografías (`codigo/fuentes/`)

| Familia | Pesos incluidos | Uso | Licencia | Autoría |
|---|---|---|---|---|
| Cabin | 600, 700 | Títulos, encabezados y botones | SIL Open Font License 1.1 (`Cabin-OFL.txt`) | The Cabin Project Authors (Pablo Impallari) |
| Roboto | 400, 500, 700 | Cuerpo, preguntas, controles, enlaces, ayudas y rótulos | SIL Open Font License 1.1 (`Roboto-OFL.txt`) | The Roboto Project Authors (Google) |

Decisión C12: sólo estos cinco pesos, en subconjunto latino (cubre á é í ó ú ñ ü ¿ ¡), en formato woff2, con `font-display: swap`. Si un formulario necesita cursivas o más pesos, los añade con la misma declaración `@font-face` en `tokens.css` y su archivo en `codigo/fuentes/`; no se enlaza Google Fonts ni ninguna otra fuente externa. La prueba `03-anchos` comprueba en cada ancho que ambas familias cargan; `06-servidor-y-herramientas` que cada archivo citado en `tokens.css` existe y que la licencia acompaña a la carpeta.

**Pendiente de verificación documental:** la procedencia exacta de los archivos woff2 (paquete y versión de origen) debe registrarse en `codigo/fuentes/` con la misma precisión que `vendor/MANIFIESTO.json` [Fuente: __]. Los archivos se heredaron del paquete A, que los declaraba del mismo origen (fontsource, subconjunto latino).

## 3. Lo que no se usa, y por qué

| Se descartó | Motivo |
|---|---|
| Frameworks (React, Vue) y bundlers | El estándar debe copiarse archivo por archivo a proyectos distintos y abrir desde disco. Scripts clásicos sin dependencias. |
| Bibliotecas de componentes (Bootstrap, Material) | Traen su propia paleta, su propia jerarquía y cientos de clases sin uso; el auditor las rechazaría. |
| CDN de cualquier tipo | Petición a un tercero: filtra la IP de la persona, falla con política de red y rompe la página sin aviso. |
| Google Fonts enlazado | Mismo motivo; las fuentes viajan en el paquete. |
| Iconos de terceros (Font Awesome, Material Icons) | Un sprite propio de 30 símbolos (25 de la interfaz y 5 marcas de redes sociales) basta y pesa unos 5 KB. |
| Validadores externos (Yup, Zod) | La validación debe ser la misma en el navegador y en Node con un solo archivo sin dependencias. |
| Captcha de terceros | Excluye a personas y envía datos a un tercero; el estándar usa señales (casilla, trampa, tiempo) y deja el punto de integración para un servicio autoalojado. |

## 4. Entorno de verificación (no viaja al sitio)

`package.json` declara sólo `devDependencies`: `@playwright/test` 1.63.0 (abre Chromium para las pruebas) y `axe-core` 4.13.0 (también copiado a `vendor/` para servirlo en las pruebas sin red). Node 22 o superior (`node:test`). El navegador se toma de `NAVEGADOR_EJECUTABLE`, de `PLAYWRIGHT_BROWSERS_PATH` o del que instala Playwright; `pruebas/ayudas.mjs` acepta la variable `NAVEGADOR_EJECUTABLE` para otro.

## 5. Fallas conocidas y rodeos

Lo que una biblioteca hace mal y el estándar rodea en su propio código. Cada rodeo lleva en el código su clave (`RODEO-01`…) junto al comentario que lo explica, y `node herramientas/rodeos.mjs` (dentro de `npm run verificar`) exige que cada clave del código esté en esta tabla y que cada fila esté en el archivo que cita. **Al actualizar una biblioteca** se revisa su fila: si la versión nueva ya no tiene la falla, se quita el rodeo, su clave y su fila.

<!-- rodeos:inicio -->
| Clave | Biblioteca | Qué falla | Rodeo (dónde) | Cuándo se quita |
|---|---|---|---|---|
| RODEO-01 | Leaflet 1.9.4 | Un mapa creado oculto (en un paso que no se ve) calcula mal su tamaño y su encuadre. | `invalidateSize()` 50 ms después de mostrar el paso y con cada cambio de tamaño de la ventana (`codigo/modulos/mapa/mapa.js`). | Cuando Leaflet vigile su propio tamaño; la prueba del mapa por pasos lo dice. |
| RODEO-02 | Leaflet 1.9.4 | Los botones de acercar y alejar dicen «Zoom in» y «Zoom out» en una página en español. | Control propio con los textos `mapaAcercar` y `mapaAlejar` de los mensajes (`codigo/modulos/mapa/mapa.js`). | Si Leaflet trae textos en español; mientras, se queda. |
| RODEO-03 | Leaflet 1.9.4 | El marcador por omisión pide imágenes (`marker-icon.png`) a una ruta que la página no tiene. | Marcador propio en SVG dentro del código, en guinda (`codigo/modulos/mapa/mapa.js`). | Se queda: el marcador guinda es del estándar. |
| RODEO-04 | leaflet-gesture-handling 1.2.2 | Si el complemento carga después de crear el mapa, la opción `gestureHandling` no hace nada. | Se registra y se activa a mano cuando termina de cargar (`codigo/modulos/mapa/mapa.js`). | Si una versión nueva se activa sola al cargar tarde. |
| RODEO-05 | pdf.js 4.10.38 | En un navegador sin módulos o con la carpeta de pdf.js mal indicada, no carga. | El documento se abre con el visor del navegador y la consola dice dónde se buscó pdf.js (`codigo/modulos/visor/visor.js`). | Se queda como red de seguridad. |
| RODEO-06 | axe-core 4.13.0 | En la guía visual, cuatro reglas (`region`, `landmark-unique`, `duplicate-id-aria`, `duplicate-id`) marcan lo que la guía hace a propósito: muestras repetidas de la misma pieza. | Se apagan sólo para la guía y su artefacto; plantillas y ejemplos se revisan con todas (`pruebas/05-accesibilidad.prueba.mjs`). Los id de la guía se revisan aparte (`pruebas/06-servidor-y-herramientas.prueba.mjs`). | Si la guía deja de repetir muestras. |
| RODEO-07 | Leaflet 1.9.4 | `leaflet.css` trae saltos de línea de Windows (CRLF). | Se guarda tal cual en `vendor/` (su huella depende de sus bytes) y la construcción lo pasa a LF al incrustarlo en el artefacto (`herramientas/construir.mjs`). | Si Leaflet publica el archivo con LF. |
<!-- rodeos:fin -->
