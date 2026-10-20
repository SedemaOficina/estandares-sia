/* =========================================================
   configuracion-por-pasos.js · Ajustes de ESTA plantilla

   Lo único que cambia de un formulario a otro vive aquí: qué sobrescribe
   de validaciones.config.js (FORMKIT_CONFIG) y cómo se envía
   (FORMKIT_OPCIONES). Patrones, mensajes y límites generales NO se tocan
   aquí: se heredan de la configuración única.

   Se carga ANTES que el núcleo. Para un formulario nuevo: copiar, cambiar
   la clave del borrador en el HTML, el proveedor del mapa y `enviar`.
   ========================================================= */
window.FORMKIT_CONFIG = {
  /* Mapa base: proveedor, licencia y atribución se declaran aquí, nunca en
     el código. Vacío = sin mosaicos (el punto se puede colocar igual).
     Antes de publicar: decidir proveedor y revisar sus condiciones de uso. */
  mapa: { teselas: '', atribucion: '', zoom: 11, centro: [19.4326, -99.1332] }
  /* Los límites de un campo de archivos van en su HTML (data-max="3", data-mb,
     data-total-mb): así los ve también el servidor. Aquí, sólo lo que cambie para
     todos los campos del formulario, por ejemplo archivos: { mb: 10 }, y entonces el
     servidor recibe esta misma configuración: validaPayload(…, { config: FORMKIT_CONFIG }). */
};

window.FORMKIT_OPCIONES = {
  /* `enviar` recibe {datos, archivos, meta} y devuelve una promesa con
     {folio, fecha, acuseUrl?}. Para rechazar por límite de envíos, rechaza
     con {limite: true}. Esto es una SIMULACIÓN: en producción se sustituye
     por la llamada al servidor, que decide qué se guarda. La plantilla
     acepta ?simular=limite | error | lento para ver cada pantalla. */
  enviar(payload, { signal }) {
    const modo = new URLSearchParams(location.search).get('simular');
    const espera = modo === 'lento' ? 20000 : 400;
    return new Promise((ok, mal) => {
      const t = setTimeout(() => {
        if (modo === 'limite') return mal({ limite: true });
        if (modo === 'error') return mal(new Error('simulado'));
        ok({ folio: `EJEMPLO-${Date.now().toString(36).toUpperCase()}`, fecha: new Date().toISOString() });
      }, espera);
      signal.addEventListener('abort', () => { clearTimeout(t); mal(new Error('plazo')); });
    });
  }
};
