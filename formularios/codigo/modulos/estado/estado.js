/* =========================================================
   estado.js · Módulo «estado» · nivel OPCIONAL

   Etiquetas de estado de un trámite o un registro («En revisión»,
   «Validada»). Cinco tonos con significado fijo, cada uno con su icono:
     borrador  · gris  · lápiz   · lo que aún no se envía;
     proceso   · azul  · reloj   · en revisión, en trámite;
     atencion  · ámbar · alerta  · espera algo de la persona o del personal;
     ok        · verde · palomita· validado, aprobado, concluido;
     rechazo   · rojo  · error   · rechazado, cancelado, vencido.
   La palabra dice el estado; el color y el icono sólo lo refuerzan. Un
   sistema no inventa tonos: cada estado suyo cae en uno de estos cinco.

   Se inicia solo al cargar la página: a la etiqueta que no trae su icono se
   le pone el de su tono. FormKit.estado(el, { tono, texto, anuncia }) la
   cambia después (anuncia: true cuando cambia por una acción de la persona).

   Contrato HTML:
     <span class="estado estado-proceso">En revisión</span>
   ========================================================= */
(function () {
  'use strict';
  const ICONOS = { borrador: 'editar', proceso: 'reloj', atencion: 'alerta', ok: 'ok', rechazo: 'error' };
  const tonoDe = (el) => Object.keys(ICONOS).find((t) => el.classList.contains(`estado-${t}`)) || 'borrador';

  function pinta(el) {
    const tono = tonoDe(el);
    if (!el.classList.contains(`estado-${tono}`)) el.classList.add(`estado-${tono}`);
    const previo = el.querySelector(':scope > .icono');
    const nuevo = FormKit.icono(ICONOS[tono], 'icono icono-sm');
    if (previo) previo.replaceWith(nuevo); else el.prepend(nuevo);
  }

  function estado(el, { tono, texto, anuncia = false } = {}) {
    if (tono && ICONOS[tono]) {
      for (const t of Object.keys(ICONOS)) el.classList.remove(`estado-${t}`);
      el.classList.add(`estado-${tono}`);
    }
    if (texto !== undefined) el.replaceChildren(document.createTextNode(texto));
    el.classList.add('estado');
    pinta(el);
    if (anuncia) FormKit.anuncia(el.textContent.trim());
    return el;
  }

  /* Las que aún no tienen icono; también sirve para etiquetas que la página pinta después. */
  function inicia(cont = document) {
    for (const el of cont.querySelectorAll('.estado')) if (!el.querySelector(':scope > .icono')) pinta(el);
  }

  FormKit.estado = Object.assign(estado, { inicia });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => inicia()); else inicia();
}());
