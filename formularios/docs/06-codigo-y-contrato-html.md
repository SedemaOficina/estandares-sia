# 06 · Código, módulos y contrato HTML

Para quien programa. Qué archivos hay, cómo se cargan, qué atributos entiende el núcleo, cómo se escribe un módulo y qué recibe el servidor.

## 1. Estructura del paquete

```
codigo/
  css/        tokens.css · base.css · nucleo.css              (núcleo, siempre)
  js/         validaciones.config.js · iconos.js (generado) · formkit.core.js
  fuentes/    Cabin 600/700, Roboto 400/500/700 (woff2) + licencias OFL
  iconos/     sprite.svg (29 símbolos; iconos.js se genera de aquí)
  imagenes/   logotipo-sedema.png
  modulos/    <nombre>/<nombre>.css · <nombre>.js      (26 módulos, cada uno se copia solo)
  catalogos/  cdmx-ejemplo.js (ficticio) · LEEME.md
  plantillas/ por-pasos.html + configuracion-por-pasos.js · una-pagina.html + configuracion-una-pagina.js
  servidor/   validar.mjs · esquemas/*.json (generados)
  manifiesto.json   núcleo y módulos: nivel, propósito, dependencias, archivos, tamaños
dist/         formkit.css · formkit.js  («todo en uno», generado; para quien no quiere elegir módulos)
guia-visual/  index.html · guia.css · guia.js · ejemplos/ · artefacto.html (autocontenido, generado)
herramientas/ construir · auditor-css · contraste · auditar-campos · esquema-desde-html · generar-reglas · vendor · verificar · capturas
pruebas/      *.prueba.mjs (node:test + Playwright) · ayudas.mjs · ejecutar.mjs
reglas/       reglas.json (fuente única de las 81 reglas)
docs/         01–09
vendor/       leaflet · leaflet-gesture-handling · axe-core (con MANIFIESTO.json y sumas)
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

Todo `<form data-formkit>` se inicia solo al cargar la página con `window.FORMKIT_OPCIONES`. Quien necesite opciones por formulario llama:

```js
const instancia = FormKit.iniciar(form, {
  enviar(payload, { signal }) { return fetch(…, { signal }).then(r => r.json()); },  // si falta, POST JSON a action
  alEnviar(respuesta, form) { … },   // si falta, se emite el evento formkit:enviado en el form
  alFallar(error, form) { … }
});
instancia.payload();     // {datos, meta} que se enviaría ahora
instancia.valida();      // [{campo, mensaje}] de lo visible y activo
instancia.inventario();  // datos personales: campo, uso, finalidad, sensible, autocomplete
```

`FORMKIT_CONFIG` se fusiona en profundidad con la configuración base (sólo se escribe lo que cambia). `FORMKIT_CATALOGOS.<nombre>` alimenta combos (`data-catalogo`) y cascadas; acepta un arreglo de cadenas, de `{nombre, detalle}` o un objeto `{filas, fuente, corte, es_ficticio}`.

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
| `data-si="campo=valor\|valor2"` (en la envoltura o en un `div` que agrupa varias) | Condicional: existe sólo si la respuesta coincide. |
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
| `min`, `max`, `step`, `minlength`, `maxlength`, `inputmode`, `autocomplete`, `enterkeyhint` (en el control) | Límites y teclado; el esquema del servidor los lee. |

En el `<form>`: `data-formkit` (arranque automático), `data-borrador="clave"` y `data-borrador-version="n"` (borrador local), `action`/`method` (envío por omisión), `novalidate` lo pone el núcleo. Piezas del formulario: `[data-estado-envio]` (aviso de fallo de envío), `[data-franja-borrador]` con `[data-borrador="recuperar|descartar|descartar-si|conservar"]`, `[data-trampa]` (campo señuelo), `[data-accion="enviar|siguiente|atras"]`.

Eventos: `formkit:enviado` (en el form, si no hay `alEnviar`), `formkit:paso` ({indice, paso, total}), `formkit:pagina` ({pagina, tamano, desde, hasta}, en el nav), `formkit:tabla` (repintar tabla).

**Módulo `enlace-mapa`.** Un contenedor `[data-enlace-mapa="<data-campo destino>"]` con su `label`, un `input` (sin `data-campo` ni `name`: el enlace no viaja) y un `[data-enlace-mapa-estado]` para el aviso. Al pegar o al salir, escribe `lat, lon` con 6 decimales en el campo destino (`data-formato="coordenadas"`), que valida el núcleo y, si hay `mapa`, mueve el punto. Toma el último lugar marcado del enlace (`!3d…!4d…`), luego `q=`/`ll=`/`/place/`, y sólo al final el centro de la pantalla (`@`), con aviso. Acomoda en el campo destino coordenadas al revés, en grados-minutos-segundos, con coma decimal o con la longitud sin signo menos. `FormKit.leeCoordenadas(texto)` es la función pura.

**Condiciones con valor vacío.** `data-si="campo="` se cumple mientras el campo esté vacío o la casilla sin marcar; el servidor lo evalúa igual, porque lo que no viene en los datos cuenta como vacío. Un campo con su propia condición dentro de un bloque `data-si` exige las dos (el esquema las guarda en `si` y `siPadre`).

**Edad calculada.** `data-deriva="edad=destino"` en un campo `data-formato="fecha"` (módulo `fecha`) escribe la edad cumplida, con la fecha de hoy en la Ciudad de México, en un `[data-campo]` con `<input readonly>`. Se recalcula cada vez que cambia la fecha, también cuando la escribe la CURP; con una fecha vacía, incompleta o futura queda vacía. La edad mínima o máxima que exija el formulario se pide sobre la fecha, con la cruzada `edad`.

**Código postal de todo el país.** `data-ambito="nacional"` en un campo `data-formato="cp"` acepta cualquier código de cinco dígitos; sin él, sólo los del ámbito configurado (la Ciudad).

**Bloques listos.** Las secciones «Datos de identificación» y «Domicilio» están en la guía visual (sección «Bloques listos», plantillas `bloque-identificacion` y `bloque-domicilio`): se copian completas y se cambian `data-uso`, `data-finalidad` y el prefijo `b_` de los nombres. Los bloques «Fecha de nacimiento y edad» (`bloque-nacimiento`, para formularios sin CURP) y «Rango de edad» (`bloque-rango-edad`) cubren la edad sin pedirla escrita. El bloque «Redes sociales» (plantilla `bloque-redes`, clases `.redes` y `.redes-enlace` del núcleo) va en el pie: cada enlace lleva `aria-label` con el nombre de la red y de la Secretaría, y el ícono `aria-hidden`.

## 5. Payload que recibe el servidor

```json
{
  "datos":    { "tipo": "otro", "tipo_otro": "…", "cp": "04010", "telefono": "5500000000", "personas.0.nombre": "…" },
  "archivos": [ { "campo": "fotos", "nombre": "foto.jpg", "size": 812331, "type": "image/jpeg", "sha256_original": "…", "optimizada": true } ],
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
  tipos: { 'mi-tipo': { detecta(el), controles(el), valorDe(el), textoDe(el), valida(el, ctx), enBorrador, restaura, alArmar(form, payload), antesDeEnviar(form), fueraDeDatos } },
  iniciar(form, ctx) { /* ctx: $, $$, cfg, M, anuncia, icono, validaYPinta, marca, limpia, programaBorrador, envoltura, valorDe, textoDeValor, etiquetaDe, … */ }
});
```

Reglas del módulo: su CSS declara bloques `componentes → estados → adaptaciones` y usa `.clase:not([hidden])` si pone `display` en algo que puede ocultarse; sin colores ni longitudes literales; un selector, una declaración; eventos por delegación; sin valores fijos (lee `ctx.cfg`); textos en `validaciones.config.js`; **idempotente**: un módulo de ámbito documento se inicia una vez aunque la página tenga varios formularios (marca `data-listo` en el elemento o una bandera en `document.documentElement.dataset`). Ganchos disponibles: `FormKit.ganchos.validaTodo`, `.submit`, `.estadoBorrador`, `.restauraBorrador` (siempre encadenando el anterior). Cada módulo nuevo se declara en `codigo/manifiesto.json` (nivel, propósito, cuándo, cuándo no, dependencias, accesibilidad, teléfono, escritorio, errores) y gana una ficha en la guía con sólo añadir un `<template data-demo="mi-modulo">` en `guia-visual/index.html`.

## 7. Herramientas

| Orden | Qué hace |
|---|---|
| `node herramientas/construir.mjs [--artefacto] [--zip] [--todo]` | Genera `iconos.js`, tamaños del manifiesto, `guia-visual/manifiesto.js`, `docs/04`, `dist/`, esquemas de las plantillas; con `--artefacto` la guía autocontenida; con `--zip` el paquete. |
| `node herramientas/auditor-css.mjs` | Reglas A01–A16 sobre todas las hojas (ver `docs/02` y `auditor-css.config.json`). |
| `node herramientas/contraste.mjs [--md\|--guia]` | Mide los pares de `pares-contraste.json`; genera la tabla de `docs/02` y `guia-visual/pares.js`. |
| `node herramientas/auditar-campos.mjs [html…]` | `data-uso`, `data-finalidad` → `autocomplete`, `data-sensible`, `inputmode`. |
| `node herramientas/esquema-desde-html.mjs <html> [salida.json]` | Esquema para el servidor. |
| `node herramientas/generar-reglas.mjs [--comprobar]` | `docs/01` desde `reglas/reglas.json`; tabla de contraste de `docs/02`. |
| `node herramientas/vendor.mjs [--verificar]` | Descarga/verifica Leaflet, gestos y axe-core con sumas. |
| `npm run probar` / `npm run verificar` | Pruebas (node:test + Playwright) / todo lo anterior en una orden. |
| `node herramientas/capturas.mjs` | Capturas de verificación en `verificacion/capturas/`. |

## 8. Lo que el paquete no incluye a propósito

Servidor de recepción, almacenamiento de archivos, autenticación, prueba de humanidad remota, geocodificación y cruce de capas: cada proyecto los integra en los puntos previstos (`FORMKIT_OPCIONES.enviar`, `validar.mjs`, `FORMKIT_CONFIG.mapa`, señales de `meta`). El estándar fija el contrato, no la infraestructura.
