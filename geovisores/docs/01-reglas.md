# 01 · Reglas de los geovisores del SIA

> Este documento se **genera** de `reglas/reglas.json` (`node herramientas/generar-reglas.mjs`). No se edita a mano: se corrige la regla en el JSON y se vuelve a generar.

El estándar tiene **133 reglas**: 103 BASE, 24 RECOMENDADO, 6 OPCIONAL. 120 salieron de lo que pasó en los proyectos, 13 son decisiones del estándar (D1 a D12) y 0 son mejores prácticas adicionales. No repiten las reglas de formularios: cuando una regla del mapa amplía una de formularios, la cita (FRM-xx).

**Niveles.**

- **BASE.** Todo visor al que aplica la cumple. Apartarse exige una decisión anotada en la documentación del proyecto.
- **RECOMENDADO.** Se cumple salvo un motivo escrito en la documentación del proyecto.
- **OPCIONAL.** Técnica o módulo que se usa cuando el visor lo necesita. Si se usa, se hace así.

**Cómo leer cada regla.** *Regla*: qué se hace. *Por qué*: la historia que la hizo necesaria, o la razón cuando no hay historia; una regla sin su historia se desobedece en cuanto estorba. *Aplica a*: qué visores la siguen. *Origen*: proyecto (con su versión, decisión o bitácora), decisión del estándar (Dn) o regla de formularios (FRM-xx). *Verificación*: cómo se comprueba; las herramientas de verificación de las fases 2 a 4 se construyen sobre esta columna.

**Proyectos de origen.** GA: Guardianes de árboles (adopta-un-arbol, v31d), deck.gl 9.4 · PR: Priorización de reforestación (MODELO-PRIORIZACION-REFORESTACION, v1.25), deck.gl 9.4 · PL: Sistema de Registro de Plantaciones (Sistema de Plantación de Arbolado Urbano, v0.9.64), Leaflet 1.9.4 · CP: Categorías de protección ambiental (sia-v35), Leaflet 1.9.4 · AP: Árboles patrimoniales, Leaflet 1.9.4 · EF: Estándar de formularios del SIA 1.0.0, Leaflet (módulo mapa). La historia completa de cada regla está en `docs/00-aprendizajes.md`.

## Índice

1. [Arquitectura y armado](#1-arquitectura-y-armado) · GEO-01 a GEO-16 (16)
2. [Computadora y celular](#2-computadora-y-celular) · GEO-17 a GEO-26 (10)
3. [Controles del mapa](#3-controles-del-mapa) · GEO-27 a GEO-39 (13)
4. [Panel, filtros, buscador y listas](#4-panel-filtros-buscador-y-listas) · GEO-40 a GEO-48 (9)
5. [Ficha del elemento](#5-ficha-del-elemento) · GEO-49 a GEO-54 (6)
6. [Componentes](#6-componentes) · GEO-55 a GEO-64 (10)
7. [Color y tokens](#7-color-y-tokens) · GEO-65 a GEO-72 (8)
8. [Cartografía y fondo del mapa](#8-cartografía-y-fondo-del-mapa) · GEO-73 a GEO-79 (7)
9. [Datos geográficos](#9-datos-geográficos) · GEO-80 a GEO-93 (14)
10. [Rendimiento](#10-rendimiento) · GEO-94 a GEO-101 (8)
11. [Interacción y estado](#11-interacción-y-estado) · GEO-102 a GEO-108 (7)
12. [Accesibilidad](#12-accesibilidad) · GEO-109 a GEO-112 (4)
13. [Seguridad, servidor y entrega](#13-seguridad-servidor-y-entrega) · GEO-113 a GEO-119 (7)
14. [Pruebas](#14-pruebas) · GEO-120 a GEO-127 (8)
15. [Lenguaje](#15-lenguaje) · GEO-128 a GEO-133 (6)

## 1. Arquitectura y armado

### GEO-01 · El motor se elige por los datos; el armazón es el mismo

**BASE** · aplica a: todos

**Regla.** deck.gl cuando el visor dibuja unos 10 mil elementos o más, o líneas (calles, frentes); Leaflet para lo demás. Los dos usan el mismo armazón: panel, controles, simbología, ficha, comportamiento en el celular y tokens. Cambiar de motor no cambia lo que la persona ve ni cómo lo toca.

**Por qué.** GA y PR necesitaron deck.gl para cientos de miles de vértices; PL, CP y AP resolvieron con Leaflet pocos elementos, teselas y la captura de un punto. Con un armazón distinto por motor, cada visor nuevo repetía en su propio código los errores que otro ya había resuelto.

**Origen.** D1; GA; PR; PL; CP; AP · *decisión del estándar*

**Verificación.** guía de decisión (docs/03); las plantillas de los dos motores pasan las mismas pruebas

### GEO-02 · Fuente y salida separadas; la salida no se edita a mano

**BASE** · aplica a: todos

**Regla.** Un script de armado junta las piezas y escribe la carpeta que se publica. Nadie edita esa carpeta. El armado deja un recibo con la huella de cada archivo y una prueba comprueba que lo publicado coincide con el recibo.

**Por qué.** AP hizo commit y push correctos con docs/ un día y medio atrasado; nadie lo notó hasta que se agregó un recibo de huellas que firma cada armado (sellar.js).

**Origen.** GA armar.py; PR construir.py; AP sellar.js · *aprendizaje de proyecto*

**Verificación.** armado: escribe el recibo de huellas; prueba: lo publicado coincide con el recibo

### GEO-03 · El armado valida todo y se detiene ante lo que no reconoce

**BASE** · aplica a: todos

**Regla.** El armado trabaja en memoria con listas fijas de piezas esperadas y escribe solo al final, y solo lo que cambió. Se detiene si una pieza falta, sobra o pesa casi nada; si queda un marcador sin reemplazar, código o estilo dentro del HTML, un nombre de módulo que ya no existe, una marca que debía quitar y no encontró, o un total de control distinto. Al terminar corre node --check sobre el JS armado. En una línea que tiene código solo se usan comentarios /* */.

**Por qué.** AP: tres veces la página quedó a medias en blanco porque el armado envolvía un módulo que ya no existía. GA v28b, dos veces: un comentario // en una línea que seguía con código dejó la página detenida en «Descomprimiendo datos…». Escribir solo lo que cambió evita que git vea cambios falsos (PR).

**Origen.** PR; GA TOTALES_ESPERADOS; GA v28b; AP envolver(); AP exigir() · *aprendizaje de proyecto*

**Verificación.** armado: termina con código distinto de 0; prueba con una pieza faltante y con un marcador sin reemplazar

### GEO-04 · El JavaScript se parte por tema y se une en una sola función

**RECOMENDADO** · aplica a: todos

**Regla.** Cada tema va en su archivo (datos, mapa, panel, ficha…) y el armado los une dentro de una sola función con alcance compartido y modo estricto: (async function(){ 'use strict'; … })().catch(…), con un catch final que avisa a la persona. El arranque va en el último módulo.

**Por qué.** PR: un módulo usó isPhone antes de que se definiera y la página no terminaba de abrir. CP tiene un solo archivo de 9,785 líneas que su auditoría pidió partir.

**Origen.** GA; PR; CP · *aprendizaje de proyecto*

**Verificación.** armado: orden fijo de módulos; prueba: la página abre sin errores en la consola

### GEO-05 · Abre con doble clic: scripts clásicos, sin módulos ES

**RECOMENDADO** · aplica a: todos

**Regla.** El visor se puede revisar abriéndolo desde el archivo (file://), sin servidor. Se usan scripts clásicos, no módulos ES. Lo indispensable para abrir que haría falta pedir con fetch (por ejemplo, el contorno de la ciudad) se incrusta en el armado. Si los datos grandes necesitan servidor, el visor lo dice en lugar de quedarse en blanco.

**Por qué.** Desde file:// el navegador rechaza los módulos ES y los fetch. AP incrustó el contorno de la ciudad por eso; PL y EF abren con doble clic.

**Origen.** PL; EF; AP · *aprendizaje de proyecto*

**Verificación.** prueba: abrir el armado desde file:// sin errores en la consola

### GEO-06 · Nada de código, estilo ni manejadores dentro del HTML

**BASE** · aplica a: todos

**Regla.** El HTML no lleva <script> con código, atributos style ni manejadores on… (complementa FRM-70). Los estilos que dependen de los datos se aplican por programa desde un archivo .js (atributo data-st o propiedades personalizadas). Así el visor funciona con la CSP estricta del SIA.

**Por qué.** La CSP del SIA no admite unsafe-inline. GA pasó su index.html de 1 MB a 6 KB al sacar todo lo incrustado. AP lo incrusta todo y su guía de despliegue tuvo que pedir «no declarar CSP».

**Origen.** GA; PR; PL; AP; FRM-70 · *aprendizaje de proyecto*

**Verificación.** armado: se detiene si encuentra <script> con contenido, style= u on…=; prueba: cero violaciones de CSP

### GEO-07 · Todos los textos en un archivo, con claves

**RECOMENDADO** · aplica a: todos

**Regla.** Los textos que lee la persona viven en un solo archivo (textos.js) y se piden por clave: tx('clave') en el JS y {{clave}} en el HTML. El armado se detiene si falta una clave y avisa si un texto cambió sus {marcas}.

**Por qué.** Con los textos repartidos en el código no se puede revisar el lenguaje de corrido, y si un texto cambia una {marca}, el código que la llena deja de coincidir sin avisar.

**Origen.** GA textos.js · *aprendizaje de proyecto*

**Verificación.** armado: clave faltante o marca cambiada detienen o avisan

### GEO-08 · Configuración en un solo lugar; llaves fuera del repositorio

**BASE** · aplica a: todos

**Regla.** Direcciones, zooms, límites, capas base con su crédito y umbrales viven en un solo archivo de configuración (complementa FRM-59 y FRM-50). Si para publicar en otro sitio hay que tocar otro archivo, el diseño está mal. Las llaves nunca van al repositorio: variables de entorno o un claves.local.json fuera de git, leído con utf-8-sig.

**Por qué.** AP repite la llave de CARTO en tres archivos. PR lee utf-8-sig porque el Bloc de notas de Windows agrega al principio una marca invisible (BOM).

**Origen.** PL config.js; GA 00_config.js; PR config.js; AP; FRM-59; FRM-50 · *aprendizaje de proyecto*

**Verificación.** auditor: ninguna dirección, zoom ni llave fuera de la configuración; git: claves.local.json en .gitignore

### GEO-09 · Modo prueba y modo producción con un interruptor

**RECOMENDADO** · aplica a: todos

**Regla.** Lo que solo existe para probar va entre /* solo-prueba */ y /* /solo-prueba */; el armado de producción lo quita y se detiene si sobrevive un nombre suyo. Producción nunca escribe en la carpeta del sitio de pruebas. Los datos de demostración llevan prefijo demo- y semilla fija, y el navegador usa una base distinta en prueba y en real.

**Por qué.** GA: un QR de producción publicado por error en el sitio de pruebas queda roto para siempre. PL separa la base del navegador para que una prueba no se mezcle con registros reales.

**Origen.** GA; PL · *aprendizaje de proyecto*

**Verificación.** armado de producción: se detiene si encuentra un nombre de solo-prueba

### GEO-10 · La versión se ve siempre

**BASE** · aplica a: todos

**Regla.** La versión está a la vista sin buscarla (pie, panel o franja) y viaja en fichas, descargas y reportes.

**Por qué.** La persona debe saber sin preguntar si está ante una prueba y poder decir qué versión ve al reportar un error. PL la lleva en una franja fija; PR en el panel, las fichas y el Excel; CP en el pie; GA en «Cómo funciona».

**Origen.** PL; PR; CP; GA · *aprendizaje de proyecto*

**Verificación.** prueba de plantilla: la versión de package.json aparece en la página y en las descargas

### GEO-11 · Caché por huella de cada archivo

**BASE** · aplica a: todos

**Regla.** Cada archivo se pide con ?v= y los 10 primeros caracteres de su SHA-256; index.html va sin caché y lo que lleva huella, un año con immutable. El nombre del parámetro de huella nunca se usa para el estado de la página. Service worker solo en apps de campo que trabajan sin conexión (GEO-108).

**Por qué.** GA: con ?v=versión cada versión obligaba a bajar de nuevo 20 MB de datos que no habían cambiado. PR: v también era un parámetro de la dirección (la avenida) y un enlace compartido quedó guardado un año.

**Origen.** D9; GA v31d; PR; CP · *decisión del estándar*

**Verificación.** armado: escribe las huellas; prueba: cada recurso lleva ?v= igual a su huella; ningún parámetro de estado se llama v

### GEO-12 · Bibliotecas y letras alojadas en el sitio

**BASE** · aplica a: todos

**Regla.** Ninguna CDN ni Google Fonts (complementa FRM-77 y FRM-79): cada biblioteca con origen, versión, licencia y huella. Las pesadas (jsPDF, QR, SheetJS) se cargan cuando se piden. Se actualizan solo por avisos de seguridad y comprobando que el resultado sale igual.

**Por qué.** PR: Google Fonts en el arranque dejaba la página en blanco en redes que lo bloquean. jsPDF 2.5.1 tenía 12 avisos de seguridad. PL no sube a Turf 7 porque cambia el cálculo de punto en polígono. AP y CP todavía usan Google Fonts.

**Origen.** GA; PR; PL; EF; FRM-77; FRM-79 · *aprendizaje de proyecto*

**Verificación.** prueba: con todo dominio externo bloqueado la página abre completa; vendor/MANIFIESTO.json al día

### GEO-13 · Una sola fuente del modelo de datos

**RECOMENDADO** · aplica a: todos

**Regla.** El modelo de datos se escribe una vez (esquema.json) y de ahí salen el diccionario, el JS y el SQL; la auditoría falla si algo quedó atrasado. Los datos que llegan de una hoja de cálculo tienen un contrato de columnas: esperadas y críticas.

**Por qué.** PL genera todo de esquema.json para que la app y la base no se desacuerden. AP (contrato-v2.json) y CP (COLUMNAS_ESPERADAS y COLUMNAS_CRITICAS) revisan la hoja contra su contrato antes de usarla.

**Origen.** PL esquema.json; AP contrato-v2.json; CP · *aprendizaje de proyecto*

**Verificación.** auditoría: lo generado coincide con esquema.json

### GEO-14 · Datos de una hoja: primero lo congelado, después la hoja en vivo

**OPCIONAL** · aplica a: hoja de cálculo

**Regla.** Se pinta primero una copia congelada que viaja con el sitio; la hoja llega después, con espera y reintentos. Si falla, un aviso fijo junto a la cifra dice «Copia local» y su fecha. Una respuesta HTML se rechaza aunque llegue con 200. Nunca se publica la pestaña interna: se publica una pestaña de salida dedicada y el script se detiene si ve columnas ajenas.

**Por qué.** CP: la gente cita la cifra en oficios y necesita saber si es la vigente. Google publica la pestaña completa y exporta el valor mostrado: si es la interna, sale todo lo que contiene (AP, GA).

**Origen.** AP; CP; GA · *aprendizaje de proyecto*

**Verificación.** prueba: con la hoja caída se ve lo congelado y el aviso; con una respuesta HTML no se reemplaza nada

### GEO-15 · Los documentos de trabajo viven con el código

**RECOMENDADO** · aplica a: todos

**Regla.** Decisiones, bitácora y pendientes van dentro del repositorio y se corrigen en el mismo commit que el código. El documento de arranque es corto y apunta a docs/. Los comentarios del código están en presente y sin historia: versiones, fechas, personas y «se intentó» van en la bitácora; pendientes/ es bitácora fechada que no se reescribe.

**Por qué.** Un documento fuera del repositorio se desacuerda del código sin que nadie lo note (AP, CP). Un comentario con historia envejece en cuanto el código cambia; la bitácora no (PL, PR, CP).

**Origen.** AP; CP; PL; PR · *aprendizaje de proyecto*

**Verificación.** revisión de cada entrega

### GEO-16 · Node para armar y verificar; Python solo para datos geográficos

**BASE** · aplica a: todos

**Regla.** El armado, la verificación y las pruebas se escriben en Node (22 o más), como formularios. Python solo prepara datos geográficos (validar, reproyectar, simplificar, formato binario), con las versiones de sus bibliotecas fijadas.

**Por qué.** GA y PR arman con Python; AP, CP y EF con Node: dos cadenas para lo mismo. PR: una versión nueva de Shapely cambió los desempates y 144 frentes quedaron enlazados al tramo contiguo.

**Origen.** D8; GA; PR; AP; EF · *decisión del estándar*

**Verificación.** package.json declara engines; requirements de Python con versiones exactas

## 2. Computadora y celular

### GEO-17 · Visor de consulta en el celular: dos pantallas completas

**BASE** · aplica a: visor de consulta

**Regla.** Por debajo de 760 px, información y mapa son dos pantallas completas. La información sale con translateX(-100%) y su visibility:hidden se aplica 0.25 s después; el mapa nunca cambia de tamaño ni usa display:none. La pantalla oculta lleva inert y el foco pasa al botón de la otra. Arriba de la información, «Ver el mapa»; en el mapa, abajo y a lo ancho, un botón que dice lo que se verá al volver.

**Por qué.** GA y PR probaron el panel que sube desde abajo (GA en tres alturas; PR de la v8 a la v1.10) y lo descartaron: en iPhone dejaba el mapa en 150 a 210 px con los controles encimados. deck.gl redibuja, o queda en tamaño 0, si su contenedor cambia de tamaño o se oculta.

**Origen.** D6; GA v29; PR v1.11 · *decisión del estándar*

**Verificación.** prueba de plantilla: el mapa mide lo mismo antes y después de cambiar de pantalla; la oculta tiene inert; nada encimado

### GEO-18 · Qué lleva a qué pantalla se acuerda antes

**BASE** · aplica a: visor de consulta

**Regla.** Buscar y filtrar se quedan en la información. Elegir algo que se ve en el mapa lleva al mapa, con pushState, para que «atrás» regrese a la lista.

**Por qué.** Sin un acuerdo previo cada módulo decide por su lado y la persona no sabe en qué pantalla va a quedar; «atrás» tiene que deshacer el salto como en cualquier página (GA, PR).

**Origen.** GA; PR · *aprendizaje de proyecto*

**Verificación.** prueba de plantilla: elegir en la lista abre el mapa y «atrás» regresa a la lista

### GEO-19 · Mapa dentro de una página: en reposo, dos dedos para moverlo

**BASE** · aplica a: mapa en página

**Regla.** Cuando el mapa está dentro de una página que se desplaza (ficha, formulario, micrositio), un dedo desplaza la página y dos mueven el mapa. Con Leaflet: Leaflet Gesture Handling. Sin él: touch-action: pan-x pan-y y la etiqueta «Dos dedos mueven el mapa», que se va con el primer pellizco. Para recorrerlo a gusto, pantalla completa.

**Por qué.** Un mapa que atrapa el dedo deja a la persona sin poder bajar por la página. CP descartó «toca para activar»: en iOS el toque no siempre llega como clic.

**Origen.** D6; CP; PL; EF; AP · *decisión del estándar*

**Verificación.** prueba táctil: un dedo desplaza la página sin mover el mapa

### GEO-20 · Hojas sobre el mapa, solo para la ficha

**OPCIONAL** · aplica a: ficha

**Regla.** Una hoja que sube sobre el mapa (asomada, media y completa) se usa solo para la ficha. Se arrastra por el asa y el encabezado, con un umbral de 8 px, medidas tomadas una sola vez al empezar y movimiento pintado con requestAnimationFrame.

**Por qué.** CP encontró cinco causas de hojas «pegajosas» en iPhone antes de que funcionaran. Para todo lo demás, las dos pantallas resultan más simples.

**Origen.** D6; CP · *decisión del estándar*

**Verificación.** prueba en teléfono real (WebKit no reproduce el arrastre de iOS)

### GEO-21 · Tres cortes de ancho, los mismos en CSS y en JS

**BASE** · aplica a: todos

**Regla.** 560, 760 y 1024 px, escritos solo con min-width: los tres de formularios (--bp-sm, --bp-md, --bp-lg). Debajo de 760: dos pantallas (visor de consulta). De 760 a 1023: panel de 320 px. Desde 1024: panel de 400 px. Un teléfono acostado (844 × 390) cae en el tramo de 760 y recibe panel lateral. El JS lee los mismos cortes y atiende el cruce con matchMedia('change'), no con resize. No se agregan cortes.

**Por qué.** Cada proyecto tenía los suyos: GA y PR 860, CP 760, PL 480/700/1024. AP llegó a 15 cortes, los bajó a 9 y necesitó una prueba para sostenerlos, porque CSS no lee variables en @media. CP: con resize, girar el teléfono congelaba la página y la ficha quedaba fuera con el fondo inerte.

**Origen.** D5; GA; PR; CP; PL; AP; EF · *decisión del estándar*

**Verificación.** auditor de CSS: solo 560, 760 y 1024 con min-width; prueba: el JS usa matchMedia con los mismos valores

### GEO-22 · Computadora: panel a la izquierda y pistas que pueden encogerse

**BASE** · aplica a: visor de consulta

**Regla.** Panel a la izquierda y mapa a la derecha: grid-template-columns: var(--panel-ancho) minmax(0, 1fr). Toda pista lleva minmax(0, …) y todo hijo de grid o flex con texto largo, min-width: 0.

**Por qué.** PR: a 390 px la página se dibujaba a 425 porque una pista no podía encogerse.

**Origen.** GA; PR · *aprendizaje de proyecto*

**Verificación.** prueba de tamaños: sin barra horizontal a ningún ancho

### GEO-23 · El alto del teléfono se mide con JS

**BASE** · aplica a: todos

**Regla.** --alto = innerHeight y --vvh = visualViewport.height, actualizados en resize y en visualViewport.resize; lo que ocupa la pantalla usa esas variables, no 100vh, 100% ni 100dvh. Si el alto visible baja de 0.75 del total, la página toma la clase con-teclado: el botón de confirmar queda fijo y el campo al centro.

**Por qué.** GA v29c: height:100% dejaba unos 60 px vacíos abajo, y 100dvh unos 50 px en iOS 26. PL: 100vh escondía el pie de las ventanas.

**Origen.** GA v29c; PR; PL · *aprendizaje de proyecto*

**Verificación.** prueba en WebKit y en teléfono real: sin franja vacía abajo

### GEO-24 · doctype, viewport y zonas seguras

**BASE** · aplica a: todos

**Regla.** Toda página empieza con <!doctype html> y lleva <meta name=viewport content='width=device-width, initial-scale=1, viewport-fit=cover'>. Todo lo fijo respeta env(safe-area-inset-*), y lo que va encima del botón de abajo sube lo mismo.

**Por qué.** GA v25: sin viewport, la página se dibujaba a 980 px en el teléfono. GA v26: sin doctype, el navegador entró en modo antiguo. GA v29c: el botón de abajo tapó la simbología.

**Origen.** GA v25; GA v26; GA v29c · *aprendizaje de proyecto*

**Verificación.** armado: se detiene sin doctype o sin viewport

### GEO-25 · Pantallas táctiles: campos a 16 px y hover solo donde hay puntero

**BASE** · aplica a: todos

**Regla.** Todo campo de texto usa letra de 16 px o más. No se usa user-scalable=no. Los estilos de :hover van dentro de @media (hover: hover). El tamaño táctil de 44 px se decide con (pointer: coarse), no con el ancho.

**Por qué.** Con menos de 16 px, Safari acerca la página al tocar el campo y no la devuelve. iOS ignora user-scalable=no y rompe el pellizco (CP). En el teléfono un toque deja pegado el estado de hover (PL, GA). Un iPad usa el diseño de escritorio pero se toca con el dedo (CP).

**Origen.** GA; PR; PL; CP · *aprendizaje de proyecto*

**Verificación.** auditor de CSS: :hover solo dentro de (hover: hover); prueba: ningún campo con letra menor de 16 px

### GEO-26 · El mapa se adapta al alto que le queda

**RECOMENDADO** · aplica a: todos

**Regla.** Un ResizeObserver mide el mapa: con menos de 210 px de alto se quitan + y −; con menos de 130, todos los controles y la simbología.

**Por qué.** Con poco alto (teclado abierto, teléfono acostado) una columna de botones de 44 px ocuparía casi todo el mapa.

**Origen.** GA · *aprendizaje de proyecto*

**Verificación.** prueba de plantilla: a 200 y 120 px de alto los controles se retiran

## 3. Controles del mapa

### GEO-27 · Una sola columna de botones, en una tarjeta

**BASE** · aplica a: todos

**Regla.** Los botones del mapa van en una sola columna, dentro de una tarjeta, arriba a la derecha. Miden 34 px con ratón y 44 px con el dedo (pointer: coarse). En el celular se quitan + y −: se acerca con dos dedos.

**Por qué.** GA y PR los ponen arriba a la derecha; CP los repartía en dos esquinas y AP los dejaba en 30 px, que con el dedo no llega a 44. En el celular, la columna con + y − pisaba lo de abajo (CP, GA).

**Origen.** GA; PR; CP; AP; FRM-62 · *aprendizaje de proyecto*

**Verificación.** prueba de plantilla: posición y tamaño de la columna en 1440 y 390 px

### GEO-28 · Orden fijo de los botones; la casa es casa

**BASE** · aplica a: todos

**Regla.** Acercar, alejar, toda la ciudad, capas, ayuda y mi ubicación, en ese orden, omitiendo los que el visor no tiene. «Toda la ciudad» lleva el ícono de casa.

**Por qué.** CP: el marco de cuatro esquinas se leía como «pantalla completa». PR descartó «Encuadrar lo consultado» porque se confundía con la casa.

**Origen.** GA; PR; CP · *aprendizaje de proyecto*

**Verificación.** prueba de plantilla: orden de los botones

### GEO-29 · Zoom: sin giro, dentro de la ciudad y con pasos finos

**BASE** · aplica a: todos

**Regla.** El mapa no gira. Sus límites son los de la ciudad (maxBounds). Leaflet: zoomSnap 0.25. deck.gl: rueda a 1/300 (unos 0.2 niveles por muesca). En un mapa dentro de una página, la rueda solo acerca después de un clic en el mapa. Para separar elementos a pocos metros, el zoom máximo puede pasar del nativo de las teselas ampliando la imagen (GA 20.5; PL 22 sobre 19).

**Por qué.** GA probó la rueda a 1/450 (lenta) y a 1/250 (brusca). CP: con pasos enteros, un encuadre que se pasaba unos píxeles caía un nivel completo.

**Origen.** GA; CP; PL · *aprendizaje de proyecto*

**Verificación.** configuración: valores de zoom; revisión con ratón y con el dedo

### GEO-30 · Con zoom bajo, el primer toque acerca y el segundo elige

**RECOMENDADO** · aplica a: todos

**Regla.** Por debajo de un umbral con nombre en la configuración (GA 17.5, PL 17), tocar un elemento acerca hacia él; ya de cerca, tocarlo lo elige.

**Por qué.** A zoom 12 un toque abarca unos 36 m y cae con facilidad en el elemento vecino.

**Origen.** GA; PL · *aprendizaje de proyecto*

**Verificación.** prueba de plantilla: a zoom bajo el toque acerca y no abre la ficha

### GEO-31 · Mi ubicación: rápida primero, precisa después

**BASE** · aplica a: ubicación

**Regla.** El botón del mapa y el del panel hacen lo mismo. Se pide primero una posición rápida (enableHighAccuracy:false, maximumAge de minutos) y en paralelo la precisa; solo se redibuja si se movió más de 50 m. Cada pedido lleva turno y las respuestas tardías se descartan. Se dibuja el punto azul convencional (el guinda queda para la acción y el lugar buscado); el círculo de precisión solo si no tapa lo que se consulta. El punto y el foco son casi del mismo azul (D12): el punto es lleno con borde blanco y el foco es un anillo de dos tonos, así que se distinguen por la forma; el foco nunca se dibuja como un punto lleno. Si la precisión es de cientos de metros, se avisa que la ubicación es «aproximada». El permiso nunca se pide solo al entrar.

**Por qué.** AP: con alta precisión, una computadora tardaba de 5 a 15 s y el botón parecía trabado; AP también quitó el anillo de precisión porque tapaba manzanas. CP y PR: en computadora la ubicación viene de la red y yerra por cientos de metros. PL B7: el permiso se pide cuando la persona toca el botón, que es cuando entiende para qué.

**Origen.** GA; AP; CP; PR; PL B7; D12 · *aprendizaje de proyecto*

**Verificación.** prueba con ubicación simulada: rápida, precisa, tardía y negada

### GEO-32 · Capturar un punto en campo

**BASE** · aplica a: campo

**Regla.** watchPosition hasta 8 s, quedándose con la mejor lectura: buena hasta 10 m, aceptable hasta 30 m. El botón va fuera del mapa, a todo lo ancho, y cambia según el estado («Registrar ubicación» → «Actualizar ubicación»). La ayuda junto al mapa cambia según el momento: sin punto, «Toque el mapa donde está el árbol»; con punto, «Arrastre el marcador o toque otro sitio».

**Por qué.** PL B4 → B8: un control de ubicación dentro del mapa se probó y se retiró. PL D173, prueba de campo: nadie sabía que el marcador se arrastraba.

**Origen.** PL B4; PL B8; PL D173 · *aprendizaje de proyecto*

**Verificación.** prueba con ubicación simulada de 5, 20 y 60 m de precisión

### GEO-33 · Un solo menú de capas

**BASE** · aplica a: capas

**Regla.** Un botón de 44 px con ícono de capas abre un panel con tres partes: tipo de mapa (opciones excluyentes: radios nativos en un fieldset, o miniaturas con role=radiogroup), capas (casillas nativas o interruptores con aria-pressed) y opacidad. Elegir el fondo cierra el menú; una capa no. El alto y el ancho máximos del panel se calculan al abrir, para que quepa en el mapa, y Escape lo cierra. La opacidad es de la capa de datos, de 20 a 100 %, con su nombre y su valor escritos junto al deslizador; el deslizador es propio, o el nativo con medidas propias: barra de 8 px, botón de 28 y área táctil de 44, que se mueve también con las flechas del teclado.

**Por qué.** CP (miniaturas), PL (radios y casilla nativos) y PR llegaron al mismo menú cada uno por su lado. PR v17.10: la Secretaría pidió poder cambiar la opacidad de las capas de prioridad, y quedó de 20 a 100 % en el panel de capas. PL D265: el deslizador nativo era delgado y su botón chico; no se podía tomar con el dedo.

**Origen.** CP montarBotonBase(); PL; PL D265; PR; PR v17.10 · *aprendizaje de proyecto*

**Verificación.** prueba de plantilla: el menú cabe en el mapa a 390 × 500 px; roles y estados con axe

### GEO-34 · El mapa de campo lleva la referencia mínima

**RECOMENDADO** · aplica a: campo

**Regla.** En captura, la capa de referencia es solo la que ayuda a ubicarse (por ejemplo, el polígono de la jornada), va debajo de los puntos y no atiende toques. Los controles completos van en el mapa de supervisión.

**Por qué.** PL D206–D265: la capa de referencia pasó de cinco niveles encendidos a solo el polígono de la jornada, y después volvió el control de opacidad.

**Origen.** PL D206; PL D265 · *aprendizaje de proyecto*

**Verificación.** revisión del mapa de captura

### GEO-35 · Simbología mínima

**BASE** · aplica a: todos

**Regla.** Solo lo que se ve a ese zoom: de lejos la rampa, de cerca los tipos de punto. Si hay un solo nivel pintado no hay simbología (los chips de categoría pueden ser la leyenda). En el celular se pliega. Si tocar la leyenda filtra el mapa, la leyenda lo dice.

**Por qué.** GA v29b: la Secretaría la llamó «exceso» dos veces; pasó de 680 × 280 a 261 × 121 px.

**Origen.** GA v29b; CP; PL; PR · *aprendizaje de proyecto*

**Verificación.** prueba de plantilla: tamaño máximo de la simbología; plegada en el celular

### GEO-36 · Escala y norte abajo a la derecha; en el celular se quitan

**RECOMENDADO** · aplica a: todos

**Regla.** Escala con distancias redondas (10 m … 20 km) y, junto a ella, la flecha de norte, abajo a la derecha y sin capturar toques. La flecha apunta siempre arriba, porque el mapa no gira (GEO-29); va sobre un fondo blanco, lleva la letra N y su nombre accesible es «Norte». En el celular se quitan las dos.

**Por qué.** GA v25d puso escala gráfica y flecha de norte en el mapa. GA v28j quitó el norte del celular (el mapa nunca gira) y GA y PR quitaron la escala del celular. La fase 1 había dejado el norte fuera; al revisar la muestra de la guía visual, la Secretaría señaló que faltaba (14 oct 2026).

**Origen.** GA v25d; GA v28j; PR · *aprendizaje de proyecto*

**Verificación.** prueba de plantilla: escala con valores redondos y norte con nombre accesible a 1440 px; ninguno de los dos a 390 px; contraste.mjs (MC09)

### GEO-37 · Atribución obligatoria y legible

**BASE** · aplica a: todos

**Regla.** El crédito de cada fondo y capa se ve siempre, sobre fondo claro y con contraste medido. En el celular es un renglón recortado que se abre al tocarlo. Con la ficha abierta se recorre, pero nunca se oculta del todo, y nunca tapa un botón.

**Por qué.** PL: el azul de los enlaces de Leaflet daba 2.55:1. PR: el crédito de Esri tapaba la × de la ficha. GA lo oculta con la ficha abierta y en el celular: es lo que esta regla corrige al migrar.

**Origen.** PL; PR; GA; CP; AP · *aprendizaje de proyecto*

**Verificación.** contraste.mjs (pares de atribución); prueba de plantilla: visible con la ficha abierta y en el celular

### GEO-38 · Tarjeta del lugar arriba a la izquierda

**RECOMENDADO** · aplica a: visor de consulta

**Regla.** Lo que se está viendo (alcaldía, filtro, conteo) va en una tarjeta arriba a la izquierda, con un ancho máximo que no se mete bajo la columna de botones. Los avisos del mapa salen debajo de ella.

**Por qué.** GA (.mapsum) y PR (.mapbar) llegaron a lo mismo: la persona necesita saber qué está mirando sin abrir el panel.

**Origen.** GA .mapsum; PR .mapbar · *aprendizaje de proyecto*

**Verificación.** prueba de plantilla: la tarjeta no se encima con los botones a ningún ancho

### GEO-39 · Globos que no tapan ni pierden su contenido

**BASE** · aplica a: Leaflet

**Regla.** Con un globo abierto se ocultan los botones flotantes que tapan su ×. El globo recibe un elemento del DOM, no una cadena de HTML.

**Por qué.** CP: los botones flotantes tapaban la × del globo. AP: con una cadena, popup.update() volvía a crear el contenido y borraba la foto.

**Origen.** CP; AP · *aprendizaje de proyecto*

**Verificación.** prueba de plantilla: la × del globo responde a elementFromPoint

## 4. Panel, filtros, buscador y listas

### GEO-40 · Un solo filtro para todo

**BASE** · aplica a: filtros

**Regla.** Una sola función decide qué entra (enAmbito()) y la usan el mapa, las cifras, las listas, las descargas y las fichas. Cada umbral («prioritario» y similares) vive en un solo lugar y la cadena de datos en Python usa el mismo. Cada desplegable calcula sus opciones vivas con todos los filtros menos el suyo.

**Por qué.** PR: el panel decía 88 frentes prioritarios y el Excel traía 0 renglones. CP usa una regla por filtro y filasSalvo(id) para las opciones de cada desplegable.

**Origen.** PR enAmbito(); CP filasSalvo() · *aprendizaje de proyecto*

**Verificación.** prueba: con cada filtro, la cifra del panel, los renglones del Excel y los elementos del mapa coinciden

### GEO-41 · Pocos filtros, y solo los que sirven

**RECOMENDADO** · aplica a: filtros

**Regla.** Un filtro con un solo valor posible se oculta, igual que una columna que no cambia; se calcula sobre el subconjunto y no sobre lo ya filtrado, para que no parpadee. Tope: 8 filtros por vista y 4 a la vista. «Quitar filtros» aparece solo si hay algo filtrado.

**Por qué.** CP oculta filtros y columnas que no distinguen nada. PL hace fallar su auditoría si se pasa del tope.

**Origen.** CP; PL · *aprendizaje de proyecto*

**Verificación.** auditoría: número de filtros por vista

### GEO-42 · El filtro se declara donde aparece la cifra

**BASE** · aplica a: filtros

**Regla.** La cifra, el resumen del mapa, las descargas, el nombre del archivo, la ficha y la dirección dicen qué filtro está puesto. El visor arranca en la opción que no cambia la cifra oficial.

**Por qué.** Una cifra sin su filtro se puede citar como si fuera el total, y una descarga sin el filtro en su nombre no se distingue de la completa (PR).

**Origen.** PR · *aprendizaje de proyecto*

**Verificación.** prueba: con un filtro puesto, el nombre y el contenido de la descarga lo mencionan

### GEO-43 · El estado vive en la dirección

**BASE** · aplica a: todos

**Regla.** Lo elegido y lo buscado van en la dirección (#… o ?…) con pushState, y popstate lo restaura. Los filtros usan replaceState para no llenar el historial. Una liga con un valor inválido no tumba la página: se valida contra el catálogo y se ignora lo que no existe.

**Por qué.** CP: todo usaba replaceState y «atrás» sacaba del sitio; cerrar una ficha borraba la búsqueda.

**Origen.** GA; PR; CP · *aprendizaje de proyecto*

**Verificación.** prueba: abrir una liga con estado; «atrás» cierra la ficha; una liga con valor inválido abre sin error

### GEO-44 · Un solo buscador, tolerante y accesible

**BASE** · aplica a: buscador

**Regla.** Un buscador por visor, como combobox ARIA. Ignora acentos, mayúsculas, artículos y preposiciones; acepta las palabras en cualquier orden, abreviaturas y una letra de error en palabras largas. Agrupa por tipo, dice por qué coincidió y distingue homónimos («parte 2 de 3»). Lo más cercano va primero. Enter elige la primera opción y Escape cierra. Al rehacer la lista se borra aria-activedescendant; con cada letra se rehace solo la lista, nunca el campo.

**Por qué.** GA v30: aria-activedescendant apuntaba a opciones que ya no existían. GA v30d: con Gboard, rehacer el campo con cada letra convertía «Hora» en «HHoHorHora…».

**Origen.** GA v30; GA v30d; PR; CP · *aprendizaje de proyecto*

**Verificación.** prueba de plantilla: búsquedas con acentos, orden cambiado y un error; axe sobre la lista abierta

### GEO-45 · Coordenadas y ligas de mapas en el buscador

**RECOMENDADO** · aplica a: buscador

**Regla.** El buscador acepta coordenadas decimales, grados-minutos-segundos, geo: y ligas largas de Google Maps; en esas ligas el punto marcado (!3d…!4d…) gana a @. Una liga corta no trae coordenadas: se explica cómo copiarlas. FRM-30 valida el formato de las coordenadas; las ligas las lee el módulo enlace-mapa de formularios. Pegar «19.42, -99.14» llena los dos campos y detecta el orden invertido.

**Por qué.** La @ de una liga es el centro de la pantalla de quien la compartió, no el lugar marcado. PL: el teclado numérico del iPhone no trae el signo menos, así que pegar es la vía práctica.

**Origen.** PR; CP; PL; FRM-30 · *aprendizaje de proyecto*

**Verificación.** prueba con una lista fija de ligas y coordenadas, incluidas invertidas

### GEO-46 · La lista es la otra vía al mapa

**BASE** · aplica a: todos

**Regla.** Todo lo que se elige en el mapa se puede elegir en una lista (complementa FRM-46): sirve con teclado, con lector de pantalla y en equipos sin WebGL. La lista usa distancias humanas («A 25 m de Ripoll»), no «elemento 3 de 9». En el celular no tiene desplazamiento propio y se pinta por tandas («Ver 10 más»).

**Por qué.** AP: en el celular, las listas con desplazamiento propio atrapaban el dedo.

**Origen.** GA; AP; PR; FRM-46 · *aprendizaje de proyecto*

**Verificación.** prueba sin WebGL: todo elemento se alcanza desde la lista con teclado

### GEO-47 · Descargas con los mismos registros y sus columnas declaradas

**OPCIONAL** · aplica a: descargas

**Regla.** Excel con una hoja de datos (números como número) y otra de diccionario; CSV con BOM y CRLF, neutralizando las celdas que empiezan con = + - @ salvo los números negativos; KML y GeoJSON con los mismos registros. Fecha y filtro en el nombre del archivo. Si no hay nada que descargar, el botón se deshabilita y dice por qué. Los datos abiertos salen de una lista explícita de columnas, nunca de un volcado.

**Por qué.** AP: neutralizar todo lo que empezaba con - convirtió las longitudes en texto. AP: un volcado del JSON publicó el nombre de una persona que había nominado un árbol.

**Origen.** PR; AP; CP · *aprendizaje de proyecto*

**Verificación.** prueba: se abre el Excel (openpyxl) y el CSV y se comparan con lo que muestra el visor

### GEO-48 · Las cifras de un texto salen de los datos

**BASE** · aplica a: todos

**Regla.** Ningún texto escribe a mano una cifra que se puede calcular, ni números con letra que envejecen («los trece»).

**Por qué.** PR: la ayuda atribuía 372,534 frentes cuando eran 353,123. AP vigila con una prueba que «los trece» siga siendo cierto.

**Origen.** PR; AP; CP · *aprendizaje de proyecto*

**Verificación.** armado: las cifras de textos.js son marcas que llena el código

## 5. Ficha del elemento

### GEO-49 · Ficha: tarjeta en computadora, fija abajo en el celular

**BASE** · aplica a: ficha

**Regla.** Computadora: tarjeta abajo a la derecha de 300 a 350 px con desplazamiento interno (overscroll-behavior: contain), o cajón lateral de min(580px, 94vw) si el contenido es largo. Celular: fija abajo en dos alturas (compacta y amplia) con una manija que se toca o se desliza, u hoja de tres posiciones (GEO-20). En el celular es opaca y sin desenfoque.

**Por qué.** GA v28j: con 97 % de opacidad y desenfoque se leía el texto de detrás, y el desenfoque le pesa al teléfono.

**Origen.** GA; CP; GA v28j · *aprendizaje de proyecto*

**Verificación.** prueba de plantilla: medidas de la ficha en 1440 y 390 px; sin backdrop-filter en el celular

### GEO-50 · La cabecera de la ficha no se desplaza

**BASE** · aplica a: ficha

**Regla.** Título y × van en una cabecera fija, fuera del cuerpo que se desplaza. Si el cuerpo baja más de 40 px puede aparecer una franja con el nombre.

**Por qué.** CP: un título sticky dentro del cuerpo se separaba de la × con el rebote de iOS.

**Origen.** CP #drHead; GA · *aprendizaje de proyecto*

**Verificación.** prueba: la × sigue en su lugar después de desplazar el cuerpo

### GEO-51 · La ficha es un diálogo

**BASE** · aplica a: ficha

**Regla.** role=dialog con nombre. Al abrir, el foco va al título; Escape cierra; al cerrar, el foco regresa a quien la abrió, o a su fila si la lista se repintó. Cerrada lleva inert.

**Por qué.** Sin regresar el foco, quien usa teclado o lector de pantalla vuelve al principio de la página después de cada ficha (GA, CP, PR).

**Origen.** GA; CP; PR · *aprendizaje de proyecto*

**Verificación.** prueba de teclado: abrir, Escape y foco de regreso

### GEO-52 · Acciones para ir al sitio

**OPCIONAL** · aplica a: ficha

**Regla.** «Cómo llegar» (maps/dir/?api=1&destination=), «Street View» (map_action=pano&viewpoint=) y «Copiar coordenadas» con respaldo si falla el portapapeles. Street View incrustado solo cuando la persona lo pide, con aviso.

**Por qué.** Quien consulta un elemento suele querer ir a verlo (PR). El portapapeles puede fallar por permisos o por no estar en HTTPS: sin respaldo, el botón no hace nada. Street View incrustado carga a un tercero; por eso solo a petición (GA).

**Origen.** PR; GA · *aprendizaje de proyecto*

**Verificación.** prueba: con el portapapeles negado aparece el respaldo

### GEO-53 · Cada elemento con liga estable

**RECOMENDADO** · aplica a: ficha

**Regla.** Cada elemento tiene una liga que no cambia, hecha con un identificador inmutable, nunca con el nombre. Si debe encontrarse en buscadores, tiene página propia generada en el armado, con título, descripción y vista previa (OG).

**Por qué.** AP: los buscadores descartan el fragmento # y 12 de 13 árboles no se encontraban por su nombre. AP: la liga salía del nombre y al renombrar un árbol cambió.

**Origen.** AP · *aprendizaje de proyecto*

**Verificación.** armado: una página por elemento con su identificador

### GEO-54 · Lo que falta se dice

**BASE** · aplica a: todos

**Regla.** Un dato ausente se dibuja apagado y con su motivo: «no hay dato», «no publicado», «sin validar» y «en revisión» son cosas distintas y se escriben distinto. Una suma dice sobre cuántos se calculó. Un estado vacío nunca dice «0 de 0»: explica, con ícono, texto y una salida.

**Por qué.** Un hueco sin explicación se lee como falla del sitio o como dato negativo (AP: un árbol con su declaratoria en trámite no es un árbol sin dato). PR quitó el «0 de 0»; PL agregó la salida a cada estado vacío.

**Origen.** AP; PR; PL · *aprendizaje de proyecto*

**Verificación.** prueba con datos fijos que incluyen cada tipo de ausencia

## 6. Componentes

### GEO-55 · Un solo botón principal, en guinda

**BASE** · aplica a: todos

**Regla.** Cada vista tiene un solo botón principal, en guinda (complementa FRM-34); en la confirmación de algo destructivo, el único botón relleno es el rojo de peligro, como en formularios. Cuando la ficha y el panel se ven a la vez, el del panel pasa a secundario. Lo que se toca y lo elegido van en azul.

**Por qué.** GA usa body.con-ficha para bajar de peso el botón del panel: con la ficha abierta había dos botones guinda a la vista. PL D124 y D166 cambiaron la acción a azul porque su guinda y su rojo de error medían 1.1:1 entre sí; el estándar conserva el guinda y resuelve ese choque con el ámbar en el mapa (GEO-66).

**Origen.** D2; GA; PR; CP; EF; PL D124; PL D166; FRM-34 · *decisión del estándar*

**Verificación.** prueba de plantilla: a lo más un .btn-primario visible por vista

### GEO-56 · Botones con verbo y objeto; íconos con su palabra

**RECOMENDADO** · aplica a: todos

**Regla.** Cinco intenciones (avanzar, comprometer, quitar, corregir y apoyo) y tres pesos: principal relleno (uno por vista), alterna con contorno y apoyo como texto subrayado. Cada botón dice verbo y objeto («Descargar Excel»). Fuera de la columna de controles del mapa, todo ícono va con su palabra; en la columna, cada botón lleva nombre accesible y globo al pasar el puntero.

**Por qué.** PL llegó a tener 17 formas de botón y las redujo a estas cinco intenciones y tres pesos.

**Origen.** PL · *aprendizaje de proyecto*

**Verificación.** revisión de textos; axe: todo botón con nombre

### GEO-57 · 44 px para el dedo aunque se vea más chico

**BASE** · aplica a: todos

**Regla.** Lo que se toca responde en 44 × 44 px con el dedo (complementa FRM-62). Si se ve más chico, un ::after con inset negativo amplía el área. Para ganarle a las hojas de Leaflet puede hacer falta más especificidad, nunca !important.

**Por qué.** AP necesitó especificidad (0,4,1) para que el área ampliada le ganara a la hoja de Leaflet.

**Origen.** GA; PL; CP; AP; FRM-62 · *aprendizaje de proyecto*

**Verificación.** prueba: elementFromPoint a 5 px fuera del borde visible cae en el mismo control

### GEO-58 · Foco azul de dos tonos, visible sobre cualquier fondo

**BASE** · aplica a: todos

**Regla.** El anillo de foco de formularios (--foco, 3 px, separado 2 px) se acompaña de un halo blanco que llena la separación: box-shadow: 0 0 0 var(--foco-sep) var(--blanco). Así se ve sobre el mapa, la satelital y las clases oscuras de una rampa: el azul sobre lo claro y el blanco sobre lo oscuro. Para el alto contraste de Windows se conserva el outline. Las transiciones nombran sus propiedades: nunca transition: all. Sin !important (FRM-68): la regla de foco va al final de la hoja.

**Por qué.** Cada proyecto tenía otro foco: azul (EF, PL), verde hoja (GA), guinda oscuro #5A1029 con halo blanco (PR) y dorado oscuro (AP). Un anillo de un solo tono se pierde sobre algún fondo del mapa. AP: con transition: all el anillo se desvanecía en 200 ms; CP todavía tiene transition: all en sus chips del mapa.

**Origen.** D3; PR; GA; AP; EF; FRM-68 · *decisión del estándar*

**Verificación.** contraste.mjs: en cada fondo, el azul o el blanco del anillo llega a 3:1; auditor: sin transition: all

### GEO-59 · Un solo canal de avisos

**BASE** · aplica a: todos

**Regla.** Todos los avisos pasan por aviso(texto, tipo), y el tipo se pasa siempre: nunca se deduce del texto. Duran según su largo: de 4.5 a 8 s, más 1 s por cada 40 caracteres. El de espera no se cierra hasta que termina; se pausan con el puntero encima; uno con «Deshacer» no lo reemplaza otro. Nunca alert(). Los mensajes largos (permiso de ubicación negado) van como nota fija con los pasos y «Reintentar».

**Por qué.** Deducir el tipo del texto falla en cuanto cambia la redacción (GA). PL ajustó las duraciones en D101, D136 y D236 hasta dar con éxito 4.5 s, aviso 6, alerta 7 y con «Deshacer» 8.

**Origen.** GA; PL D101; PL D136; PL D236; CP · *aprendizaje de proyecto*

**Verificación.** auditor: sin alert(); prueba: duración según el largo

### GEO-60 · Ventanas que no pierden el foco

**BASE** · aplica a: todos

**Regla.** Se usa <dialog> nativo. Al abrir, el foco va al título, no a la ×. Tab no se escapa de la ventana; Escape cierra; «atrás» cierra la ventana y solo la ventana; al cerrar, el foco regresa. En el celular ocupan la pantalla con --vvh de alto y la × queda fija arriba.

**Por qué.** PL: con el foco en la ×, un Enter de más cerraba la ventana. GA, PR y CP llegaron a la misma secuencia de foco.

**Origen.** PL; GA; PR; CP · *aprendizaje de proyecto*

**Verificación.** prueba de teclado: foco al abrir, Tab, Escape, «atrás» y foco de regreso

### GEO-61 · El toque no se pierde ni se duplica

**BASE** · aplica a: todos

**Regla.** Entre pointerdown y pointerup no se reemplaza el elemento tocado: se actualiza su contenido. Un botón que guarda o envía se marca ocupado de forma síncrona, antes del primer await (complementa FRM-45).

**Por qué.** PL D262: la sección se repintaba a medio toque y el toque se perdía. PL B77, B149 y B151: un doble toque guardó dos árboles, dos jornadas o folios repetidos.

**Origen.** PL D262; PL B77; PL B149; PL B151; FRM-45 · *aprendizaje de proyecto*

**Verificación.** prueba: dos requestSubmit() seguidos dejan un solo registro

### GEO-62 · [hidden] gana siempre

**BASE** · aplica a: todos

**Regla.** Todo componente que declara su propio display lleva también [hidden]{display: none}.

**Por qué.** El atributo hidden pierde ante un display escrito por el autor: le pasó dos veces a GA, a PL y a CP, y el elemento «oculto» seguía a la vista.

**Origen.** GA; PL; CP · *aprendizaje de proyecto*

**Verificación.** auditor de CSS: cada clase con display tiene su regla [hidden]

### GEO-63 · Después de guardar, el formulario vuelve en blanco

**BASE** · aplica a: campo

**Regla.** Después de guardar un registro, el formulario vuelve completo y en blanco, coordenada incluida. El foco no avanza solo de un campo al siguiente.

**Por qué.** PL B12: el formulario heredaba la coordenada del árbol anterior, que «se ve bien estando mal». PL B31: el avance automático del foco se probó y se retiró.

**Origen.** PL B12; PL B31 · *aprendizaje de proyecto*

**Verificación.** prueba: después de guardar, ningún campo conserva valor

### GEO-64 · Confirmar sólo lo que no se deshace o afecta a otra persona

**BASE** · aplica a: todos

**Regla.** Se pide confirmación, dentro de la página, para lo que no se puede deshacer o afecta a otra persona, con sus consecuencias y un botón que repite el verbo (FRM-38); borrar algo que no se recupera pide además escribir la palabra. Lo demás se hace de inmediato y el aviso ofrece «Deshacer».

**Por qué.** Una confirmación en cada acción se acepta sin leer; cuando llega la que importa, ya nadie la lee (PL).

**Origen.** PL; FRM-38 · *aprendizaje de proyecto*

**Verificación.** revisión de flujos

## 7. Color y tokens

### GEO-65 · Todo valor visual es un token, también para el mapa

**BASE** · aplica a: todos

**Regla.** Colores, tamaños, radios, sombras, capas y duraciones viven solo como tokens en :root: los de formularios en tokens.css y los propios del mapa en tokens-mapa.css (complementa FRM-67). Un token del mapa que puede reusar un valor de formularios lo nombra con var(), no copia el hexadecimal. El JS los lee de la hoja: css('--token') para CSS, hex('--token') para deck.gl y colorLiteral('--token') para Canvas. Las transparencias se escriben con un token de canales (--x-rgb). Tema claro único.

**Por qué.** CP: Canvas ignora var() en silencio y todo salió crema sobre crema. AP tenía 92 rgba escritos a mano que ya no seguían la paleta. GA declaró cuatro tokens de mapa que ninguna capa usa y pintó las calles con un blanco escrito a mano.

**Origen.** EF; AP; CP; GA; PR; FRM-67 · *aprendizaje de proyecto*

**Verificación.** auditor de CSS: sin colores ni medidas literales fuera de los tokens; contraste.mjs resuelve cada var()

### GEO-66 · Un color, un trabajo, también en el mapa

**BASE** · aplica a: todos

**Regla.** Guinda: identidad, la única acción principal y el lugar buscado. Azul: lo que se toca y lo elegido. Dorado: solo líneas (el resalte al pasar el puntero). El color de los datos (rampas, categorías) nunca es texto ni acción. Si el guinda ya significa algo en los datos del visor, el error del mapa usa la familia ámbar de formularios. El estado no se codifica por matiz cuando ese matiz ya es una categoría: se usa la forma (punto lleno, hueco o medio).

**Por qué.** PL D124: guinda y rojo de error miden 1.1:1 entre sí. GA: el error del mapa va en ámbar porque el guinda ya marca los árboles «ya cuidados». CP: el verde ya es una categoría y el rojo se lee como alarma.

**Origen.** D2; EF; GA; PL D124; CP · *decisión del estándar*

**Verificación.** revisión de la paleta del visor contra docs/02

### GEO-67 · Un color por variable, y nunca solo

**BASE** · aplica a: todos

**Regla.** Un mapa colorea una sola variable; la cantidad va en la etiqueta y en la tabla, no en otro color. El color nunca va solo: los puntos son círculos y un estado distinto lleva otra marca (un anillo de más, otra forma). Sobre la satelital se usan neutros con tinte frío, que no compiten con la vegetación.

**Por qué.** PL D219 dejó la cantidad fuera del color. PL D166 marcó el estado «lejos» con un anillo de más, para que no dependiera del rojo.

**Origen.** PL D219; PL D166 · *aprendizaje de proyecto*

**Verificación.** prueba en escala de grises: cada estado se distingue

### GEO-68 · Rampas con cortes fijos y probadas para daltonismo

**BASE** · aplica a: todos

**Regla.** Cada rampa de datos tiene cortes fijos con nombre, un color propio para «sin dato» y, por clase, el color de texto que se le pone encima. Se prueba con la simulación de Machado (2009) a severidad completa para protanopia, deuteranopia y tritanopia, con ΔE CIE76: clases vecinas a 15 o más y extremos a 50 o más. Las rampas de tokens-mapa.css se miden con herramientas/rampas.mjs.

**Por qué.** PR: el semáforo anterior dejaba los extremos a ΔE 15 con deuteranopia y usaba colores que se asocian con partidos; la rampa nueva los lleva a 63. La auditoría de PR fijó el criterio de las vecinas pero nunca publicó sus valores: por eso el estándar trae su propio medidor. GA: con este medidor, su verdor dejaba vecinas a ΔE 9.4 y «sin dato» casi igual a la clase 1; GA v31e lo cambió por una rampa que varía sobre todo la claridad (vecinas a 17.2 o más) y un «sin dato» más oscuro, que la Secretaría aprobó como rampa de verdor del estándar (14 oct 2026).

**Origen.** PR; GA; GA v31e; CP colorTextoGrupo(); PL · *aprendizaje de proyecto*

**Verificación.** rampas.mjs: código de salida 0

### GEO-69 · Contraste medido sobre cada fondo real del mapa

**BASE** · aplica a: todos

**Regla.** Texto 4.5:1 y símbolos, líneas y foco 3:1, medidos contra el fondo donde de verdad se pintan: suelo, manzana, área verde, agua, cada clase de la rampa y el halo que los separa. Sobre la rampa, el texto cambia de oscuro a blanco en la clase que diga la medición. Gris sólido en vez de transparencia. Los puntos claros llevan aro oscuro. Dos estados con la misma oscuridad se distinguen por otra cosa.

**Por qué.** GA v28h: los nombres de calle atenuados con transparencia daban 1.9:1; en gris sólido, 5.1:1. Blanco sobre la clase 4 del verdor daba 2.7:1. GA v28i: los puntos con aro blanco daban 2.3:1 sobre la manzana; con aro verde hoja, 5.3:1. PR: los nombres de colonia pasaron de 3.9:1 a 6.4:1.

**Origen.** GA v28h; GA v28i; PR; EF; PL · *aprendizaje de proyecto*

**Verificación.** contraste.mjs: código de salida 0

### GEO-70 · Tema por visor: pocos tokens y nunca la acción ni el foco

**BASE** · aplica a: todos

**Regla.** Cada visor puede tener un tema con cuatro tokens: --tema-marca (títulos y marca), --tema-marca-cl (fondo tenue de marca), --tema-ficha y --tema-ficha-texto (superficie de la ficha y su texto). La acción principal, lo tocable, el foco y los colores de función nunca cambian. La ficha es siempre clara: --tema-ficha es un fondo claro donde el azul de lo tocable llega a 4.5:1, --tema-ficha-texto es oscuro, y el color de marca va en el título y en una franja del borde de la ficha, donde llega a 4.5:1 sobre ella. Cada tema se declara en un bloque [data-tema] y se mide con contraste.mjs antes de usarse.

**Por qué.** GA usa verde hoja, AP jacarandá y CP crema; PR y PL son neutros. Con libertad completa, PL terminó con la acción en azul y AP en jacarandá, y la misma acción se veía distinta de un visor a otro. La ficha oscura de GA (#173B2E) dejaba el azul de los enlaces a 1.73:1 (par MC27). Había dos salidas: fichas siempre claras, o lo tocable en blanco subrayado dentro de la ficha oscura; la Secretaría eligió las fichas siempre claras (D11, 14 oct 2026), para que lo tocable sea azul en todos los visores.

**Origen.** D4; D11; GA; AP; CP; PL · *decisión del estándar*

**Verificación.** auditor de CSS: un bloque [data-tema] solo declara los cuatro tokens; contraste.mjs mide cada tema; verificar.mjs exige que cada tema de temas.css mida el azul y la marca sobre su ficha (D11)

### GEO-71 · Cabin y Roboto, también en el mapa

**BASE** · aplica a: todos

**Regla.** Las letras son las de formularios (FRM-78), autoalojadas: Cabin 700 para alcaldías y Roboto 500 para colonias y calles, como en GA y PR; se sobrescriben las familias que impone Leaflet. Los nombres del mapa usan los tamaños de tokens-mapa.css. Las cifras usan font-variant-numeric: tabular-nums. Un micrositio con identidad tipográfica propia es una desviación que se anota.

**Por qué.** GA trabajó con seis tamaños y PL bajó de siete a seis. AP usa Anton, Fraunces y Source Sans 3 por la identidad del micrositio. CP nunca sobrescribió la letra de Leaflet y sus globos y créditos salen en Helvetica Neue de 12 px.

**Origen.** GA; PR; PL; CP; EF; AP; FRM-78 · *aprendizaje de proyecto*

**Verificación.** prueba: font-family calculada de .leaflet-container y de los globos

### GEO-72 · El mapa vive en su capa; lo de encima usa capas con nombre

**BASE** · aplica a: todos

**Regla.** El contenedor del mapa lleva isolation: isolate: así sus capas internas (Leaflet usa de 200 a 1000) no compiten con la página. Lo que va encima del mapa (simbología, controles, pantalla del celular, carga, ficha, avisos) usa las capas con nombre de tokens-mapa.css, que quedan por debajo de las listas y la barra de formularios. Las ventanas son <dialog> nativo y no necesitan capa.

**Por qué.** PL D78: en Safari, los paneles de Leaflet (200 a 600) tapaban el botón «Guardar» hasta que el mapa se aisló. GA y PR usan capas cortas de 5 a 20 sobre un mapa aislado.

**Origen.** PL D78; GA; PR; AP; CP; EF · *aprendizaje de proyecto*

**Verificación.** auditor de CSS: z-index solo con tokens; prueba: la ficha y los avisos quedan sobre los controles de Leaflet

## 8. Cartografía y fondo del mapa

### GEO-73 · Lo que se ve depende del zoom

**RECOMENDADO** · aplica a: todos

**Regla.** El detalle cambia con el zoom, no con lo que se elige: alcaldías → colonias → elementos → íconos, con umbrales con nombre en la configuración (Z_COL, Z_ARB…). Entre un nivel y otro, fundidos de opacidad, no cambios de golpe.

**Por qué.** GA lo tomó del mapa de árboles de Nueva York: la persona acerca para ver más, sin tener que elegir capas.

**Origen.** GA · *aprendizaje de proyecto*

**Verificación.** configuración: umbrales con nombre

### GEO-74 · Fondo propio o teselas, según el proyecto

**BASE** · aplica a: todos

**Regla.** El estándar trae dos fondos: el propio (suelo, manzanas de Catastro desde zoom 13–14, áreas verdes y agua) y las teselas de un proveedor, con crédito, licencia y llave en la configuración. La guía de decisión (docs/03) dice cuál usar: fondo propio con deck.gl o cuando no se admiten terceros; satelital en campo. No se usan las teselas de OpenStreetMap, CARTO sin llave contratada, EOX ni Esri gris. Cada opción declara en la configuración su crédito, su licencia, su llave y si llama a un servidor de terceros; la llave nunca se escribe en el código. Las opciones conocidas, con lo que falta verificar de cada una, están en docs/02, sección 3, y en la guía visual.

**Por qué.** OSM no admite uso intenso, envía la IP de cada persona y sus calles quedaban a 20–30 m de las de INEGI. CARTO empezó a exigir llave en agosto de 2026: AP vio «API KEY REQUIRED» estampado en su mapa. EOX se veía borroso y Esri gris solo llega a zoom 16. El fondo propio no llama a terceros, permite una CSP cerrada y no trae puntos de interés que compitan.

**Origen.** D7; GA v28h; PR; AP; CP; PL · *decisión del estándar*

**Verificación.** configuración: proveedor, licencia y crédito declarados; prueba: sin terceros con fondo propio

### GEO-75 · Si el fondo cae, el mapa sigue sirviendo

**BASE** · aplica a: teselas

**Regla.** A la tercera tesela fallida aparece un aviso que dice qué sí se puede hacer (tocar el mapa, capturar coordenadas), y se retira cuando una tesela vuelve a cargar. Sin teselas, el mapa sigue permitiendo colocar y mover el punto. El marcador es un SVG propio incrustado (FRM-50).

**Por qué.** Sin teselas el mapa es un rectángulo gris que parece descompuesto, aunque las capas propias y el punto sigan funcionando (PL, EF). El ícono de marcador de Leaflet se descarga de fuera y choca con la CSP.

**Origen.** PL; EF; FRM-50 · *aprendizaje de proyecto*

**Verificación.** prueba con las teselas bloqueadas: aviso visible y punto colocable

### GEO-76 · No colorear por lo que solo mide el avance del levantamiento

**BASE** · aplica a: todos

**Regla.** Un área no se colorea por un conteo que depende de cuánto se ha levantado ahí: se colorea por un indicador (proporción, densidad) y el conteo se informa como dato. Sin rankings de alcaldías.

**Por qué.** GA v5: el mapa presentaba como «la alcaldía con más árboles» a la que simplemente se había censado más.

**Origen.** GA v5 · *aprendizaje de proyecto*

**Verificación.** revisión de la variable de la rampa

### GEO-77 · Límites legibles sobre cualquier fondo

**BASE** · aplica a: todos

**Regla.** Los límites se dibujan como una franja blanca ancha con la línea oscura encima. Fuera de la ciudad, una máscara. Lo elegido se marca solo con contorno, sin relleno, y sobre la misma franja blanca.

**Por qué.** GA v12: el relleno del elegido dibujaba una cuña falsa. AP cubre lo que está fuera de la ciudad con una máscara crema al 0.88. Sin franja, el azul de lo elegido se pierde sobre las clases 3 a 5 de la rampa de prioridad (2.76, 1.39 y 1.41:1); con franja da 7.14:1 sobre cualquier fondo. PR lo resolvía con un contorno pizarra (#273A45); el estándar conserva el azul de D2 y le pone franja.

**Origen.** GA; GA v12; AP; PR; D2 · *aprendizaje de proyecto*

**Verificación.** contraste.mjs: línea y contorno de lo elegido contra su franja

### GEO-78 · Etiquetas con colocador propio

**RECOMENDADO** · aplica a: deck.gl

**Regla.** Las etiquetas no se encargan al filtro de colisión de deck.gl. Un colocador propio mide cajas en píxeles del mundo, con el zoom redondeado de 0.2 en 0.2 para que no brinquen, y una sola fila de prioridad; los paneles del mapa cuentan como obstáculos. Las calles se nombran sobre su tramo recto, repetidas cada 240 px sobre una cuadrícula fija de 260 px, solo si caben. El nombre de un área va en su polo de inaccesibilidad, precalculado. El juego de letras es fijo e incluye mayúsculas acentuadas y la Ñ. El contorno de letra es outlineWidth dividido entre el radius del SDF.

**Por qué.** PR: el filtro de colisión revisa solo el ancla y dejaba 530 pares encimados; con el colocador propio, 0 encimados y 93 % estables. Con el promedio de vértices, 163 colonias tenían su nombre fuera. Sin la Ñ en el juego de letras salía «NUEVA ESPA A».

**Origen.** PR; GA · *aprendizaje de proyecto*

**Verificación.** prueba de etiquetas: 0 encimadas, dentro de su figura, estables al acercar

### GEO-79 · Halo blanco sobre la satelital

**BASE** · aplica a: teselas

**Regla.** Sobre la satelital, toda superposición (líneas, puntos, etiquetas) lleva un halo blanco, aplicado con un solo filtro drop-shadow en el panel del mapa.

**Por qué.** La satelital tiene a la vez zonas muy claras y muy oscuras: ningún color de línea llega a 3:1 en toda la imagen sin un halo. CP lo resolvió con un solo filtro que se enciende al elegir la satelital.

**Origen.** CP · *aprendizaje de proyecto*

**Verificación.** prueba: el filtro se aplica al elegir la satelital y se quita al salir

## 9. Datos geográficos

### GEO-80 · Proyección y precisión

**BASE** · aplica a: todos

**Regla.** Se publica en EPSG:4326. Se reproyecta al convertir, nunca al pintar; la proyección se lee del .prj y la cadena se detiene si no es la esperada. Superficies y distancias se calculan en EPSG:6372. Se muestran 5 decimales (≈ 1 m) y se guardan 6 (≈ 11 cm). Leaflet usa [lat, lng] y GeoJSON [lng, lat].

**Por qué.** Una proyección supuesta no avisa: solo pone todo en otro lugar. PR se detiene si el .prj no es el esperado.

**Origen.** PR; PL; CP · *aprendizaje de proyecto*

**Verificación.** cadena de datos: comprueba el .prj y que las coordenadas caigan en la ciudad

### GEO-81 · Formato binario determinista para datos grandes

**RECOMENDADO** · aplica a: deck.gl

**Regla.** Los datos grandes viajan en un formato propio: enteros varint zigzag, coordenadas en deltas y gzip con mtime=0, para que los mismos datos den siempre el mismo archivo y la misma huella.

**Por qué.** Si el archivo cambia sin que cambien los datos, la caché por huella (GEO-11) obliga a bajarlo otra vez (GA, PR).

**Origen.** GA; PR · *aprendizaje de proyecto*

**Verificación.** cadena de datos: dos corridas con los mismos datos dan la misma huella

### GEO-82 · Validar en la cadena, no en la pantalla

**BASE** · aplica a: todos

**Regla.** La cadena de datos comprueba antes de publicar: número de polígonos, claves únicas, anillos cerrados, coordenadas dentro de la ciudad (delata un sistema de referencia equivocado) y geometrías válidas (shapely.set_precision y make_valid después de redondear). Guarda la huella del contenido descomprimido y fija las versiones de Python.

**Por qué.** PL: el redondeo dejó 9 colonias inválidas y el cruce fallaba sin avisar. CP: 12 geometrías inválidas daban la zona equivocada. PR: una versión nueva de Shapely cambió los desempates y 144 frentes quedaron enlazados al tramo contiguo.

**Origen.** PL generar_capas.py; PR SUMAS.json; CP · *aprendizaje de proyecto*

**Verificación.** cadena de datos: termina con código distinto de 0 ante cualquier falla

### GEO-83 · Se une por clave, nunca por nombre

**BASE** · aplica a: todos

**Regla.** Toda unión de tablas o capas usa una clave estable (CVEGEO, CVEFT, folio). Las llaves de texto pasan por una sola función de normalización aplicada al dato crudo, antes de escapar. En la hoja de cálculo, la llave es un valor pegado, no una fórmula. Los nombres oficiales se toman de una lista revisada, con acentos, conservando el original; lo que el catálogo trae mal se reporta, no se corrige en silencio. Un catálogo con piezas partidas se une en los datos, con alias para que las ligas viejas sigan.

**Por qué.** PR: el frente se identificaba por su número de orden, que cambia al regenerar; la clave real es CVEGEO+CVEFT. CP: una «'» escapada antes de comparar se volvió &#39; y la unión falló. AP: la llave era fórmula; corregir la alcaldía renombró el árbol y dejó huérfanas sus fotos.

**Origen.** PR; CP nombreClave(); AP; GA · *aprendizaje de proyecto*

**Verificación.** cadena de datos: claves únicas y sin huérfanos

### GEO-84 · Uniones espaciales con umbral explícito y reportado

**BASE** · aplica a: todos

**Regla.** Toda unión por cercanía declara su umbral y reporta cuántos entraron. Los que no entran se reportan al proveedor; no se excluyen sin una decisión.

**Por qué.** PR une punto → frente hasta 20 m y entra el 91.1 %. GA asigna un punto que cae fuera de todo polígono al más cercano, hasta 30 m.

**Origen.** PR; GA · *aprendizaje de proyecto*

**Verificación.** cadena de datos: reporte de la unión

### GEO-85 · Traslapes, precedencia y tres estados

**BASE** · aplica a: todos

**Regla.** Cuando dos capas se enciman, la precedencia se declara; entre colonias encimadas gana la más pequeña; la alcaldía sale de su propia capa, no del atributo de la colonia. Las tolerancias se sustentan con un análisis escrito. Todo cruce tiene tres resultados: Dentro, Fuera y Sin dato.

**Por qué.** PL: 12 colonias tienen su interior en otra alcaldía. CP: los cargadores tragaban el error y la imagen decía «Fuera» con la capa caída. CP sustentó con un análisis su tolerancia de 5 % para Suelo de Conservación.

**Origen.** CP _COV_ORDEN; PL · *aprendizaje de proyecto*

**Verificación.** prueba con la capa caída: el resultado es «Sin dato»

### GEO-86 · El cruce del navegador es provisional; el del servidor manda

**BASE** · aplica a: servidor

**Regla.** El navegador cruza para responder al momento; el servidor repite el cruce y su resultado es el que se guarda. El visor global y la cifra pública son del SIA vía GeoServer. Antes de pasar a las capas del SIA se comparan con una huella (polígonos, superficie y centroide). Si un dato cabe en una capa que ya existe en el SIA, no se crea otra.

**Por qué.** PL huella_capas.py: el SIA tenía 1,817 unidades territoriales contra 1,837 colonias. PL D286: el SIA no quiere una tercera capa si el dato cabe en una que ya existe.

**Origen.** PL D16; PL D38; PL D286; PL huella_capas.py · *aprendizaje de proyecto*

**Verificación.** huella de capas antes de cada cambio

### GEO-87 · Umbrales por encima del error del GPS

**BASE** · aplica a: campo

**Regla.** Ningún umbral de distancia es menor que el error del GPS. En el servidor, un duplicado se mide con la suma de las dos precisiones, con piso de 5 m. «Lejos del resto» se mide contra el vecino más cercano, no contra la mediana.

**Por qué.** PL D69: avisar de duplicado a menos de 5 m saltaría con el árbol vecino; el GPS da 5–10 m a cielo abierto y 15–30 m entre edificios. PL D197: con dos grupos de puntos, la mediana marcaba como lejano a todo el grupo chico.

**Origen.** PL D69; PL D197 · *aprendizaje de proyecto*

**Verificación.** prueba con puntos a 3, 8 y 40 m

### GEO-88 · Se deriva sobre el punto tal como se guarda

**BASE** · aplica a: campo, servidor

**Regla.** Alcaldía, colonia y zona se derivan del punto ya redondeado a 6 decimales, con las capas en orden de clave para que la app y PostGIS desempaten igual sobre un borde compartido. Cada registro guarda con qué versión de capa se derivó.

**Por qué.** PL B183: se derivaba sobre el punto sin redondear y se guardaba el redondeado; PostGIS y la app diferían en 182 árboles.

**Origen.** PL B183 · *aprendizaje de proyecto*

**Verificación.** prueba: app y PostGIS dan lo mismo con puntos sobre bordes

### GEO-89 · El ámbito es la ciudad más un margen, no una caja

**BASE** · aplica a: todos

**Regla.** El ámbito válido es la unión de las alcaldías con un margen, no un rectángulo. Fuera del ámbito no se atribuye entidad ni alcaldía.

**Por qué.** PL: la caja aceptaba puntos en municipios vecinos. CP: un punto en Madrid salía como «Estado de México».

**Origen.** PL; CP · *aprendizaje de proyecto*

**Verificación.** prueba con puntos en Madrid, en el Estado de México y en el borde

### GEO-90 · Simplificar para dibujar, no para medir

**RECOMENDADO** · aplica a: todos

**Regla.** Las geometrías se simplifican solo para dibujarlas (manzanas 0.7 m; verde y agua 1 m); las medidas usan la geometría completa. Las alcaldías se simplifican juntas (coverage_simplify) para que no queden huecos ni encimes.

**Por qué.** CP pasó de 17,220 a 2,050 vértices sin huecos ni encimes entre alcaldías.

**Origen.** PR; CP · *aprendizaje de proyecto*

**Verificación.** cadena de datos: superficies calculadas sobre la geometría completa

### GEO-91 · La fecha de corte se ve

**BASE** · aplica a: todos

**Regla.** La fecha de corte de los datos aparece en pantalla, en fichas y en descargas. Si los datos se consultan en vivo, se distingue «última consulta» de la fecha de corte que fija el área responsable.

**Por qué.** CP distingue las dos porque la gente cita la cifra en oficios.

**Origen.** PR; CP · *aprendizaje de proyecto*

**Verificación.** prueba de plantilla: fecha de corte en pantalla y en cada descarga

### GEO-92 · Capas para GeoServer con sus colores

**OPCIONAL** · aplica a: servidor

**Regla.** Las capas que van a GeoServer se entregan en GeoPackage, EPSG:4326, con índice espacial, y con un .sld que usa los mismos colores que el visor.

**Por qué.** Así el visor del SIA y el del proyecto muestran lo mismo con los mismos colores (PR).

**Origen.** PR · *aprendizaje de proyecto*

**Verificación.** los colores del .sld coinciden con tokens-mapa.css

### GEO-93 · Sin coordenada no entra a la capa

**BASE** · aplica a: todos

**Regla.** Un registro sin coordenada no se dibuja, nunca en 0,0. Un valor fuera de rango no se publica, pero el registro sí, con un aviso.

**Por qué.** AP: un punto en el origen es peor que una capa incompleta, porque parece un dato.

**Origen.** AP · *aprendizaje de proyecto*

**Verificación.** cadena de datos: ningún punto en 0,0 ni fuera del ámbito

## 10. Rendimiento

### GEO-94 · Lo caro es dibujar: se rehace solo lo necesario

**BASE** · aplica a: deck.gl

**Regla.** Datos en arreglos tipados reutilizados; la visibilidad con DataFilterExtension en lugar de rehacer capas; las capas se rehacen solo al cruzar un umbral de zoom con nombre o tras un salto grande; useDevicePixels máximo 1.5.

**Por qué.** PR dibuja 985 mil vértices: con WebGL por software, abrir tomaba 88 s y bajó a 15 s; un clic de zoom pasó de 35–40 s a menos de 50 ms.

**Origen.** PR ZOOM_CORTES; GA NIVELES · *aprendizaje de proyecto*

**Verificación.** prueba de rendimiento con procesador lento

### GEO-95 · deck.gl solo prepara lo que se ve

**BASE** · aplica a: deck.gl

**Regla.** Las capas que no se ven no entran a deck.gl (lista despiertas). characterSet fijo, nunca 'auto'. Máximo 3 combinaciones de letra con el mismo fontSettings SDF. Los ids de capa no terminan en -fill ni en -stroke.

**Por qué.** GA: 64 capas ocultas se preparaban igual y congelaban la página de 1.5 a 3 s. Con characterSet 'auto' el atlas de letras se rehacía en cada zoom, y con más de 3 combinaciones se redibuja sin parar.

**Origen.** GA; PR · *aprendizaje de proyecto*

**Verificación.** prueba: ninguna tarea de más de 50 ms al acercar

### GEO-96 · Modo ligero automático

**RECOMENDADO** · aplica a: deck.gl

**Regla.** Si el navegador dibuja con WebGL por software (swiftshader, llvmpipe, softpipe, «basic render»), el visor entra solo en modo ligero: sin animación, resolución 1×, menos capas, y explica cómo activar la aceleración. ?modo=ligero y ?modo=completo lo fuerzan. Sin WebGL 2, lo dice y ofrece la lista.

**Por qué.** PR: con WebGL por software el mapa tardaba 88 s en abrir. deck.gl solo funciona con WebGL 2; con WebGL 1 queda en blanco.

**Origen.** PR · *aprendizaje de proyecto*

**Verificación.** prueba con SwiftShader: el visor entra en modo ligero

### GEO-97 · Carga por partes

**BASE** · aplica a: todos

**Regla.** Los datos del arranque se anuncian con <link rel=preload as=fetch>; lo de cada alcaldía se pide cuando se ve; el fondo propio desde zoom 13–14; las bibliotecas pesadas cuando se piden; Leaflet cuando el mapa se acerca a la pantalla (IntersectionObserver). Todo código que use datos tardíos tolera que aún no estén.

**Por qué.** Una función que supone que los datos ya llegaron falla justo con la red lenta, que es donde menos se prueba (GA CALLES_LISTAS).

**Origen.** GA; PR; AP · *aprendizaje de proyecto*

**Verificación.** prueba con datos tardíos y cortados

### GEO-98 · Ciclos largos en pedazos; lo fijo se calcula al preparar los datos

**RECOMENDADO** · aplica a: todos

**Regla.** Un ciclo que puede pasar de 50 ms se parte en pedazos de 8 a 10 ms (requestIdleCallback, scheduler.yield). Lo que no depende de la vista se calcula al preparar los datos, no al abrir.

**Por qué.** GA: calcular el punto del nombre de 2,019 colonias costaba 2.7 s al abrir.

**Origen.** GA · *aprendizaje de proyecto*

**Verificación.** prueba de rendimiento: ninguna tarea de más de 50 ms al abrir

### GEO-99 · Se mide como teléfono y con techo de peso

**BASE** · aplica a: todos

**Regla.** El rendimiento se mide con el procesador de 4 a 6 veces más lento, contando las tareas de más de 50 ms, y con Lighthouse en el sitio en línea. Cada página tiene un techo de peso comprimido, probado. El servidor comprime.

**Por qué.** AP: Express no comprime por omisión y sin compression() el sitio pesaba cuatro veces más. AP fija techos de 145, 125 y 80 KB comprimidos por página.

**Origen.** GA bloqueo.py; AP · *aprendizaje de proyecto*

**Verificación.** prueba de peso y de tareas largas

### GEO-100 · Imágenes al tamaño en que se ven

**BASE** · aplica a: todos

**Regla.** Imágenes en WebP con srcset, al tamaño en que se muestran. Las fotos de campo se reducen en el navegador a 800 × 600, JPEG 0.7, lo que además quita la ubicación de la cámara.

**Por qué.** Una foto del teléfono pesa varios MB y lleva guardada la ubicación de quien la tomó (AP, PL).

**Origen.** AP; PL · *aprendizaje de proyecto*

**Verificación.** prueba: ninguna imagen se sirve más grande que su caja

### GEO-101 · En iPhone, lo que se guarda para trabajar sin red se escribe por partes

**BASE** · aplica a: campo

**Regla.** Lo que se baja al teléfono para trabajar sin red se escribe en IndexedDB por partes, con avance visible.

**Por qué.** PL: WebKit tardó 11 minutos en escribir lo que Chromium escribía en 2 s.

**Origen.** PL · *aprendizaje de proyecto*

**Verificación.** prueba en WebKit con el volumen real

## 11. Interacción y estado

### GEO-102 · Toda vista nueva pasa por una función

**BASE** · aplica a: todos

**Regla.** Todo cambio de vista pasa por irA() o volar(): cada envío lleva un número distinto, vuela en 800 ms (0 con prefers-reduced-motion) y encuadra con un margen que descuenta los controles y la ficha. Sin animación, las capas y la escala se actualizan aparte.

**Por qué.** GA v30 y PR: deck.gl ignora un initialViewState igual al anterior y el botón parecía no hacer nada. Sin animación no se llama onViewStateChange y la escala se quedaba atrasada (PR).

**Origen.** GA v30; PR · *aprendizaje de proyecto*

**Verificación.** prueba: pedir dos veces la misma vista la aplica las dos veces

### GEO-103 · Las respuestas tardías no eligen

**BASE** · aplica a: todos

**Regla.** Ubicación, descargas, búsquedas y ligas llevan un turno; antes de pintar o elegir, la respuesta compara su turno con el vigente y se descarta si es viejo.

**Por qué.** PL B131: Supervisión pintaba datos de la cuenta anterior si se cambiaba de sesión mientras cargaba.

**Origen.** GA TURNO; PR locReq; PL B131 · *aprendizaje de proyecto*

**Verificación.** prueba: dos pedidos seguidos con respuestas en orden invertido

### GEO-104 · Dedos fantasma en iPhone

**BASE** · aplica a: deck.gl

**Regla.** Con deck.gl, al quitar el último dedo, al empezar un toque primario y en blur o visibilitychange, se despacha pointercancel para los punteros que quedaron en la lista del administrador de eventos (dk.eventManager.manager.input.store).

**Por qué.** GA v28k y v29b, PR: iOS a veces no entrega el touchend; con un dedo de más, un solo dedo pellizcaba, y con dos, el mapa se congelaba.

**Origen.** GA v28k; GA v29b; PR · *aprendizaje de proyecto*

**Verificación.** prueba de dedos: un touchend perdido no deja punteros vivos

### GEO-105 · Las trampas conocidas de Leaflet se atienden en el módulo del motor

**BASE** · aplica a: Leaflet

**Regla.** El módulo Leaflet del estándar destruye el mapa con remove() y borra _leaflet_id antes de reconstruirlo; no lo destruye a media animación; llama invalidateSize() de 50 a 80 ms después de mostrar un contenedor oculto y no encuadra si offsetParent es null; aplica disableScrollPropagation y disableClickPropagation en los paneles sobre el mapa; pone tabindex=-1 a los polígonos interactivos con un addInitHook, y traduce sus controles al español («Acercar», «Cerrar»).

**Por qué.** AP: Leaflet revienta si se construye dos veces sobre el mismo nodo, y sus controles siguen diciendo «Zoom in» y «Close popup». CP: lanza _leaflet_pos si se destruye a media animación, y Chromium mete cada polígono en el orden de tabulación. PL y AP: un contenedor que pasa de oculto a visible no se dibuja completo sin invalidateSize().

**Origen.** AP; CP; PL · *aprendizaje de proyecto*

**Verificación.** pruebas del módulo Leaflet

### GEO-106 · iOS: lo que no funciona como en los demás

**BASE** · aplica a: todos

**Regla.** Para fijar la página se fija el body con position: fixed conservando la posición (overflow: hidden no basta). Nada fixed dentro de un ancestro con transform: se mueve a <body>. La pantalla completa se simula, porque iOS no tiene Fullscreen API. El desplazamiento suave solo con html:focus-within. Las cifras llevan format-detection para que no se subrayen como teléfonos.

**Por qué.** AP: el desplazamiento suave sin condición animaba la restauración de la posición al cargar la página. GA, CP y AP fueron dando con cada una de estas diferencias en iPhone.

**Origen.** AP; GA; CP · *aprendizaje de proyecto*

**Verificación.** prueba en WebKit y en teléfono real

### GEO-107 · Lo guardado en el navegador se valida al leerlo

**BASE** · aplica a: todos

**Regla.** Las claves llevan prefijo y versión (gda:v1:*); todo acceso va en try/catch porque el almacenamiento puede estar bloqueado; lo leído se valida antes de usarlo. Con IndexedDB abierta en dos pestañas, la vieja suelta la base cuando la nueva la pide.

**Por qué.** En navegación privada o con el almacenamiento bloqueado, un acceso sin try/catch detiene la página entera (GA). PL encontró la base bloqueada por una pestaña vieja.

**Origen.** GA; PL · *aprendizaje de proyecto*

**Verificación.** prueba sin almacenamiento: la página abre completa

### GEO-108 · Sin conexión: se dice y se reintenta

**BASE** · aplica a: todos

**Regla.** Si falla la red, «Volver a intentar», y reintento automático con el evento online. Un indicador de conexión aparece solo cuando no hay red. Service worker solo cuando hace falta trabajar sin red (D9): su lista de archivos se lee de index.html, la página se pide primero a la red y nunca se instala una versión a medias.

**Por qué.** CP: si la versión nueva se instalaba sin red, su caché quedaba vacía para siempre. CP quitó un punto verde de conexión permanente que se encimaba sin decir nada útil.

**Origen.** GA; PL; CP; D9 · *aprendizaje de proyecto*

**Verificación.** prueba: sin red a media visita; instalación del service worker sin red

## 12. Accesibilidad

### GEO-109 · axe en todas las pantallas, y lector de pantalla declarado

**BASE** · aplica a: todos

**Regla.** axe-core corre en cada pantalla, en computadora y en celular, con 0 hallazgos o con cada excepción aceptada por escrito. Como axe encuentra solo del 30 al 40 % de los problemas, el recorrido con un lector de pantalla real se hace o se declara pendiente.

**Por qué.** GA cerró con 0 hallazgos; PL aceptó uno (puntos de menos de 24 px) con la lista como equivalente. AP, PR y GA declaran que les falta el recorrido con lector real.

**Origen.** GA; PL; AP; PR · *aprendizaje de proyecto*

**Verificación.** prueba de accesibilidad con axe en 1440 y 390 px

### GEO-110 · Estructura que se recorre sin ver el mapa

**BASE** · aplica a: todos

**Regla.** <main>, lang=es-MX y regiones con nombre. El mapa lleva role=img o application con un nombre que remite a la lista. Los íconos van con aria-hidden. El enlace para saltar al contenido usa position: fixed. Cuando la lista es la vía accesible, los marcadores salen del orden de teclado.

**Por qué.** AP: con position: absolute el enlace de salto aparecía fuera de la pantalla, y sus 12 árboles sumaban 24 paradas de Tab antes de llegar a la lista.

**Origen.** AP; GA; CP · *aprendizaje de proyecto*

**Verificación.** prueba de teclado: número de paradas hasta la lista

### GEO-111 · Se anuncia la conclusión, en un status que se vacía primero

**BASE** · aplica a: todos

**Regla.** Un solo role=status; para anunciar, se vacía y se llena en el siguiente cuadro. Se anuncia solo la conclusión («12 resultados»), no cada paso. Los datos derivados van en <output>. Como en formularios, todo anuncio también se ve en pantalla: nada se dice sólo al lector (FRM-40).

**Por qué.** GA: un status que aparece y cambia de texto a la vez a veces no se lee.

**Origen.** GA; CP; PL; FRM-40 · *aprendizaje de proyecto*

**Verificación.** prueba: un solo role=status por página

### GEO-112 · Textos según el puntero y movimiento reducido en todo

**BASE** · aplica a: todos

**Regla.** Las instrucciones dicen «haz clic» o «toca» según el puntero. prefers-reduced-motion apaga también el movimiento hecho por JS (desplazamiento, vuelos) y los pulsos de los marcadores (complementa FRM-65).

**Por qué.** CP pasa su desplazamiento por JS por una función (_suave()) que respeta la preferencia; AP apagó el pulso de su marcador.

**Origen.** CP _suave(); AP; FRM-65 · *aprendizaje de proyecto*

**Verificación.** prueba con prefers-reduced-motion: duración de vuelo 0

## 13. Seguridad, servidor y entrega

### GEO-113 · CSP estricta, escrita en un solo archivo

**BASE** · aplica a: todos

**Regla.** default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; style-src 'self'; img-src 'self' data: blob: más el dominio de las teselas; worker-src 'self' blob: si hay Excel o PDF en un Worker; object-src 'none'; base-uri 'self'. La CSP vive en un solo archivo (encabezados.conf) que usan nginx, Express y las pruebas. frame-ancestors va en el encabezado, porque la <meta> no lo admite. Un service worker tiene su propia CSP: su connect-src incluye todo lo que pide.

**Por qué.** CP: faltó un host en el connect-src de sw.js y sus fetch() respondían 503. PL: la <meta> no admite frame-ancestors.

**Origen.** GA encabezados.conf; PR; PL; CP · *aprendizaje de proyecto*

**Verificación.** prueba: cero violaciones de CSP con el encabezado real

### GEO-114 · Encabezados y nginx

**BASE** · aplica a: servidor

**Regla.** X-Content-Type-Options: nosniff; Referrer-Policy: strict-origin-when-cross-origin; Permissions-Policy: geolocation=(self), camera=(); teselas con referrerpolicy no-referrer. En nginx: location ^~ en cada prefijo; absolute_redirect off; add_header repetido en cada bloque; root y no alias; .bin sin gzip; ráfaga de limit_req suficiente para lo que la página pide al abrir; sin HSTS en el fragmento.

**Por qué.** Sin ^~, una regla general por extensión sirvió app.js sin sesión ni cabeceras. Sin absolute_redirect off, las redirecciones salían con http://. add_header no se hereda entre bloques. HSTS con includeSubDomains compromete el dominio por un año.

**Origen.** PL; PR; CP · *aprendizaje de proyecto*

**Verificación.** prueba contra el servidor de ejemplo: encabezados de cada ruta

### GEO-115 · Instalación por versión y paquete limpio

**BASE** · aplica a: servidor

**Regla.** Una carpeta por versión y un enlace simbólico a la vigente: regresar es cambiar el enlace. El paquete es un ZIP con su .sha256 y su manifiesto, permisos 0644/0755 aunque se arme en Windows, sin documentos internos, direcciones ni llaves. El detalle de la entrega al SIA está en la skill proyecto-sia.

**Por qué.** GA y PR regresan de versión en segundos cambiando el enlace. PL, PR y CP entregan así al SIA.

**Origen.** GA; PR; PL; CP · *aprendizaje de proyecto*

**Verificación.** empaquetado: sha256sum -c y lista de archivos prohibidos

### GEO-116 · Acceso en el servidor, nunca en la página

**BASE** · aplica a: servidor

**Regla.** Si el visor pide cuenta, el acceso lo resuelve el servidor (auth_request en nginx). Datos y programas responden 401, no 302, para que la página diga «Tu sesión terminó». Lo demás (scrypt, límites, cookies) sigue la skill proyecto-sia.

**Por qué.** Con 302, el fetch recibe la página de entrada como si fueran datos. PR: sia-backend no usa trust proxy y un límite por IP habría bloqueado a todos a la vez. Con scrypt N=2^17, diez accesos simultáneos ocupaban 1.3 GB.

**Origen.** PR; CP; PL · *aprendizaje de proyecto*

**Verificación.** prueba: sin sesión, los datos responden 401

### GEO-117 · Lo que llega de fuera se inserta como texto

**BASE** · aplica a: todos

**Regla.** Lo escrito por la persona o por la hoja se inserta con textContent; si hace falta HTML, se escapa una sola vez, en el origen (esc()). Una URL que llega de los datos solo se usa si es http(s) (cleanUrl()).

**Por qué.** Escapar en dos lugares pone «&amp;#39;» en pantalla, y no escapar abre la puerta a código ajeno (CP).

**Origen.** CP cleanUrl(); GA; PR · *aprendizaje de proyecto*

**Verificación.** auditor: sin innerHTML con datos; prueba con datos fijos maliciosos

### GEO-118 · Medición solo con consentimiento

**OPCIONAL** · aplica a: todos

**Regla.** Si el visor mide visitas, el programa de medición no se carga hasta que la persona elige «Aceptar». «Aceptar» y «Rechazar» tienen el mismo peso y lo que vale por omisión es rechazar.

**Por qué.** AP lo hizo así para no cargar a un tercero sin permiso de la persona.

**Origen.** AP · *aprendizaje de proyecto*

**Verificación.** prueba: sin «Aceptar», ninguna petición al servicio de medición

### GEO-119 · Sitio de pruebas en GitHub Pages

**RECOMENDADO** · aplica a: todos

**Regla.** Source en «GitHub Actions», archivo .nojekyll y noindex en el sitio de pruebas. La página va sin caché.

**Por qué.** GA: Jekyll compitió con Actions y el sitio mostró el README en lugar del visor. GitHub Pages sirve con max-age=600 por omisión.

**Origen.** GA · *aprendizaje de proyecto*

**Verificación.** revisión de la configuración del repositorio

## 14. Pruebas

### GEO-120 · Chromium con WebGL por software, y WebKit

**BASE** · aplica a: todos

**Regla.** Playwright con Chromium (--use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader) y WebKit para Safari. De noche, una corrida con la tarjeta gráfica real. Cuando el mapa deja de recibir clics con WebGL por software, los toques se simulan con ganchos que solo existen en prueba (window.__MAPA).

**Por qué.** Windows frena el WebGL por software con el equipo sin usar. Con WebGL por software, después del primer clic el mapa deja de recibir clics (GA, PR).

**Origen.** GA; PR; PL · *aprendizaje de proyecto*

**Verificación.** las pruebas corren en los dos motores de navegador

### GEO-121 · Tamaños de prueba fijos

**BASE** · aplica a: todos

**Regla.** 1440 × 900; 360, 390 y 430 de ancho como teléfono táctil (is_mobile, has_touch); 844 × 390 acostado; 320 y 430 con la letra al 125 %.

**Por qué.** Un tamaño que no se prueba es donde aparece el desborde. PR usa esta lista, la más completa de los cinco proyectos.

**Origen.** PR · *aprendizaje de proyecto*

**Verificación.** las pruebas recorren todos los tamaños

### GEO-122 · Esperar una marca, no un tiempo

**BASE** · aplica a: todos

**Regla.** Las pruebas esperan una marca de «listo» (data-listo), nunca un tiempo fijo. Corren también como si fuera otro día. Usan datos fijos de prueba con los casos difíciles, no la red. Cada prueba tiene tope de tiempo, y su limpieza siempre cierra las conexiones.

**Por qué.** PL SRP_HOY destapó 10 comprobaciones que dependían de la fecha. PL B210: una corrida sin tope esperó 7 horas.

**Origen.** PL; AP · *aprendizaje de proyecto*

**Verificación.** auditor de pruebas: sin esperas fijas

### GEO-123 · Lo que se prueba siempre

**BASE** · aplica a: todos

**Regla.** Desbordes y barra horizontal; sin terceros (todo dominio externo bloqueado); CSP sin violaciones; sin WebGL; sin almacenamiento; sin red a media visita; datos tardíos o cortados; dos pantallas (el mapa mide lo mismo antes y después, inert, nada encimado); nombres del mapa dentro de su figura, sin encimarse y estables; dedos fantasma; contenido de las descargas.

**Por qué.** Es la lista que GA, PR y PL fueron armando: cada punto cubre una trampa de la sección 16 de los aprendizajes.

**Origen.** GA; PR; PL · *aprendizaje de proyecto*

**Verificación.** npm run verificar corre cada punto

### GEO-124 · Una orden, una señal

**BASE** · aplica a: todos

**Regla.** Una sola orden corre todo (npm run verificar) y el veredicto sale del código de salida. Lo que no corrió cuenta como falla. Cada error encontrado se vuelve una comprobación para que no regrese, y ninguna aserción se borra en silencio.

**Por qué.** AP buscaba el texto «0 fallidas» en la salida y eso dejaba pasar fallas.

**Origen.** PR correr_todas.js; GA probar.py; EF; AP; GA auditoria.py · *aprendizaje de proyecto*

**Verificación.** verificar.mjs termina con código distinto de 0 si algo falla o no corre

### GEO-125 · Foto antes y después de reorganizar

**RECOMENDADO** · aplica a: todos

**Regla.** Antes de reorganizar código se toma una «foto» (estilo calculado de cada elemento, textos, atributos e imagen) y después debe dar 0 diferencias. Las regresiones se comparan contra la versión anterior tomada de git.

**Por qué.** GA reorganizó así su código sin cambiar nada visible; PR compara cada versión contra la anterior.

**Origen.** GA; PR · *aprendizaje de proyecto*

**Verificación.** prueba de foto: 0 diferencias

### GEO-126 · Trucos de prueba y falsos hallazgos conocidos

**RECOMENDADO** · aplica a: todos

**Regla.** Área táctil: elementFromPoint a 5 px fuera del borde visible cae en el mismo control. Doble envío: dos requestSubmit() seguidos dejan un solo registro. Ids repetidos en la página. La app abierta al pasar la medianoche. Se miden desbordes y renglones en lugar de contar elementos exactos. Se declaran los falsos hallazgos conocidos: .focus() por código no dispara :focus-visible y un clic simulado sí lo enciende; las capturas de página completa deforman lo fijo; sin la letra real cambian los cortes de renglón.

**Por qué.** PL B137: un id repetido dejó un filtro sin responder. PL B152: con la app abierta después de la medianoche, la fecha máxima quedaba fija.

**Origen.** PL B137; PL B152; AP; CP · *aprendizaje de proyecto*

**Verificación.** las pruebas incluyen estos casos

### GEO-127 · Pruebas que funcionan en Windows

**BASE** · aplica a: todos

**Regla.** Todo script en UTF-8; sin shell: true; rutas con fileURLToPath; .gitattributes con eol=lf; servidor de prueba propio con 256 conexiones en espera; las pruebas preguntan desde fuera de la página, sin eval. En Windows, «python3» abre la tienda: se usa «py» o la ruta completa.

**Por qué.** cp1252 detenía las pruebas por una «→». shell: true parte las rutas con espacios («Páginas web»). CRLF rompía sha256sum -c y los .sh. PL B188–B192: http.server de Python deja 5 conexiones en espera y rechazaba archivos («L is not defined» intermitente). PL B90: la CSP estricta bloquea el eval de wait_for_function.

**Origen.** PL B90; PL B188; GA; PR · *aprendizaje de proyecto*

**Verificación.** las pruebas corren en Windows desde una ruta con espacios y acentos

## 15. Lenguaje

### GEO-128 · Tú para el público, usted para el personal

**BASE** · aplica a: todos

**Regla.** Los visores para el público hablan de tú; las herramientas para personal interno (campo, supervisión), de usted. Un visor no mezcla los dos.

**Por qué.** GA, CP y AP usan tú; PL, que usa personal en campo, usted. PR estaba pendiente.

**Origen.** D10; GA; CP; AP; PL · *decisión del estándar*

**Verificación.** revisión de textos.js

### GEO-129 · Sin tecnicismos y un nombre por dato

**BASE** · aplica a: todos

**Regla.** «La lista», no «el panel»; nada de NDVI, percentil o «frente de manzana» sin explicar. Cada dato tiene un solo nombre en todo el visor. Sin diagonales de género. Las acciones se atribuyen a «la Secretaría» (complementa FRM-73).

**Por qué.** Quien consulta un mapa no conoce el vocabulario del área, y dos nombres para un mismo dato se leen como dos datos distintos.

**Origen.** GA; PR; CP; AP; FRM-73 · *aprendizaje de proyecto*

**Verificación.** revisión de textos.js con la lista de palabras prohibidas

### GEO-130 · Singular, plural, cero y medidas humanas

**BASE** · aplica a: todos

**Regla.** «1 árbol», «aún sin árboles», «menos de 1 %». Kilómetros sin decimales desde 10 km; metros por debajo de 1 km; distancias cortas de 10 en 10 m.

**Por qué.** PR: «0 km» eran 135 m.

**Origen.** PR; GA · *aprendizaje de proyecto*

**Verificación.** prueba de las funciones de formato con 0, 1, 135 m y 12.4 km

### GEO-131 · Mensajes completos, que no dependen del ancho

**BASE** · aplica a: todos

**Regla.** Los mensajes se escriben completos con marcadores con nombre ({calle}, {LIGA}), nunca armados con pedazos. Un mensaje no depende del ancho: «el listado que lo acompaña», no «el de la derecha».

**Por qué.** GA v24b: la liga se insertó en la primera «L» del mensaje. AP: en el celular, el listado no está a la derecha.

**Origen.** GA v24b; AP · *aprendizaje de proyecto*

**Verificación.** armado: los textos solo usan marcas con nombre

### GEO-132 · Errores con una acción

**BASE** · aplica a: todos

**Regla.** Cada error dice en español qué pasó y qué hacer («Revisa tu conexión» + «Volver a intentar»); el detalle técnico va a la consola. Se distingue sesión, red y servidor.

**Por qué.** Cada uno se arregla distinto: volver a entrar, esperar la red o avisar a la Secretaría (PR).

**Origen.** PR; CP · *aprendizaje de proyecto*

**Verificación.** prueba: sesión vencida, sin red y error 500 dan tres mensajes distintos

### GEO-133 · Lo que el mapa no puede afirmar, no lo afirma

**BASE** · aplica a: todos

**Regla.** Una consulta informativa lo dice («Consulta informativa, sin validez legal»). Se dice «polígono», no «predio». Toda afirmación jurídica cita artículo y norma o deja «[Art. __, fracc. __]» (FRM-56).

**Por qué.** CP: la gente cita el resultado en trámites, y un mapa no determina la situación legal de un predio.

**Origen.** CP; AP; GA; FRM-56 · *aprendizaje de proyecto*

**Verificación.** revisión de textos.js

