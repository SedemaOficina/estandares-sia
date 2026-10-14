/* =========================================================
   cdmx-ejemplo.js · Catálogo FICTICIO alcaldía → colonia → código postal

   Sirve sólo para la guía visual, las plantillas y las pruebas. Los nombres
   de colonia son inventados; los códigos postales caen en el rango de cada
   alcaldía pero NO corresponden a colonias reales. Un formulario de
   producción sustituye este archivo por una copia derivada del catálogo
   oficial, con fuente, fecha de corte y procedimiento de actualización
   documentados en codigo/catalogos/LEEME.md:
       Fuente oficial: [Fuente: __]   Fecha de corte: [__]
   Estructura de cada fila: {alcaldia, colonia, cp}. Un mismo cp puede
   abarcar varias colonias y una colonia varios cp (el módulo lo contempla).
   ========================================================= */
globalThis.FORMKIT_CATALOGOS = globalThis.FORMKIT_CATALOGOS || {};
globalThis.FORMKIT_CATALOGOS.cdmx = {
  es_ficticio: true,
  fuente: '[Fuente: __]',
  corte: '[__]',
  filas: [
    { alcaldia: 'Álvaro Obregón', colonia: 'Colonia de Prueba Uno', cp: '01000' },
    { alcaldia: 'Álvaro Obregón', colonia: 'Colonia de Prueba Dos', cp: '01010' },
    { alcaldia: 'Álvaro Obregón', colonia: 'Colonia de Prueba Tres', cp: '01010' },
    { alcaldia: 'Coyoacán', colonia: 'Jardín de Prueba', cp: '04000' },
    { alcaldia: 'Coyoacán', colonia: 'Villa de Prueba', cp: '04010' },
    { alcaldia: 'Coyoacán', colonia: 'Pedregal de Prueba', cp: '04500' },
    { alcaldia: 'Cuauhtémoc', colonia: 'Centro de Prueba', cp: '06000' },
    { alcaldia: 'Cuauhtémoc', colonia: 'Colonia Larga de Prueba con un Nombre que no Cabe en una Línea', cp: '06700' },
    { alcaldia: 'Iztapalapa', colonia: 'Barrio de Prueba', cp: '09000' },
    { alcaldia: 'Iztapalapa', colonia: 'Ampliación de Prueba', cp: '09000' },
    { alcaldia: 'Tlalpan', colonia: 'Bosque de Prueba', cp: '14000' },
    { alcaldia: 'Xochimilco', colonia: 'Pueblo de Prueba', cp: '16000' }
  ]
};
/* Lista plana de alcaldías para la lista desplegable con búsqueda. */
globalThis.FORMKIT_CATALOGOS.alcaldias = [...new Set(globalThis.FORMKIT_CATALOGOS.cdmx.filas.map((f) => f.alcaldia))].map((nombre) => ({ nombre, detalle: 'Alcaldía' }));
