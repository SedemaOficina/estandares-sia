/* Cableado de la encuesta de ejemplo: la barra de progreso cuenta las
   preguntas contestadas. Todo lo demás lo hace el núcleo. */
(function () {
  'use strict';
  const form = document.getElementById('encuesta');
  const avance = () => {
    const contestadas = ['limpieza', 'motivo', 'comentario'].filter((n) => { const el = form.querySelector(`[data-campo="${n}"]`); return el && (el.querySelector('input:checked') || (el.querySelector('textarea') || {}).value); }).length;
    FormKit.progreso(document.querySelector('[data-progreso]'), contestadas);
  };
  form.addEventListener('change', avance);
  form.addEventListener('input', avance);
  document.addEventListener('DOMContentLoaded', avance);
}());
