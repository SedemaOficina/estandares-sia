/* =========================================================
   repetibles.js · Módulo «repetibles» · nivel OPCIONAL

   Grupos repetibles («Agregar otro»): varias personas, varios domicilios,
   varias filas de una tabla de captura. Cada fila es una copia de una
   plantilla <template>; los campos de la fila son [data-campo] cuyo nombre
   se completa con el índice (personas.0.nombre). Mínimo y máximo de filas
   configurables; quitar una fila con datos pide confirmación con el módulo
   «modal» («Quitar fila N»); con el máximo, «Agregar» dice el límite junto
   a él (.repetible-limite); el foco vuelve a un lugar sensato tras agregar
   o quitar.

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
   El carácter # se sustituye por el número de la fila (no el que va antes de
   una letra, como en href="#i-ayuda"). El número de una fila no se reutiliza:
   si se quita la fila 1 de tres, la siguiente que se agregue es la 3, así cada
   fila conserva su nombre y su id, y el borrador guarda qué números tenía.
   ========================================================= */
(function () {
  'use strict';
  FormKit.registra('repetibles', {
    selector: '[data-repetible]',
    iniciar(form, ctx) {
      const { $, $$, M, plantilla, anuncia, preparaCampo, icono, valorDe, limpia, programaBorrador } = ctx;
      /* Por grupo: cómo agregar una fila con un número dado y qué números tiene. */
      const grupos = new Map();

      for (const rep of $$('[data-repetible]', form)) {
        const lista = $('[data-repetible-lista]', rep);
        const tpl = $('template[data-repetible-plantilla]', rep);
        const btnAgregar = $('[data-repetible-agregar]', rep);
        const min = Number(rep.dataset.min || 0), max = Number(rep.dataset.max || 0);
        lista.setAttribute('aria-label', rep.dataset.etiqueta || rep.dataset.repetible);
        if (btnAgregar && !btnAgregar.textContent.trim()) btnAgregar.textContent = M.filaAgregar;

        function filas() { return $$(':scope > .repetible-fila', lista); }
        const numeroDe = (fila) => Number(fila.dataset.numero);
        /* El siguiente número libre: nunca uno que ya se usó en este grupo. */
        let proximo = 0;
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
        /* numero: el de una fila que se recupera del borrador; silencio: sin foco, anuncio
           ni borrador nuevo (al recuperar). */
        function agrega(foco = true, { numero = proximo, silencio = false } = {}) {
          if (max && filas().length >= max) { if (!silencio) avisaLimite(plantilla(M.repetibleMax, { max, etiqueta: rep.dataset.etiqueta || '' })); return null; }
          quitaLimite();
          const i = numero;
          proximo = Math.max(proximo, i + 1);
          const html = tpl.innerHTML.replace(/#(?![A-Za-z])/g, String(i));
          const cont = document.createElement('div'); cont.innerHTML = html;
          const fila = cont.firstElementChild;
          fila.classList.add('repetible-fila');
          fila.dataset.numero = String(i);
          /* Encabezado de la fila y botón de quitar, si la plantilla no los trae. */
          if (!$('.repetible-cabecera', fila)) {
            const cab = document.createElement('div'); cab.className = 'repetible-cabecera';
            const tit = document.createElement('p'); tit.className = 'repetible-titulo';
            const q = document.createElement('button'); q.type = 'button'; q.className = 'btn-icono'; q.dataset.repetibleQuitar = '';
            q.append(icono('eliminar'));
            cab.append(tit, q); fila.prepend(cab);
          }
          /* En orden de número, por si se recupera una fila de en medio. */
          lista.insertBefore(fila, filas().find((f) => numeroDe(f) > i) || null);
          for (const c of $$('[data-campo]', fila)) preparaCampo(c.dataset.campo);
          renumera();
          if (silencio) return fila;
          if (foco) { const primero = $('input,select,textarea', fila); if (primero) primero.focus(); }
          anuncia(plantilla(M.repetibleAgregado, { etiqueta: rep.dataset.etiqueta || rep.dataset.repetible, n: filas().indexOf(fila) + 1 }));
          programaBorrador();
          return fila;
        }
        function retira(fila) { for (const c of $$('[data-campo]', fila)) limpia(c.dataset.campo); fila.remove(); }
        function tieneDatos(fila) { return $$('[data-campo]', fila).some((c) => { const v = valorDe(c.dataset.campo); return Array.isArray(v) ? v.length : v; }); }
        function quita(fila) {
          const idx = filas().indexOf(fila);
          if (min && filas().length <= min) { avisaLimite(plantilla(M.repetibleMin, { min, etiqueta: rep.dataset.etiqueta || '' })); return; }
          quitaLimite();
          retira(fila);
          renumera();
          const siguiente = filas()[Math.min(idx, filas().length - 1)];
          (siguiente ? $('[data-repetible-quitar]', siguiente) : btnAgregar).focus();
          anuncia(plantilla(M.repetibleQuitado, { n: idx + 1 }));
          programaBorrador();
        }

        rep.addEventListener('click', (e) => {
          const ag = e.target.closest('[data-repetible-agregar]');
          /* Con el máximo, «Agregar» sigue enfocable (aria-disabled): al tocarlo se dice por qué no agrega. */
          if (ag) { agrega(); return; }
          const q = e.target.closest('[data-repetible-quitar]');
          if (!q) return;
          const fila = q.closest('.repetible-fila');
          /* Con datos, se confirma con el módulo modal (dependencia), nunca con window.confirm (FRM-38). */
          if (!tieneDatos(fila)) { quita(fila); return; }
          if (!FormKit.confirma) { console.warn('FormKit: «repetibles» necesita el módulo «modal» para confirmar antes de quitar una fila con datos.'); return; }
          FormKit.confirma(q, { titulo: M.filaConfirma, si: plantilla(M.filaQuitar, { n: filas().indexOf(fila) + 1 }), peligro: true }).then((ok) => { if (ok) quita(fila); });
        });

        /* Filas iniciales: las que exija el mínimo (al menos una si el grupo es obligatorio). */
        const iniciales = Math.max(min, rep.hasAttribute('data-requerido') ? 1 : 0);
        while (filas().length < iniciales) agrega(false);
        renumera();

        grupos.set(rep.dataset.repetible, {
          numeros: () => filas().map(numeroDe),
          /* Deja exactamente las filas que tenía el borrador, sin pasar del máximo ni
             bajar del mínimo; los valores los repone después el núcleo. */
          recupera(guardado) {
            const lista = Array.isArray(guardado) ? guardado : Array.from({ length: Number(guardado) || 0 }, (_, k) => k);
            let numeros = [...new Set(lista.map(Number).filter((n) => Number.isInteger(n) && n >= 0 && n < 10000))].sort((a, b) => a - b);
            if (max) numeros = numeros.slice(0, max);
            for (const f of filas()) if (!numeros.includes(numeroDe(f)) && filas().length > min) retira(f);
            for (const n of numeros) if (!filas().some((f) => numeroDe(f) === n) && !agrega(false, { numero: n, silencio: true })) break;
            renumera();
          }
        });
      }

      /* El borrador guarda qué números de fila tenía cada grupo y, al recuperarlo, las
         filas se rehacen antes de reponer los valores (también radios y casillas). */
      ctx.alBorrador({
        estado: () => ({ repetibles: Object.fromEntries([...grupos].map(([nombre, g]) => [nombre, g.numeros()])) }),
        prepara: (b) => { for (const [nombre, g] of grupos) if (b && b.repetibles && nombre in b.repetibles) g.recupera(b.repetibles[nombre]); }
      });
    }
  });
}());
