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
| Dar correo, teléfono, CP | Campo con `data-formato="correo|telefono|cp"` y `autocomplete` | BASE | — |
| Dar un número con unidad | `data-formato="numero"` + `.control-grupo` con la unidad; `min`, `max`, `step` | BASE | El número es un código (folio, CP): es texto. |
| Elegir una de 2 a 7 opciones | Radios (`opciones`): lista, tarjetas con descripción o Sí/No corto | BASE | Más de 7: combo. Un ajuste inmediato: toggle. |
| Elegir varias | Casillas (`opciones`) con `data-min-opciones`/`data-max-opciones` | BASE | — |
| Elegir de un catálogo largo (≥ 8) | `combo` (cerrado) · `data-libre` si se admite lo no listado | RECOMENDADO | Menos de 8: radios o select nativo. |
| Elegir de una lista corta sin descripciones | `select` nativo del núcleo con «Elige una opción» | BASE | Las opciones necesitan explicación: tarjetas. |
| Decir «ninguna de las anteriores» | Opción **Otro** (`otro`): con especificación (`data-otro-de`) o simple | RECOMENDADO | El detalle no se usa: «Otro» simple. |
| Dar alcaldía, colonia y CP | `cascadas` con catálogo versionado; CP propone alcaldía y colonia | OPCIONAL | Sólo se pide la alcaldía: select o combo. |
| Dar una fecha | `type=date` + botón «Hoy» (`fecha`); `data-no-futura` si aplica | RECOMENDADO | — |
| Dar un rango de fechas | `data-rango` + `data-atajos` (`fecha`) | OPCIONAL | — |
| Dar una hora | `type=time` + «Ahora» (`fecha`) | OPCIONAL | — |
| Dar su CURP o RFC | `identificadores`: mayúsculas, 18/13 caracteres, derivados en solo lectura | OPCIONAL | No hay uso declarado para la CURP: no se pide. |
| Confirmar un dato (correo, contraseña) | Dos campos + `data-cruzada="igual"` | RECOMENDADO | — |
| Declarar o consentir | Casilla destacada (`.destacado`), nunca premarcada | BASE | — |
| Activar un ajuste de efecto inmediato | `toggle` (role=switch) | OPCIONAL | Es una pregunta del trámite: Sí/No. |
| Valorar en una escala | `escala` (radios 1–5 con extremos) | OPCIONAL | — |
| Agregar varios elementos iguales (personas, ejemplares) | `repetibles` con `data-min`/`data-max` | OPCIONAL | Siempre son exactamente dos: dos bloques fijos. |
| Adjuntar fotos o documentos | `archivos`: formatos, peso, cámara, firma, duplicados | BASE (zona) / RECOMENDADO (optimización) | — |
| Marcar un punto en el mapa | `mapa` (Leaflet autoalojado) **además** de la dirección | OPCIONAL | La dirección basta; no hay mapa base acordado. |
| Dar coordenadas a mano | `data-formato="coordenadas"` con ámbito | OPCIONAL | — |
| Ver un dato que no debe cambiar | `readonly` + `data-copiable` | BASE | Lo que no aplica todavía: `disabled`. |

## 3. Por necesidad de navegación o retroalimentación

| Necesidad | Pieza | Nivel |
|---|---|---|
| Varias pantallas de preguntas | `pasos` (barra navegable, recordatorio, acciones fijas opcionales) | RECOMENDADO |
| Revisar antes de enviar | `revision` con «Editar» que aterriza en el campo | RECOMENDADO |
| Cerrar con folio y «qué sigue» | `acuse` (+ `copiar`, `descarga`) | RECOMENDADO |
| Avisar que hay un borrador | Franja del núcleo (`data-borrador`) | RECOMENDADO |
| Pedir confirmación | `modal` (`FormKit.confirma`) · diálogo de contenido (`data-abre-dialogo`) | RECOMENDADO |
| Explicar un campo con un texto corto que no todos necesitan | `tooltip` (botón «?») | OPCIONAL |
| Plegar lo opcional de uso raro | `acordeon` (`details`) | OPCIONAL |
| Ubicar a la persona en un sitio interno | `migas` | OPCIONAL |
| Mostrar avance de una tarea | `progreso` | OPCIONAL |
| Listas largas de resultados | `tabla` + `paginacion` | OPCIONAL |
| Sugerir lo que la persona ya escribió antes | `chips` (sólo campos sin datos personales) | OPCIONAL |
| Ofrecer un archivo | `descarga` (formato y peso visibles) | OPCIONAL |
| Copiar o compartir un folio | `copiar` | RECOMENDADO |

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
