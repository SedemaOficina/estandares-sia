# Estándares del Sistema de Información Ambiental (SIA)

Estándares de diseño y construcción de **formularios web** y **visores de mapas** de la Secretaría del Medio Ambiente de la Ciudad de México (SEDEMA), a cargo del Sistema de Información Ambiental (SIA). Dicen cómo se ve cada pieza, cómo se comporta, por qué es así y cómo se comprueba que cumple, para que todos los sitios de la Secretaría sean iguales entre sí, accesibles y funcionen en teléfono y en escritorio.

Los dos estándares viven juntos porque comparten lo mismo: colores, letra, botones, avisos, foco y anchos de pantalla. El de mapas toma todo eso del de formularios, sin copiarlo.

| Estándar | Versión | Estado |
|---|---|---|
| [Formularios](formularios/README.md) | 1.3.3 | En uso |
| [Geovisores (mapas)](geovisores/README.md) | 0.1.2 | Fase 1: reglas, estilo y tokens, en revisión |

## Ver la guía visual

La guía visual muestra cada pieza viva, con el código para copiar. No hace falta saber programar para leerla.

- **Sin instalar nada:** abre `guia-visual/index.html` con doble clic.
- **Con un servidor local** (Node.js 22 o más), desde esta carpeta:

  ```bash
  npm run guia
  ```

  y abre http://127.0.0.1:8090/

La portada pregunta «¿Qué vas a construir?» y lleva a la guía de formularios o a la de mapas. Desde cualquiera de las dos se regresa a la portada.

## Qué hay en este repositorio

| Carpeta | Qué contiene |
|---|---|
| `guia-visual/` | Portada común: qué vas a construir, lo que comparten los dos estándares y la lista de pendientes (`pendientes.js`). |
| `formularios/` | Estándar de formularios: reglas FRM, núcleo y módulos, bloques listos (identificación, domicilio, edad, redes sociales), plantillas, validador para el servidor, guía visual, pruebas y capturas de verificación. |
| `geovisores/` | Estándar de visores de mapas: reglas GEO, tokens y temas del mapa, rampas de datos probadas para daltonismo, mapas base, guía visual. |
| `herramientas/` | `verificar.mjs`: revisa los dos estándares y la portada con un solo veredicto. |

Cada estándar tiene su `README.md` (cómo usarlo), su `CHANGELOG.md` (qué cambió y por qué), sus documentos en `docs/` y sus reglas en `reglas/reglas.json`.

## Requisitos

- **Para usar los estándares en un sitio:** nada. Son HTML, CSS y JavaScript sin dependencias, sin CDN y sin llamadas a terceros.
- **Para las herramientas de verificación:** [Node.js](https://nodejs.org/) 22 o más.
- **Para las pruebas en navegador de formularios:** además, `npm install` dentro de `formularios/` (instala Playwright y axe-core) y el navegador Chromium de Playwright.

## Inicio rápido

### Un formulario nuevo

1. En la guía de formularios, sección «¿Qué necesito?», marca lo que tu formulario pide: la guía te dice qué archivos copiar y en qué orden.
2. Copia `formularios/codigo/` a tu proyecto, o sólo el núcleo y los módulos que te indicó la guía.
3. Parte de una plantilla (`codigo/plantillas/por-pasos.html` o `una-pagina.html`) y de los bloques listos de la guía. Cada pregunta declara para qué se pide el dato (`data-uso`) y, si es dato personal, su finalidad (`data-finalidad`).
4. Valida también en el servidor, con las mismas reglas: genera el esquema desde tu HTML y usa `codigo/servidor/validar.mjs`.
5. Antes de liberar, sigue la lista de `formularios/docs/08-verificacion-y-cierre.md`.

Detalle completo: [`formularios/README.md`](formularios/README.md).

### Un visor de mapas

La fase 1 entrega las reglas, el estilo y los tokens del mapa; el armazón y las plantillas llegan en la fase 2. Para decidir el tipo de visor, el motor, el mapa base y los módulos, usa [`geovisores/docs/03-guia-de-decision.md`](geovisores/docs/03-guia-de-decision.md). Detalle: [`geovisores/README.md`](geovisores/README.md).

## Cómo se comprueba que todo cumple

Desde esta carpeta, sin instalar nada:

```bash
npm run verificar
```

Revisa colores y contraste, reglas y documentos generados, el CSS y las guías de los dos estándares. Si al final dice **CORRECTO**, están en orden.

Las pruebas en navegador de formularios (flujos completos en teléfono y escritorio, siete anchos de pantalla, accesibilidad con axe-core y el validador del servidor) se corren dentro de `formularios/`:

```bash
npm install
```

```bash
npm run verificar
```

Lo que una máquina no puede comprobar (un teléfono real, un lector de pantalla, Firefox y Safari) está en `formularios/docs/08-verificacion-y-cierre.md`.

## Cómo se cambia un estándar

1. **Una regla sólo cambia con una decisión registrada** de la persona responsable de los estándares.
2. Se edita la fuente, nunca lo generado. Las fuentes son `reglas/reglas.json`, los tokens CSS, los módulos y `codigo/manifiesto.json`. Lo generado es `docs/01-reglas.md`, `formularios/docs/04-catalogo-de-componentes.md`, `formularios/dist/`, `guia-visual/manifiesto.js`, `pares.js` y `artefacto.html`.
3. Se regenera lo derivado:
   - En `formularios/`, `npm run construir`; para publicar la guía autocontenida, `npm run artefacto`.
   - En `geovisores/`, `npm run generar`.
4. Se anota en el `CHANGELOG.md` del estándar, en la sección «Sin publicar».
5. `npm run verificar` debe terminar en **CORRECTO**.

Reglas de redacción: español de México, claro y sin tecnicismos en lo que lee la gente; las acciones se atribuyen a «la Secretaría»; ninguna cita de ley sin verificar (se deja `[Art. __, fracc. __]`); los datos de ejemplo siempre son ficticios.

## Versiones

Cada estándar lleva su propia versión, con la forma MAYOR.MENOR.PARCHE, en su `package.json` y en su `CHANGELOG.md`. Lo que todavía no se publica se acumula en la sección «Sin publicar» del CHANGELOG y recibe número al publicarse.

## Pendientes

Lo que falta decidir o terminar está en la portada de la guía, sección «Pendientes». La lista vive en [`guia-visual/pendientes.js`](guia-visual/pendientes.js) y la guía de formularios muestra la misma, filtrada. Cuando algo se resuelve, sale de la lista y queda en el CHANGELOG.

## Datos personales y privacidad

- Los formularios declaran por qué piden cada dato y para qué se usa. Los datos sensibles nunca se guardan en el borrador del dispositivo.
- Todos los datos de ejemplo son ficticios, incluida la CURP de prueba. El catálogo de colonias incluido también es ficticio: el oficial lo construye el SIA y se publicará en su GeoServer.
- Los avisos de privacidad de las plantillas llevan su fundamento legal como `[Art. __, fracc. __]`, para que lo complete la Unidad de Transparencia de la Secretaría antes de usarlos en producción.

## Licencias

- **Código y documentación de este repositorio:** pendiente de decisión de la Secretaría. Todavía no hay archivo `LICENSE`.
- **Componentes de terceros incluidos**, cada uno con su licencia junto a sus archivos:

  | Componente | Versión | Licencia | Para qué |
  |---|---|---|---|
  | Leaflet | 1.9.4 | BSD-2-Clause | Mapa de ubicación de formularios |
  | leaflet-gesture-handling | 1.2.2 | MIT | Que el mapa no atrape el desplazamiento en el teléfono |
  | axe-core | 4.13.0 | MPL-2.0 | Sólo para las pruebas de accesibilidad |
  | Roboto y Cabin | — | SIL Open Font License 1.1 | Tipografías |

- **Logotipo y marcas:** el logotipo del Gobierno de la Ciudad de México y de la Secretaría es de uso institucional. Las marcas de redes sociales pertenecen a sus dueños y sólo se usan para enlazar a las cuentas oficiales de la Secretaría.

## Contacto

Sistema de Información Ambiental (SIA), Secretaría del Medio Ambiente de la Ciudad de México. Responsable de los estándares: la Oficina de la Secretaría.
