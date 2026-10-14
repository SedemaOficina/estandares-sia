# 02 · Guía de estilo

Qué se ve y por qué. Todo valor de este documento vive en `codigo/css/tokens.css`; aquí sólo se explica el trabajo de cada uno. La versión interactiva, con muestras vivas, es `guia-visual/index.html`.

## 1. Paleta: un color, un trabajo

| Token | Valor | Trabajo |
|---|---|---|
| `--guinda` | #9D2148 | Identidad: títulos de página y de paso, encabezados de tabla, acción principal, filete de la cabecera. |
| `--guinda-osc` | #7A1A38 | Acción principal al pasar el cursor. |
| `--guinda-cl` | #F7F1F3 | Fondo suave: filas alternas de tabla, panel de resultado. |
| `--dorado` | #B28E5C | Filete institucional y detalles de trazo. **Nunca como texto sobre blanco** (3.1:1). |
| `--dorado-txt` | #8C6C3E | Dorado como texto: variante oscurecida que cumple 4.5:1. |
| `--texto` | #2B2D2E | Cuerpo y respuesta de la persona. |
| `--gris` | #55585A | Texto secundario: rótulos, pies, notas, marca de obligatorio. |
| `--gris-cl` | #6B6E70 | Ayuda de campo, contador, texto del select vacío. |
| `--linea` | #DCDEE0 | Separadores y bordes de tarjeta. |
| `--borde` | #878B8E | Borde de control y de botón secundario (3:1 sobre blanco). |
| `--fondo` | #F4F5F6 | Fondo de página. |
| `--blanco` | #FFFFFF | Tarjetas y controles. |
| `--beige` | #FFFEF8 | Pie institucional. |
| `--aviso-bg` | #F7F8F9 | Aviso neutro, control deshabilitado. |
| `--azul` | #1A56A8 | Enlaces, casilla marcada, «Atrás», estado seleccionado. |
| `--azul-cl` | #EEF3FA | Fondo de lo seleccionado (tarjeta, chip, opción de combo). |
| `--foco` | #1A73C7 | Anillo de foco de todo elemento interactivo. |
| `--error` | #B3261E | Error bloqueante: borde, mensaje, resumen, botón de peligro. |
| `--pend` | #8A5200 | Advertencia y «Pendiente»: ámbar, siempre con icono y texto. |
| `--ok` | #1B6B43 | Éxito y «guardado». |

Decisiones de color tomadas en la fase 0: el asterisco de obligatorio es **guinda** (C2, revisada por la Secretaría el 14 oct 2026; antes gris), siempre con la leyenda y con «(obligatorio)» para lectores de pantalla; el estado seleccionado se marca con fondo azul claro, sombra interior y palomita (C3); la advertencia y lo pendiente comparten el ámbar porque son la misma idea: atención sin bloqueo.

## 2. Contraste medido sobre cada fondo real

Cada par de la tabla es un uso real del estándar: el texto sobre el fondo donde de verdad aparece. Mínimos: 4.5:1 para texto normal; 3:1 para texto grande, bordes de control, foco e iconos informativos; «informativo» para lo decorativo o prohibido como texto. La tabla se genera con `herramientas/contraste.mjs --md` y se verifica en cada corrida de `npm run verificar`; la guía visual la recalcula en el navegador con los valores de la hoja cargada.

<!-- contraste:inicio -->
| Id | Primer plano | Fondo | Razón | Mínimo | Resultado | Dónde |
|---|---|---|---|---|---|---|
| C01 | `--texto` #2B2D2E | `--blanco` #FFFFFF | 13.84:1 | 4.5:1 | cumple | Cuerpo y respuesta de la persona sobre tarjeta |
| C02 | `--texto` #2B2D2E | `--fondo` #F4F5F6 | 12.68:1 | 4.5:1 | cumple | Cuerpo sobre la página |
| C03 | `--texto` #2B2D2E | `--beige` #FFFEF8 | 13.70:1 | 4.5:1 | cumple | Pie institucional |
| C04 | `--texto` #2B2D2E | `--aviso-bg` #F7F8F9 | 13.01:1 | 4.5:1 | cumple | Aviso neutro |
| C05 | `--gris` #55585A | `--blanco` #FFFFFF | 7.17:1 | 4.5:1 | cumple | Texto secundario |
| C06 | `--gris` #55585A | `--fondo` #F4F5F6 | 6.57:1 | 4.5:1 | cumple | Texto secundario sobre la página |
| C07 | `--gris` #55585A | `--guinda-cl` #F7F1F3 | 6.43:1 | 4.5:1 | cumple | Leyenda de obligatorios |
| C08 | `--gris` #55585A | `--beige` #FFFEF8 | 7.09:1 | 4.5:1 | cumple | Pie institucional |
| C09 | `--gris-cl` #6B6E70 | `--blanco` #FFFFFF | 5.14:1 | 4.5:1 | cumple | Ayuda de campo, contador |
| C10 | `--gris-cl` #6B6E70 | `--fondo` #F4F5F6 | 4.70:1 | 4.5:1 | cumple | Paso pendiente de la barra |
| C11 | `--gris-cl` #6B6E70 | `--aviso-bg` #F7F8F9 | 4.83:1 | 4.5:1 | cumple | Ayuda dentro de un aviso |
| C12 | `--gris-cl` #6B6E70 | `--azul-cl` #EEF3FA | 4.61:1 | 4.5:1 | cumple | Detalle de una opción señalada |
| C13 | `--guinda` #9D2148 | `--blanco` #FFFFFF | 7.65:1 | 4.5:1 | cumple | Título de paso sobre tarjeta |
| C14 | `--guinda` #9D2148 | `--beige` #FFFEF8 | 7.57:1 | 4.5:1 | cumple | Título de página en el encabezado |
| C15 | `--guinda` #9D2148 | `--guinda-cl` #F7F1F3 | 6.86:1 | 4.5:1 | cumple | Número de la secuencia |
| C16 | `--guinda` #9D2148 | `--blanco` #FFFFFF | 7.65:1 | 4.5:1 | cumple | Folio del acuse |
| C17 | `--blanco` #FFFFFF | `--guinda` #9D2148 | 7.65:1 | 4.5:1 | cumple | Botón de acción principal |
| C18 | `--blanco` #FFFFFF | `--guinda-osc` #7A1A38 | 10.33:1 | 4.5:1 | cumple | Botón principal con el cursor encima |
| C19 | `--azul` #1A56A8 | `--blanco` #FFFFFF | 7.14:1 | 4.5:1 | cumple | Lo tocable: enlace, nombre de opción |
| C20 | `--azul` #1A56A8 | `--azul-cl` #EEF3FA | 6.41:1 | 4.5:1 | cumple | Lo elegido |
| C21 | `--azul` #1A56A8 | `--fondo` #F4F5F6 | 6.54:1 | 4.5:1 | cumple | Enlace sobre la página |
| C22 | `--error` #B3261E | `--blanco` #FFFFFF | 6.54:1 | 4.5:1 | cumple | Mensaje de error del campo |
| C23 | `--error` #B3261E | `--error-bg` #FDF3F2 | 6.00:1 | 4.5:1 | cumple | Título del resumen de errores |
| C24 | `--error-txt` #8C1D18 | `--error-bg` #FDF3F2 | 8.37:1 | 4.5:1 | cumple | Cuerpo del resumen y del aviso de bloqueo |
| C25 | `--pend-txt` #6B4A00 | `--pend-bg` #FFF3CD | 7.28:1 | 4.5:1 | cumple | Marcador de pendiente |
| C26 | `--ok` #1B6B43 | `--fondo` #F4F5F6 | 5.95:1 | 4.5:1 | cumple | «Borrador guardado» sobre la página |
| C27 | `--ok-txt` #145032 | `--ok-bg` #F1F8F4 | 8.76:1 | 4.5:1 | cumple | Aviso de confirmación |
| C28 | `--blanco` #FFFFFF | `--texto` #2B2D2E | 13.84:1 | 4.5:1 | cumple | Número del paso actual |
| C29 | `--gris` #55585A | `--carga-bg` #FCFCFD | 6.99:1 | 4.5:1 | cumple | Límite de la zona de carga |
| C30 | `--azul` #1A56A8 | `--carga-bg` #FCFCFD | 6.97:1 | 4.5:1 | cumple | Texto de la zona de carga |
| N01 | `--borde` #878B8E | `--blanco` #FFFFFF | 3.43:1 | 3:1 | cumple | Borde de un control sobre tarjeta |
| N02 | `--borde` #878B8E | `--fondo` #F4F5F6 | 3.15:1 | 3:1 | cumple | Borde de un control sobre la página |
| N12 | `--borde` #878B8E | `--carga-bg` #FCFCFD | 3.35:1 | 3:1 | cumple | Borde discontinuo de la zona de carga |
| N13 | `--borde` #878B8E | `--aviso-bg` #F7F8F9 | 3.23:1 | 3:1 | cumple | Borde de un control dentro de un aviso |
| N03 | `--foco` #1A73C7 | `--blanco` #FFFFFF | 4.86:1 | 3:1 | cumple | Anillo de foco sobre tarjeta |
| N04 | `--foco` #1A73C7 | `--fondo` #F4F5F6 | 4.45:1 | 3:1 | cumple | Anillo de foco sobre la página |
| N05 | `--foco` #1A73C7 | `--beige` #FFFEF8 | 4.81:1 | 3:1 | cumple | Anillo de foco en encabezado y pie |
| N06 | `--foco` #1A73C7 | `--azul-cl` #EEF3FA | 4.36:1 | 3:1 | cumple | Anillo de foco sobre una opción o casilla elegida |
| N07 | `--azul` #1A56A8 | `--blanco` #FFFFFF | 7.14:1 | 3:1 | cumple | Borde de la opción elegida |
| N08 | `--error` #B3261E | `--error-bg` #FDF3F2 | 6.00:1 | 3:1 | cumple | Borde de un campo con error |
| N09 | `--ok` #1B6B43 | `--blanco` #FFFFFF | 6.50:1 | 3:1 | cumple | Marca de recepción (círculo verde sobre tarjeta) |
| N10 | `--gris-cl` #6B6E70 | `--blanco` #FFFFFF | 5.14:1 | 3:1 | cumple | Borde de la bolita de un paso hecho |
| N11 | `--gris` #55585A | `--blanco` #FFFFFF | 7.17:1 | 3:1 | cumple | Flecha del select y del plegable |
| I01 | `--dorado` #B28E5C | `--blanco` #FFFFFF | 3.04:1 | — | informativo | Filete dorado: decorativo, nunca texto |
| I02 | `--linea` #DCDEE0 | `--blanco` #FFFFFF | 1.35:1 | — | informativo | Línea separadora: separa y nunca delimita un control |
| C31 | `--dorado-txt` #8C6C3E | `--blanco` #FFFFFF | 4.85:1 | 4.5:1 | cumple | Dorado legible como texto (detalle en acuse, rótulos dorados) |
| C32 | `--texto` #2B2D2E | `--solo-lectura-bg` #F9FAFB | 13.24:1 | 4.5:1 | cumple | Campo de solo lectura |
| C33 | `--gris-cl` #6B6E70 | `--aviso-bg` #F7F8F9 | 4.83:1 | 4.5:1 | cumple | Texto de un campo deshabilitado |
| C34 | `--pend-txt` #6B4A00 | `--pend-bg` #FFF3CD | 7.28:1 | 4.5:1 | cumple | Aviso de advertencia y entorno de pruebas |
| C35 | `--blanco` #FFFFFF | `--azul` #1A56A8 | 7.14:1 | 4.5:1 | cumple | Número de la escala elegida |
| C36 | `--blanco` #FFFFFF | `--texto` #2B2D2E | 13.84:1 | 4.5:1 | cumple | Texto del tooltip |
| C37 | `--azul` #1A56A8 | `--carga-bg` #FCFCFD | 6.97:1 | 4.5:1 | cumple | Texto de la zona de carga |
| N14 | `--borde` #878B8E | `--solo-lectura-bg` #F9FAFB | 3.29:1 | 3:1 | cumple | Borde discontinuo del campo de solo lectura |
| N15 | `--pend` #8A5200 | `--pend-bg` #FFF3CD | 5.77:1 | 3:1 | cumple | Filete del aviso de advertencia y borde del pendiente |
| N16 | `--azul` #1A56A8 | `--blanco` #FFFFFF | 7.14:1 | 3:1 | cumple | Perilla y pista del interruptor activo |
| N17 | `--guinda` #9D2148 | `--mapa-bg` #E8EAEC | 6.34:1 | 3:1 | cumple | Marcador del mapa sobre el fondo sin mosaicos |
| C38 | `--guinda` #9D2148 | `--blanco` #FFFFFF | 7.65:1 | 4.5:1 | cumple | Asterisco de obligatorio (C2 revisada, 14 oct 2026) |
| C39 | `--guinda` #9D2148 | `--guinda-cl` #F7F1F3 | 6.86:1 | 4.5:1 | cumple | Asterisco dentro de la leyenda de obligatorios |
| N18 | `--borde` #878B8E | `--beige` #FFFEF8 | 3.40:1 | 3:1 | cumple | Borde de los enlaces a redes sociales en el pie |
<!-- contraste:fin -->

## 3. Tipografía

| Rol | Familia y peso | Tamaño |
|---|---|---|
| Título de página (`.titulo-pagina`) | Cabin 700 | `--t-2xl` = clamp(24px, 3vw + 12px, 30px) |
| Título de paso (`.titulo-paso`) | Cabin 600 | `--t-xl` = clamp(21px, 2vw + 12px, 24px) |
| Título de bloque (`.titulo-bloque`) | Cabin 600, filete dorado superior | `--t-lg` = clamp(18px, 1.5vw + 12px, 20px) |
| Pregunta (`.etiqueta`) | Roboto 500 | `--t-base` = 16px |
| Respuesta y cuerpo | Roboto 400 | `--t-base` = 16px, interlineado 1.55, ancho máximo 70 caracteres |
| Botones secundarios, celdas | Roboto 500 | `--t-md` = 14px |
| Ayuda, contador, pies (`.ayuda`) | Roboto 400 | `--t-sm` = 13px |
| Rótulo (`.rotulo`) | Cabin 600, mayúsculas, tracking .06em | `--t-xs` = 12px |

Los tamaños grandes son fluidos: crecen con el ancho de la pantalla entre un mínimo legible en teléfono y un máximo en escritorio. El cuerpo y los controles **nunca bajan de 16 px**: por debajo, iOS hace zoom al enfocar un campo. Las dos familias viajan en `codigo/fuentes/` con su licencia (OFL) y sólo en los pesos declarados (C12): Cabin 600 y 700; Roboto 400, 500 y 700.

## 4. Los seis niveles de jerarquía

1. **Título de página**: uno por formulario, en la cabecera, junto al logotipo.
2. **Título de paso**: uno por paso o por formulario de una página; recibe el foco al cambiar de paso.
3. **Título de bloque**: agrupa preguntas afines dentro de un paso; lleva el filete dorado.
4. **Pregunta**: la etiqueta del campo (`label` o `legend`); con asterisco guinda si es obligatoria.
5. **Texto y ayuda**: el cuerpo, la ayuda del campo (antes del control) y el mensaje de error (después).
6. **Rótulo**: etiquetas de datos en la revisión y el acuse, pies de tabla y de figura.

Entre niveles cambia el tamaño o el peso, nunca sólo el color. No se inventan niveles intermedios: si un contenido no cabe en estos seis, el problema es de estructura.

## 5. Espaciado, radios, trazos y tamaños

| Token | Valor | Uso |
|---|---|---|
| `--e-1` … `--e-9` | 4, 8, 12, 16, 20, 24, 32, 40, 48 px | Escala de espaciado base 4. |
| `--e-4` | 16 px | Entre etiqueta, ayuda y control. |
| `--e-6` | 24 px | Entre campos. |
| `--e-seccion` | clamp(16px, 2vw + 8px, 32px) | Relleno de tarjeta y separación entre bloques. |
| `--e-pagina` | clamp(16px, 3vw, 40px) | Margen lateral de la página: 16 px mínimo en teléfono. |
| `--r-ctrl` / `--r-caja` / `--r-pill` | 6 / 10 / 999 px | Controles y botones / tarjetas y diálogos / chips e insignias. |
| `--b-1` | 1 px | Bordes y separadores. El borde de error sube a 2 px. |
| `--foco-ancho` / `--foco-sep` | 3 / 2 px | Anillo de foco y su separación. |
| `--objetivo-min` | 44 px | Tamaño táctil mínimo de todo lo que se toca. |
| `--alto-control` | 48 px | Alto del control de texto y del botón principal. |
| `--alto-opcion` | 40 px | Opción corta Sí/No con ratón; con dedo (`pointer: coarse`) sube a `--alto-control`. |
| `--tam-casilla` | 20 px | Casilla y radio. |
| `--ancho-pagina` | 980 px | Ancho máximo del contenido. |
| `--ancho-lectura` | 70ch | Ancho máximo del texto corrido. |

## 6. Puntos de quiebre: móvil primero

El CSS parte del teléfono y sólo crece. Hay tres puntos de corte, declarados en `tokens.css` y repetidos en la configuración del auditor (CSS no admite variables en `@media`): `--bp-sm` 560 px (hoja inferior → diálogo centrado; chips en fila), `--bp-md` 760 px (campos a dos columnas con subcuadrícula; tabla real; botones en fila con la acción principal a la derecha), `--bp-lg` 1024 px (navegación lateral en la guía; tres columnas donde las hay). Sólo `min-width`: el auditor rechaza `max-width`.

## 7. Estados

| Estado | Cómo se ve | Cómo se declara |
|---|---|---|
| Foco | Anillo azul de 3 px separado 2 px, sobre cualquier fondo | `:focus-visible` (nunca `outline: none` sin sustituto) |
| Error | Borde rojo de 2 px, mensaje con icono debajo, fondo rosado suave | `aria-invalid="true"` + `aria-describedby` |
| Advertencia | Mensaje ámbar con icono; el control no cambia de borde | `.err[data-nivel="advertencia"]` |
| Solo lectura | Fondo gris muy claro, borde discontinuo; se envía | `readonly` |
| Deshabilitado | Gris, opacidad .45; no se envía; el teclado lo salta | `disabled` (sólo lo que no aplica todavía) |
| Ocupado | Botón con `aria-busy`, texto «Enviando…», icono que gira | `aria-disabled="true" aria-busy="true"` |
| Seleccionado | Fondo azul claro, sombra interior, palomita | `:checked`, `[aria-pressed="true"]`, `[aria-selected="true"]` |
| Oculto | No existe para nadie | `hidden` (sin `!important`; nada lo pisa) |

El estado vive siempre en un atributo; el auditor rechaza clases como `.activo` o `.invalido` (A10).

## 8. Iconografía

Un solo sprite SVG (`codigo/iconos/sprite.svg`, 29 símbolos) que `formkit.core.js` inyecta una vez por página. Los iconos heredan el color del texto (`currentColor`), miden `--icono` (20 px) o `--icono-sm` (16 px). El decorativo lleva `aria-hidden="true"`; el que comunica algo va siempre junto a texto; sólo «cerrar», «buscar» y los enlaces a redes sociales pueden ir solos, con `aria-label` y 44 px de objetivo. Catálogo: alerta, error, ok, info, ayuda, cerrar, palomita, flecha-izq, flecha-der, abajo, descarga, copiar, compartir, eliminar, editar, ubicacion, fecha, adjunto, camara, buscar, mas, cargando, reloj, externo. Marcas de redes sociales (rellenas, como las publica cada red; sólo en el bloque de redes del pie): facebook, x, instagram, tiktok, youtube.

## 9. Lo que la guía visual muestra y este documento no

Las muestras vivas de cada estado, el probador de validaciones, los pares «sí y no» y los cuatro formularios de ejemplo a 320, 390, 768 y 1280 px o lado a lado están en `guia-visual/index.html` (y en `guia-visual/artefacto.html`, autocontenido). Si una decisión visual no está en este documento ni en la guía, no es parte del estándar.
