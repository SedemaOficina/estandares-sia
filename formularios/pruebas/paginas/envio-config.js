/* Configuración de la página de prueba de carga y envío (bloque 4 de la
   auditoría del 19 oct 2026). Sin parámetros se usa el envío por omisión del
   núcleo (a /recibe). Con ?colgado, un envío propio que nunca responde ni
   atiende la señal, con un plazo corto. */
(function () {
  const q = new URLSearchParams(location.search);
  window.FORMKIT_CATALOGOS = { 'alcaldias-prueba': ['Coyoacán', 'Tlalpan'] };
  window.FORMKIT_CONFIG = q.has('colgado') ? { envio: { timeoutMs: 700 } } : {};
  const opciones = {};
  if (q.has('colgado')) opciones.enviar = () => new Promise(() => {});
  window.FORMKIT_OPCIONES = opciones;
}());
