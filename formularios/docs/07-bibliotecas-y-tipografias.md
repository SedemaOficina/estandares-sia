# 07 · Bibliotecas y tipografías

Todo lo que el estándar usa y no escribió. Regla: **todo autoalojado** (FRM-77), cada pieza con versión exacta, licencia y suma de verificación (FRM-79), y nada de lo que sólo sirve para verificar viaja al sitio (FRM-80).

## 1. Bibliotecas del paquete (`vendor/`)

| Paquete | Versión | Licencia | Para qué | Viaja al sitio |
|---|---|---|---|---|
| Leaflet | 1.9.4 | BSD-2-Clause | Mapa del módulo `mapa` (sólo si el formulario pide un punto). | Sólo con el módulo `mapa` |
| leaflet-gesture-handling | 1.2.2 | MIT | Un dedo desplaza la página, dos el mapa; Ctrl + rueda acerca. | Sólo con el módulo `mapa` |
| axe-core | 4.13.0 | MPL-2.0 | Auditoría de accesibilidad en las pruebas. | **No** (sólo verificación) |

`vendor/MANIFIESTO.json` registra cada archivo con su SHA-256; `node herramientas/vendor.mjs --verificar` comprueba que lo que hay en disco es lo registrado, y `node herramientas/vendor.mjs` lo vuelve a descargar del registro de npm. Las licencias completas están junto a cada biblioteca (`vendor/<paquete>/LICENSE`). Al actualizar una versión: se actualiza `herramientas/vendor.json`, se corre `vendor.mjs`, se revisa el CHANGELOG del paquete y se vuelven a correr las pruebas.

El mapa base (teselas) **no es una biblioteca sino un servicio de datos**: se declara en `FORMKIT_CONFIG.mapa` (proveedor, URL, atribución, clave) y es la única petición externa admitida. Vacío por omisión: sin teselas el punto sigue pudiendo colocarse y el mapa muestra fondo neutro. Antes de elegir proveedor hay que revisar su licencia y sus condiciones de uso institucional; la atribución se muestra en el mapa.

## 2. Tipografías (`codigo/fuentes/`)

| Familia | Pesos incluidos | Uso | Licencia | Autoría |
|---|---|---|---|---|
| Cabin | 600, 700 | Títulos, encabezados, rótulos, botón principal | SIL Open Font License 1.1 (`Cabin-OFL.txt`) | The Cabin Project Authors (Pablo Impallari) |
| Roboto | 400, 500, 700 | Cuerpo, controles, botones secundarios, ayuda | SIL Open Font License 1.1 (`Roboto-OFL.txt`) | The Roboto Project Authors (Google) |

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

`package.json` declara sólo `devDependencies`: `@playwright/test` 1.63.0 (abre Chromium para las pruebas) y `axe-core` 4.13.0 (también copiado a `vendor/` para servirlo en las pruebas sin red). Node 22 o superior (`node:test`). En este entorno el navegador se tomó de `/opt/pw-browsers`; `pruebas/ayudas.mjs` acepta la variable `NAVEGADOR_EJECUTABLE` para otro.
