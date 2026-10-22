# 08 · Verificación y cierre

Cómo se comprueba que un formulario cumple el estándar, qué comprueba la máquina y qué queda para personas. Ningún bloque de trabajo se cierra sin esta lista.

## 1. Lo que corre solo: `npm run verificar`

| Paso | Herramienta | Qué comprueba | Reglas |
|---|---|---|---|
| 1 | `herramientas/auditor-css.mjs` | A01 un selector una declaración · A02 una propiedad por regla · A03 sin `!important` salvo movimiento reducido · A04 sin colores fuera de `:root` · A05 sin longitudes literales · A06 duraciones e interlineados desde tokens · A07 sin id · A08 máximo dos niveles · A09 sin clases sin uso · A10 sin clases de estado · A11 sólo `min-width` en los tres puntos de corte y sólo lo que cambia · A13 orden de bloques · A14 sin manejadores ni estilos en línea repetidos · A15 variables sólo en tokens (o `--guia-*` en la guía) · A16 sin variables sin uso | FRM-66 a FRM-70 |
| 2 | `herramientas/contraste.mjs` | Todos los pares de color sobre su fondo real cumplen 4.5:1 (texto) o 3:1 (bordes, foco, iconos) | `docs/02`, sección 2 |
| 3 | `herramientas/auditar-campos.mjs` | Todo `data-campo` declara `data-uso`; los personales, `autocomplete` (u `off` con motivo) y `data-sensible` en identidad y contacto; los formatos, su `inputmode`; el «?» no repite la ayuda visible y dos campos seguidos no repiten la misma ayuda; el consentimiento no vuelve del borrador | FRM-09, FRM-12, FRM-24, FRM-55 |
| 4 | `herramientas/vendor.mjs --verificar` y `herramientas/rodeos.mjs` | Leaflet, gestos, pdf.js y axe-core coinciden byte a byte con `vendor/MANIFIESTO.json`; cada rodeo de una biblioteca (`RODEO-01`…) está en la tabla de `docs/07`, sección 5, y en el archivo que cita | FRM-79 |
| 5 | `herramientas/generar-reglas.mjs --comprobar` | `docs/01-reglas.md`, la tabla de contraste de `docs/02` y `guia-visual/pares.js` están al día con sus fuentes | — |
| 6 | `herramientas/construir.mjs --comprobar` | Iconos, manifiesto, `docs/04`, `dist/` (también las plantillas juntas de `dist/plantillas/`), esquemas y artefacto están al día. **No los reescribe**: si alguno se atrasó, falla y dice cuál (se rehace con `node herramientas/construir.mjs --artefacto`). También falla si una carpeta de `codigo/modulos` no está en el manifiesto o lleva un archivo de más | FRM-71 |
| 7 | `herramientas/presupuesto.mjs --sin-tiempos` | Cada plantilla en producción (sus archivos juntos) pesa 300 KB o menos y pide 20 archivos o menos, y funciona igual | FRM-87 |
| 8 | `pruebas/ejecutar.mjs` | Las pruebas siguientes | — |

El resumen dice cuántas pruebas corrieron, cuántas pasaron y cuántas fallaron. `--sin-pruebas` omite los pasos 7 y 8 (necesitan el navegador).

### Pruebas automatizadas (`pruebas/*.prueba.mjs`, node:test + Playwright + Chromium)

| Archivo | Qué recorre | Perfiles |
|---|---|---|
| `01-por-pasos` | Plantilla por pasos completa: resumen con foco, barra navegable, cascada por CP y de regreso, mapa con confirmación, archivos con rechazo motivado y estado por archivo, contacto condicional, revisión y «Editar», diálogo de privacidad, casillas obligatorias, borrador (guardar, ofrecer, restaurar, sensibles fuera, borrar al enviar), error de envío, límite con «Volver», acuse, payload normalizado con idempotencia y SHA-256, copiar; momento de la validación | móvil 390 táctil y escritorio 1280 |
| `02-una-pagina` | CURP con derivados, confirmación de correo, numérico con máximo, ayuda desplegable, combo con teclado y chips, múltiple con máximo y «Otro», rango con atajos y cruzada, escala, repetibles con confirmación (y que viajen las filas que quedaron), interruptor, resumen y acuse | ambos |
| `03-anchos` | Las cinco páginas a 320, 360, 390, 768, 1024, 1280 y 1920 px: sin desplazamiento horizontal, consola y red limpias, `[hidden]` oculto, botones con nombre, objetivos ≥ 44 px con puntero táctil, tipografías cargadas; movimiento reducido; nada a terceros | 35 combinaciones |
| `04-modulos` | Cada módulo aislado sobre las muestras de la guía; varios formularios en una página sin escuchas duplicadas; esquema del servidor igual a lo que expone el navegador | escritorio |
| `05-accesibilidad` | axe-core (WCAG 2.0/2.1/2.2 AA + buenas prácticas) en la plantilla por pasos en siete estados, una página, ejemplos, guía y artefacto; mide sin movimiento y con las animaciones terminadas | ambos |
| `06-servidor-y-herramientas` | `validar.mjs` acepta lo bueno y rechaza lo malo; herramientas en verde; manifiesto; tipografías con licencia; tamaño del logotipo; toda regla FRM citada existe; catálogo completo; ningún id repetido en la guía | Node |
| `07-correcciones` | Cada corrección que pidió un proyecto real, una por prueba, sobre `pruebas/paginas/` (correcciones, desenlace, consulta, borrador), las plantillas y la guía | ambos |
| `08-auditoria` | Cada hallazgo corregido de la auditoría del 19 oct 2026, con su clave; las reglas que no tenían comprobación (FRM-10, 35, 59 y 76) | ambos |

Las pruebas miran lo que la persona ve y pulsa (etiquetas, botones, mensajes), no la estructura interna, para que un cambio de implementación no las rompa sin motivo.

### Cuándo corre cada cosa

| Cuándo | Qué | Cómo |
|---|---|---|
| Antes de cada commit | La verificación de la carpeta común y, si cambió algo de `formularios/`, la de formularios con sus pruebas | Gancho de Git `.githooks/pre-commit`; se activa una vez por copia con `npm run gancho` en la carpeta común |
| Con cada subida a GitHub | Las mismas dos verificaciones, en una máquina limpia | `.github/workflows/verificar.yml` |
| En cada versión | Tiempos con red lenta: cada plantilla lista en 5 s o menos con 4G lenta y en 12 s o menos con 3G, con el procesador cuatro veces más lento (mediana de tres corridas) | `npm run presupuesto` |
| En cada versión | Mutaciones: se rompe a propósito, una por una, cada corrección protegida y la prueba que la protege debe fallar | `npm run mutaciones` |

### El formulario de un proyecto

`npm run verificar` comprueba las páginas del paquete. El formulario de un proyecto que copió el estándar se comprueba, desde esta carpeta (con `npm install` hecho), con:

```
node herramientas/comprobar-formulario.mjs <ruta/a/mi-formulario.html> [--raiz carpeta] [--permitir servidor.de.teselas]
```

Revisa consola, peticiones fallidas o a otros servidores, desplazamiento a 320, 390, 768 y 1280 px, axe-core en teléfono y escritorio, objetivos de 44 px, guiones o estilos escritos en el HTML (la política de seguridad estricta los bloquea), que enviar vacío muestre el resumen con el foco, los catálogos que carga (filas completas; si es de ejemplo, lo dice) y `auditar-campos`. `--raiz` es la carpeta que se sirve, si la página pide archivos de una carpeta de arriba.

**En producción**, las hojas y los guiones del estándar que carga la página van juntos en un archivo de cada uno, sin comentarios: `node herramientas/juntar.mjs <mi-formulario.html> <carpeta-de-salida>` escribe `formkit.css` y `formkit.js` y dice qué etiquetas poner en su lugar (la configuración propia, Leaflet y el catálogo se quedan como están). Así la plantilla por pasos pasa de 43 archivos a 15 y cabe en el presupuesto (FRM-87). Las plantillas del paquete ya están juntas en `dist/plantillas/`.

## 2. Lo que queda para personas (no automatizable aquí)

Marcar cada punto con fecha, quién y resultado antes de liberar un formulario construido con el estándar.

- [ ] **Teclado**: recorrido completo sólo con Tab, flechas, Enter, espacio y Escape; el foco siempre visible; nada atrapa el foco; los diálogos lo devuelven.
- [ ] **Lector de pantalla real**: NVDA + Firefox o Chrome en Windows; VoiceOver en iOS; TalkBack en Android. Se oyen etiquetas, obligatoriedad, ayuda, errores, pasos, anuncios de borrador y acuse.
- [ ] **iPhone y Android reales**, con red limitada (3G simulado): teclados correctos, cámara, mapa con dos dedos, hoja inferior, sin zoom bloqueado, sin desplazamiento horizontal a 320 px ni con zoom al 400 %.
- [ ] **Firefox y Safari**: `:has()`, `subgrid`, `<dialog>`, `inputmode`, `capture`.
- [ ] **Alto contraste forzado** (Windows): bordes, foco y estados se conservan.
- [ ] **Impresión** del acuse.
- [ ] **Contenido**: cada etiqueta dice qué se pide con ejemplo; ningún plazo ni correo automático prometido que el sistema no cumpla; registro institucional; sin siglas sin explicar.
- [ ] **Datos personales**: inventario (`instancia.inventario()`) revisado con el área responsable; aviso de privacidad con sus fundamentos verificados o en hueco `[Art. __, fracc. __]`.
- [ ] **Servidor**: `validar.mjs` integrado con el esquema regenerado del HTML **final**; firma de archivos; límite por origen; idempotencia; bitácora de cambios de estado.
- [ ] **Mapa** (si lo hay): proveedor de teselas con licencia revisada y atribución visible; ámbito acotado; cruce en el servidor.
- [ ] **Catálogos**: alcaldías, colonias y CP tomados de la fuente oficial, con fecha de corte declarada, en lugar de `cdmx-ejemplo.js` (mientras diga `es_ficticio: true`, una página sin la franja de pruebas lo avisa en la consola).
- [ ] **Sin datos reales en pruebas**: la franja «Entorno de pruebas» visible hasta liberar; datos ficticios inequívocos.
- [ ] **Producción**: los archivos del estándar juntos (`juntar.mjs`) y el formulario comprobado con `comprobar-formulario.mjs` en su ruta final.
- [ ] **Verificado en móvil y en escritorio** ☐ — casilla obligatoria del cierre de bloque, con nombre y fecha.

## 3. Evidencia

`node herramientas/capturas.mjs` deja 41 capturas en `verificacion/capturas/` (plantillas en reposo y con errores a 320, 390, 768 y 1280 px; recorrido completo en teléfono hasta el acuse; ejemplos; guía). Se regeneran en cada cierre y acompañan al acta.

## 4. Procedimiento de cierre de bloque (siete pasos)

1. `node herramientas/construir.mjs --artefacto` para rehacer lo derivado y `npm run verificar` en verde, con la salida guardada; en una versión, también `npm run presupuesto` y `npm run mutaciones`.
2. `node herramientas/capturas.mjs` y revisión visual de las capturas nuevas frente a las anteriores.
3. Lista de la sección 2 recorrida, con lo no comprobado escrito explícitamente.
4. `node herramientas/construir.mjs --zip` para armar el ZIP. Se arma con Git desde el último commit (guarda antes los cambios): no entra nada que Git ignore o no tenga guardado, las fechas son las del commit (dos construcciones dan el mismo ZIP), lleva dentro `HUELLAS.sha256` y junto a él su `.sha256`.
5. `CHANGELOG.md` actualizado: qué cambió, qué decisión lo motivó, qué queda pendiente.
6. Casilla «Verificado en móvil y en escritorio» marcada por quien probó.
7. Entrega: carpeta `estandares-sia/formularios/`, ZIP (`../estandar-formularios-vX.Y.Z.zip`) con su `.sha256`, artefacto publicado, resumen de no más de diez líneas que diga qué se comprobó por emulación y qué exige dispositivos reales.

## 5. Lo que esta versión no pudo comprobar

| Qué | Por qué | Cómo cerrarlo |
|---|---|---|
| Lectores de pantalla reales | No hay NVDA, VoiceOver ni TalkBack en el entorno de construcción | Recorrido manual (sección 2) |
| iPhone y Android físicos; red limitada real | Sólo emulación de Chromium (viewport, táctil, `isMobile`, red y procesador lentos simulados) | Probar en dispositivos antes de liberar |
| Firefox y Safari | Sólo Chromium | Revisar `:has()`, `subgrid`, `<dialog>` |
| Mapa con teselas | Ningún proveedor acordado; red del entorno acotada | Configurar `FORMKIT_CONFIG.mapa` y probar |
| Descargas dentro del artefacto publicado | El visor de artefactos bloquea descargas iniciadas por la página | Probar «Descargar» en la guía local o en el sitio |
| Estructura de CURP y RFC, numeración telefónica, catálogo de colonias | Fuentes oficiales no consultadas | Confirmar con RENAPO, el SAT, la autoridad vigente de telecomunicaciones [Fuente: __] y SEPOMEX antes de endurecer las reglas |
| Procedencia exacta de los woff2 | Heredados del paquete A | Registrar paquete y versión de origen en `codigo/fuentes/` |
| Velocidad con el servidor real del SIA | El presupuesto se mide con un servidor local que comprime; el del SIA puede servir con HTTP/2 o sin compresión | Medir el formulario publicado con la red limitada de las herramientas del navegador |
