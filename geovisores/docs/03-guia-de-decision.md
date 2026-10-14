# 03 · Guía de decisión

Qué decidir al empezar un visor, en este orden: tipo, motor, fondo, módulos, tema y trato. Cada respuesta se anota en la documentación del proyecto, con la fecha. Las reglas que aplican a cada respuesta están al final, generadas de `reglas/reglas.json`.

## 1. ¿Qué tipo de visor es? (D6)

| Tipo | Se reconoce porque | En el celular | Ejemplos |
|---|---|---|---|
| **Visor de consulta** | El mapa es la página. La persona viene a consultar, filtrar o buscar sobre el mapa. | Dos pantallas completas, información y mapa (GEO-17, GEO-18). | GA, PR |
| **Mapa en página** | El mapa acompaña algo que se desplaza: una ficha, un formulario, un tablero, un micrositio. | El mapa en reposo; dos dedos lo mueven (GEO-19). Pantalla completa para recorrerlo. La ficha sobre el mapa puede ser una hoja (GEO-20). | CP, AP, EF |
| **Captura en campo** | Personal de la Secretaría registra o revisa puntos en el sitio, a veces sin señal. | Como mapa en página, más las reglas de campo: captura del punto (GEO-32), referencia mínima (GEO-34), formulario en blanco después de guardar (GEO-63), umbrales sobre el GPS (GEO-87). Service worker solo si trabaja sin red (GEO-108). | PL |

Si un visor tiene dos partes (PL: captura y supervisión), cada parte se clasifica por separado.

## 2. ¿Qué motor? (D1)

1. ¿Dibuja líneas (calles, frentes) o unos 10 mil elementos o más a la vez? → **deck.gl**.
2. ¿Necesita colocar o arrastrar un punto, o mostrar teselas de un proveedor con pocos elementos encima? → **Leaflet**.
3. En duda → **Leaflet**: abre sin WebGL, sirve en equipos sin aceleración y tiene menos trampas.

| Motor | Trae consigo |
|---|---|
| deck.gl | WebGL 2 obligatorio, con aviso y lista si falta (GEO-96); modo ligero automático; formato binario determinista (GEO-81); colocador de etiquetas propio (GEO-78); `irA()` (GEO-102); dedos fantasma (GEO-104); capas que solo se preparan si se ven (GEO-95). Fondo propio (sección 3). |
| Leaflet | Gesture Handling en un mapa dentro de página (GEO-19); marcador SVG propio (GEO-75); las trampas del módulo del motor (GEO-105); globos con elementos y no cadenas (GEO-39); letra y textos en español sobrescritos (GEO-71, GEO-105). |

Los dos usan el mismo armazón, los mismos tokens y las mismas pruebas (GEO-01).

## 3. ¿Qué fondo? (D7)

| Situación | Fondo | Por qué |
|---|---|---|
| Motor deck.gl | Fondo propio | Mismos datos y misma tubería que lo demás; CSP cerrada; sin puntos de interés que compitan (GA, PR). |
| No se admiten terceros: datos sensibles, CSP cerrada, sin llave contratada | Fondo propio | No llama a nadie ni manda la IP de la persona a otro servidor. |
| Captura en campo | Satelital, con opción de calles | La persona se ubica por techos, copas y banquetas (PL). Con halo blanco en todo lo que va encima (GEO-79). |
| Leaflet en consulta urbana | Teselas claras de un proveedor con llave contratada, o fondo propio si ya está preparado para esa zona | CARTO exige llave desde agosto de 2026; OSM no admite uso intenso (GEO-74). |

**Pendiente de la Secretaría (no del estándar):** la licencia del satelital de Esri (PR, PL y CP lo usan con crédito, «pendiente de licencia») y si se contrata una llave de teselas claras. Hasta entonces, el fondo propio es la única opción sin terceros. Todas las opciones conocidas, con su crédito, su llave y lo que falta verificar, están en `docs/02`, sección 3, y en la guía visual («Mapas base»). Si el visor no necesita mapa base (por ejemplo, un formulario que solo pide un punto), puede ir sin él: el punto se coloca igual (FRM-50, GEO-75).

Con teselas, a la tercera que falla aparece el aviso y el mapa sigue sirviendo (GEO-75).

## 4. ¿Qué módulos?

| Módulo | Se usa cuando | Reglas | De dónde se extrae (fases 2 y 3) |
|---|---|---|---|
| Controles | Siempre | GEO-27, GEO-28, GEO-29 | GA, PR, CP |
| Lista | Siempre: es la otra vía al mapa | GEO-46 | GA, PR |
| Simbología | El mapa pinta más de un nivel | GEO-35 | GA, PR |
| Escala | Visor de consulta en computadora | GEO-36 | GA, PR |
| Crédito | Siempre que haya fondo o capa de otro | GEO-37 | PL, PR |
| Capas | Más de una capa o más de un fondo | GEO-33 | CP, PL |
| Filtros | Los datos se recortan por categoría o umbral | GEO-40, GEO-41, GEO-42 | PR, CP |
| Buscador | Hay nombres, direcciones o claves que buscar | GEO-44, GEO-45 | GA, PR, CP |
| Ficha | Cada elemento tiene detalle | GEO-49 a GEO-54 | GA, CP, PR |
| Ubicación | «Qué hay cerca de mí» o captura | GEO-31 (consulta), GEO-32 (campo) | GA, AP, PL |
| Descargas | Se entregan datos | GEO-47 | PR, AP |
| Compartir | El estado se puede enviar por liga | GEO-43, GEO-53 | GA, PR, CP |
| Fondo propio | Sección 3 | GEO-74 | GA, PR |
| Hoja de cálculo | Los datos viven en una hoja de Google | GEO-14 | AP, CP |
| Servidor | Hay cuentas, cruces que guardar o entrega al SIA | GEO-86, GEO-113 a GEO-116 y la skill `proyecto-sia` | PL, PR, CP |

## 5. ¿Lleva tema? (D4)

Solo si el visor tiene identidad propia reconocida (un programa con su nombre y su color, como Guardianes). El tema cambia cuatro tokens (`--tema-marca`, `--tema-marca-cl`, `--tema-ficha`, `--tema-ficha-texto`), se declara en un bloque `[data-tema]` y se mide con `contraste.mjs` antes de usarse (GEO-70). Hay tres ejemplos medidos en `codigo/css/temas.css`. La ficha es siempre clara (D11): el azul de lo tocable y la marca llegan a 4.5:1 sobre ella, y la marca va en el título y en la franja del borde; `npm run verificar` lo exige a cada tema.

## 6. ¿Tú o usted? (D10)

Tú para el público; usted para personal interno (campo, supervisión). Un visor no mezcla los dos (GEO-128). Si tiene una parte pública y una interna, cada una lleva su trato.

## 7. Reglas por respuesta

Cada visor cumple las reglas de **todos** más las de cada respuesta que le toque. Tabla generada; no se edita a mano.

<!-- aplica:inicio -->
| Aplica a | BASE | RECOMENDADO | OPCIONAL |
|---|---|---|---|
| **todos** · Cualquier visor, con cualquier motor. | GEO-01, GEO-02, GEO-03, GEO-06, GEO-08, GEO-10, GEO-11, GEO-12, GEO-16, GEO-21, GEO-23, GEO-24, GEO-25, GEO-27, GEO-28, GEO-29, GEO-35, GEO-37, GEO-43, GEO-46, GEO-48, GEO-54, GEO-55, GEO-57, GEO-58, GEO-59, GEO-60, GEO-61, GEO-62, GEO-64, GEO-65, GEO-66, GEO-67, GEO-68, GEO-69, GEO-70, GEO-71, GEO-72, GEO-74, GEO-76, GEO-77, GEO-80, GEO-82, GEO-83, GEO-84, GEO-85, GEO-89, GEO-91, GEO-93, GEO-97, GEO-99, GEO-100, GEO-102, GEO-103, GEO-106, GEO-107, GEO-108, GEO-109, GEO-110, GEO-111, GEO-112, GEO-113, GEO-117, GEO-120, GEO-121, GEO-122, GEO-123, GEO-124, GEO-127, GEO-128, GEO-129, GEO-130, GEO-131, GEO-132, GEO-133 | GEO-04, GEO-05, GEO-07, GEO-09, GEO-13, GEO-15, GEO-26, GEO-30, GEO-36, GEO-56, GEO-73, GEO-90, GEO-98, GEO-119, GEO-125, GEO-126 | GEO-118 |
| **visor de consulta** · Panel más mapa que ocupa la pantalla (GA, PR). | GEO-17, GEO-18, GEO-22 | GEO-38 | — |
| **mapa en página** · Mapa dentro de una página que se desplaza: ficha, formulario, micrositio (CP, AP, EF). | GEO-19 | — | — |
| **campo** · Captura en campo con el teléfono, con o sin conexión (PL). | GEO-32, GEO-63, GEO-87, GEO-88, GEO-101 | GEO-34 | — |
| **deck.gl** · Visores con motor deck.gl. | GEO-94, GEO-95, GEO-104 | GEO-78, GEO-81, GEO-96 | — |
| **Leaflet** · Visores con motor Leaflet. | GEO-39, GEO-105 | — | — |
| **teselas** · Fondo de mapa de un proveedor (callejero o satelital). | GEO-75, GEO-79 | — | — |
| **capas** · Más de una capa o más de un fondo para elegir. | GEO-33 | — | — |
| **filtros** · Visores con filtros sobre los datos. | GEO-40, GEO-42 | GEO-41 | — |
| **buscador** · Visores con buscador. | GEO-44 | GEO-45 | — |
| **ficha** · Visores con ficha de elemento. | GEO-49, GEO-50, GEO-51 | GEO-53 | GEO-20, GEO-52 |
| **ubicación** · Visores que usan la ubicación de la persona. | GEO-31 | — | — |
| **descargas** · Visores que entregan archivos de datos. | — | — | GEO-47 |
| **hoja de cálculo** · Datos que llegan de una hoja de Google. | — | — | GEO-14 |
| **servidor** · Visores con servidor propio, cuentas o entrega al SIA. | GEO-86, GEO-88, GEO-114, GEO-115, GEO-116 | — | GEO-92 |
<!-- aplica:fin -->

## 8. Los cinco proyectos, clasificados

| | GA | PR | PL | CP | AP |
|---|---|---|---|---|---|
| Tipo | Consulta | Consulta | Campo (captura) y consulta (supervisión) | Mapa en página | Mapa en página |
| Motor | deck.gl | deck.gl | Leaflet | Leaflet | Leaflet |
| Fondo | Propio | Propio y satelital | Satelital y calles (Esri) | CARTO con llave y satelital | CARTO con llave |
| Módulos | Controles, lista, simbología, escala, buscador, ficha, ubicación, compartir | Además: filtros, capas, descargas | Capas, ubicación (campo), servidor | Capas, filtros, buscador, ficha, ubicación, hoja de cálculo | Lista, ficha, ubicación, descargas, hoja de cálculo |
| Tema | Hoja | Institucional | Institucional | Crema | Jacarandá (con letra propia: desviación) |
| Trato | Tú | Pendiente: tú si es para el público, usted si es solo para personal (D10) | Usted | Tú | Tú |
