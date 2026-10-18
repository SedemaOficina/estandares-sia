/* =========================================================
   resultado.js · Módulo «resultado» · nivel RECOMENDADO

   El desenlace de una decisión del personal: validar, rechazar, devolver
   para corregir o cerrar un trámite. El acuse es para quien envía; esto es
   para quien decide. Dice con claridad qué pasó, a qué hora y quién lo
   hizo, y cita el motivo si lo hay. El foco va al título y se anuncia.

   FormKit.resultado(lugar, { tono, titulo, texto, hora, quien, motivo, nivel, oculta })
     · tono: ok (validado, aprobado), atencion (devuelto, en espera),
       rechazo (rechazado, cancelado) o neutro (cerrado, archivado);
     · titulo con el resultado y su objeto («Solicitud EJ-123 validada»);
     · hora: Date o fecha ISO del servidor (sin ella, ahora); si no es de
       hoy, también se dice la fecha;
     · quien: nombre de quien decidió, tal como lo da el servidor;
     · motivo: el texto que escribió quien decidió, citado tal cual;
     · nivel del título (2 por omisión);
     · oculta: elemento o lista de elementos que ya no aplican (el panel de
       decisión), que se ocultan.
   Lo que la página ponga en lugar con data-resultado-acciones (por ejemplo,
   «Volver a la bandeja») se conserva al final.

   Contrato HTML:
     <section class="resultado" data-resultado hidden>
       <div class="acciones" data-resultado-acciones>
         <a class="btn btn-primario" href="bandeja.html">Volver a la bandeja</a>
       </div>
     </section>
   ========================================================= */
(function () {
  'use strict';
  const TONOS = {
    ok: { icono: 'ok', clase: 'resultado-ok' },
    atencion: { icono: 'alerta', clase: 'resultado-atencion' },
    rechazo: { icono: 'error', clase: 'resultado-rechazo' },
    neutro: { icono: 'info', clase: '' }
  };

  function resultado(lugar, opciones = {}) {
    const cfg = FormKit.config;
    const M = cfg.mensajes;
    const { plantilla } = FormKit.utilidades;
    const { tono = 'neutro', titulo = '', texto = '', hora, quien = '', motivo = '', nivel = 2, oculta } = opciones;
    const t = TONOS[tono] ? tono : 'neutro';
    const acciones = [...lugar.querySelectorAll(':scope > [data-resultado-acciones]')];

    const cabeza = document.createElement('div');
    cabeza.className = 'resultado-cabeza';
    const marca = document.createElement('span');
    marca.className = 'resultado-marca';
    marca.appendChild(FormKit.icono(TONOS[t].icono));
    const h = document.createElement(`h${Math.min(6, Math.max(2, nivel))}`);
    h.className = 'resultado-titulo';
    h.tabIndex = -1;
    h.textContent = titulo;
    cabeza.append(marca, h);

    /* «Quedó guardado a las 14:30 · Ana López»: la hora en la zona del formulario. */
    const cuando = hora ? new Date(hora) : new Date();
    const zona = { timeZone: cfg.fechas.zonaHoraria };
    const horaTxt = cuando.toLocaleTimeString(cfg.idioma, { ...zona, hour: '2-digit', minute: '2-digit', hour12: false });
    const dia = (d) => d.toLocaleDateString(cfg.idioma, { ...zona, dateStyle: 'long' });
    const esHoy = dia(cuando) === dia(new Date());
    const meta = document.createElement('p');
    meta.className = 'resultado-meta';
    const tiempo = document.createElement('time');
    tiempo.dateTime = cuando.toISOString();
    tiempo.textContent = esHoy ? plantilla(M.resultadoHora, { hora: horaTxt }) : plantilla(M.resultadoFechaHora, { fecha: dia(cuando), hora: horaTxt });
    meta.appendChild(tiempo);
    if (quien) meta.append(document.createTextNode(' · '), Object.assign(document.createElement('span'), { className: 'resultado-quien', textContent: quien }));

    const partes = [cabeza, meta];
    if (texto) partes.push(Object.assign(document.createElement('p'), { className: 'resultado-texto', textContent: texto }));
    if (motivo) {
      const fig = document.createElement('figure');
      fig.className = 'resultado-motivo';
      const rot = document.createElement('figcaption');
      rot.className = 'resultado-motivo-rotulo';
      rot.textContent = M.resultadoMotivo;
      const cita = document.createElement('blockquote');
      cita.className = 'resultado-motivo-texto';
      cita.textContent = motivo;
      fig.append(rot, cita);
      partes.push(fig);
    }

    lugar.classList.add('resultado');
    for (const x of Object.values(TONOS)) if (x.clase) lugar.classList.remove(x.clase);
    if (TONOS[t].clase) lugar.classList.add(TONOS[t].clase);
    lugar.replaceChildren(...partes, ...acciones);
    for (const el of [].concat(oculta || [])) if (el) el.hidden = true;
    lugar.hidden = false;
    h.focus();
    FormKit.anuncia(`${titulo}. ${meta.textContent}.`);
    return lugar;
  }

  FormKit.resultado = resultado;
}());
