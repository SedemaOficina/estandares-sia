/* Configuración del ejemplo de encuesta. Va en su propio archivo, no en un
   <script> dentro de la página: la política de seguridad estricta (sin
   guiones en línea) que pide el SIA lo bloquearía. El envío es una
   SIMULACIÓN: una encuesta anónima no devuelve folio. */
window.FORMKIT_CONFIG = {};
window.FORMKIT_OPCIONES = { enviar: () => new Promise((ok) => setTimeout(() => ok({ folio: '', fecha: new Date().toISOString() }), 300)) };
