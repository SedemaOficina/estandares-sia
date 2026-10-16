# 05 · Validaciones

Qué se valida, cuándo, con qué mensaje y dónde vive la regla. Fuente única: `codigo/js/validaciones.config.js` (la usan el navegador y el servidor). Las pruebas interactivas están en el «Probador de validaciones» de la guía visual.

## 1. Principios

1. **Un solo archivo de reglas.** Patrones, límites, mensajes y cruzadas viven en `validaciones.config.js`. El HTML sólo declara qué campo usa qué formato (`data-formato`) y sus límites (`min`, `max`, `minlength`, `maxlength`, `step`). Ni el HTML ni los módulos escriben mensajes.
2. **Se rechaza sólo lo inválido con certeza.** Un nombre con apóstrofe, un teléfono con espacios, un correo con mayúsculas se **normalizan**, no se rechazan. La regla distingue «esto no puede ser un dato válido» de «esto no es como yo lo escribiría».
3. **El momento (decisión C5).** El error aparece al salir del campo sólo si la persona escribió algo; una vez marcado, se recalcula en cada tecla y desaparece en cuanto el valor es válido; salir de un campo intacto no produce error; «Continuar» y «Enviar» validan todo lo visible y activo, muestran el resumen con foco y enlaces, y no avanzan con pendientes.
4. **El mensaje dice qué hacer, con ejemplo.** Nunca «Campo inválido».
5. **El navegador ayuda; el servidor defiende** con las mismas reglas (`codigo/servidor/validar.mjs` + esquema derivado del HTML).
6. **Lo oculto no se valida ni viaja.** Un bloque `data-si` cuya condición no se cumple no cuenta; el servidor descarta con señal lo que llegue de él.

## 2. Formatos (`data-formato`)

| Formato | Qué exige | Normaliza | Mensaje de ejemplo | Teclado (`inputmode`) |
|---|---|---|---|---|
| `nombre` | Sólo letras (con acentos y ñ), espacios, apóstrofe, guion y punto; hasta `maxlength` (80) | Recorta espacios | Escribe sólo letras, espacios, apóstrofe, guion o punto. Ejemplo: María José | text |
| `correo` | Una sola `@` con texto a ambos lados; dominio con punto; hasta 120 | Minúsculas, sin espacios | El correo necesita una sola arroba… Ejemplo: nombre@dominio.mx. **Sugiere sin bloquear** ante dominios a una letra de los frecuentes («¿Quisiste escribir …@gmail.com?») | email |
| `telefono` | Exactamente 10 dígitos | Quita espacios, guiones, paréntesis y el prefijo +52 / 52 | Escribe 10 dígitos, sin lada internacional. Ejemplo: 5512345678. *Regla de México; confirmar con el plan de numeración vigente [Fuente: __]* | tel |
| `cp` | 5 dígitos; si hay ámbito configurado, dentro del rango | Sólo dígitos; **se conserva como texto** | El código postal lleva 5 dígitos. Ejemplo: 01000 · Ese código postal no es de la Ciudad de México: van del 01000 al 16999 | numeric |
| `curp` | 18 caracteres; estructura `AAAA######HAAAAA##`; fecha real en posiciones 5–10 y no futura; entidad válida en 12–13; dígito verificador (activable) *[estructura y algoritmo a confirmar con RENAPO: Fuente: __]* | Mayúsculas, sin acentos ni espacios | La CURP tiene 18 caracteres; escribiste 17 · La fecha dentro de la CURP no es una fecha real · El último carácter no coincide con el resto | text |
| `rfc` | 12 (moral) o 13 (física) caracteres; fecha real *[estructura a confirmar con el SAT: Fuente: __]* | Mayúsculas, sin guiones | El RFC lleva 3 o 4 letras, 6 dígitos de fecha y 3 caracteres finales. Ejemplo: XAXX010101000 | text |
| `numero` | Número entero o decimal; `min`, `max`, `step` del campo (el paso cuenta desde el mínimo y admite decimales: `step="0.5"`); `data-min-segun`/`data-max-segun` para un límite que depende de otra respuesta | Coma → punto | Escribe sólo números; para decimales usa punto · El valor máximo es 20 · Usa múltiplos de 0.5 · Escribe un número entero, sin decimales | decimal |
| `fecha` | AAAA-MM-DD existente; `min`/`max`; `data-no-futura` = máximo hoy | Recorta | Escribe una fecha real… Ejemplo: 2026-03-15 · La fecha no puede ser posterior a hoy | numeric |
| `hora` | HH:MM de 24 horas | Recorta | Escribe la hora en formato de 24 horas, HH:MM. Ejemplo: 14:30 | numeric |
| `texto` | `minlength`/`maxlength`; con `data-legible`, forma de texto (vocales, palabras, sin tecleo al azar) | Quita caracteres de control, colapsa espacios | Escribe al menos 40 caracteres; van 12 · Descríbelo con tus palabras, en una o dos frases completas | text |
| `coordenadas` | «lat,lon» dentro de rango y del ámbito configurado | Sin espacios | Escribe latitud y longitud separadas por coma. Ejemplo: 19.4326,-99.1332 | decimal |
| `folio` | Letras, números y guiones; hasta 40 | Mayúsculas, sin espacios | Escribe el folio tal como aparece en tu acuse | text |
| `contrasena` | Longitud mínima (12 por omisión); sin máximo restrictivo; no bloquea pegar | Ninguna | La contraseña necesita al menos 12 caracteres. Una frase larga es más segura… | text |

Los campos sin `data-formato` se validan por obligatoriedad, longitud y, en opciones, pertenencia a la lista (`soloLista`), mínimo y máximo de opciones.

## 3. Validaciones cruzadas (`data-cruzada` + `data-cruzada-campos`)

Se evalúan cuando todos sus campos tienen valor; marcan el campo que las lleva **y** el otro, y liberan ambos al corregir. `data-cruzada-nivel="advertencia"` informa en ámbar sin bloquear.

| Clave | Campos (roles) | Bloquea por omisión | Qué comprueba |
|---|---|---|---|
| `curp-fecha` | `curp`, `fecha` | sí | La fecha de nacimiento coincide con la contenida en la CURP (posiciones 5–10). |
| `curp-sexo` | `curp`, `sexo` | no | El sexo declarado coincide con la posición 11. |
| `curp-entidad` | `curp`, `entidad` | no | La entidad de nacimiento coincide con las posiciones 12–13. |
| `curp-nombre` | `curp`, `nombre`, `primer` | sí | Las letras 1, 2, 4, 14 y 16 corresponden al nombre y al primer apellido: sin partículas (DE, DEL, LA, LOS, Y, MC, VAN…), con el segundo nombre si el primero es MARÍA o JOSÉ, la Ñ como X y la segunda letra en X si las cuatro primeras forman una palabra altisonante *[reglas de formación de RENAPO, simplificadas; a confirmar: Fuente: __]*. |
| `curp-segundo-apellido` | `curp`, `segundo` (opcional) | sí | Las letras 3 y 15 corresponden al segundo apellido; sin segundo apellido, la CURP lleva X en las dos. |
| `rango-fechas` | `inicio`, `fin` | sí | La fecha final no es anterior a la inicial. |
| `rango-horas` | `inicio`, `fin` | sí | La hora final es posterior a la inicial el mismo día. |
| `igual` | `original`, `confirmacion` | sí | Confirmación idéntica (correo, contraseña). |
| `edad` | `fecha` (+ `data-edad-min`/`data-edad-max`) | sí | Edad calculada dentro del rango que exige el formulario. |
| `cp-colonia` | `cp`, `colonia` (+ `data-catalogo`) | **no** | El CP pertenece a la colonia según el catálogo. El módulo `cascadas` la declara sola. |

Ejemplo: `<div class="campo" data-campo="nac" data-formato="fecha" data-cruzada="curp-fecha" data-cruzada-campos="curp=curp fecha=nac">`.

La CURP contra el nombre se declara en el campo de la CURP: `data-cruzada="curp-nombre curp-segundo-apellido" data-cruzada-campos="curp=curp nombre=nombre primer=apellido_paterno segundo=apellido_materno"` (así lo trae el bloque listo «Datos de identificación»). Comprueba que la CURP y el nombre sean coherentes entre sí, no que la CURP exista ni que sea de quien la escribe. `FORMKIT_VALIDACIONES.prefijoCurp(datos, fecha, sexo, entidad)` arma las primeras 16 posiciones de una CURP coherente, para datos ficticios de prueba.

Al cambiar cualquiera de sus campos (al salir de él o al elegir una opción), la cruzada se vuelve a revisar en los dos: corregir la fecha quita o pone el error de la CURP sin volver a tocarla.

Un formulario agrega cruzadas propias en `FORMKIT_CONFIG.cruzadas.<clave> = { campos: ['rol1', 'rol2'], valida(valores, atributos) { return '' /* o el mensaje */; } }`. Un rol listado en `opcionales: ['rol2']` corre aunque esté vacío (llega como `''`): sirve para exigir algo justo cuando ese dato falta, por ejemplo un motivo cuando no hay apellido materno. El servidor recibe la misma configuración.

## 4. Archivos (`ARCHIVOS` en la configuración)

| Regla | Valor por omisión | Cuándo se aplica | Mensaje |
|---|---|---|---|
| Extensiones | jpg, jpeg, png, pdf | Al elegir | ese tipo de archivo no se admite. Los formatos son … |
| Peso por archivo | 8 MB (después de optimizar) | Al elegir / tras optimizar | pesa 12.3 MB y el máximo es 8 MB |
| Peso total | 25 MB | Al elegir | con él se superan los 25 MB en total |
| Número | 5 (`data-max` lo baja) | Al elegir | sólo se admiten 3 archivos · con `data-max="1"`, en singular: sólo se admite un archivo |
| Vacío | mínimo 1 byte | Al elegir | el archivo está vacío |
| Duplicado | SHA-256 igual | Tras leer | ya adjuntaste ese mismo archivo |
| Firma real | primeros bytes por tipo | Tras leer | el contenido del archivo no corresponde a su extensión |
| Dimensión mínima | 320 × 240 px | Tras decodificar | la imagen es demasiado pequeña |
| Optimización | lado mayor 2048 px, calidad .82 | Imágenes | «Optimizando…» → «1.2 MB · optimizada» |
| EXIF | `conservarExif: false` (C6) | Imágenes | Fecha y GPS sólo si el formulario lo activa |

Lo que se sabe sin leer el archivo se rechaza en el acto (`.arch-rechazo`); lo que exige leerlo queda en la lista con estado de error y motivo. El servidor repite tipo, peso, número y total.

## 5. Mensajes

Los 77 mensajes del núcleo viven en `mensajes` dentro de `validaciones.config.js`, con marcadores `{etiqueta}`, `{min}`, `{max}`, `{peso}`, etc. Un formulario los ajusta en `FORMKIT_CONFIG.mensajes` sin tocar el archivo. Registro: tuteo, frase corta, qué hacer primero.

## 6. Configuración por formulario (`FORMKIT_CONFIG`)

| Clave | Por omisión | Para qué |
|---|---|---|
| `ambito.cp` | 01000–16999 | Rango de CP admitido y su mensaje; `null` para no acotar. |
| `ambito.coordenadas` | Ciudad de México | Rectángulo envolvente para mapa y coordenadas. |
| `fechas.zonaHoraria` | America/Mexico_City | «Hoy» y `data-no-futura`. |
| `curp.verificarDigito` | true | Dígito verificador de la CURP. |
| `archivos.*` | tabla anterior | Límites, firmas, optimización, EXIF. |
| `borrador` | 14 días, 600 ms, 2.5 s visible | Caducidad, retardo de guardado, duración de «Guardado». |
| `envio.timeoutMs` | 15 000 | Plazo del envío. |
| `combo.maxResultados` | 8 | Opciones visibles en el combo. |
| `cruzadas` | las de la sección 3 | Cruzadas propias del formulario. |
| `limitesSegun` | vacío | Funciones `(datos) => número` para `data-min-segun`/`data-max-segun`. |
| `chips` | 5, `sia-chips` | Máximo de chips y clave del almacén local. |
| `mapa` | sin teselas | Proveedor, atribución, centro, zoom. |
| `mensajes` | 77 textos | Cualquier mensaje. |

## 7. En el servidor

```sh
node herramientas/esquema-desde-html.mjs codigo/plantillas/por-pasos.html esquema.json
node codigo/servidor/validar.mjs esquema.json payload.json
```

`validaPayload(payload, esquema, { catalogos, auxiliares, limitesSegun, config })` devuelve `{ ok, datos (normalizados), errores: [{campo, mensaje}], senales: [] }`. `catalogos` acepta, como el navegador, un arreglo o un objeto `{filas}`; `auxiliares` calcula los datos `data-auxiliar` (el que llega del navegador se rechaza) y `limitesSegun` los límites `data-min-segun`/`data-max-segun`; si falta una función, el servidor lo anota en `senales`. `errores` tiene la forma que el navegador pinta junto a cada campo cuando el servidor rechaza el envío. Rechaza un envío mal formado (sin detener el proceso), los campos no declarados (las claves `__proto__`, `constructor` y `prototype` nunca lo están) y los datos de un tipo distinto al esperado: texto donde va texto, lista sólo en opción múltiple (sin contar repetidas) y el punto del mapa como `{type: "Point", coordinates: [lon, lat]}` con números dentro del ámbito. Aplica obligatoriedad, formato, opciones, condiciones y cruzadas; valida cada fila de un grupo repetible (`grupo.N.campo`) con su patrón y su mínimo y máximo de filas; acepta archivos sólo en campos de archivos activos y busca los obligatorios en `payload.archivos` (no en `datos`, donde no viajan); evalúa las condiciones de todos los bloques que rodean a un campo y toma como vacío lo que está oculto; resuelve `max: 'hoy'` con su propio reloj; degrada a señal las cruzadas de advertencia y los bloques condicionales que llegan con valor. La prueba `04-modulos` comprueba que el esquema coincide con lo que el navegador expone; `06-servidor-y-herramientas` que acepta lo bueno y rechaza lo malo; `01-por-pasos` y `02-una-pagina` pasan por el servidor lo que el navegador realmente envía.

## 8. Lo que estas reglas no resuelven

Verificar que una CURP **exista** (sólo RENAPO), que un correo **reciba** (sólo enviando uno), que un domicilio **sea real** (sólo el catálogo oficial o una visita). El estándar valida forma; la verdad la pone el procedimiento.
