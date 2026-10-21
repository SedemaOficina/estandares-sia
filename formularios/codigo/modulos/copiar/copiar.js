/* =========================================================
   copiar.js · Módulo «copiar» · nivel RECOMENDADO

   Botón de copiar y de compartir con confirmación visible y anunciada.
     <button type="button" class="btn-enlace" data-copiar="#folio">Copiar folio</button>
     <button type="button" class="btn-enlace" data-compartir data-compartir-titulo="…" data-compartir-texto="…">Compartir</button>
   Si el portapapeles no está disponible, selecciona el texto y lo dice; si
   compartir no existe, copia lo mismo que compartiría (texto y enlace). Con
   data-compartir-url="" se comparte sólo el texto (el acuse comparte su folio,
   no la dirección del formulario). Los campos de solo lectura con
   data-copiable reciben su botón «Copiar» automáticamente.
   ========================================================= */
(function () {
  'use strict';
  FormKit.registra('copiar', {
    selector: '[data-copiar],[data-compartir],[data-copiable]',
    fueraDelFormulario: true,
    iniciar(form, ctx) {
      const { $$, M, anuncia, icono } = ctx;

      /* Campos de solo lectura copiables: botón junto al control. */
      for (const campo of $$('[data-copiable]', form)) {
        const ctl = campo.querySelector('input[readonly],textarea[readonly]');
        if (!ctl || campo.querySelector('[data-copiar]')) continue;
        ctl.id = ctl.id || FormKit.utilidades.idUnico('copiable');
        const grupo = document.createElement('div'); grupo.className = 'copiar-grupo';
        ctl.parentNode.insertBefore(grupo, ctl); grupo.appendChild(ctl);
        const b = document.createElement('button'); b.type = 'button'; b.className = 'btn btn-secundario copiar-btn'; b.dataset.copiar = `#${ctl.id}`;
        b.append(icono('copiar'), document.createTextNode(M.copiarTexto));
        grupo.appendChild(b);
      }

      /* Un solo escucha en el documento aunque haya varios formularios. */
      if (document.documentElement.dataset.copiarListo !== undefined) return;
      document.documentElement.dataset.copiarListo = '';
      document.addEventListener('click', async (e) => {
        const cp = e.target.closest('[data-copiar]');
        if (cp) {
          const origen = document.querySelector(cp.dataset.copiar);
          const texto = origen ? ('value' in origen && origen.value !== undefined && origen.tagName !== 'BUTTON' ? origen.value : origen.textContent).trim() : '';
          const ok = await copia(texto, origen);
          confirma(cp, ok ? M.copiado : M.copiarFallo, ok);
          return;
        }
        const sh = e.target.closest('[data-compartir]');
        if (sh) {
          /* data-compartir-url="" comparte sólo el texto (el acuse: el folio, no la dirección del formulario). */
          const url = sh.dataset.compartirUrl !== undefined ? sh.dataset.compartirUrl : location.href;
          const datos = { title: sh.dataset.compartirTitulo || document.title, text: sh.dataset.compartirTexto || '', ...(url ? { url } : {}) };
          if (navigator.share) { try { await navigator.share(datos); confirma(sh, M.compartido, true); } catch (err) { /* la persona canceló */ } }
          /* Sin la hoja de compartir del equipo, se copia lo mismo que se compartiría. */
          else { const ok = await copia([datos.text, datos.url].filter(Boolean).join(' ')); confirma(sh, `${M.compartirFallo} ${ok ? M.copiado : M.copiarFallo}`, ok); }
        }
      });

      async function copia(texto, origen) {
        try { await navigator.clipboard.writeText(texto); return true; }
        catch (err) {
          if (origen && origen.select) { origen.select(); try { return document.execCommand('copy'); } catch (e2) { return false; } }
          return false;
        }
      }
      /* Confirmación visible en el propio botón y anunciada; vuelve al texto
         original pasado un momento. Se toca sólo el último nodo de texto: el
         icono se conserva. */
      function confirma(b, texto, ok) {
        anuncia(texto, !ok);
        const nodo = [...b.childNodes].reverse().find((x) => x.nodeType === 3 && x.textContent.trim()) || b.appendChild(document.createTextNode(''));
        if (b.dataset.textoOriginal === undefined) b.dataset.textoOriginal = nodo.textContent;
        nodo.textContent = ` ${ok ? M.copiarBoton : M.copiarBotonFallo}`;
        clearTimeout(Number(b.dataset.temporizador));
        b.dataset.temporizador = String(setTimeout(() => { nodo.textContent = b.dataset.textoOriginal; }, FormKit.config.borrador.visibleMs));
      }
    }
  });
}());
