# 04 · Catálogo de componentes

> Este documento se **genera** de `codigo/manifiesto.json` (`node herramientas/construir.mjs`). No se edita a mano: se corrige el manifiesto y se vuelve a construir. La versión interactiva, con muestras vivas y HTML para copiar, es `guia-visual/index.html`.

El paquete tiene un **núcleo** obligatorio y **30 módulos** que se copian sólo si el formulario los usa. Niveles: **BASE** obligatorio en todo formulario; **RECOMENDADO** salvo justificación escrita; **OPCIONAL** si el formulario necesita la pieza. Quien programa elige los módulos, no el nivel.

## Núcleo (BASE)

Archivos, en este orden: `codigo/css/tokens.css`, `codigo/css/base.css`, `codigo/css/nucleo.css`, `codigo/js/validaciones.config.js`, `codigo/js/formkit.core.js`, `codigo/js/iconos.js`. Orden de carga: tokens.css → base.css → nucleo.css → (CSS de módulos) … validaciones.config.js → iconos.js → formkit.core.js → (JS de módulos).

| Pieza | Nivel |
|---|---|
| Campo (etiqueta, ayuda, control, error) | BASE |
| Texto corto, correo, teléfono, numérico, texto largo con contador | BASE |
| Lista desplegable simple (select) | BASE |
| Casilla de declaración o consentimiento | BASE |
| Solo lectura frente a deshabilitado | BASE |
| Pregunta condicional (data-si) | BASE |
| Autocompletado, inputmode y enterkeyhint | BASE |
| Validación individual, cruzada y resumen de errores con foco, contexto (data-contexto) y título propio del rechazo del servidor | BASE |
| Botones (principal, secundario, peligro relleno y de contorno, atrás, enlace, icono) | BASE |
| Avisos (neutro, advertencia, bloqueo, éxito) con título e icono por tono, FormKit.aviso() con texto, enlace y pasos, y pendiente visible | BASE |
| Secuencia «qué sigue» (ol.secuencia) para varias acciones en orden, en cualquier pantalla | BASE |
| Iconografía (sprite SVG) | BASE |
| Anuncios que también se ven (FormKit.anuncia con el elemento visible) | BASE |
| Estados de envío (enviando, error, plazo, límite) sin duplicados | BASE |
| Borrador local versionado, que empieza con la persona (no con la precarga de la página) y guarda archivos con el proveedor de la página | RECOMENDADO |
| Encabezado y pie institucionales, enlace de salto | BASE |

## Módulos

| Módulo | Título | Nivel | Tipo | Depende de | CSS | JS |
|---|---|---|---|---|---|---|
| `opciones` | Opciones elegibles | BASE | pregunta | — | 5.1 KB | — |
| `otro` | Opción «Otro» con especificación | RECOMENDADO | pregunta | opciones | — | 4.2 KB |
| `combo` | Lista desplegable con búsqueda | RECOMENDADO | pregunta | — | 1.4 KB | 7.9 KB |
| `fecha` | Fecha y hora con «Hoy» y atajos | RECOMENDADO | pregunta | — | 1003 B | 7.0 KB |
| `identificadores` | CURP, RFC y folios | OPCIONAL | pregunta | — | — | 4.0 KB |
| `repetibles` | Grupos repetibles («Agregar otro») | OPCIONAL | pregunta | modal | 1.1 KB | 7.4 KB |
| `toggle` | Interruptor | OPCIONAL | pregunta | — | 1.4 KB | 2.6 KB |
| `escala` | Escala o valoración | OPCIONAL | pregunta | opciones | 2.2 KB | — |
| `pasos` | Formulario por pasos y barra de avance | RECOMENDADO | navegacion | — | 4.8 KB | 8.8 KB |
| `revision` | Pantalla de revisión | RECOMENDADO | retroalimentacion | pasos | 2.4 KB | 3.2 KB |
| `acuse` | Acuse y «qué sigue» | RECOMENDADO | retroalimentacion | copiar | 2.2 KB | 3.5 KB |
| `resultado` | Resultado de una decisión | RECOMENDADO | retroalimentacion | — | 2.5 KB | 5.7 KB |
| `modal` | Diálogo y confirmación | RECOMENDADO | retroalimentacion | — | 2.1 KB | 5.7 KB |
| `copiar` | Copiar y compartir | RECOMENDADO | retroalimentacion | — | 542 B | 4.0 KB |
| `descarga` | Botón de descarga | OPCIONAL | retroalimentacion | — | 434 B | 3.7 KB |
| `acordeon` | Acordeón y secciones plegables | OPCIONAL | navegacion | — | 2.0 KB | — |
| `pestanas` | Pestañas | OPCIONAL | navegacion | — | 1.1 KB | 2.9 KB |
| `migas` | Migas de pan | OPCIONAL | navegacion | — | 2.5 KB | — |
| `progreso` | Barra de progreso | OPCIONAL | navegacion | — | 1.1 KB | 1.8 KB |
| `paginacion` | Paginación de resultados | OPCIONAL | navegacion | — | 2.1 KB | 6.0 KB |
| `version` | Distintivo de versión | OPCIONAL | navegacion | — | 2.2 KB | — |
| `tooltip` | Ayuda desplegable | OPCIONAL | retroalimentacion | — | 1.5 KB | 2.7 KB |
| `tabla` | Tabla de consulta y de captura | OPCIONAL | retroalimentacion | repetibles | 4.4 KB | 6.6 KB |
| `estado` | Etiquetas de estado | OPCIONAL | retroalimentacion | — | 1.5 KB | 2.9 KB |
| `archivos` | Carga de archivos y fotografías | RECOMENDADO | archivos | — | 3.1 KB | 22.7 KB |
| `visor` | Visor de documentos | OPCIONAL | archivos | — | 3.2 KB | 11.7 KB |
| `mapa` | Mapa con selección de punto | OPCIONAL | archivos | — | 2.7 KB | 9.6 KB |
| `enlace-mapa` | Coordenadas desde un enlace de Google Maps | OPCIONAL | archivos | — | — | 8.0 KB |
| `cascadas` | Campos dependientes en cascada | OPCIONAL | pregunta | — | 539 B | 7.4 KB |
| `chips` | Chips de uso frecuente | OPCIONAL | pregunta | — | 1.9 KB | 8.3 KB |

### Opciones elegibles (`opciones`) · BASE

Opción única (radio), opción múltiple (casilla), tarjetas seleccionables con descripción y la variante corta Sí/No, sobre controles nativos. Para una sola respuesta, la lista (.opciones-lista, una por renglón con el círculo visible) es la forma por omisión; dos o tres opciones cortas sin descripción (Sí/No) van en línea (.opciones-en-linea). La opción deshabilitada se ve atenuada.

**Cuándo.** Elegir una o varias respuestas entre 2 y 7 opciones conocidas.

**Cuándo no.** Más de 7 opciones (usa combo); ajustes inmediatos (usa toggle); escalas (usa escala).

**Depende de.** sólo del núcleo · **Archivos.** `codigo/modulos/opciones/opciones.css`

**Accesibilidad.** Input nativo cubriendo la tarjeta: flechas, espacio, anuncio «botón de opción 1 de 3»; lo elegido se marca con fondo, sombra interior y palomita.

**En teléfono.** Una columna, también la lista en línea; Sí/No con botones a 48 px con puntero grueso.

**En escritorio.** Lista con el círculo visible; en línea, una columna por opción con el hueco de las filas de campos; Sí/No con botones a 40 px con ratón.

**Errores frecuentes que evita.**
- Usar div con onclick en lugar de radio.
- Marcar lo elegido sólo con color.
- Premarcar una opción.
- Más de siete tarjetas.
- Tarjetas en rejilla para una sola respuesta: en escritorio no se ve que hay que elegir una.
- Sí/No apilado a todo lo ancho: dos o tres opciones cortas van en línea.

### Opción «Otro» con especificación (`otro`) · RECOMENDADO

Campo de texto que aparece al elegir «Otro» en radios, casillas, select o tarjetas; obligatorio sólo mientras exista; conserva lo escrito.

**Cuándo.** La lista puede no cubrir el caso de la persona.

**Cuándo no.** El detalle no se va a usar (usa «Otro» simple, que es una opción más).

**Depende de.** opciones · **Archivos.** `codigo/modulos/otro/otro.js`

**Accesibilidad.** aria-expanded y aria-controls en el control que gobierna; sin mover el foco; mensaje propio de obligatorio.

**En teléfono.** Igual que el campo de texto.

**En escritorio.** Igual.

**Errores frecuentes que evita.**
- Poner «Otro» al inicio de la lista.
- Enviar el texto aunque «Otro» no esté elegida.
- Borrar lo escrito al desmarcar.

### Lista desplegable con búsqueda (`combo`) · RECOMENDADO

Combobox ARIA 1.2 para catálogos largos: filtra sin acentos, teclado completo, anuncia resultados; cerrado por omisión, libre con data-libre.

**Cuándo.** Catálogos de 8 o más valores (alcaldías, giros, especies).

**Cuándo no.** Listas cortas (usa select u opciones).

**Depende de.** sólo del núcleo · **Archivos.** `codigo/modulos/combo/combo.css`, `codigo/modulos/combo/combo.js`

**Accesibilidad.** role=combobox, aria-expanded, aria-activedescendant, flechas, Inicio/Fin, Enter, Escape; no abre al recibir foco para no tapar el error.

**En teléfono.** Lista bajo el campo, 44 px por opción.

**En escritorio.** Igual, 8 resultados máximo.

**Errores frecuentes que evita.**
- Mezclar select nativo y combo en el mismo formulario.
- Escribir el catálogo a mano en el código.
- Aceptar valor libre sin decirlo.

### Fecha y hora con «Hoy» y atajos (`fecha`) · RECOMENDADO

Control nativo de fecha u hora con botón «Hoy»/«Ahora» en la zona horaria de la Ciudad de México, límites por atributo, atajos de rango y edad calculada desde la fecha de nacimiento (data-deriva="edad=…"), que nunca se escribe a mano. Para la fecha de nacimiento, sin calendario: formato «fecha-dma», escrita día/mes/año (23/07/1985) con la escritura acomodada sola.

**Cuándo.** Cualquier fecha u hora.

**Cuándo no.** Fecha de nacimiento cuando ya se pide CURP (se deriva).

**Depende de.** sólo del núcleo · **Archivos.** `codigo/modulos/fecha/fecha.css`, `codigo/modulos/fecha/fecha.js`

**Accesibilidad.** Botón con texto; el valor nuevo se anuncia; la validación cruzada de rango se declara sola.

**En teléfono.** Botón bajo el campo a todo lo ancho; rueda nativa del sistema.

**En escritorio.** Botón al lado del campo.

**Errores frecuentes que evita.**
- Tomar «hoy» del reloj del dispositivo sin zona horaria.
- Permitir fecha de hechos futura.
- Rango sin validación cruzada.
- Pedir la edad escrita además de la fecha de nacimiento.
- Pedir la fecha de nacimiento con el calendario: obliga a recorrer décadas; se escribe día/mes/año («fecha-dma»).

### CURP, RFC y folios (`identificadores`) · OPCIONAL

Campos con formato cerrado: mayúsculas al escribir, validación por capas desde la configuración, derivación de fecha de nacimiento y sexo desde la CURP a campos de solo lectura, enmascarado en revisión.

**Cuándo.** El formulario necesita identificar a la persona.

**Cuándo no.** Cuando el dato no tiene uso declarado: la CURP es dato personal.

**Depende de.** sólo del núcleo · **Archivos.** `codigo/modulos/identificadores/identificadores.js`

**Accesibilidad.** Los derivados se anuncian («tomado de la CURP»); el mensaje dice qué posición falló.

**En teléfono.** autocapitalize=characters; teclado de texto.

**En escritorio.** Igual.

**Errores frecuentes que evita.**
- Pedir fecha de nacimiento y CURP por separado sin cruzarlas.
- Registrar la CURP en bitácoras o en la URL.
- Dar por verificada la existencia con el formato.

### Grupos repetibles («Agregar otro») (`repetibles`) · OPCIONAL

Varias filas de un mismo bloque (personas, domicilios, partidas) desde una plantilla; mínimo y máximo; quitar con confirmación si hay datos.

**Cuándo.** La cantidad de elementos la decide la persona.

**Cuándo no.** Siempre son exactamente N (ponlos fijos).

**Depende de.** modal · **Archivos.** `codigo/modulos/repetibles/repetibles.css`, `codigo/modulos/repetibles/repetibles.js`

**Accesibilidad.** Cada fila tiene título numerado y botón «Quitar fila N»; el foco va al primer campo al agregar y a un lugar sensato al quitar.

**En teléfono.** Filas apiladas como tarjetas.

**En escritorio.** Igual; en tabla de captura, por renglones.

**Errores frecuentes que evita.**
- Nombres de campo repetidos entre filas.
- Quitar sin confirmar una fila con datos.
- Sin máximo.

### Interruptor (`toggle`) · OPCIONAL

role=switch para ajustes que surten efecto de inmediato.

**Cuándo.** Activar o desactivar algo al momento (mostrar mapa, recibir avisos).

**Cuándo no.** Una respuesta del formulario (usa casilla o Sí/No).

**Depende de.** sólo del núcleo · **Archivos.** `codigo/modulos/toggle/toggle.css`, `codigo/modulos/toggle/toggle.js`

**Accesibilidad.** aria-checked es el estado; texto «Sí/No» visible; 44 px.

**En teléfono.** Igual.

**En escritorio.** Igual.

**Errores frecuentes que evita.**
- Usarlo como consentimiento.
- Estado sólo por color.

### Escala o valoración (`escala`) · OPCIONAL

Radios en fila (1 a 5) con extremos rotulados.

**Cuándo.** Encuestas y valoraciones.

**Cuándo no.** Más de 7 puntos; respuestas con descripción (usa opciones).

**Depende de.** opciones · **Archivos.** `codigo/modulos/escala/escala.css`

**Accesibilidad.** fieldset/legend; extremos en texto oculto en el primer y último radio.

**En teléfono.** Puntos a 48 px repartidos a lo ancho.

**En escritorio.** Igual.

**Errores frecuentes que evita.**
- Escala sin extremos rotulados.
- Puntos menores de 44 px.

### Formulario por pasos y barra de avance (`pasos`) · RECOMENDADO

Pasos con barra fija navegable que valida igual que «Continuar»; estados completado, actual, pendiente y con error; «Paso X de N» en teléfono; recordatorio; barra de acciones fija opcional.

**Cuándo.** Más de una pantalla de preguntas.

**Cuándo no.** Formularios de 5 campos o menos (una página).

**Depende de.** sólo del núcleo · **Archivos.** `codigo/modulos/pasos/pasos.css`, `codigo/modulos/pasos/pasos.js`

**Accesibilidad.** Botones con aria-current=step y nombre «Paso N de M: título, completado»; el foco va al título al cambiar; Enter avanza, no envía.

**En teléfono.** Círculos sin etiqueta + «Paso X de N · Título»; acciones en columna, principal arriba. Opcional: la clase acciones-fijas en el bloque de acciones del paso lo deja fijo al pie, respetando las áreas seguras del teléfono.

**En escritorio.** Etiquetas bajo cada círculo; acciones en fila.

**Errores frecuentes que evita.**
- Deshabilitar los pasos futuros (el teclado no puede inspeccionarlos).
- Barra que deja saltar sobre errores.
- Mover el foco en cada cambio de campo.

### Pantalla de revisión (`revision`) · RECOMENDADO

Resumen de todo lo capturado por bloques, con «Editar» que aterriza en el campo y enmascarado de identificadores.

**Cuándo.** Siempre que haya más de un paso o datos personales.

**Cuándo no.** Formularios de una pregunta.

**Depende de.** pasos · **Archivos.** `codigo/modulos/revision/revision.css`, `codigo/modulos/revision/revision.js`

**Accesibilidad.** details/summary nativos; «Editar» con el nombre del campo para el lector.

**En teléfono.** Etiqueta y valor apilados.

**En escritorio.** Dos columnas.

**Errores frecuentes que evita.**
- «Editar» que lleva al inicio del paso.
- Mostrar campos ocultos por condicional.
- «Editar» que baja de renglón con un valor largo.
- Rótulo con fondo gris y en negritas: el rótulo va gris y de peso normal, y el dato destaca.

### Acuse y «qué sigue» (`acuse`) · RECOMENDADO

Pantalla final con folio copiable, fecha, secuencia «qué sigue» (del núcleo, aquí centrada), descarga opcional y pantalla de límite de envíos. Termina con una acción principal para seguir (.acuse-acciones).

**Cuándo.** Todo envío que genere folio.

**Cuándo no.** Capturas internas sin acuse.

**Depende de.** copiar · **Archivos.** `codigo/modulos/acuse/acuse.css`, `codigo/modulos/acuse/acuse.js`

**Accesibilidad.** Foco al título del acuse; folio en tarjeta, no en botón; la secuencia es una lista ordenada.

**En teléfono.** Acciones en columna.

**En escritorio.** Acciones en fila centradas.

**Errores frecuentes que evita.**
- Prometer plazos que el sistema no controla.
- Folio con aspecto de botón.
- No borrar el borrador al recibir.
- Acuse sin una acción para seguir.
- Quitarle el relleno lateral a la tarjeta del acuse: en teléfono los botones quedan pegados a la orilla.

### Resultado de una decisión (`resultado`) · RECOMENDADO

El desenlace de lo que decide el personal (validar, rechazar, devolver, turnar, cerrar): título con el resultado, «Quedó guardado a las HH:MM · quien», el motivo citado tal cual, lo que sigue como secuencia numerada y la acción para seguir. Usa las cinco familias de «estado». FormKit.resultado(lugar, {tono, titulo, hora, quien, motivo, pasos}).

**Cuándo.** Pantallas del personal después de validar, rechazar, devolver para corregir o cerrar un trámite.

**Cuándo no.** Lo que envía la ciudadanía (usa el acuse); cambios menores que basta con anunciar, como guardar una nota.

**Depende de.** sólo del núcleo · **Archivos.** `codigo/modulos/resultado/resultado.css`, `codigo/modulos/resultado/resultado.js`

**Accesibilidad.** El foco va al título del resultado y se anuncia con la hora y quién decidió; el tono va en icono y palabras, nunca sólo en color.

**En teléfono.** Tarjeta a todo lo ancho con su relleno lateral.

**En escritorio.** Tarjeta con más relleno.

**Errores frecuentes que evita.**
- Dejar la pantalla igual tras decidir, sin decir qué pasó.
- Un resultado sin hora ni quién lo registró.
- Reescribir el motivo en lugar de citarlo.
- Dejar a la vista el panel de decisión que ya no aplica (opción oculta).
- Encadenar lo que sigue en un párrafo («Abra el expediente… El siguiente paso es…»).

### Diálogo y confirmación (`modal`) · RECOMENDADO

<dialog> nativo para contenido que hay que leer y FormKit.confirma() para acciones con efecto: pregunta por la acción, lista sus consecuencias, dice si no se puede deshacer y su botón repite el verbo; hoja inferior en teléfono.

**Cuándo.** Aviso de privacidad; confirmar rechazar, cancelar, cerrar un trámite, descartar o quitar.

**Cuándo no.** Errores de campo; avisos sin decisión; acciones recuperables, como guardar una nota.

**Depende de.** sólo del núcleo · **Archivos.** `codigo/modulos/modal/modal.css`, `codigo/modulos/modal/modal.js`

**Accesibilidad.** Trampa de foco nativa, Escape cierra, el foco vuelve a quien abrió; foco inicial en «Volver sin cambios»; las consecuencias y «No se puede deshacer» forman la descripción que oye el lector.

**En teléfono.** Hoja inferior a todo lo ancho con dvh y franja segura.

**En escritorio.** Caja centrada de 560 px.

**Errores frecuentes que evita.**
- confirm()/alert() nativos.
- Foco inicial en la acción destructiva.
- Diálogo para instrucciones que deberían estar en pantalla.
- Preguntar igual para guardar una nota que para cerrar un trámite.
- Botón «Aceptar» o «Confirmar» en lugar del verbo de la acción.
- Callar las consecuencias o que no se puede deshacer.

### Copiar y compartir (`copiar`) · RECOMENDADO

Botones de copiar (folio, campo de solo lectura) y compartir, con confirmación visible y anunciada y alternativa sin portapapeles.

**Cuándo.** Todo dato que la persona deba transcribir.

**Cuándo no.** Datos sensibles que no deban salir de la pantalla.

**Depende de.** sólo del núcleo · **Archivos.** `codigo/modulos/copiar/copiar.css`, `codigo/modulos/copiar/copiar.js`

**Accesibilidad.** El botón cambia su texto a «Copiado» y se anuncia; sin portapapeles selecciona el texto.

**En teléfono.** navigator.share cuando existe.

**En escritorio.** Copia el enlace.

**Errores frecuentes que evita.**
- Confirmar sólo con un color.
- Icono solo sin texto.

### Botón de descarga (`descarga`) · OPCIONAL

Enlace o botón de descarga con icono, acción, formato y peso; estado de preparación; aviso de otra pestaña.

**Cuándo.** Acuse en PDF, plantillas, resultados.

**Cuándo no.** Abrir un sitio (es un enlace normal).

**Depende de.** sólo del núcleo · **Archivos.** `codigo/modulos/descarga/descarga.css`, `codigo/modulos/descarga/descarga.js`

**Accesibilidad.** Texto dice formato y peso; «se abre en otra pestaña» para el lector; aria-busy mientras se genera.

**En teléfono.** Igual.

**En escritorio.** Igual.

**Errores frecuentes que evita.**
- Nombre de archivo con datos personales.
- Icono sin texto.

### Acordeón y secciones plegables (`acordeon`) · OPCIONAL

details/summary para datos accesorios y preguntas frecuentes.

**Cuándo.** Información de apoyo que no todos necesitan.

**Cuándo no.** Campos obligatorios o contenido necesario para decidir.

**Depende de.** sólo del núcleo · **Archivos.** `codigo/modulos/acordeon/acordeon.css`

**Accesibilidad.** Nativo: Enter/espacio, estado expandido anunciado.

**En teléfono.** Igual.

**En escritorio.** Igual.

**Errores frecuentes que evita.**
- Plegar lo obligatorio.
- Flecha con imagen (color fuera de :root).

### Pestañas (`pestanas`) · OPCIONAL

Vistas alternativas del mismo contenido con patrón ARIA tabs y teclado completo.

**Cuándo.** Consulta interna con varias vistas.

**Cuándo no.** Dividir un formulario que debe llenarse completo (usa pasos).

**Depende de.** sólo del núcleo · **Archivos.** `codigo/modulos/pestanas/pestanas.css`, `codigo/modulos/pestanas/pestanas.js`

**Accesibilidad.** role=tab/tabpanel, aria-selected, tabindex rotatorio, flechas e Inicio/Fin.

**En teléfono.** Lista con desplazamiento horizontal.

**En escritorio.** Igual.

**Errores frecuentes que evita.**
- Pestañas con campos obligatorios ocultos.
- Más de 5 pestañas.

### Migas de pan (`migas`) · OPCIONAL

Ubicación dentro del sitio o del sistema.

**Cuándo.** Consulta interna con niveles.

**Cuándo no.** Dentro de un formulario por pasos.

**Depende de.** sólo del núcleo · **Archivos.** `codigo/modulos/migas/migas.css`

**Accesibilidad.** nav con aria-label; aria-current=page; separadores dibujados, no leídos.

**En teléfono.** Sólo el nivel anterior con flecha.

**En escritorio.** Ruta completa.

**Errores frecuentes que evita.**
- Separador con carácter que el lector lee.
- Último nivel como enlace a sí mismo.

### Barra de progreso (`progreso`) · OPCIONAL

<progress> nativo con porcentaje en texto; indeterminado dice «Cargando…».

**Cuándo.** Cargas y formularios largos de una página.

**Cuándo no.** Formularios por pasos.

**Depende de.** sólo del núcleo · **Archivos.** `codigo/modulos/progreso/progreso.css`, `codigo/modulos/progreso/progreso.js`

**Accesibilidad.** Etiqueta asociada; aria-valuetext con el porcentaje.

**En teléfono.** Igual.

**En escritorio.** Igual.

**Errores frecuentes que evita.**
- Porcentaje sólo visual.
- Barra que nunca termina sin mensaje.

### Paginación de resultados (`paginacion`) · OPCIONAL

Paginación numerada o «Cargar más» con rango visible, tamaño de página, anuncio y foco al inicio de la lista.

**Cuándo.** Listas y tablas de más de una pantalla.

**Cuándo no.** Menos de 20 resultados.

**Depende de.** sólo del núcleo · **Archivos.** `codigo/modulos/paginacion/paginacion.css`, `codigo/modulos/paginacion/paginacion.js`

**Accesibilidad.** nav con etiqueta; aria-current=page; Anterior/Siguiente con aria-disabled; anuncio «Página N de M».

**En teléfono.** Anterior · «Página X de N» · Siguiente.

**En escritorio.** Números, rango y selector.

**Errores frecuentes que evita.**
- Desplazamiento infinito.
- Perder filtros al cambiar de página.
- Foco que se queda en el botón pulsado.

### Distintivo de versión (`version`) · OPCIONAL

Distintivo pequeño y siempre visible, fijo abajo a la izquierda, que dice qué versión del sitio se tiene enfrente: de prueba (dorado), instalada en el SIA (gris) o sin leer (guinda). Es la hoja de la plantilla de versión del SIA hecha con los tokens del estándar.

**Cuándo.** Sitios que se prueban antes de instalarse en el SIA, o que deben mostrar su versión en pantalla.

**Cuándo no.** Para avisos a la persona (usa los avisos del núcleo): el distintivo no recibe toques ni se anuncia como estado.

**Depende de.** sólo del núcleo · **Archivos.** `codigo/modulos/version/version.css`

**Accesibilidad.** Va dentro del pie (<footer>), para quedar en una región de la página; no recibe toques (pointer-events: none), así que nunca tapa un control; texto de 4.5:1 o más en sus tres estados.

**En teléfono.** Abajo a la izquierda, respetando el área segura de la pantalla.

**En escritorio.** Igual; al imprimir va en su lugar, sin flotar.

**Errores frecuentes que evita.**
- Ponerlo fuera del pie: axe lo marca como contenido fuera de una región.
- Escribir colores o medidas a mano en lugar de los tokens (el auditor de CSS lo rechaza).
- Usarlo para avisar algo a la persona.

### Ayuda desplegable (`tooltip`) · OPCIONAL

Botón «?» que muestra un texto corto, por clic y teclado, con Escape.

**Cuándo.** Aclaración breve junto a una etiqueta.

**Cuándo no.** Instrucciones necesarias para llenar el campo (van en la ayuda visible); repetir lo que la ayuda visible ya dice (si basta, no hay ícono).

**Depende de.** sólo del núcleo · **Archivos.** `codigo/modulos/tooltip/tooltip.css`, `codigo/modulos/tooltip/tooltip.js`

**Accesibilidad.** aria-expanded, aria-describedby mientras está abierto, role=tooltip; no depende de hover.

**En teléfono.** Texto bajo la etiqueta, dentro del ancho del campo (no se sale de la pantalla aunque el «?» esté al borde), no flotante sobre otros controles.

**En escritorio.** Igual.

**Errores frecuentes que evita.**
- Sólo con hover.
- Texto largo.
- Repetir la ayuda visible del mismo campo (auditar-campos D5).

### Tabla de consulta y de captura (`tabla`) · OPCIONAL

Tabla con caption, orden por columna accesible, estados vacío/carga/error, acciones por fila con nombre completo; en teléfono, tarjetas apiladas.

**Cuándo.** Consulta interna de registros.

**Cuándo no.** Maquetar.

**Depende de.** repetibles · **Archivos.** `codigo/modulos/tabla/tabla.css`, `codigo/modulos/tabla/tabla.js`

**Accesibilidad.** th con scope y aria-sort; cada celda lleva su encabezado en teléfono; «Eliminar registro 123».

**En teléfono.** Cada fila es una tarjeta: rótulo gris de peso normal y dato que destaca.

**En escritorio.** Tabla con desplazamiento controlado; botones, folios y etiquetas no se parten y la columna de acciones toma el ancho de sus botones.

**Errores frecuentes que evita.**
- Tabla sin encabezados.
- «Eliminar» sin decir qué.
- Desplazamiento horizontal libre en teléfono.
- Filtrar ocultando filas y que el rayado alterno se descuadre (cuenta sólo las filas visibles).
- Mostrar en teléfono el rótulo de una columna cuyo encabezado es sólo para lector de pantalla.
- Dejar que una columna se encoja hasta partir botones, folios o fechas («Revisa / r», «10/10/20 / 26»).

### Etiquetas de estado (`estado`) · OPCIONAL

Cinco familias con significado fijo para el estado de un trámite o registro, según a quién le toca qué: hecho (ok, verde), te toca actuar (atencion, ámbar), en marcha (proceso, azul), cerrado sin éxito (rechazo, rojo) y terminado (gris), cada una con su icono y su palabra. FormKit.estado(el, {tono, texto}) lo cambia.

**Cuándo.** Bandejas, tablas y fichas que muestran en qué va un trámite.

**Cuándo no.** Avisos a la persona (usa los avisos del núcleo); botones o filtros (no se tocan).

**Depende de.** sólo del núcleo · **Archivos.** `codigo/modulos/estado/estado.css`, `codigo/modulos/estado/estado.js`

**Accesibilidad.** La palabra dice el estado; el icono y el color sólo lo refuerzan. Texto de 4.5:1 o más en los cinco tonos. Al cambiar por una acción, se anuncia.

**En teléfono.** Una etiqueta larga se parte en renglones; no ensancha su tarjeta ni su tabla.

**En escritorio.** En una tabla, en una sola línea.

**Errores frecuentes que evita.**
- Inventar tonos por sistema (nueve colores sin regla).
- Etiqueta sólo de color, sin icono ni palabra.
- Usar el rojo para «En revisión» o el verde para «Enviado».
- Una etiqueta sin familia (la consola lo avisa y queda como terminado).
- Una etiqueta que no se parte y ensancha su tarjeta o su tabla en teléfono.

### Carga de archivos y fotografías (`archivos`) · RECOMENDADO

Zona de carga (botón real + arrastre), cámara en móvil, validación por extensión, firma, peso, total, duplicados y dimensiones; optimización; huella SHA-256; EXIF configurable; estado, vista previa, quitar y reintentar por archivo.

**Cuándo.** Evidencia, documentos, fotografías.

**Cuándo no.** Un solo archivo pequeño sin optimizar (basta el input nativo con ayuda).

**Depende de.** sólo del núcleo · **Archivos.** `codigo/modulos/archivos/archivos.css`, `codigo/modulos/archivos/archivos.js`

**Accesibilidad.** La zona es un botón con nombre; cada archivo dice su estado; rechazos con role=alert que nombran el archivo y el motivo.

**En teléfono.** Botón de cámara con capture (environment para evidencias; user para una fotografía de frente); vista previa de 96 px; con un solo archivo, los textos en singular.

**En escritorio.** Arrastrar y soltar; guardia global de drop. Con el máximo cargado no se ofrece «Elegir archivo»; el archivo listo se ve en verde.

**Errores frecuentes que evita.**
- Validar sólo por extensión.
- Medir el peso antes de optimizar.
- Enviar la ubicación de la foto sin que la persona lo sepa.
- Dejar «Elegir archivo» a la vista con el máximo ya cargado: la persona cree que no subió nada.
- Enviar la foto original, con su EXIF y su ubicación, porque recodificada pesaba más.
- Guardar los archivos del borrador en el dispositivo: vuelven sólo con el proveedor de la página (borradorArchivos).

### Visor de documentos (`visor`) · OPCIONAL

Para quien revisa lo que se cargó: muestra todas las hojas de un PDF, una debajo de otra, con contador de hoja, acercar y alejar, ajustar al ancho, girar y abrir en otra pestaña; también imágenes. En computadora queda fijo junto a lo que se revisa, para decidir viendo el documento; en teléfono se abre a pantalla completa. Usa pdf.js (vendor/pdfjs-dist), que se carga sólo al abrir el primer PDF.

**Cuándo.** Revisión documental: personal que acepta u observa los documentos que la persona cargó.

**Cuándo no.** Para que la persona vea lo que ella misma adjuntó (la vista previa de «archivos» basta) o para un solo documento corto (basta «Abrir en otra pestaña»).

**Depende de.** sólo del núcleo · **Archivos.** `codigo/modulos/visor/visor.css`, `codigo/modulos/visor/visor.js`

**Accesibilidad.** Diálogo con título; en teléfono es modal y Escape cierra con el foco de vuelta al botón «Ver documento»; en computadora no le quita el foco a quien revisa. Cada hoja es una imagen con nombre («Hoja 1 de 2»); el contador y el acercamiento se anuncian; barra de herramientas con nombre.

**En teléfono.** Pantalla completa, con «Cerrar»; la barra se parte en dos renglones si no cabe.

**En escritorio.** Columna fija a la derecha de lo que se revisa (.visor-area), del alto de la pantalla.

**Errores frecuentes que evita.**
- Abrir el documento en otra pestaña como única forma de revisarlo: quien revisa pierde lo que estaba decidiendo.
- Mostrar sólo la primera hoja.
- Cargar pdf.js de una CDN.
- Usar una versión de pdf.js anterior a la 4.2.67, que deja ejecutar código desde un PDF malicioso.
- Repetir «Hoja n de total» debajo de cada hoja: el contador va sólo en la barra.

### Mapa con selección de punto (`mapa`) · OPCIONAL

Leaflet autoalojado con gestos que no atrapan la página, marcador propio, ámbito acotado, confirmación del punto, alternativa manual y sin mapa base.

**Cuándo.** Se necesita un punto además de la dirección.

**Cuándo no.** Basta la dirección escrita; coordenadas exactas que identifiquen un domicilio sin uso declarado.

**Depende de.** sólo del núcleo · **Archivos.** `codigo/modulos/mapa/mapa.css`, `codigo/modulos/mapa/mapa.js`

**Accesibilidad.** role=application con nombre; coordenadas en texto con aria-live; Enter coloca el punto; alternativa de coordenadas manuales.

**En teléfono.** Un dedo desplaza la página, dos el mapa; alto fluido.

**En escritorio.** Clic y arrastre.

**Errores frecuentes que evita.**
- Mapa como único camino.
- Teselas con clave escrita en el código.
- Punto fuera del ámbito aceptado hasta el envío.

### Coordenadas desde un enlace de Google Maps (`enlace-mapa`) · OPCIONAL

La persona pega el enlace de Google Maps del lugar y el módulo escribe sus coordenadas en el campo de coordenadas, que valida el núcleo. También acomoda lo que se escribe directo: latitud y longitud al revés, grados-minutos-segundos, coma decimal o la longitud sin signo menos. El enlace no se envía; sólo viajan las coordenadas.

**Cuándo.** Se pide la ubicación exacta de un domicilio o de un sitio y la persona puede tenerla en Google Maps (por ejemplo, la que le llegó por WhatsApp).

**Cuándo no.** Como única vía para dar la ubicación: la dirección va primero (FRM-46). Tampoco para resolver enlaces cortos, que obligarían a la página a consultar a Google (FRM-77).

**Depende de.** sólo del núcleo · **Archivos.** `codigo/modulos/enlace-mapa/enlace-mapa.js`

**Accesibilidad.** Lo que se toma del enlace o se corrige se dice con palabras y se anuncia («Coordenadas tomadas del enlace: …»); los avisos llevan icono y texto, no sólo color.

**En teléfono.** Lee el enlace en cuanto se pega, sin salir del campo. Agrega el signo menos que el teclado numérico del iPhone no trae.

**En escritorio.** Igual; también al salir del campo.

**Errores frecuentes que evita.**
- Tomar el centro de la pantalla (@) como si fuera el lugar: el punto puede caer a cientos de metros.
- Tomar el primer punto del enlace en lugar del último.
- Rechazar coordenadas que vienen al revés o sin el signo menos.
- Pedirle a Google desde la página que resuelva un enlace corto.

### Campos dependientes en cascada (`cascadas`) · OPCIONAL

Alcaldía → colonia → código postal desde un catálogo oficial versionado; relación inversa desde el código postal; captura manual si el catálogo no carga.

**Cuándo.** Domicilio dentro de un ámbito con catálogo.

**Cuándo no.** Sin catálogo oficial disponible (captura libre).

**Depende de.** sólo del núcleo · **Archivos.** `codigo/modulos/cascadas/cascadas.css`, `codigo/modulos/cascadas/cascadas.js`

**Accesibilidad.** El hijo deshabilitado explica por qué; cada reinicio y cada autocompletado se anuncian.

**En teléfono.** Selects nativos (rueda del sistema).

**En escritorio.** Selects.

**Errores frecuentes que evita.**
- Catálogo escrito a mano.
- Reiniciar al hijo sin anunciarlo.
- Bloquear si el cp no coincide (es advertencia).

### Chips de uso frecuente (`chips`) · OPCIONAL

Sugerencias de un toque desde el historial del dispositivo (nunca al servidor; quitar y borrar historial; se niega en datos personales) y respuestas frecuentes fijas (data-chips-fijos), que no guardan nada y sirven en cualquier campo: en un texto largo, el chip agrega su texto para completarlo.

**Cuándo.** Captura por personal con respuestas repetidas.

**Cuándo no.** Historial: formularios ciudadanos de una sola vez y datos personales (para ellos, la lista fija).

**Depende de.** sólo del núcleo · **Archivos.** `codigo/modulos/chips/chips.css`, `codigo/modulos/chips/chips.js`

**Accesibilidad.** Botones con aria-pressed; «Quitar X de las sugerencias»; grupo con nombre.

**En teléfono.** Chips de 44 px que se envuelven.

**En escritorio.** Igual.

**Errores frecuentes que evita.**
- Guardar historial de nombre o correo.
- Chips sin forma de borrarlos.
