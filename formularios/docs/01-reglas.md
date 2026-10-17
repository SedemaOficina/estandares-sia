# 01 · Reglas del estándar de formularios del SIA

> Este documento se **genera** de `reglas/reglas.json` (`node herramientas/generar-reglas.mjs`). No se edita a mano: se corrige la regla en el JSON y se vuelve a generar.

El estándar tiene **81 reglas** con numeración corrida FRM-NN (decisión C13). Por nivel de exigencia: **54 BASE** (obligatorias en todo formulario), **19 RECOMENDADAS** (se cumplen salvo justificación escrita) y **8 OPCIONALES** (aplican si el formulario usa la pieza). Por origen: 58 son decisiones heredadas de los paquetes A (Denuncias Ambientales) o B, 23 las fija el encargo del estándar genérico y 0 son mejores prácticas adicionales.

**Cómo leer cada regla.** *Regla*: qué se hace. *Por qué*: el daño que evita. *Nivel*: BASE, RECOMENDADO u OPCIONAL (quien programa elige los módulos, no el nivel). *Origen*: `A FRM-xx` regla del paquete A; `B FRM-XXX-xx` regla del paquete B; `Cn` conflicto decidido en la fase 0 (ver `docs/09-trazabilidad.md`); `encargo n` sección del encargo; `norma n` norma de construcción de sistemas. *Verificación*: la prueba, herramienta o revisión que la comprueba.

## Índice

1. [Estructura y flujo](#1-estructura-y-flujo) · FRM-01 a FRM-08
2. [Campos y etiquetas](#2-campos-y-etiquetas) · FRM-09 a FRM-15
3. [Tipos de pregunta](#3-tipos-de-pregunta) · FRM-16 a FRM-25
4. [Validación y errores](#4-validación-y-errores) · FRM-26 a FRM-33
5. [Acciones y retroalimentación](#5-acciones-y-retroalimentación) · FRM-34 a FRM-41
6. [Borrador y envío](#6-borrador-y-envío) · FRM-42 a FRM-45
7. [Ubicación y domicilio](#7-ubicación-y-domicilio) · FRM-46 a FRM-50
8. [Archivos y evidencia](#8-archivos-y-evidencia) · FRM-51 a FRM-54
9. [Datos personales y protección contra el abuso](#9-datos-personales-y-protección-contra-el-abuso) · FRM-55 a FRM-59
10. [Móvil y escritorio](#10-móvil-y-escritorio) · FRM-60 a FRM-65
11. [Hojas de estilo y código](#11-hojas-de-estilo-y-código) · FRM-66 a FRM-72
12. [Textos y pendientes visibles](#12-textos-y-pendientes-visibles) · FRM-73 a FRM-76
13. [Bibliotecas, tipografías y verificación](#13-bibliotecas-tipografías-y-verificación) · FRM-77 a FRM-81

## Resumen por nivel

- **BASE**: FRM-07, FRM-08, FRM-09, FRM-10, FRM-11, FRM-12, FRM-13, FRM-14, FRM-15, FRM-16, FRM-17, FRM-26, FRM-27, FRM-28, FRM-29, FRM-30, FRM-32, FRM-33, FRM-34, FRM-35, FRM-36, FRM-37, FRM-39, FRM-40, FRM-44, FRM-45, FRM-48, FRM-51, FRM-54, FRM-55, FRM-56, FRM-59, FRM-60, FRM-61, FRM-62, FRM-63, FRM-64, FRM-65, FRM-66, FRM-67, FRM-68, FRM-69, FRM-70, FRM-71, FRM-72, FRM-73, FRM-74, FRM-75, FRM-76, FRM-77, FRM-78, FRM-79, FRM-80, FRM-81
- **RECOMENDADO**: FRM-01, FRM-02, FRM-03, FRM-04, FRM-05, FRM-06, FRM-18, FRM-19, FRM-20, FRM-31, FRM-38, FRM-41, FRM-42, FRM-43, FRM-46, FRM-52, FRM-53, FRM-57, FRM-58
- **OPCIONAL**: FRM-21, FRM-22, FRM-23, FRM-24, FRM-25, FRM-47, FRM-49, FRM-50

## 1. Estructura y flujo

### FRM-01 · Un formulario de más de una pantalla se divide en pasos

**Regla.** Todo formulario con más de una pantalla de preguntas se organiza en pasos con título propio (módulo «pasos»), barra de avance visible y un bloque de acciones por paso. Un formulario corto va en una sola página con la plantilla una-pagina.html.

**Por qué.** Una pantalla con todo junto se abandona; el avance visible dice cuánto falta y dónde se está.

**Nivel.** RECOMENDADO · **Origen.** A FRM-01; B FRM-EST-01 · *decisión heredada*

**Verificación.** 01-por-pasos.prueba.mjs: recorrido completo; manifiesto nivel RECOMENDADO

### FRM-02 · La barra de pasos es navegable y exige lo mismo que «Continuar»

**Regla.** Cada paso de la barra es un botón. Avanzar desde la barra valida los pasos intermedios y se detiene en el primero con errores; retroceder siempre se permite y no valida. Los pasos futuros quedan habilitados para que el teclado pueda inspeccionarlos.

**Por qué.** Dos caminos para avanzar con reglas distintas producen envíos incompletos; deshabilitar pasos esconde el recorrido al teclado.

**Nivel.** RECOMENDADO · **Origen.** A FRM-02; B FRM-EST-02; C8 · *decisión heredada*

**Verificación.** 01-por-pasos.prueba.mjs: «la barra permite inspeccionar pasos futuros…»

### FRM-03 · Al abrir un paso, el foco va a su título y se anuncia

**Regla.** Al cambiar de paso el foco se coloca en el título (h2.titulo-paso con tabindex -1) y la región viva anuncia «Paso X de N · Título». En ningún otro momento el formulario mueve el foco por la persona, salvo al resumen de errores.

**Por qué.** Sin foco, quien usa lector de pantalla queda donde estaba y no sabe que la página cambió.

**Nivel.** RECOMENDADO · **Origen.** A FRM-05; B FRM-EST-01 · *decisión heredada*

**Verificación.** 01-por-pasos.prueba.mjs: «el foco va al título del paso»

### FRM-04 · La barra de avance no se apaga en teléfono ni tapa lo enfocado

**Regla.** En pantalla angosta la barra conserva los círculos y muestra «Paso X de N · Título» en lugar de las etiquetas. Si la barra es fija, el documento declara scroll-padding-top con su alto para que ningún campo enfocado quede debajo.

**Por qué.** Quitar la barra en el teléfono quita la orientación justo donde más falta; una barra fija que tapa el campo enfocado hace invisible el error.

**Nivel.** RECOMENDADO · **Origen.** A FRM-03; A FRM-04 · *decisión heredada*

**Verificación.** 03-anchos.prueba.mjs: 320, 360 y 390 px; base.css html{scroll-padding-top}

### FRM-05 · Una pantalla de revisión antes de enviar, con «Editar» que aterriza en el campo

**Regla.** Los formularios por pasos muestran todo lo capturado agrupado por paso antes de enviar (módulo «revision»). Cada bloque lleva «Editar», que abre el paso y enfoca el campo correspondiente. «Editar» se queda junto al valor, arriba y a la derecha, aunque el valor ocupe varios renglones.

**Por qué.** Revisar antes de enviar evita envíos equivocados y repeticiones; «Editar» que sólo cambia de paso obliga a buscar el campo.

**Nivel.** RECOMENDADO · **Origen.** A FRM-08; P72 (proyecto de acreditaciones, 17 oct 2026) · *decisión heredada*

**Verificación.** 01-por-pasos.prueba.mjs: «Editar» aterriza en el campo; 07: «Editar» junto al valor largo

### FRM-06 · Un acuse con folio al terminar

**Regla.** Todo envío exitoso termina en una pantalla de acuse (módulo «acuse») con folio copiable, fecha, qué sigue, si existe, descarga del comprobante, y una acción principal para seguir (volver al inicio o la siguiente tarea). La tarjeta del acuse conserva su relleno lateral: en teléfono los botones no quedan pegados a la orilla. El foco va al título del acuse y se anuncia.

**Por qué.** Sin acuse la persona no sabe si terminó; sin folio no puede dar seguimiento.

**Nivel.** RECOMENDADO · **Origen.** A FRM-09; B FRM-EST-03; P72 (proyecto de acreditaciones, 17 oct 2026) · *decisión heredada*

**Verificación.** 01-por-pasos.prueba.mjs: acuse y copiar; 02-una-pagina.prueba.mjs; 07: relleno y acción del acuse

### FRM-07 · La pregunta condicional existe sólo mientras aplica

**Regla.** Un bloque con data-si="campo=valor|valor2" (en cualquier elemento: div, section, article, fieldset…) se muestra sólo si la respuesta coincide; dentro de otro bloque condicional, exige las dos. Mientras está oculto no se valida ni viaja en el envío; lo escrito se conserva por si la persona vuelve a cambiar de opinión. El servidor descarta con señal lo que llegue de un bloque cuya condición no se cumple. El esquema del servidor lee la condición de todos los elementos que rodean al campo, no sólo de los div.

**Por qué.** Validar lo oculto bloquea sin motivo visible; borrar lo escrito castiga explorar; aceptar en el servidor lo que no se pidió es una puerta.

**Nivel.** BASE · **Origen.** A FRM-11; B FRM-EST-05; P38 (proyecto de acreditaciones, 15 oct 2026); P81 (proyecto de acreditaciones, 17 oct 2026) · *decisión heredada*

**Verificación.** 04-modulos.prueba.mjs: condicional; 06-servidor: condición incumplida; 06: condiciones en section y article

### FRM-08 · Enlace de salto al contenido y una sola jerarquía de encabezados

**Regla.** La primera pieza enfocable de la página es «Ir al contenido». Los encabezados siguen la jerarquía de seis niveles del estándar (página, paso, bloque, pregunta, texto y ayuda, rótulo) sin saltos.

**Por qué.** Sin salto, el teclado recorre la cabecera en cada paso; sin jerarquía, el lector de pantalla no puede navegar por títulos.

**Nivel.** BASE · **Origen.** B FRM-EST-06; A FRM-91; B FRM-STY-04 · *decisión heredada*

**Verificación.** 05-accesibilidad.prueba.mjs (axe heading-order, bypass); guía: jerarquía

## 2. Campos y etiquetas

### FRM-09 · Cada control tiene su etiqueta visible y asociada

**Regla.** Toda entrada lleva label[for] o legend visible. El placeholder nunca sustituye a la etiqueta; la ayuda va en un párrafo propio antes del control, enlazado con aria-describedby. Si la misma ayuda vale para todos los campos de una sección (nombre y apellidos), va una sola vez bajo su título como ayuda de bloque (.ayuda-bloque), que el núcleo enlaza a cada campo; la ayuda de cada campo queda para lo propio de él.

**Por qué.** Un texto encima no es etiqueta; el placeholder desaparece al escribir y el lector no siempre lo lee. La misma ayuda repetida en cada campo se lee varias veces y descuadra las columnas.

**Nivel.** BASE · **Origen.** A FRM-20; B FRM-CMP-01; S2-1 (proyecto de acreditaciones, 16 oct 2026) · *decisión heredada*

**Verificación.** 05-accesibilidad.prueba.mjs (axe label); auditar-campos D6; guía: sí y no

### FRM-10 · Lo obligatorio se marca con asterisco guinda y con la palabra

**Regla.** Los campos obligatorios llevan un asterisco guinda (--guinda) con aria-hidden y la palabra «(obligatorio)» sólo para lectores de pantalla; la leyenda «Los campos con * son obligatorios» aparece una vez por pantalla. Los opcionales no se marcan.

**Por qué.** La Secretaría decidió el 14 oct 2026 que el asterisco va en guinda, el color de la identidad (C2 revisada; antes era gris porque el rojo se confundía con error). El guinda se distingue de un error porque el error lleva icono, la palabra «Error» y borde rojo grueso, y el asterisco nunca va solo: va con la leyenda y con «(obligatorio)» para el lector de pantalla, que sin la palabra no lo sabe.

**Nivel.** BASE · **Origen.** A FRM-30; B FRM-CMP-02; C2 (revisada por la Secretaría, 14 oct 2026) · *decisión heredada*

**Verificación.** nucleo.css .marca-oblig; 04-modulos: resumen de obligatorios

### FRM-11 · Cada campo se declara con atributos y la validación vive en un solo archivo

**Regla.** El HTML declara cada campo con data-campo, data-formato, required o data-requerido, data-si, data-uso, data-finalidad, data-sensible y las cruzadas. Los patrones, límites y mensajes viven únicamente en validaciones.config.js; los ajustes por formulario, en FORMKIT_CONFIG.

**Por qué.** Un catálogo paralelo al HTML se desincroniza y acopla (A); mensajes y patrones dispersos en el código incumplen «cero valores fijos» (B). La fusión toma lo mejor de ambos.

**Nivel.** BASE · **Origen.** A FRM-28; B FRM-CMP-10; C1 · *decisión heredada*

**Verificación.** 04-modulos.prueba.mjs: esquema derivado del HTML coincide con el navegador

### FRM-12 · Cada campo declara autocompletado, inputmode y enterkeyhint cuando aplican

**Regla.** Los datos de identidad, contacto y domicilio de quien llena llevan el autocomplete que corresponde (given-name, email, tel-national, postal-code, street-address…); los datos de terceros llevan autocomplete="off" con el motivo en un comentario. El teclado del teléfono se elige con inputmode y type.

**Por qué.** El autocompletado del dispositivo ahorra tecleo y errores; en datos de terceros rellenaría con los datos de quien captura.

**Nivel.** BASE · **Origen.** A FRM-23; B FRM-CMP-04 · *decisión heredada*

**Verificación.** herramientas/auditar-campos.mjs D2 y D4

### FRM-13 · Un dato, un campo; campos alineados por renglón

**Regla.** Lo que se usa por separado se pide por separado (nombre y apellidos; calle y número). Los datos hermanos van en una fila: las partes de un mismo dato (nombre y apellidos en .fila-3; calle y número; manzana y lote), un dato y su confirmación (correo, contraseña) y un dato y el que sale de él (CURP y fecha de nacimiento), en .fila. Lo demás va en una columna, aunque sea corto. En escritorio los campos de una fila se alinean con subcuadrícula para que los controles queden a la misma altura aunque una etiqueta ocupe dos líneas; en teléfono van en una columna.

**Por qué.** Un dato compuesto no se puede validar ni consultar; controles desalineados parecen descuido y confunden la lectura por filas. Los datos hermanos se leen juntos; en una sola columna, los campos cortos a todo lo ancho alargan el formulario.

**Nivel.** BASE · **Origen.** A FRM-22; A FRM-32; S2-3 (proyecto de acreditaciones, 16 oct 2026) · *decisión heredada*

**Verificación.** base.css .fila (subgrid); plantillas; guía: núcleo, bloques listos, sí y no

### FRM-14 · Solo lectura no es deshabilitado

**Regla.** Un dato que la persona debe ver y copiar va readonly (borde discontinuo, se envía, copiable con data-copiable). Deshabilitado (disabled) es sólo para lo que no aplica todavía: no se envía y el teclado lo salta.

**Por qué.** Deshabilitar un folio que hay que copiar lo vuelve inalcanzable; marcar readonly lo que no aplica lo envía.

**Nivel.** BASE · **Origen.** encargo 5.2 · *decisión del encargo*

**Verificación.** guía: sí y no; 02-una-pagina: derivados copiables

### FRM-15 · Texto largo con contador y mínimo legible

**Regla.** El texto libre lleva maxlength visible como contador y, cuando se exige una descripción, minlength y data-legible: se rechaza el tecleo al azar por forma, nunca por ortografía.

**Por qué.** Sin contador se corta sin aviso; validar el sentido castiga a quien escribe distinto.

**Nivel.** BASE · **Origen.** A FRM-35; B FRM-CMP-08; B FRM-VAL-06 · *decisión heredada*

**Verificación.** 01-por-pasos: validación en el momento acordado

## 3. Tipos de pregunta

### FRM-16 · Las opciones son controles nativos; una sola respuesta va en lista

**Regla.** Opción única y múltiple se construyen con input radio o checkbox dentro de label, agrupados en fieldset con legend. La tarjeta seleccionable y la variante corta Sí/No son el mismo control con otra piel: lo elegido se marca con fondo, sombra interior y palomita, nunca sólo con color. Para una sola respuesta, la forma por omisión es la lista (.opciones-lista): una opción por renglón y el círculo visible, también en escritorio; la opción deshabilitada se ve atenuada. Dos o tres opciones cortas sin descripción (Sí/No) van en línea (.opciones-lista.opciones-en-linea): una columna por opción desde tableta y una por renglón en teléfono; con descripción, una por renglón.

**Por qué.** Un div con onclick no recibe foco ni se anuncia; marcar sólo con color excluye a quien no lo distingue. Un Sí/No apilado a todo lo ancho ocupa dos renglones sin decir más.

**Nivel.** BASE · **Origen.** A FRM-26; B FRM-CMP-05; B FRM-CMP-06; C3; P56 (proyecto de acreditaciones, 15 oct 2026); S2-2 (proyecto de acreditaciones, 16 oct 2026) · *decisión heredada*

**Verificación.** 04-modulos; 05-accesibilidad; manifiesto «opciones»

### FRM-17 · Sí/No ocupa el alto táctil según el puntero, no según el ancho

**Regla.** La opción corta mide --alto-opcion con ratón y sube a --alto-control con pointer:coarse. Nunca se premarca.

**Por qué.** El dedo necesita 44 px aunque la pantalla sea ancha; el ratón no necesita botones enormes.

**Nivel.** BASE · **Origen.** A FRM-27 · *decisión heredada*

**Verificación.** 03-anchos.prueba.mjs: objetivos táctiles ≥ 44 px

### FRM-18 · «Otro» es un componente, con especificación o simple

**Regla.** Cuando la lista puede no cubrir el caso, la opción «Otro» va al final; con data-otro-de el campo de especificación aparece sólo al elegirla, es obligatorio mientras exista, rechaza repetir una opción de la lista y conserva lo escrito. Cuando el detalle no aporta, «Otro» es una opción más.

**Por qué.** Sin «Otro» la persona miente o abandona; una especificación que no se exige produce «otro» vacíos.

**Nivel.** RECOMENDADO · **Origen.** encargo 5.2 · *decisión del encargo*

**Verificación.** 04-modulos.prueba.mjs: «Otro»

### FRM-19 · La lista desplegable con búsqueda es cerrada por omisión

**Regla.** El combo (módulo «combo») filtra desde la primera letra, se opera con flechas, Enter y Escape, y sólo acepta valores del catálogo. Con data-libre acepta lo escrito. Se usa a partir de 8 opciones; con menos, radios o select nativo.

**Por qué.** Un valor libre en un campo de catálogo rompe la consulta; un select de 40 opciones es intransitable en el teléfono.

**Nivel.** RECOMENDADO · **Origen.** A FRM-24; A FRM-25; B FRM-CMP-03; C4 · *decisión heredada*

**Verificación.** 04-modulos.prueba.mjs: combo

### FRM-20 · Fechas con «Hoy», horas con «Ahora», rangos con atajos, sin fechas imposibles y edad calculada

**Regla.** Los campos de fecha son type=date con botón «Hoy» (módulo «fecha»); los de hora, «Ahora». La fecha de nacimiento no usa calendario: se escribe día/mes/año (formato «fecha-dma», 23/07/1985), la escritura se acomoda sola y la cruza con la CURP curp-fecha (o curp-fecha-dma). Un rango declara data-rango y atajos; la fecha final anterior a la inicial es una validación cruzada. data-no-futura rechaza fechas posteriores a hoy, que el servidor resuelve con su propio reloj. La edad no se escribe: se calcula de la fecha de nacimiento (escrita o tomada de la CURP) en un campo de solo lectura (data-deriva="edad=…"), o se pide en rangos sin huecos ni encimados cuando basta el grupo de edad.

**Por qué.** Escribir la fecha de hoy es el caso más frecuente; un rango invertido o una fecha futura de nacimiento son errores silenciosos; una edad escrita junto a la fecha puede contradecirla. El calendario obliga a recorrer décadas para llegar a una fecha de nacimiento, y en México nadie la escribe como AAAA-MM-DD.

**Nivel.** RECOMENDADO · **Origen.** encargo 5.2; A FRM-29; edad calculada o en rangos (la Secretaría, 14 oct 2026); P70 (proyecto de acreditaciones, 16 oct 2026) · *decisión del encargo*

**Verificación.** 02-una-pagina: rango y atajos; 06-servidor: max «hoy»; 06 y 07: fecha día/mes/año

### FRM-21 · CURP de 18 caracteres con derivados en solo lectura y cruzada con la fecha de nacimiento y con el nombre

**Regla.** La CURP se normaliza a mayúsculas, exige 18 caracteres, estructura, fecha real, entidad y dígito verificador (estructura a confirmar con RENAPO: [Fuente: __]). De ella se derivan fecha de nacimiento y sexo a campos de solo lectura (data-deriva). Si además se pide la fecha, debe coincidir (cruzada curp-fecha, bloqueante por omisión). Si se piden nombre y apellidos, las letras de la CURP deben corresponderles (cruzadas curp-nombre y curp-segundo-apellido; sin segundo apellido, la CURP lleva X en las posiciones 3 y 15). Estas cruzadas comprueban que los datos sean coherentes entre sí, no que la CURP exista ni que sea de quien la escribe.

**Por qué.** Pedir lo que la CURP ya contiene es doble captura y doble error; una CURP de 17 caracteres pasa desapercibida sin regla; sin la cruzada con el nombre se acepta la CURP de otra persona nacida el mismo día.

**Nivel.** OPCIONAL · **Origen.** encargo 5.5; P43 (proyecto de acreditaciones, 15 oct 2026) · *decisión del encargo*

**Verificación.** 04-modulos.prueba.mjs: CURP (18, estructura, fecha, entidad, dígito) y cruzada; 06 y 07: CURP contra nombre y apellidos

### FRM-22 · Grupos repetibles con mínimo, máximo y confirmación para quitar

**Regla.** «Agregar otro» (módulo «repetibles») clona una plantilla con índice, enfoca el primer campo de la fila nueva, respeta data-min y data-max (el botón se marca con aria-disabled, no desaparece) y pide confirmación antes de quitar una fila con contenido.

**Por qué.** Sin límite se capturan listas infinitas; sin confirmación se pierde lo escrito con un toque.

**Nivel.** OPCIONAL · **Origen.** encargo 5.2 · *decisión del encargo*

**Verificación.** 02-una-pagina: repetibles; 04-modulos

### FRM-23 · Interruptor sólo para ajustes de efecto inmediato; escala sobre radios

**Regla.** El interruptor (role=switch, módulo «toggle») se usa para preferencias que aplican al momento, con texto de estado; nunca para preguntas del formulario. La escala (módulo «escala») es un grupo de radios con extremos nombrados.

**Por qué.** Un interruptor en una pregunta no dice qué se envía; una escala con botones sueltos no se opera con flechas.

**Nivel.** OPCIONAL · **Origen.** encargo 5.2 · *decisión del encargo*

**Verificación.** 02-una-pagina: interruptor y escala; manifiesto

### FRM-24 · Pestañas, acordeón, migas, progreso, paginación, ayuda desplegable, tabla y visor de documentos son módulos con teclado completo

**Regla.** Cada componente de navegación o consulta se copia sólo si el formulario lo usa: pestañas con flechas, Home y End; acordeón con details; migas con aria-current; progreso con progress; paginación que conserva filtros y lleva el foco a la lista; ayuda desplegable que se abre con clic y teclado y cierra con Escape, y que nunca repite la ayuda visible del campo (si la ayuda visible basta, no hay ícono); tabla ordenable con aria-sort y acciones por fila con nombre completo, que en teléfono se vuelve tarjetas; al filtrar con [hidden], la fila oculta no se ve y el rayado cuenta sólo las visibles, y la columna cuyo encabezado es sólo para lector de pantalla no muestra rótulo en teléfono; visor de documentos que muestra todas las hojas del PDF con contador, acercar y girar, fijo junto a la revisión en computadora y a pantalla completa en teléfono (Escape cierra y el foco vuelve al botón), con pdf.js del propio servidor.

**Por qué.** Un componente a medias (sólo ratón, sólo escritorio) excluye a una parte de las personas y obliga a rehacerlo después. Un ícono que repite lo que ya se lee obliga a abrirlo para nada.

**Nivel.** OPCIONAL · **Origen.** encargo 5.1; encargo 5.4; S2-4 (proyecto de acreditaciones, 16 oct 2026); P66 (proyecto de acreditaciones, 16 oct 2026); P67 (proyecto de acreditaciones, 16 oct 2026) · *decisión del encargo*

**Verificación.** 04-modulos.prueba.mjs: pestañas, paginación, tabla, ayuda; 03-anchos; auditar-campos D5; 07: tabla filtrada y visor

### FRM-25 · Chips de uso frecuente con historial del propio dispositivo o con una lista fija

**Regla.** Las sugerencias de uso frecuente (módulo «chips») se forman con lo que la persona ya escribió en ese dispositivo, viven en el almacén local y nunca viajan en el envío. Se prohíben en campos con data-finalidad o data-sensible. Una lista fija de respuestas frecuentes conocidas (data-chips-fijos, por ejemplo los motivos para observar un documento) no guarda nada y se admite en cualquier campo; en un texto largo, el chip agrega su texto al final para que la persona lo complete.

**Por qué.** Un historial compartido o enviado es una fuga de datos; sugerir datos personales los expone en pantallas ajenas.

**Nivel.** OPCIONAL · **Origen.** encargo 5.2; P65 (proyecto de acreditaciones, 16 oct 2026) · *decisión del encargo*

**Verificación.** 04-modulos.prueba.mjs: chips; chips.js rechaza data-finalidad; 07: chips fijos

## 4. Validación y errores

### FRM-26 · El error aparece al salir del campo si se escribió algo; se recalcula al corregir; nunca en un campo intacto

**Regla.** La validación individual corre al salir del campo (blur) sólo si la persona escribió algo; una vez marcado, se recalcula en cada tecla y se limpia en cuanto el valor es válido. Salir de un campo sin tocarlo no produce error. Al continuar o enviar se validan todos.

**Por qué.** Regañar mientras se escribe interrumpe; no avisar hasta el final obliga a volver atrás; marcar lo intacto parece acusar.

**Nivel.** BASE · **Origen.** encargo 5.5; A FRM-36; B FRM-VAL-03; C5 · *decisión del encargo*

**Verificación.** 01-por-pasos.prueba.mjs: validación en el momento acordado

### FRM-27 · El mensaje dice qué campo y qué hacer, con ejemplo

**Regla.** Cada mensaje nombra la regla incumplida y cómo cumplirla («Escribe 10 dígitos, sin lada internacional. Ejemplo: 5512345678»). Nunca «Campo inválido». Los mensajes viven en validaciones.config.js, no en el HTML ni en el código de los módulos.

**Por qué.** «Campo inválido» obliga a adivinar; un mensaje en el HTML se repite distinto en cada formulario.

**Nivel.** BASE · **Origen.** A FRM-34; B FRM-VAL-04 · *decisión heredada*

**Verificación.** guía: probador y sí y no; 06-servidor: cada error trae mensaje

### FRM-28 · Resumen de errores al inicio, con rol de alerta, foco y enlaces

**Regla.** Al continuar o enviar con errores aparece un resumen con role=alert que recibe el foco y enlaza a cada campo; cada enlace mide al menos 24 px. Al corregir el último error el resumen desaparece.

**Por qué.** Sin resumen, quien usa lector de pantalla no sabe cuántos errores hay ni dónde; sin foco, no se entera.

**Nivel.** BASE · **Origen.** A FRM-33; B FRM-VAL-02; B FRM-VAL-07 · *decisión heredada*

**Verificación.** 01-por-pasos; 02-una-pagina; 05-accesibilidad (target-size)

### FRM-29 · El estado de error vive en aria-invalid y se comunica con icono, texto y borde

**Regla.** El control inválido lleva aria-invalid="true" y aria-describedby al mensaje; el CSS lee el atributo. El mensaje lleva icono y texto; el borde cambia de color y grosor. Nada se comunica sólo con color.

**Por qué.** Una clase .invalido duplica el estado; el color solo excluye a quien no lo distingue.

**Nivel.** BASE · **Origen.** A FRM-37; B FRM-VAL-05 · *decisión heredada*

**Verificación.** auditor-css A10; 05-accesibilidad

### FRM-30 · Validaciones por formato: nombre, correo, teléfono de 10 dígitos, CP de 5 dígitos, fecha real (también día/mes/año), hora, numérico, texto, coordenadas, folio, folio fiscal, contraseña

**Regla.** Cada dato de formato conocido se valida con la regla del catálogo: el correo necesita una sola @ y un dominio con punto, y sugiere sin bloquear ante errores de dedo frecuentes; el teléfono se normaliza a 10 dígitos quitando espacios, guiones y +52; el CP exige 5 dígitos y, si está configurado, el ámbito de la Ciudad (01000–16999); la fecha debe existir, escrita AAAA-MM-DD o, en «fecha-dma», día/mes/año; el número respeta min, max y step. El campo de contraseña lleva «Mostrar» / «Ocultar» dentro del campo, con aria-pressed, y se vuelve a ocultar al enviar. El folio fiscal de una factura (formato «folio-fiscal») es un UUID de 36 caracteres en grupos 8-4-4-4-12, que se acepta en minúsculas y sin guiones y se guarda en mayúsculas con ellos.

**Por qué.** Cada formulario que inventa su propia regla de correo o teléfono produce datos incomparables.

**Nivel.** BASE · **Origen.** encargo 5.5; C10; P70 (proyecto de acreditaciones, 16 oct 2026); P42 (proyecto de acreditaciones, 15 oct 2026); P73 (proyecto de acreditaciones, 17 oct 2026); P82 (proyecto de acreditaciones, 17 oct 2026) · *decisión del encargo*

**Verificación.** guía: probador; 06-servidor; validaciones.config.js

### FRM-31 · Las validaciones cruzadas marcan los campos implicados y pueden ser advertencia

**Regla.** Una cruzada (data-cruzada con data-cruzada-campos) se evalúa cuando todos sus campos tienen valor, marca el campo que la lleva y el otro, y se libera en ambos al corregir. Con data-cruzada-nivel="advertencia" (ámbar, con icono) informa sin bloquear; cp↔colonia es advertencia por omisión.

**Por qué.** Marcar sólo un campo manda a corregir el que estaba bien; bloquear por un catálogo que puede estar desactualizado impide envíos legítimos.

**Nivel.** RECOMENDADO · **Origen.** encargo 5.5 · *decisión del encargo*

**Verificación.** 04-modulos.prueba.mjs: cruzada CURP↔fecha; cascadas (advertencia)

### FRM-32 · Se exige lo obligatorio: no se avanza ni se envía con pendientes

**Regla.** Continuar y enviar validan todo lo visible y activo; los campos ocultos por condición no cuentan. La casilla de declaración o consentimiento es obligatoria y nunca va premarcada.

**Por qué.** Un envío incompleto genera un registro que hay que completar después; un consentimiento premarcado no es consentimiento.

**Nivel.** BASE · **Origen.** A FRM-38; B FRM-DP-02 · *decisión heredada*

**Verificación.** 01-por-pasos: enviar sin casillas; guía: sí y no

### FRM-33 · El navegador ayuda; el servidor defiende con las mismas reglas

**Regla.** Todo lo que valida el navegador lo vuelve a validar el servidor con el mismo validaciones.config.js y el esquema que se deriva del HTML (herramientas/esquema-desde-html.mjs). El servidor además revisa la firma de los archivos, el límite por origen y la idempotencia.

**Por qué.** La validación del navegador se salta con una petición directa; una segunda lista de reglas se desactualiza.

**Nivel.** BASE · **Origen.** A FRM-70; B FRM-VAL-08 · *decisión heredada*

**Verificación.** 06-servidor-y-herramientas.prueba.mjs; 04-modulos: esquema vs navegador

## 5. Acciones y retroalimentación

### FRM-34 · Una sola acción principal por pantalla

**Regla.** Cada pantalla tiene un solo botón con relleno guinda. Lo demás es secundario (gris con borde), peligro (rojo, sólo destructivo y con confirmación), enlace-botón o botón de icono con nombre accesible y 44 px.

**Por qué.** Dos botones guinda compiten y la persona no sabe cuál la lleva adelante.

**Nivel.** BASE · **Origen.** A FRM-40; B FRM-ACC-01 · *decisión heredada*

**Verificación.** guía: botones; sí y no

### FRM-35 · «Atrás» es un enlace azul con flecha, nunca un botón gris

**Regla.** Retroceder se presenta como enlace-botón azul con flecha a la izquierda; nunca compite visualmente con la acción principal ni se confunde con «Cancelar».

**Por qué.** Un «Atrás» gris junto a «Continuar» guinda se pulsa por error; la flecha dice la dirección sin leer.

**Nivel.** BASE · **Origen.** A FRM-41; B FRM-ACC-01; C7 · *decisión heredada*

**Verificación.** guía: botones; nucleo.css .btn-atras

### FRM-36 · Los botones dicen qué hacen; nunca «Aceptar» ni «OK»

**Regla.** La etiqueta es un verbo concreto con su objeto («Enviar solicitud», «Guardar borrador», «Descartar»). Los botones de icono llevan aria-label; los de descarga dicen formato y peso.

**Por qué.** «Aceptar» no dice qué se acepta; un icono sin nombre es un botón mudo para el lector de pantalla.

**Nivel.** BASE · **Origen.** B FRM-ACC-02 · *decisión heredada*

**Verificación.** 03-anchos: ningún botón sin nombre; guía: botones

### FRM-37 · Un botón no se deshabilita en silencio: aria-disabled y aria-busy

**Regla.** Mientras se envía, el botón lleva aria-disabled y aria-busy con texto «Enviando…» y conserva el foco; al terminar se recupera. Si una acción no está disponible, se deja pulsar y se explica, o se marca con aria-disabled, nunca con disabled.

**Por qué.** disabled saca el botón del orden de tabulación y el lector de pantalla no sabe por qué desapareció.

**Nivel.** BASE · **Origen.** A FRM-42; B FRM-ACC-03 · *decisión heredada*

**Verificación.** 01-por-pasos: el botón se recupera; 02-una-pagina: agregar al máximo

### FRM-38 · Toda acción que no se deshace pide confirmación dentro de la página

**Regla.** Quitar, descartar o eliminar abren un diálogo nativo con role=alertdialog (FormKit.confirma), con el foco inicial en la opción segura, Escape para cancelar y retorno del foco al botón que lo abrió. Nunca window.confirm.

**Por qué.** window.confirm no se puede estilizar ni accesibilizar y en algunos visores no aparece; un diálogo que enfoca «Eliminar» borra con Enter por accidente.

**Nivel.** RECOMENDADO · **Origen.** A FRM-44; B FRM-ACC-04 · *decisión heredada*

**Verificación.** 04-modulos: diálogo de confirmación; 02-una-pagina: quitar fila

### FRM-39 · Cuatro avisos, cada uno con icono, texto y rol

**Regla.** Neutro (informa, sin rol), advertencia (ámbar, sin bloqueo), bloqueo (rojo, role=alert) y éxito (verde, role=status). Lo que impide continuar es asertivo; lo demás es cortés. Un aviso nunca sustituye al mensaje del campo.

**Por qué.** Un aviso rojo para todo entrena a ignorarlo; un alert cortés no se oye.

**Nivel.** BASE · **Origen.** encargo 5.4 · *decisión del encargo*

**Verificación.** guía: botones y avisos; 05-accesibilidad

### FRM-40 · Lo que cambia sin recargar se anuncia

**Regla.** Errores, avisos, resultados de paginación, pasos, copiar, archivos agregados o quitados y cambios de pestaña se anuncian en una región viva (FormKit.anuncia). El foco sólo se mueve al cambiar de paso, al resumen de errores y al título del acuse.

**Por qué.** Lo que aparece en silencio no existe para quien no ve la pantalla.

**Nivel.** BASE · **Origen.** A FRM-49 · *decisión heredada*

**Verificación.** 05-accesibilidad; verificación manual con lector de pantalla (no automatizable)

### FRM-41 · Copiar y compartir confirman con palabras

**Regla.** Copiar un folio o un dato de solo lectura cambia el texto del botón a «Copiado» un momento y lo anuncia; si el portapapeles falla se dice «No se pudo copiar». Compartir usa la API nativa si existe y, si no, copia el enlace.

**Por qué.** Un clic sin confirmación deja la duda; un fallo silencioso hace que la persona copie a mano lo que creía copiado.

**Nivel.** RECOMENDADO · **Origen.** encargo 5.4 · *decisión del encargo*

**Verificación.** 01-por-pasos: copiar folio; 04-modulos: copiar

## 6. Borrador y envío

### FRM-42 · Todo formulario largo guarda borrador en el dispositivo y lo ofrece al volver

**Regla.** Con data-borrador el núcleo guarda los datos y el paso en el almacén local (versionado con data-borrador-version) y al volver muestra una franja «Tienes un borrador» con Recuperar y Descartar (con confirmación). El aviso dice que el borrador aún no se presenta.

**Por qué.** Perder diez minutos de captura por cerrar la pestaña es la causa principal de abandono.

**Nivel.** RECOMENDADO · **Origen.** A FRM-14; A FRM-17; B FRM-EST-04 · *decisión heredada*

**Verificación.** 01-por-pasos: borrador se guarda, se ofrece y se restaura

### FRM-43 · El borrador nunca incluye campos sensibles ni archivos, y se invalida con la estructura

**Regla.** Los campos con data-sensible y los archivos no se guardan en el borrador: se piden de nuevo. Un borrador de otra versión del formulario o caducado no se ofrece. El borrador se escribe también al salir de la página (pagehide) y se borra al enviar.

**Por qué.** Un nombre y un correo en el almacén local de una computadora compartida son una fuga; un borrador viejo contra un formulario nuevo produce datos inconsistentes.

**Nivel.** RECOMENDADO · **Origen.** A FRM-15; A FRM-16; B FRM-DP-03 · *decisión heredada*

**Verificación.** 01-por-pasos: lo sensible se pide de nuevo; el borrador se borra al enviar

### FRM-44 · Todo envío tiene límite de espera, clave de idempotencia y dice qué pasó

**Regla.** El envío lleva AbortController con plazo configurable y una clave de idempotencia por intento. El fallo (red, plazo, error del servidor) se dice con palabras en un aviso de bloqueo que recibe el foco; lo capturado se conserva y el botón se recupera. El límite de peticiones (429) abre una pantalla propia con «Volver». El aviso de un envío fallido se queda hasta que la persona cambia un dato o vuelve a enviar: no se oculta al mover el foco, porque el botón de abajo subiría a media pulsación y el clic se perdería.

**Por qué.** Un giro eterno y una pantalla en blanco son el peor error posible; un reenvío sin idempotencia duplica registros.

**Nivel.** BASE · **Origen.** A FRM-42; A FRM-43; B FRM-SEG-02; P87 (proyecto de acreditaciones, 17 oct 2026) · *decisión heredada*

**Verificación.** 01-por-pasos: error simulado, límite y éxito; 07: aviso de envío fallido

### FRM-45 · El envío no se duplica

**Regla.** Mientras el envío está en curso el botón está ocupado y un segundo clic no manda nada; Enter en un campo intermedio avanza de paso en lugar de enviar.

**Por qué.** Dos clics nerviosos en «Enviar» crean dos registros.

**Nivel.** BASE · **Origen.** A FRM-42 · *decisión heredada*

**Verificación.** formkit.core.js enviar(); 01-por-pasos

## 7. Ubicación y domicilio

### FRM-46 · La dirección va primero y el mapa nunca es el único camino

**Regla.** El domicilio se pide en campos (alcaldía, colonia, código postal, calle y número) y el mapa, si existe, es una ayuda adicional: siempre hay alternativa por texto o por coordenadas. El resultado de cualquier cruce se dice con palabras, no sólo con color.

**Por qué.** Un mapa no se opera con teclado ni con lector de pantalla; sin mosaicos queda en blanco.

**Nivel.** RECOMENDADO · **Origen.** A FRM-50; B FRM-UBI-05; B FRM-UBI-06 · *decisión heredada*

**Verificación.** guía: mapa (vías); manifiesto «mapa»

### FRM-47 · Cascada alcaldía → colonia → código postal con catálogo versionado y camino inverso

**Regla.** La cascada (módulo «cascadas») toma sus filas de FORMKIT_CATALOGOS.<nombre> con fuente y fecha de corte declaradas; cambiar un padre reinicia a los hijos y lo anuncia; escribir el código postal propone alcaldía y colonia; la colonia propone el CP. Sin catálogo se muestra la captura manual. El catálogo que viaja con el paquete es ficticio y se sustituye por el oficial.

**Por qué.** Una lista de colonias escrita en el HTML se desactualiza y pesa; obligar a elegir alcaldía cuando la persona sabe su CP es un paso de más.

**Nivel.** OPCIONAL · **Origen.** encargo 5.2 · *decisión del encargo*

**Verificación.** 04-modulos: cascadas; 01-por-pasos: cascada por CP y regreso

### FRM-48 · El código postal lleva cinco dígitos, se conserva como texto y su ámbito es configurable

**Regla.** El CP se valida con cinco dígitos y se guarda como texto (conserva el cero inicial). Si el formulario declara ámbito (FORMKIT_CONFIG.ambito.cp, por omisión 01000–16999 para la Ciudad de México), un CP fuera se rechaza con el mensaje configurado.

**Por qué.** Como número, 01000 se vuelve 1000; un CP de otra entidad en un formulario de la Ciudad se detecta hasta que alguien revisa los datos.

**Nivel.** BASE · **Origen.** encargo 5.5; C10 · *decisión del encargo*

**Verificación.** guía: probador cp; 06-servidor

### FRM-49 · El punto en el mapa se coloca con toque, arrastre o teclado, se confirma y no se pide geolocalización por omisión

**Regla.** El mapa (Leaflet autoalojado con gestos: un dedo desplaza la página, dos el mapa) coloca el punto al tocar, permite arrastrarlo y, con el mapa enfocado, Enter lo coloca en el centro. Con data-confirmar el punto debe confirmarse. Las coordenadas se enuncian en texto (lon, lat en EPSG:4326, seis decimales). La geolocalización del dispositivo sólo se ofrece con data-geolocalizacion. El ámbito se acota y un punto fuera se dice al momento.

**Por qué.** Un mapa que atrapa el desplazamiento del teléfono bloquea la página; un punto sin confirmar se envía por un roce; pedir permiso de ubicación sin motivo ahuyenta.

**Nivel.** OPCIONAL · **Origen.** A FRM-53; A FRM-54; B FRM-UBI-01; B FRM-UBI-03 · *decisión heredada*

**Verificación.** 01-por-pasos: mapa toca, confirma; mapa.js

### FRM-50 · El mapa base, el marcador y el cruce son del proyecto, no de un tercero

**Regla.** Las teselas se declaran en FORMKIT_CONFIG.mapa (proveedor, atribución, clave), vacías por omisión: sin teselas el punto sigue pudiendo colocarse. El marcador es propio e incrustado. El cruce con capas (alcaldía, suelo, competencia) se resuelve en el servidor contra la capa completa.

**Por qué.** Una tesela o un icono que no carga por política de red deja el mapa en blanco; un cruce en el navegador es manipulable.

**Nivel.** OPCIONAL · **Origen.** A FRM-55; A FRM-56; A FRM-57; B FRM-UBI-04; B FRM-LIB-03 · *decisión heredada*

**Verificación.** 03-anchos: nada se pide a un tercero; mapa.css marcador

## 8. Archivos y evidencia

### FRM-51 · La zona de carga dice formatos, peso y número antes, y el código los aplica

**Regla.** La zona (módulo «archivos») muestra «Formatos admitidos: … Hasta N archivos de M MB» leyendo la configuración; acepta arrastrar, elegir y, en teléfono, tomar fotografía (capture). Un archivo soltado fuera de la zona no abre el navegador.

**Por qué.** Descubrir el límite después de elegir diez fotos es volver a empezar.

**Nivel.** BASE · **Origen.** A FRM-60; A FRM-64; B FRM-ARC-01 · *decisión heredada*

**Verificación.** 01-por-pasos: archivos; archivos.js

### FRM-52 · Cada rechazo dice su motivo y cada archivo muestra su estado

**Regla.** Lo que se sabe sin leer el archivo (tipo, peso, número, vacío, duplicado) se rechaza en el acto con motivo; lo que exige leerlo (firma real, dimensiones, optimización) se muestra en la lista con estado, progreso y «Reintentar». El tipo real se verifica por firma (bytes iniciales), no por extensión; los duplicados por SHA-256; el nombre se sanea. El archivo listo se ve en verde, con su estado escrito; con el máximo ya cargado, «Elegir archivo» y la cámara se ocultan (y el foco pasa a «Quitar») y vuelven al quitar un archivo; con un solo archivo o un solo formato, los textos van en singular.

**Por qué.** «Archivo no válido» no dice qué cambiar; un .jpg que no es imagen pasa la extensión y rompe el servidor.

**Nivel.** RECOMENDADO · **Origen.** A FRM-61; B FRM-ARC-03; P71 (proyecto de acreditaciones, 17 oct 2026) · *decisión heredada*

**Verificación.** 01-por-pasos: rechazo inmediato con motivo, error tras leer; 07: máximo cargado

### FRM-53 · Las fotografías se optimizan en el navegador y se conserva la huella del original

**Regla.** Las imágenes se redimensionan al lado mayor configurado y se recomprimen antes de subir; viaja la huella SHA-256 del original y, sólo si conservarExif está activo, la fecha y la ubicación EXIF (desactivado por omisión, decisión C6).

**Por qué.** Una foto de 12 MB desde la calle no sube; sin huella no se prueba que la imagen es la que se tomó; el EXIF revela la ubicación de quien denuncia.

**Nivel.** RECOMENDADO · **Origen.** A FRM-62; A FRM-63; B FRM-ARC-02; C6 · *decisión heredada*

**Verificación.** 01-por-pasos: sha256 en payload; validaciones.config.js ARCHIVOS

### FRM-54 · El servidor revalida los archivos

**Regla.** El servidor comprueba de nuevo tipo real, peso, número y total, y conserva el original antes de cualquier transformación. Los archivos no entran al borrador local.

**Por qué.** La validación del navegador se salta; un archivo que entró sin revisar es un riesgo permanente.

**Nivel.** BASE · **Origen.** A FRM-65; A FRM-66; B FRM-ARC-03 · *decisión heredada*

**Verificación.** codigo/servidor/validar.mjs; 06-servidor

## 9. Datos personales y protección contra el abuso

### FRM-55 · No se pide un dato sin uso declarado; los personales declaran finalidad; los sensibles no se guardan

**Regla.** Todo campo declara data-uso. Los datos personales declaran data-finalidad y, los de identidad o contacto, data-sensible. herramientas/auditar-campos.mjs lo comprueba y el inventario (FormKit.iniciar().inventario()) lo enumera para el aviso de privacidad.

**Por qué.** Un dato «por si acaso» es un dato personal que hay que resguardar, justificar y suprimir con reglas.

**Nivel.** BASE · **Origen.** A FRM-80; A FRM-82; B FRM-CMP-09; norma 1.8 · *decisión heredada*

**Verificación.** herramientas/auditar-campos.mjs D1–D3

### FRM-56 · El aviso de privacidad se lee en pantalla antes de enviar y los fundamentos sin verificar quedan en hueco

**Regla.** El aviso simplificado se abre en un diálogo desde la pantalla de envío, inmediatamente antes de la casilla de declaración. Toda cita normativa que no esté verificada se deja como [Art. __, fracc. __] con el rótulo de pendiente.

**Por qué.** Un enlace a otra página no se lee; un artículo inventado llega a un documento firmado.

**Nivel.** BASE · **Origen.** A FRM-81; A FRM-94; B FRM-DP-02; B FRM-TXT-03 · *decisión heredada*

**Verificación.** 01-por-pasos: diálogo de privacidad; revisión jurídica (no automatizable)

### FRM-57 · El anonimato es posible: el contacto se pide sólo si la persona lo elige

**Regla.** Los datos de contacto van detrás de una pregunta condicional «¿Quieres que te contactemos?»; si la respuesta es no, no se piden ni viajan.

**Por qué.** Exigir identificarse para denunciar desalienta y expone.

**Nivel.** RECOMENDADO · **Origen.** B FRM-DP-01 · *decisión heredada*

**Verificación.** 01-por-pasos: contacto condicional; 06-servidor: contacto no

### FRM-58 · Prueba de humanidad accesible, campo trampa y tiempo mínimo como señales; límite por origen en el servidor

**Regla.** La casilla de declaración, el campo trampa fuera de pantalla y el tiempo de llenado viajan en meta como señales que el servidor pondera; nunca acertijos visuales ni reconocimiento de imágenes. El límite por origen endurece antes de cortar y sus cifras no se publican.

**Por qué.** Un captcha visual excluye; un límite publicado se calibra desde fuera.

**Nivel.** RECOMENDADO · **Origen.** A FRM-71; A FRM-72; A FRM-74; B FRM-SEG-01; B FRM-SEG-03; B FRM-SEG-04 · *decisión heredada*

**Verificación.** 01-por-pasos: límite; validar.mjs señales

### FRM-59 · Cero valores fijos en el código

**Regla.** Dominio, destino del envío, proveedor del mapa, catálogos, límites, mensajes y plazos viven en configuración (FORMKIT_CONFIG, FORMKIT_OPCIONES, FORMKIT_CATALOGOS, validaciones.config.js). Si al cambiar de dominio hay que tocar código fuente, el diseño está mal.

**Por qué.** Un valor escrito en el código se despliega mal en el siguiente ambiente.

**Nivel.** BASE · **Origen.** A FRM-83; norma 1.6 · *decisión heredada*

**Verificación.** revisión de código; plantillas: configuracion-*.js

## 10. Móvil y escritorio

### FRM-60 · Móvil primero: el CSS parte del teléfono y sólo crece

**Regla.** Las hojas se escriben para el ancho más angosto y las adaptaciones usan únicamente min-width en los tres puntos de corte (560, 760 y 1024 px, declarados en tokens.css). Nunca max-width.

**Por qué.** Un diseño de escritorio recortado para el teléfono deja objetivos pequeños y textos que desbordan.

**Nivel.** BASE · **Origen.** encargo 4 · *decisión del encargo*

**Verificación.** auditor-css A11 (sólo min-width y puntos declarados)

### FRM-61 · Sin desplazamiento horizontal de 320 a 1920 px

**Regla.** Toda página del paquete se verifica en 320, 360, 390, 768, 1024, 1280 y 1920 px sin desplazamiento horizontal ni contenido cortado; sólo tablas, código y mapas pueden ser más anchos, dentro de su propio contenedor con desplazamiento.

**Por qué.** Un desplazamiento lateral en el teléfono esconde el botón de enviar.

**Nivel.** BASE · **Origen.** encargo 4; B FRM-A11Y-05 · *decisión del encargo*

**Verificación.** 03-anchos.prueba.mjs

### FRM-62 · Todo lo que se toca mide al menos 44 px con puntero táctil

**Regla.** Botones, enlaces de acción, opciones, pestañas y controles miden al menos 44 px en teléfono; los enlaces dentro de texto corrido cumplen 24 px con espacio alrededor.

**Por qué.** El dedo no acierta a 32 px; errar un botón en la calle es abandonar.

**Nivel.** BASE · **Origen.** A FRM-46; B FRM-A11Y-02 · *decisión heredada*

**Verificación.** 03-anchos.prueba.mjs: objetivos táctiles (320–768)

### FRM-63 · Teclado adecuado, zoom permitido, áreas seguras y alto dinámico

**Regla.** Cada campo declara inputmode y type para el teclado correcto; el viewport nunca bloquea el zoom; los bloques fijos respetan env(safe-area-inset-*); los altos que dependen de la pantalla usan dvh o clamp.

**Por qué.** Un teclado alfabético para un CP, un zoom bloqueado o una barra bajo la muesca del teléfono son fricciones que se suman.

**Nivel.** BASE · **Origen.** encargo 4 · *decisión del encargo*

**Verificación.** auditar-campos.mjs D4; tokens.css --safe-*; base.css

### FRM-64 · Mismo comportamiento en teléfono y escritorio; los perfiles se prueban por separado

**Regla.** Toda prueba de flujo corre en un perfil móvil táctil (390 px) y en uno de escritorio (1280 px). La ficha de cada módulo dice cómo se comporta en cada uno. Ningún bloque se cierra sin la casilla «Verificado en móvil y en escritorio».

**Por qué.** Lo que funciona con ratón falla con dedo y viceversa; comprobarlo al final cuesta el doble.

**Nivel.** BASE · **Origen.** encargo 4; encargo 9 · *decisión del encargo*

**Verificación.** 01-por-pasos y 02-una-pagina en PERFILES; docs/08

### FRM-65 · Movimiento reducido, alto contraste forzado e impresión

**Regla.** Con prefers-reduced-motion no hay transiciones ni animaciones; con forced-colors los bordes y el foco se conservan; la hoja de impresión oculta lo interactivo y muestra el acuse completo.

**Por qué.** Una animación puede marear; el modo de alto contraste borra lo que sólo era color de fondo.

**Nivel.** BASE · **Origen.** A FRM-48; B FRM-A11Y-04 · *decisión heredada*

**Verificación.** 03-anchos: movimiento reducido; nucleo.css adaptaciones

## 11. Hojas de estilo y código

### FRM-66 · Orden fijo de bloques en toda hoja

**Regla.** Cada hoja declara sus bloques con /* @bloque nombre */ en el orden variables → reinicio → estructura → componentes → estados → utilidades → adaptaciones; una regla nueva va en su bloque, nunca al final. Los módulos declaran componentes → estados → adaptaciones.

**Por qué.** Añadir al final es lo que produce selectores duplicados que el navegador no avisa.

**Nivel.** BASE · **Origen.** A FRM-85; B FRM-STY-05; norma 8.3 · *decisión heredada*

**Verificación.** auditor-css A13

### FRM-67 · Ningún color ni longitud literal fuera de tokens.css

**Regla.** Colores sólo como var(--token) definidos en :root de tokens.css; longitudes, radios, trazos, duraciones e interlineados sólo desde tokens. La guía visual puede definir variables propias con prefijo --guia-, declaradas en la configuración del auditor.

**Por qué.** Un #9D2148 suelto se convierte en tres guindas distintos en seis meses.

**Nivel.** BASE · **Origen.** A FRM-86; B FRM-STY-01 · *decisión heredada*

**Verificación.** auditor-css A04, A05, A06, A15

### FRM-68 · Un selector, una declaración; sin !important; sin id; dos niveles como máximo

**Regla.** Cada selector se declara una vez por contexto (las excepciones deliberadas llevan comentario); una propiedad aparece una vez por regla; !important sólo en prefers-reduced-motion; nada se estiliza por id; las cadenas no pasan de dos niveles; los estados se leen de atributos ([aria-invalid], [aria-pressed], :checked), nunca de clases .activo.

**Por qué.** La especificidad acumulada obliga a !important, y !important obliga a más !important.

**Nivel.** BASE · **Origen.** A FRM-88; B FRM-STY-02; B FRM-STY-03; B FRM-STY-06 · *decisión heredada*

**Verificación.** auditor-css A01, A02, A03, A07, A08, A10

### FRM-69 · [hidden] se oculta sin !important y nada lo pisa

**Regla.** [hidden]{display:none} va al final del núcleo sin !important (decisión C9). Todo módulo que declare display en un elemento que puede ocultarse usa .clase:not([hidden]).

**Por qué.** Un display:flex posterior deja visible lo oculto y el formulario envía o valida lo que no debía verse.

**Nivel.** BASE · **Origen.** A FRM-88; C9 · *decisión heredada*

**Verificación.** 03-anchos.prueba.mjs: todo [hidden] se ve como display:none

### FRM-70 · Sin manejadores en línea, sin estilos en línea, sin código zombi

**Regla.** Los eventos se registran por delegación en el código; el HTML no lleva onclick ni style (salvo variables de muestra en la guía). Toda clase y variable declarada se usa en algún HTML o script del paquete.

**Por qué.** Un onclick en el HTML no se puede probar ni auditar; una clase sin uso es una promesa que nadie cumple.

**Nivel.** BASE · **Origen.** A FRM-89; A FRM-90; B FRM-STY-07 · *decisión heredada*

**Verificación.** auditor-css A09, A16; revisión

### FRM-71 · Núcleo obligatorio y módulos independientes con manifiesto

**Regla.** El núcleo (tokens, base, nucleo, validaciones.config, iconos, formkit.core) va siempre; cada módulo vive en su carpeta con su CSS y su JS, declara en codigo/manifiesto.json nivel, propósito, cuándo, cuándo no, dependencias, accesibilidad y comportamiento en teléfono y escritorio, y se activa solo si el formulario contiene su selector. Los módulos de ámbito documento se inician una sola vez aunque la página tenga varios formularios.

**Por qué.** Un paquete monolítico se copia entero o no se copia; un módulo sin ficha se usa mal.

**Nivel.** BASE · **Origen.** C1; encargo 7 · *decisión del encargo*

**Verificación.** 06-servidor: manifiesto; 04-modulos: varios formularios en una página

### FRM-72 · Iconografía: un solo sprite SVG, catálogo cerrado

**Regla.** Los iconos viven en codigo/iconos/sprite.svg (29 símbolos), se inyectan una vez por página y heredan el color del texto. El decorativo lleva aria-hidden; el que comunica va junto a texto; sólo «cerrar», «buscar» y los enlaces a redes sociales pueden ir solos, con nombre accesible. Las marcas de redes sociales van rellenas, como las publica cada red.

**Por qué.** Iconos de tres fuentes distintas se ven distintos y pesan; un icono sin nombre es mudo.

**Nivel.** BASE · **Origen.** encargo 5.4; redes sociales (la Secretaría, 14 oct 2026) · *decisión del encargo*

**Verificación.** guía: catálogo de iconos; 03-anchos: nombres

## 12. Textos y pendientes visibles

### FRM-73 · Registro institucional claro: frases cortas, voz activa, sin siglas sin explicar

**Regla.** Los textos del formulario hablan a la persona de tú con oraciones cortas; el nombre de la institución se escribe completo la primera vez. Las acciones se atribuyen a «la Secretaría».

**Por qué.** Un formulario que no se entiende se llena mal o no se llena.

**Nivel.** BASE · **Origen.** A FRM-92; B FRM-TXT-04 · *decisión heredada*

**Verificación.** revisión editorial (no automatizable)

### FRM-74 · Lo que no se dice, no se promete

**Regla.** No se anuncian plazos, correos automáticos ni seguimientos que el sistema no cumpla. El acuse dice sólo lo que ocurrirá.

**Por qué.** Una promesa incumplida en pantalla se convierte en queja.

**Nivel.** BASE · **Origen.** A FRM-93; B FRM-TXT-01 · *decisión heredada*

**Verificación.** revisión de contenido

### FRM-75 · Lo pendiente se ve, con rótulo «Pendiente» en el HTML

**Regla.** Todo dato no resuelto (horario, fundamento, teléfono) se muestra con la clase .pendiente y la palabra «Pendiente:» escrita en el HTML, nunca sólo en CSS, para que el lector de pantalla la lea.

**Por qué.** Un hueco invisible llega a producción como si estuviera resuelto.

**Nivel.** BASE · **Origen.** A FRM-95; B FRM-TXT-02; C11 · *decisión heredada*

**Verificación.** guía: pendiente; revisión

### FRM-76 · Datos de ejemplo siempre ficticios y legibles

**Regla.** Nombres, correos, teléfonos, folios y catálogos de muestra son inequívocamente falsos (ejemplo.local, teléfonos de ceros, «Fulana de Tal»), marcados como ficticios, y legibles para que no parezcan un error del sistema.

**Por qué.** Un dato creíble en una base de pruebas termina en una captura o en producción y ya no se distingue.

**Nivel.** BASE · **Origen.** norma 3; encargo · *decisión del encargo*

**Verificación.** revisión; catálogo cdmx-ejemplo.js es_ficticio

## 13. Bibliotecas, tipografías y verificación

### FRM-77 · Todo se sirve desde el propio servidor

**Regla.** Tipografías, CSS, JS, iconos, Leaflet y axe-core viajan en el paquete; ninguna página pide nada a un tercero salvo el mapa base declarado en configuración.

**Por qué.** Un recurso externo bloqueado por política de red deja la página rota; además filtra la IP de la persona.

**Nivel.** BASE · **Origen.** A FRM-96; B FRM-LIB-01 · *decisión heredada*

**Verificación.** 03-anchos: nada se pide a un tercero

### FRM-78 · Cabin 600/700 para títulos y Roboto 400/500/700 para el cuerpo, autoalojadas con licencia

**Regla.** Las tipografías se incluyen en codigo/fuentes con su licencia (OFL / Apache) y sólo los pesos declarados en tokens.css (decisión C12).

**Por qué.** Una tipografía desde Google Fonts es una petición a un tercero; pesos de más son kilobytes de más.

**Nivel.** BASE · **Origen.** A FRM-97; C12 · *decisión heredada*

**Verificación.** 06-servidor: tipografías; 03-anchos: las tipografías cargan

### FRM-79 · Cada biblioteca con versión exacta, licencia y suma de verificación

**Regla.** vendor/MANIFIESTO.json registra Leaflet, leaflet-gesture-handling y axe-core con versión, licencia y SHA-256; herramientas/vendor.mjs --verificar lo comprueba.

**Por qué.** Una biblioteca sin suma puede cambiar sin que nadie lo note.

**Nivel.** BASE · **Origen.** A FRM-98; B FRM-LIB-02 · *decisión heredada*

**Verificación.** 06-servidor: bibliotecas coinciden con el manifiesto

### FRM-80 · Lo que sólo sirve para verificar no viaja al sitio

**Regla.** Playwright y axe-core son devDependencies; el código del estándar no tiene dependencias. La carpeta pruebas/_humo y node_modules no entran en el ZIP.

**Por qué.** Una herramienta de pruebas en producción es superficie de ataque y peso.

**Nivel.** BASE · **Origen.** A FRM-99 · *decisión heredada*

**Verificación.** package.json; construir.mjs --zip

### FRM-81 · Ningún bloque se cierra sin verificación con evidencia

**Regla.** Antes de liberar: npm run verificar en verde (auditor, contraste, campos, bibliotecas, documentos generados, pruebas en dos perfiles y siete anchos, axe-core); capturas en verificacion/capturas; recorrido con teclado y lector de pantalla real; prueba en un iPhone y un Android reales con red limitada; casilla «Verificado en móvil y en escritorio». Lo que no pudo comprobarse se escribe.

**Por qué.** «Se ve bien» sin evidencia no es verificación; lo que no se escribe se olvida.

**Nivel.** BASE · **Origen.** B FRM-MET-02; encargo 9 · *decisión del encargo*

**Verificación.** herramientas/verificar.mjs; docs/08-verificacion-y-cierre.md

