# Estándar de geovisores del SIA · v0.1.2 (fase 1)

Reglas, estilo y verificaciones para que los visores de mapas de la Secretaría del Medio Ambiente se construyan igual, con las trampas ya resueltas. Sale de lo que dejaron cinco proyectos con mapa (`docs/00-aprendizajes.md`) y toma colores, letra, medidas, foco y avisos del **Estándar de formularios del SIA**, que no redefine.

## Cómo usarlo

1. Ver la guía visual: `npm run guia` y abrir http://127.0.0.1:8090/ (o doble clic en `guia-visual/index.html`). Muestra el mapa pintado con los tokens (con norte, menú de capas, mapa base y opacidad), las opciones de mapa base, la paleta, el contraste medido sobre cada fondo, las rampas con daltonismo, el foco, los nombres, las medidas y los temas.
2. Decidir el visor con `docs/03-guia-de-decision.md`: tipo, motor, fondo, módulos, tema y trato.
3. Leer las reglas que le tocan en `docs/01-reglas.md`.
4. Antes de entregar un cambio al estándar: `npm run verificar` (Node 22 o más; sin dependencias en esta fase).

## Contenido

| Ruta | Qué es |
|---|---|
| `docs/00-aprendizajes.md` | Lo que dejaron GA, PR, PL, CP y AP, y las decisiones D1–D12 |
| `docs/01-reglas.md` | Reglas GEO-xx con nivel, a qué aplican, regla, por qué, origen y verificación (generado) |
| `docs/02-guia-de-estilo.md` | Lo propio del mapa: colores y su trabajo, fondo propio, nombres, rampas, contraste medido, foco, temas, medidas, capas, cortes |
| `docs/03-guia-de-decision.md` | Qué motor, qué patrón de celular, qué fondo y qué módulos según el tipo de visor |
| `docs/PROPUESTA.md` | Estructura del repositorio y fases |
| `reglas/reglas.json` | Fuente única de las reglas |
| `codigo/css/tokens-mapa.css` | Tokens del mapa; se carga después de `tokens.css` de formularios |
| `codigo/css/temas.css` | Tres temas de visores reales (hoja, jacarandá, crema) |
| `codigo/css/armazon.css` | Foco de dos tonos; el armazón llega en la fase 2 |
| `guia-visual/` | Guía visual en vivo |
| `herramientas/` | Contraste, rampas y daltonismo, auditor de CSS, generador de documentos, servidor local, verificación única |

## Cómo se actualiza

- **Una regla:** se edita `reglas/reglas.json` y se corre `npm run generar`. `docs/01` no se edita a mano.
- **Un color del mapa:** `codigo/css/tokens-mapa.css` y, si cambia un par, `herramientas/pares-contraste.json`; correr `node herramientas/contraste.mjs --guia` y `npm run generar`.
- **Una rampa nueva:** se mide primero con `node herramientas/rampas.mjs --candidata '#…,#…'`; entra a los tokens solo si cumple.
- **Formularios cambia:** no hay nada que copiar (geovisores lo lee de `../formularios`); basta `npm run verificar` en la raíz y revisar la guía visual. Si cambió una regla FRM que geovisores cita, `verificar` lo dice: se revisa la cita y se guarda con `node herramientas/citas-formularios.mjs --actualizar`.
- Todo cambio se anota en `CHANGELOG.md` y deja `npm run verificar` en verde.

## A quién consultar

La Oficina de la Secretaría, a través del Sistema de Información Ambiental (SIA). Una regla solo se modifica con una decisión explícita registrada.

## Estado

Fase 1 entregada para revisión de la Secretaría. La rampa de verdor ya está aprobada (`docs/02-guia-de-estilo.md`, sección 5). Lo que falta medir o verificar: `docs/02-guia-de-estilo.md` (secciones 3 y 5) y `CHANGELOG.md`.
