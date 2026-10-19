/* =========================================================
   guia-config.js · Ajustes de la guía visual (se carga ANTES del núcleo)

   La guía usa el paquete tal cual: aquí sólo se declara lo que cualquier
   formulario declara en su configuracion-*.js: cómo se «envía» (simulado,
   nada sale del navegador), los catálogos de muestra y, si hubiera mapa
   base, su proveedor (no lo hay: el mapa se dibuja sin teselas a propósito
   para mostrar que el punto sigue pudiendo colocarse).
   Todos los datos son ficticios.
   ========================================================= */
window.FORMKIT_CONFIG = {
  /* Ajustes de ejemplo; vacíos a propósito: la guía muestra los valores de fábrica. */
};

window.FORMKIT_CATALOGOS = window.FORMKIT_CATALOGOS || {};
/* Catálogo corto para el combo que acepta valor libre (data-libre). */
window.FORMKIT_CATALOGOS.ocupaciones = [
  { nombre: 'Estudiante' },
  { nombre: 'Docente' },
  { nombre: 'Comerciante' },
  { nombre: 'Persona servidora pública' },
  { nombre: 'Agricultura', detalle: 'Campo, huerto o vivero' },
  { nombre: 'Construcción' },
  { nombre: 'Trabajo del hogar' },
  { nombre: 'Jubilada o pensionada' },
  { nombre: 'Profesional independiente' }
];

/* Envío simulado para las muestras que envían: responde con un folio
   ficticio tras una breve espera, igual que las plantillas. */
window.FORMKIT_OPCIONES = {
  enviar(payload, { signal }) {
    return new Promise((ok, mal) => {
      const t = setTimeout(() => ok({ folio: `GUIA-${Date.now().toString(36).toUpperCase()}`, fecha: new Date().toISOString() }), 400);
      signal.addEventListener('abort', () => { clearTimeout(t); mal(new Error('plazo')); });
    });
  }
};
