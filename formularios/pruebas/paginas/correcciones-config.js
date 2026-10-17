/* Configuración de la página de prueba de las correcciones 1.1. */
window.FORMKIT_CONFIG = {
  /* El mínimo de años depende del nivel (P61). */
  limitesSegun: { experiencia: (datos) => (datos.nivel === 'avanzado' ? 5 : 2) },
  /* Un mensaje de formato cambiado a «usted» sólo con la configuración (P95). */
  mensajes: { fmtNumeroPaso: 'Use múltiplos de {paso}.' }
};
/* Catálogo con la forma documentada {filas, fuente, corte, es_ficticio} (P37). */
window.FORMKIT_CATALOGOS = { especies: { filas: ['Ahuehuete', 'Fresno', 'Jacaranda'], fuente: 'prueba', corte: '2026-10-16', es_ficticio: true } };
/* Envío simulado: si la prueba deja errores en window.__rechazo, el servidor los «devuelve». */
window.FORMKIT_OPCIONES = {
  enviar: (payload) => {
    window.__payload = JSON.parse(JSON.stringify({ datos: payload.datos }));
    /* «red»: una falla sin errores por campo, que se anuncia en el aviso de envío (P87). */
    if (window.__rechazo === 'red') return Promise.reject(new Error('red'));
    return window.__rechazo ? Promise.reject(Object.assign(new Error('rechazo'), { errores: window.__rechazo })) : Promise.resolve({ folio: 'PRUEBA-1' });
  }
};
