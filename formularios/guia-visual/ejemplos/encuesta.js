/* Cableado de la encuesta de ejemplo: la barra de progreso cuenta las
   preguntas OBLIGATORIAS contestadas (la opcional no cuenta: con todo lo
   obligatorio la barra llega al final). «Otro» suma su «Especifica cuál»
   mientras está a la vista. Todo lo demás lo hace el núcleo. */
(function () {
  'use strict';
  const form = document.getElementById('encuesta');
  const avance = () => {
    const obligatorias = [...form.querySelectorAll('[data-campo][data-requerido]')].filter((el) => !el.closest('[hidden]'));
    const contestadas = obligatorias.filter((el) => el.querySelector('input:checked') || [...el.querySelectorAll('input[type="text"], textarea')].some((c) => c.value.trim())).length;
    const barra = document.querySelector('[data-progreso] progress');
    barra.max = obligatorias.length;
    FormKit.progreso(document.querySelector('[data-progreso]'), contestadas);
  };
  /* Después de que el núcleo muestre u oculte «Especifica cuál». */
  form.addEventListener('change', () => setTimeout(avance, 0));
  form.addEventListener('input', () => setTimeout(avance, 0));
  document.addEventListener('DOMContentLoaded', avance);
}());
