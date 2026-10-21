/* =========================================================
   pasos.js · Módulo «pasos» · nivel RECOMENDADO (formularios de 2+ pasos)

   Formulario por pasos con barra de avance fija y navegable. Cada círculo
   es un botón: avanzar desde la barra exige lo mismo que «Continuar»;
   retroceder siempre se permite; los pasos futuros quedan habilitados para
   que el teclado pueda inspeccionarlos (decisión C8). Estados: completado
   (palomita), actual (círculo lleno), pendiente, con error (icono). En
   pantalla angosta las etiquetas ceden su lugar a «Paso X de N · Título».
   Al cambiar de paso, el foco va al título y se anuncia; en ningún otro
   momento se mueve el foco por la persona.

   Contrato HTML:
     <div class="barra-fija"><div data-barra="Avance del formulario"></div>
       <p class="recordatorio" data-recordatorio hidden>…</p></div>
     <form data-formkit data-borrador="…">
       <section class="tarjeta" data-paso data-titulo="Situación" hidden>
         <h2 class="titulo-paso">…</h2> …
         <div class="acciones"><button type="button" class="btn-atras" data-accion="atras">…</button>
           <button type="button" class="btn btn-primario" data-accion="siguiente">Continuar</button></div>
       </section>
       … el último paso lleva data-revision si usa el módulo «revision» y el botón data-accion="enviar".
     </form>
   Ganchos que ocupa: validaTodo (revalida todos los pasos al enviar),
   submit (Enter avanza en lugar de enviar), estadoBorrador/restauraBorrador
   (paso actual y pasos hechos) y erroresServidor (abre el primer paso con un
   error que devolvió el servidor).
   ========================================================= */
(function () {
  'use strict';
  FormKit.registra('pasos', {
    selector: '[data-paso]',
    iniciar(form, ctx) {
      const { $, $$, M, plantilla, anuncia, icono, validaContenedor, muestraResumen, quitaResumen, enfocaCampo, envoltura, programaBorrador } = ctx;
      const pasos = $$('[data-paso]', form);
      const barra = $('[data-barra]');
      const recordatorio = $('[data-recordatorio]');
      let actual = 0;
      const hechos = new Set();
      const conError = new Set();

      /* ----- Barra ----- */
      function construyeBarra() {
        if (!barra) return;
        barra.textContent = '';
        const nav = document.createElement('nav');
        nav.setAttribute('aria-label', barra.dataset.barra || M.pasosBarra);
        const lista = document.createElement('ol');
        lista.className = 'pasos';
        pasos.forEach((p, i) => {
          const li = document.createElement('li');
          li.className = 'pasos-item';
          const b = document.createElement('button');
          b.type = 'button';
          b.className = 'pasos-btn';
          b.dataset.ir = String(i);
          const bol = document.createElement('span');
          bol.className = 'pasos-bolita';
          const num = document.createElement('span'); num.className = 'pasos-num'; num.textContent = String(i + 1);
          bol.append(num, icono('palomita', 'icono icono-sm pasos-icono pasos-hecho'), icono('alerta', 'icono icono-sm pasos-icono pasos-error'));
          const etq = document.createElement('span');
          etq.className = 'pasos-etq';
          etq.textContent = p.dataset.titulo;
          b.append(bol, etq);
          li.appendChild(b);
          lista.appendChild(li);
        });
        const txt = document.createElement('p');
        txt.className = 'pasos-actual';
        txt.dataset.pasoActual = '';
        txt.setAttribute('aria-hidden', 'true'); /* el botón actual ya lo dice en su nombre accesible */
        lista.addEventListener('click', (e) => { const b = e.target.closest('[data-ir]'); if (b && !enviando) intentaIr(Number(b.dataset.ir)); });
        nav.append(lista, txt);
        barra.appendChild(nav);
      }

      function pintaBarra() {
        if (!barra) return;
        $$('.pasos-btn', barra).forEach((b, i) => {
          const hecho = hechos.has(i) && i !== actual && !conError.has(i);
          b.toggleAttribute('data-hecho', hecho);
          b.toggleAttribute('data-error', conError.has(i) && i !== actual);
          if (i === actual) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
          const estado = conError.has(i) && i !== actual ? `, ${M.pasoError}` : hecho ? `, ${M.pasoHecho}` : '';
          b.setAttribute('aria-label', `${plantilla(M.pasoTexto, { n: i + 1, total: pasos.length })}: ${pasos[i].dataset.titulo}${estado}`);
        });
        $('[data-paso-actual]', barra).textContent = `${plantilla(M.pasoTexto, { n: actual + 1, total: pasos.length })} · ${pasos[actual].dataset.titulo}`;
      }

      /* ----- Historial del navegador -----
         «Atrás» del navegador (y el gesto de Android) regresa un paso y no saca del formulario
         (decisión de la Secretaría): cada paso que se abre deja una entrada en el historial, con
         la misma dirección. «Adelante» avanza con las mismas reglas que «Continuar». Con el acuse
         a la vista, «Atrás» sale de la página como en cualquier otra; desde la pantalla de límite,
         regresa al formulario. */
      const idHistorial = form.id || 'formkit';
      const esNuestro = (st) => !!st && st.formkitForm === idHistorial && Number.isInteger(st.formkitEntrada) && Number.isInteger(st.formkitPaso);
      const estadoHistorial = (i) => ({ ...(history.state && typeof history.state === 'object' ? history.state : {}), formkitForm: idHistorial, formkitEntrada: entrada, formkitPaso: i });
      /* Al recargar se conserva el número de entrada: las anteriores siguen en el historial. */
      let entrada = esNuestro(history.state) ? history.state.formkitEntrada : 0;
      const pasoDeEntrada = new Map();
      if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
      let enviando = false;

      /* ----- Navegación ----- */
      function ir(i, { foco = true, historial = true } = {}) {
        if (historial && i !== actual) { entrada++; pasoDeEntrada.set(entrada, i); history.pushState(estadoHistorial(i), ''); }
        actual = i;
        pasos.forEach((p, k) => { p.hidden = k !== i; });
        quitaResumen();
        form.dispatchEvent(new CustomEvent('formkit:paso', { detail: { indice: i, paso: pasos[i], total: pasos.length } }));
        pintaBarra();
        if (foco) {
          const h = $('.titulo-paso', pasos[i]);
          if (h) { h.tabIndex = -1; h.focus(); }
          anuncia(plantilla(M.pasoAnuncio, { n: i + 1, total: pasos.length, titulo: pasos[i].dataset.titulo }));
        }
        programaBorrador();
      }

      /* Avanzar valida cada paso intermedio y se detiene en el primero con
         errores. Retroceder no valida: no se castiga volver. */
      function intentaIr(destino, { historial = true } = {}) {
        if (destino === actual) return true;
        if (destino < actual) { ir(destino, { historial }); return true; }
        for (let i = actual; i < destino; i++) {
          const fallos = validaContenedor(pasos[i]);
          if (fallos.length) { conError.add(i); ir(i, { foco: false, historial }); muestraResumen(pasos[i], fallos); pintaBarra(); return false; }
          conError.delete(i);
          hechos.add(i);
        }
        ir(destino, { historial });
        return true;
      }

      /* La entrada del historial a la que se llegó con «Atrás» o «Adelante». */
      window.addEventListener('popstate', (e) => {
        if (!esNuestro(e.state)) return;
        const acuse = document.querySelector('[data-acuse]');
        if (form.hidden && acuse && !acuse.hidden) { history.go(-(e.state.formkitEntrada + 1)); return; }
        if (form.hidden && FormKit.acuse) FormKit.acuse.muestraSolo(form);
        entrada = e.state.formkitEntrada;
        pasoDeEntrada.set(entrada, e.state.formkitPaso);
        /* Si avanzar no se puede (falta algo en un paso), la entrada dice el paso que se ve. */
        if (!intentaIr(Math.min(Math.max(e.state.formkitPaso, 0), pasos.length - 1), { historial: false })) history.replaceState(estadoHistorial(actual), '');
      });

      /* Al enviar se revalidan TODOS los pasos: la persona pudo saltar con la
         barra o editar desde la revisión. El primero con errores se abre. */
      FormKit.ganchos.validaTodo = (f) => {
        if (f !== form) return null;
        for (let i = 0; i < pasos.length; i++) {
          const fallos = validaContenedor(pasos[i]);
          if (fallos.length) { conError.add(i); ir(i, { foco: false }); muestraResumen(pasos[i], fallos); pintaBarra(); return fallos; }
          conError.delete(i);
        }
        return [];
      };
      /* Errores que devuelve el servidor: se abre el primer paso que tiene uno y ahí va el resumen. */
      FormKit.ganchos.erroresServidor = (f, fallos) => {
        if (f !== form) return false;
        const i = pasos.findIndex((p) => fallos.some((x) => p.contains(envoltura(x.campo))));
        if (i < 0) return false;
        conError.add(i); ir(i, { foco: false }); muestraResumen(pasos[i], fallos.filter((x) => pasos[i].contains(envoltura(x.campo))), 'servidor'); pintaBarra();
        return true;
      };
      /* Enter en un campo intermedio avanza; sólo en el último paso envía. */
      FormKit.ganchos.submit = (f, enviar) => { if (f !== form) return false; if (actual < pasos.length - 1) $('[data-accion="siguiente"]', pasos[actual])?.click(); else enviar(); return true; };

      form.addEventListener('click', (e) => {
        const b = e.target.closest('[data-accion="siguiente"],[data-accion="atras"],[data-editar]');
        if (!b || !form.contains(b) || enviando) return;
        if (b.dataset.accion === 'siguiente') intentaIr(actual + 1);
        /* «Atrás» del formulario y el del navegador hacen lo mismo: si la entrada anterior es el
           paso anterior, se regresa a ella; así el historial no se llena de idas y vueltas. */
        else if (b.dataset.accion === 'atras') { if (entrada > 0 && pasoDeEntrada.get(entrada - 1) === actual - 1) history.back(); else ir(actual - 1); }
        else if (b.dataset.editar) { const n = b.dataset.editar; const i = pasos.findIndex((p) => p.contains(envoltura(n))); if (i >= 0) { ir(i, { foco: false }); enfocaCampo(n); } }
      });

      /* Mientras se envía no se cambia de paso: el aviso de un envío que falla queda a la vista. */
      form.addEventListener('formkit:enviando', (e) => {
        enviando = e.detail.enviando;
        for (const b of [...$$('[data-accion="atras"]', form), ...(barra ? $$('.pasos-btn', barra) : [])]) { if (enviando) b.setAttribute('aria-disabled', 'true'); else b.removeAttribute('aria-disabled'); }
      });
      /* Algo que el núcleo necesita mostrar (el aviso de envío) está en un paso oculto: se abre ese paso. */
      form.addEventListener('formkit:muestra', (e) => { const i = pasos.findIndex((p) => p.contains(e.detail.elemento)); if (i >= 0 && i !== actual) ir(i, { foco: false }); });

      /* Recordatorio en la barra fija: lo que la persona está haciendo. */
      if (recordatorio && recordatorio.dataset.recordatorio) {
        const n = recordatorio.dataset.recordatorio;
        const pinta = () => { const t = ctx.textoDeValor(n); recordatorio.hidden = !t || actual === 0; const dest = $('[data-recordatorio-texto]', recordatorio); if (dest) dest.textContent = t; };
        form.addEventListener('formkit:paso', pinta);
        form.addEventListener('change', pinta);
      }

      /* Borrador: paso actual y pasos hechos, de este formulario. Un paso que no existe (un
         borrador de otra versión o alterado) lleva al primero. */
      const pasoValido = (x) => (Number.isInteger(x) && x >= 0 && x < pasos.length ? x : 0);
      ctx.alBorrador({
        estado: () => ({ paso: actual, hechos: [...hechos] }),
        restaura: (b) => { if (Array.isArray(b.hechos)) b.hechos.filter((i) => Number.isInteger(i) && i >= 0 && i < pasos.length).forEach((i) => hechos.add(i)); ir(pasoValido(b.paso), { foco: false }); },
        /* El aviso de recuperado dice dónde quedó la persona. */
        resumen: () => plantilla(M.borradorRecuperadoPaso, { n: actual + 1, total: pasos.length, titulo: pasos[actual].dataset.titulo }),
        /* Empezar de nuevo: al primer paso, sin pasos hechos. */
        descarta: () => { hechos.clear(); conError.clear(); ir(0, { foco: false }); }
      });

      /* El margen de desplazamiento es el alto real de la barra fija (crece con el recordatorio
         y con el zoom), o cero cuando la pantalla es baja y la barra deja de ser fija: un campo
         enfocado nunca queda tapado por ella. */
      const fija = barra && barra.closest('.barra-fija');
      if (fija) {
        const mide = () => {
          const s = getComputedStyle(fija);
          const alto = s.position === 'sticky' && !fija.hidden ? fija.getBoundingClientRect().height + (parseFloat(s.marginBottom) || 0) : 0;
          for (const v of ['--alto-barra-fija', '--alto-barra-fija-movil']) document.documentElement.style.setProperty(v, `${Math.ceil(alto)}px`);
        };
        if ('ResizeObserver' in window) new ResizeObserver(mide).observe(fija);
        window.addEventListener('resize', mide);
        mide();
      }

      construyeBarra();
      ir(0, { foco: false, historial: false });
      history.replaceState(estadoHistorial(0), '');
      pasoDeEntrada.set(entrada, 0);
      /* Con el primer paso a la vista, el aviso «la página no terminó de cargar» ya no hace falta. */
      for (const a of $$('[data-carga-pendiente]')) a.hidden = true;

      FormKit.pasos = { ir: intentaIr, actual: () => actual, total: pasos.length, elementos: pasos };
    }
  });
}());
