/* =========================================================
   descarga.js · Módulo «descarga» · nivel OPCIONAL

   Botones de descarga y enlaces a archivos. El texto dice la acción, el
   formato y el peso («Descargar acuse (PDF, 120 KB)»); icono más texto,
   nunca icono solo. Si el archivo se genera al momento, el botón muestra
   estado de carga; si abre en otra pestaña, lo dice.

   Contrato HTML:
     <a class="btn btn-secundario descarga" href="…" download="acuse-2026.pdf"
        data-descarga data-formato="PDF" data-peso="120 KB">Descargar acuse</a>
     <button type="button" class="btn btn-secundario descarga" data-descarga data-generar="acuse" data-formato="PDF">Descargar acuse</button>
   Para data-generar, FormKit.descargas[nombre] debe devolver una promesa
   con {url, nombre, peso}. El nombre del archivo es descriptivo y nunca
   lleva datos personales.
   ========================================================= */
(function () {
  'use strict';
  FormKit.descargas = FormKit.descargas || {};
  FormKit.registra('descarga', {
    selector: '[data-descarga]',
    fueraDelFormulario: true,
    iniciar(form, ctx) {
      const { $$, anuncia, icono } = ctx;
      for (const b of $$('[data-descarga]')) {
        if (!b.querySelector('.icono')) b.prepend(icono('descarga'));
        pintaDetalle(b);
        if (b.target === '_blank') { const s = document.createElement('span'); s.className = 'solo-lector'; s.textContent = ' (se abre en otra pestaña)'; b.appendChild(s); }
      }
      function pintaDetalle(b) {
        const partes = [b.dataset.formato, b.dataset.peso].filter(Boolean);
        let det = b.querySelector('.descarga-detalle');
        if (!partes.length) return;
        if (!det) { det = document.createElement('span'); det.className = 'descarga-detalle'; b.appendChild(det); }
        det.textContent = ` (${partes.join(', ')})`;
      }
      /* Un solo escucha en el documento: con dos formularios en la página,
         sin esta guarda el archivo se descargaría dos veces. */
      if (document.documentElement.dataset.descargaListo !== undefined) return;
      document.documentElement.dataset.descargaListo = '';
      document.addEventListener('click', async (e) => {
        const b = e.target.closest('[data-generar][data-descarga]');
        if (!b || b.getAttribute('aria-busy') === 'true') return;
        const gen = FormKit.descargas[b.dataset.generar];
        if (!gen) return;
        const M = FormKit.config.mensajes;
        b.setAttribute('aria-busy', 'true'); b.setAttribute('aria-disabled', 'true');
        const texto = [...b.childNodes].find((x) => x.nodeType === 3);
        const original = texto ? texto.textContent : '';
        if (texto) texto.textContent = ' Preparando…';
        anuncia(M.descargaPreparando);
        /* Si falla, se dice en un aviso junto al botón, no sólo al lector (FRM-40). */
        const previo = b.nextElementSibling && b.nextElementSibling.matches('[data-descarga-aviso]') ? b.nextElementSibling : null;
        if (previo) previo.hidden = true;
        try {
          const r = await gen();
          const a = document.createElement('a'); a.href = r.url; a.download = r.nombre || 'archivo'; document.body.appendChild(a); a.click(); a.remove();
          if (r.peso) { b.dataset.peso = r.peso; pintaDetalle(b); }
          anuncia(M.descargaLista);
        } catch (err) {
          let av = previo;
          if (!av) { av = document.createElement('div'); av.className = 'aviso'; av.dataset.descargaAviso = ''; b.after(av); }
          FormKit.aviso(av, { tono: 'advertencia', texto: M.descargaError });
        }
        finally { b.removeAttribute('aria-busy'); b.removeAttribute('aria-disabled'); if (texto) texto.textContent = original; }
      });
    }
  });
}());
