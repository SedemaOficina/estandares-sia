/* =========================================================
   toggle.js · Módulo «toggle» · nivel OPCIONAL

   Interruptor (role="switch"). CUÁNDO: un ajuste que surte efecto de
   inmediato y tiene dos estados evidentes (activar notificaciones, mostrar
   mapa). CUÁNDO NO: una respuesta del formulario que se envía al final —ahí
   va una casilla o la opción Sí/No, que el lector de pantalla anuncia como
   pregunta y que participa en la validación—.

   Contrato HTML:
     <div class="toggle" data-campo="notificar">
       <span class="etiqueta" id="t-notificar">Recibir avisos por correo</span>
       <button type="button" class="toggle-btn" role="switch" aria-checked="false" aria-labelledby="t-notificar" data-toggle>
         <span class="toggle-pista" aria-hidden="true"><span class="toggle-perilla"></span></span>
         <span class="toggle-estado" data-toggle-estado>No</span>
       </button>
       <input type="hidden" name="notificar" value="">
     </div>
   El estado se lee de aria-checked; el valor viaja en el input oculto.
   ========================================================= */
(function () {
  'use strict';
  FormKit.registra('toggle', {
    selector: '[data-toggle]',
    tipos: {
      toggle: {
        detecta: (el) => !!el.querySelector('[data-toggle]'),
        controles: (el) => [el.querySelector('[data-toggle]')],
        valorDe: (el) => (el.querySelector('[data-toggle]').getAttribute('aria-checked') === 'true' ? 'si' : ''),
        textoDe: (el) => (el.querySelector('[data-toggle]').getAttribute('aria-checked') === 'true' ? FormKit.config.mensajes.palabraSi : FormKit.config.mensajes.palabraNo),
        enBorrador: true,
        restaura: (el, v) => pon(el.querySelector('[data-toggle]'), v === 'si')
      }
    },
    iniciar(form, ctx) {
      const { $$ } = ctx;
      for (const b of $$('[data-toggle]', form)) pon(b, b.getAttribute('aria-checked') === 'true');
      form.addEventListener('click', (e) => {
        const b = e.target.closest('[data-toggle]');
        if (!b) return;
        pon(b, b.getAttribute('aria-checked') !== 'true');
        b.dispatchEvent(new Event('change', { bubbles: true }));
      });
    }
  });

  /* Un solo lugar escribe el estado: atributo, valor oculto y texto visible. */
  function pon(b, on) {
    const M = FormKit.config.mensajes;
    b.setAttribute('aria-checked', String(!!on));
    const h = b.parentElement.querySelector('input[type="hidden"]');
    if (h) h.value = on ? 'si' : '';
    const t = b.querySelector('[data-toggle-estado]');
    if (t) t.textContent = on ? M.palabraSi : M.palabraNo;
  }
}());
