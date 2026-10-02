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
| `cdmx-ejemplo.js` | Alcaldía → colonia → código postal de la Ciudad de México | **FICTICIO.** Sólo para guía, plantillas y pruebas. Fuente oficial: `[Fuente: __]`. Fecha de corte: `[__]` |

## Procedimiento de actualización

1. Descargar el catálogo de la fuente oficial y anotar la fecha de corte.
2. Convertirlo a la estructura `{alcaldia, colonia, cp}` con el guion que el equipo defina (no editar la copia a mano; si el dato está mal, se corrige en el origen y se vuelve a derivar).
3. Normalizar acentos, mayúsculas y espacios dobles; conservar la clave estable de cada registro si la fuente la trae.
4. Sustituir `es_ficticio` por `false`, llenar `fuente` y `corte`.
5. Correr `npm run verificar`: la prueba de cascadas exige que cada código postal del catálogo tenga 5 dígitos y que ninguna fila esté incompleta.
