/* =========================================================
   configuracion-una-pagina.js · Ajustes de ESTA plantilla
   Se carga antes que el núcleo. Sólo lo que cambia respecto a la
   configuración única; aquí, cómo se envía (simulación).
   ========================================================= */
window.FORMKIT_CONFIG = {};
window.FORMKIT_OPCIONES = {
  enviar(payload, { signal }) {
    const modo = new URLSearchParams(location.search).get('simular');
    return new Promise((ok, mal) => {
      const t = setTimeout(() => {
        if (modo === 'limite') return mal({ limite: true });
        if (modo === 'error') return mal(new Error('simulado'));
        ok({ folio: `REG-${Date.now().toString(36).toUpperCase()}`, fecha: new Date().toISOString() });
      }, modo === 'lento' ? 20000 : 400);
      signal.addEventListener('abort', () => { clearTimeout(t); mal(new Error('plazo')); });
    });
  }
};
