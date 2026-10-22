# Cambios

## Sin publicar

- `herramientas/servir.mjs` (el servidor local de la guía común) sirve también `.pdf` y `.ttf`, para el visor de documentos de formularios 1.2.0.
- **Citas de formularios al día (auditoría del 19 oct 2026, D1-02).** Cuatro reglas citaban una regla de formularios con un sentido que formularios ya cambió: GEO-64 («Confirmar sólo lo que no se deshace o afecta a otra persona»: también lo que afecta a otra persona, con sus consecuencias y un botón que repite el verbo, como FRM-38; borrar sigue pidiendo escribir la palabra), GEO-111 (todo anuncio también se ve, FRM-40), GEO-55 (en una confirmación destructiva el único botón relleno es el rojo, FRM-34) y GEO-45 (las ligas las lee el módulo enlace-mapa; FRM-30 sólo valida coordenadas). El auditor de CSS ya no dice que revisa FRM-69.
- **Nadie se entera si formularios cambia una regla citada: ahora sí.** `herramientas/citas-formularios.mjs` guarda en `reglas/citas-formularios.json` una huella del título y el texto de cada una de las 20 reglas FRM que geovisores cita, y `verificar` falla si alguna cambió o si hay una cita nueva sin revisar. Después de revisar la cita: `node herramientas/citas-formularios.mjs --actualizar`.
- `herramientas/servir.mjs` contesta 400 a una dirección mal escrita («/%E0%A4%A»); antes se caía (auditoría, F2-14).
- Código muerto fuera del auditor de CSS (un primer conteo de niveles que no se usaba y una variable sin uso) (auditoría, A4-01).

## 0.1.2 · 14 oct 2026 · Fichas claras, rampa de verdor, norte, opacidad y mapas base

- **Decisión D12 (la Secretaría, 14 oct 2026, con la recomendación del estándar): «mi ubicación» y el foco conservan su azul.** Son casi el mismo azul (MI03, 1.08:1), pero se distinguen por la forma: punto lleno con borde blanco contra anillo de dos tonos. GEO-31 lo dice y el foco nunca se dibuja como punto lleno.
- **Decisión D11 (la Secretaría, 14 oct 2026): las fichas de tema son siempre claras.** Resuelve el pendiente MC27 (la ficha oscura del tema hoja dejaba el enlace azul a 1.73:1). El tema hoja pasa a ficha #EEF4EF con texto #173B2E (el verde noche de GA): el enlace da 6.40:1. La marca va en el título de la ficha y en la franja de su borde (pares nuevos MC35–MC38). GEO-70 lo dice y cita D11; `verificar` exige a cada tema de `temas.css` el azul y la marca a 4.5:1 sobre su ficha. El foco sobre lo oscuro se mide ahora sobre la clase 5 de la prioridad (MN19, MI10, en lugar de MN14 y MI08). Ya no queda ningún par pendiente de decisión.
- **Rampa de verdor, aprobada por la Secretaría** (14 oct 2026, con el «sin dato» nuevo) (`--rampa-verdor-1…5`: #EBF4E1 #B0D09C #71A967 #3D7D47 #1A5030), la «verde continuo» que la Secretaría eligió para GA (v31e). Cumple con las cuatro visiones: vecinas a 17.2 o más y extremos a 64.6 o más (Machado 2009, ΔE CIE76). Texto oscuro sobre las clases 1 a 3 y blanco sobre la 4 y la 5 (MC15–MC19). Con ella, «sin dato» pasa a #9A9A96, el de GA: a ΔE 19.9 o más de todas las clases de las dos rampas (con #DDDDD8 quedaba a 7.7 del verdor y a 11.5 de la prioridad).
- **Norte (GEO-36, pedido de la Secretaría al revisar la guía):** la regla decía «norte solo si el mapa gira»; ahora la flecha va junto a la escala, sobre fondo blanco, con la letra N y el nombre «Norte», y las dos se quitan en el celular, como en GA (v25d y v28j). Par MC09.
- **Opacidad (GEO-33, pedido de la Secretaría al revisar la guía):** la regla precisa el deslizador de la capa de datos: de 20 a 100 %, con su nombre y su valor escritos, barra de 8 px, botón de 28 y área de 44, y con teclado (PR v17.10, PL D265). Pares MN23 y MN24.
- **Mapas base (pedido de la Secretaría):** sección nueva en la guía visual y en `docs/02` (sección 3): diez opciones con quién las da, crédito, llave y límites, si llaman a otro servidor y qué dice el estándar; lo que no se pudo comprobar queda marcado como pendiente. GEO-74 apunta a esa lista. Pares nuevos para «sin mapa base»: MC39 y MN20–MN22.
- Guía visual: la muestra del mapa tiene norte, menú de capas (mapa base y opacidad), crédito que cambia con el mapa base y una tercera vista con la rampa de verdor; la capa de datos va encima del mapa base. Los mapas base distintos del fondo propio son dibujos con colores del estándar: la guía no pide teselas a ningún servidor. Temas con la ficha clara y su medición; rampas con la distancia de «sin dato» y el texto de cada clase; pares Sí/No del foco y de la ficha.
- Lenguaje genérico (pedido de la Secretaría): GEO-54 dice «en revisión» en lugar de «en trámite»; el caso de AP queda como su historia.
- `generar-reglas.mjs` toma la última decisión citada (D1 a Dn) de los orígenes.

## 0.1.1 · 14 oct 2026 · Junto a formularios, en `estandares-sia`

- Geovisores pasa a la carpeta común `estandares-sia/geovisores`, al lado de `formularios/` (decisión de la Secretaría, 14 oct 2026). Lee los tokens, letras, logotipo y reglas de `../formularios` directamente; la copia fija `vendor/estandar-formularios/` y `herramientas/formularios.mjs` se apartaron a `_to_delete/copia-formularios-en-geovisores_2026-10-14/`.
- **Corrección:** la 0.1.0 se armó sobre una copia vieja de formularios que estaba en la computadora (1 oct, 89 reglas sin nivel). La versión vigente es la de GitHub (2 oct, 81 reglas con nivel, 25 módulos). Con ella:
  - Las citas FRM-xx se reasignaron por significado a la numeración vigente; tres no tienen regla equivalente y se quitaron (foco visible y «un color, un trabajo» viven en la guía de estilo de formularios; el ámbito de la ciudad no tiene regla en formularios).
  - Los cortes 560, 760 y 1024 con `min-width` son los de formularios (`--bp-sm`, `--bp-md`, `--bp-lg`); el hallazgo de la 0.1.0 sobre `max-width` era de la copia vieja y se retira.
  - Los nombres del mapa vuelven a Roboto 500 (`--peso-medio`), como en GA y PR; la copia vieja no traía ese peso.
  - Las hojas de formularios ahora son `base.css` y `nucleo.css` (ya no existe `componentes.css`).
- La guía visual enlaza a la portada común `../../guia-visual/`.

## 0.1.0 · 14 oct 2026 · Fase 1 (reglas y estilo), en revisión

- `reglas/reglas.json`: 133 reglas GEO-01 a GEO-133 en 15 secciones, con nivel (BASE, RECOMENDADO, OPCIONAL), a qué tipo de visor aplican, historia y origen. Misma forma que las FRM, más `nivel` y `aplica`. No repiten formularios: lo citan (FRM-xx).
- `docs/01-reglas.md` generado; `docs/02-guia-de-estilo.md` y `docs/03-guia-de-decision.md`, con tablas generadas entre marcas.
- `codigo/css/tokens-mapa.css`: solo lo que formularios no tiene; los papeles que puede cubrir un color de formularios lo nombran con `var()`. `temas.css` con tres temas reales; `armazon.css` con el foco de dos tonos.
- `vendor/estandar-formularios/`: copia fija de formularios 1.0.0 con manifiesto de huellas.
- Herramientas: `contraste.mjs` (adaptada de formularios: varias hojas, temas y pares pendientes), `rampas.mjs` (nueva: daltonismo con Machado 2009 y ΔE CIE76; reproduce las cifras de la auditoría de PR), `auditor-css.mjs` (de formularios, más cortes solo con min-width, sin `transition: all`, temas de cuatro tokens y hover solo con puntero), `generar-reglas.mjs`, `formularios.mjs`, `servir.mjs` y `verificar.mjs`.
- Guía visual en vivo desde la fase 1 (pedido de la Secretaría): muestra del mapa, paleta, contraste, rampas con daltonismo, foco, nombres, medidas, capas, temas, estado de los componentes y pares Sí/No con su historia.

### Hallazgos de la medición

- La rampa de verdor de GA no pasa (vecinas a ΔE 9.4–12.7; «sin dato» a 5–7 de la clase 1): queda fuera de los tokens (en 0.1.2 entra la «verde continuo» de GA, aprobada por la Secretaría).
- Lo elegido en azul se pierde sobre las clases 3 a 5 de la prioridad (2.76, 1.39 y 1.41:1): se le agregó la franja blanca de los límites (GEO-77).
- La ficha oscura del tema hoja (GA) no admite el azul de lo tocable (1.73:1): pendiente de decisión (MC27; resuelto en 0.1.2 con D11).
- «Mi ubicación» (#1A73E8) y el foco (#1A73C7) son casi el mismo azul (1.08:1): anotado.
- ~~Formularios 1.0.0 tiene solo los cortes 560 y 760, escritos con `max-width`~~ (era la copia vieja; retirado en 0.1.1).
- Ningún proyecto midió contraste sobre la satelital ni sobre teselas claras; queda para la fase 2 una prueba con píxeles de teselas reales.
