# Catálogos

Todo catálogo que alimente una lista desplegable o una cascada (alcaldía → colonia → código postal, entidad → municipio, tipos de trámite) viene de una **fuente oficial única y versionada**, nunca se escribe a mano en el código y lleva registrados:

| Dato | Dónde se declara |
|---|---|
| Fuente oficial (organismo y producto) | Cabecera del archivo del catálogo y esta tabla |
| Fecha de corte | `corte` dentro del catálogo |
| Procedimiento de actualización | Esta página |
| Marca de ficticio | `es_ficticio: true` mientras sea de prueba |

## Catálogos de este paquete

| Archivo | Contenido | Estado |
|---|---|---|
| `cdmx-ejemplo.js` | Alcaldía → colonia → código postal de la Ciudad de México | **FICTICIO.** Sólo para guía, plantillas y pruebas. El catálogo oficial lo está construyendo el SIA y se publicará en su GeoServer; cuando exista, se anotan aquí su dirección y su fecha de corte: `[Fuente: __]`, `[__]` |

## Procedimiento de actualización

1. Descargar el catálogo de la fuente oficial y anotar la fecha de corte.
2. Convertirlo a la estructura `{alcaldia, colonia, cp}` con el guion que el equipo defina (no editar la copia a mano; si el dato está mal, se corrige en el origen y se vuelve a derivar).
3. Normalizar acentos, mayúsculas y espacios dobles; conservar la clave estable de cada registro si la fuente la trae.
4. Sustituir `es_ficticio` por `false`, llenar `fuente` y `corte`.
5. Correr `npm run verificar`: la prueba «catálogo · cada fila completa…» de `pruebas/06-servidor-y-herramientas.prueba.mjs` exige que ninguna fila esté incompleta, que cada código postal tenga 5 dígitos y que el catálogo declare `es_ficticio`, `fuente` y `corte`. Si el formulario de un proyecto usa su propio catálogo, la misma revisión se corre sobre él con `node herramientas/comprobar-formulario.mjs` (`docs/08`).
6. Mientras el catálogo diga `es_ficticio: true`, una página que no se presente como de pruebas (sin la franja `.entorno-pruebas`) avisa en la consola que lleva un catálogo de ejemplo.
