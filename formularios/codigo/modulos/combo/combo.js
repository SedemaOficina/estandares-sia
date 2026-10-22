/* =========================================================
   combo.js · Módulo «combo» · nivel RECOMENDADO

   Lista desplegable con búsqueda (combobox ARIA 1.2) para catálogos largos:
   filtra al escribir sin acentos, flechas, Inicio/Fin, Enter elige, Escape
   cierra, y anuncia cuántos resultados hay. El select nativo y el datalist
   los pinta cada sistema a su manera; aquí hay una sola lista en todo el
   paquete.

   Contrato HTML (dentro de un [data-campo] con data-formato opcional):
     <div class="combo" data-combo data-catalogo="alcaldias">
       <input class="control" id="alcaldia" name="alcaldia" type="text">
       <ul class="combo-lista" hidden></ul>
     </div>
   El catálogo se toma de window.FORMKIT_CATALOGOS[nombre]: un arreglo de
   cadenas o de objetos {nombre, detalle, valor}, o el objeto documentado
   {filas, fuente, corte, es_ficticio} con ese arreglo en filas. Nunca se escribe a mano en
   el código: viene de la fuente oficial que declara codigo/catalogos.

   Modo (decisión C4): cerrado por omisión (sólo valores del catálogo; la
   vía de escape es la opción «Otro»). Con data-libre acepta lo escrito y lo
   dice con un renglón «No está en la lista: se guarda como lo escribiste».
   El servidor debe conocer el modo para rechazar valores fuera de catálogo.
   Cerrado, al salir del campo lo escrito queda como en el catálogo
   («coyoacan» → «Coyoacán»), y viaja ese nombre y, si la opción trae valor,
   su clave en payload.claves[campo].
   ========================================================= */
(function () {
  'use strict';
  FormKit.registra('combo', {
    selector: '[data-combo]',
    tipos: {
      combo: {
        detecta: (el) => !!el.querySelector('[data-combo]'),
        controles: (el) => [el.querySelector('[data-combo] input')],
        valorDe: (el) => { const i = el.querySelector('[data-combo] input'); return i ? i.value.trim() : ''; },
        textoDe: (el) => { const i = el.querySelector('[data-combo] input'); return i ? i.value.trim() : ''; },
        enBorrador: true,
        restaura: (el, v) => { const i = el.querySelector('[data-combo] input'); if (i) i.value = v || ''; },
        valida: (el, v) => {
          const wrap = el.querySelector('[data-combo]');
          /* Libre, o cerrada pero sin catálogo (no cargó): se acepta lo escrito y el aviso lo dice. */
          if (wrap.hasAttribute('data-libre') || wrap.hasAttribute('data-sin-catalogo')) return '';
          const lista = catalogo(wrap);
          const n = FormKit.utilidades.normalizaBusqueda(v);
          return lista.some((o) => FormKit.utilidades.normalizaBusqueda(o.nombre) === n) ? '' : FormKit.config.plantilla(FormKit.config.mensajes.soloLista, { etiqueta: etiquetaDe(el) });
        },
        /* En una lista cerrada viaja el nombre como está en el catálogo («Coyoacán», aunque se
           escriba «coyoacan») y, si el catálogo trae una clave propia ({nombre, valor}), también
           ésta, en payload.claves[campo]. */
        alArmar: (form, payload) => {
          for (const wrap of form.querySelectorAll('[data-combo]:not([data-libre])')) {
            const campo = wrap.closest('[data-campo]').dataset.campo;
            if (!(campo in payload.datos)) continue;
            /* Sin catálogo, el servidor lo sabe: lo escrito a mano se revisa al recibirlo. */
            if (wrap.hasAttribute('data-sin-catalogo')) { (payload.meta.sin_catalogo = payload.meta.sin_catalogo || []).push(campo); continue; }
            const o = opcionDe(wrap, payload.datos[campo]);
            if (!o) continue;
            payload.datos[campo] = o.nombre;
            if (o.valor !== undefined) (payload.claves = payload.claves || {})[campo] = o.valor;
          }
        }
      }
    },
    iniciar(form, ctx) {
      const { $, $$, anuncia, plantilla, M, cfg, normalizaBusqueda, limpia, programaBorrador } = ctx;
      for (const wrap of $$('[data-combo]', form)) arma(wrap);
      /* Las filas que se agregan después (repetibles) traen sus propias listas. */
      form.addEventListener('formkit:fila', (e) => { for (const wrap of $$('[data-combo]', e.detail.fila)) arma(wrap); });

      function arma(wrap) {
        if (wrap.dataset.comboListo !== undefined) return;
        wrap.dataset.comboListo = '';
        /* Al armarse ya dice si su catálogo es de ejemplo, sin esperar a que la persona escriba. */
        FormKit.utilidades.avisaFicticio(wrap.dataset.catalogo, (window.FORMKIT_CATALOGOS || {})[wrap.dataset.catalogo]);
        const campo = wrap.closest('[data-campo]');
        const n = campo.dataset.campo;
        const entrada = $('input', wrap);
        const lista = $('.combo-lista', wrap);
        const opciones = catalogo(wrap);
        /* Una lista cerrada cuyo catálogo no cargó: no se puede elegir nada, así que se deja
           escribir a mano y se dice con un aviso a la vista (decisión de la Secretaría). */
        if (!opciones.length && !wrap.hasAttribute('data-libre')) {
          wrap.setAttribute('data-sin-catalogo', '');
          const nota = document.createElement('div'); nota.className = 'combo-sin-lista';
          wrap.after(nota);
          FormKit.aviso(nota, { tono: 'advertencia', texto: M.comboSinLista });
          console.warn(`FormKit: el catálogo «${wrap.dataset.catalogo}» de «${n}» no cargó; la lista acepta lo escrito y el envío lo señala en meta.sin_catalogo.`);
        }
        const libre = wrap.hasAttribute('data-libre') || wrap.hasAttribute('data-sin-catalogo');
        lista.id = lista.id || ctx.idUnico(`lista-${n}`);
        lista.setAttribute('role', 'listbox');
        const etq = $('.etiqueta', campo);
        if (etq) { etq.id = etq.id || ctx.idUnico(`etq-${n}`); lista.setAttribute('aria-labelledby', etq.id); }
        entrada.setAttribute('role', 'combobox');
        entrada.setAttribute('aria-autocomplete', 'list');
        entrada.setAttribute('aria-expanded', 'false');
        entrada.setAttribute('aria-controls', lista.id);
        entrada.autocomplete = 'off';
        let visibles = [];
        let activa = -1;

        function cierra() { lista.hidden = true; entrada.setAttribute('aria-expanded', 'false'); entrada.removeAttribute('aria-activedescendant'); activa = -1; }
        function marcaActiva(k) {
          $$('[role="option"]', lista).forEach((li, i) => li.setAttribute('aria-selected', String(i === k)));
          activa = k;
          const li = k >= 0 ? document.getElementById(`${lista.id}-${k}`) : null;
          if (li) { entrada.setAttribute('aria-activedescendant', li.id); li.scrollIntoView({ block: 'nearest' }); } else entrada.removeAttribute('aria-activedescendant');
        }
        function elige(k) {
          const o = visibles[k];
          if (!o) return;
          entrada.value = o.nombre;
          if (o.valor !== undefined) wrap.dataset.valor = o.valor;
          cierra(); limpia(n); programaBorrador();
          entrada.dispatchEvent(new Event('change', { bubbles: true }));
        }
        function pinta() {
          const q = normalizaBusqueda(entrada.value);
          visibles = opciones.filter((o) => normalizaBusqueda(o.nombre).includes(q)).slice(0, cfg.combo.maxResultados);
          lista.textContent = '';
          visibles.forEach((o, i) => {
            const li = document.createElement('li');
            li.className = 'combo-opcion';
            li.id = `${lista.id}-${i}`;
            li.setAttribute('role', 'option');
            li.setAttribute('aria-selected', 'false');
            const nom = document.createElement('span'); nom.className = 'combo-nombre'; nom.textContent = o.nombre; li.appendChild(nom);
            if (o.detalle) { const d = document.createElement('span'); d.className = 'combo-detalle'; d.textContent = o.detalle; li.appendChild(d); }
            lista.appendChild(li);
          });
          if (!visibles.length || (libre && q && !visibles.some((o) => normalizaBusqueda(o.nombre) === q))) {
            const v = document.createElement('li');
            v.className = 'combo-vacio';
            v.setAttribute('role', 'presentation');
            v.textContent = libre && q ? M.comboLibre : plantilla(M.comboNinguno, { texto: entrada.value });
            lista.appendChild(v);
          }
          lista.hidden = false;
          entrada.setAttribute('aria-expanded', 'true');
          marcaActiva(-1);
          anuncia(visibles.length === 0 ? plantilla(M.comboNinguno, { texto: entrada.value }) : visibles.length === 1 ? M.comboUno : plantilla(M.comboVarios, { n: visibles.length }));
        }

        /* Sólo cuando la persona escribe en el campo: si la página lo llena
           (al retomar un borrador), la lista no se abre ni anuncia ni tapa la
           pregunta siguiente. */
        entrada.addEventListener('input', () => { if (document.activeElement === entrada) pinta(); });
        /* Clic (no foco): al llegar desde el resumen de errores la lista no debe tapar el mensaje. */
        entrada.addEventListener('click', () => { if (lista.hidden) pinta(); });
        entrada.addEventListener('keydown', (e) => {
          if (e.key === 'ArrowDown') { e.preventDefault(); if (lista.hidden) pinta(); marcaActiva(Math.min(activa + 1, visibles.length - 1)); }
          else if (e.key === 'ArrowUp' && !lista.hidden) { e.preventDefault(); marcaActiva(Math.max(activa - 1, 0)); }
          else if (e.key === 'Home' && !lista.hidden && activa >= 0) { e.preventDefault(); marcaActiva(0); }
          else if (e.key === 'End' && !lista.hidden && activa >= 0) { e.preventDefault(); marcaActiva(visibles.length - 1); }
          else if (e.key === 'Enter' && !lista.hidden) { e.preventDefault(); if (activa >= 0) elige(activa); else cierra(); }
          else if (e.key === 'Escape' && !lista.hidden) { e.preventDefault(); e.stopPropagation(); cierra(); }
        });
        /* mousedown (no click) para que la entrada no pierda el foco antes de elegir. */
        lista.addEventListener('mousedown', (e) => { e.preventDefault(); const li = e.target.closest('[role="option"]'); if (li) elige(Number(li.id.split('-').pop())); });
        /* Al salir, lo escrito queda como en el catálogo: «coyoacan» → «Coyoacán». */
        entrada.addEventListener('blur', () => {
          cierra();
          const o = libre ? null : opcionDe(wrap, entrada.value);
          if (o && entrada.value !== o.nombre) { entrada.value = o.nombre; entrada.dispatchEvent(new Event('change', { bubbles: true })); }
        });
      }
    }
  });

  /* La etiqueta sin el asterisco ni la palabra que lo lee el lector («obligatorio» o la que diga la configuración). */
  function etiquetaDe(el) {
    const e = el.querySelector('.etiqueta');
    if (!e) return el.dataset.campo;
    const c = e.cloneNode(true);
    for (const x of c.querySelectorAll('.marca-oblig,.solo-lector')) x.remove();
    return c.textContent.replace(/\s+/g, ' ').trim();
  }

  /* La opción del catálogo que corresponde a un texto, sin acentos ni mayúsculas. */
  function opcionDe(wrap, texto) {
    const n = FormKit.utilidades.normalizaBusqueda(String(texto || '').trim());
    return n ? catalogo(wrap).find((o) => FormKit.utilidades.normalizaBusqueda(o.nombre) === n) || null : null;
  }

  function catalogo(wrap) {
    const cat = (window.FORMKIT_CATALOGOS || {})[wrap.dataset.catalogo];
    FormKit.utilidades.avisaFicticio(wrap.dataset.catalogo, cat);
    const lista = Array.isArray(cat) ? cat : (cat && Array.isArray(cat.filas) ? cat.filas : []);
    const vistos = new Set();
    return lista.map((o) => (typeof o === 'string' ? { nombre: o } : o)).filter((o) => o && o.nombre && !vistos.has(o.nombre) && vistos.add(o.nombre));
  }
}());
