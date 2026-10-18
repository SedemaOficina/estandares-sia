/* =========================================================
   repetibles.js · Módulo «repetibles» · nivel OPCIONAL

   Grupos repetibles («Agregar otro»): varias personas, varios domicilios,
   varias filas de una tabla de captura. Cada fila es una copia de una
   plantilla <template>; los campos de la fila son [data-campo] cuyo nombre
   se completa con el índice (personas.0.nombre). Mínimo y máximo de filas
   configurables; quitar una fila con datos pide confirmación en línea; el
   foco vuelve a un lugar sensato tras agregar o quitar.

   Contrato HTML:
     <div class="repetible" data-repetible="personas" data-min="1" data-max="5"
          data-etiqueta="Personas">
       <ol class="repetible-lista" data-repetible-lista></ol>
       <template data-repetible-plantilla>
         <li class="repetible-fila">
           <div class="campo" data-campo="personas.#.nombre" data-formato="nombre">
             <label class="etiqueta" for="personas-#-nombre">Nombre</label>
             <input class="control" id="personas-#-nombre" name="personas[#][nombre]" type="text" required>
           </div>
         </li>
       </template>
       <button type="button" class="btn btn-secundario" data-repetible-agregar>Agregar otro</button>
     </div>
   El carácter # se sustituye por el índice de la fila.
   ========================================================= */
(function () {
  'use strict';
  FormKit.registra('repetibles', {
    selector: '[data-repetible]',
    iniciar(form, ctx) {
      const { $, $$, M, plantilla, anuncia, preparaCampo, icono, valorDe, limpia, programaBorrador } = ctx;

      for (const rep of $$('[data-repetible]', form)) {
        const lista = $('[data-repetible-lista]', rep);
        const tpl = $('template[data-repetible-plantilla]', rep);
        const btnAgregar = $('[data-repetible-agregar]', rep);
        const min = Number(rep.dataset.min || 0), max = Number(rep.dataset.max || 0);
        lista.setAttribute('aria-label', rep.dataset.etiqueta || rep.dataset.repetible);
        if (btnAgregar && !btnAgregar.textContent.trim()) btnAgregar.textContent = M.filaAgregar;

        function filas() { return $$(':scope > .repetible-fila', lista); }
        /* El límite de filas se dice también en pantalla, junto a «Agregar» (FRM-40). */
        let notaLimite = null;
        function avisaLimite(texto) {
          if (!notaLimite) { notaLimite = document.createElement('p'); notaLimite.className = 'repetible-limite'; if (btnAgregar) btnAgregar.before(notaLimite); else rep.appendChild(notaLimite); }
          anuncia(texto, { visible: notaLimite });
        }
        const quitaLimite = () => { if (notaLimite) notaLimite.hidden = true; };
        function renumera() {
          filas().forEach((fila, i) => {
            const cab = $('.repetible-titulo', fila);
            if (cab) cab.textContent = `${rep.dataset.etiqueta || rep.dataset.repetible} ${i + 1}`;
            const q = $('[data-repetible-quitar]', fila);
            if (q) q.setAttribute('aria-label', plantilla(M.filaQuitar, { n: i + 1 }));
          });
          if (btnAgregar) { const lleno = max && filas().length >= max; btnAgregar.setAttribute('aria-disabled', String(!!lleno)); }
        }
        function agrega(foco = true) {
          if (max && filas().length >= max) { avisaLimite(plantilla(M.repetibleMax, { max, etiqueta: rep.dataset.etiqueta || '' })); return null; }
          quitaLimite();
          const i = filas().length;
          const html = tpl.innerHTML.replace(/#/g, String(i));
          const cont = document.createElement('div'); cont.innerHTML = html;
          const fila = cont.firstElementChild;
          fila.classList.add('repetible-fila');
          /* Encabezado de la fila y botón de quitar, si la plantilla no los trae. */
          if (!$('.repetible-cabecera', fila)) {
            const cab = document.createElement('div'); cab.className = 'repetible-cabecera';
            const tit = document.createElement('p'); tit.className = 'repetible-titulo';
            const q = document.createElement('button'); q.type = 'button'; q.className = 'btn-icono'; q.dataset.repetibleQuitar = '';
            q.append(icono('eliminar'));
            cab.append(tit, q); fila.prepend(cab);
          }
          lista.appendChild(fila);
          for (const c of $$('[data-campo]', fila)) preparaCampo(c.dataset.campo);
          renumera();
          if (foco) { const primero = $('input,select,textarea', fila); if (primero) primero.focus(); }
          anuncia(`${rep.dataset.etiqueta || rep.dataset.repetible} ${i + 1} agregado.`);
          programaBorrador();
          return fila;
        }
        function tieneDatos(fila) { return $$('[data-campo]', fila).some((c) => { const v = valorDe(c.dataset.campo); return Array.isArray(v) ? v.length : v; }); }
        function quita(fila) {
          const idx = filas().indexOf(fila);
          if (min && filas().length <= min) { avisaLimite(plantilla(M.repetibleMin, { min, etiqueta: rep.dataset.etiqueta || '' })); return; }
          quitaLimite();
          for (const c of $$('[data-campo]', fila)) limpia(c.dataset.campo);
          fila.remove();
          renumera();
          const siguiente = filas()[Math.min(idx, filas().length - 1)];
          (siguiente ? $('[data-repetible-quitar]', siguiente) : btnAgregar).focus();
          anuncia(`Fila ${idx + 1} quitada.`);
          programaBorrador();
        }

        rep.addEventListener('click', (e) => {
          const ag = e.target.closest('[data-repetible-agregar]');
          /* Con el máximo, «Agregar» sigue enfocable (aria-disabled): al tocarlo se dice por qué no agrega. */
          if (ag) { agrega(); return; }
          const q = e.target.closest('[data-repetible-quitar]');
          if (!q) return;
          const fila = q.closest('.repetible-fila');
          if (tieneDatos(fila) && FormKit.confirma) FormKit.confirma(q, { titulo: M.filaConfirma, si: 'Quitar', no: 'Conservar', peligro: true }).then((ok) => { if (ok) quita(fila); });
          else if (tieneDatos(fila)) { if (window.confirm(M.filaConfirma)) quita(fila); } /* sin módulo modal: confirmación nativa como último recurso */
          else quita(fila);
        });

        /* Filas iniciales: las que exija el mínimo (al menos una si el grupo es obligatorio). */
        const iniciales = Math.max(min, rep.hasAttribute('data-requerido') ? 1 : 0);
        while (filas().length < iniciales) agrega(false);
        renumera();

      }

      /* Las filas que el borrador no conoce se recrean al restaurar: se
         guardan cuántas filas tenía cada repetible. */
      FormKit.ganchos.estadoBorrador = (f) => ({ repetibles: Object.fromEntries($$('[data-repetible]', f).map((r) => [r.dataset.repetible, $$(':scope > .repetible-fila', $('[data-repetible-lista]', r)).length])) });
      const anterior = FormKit.ganchos.restauraBorrador;
      FormKit.ganchos.restauraBorrador = (f, b) => {
        if (anterior) anterior(f, b);
        for (const r of $$('[data-repetible]', f)) {
          const n = (b.repetibles || {})[r.dataset.repetible] || 0;
          const lista = $('[data-repetible-lista]', r);
          while ($$(':scope > .repetible-fila', lista).length < n) $('[data-repetible-agregar]', r).click();
          for (const c of $$('[data-campo]', r)) { const v = (b.datos || {})[c.dataset.campo]; const ctl = ctx.controlPrincipal(c.dataset.campo); if (ctl && v !== undefined && ctl.type !== 'radio' && ctl.type !== 'checkbox') ctl.value = v; }
        }
      };
    }
  });
}());
