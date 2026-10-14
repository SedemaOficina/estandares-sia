# 00 · Aprendizajes de los geovisores de SEDEMA

Material de origen del Estándar de geovisores del SIA. Junta lo que dejaron cinco proyectos con mapa, revisados el 13 y 14 de octubre de 2026. Cada regla dice de qué proyecto salió y, cuando la hay, la historia del error que la hizo necesaria. **Una regla sin su historia se desobedece en cuanto estorba.**

| Sigla | Proyecto | Motor del mapa | Tipo |
|---|---|---|---|
| GA | Guardianes de árboles (`adopta-un-arbol`, v31d) | deck.gl 9.4 | Visor de consulta con ficha y reconocimiento |
| PR | Priorización de reforestación (`MODELO-PRIORIZACION-REFORESTACION`, v1.25) | deck.gl 9.4 | Visor de consulta con filtros y descargas |
| PL | Sistema de Registro de Plantaciones (`Sistema de Plantación de Arbolado Urbano`, v0.9.64) | Leaflet 1.9.4 | Captura en campo, sin conexión, con servidor |
| CP | Categorías de protección ambiental (`Categorias-de-proteccion-ambiental_DASHBOARD`, sia-v35) | Leaflet 1.9.4 | Tablero con mapa, consulta de un punto |
| AP | Árboles patrimoniales (`arboles-patrimoniales`) | Leaflet 1.9.4 | Micrositio con mapa, lista y fichas |
| EF | Estándar de formularios del SIA 1.0.0 | Leaflet (módulo mapa) | Referencia de tokens, reglas y verificación |

Lo que sigue va por tema. Al final, la sección 17 junta las contradicciones entre proyectos, que son las decisiones que el estándar debe tomar.

---

## 1. Arquitectura y armado

- **Fuente y salida separadas; la salida nunca se edita a mano.** Un script junta las piezas y escribe la carpeta publicable (GA `armar.py` → `10_sitio/`; PR `construir.py` → `docs/`; AP `construir.sh` → `docs/`). *AP: commit y push correctos con `docs/` un día y medio atrasado; se arregló con un recibo de huellas que firma el armado (`sellar.js`).*
- **El armado valida todo y escribe al final, o no escribe nada** (PR). Listas fijas de piezas esperadas; se detiene si una falta, sobra o pesa casi nada; arma en memoria y solo reescribe lo que cambió (así git no ve cambios falsos).
- **El armado se detiene ante lo que no reconoce.** Textos que faltan, código o estilo dentro del HTML, marcadores sin reemplazar, totales de control distintos (GA `TOTALES_ESPERADOS`), un nombre de módulo que ya no existe (AP `envolver()`: *tres veces la página quedó a medias en blanco*), una marca que debía quitar y no encontró (AP `exigir()`).
- **`node --check` sobre el JS armado.** *GA v28b, dos veces: un comentario `//` en una línea que seguía con código dejó la página en «Descomprimiendo datos…».* En líneas con código, solo `/* */`.
- **JS partido por tema y unido en una sola función con alcance compartido** (GA, PR): `(async function(){"use strict"; … })().catch(…)`. *PR: un módulo usó `isPhone` antes de definirlo y la página no terminaba de abrir; el arranque va en el último módulo.* CP tiene un solo archivo de 9,785 líneas que la auditoría pidió partir.
- **Scripts clásicos, no módulos ES** (PL, EF): que abra con doble clic (`file://`). Lo que se pide con `fetch` falla en `file://` (AP incrusta el contorno de la ciudad por eso).
- **Ningún código, estilo ni manejador dentro del HTML** (GA, PR, PL): lo exige la CSP del SIA. GA pasó de 1 MB a 6 KB de `index.html`. PR aplica estilos por programa con `data-st`. *AP lo incrusta todo y quedó incompatible con una CSP estricta: su guía de despliegue dice «no declarar CSP».*
- **Todos los textos en un solo archivo** (GA `textos.js`, `tx("clave")`, `{{clave}}` en el HTML). El armado se detiene si falta una clave y avisa si un texto cambió sus `{marcas}`.
- **Configuración en un solo lugar** (GA `00_config.js`, PR `config.js`, PL `config.js`, AP `sitio.js`): direcciones, zooms, límites, capas base con su crédito, umbrales. «Si al publicar en otro sitio hay que tocar otro archivo, el diseño está mal» (PL). *AP repite la llave de CARTO en tres archivos: contraejemplo.* Las claves nunca van en el repositorio: variables de entorno o un `claves.local.json` fuera de git, leído con `utf-8-sig` porque el Bloc de notas pone BOM (PR).
- **Modo prueba y modo producción con un interruptor** (GA): lo de prueba va entre `/* solo-prueba */ … /* /solo-prueba */`; producción lo quita y se detiene si sobrevive un nombre suyo. Producción nunca escribe en la carpeta del sitio de pruebas (*un QR de producción publicado por error queda roto*). PL: base del navegador distinta en prueba y en real, datos de demostración con prefijo `demo-` y semilla fija.
- **Versión visible siempre** (PL franja fija; PR panel, fichas y Excel; CP pie; GA «Cómo funciona»). La gente debe saber sin preguntar si está ante una prueba, y poder reportar qué versión ve.
- **Caché por huella del contenido** (GA v31d, PR): cada archivo con `?v=<10 caracteres de su SHA-256>`; `index.html` sin caché; lo que lleva huella, un año `immutable`. *GA: con `?v=versión` cada versión renovaba 20 MB de datos.* *PR: `?v=` también era un parámetro de la dirección (la avenida) y un enlace compartido quedó guardado un año: nunca usar el nombre del parámetro de huella para estado.* CP no puede (Cloudflare ignora la query) y usa la versión del service worker, con un CI que rechaza el commit que no la cambia.
- **Librerías y letras alojadas en el sitio, sin CDN ni Google Fonts** (GA, PR, PL, EF), con origen, versión, licencia y huella en un LEEME. *PR: Google Fonts en el arranque dejaba la página en blanco en redes que lo bloquean.* AP y CP todavía usan Google Fonts. Las librerías pesadas se cargan al pedirlas (jsPDF, QR, SheetJS). Solo se actualizan por avisos de seguridad, comparando que el resultado salga igual (*jsPDF 2.5.1 tenía 12 avisos*). PL no sube a Turf 7 porque cambia el cálculo del punto en polígono.
- **Una sola fuente del modelo de datos** (PL `esquema.json` genera diccionario, JS y SQL; la auditoría falla si algo quedó atrasado). Contrato de columnas de la hoja de cálculo (AP `contrato-v2.json`, CP `COLUMNAS_ESPERADAS` y `COLUMNAS_CRITICAS`).
- **Datos desde una hoja de Google: congelado más hoja en vivo** (AP, CP). Se pinta primero lo congelado; la hoja llega después con espera y reintentos; si falla, se dice con un aviso fijo junto a la cifra («Copia local»), porque la gente cita el dato en oficios (CP). Se rechaza una respuesta HTML aunque llegue con 200. **Nunca se publica la pestaña interna** (AP, GA): se publica una pestaña de salida dedicada, y el script se detiene si ve columnas ajenas.
- **Documentos de trabajo dentro del repositorio,** corregidos en el mismo commit que el código (AP, CP). CP: un documento de arranque de 18 líneas que solo apunta a `docs/`; `pendientes/` es bitácora fechada que no se reescribe.
- **Comentarios del código en presente, sin historia** (PL, PR, CP): versiones, fechas, personas y «se intentó» viven en la bitácora.

## 2. Acomodo computadora / celular

- **Visor de consulta en el celular: dos pantallas completas, información y mapa** (GA v29, PR v1.11). La información sale con `translateX(-100%)` y `visibility:hidden` diferida 0.25 s; el mapa nunca cambia de tamaño ni usa `display:none` (deck.gl redibuja o queda en tamaño 0). La pantalla oculta lleva `inert` y el foco pasa al botón de la otra. Arriba «Ver el mapa»; en el mapa, abajo y a lo ancho, un botón que dice lo que se verá al volver. *Descartado en los dos: el panel desde abajo (GA en tres alturas, PR de la v8 a la v1.10): dejaba el mapa en 150 a 210 px en iPhone, con los controles encimados.* Qué lleva a qué pantalla se acuerda antes: buscar y filtrar se quedan en la información; elegir algo que se ve en el mapa lleva al mapa (con `pushState`, para que «atrás» regrese a la lista).
- **Mapa dentro de una página que se desplaza: en reposo, dos dedos para moverlo** (CP, PL, EF, AP). Un dedo desplaza la página. CP: `touch-action: pan-x pan-y` y la etiqueta «Dos dedos mueven el mapa», que se va con el primer pellizco. PL y EF: Leaflet Gesture Handling. AP: sin arrastre de un dedo y con pantalla completa para recorrerlo. *CP descartó «toca para activar»: en iOS el toque no siempre llega como clic.*
- **Hojas sobre el mapa** (CP en Ubicar y en la ficha: asomada, media y completa). Funcionan si se agarran por el asa y el encabezado, con umbral de toque de 8 px, medidas una vez al empezar y pintadas con `requestAnimationFrame` (*CP: cinco causas de hojas «pegajosas» en iPhone*).
- **Cortes de ancho: pocos, iguales en CSS y JS.** GA y PR: 860 px (PR añade el teléfono acostado: `(max-width:860px) and (min-height:481px), (max-width:600px)` → panel lateral de 300 px). CP: 760. PL: 480, 700, 1024 («no se agregan cortes nuevos»). EF: 560, 760, 1024 y solo `min-width`. AP llegó a 15 cortes y los bajó a 9, sostenidos por una prueba porque CSS no lee variables en `@media`.
- **El cruce de un corte se atiende con `matchMedia('change')`, no con `resize`** (CP). *CP: girar el teléfono congelaba la página; la ficha quedaba fuera con el fondo inerte.*
- **Computadora:** panel a la izquierda de 392 a 400 px (GA `400px minmax(0,1fr)`, PR `392px 1fr`); `minmax(0,1fr)` y `min-width:0` en toda pista (*PR: a 390 px la página se dibujaba a 425*). CP desde 1200 px: mapa fijo a la izquierda y tabla a la derecha.
- **Alto real del teléfono medido con JS** (GA v29c, PR): `--alto = innerHeight` y `--vvh = visualViewport.height`, actualizados en `resize` y `visualViewport.resize`. *`height:100%` dejó ~60 px vacíos abajo; `100dvh`, ~50 px en iOS 26.* PL usa `100dvh` en ventanas (*`100vh` escondía el pie*). Teclado: si el alto visible baja de 0.75, clase `con-teclado` (PL); el botón de confirmar fijo y el campo al centro.
- **Etiqueta `viewport` y `<!doctype html>` obligatorios** (*GA v25: sin viewport, la página se dibujaba a 980 px; v26: sin doctype, modo antiguo*). `viewport-fit=cover` y `env(safe-area-inset-*)` en todo lo fijo; lo que va encima del botón de abajo sube igual (*GA v29c: la simbología quedó tapada*).
- **Campos a 16 px** (todos): con menos, Safari acerca la página y no la devuelve. Sin `user-scalable=no`: iOS lo ignora y rompe el pellizco (CP).
- **Estados al pasar el puntero solo con `@media (hover:hover)`** (PL, GA): en el teléfono un toque los deja pegados. CP: `pointer:coarse` da 44 px aunque la pantalla use el diseño de escritorio (iPad).
- **El mapa se adapta al alto que le queda** (GA `ResizeObserver`: con menos de 210 px se quitan + y −; con menos de 130, todos los controles).

## 3. Controles del mapa

- **Una sola columna de botones, en una tarjeta.** GA y PR: arriba a la derecha. CP: zoom, ubicarme y vista general arriba a la izquierda (cuadrados de Leaflet) y capas y ampliar arriba a la derecha (redondos propios). AP: arriba a la izquierda. Tamaños: GA 44 px; PR 34 px en computadora y 44 en el celular; CP 34 y 44 en táctil; AP 30 px (*no llega a 44 en táctil*).
- **Orden habitual:** acercar, alejar, toda la ciudad (casa), capas, ayuda, mi ubicación. La casa es casa: *CP: el marco de cuatro esquinas se lee como «pantalla completa»*. *PR descartó «Encuadrar lo consultado»: se confundía con la casa.*
- **En el celular se quitan + y −** (CP; GA cuando el mapa es bajo): se acerca con dos dedos y la columna pisaría lo de abajo.
- **Zoom.** Sin rotación. Límites a la ciudad (`maxBounds`). Rueda: GA `1/300` (≈0.2 niveles por muesca; *1/450 se sentía lento, 1/250 brusco*). CP: la rueda solo acerca después de un clic en el mapa; `zoomSnap 0.25` (*con pasos enteros, un encuadre que se pasa unos píxeles cae un nivel*). Máximo: GA 20.5 y PL 22 con imagen ampliada sobre 19 nativo, para separar elementos a pocos metros.
- **Primer toque acerca, segundo elige** cuando el zoom es bajo (GA bajo 17.5, PL bajo 17: *a zoom 12 un toque abarca unos 36 m*).
- **Mi ubicación.** El botón del mapa y el del panel hacen lo mismo (GA). Dos tiempos (AP): primero una posición rápida (`enableHighAccuracy:false`, `maximumAge` de minutos) y en paralelo la precisa; solo se redibuja si movió más de 50 m. *AP: con alta precisión, una computadora tardaba 5 a 15 s y el botón parecía trabado.* *CP y PR: en computadora la ubicación viene de la red (cientos de metros): se responde con el aviso «aproximada».* Se descartan respuestas tardías (`TURNO`, `locReq`). Punto azul convencional con círculo de precisión; el guinda queda para la acción y para el lugar buscado (CP). *AP descartó el anillo de precisión porque tapaba manzanas.* En campo (PL): `watchPosition` hasta 8 s quedándose con la mejor lectura; buena ≤10 m, aceptable ≤30 m. El GPS nunca se pide solo al entrar (PL B7). Para capturar un punto, el botón de ubicación va fuera del mapa, a todo lo ancho, y cambia según el estado («Registrar ubicación» → «Actualizar ubicación»); *un control dentro del mapa se probó y se retiró (PL B4 → B8)*.
- **Un solo menú de capas para todos los mapas** (CP `montarBotonBase()`, PL, PR): botón de 44 px con ícono de capas; dentro, tipo de mapa (miniaturas como `radiogroup`), capas (interruptores con `aria-pressed`), opacidad. Elegir la base cierra el menú; un interruptor no. El panel cabe siempre en el mapa (alto y ancho máximos calculados al abrir). *PL: deslizador de opacidad propio (barra de 8 px, botón de 28, área de 44): el nativo no se podía tomar con el dedo.* GA lo descartó «por ahora»: solo una capa de datos.
- **La ayuda del mapa cambia según el momento** (*PL D173, prueba de campo: nadie sabía que el marcador se arrastra*): sin punto, «Toque el mapa donde está el árbol»; con punto, «Arrastre el marcador o toque otro sitio».
- **El mapa de campo lleva la referencia mínima; los controles completos van en el de supervisión** (PL D206–D265: la capa de referencia pasó de cinco niveles encendidos a solo el polígono de la jornada, y la opacidad volvió después). Una capa de referencia va debajo de los puntos y no atiende toques.
- **Simbología mínima** (GA v29b: de 680 × 280 a 261 × 121 px después de que la Secretaría la llamó «exceso» dos veces). Solo lo que se ve a ese zoom: la rampa de lejos, los tipos de punto de cerca. En el celular, plegable. CP: los chips de categoría son la leyenda. PL: solo si hay dos niveles o más pintados. PR: leyenda compacta que abre el panel de capas. Si la leyenda filtra el mapa, lo dice (PR).
- **Escala:** abajo a la derecha, distancias redondas (10 m … 20 km), sin capturar toques; se quita en el celular (GA, PR). **Norte:** GA lo puso junto a la escala (v25d) y lo quitó del celular porque el mapa nunca gira (v28j).
- **Atribución obligatoria y legible** (todos). Fondo claro: *PL: el azul de Leaflet daba 2.55:1.* En el celular, un renglón recortado que se abre al tocarlo (PR, PL). Con ficha abierta se recorre, nunca se oculta del todo (PR). *PR: el crédito de Esri tapaba la ×.*
- **Tarjeta del lugar arriba a la izquierda** (GA `.mapsum`, PR `.mapbar`), con ancho máximo que no se mete bajo los botones (`calc(100% - 74px)`). Los avisos salen debajo, con su ancho.
- **Globos y botones flotantes:** con un globo abierto se ocultan los flotantes que tapan su × (CP). El globo devuelve un elemento, no una cadena (*AP: con cadena, `popup.update()` borraba la foto*).

## 4. Panel, filtros, buscador y listas

- **Un solo filtro para todo** (PR `enAmbito()`): mapa, cifras, listas, Excel, KML y fichas usan la misma función; el umbral («prioritario») vive en un solo lugar y Python usa el mismo. *PR: el panel decía 88 frentes prioritarios y el Excel traía 0 renglones.* CP: una regla por filtro y `filasSalvo(id)` para las opciones vivas de cada desplegable.
- **Un filtro con un solo valor posible se oculta,** igual que la columna que no cambia (CP); calculado sobre el subconjunto, no sobre lo filtrado, para que no parpadee. Tope de filtros: más de 8 por vista o más de 4 a la vista hace fallar la auditoría (PL). «Quitar filtros» solo si hay algo filtrado.
- **El filtro se declara en todas partes:** cifra, resumen del mapa, Excel, nombre del archivo, ficha y dirección (PR). Arranca en la opción que no cambia la cifra oficial.
- **El estado va en la dirección** (`#…` o `?…`) con `pushState` y `popstate` (GA, PR, CP); los filtros no dejan entrada en el historial (CP). *CP: todo usaba `replaceState` y «atrás» sacaba del sitio; cerrar una ficha borraba la búsqueda.* Una liga con un valor inválido no tumba la página: se valida contra el catálogo (CP).
- **Buscador único, como combobox ARIA** (GA, PR, CP): sin acentos, palabras en cualquier orden, sin artículos ni preposiciones, abreviaturas, una letra de error en palabras largas (PR). Agrupa por tipo y dice por qué coincidió; distingue homónimos (parte k de n, CP). Enter elige la primera, Escape cierra; `aria-activedescendant` se borra al rehacer la lista (*GA v30: apuntaba a opciones viejas*). Lo más cercano primero. *GA v30d: con Gboard, rehacer el campo con cada letra convertía «Hora» en «HHoHorHora…»: se rehace solo la lista.*
- **Coordenadas y ligas de Google Maps en el buscador** (PR, CP, PL): decimales, grados-minutos-segundos, `geo:`, y en las ligas largas el pin `!3d…!4d…` gana a `@`, que es solo el centro de la vista. Las ligas cortas no traen coordenadas: se explica cómo copiarlas. PL: pegar «19.42, -99.14» llena los dos campos y detecta el orden invertido; el teclado numérico del iPhone no trae el menos.
- **La lista es la alternativa al mapa** (GA, AP, PR): para teclado, lectores de pantalla y equipos sin WebGL. Distancias humanas en lugar de «elemento 3 de 9» (GA «A 25 m de Ripoll»). En el celular no hay listas con desplazamiento propio (*AP: atrapaban el dedo*); se pinta por tandas («Ver 10 más»).
- **Descargas** (PR, AP, CP): Excel con hoja de datos (números como número) y diccionario; CSV con BOM y CRLF, celdas que empiezan con `= + - @` neutralizadas (pero no los números negativos: *AP, las longitudes salían como texto*); KML y GeoJSON con los mismos registros; fecha en el nombre; botón deshabilitado con el motivo antes que un archivo vacío. Datos abiertos con lista explícita de columnas, nunca un volcado (*AP: el JSON publicó el nombre de una persona que nominó un árbol*).
- **Las cifras de un texto salen de los datos** (PR, AP, CP): *PR: la ayuda atribuía 372,534 frentes cuando eran 353,123*; «los trece» envejece (AP lo vigila con una prueba).

## 5. Ficha del elemento

- **Computadora:** tarjeta abajo a la derecha de 300 a 350 px con desplazamiento interno (`overscroll-behavior:contain`), o cajón lateral de `min(580px, 94vw)` (CP). **Celular:** fija abajo en dos alturas (compacta y amplia) con manija que se toca o se desliza (GA), u hoja de tres posiciones (CP).
- **Cabecera fija fuera del cuerpo desplazable** (CP `#drHead`): *un título sticky dentro del cuerpo se separaba de la × con el rebote de iOS.* GA: al bajar más de 40 px aparece una franja fija con el nombre y la ×.
- **Opaca y sin desenfoque en el celular** (GA v28j): con 97 % y blur se leía el texto de detrás y el desenfoque le pesa al teléfono.
- **`role=dialog`, foco al título al abrir, Escape cierra, el foco regresa** a quien la abrió o a su fila si la lista se repintó (GA, CP, PR). Cerrada lleva `inert` (CP).
- **Acciones de campo** (PR): «Cómo llegar» (`maps/dir/?api=1&destination=`), «Street View» (`map_action=pano&viewpoint=`), «Copiar coordenadas» con respaldo si falla el portapapeles. Street View incrustado solo cuando la persona lo pide, con aviso (GA).
- **Cada elemento con liga estable por un identificador inmutable** (AP: página propia `arbol-<slug>.html` con título, descripción y OG generados en el armado; *el fragmento `#` lo descartan los buscadores y 12 de 13 árboles no se encontraban por su nombre*; *el slug salió del nombre y al renombrar cambiaron las ligas*).
- **Lo que falta se dice** (AP): un dato ausente se dibuja apagado con el motivo; «no hay dato», «no publicado», «sin validar» y «en revisión» son cosas distintas (*AP: un árbol con su declaratoria en trámite no es un árbol sin dato*). Las sumas dicen sobre cuántos se calcularon.

## 6. Componentes

- **Un solo botón principal por vista** (todos). Con ficha y panel a la vista a la vez, el del panel pasa a secundario (GA `body.con-ficha`).
- **Botón principal:** píldora o radio 7–8 px, 44 a 48 px de alto, Cabin 600 a 15 px, guinda (GA, PR, CP, EF). PL lo hizo azul (ver 17). AP en jacarandá.
- **Cinco intenciones y tres pesos** (PL, de 17 formas de botón): avanzar, comprometer, quitar, corregir, apoyo; principal relleno (uno por vista), alterna con contorno, apoyo en texto subrayado. Botones con verbo y objeto; íconos siempre con su palabra.
- **Áreas táctiles de 44 px;** lo que se ve más chico responde en 44 con `::after{inset:-…}` (GA, PL, CP, AP). *AP: para ganarle a la hoja de Leaflet se necesitó especificidad (0,4,1).*
- **Foco visible de 3 px con separación de 2 px,** sobre cualquier fondo, también el mapa y las fichas oscuras. PR lo hace de dos tonos (`outline:3px solid` oscuro + `box-shadow:0 0 0 2px #fff`). GA añade `outline:3px solid transparent` para el alto contraste de Windows. *AP: con `transition:all` el anillo se desvanecía en 200 ms: solo transiciones de propiedades nombradas.*
- **Avisos:** un solo canal (`aviso(texto, tipo)`), el tipo se pasa siempre, nunca se deduce del texto (GA). Duración según el largo: 4.5 a 8 s más 1 s por cada 40 caracteres (PL); 7 o 10 s (GA). El de espera no se cierra hasta que termina. Se pausa con el puntero encima. Un aviso con «Deshacer» no lo reemplaza otro. Nunca `alert()`. Los mensajes largos (permiso de ubicación) van como nota fija con los pasos y «Reintentar» (CP).
- **Ventanas:** foco al título y no a la × (*PL: Enter cerraba la ventana*), Tab no se escapa, Escape cierra, «atrás» cierra la ventana y solo la ventana, el foco regresa (GA, PR, CP).
- **No reemplazar un elemento entre `pointerdown` y `pointerup`** (*PL D262: la sección se repintaba a medio toque y el toque se perdía*): se actualiza el contenido sin reemplazar el elemento. En el celular, a pantalla completa con `--vvh` de alto y × sticky.
- **`[hidden]` pierde ante un `display` del autor** (GA dos veces, PL, CP): todo componente con `display` propio lleva `[hidden]{display:none}`.
- **Indicador de conexión solo cuando no hay red** (CP: *un punto verde permanente se encimaba sin decir nada útil*).
- **Estado vacío explicado,** nunca «0 de 0» (PR); con ícono, texto y una salida (PL).
- **Doble toque:** el botón se marca «ocupado» de forma síncrona, antes del primer `await` (*PL B77, B149, B151: dos árboles, dos jornadas o folios repetidos*).
- **Después de guardar, el formulario vuelve completo en blanco** (*PL B12: heredaba la coordenada del árbol anterior, que «se ve bien estando mal»*). Sin avance automático del foco (*se probó y se retiró, PL B31*).
- **Confirmaciones solo para lo irreversible;** lo demás se hace directo con «Deshacer» en el aviso. Borrar pide escribir la palabra (PL).

## 7. Tokens y color

- **Colores, tamaños, radios, sombras, capas y duraciones solo como tokens en `:root`** (todos; EF y AP lo vigilan con una prueba). El JS los lee de la hoja (`css("--token")`, `hex()` para deck.gl, `colorLiteral()` para Canvas: *CP, Canvas ignora `var()` en silencio y todo salió crema sobre crema*). Transparencias con canales RGB como token (`--jacaranda-rgb`, AP: *92 `rgba` a mano que no seguían la paleta*). Tema claro único (`color-scheme: light only`).
- **Un color, un trabajo** (EF, GA, CP). Guinda = identidad y acción principal; dorado solo líneas (como texto, su variante oscura); el color de los datos nunca es texto. *PL: guinda y rojo de error tienen 1.1:1 entre sí.* *GA: el error del mapa va en ámbar porque el guinda ya significa algo ahí.* *CP: el estado no se codifica por matiz (punto lleno, hueco o medio) porque el verde ya es una categoría y el rojo se lee como alarma.*
- **Un color por variable** (PL D219): la cantidad va en la etiqueta y en la tabla, no en el color. Los puntos son círculos y el color nunca va solo: el estado «lejos» lleva un anillo de más (PL D166). Sobre satélite, neutros con tinte frío para no competir con la vegetación.
- **Rampas de datos con cortes fijos y probadas para daltonismo** (PR: categorías vecinas a ΔE ≥ 15 y extremos a ≥ 50, simulado con Machado 2009; *el semáforo anterior dejaba los extremos a ΔE 15 y usaba colores de partidos*). Rampa de prioridad `#F9E7BF #F4C56E #E88A2E #C2421B #7F1D12` (PR y PL la comparten). Verdor en cinco clases (GA; v31e la rehízo para que pase la prueba de daltonismo). Sin dato: color propio. Colores por categoría con su variante para texto (CP `colorTextoGrupo()`).
- **Contraste medido sobre cada fondo real** (todos): texto 4.5:1, símbolos y bordes 3:1. Sobre la rampa, texto oscuro hasta la clase 4 y blanco solo sobre la 5 (GA). Gris sólido en vez de transparencia (*GA: 5.1:1 contra 1.9*). Aro oscuro alrededor de puntos claros (*GA: aro blanco 2.3:1 → aro hoja 5.3:1*). Dos estados con la misma oscuridad se distinguen por otra cosa.
- **Letra:** Cabin para títulos y Roboto para texto (GA, PR, PL, CP, EF). AP usa Anton, Fraunces y Source Sans 3 (identidad propia del micrositio). Pocos tamaños (GA seis; PL seis y tres interlineados, antes siete). Cifras con `tabular-nums`. Leaflet impone sus familias: se sobrescriben.
- **Capas de apilamiento con nombre** (PL, AP, CP): Leaflet usa 200–1000 dentro del mapa (400–700 paneles, 800 controles); lo que va encima empieza en 1100. *PL: las capas de Leaflet tapaban las barras fijas: `isolation:isolate`.*

## 8. Cartografía y fondo del mapa

- **Lo que se ve depende del zoom, no de lo elegido** (GA, como el mapa de árboles de Nueva York): alcaldías → colonias → elementos → íconos, con umbrales con nombre (`Z_COL`, `Z_ARB`…). Fundidos entre niveles en vez de cambios de golpe (GA `OPACIDAD`).
- **Fondo propio en lugar de mosaicos de terceros** (GA v28h, PR): manzanas de Catastro por alcaldía desde zoom 13–14, verde `#D9EAD0`, agua `#BCD7E6`, suelo neutro; a escala de ciudad no se descarga nada. Ventajas: sin terceros, CSP cerrada, sin puntos de interés que compitan, calles iguales a las de INEGI. *Descartados: OSM (su política no admite uso intenso, manda la IP de cada persona, sus calles quedaban a 20–30 m de las de INEGI); CARTO (en agosto de 2026 empezó a exigir llave: AP vio «API KEY REQUIRED» estampado); EOX (borroso); Esri gris (solo hasta zoom 16).* Satélite: Esri con crédito obligatorio, pendiente de licencia (PR, PL, CP).
- **Mapa base caído:** a las 3 fallas de tesela, aviso «puede tocar el mapa o capturar coordenadas» (PL); sin mosaicos el mapa sigue permitiendo colocar y mover el punto (EF). Marcador propio incrustado (*el ícono de Leaflet se baja de fuera y choca con la CSP*).
- **No colorear por un conteo que refleja el avance de un levantamiento** (GA v5: «la alcaldía con más árboles» salía por error). Se colorea por un indicador; el conteo se informa. Sin rankings.
- **Límites legibles sobre cualquier fondo:** franja blanca ancha con la línea oscura encima (GA). Máscara fuera de la ciudad (AP crema al 0.88). El elegido solo con contorno (*GA v12: el relleno dibujaba una cuña falsa*).
- **Etiquetas con colocador propio** (GA, PR): *el filtro de colisión de deck.gl revisa solo el ancla: 530 pares encimados (PR)*. Cajas en «píxeles del mundo» a zoom redondeado de 0.2 en 0.2 para que no brinquen; una sola fila de prioridad; nombres de calle sobre el tramo recto, repetidos cada 240 px sobre una cuadrícula fija de 260 px, solo si caben. Resultado: 0 encimados y 93 % estables (PR). Nombre de un área en su polo de inaccesibilidad, precalculado (*PR: con el promedio de vértices, 163 colonias tenían el nombre fuera*). Juego de letras fijo que incluya las mayúsculas acentuadas y la Ñ (*PR: «NUEVA ESPA A»*). Contorno de letra: `outlineWidth` se divide entre el `radius` del SDF (PR).
- **Halo blanco sobre satélite** para todas las superposiciones (CP, un solo `drop-shadow`).

## 9. Datos geoespaciales y cadena de datos

- **EPSG:4326 al publicar; reproyectar al convertir, nunca al pintar** (todos). Leaflet usa [lat, lng] y GeoJSON [lng, lat] (PL lo recuerda en un comentario). Se lee el `.prj`, no se supone (PR se detiene si no es la proyección esperada). Superficies en EPSG:6372 (CP).
- **Precisión:** 5 decimales para mostrar (≈1 m), 6 para guardar (≈11 cm) (PL, CP). Formato propio para datos grandes (GA, PR): enteros varint zigzag, coordenadas en deltas, gzip con `mtime=0` para que los mismos datos den el mismo archivo.
- **Validar en la cadena, no en la pantalla** (PL `generar_capas.py`, PR `SUMAS.json`): número de polígonos, claves únicas, anillos cerrados, coordenadas dentro de la ciudad (detecta un sistema equivocado), geometrías válidas (*PL: el redondeo dejó 9 colonias inválidas y el cruce fallaba sin avisar → `shapely.set_precision` y `make_valid`*; *CP: 12 geometrías inválidas daban la zona equivocada*). Huella del contenido descomprimido. Versiones de Python fijadas (*PR: Shapely cambió desempates y 144 frentes quedaron enlazados al tramo contiguo*).
- **Unión por clave estable, nunca por el nombre** (todos). *PR: el frente se identifica por su número de orden, que cambia al regenerar; la clave real es CVEGEO+CVEFT.* CP: una sola llave `nombreClave()` aplicada al dato crudo antes de escapar (*una «'» se volvió `&#39;`*). AP: llave primaria pegada como valor, no fórmula (*corregir la alcaldía renombró el árbol y dejó huérfanas sus fotos*).
- **Uniones con umbral explícito y reportado** (PR: punto → frente a ≤20 m, 91.1 %; GA: punto fuera de todo polígono → el más cercano hasta 30 m). Los que no entran se reportan al proveedor, no se excluyen sin decisión.
- **Traslapes y precedencia declarados** (CP `_COV_ORDEN`; PL: entre colonias encimadas gana la más pequeña, la alcaldía sale de su propia capa y no del atributo de la colonia: *12 colonias tienen su interior en otra alcaldía*). Tolerancias sustentadas con análisis (CP 5 % para Suelo de Conservación). Tres estados: Dentro, Fuera, Sin dato (*CP: los cargadores tragaban el error y la imagen decía «Fuera» con la capa caída*).
- **El cruce en el navegador es provisional; el del servidor manda** (PL D16, D38). El visor global y la cifra pública son del SIA vía GeoServer; los mapas de trabajo, con poco volumen, del sistema. Antes de pasar a las capas del SIA se comparan con una huella (polígonos, superficie y centroide; PL `huella_capas.py`: *el SIA tenía 1,817 unidades territoriales contra 1,837 colonias*). El SIA no quiere una tercera capa si el dato cabe en una que ya existe (D286).
- **Umbrales por encima del error del GPS** (PL D69: *avisar de duplicado a menos de 5 m saltaría en el árbol vecino; el GPS da 5–10 m a cielo abierto y 15–30 m entre edificios*): en el servidor, la suma de las dos precisiones con piso de 5 m. «Lejos del resto» se mide contra el vecino más cercano, no contra la mediana (*D197: con dos grupos, la mediana marcaba todo el chico*).
- **Derivar siempre sobre el punto tal como se guarda** (PL B183: *se derivaba sobre el punto sin redondear y se guardaba el redondeado; PostGIS y la app diferían en 182 árboles*). Capas en orden de clave para que la app y PostGIS desempaten igual sobre un borde compartido. Cada registro guarda con qué versión de capa se derivó.
- **Ámbito: la unión de las alcaldías más un margen, no una caja** (PL: *la caja aceptaba municipios vecinos*). Fuera del ámbito no se atribuye entidad (*CP: un punto en Madrid salía «Estado de México»*).
- **Catálogos con piezas partidas se unen en los datos** con alias para que las ligas viejas sigan (GA). Nombres oficiales limpios con acentos de una lista revisada, conservando el original (GA, PR); lo que el catálogo trae mal se reporta, no se corrige en silencio.
- **Simplificar para dibujar, no para medir** (PR): manzanas 0.7 m, verde y agua 1 m. Alcaldías simplificadas juntas con `coverage_simplify` (CP: de 17,220 a 2,050 vértices, sin huecos ni encimes).
- **Fecha de corte visible** en pantalla, fichas y descargas (PR, CP). CP distingue «última consulta al inventario» de la fecha de corte que debe fijar el área.
- **Capas para GeoServer:** GeoPackage en 4326 con índice espacial y un `.sld` con los mismos colores (PR).
- **Sin coordenada no entra a la capa** (AP): un punto en el origen es peor que una capa incompleta. Un valor fuera de rango no se publica, pero el registro sí, con aviso (AP).

## 10. Rendimiento

- **Lo caro es dibujar** (PR: 985 mil vértices; con WebGL por software, 88 s al abrir → 15 s). Datos en arreglos tipados reutilizados; la visibilidad con `DataFilterExtension`; las capas se rehacen solo al cruzar umbrales de zoom (GA `NIVELES`, PR `ZOOM_CORTES`) o tras un salto grande; `useDevicePixels` máximo 1.5.
- **deck.gl:** las capas ocultas también se preparan (*GA: 64 capas, 1.5 a 3 s congelado*) → entran solo cuando se ven (`despiertas`). `characterSet` fijo (*con `'auto'` rehacía el atlas en cada zoom*). Máximo 3 combinaciones de letra con el mismo `fontSettings` SDF. Ids de capa sin terminar en `-fill` ni `-stroke` (PR).
- **Modo ligero automático** con SwiftShader, llvmpipe o «Basic Render» (PR): sin animación, resolución 1×, menos capas, y explica cómo activar la aceleración.
- **Carga por partes:** datos con `<link rel=preload as=fetch>`; lo de cada alcaldía cuando se ve; fondo desde zoom 13–14; librerías pesadas al pedirlas; Leaflet cuando el mapa se acerca a la pantalla (AP `IntersectionObserver`). Todo código que use datos tardíos tolera que aún no estén (GA `CALLES_LISTAS`).
- **Ciclos largos en pedazos de 8 a 10 ms** (`requestIdleCallback`, `scheduler.yield`); lo que no depende de la vista se calcula al armar los datos (*GA: el punto del nombre de 2,019 colonias costaba 2.7 s al abrir*).
- **Medir como teléfono:** procesador 4 a 6 veces más lento, tareas de más de 50 ms (GA `bloqueo.py`), Lighthouse en el sitio en línea. Techo de peso por página probado (AP 145/125/80 KB comprimido). *AP: Express no comprime por omisión; sin `compression()` el sitio pesa cuatro veces más.*
- **Imágenes al tamaño en que se ven,** WebP con `srcset` (AP). Fotos de campo a 800×600 JPEG 0.7 (PL), que además quita la ubicación de la cámara.
- **WebKit escribe en IndexedDB mucho más lento** (PL: 11 min contra 2 s): lo que baje al teléfono se escribe por partes.

## 11. Interacción y estado

- **Toda vista nueva pasa por una función** (`irA()`/`volar()`): *deck.gl ignora un `initialViewState` igual al anterior* (GA v30, PR) → cada envío lleva un número distinto. Sin animación no se llama `onViewStateChange`: se actualizan capas y escala aparte (PR). Vuelo de 800 ms, 0 con `prefers-reduced-motion`. Encuadre con margen que descuenta los controles y la ficha.
- **Turnos para respuestas tardías** (GA `TURNO`, PR `locReq`): ubicación, descargas y ligas comparan el turno antes de elegir algo. *PL B131: Supervisión pintaba datos de la cuenta anterior si se cambiaba de sesión mientras cargaba.*
- **Dedos «fantasma» en iPhone con deck.gl** (GA v28k y v29b, PR): la lista de punteros (`dk.eventManager.manager.input.store`) se queda con dedos cuyo `touchend` no llegó: con uno de más, un dedo pellizca; con dos, el mapa se congela. Se despacha `pointercancel` de los sobrantes al quitar el último dedo, al empezar un toque primario y en `blur`/`visibilitychange`.
- **Leaflet:** revienta si se construye dos veces sobre el mismo nodo (`remove()` y borrar `_leaflet_id`, AP); lanza `_leaflet_pos` tras destruir un mapa a media animación (CP); un contenedor que pasa de oculto a visible necesita `invalidateSize()` a los 50–80 ms y no se encuadra si `offsetParent===null` (PL, AP). `L.DomEvent.disableScrollPropagation` y `disableClickPropagation` en paneles sobre el mapa (CP, PL). Chromium mete cada polígono interactivo en el orden de tabulación: `tabindex=-1` con un `addInitHook` (CP).
- **iOS:** `overflow:hidden` no detiene el desplazamiento (se fija el `body` con `position:fixed` conservando la posición); `position:fixed` no escapa de un ancestro con `transform`; no hay Fullscreen API (se simula); el desplazamiento suave sin condición anima la restauración al cargar (AP: solo con `html:focus-within`).
- **Navegador:** lo guardado se valida al leerlo; claves con versión (`gda:v1:*`); todo en try/catch porque el almacenamiento puede estar bloqueado (GA). Dos pestañas con IndexedDB: la vieja suelta la base (PL).
- **Sin conexión:** «Volver a intentar» y reintento con el evento `online` (GA); service worker solo cuando hace falta trabajar sin red (PL, CP), con la lista de archivos leída de `index.html`, la página primero de la red y nunca una versión a medias (*CP: si la versión nueva se instalaba sin red, su caché quedaba vacía para siempre*).

## 12. Accesibilidad

- **axe-core en todas las pantallas, computadora y celular** (GA 0 hallazgos; PL un hallazgo aceptado: puntos de menos de 24 px, con la lista como equivalente). axe encuentra solo 30 a 40 % de los problemas: falta el recorrido con lector de pantalla real (AP, PR, GA lo declaran).
- **Estructura:** `<main>`, `lang="es-MX"`, regiones con nombre, mapa `role=img` o `application` con un nombre que remite a la lista, íconos `aria-hidden`, enlace para saltar al contenido con `position:fixed` (*AP: con `absolute` salía fuera de pantalla*).
- **Anuncios:** un `role=status` que se vacía y se llena en el siguiente cuadro (*GA: uno que aparece y cambia de texto a la vez a veces no se lee*); solo la conclusión, no cada paso (CP). Datos derivados en `<output>` (PL).
- **Marcadores fuera del orden de teclado** (AP: 24 paradas para 12 árboles) cuando la lista es la vía accesible.
- **Textos según el puntero:** «haz clic» o «toca» (CP).
- **Movimiento reducido en todo,** también el desplazamiento por JS (CP `_suave()`) y el pulso del marcador (AP).
- **Leaflet en español:** sus controles traen «Zoom in» y «Close popup» (AP pendiente; CP los tradujo).

## 13. Seguridad, servidor y entrega al SIA

- **CSP estricta sin `unsafe-inline`** (GA, PR, PL): `default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; style-src 'self'; img-src 'self' data: blob:` más el dominio de las teselas; `worker-src 'self' blob:` si hay Excel o PDF en un Worker (PR); `object-src 'none'; base-uri 'self'`. La CSP vive en un solo archivo que usan nginx, Express y la prueba (GA `encabezados.conf`). La `<meta>` no admite `frame-ancestors` (PL). *CP: la CSP de `sw.js` gobierna sus propios `fetch()`: si falta un host en `connect-src`, responde 503.*
- **Encabezados:** `nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: geolocation=(self), camera=()`. Teselas con `no-referrer` (PL).
- **nginx** (PL, PR, CP): `location ^~` en cada prefijo (*sin él, una regla general por extensión sirvió `app.js` sin sesión ni cabeceras*); `absolute_redirect off` (*las redirecciones salían con `http://`*); `add_header` repetido en cada bloque porque no se hereda; sin HSTS en el fragmento (*con `includeSubDomains` compromete el dominio un año*); `root` y no `alias`; `.bin` sin gzip; ráfaga de `limit_req` suficiente para los archivos que pide la página al abrir.
- **Instalación:** una carpeta por versión y un enlace simbólico a la vigente; regresar es cambiar el enlace (GA, PR). ZIP con `.sha256` y manifiesto, permisos 0644/0755 aunque se arme en Windows, sin documentos internos, sin direcciones ni llaves (PL, PR, CP).
- **Login en el servidor, nunca en la página** (PR, CP, PL): `auth_request` en nginx; datos y programas responden 401, no 302, para que la página diga «Tu sesión terminó». scrypt N=2^14, r=8 (*con 2^17, diez accesos simultáneos ocupaban 1.3 GB*); el mismo 401 para toda falla; intento anotado en un solo paso; cookie con `Path` acotado. *PR: sia-backend no usa `trust proxy`: el límite por IP habría bloqueado a todos a la vez.* El detalle está en la skill `proyecto-sia`.
- **Lo escrito por la persona o por la hoja se inserta como texto** (`textContent`, `esc()` una sola vez en el origen; CP `cleanUrl()` exige http(s)).
- **Medición con consentimiento** (AP): denegado por omisión, el programa de medición no se carga hasta «Aceptar», con «Aceptar» y «Rechazar» del mismo peso.
- **Sitio de pruebas en GitHub Pages:** Source en «GitHub Actions» y `.nojekyll` (*GA: Jekyll compitió con Actions y el sitio mostró el README*); `noindex` en prueba.

## 14. Pruebas

- **Playwright con Chromium y WebGL por software** (`--use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader`) y WebKit para Safari (GA, PR, PL). Con la tarjeta gráfica real de noche (*Windows frena el WebGL por software con el equipo sin usar*). Con WebGL por software, tras el primer clic el mapa deja de recibir clics: los toques se simulan con ganchos solo de prueba (`window.__ETQ`, `window.__MAPA`).
- **Tamaños:** 1440 × 900; 360, 390 y 430 de ancho con `is_mobile` y `has_touch`; 844 × 390 acostado; 320 y 430 con letra al 125 % (PR).
- **Esperar una marca de «listo», no tiempos fijos** (PL `data-listo`). Correr como si fuera otro día (PL `SRP_HOY`: *destapó 10 comprobaciones que dependían de la fecha*). Datos fijos de prueba con los casos difíciles, no la red (AP).
- **Qué se prueba siempre:** desbordes y barra horizontal; sin terceros (todo dominio externo bloqueado); CSP sin violaciones; sin WebGL; sin almacenamiento; sin internet a media visita; datos tardíos o cortados; dos pantallas (el mapa mide lo mismo antes y después, `inert`, nada encimado); nombres del mapa (dentro de su figura, sin encimarse, estables); dedos fantasma; contenido de las descargas (Excel con openpyxl, PDF con pdftotext).
- **«Foto» antes y después de una reorganización:** estilo calculado de cada elemento, textos, atributos e imagen; debe dar 0 diferencias (GA). Regresión contra la versión anterior tomada de git (PR).
- **Una orden, una señal** (PR `correr_todas.js`, GA `probar.py`, EF `npm run verificar`): lo que no corrió cuenta como falla; el veredicto sale del código de salida (*AP: buscar el texto «0 fallidas» dejaba pasar fallas*).
- **Cada error encontrado se vuelve una revisión** para que no regrese (GA `auditoria.py`). Nunca se borra una aserción en silencio (AP).
- **Trucos de prueba reutilizables** (PL): área táctil con `elementFromPoint` a 5 px fuera del borde visible (debe caer en el mismo control); intersección del marcador con los botones de zoom; doble envío con dos `requestSubmit()` seguidos (un solo registro); ids repetidos en la página (*PL B137: un filtro no respondía*); la app abierta que pasa la medianoche (*B152: la fecha máxima quedaba fija*). Contar elementos exactos hace pruebas frágiles: mejor medir desbordes y renglones.
- **Falsos hallazgos conocidos:** `.focus()` por código no dispara `:focus-visible`, y los clics simulados sí lo encienden (AP, CP); las capturas de página completa deforman los fijos (CP); sin la letra real los cortes de renglón cambian (CP). Lo que exige personas y teléfonos reales se declara.
- **Windows:** todo script en UTF-8 (*cp1252 detenía las pruebas por una «→»*); sin `shell:true` (parte las rutas con espacios); `python3` abre la tienda de Microsoft; `new URL().pathname` codifica «Páginas web» (usar `fileURLToPath`); `.gitattributes` con `eol=lf` (*CRLF rompía `sha256sum -c` y los `.sh`*); `http.server` de Python deja solo 5 conexiones en espera y rechaza archivos cuando la página pide decenas a la vez (*PL B188–B192: «L is not defined» intermitente*; servidor propio con 256).
- **La CSP estricta bloquea el `eval` de las pruebas** (PL B90: `wait_for_function` de Playwright): las pruebas preguntan desde fuera. Tope de tiempo por prueba y limpieza que siempre cierra conexiones (*PL B210: una corrida esperó 7 horas*).

## 15. Lenguaje

- **Sin tecnicismos** («la lista», no «el panel»; nada de NDVI, percentil, frente de manzana sin explicar). Un nombre por dato. Sin diagonales de género. Acciones atribuidas a «la Secretaría». Sin números escritos que envejecen.
- **Trato:** tú para el público (GA, CP, AP); usted para personal en campo (PL). PR pendiente.
- **Singular, plural y cero:** «1 árbol», «aún sin árboles», «menos de 1 %». Formatos humanos: km sin decimales desde 10, metros debajo de 1 km (*PR: «0 km» eran 135 m*); distancias de 10 en 10 m.
- **Plantillas completas con marcadores con nombre** (`{calle}`, `{LIGA}`), no frases armadas con pedazos (*GA v24b: la liga se insertó en la primera «L» del mensaje*).
- **Errores en español con una acción** («Revisa tu conexión» + «Volver a intentar»); el detalle técnico a la consola; se distingue sesión, red y servidor (PR).
- **Lo que el mapa no puede afirmar, no lo afirma:** «Consulta informativa, sin validez legal», «polígono» y no «predio» (CP); toda afirmación jurídica cita artículo y norma o se deja `[Art. __]` (AP, GA).
- **Un mensaje no depende del ancho:** «el listado que lo acompaña», no «el de la derecha» (AP).

## 16. Trampas conocidas, por plataforma

| Plataforma | Trampa | Arreglo |
|---|---|---|
| deck.gl | Ignora un `initialViewState` igual al anterior | Número distinto en cada envío (`irA`) |
| deck.gl | Prepara capas ocultas | Entran solo cuando se ven |
| deck.gl | `characterSet:'auto'` rehace el atlas; más de 3 combinaciones de letra redibujan sin parar | Juego fijo; 3 combinaciones con el mismo SDF |
| deck.gl | Dedos fantasma en iPhone | `pointercancel` de los sobrantes |
| deck.gl | Filtro de colisión solo por ancla | Colocador propio |
| deck.gl | Solo WebGL 2; con WebGL 1 queda en blanco | Detectar `webgl2` y `onError` con aviso |
| Leaflet | Ícono del marcador desde un servidor externo | SVG propio incrustado |
| Leaflet | Doble construcción sobre el mismo nodo | `remove()` y borrar `_leaflet_id` |
| Leaflet | Contenedor oculto | `invalidateSize()` a los 50–80 ms |
| Leaflet | Polígonos en el orden de tabulación | `tabindex=-1` |
| Leaflet | Crédito azul a 2.55:1; controles en inglés | Fondo claro; traducir |
| iOS Safari | `100vh`/`100dvh` no miden lo visible | `--alto = innerHeight` |
| iOS Safari | Campos de menos de 16 px acercan la página | 16 px |
| iOS Safari | Hover pegado al tocar | `@media (hover:hover)` |
| iOS Safari | Sin Fullscreen API; `fixed` dentro de `transform` | Simular; mover a `<body>` |
| iOS Safari | Cifras subrayadas como teléfonos | `format-detection` |
| iOS Safari | Borra lo guardado tras 7 días sin uso | «Agregar a inicio» en apps de campo |
| CSS | `[hidden]` pierde ante `display` | `[hidden]{display:none}` por componente |
| CSS | `transition:all` desvanece el foco | Propiedades nombradas |
| CSS | Consultas de contenedor (`cqw`) en Safari anterior a 16 | Respaldo con `@supports` |
| Teselas | Sin CORS no se pueden copiar a un lienzo (croquis, imagen para compartir) | Proveedor con CORS o intermediario propio; fondo liso con aviso |
| Geolocalización | Solo funciona con HTTPS: una prueba por HTTP en la red interna parece un defecto | Probar siempre con HTTPS o `localhost` |
| Canvas | Ignora `var()` | Resolver el color antes |
| GitHub Pages | Jekyll compite con Actions; `max-age=600` | Source en Actions, `.nojekyll`; `no-cache` en la página |
| Google Sheets | Exporta el valor mostrado; pestaña completa al publicar | Lector tolerante; pestaña de salida |
| Python en Windows | `\b` en un script por terminal se vuelve retroceso | Editar con el editor; buscar caracteres de control |
| nginx | `add_header` no se hereda; reglas por extensión ganan sin `^~` | Repetir; `location ^~` |
| Express | No comprime ni redirige la diagonal final por omisión | `compression()`, `redirect:true` |

## 17. Contradicciones entre proyectos (decisiones del estándar)

| # | Tema | Lo que hay | Propuesta |
|---|---|---|---|
| D1 | Motor del mapa | deck.gl (GA, PR: muchos datos, fondo propio) · Leaflet (PL, CP, AP, EF: pocos elementos, teselas, captura de punto) | Los dos, con el mismo «armazón» (panel, controles, simbología, ficha, celular, tokens): deck.gl desde unos 10 mil elementos o con líneas; Leaflet para lo demás |
| D2 | Color de acción | Guinda (GA, PR, CP, EF) · azul (PL: guinda y rojo de error a 1.1:1; pasó por pizarra en D124 y quedó en azul `#1B5FAA` en D166, con el guinda solo en el PDF) · jacarandá (AP) | El de EF: guinda para la única acción principal, azul para lo que se toca y lo elegido; el error del mapa en ámbar si el guinda ya significa algo en los datos |
| D3 | Color del foco | Azul (EF, PL) · verde hoja (GA) · guinda oscuro de dos tonos (PR) · dorado oscuro (AP) | Azul de EF con halo blanco (dos tonos), que se ve sobre el mapa y sobre fichas oscuras |
| D4 | Identidad de cada visor | GA verde hoja; AP jacarandá; CP crema; PR y PL neutros | Base institucional común más un «tema» de pocos tokens (marca, superficie de la ficha); nunca cambia la acción ni el foco |
| D5 | Cortes de ancho | 860 (GA, PR) · 760 (CP) · 480/700/1024 (PL) · 560/760/1024 (EF) | Los de EF, solo `min-width`; dos pantallas por debajo de 760; panel de 320 entre 760 y 1023; teléfono acostado con panel lateral |
| D6 | Celular | Dos pantallas (GA, PR) · hojas sobre el mapa (CP) · mapa en reposo dentro de la página (PL, AP, EF) | Por tipo: visor de consulta → dos pantallas; mapa dentro de una página (ficha, formulario) → en reposo con dos dedos; hojas solo para la ficha sobre el mapa |
| D7 | Fondo del mapa | Propio (GA, PR) · CARTO con llave (AP, CP) · Esri satélite (PL, PR, CP) | Propio por omisión (sin terceros); satélite opcional con crédito |
| D8 | Armado y herramientas | Python (GA, PR) · Node (AP, CP, EF) · sin armado (CP) | Node para armar y verificar (como EF); Python solo para preparar datos geográficos |
| D9 | Caché | Huella por archivo (GA, PR) · `?v=versión` (PL) · versión del service worker (CP) · todo incrustado (AP) | Huella por archivo; service worker solo en apps de campo sin conexión |
| D10 | Trato | Tú (GA, CP, AP) · usted (PL) | Tú para el público, usted para personal interno |
| D11 | Ficha de un tema oscuro | Ficha oscura (GA, verde noche #173B2E, donde el enlace azul da 1.73:1, par MC27) · fichas claras (AP, CP, PR, PL) | Dos salidas: fichas de tema siempre claras, o lo tocable en blanco subrayado dentro de la ficha oscura |
| D12 | Azul de «mi ubicación» y del foco | Punto azul convencional #1A73E8 (GA, PR) · foco azul de formularios #1A73C7 (EF): casi el mismo azul, 1.08:1 (par MI03) | Dejar los dos: el punto es el que la gente reconoce y el foco es el de todas las páginas del SIA; se distinguen por la forma |

### Decisiones tomadas (la Secretaría, 14 oct 2026)

| # | Decisión |
|---|---|
| D1 | **Los dos motores con el mismo armazón.** deck.gl con muchos elementos o líneas; Leaflet para lo demás |
| D2 | **Como formularios:** guinda para la única acción principal; azul para lo que se toca y lo elegido; error del mapa en ámbar si el guinda ya significa algo en los datos |
| D3 | **Foco azul de formularios con halo blanco** (dos tonos) |
| D4 | **Tema limitado por visor:** base institucional común y pocos tokens de marca (títulos, ficha); la acción y el foco nunca cambian |
| D7 | **Según el proyecto:** el estándar trae el fondo propio y las teselas de un proveedor, y la guía de decisión dice cuándo conviene cada uno (por ejemplo, satélite en campo; fondo propio cuando no se admiten terceros o con deck.gl) |
| D5, D6, D8, D9, D10 | Como se propusieron en la tabla de arriba (la Secretaría no las objetó) |
| D11 | **Fichas de tema siempre claras.** El azul de lo tocable y la marca llegan a 4.5:1 sobre la ficha; la marca va en el título y en la franja del borde. Tomada al revisar la fase 1 (GEO-70) |
| D12 | **«Mi ubicación» y el foco conservan su azul.** El punto sigue el azul convencional y el foco, el de formularios; se distinguen por la forma (punto lleno con borde blanco y círculo de precisión, contra anillo de dos tonos), nunca sólo por el color. Tomada al revisar la fase 1, con la recomendación del estándar (GEO-31, GEO-58) |
