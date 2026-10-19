/* =========================================================
   cascadas.js · Módulo «cascadas» · nivel OPCIONAL

   Campos dependientes en cascada: alcaldía → colonia → código postal (o
   entidad → municipio). El catálogo viene de window.FORMKIT_CATALOGOS
   [nombre].filas, derivado de la fuente oficial (ver codigo/catalogos).

   Comportamiento:
     · el hijo permanece deshabilitado, con ayuda que explica por qué, hasta
       que el padre tenga valor;
     · al cambiar el padre se reinicia el hijo y se anuncia;
     · relación inversa: si se captura primero el código postal, se rellenan
       la alcaldía y la colonia que dependan de él, y la persona puede
       corregirlos; si un cp abarca varias colonias, se acota la lista;
     · si el catálogo no carga, se muestra la captura manual (bloque
       data-cascada-manual) y la cascada se oculta.

   Contrato HTML:
     <div data-cascada data-catalogo="cdmx">
       <div class="campo" data-campo="alcaldia" data-requerido>
         <label class="etiqueta" for="alcaldia">Alcaldía</label>
         <div class="select"><select class="control control-select" id="alcaldia" name="alcaldia" data-nivel="alcaldia" autocomplete="address-level2"><option value="">Elige una opción</option></select></div>
       </div>
       <div class="campo" data-campo="colonia" data-requerido>…<select data-nivel="colonia" autocomplete="address-level3">…</div>
       <div class="campo" data-campo="cp" data-formato="cp" data-requerido>…<input data-nivel="cp" autocomplete="postal-code">…</div>
       <div data-cascada-manual hidden>…campos de texto equivalentes…</div>
     </div>
   ========================================================= */
(function () {
  'use strict';
  FormKit.registra('cascadas', {
    selector: '[data-cascada]',
    iniciar(form, ctx) {
      const { $, $$, M, plantilla, anuncia, etiquetaDe, limpia, programaBorrador } = ctx;
      for (const cont of $$('[data-cascada]', form)) {
        const cat = (window.FORMKIT_CATALOGOS || {})[cont.dataset.catalogo];
        const niveles = $$('[data-nivel]', cont);
        const por = Object.fromEntries(niveles.map((c) => [c.dataset.nivel, c]));
        const campoDe = (c) => c.closest('[data-campo]');
        const manual = $('[data-cascada-manual]', cont);

        if (!cat || !Array.isArray(cat.filas) || !cat.filas.length) {
          /* Sin catálogo: captura manual y la cascada fuera del camino. */
          for (const c of niveles) campoDe(c).hidden = true;
          if (manual) manual.hidden = false;
          anuncia(M.cascadaSinCatalogo);
          continue;
        }
        const filas = cat.filas;
        const orden = ['alcaldia', 'colonia', 'cp'].filter((n) => por[n]);
        const sel = (c, valores, placeholder) => {
          if (c.tagName !== 'SELECT') return;
          const actual = c.value;
          c.textContent = '';
          const o0 = document.createElement('option'); o0.value = ''; o0.textContent = placeholder || 'Elige una opción'; c.appendChild(o0);
          for (const v of valores) { const o = document.createElement('option'); o.value = v; o.textContent = v; c.appendChild(o); }
          if (valores.includes(actual)) c.value = actual;
          c.toggleAttribute('data-vacio', !c.value);
        };
        const unicos = (lista, k) => [...new Set(lista.map((f) => f[k]))].sort((a, b) => a.localeCompare(b, 'es'));

        function espera(c, padre) {
          const ayuda = $('.ayuda', campoDe(c));
          const texto = plantilla(M.cascadaEspera, { padre: etiquetaDe(campoDe(padre).dataset.campo).toLowerCase() });
          if (ayuda) { if (!ayuda.dataset.original) ayuda.dataset.original = ayuda.textContent; ayuda.textContent = c.disabled ? texto : ayuda.dataset.original; }
        }

        function pinta(origen) {
          const a = por.alcaldia, co = por.colonia, cp = por.cp;
          if (a) sel(a, unicos(filas, 'alcaldia'));
          if (co) {
            const base = a && a.value ? filas.filter((f) => f.alcaldia === a.value) : (cp && cp.value.length === 5 ? filas.filter((f) => f.cp === cp.value) : []);
            co.disabled = !base.length;
            sel(co, unicos(base, 'colonia'));
            if (a) espera(co, a);
          }
          if (cp && origen !== 'cp') {
            const base = filas.filter((f) => (!a || !a.value || f.alcaldia === a.value) && (!co || !co.value || f.colonia === co.value));
            const cps = unicos(base, 'cp');
            if (co && co.value && cps.length === 1 && cp.value !== cps[0]) { cp.value = cps[0]; limpia(campoDe(cp).dataset.campo); anuncia(plantilla(M.cascadaCpTomado, { etiqueta: etiquetaDe(campoDe(cp).dataset.campo), valor: cps[0] })); }
          }
        }

        /* Inversa: el código postal propone alcaldía y colonia. */
        function desdeCp() {
          const cp = por.cp;
          if (!cp || cp.value.length !== 5) return;
          const coinciden = filas.filter((f) => f.cp === cp.value);
          if (!coinciden.length) return;
          const a = por.alcaldia, co = por.colonia;
          const alcs = unicos(coinciden, 'alcaldia');
          if (a && alcs.length === 1 && a.value !== alcs[0]) { a.value = alcs[0]; a.toggleAttribute('data-vacio', false); limpia(campoDe(a).dataset.campo); anuncia(plantilla(M.cascadaTomadaCp, { etiqueta: etiquetaDe(campoDe(a).dataset.campo), valor: alcs[0] })); }
          pinta('cp');
          const cols = unicos(coinciden, 'colonia');
          if (co && cols.length === 1 && co.value !== cols[0]) { co.value = cols[0]; co.toggleAttribute('data-vacio', false); limpia(campoDe(co).dataset.campo); anuncia(plantilla(M.cascadaTomadaCp, { etiqueta: etiquetaDe(campoDe(co).dataset.campo), valor: cols[0] })); }
        }

        cont.addEventListener('change', (e) => {
          const c = e.target.closest('[data-nivel]');
          if (!c) return;
          const i = orden.indexOf(c.dataset.nivel);
          /* Al cambiar un padre, los hijos se reinician y se anuncia. */
          for (const h of orden.slice(i + 1)) { const hijo = por[h]; if (hijo && hijo.value && c.dataset.nivel !== 'cp') { hijo.value = ''; hijo.toggleAttribute('data-vacio', true); limpia(campoDe(hijo).dataset.campo); anuncia(plantilla(M.cascadaReiniciada, { etiqueta: etiquetaDe(campoDe(hijo).dataset.campo), padre: etiquetaDe(campoDe(c).dataset.campo) })); } }
          if (c.dataset.nivel === 'cp') desdeCp(); else pinta(c.dataset.nivel);
          programaBorrador();
        });
        if (por.cp) por.cp.addEventListener('input', () => { if (por.cp.value.length === 5) desdeCp(); });
        pinta();
        /* Al restaurar un borrador, las listas hijas se reconstruyen desde el
           padre restaurado y después se reponen los valores guardados. */
        const anterior = FormKit.ganchos.restauraBorrador;
        FormKit.ganchos.restauraBorrador = (f, b) => {
          if (anterior) anterior(f, b);
          pinta();
          for (const n of orden) { const c = por[n]; const v = (b.datos || {})[campoDe(c).dataset.campo]; if (c && v !== undefined && c.value !== v) { c.value = v; c.toggleAttribute('data-vacio', !c.value); pinta(n); } }
        };
        /* La cruzada cp ↔ colonia (advertencia) se declara sola si no está. */
        if (por.cp && por.colonia) { const campoCp = campoDe(por.cp); if (!campoCp.dataset.cruzada) { campoCp.dataset.cruzada = 'cp-colonia'; campoCp.dataset.cruzadaCampos = `cp=${campoCp.dataset.campo} colonia=${campoDe(por.colonia).dataset.campo}`; campoCp.dataset.catalogo = cont.dataset.catalogo; } }
      }
    }
  });
}());
