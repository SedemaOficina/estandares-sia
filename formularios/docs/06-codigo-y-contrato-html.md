# 06 · Código, módulos y contrato HTML

Para quien programa. Qué archivos hay, cómo se cargan, qué atributos entiende el núcleo, cómo se escribe un módulo y qué recibe el servidor.

## 1. Estructura del paquete

```
codigo/
  css/        tokens.css · base.css · nucleo.css              (núcleo, siempre)
  js/         validaciones.config.js · iconos.js (generado) · formkit.core.js
  fuentes/    Cabin 600/700, Roboto 400/500/700 (woff2) + licencias OFL
  iconos/     sprite.svg (30 símbolos; iconos.js se genera de aquí)
  imagenes/   logotipo-sedema.png (477 × 96 px: el doble de los 48 px de alto en que se muestra)
  modulos/    <nombre>/<nombre>.css · <nombre>.js      (30 módulos, cada uno se copia solo)
  catalogos/  cdmx-ejemplo.js (ficticio) · LEEME.md
  plantillas/ por-pasos.html + configuracion-por-pasos.js · una-pagina.html + configuracion-una-pagina.js
  servidor/   validar.mjs · esquemas/*.json (generados)
  manifiesto.json   núcleo y módulos: nivel, propósito, dependencias, archivos, tamaños
dist/         formkit.css · formkit.js  («todo en uno», generado; para quien no quiere elegir módulos)
guia-visual/  index.html · guia.css · guia.js · guia-config.js · ejemplos/ · muestras/ · manifiesto.js y pares.js (generados) · artefacto.html (autocontenido, generado)
herramientas/ construir · auditor-css · contraste · auditar-campos · esquema-desde-html · generar-reglas · vendor · verificar · capturas
pruebas/      *.prueba.mjs (node:test + Playwright) · ayudas.mjs · ejecutar.mjs · paginas/ (correcciones, desenlace, consulta, borrador)
reglas/       reglas.json (fuente única de las 86 reglas)
docs/         01–09
vendor/       leaflet · leaflet-gesture-handling · pdfjs-dist (visor) · axe-core (con MANIFIESTO.json y sumas)
```

El código del estándar **no tiene dependencias**: scripts clásicos (sin módulos ES, sin bundler) para que una plantilla abra desde un archivo local. Playwright y axe-core son sólo de verificación.

## 2. Orden de carga

```html
<link rel="stylesheet" href="codigo/css/tokens.css">
<link rel="stylesheet" href="codigo/css/base.css">
<link rel="stylesheet" href="codigo/css/nucleo.css">
<link rel="stylesheet" href="codigo/modulos/<modulo>/<modulo>.css">   <!-- uno por módulo usado -->
…
<script src="configuracion.js"></script>              <!-- tus ajustes: FORMKIT_CONFIG, FORMKIT_OPCIONES, FORMKIT_CATALOGOS -->
<script src="codigo/js/validaciones.config.js"></script>
<script src="codigo/js/iconos.js"></script>
<script src="codigo/catalogos/cdmx-ejemplo.js"></script>   <!-- sólo con combo o cascadas; sustituir por el oficial -->
<script src="codigo/js/formkit.core.js"></script>
<script src="vendor/leaflet/leaflet.js"></script>          <!-- sólo con mapa -->
<script src="vendor/leaflet-gesture-handling/leaflet-gesture-handling.min.js"></script>
<script src="codigo/modulos/<modulo>/<modulo>.js"></script>  <!-- uno por módulo usado, después del núcleo -->
```

La configuración va **antes** del núcleo porque el núcleo la fusiona al cargar. El árbol de decisión de la guía genera estas etiquetas según lo marcado.

## 3. Arranque

Todo `<form data-formkit>` se inicia solo al cargar la página con `window.FORMKIT_OPCIONES`; con `data-formkit="manual"` no arranca solo y la página lo inicia cuando termine de pintar sus datos. Cada formulario se inicia una sola vez: si ya arrancó y la página vuelve a llamar `FormKit.iniciar`, se le suman las opciones nuevas y se devuelve la misma instancia, sin duplicar escuchas. Quien necesite opciones por formulario llama:

```js
const instancia = FormKit.iniciar(form, {
  enviar(payload, { signal }) { return fetch(…, { signal }).then(r => r.json()); },  // si falta, POST JSON a action
  alEnviar(respuesta, form) { … },   // si falta, se emite el evento formkit:enviado en el form
  alFallar(error, form) { … }
});
instancia.payload();     // {datos, meta} que se enviaría ahora
instancia.valida();      // [{campo, mensaje}] de lo visible y activo
instancia.inventario();  // datos personales: campo, uso, finalidad, sensible, autocomplete
instancia.marcaError('curp', 'Ya hay una cuenta con esta CURP.');  // error que viene de fuera, junto a su campo
```

**Errores que devuelve el servidor.** Si el envío falla con un cuerpo `{errores: [{campo, mensaje}]}` (la misma forma que devuelve `validar.mjs`), cada mensaje se pinta junto a su campo y en el resumen de errores; por pasos, se abre el primer paso con error. El envío por omisión lo lee de una respuesta que no es 2xx; una función `enviar` propia rechaza con un error que lleve la propiedad `errores`. `FormKit.marcaError(campo, mensaje)` hace lo mismo desde cualquier código de la página, en el formulario que tenga ese campo.

**Un envío recibido es un envío recibido.** Un 2xx cuenta como recibido aunque no traiga JSON (204, «OK»); una función `enviar` propia que resuelve `null` o un objeto sin folio, también. Desde ese momento nada cuenta como envío fallido: si `alEnviar` lanza un error, la consola lo dice y la persona ve «Tu envío se recibió. No lo envíes de nuevo.» El borrador se borra después de mostrar el acuse. La clave de idempotencia es la misma en cada reintento mientras no se logre enviar, y se renueva tras un envío logrado: si el formulario sigue en pantalla para otro registro (captura en serie), el siguiente gesto de la persona empieza otro registro, con otra clave y su propio borrador.

`FORMKIT_CONFIG` se fusiona en profundidad con la configuración base (sólo se escribe lo que cambia). `FORMKIT_CATALOGOS.<nombre>` alimenta combos (`data-catalogo`) y cascadas; acepta un arreglo de cadenas, de `{nombre, detalle, valor}` o un objeto `{filas, fuente, corte, es_ficticio}`.

## 4. Contrato HTML del núcleo

Toda pregunta es una **envoltura** con `data-campo` que contiene etiqueta, ayuda opcional y control(es). El núcleo añade la marca de obligatorio, el `aria-describedby`, el contador y el mensaje de error (`.err`, siempre presente para reservar su alto).

```html
<div class="campo" data-campo="correo" data-formato="correo" data-requerido
     data-uso="Enviar el seguimiento." data-finalidad="Informar el avance." data-sensible>
  <label class="etiqueta" for="correo">Correo electrónico</label>
  <p class="ayuda">Te escribiremos sólo sobre esta solicitud.</p>
  <input class="control" id="correo" name="correo" type="email" maxlength="120" autocomplete="email">
</div>
```

| Atributo (en la envoltura salvo indicación) | Qué hace |
|---|---|
| `data-campo="nombre"` | Identifica el campo; es la clave en el payload. Obligatorio. |
| `data-formato="…"` | Formato del catálogo (ver `docs/05`). |
| `required` (en el control) o `data-requerido` | Obligatorio. |
| `data-si="campo=valor\|valor2"` (en la envoltura o en cualquier elemento que agrupe varias: `div`, `section`, `article`, `fieldset`…; el servidor exige todas las que rodean al campo) | Condicional: existe sólo si la respuesta coincide. |
| `data-uso="…"` | Para qué se pide el dato. Obligatorio en todo campo (`auditar-campos.mjs`). |
| `data-finalidad="…"` | Marca dato personal y dice su finalidad. |
| `data-sensible` | No entra al borrador local; se pide de nuevo. |
| `data-cruzada="clave [clave2]"` + `data-cruzada-campos="rol=campo rol2=campo2"` + `data-cruzada-nivel="advertencia"` | Validación cruzada (ver `docs/05`). |
| `data-min-opciones` / `data-max-opciones` | En grupos de casillas. |
| `data-mensaje="…"` | Mensaje propio de obligatorio para este campo (excepcional). |
| `data-no-futura` | La fecha no puede ser posterior a hoy. |
| `data-legible` (en el textarea) | Exige forma de texto, no tecleo al azar. |
| `data-copiable` | Añade «Copiar» a un control `readonly` (módulo copiar). |
| `data-edad-min` / `data-edad-max` | Para la cruzada `edad`. |
| `data-min-segun="clave"` / `data-max-segun="clave"` | Mínimo o máximo que depende de otras respuestas (ver abajo). |
| `data-auxiliar` | Dato que calcula la página, no la persona (ver abajo). |
| `data-sin-mostrar` | En un campo de contraseña, quita el botón «Mostrar contraseña». |
| `min`, `max`, `step`, `minlength`, `maxlength`, `inputmode`, `autocomplete`, `enterkeyhint` (en el control) | Límites y teclado; el esquema del servidor los lee. |

En el `<form>`: `data-formkit` (arranque automático; `data-formkit="manual"` para iniciarlo desde la página), `data-borrador="clave"` y `data-borrador-version="n"` (borrador local), `action`/`method` (envío por omisión), `novalidate` lo pone el núcleo. Piezas del formulario: `[data-estado-envio]` (aviso de fallo de envío; se oculta cuando la persona cambia un dato o vuelve a enviar, no al mover el foco), `[data-franja-borrador]` con `[data-borrador="recuperar|descartar|descartar-si|conservar"]`, `[data-trampa]` (campo señuelo), `[data-accion="enviar|siguiente|atras"]`.

Eventos: `formkit:enviado` (en el form, si no hay `alEnviar`), `formkit:paso` ({indice, paso, total}), `formkit:pagina` ({pagina, tamano, desde, hasta}, en el nav), `formkit:tabla` (repintar tabla).

**Módulo `enlace-mapa`.** Un contenedor `[data-enlace-mapa="<data-campo destino>"]` con su `label`, un `input` (sin `data-campo` ni `name`: el enlace no viaja) y un `[data-enlace-mapa-estado]` para el aviso. Al pegar o al salir, escribe `lat, lon` con 6 decimales en el campo destino (`data-formato="coordenadas"`), que valida el núcleo y, si hay `mapa`, mueve el punto. Toma el último lugar marcado del enlace (`!3d…!4d…`), luego `q=`/`ll=`/`/place/`, y sólo al final el centro de la pantalla (`@`), con aviso. Acomoda en el campo destino coordenadas al revés, en grados-minutos-segundos, con coma decimal o con la longitud sin signo menos. `FormKit.leeCoordenadas(texto)` es la función pura.

**Condiciones con valor vacío.** `data-si="campo="` se cumple mientras el campo esté vacío o la casilla sin marcar; el servidor lo evalúa igual, porque lo que no viene en los datos cuenta como vacío. Un campo con su propia condición dentro de uno o varios bloques `data-si` exige todas (el esquema las guarda en `condiciones`, de afuera hacia adentro; `si` es la más cercana).

**Condiciones encadenadas.** Una condición que mira un campo oculto lo toma como vacío: si «¿Quieres que te contactemos?» = «No» oculta el medio de contacto, también se oculta lo que dependía del medio, aunque el medio conserve su respuesta anterior. El servidor aplica la misma regla.

**Dato calculado por la página.** `<input type="hidden" data-campo="sin_materno" data-auxiliar>` guarda un dato que calcula el código de la página (no lo escribe la persona): cuenta en las condiciones `data-si` y en las validaciones cruzadas, pero no se valida, no entra al borrador y **no se envía**. La página escribe su valor y avisa con `campo.dispatchEvent(new Event('input', { bubbles: true }))`. El servidor no confía en él: lo vuelve a calcular con `validaPayload(…, { auxiliares: { sin_materno: (datos) => … } })` y rechaza el envío que lo traiga.

**Mínimo o máximo según otra respuesta.** `data-max-segun="cupo"` en la envoltura de un número toma el máximo de `FORMKIT_CONFIG.limitesSegun.cupo(datos)` (por ejemplo, cuántos acompañantes admite la actividad elegida; `data-min-segun` hace lo mismo con el mínimo), que recibe las respuestas activas y devuelve un número (o nada, para dejar el límite del control). Al cambiar la respuesta de la que depende, el campo se vuelve a revisar. El servidor recibe la misma función en `validaPayload(…, { limitesSegun: { cupo } })`; si falta, lo anota en `senales`.

**Mostrar contraseña.** Todo campo `type="password"` recibe, dentro del campo y a la derecha, un botón «Mostrar» / «Ocultar» con `aria-pressed` (el lector oye «Mostrar: Contraseña» o «Mostrar: Confirma tu contraseña»: cada botón dice de qué campo es). El núcleo envuelve el control en `.contrasena-caja`, que en una `.fila` ocupa el renglón del control. Al enviar, la contraseña vuelve a ocultarse. `data-sin-mostrar` en la envoltura quita el botón.

**Fotografía de frente.** En el módulo `archivos`, `capture="user"` en el `input` abre la cámara frontal del teléfono (retrato, fotografía de la persona); `capture="environment"` abre la trasera (evidencias). Con `data-max="1"`, los textos van en singular: «Un archivo de hasta 8 MB».

**Edad calculada.** `data-deriva="edad=destino"` en un campo `data-formato="fecha"` (módulo `fecha`) escribe la edad cumplida, con la fecha de hoy en la Ciudad de México, en un `[data-campo]` con `<input readonly>`. Se recalcula cada vez que cambia la fecha, también cuando la escribe la CURP; con una fecha vacía, incompleta o futura queda vacía. La edad mínima o máxima que exija el formulario se pide sobre la fecha, con la cruzada `edad`.

**Ayuda de bloque.** `<p class="ayuda-bloque">` bajo el título de una sección dice una sola vez lo que vale para todos sus campos («Escríbelos como aparecen en tu identificación oficial»). El núcleo la enlaza con `aria-describedby`, antes de la ayuda propia, a cada campo que le sigue dentro de su contenedor, hasta el siguiente título (`h1`–`h6`) o la siguiente ayuda de bloque; si vale sólo para una parte, se envuelve esa parte con su ayuda en un `div`. `auditar-campos` (D6) avisa cuando dos campos seguidos repiten la misma ayuda.

**Filas para datos hermanos.** `.fila` (dos columnas), `.fila-3` (tres) y `.fila-2-1` (la primera al doble) sólo para datos hermanos: nombre y apellidos en `.fila-3`; CURP y fecha de nacimiento, correo y su confirmación, contraseña y su confirmación, calle y número, manzana y lote, en `.fila`. Lo demás, en una columna. Desde 760 px se alinean con subcuadrícula; en teléfono, una columna.

**Opciones en línea.** `.opciones-lista.opciones-en-linea` pone dos o tres opciones cortas sin descripción (Sí/No) una por columna desde 760 px, con el mismo hueco que las filas; en teléfono, una por renglón.

**Fecha de nacimiento sin calendario.** `data-formato="fecha-dma"` en un `<input type="text" inputmode="numeric" maxlength="10">` (módulo `fecha`): se escribe día/mes/año y la escritura se acomoda sola (`2371985` → `23/07/1985`); acepta también guiones, puntos y la forma AAAA-MM-DD que pone el autocompletado, y se envía como DD/MM/AAAA. Con `data-no-futura` no acepta fechas posteriores a hoy; `data-deriva="edad=…"` calcula la edad igual que con `fecha`; la CURP con `data-deriva="fechaNacimiento=…"` la escribe en ese formato, y la cruzada `curp-fecha` (o `curp-fecha-dma`) la compara.

**Respuestas frecuentes fijas.** `data-chips-fijos="No se lee completo|Está vencido|Falta una página"` en la envoltura (módulo `chips`) muestra siempre esos botones. No guarda nada en el dispositivo, así que sirve también en datos personales. En un texto largo, el chip agrega su texto al final y deja el foco ahí para completarlo; en un campo corto, lo pone como respuesta. El grupo se llama «Respuestas frecuentes para …» con la etiqueta del campo; `data-chips-etiqueta` cambia la parte de la etiqueta («Motivos frecuentes para Identificación oficial», con `mensajes.chipsFijos` = «Motivos frecuentes para {etiqueta}»), `data-chips-fijos-nombre` le da un nombre completo, y si varios campos comparten etiqueta, a cada grupo se le agrega el título de su sección (o su número) para que el lector de pantalla los distinga.

**Tabla filtrada.** Para filtrar, la página oculta filas con `hidden`: la fila no se ve y el rayado alterno cuenta sólo las visibles. Un encabezado cuyo texto es sólo para lector de pantalla (`<th><span class="solo-lector">Acciones</span></th>`) no muestra rótulo en la tarjeta del teléfono. En teléfono, cada celda es una rejilla fija rótulo | valor: el módulo pone el contenido de la celda en `.tabla-valor` (si la página vuelve a pintar filas, avisa con el evento `formkit:tabla`). En computadora, la línea de cada fila llega bajo todas las columnas y el contenido va centrado en vertical. La tabla se inicia sola al cargar la página, también en una página de pura consulta sin formulario; con `formkit:tabla` vuelve a leer los encabezados (por ejemplo, uno que la página calcula después) y prepara el orden de las columnas que ya tienen texto. Una celda con `data-etiqueta` escrito en el HTML conserva ese rótulo. En teléfono, el rótulo va en gris y peso normal, y el dato destaca, como en la ficha y en la revisión. En computadora no se parten botones, folios ni etiquetas (el folio va en `<span class="mono">`) y la columna de acciones (la de encabezado sólo para el lector) toma el ancho de sus botones; una palabra larga se parte sólo si no cabe en su renglón.

**Visor de documentos.** Módulo `visor`: un `<dialog class="visor" data-visor>` (contrato completo en el encabezado de `visor.js`) dentro de `.visor-area`, junto a lo que se revisa; cada botón `data-visor-url="…"` (con `data-visor-titulo`, `data-visor-archivo` y, para una imagen sin extensión, `data-visor-tipo`) lo abre, o `FormKit.visor.abre({ url, titulo, archivo, tipo, nota }, boton)`. Usa pdf.js de `vendor/pdfjs-dist/`, que busca junto a la carpeta que contiene `modulos/` (`formularios/vendor/` en el estándar, `<carpeta>/vendor/` si el estándar se copió en `<carpeta>/formkit/`) o en la ruta de `FORMKIT_CONFIG.visor.pdfjs`; pdf.js se carga sólo al abrir el primer PDF y, si no lo encuentra, lo dice en la consola; si no se puede cargar, muestra el documento con el visor del navegador y lo dice. La página necesita servirse desde un servidor: abierta con doble clic, el navegador no deja cargar pdf.js.

**Avisos con título.** `<div class="aviso aviso-ok" role="status"><svg class="icono" aria-hidden="true"><use href="#i-ok"></use></svg><div class="aviso-texto"><strong class="aviso-titulo">Recibido</strong><p>Tu solicitud quedó registrada.</p></div></div>`. Un aviso de una sola frase, sin lista, puede ir como `<p class="aviso">` con `<span class="aviso-texto">`. El icono de su tono va siempre (en el código, los tonos son `neutro` con `info`, `advertencia` con `alerta`, `bloqueo` con `error` y `ok` con `ok`; un tono que no existe queda como neutro); el aviso que pasa de una frase lleva `.aviso-titulo`. Desde el código, `FormKit.aviso(lugar, { tono, titulo, texto, pasos, foco })` lo pinta con su icono y su rol, con el cuerpo en un `<div class="aviso-texto">`: `texto` es una cadena (va en un `<p>`) o un nodo, por ejemplo un `<p>` con un enlace; `pasos`, la lista de lo que sigue, que va como secuencia numerada. Si `lugar` es un `.aviso`, ahí (un `<p class="aviso">` se cambia por un `<div>` con sus mismos atributos, porque una lista no cabe en un párrafo; la función devuelve el aviso pintado); si no, al principio de `lugar`, sustituyendo al que haya puesto antes. `foco: true` cuando responde a una acción de la persona.

**Todo anuncio también se ve.** `FormKit.anuncia(texto, { visible: elemento })` escribe el texto en ese elemento (en su `.aviso-texto`, si es un aviso), lo muestra y lo anuncia; `{ cortes: true }` lo hace asertivo (también vale `anuncia(texto, true)`, como antes). Sin `visible`, lo anunciado ya debe estar en pantalla. Los módulos del estándar lo cumplen: «Agregar» con el máximo de filas dice el límite junto al botón (`.repetible-limite`), el campo de archivos lleno lo dice bajo la lista (`.arch-lleno`) y la descarga que falla deja un aviso junto a su botón (`[data-descarga-aviso]`).

**Resumen con contexto.** `data-contexto="Identificación oficial"` en un `[data-campo]` o en un elemento que lo rodea (una `<section>` por documento) pone ese nombre antes del mensaje en el resumen de errores («Identificación oficial: Completa «Observación».»). Los títulos del resumen (`resumenUno`, `resumenVarios`) hablan de respuestas; los del rechazo del servidor son `resumenServidorUno` y `resumenServidorVarios`.

**Confirmación con consecuencias.** `FormKit.confirma(ancla, { titulo, texto, consecuencias: ['…'], irreversible: true, si: 'Rechazar solicitud', peligro: true })` devuelve una promesa con `true` o `false`. `no` es «Volver sin cambios» por omisión y recibe el foco; si falta `si`, la consola lo avisa (debe repetir el verbo). El botón que abre la confirmación lleva `.btn btn-peligro-contorno`; el que hace el daño dentro de ella, `.btn btn-peligro` (rojo relleno).

**Módulo `resultado`.** Para el personal, después de decidir: `<section class="resultado" data-resultado hidden>` con, si se quiere, `<div class="acciones" data-resultado-acciones>…</div>` (se conserva al final). `FormKit.resultado(lugar, { tono: 'ok'|'atencion'|'proceso'|'rechazo'|'terminado', titulo, texto, hora, quien, motivo, pasos, nivel, oculta })`: el tono es una de las cinco familias de `estado`; `hora` es la del servidor (sin ella, ahora) y se dice en la hora de la Ciudad, con la fecha si no fue hoy; `motivo` se cita tal cual; `pasos` (lista) va como secuencia «Qué sigue»; `oculta` esconde el panel de decisión. El foco va al título.

**Módulo `estado`.** `<span class="estado estado-proceso">En revisión</span>`; cinco familias según a quién le toca qué: `estado-ok` (hecho), `estado-atencion` (te toca actuar; también un borrador sin enviar), `estado-proceso` (en marcha), `estado-rechazo` (cerrado sin éxito) y `estado-terminado` (terminado). Una etiqueta sin familia se avisa en la consola y queda como terminada. El módulo pone el icono de cada familia al cargar (también en una página sin formulario); una etiqueta larga se parte en renglones; sólo dentro de una `.tabla` en computadora va en una línea. `FormKit.estado(el, { tono, texto, anuncia })` lo cambia y `FormKit.estado.inicia(contenedor)` prepara las que la página pinte después.

**Secuencia «qué sigue».** Varias acciones en orden van en `<ol class="secuencia"><li class="secuencia-item">Abre «Mis documentos».</li>…</ol>`, cada una con su verbo, nunca en un párrafo. Es del núcleo: sirve en cualquier pantalla, dentro de un aviso (en un `<div class="aviso">` con `<div class="aviso-texto">`) y en el resultado (`pasos`); en el acuse va centrada, a su ancho y con su filete.

**Anchos del texto.** La bajada (`.bajada`) y la ayuda de bloque (`.ayuda-bloque`) ocupan el ancho de su tarjeta. El texto corrido de varios párrafos lleva `.texto-corrido` (hasta 70 caracteres por renglón). Una línea de datos: `<p class="linea-datos"><span class="linea-datos-item">Folio EJ-123</span> · <span class="linea-datos-item">Recibida el 17 de octubre de 2026</span></p>`; cada dato pasa completo al renglón siguiente si no cabe.

**Borrador que empieza con la persona y archivos con proveedor.** El borrador (`data-borrador`) empieza con el primer gesto de la persona en el formulario: lo que la página escribe sola al precargar una solicitud, aunque lance `input` o `change`, no crea un borrador. Los archivos no van al almacén del dispositivo; para que vuelvan con el borrador, la página da un proveedor: `FormKit.iniciar(form, { borradorArchivos: { guarda(campo, archivos), lee(campo), borra(campo) } })`. `guarda` recibe los archivos originales (`File`) de cada campo al escribir el borrador; `lee` devuelve, o promete, los `File` al recuperarlo; `borra` avisa al descartarlo o al enviar. El proveedor decide dónde guardarlos (su servidor, su almacén). Para que el proveedor ya esté cuando el borrador se recupera al iniciar, usa `data-formkit="manual"` e inicia el formulario con el proveedor, o pásalo en `FORMKIT_OPCIONES.borradorArchivos` antes de cargar el núcleo. El proveedor recibe cada archivo como lo eligió la persona; una foto JPG, sin sus metadatos si el formulario no pide `conservarExif`. Un módulo propio se suscribe con `ctx.alBorrador({ escribe, restaura, borra, estado, prepara })`: `estado()` devuelve los campos propios que el módulo guarda en el borrador (`repetibles` guarda qué filas había) y `prepara(b)` rehace su estructura antes de que el núcleo reponga los valores (`repetibles` rehace sus filas). Es por formulario: no pisa lo de otro módulo, como pasaría con `FormKit.ganchos.estadoBorrador`.

**Mientras la franja del borrador espera.** Con la franja a la vista, no se guarda nada: lo que la persona escriba antes de elegir «Recuperar borrador» o «Empezar de nuevo» no reemplaza al borrador guardado. Con su respuesta, el borrador vuelve a guardarse.

**El acuse sobrevive a una recarga.** El módulo `acuse` guarda el folio y la fecha (no los datos de la persona) con la clave del borrador más `:acuse` y, si la persona recarga la página, vuelve a mostrarlos durante `acuse.horasVisible` (24 horas). Un botón `<button type="button" class="btn btn-secundario" data-acuse-nuevo>Llenar otra solicitud</button>` en el acuse lo olvida y abre el formulario vacío. Mientras se ve el acuse o la pantalla de límite, lo que acompaña al formulario fuera de él (`.barra-fija`, la franja del borrador y `[data-guardado]`) se oculta, y vuelve como estaba al regresar al formulario.

**Fechas para leer.** `FormKit.utilidades.fechaHora(fecha)` escribe una fecha y hora para la persona («17 de octubre de 2026 a las 23:27») en la zona de la Ciudad y en 24 horas, salvo `FORMKIT_CONFIG.fechas.horas24 = false`. Lo usan el acuse, el borrador y el resultado.

**Código postal de todo el país.** `data-ambito="nacional"` en un campo `data-formato="cp"` acepta cualquier código de cinco dígitos; sin él, sólo los del ámbito configurado (la Ciudad).

**Bloques listos.** Las secciones «Datos de identificación» y «Domicilio» están en la guía visual (sección «Bloques listos», plantillas `bloque-identificacion` y `bloque-domicilio`): se copian completas y se cambian `data-uso`, `data-finalidad` y el prefijo `b_` de los nombres. Los bloques «Fecha de nacimiento y edad» (`bloque-nacimiento`, para formularios sin CURP) y «Rango de edad» (`bloque-rango-edad`) cubren la edad sin pedirla escrita. El bloque «Redes sociales» (plantilla `bloque-redes`, clases `.redes` y `.redes-enlace` del núcleo) va en el pie: cada enlace lleva `aria-label` con el nombre de la red y de la Secretaría, y el ícono `aria-hidden`.

## 5. Payload que recibe el servidor

```json
{
  "datos":    { "tipo": "otro", "tipo_otro": "…", "cp": "04010", "telefono": "5500000000", "personas.0.nombre": "…" },
  "archivos": [ { "campo": "fotos", "nombre": "foto.jpg", "size": 812331, "tipo": "image/jpeg", "original": 3456789, "sha256_original": "…", "optimizada": true, "dimensiones": "2048x1536" } ],
  "meta":     { "version_formulario": "1", "ms_en_formulario": 184233, "trampa": "", "idempotencia": "uuid" }
}
```

Sólo viajan los campos activos (visibles por condición) con valor, ya normalizados. Los repetibles van como `grupo.índice.campo`. El mapa aporta `{type: "Point", coordinates: [lon, lat]}`. La cabecera `Idempotency-Key` lleva la misma clave mientras no se logre enviar. El servidor valida con `codigo/servidor/validar.mjs` y el esquema que se deriva del HTML:

```sh
node herramientas/esquema-desde-html.mjs tu-formulario.html esquema.json
```

y debe además verificar la firma de los archivos, aplicar el límite por origen y reconocer la clave de idempotencia.

## 6. Cómo se escribe un módulo

```js
FormKit.registra('mi-modulo', {
  selector: '[data-mi-modulo]',        // el núcleo lo inicia sólo si el formulario (o el documento) lo contiene
  fueraDelFormulario: false,           // true si la pieza vive fuera del <form> (acuse, pestañas, tabla…)
  tipos: { 'mi-tipo': { detecta(el), controles(el), valorDe(el), textoDe(el), valida(el, valor, atributos), enBorrador: true|false, restaura(el, valor), alArmar(form, payload), antesDeEnviar(form), fueraDeDatos } },
  iniciar(form, ctx) { /* ctx: $, $$, cfg, M, opciones, opcionesPagina, anuncia, icono, validaYPinta, marca, limpia, programaBorrador, alBorrador, envoltura, valorDe, textoDeValor, etiquetaDe, … */ }
});
```

Reglas del módulo: su CSS declara bloques `componentes → estados → adaptaciones` y usa `.clase:not([hidden])` si pone `display` en algo que puede ocultarse; sin colores ni longitudes literales; un selector, una declaración; eventos por delegación; sin valores fijos (lee `ctx.cfg`); textos en `mensajes` de `validaciones.config.js` (salvo los avisos para quien programa, en la consola); **idempotente**: un módulo de ámbito documento se inicia una vez aunque la página tenga varios formularios (marca `data-listo` en el elemento o una bandera en `document.documentElement.dataset`). Ganchos disponibles: `FormKit.ganchos.validaTodo`, `.submit`, `.estadoBorrador`, `.restauraBorrador`, `.erroresServidor` (siempre encadenando el anterior). Cada módulo nuevo se declara en `codigo/manifiesto.json` (nivel, propósito, cuándo, cuándo no, dependencias, accesibilidad, teléfono, escritorio, errores) y gana una ficha en la guía con sólo añadir un `<template data-demo="mi-modulo">` en `guia-visual/index.html`.

## 7. Herramientas

| Orden | Qué hace |
|---|---|
| `node herramientas/construir.mjs [--artefacto] [--zip] [--todo]` | Genera `iconos.js`, tamaños del manifiesto, `guia-visual/manifiesto.js`, `docs/04`, `dist/`, esquemas de las plantillas; con `--artefacto` la guía autocontenida; con `--zip` el paquete. |
| `node herramientas/auditor-css.mjs` | Reglas A01 a A11 y A13 a A16 (no hay A12) sobre todas las hojas (ver `docs/02` y `auditor-css.config.json`). |
| `node herramientas/contraste.mjs [--md\|--guia]` | Mide los pares de `pares-contraste.json`; genera la tabla de `docs/02` y `guia-visual/pares.js`. |
| `node herramientas/auditar-campos.mjs [html…]` | `data-uso`, `data-finalidad` → `autocomplete`, `data-sensible`, `inputmode`; ayudas sin repetir (D5, D6). |
| `node herramientas/esquema-desde-html.mjs <html> [salida.json]` | Esquema para el servidor. |
| `node herramientas/generar-reglas.mjs [--comprobar]` | `docs/01` desde `reglas/reglas.json`; tabla de contraste de `docs/02`. |
| `node herramientas/vendor.mjs [--verificar]` | Descarga/verifica Leaflet, gestos, pdf.js y axe-core con sumas. |
| `npm run probar` / `npm run verificar` | Pruebas (node:test + Playwright) / todo lo anterior en una orden. |
| `node herramientas/capturas.mjs` | Capturas de verificación en `verificacion/capturas/`. |

## 8. Lo que el paquete no incluye a propósito

Servidor de recepción, almacenamiento de archivos, autenticación, prueba de humanidad remota, geocodificación y cruce de capas: cada proyecto los integra en los puntos previstos (`FORMKIT_OPCIONES.enviar`, `validar.mjs`, `FORMKIT_CONFIG.mapa`, señales de `meta`). El estándar fija el contrato, no la infraestructura.
