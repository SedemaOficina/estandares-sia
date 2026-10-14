# 02 · Guía de estilo del mapa

Lo propio del mapa. Colores, letra, escala, espaciado, radios, foco, puntos de quiebre, avisos y botones vienen del **estándar de formularios** y aquí no se redefinen. Formularios vive a un lado, en `../formularios/` (la misma carpeta `estandares-sia`), y geovisores lo lee de ahí sin copias. Todo valor del mapa vive en `codigo/css/tokens-mapa.css` y los temas en `codigo/css/temas.css` (GEO-65). Para verlo en vivo: `guia-visual/index.html`.

Orden de carga en un visor:

```
formularios/codigo/css/tokens.css     ← colores, letra, medidas, puntos de quiebre (formularios)
formularios/codigo/css/base.css
formularios/codigo/css/nucleo.css     ← botones, avisos, campos, foco (formularios)
geovisores/codigo/css/tokens-mapa.css ← lo propio del mapa
geovisores/codigo/css/temas.css       ← solo si el visor lleva tema
geovisores/codigo/css/armazon.css     ← foco de dos tonos (fase 1); el armazón llega en la fase 2
```

## 1. Qué toma de formularios y qué agrega

| Concepto | De formularios (no se toca) | Agrega este estándar |
|---|---|---|
| Color | guinda, dorado, neutros, azul, foco, rojo, ámbar, verde | Fondo propio, líneas y nombres, lo elegido en el mapa, ubicación, «sin dato», rampa de prioridad y rampa de verdor |
| Letra | Cabin 600/700 y Roboto 400/500/700, escala de siete tamaños | Tamaños de los nombres del mapa |
| Medidas | espaciado de 4 en 4, radios, trazos, 44 px táctil | Botón del mapa con ratón (34 px), panel, ficha, cajón, simbología, deslizador |
| Capas | `--z-base`, `--z-lista` (30), `--z-barra` (40) | Seis capas sobre el mapa, de 5 a 10 |
| Movimiento | `--dur-rapida`, `--dur-media`, `--dur-nula` | Cambio de pantalla (.25 s) y vuelo del mapa (800 ms) |
| Foco | anillo azul de 3 px separado 2 px | Halo blanco en la separación (dos tonos, D3) |
| Cortes | 560, 760 y 1024 px, solo `min-width` (`--bp-sm`, `--bp-md`, `--bp-lg`) | Qué hace el mapa en cada tramo (D5) |
| Tema | — | Cuatro tokens por visor (D4), con la ficha siempre clara (D11) |

**Regla para un token nuevo del mapa:** si un valor de formularios hace el trabajo, el token lo nombra con `var()` y no copia el hexadecimal. Así, la mayoría de los colores de `tokens-mapa.css` son nombres de formularios con un papel en el mapa; los únicos valores nuevos son los del fondo propio, la ubicación, «sin dato» y la rampa.

## 2. Colores del mapa: un color, un trabajo (GEO-66)

| Token | Valor | Su único trabajo | Nunca se usa para | Origen |
|---|---|---|---|---|
| `--mapa-suelo` | #F5F4F1 | Suelo dentro de la ciudad | Texto, datos | GA |
| `--mapa-manzana` | #DAD6CD | Manzanas, desde zoom 13–14 | Datos | GA (PR usa #E2DED6) |
| `--mapa-verde` | #D9EAD0 | Parques y áreas verdes | Datos, «bien» | GA, PR |
| `--mapa-agua` | #BCD7E6 | Cuerpos de agua | Datos, enlaces | GA, PR |
| `--mapa-calle` | = `--blanco` | Calles | — | PR |
| `--mapa-fuera` | #BFC6C0 | Fuera de la ciudad | Texto | GA |
| `--mapa-halo` | = `--blanco` | Franja bajo los límites y contorno de los nombres | — | GA |
| `--mapa-limite-alcaldia` | = `--texto` | Límite de alcaldía | — | GA (en verde oscuro) |
| `--mapa-limite-colonia` | = `--gris` | Límite de colonia | — | GA (en verde oscuro) |
| `--mapa-nombre-fuerte` | = `--texto` | Nombre de alcaldía | — | GA, PR |
| `--mapa-nombre` | = `--gris` | Nombre de colonia y de calle | — | PR (`--map-label` es el mismo gris) |
| `--mapa-elegido` | = `--azul` | Contorno de lo elegido | Relleno (GEO-77) | D2 (GA usaba guinda; PR, pizarra) |
| `--mapa-resalte` | = `--dorado` | Línea al pasar el puntero | Texto, lo único que señala algo | GA, PR |
| `--mapa-buscado` | = `--guinda` | Marcador del lugar buscado | Lo elegido | CP, PR |
| `--mapa-aro` | = `--texto` | Aro oscuro de los puntos claros | — | GA v28i, PL |
| `--mapa-ubicacion` | #1A73E8 | Punto de «mi ubicación» y su círculo de precisión | Cualquier otra cosa | GA, PR |
| `--mapa-sin-dato` | #9A9A96 | Área o punto sin dato | «Cero» | GA v31e (va con la rampa de verdor) |
| `--mapa-credito` / `-bg` | = `--gris` / `--blanco` | Crédito del mapa, sobre fondo sólido | — | PL, PR |
| `--rampa-prioridad-1…5` | #F9E7BF … #7F1D12 | Una variable ordenada de menor a mayor | Texto, acción, estado | PR, PL |
| `--rampa-verdor-1…5` | #EBF4E1 … #1A5030 | Verdor, de menos a más | Texto, acción, estado | GA v31e |

**Error en el mapa.** Si el guinda ya significa algo en los datos del visor (por ejemplo, GA: «ya lo cuidan»), el error del mapa usa la familia ámbar de formularios (`--pend`, `--pend-bg`, `--pend-txt`), porque guinda y rojo miden 1.1:1 entre sí (PL D124). Si no, usa el rojo de formularios.

**Sobre la satelital** se usan neutros con tinte frío (GEO-67) y toda superposición lleva el filtro de halo blanco `--mapa-halo-satelital`, el de CP (GEO-79).

## 3. Fondo propio y teselas (GEO-74)

El fondo propio dibuja suelo, manzanas, verde y agua con estos tokens; a escala de ciudad no descarga nada (manzanas desde zoom 13–14). Las teselas de un proveedor se declaran en la configuración con crédito, licencia y llave. La guía de decisión (`docs/03`) dice cuándo conviene cada uno.

**Lo que falta medir.** Ningún proyecto midió el contraste sobre la satelital ni sobre teselas claras: los cinco lo resolvieron con halo y criterio. Como una imagen no tiene un solo color de fondo, el estándar mide cada elemento contra su halo (MC06, MN01, MN02, MN11, MN12, MN13, MN18) y deja para la fase 2 una prueba que tome muestras de píxeles de teselas reales bajo cada etiqueta y cada punto. Sin mapa base, el fondo es el gris de formularios (`--mapa-bg`) y sí se mide (MC39, MN20–MN22). Falta también medir las cifras sobre la rampa cuando la capa de datos tiene menos de 100 % de opacidad.

### Opciones de mapa base

Lo que usan los proyectos o anotó el estándar. **Por omisión, el fondo propio** (D7, GEO-74): es la única opción que no llama a otro servidor, no necesita llave y no tiene licencia por resolver. La satelital queda para campo cuando la Secretaría resuelva la licencia de Esri; si se contrata un proveedor de calles claras, y cuál, es decisión pendiente de la Secretaría. Lo marcado «Pendiente» no se pudo comprobar en las fuentes del estándar ni de los proyectos.

| Opción | Quién lo da · quién lo usa | Crédito | Llave, cuenta y límites | ¿Llama a otro servidor? | En el estándar |
|---|---|---|---|---|---|
| Fondo propio | La Secretaría: manzanas del Catastro de la CDMX; áreas verdes, cuerpos de agua y ANP y AVA de la Secretaría · GA, PR | El de cada fuente («Manzanas: Catastro CDMX») | Ninguna; se prepara por zona, manzanas desde el zoom 13–14 | No | Recomendado por omisión |
| Sin mapa base | Nadie; formularios lo trae vacío por omisión (FRM-50) | Solo el de las capas de datos | Ninguna | No | Respaldo: lo que queda si el fondo cae (GEO-75) |
| Calles claras de CARTO (Positron, datos de OpenStreetMap) | CARTO · CP y AP con llave; PR lo cambió por el fondo propio (v1.4) | «© OSM · © CARTO» (CP) o «Cartografía base de CARTO y © colaboradores de OpenStreetMap» (AP), con enlaces | Pide llave desde agosto de 2026 (AP); la llave va en la configuración, no escrita en el código. Pendiente: condiciones, límites y costo en la página de CARTO | Sí, recibe la IP de la persona | Solo con llave contratada |
| Calles de Esri (World Street Map) | Esri · PL, segundo fondo | El de PL (copyrightText del servicio, 5 oct 2026) y «Powered by Esri» | Como la satelital de Esri. Pendiente: licencia y condiciones | Sí | Licencia pendiente |
| Satelital de Esri (World Imagery) | Esri · PL, PR, CP | «Imagen: Esri, Vantor, Earthstar Geographics y GIS User Community» y «Powered by Esri» (PL, 24 sep 2026); con nombres de vías, además «Vías: Esri, HERE, Garmin, © OpenStreetMap contributors» | Según PR, solo con licencia; la vía en regla es una cuenta de ArcGIS Location Platform con llave restringida al dominio y cuota gratuita mensual; PL anota límites del uso gratuito. Pendiente: licencia de la Secretaría y condiciones en la página de Esri | Sí | Para campo, con halo (GEO-79); licencia pendiente |
| Satelital Sentinel-2 sin nubes 2024 (EOX) | EOX · PR la usó y la cambió por Esri | Obligatorio. Pendiente: texto exacto | Sin llave; según PR, CC BY-NC-SA 4.0, uso no comercial. Pendiente: verificarlo y si el uso de la Secretaría cabe | Sí | No se usa: 10 m por píxel, borrosa de cerca |
| OpenStreetMap (su propio servidor) | OpenStreetMap · GA y PR la descartaron | «© colaboradores de OpenStreetMap» con enlace a su página de derechos. Pendiente: texto exacto | Sin llave; su política no admite uso intenso. Pendiente: política vigente | Sí, recibe la IP | No se usa; sus calles quedaban a 20–30 m de las de INEGI |
| Esri gris | Esri · descartado | No aplica | Como los otros fondos de Esri | Sí | No se usa: solo llega al zoom 16 |
| Ortofoto de la Secretaría en el GeoServer del SIA | La Secretaría · PR la anotó como opción futura | El de la Secretaría | Sin terceros; el SIA tendría que publicarla en internet | Solo al servidor del SIA | Futuro. Pendiente de la Secretaría |
| INEGI | INEGI · ningún proyecto lo usa como mapa base | Pendiente | Pendiente: si ofrece teselas para mapa base y con qué condiciones | Sí | Sin evaluar |

### Cómo se muestran sobre el mapa

- Se cambian en el menú de capas (GEO-33): una sola opción a la vez, la vigente marcada; con el ratón o el dedo, elegir cierra el menú; con el teclado, las flechas cambian la opción y Escape cierra.
- Orden de abajo arriba: mapa base, capa de datos con su opacidad (de 20 a 100 %), y encima, opacos, los límites con franja, los nombres con contorno y los puntos con aro.
- Sobre la satelital, todo lo de encima lleva el halo blanco de un solo filtro (GEO-79). Fuera de la ciudad, la máscara tapa el mapa base, sea cual sea (GEO-77).
- El crédito cambia con el mapa base y siempre se ve (GEO-37).
- La guía visual («Mapas base» y la muestra del mapa) los muestra como dibujos con los colores del estándar: no pide teselas a ningún servidor.

## 4. Líneas, nombres y contorno (GEO-77, GEO-78)

- Límite = franja de `--mapa-halo` más ancha que la línea, con la línea encima. Se mide la línea contra la franja.
- Nombre = texto con contorno de `--mapa-halo`, de `--mapa-nombre-contorno` (2.4 px en pantalla). Se mide el texto contra su contorno (MC06), y también contra cada fondo (MC01–MC05) por si el contorno se adelgaza al alejar.
- Lo elegido: solo contorno, en `--mapa-elegido`, sobre la misma franja blanca; nunca relleno. Sin franja, el azul se pierde sobre las clases 3 a 5 de la prioridad (2.76, 1.39 y 1.41:1); con franja da 7.14:1 sobre cualquier fondo (MN18, MI09). PR resolvía lo mismo con un contorno pizarra (#273A45); el estándar conserva el azul de D2.

| Token | Valor | Uso | Origen |
|---|---|---|---|
| `--mapa-nombre-alcaldia` | 14 px | Cabin 700 | GA |
| `--mapa-nombre-alcaldia-lejos` | 12 px | A escala de ciudad | GA |
| `--mapa-nombre-colonia` | 12 px | Roboto 500 | GA |
| `--mapa-nombre-calle` | 12 px | Roboto 500 | PR |
| `--mapa-nombre-contorno` | 2.4 px | Ancho del contorno en pantalla | GA (PR: 2.0 a 2.8) |

Colonias y calles van en Roboto 500 (`--peso-medio` de formularios), como en GA y PR. Con deck.gl quedan exactamente tres combinaciones de letra (Cabin 700, Roboto 500 y Roboto 400), el máximo de GEO-95.

## 5. Rampas de datos y daltonismo (GEO-68)

Cada rampa se mide con `node herramientas/rampas.mjs`: simulación de Machado (2009) a severidad completa, en RGB lineal, y ΔE CIE76. Criterio de PR: clases vecinas a 15 o más; extremos a 50 o más. La tabla se genera; no se edita a mano.

<!-- rampas:inicio -->
| Rampa | Visión | ΔE entre vecinas (1→2 … 4→5) | Mínimo entre vecinas (≥ 15) | Extremos (≥ 50) | «Sin dato» a la clase más parecida | Resultado |
|---|---|---|---|---|---|---|
| prioridad | visión típica | 30.3 · 29.8 · 30.8 · 26.1 | 26.1 | 76.9 | 34.7 | cumple |
| prioridad | protanopia | 30.5 · 20.6 · 29.2 · 23.8 | 20.6 | 69.4 | 33.8 | cumple |
| prioridad | deuteranopia | 29.3 · 18.8 · 21.3 · 25.3 | 18.8 | 63.0 | 35.5 | cumple |
| prioridad | tritanopia | 20.3 · 32.6 · 27.0 · 24.4 | 20.3 | 78.9 | 30.2 | cumple |
| verdor | visión típica | 24.9 · 20.5 · 17.7 · 20.9 | 17.7 | 68.4 | 32.5 | cumple |
| verdor | protanopia | 22.0 · 17.3 · 17.4 · 20.5 | 17.3 | 64.6 | 28.9 | cumple |
| verdor | deuteranopia | 20.3 · 17.2 · 17.9 · 19.4 | 17.2 | 66.2 | 24.0 | cumple |
| verdor | tritanopia | 17.4 · 19.1 · 17.4 · 17.5 | 17.4 | 68.3 | 19.9 | cumple |
<!-- rampas:fin -->

**Comprobación del medidor.** Con la rampa de prioridad da L\* de 28, 46, 66, 82 y 92, y extremos de 76.9 (visión típica), 63.0 (deuteranopia) y 69.4 (protanopia). La auditoría de PR (`auditoria_ux_calles.html`) reportó 28/46/66/82/92, 77, 63 y 70. PR nunca publicó la distancia entre clases vecinas; esta es la primera medición.

**Texto sobre la rampa de prioridad:** oscuro (`--texto`) sobre las clases 1 a 3 y blanco sobre la 4 y la 5 (pares MC10–MC14).

**Rampa de verdor, aprobada por la Secretaría el 14 oct 2026** (`--rampa-verdor-1…5`: #EBF4E1, #B0D09C, #71A967, #3D7D47, #1A5030). Es la rampa «verde continuo» que la Secretaría eligió para GA el 14 oct 2026 (GA v31e). Va del verde pálido al verde bosque y cambia sobre todo de claridad, por eso conserva el orden con protanopia, deuteranopia y tritanopia. Cumple con las cuatro visiones (tabla de arriba): vecinas a 17.2 o más y extremos a 64.6 o más. Texto oscuro sobre las clases 1 a 3 (12.23, 8.14 y 4.99:1) y blanco sobre la 4 y la 5 (4.97 y 9.40:1), pares MC15–MC19. Con ella, «sin dato» pasa al gris medio de GA (#9A9A96, antes #DDDDD8): queda a ΔE 19.9 o más de todas las clases de las dos rampas, deja texto oscuro encima (4.90:1) y se distingue del suelo (2.57:1, MI07).

**Antes: el verdor anterior de GA no pasaba.** Medido con `rampas.mjs --candidata '#E3ECDF,#C3D9BC,#97BE8E,#6A9E62,#3E6B48'`:

| Visión | ΔE entre vecinas | Extremos | «Sin dato» a la clase más parecida |
|---|---|---|---|
| típica | 12.7 · 16.9 · 15.9 · 22.7 | 55.3 | 6.9 |
| protanopia | 10.9 · 14.7 · 14.5 · 22.6 | 51.7 | 5.8 |
| deuteranopia | 10.2 · 13.8 · 14.1 · 21.8 | 52.5 | 4.9 |
| tritanopia | 9.4 · 13.2 · 14.0 · 19.0 | 53.8 | 5.6 |

Las clases 1 y 2 quedaban por debajo de 15 aun con visión típica, y «sin dato» (#DDDDD8) quedaba casi igual a la clase 1. Además, sobre la clase 4 ningún texto de formularios llegaba a 4.5:1 (oscuro 4.40, blanco 3.14). Por eso no entró a `tokens-mapa.css`; la guía visual lo muestra junto a la rampa nueva para que se vea la diferencia.

**«Sin dato» y las rampas:** no hay criterio para su distancia a la clase más parecida; se anota. Con #9A9A96 queda a 30.2 o más de la prioridad y a 19.9 o más del verdor; con el gris anterior (#DDDDD8) quedaba a 11.5 de la prioridad con tritanopia y a 7.7 de la clase 1 del verdor.

## 6. Contraste medido sobre cada fondo real (GEO-69)

Cada par se mide con la fórmula de WCAG 2.2 sobre el fondo donde de verdad se pinta. Texto: 4.5:1. Líneas, puntos, aros y foco: 3:1. Solo están los pares del mapa: los de texto y botones sobre tarjeta y página ya los mide formularios. La tabla se genera con `node herramientas/contraste.mjs --md`; no se edita a mano. «Informativo» = se anota y no se exige; «pendiente de decisión» = se exige, hoy no cumple y espera la decisión de la Secretaría.

<!-- contraste:inicio -->
| Id | Tema | Primer plano | Fondo | Razón | Mínimo | Resultado | Dónde |
|---|---|---|---|---|---|---|---|
| MC01 | institucional | `--mapa-nombre-fuerte` #2B2D2E | `--mapa-suelo` #F5F4F1 | 12.58:1 | 4.5:1 | cumple | Nombre de alcaldía sobre el suelo |
| MC02 | institucional | `--mapa-nombre` #55585A | `--mapa-suelo` #F5F4F1 | 6.52:1 | 4.5:1 | cumple | Nombre de colonia o de calle sobre el suelo |
| MC03 | institucional | `--mapa-nombre` #55585A | `--mapa-manzana` #DAD6CD | 4.94:1 | 4.5:1 | cumple | Nombre sobre una manzana |
| MC04 | institucional | `--mapa-nombre` #55585A | `--mapa-verde` #D9EAD0 | 5.68:1 | 4.5:1 | cumple | Nombre sobre un área verde |
| MC05 | institucional | `--mapa-nombre` #55585A | `--mapa-agua` #BCD7E6 | 4.78:1 | 4.5:1 | cumple | Nombre sobre agua |
| MC06 | institucional | `--mapa-nombre` #55585A | `--mapa-halo` #FFFFFF | 7.17:1 | 4.5:1 | cumple | Nombre contra su propio contorno (vale sobre la rampa y la satelital) |
| MC07 | institucional | `--mapa-credito` #55585A | `--mapa-credito-bg` #FFFFFF | 7.17:1 | 4.5:1 | cumple | Crédito del mapa |
| MC08 | institucional | `--azul` #1A56A8 | `--mapa-credito-bg` #FFFFFF | 7.14:1 | 4.5:1 | cumple | Enlace dentro del crédito (el azul de Leaflet daba 2.55:1, PL) |
| MC09 | institucional | `--texto` #2B2D2E | `--blanco` #FFFFFF | 13.84:1 | 4.5:1 | cumple | Flecha y letra N del norte sobre su fondo blanco (GEO-36) |
| MC10 | institucional | `--texto` #2B2D2E | `--rampa-prioridad-1` #F9E7BF | 11.34:1 | 4.5:1 | cumple | Cifra sobre la clase 1 de prioridad |
| MC11 | institucional | `--texto` #2B2D2E | `--rampa-prioridad-2` #F4C56E | 8.60:1 | 4.5:1 | cumple | Cifra sobre la clase 2 de prioridad |
| MC12 | institucional | `--texto` #2B2D2E | `--rampa-prioridad-3` #E88A2E | 5.34:1 | 4.5:1 | cumple | Cifra sobre la clase 3 de prioridad: último tono con texto oscuro |
| MC13 | institucional | `--blanco` #FFFFFF | `--rampa-prioridad-4` #C2421B | 5.14:1 | 4.5:1 | cumple | Cifra sobre la clase 4 de prioridad: desde aquí, blanco |
| MC14 | institucional | `--blanco` #FFFFFF | `--rampa-prioridad-5` #7F1D12 | 10.06:1 | 4.5:1 | cumple | Cifra sobre la clase 5 de prioridad |
| MC15 | institucional | `--texto` #2B2D2E | `--rampa-verdor-1` #EBF4E1 | 12.23:1 | 4.5:1 | cumple | Rampa de verdor: cifra sobre la clase 1 |
| MC16 | institucional | `--texto` #2B2D2E | `--rampa-verdor-2` #B0D09C | 8.14:1 | 4.5:1 | cumple | Rampa de verdor: cifra sobre la clase 2 |
| MC17 | institucional | `--texto` #2B2D2E | `--rampa-verdor-3` #71A967 | 4.99:1 | 4.5:1 | cumple | Rampa de verdor: cifra sobre la clase 3, último tono con texto oscuro |
| MC18 | institucional | `--blanco` #FFFFFF | `--rampa-verdor-4` #3D7D47 | 4.97:1 | 4.5:1 | cumple | Rampa de verdor: cifra sobre la clase 4, desde aquí blanco |
| MC19 | institucional | `--blanco` #FFFFFF | `--rampa-verdor-5` #1A5030 | 9.40:1 | 4.5:1 | cumple | Rampa de verdor: cifra sobre la clase 5 |
| MC20 | institucional | `--tema-marca` #9D2148 | `--blanco` #FFFFFF | 7.65:1 | 4.5:1 | cumple | Tema institucional: título de marca sobre tarjeta |
| MC21 | institucional | `--tema-marca` #9D2148 | `--tema-marca-cl` #F7F1F3 | 6.86:1 | 4.5:1 | cumple | Tema institucional: marca sobre su fondo tenue |
| MC22 | institucional | `--tema-ficha-texto` #2B2D2E | `--tema-ficha` #FFFFFF | 13.84:1 | 4.5:1 | cumple | Tema institucional: texto de la ficha |
| MC23 | institucional | `--azul` #1A56A8 | `--tema-ficha` #FFFFFF | 7.14:1 | 4.5:1 | cumple | Tema institucional: enlace dentro de la ficha |
| MC24 | hoja | `--tema-marca` #1F5E46 | `--blanco` #FFFFFF | 7.64:1 | 4.5:1 | cumple | Tema hoja (GA): título de marca sobre tarjeta |
| MC25 | hoja | `--tema-marca` #1F5E46 | `--tema-marca-cl` #EEF4EF | 6.85:1 | 4.5:1 | cumple | Tema hoja (GA): marca sobre su fondo tenue |
| MC26 | hoja | `--tema-ficha-texto` #173B2E | `--tema-ficha` #EEF4EF | 11.06:1 | 4.5:1 | cumple | Tema hoja (GA): texto de la ficha |
| MC27 | hoja | `--azul` #1A56A8 | `--tema-ficha` #EEF4EF | 6.40:1 | 4.5:1 | cumple | Tema hoja (GA): enlace dentro de la ficha, que es clara (D11; antes de la decisión, la ficha oscura daba 1.73:1) |
| MC28 | jacaranda | `--tema-marca` #8D4992 | `--blanco` #FFFFFF | 6.00:1 | 4.5:1 | cumple | Tema jacarandá (AP): título de marca sobre tarjeta |
| MC29 | jacaranda | `--tema-marca` #8D4992 | `--tema-marca-cl` #FEF7E4 | 5.61:1 | 4.5:1 | cumple | Tema jacarandá (AP): marca sobre su fondo tenue |
| MC30 | jacaranda | `--tema-ficha-texto` #2A1630 | `--tema-ficha` #FEF7E4 | 15.64:1 | 4.5:1 | cumple | Tema jacarandá (AP): texto de la ficha |
| MC31 | jacaranda | `--azul` #1A56A8 | `--tema-ficha` #FEF7E4 | 6.68:1 | 4.5:1 | cumple | Tema jacarandá (AP): enlace dentro de la ficha |
| MC32 | crema | `--tema-marca` #9D2148 | `--tema-marca-cl` #FFFDF0 | 7.49:1 | 4.5:1 | cumple | Tema crema (CP): marca sobre su fondo tenue |
| MC33 | crema | `--tema-ficha-texto` #2B2D2E | `--tema-ficha` #FFFDF0 | 13.55:1 | 4.5:1 | cumple | Tema crema (CP): texto de la ficha |
| MC34 | crema | `--azul` #1A56A8 | `--tema-ficha` #FFFDF0 | 6.99:1 | 4.5:1 | cumple | Tema crema (CP): enlace dentro de la ficha |
| MC35 | institucional | `--tema-marca` #9D2148 | `--tema-ficha` #FFFFFF | 7.65:1 | 4.5:1 | cumple | Tema institucional: título de marca y franja del borde sobre la ficha (D11) |
| MC36 | hoja | `--tema-marca` #1F5E46 | `--tema-ficha` #EEF4EF | 6.85:1 | 4.5:1 | cumple | Tema hoja (GA): título de marca y franja del borde sobre la ficha (D11) |
| MC37 | jacaranda | `--tema-marca` #8D4992 | `--tema-ficha` #FEF7E4 | 5.61:1 | 4.5:1 | cumple | Tema jacarandá (AP): título de marca y franja del borde sobre la ficha (D11) |
| MC38 | crema | `--tema-marca` #9D2148 | `--tema-ficha` #FFFDF0 | 7.49:1 | 4.5:1 | cumple | Tema crema (CP): título de marca y franja del borde sobre la ficha (D11) |
| MC39 | institucional | `--mapa-nombre` #55585A | `--mapa-bg` #E8EAEC | 5.94:1 | 4.5:1 | cumple | Sin mapa base: nombre sobre el gris de formularios (FRM-50, GEO-75) |
| MN01 | institucional | `--mapa-limite-alcaldia` #2B2D2E | `--mapa-halo` #FFFFFF | 13.84:1 | 3:1 | cumple | Límite de alcaldía sobre su franja blanca |
| MN02 | institucional | `--mapa-limite-colonia` #55585A | `--mapa-halo` #FFFFFF | 7.17:1 | 3:1 | cumple | Límite de colonia sobre su franja blanca |
| MN18 | institucional | `--mapa-elegido` #1A56A8 | `--mapa-halo` #FFFFFF | 7.14:1 | 3:1 | cumple | Contorno de lo elegido sobre su franja blanca: vale sobre la rampa y la satelital (GEO-77) |
| MN03 | institucional | `--mapa-elegido` #1A56A8 | `--mapa-suelo` #F5F4F1 | 6.49:1 | 3:1 | cumple | Contorno de lo elegido sobre el suelo |
| MN04 | institucional | `--mapa-elegido` #1A56A8 | `--mapa-manzana` #DAD6CD | 4.92:1 | 3:1 | cumple | Contorno de lo elegido sobre una manzana |
| MN05 | institucional | `--mapa-elegido` #1A56A8 | `--mapa-verde` #D9EAD0 | 5.66:1 | 3:1 | cumple | Contorno de lo elegido sobre un área verde |
| MN06 | institucional | `--mapa-elegido` #1A56A8 | `--mapa-agua` #BCD7E6 | 4.76:1 | 3:1 | cumple | Contorno de lo elegido sobre agua |
| MN07 | institucional | `--mapa-aro` #2B2D2E | `--mapa-suelo` #F5F4F1 | 12.58:1 | 3:1 | cumple | Aro oscuro de un punto sobre el suelo |
| MN08 | institucional | `--mapa-aro` #2B2D2E | `--mapa-manzana` #DAD6CD | 9.54:1 | 3:1 | cumple | Aro oscuro de un punto sobre una manzana (aro blanco: 2.3:1, GA v28i) |
| MN09 | institucional | `--mapa-aro` #2B2D2E | `--mapa-verde` #D9EAD0 | 10.96:1 | 3:1 | cumple | Aro oscuro de un punto sobre un área verde |
| MN10 | institucional | `--mapa-aro` #2B2D2E | `--mapa-agua` #BCD7E6 | 9.23:1 | 3:1 | cumple | Aro oscuro de un punto sobre agua |
| MN11 | institucional | `--mapa-ubicacion` #1A73E8 | `--mapa-halo` #FFFFFF | 4.51:1 | 3:1 | cumple | Punto de «mi ubicación» contra su borde blanco |
| MN12 | institucional | `--mapa-buscado` #9D2148 | `--mapa-halo` #FFFFFF | 7.65:1 | 3:1 | cumple | Marcador del lugar buscado contra su borde blanco |
| MN13 | institucional | `--foco` #1A73C7 | `--mapa-halo` #FFFFFF | 4.86:1 | 3:1 | cumple | Anillo de foco contra su propio halo blanco (D3): se sostiene sobre cualquier fondo |
| MN15 | institucional | `--foco` #1A73C7 | `--mapa-suelo` #F5F4F1 | 4.42:1 | 3:1 | cumple | Anillo de foco sobre el suelo del mapa |
| MN16 | institucional | `--foco` #1A73C7 | `--mapa-manzana` #DAD6CD | 3.35:1 | 3:1 | cumple | Anillo de foco sobre una manzana |
| MN17 | institucional | `--foco` #1A73C7 | `--mapa-agua` #BCD7E6 | 3.24:1 | 3:1 | cumple | Anillo de foco sobre agua |
| MN19 | institucional | `--blanco` #FFFFFF | `--rampa-prioridad-5` #7F1D12 | 10.06:1 | 3:1 | cumple | El halo blanco del foco sobre la clase más oscura de la rampa: lo que sostiene el foco sobre lo oscuro |
| MN20 | institucional | `--mapa-elegido` #1A56A8 | `--mapa-bg` #E8EAEC | 5.92:1 | 3:1 | cumple | Sin mapa base: contorno de lo elegido |
| MN21 | institucional | `--mapa-aro` #2B2D2E | `--mapa-bg` #E8EAEC | 11.47:1 | 3:1 | cumple | Sin mapa base: aro oscuro de un punto |
| MN22 | institucional | `--foco` #1A73C7 | `--mapa-bg` #E8EAEC | 4.03:1 | 3:1 | cumple | Sin mapa base: anillo de foco |
| MN23 | institucional | `--azul` #1A56A8 | `--blanco` #FFFFFF | 7.14:1 | 3:1 | cumple | Botón del deslizador de opacidad sobre el menú de capas (GEO-33) |
| MN24 | institucional | `--borde` #878B8E | `--blanco` #FFFFFF | 3.43:1 | 3:1 | cumple | Barra del deslizador de opacidad sobre el menú de capas (GEO-33) |
| MI03 | institucional | `--mapa-ubicacion` #1A73E8 | `--foco` #1A73C7 | 1.08:1 | — | informativo | «Mi ubicación» y el foco son casi el mismo azul (GA, PR). No se confunden porque uno es un punto lleno y el otro un anillo; D12: se quedan los dos |
| MI09 | institucional | `--mapa-elegido` #1A56A8 | `--rampa-prioridad-4` #C2421B | 1.39:1 | — | informativo | Por qué lo elegido lleva franja: sin ella, el azul da 2.76:1 sobre la clase 3, 1.39:1 sobre la 4 y 1.41:1 sobre la 5 |
| MI04 | institucional | `--mapa-resalte` #B28E5C | `--mapa-suelo` #F5F4F1 | 2.76:1 | — | informativo | Resalte dorado al pasar el puntero: estado pasajero, no lo único que dice qué se señala |
| MI05 | institucional | `--mapa-manzana` #DAD6CD | `--mapa-suelo` #F5F4F1 | 1.32:1 | — | informativo | Manzana contra suelo: se distinguen poco a propósito; el fondo no compite con los datos |
| MI06 | institucional | `--rampa-prioridad-1` #F9E7BF | `--mapa-suelo` #F5F4F1 | 1.11:1 | — | informativo | Clase 1 de prioridad contra el suelo: casi igual; el área se lee por su límite, no por el relleno |
| MI07 | institucional | `--mapa-sin-dato` #9A9A96 | `--mapa-suelo` #F5F4F1 | 2.57:1 | — | informativo | «Sin dato» contra el suelo |
| MI10 | institucional | `--foco` #1A73C7 | `--rampa-prioridad-5` #7F1D12 | 2.07:1 | — | informativo | El azul del foco solo no se ve sobre la clase más oscura de la rampa; lo sostiene el halo blanco (MN19) |
| MI11 | institucional | `--rampa-verdor-1` #EBF4E1 | `--mapa-suelo` #F5F4F1 | 1.03:1 | — | informativo | Rampa de verdor: clase 1 contra el suelo, casi igual; el área se lee por su límite, no por el relleno |
<!-- contraste:fin -->

Para agregar un par: editar `herramientas/pares-contraste.json` y correr `node herramientas/contraste.mjs --guia` (regenera `guia-visual/pares.js`) y `node herramientas/generar-reglas.mjs`.

## 7. Foco de dos tonos (D3, GEO-58)

Formularios dibuja el anillo azul (`--foco`, 3 px) separado 2 px del control. Geovisores llena esa separación con blanco (`armazon.css`):

```css
:focus-visible,[data-demo-foco]{box-shadow:0 0 0 var(--foco-sep) var(--blanco)}
```

El anillo queda azul por fuera y blanco por dentro, y los dos tonos contrastan entre sí 4.86:1 (MN13). Así se sostiene sobre cualquier fondo: el azul se ve sobre lo claro (suelo 4.42, manzana 3.35, agua 3.24) y el blanco sobre lo oscuro (clase 5 de la prioridad 10.06, MN19; el azul solo da 2.07, MI10). Sin `!important` y sin `transition: all` (el auditor los rechaza).

## 8. Tema por visor (D4, GEO-70)

Un tema cambia cuatro tokens y nada más. El auditor rechaza un bloque `[data-tema]` que declare otro.

| Token | Institucional | Hoja (GA) | Jacarandá (AP) | Crema (CP) |
|---|---|---|---|---|
| `--tema-marca` | guinda #9D2148 | #1F5E46 | #8D4992 | guinda |
| `--tema-marca-cl` | #F7F1F3 | #EEF4EF | #FEF7E4 | #FFFDF0 |
| `--tema-ficha` | blanco | #EEF4EF | #FEF7E4 | #FFFDF0 |
| `--tema-ficha-texto` | `--texto` | #173B2E | #2A1630 | `--texto` |

**La ficha es siempre clara (D11, decisión de la Secretaría, 14 oct 2026).** La ficha oscura de GA (#173B2E) no admitía el azul de lo tocable: un enlace azul sobre ella daba 1.73:1 (MC27). Había dos salidas: fichas de tema siempre claras, o lo tocable en blanco subrayado dentro de una ficha oscura; la Secretaría eligió la primera, para que lo tocable sea azul en todos los visores (D2). Por eso:

- `--tema-ficha` es un fondo claro donde el azul de lo tocable llega a 4.5:1 (MC23, MC27, MC31, MC34) y `--tema-ficha-texto` es oscuro (MC22, MC26, MC30, MC33).
- El color de marca va en el título de la ficha y en una franja de su borde, donde llega a 4.5:1 sobre ella (MC35 a MC38).
- El tema hoja toma su verde tenue como ficha y el verde noche de GA como texto: el enlace da 6.40:1.
- `npm run verificar` exige esos dos pares (azul y marca sobre la ficha) para cada tema de `temas.css`: un tema nuevo sin ellos, o con una ficha oscura, no pasa.

## 9. Medidas del mapa

| Token | Valor | Uso | Origen |
|---|---|---|---|
| `--ctrl-mapa` | 34 px | Botón del mapa con ratón; con el dedo, `--objetivo-min` (44) | PR, CP (GA: 44 siempre) |
| `--ctrl-mapa-icono` | 20 px | Ícono de línea | GA |
| `--ctrl-mapa-trazo` | 1.75 | Grosor del trazo del ícono | GA |
| `--panel-ancho` | 400 px | Panel desde 1024 px | GA (PR: 392) |
| `--panel-ancho-medio` | 320 px | Panel de 760 a 1023 px | D5 |
| `--ficha-ancho` | 350 px | Tarjeta de la ficha en computadora | GA (PR: 300) |
| `--cajon-ancho` | min(580px, 94vw) | Cajón lateral para fichas largas | CP |
| `--simbologia-ancho-max` | 268 px | Simbología | PR |
| `--deslizador-barra` | 8 px | Opacidad: barra | PL D265 |
| `--deslizador-boton` | 28 px | Opacidad: botón (área táctil: 44) | PL D265 |
| `--alto`, `--vvh` | escritos por JS | Alto real del teléfono | GA v29c |

Márgenes del mapa: `--e-4` (16 px) en computadora y `--e-3` (12 px) en el celular, de la escala de formularios; GA y PR usaban 10 px en el celular, que no está en la escala.

## 10. Capas de apilamiento (GEO-72)

El contenedor del mapa lleva `isolation: isolate`. Encima, en este orden:

| Token | Valor | Qué va |
|---|---|---|
| `--z-mapa-simbologia` | 5 | Simbología, escala y crédito |
| `--z-mapa-control` | 6 | Columna de botones y tarjeta del lugar |
| `--z-pantalla` | 7 | Pantalla de información en el celular |
| `--z-cargando` | 8 | Aviso de carga |
| `--z-ficha` | 9 | Ficha |
| `--z-aviso` | 10 | Avisos |
| `--z-lista` (formularios) | 30 | Listas desplegables del buscador |

Las ventanas son `<dialog>` nativo: viven en la capa superior del navegador y no necesitan número.

## 11. Cortes de ancho (D5, GEO-21)

`min-width` 560, 760 y 1024. Debajo de 760, dos pantallas (visor de consulta); de 760 a 1023, panel de 320; desde 1024, panel de 400. El teléfono acostado (844 × 390) cae en el tramo de 760.

Son los mismos tres cortes de formularios (`--bp-sm`, `--bp-md`, `--bp-lg`), también solo con `min-width`: a cualquier ancho, el formulario y el mapa cambian de acomodo en el mismo punto.

## 12. Al migrar un visor de origen

Lo que cambia en cada proyecto al adoptar el estándar, según lo medido:

| Proyecto | Cambia |
|---|---|
| GA | Foco verde → azul de dos tonos; límites y nombres verdes → neutros de formularios; la selección guinda pasa a azul; el crédito ya no se oculta con la ficha ni en el celular (GEO-37); la ficha oscura pasa a clara (D11); su verdor v31e es el que el estándar propone |
| PR | Foco guinda oscuro (#5A1029) → azul; manzana #E2DED6 → #DAD6CD; la selección pizarra pasa a azul; quita su `!important` del foco |
| PL | Acción azul → guinda (D2); cortes 480/700/1024 → 560/760/1024; `--alto-visible` → `--vvh` |
| CP | Google Fonts → letras alojadas; letra de Leaflet sobrescrita; `transition: all` fuera de sus chips; tres puntos de «estás aquí» distintos → uno; cortes 760/1200 → 560/760/1024 |
| AP | Botones de 30 px → 34/44; foco dorado → azul; identidad tipográfica propia anotada como desviación (GEO-71) |
