/* =========================================================
   acuse.js · Módulo «acuse» · nivel RECOMENDADO

   Pantalla de acuse al terminar: marca de recibido, folio copiable, fecha,
   «qué sigue» como secuencia y, si el servidor lo da, descarga del acuse.
   El foco va al título del acuse y se anuncia; el borrador ya lo borró el
   núcleo. También muestra la pantalla de límite de envíos (data-limite).

   Contrato HTML (fuera del <form>):
     <section class="tarjeta acuse" data-acuse hidden>
       <div class="acuse-marca" aria-hidden="true">…icono ok…</div>
       <h2 class="titulo-paso" tabindex="-1">Recibimos tu información</h2>
       <div class="acuse-datos">
         <div class="acuse-dato"><span class="acuse-etq">Folio</span>
           <div class="acuse-fila"><span class="acuse-valor" id="folio" data-acuse-folio></span>
             <button type="button" class="btn-enlace" data-copiar="#folio">Copiar folio</button></div></div>
         <div class="acuse-dato"><span class="acuse-etq">Recibido el</span><span data-acuse-fecha></span></div>
       </div>
       <ol class="secuencia">…</ol>
       <div class="acuse-acciones">
         <a class="btn btn-secundario" data-acuse-descarga hidden download>Descargar acuse (PDF, <span data-acuse-peso></span>)</a>
         <a class="btn btn-primario" href="/">Volver al inicio</a>
       </div>
     </section>
     <section class="tarjeta" data-limite hidden>
       <h2 class="titulo-paso" tabindex="-1">Por ahora no podemos recibir más envíos</h2>
       <button type="button" class="btn btn-primario" data-accion="reintentar">Volver</button>
     </section>
   La respuesta del servidor debe traer {folio, fecha} y opcionalmente
   {acuseUrl, acusePeso, acuseNombre}. La fecha se escribe con
   FormKit.utilidades.fechaHora (zona de la Ciudad, 24 horas); sin folio, el
   acuse lo dice con palabras, y sin fecha válida usa la hora en que llegó.

   El folio y la fecha (no los datos de la persona) se guardan en el
   dispositivo: si la persona recarga la página, vuelve a ver su acuse durante
   cfg.acuse.horasVisible. Un botón [data-acuse-nuevo] en el acuse («Llenar
   otra solicitud») lo olvida y abre el formulario vacío.

   Mientras se ve el acuse o el límite, lo que acompaña al formulario fuera de
   él (la barra de pasos .barra-fija, la franja del borrador y el aviso de
   guardado) se oculta, y vuelve como estaba al regresar al formulario.
   ========================================================= */
(function () {
  'use strict';
  FormKit.registra('acuse', {
    selector: '[data-acuse]',
    fueraDelFormulario: true,
    iniciar(form, ctx) {
      const { $, $$, cfg, M, anuncia, opciones, almacen } = ctx;
      const sec = $('[data-acuse]');
      const limite = $('[data-limite]');
      if (!sec) return;
      const clave = form.dataset.borrador ? `${form.dataset.borrador}:acuse` : '';
      const acompana = $$('.barra-fija, [data-franja-borrador], [data-guardado]');
      const estabaOculto = new Map();

      /* El título que se ve: en un formulario por pasos, el del paso abierto. */
      const tituloVisible = (destino) => $$('.titulo-paso', destino).find((h) => !h.closest('[hidden]')) || $('.titulo-paso', destino);
      function muestraSolo(destino) {
        if (destino === form) { for (const el of acompana) if (estabaOculto.has(el)) el.hidden = estabaOculto.get(el); estabaOculto.clear(); }
        else for (const el of acompana) { if (!estabaOculto.has(el)) estabaOculto.set(el, el.hidden); el.hidden = true; }
        for (const s of [form, sec, limite]) if (s) s.hidden = s !== destino;
        const h = tituloVisible(destino);
        if (h) { h.tabIndex = -1; h.focus(); anuncia(h.textContent); }
      }

      function pinta(respuesta, { recuperado = false } = {}) {
        const r = respuesta && typeof respuesta === 'object' ? respuesta : {};
        const fechaValida = r.fecha && !Number.isNaN(new Date(r.fecha).getTime()) ? r.fecha : new Date().toISOString();
        const folio = $('[data-acuse-folio]', sec);
        if (folio) folio.textContent = r.folio || M.acuseSinFolio;
        const copiar = $('[data-copiar="#folio"]', sec);
        if (copiar) copiar.hidden = !r.folio;
        const fechaTexto = FormKit.utilidades.fechaHora(fechaValida, cfg);
        const fecha = $('[data-acuse-fecha]', sec);
        if (fecha) fecha.textContent = fechaTexto;
        /* «Compartir» lleva el folio y la fecha, no la dirección del formulario (que abre vacío).
           data-compartir-texto puede traer {folio} y {fecha}; sin {folio}, el folio va al final.
           Sin folio no hay nada que compartir. */
        const compartir = $('[data-compartir]', sec);
        if (compartir) {
          if (compartir.dataset.compartirPlantilla === undefined) compartir.dataset.compartirPlantilla = compartir.dataset.compartirTexto || M.acuseCompartir;
          const p = compartir.dataset.compartirPlantilla;
          compartir.dataset.compartirTexto = FormKit.utilidades.plantilla(/\{folio\}/.test(p) ? p : `${p}: {folio}`, { folio: r.folio || '', fecha: fechaTexto });
          compartir.dataset.compartirUrl = '';
          compartir.hidden = !r.folio;
        }
        const desc = $('[data-acuse-descarga]', sec);
        if (desc) {
          desc.hidden = !r.acuseUrl;
          if (r.acuseUrl) { desc.href = r.acuseUrl; desc.download = r.acuseNombre || `acuse-${r.folio || ''}.pdf`; if (r.acusePeso) { const peso = $('[data-acuse-peso]', desc); if (peso) peso.textContent = r.acusePeso; } }
        }
        if (clave && !recuperado) almacen.escribe(clave, JSON.stringify({ folio: r.folio || '', fecha: fechaValida, t: Date.now() }));
        muestraSolo(sec);
      }

      /* Si la página define alEnviar o alFallar, se respeta y se encadena. Se
         lee al enviar, no al iniciar: así vale también el que la página pase
         después en otra llamada a FormKit.iniciar. */
      const dePagina = (k) => (ctx.opcionesPagina || {})[k];
      opciones.alEnviar = (r, f) => { const previo = dePagina('alEnviar'); if (previo) previo(r, f); pinta(r); };
      opciones.alFallar = (e, f) => { const previo = dePagina('alFallar'); if (previo) previo(e, f); if (e && e.limite && limite) muestraSolo(limite); };

      /* «Volver» desde la pantalla de límite devuelve al formulario donde estaba. */
      if (limite) limite.addEventListener('click', (e) => { if (e.target.closest('[data-accion="reintentar"]')) muestraSolo(form); });

      /* «Llenar otra solicitud»: se olvida el acuse y la página empieza de cero. */
      sec.addEventListener('click', (e) => { if (!e.target.closest('[data-acuse-nuevo]')) return; if (clave) almacen.borra(clave); location.reload(); });

      /* Acuse de un envío reciente: la persona recargó o volvió a la página. */
      if (clave) {
        let guardado = null;
        try { guardado = JSON.parse(almacen.lee(clave) || 'null'); } catch (e) { guardado = null; }
        const vigente = guardado && typeof guardado.t === 'number' && Date.now() - guardado.t >= 0 && Date.now() - guardado.t < cfg.acuse.horasVisible * 3600000;
        if (vigente) pinta(guardado, { recuperado: true });
        else if (guardado !== null) almacen.borra(clave);
      }

      FormKit.acuse = { pinta, muestraSolo };
    }
  });
}());
