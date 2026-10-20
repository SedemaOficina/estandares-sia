# 08 · Verificación y cierre

Cómo se comprueba que un formulario cumple el estándar, qué comprueba la máquina y qué queda para personas. Ningún bloque de trabajo se cierra sin esta lista.

## 1. Lo que corre solo: `npm run verificar`

| Paso | Herramienta | Qué comprueba | Reglas |
|---|---|---|---|
| 1 | `herramientas/auditor-css.mjs` | A01 un selector una declaración · A02 una propiedad por regla · A03 sin `!important` salvo movimiento reducido · A04 sin colores fuera de `:root` · A05 sin longitudes literales · A06 duraciones e interlineados desde tokens · A07 sin id · A08 máximo dos niveles · A09 sin clases sin uso · A10 sin clases de estado · A11 sólo `min-width` en los tres puntos de corte y sólo lo que cambia · A13 orden de bloques · A14 sin manejadores ni estilos en línea repetidos · A15 variables sólo en tokens (o `--guia-*` en la guía) · A16 sin variables sin uso | FRM-66 a FRM-70 |
| 2 | `herramientas/contraste.mjs` | Los 76 pares de color sobre su fondo real cumplen 4.5:1 (texto) o 3:1 (bordes, foco, iconos) | FRM-29, docs/02 |
| 3 | `herramientas/auditar-campos.mjs` | Todo `data-campo` declara `data-uso`; los personales, `autocomplete` (u `off` con motivo) y `data-sensible` en identidad y contacto; los formatos, su `inputmode`; el «?» no repite la ayuda visible y dos campos seguidos no repiten la misma ayuda | FRM-09, FRM-12, FRM-24, FRM-55 |
| 4 | `herramientas/vendor.mjs --verificar` | Leaflet, gestos, pdf.js y axe-core coinciden byte a byte con `vendor/MANIFIESTO.json` | FRM-79 |
| 5 | `herramientas/generar-reglas.mjs --comprobar` | `docs/01-reglas.md` y la tabla de contraste de `docs/02` están al día con sus fuentes | — |
| 6 | `herramientas/construir.mjs` | Iconos, manifiesto (archivos existentes, dependencias reales), `dist/`, esquemas de las plantillas y `docs/04` se regeneran sin error | FRM-71 |
| 7 | `pruebas/ejecutar.mjs` | Las pruebas siguientes | — |

### Pruebas automatizadas (`pruebas/*.prueba.mjs`, node:test + Playwright + Chromium)

| Archivo | Qué recorre | Perfiles |
|---|---|---|
| `01-por-pasos` | Plantilla por pasos completa: resumen con foco, barra navegable, cascada por CP y de regreso, mapa con confirmación, archivos con rechazo motivado y estado por archivo, contacto condicional, revisión y «Editar», diálogo de privacidad, casillas obligatorias, borrador (guardar, ofrecer, restaurar, sensibles fuera, borrar al enviar), error de envío, límite con «Volver», acuse, payload normalizado con idempotencia y SHA-256, copiar; momento de la validación | móvil 390 táctil y escritorio 1280 |
| `02-una-pagina` | CURP con derivados, confirmación de correo, numérico con máximo, ayuda desplegable, combo con teclado y chips, múltiple con máximo y «Otro», rango con atajos y cruzada, escala, repetibles con confirmación, interruptor, resumen y acuse | ambos |
| `03-anchos` | Las cinco páginas a 320, 360, 390, 768, 1024, 1280 y 1920 px: sin desplazamiento horizontal, consola y red limpias, `[hidden]` oculto, botones con nombre, objetivos ≥ 44 px con puntero táctil, tipografías cargadas; movimiento reducido; nada a terceros | 35 combinaciones |
| `04-modulos` | Cada módulo aislado sobre las muestras de la guía; varios formularios en una página sin escuchas duplicadas; esquema del servidor igual a lo que expone el navegador | escritorio |
| `05-accesibilidad` | axe-core (WCAG 2.0/2.1/2.2 AA + buenas prácticas) en la plantilla por pasos en siete estados, una página, ejemplos, guía y artefacto | ambos |
| `06-servidor-y-herramientas` | `validar.mjs` acepta lo bueno y rechaza lo malo; herramientas en verde; manifiesto; tipografías con licencia; tamaño del logotipo; toda regla FRM citada existe | Node |
| `07-correcciones` | Cada corrección que pidió un proyecto real, una por prueba, sobre `pruebas/paginas/` (correcciones, desenlace, consulta, borrador), las plantillas y la guía | ambos |

Las pruebas miran lo que la persona ve y pulsa (etiquetas, botones, mensajes), no la estructura interna, para que un cambio de implementación no las rompa sin motivo.

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
- [ ] **Catálogos**: alcaldías, colonias y CP tomados de la fuente oficial, con fecha de corte declarada, en lugar de `cdmx-ejemplo.js`.
- [ ] **Sin datos reales en pruebas**: la franja «Entorno de pruebas» visible hasta liberar; datos ficticios inequívocos.
- [ ] **Verificado en móvil y en escritorio** ☐ — casilla obligatoria del cierre de bloque, con nombre y fecha.

## 3. Evidencia

`node herramientas/capturas.mjs` deja 41 capturas en `verificacion/capturas/` (plantillas en reposo y con errores a 320, 390, 768 y 1280 px; recorrido completo en teléfono hasta el acuse; ejemplos; guía). Se regeneran en cada cierre y acompañan al acta.

## 4. Procedimiento de cierre de bloque (siete pasos)

1. `npm run verificar` en verde, con la salida guardada.
2. `node herramientas/capturas.mjs` y revisión visual de las capturas nuevas frente a las anteriores.
3. Lista de la sección 2 recorrida, con lo no comprobado escrito explícitamente.
4. `node herramientas/construir.mjs --todo` para regenerar derivados, artefacto y ZIP. El ZIP se arma con Git desde el último commit (guarda antes los cambios): no entra nada que Git ignore o no tenga guardado, las fechas son las del commit (dos construcciones dan el mismo ZIP), lleva dentro `HUELLAS.sha256` y junto a él su `.sha256`.
5. `CHANGELOG.md` actualizado: qué cambió, qué decisión lo motivó, qué queda pendiente.
6. Casilla «Verificado en móvil y en escritorio» marcada por quien probó.
7. Entrega: carpeta `estandares-sia/formularios/`, ZIP (`../estandar-formularios-vX.Y.Z.zip`) con su `.sha256`, artefacto publicado, resumen de no más de diez líneas que diga qué se comprobó por emulación y qué exige dispositivos reales.

## 5. Lo que esta versión no pudo comprobar

| Qué | Por qué | Cómo cerrarlo |
|---|---|---|
| Lectores de pantalla reales | No hay NVDA, VoiceOver ni TalkBack en el entorno de construcción | Recorrido manual (sección 2) |
| iPhone y Android físicos; red limitada real | Sólo emulación de Chromium (viewport, táctil, `isMobile`) | Probar en dispositivos antes de liberar |
| Firefox y Safari | Sólo Chromium | Revisar `:has()`, `subgrid`, `<dialog>` |
| Mapa con teselas | Ningún proveedor acordado; red del entorno acotada | Configurar `FORMKIT_CONFIG.mapa` y probar |
| Descargas dentro del artefacto publicado | El visor de artefactos bloquea descargas iniciadas por la página | Probar «Descargar» en la guía local o en el sitio |
| Estructura de CURP y RFC, numeración telefónica, catálogo de colonias | Fuentes oficiales no consultadas | Confirmar con RENAPO, el SAT, la autoridad vigente de telecomunicaciones [Fuente: __] y SEPOMEX antes de endurecer las reglas |
| Procedencia exacta de los woff2 | Heredados del paquete A | Registrar paquete y versión de origen en `codigo/fuentes/` |
