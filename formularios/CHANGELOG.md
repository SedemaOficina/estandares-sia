# Historial de cambios

## 1.6.3 · 2026-10-20

Sexto bloque de la auditoría del 19 oct 2026: documentos, pruebas y entrega. Cada hallazgo lleva su clave del informe. Las decisiones de la Secretaría que aplica: las pruebas corren solas en GitHub y antes de guardar (10), D1 a D9 confirmadas (16), el guinda no va en avisos ni junto a un error (21) y el presupuesto de peso y velocidad con los archivos juntos en producción (22).

**Peso y velocidad (D4-01, decisión 22, FRM-87 nueva).**
- Las plantillas cargaban 43 archivos por separado: la de por pasos tardaba 18.8 s en estar lista con 3G. En producción, las hojas y los guiones del estándar que carga una página van juntos en un archivo de cada uno y sin comentarios: `node herramientas/juntar.mjs mi-formulario.html carpeta` los arma y dice qué etiquetas poner (la configuración propia, Leaflet y el catálogo se quedan). Las dos plantillas ya están juntas en `dist/plantillas/` y se rehacen con cada construcción. El «todo en uno» de `dist/` sigue, pero pesa más que juntar sólo lo que se usa.
- Presupuesto por plantilla, en un teléfono sin caché y con el texto comprimido: 300 KB o menos, 20 archivos o menos, lista en 5 s o menos con 4G lenta y en 12 s o menos con 3G (procesador cuatro veces más lento). Hoy: por pasos 266 KB en 15 archivos, 2.8 s y 9.5 s; una página 194 KB en 11 archivos, 2.5 s y 7.5 s (mediana de tres corridas). `npm run verificar` revisa peso, archivos y que la versión junta funcione igual; los tiempos, que dependen del equipo, se miden en cada versión con `npm run presupuesto`.

**Las pruebas corren solas (A1-11, decisión 10).** `.github/workflows/verificar.yml` corre en GitHub, con cada subida, la verificación de la carpeta común y la de formularios con sus pruebas en navegador. `.githooks/pre-commit` corre lo mismo antes de cada commit (las pruebas en navegador, sólo si cambió algo de formularios); se activa una vez por copia con `npm run gancho` en la carpeta común, y `verificar` avisa si no está activo.

**Pruebas que protegen lo que dicen (A1-12).**
- Seis correcciones se podían deshacer sin que ninguna prueba lo notara. Ahora cada una tiene la suya: el servidor exige las condiciones de todos los ancestros aunque la cercana se cumpla (P38); la lista con búsqueda no repite un nombre del catálogo (P37); por pasos, el rechazo del servidor abre el paso con el error (P41); el visor encuentra pdf.js con el estándar en una carpeta de cualquier nombre (P96); la foto se recodifica aunque pese más (P127); un dato de la línea de datos no se parte (P134).
- `npm run mutaciones` rompe a propósito, en una copia, esas seis y otras diez correcciones de este bloque, una por una, y exige que su prueba falle. Se corre en cada versión. En su primera corrida encontró dos fallas de las pruebas nuevas: la de P37 agregaba el nombre repetido cuando la lista ya estaba armada, así que pasaba con o sin la corrección (ahora el repetido viene en el catálogo desde que carga); y la de P96, al fallar, dejaba abierto su servidor y el proceso de pruebas no terminaba nunca (ahora lo cierra siempre). Para que eso no vuelva a detener nada, las pruebas terminan aunque algo quede abierto (`--test-force-exit`) y las mutaciones cortan una prueba que pase de 5 minutos y lo dicen.
- La prueba de paginación tenía una condición que siempre pasaba (`|| true`); ahora revisa que la página 2 traiga otras filas, todas con el filtro. La de una página contaba filas; ahora revisa que viajen las que quedaron y no la que se quitó.
- Cuatro reglas no tenían ninguna comprobación y ahora la tienen: el asterisco y la leyenda de obligatorios (FRM-10; encontró que la revisión de la plantilla por pasos no decía qué significa el asterisco: ya lo dice), «Atrás» azul con flecha (FRM-35), ninguna dirección escrita en el código (FRM-59) y datos de ejemplo ficticios (FRM-76; los teléfonos del probador de la guía pasan a ceros).
- De 706 funciones del código, 71 no las recorría ninguna prueba (en 1.5.1, 84 de 593). Ahora también se prueban la lista con búsqueda y el interruptor al recuperar el borrador y el visor cuando pdf.js no carga.

**Herramientas.**
- **A3-01 · Derivados atrasados**: `verificar` reconstruía en silencio lo derivado y decía CORRECTO; un artefacto o un `pares.js` atrasados pasaban en verde. Ahora `construir.mjs --comprobar` no escribe nada: dice qué está atrasado (artefacto incluido) y falla. Se rehace con `node herramientas/construir.mjs --artefacto`. La verificación de la carpeta común también lo revisa, y `generar-reglas` cuida `guia-visual/pares.js`.
- **A3-02 · Artefacto igual en Windows y en Linux**: llevaba los saltos de línea de Windows de Leaflet y rutas con diagonal invertida, y Git lo marcaba cambiado al construir. Ya no.
- **A3-03 · Un archivo de más en un módulo**: una carpeta de `codigo/modulos` fuera del manifiesto o un archivo que el manifiesto no declara detienen la construcción.
- **A1-15 · Resumen de `verificar`**: dice cuántas pruebas corrieron, pasaron y fallaron.
- **A1-13 · Accesibilidad que fallaba de vez en cuando**: axe medía el aviso «Borrador guardado» a media transición. Ahora mide sin movimiento y con las animaciones terminadas, no tras una espera fija.
- **F2-14 · Servidores locales**: una dirección mal escrita tumbaba el de la guía y el de las pruebas; y el de las pruebas contestaba 200 antes de leer, así que una carpeta sin `index.html` lo tiraba. Ahora contestan 400 y 404.
- **F5-03 · Comprobar el formulario de un proyecto**: `node herramientas/comprobar-formulario.mjs mi-formulario.html` revisa consola, peticiones fallidas o a otros servidores, desplazamiento a cuatro anchos, axe en teléfono y escritorio, objetivos de 44 px, guiones o estilos escritos en el HTML, el resumen al enviar vacío, los catálogos que carga y `auditar-campos` (`docs/08`).
- **G2-01 · Fallas de las bibliotecas**: nada registraba lo que el estándar rodea de Leaflet, pdf.js y axe. Ahora `docs/07` tiene la tabla «Fallas conocidas y rodeos» (biblioteca, qué falla, dónde está el rodeo y cuándo se quita) y cada rodeo lleva en el código su clave `RODEO-01`…; `herramientas/rodeos.mjs` exige que coincidan (FRM-79).
- **A4-01 · Código muerto**: la clase `.acciones-fijas` (barra de acciones fija opcional, que nada usaba) y las medidas `--safe-izq` y `--safe-der` que sólo ella usaba; `.ficha[data-fuera]`; variables sin uso en `fecha` y `paginacion` y en los auditores de CSS. **Si tu proyecto usaba `.acciones-fijas`, ya no hace nada: quítala.**

**Código y muestras.**
- **A1-14 · Largo máximo y texto legible**: un texto sin formato más largo que su `maxlength` (escrito por la página o recuperado) sólo lo rechazaba el servidor, y un `<input data-legible>` sólo lo revisaba el navegador. Ahora los dos lo revisan igual.
- **F2-13 · Confirmación** (`modal`, FRM-36): la consola avisaba si `FormKit.confirma` no traía `si`, pero no si decía «Aceptar». Ahora avisa también con «Aceptar», «Confirmar», «Sí», «OK», «De acuerdo», «Continuar» o «Listo».
- **D3-01 · Catálogo de ejemplo** (`cascadas`, `combo`, FRM-76): nada avisaba si un formulario se publicaba con el catálogo ficticio. Ahora, si la página no dice ser de pruebas (franja `.entorno-pruebas` o `<html data-muestras>`), la consola lo avisa una vez. La lista de alcaldías de ejemplo también se declara ficticia.
- **D1-05 · Catálogo**: el LEEME prometía una prueba de filas completas y códigos postales de 5 dígitos que no existía. Ya existe.
- **B9-01 · Política de seguridad estricta** (FRM-70): la encuesta y la captura interna llevaban un `<script>` escrito en la página, que esa política bloquea. Su configuración pasa a `encuesta-config.js` y `captura-interna-config.js`; una prueba revisa que plantillas, ejemplos y guías no lleven guiones, estilos ni manejadores en el HTML.
- **A5-01 · Id repetido en la guía**: dos muestras usaban `n_correo2`, y el campo de la pregunta condicional quedaba sin nombre accesible. Una prueba revisa que ningún id se repita en la guía (axe no lo veía ahí: es uno de sus rodeos).
- **F5-01 · El árbol de la guía** agregaba el acuse sólo si el formulario era por pasos: uno de una página no confirmaba el envío. Ahora lo agrega siempre, salvo en una captura interna, y lo explica.
- **D1-F12 · «Empezar de nuevo»** abre la confirmación para descartar el borrador: pasa de botón secundario a botón de peligro con contorno, como todo botón que abre una acción destructiva.
- **Decisión 21 · El guinda** (FRM-39): ninguna hoja pinta de guinda un aviso, un error, el resumen, la franja o el recordatorio; una prueba lo revisa. No cambia ningún color.

**Documentos (D1-01, D1-04, D1-07, D1-08, C6-02, C6-04, F5-02, F5-04, F5-05).**
- `docs/07` y `docs/05` daban claves del mapa que el código no lee («proveedor, URL, atribución, clave»): son `teselas`, `atribucion`, `centro`, `zoom`, `gestos` y `aproximadaM`.
- Las decisiones D1 a D9 de `docs/09` quedan confirmadas por la Secretaría (decisión 16).
- Guía de estilo, guía visual, portada y hojas decían cosas distintas: el botón secundario va en Cabin 600 de 16 px, no en Roboto 500 de 14; una sola descripción de `--guinda-cl` y de `--gris`; el filete de la cabecera es dorado; los puntos de corte de 560 y 1024 px dicen lo que de verdad cambia; los iconos que pueden ir solos son los de FRM-72; `docs/08` ya no cita FRM-29 para el contraste.
- Muestras de la guía (C6-04): los títulos se pintan en Cabin aunque la etiqueta no sea un encabezado, el rótulo va en peso normal y las insignias de nivel dejan los colores de acción (guinda y azul) por grises.
- La ficha de la pregunta condicional decía que se anuncia al mostrarse; dice lo que pasa. `docs/03` atribuía al ejemplo de captura interna módulos que no carga. El manifiesto ya no hace depender la tabla de `repetibles` (sólo la de captura los necesita). `vendor.json` y el manifiesto citaban archivos con nombres viejos.
- README y skill: la copia parcial incluye `codigo/catalogos/` (sin él la lista con búsqueda queda vacía); hay que cambiar las rutas `../css/…` de la plantilla al copiarla; la configuración puede llamarse `configuracion.js`; la skill ya no dice «81 reglas», cita la CURP de ejemplo vigente y manda comprobar el formulario con `comprobar-formulario.mjs`.
- Lista de pendientes: el trato de tú o usted dice lo que hoy hace formularios; entran lo que quedó para después en 1.5.1 (reglas más simples, título del aviso de envío fallido, capturas de las piezas nuevas) y el origen de las tipografías.

**Para los proyectos.** En producción, juntar los archivos del estándar (`juntar.mjs`) y comprobar el formulario con `comprobar-formulario.mjs`; quitar `.acciones-fijas` si se usaba; cambiar «Empezar de nuevo» a `btn-peligro-contorno`; pasar a un archivo `.js` cualquier `<script>` con código escrito en la página.

**Pruebas**: 17 casos nuevos en `08-auditoria` y 4 en `06-servidor-y-herramientas` (220 en el paquete); 12 de ellos fallan con 1.6.2 y los otros 9 protegen correcciones y reglas que ya se cumplían (los comprueba `npm run mutaciones`). Más exigencias en `02`, `04`, `05` y `07`. 87 reglas.

## 1.6.2 · 2026-10-20

Quinto bloque de la auditoría del 19 oct 2026: uso y textos. Cada hallazgo lleva su clave del informe y una prueba en `08-auditoria` que falla con 1.6.1 y pasa ahora. Las decisiones de la Secretaría que aplica: «Atrás» regresa un paso (12), el consentimiento vuelve sin marcar (6c), nada en «nosotros» (13), guía en teléfono con índice fijo (14), barra fija en pantallas bajas (23), fecha igual en todo navegador (24), ubicación aproximada (25), muestras rotuladas (26) y ayudas de 14 px en el teléfono (27).

**Recorrido.**
- **C4-05 · «Atrás» del navegador** (`pasos`, FRM-02): sacaba del formulario y, al volver con «Adelante», se veía un estado mezclado. Ahora cada paso que se abre deja una entrada en el historial, con la misma dirección: «Atrás» regresa un paso y «Adelante» avanza con las reglas de «Continuar»; el «Atrás» del formulario hace lo mismo. Con el acuse a la vista, «Atrás» sale de la página. Si el navegador repone lo escrito al volver, las condiciones se ponen al día, y «Empezar de nuevo» vacía también lo que repuso (los interruptores vuelven a como venían).
- **C4-11 · Envío lento** (`pasos`, núcleo): «Atrás» seguía activo mientras se enviaba y el aviso de un envío fallido quedaba en un paso oculto. Ahora, mientras se envía, «Atrás» y la barra quedan con aria-disabled; si el aviso queda en un paso que no se ve, ese paso se abre (eventos `formkit:enviando` y `formkit:muestra`). Un segundo clic o Enter mientras se envía no repite el envío.
- **B4-04 · «Enviando…»** (núcleo, FRM-37): sólo cambiaba el texto de un botón apagado (~2.4:1). Ahora se anuncia y el botón ocupado se ve con todo su contraste.
- **C4-13 · Una página sin pantalla de límite** (plantilla, FRM-44): ahora la tiene, con «Volver al formulario».
- **C3-01 · Revisión** (`revision`, FRM-05): 17 «Editar» en el teléfono, bloques plegables abiertos y un resumen de una línea que no se entendía («Información · No»). Ahora cada bloque va abierto, con su título y un solo «Editar» que lleva a su primer campo; la bajada dice lo que se ve.
- **C2-01 · Compartir el acuse** (`acuse`, `copiar`, FRM-06 y FRM-41): compartía «Folio de mi solicitud» y la dirección del formulario, sin el folio. Ahora comparte el folio y la fecha (`data-compartir-texto` con `{folio}` y `{fecha}`); sin la hoja de compartir del equipo, copia lo mismo; sin folio, el botón no aparece.

**El borrador.**
- **C4-10 y C4-04 · Al recuperarlo** (núcleo, FRM-42): nada decía en qué paso quedó la persona ni qué no se guardó, y el foco caía en el cuerpo. Ahora un aviso a la vista recibe el foco y dice el paso («Sigues en el paso 2 de 4: «Lugar».»), lo que hay que volver a llenar (lo sensible, como el nombre y el correo) y dónde volver a agregar los archivos. «Empezar de nuevo» lleva el foco a un aviso que lo dice.
- **C4-12 · El consentimiento** (núcleo, FRM-42, decisión 6c): «Leí el aviso de privacidad» y «No soy un programa automático» volvían marcados. Ahora llevan `data-sin-borrador` y no se guardan; `auditar-campos` lo exige (regla D7).
- **C4-02 · Dos pestañas** (núcleo): la última reemplazaba el borrador de la otra sin aviso y, tras enviar en una, la otra lo volvía a crear. Ahora cada pestaña dice a la vista que la otra guardó; si la otra envía, ésta deja de guardar y avisa que enviarlo también desde ahí llegaría dos veces.
- **C2-11 · «Borrador guardado»**: aparecer movía el formulario (28 px en WebKit) y el clic al centro de «Continuar» se perdía. Ahora su renglón está reservado y sólo cambia la opacidad.

**Las sugerencias de uso frecuente** (`chips`, FRM-25).
- **C2-02 y B4-01**: al salir del campo, la fila de sugerencias crecía arriba del control y el toque siguiente caía en otro lugar (16 de 20 escenarios); con teclado, el foco se perdía al pasar por ellas o al elegir una. Ahora la fila no se rehace mientras la persona llena: la sugerencia nueva se guarda y aparece al empezar otro registro (el formulario se envió o se vació) o al volver a abrir la página; elegir una la marca en su lugar y el foco se queda en ella.

**Textos** (FRM-73, FRM-30).
- **C5-03 y C5-07 · «Nosotros» y género fijo**: «Recibimos», «no podemos», «Cuéntanos», «tomamos», «contactemos», «no pedimos», «incluida tú», «si estás seguro», «tomado de la CURP», «agregado». Ahora las acciones son de «la Secretaría» o se dicen de forma impersonal y los mensajes con dato variable no fijan el género («según la CURP»).
- **C5-05 y C5-06 · Una palabra para cada cosa**: «fuera del ámbito» pasa a «fuera de la Ciudad de México»; los archivos se «agregan» (no se «adjuntan»); «icono» sin tilde; «sólo» como adverbio. La guía de estilo (`docs/02`, sección 9) lleva la lista.
- **C5-04 · Textos escritos en el código**: «Elige una opción», «Por página», «Avance del formulario», «Copiar», «Documento» y «… por ciento» pasan a los mensajes (`cascadaElige`, `paginacionPorPagina`, `pasosBarra`, `copiarTexto`, `visorDocumento`, `progresoPorCiento`); la lista conserva el texto de la primera opción del HTML. Una prueba revisa que no quede ninguno.
- **C5-01 · Fechas a la vista**: la revisión, el anuncio de «Hoy», la ayuda de la plantilla y el mensaje de error decían AAAA-MM-DD. Ahora la persona ve día/mes/año; un campo de fecha acepta también «15/03/2026» y lo guarda como AAAA-MM-DD.
- **C5-02 · La ayuda «?» en la etiqueta**: el texto de la ayuda desplegable entraba en el error y en el resumen. Ya no.
- **C5-08 · Formatos que no orientaban**: un correo con un espacio se guardaba sin él; «ana@b..com», «ana..x@dominio.mx» y «a,b@dominio.mx» pasaban; «+52 1 55…» se rechazaba; «23/07/85» recibía un mensaje genérico. Ahora el espacio se pide quitar, lo demás se rechaza con un mensaje que dice qué revisar, el 1 de los celulares (y el 044, 045 o 01 de antes) se quita, y el año de dos cifras se pide completo. «1,234.50» ya pedía escribirse sin comas desde 1.5.2.
- **F2-11 · Apóstrofo tipográfico**: «D’Angelo», del teclado del iPhone, se rechazaba. Ahora se acepta y se guarda con apóstrofe simple.
- **C5-09 · Contador**: decía «40 / 600» y el error «van 35» con espacios repetidos. Ahora cuentan lo mismo.

**Módulos.**
- **F2-10 · Tabla**: ponía «Álvarez» y «Ñúñez» al final y ordenaba las fechas día/mes/año por día; tras cambiar de página, el encabezado decía un orden que las filas no tenían. Ahora ordena como en español, las fechas como fechas, y las filas nuevas toman el orden elegido.
- **A6-01 · Foco sobre la cabecera guinda** (`tabla`): el anillo azul daba 1.57:1. Ahí va en blanco (par N25, 7.65:1).
- **C6-01 · Lo elegido en azul** (`paginacion`, `pestanas`, guía): la página actual, la pestaña abierta y lo elegido en la guía iban en guinda, que es de la acción principal.
- **C2-06 · Pestañas que no caben**: si la lista se desliza, el borde del lado que tiene más se desvanece, y la pestaña elegida se ve completa. Las pestañas ya no anuncian nada al cargar la página (`FormKit.pestanas.elige` abre una sin anuncio).
- **G2-02, B1-03, B6-03 y B6-04 · Mapa** (FRM-49, FRM-62): «Zoom in» y «Zoom out» en inglés y de 30 px; una ubicación de 3 000 m sin decir que es aproximada; sin Leaflet, «L is not defined» en la consola y el punto del borrador perdido. Ahora «Acercar» y «Alejar» miden 44 px; una ubicación con más de 100 m de imprecisión se dice aproximada (`FORMKIT_CONFIG.mapa.aproximadaM`); el complemento de gestos ya no lleva `<script>`: su dirección va en `FORMKIT_CONFIG.mapa.gestos` y el módulo lo carga sólo si Leaflet cargó; sin Leaflet, el punto del borrador se conserva.
- **B4-06 · Visor**: la zona de hojas, enfocable, no tenía rol; ahora es una región con nombre. «Abrir en otra pestaña» ya no lleva `href="#"` antes de abrir un documento.
- **B8-02 · Fecha del acuse**: ya se armaba igual en todo navegador desde 1.6.1 («… a las 10:00»); queda dicho aquí.
- **E1-08 · Firma de WebP** (`archivos`): sólo se revisaba «RIFF» (un AVI con extensión .webp pasaba). Ahora también «WEBP».
- **Filas iniciales** (`repetibles`): las que exige el mínimo ya no se anuncian al cargar la página.

**Pantalla** (decisiones 23 y 27).
- **B4-03 · Barra fija**: en pantallas bajas tapaba más de la mitad y el margen de desplazamiento era menor que ella. Ahora el módulo de pasos mide la barra y el margen es su alto real; con menos de 500 px de alto la barra deja de ser fija.
- **Ayudas y contador a 14 px en el teléfono** (13 y 12 px desde tableta).

**Plantillas y ejemplos.**
- **C2-07 · Salidas sin destino**: «Volver al inicio» daba 404 y las migas llevaban a «#». Ahora llevan al sitio de la Secretaría (se cambia por el del proyecto).
- **C2-08 · Código postal**: iba después de alcaldía y colonia aunque su ayuda decía «Si lo escribes primero». Ahora va primero, en la plantilla y en el bloque de domicilio de la guía.
- **C2-03 y C2-10 · Captura interna**: tras guardar, el folio sólo se anunciaba y el registro no aparecía en la consulta; «Ver» y «Editar» no hacían nada. Ahora el folio queda a la vista, el registro aparece, «Ver» lo abre y «Editar» lo lleva a la captura. De paso, el buscador volvía a pintar las filas al salir de él y el clic en «Ver» se perdía (la misma falla que C2-02).
- **C6-03 · Ejemplos que contradecían las reglas**: folios y fechas sin `.mono`, estado en texto plano, «Ver» con lupa sola, asteriscos sin leyenda, «(opcional)» escrito. Corregido en la captura interna, la encuesta, las plantillas y la tabla de la guía.
- **C2-05 · Encuesta**: la barra de avance contaba la pregunta opcional. Ahora cuenta sólo las obligatorias.

**Guía visual** (decisiones 14 y 26).
- **C3-02**: en el teléfono el índice queda fijo arriba, con su letrero, y cada ficha con muestra lleva «Copiar HTML» también junto a su título.
- **C2-12**: ya no anuncia «Vista a 390 píxeles» al cargar.
- **C4-06**: recuerda el árbol de decisión, el ancho y la pestaña de los ejemplos al recargar, y el índice del teléfono cambia la dirección (#…).
- **C2-09**: «Tabla» y «Paginación» quedan en «Consulta de registros» y la ayuda desplegable con las preguntas; la ficha del select se llama «Selector de una lista corta…».
- **C2-04 y B1-05 (portada)**: el camino «Un formulario con un punto en el mapa» lleva a la ficha del mapa, y las muestras de la portada dicen que no hacen nada al tocarlas.
- **B1-04 · La guía en un solo archivo**: no encontraba pdf.js ni sus documentos de muestra. Ahora los documentos van dentro y la guía dice dónde está pdf.js (`guia-config.js`).
- El enlace «← Guía de los estándares del SIA» mide 44 px con el dedo.

**Quedan para otros bloques**: las muestras y tablas de la guía de geovisores (B1-05, B4-05 y «Fuentes» de B1-03) van con geovisores 0.1.3 (bloque 7); C6-02 y C6-04 (contradicciones de estilo entre documentos y muestras) van con los documentos (bloque 6). C3-03 (plantillas más cortas) espera una decisión y quedó en pendientes.

**Mensajes nuevos** (233 en total): `fmtCorreoUsuario`, `fmtCorreoEspacios`, `borradorRecuperadoPaso`, `borradorRecuperadoFalta`, `borradorArchivosFalta`, `borradorDescartado`, `borradorOtraPestana`, `borradorEnviadoOtraPestana`, `acuseCompartir`, `cascadaElige`, `copiarTexto`, `paginacionPorPagina`, `pasosBarra`, `progresoPorCiento`, `visorDocumento`, `mapaAcercar`, `mapaAlejar` y `mapaAproximada`. Cambian `fmtFecha`, `fmtCorreoDominio`, `envioLimite`, `enlaceMapaSin`, `enlaceMapaCentro`, `mapaFuera`, `czCpColonia`, `curpDerivado`, `cascadaCpTomado`, `cascadaTomadaCp`, `repetibleAgregado`, `chipsAgregado`, `fechaEdadCalculada`, `compartirFallo`, `obligatorioArchivos`, `archRechazoDuplicado`, `archLleno` y `archLlenoUno`.

**Reglas**: FRM-02, 04, 05, 06, 10, 15, 24, 25, 30, 34, 37, 41, 42, 44, 45, 47, 49, 62 y 73 dicen lo nuevo. `auditar-campos` agrega D7.

**Pruebas**: veinte casos nuevos en `08-auditoria` (63 en total). La prueba de anchos ya no exime enlaces ni pestañas (sólo los enlaces dentro de texto corrido).

**Qué puede cambiar un proyecto**:
- quitar el `<script>` del complemento de gestos y declarar su dirección en `FORMKIT_CONFIG.mapa.gestos`;
- poner `data-sin-borrador` en su casilla de consentimiento y en «No soy un programa automático»;
- en su acuse, `data-compartir-texto` con `{folio}` y `{fecha}`; en su plantilla de una página, la pantalla `[data-limite]`;
- cambiar sus textos en «nosotros» y sus «Volver al inicio» con `./` o `#`;
- quitar los rodeos propios para «Atrás» del navegador, el contador o el orden de la tabla.

## 1.6.1 · 2026-10-20

Cuarto bloque de la auditoría del 19 oct 2026: robustez de carga y envío. Cada hallazgo lleva su clave del informe y una prueba en `08-auditoria` que falla con 1.6.0 y pasa ahora.

**Si algo no carga, la persona lo sabe.**
- **B5-04 · Un archivo del estándar que no carga** (FRM-71, decisión de la Secretaría): por pasos, la pantalla quedaba vacía; en una página, «Enviar» mandaba el formulario a medias y se perdía lo capturado. Ahora:
  - las dos plantillas llevan escrito el aviso «La página no terminó de cargar. Recárgala…» (`[data-carga-pendiente]`), que el núcleo oculta al arrancar (por pasos, el módulo de pasos al mostrar el primero);
  - en una página, el botón de enviar es `type="button"` con `data-accion="enviar"`: sin el núcleo no envía nada.
- **B5-03 · Un módulo que falla** (núcleo): detenía a todos los demás. Ahora cada módulo arranca por su cuenta y la consola dice cuál falló.
- **B5-02 · Lista cerrada sin catálogo** (`combo`, FRM-19, decisión de la Secretaría): no había forma de elegir nada. Ahora acepta lo escrito, lo dice con un aviso a la vista y el envío lo señala en `meta.sin_catalogo`; el servidor lo acepta con una señal para revisarlo.
- **B5-10 · Sin el módulo de acuse**: tras un envío aceptado no aparecía nada y el borrador se borraba. Ahora se dice «Tu envío se recibió con el folio…».

**El envío.**
- **B5-07 · Archivos con el envío por omisión** (núcleo, FRM-44, decisión de la Secretaría): iban en JSON y llegaban vacíos. Ahora, con archivos, el envío es `multipart/form-data`: la parte `payload` lleva el JSON (cada archivo con su número de `parte`) y cada archivo va en una parte `archivo`, en orden.
- **B5-08 · Rechazo del servidor**: un error sin campo conocido se perdía, y un nombre de campo con comillas detenía todo sin avisar. Ahora los errores de un campo van junto a él y los demás, con sus palabras, en el aviso de envío.
- **B5-12 · Piezas del formulario**:
  - un aviso de envío sin `.aviso-texto` detenía el envío fallido sin avisar: ahora el núcleo lo crea;
  - sin `[data-borrador-confirma]`, «Empezar de nuevo» borraba sin preguntar: ahora pregunta con el módulo `modal`, o no borra y la consola lo dice (FRM-38);
  - `docs/06` describe `[data-borrador-fecha]`, `[data-guardado]`, `[data-carga-pendiente]` y `[data-recordatorio-texto]`.
- **B5-13 · Plazo**: un `enviar` propio que no atiende la señal dejaba el botón en «Enviando…» para siempre. Ahora el plazo vale de todos modos y corre desde que se envía, no mientras se preparan las fotos.
- **B5-06 · Ejemplo de la documentación**: el `enviar` de ejemplo mostraba un acuse vacío ante un rechazo. Ahora revisa `r.ok`, rechaza con `{errores}` y devuelve `{folio, fecha}`.
- **E3-04 · Varias fotos juntas** (`archivos`): una se rechazaba por «se superan los 25 MB» porque contaba el peso original de las que se procesaban; y si una fallaba al enviar, se enviaba sin ella. Ahora el total cuenta lo ya optimizado, y si una foto termina con error al enviar, el envío se detiene y lo dice junto al campo.

**Fechas y datos raros.**
- **B5-09 · Fechas del servidor** (`resultado`): una fecha sin hora salía un día antes y una que no era fecha dejaba la pantalla sin resultado. Ahora la primera es ese día y la segunda usa la hora de llegada (la consola lo dice).
- **B5-14 · Almacén lleno o bloqueado**: el borrador no se guardaba y nada lo decía. Ahora el renglón del borrador dice que este equipo no permite guardarlo.
- **E3-07 · Borrador alterado**: un paso fuera de rango dejaba la pantalla vacía, unas opciones que no eran lista detenían el formulario y un historial de sugerencias raro impedía arrancar. Ahora se ignora lo que no tiene forma, y un borrador con fecha en el futuro se borra.
- **E3-08 · «Hoy» después de medianoche**: con la página abierta desde antes, el día nuevo contaba como fecha futura. Ahora «Hoy» y «no futura» se calculan al momento (FRM-20).
- **E3-09 · Caracteres invisibles**: el texto admitía caracteres de control, un correo con un espacio de ancho cero pasaba y un teléfono con dígitos de ancho completo se borraba. Ahora se quitan los invisibles y esos dígitos cuentan (FRM-30).
- **E3-10 · Años sin rango**: «0100» y «9999» se aceptaban. Ahora el año va de 1900 a 2100 cuando ningún otro límite lo dice; en día/mes/año, «01/01/0100» se leía como el año «100» y pasaba.
- **E3-12 · Claves desconocidas** (servidor): 100 000 claves daban 100 000 errores. Ahora van los primeros 20 y un resumen (FRM-33).

**Archivos** (FRM-52).
- **E3-11**: doce archivos con máximo de tres daban nueve avisos a la vez; ahora es uno. Una imagen rechazada ya se puede volver a elegir sin que diga «ya adjuntaste ese mismo archivo».
- **E3-13**: 8 MB y un byte decía «pesa 8.0 MB y el máximo es 8 MB»; ahora dice «más de 8 MB».
- **F2-03**: la revisión listaba archivos rechazados que no se envían; ahora sólo lo que viaja.
- **F2-06**: si el proveedor del borrador no podía devolver los archivos, nadie se enteraba; ahora se dice.
- **F2-07**: el foco se perdía cuando terminaba de procesarse otro archivo; ahora se queda donde estaba.
- **F2-12**: un archivo quitado a medio proceso deja de ocupar memoria; soltar texto en un campo ya funciona (sólo se detiene soltar archivos fuera de la zona); sin https, la consola dice que no hay huella ni detección de duplicados.

**Módulos.**
- **F2-09 · Filas agregadas** (`repetibles`, FRM-71): los módulos no preparaban sus campos: la CURP no pasaba a mayúsculas y la ayuda «?» no abría. Ahora cada fila nueva lanza `formkit:fila` y los módulos (`identificadores`, `tooltip`, `combo`) la preparan; un módulo se activa también si su selector sólo está en la plantilla de la fila. En la guía, la muestra de grupos repetibles lleva una CURP con su ayuda.
- **F2-04 · Coordenadas sin signo menos** (`enlace-mapa`): el campo se corregía pero el mapa seguía «fuera de la Ciudad». Ahora el mapa recibe lo corregido.
- **F2-05 · Enter sobre «+» o «−»** (`mapa`): además de acercar, ponía el punto. Ahora sólo acerca o aleja.
- **B5-11 · Imagen que no carga** (`visor`): quedaba rota o en blanco, sin aviso. Ahora se dice como con un PDF.
- **F2-12, lo demás**:
  - `visor`: abrir varios PDF ya no deja vivos sus hilos de pdf.js;
  - `mapa`: si no se obtiene la ubicación, el aviso va en su propio renglón y el punto ya elegido se queda;
  - `combo`: funciona en una fila cuyo nombre lleva puntos (`personas.0.alcaldia`), y su mensaje usa la etiqueta sin la palabra «obligatorio», aunque la configuración la cambie;
  - `tabla`: dice «No hay resultados» también cuando un filtro oculta todas las filas;
  - `progreso`: sin valor, el lector oye «Cargando…» y no el porcentaje anterior;
  - `descarga`: «(se abre en otra pestaña)» se dice una vez aunque haya dos formularios.

**Código.** Los caracteres invisibles y los que invierten el texto ya no van escritos tal cual en el código (`validaciones.config.js`, `validar.mjs`, `archivos.js`): van como `\u200B`, que se ve al leer. Una prueba lo revisa.

**Guía visual**: la muestra de avisos lleva el de «La página no terminó de cargar»; la de lista con búsqueda, cómo queda si la lista no cargó; la de grupos repetibles, una CURP con ayuda «?» en cada fila.

**Mensajes nuevos** (215 en total): `envioRecibidoFolio`, `borradorSinAlmacen`, `borradorDescartarTitulo`, `borradorDescartarTexto`, `borradorDescartarSi`, `archMasDe`, `archFalloAlEnviar`, `archProveedorFallo`, `comboSinLista`, `fmtFechaAnio` y `fechaHora`. Cambia `fmtFechaDmaAnio` («entre 1900 y 2100»).

**Reglas**: FRM-19, 20, 24, 30, 33, 38, 42, 44, 49, 52, 71 y 82 dicen lo nuevo.

**Pruebas**: dieciocho casos nuevos en `08-auditoria` (43 en total) y la página de prueba `pruebas/paginas/envio.html`.

**Qué puede cambiar un proyecto**:
- agregar a su HTML el aviso `[data-carga-pendiente]` y, en una página, cambiar su botón de enviar a `type="button"`;
- si usa el envío por omisión con archivos, recibir `multipart/form-data` en su servidor;
- si su `enviar` propio rechaza, hacerlo con `{errores}`, como el ejemplo de `docs/06`;
- leer `meta.sin_catalogo` y las señales del servidor;
- quitar los rodeos propios para filas agregadas, coordenadas sin signo o el plazo del envío.

## 1.6.0 · 2026-10-20

Tercer bloque de la auditoría del 19 oct 2026: el servidor valida igual que la pantalla (FRM-33). Es versión menor porque el esquema lleva datos nuevos y `validaPayload` devuelve dos cosas más (`claves` y `archivos`). Cada hallazgo lleva su clave del informe y una prueba en `08-auditoria`.

**Lo que el servidor aceptaba y la pantalla no.**
- **A1-02 · Catálogo de la cascada**: con el catálogo como arreglo no se revisaba nada («Alcaldía Inventada» pasaba). Con dos catálogos se tomaba el primero y se rechazaban alcaldía y colonia válidas. Ahora cada select de la cascada se contrasta con el catálogo que nombra su `data-catalogo`, sea arreglo o `{filas}`, y la colonia con la alcaldía elegida. Si el servidor no recibe el catálogo, ya no acepta ni rechaza en silencio: deja una señal. La lista cerrada (combo) sin catálogo, igual.
- **A1-04 · Mínimo y máximo de opciones**: el servidor no los leía (4 intereses con máximo 3 pasaban). Ahora sí.
- **A1-05 · Periodo**: el `data-rango` que el módulo `fecha` declara al correr ya está en el esquema, y el servidor rechaza un «Hasta» anterior a «Desde».
- **A1-06 · Límites de archivos**:
  - el servidor usaba el máximo de la configuración base y no el del campo, ni su `data-total-mb`;
  - con una configuración parcial, `validaPayload` lanzaba un error.
  
  Ahora el servidor lee `data-max`, `data-mb` y `data-total-mb` del campo, y `validaPayload(…, { config: FORMKIT_CONFIG })` fusiona lo que cambia. La plantilla por pasos lleva su máximo de tres fotos en el HTML (`data-max="3"`), donde el servidor lo ve, en lugar de su configuración.
- **A1-08 · Fecha de nacimiento y edad que salen de la CURP**: el servidor aceptaba otras. Ahora la fecha declara `curp-fecha` y la edad la cruzada nueva `edad-calculada`, en la plantilla de una página y en los bloques de la guía.
- **A1-09 · Cruzadas en filas repetibles**: el servidor se las saltaba. Ahora la cruzada del patrón (`personas.#.nac`) se aplica a cada fila.
- **A1-16 · Datos de captura de una foto**: si el campo no pide `conservarExif`, la fecha y la ubicación de captura que lleguen se descartan con una señal. `validaPayload` devuelve en `archivos` las copias limpias.
- **E1-06 · Nombres de archivo**: con caracteres invisibles o que invierten el texto («recibo[U+202E]fdp.png» se lee «recibognp.pdf»), o muy largos, pasaban en los dos lados. Ahora el navegador los quita y el servidor los rechaza.

**Lo que el servidor rechazaba y la pantalla no.**
- **A1-03 · Advertencias**: una cruzada que en pantalla sólo advierte (`curp-sexo`, `curp-entidad`, `cp-colonia`) se rechazaba siempre en el servidor. Una persona trans podía llenar todo y no enviarlo nunca. Ahora el esquema toma el nivel de la configuración, como el navegador: es advertencia y deja una señal.
- **A1-07 · Extensiones y nombres largos**: el servidor no leía `data-extensiones="PDF, JPG"` con espacios ni mayúsculas. Además, un nombre de más de 120 caracteres perdía su «.pdf» al recortarse. Ahora las extensiones se leen como en el navegador y el nombre se recorta conservando la extensión.
- **B5-01 · Cascada sin catálogo**: si la lista de colonias no cargaba, el paso se bloqueaba y el servidor rechazaba la captura manual. Ahora:
  - la parte de lista va en `[data-cascada-lista]` y, sin catálogo, se oculta entera (ninguna condición la vuelve a mostrar);
  - la captura manual pide alcaldía y colonia, y el código postal se queda;
  - el esquema marca qué campos son de cada parte, y si llega la manual, el servidor exige ésa (decisión de la Secretaría).
  
  Va así en la plantilla por pasos y en los bloques de la guía.

**Datos más limpios.**
- **A1-10 · Lista cerrada** (`combo`): guardaba lo escrito («coyoacan»), que parte los conteos. Ahora, al salir del campo, queda el nombre como está en el catálogo, en pantalla y en el servidor. Si el catálogo trae una clave propia (`{nombre, valor}`), viaja en `payload.claves[campo]` y el servidor la devuelve en `claves` (decisión de la Secretaría).
- **B5-03 · Una fila rara del catálogo** (`cascadas`): un CP numérico o una fila vacía dejaban la página en blanco. Ahora la fila se omite con un aviso en la consola.

**Mensajes nuevos** (204 en total): `czEdadCalculada`.

**Reglas**: FRM-19, 21, 33, 47 y 54 dicen lo nuevo.

**Pruebas**: ocho casos nuevos en `08-auditoria` (25 en total, 161 en el paquete).

**Qué puede cambiar un proyecto**:
- pasar a `validaPayload` su configuración (`{ config: FORMKIT_CONFIG }`) y sus catálogos;
- llevar al HTML los límites de sus campos de archivos;
- envolver la parte de lista de su cascada en `[data-cascada-lista]`, poner `data-requerido` a su captura manual y dejar el código postal fuera de las dos;
- leer `claves` si su catálogo trae valores.

## 1.5.3 · 2026-10-20

Segundo bloque de la auditoría del 19 oct 2026: datos personales en el dispositivo y el paquete. Cada hallazgo lleva su clave del informe y una prueba en `08-auditoria` que falla con 1.5.2 y pasa ahora.

**Lo que se queda en el equipo.**
- **E1-01 · Plantilla de una página** (FRM-43, FRM-55): el borrador guardaba la fecha de nacimiento que sale de la CURP y el nombre y la edad de los acompañantes (posibles menores), y se restauraba solo, sin preguntar. En un equipo compartido, la siguiente persona los veía. Ahora:
  - lo que se calcula de un dato sensible (`data-deriva`) es sensible: la fecha que sale de la CURP y la edad que sale de esa fecha no van al borrador;
  - los acompañantes llevan `data-sensible` y `data-finalidad`;
  - la plantilla tiene franja de borrador: se ofrece, no se restaura sola;
  - el bloque de identificación de la guía (`b_nacimiento`) también va marcado.
  
  `inventario()` marca como sensible todo lo que no va al borrador y lista los campos de los grupos repetibles con su patrón, aunque no haya filas.
- **E1-02 · Contraseñas** (núcleo, FRM-43): una contraseña sin `data-sensible` se guardaba en claro. Ahora nunca entran al borrador las contraseñas ni los códigos (`type="password"`, formato `contrasena`, `autocomplete` `*-password`, `one-time-code`, `cc-*`), aunque el campo no lo declare.
- **E1-05 · Equipos compartidos** (núcleo, FRM-42): al abrir cualquier formulario del estándar se borran los borradores vencidos de todo el sitio, no sólo el suyo, y los que tienen fecha futura. La franja ofrece «No guardar en este equipo» (`[data-borrador="no-guardar"]`): borra el borrador y no guarda nada mientras la pestaña siga abierta (decisión de la Secretaría). El aviso de privacidad de las plantillas dice qué no guarda el borrador y cuándo se borra.
- **Auditoría de campos** (`auditar-campos`, D3, FRM-55): un dato de identidad o contacto sin `data-finalidad` ya falla, aunque no la declare (salvo un comentario «no personal: motivo»), y una contraseña sin `data-sensible`, también. Se marcaron los campos de la guía y de la plantilla que no la tenían (confirmación de correo, CURP y RFC de muestra, personas de muestra). Se anotaron como no personales la dirección y el código postal del predio y el probador de formatos.

**Fotos y archivos.**
- **E1-03 y E1-04 · Proveedor del borrador** (`archivos`, FRM-43): recibía un PNG o un WebP con su ubicación, y una foto vertical volvía girada al recuperar el borrador. Ahora recibe lo mismo que se envía: la foto ya limpia y derecha (decisión de la Secretaría). Al quitar los metadatos de un JPG también se quita lo que venga pegado después del fin de la imagen.
- **E3-05 · Foto recodificada** (`archivos`, FRM-53): viajaba como JPEG con nombre «.png». Ahora viaja como `.jpg`. Un campo que admite png o webp admite también ese JPG, en el navegador y en el servidor.

**El paquete.**
- **F4-01 y F4-02 · ZIP** (`construir.mjs`): `npm run zip` no funcionaba en Windows (usaba `zip`), borraba antes el ZIP anterior y metía todo lo que hubiera en la carpeta, aunque Git lo ignorara (llaves, notas locales, respaldos). Ahora se arma con Git (`git archive`) desde el último commit. Sólo lleva lo guardado, y dos construcciones del mismo commit dan el mismo ZIP (decisión de la Secretaría).
- **F4-04 · Huellas del paquete**: el ZIP lleva dentro `HUELLAS.sha256`, una por archivo, y junto a él su `.sha256`.
- **F4-03 · Que no se publique una llave**: el `.gitignore` cubre archivos de entorno, llaves, respaldos y el ZIP. La verificación de la raíz tiene una comprobación nueva, `herramientas/secretos.mjs`. Revisa lo guardado y lo que entraría con `git add`, por nombre y por contenido (llaves privadas, fichas de acceso de servicios comunes, contraseñas escritas).

**Datos de prueba.** La CURP de ejemplo tenía forma válida y correspondía a un nombre muy común; podía ser de una persona real. Ahora es la de «Fulano Prueba Ejemplo» (`PUEF900515HDFRJL04`), con dígito verificador válido (decisión de la Secretaría). Cambió en la guía, el probador y las pruebas.

**Mensajes nuevos** (203 en total): `borradorNoGuardar`.

**Reglas**: FRM-42, 43, 53 y 55 dicen lo nuevo.

**Pruebas**: cinco casos nuevos en `08-auditoria` (17 en total, 153 en el paquete). Corridos sobre la versión anterior, fallan los cinco. La prueba P148 de `07` espera ahora que el proveedor reciba y devuelva la foto como JPG.

**Qué puede cambiar un proyecto**:
- si copió la plantilla de una página, agrega la franja del borrador y marca a sus acompañantes;
- si tiene campos de identidad sin `data-finalidad`, `auditar-campos` se los señala;
- si usaba la CURP de ejemplo anterior en sus pruebas, cámbiala por la nueva;
- si armaba el ZIP a mano, usa `npm run zip`.

## 1.5.2 · 2026-10-20

Primer bloque de la auditoría profesional del 19 oct 2026 (informe fuera del repositorio): lo que perdía o falseaba datos. Cada hallazgo lleva su clave del informe y una prueba en `08-auditoria` que falla con 1.5.1 y pasa ahora.

**Datos que se perdían.**
- **E3-01 · Grupos repetibles** (`repetibles`, FRM-22): la fila nueva tomaba el número de la cantidad de filas. Si la persona quitaba una de en medio y agregaba otra, dos filas quedaban con el mismo nombre y el mismo id, una no se enviaba ni se validaba, y aun así salía el acuse. Ahora el número de una fila no se reutiliza. El borrador guarda qué filas había y, al recuperarlo, las rehace antes de reponer los valores.
- **F2-08 · Repetibles en el borrador** (`repetibles`): ahora vuelven también los Sí/No y las casillas de cada fila. El módulo se suscribe con `ctx.alBorrador({ estado, prepara })` (dos acciones nuevas del núcleo) y deja de pisar el gancho `estadoBorrador`; antes, con `pasos` cargado primero, el borrador perdía el paso. El `#` de la plantilla de filas ya no rompe referencias como `href="#i-ayuda"`.
- **E3-02 · Borrador con más filas que el máximo** (`repetibles`): si un proyecto bajaba `data-max`, el borrador anterior congelaba la página en cada visita. Ahora se rehacen sólo las filas que caben.
- **C4-01 · Franja del borrador** (núcleo, FRM-42): si la persona escribía antes de elegir «Recuperar» o «Empezar de nuevo», el borrador guardado se reemplazaba. Ahora, mientras la franja espera, no se guarda nada (decisión de la Secretaría).
- **C4-07 · El acuse sobrevive a una recarga** (`acuse`, FRM-06): al recargar, la persona perdía su folio. Ahora el folio y la fecha (no sus datos) se guardan en el dispositivo y se vuelven a mostrar durante `acuse.horasVisible` (24 horas; configuración nueva). El botón nuevo `[data-acuse-nuevo]` («Llenar otra solicitud», «Hacer otro registro») lo olvida y abre el formulario vacío. Va en las dos plantillas (decisión de la Secretaría).
- **C4-08 · Captura en serie** (núcleo, FRM-44): en un formulario que sigue en pantalla después de enviar, el segundo registro llevaba la misma clave de idempotencia y ya no guardaba borrador. Ahora, tras un envío logrado, la clave se renueva y el siguiente gesto de la persona empieza otro registro.
- **F2-02 · Punto del mapa** (`mapa`, FRM-05 y FRM-49): «Revisa antes de enviar» mostraba un punto sin confirmar que no se enviaba, y al recuperar el borrador el punto confirmado se perdía. Ahora la revisión dice «sin confirmar: no se envía» y el borrador recupera el punto confirmado. Sin Leaflet, recuperar el borrador ya no falla.

**Datos falsos.**
- **F2-01 · «1,500»** (formato `numero`, FRM-30): se guardaba como 1.5, en pantalla y en el servidor. Ahora una coma que agrupa miles pide «Escribe el número sin comas, por ejemplo 1500»; «12,5» se sigue leyendo como 12.5 (decisión de la Secretaría).
- **A1-01 · Edad con fecha día/mes/año** (cruzadas `edad` y `rango-fechas`, FRM-20): con el bloque «Fecha de nacimiento» de la guía, la edad mínima no se aplicaba nunca y un periodo día/mes/año se comparaba como texto. Ahora las dos cruzadas leen la fecha en cualquiera de los dos formatos, en el navegador y en el servidor.
- **E3-06 · Fecha AAAA-MM-DD en una fecha día/mes/año** (`fecha`): pegada o del autocompletado se leía como «19/08/5072», y «Hoy» escribía «20/02/6101». Ahora se pasa a día/mes/año.

**Pantalla y envío.**
- **B1-01 · Campo condicional dentro de un renglón** (`nucleo.css`, FRM-07, decisión C9): `.fila > .campo` le ganaba a `[hidden]`. La colonia oculta seguía a la vista y lo que se elegía ahí no se enviaba. Ahora lleva `:not([hidden])`.
- **B5-05 · Envío recibido** (núcleo, FRM-44): un 2xx sin JSON (204, «OK»), una respuesta `null` o un `alEnviar` que fallaba decían «No se pudo enviar», y el borrador ya se había borrado. Ahora un 2xx es un envío recibido. Si lo que la página hace después falla, se ve «Tu envío se recibió. No lo envíes de nuevo.». El borrador se borra después de mostrar el acuse.
- **E3-03 · Textos enormes** (`fecha-dma`, `enlace-mapa`, servidor; FRM-30 y FRM-33): una fecha con muchos espacios tardaba con el cuadrado del largo (100 000 espacios: hasta 15 s en el servidor). Ahora una fecha de más de 20 caracteres no se prueba, los separadores no se traslapan, el par de coordenadas no pasa de 80 caracteres y el servidor revisa `maxlength` antes de normalizar. 1 MB tarda menos de 100 ms.
- **De paso, en el acuse** (`acuse`): sin folio, el acuse lo dice con palabras («No llegó el folio…»); sin fecha válida, usa la hora en que llegó (B5-09). Mientras se ve el acuse o el límite, no se ven la barra de pasos, la franja del borrador ni el aviso de guardado (C4-03, C4-09). Al volver de la pantalla de límite, el foco va al título del paso abierto, no al del paso 1 (C4-04).

**Mensajes nuevos** (202 en total): `fmtNumeroMiles`, `envioRecibido`, `acuseSinFolio`, `mapaSinConfirmar`.

**Reglas**: FRM-05, 06, 07, 20, 22, 30, 33, 42, 44 y 49 dicen lo nuevo.

**Guía**: la muestra «Superficie» dice cómo escribir decimales; las fichas de `repetibles` y `acuse` describen el comportamiento nuevo; el acuse se ve en las plantillas.

**Pruebas**: archivo nuevo `08-auditoria` con 12 pruebas (148 en total) sobre una página nueva (`pruebas/paginas/auditoria.html`). Corridas sobre 1.5.1, fallan las 12; la de textos enormes tardó 494 s.

**Qué puede quitar un proyecto**: cualquier rodeo propio para los repetibles, para «1,500», para la edad con fecha día/mes/año o para un `alEnviar` que leía `null`. Las plantillas copiadas necesitan el botón `[data-acuse-nuevo]` en su acuse.

## 1.5.1 · 2026-10-18

Auditoría completa del estándar, sin hallazgos nuevos de un proyecto. Busca dos cosas: que el estándar sea general para cualquier formulario sin importar su tema, y que código, reglas y documentación digan lo mismo.

**Que sea general.** Se quitaron de las muestras de la guía, de los ejemplos de contrato y de la documentación los textos de un solo tema que venían del proyecto de acreditaciones:
- cursos de poda y dictamen;
- medidas de árboles;
- un catálogo de especies de árboles, que pasa a ser de ocupaciones;
- examen, dictamen y «bandeja».

El mensaje de edad mínima ya no impone que llene el formulario la madre, el padre o el tutor; el formulario que tenga esa ruta lo dice en sus mensajes. Los comentarios del código ya no citan números de hallazgos de un proyecto.

**Privacidad.** El proveedor del borrador (1.5.0) recibía la foto original, con su ubicación, aunque el formulario no pidiera `conservarExif`. Ahora recibe el archivo como lo eligió la persona: un JPG, sin metadatos. Prueba nueva en `07`.

**Textos configurables.** Cuarenta y cuatro textos seguían escritos en el código de los módulos, así que un formulario que habla de usted no podía cambiarlos. Pasan a `mensajes` (198 en total). Son de los módulos `archivos`, `copiar`, `descarga`, `enlace-mapa`, `fecha`, `identificadores`, `cascadas`, `chips`, `mapa`, `progreso`, `repetibles`, `pestanas` y `paginacion`, y la frase de borrador recuperado. El servidor usa los mismos mensajes de longitud mínima y de coordenadas fuera de rango. Se retiran tres textos sin uso: `mapaSinPunto`, `sesionExpira` (no hay pieza de sesión, así que prometía algo que no existe) y `curp.sexos`.

**Comportamiento.**
- `repetibles` confirma con el módulo `modal` («Quitar fila N», foco en «Volver sin cambios»), nunca con `window.confirm`.
- En la franja del borrador, «Recuperar borrador» pasa a secundario (un solo botón guinda por pantalla). «Empezar de nuevo» lleva el foco a «Conservar», no al botón que borra, y ese botón dice «Descartar borrador».
- El aviso del visor lleva el icono de su tono.
- El periodo de fechas se anuncia en día/mes/año.
- La falla de la ubicación del dispositivo en el mapa se ve en pantalla.
- El ejemplo de captura interna confirma con consecuencias y el verbo completo.

**Reglas.**
- Se resolvieron contradicciones: cuándo se mueve el foco (FRM-03 y FRM-40), un botón relleno por pantalla y por diálogo (FRM-34), qué se confirma y qué no (FRM-38), la franja del borrador tal como es (FRM-42), y lo que puede llevar el borrador del dispositivo y el proveedor (FRM-43 y FRM-54).
- Se corrigió lo que no coincidía con el código (FRM-12, 33, 36, 44, 49, 50, 58, 71, 77 a 80) y la redacción de un solo tema (FRM-05, 10, 24, 25, 53, 57, 73, 83, 84, 85).
- FRM-57 (anonimato) y FRM-83 (etiquetas de estado) pasan a OPCIONAL, porque aplican sólo cuando el trámite admite anonimato o la pantalla muestra estados.
- El índice de `docs/01` lista los tramos de cada sección.

**Documentación.**
- Conteos al día: 30 módulos, 86 reglas, 76 pares, 30 iconos, A01 a A11 y A13 a A16.
- pdf.js en las listas de bibliotecas.
- La guía de decisión ya incluye resultado, estado, secuencia, avisos, `data-contexto`, texto corrido y el proveedor de archivos.
- La guía de estilo se corrigió: pesos de los títulos, rótulo, `--guinda-cl` y `--gris`, puntos de corte, el icono `archivo` y una sección de botones y avisos.
- La trazabilidad tiene los módulos nuevos. Los encabezados de los módulos describen su contrato actual.
- Las bajadas largas de las tres guías usan `.texto-corrido`.
- Se regeneraron las 41 capturas de evidencia.

**Pruebas**: una nueva en `07-correcciones` (42 en total); las de confirmación esperan «Volver sin cambios».

**Queda para después** (en `guia-visual/pendientes.js` no hay cambios): dividir las reglas muy cargadas (FRM-24, FRM-30, FRM-39, FRM-43, FRM-44) en reglas más simples; poner título a los avisos de envío fallido; capturas de las piezas nuevas (resultado, estado, visor).

## 1.5.0 · 2026-10-18

Cuatro hallazgos de la auditoría completa del sistema de acreditaciones del 18 oct. El borrador gana un proveedor de archivos, por eso es versión menor.

- **P145 · La tabla no parte botones, folios ni fechas** (módulo `tabla`, FRM-24): `.tabla-valor` llevaba `overflow-wrap: anywhere`, así que en computadora una columna se encogía hasta partir palabras dentro de botones, folios y fechas («Revisa / r», «Abr / ir», «10/10/20 / 26»). Ahora es `break-word`: una palabra se parte sólo si no cabe en su renglón. En computadora, `.btn`, `.btn-enlace` y `.mono` de la tabla no se parten, y la columna de acciones (la de encabezado sólo para el lector) toma el ancho de sus botones. El folio va en `<span class="mono">`. El proyecto puede quitar de `apd.css` sus reglas de `.tabla-bandeja .tabla-valor`, `.mono`, `.btn` y `.btn-enlace`.
- **P146 · Un solo «Hoja 1 de 2» en el visor** (módulo `visor`, FRM-24): el contador aparecía en la barra y otra vez debajo de cada hoja. Ahora va sólo en la barra; al lector se lo sigue diciendo el nombre de cada hoja.
- **P147 · Rótulos como en la ficha** (módulos `tabla` y `revision`, FRM-24 y FRM-05): en la tarjeta del teléfono y en «Revisa antes de enviar» el rótulo iba en negritas, y en la revisión, sobre fondo gris. Ahora, como en la ficha, el rótulo va en gris y peso normal, sin fondo, y el dato destaca (semi negritas). En la tabla de computadora el dato sigue en peso normal.
- **P148 · Borrador que empieza con la persona y archivos con proveedor** (núcleo y módulo `archivos`, FRM-42 y FRM-43): el borrador guardaba también lo que la página escribía al precargar una solicitud, como si lo hubiera capturado la persona, y no conservaba los archivos. Ahora el borrador empieza con el primer gesto de la persona en el formulario (un evento confiable: escribir, elegir, tocar, soltar un archivo); lo que la página escriba antes no lo crea. Los archivos siguen fuera del almacén del dispositivo, pero la página puede dar un proveedor: `FormKit.iniciar(form, { borradorArchivos: { guarda(campo, archivos), lee(campo), borra(campo) } })`. Al escribir el borrador recibe los archivos originales, al recuperarlo los devuelve y al descartarlo o enviar se le avisa. Los módulos se suscriben con `ctx.alBorrador`. El proyecto puede quitar su borrador propio de `app/solicitud.js` y pasar su almacén de documentos como proveedor.

**Pruebas**: cuatro casos nuevos en `07-correcciones` (41 en total), con una página nueva que precarga una solicitud y guarda sus documentos con un proveedor (`pruebas/paginas/borrador.html`).

## 1.4.4 · 2026-10-18

Dos hallazgos de la revisión de pantallas del sistema de acreditaciones del 18 oct. 86 reglas (FRM-86 nueva).

- **P134 · El límite de 70 caracteres es sólo del texto corrido** (núcleo, FRM-86 nueva): `.bajada` y `.ayuda-bloque` llevaban `max-width: 70ch`. En una tarjeta ancha, una bajada de una oración o una línea de datos pasaba al segundo renglón aunque sobrara espacio, y se leía como dos cosas distintas. Ahora ocupan el ancho de su tarjeta. El límite de lectura queda en la clase nueva `.texto-corrido`, para varios párrafos que se leen de seguido. Para las líneas de datos (folio · fechas · revisión) hay `.linea-datos` con cada dato en `.linea-datos-item`, que no se parte: si no cabe, pasa completo al renglón siguiente. El proyecto puede quitar de `apd.css` su `max-width: none` y cambiar `APD.meta` por este marcado.
- **P135 · Motivos frecuentes completos y sin parecer elegidos** (módulo `chips`, FRM-25): los chips fijos tenían un ancho máximo de 240 px y se encogían en la fila, así que un motivo largo («No coincide con el nombre de la cuenta») se partía en dos renglones. Ahora no se encogen (si no caben, pasan completos al renglón siguiente) y sólo se parten si son más largos que la fila entera. Al pasar el cursor sólo cambia el borde: el fondo azul queda para la respuesta elegida. El proyecto puede quitar sus reglas de `.chip-fijo` en `apd.css`.

**Pruebas**: dos casos nuevos en `07-correcciones` (37 en total). La muestra de chips de la guía suma un motivo largo y hay un par «sí y no» de la línea de datos.

## 1.4.3 · 2026-10-18

- **P127 (ajuste, decisión de la Secretaría)** (módulo `archivos`, FRM-53): una foto a la que no se le pueden quitar los metadatos ya no se rechaza; se agrega como está, aunque lleve su ubicación. Lo demás de la 1.4.2 sigue: sin `conservarExif` la foto viaja siempre recodificada y sin EXIF, y si no se puede recodificar, al JPG se le quitan los metadatos. Sólo queda con metadatos una imagen que no es JPG y que el navegador no pudo recodificar, un caso raro. Se retira el mensaje `archRechazoExif` (156 mensajes).

## 1.4.2 · 2026-10-18

Seis hallazgos del sistema de acreditaciones: su auditoría integral del 17 oct (P127 a P130) y su paso a la 1.4.1 (P126 y P131). 85 reglas (FRM-85 nueva).

- **P126 · Una etiqueta de estado larga se parte en renglones** (módulo `estado`, FRM-83): llevaba `white-space: nowrap`, así que en teléfono una etiqueta larga ensanchaba su tarjeta o su tabla más allá de la pantalla. Ahora se parte, con `max-width: 100%`. Sólo dentro de una `.tabla` en computadora (desde 760 px) va en una línea. El proyecto puede quitar sus reglas de `.estado` y `.tabla-bandeja .estado` en `apd.css`.
- **P127 · La ubicación de una foto ya no se cuela** (módulo `archivos`, FRM-53): la versión recodificada, sin EXIF, sólo se usaba si pesaba menos que la original. Si la foto ya venía comprimida o no se podía recodificar, viajaba la original con su EXIF y su ubicación GPS aunque `conservarExif` fuera falso. Ahora, sin `conservarExif`, la foto viaja siempre recodificada, aunque pese más. Si no se puede recodificar, al JPG se le quitan los metadatos (EXIF, XMP e IPTC) y otra imagen no se agrega, con su motivo (mensaje `archRechazoExif`, 157 en total).
- **P128 · Fechas en 24 horas** (núcleo, acuse y resultado; FRM-06 y FRM-42): la fecha del acuse y la del borrador salían en 12 horas con «p.m.». Ahora una sola función, `FormKit.utilidades.fechaHora`, las escribe en la zona de la Ciudad y en 24 horas («17 de octubre de 2026 a las 23:27»). El resultado usa el mismo reloj. Con `FORMKIT_CONFIG.fechas.horas24 = false` vuelven las 12 horas. El borrador ya usa también la zona de la Ciudad.
- **P129 · El RFC conserva la Ñ** (formato `rfc`, FRM-30): al quitar los acentos se quitaba también la tilde de la Ñ, y un RFC con Ñ se guardaba con N, sin aviso, en el navegador y en el servidor. Ahora se quitan los acentos y la Ñ se queda, también si llega descompuesta. Caso nuevo en el probador de la guía.
- **P130 · Logotipo ligero** (FRM-85 nueva): `logotipo-sedema.png` medía 3829 px de ancho (110 KB) para mostrarse a 48 px de alto. Ahora mide 477 × 96 px, el doble de lo que se muestra (27 KB). Los `<img>` de las plantillas, los ejemplos y las tres guías dicen su tamaño real. El original quedó fuera del paquete.
- **P131 · `FormKit.aviso` con pasos y enlaces** (núcleo, FRM-39 y FRM-84): sólo recibía texto, y armaba el cuerpo como `span.aviso-texto`, donde una lista no es válida. Ahora el cuerpo es `div.aviso-texto`, `texto` puede ser un nodo (un párrafo con un enlace) y `pasos` pone la secuencia «qué sigue». Un `<p class="aviso">` que se le pase se cambia por un `<div>` con sus mismos atributos. El proyecto puede quitar `APD.aviso`.

**Pruebas**: cuatro casos nuevos en `07-correcciones` (35 en total) y dos en `06` (RFC con Ñ y tamaño del logotipo).

## 1.4.1 · 2026-10-17

Dos hallazgos más del sistema de acreditaciones: P118 completo (con las familias que propuso el proyecto) y P119. 84 reglas (FRM-84 nueva) y 30 iconos (`archivo`, nuevo).

- **P118 · Las etiquetas de estado, en las cinco familias del proyecto** (módulo `estado`, FRM-83): la 1.4.0 tenía un tono gris «borrador». Ahora son las familias que el proyecto ya probó, según a quién le toca qué: hecho (`estado-ok`, verde), te toca actuar (`estado-atencion`, ámbar, también un borrador sin enviar), en marcha (`estado-proceso`, azul), cerrado sin éxito (`estado-rechazo`, rojo) y terminado (`estado-terminado`, gris, con el icono nuevo `archivo`). `estado-borrador` deja de existir. Una etiqueta sin familia se avisa en la consola. El módulo `resultado` usa las mismas cinco: su tono `neutro` pasa a `terminado` y se suma `proceso` (pares N23 y N24).
- **P119 · La secuencia «qué sigue» sirve en cualquier pantalla** (núcleo, FRM-84 nueva): sólo existía dentro del acuse (centrada, con su ancho y su filete). Un resultado del personal, un aviso o la ficha de un trámite con varias acciones en orden terminaban encadenándolas en un párrafo. `.secuencia` y `.secuencia-item` pasan al núcleo; el acuse sólo las centra y les pone su filete. `FormKit.resultado` recibe `pasos` y los pone como secuencia «Qué sigue» (mensaje `resultadoQueSigue`, 156 en total). La guía muestra un aviso con una secuencia y un par «sí y no». El proyecto puede convertir sus párrafos de pasos en `<ol class="secuencia">`.

**Pruebas**: un caso nuevo en `07-correcciones` (31 en total) y el de las etiquetas, con las cinco familias.

## 1.4.0 · 2026-10-17

Seis hallazgos del sistema de acreditaciones al revisar sus avisos y confirmaciones. Trae dos módulos nuevos, «resultado» y «estado», por eso es versión menor. 30 módulos y 83 reglas (FRM-82 y FRM-83 nuevas).

- **P113 · Confirmación con consecuencias y resultado de una decisión** (módulos `modal` y `resultado`, FRM-38 y FRM-82 nueva): `FormKit.confirma` preguntaba igual para guardar una nota que para cerrar un trámite. Ahora recibe `consecuencias` (lista de lo que pasará) e `irreversible` («No se puede deshacer.», con su icono), las dos dentro de la descripción que oye el lector. «Volver sin cambios» es la salida por omisión. La consola avisa si el botón no repite el verbo. El foco inicial ya iba a la opción segura; ahora una prueba lo comprueba. El módulo nuevo `resultado` (`FormKit.resultado`) muestra el desenlace para el personal: un título con el resultado, «Quedó guardado a las HH:MM · quien» en la hora de la Ciudad (con la fecha si no fue hoy), el motivo citado tal cual y la acción para seguir. Además oculta el panel de decisión y lleva el foco al título. El proyecto puede quitar `APD.pintaDesenlace` y `APD.confirma`.
- **P114 · Botón de peligro relleno** (núcleo, FRM-34): `.btn-peligro` pasa a rojo relleno con texto blanco (pares C42 y C43), para el botón que hace el daño dentro de su confirmación. Variante nueva `.btn-peligro-contorno` (la de antes) para el botón que la abre. Los sistemas que usaban `.btn-peligro` fuera de una confirmación lo cambian a `.btn-peligro-contorno`. El proyecto puede quitar su regla de `.btn-peligro` en `apd.css`.
- **P115 · Avisos con título e icono por tono** (núcleo, FRM-39): `.aviso-titulo` (en su propio renglón) dice de un vistazo si algo salió bien, quedó pendiente o se rechazó. El icono de su tono va siempre. `FormKit.aviso(lugar, { tono, titulo, texto, foco })` lo pinta con su icono y su rol, y recibe el foco cuando responde a una acción. El proyecto puede quitar `APD.aviso`.
- **P116 · Resumen de errores con contexto** (núcleo, FRM-28): `data-contexto` en el campo o en un elemento que lo rodea pone de cuál se trata antes de cada mensaje («Identificación oficial: …»). Los títulos hablan de respuestas, no de campos («Para continuar, revisa 2 respuestas.»). Cuando rechaza el servidor, el título lo dice («No se pudo enviar: revisa 1 respuesta.», mensajes `resumenServidorUno` y `resumenServidorVarios`). El proyecto puede quitar sus `span.contexto-resumen` y sus `resumenUno`/`resumenVarios` propios.
- **P117 · Todo anuncio también se ve** (núcleo, FRM-40): `FormKit.anuncia(texto, { visible: elemento })` escribe el texto en ese elemento, lo muestra y lo anuncia. El segundo argumento `true` sigue valiendo. Tres piezas del estándar que sólo se oían ya se ven: el límite de filas de `repetibles` (al tocar «Agregar» con el máximo, ahora dice por qué), el campo de `archivos` lleno y la descarga que falla. Los textos de `descarga` pasan a `mensajes`.
- **P118 · Etiquetas de estado** (módulo `estado` nuevo, FRM-83 nueva): cinco tonos con significado fijo, cada uno con su icono: borrador, proceso, atención, ok y rechazo. Texto de 4.5:1 o más (pares C45 a C49). El icono lo pone el módulo; `FormKit.estado(el, { tono, texto, anuncia })` lo cambia. El proyecto pasa sus nueve tonos a estos cinco y quita los suyos de `apd.css`.

Mensajes nuevos (155 en total): `resumenServidorUno`, `resumenServidorVarios`, `resumenContexto`, `confirmaTitulo`, `confirmaSi`, `confirmaNo`, `confirmaConsecuencias`, `confirmaIrreversible`, `resultadoHora`, `resultadoFechaHora`, `resultadoMotivo`, `descargaPreparando`, `descargaLista` y `descargaError`. Cambian `resumenUno` y `resumenVarios`.

**Pruebas**: seis casos nuevos en `07-correcciones` (30 en total), sobre una página nueva de revisión documental (`pruebas/paginas/desenlace.html`). El de archivos llenos (P71) comprueba también la frase visible.

## 1.3.4 · 2026-10-17

Tres hallazgos del sistema de acreditaciones (sus pantallas de grupos y su configuración en «usted»). P110 y P111 son los que el proyecto registró primero como P106 y P107.

- **P110 · La tabla se inicia sola y vuelve a leer sus encabezados** (módulo `tabla`, FRM-24 y FRM-71): sólo se iniciaba cuando la página iniciaba un formulario, así que en una página de pura consulta las celdas no mostraban su encabezado en teléfono. Además leía los encabezados una sola vez: si el formulario arrancaba antes de que la página pintara un encabezado calculado, el rótulo quedaba vacío. Ahora la tabla se inicia sola al cargar la página, haya o no formulario. Con `formkit:tabla` vuelve a leer los encabezados actuales y prepara el orden de las columnas que ya tienen texto. Los rótulos que pone el módulo llevan `data-etiqueta-auto`; los escritos en el HTML no se tocan. `FormKit.tabla.inicia()` sirve para tablas agregadas después. El anuncio «Ordenado por…» pasa a `mensajes` (`tablaOrdenada`). El proyecto puede quitar el `data-etiqueta` que pone a mano en «Grupos».
- **P111 · Un formulario se inicia una sola vez** (núcleo, FRM-71): `FormKit.iniciar` no revisaba si el formulario ya estaba iniciado. Un formulario que arrancaba solo al cargar y que la página volvía a iniciar con sus opciones quedaba con los escuchas duplicados (un clic, dos envíos). Ahora la segunda llamada le suma las opciones nuevas (por ejemplo `enviar`) y devuelve la misma instancia. `data-formkit="manual"`, que no arranca solo, queda documentado en `docs/06`. El proyecto puede seguir usándolo, aunque ya no hace falta. De paso, lo que un módulo agrega a las opciones (el acuse agrega su `alEnviar`) queda en ese formulario y ya no cambia el `FORMKIT_OPCIONES` de la página; el acuse llama al `alEnviar` y al `alFallar` de la página que haya en el momento del envío.
- **P112 · La fecha del mensaje de límite en día/mes/año** (formato `fecha`, FRM-30): «La fecha no puede ser anterior al 2026-10-21» mostraba el `min` y el `max` tal como se escriben en el HTML. Ahora dice «anterior al 21/10/2026», como ya lo hacía el formato `fecha-dma`. El proyecto puede quitar la conversión de la fecha en sus mensajes (`app/config-usted.js`).

**Pruebas**: dos casos nuevos en `07-correcciones` (24 en total), uno en `06` (28) y una página de prueba sin formulario (`pruebas/paginas/consulta.html`).

## 1.3.3 · 2026-10-17

Cinco hallazgos más del sistema de acreditaciones (su documento de hallazgos abiertos del 17 oct y la auditoría visual de ese día), más el nombre propuesto para P97.

- **P90 · El esquema lee sólo el `<form>`** (`esquema-desde-html.mjs`, FRM-33): leía toda la página, así que un control fuera del formulario (la casilla «Marcarla para revisar» de un examen) se tomaba como parte del último campo y lo volvía «casilla». Ahora sólo cuenta lo que está dentro de los `<form>`; sin `<form>`, toda la página. El proyecto puede quitar de `probar-esquemas.mjs` la extracción del `<form>`.
- **P99 · La lista con búsqueda no se abre sola** (módulo `combo`, FRM-19): se abría y anunciaba con cualquier cambio de valor, también cuando la página llenaba el campo al retomar un borrador, y la lista tapaba la pregunta siguiente. Ahora sólo se abre cuando la persona escribe en el campo. Su texto «No está en la lista…» pasa a `mensajes` (`comboLibre`). El proyecto puede quitar el cierre de la lista en `APD.avisa`.
- **P102 · Cabecera, contenido y pie alineados**: `.pagina` pone su margen lateral por dentro del ancho de página y la cabecera y el pie por fuera, así que en computadora el logotipo, el título y el pie empezaban antes que el contenido. Token nuevo `--ancho-contenido` (el ancho de página menos los dos márgenes) para `.cabecera-int` y `.pie-int`. El proyecto puede quitar sus reglas de `.cabecera-int` y `.pie-int` en `apd.css`.
- **P103 · Tabla en computadora** (módulo `tabla`, FRM-24): la última celda conserva la línea de la fila (la regla que la quitaba era para las tarjetas del teléfono) y el contenido va centrado en vertical, alineando los botones con el texto.
- **P104 · Tabla en teléfono** (módulo `tabla`, FRM-24): cada celda es una rejilla fija rótulo | valor. El módulo pone el contenido de la celda en `.tabla-valor`, así un valor largo se parte en renglones a la derecha de su rótulo en lugar de bajar entero, también en celdas con varios elementos. Sin rótulo (acciones), el valor ocupa toda la tarjeta.
- **P97 (complemento)**: además del nombre automático de la 1.3.2, `data-chips-etiqueta` cambia la parte de la etiqueta en el nombre del grupo, como propuso el proyecto («Motivos frecuentes para Identificación oficial», con `mensajes.chipsFijos` = «Motivos frecuentes para {etiqueta}»).

**Pruebas**: tres casos nuevos en `07-correcciones` (22 en total) y uno en `06` (27).

## 1.3.2 · 2026-10-17

Cuatro hallazgos del sistema de acreditaciones al pasar a la 1.3.1.

- **P95 · Los mensajes de los formatos y de las cruzadas se cambian con la configuración** (FRM-11): estaban escritos dentro de cada formato, así que un sistema que habla de usted no podía cambiarlos con `FORMKIT_CONFIG.mensajes`. Ahora los 44 textos de formatos (`fmt…`, 37) y cruzadas (`cz…`, 7) viven en `mensajes`, con la misma redacción de antes (137 mensajes en total), y cada formato y cada cruzada reciben la configuración del formulario. En el servidor, `validaPayload(…, { mensajes })` los cambia sin pasar toda la configuración. El mismo defecto dejaba sin efecto, en los formatos, dos ajustes documentados: el ámbito del código postal y de las coordenadas (`ambito`) y el dígito verificador de la CURP (`curp.verificarDigito`). Ya se leen de la configuración del formulario.
- **P96 · El visor encuentra pdf.js en la copia del proyecto** (módulo `visor`, FRM-24): sólo lo deducía si el estándar estaba en `codigo/` o `dist/`. Ahora lo busca en `vendor/pdfjs-dist/`, junto a la carpeta que contiene `modulos/` (`sitio/formkit/` → `sitio/vendor/pdfjs-dist/`). Si no lo encuentra, avisa en la consola dónde lo buscó y que se indica con `FORMKIT_CONFIG.visor.pdfjs`.
- **P97 · Grupos de respuestas frecuentes con nombre distinto** (módulo `chips`, FRM-25): si varios campos comparten etiqueta, a cada grupo se le agrega el título de su sección (por ejemplo, «Respuestas frecuentes para ¿qué debe corregir?, Identificación oficial») o, si no hay, su número de orden. `data-chips-fijos-nombre` le da un nombre propio.
- **P98 · Cada «Mostrar» dice de qué campo es** (núcleo, FRM-30): el lector de pantalla oía «Mostrar la contraseña» en los dos botones de «Crea tu cuenta». Ahora oye «Mostrar: Contraseña» y «Mostrar: Confirma tu contraseña» (mensaje `contrasenaLector`).

**Pruebas**: dos casos nuevos en `07-correcciones` (19 en total); la página de prueba suma una confirmación de contraseña, dos campos de motivos con la misma etiqueta y un mensaje en «usted».

## 1.3.1 · 2026-10-17

Dos hallazgos más del sistema de acreditaciones (su versión 0.29, «Crear cuenta» y «Mi perfil»).

- **P86 · Errores del servidor junto a su campo**: ya estaba resuelto desde la 1.1.0 (P41). El proyecto lo encontró porque sigue con la copia 1.0.0; al actualizar puede quitar `APD.pintaErrores`.
- **P87 · El aviso de un envío fallido ya no se oculta con el foco** (núcleo, FRM-44): se ocultaba en cuanto otro elemento recibía el foco, así que al pulsar un botón de abajo el aviso desaparecía, el botón subía a media pulsación y el clic se perdía. Ahora se queda hasta que la persona cambia un dato o vuelve a enviar. El proyecto puede dejar de evitar que «Cancelar» mueva el foco. Prueba nueva en `07` (17 en total), que con el código anterior fallaba.

## 1.3.0 · 2026-10-17

Dos hallazgos más del sistema de acreditaciones (su versión 0.27, cotejo de documentos). Trae un formato nuevo, por eso es versión menor. El proyecto puede quitar `app/folio-fiscal.js` y, si lo desea, los `div` que envolvían cada sección condicional de `cotejo.html`.

- **P81 · Condiciones en cualquier elemento** (`esquema-desde-html.mjs`, FRM-07): ya estaba resuelto desde la 1.1.0. Al corregir P38, el esquema empezó a leer las condiciones de todas las etiquetas abiertas que rodean al campo (`section`, `article`, `fieldset`, no sólo `div`), y el servidor las exige todas. El proyecto lo encontró con una copia anterior. Lo que seguía mal era la documentación: `docs/06` decía «en un `div` que agrupa varias»; ahora dice «en cualquier elemento». Prueba nueva en `06` con una `<section data-si>` y un `<article data-si>` dentro de ella.
- **P82 · Formato «folio-fiscal»** (FRM-30): el folio fiscal (UUID) de una factura, 32 dígitos hexadecimales en grupos 8-4-4-4-12 (36 caracteres). Se acepta en minúsculas, sin guiones o con espacios alrededor, y se guarda en mayúsculas con guiones, igual en el navegador y en el servidor. Comprueba la forma, no que la factura exista. «folio» sigue siendo para folios de trámite o de acuse. Casos en el probador de la guía (también los de «fecha-dma», que no tenían), `docs/03` y `docs/05`.

**Pruebas**: dos casos nuevos de servidor en `06` (26 en total).

## 1.2.1 · 2026-10-17

Tres hallazgos más del sistema de acreditaciones (sus versiones 0.21 y 0.22). Son ajustes de piezas que ya existían, por eso es versión de parche. El proyecto puede quitar `app/archivos-lleno.js`, `app/ver-contrasena.js` y sus reglas en `apd.css` (`.tarjeta.acuse`, `.rev-dato-valor`, `.contrasena-caja`, `[data-lleno]`).

- **P71 · Archivos con el máximo cargado** (módulo `archivos`, FRM-52): con el máximo ya cargado, «Elegir archivo» y la cámara se ocultan (`data-lleno` en `[data-archivos]`), se anuncia y el foco pasa a «Quitar»; al quitar el archivo vuelven. Antes seguían a la vista y la persona creía que no había subido nada. El archivo listo se ve en verde, con su estado escrito (par de contraste nuevo C41). Con un solo formato, el texto dice «Formato admitido»; el singular de «Un archivo de hasta 5 MB» ya venía de la 1.1.0 (P39).
- **P72 · Acuse y revisión** (módulos `acuse` y `revision`, FRM-05 y FRM-06): la tarjeta del acuse conserva su relleno lateral (`.acuse` le quitaba el de la tarjeta y en teléfono los botones quedaban pegados a la orilla), y las dos plantillas y la encuesta de ejemplo terminan el acuse con una acción principal para seguir («Volver al inicio»). En la revisión, «Editar» se queda arriba y a la derecha del valor aunque éste ocupe varios renglones.
- **P73 · «Mostrar» / «Ocultar» dentro del campo** (núcleo, FRM-30; mejora P42 de la 1.1.0): el botón va dentro del campo de contraseña, a la derecha, y cambia su texto entre «Mostrar» y «Ocultar» (el lector oye «Mostrar la contraseña»), con `aria-pressed`. El núcleo envuelve el control en `.contrasena-caja`, que en una `.fila` ocupa el renglón del control. Al enviar, la contraseña vuelve a ocultarse.

**Pruebas**: dos casos nuevos en `07-correcciones` (16 en total) y el de la contraseña ampliado.

## 1.2.0 · 2026-10-17

Cuatro hallazgos más del sistema de acreditaciones de poda y dictaminación, de su segunda revisión (bandeja de revisión documental y perfil del dictaminador). Trae piezas nuevas (un módulo y un formato), por eso es versión menor. El proyecto puede quitar sus soluciones provisionales: `app/visor.js` (con la copia de pdf.js de `construir-sitio.mjs`), `app/fecha-dma.js` y los botones `.sugerencia`.

- **P65 · Respuestas frecuentes fijas** (módulo `chips`, FRM-25): `data-chips-fijos="Texto uno|Texto dos"` muestra siempre esa lista, por ejemplo los motivos para observar un documento. No guarda nada en el dispositivo, así que se admite también en datos personales. En un texto largo, el chip agrega su texto al final («No se lee completo. Falta una página.») y deja el foco para completarlo; en un campo corto, lo pone como respuesta. Muestra en la guía («Chips de uso frecuente»).
- **P66 · Tabla filtrada** (módulo `tabla`, FRM-24): el rayado alterno cuenta sólo las filas visibles (`:nth-child(even of :not([hidden]))`). En teléfono, la columna cuyo encabezado es sólo para lector de pantalla (acciones) ya no muestra su rótulo: el módulo lo marca con `data-etiqueta-oculta`. De paso se corrigió que una fila con `hidden` se siguiera viendo, porque la regla de la tabla le ganaba al atributo (FRM-69). La muestra de la guía trae una fila filtrada y el encabezado de acciones sólo para lector de pantalla.
- **P67 · Visor de documentos** (módulo nuevo `visor`, OPCIONAL; 28 módulos; FRM-24): para quien revisa lo que se cargó. Muestra todas las hojas del PDF, una debajo de otra, con contador de hoja, acercar y alejar, ajustar al ancho, girar y abrir en otra pestaña; también imágenes. En computadora queda fijo junto a la revisión (`.visor-area`) sin quitarle el foco a quien revisa; en teléfono se abre a pantalla completa, y Escape lo cierra con el foco de vuelta en «Ver documento». Se abre con `data-visor-url` o con `FormKit.visor.abre(…)`. Tomado del proyecto (`app/visor.js`, con `FormKit.visor` en lugar de un global del proyecto y los textos de tú), con dos agregados: imágenes y, si pdf.js no se puede cargar, el visor del navegador con aviso. Muestra en la guía con un PDF de dos hojas y una imagen ficticios (`guia-visual/muestras/`); casilla en «¿Qué necesito?».
- **pdf.js 4.10.38** (Mozilla, Apache-2.0) entra a `vendor/pdfjs-dist/` con sus tipografías y su huella en `vendor/MANIFIESTO.json`, bajado del registro de npm. Es la versión del proyecto y es posterior a la 4.2.67, que corrige la ejecución de código desde un PDF malicioso; además se abre con `isEvalSupported: false`. `herramientas/vendor.mjs` ahora copia carpetas enteras (`carpetas`) y funciona en Windows: npm con shell y copia que sobrescribe en carpetas de OneDrive.
- **P70 · Fecha de nacimiento sin calendario** (formato nuevo `fecha-dma`, FRM-20 y FRM-30): se escribe día/mes/año (23/07/1985; también con guiones, puntos, espacios, los ocho dígitos juntos o la forma AAAA-MM-DD del autocompletado) y se envía como DD/MM/AAAA. Debe ser una fecha real, del año 1900 en adelante y, con `data-no-futura`, no posterior a hoy, en el navegador y en el servidor. La escritura se acomoda sola (módulo `fecha`): al completar el día pasa al mes y al completar el mes pasa al año, y un 4 se vuelve 04/. La edad se calcula igual que con `fecha`, y la CURP escribe la fecha derivada en ese formato. La cruzada `curp-fecha` acepta las dos formas de fecha; `curp-fecha-dma` es el mismo cruce con el nombre del proyecto. El bloque listo «Fecha de nacimiento y edad» la usa.

**Pruebas**: cuatro casos nuevos en navegador en `07-correcciones` (14 en total) y uno de servidor en `06` (24). `pruebas/ayudas.mjs` y el servidor local de la guía sirven `.pdf` y `.ttf`.

## 1.1.0 · 2026-10-16

Primera versión corregida con lo que encontró un proyecto real: el sistema de acreditaciones de poda y dictaminación, construido con la 1.0.0. Tres fallas impedían que un formulario funcionara tal como viene (P46, P38, P37). Se corrigen junto con las de validación, accesibilidad y textos, y con cuatro mejoras de estilo de una segunda revisión (S2-1 a S2-4). Al pasar a esta versión, el proyecto puede quitar sus soluciones provisionales. Incluye también los cambios del 14 de octubre (más abajo).

**Fallas que impedían el funcionamiento**

- **P46 · El servidor rechazaba los archivos obligatorios** (`validar.mjs`): los buscaba en `datos`, donde el navegador no los manda. Ahora la revisión de datos salta los campos de archivos y los datos calculados, y los archivos obligatorios se buscan en `payload.archivos`. Prueba nueva con el envío tal como lo arma el navegador.
- **P38 · El esquema perdía las condiciones anidadas** (`esquema-desde-html.mjs`): tomaba sólo el bloque `data-si` más cercano. Ahora guarda todas, de afuera hacia adentro (`condiciones`; `si` sigue siendo la más cercana), y `validar.mjs` exige todas. Además, ya no toma como campos los que están dentro de un comentario HTML.
- **P37 · La lista con búsqueda no aceptaba el catálogo documentado** `{filas, fuente, corte, es_ficticio}` (`combo.js` y el servidor): ahora acepta el arreglo o el objeto y quita los nombres repetidos.

**Validación y núcleo**

- **Dato calculado por la página** (`data-auxiliar`): un `<input type="hidden">` que llena el código de la página cuenta en condiciones y cruzadas, pero no se valida, no entra al borrador y no se envía. El servidor lo vuelve a calcular (`opciones.auxiliares`) y rechaza el envío que lo traiga.
- **Cruzadas con un rol opcional**: `opcionales: ['rol']` en la definición deja correr la cruzada con ese rol vacío (por ejemplo, exigir X en la CURP cuando no hay segundo apellido). Igual en el servidor.
- **P44 · Las cruzadas se repiten al cambiar el otro dato**: al salir de cualquier campo de una cruzada, o al elegir una opción, se revisa también el campo que la declara, si ya tiene valor.
- **P41 · Errores del servidor junto a su campo**: `FormKit.marcaError(campo, mensaje)` (y `instancia.marcaError`). Un rechazo con `{errores: [{campo, mensaje}]}`, la forma que devuelve `validar.mjs`, se pinta en cada campo y en el resumen; por pasos, se abre el primer paso con error (gancho `erroresServidor`).
- **P40 · Paso decimal**: `step="0.5"` ya rechaza 2.3 («Usa múltiplos de 0.5»), contando desde el mínimo como en HTML y con tolerancia de redondeo; `step="1"` dice «Escribe un número entero, sin decimales». El servidor usa el mismo archivo.
- **P52 · Condiciones encadenadas en el navegador**: una condición que mira un campo oculto lo toma como vacío, y las condiciones se aplican hasta que nada cambie. Navegador y servidor piden lo mismo.
- **P61 · Mínimo o máximo según otra respuesta**: `data-min-segun="clave"` y `data-max-segun` con la función `FORMKIT_CONFIG.limitesSegun.clave(datos)`. El campo se revisa de nuevo al cambiar la respuesta de la que depende, y el servidor recibe la misma función (`opciones.limitesSegun`; si falta, lo anota en `senales`).

**Accesibilidad, textos y plantillas**

- **P47 · `aria-required` sólo en `input`, `select` y `textarea`**: ya no se pone en el botón de la zona de carga (axe `aria-allowed-attr`).
- **P39 · Textos de archivos en singular** cuando se admite uno solo («Un archivo de hasta 5 MB», «sólo se admite un archivo»), y JPEG una sola vez en la lista de formatos (`formatosArchivo`).
- **Cámara frontal**: `capture="user"` documentado para una fotografía de la persona («Fotografía de frente»); `capture="environment"` sigue para las evidencias.
- **P56 · Una sola respuesta va en lista** (FRM-16): la lista con el círculo visible es la forma por omisión en la guía de decisión, el manifiesto, la guía visual y la plantilla por pasos («Tipo de solicitud»). La opción deshabilitada de la lista se ve atenuada. Las tarjetas quedan como variante.

- **P45 · Distintivo de versión con tokens**: módulo nuevo `version` (OPCIONAL, sólo CSS; 27 módulos): la hoja de la plantilla de versión del SIA rehecha con los tokens del estándar, que pasa el auditor de CSS. Fijo abajo a la izquierda, sin recibir toques, con tres estados (de prueba en dorado, instalado en el SIA en gris, sin leer en guinda) y en su lugar al imprimir. Va dentro del pie (`<footer>`), para que axe no lo marque fuera de una región. Ficha y muestra en la guía, casilla en «¿Qué necesito?», `docs/03`; par de contraste nuevo C40 (dorado legible sobre beige, 4.80:1).

**Mejoras**

- **P42 · «Mostrar contraseña»**: todo campo de contraseña trae el botón, con `aria-pressed`; `data-sin-mostrar` lo quita. Muestra en la guía visual («El campo»).
- **P43 · La CURP contra el nombre y los apellidos** (FRM-21, `docs/05`): dos cruzadas nuevas, traídas del sistema de acreditaciones. `curp-nombre` compara las letras 1, 2, 4, 14 y 16 con el nombre y el primer apellido: sin partículas, con el segundo nombre si el primero es MARÍA o JOSÉ, la Ñ como X y la palabra altisonante. `curp-segundo-apellido` compara las letras 3 y 15 con el segundo apellido y, si no lo hay, exige X en las dos. La segunda usa el rol opcional de esta versión, en lugar del dato calculado que usaba el proyecto. Comprueban que la CURP y el nombre sean coherentes, no que la CURP exista ni que sea de quien la escribe; las reglas de formación quedan marcadas por confirmar con RENAPO. Las usan el bloque «Datos de identificación» y la plantilla de una página; para probar, Juan Pérez García con la CURP ficticia de siempre. `prefijoCurp` arma CURP ficticias coherentes para las pruebas.

**Segunda revisión: estilo de «Crea tu cuenta» (16 oct 2026)**

- **S2-1 · Ayuda de bloque** (FRM-09): `.ayuda-bloque` bajo el título de una sección dice una sola vez lo que vale para todos sus campos; el núcleo la enlaza a cada campo que le sigue, hasta el siguiente título. `auditar-campos` (D6) avisa si dos campos seguidos repiten la misma ayuda.
- **S2-2 · Opciones en línea** (FRM-16): `.opciones-lista.opciones-en-linea` para dos o tres opciones cortas sin descripción (Sí/No): una columna por opción desde 760 px y una por renglón en teléfono. La usan los Sí/No de la plantilla por pasos, del bloque «Domicilio» y de la muestra de pregunta condicional. Los botones Sí/No (`.opciones-cortas`) siguen admitidos.
- **S2-3 · Datos hermanos en una fila** (FRM-13, `docs/03`): nombre y apellidos en `.fila-3`; CURP y fecha de nacimiento, correo y su confirmación, contraseña y su confirmación en `.fila`; lo demás, en una columna. Aplicado en las dos plantillas, en el bloque «Datos de identificación» y en la muestra «El campo». En la plantilla de una página el alto queda casi igual (en escritorio, de 2332 a 2346 px): junta nombre y apellidos en un renglón, pero separa el teléfono y «Personas en tu hogar», que no son hermanos.
- **S2-4 · El ícono de ayuda no repite la ayuda visible** (FRM-24): si la ayuda visible basta, no hay ícono. `auditar-campos` (D5) lo comprueba.
- Cuatro pares nuevos en «Sí y no» de la guía visual, uno por mejora.
- **Ayuda desplegable que se salía de la pantalla** (`tooltip.css`): con el «?» cerca del borde derecho de un teléfono de 320 px, el texto abierto se salía 8 px y la página se desplazaba de lado (FRM-61). Junto a una etiqueta, el texto ahora se ancla a la etiqueta, con el ancho del campo como máximo. Lo encontró la prueba de anchos con el par nuevo de «Sí y no».

**Pruebas**: `07-correcciones` (nueva: diez casos en navegador sobre `pruebas/paginas/correcciones.html` y las plantillas) y siete casos nuevos de servidor y herramientas en `06`. Los datos de prueba de la plantilla de una página pasan a Juan Pérez García, coherentes con la CURP ficticia.

### Cambios del 14 de octubre de 2026

- **Validador del servidor corregido** (auditoría del 14 oct 2026): el punto del mapa viaja como `{type: "Point", coordinates}`, como esperan el servidor y `docs/06` (antes `tipo`, y el servidor rechazaba todo envío con punto); cada fila de un grupo repetible se valida con su patrón y con el mínimo y máximo de filas, que ahora guarda el esquema (`limitesRepetibles`) (antes el servidor exigía un campo con «#» y rechazaba todo registro de la plantilla de una página); un envío mal formado se rechaza sin detener el proceso; las claves `__proto__`, `constructor` y `prototype` no cuentan como campos; cada dato debe tener su tipo (texto, lista sólo en opción múltiple sin repetidas, punto con números dentro del ámbito, interruptor sólo «si»); los archivos sólo se aceptan en campos de archivos activos. Cuatro pruebas nuevas en `06-servidor` y, en `01-por-pasos` y `02-una-pagina`, el servidor valida lo que el navegador realmente envía.
- El estándar pasa a la carpeta común `estandares-sia/formularios`, junto a `geovisores/` y una portada de guía común (decisión de la Secretaría). Nada se publica en GitHub todavía.
- `herramientas/auditor-css.mjs`: en Windows, `path.relative` devolvía rutas con diagonal invertida y el auditor reportaba cada variable de `tokens.css` como «definida fuera de tokens.css» (1,501 falsos hallazgos). Las rutas se normalizan a diagonal normal.
- `guia-visual/index.html`: enlace de regreso a la portada común (`../../guia-visual/`). `guia-visual/artefacto.html` se regenera con cada cambio de la guía.
- `.gitattributes` en la carpeta común: finales LF y `vendor/` y licencias guardados tal cual. Sin él, Git para Windows cambiaba los finales de línea y `vendor.mjs --verificar` fallaba.
- **Asterisco de obligatorio en guinda** (decisión de la Secretaría, 14 oct 2026; revisa la C2, que lo tenía gris): FRM-10, `nucleo.css .marca-oblig`, el asterisco de la leyenda (`.leyenda-oblig`), guía de estilo, trazabilidad y guía visual. Contraste medido: C38 guinda sobre blanco 7.65:1 y C39 guinda sobre la leyenda 6.86:1; C05 ya no menciona el asterisco. Se reconstruyeron `dist/`, la guía autocontenida y el manifiesto.
- **Bloques listos** (pedido de la Secretaría, 14 oct 2026): sección nueva de la guía visual con dos secciones completas para copiar, armadas sólo con piezas del paquete. «Datos de identificación»: nombre(s), apellido paterno, apellido materno opcional, CURP y fecha de nacimiento derivada de la CURP. «Domicilio»: calle, número exterior («S/N»), número interior, manzana y lote sólo con «Sí», entre qué calles, alcaldía → colonia → CP y ubicación por enlace de Google Maps o coordenadas. Tomados de Denuncias Ambientales (DEC-08, DEC-110, DEC-120, DEC-124). Tres casillas nuevas en «¿Qué necesito?».
- **Módulo nuevo `enlace-mapa`** (OPCIONAL): lee las coordenadas de un enlace de Google Maps pegado (el último lugar marcado; el centro de la pantalla sólo con aviso; los enlaces cortos se explican) y acomoda coordenadas al revés, en grados-minutos-segundos, con coma decimal o sin el signo menos. Extraído de PR (14_buscador.js), CP (app.js), PL (util.js) y Denuncias Ambientales; once casos probados. Ficha y muestra en la guía; `docs/03` y `docs/06` actualizados; manifiesto, `dist/` y guía autocontenida reconstruidos.
- **Domicilio fuera de la Ciudad y colonia escrita** (pedido de la Secretaría): el bloque «Domicilio» abre con la casilla «Vivo fuera de la Ciudad de México» (estado de una lista de 31, municipio, colonia y código postal nacional) y, en la Ciudad, «Mi colonia no aparece en la lista» cambia la lista por un campo de texto. Tomado de Denuncias Ambientales (DEC-136 y su combobox de colonia).
- `validaciones.config.js`: `data-ambito="nacional"` en el código postal acepta cualquier código del país.
- **Corrección del servidor** (`codigo/servidor/validar.mjs`, `herramientas/esquema-desde-html.mjs`): lo que no viene en los datos cuenta como vacío, igual que en el navegador; antes, una condición `campo=` (casilla sin marcar) no se cumplía en el servidor y éste descartaba los datos de la rama visible. Un campo con condición propia dentro de un bloque condicional exige ambas (`siPadre`). Probado con siete envíos contra el validador.
- La guía ya no muestra de qué proyecto o decisión sale cada bloque (pedido de la Secretaría: es un documento común); esa historia queda en este registro.
- **Íconos de redes sociales** (pedido de la Secretaría, 14 oct 2026): cinco marcas rellenas en el sprite (`i-facebook`, `i-x`, `i-instagram`, `i-tiktok`, `i-youtube`; 29 símbolos), tomadas del pie de Árboles Patrimoniales. Componente `.redes` / `.redes-enlace` en el núcleo (44 px, borde `--borde`, par N18 3.40:1 sobre el beige del pie) y bloque listo «Redes sociales» con las cuentas que enlaza sedema.cdmx.gob.mx: Facebook, X (@SEDEMA_CDMX), Instagram (sedemacdmx) y YouTube; TikTok (@sedema_cdmx), que ese sitio no enlaza, lo confirmó la Secretaría. FRM-72, `docs/02`, `docs/03`, `docs/06` y `docs/07` actualizados: los enlaces a redes son la tercera excepción a «el ícono va con texto».
- **Menú de la guía** (pedido de la Secretaría): tres niveles que se distinguen (secciones en negritas, grupos en rótulo gris, fichas en letra normal con línea a la izquierda); el núcleo y los bloques listos tienen submenú; los módulos se agrupan por tipo (Preguntas · Ubicación y archivos · Recorrido de la página · Respuesta a la persona) y, dentro, de lo más usado a lo menos, en el menú y en la página. Antes salían en el orden del manifiesto, que mezclaba tipos (cascadas y chips quedaban después del mapa). El selector del teléfono incluye las fichas. Se corrigió el resaltado de la sección actual, que nunca se veía (`aria-current` quedaba vacío). `enlace-mapa` pasa al tipo «archivos», junto al mapa.
- **Pendientes** (pedido de la Secretaría): una sola lista en la carpeta común (`../guia-visual/pendientes.js`) que muestran la portada (todo) y esta guía (formularios y lo de los dos), con quién resuelve cada punto; lo resuelto se quita de la lista y queda en este registro.
- **Plantillas con los bloques listos** (pedido de la Secretaría; cumplen FRM-13): `una-pagina.html` pide los datos de la persona con el bloque «Datos de identificación» (nombre(s), apellido paterno, apellido materno opcional, CURP y fecha de nacimiento derivada); ya no pide «Apellido(s)» en un campo ni deriva el sexo, y la ayuda desplegable pasa a «Personas en tu hogar». `por-pasos.html`: el paso «¿Dónde?» usa el bloque «Domicilio» para un sitio de la Ciudad (calle, número exterior con «S/N», número interior, manzana y lote, entre qué calles, alcaldía → colonia con «La colonia no aparece en la lista» → CP, enlace de Google Maps y coordenadas, que mueven el punto del mapa), sin la casilla «Vivo fuera de la Ciudad de México» y con autocompletado apagado porque no es el domicilio de quien llena; el contacto pide nombre(s) y apellidos por separado. Se quitan «Referencia cercana» (la cubre «¿Entre qué calles?»), el desplegable de coordenadas y la hoja de acordeón que ya no se usaba. Pruebas 01, 02, 06 y `ayudas.mjs` actualizadas; los casos de servidor se corrieron aparte (7 de 7). Las pruebas en navegador se corrieron después (ver abajo).
- **Edad calculada y en rangos** (pedido de la Secretaría: la edad siempre se deriva de una fecha): el módulo «fecha» calcula la edad cumplida desde una fecha de nacimiento (`data-deriva="edad=…"`, zona horaria de la Ciudad) en un campo de solo lectura, también cuando la fecha viene de la CURP. Bloques listos nuevos: «Fecha de nacimiento y edad» (para formularios sin CURP; no acepta fechas futuras) y «Rango de edad» (una opción, cortes de ejemplo sin huecos ni encimados). El bloque de identificación y la plantilla de una página muestran la edad junto a la fecha. FRM-20, manifiesto, `docs/03` y `docs/06` actualizados; probados en navegador (cumpleaños hoy y mañana, fecha futura, CURP) y contra el servidor (5 casos).
- **Pruebas en navegador corridas en Windows** (76 de 76; `npm run verificar` en verde, 7 de 7): `06-servidor` y la prueba de la CURP de `04-modulos` cargaban archivos con una ruta `C:\…` que `import()` no acepta en Windows (ahora usan `pathToFileURL`); y dentro de la carpeta común el servidor de pruebas sirve `estandares-sia` con el paquete bajo `/formularios`, para que la guía encuentre la lista de pendientes (`ayudas.mjs`, `03-anchos`). Se agrega `package-lock.json` con las versiones instaladas.
- **Construcción sin cambios falsos** (pedido de la Secretaría): `construir.mjs` sólo escribe un archivo si su contenido cambió y dice «sin cambios» en los demás; la fecha `generado` del manifiesto (y de `guia-visual/manifiesto.js`) y la de cada esquema (`esquema-desde-html.mjs`) cambian sólo si cambió algo más. Probado: una segunda corrida seguida no toca ningún archivo.

## 1.0.0 · 2026-10-02

Primera versión del estándar genérico, construida a partir del análisis comparativo de los paquetes A («Denuncias Ambientales») y B (fase 0, trece conflictos decididos; ver `docs/09-trazabilidad.md`).

- **Arquitectura** (C1): núcleo obligatorio + 25 módulos independientes con manifiesto; campos declarados por atributos HTML; validación en un solo `validaciones.config.js` compartido con el servidor.
- **Móvil primero**: CSS con `min-width` únicamente, tres puntos de corte en tokens, escala tipográfica fluida, áreas seguras, objetivos de 44 px; verificado en 320, 360, 390, 768, 1024, 1280 y 1920 px y en dos perfiles (teléfono táctil y escritorio).
- **Tipos de pregunta**: texto, correo, teléfono, numérico, texto largo, opciones (tarjetas, lista, Sí/No), «Otro» con especificación, combo cerrado o libre, select, casilla de declaración, condicional, fecha con «Hoy» y rangos, hora, CURP/RFC/folio con derivados, repetibles, interruptor, escala, cascadas alcaldía → colonia → CP, archivos con cámara, firma, duplicados y optimización, mapa con gestos y confirmación, chips de uso frecuente, solo lectura frente a deshabilitado.
- **Navegación y retroalimentación**: pasos con barra navegable, revisión, acuse, diálogo y confirmación, copiar y compartir, descarga, acordeón, pestañas, migas, progreso, paginación, ayuda desplegable, tabla (tarjetas en teléfono), cuatro avisos, pendiente visible, iconografía SVG propia.
- **Validaciones**: 13 formatos, 8 cruzadas (CURP↔fecha, rango, igual, edad, cp↔colonia…), momento acordado (C5), resumen con foco, servidor que revalida con esquema derivado del HTML, idempotencia.
- **Protección de datos**: `data-uso`, `data-finalidad`, `data-sensible` exigidos por `auditar-campos.mjs`; borrador sin sensibles ni archivos; EXIF desactivado por omisión (C6); chips sólo locales.
- **Herramientas**: construcción (iconos, manifiesto, dist, esquemas, catálogo, artefacto, ZIP), auditor de CSS A01–A16, contraste, campos, bibliotecas, generador de reglas, verificación única, capturas.
- **Guía visual interactiva**: árbol de decisión con etiquetas para pegar, fundamentos leídos de la hoja real, fichas vivas con HTML para copiar, probador de validaciones, pares «sí y no», cuatro formularios de ejemplo con selector de ancho y vista lado a lado; publicada también como artefacto autocontenido.
- **Reglas**: 81 reglas FRM-01 a FRM-81 con nivel BASE / RECOMENDADO / OPCIONAL y origen trazado (A, B, encargo).

Corregido durante la construcción (defectos que habrían llegado a los proyectos): módulos de ámbito documento que duplicaban escuchas con dos formularios en la página (doble descarga); `display` de módulos que pisaba `[hidden]`; `aria-expanded` en radios; franja de entorno fuera de landmark; enlaces del resumen de errores por debajo de 24 px; validación cruzada que no se disparaba al salir hacia el botón «Hoy»; «Otro» que perdía su sugerencia al limpiar; mapa iniciado oculto sin recentrar; cascada que perdía los hijos al restaurar el borrador.

Pendiente para 1.1: ver `docs/09-trazabilidad.md`, sección 3.
