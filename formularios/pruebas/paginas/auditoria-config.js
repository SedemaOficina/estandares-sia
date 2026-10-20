/* Configuración de la página de prueba de la auditoría del 19 oct 2026.
   Con ?omision se usa el envío por omisión del núcleo (POST JSON a action);
   con ?nulo, el envío propio responde null; con ?alEnviarFalla, lo que la
   página hace después de un envío recibido lanza un error. */
(function () {
  const q = new URLSearchParams(location.search);
  const opciones = {};
  if (!q.has('omision')) {
    opciones.enviar = (payload) => {
      window.__envios = (window.__envios || []).concat([JSON.parse(JSON.stringify({ datos: payload.datos, meta: payload.meta }))]);
      return Promise.resolve(q.has('nulo') ? null : { folio: `PRUEBA-${window.__envios.length}`, fecha: new Date().toISOString() });
    };
  }
  if (q.has('alEnviarFalla')) opciones.alEnviar = () => { throw new Error('falla de la página'); };
  window.FORMKIT_OPCIONES = opciones;
}());
