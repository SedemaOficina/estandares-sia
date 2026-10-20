/* =========================================================
   progreso.js · Módulo «progreso» · nivel OPCIONAL

   Barra de progreso: porcentaje de avance de una carga o de un formulario
   largo de una sola página. Usa <progress> nativo (lo anuncia el lector) y
   escribe el porcentaje en texto al lado. CUÁNDO NO: en un formulario por
   pasos, cuya barra ya dice cuánto falta.
     <div class="progreso" data-progreso>
       <label class="progreso-etq" for="pg1">Subiendo archivos</label>
       <progress class="progreso-barra" id="pg1" max="100" value="40"></progress>
       <span class="progreso-txt" data-progreso-texto aria-hidden="true">40 %</span>
     </div>
   FormKit.progreso(el, valor) actualiza barra y texto. Sin valor conocido
   (indeterminado) se quita el atributo value y el texto dice «Cargando…».
   ========================================================= */
(function () {
  'use strict';
  FormKit.progreso = function (el, valor) {
    const barra = el.querySelector('progress');
    const txt = el.querySelector('[data-progreso-texto]');
    if (!barra) return;
    /* Sin valor conocido, el lector oye «Cargando…», no el porcentaje que tenía antes. */
    if (valor === null || valor === undefined) { barra.removeAttribute('value'); barra.setAttribute('aria-valuetext', FormKit.config.mensajes.cargando); if (txt) txt.textContent = FormKit.config.mensajes.cargando; return; }
    const max = Number(barra.max || 100);
    const v = Math.max(0, Math.min(max, Number(valor)));
    barra.value = v;
    const pct = Math.round((v / max) * 100);
    if (txt) txt.textContent = `${pct} %`;
    barra.setAttribute('aria-valuetext', `${pct} por ciento`);
  };
  FormKit.registra('progreso', {
    selector: '[data-progreso]',
    fueraDelFormulario: true,
    iniciar(form, ctx) { for (const el of ctx.$$('[data-progreso]')) { const b = el.querySelector('progress'); if (b) FormKit.progreso(el, b.hasAttribute('value') ? b.value : null); } }
  });
}());
