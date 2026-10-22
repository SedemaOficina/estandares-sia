/* Configuración del ejemplo de captura interna. Va en su propio archivo, no
   en un <script> dentro de la página: la política de seguridad estricta
   (sin guiones en línea) que pide el SIA lo bloquearía. El envío es una
   SIMULACIÓN: en un sistema, `enviar` llama a su servidor. */
window.FORMKIT_CONFIG = {};
window.FORMKIT_CATALOGOS = { categorias: ['Arbolado', 'Residuos', 'Ruido', 'Fauna', 'Agua', 'Aire', 'Suelo', 'Áreas verdes', 'Otro'] };
window.FORMKIT_OPCIONES = { enviar: () => new Promise((ok) => setTimeout(() => ok({ folio: 'EJ-' + Date.now().toString(36).toUpperCase(), fecha: new Date().toISOString() }), 300)) };
