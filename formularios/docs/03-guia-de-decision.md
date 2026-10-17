# 03 · Guía de decisión: qué pieza usar para cada pregunta

Para quien arma un formulario nuevo. Cada fila dice qué pieza del paquete resuelve una necesidad, qué nivel tiene y cuándo **no** usarla. La versión interactiva (marca lo que tu formulario pide y obtén las etiquetas `<link>` y `<script>` para pegar) está en la primera sección de `guia-visual/index.html`.

## 1. Primero: ¿una página o por pasos?

| Si el formulario… | Entonces |
|---|---|
| Cabe en una pantalla sin desplazarse mucho en el teléfono (hasta ~8 preguntas) | **Una página**: copia `codigo/plantillas/una-pagina.html`. |
| Tiene más de una pantalla de preguntas, o pide datos de distinta naturaleza (qué pasa, dónde, quién) | **Por pasos**: copia `codigo/plantillas/por-pasos.html` (módulos pasos, revisión, acuse). |
| Es una encuesta anónima corta | Una página + escala + progreso (ejemplo `guia-visual/ejemplos/encuesta.html`). |
| Es una consulta o captura interna del personal | Pestañas, tabla, paginación, chips, descarga (ejemplo `guia-visual/ejemplos/captura-interna.html`). Mismo estándar, otro catálogo. |

## 2. Por tipo de respuesta

| La persona debe… | Pieza | Nivel | No la uses cuando |
|---|---|---|---|
| Escribir un texto corto (nombre, calle) | Campo de texto del núcleo con `data-formato` | BASE | — |
| Escribir un relato o descripción | Texto largo con `maxlength`, `minlength` y `data-legible` | BASE | Basta una frase corta: usa texto corto. |
| Dar correo, teléfono, CP | Campo con `data-formato` (`correo`, `telefono` o `cp`) y `autocomplete` | BASE | — |
| Dar un número con unidad | `data-formato="numero"` + `.control-grupo` con la unidad; `min`, `max`, `step` | BASE | El número es un código (folio, CP): es texto. |
| Elegir una de 2 a 7 opciones | Radios (`opciones`): **lista por omisión** (`.opciones-lista`: una por renglón, con el círculo visible y su descripción si hace falta). Las tarjetas en rejilla no se usan para una sola respuesta: en escritorio no se ve que hay que elegir una | BASE | Más de 7: combo. Un ajuste inmediato: toggle. |
| Contestar Sí/No u otras dos o tres opciones cortas sin descripción | **Lista en línea** (`.opciones-lista.opciones-en-linea`): una columna por opción desde tableta, una por renglón en teléfono. La variante de botones (`.opciones-cortas`) sigue admitida | BASE | Las opciones llevan descripción: una por renglón. |
| Elegir varias | Casillas (`opciones`) con `data-min-opciones`/`data-max-opciones` | BASE | — |
| Elegir de un catálogo largo (≥ 8) | `combo` (cerrado) · `data-libre` si se admite lo no listado | RECOMENDADO | Menos de 8: radios o select nativo. |
| Elegir de una lista corta sin descripciones | `select` nativo del núcleo con «Elige una opción» | BASE | Las opciones necesitan explicación: lista con descripción. |
| Decir «ninguna de las anteriores» | Opción **Otro** (`otro`): con especificación (`data-otro-de`) o simple | RECOMENDADO | El detalle no se usa: «Otro» simple. |
| Dar alcaldía, colonia y CP | `cascadas` con catálogo versionado; CP propone alcaldía y colonia | OPCIONAL | Sólo se pide la alcaldía: select o combo. |
| Dar una fecha | `type=date` + botón «Hoy» (`fecha`); `data-no-futura` si aplica | RECOMENDADO | — |
| Dar un rango de fechas | `data-rango` + `data-atajos` (`fecha`) | OPCIONAL | — |
| Dar una hora | `type=time` + «Ahora» (`fecha`) | OPCIONAL | — |
| Dar su CURP o RFC | `identificadores`: mayúsculas, 18/13 caracteres, derivados en solo lectura; con nombre y apellidos, las cruzadas `curp-nombre` y `curp-segundo-apellido` (coherencia, no existencia) | OPCIONAL | No hay uso declarado para la CURP: no se pide. |
| Dar su fecha de nacimiento sin CURP | **Bloque listo «Fecha de nacimiento y edad»**: fecha escrita día/mes/año, sin calendario (`data-formato="fecha-dma"`, la escritura se acomoda sola), con `data-no-futura`, y edad calculada en solo lectura (`data-deriva="edad=…"`, módulo `fecha`) | OPCIONAL | Se pide la CURP: la fecha y la edad salen de ella. |
| Saber la edad | Siempre calculada de una fecha, nunca escrita; si basta el grupo de edad, **bloque listo «Rango de edad»** (una opción, sin huecos ni encimados) | RECOMENDADO | — |
| Confirmar un dato (correo, contraseña) | Dos campos + `data-cruzada="igual"` | RECOMENDADO | — |
| Declarar o consentir | Casilla destacada (`.destacado`), nunca premarcada | BASE | — |
| Activar un ajuste de efecto inmediato | `toggle` (role=switch) | OPCIONAL | Es una pregunta del formulario: Sí/No. |
| Valorar en una escala | `escala` (radios 1–5 con extremos) | OPCIONAL | — |
| Agregar varios elementos iguales (personas, ejemplares) | `repetibles` con `data-min`/`data-max` | OPCIONAL | Siempre son exactamente dos: dos bloques fijos. |
| Adjuntar fotos o documentos | `archivos`: formatos, peso, cámara, firma, duplicados | BASE (zona) / RECOMENDADO (optimización) | — |
| Revisar los documentos que alguien cargó | `visor`: todas las hojas del PDF (o la imagen) junto a la decisión, con contador, acercar y girar; en teléfono, a pantalla completa | OPCIONAL | La persona sólo revisa lo que ella misma adjuntó: basta la vista previa de `archivos`. |
| Marcar un punto en el mapa | `mapa` (Leaflet autoalojado) **además** de la dirección | OPCIONAL | La dirección basta; no hay mapa base acordado. |
| Dar coordenadas a mano | `data-formato="coordenadas"` con ámbito | OPCIONAL | — |
| Pegar el enlace de Google Maps del lugar | `enlace-mapa` sobre el campo de coordenadas: toma el lugar marcado, avisa si sólo trae el centro de la pantalla y explica los enlaces cortos | OPCIONAL | Como única vía: la dirección va primero (FRM-46). |
| Dar sus datos de identificación | **Bloque listo «Datos de identificación»** (guía visual, «Bloques listos»): nombre(s), apellido paterno, apellido materno opcional, CURP y fecha de nacimiento derivada | OPCIONAL | No hay uso declarado para la CURP: quita CURP y fecha. |
| Dar un domicilio | **Bloque listo «Domicilio»**: calle, número exterior («S/N») e interior, manzana y lote sólo con «Sí», entre calles, alcaldía → colonia → CP y ubicación por enlace o coordenadas | OPCIONAL | Basta la alcaldía: select o combo. |
| Ver un dato que no debe cambiar | `readonly` + `data-copiable` | BASE | Lo que no aplica todavía: `disabled`. |
| Dar datos hermanos | **Una fila**: nombre y apellidos en `.fila-3`; CURP y fecha de nacimiento, correo y su confirmación, contraseña y su confirmación en `.fila` (también calle y número, manzana y lote). En teléfono, una columna | BASE | No son partes de un dato ni su confirmación: cada uno en su renglón, aunque sea corto. |
| Leer una indicación que vale para toda una sección | **Ayuda de bloque** (`.ayuda-bloque`) bajo el título de la sección; el núcleo la enlaza a cada campo que le sigue, hasta el siguiente título | BASE | La indicación es propia de un campo: va en su ayuda. |

## 3. Por necesidad de navegación o retroalimentación

| Necesidad | Pieza | Nivel |
|---|---|---|
| Varias pantallas de preguntas | `pasos` (barra navegable, recordatorio, acciones fijas opcionales) | RECOMENDADO |
| Revisar antes de enviar | `revision` con «Editar» que aterriza en el campo | RECOMENDADO |
| Cerrar con folio y «qué sigue» | `acuse` (+ `copiar`, `descarga`) | RECOMENDADO |
| Avisar que hay un borrador | Franja del núcleo (`data-borrador`) | RECOMENDADO |
| Pedir confirmación | `modal` (`FormKit.confirma`) · diálogo de contenido (`data-abre-dialogo`) | RECOMENDADO |
| Explicar un campo con un texto corto que no todos necesitan | `tooltip` (botón «?»); nunca repite la ayuda visible: si la ayuda visible basta, no hay ícono (`auditar-campos` D5) | OPCIONAL |
| Plegar lo opcional de uso raro | `acordeon` (`details`) | OPCIONAL |
| Ubicar a la persona en un sitio interno | `migas` | OPCIONAL |
| Mostrar en pantalla qué versión del sitio es (de prueba, instalada en el SIA o sin leer) | `version`: distintivo fijo abajo a la izquierda, dentro del pie | OPCIONAL |
| Mostrar avance de una tarea | `progreso` | OPCIONAL |
| Listas largas de resultados | `tabla` + `paginacion`; para filtrar, las filas se ocultan con `hidden` (el rayado cuenta sólo las visibles) | OPCIONAL |
| Sugerir lo que la persona ya escribió antes | `chips` (sólo campos sin datos personales) | OPCIONAL |
| Ofrecer respuestas frecuentes conocidas (motivos para observar un documento) | `chips` con `data-chips-fijos`: lista fija, no guarda nada; en un texto largo, el chip agrega su texto para completarlo | OPCIONAL |
| Ofrecer un archivo | `descarga` (formato y peso visibles) | OPCIONAL |
| Copiar o compartir un folio | `copiar` | RECOMENDADO |
| Enlazar a las redes de la Secretaría en el pie | **Bloque listo «Redes sociales»**: íconos de 44 px con nombre accesible; las direcciones van en la configuración del sitio (FRM-59) | OPCIONAL |

## 4. Lo que no es una pregunta

- **Datos de terceros** (la persona denunciada, un vecino): mismos campos, `autocomplete="off"` con el motivo en comentario, y revisar si de verdad hacen falta (`data-uso`).
- **Datos personales**: siempre `data-finalidad`; los de identidad y contacto, `data-sensible` (no entran al borrador). `herramientas/auditar-campos.mjs` lo comprueba.
- **Aviso de privacidad**: diálogo desde la pantalla de envío, antes de la casilla; fundamentos sin verificar como `[Art. __, fracc. __]`.
- **Lo pendiente**: `.pendiente` con la palabra «Pendiente:» en el HTML.

## 5. Después de elegir

1. Copia el núcleo y los módulos elegidos (el árbol de decisión de la guía da las etiquetas en orden).
2. Copia la plantilla más parecida y sustituye el contenido; ajusta `configuracion-*.js` (envío, catálogos, mapa).
3. Genera el esquema para el servidor: `node herramientas/esquema-desde-html.mjs tu-formulario.html esquema.json`.
4. Verifica: `npm run verificar` y la lista de `docs/08-verificacion-y-cierre.md`.
