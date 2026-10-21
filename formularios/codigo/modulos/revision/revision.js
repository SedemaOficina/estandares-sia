/* =========================================================
   revision.js · Módulo «revision» · nivel RECOMENDADO

   Pantalla de revisión antes de enviar: un bloque por paso, abierto, con su
   título, un solo «Editar» que aterriza en el primer campo del bloque, y cada
   dato con su etiqueta y su valor. Un «Editar» por dato llenaba la pantalla
   del teléfono de botones iguales (17 en la plantilla). Los identificadores
   con data-enmascara se muestran parcialmente ocultos.

   Contrato HTML (último paso del formulario):
     <section class="tarjeta" data-paso data-revision data-titulo="Revisión" hidden>
       <h2 class="titulo-paso">Revisa antes de enviar</h2>
       <div data-revision-lista></div> …
   Depende de: pasos.js (y de su evento formkit:paso).
   ========================================================= */
(function () {
  'use strict';
  FormKit.registra('revision', {
    selector: '[data-revision]',
    iniciar(form, ctx) {
      const { $, $$, M, envoltura, etiquetaDe, textoDeValor, activo, icono, idUnico } = ctx;
      const sec = $('[data-revision]', form);
      const dest = $('[data-revision-lista]', sec);
      const pasos = $$('[data-paso]', form);

      function texto(n) {
        const el = envoltura(n);
        const t = textoDeValor(n);
        return el.hasAttribute('data-enmascara') && FormKit.enmascara ? FormKit.enmascara(t) : t;
      }

      function pinta() {
        dest.textContent = '';
        pasos.forEach((p) => {
          if (p === sec) return;
          const nombres = $$('[data-campo]', p).map((e) => e.dataset.campo).filter(activo);
          if (!nombres.length) return;
          const bloque = document.createElement('section');
          bloque.className = 'rev-bloque';
          const cab = document.createElement('div');
          cab.className = 'rev-titulo';
          const rot = document.createElement('h3'); rot.className = 'rev-rotulo'; rot.id = idUnico('rev'); rot.textContent = p.dataset.titulo;
          bloque.setAttribute('aria-labelledby', rot.id);
          /* Un «Editar» por bloque: lleva al primer campo del paso; su nombre dice cuál. */
          const ed = document.createElement('button');
          ed.type = 'button'; ed.className = 'btn-enlace'; ed.dataset.editar = nombres[0];
          ed.append(icono('editar', 'icono icono-sm'), document.createTextNode(M.editar));
          const oculto = document.createElement('span'); oculto.className = 'solo-lector'; oculto.textContent = ` ${p.dataset.titulo}`;
          ed.appendChild(oculto);
          cab.append(rot, ed);
          const dl = document.createElement('dl');
          dl.className = 'rev-datos';
          for (const n of nombres) {
            const dt = document.createElement('dt'); dt.className = 'rev-dato-etq'; dt.textContent = etiquetaDe(n);
            const dd = document.createElement('dd'); dd.className = 'rev-dato-valor'; dd.textContent = texto(n) || M.sinValor;
            dl.append(dt, dd);
          }
          bloque.append(cab, dl);
          dest.appendChild(bloque);
        });
      }
      form.addEventListener('formkit:paso', (e) => { if (e.detail.paso === sec) pinta(); });
      FormKit.revision = { pinta };
    }
  });
}());
