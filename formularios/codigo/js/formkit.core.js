/* =========================================================
   formkit.core.js · Estándar de formularios del SIA (SEDEMA) · v1.6.2

   Núcleo obligatorio. Lee la declaración de cada campo de sus ATRIBUTOS
   (required, data-formato, data-si, data-cruzada, data-uso…) y toma
   patrones, límites y mensajes de validaciones.config.js. Decisión C1:
   la superficie para quien programa es el HTML; la fuente de verdad de la
   validación es un solo archivo de configuración.

   Qué hace el núcleo: anuncios que también se ven, avisos (FormKit.aviso),
   preparación de cada campo (marca de obligatorio, ayuda, error, contador),
   visibilidad condicional, validación individual y cruzada con el momento
   acordado (decisión C5), resumen de errores con foco, borrador local, envío
   sin duplicados y registro de módulos. Todo lo demás es un módulo opcional
   (codigo/modulos/*) que se carga sólo si el formulario lo usa.

   Sin dependencias, sin manejadores en línea (eventos por delegación), sin
   valores fijos (todo viene de la configuración). Script clásico para que
   abra desde un archivo local.

   Orden del archivo: utilidades → configuración → instancia (campos,
   validación, resumen, condicionales, borrador, envío) → registro de
   módulos → arranque.
   ========================================================= */
(function (global) {
  'use strict';

  const BASE = global.FORMKIT_VALIDACIONES;
  if (!BASE) throw new Error('FormKit: falta validaciones.config.js; debe cargarse antes que formkit.core.js');

  /* ---------- Utilidades ---------- */
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const plantilla = BASE.plantilla;
  const BYTES_POR_MB = 1048576;
  const BYTES_POR_KB = 1024;
  const MS_POR_DIA = 86400000;
  /* Autocompletado de un secreto: nunca va al borrador del dispositivo. */
  const AUTOCOMPLETE_SECRETO = /(^|\s)(current-password|new-password|one-time-code|cc-[a-z-]+)$/;
  /* Un borrador del estándar: {v, t, datos}. */
  const esBorrador = (b) => !!b && typeof b === 'object' && typeof b.v === 'string' && typeof b.t === 'number' && !!b.datos && typeof b.datos === 'object';
  const vencido = (t, ttlDias) => Date.now() - t > ttlDias * MS_POR_DIA || t > Date.now() + MS_POR_DIA;
  /* Al abrir cualquier formulario se borran los borradores vencidos de todo el sitio, no
     sólo el suyo: en un equipo compartido no queda nada de nadie más allá de su caducidad. */
  let purgado = false;
  function purgaBorradoresVencidos(ttlDias) {
    if (purgado) return;
    purgado = true;
    try {
      const ls = global.localStorage;
      for (let i = ls.length - 1; i >= 0; i--) {
        const k = ls.key(i);
        let b = null;
        try { b = JSON.parse(ls.getItem(k)); } catch (e) { continue; }
        if (esBorrador(b) && vencido(b.t, ttlDias)) ls.removeItem(k);
      }
    } catch (e) { /* sin almacén */ }
  }
  const pesoTxt = (b) => (b < BYTES_POR_MB ? `${Math.max(1, Math.round(b / BYTES_POR_KB))} KB` : `${(b / BYTES_POR_MB).toFixed(1)} MB`);
  const normalizaBusqueda = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  let contadorIds = 0;
  const idUnico = (p) => `${p}-${++contadorIds}`;

  /* Fecha y hora para leer («17 de octubre de 2026 a las 23:27»), en la zona de la
     configuración y con su reloj: 24 horas salvo fechas.horas24 = false. */
  const relojDe = (cfg) => ((cfg.fechas || {}).horas24 === false ? 'h12' : 'h23');
  /* Se arma por partes para que diga lo mismo en todo navegador (el acuse es un
     comprobante): «19 de octubre de 2026 a las 10:00». Una fecha sin hora
     (AAAA-MM-DD) es ese día, sin hora: leída como hora UTC sería el día anterior
     en la Ciudad. Lo que no es una fecha da ''. */
  function fechaHora(valor, cfg = FormKit.config) {
    const soloFecha = typeof valor === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(valor);
    const f = soloFecha ? new Date(`${valor}T12:00:00Z`) : new Date(typeof valor === 'string' && /^\d+$/.test(valor) ? Number(valor) : valor);
    if (valor === null || valor === undefined || valor === '' || Number.isNaN(f.getTime())) return '';
    const partes = new Intl.DateTimeFormat(cfg.idioma, { day: 'numeric', month: 'long', year: 'numeric', hour: 'numeric', minute: '2-digit', hourCycle: relojDe(cfg), timeZone: soloFecha ? 'UTC' : (cfg.fechas || {}).zonaHoraria }).formatToParts(f);
    const g = (t) => (partes.find((p) => p.type === t) || {}).value || '';
    const fecha = `${g('day')} de ${g('month')} de ${g('year')}`;
    if (soloFecha) return fecha;
    const doce = relojDe(cfg) === 'h12';
    const hora = `${doce ? g('hour') : g('hour').padStart(2, '0')}:${g('minute')}${doce ? ` ${g('dayPeriod')}` : ''}`;
    return plantilla((cfg.mensajes || {}).fechaHora || '{fecha} a las {hora}', { fecha, hora });
  }

  /* Fusión profunda de la configuración base con los ajustes del formulario
     (window.FORMKIT_CONFIG): el formulario sólo escribe lo que cambia. */
  function fusiona(base, extra) {
    if (!extra || typeof extra !== 'object' || Array.isArray(extra)) return extra === undefined ? base : extra;
    const out = Array.isArray(base) ? [...base] : { ...base };
    for (const k of Object.keys(extra)) out[k] = fusiona(base ? base[k] : undefined, extra[k]);
    return out;
  }

  /* localStorage puede no existir o lanzar (ventana privada). El formulario
     funciona sin él: sólo pierde el borrador y las sugerencias. */
  const memoria = new Map();
  const almacen = {
    lee(k) { try { return global.localStorage.getItem(k); } catch (e) { return memoria.has(k) ? memoria.get(k) : null; } },
    escribe(k, v) { try { global.localStorage.setItem(k, v); return true; } catch (e) { memoria.set(k, v); return false; } },
    borra(k) { try { global.localStorage.removeItem(k); } catch (e) { /* sin almacén */ } memoria.delete(k); }
  };

  /* Icono del sprite: <svg class="icono"><use href="#i-nombre"></use></svg> */
  function icono(nombre, clase = 'icono') {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', clase);
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    use.setAttribute('href', `#i-${nombre}`);
    svg.appendChild(use);
    return svg;
  }

  /* El sprite se inyecta una vez por página desde iconos.js (generado de
     codigo/iconos/sprite.svg). Si no se cargó, los iconos quedan vacíos y el
     texto que siempre los acompaña sigue diciendo lo mismo. */
  function inyectaSprite() {
    if (!global.FORMKIT_ICONOS || $('[data-sprite-iconos]')) return;
    const cont = document.createElement('div');
    cont.setAttribute('data-sprite-iconos', '');
    cont.hidden = true;
    cont.innerHTML = global.FORMKIT_ICONOS;
    document.body.prepend(cont);
  }

  /* ---------- Anuncios para lector de pantalla ----------
     Todo anuncio también se ve (FRM-40): lo que sólo oye el lector no existe
     para quien ve la pantalla. anuncia(texto, { visible: elemento }) escribe
     el texto también en ese elemento y lo muestra; sin él, lo anunciado ya
     debe estar en pantalla. El segundo argumento también puede ser true
     (asertivo), como antes. */
  let regionAnuncios = null;
  let temporizadorAnuncio = 0;
  function anuncia(texto, opciones = false) {
    const { cortes = false, visible = null } = opciones && typeof opciones === 'object' ? opciones : { cortes: opciones };
    if (visible) { ($('.aviso-texto', visible) || visible).textContent = texto; visible.hidden = false; }
    if (!regionAnuncios) {
      regionAnuncios = $('[data-anuncios]') || document.createElement('div');
      regionAnuncios.className = 'solo-lector';
      regionAnuncios.setAttribute('data-anuncios', '');
      if (!regionAnuncios.parentNode) document.body.appendChild(regionAnuncios);
    }
    regionAnuncios.setAttribute('aria-live', cortes ? 'assertive' : 'polite');
    clearTimeout(temporizadorAnuncio);
    regionAnuncios.textContent = '';
    temporizadorAnuncio = setTimeout(() => { regionAnuncios.textContent = texto; }, FormKit.config.anuncios.retardoMs);
  }

  /* ---------- Avisos (FRM-39) ----------
     FormKit.aviso(lugar, { tono, titulo, texto, pasos, foco }) pinta un aviso
     con el icono y el rol de su tono, su título, su texto y, si hay varias
     acciones en orden, su secuencia «qué sigue» (FRM-84). texto es una cadena
     (va en un <p>) o un nodo, por ejemplo un <p> con un enlace; pasos, una
     lista de cadenas o nodos. Si lugar ya es un .aviso, se pinta ahí; si no,
     va al principio de lugar y sustituye al que haya puesto antes. El cuerpo
     es un <div class="aviso-texto">: una lista no cabe en un <p>, así que un
     <p class="aviso"> se cambia por un <div> con sus mismos atributos (la
     función devuelve el aviso pintado). foco: true cuando responde a una
     acción de la persona. */
  const TONOS_AVISO = {
    neutro: { clase: '', icono: 'info', rol: '' },
    advertencia: { clase: 'aviso-advertencia', icono: 'alerta', rol: '' },
    bloqueo: { clase: 'aviso-bloqueo', icono: 'error', rol: 'alert' },
    ok: { clase: 'aviso-ok', icono: 'ok', rol: 'status' }
  };
  function aviso(lugar, { tono = 'neutro', titulo = '', texto = '', pasos = [], foco = false } = {}) {
    const t = TONOS_AVISO[tono] || TONOS_AVISO.neutro;
    let a = lugar.classList.contains('aviso') ? lugar : $(':scope > [data-aviso-formkit]', lugar);
    if (!a) { a = document.createElement('div'); a.dataset.avisoFormkit = ''; lugar.prepend(a); }
    if (a.tagName === 'P') { const d = document.createElement('div'); for (const at of [...a.attributes]) d.setAttribute(at.name, at.value); a.replaceWith(d); a = d; }
    a.className = ['aviso', t.clase, ...[...a.classList].filter((c) => !/^aviso(-|$)/.test(c))].filter(Boolean).join(' ');
    if (t.rol) a.setAttribute('role', t.rol); else a.removeAttribute('role');
    const cuerpo = document.createElement('div');
    cuerpo.className = 'aviso-texto';
    if (titulo) { const h = document.createElement('strong'); h.className = 'aviso-titulo'; h.textContent = titulo; cuerpo.appendChild(h); }
    for (const x of [].concat(texto)) if (x || x === 0) cuerpo.appendChild(x instanceof Node ? x : Object.assign(document.createElement('p'), { textContent: x }));
    const lista = [].concat(pasos).filter(Boolean);
    if (lista.length) {
      const ol = document.createElement('ol');
      ol.className = 'secuencia';
      for (const x of lista) { const li = document.createElement('li'); li.className = 'secuencia-item'; li.append(x instanceof Node ? x : String(x)); ol.appendChild(li); }
      cuerpo.appendChild(ol);
    }
    a.replaceChildren(icono(t.icono), cuerpo);
    a.hidden = false;
    if (foco) { a.tabIndex = -1; a.focus(); }
    /* Sin rol ni foco nadie lo leería: se anuncia, y ya está a la vista. */
    else if (!t.rol) anuncia([...cuerpo.querySelectorAll(':scope > *, li')].filter((e) => e.tagName !== 'OL').map((e) => e.textContent.trim()).join(' '));
    return a;
  }

  /* ---------- Registro de módulos ----------
     Un módulo declara el selector que lo activa y una función iniciar(form,
     ctx). El núcleo lo llama sólo si el formulario contiene ese selector. */
  const modulos = new Map();
  function registra(nombre, def) { modulos.set(nombre, def); }

  /* ---------- Instancia ---------- */
  function iniciar(formulario, opciones = {}) {
    const form = typeof formulario === 'string' ? $(formulario) : formulario;
    if (!form) throw new Error(`FormKit: no existe el formulario «${formulario}»`);
    /* Un formulario se inicia una sola vez: si ya arrancó solo al
       cargar, la llamada de la página le suma sus opciones (enviar, alEnviar…)
       y recibe la misma instancia, sin duplicar escuchas. */
    const previa = iniciados.get(form);
    if (previa) { Object.assign(previa.extra, opciones); return previa.instancia; }
    /* Opciones en dos capas. La de la página se lee en vivo (quien cambia
       FORMKIT_OPCIONES después de cargar lo ve aplicado) y una segunda llamada
       a iniciar le suma las suyas aparte, sin tocar las globales que comparten
       otros formularios. Encima, lo que escriben los módulos (el acuse
       encadena alEnviar), sólo para este formulario. */
    const base = opciones;
    const extra = {};
    const deModulos = {};
    const opcionesPagina = new Proxy({}, { get: (_, k) => (k in extra ? extra[k] : base[k]), has: (_, k) => k in extra || k in base });
    opciones = new Proxy({}, {
      get: (_, k) => (k in deModulos ? deModulos[k] : opcionesPagina[k]),
      set: (_, k, v) => { deModulos[k] = v; return true; },
      has: (_, k) => k in deModulos || k in opcionesPagina
    });
    const cfg = FormKit.config;
    const M = cfg.mensajes;
    const inicio = performance.now();
    form.setAttribute('novalidate', '');
    inyectaSprite();

    /* El estado de cada campo: dirty (se escribió), tocado (se salió de él). */
    const estado = new Map();
    const estadoDe = (n) => { if (!estado.has(n)) estado.set(n, { dirty: false, tocado: false }); return estado.get(n); };

    /* Tipos de campo que aportan los módulos (archivos, combo, mapa…).
       Cada uno declara cómo se lee su valor y su texto para la revisión. */
    const tipos = new Map();

    /* ----- Campos ----- */
    const envolturas = () => $$('[data-campo]', form);
    /* El nombre va escapado: uno con comillas (de un borrador alterado o del servidor) no rompe el selector. */
    const escapa = (n) => (global.CSS && CSS.escape ? CSS.escape(String(n)) : String(n).replace(/["\\]/g, '\\$&'));
    const envoltura = (n) => $(`[data-campo="${escapa(n)}"]`, form);
    const nombres = () => envolturas().map((el) => el.dataset.campo);

    /* Un dato que calcula la página (data-auxiliar): no tiene controles, no
       se envía ni va al borrador, pero cuenta en condiciones y cruzadas. Su
       valor es el del input oculto (la envoltura misma o el que lleva dentro). */
    const valorAuxiliar = (el) => { const c = el.matches('input') ? el : $('input', el); return c ? String(c.value).trim() : String(el.dataset.valor || '').trim(); };

    function tipoDe(el) {
      if (el.hasAttribute('data-auxiliar')) return 'auxiliar';
      for (const [t, def] of tipos) if (def.detecta(el)) return t;
      if (el.matches('fieldset') || $$('input[type="radio"]', el).length > 1) return $$('input[type="checkbox"]', el).length > 1 ? 'multiple' : 'opcion';
      const c = $('input,select,textarea', el);
      if (c && c.type === 'checkbox') return $$('input[type="checkbox"]', el).length > 1 ? 'multiple' : 'casilla';
      if (c && c.tagName === 'SELECT') return 'select';
      return 'texto';
    }

    function controlesDe(n) {
      const el = envoltura(n);
      const t = tipoDe(el);
      if (t === 'auxiliar') return [];
      if (tipos.has(t)) return tipos.get(t).controles(el);
      if (t === 'opcion') return $$('input[type="radio"]', el);
      if (t === 'multiple') return $$('input[type="checkbox"]', el);
      return $$('input:not([type="hidden"]),select,textarea', el).filter((c) => !c.closest('[data-trampa]'));
    }
    const controlPrincipal = (n) => controlesDe(n)[0] || null;

    function valorDe(n) {
      const el = envoltura(n);
      const t = tipoDe(el);
      if (t === 'auxiliar') return valorAuxiliar(el);
      if (tipos.has(t)) return tipos.get(t).valorDe(el);
      if (t === 'opcion') { const r = $('input[type="radio"]:checked', el); return r ? r.value : ''; }
      if (t === 'multiple') return $$('input[type="checkbox"]:checked', el).map((c) => c.value);
      if (t === 'casilla') return $('input[type="checkbox"]', el).checked ? 'si' : '';
      const c = controlPrincipal(n);
      return c ? String(c.value).trim() : '';
    }

    function textoDeValor(n) {
      const el = envoltura(n);
      const t = tipoDe(el);
      if (t === 'auxiliar') return valorAuxiliar(el);
      if (tipos.has(t)) return tipos.get(t).textoDe(el);
      if (t === 'opcion') { const r = $('input[type="radio"]:checked', el); return r ? (textoDeOpcion(r)) : ''; }
      if (t === 'multiple') return $$('input[type="checkbox"]:checked', el).map(textoDeOpcion).join(', ');
      if (t === 'select') { const s = $('select', el); return s && s.value ? s.selectedOptions[0].textContent.trim() : ''; }
      if (t === 'casilla') return $('input', el).checked ? M.palabraSi : '';
      /* Una fecha se ve como día/mes/año (FRM-30), aunque se guarde como AAAA-MM-DD. */
      if (el.dataset.formato === 'fecha') { const v = valorDe(n); return cfg.dmaDeIso(v) || v; }
      return valorDe(n);
    }
    function textoDeOpcion(input) {
      const lab = input.closest('label') || (input.id && $(`label[for="${input.id}"]`, form));
      const nombre = lab && ($('.opcion-nombre', lab) || lab);
      return nombre ? nombre.textContent.trim() : input.value;
    }

    /* Etiqueta visible del campo, sin la marca de obligatorio ni el texto de su ayuda «?». */
    function etiquetaDe(n) {
      const el = envoltura(n);
      const e = $('.etiqueta', el) || $('legend,label', el);
      if (!e) return el.dataset.etiqueta || n;
      const c = e.cloneNode(true);
      $$('.marca-oblig,.solo-lector,[data-tooltip]', c).forEach((x) => x.remove());
      const texto = c.textContent.replace(/\s+/g, ' ').trim();
      /* Dentro de un grupo repetible, la etiqueta dice de qué fila es: «Nombre (Acompañante 2)». */
      const fila = el.closest('.repetible-fila');
      const tituloFila = fila && $('.repetible-titulo', fila);
      return tituloFila && tituloFila.textContent.trim() ? `${texto} (${tituloFila.textContent.trim()})` : texto;
    }

    const esObligatorio = (n) => { const el = envoltura(n); return el.hasAttribute('data-requerido') || controlesDe(n).some((c) => c.required); };

    /* Un campo cuenta sólo si está activo: visible y sin un ancestro
       condicional oculto. El inactivo no se valida, no se revisa y no viaja. */
    function activo(n) {
      let el = envoltura(n);
      /* Un paso oculto no desactiva sus campos: sólo cambia qué se ve. */
      while (el && el !== form) { if (el.hidden && !el.hasAttribute('data-paso')) return false; el = el.parentElement; }
      return true;
    }

    /* Atributos de validación del control, leídos una vez por llamada. */
    function atributosDe(n) {
      const c = controlPrincipal(n) || envoltura(n);
      const a = {};
      for (const k of ['min', 'max', 'step', 'minlength', 'maxlength']) if (c.hasAttribute(k)) a[k] = c.getAttribute(k);
      if (c.hasAttribute('data-legible')) a.legible = true;
      for (const [k, v] of Object.entries(envoltura(n).dataset)) a[k] = v;
      /* «Hoy» se calcula al validar, no al cargar: con la página abierta al pasar la medianoche, hoy ya es otro día. */
      if (c.hasAttribute && c.hasAttribute('data-max-hoy')) { const hoy = cfg.hoyISO(); a.max = hoy; if (c.max !== hoy) c.max = hoy; }
      /* Mínimo o máximo que dependen de otras respuestas: data-min-segun="clave"
         usa la función FORMKIT_CONFIG.limitesSegun[clave](datos); el servidor
         recibe la misma función en opciones.limitesSegun. */
      for (const [lim, clave] of [['min', a.minSegun], ['max', a.maxSegun]]) {
        const fn = clave && cfg.limitesSegun && cfg.limitesSegun[clave];
        if (typeof fn !== 'function') continue;
        const r = fn(datosActuales());
        if (r !== undefined && r !== null && r !== '') a[lim] = String(r);
      }
      return a;
    }
    /* Valores de los campos activos, para las funciones que dependen de otras respuestas. */
    const datosActuales = () => Object.fromEntries(nombres().filter((m) => activo(m)).map((m) => [m, valorDe(m)]));

    /* Ayuda de bloque (.ayuda-bloque): una sola ayuda bajo el título de una
       sección que vale igual para todos sus campos (nombre y apellidos). Cubre
       los campos que le siguen dentro de su contenedor, hasta el siguiente
       título o la siguiente ayuda de bloque, y se enlaza a cada uno. */
    function ayudasDeBloque(el) {
      const ids = [];
      for (const ab of $$('.ayuda-bloque', form)) {
        if (!ab.textContent.trim()) continue;
        for (let s = ab.nextElementSibling; s; s = s.nextElementSibling) {
          if (/^H[1-6]$/.test(s.tagName) || s.classList.contains('ayuda-bloque')) break;
          if (s === el || s.contains(el)) { ab.id = ab.id || idUnico('ayuda-bloque'); ids.push(ab.id); break; }
        }
      }
      return ids;
    }

    /* ----- Preparación de cada campo ----- */
    function preparaCampo(n) {
      const el = envoltura(n);
      const t = tipoDe(el);
      if (t === 'auxiliar') return;
      const etq = $('.etiqueta', el);
      if (etq && esObligatorio(n) && !$('.marca-oblig', etq)) {
        const ast = document.createElement('span');
        ast.className = 'marca-oblig';
        ast.setAttribute('aria-hidden', 'true');
        ast.textContent = '*';
        const pal = document.createElement('span');
        pal.className = 'solo-lector';
        pal.textContent = ` (${M.palabraObligatorio})`;
        etq.append(ast, pal);
      }
      const ayuda = $('.ayuda', el);
      if (ayuda && !ayuda.id) ayuda.id = idUnico(`ayuda-${n}`);

      let err = $('.err', el);
      if (!err) {
        err = document.createElement('p');
        err.className = 'err';
        err.append(icono('error', 'icono icono-sm err-icono'), document.createElement('span'));
        /* El error va al final de la envoltura: después del control y de la
           lista de opciones, nunca entre la etiqueta y el control. */
        el.appendChild(err);
      }
      err.id = err.id || idUnico(`err-${n}`);

      const deBloque = ayudasDeBloque(el);
      for (const c of controlesDe(n)) {
        const ids = [...deBloque, ayuda && ayuda.textContent.trim() ? ayuda.id : '', err.id].filter(Boolean).join(' ');
        c.setAttribute('aria-describedby', ids);
        /* aria-required sólo en controles de formulario: un botón (la zona de
           carga de archivos) no lo admite; ahí lo dicen el asterisco y el error. */
        if (esObligatorio(n) && /^(INPUT|SELECT|TEXTAREA)$/.test(c.tagName) && c.type !== 'radio' && c.type !== 'checkbox') c.setAttribute('aria-required', 'true');
        const f = cfg.formatos[el.dataset.formato];
        if (f && f.inputmode && !c.hasAttribute('inputmode') && c.tagName === 'INPUT') c.setAttribute('inputmode', f.inputmode);
        if (c.tagName === 'INPUT' && !c.hasAttribute('enterkeyhint') && c.type !== 'radio' && c.type !== 'checkbox' && c.type !== 'file') c.setAttribute('enterkeyhint', 'next');
      }

      /* Fecha y hora: límites por omisión (hoy) cuando el campo lo declara. */
      const ctl = controlPrincipal(n);
      if (ctl && el.dataset.formato === 'fecha' && el.hasAttribute('data-no-futura') && !ctl.max) { ctl.max = cfg.hoyISO(); ctl.dataset.maxHoy = ''; }

      /* Contraseña: botón «Mostrar» / «Ocultar» dentro del campo, a la derecha
         (aria-pressed), para revisar lo escrito; el control va en
         .contrasena-caja, que en una .fila ocupa el renglón del control. Se
         omite con data-sin-mostrar en el campo. */
      if (ctl && ctl.type === 'password' && !el.hasAttribute('data-sin-mostrar') && !$('[data-ver-contrasena]', el)) {
        if (!ctl.id) ctl.id = idUnico(`c-${n}`);
        let caja = ctl.closest('.contrasena-caja');
        if (!caja) { caja = document.createElement('div'); caja.className = 'contrasena-caja'; ctl.replaceWith(caja); caja.appendChild(ctl); }
        const ver = document.createElement('button');
        ver.type = 'button';
        ver.className = 'contrasena-ver';
        ver.dataset.verContrasena = '';
        ver.setAttribute('aria-pressed', 'false');
        ver.setAttribute('aria-controls', ctl.id);
        const t = document.createElement('span'); t.dataset.verTexto = ''; t.textContent = M.contrasenaMostrar;
        const lector = document.createElement('span'); lector.className = 'solo-lector'; lector.textContent = plantilla(M.contrasenaLector, { etiqueta: etiquetaDe(n) }); /* nombre único: «Mostrar: Contraseña», «Mostrar: Confirma tu contraseña» */
        ver.append(t, lector);
        caja.appendChild(ver);
      }

      /* Texto largo: contador y crecimiento automático. */
      const area = t === 'texto' ? $('textarea', el) : null;
      if (area) {
        if (area.maxLength > 0 && !$('.contador', el)) {
          const cont = document.createElement('p');
          cont.className = 'contador';
          cont.setAttribute('aria-hidden', 'true');
          area.insertAdjacentElement('afterend', cont);
        }
        actualizaContador(n);
        autoAlto(area);
      }
    }

    /* El contador cuenta como el mensaje de error: sin los espacios repetidos ni los de los
       extremos, que no se guardan («40 / 600» y «van 35» no pueden convivir). */
    function actualizaContador(n) {
      const el = envoltura(n);
      const cont = $('.contador', el);
      const area = $('textarea', el);
      const f = cfg.formatos[el.dataset.formato || 'texto'];
      if (cont && area) cont.textContent = `${(f ? f.normaliza(area.value) : area.value).length} / ${area.maxLength}`;
    }
    function autoAlto(area) { area.style.height = 'auto'; area.style.height = `${area.scrollHeight}px`; }

    /* ----- Validación individual ----- */
    function normalizaCampo(n) {
      const el = envoltura(n);
      const f = cfg.formatos[el.dataset.formato];
      const c = controlPrincipal(n);
      if (!f || !c || c.tagName === 'SELECT' || c.type === 'file' || c.type === 'checkbox' || c.type === 'radio') return;
      const limpio = f.normaliza(c.value);
      if (limpio !== c.value) c.value = limpio;
    }

    function validaCampo(n) {
      if (!activo(n)) return '';
      const el = envoltura(n);
      const t = tipoDe(el);
      if (t === 'auxiliar') return '';
      const v = valorDe(n);
      const vacio = Array.isArray(v) ? v.length === 0 : !v;
      const datos = { etiqueta: etiquetaDe(n) };
      if (vacio) {
        if (!esObligatorio(n)) return '';
        if (el.dataset.mensaje) return el.dataset.mensaje;
        const clave = { opcion: 'obligatorioOpcion', multiple: 'obligatorioOpcion', select: 'obligatorioOpcion', casilla: 'obligatorioCasilla', archivos: 'obligatorioArchivos', combo: 'obligatorioOpcion' }[t] || 'obligatorioTexto';
        return plantilla(M[clave], datos);
      }
      if (t === 'multiple') {
        const a = atributosDe(n);
        if (a.minOpciones && v.length < Number(a.minOpciones)) return plantilla(M.minimoOpciones, { ...datos, min: a.minOpciones });
        if (a.maxOpciones && v.length > Number(a.maxOpciones)) return plantilla(M.maximoOpciones, { ...datos, max: a.maxOpciones });
        return '';
      }
      if (tipos.has(t) && tipos.get(t).valida) return tipos.get(t).valida(el, v, atributosDe(n)) || '';
      if (t === 'casilla' || t === 'opcion' || t === 'select') return '';
      const a = atributosDe(n);
      const nombreFormato = el.dataset.formato || ($('textarea', el) || a.legible ? 'texto' : '');
      const f = cfg.formatos[nombreFormato];
      if (f) {
        const msg = f.valida(f.normaliza(v), a, cfg);
        if (msg) return msg;
      } else if (a.minlength && v.length < Number(a.minlength)) return plantilla(M.minimoCaracteres, { ...datos, min: a.minlength, n: v.length });
      return '';
    }

    /* Sugerencia sin bloqueo (por ejemplo, dominio de correo mal escrito). */
    function sugerenciaDe(n) {
      const el = envoltura(n);
      const f = cfg.formatos[el.dataset.formato];
      return f && f.sugiere ? f.sugiere(valorDe(n), cfg) : '';
    }

    function marca(n, mensaje, nivel = 'error') {
      const el = envoltura(n);
      const err = $('.err', el);
      if (!err) return;
      if (nivel === 'error') for (const c of controlesDe(n)) c.setAttribute('aria-invalid', 'true');
      err.dataset.nivel = nivel;
      err.lastElementChild.textContent = `${nivel === 'error' ? M.prefijoError : M.advertencia} ${mensaje}`;
      $('use', err).setAttribute('href', nivel === 'error' ? '#i-error' : '#i-alerta');
    }

    function limpia(n) {
      const el = envoltura(n);
      for (const c of controlesDe(n)) c.removeAttribute('aria-invalid');
      const err = $('.err', el);
      if (err) {
        /* Si este campo mostraba una cruzada, los otros campos que marcó también se liberan. */
        for (const otro of (err.dataset.cruzadaCampos || '').split(' ').filter(Boolean)) if (otro !== n && envoltura(otro)) for (const c of controlesDe(otro)) { c.removeAttribute('aria-invalid'); c.setAttribute('aria-describedby', (c.getAttribute('aria-describedby') || '').split(' ').filter((x) => x && x !== err.id).join(' ')); }
        err.lastElementChild.textContent = ''; delete err.dataset.nivel; delete err.dataset.cruzada; delete err.dataset.cruzadaCampos;
      }
      /* Si este campo participa en una cruzada que marcó al otro, también se limpia. */
      for (const otro of camposCruzadosCon(n)) { const e2 = $('.err', envoltura(otro)); if (e2 && e2.dataset.cruzada === n) { e2.lastElementChild.textContent = ''; delete e2.dataset.cruzada; delete e2.dataset.nivel; for (const c of controlesDe(otro)) c.removeAttribute('aria-invalid'); } }
    }

    /* ----- Validaciones cruzadas -----
       Se declaran en el campo que muestra el mensaje:
         data-cruzada="curp-fecha" data-cruzada-campos="curp=curp fecha=nacimiento"
         data-cruzada-nivel="advertencia"  (opcional: degrada el bloqueo) */
    function cruzadasDe(n) {
      const el = envoltura(n);
      if (!el.dataset.cruzada) return [];
      return el.dataset.cruzada.split(/\s+/).filter(Boolean).map((clave, i) => {
        const mapa = {};
        for (const par of (el.dataset.cruzadaCampos || '').split(/\s+/).filter(Boolean)) { const [rol, campo] = par.split('='); mapa[rol] = campo || rol; }
        return { clave, mapa, nivel: el.dataset.cruzadaNivel || (cfg.cruzadas[clave] && cfg.cruzadas[clave].bloquea === false ? 'advertencia' : 'error'), indice: i };
      });
    }
    function camposCruzadosCon(n) {
      const out = new Set();
      for (const m of nombres()) for (const c of cruzadasDe(m)) if (Object.values(c.mapa).includes(n) || m === n) { out.add(m); for (const v of Object.values(c.mapa)) out.add(v); }
      out.delete(n);
      return [...out];
    }
    /* Campos que declaran una cruzada en la que participa n. */
    function declarantesDe(n) {
      return nombres().filter((m) => m !== n && cruzadasDe(m).some((c) => Object.values(c.mapa).includes(n)));
    }
    function validaCruzadas(n) {
      const resultados = [];
      for (const c of cruzadasDe(n)) {
        const def = cfg.cruzadas[c.clave];
        if (!def) continue;
        const valores = {};
        let listo = true;
        /* Un rol declarado en def.opcionales corre vacío: así se puede exigir
           algo justo cuando ese dato falta (sin segundo apellido, X en la CURP). */
        const opcionales = def.opcionales || [];
        for (const rol of def.campos) {
          const campo = c.mapa[rol] || rol;
          const v = envoltura(campo) && activo(campo) ? valorDe(campo) : '';
          if (!v && opcionales.includes(rol)) { valores[rol] = ''; continue; }
          if (!v || validaCampo(campo)) { listo = false; break; }
          const f = cfg.formatos[envoltura(campo).dataset.formato];
          valores[rol] = f ? f.normaliza(v) : v;
        }
        if (!listo) continue;
        const extra = { ...envoltura(n).dataset };
        if (extra.catalogo && global.FORMKIT_CATALOGOS) { const cat = global.FORMKIT_CATALOGOS[extra.catalogo]; extra.catalogo = cat && cat.filas ? cat.filas : cat; }
        const msg = def.valida(valores, extra, cfg);
        if (msg) resultados.push({ mensaje: msg, nivel: c.nivel, campos: Object.values(c.mapa) });
      }
      return resultados;
    }

    /* Valida un campo con sus cruzadas y pinta el resultado. Devuelve el
       mensaje bloqueante o ''. */
    function validaYPinta(n) {
      const msg = validaCampo(n);
      if (msg) { marca(n, msg); return msg; }
      limpia(n);
      const cruz = validaCruzadas(n);
      const bloquea = cruz.find((c) => c.nivel === 'error');
      const aviso = cruz.find((c) => c.nivel !== 'error');
      if (bloquea) {
        marca(n, bloquea.mensaje);
        const err = $('.err', envoltura(n));
        err.dataset.cruzada = n;
        err.dataset.cruzadaCampos = bloquea.campos.join(' ');
        for (const otro of bloquea.campos) if (otro !== n) for (const c of controlesDe(otro)) { c.setAttribute('aria-invalid', 'true'); if (!(c.getAttribute('aria-describedby') || '').includes(err.id)) c.setAttribute('aria-describedby', `${c.getAttribute('aria-describedby') || ''} ${err.id}`.trim()); }
        return bloquea.mensaje;
      }
      if (aviso) { marca(n, aviso.mensaje, 'advertencia'); return ''; }
      /* Sugerencias sin bloqueo: la del formato (dominio de correo) y las que
         registren los módulos (por ejemplo, «Otro» que repite una opción). */
      let sug = sugerenciaDe(n);
      for (const fn of ctx.sugerencias) if (!sug) sug = fn(n) || '';
      if (sug) marca(n, sug, 'advertencia');
      return '';
    }

    /* Valida todos los campos activos de un contenedor (paso o formulario). */
    function validaContenedor(cont) {
      const fallos = [];
      for (const el of $$('[data-campo]', cont)) {
        const n = el.dataset.campo;
        if (!activo(n)) { limpia(n); continue; }
        estadoDe(n).tocado = true;
        normalizaCampo(n);
        const msg = validaYPinta(n);
        if (msg) fallos.push({ campo: n, mensaje: msg });
      }
      return fallos;
    }

    /* ----- Resumen de errores (FRM-28) ----- */
    function quitaResumen(cont = form) { for (const r of $$('.resumen-errores', cont)) r.remove(); }

    /* El resumen dice de qué respuesta se trata: si varias tienen la misma
       etiqueta («Decisión» en cada documento), data-contexto en el campo o en
       un elemento que lo rodea («Identificación oficial») va antes del mensaje. */
    function contextoDe(n) {
      const e = envoltura(n);
      const c = e && e.closest('[data-contexto]');
      return c ? c.dataset.contexto.trim() : '';
    }

    /* origen 'servidor': el título dice que el envío no se completó. */
    function muestraResumen(cont, fallos, origen = '') {
      quitaResumen(cont);
      if (!fallos.length) return null;
      const r = document.createElement('div');
      r.className = 'resumen-errores';
      r.setAttribute('role', 'alert');
      r.tabIndex = -1;
      const tit = document.createElement('p');
      tit.className = 'resumen-errores-titulo';
      const n = fallos.length;
      const titulo = origen === 'servidor'
        ? (n === 1 ? M.resumenServidorUno : plantilla(M.resumenServidorVarios, { n }))
        : (n === 1 ? M.resumenUno : plantilla(M.resumenVarios, { n }));
      tit.append(icono('error'), document.createTextNode(titulo));
      const ul = document.createElement('ul');
      ul.className = 'resumen-errores-lista';
      for (const f of fallos) {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.className = 'resumen-errores-enlace';
        const c = controlPrincipal(f.campo);
        if (c && !c.id) c.id = idUnico(`c-${f.campo}`);
        a.href = `#${c ? c.id : ''}`;
        a.dataset.irCampo = f.campo;
        const contexto = contextoDe(f.campo);
        a.textContent = contexto ? plantilla(M.resumenContexto, { contexto, mensaje: f.mensaje }) : f.mensaje;
        li.appendChild(a);
        ul.appendChild(li);
      }
      r.append(tit, ul);
      /* Antes del primer campo del contenedor, después del título y la bajada. */
      const primero = $('[data-campo],.leyenda-oblig', cont);
      if (primero && primero.parentNode === cont) cont.insertBefore(r, primero); else cont.prepend(r);
      r.focus();
      return r;
    }

    function enfocaCampo(n) {
      const ctls = controlesDe(n);
      const ctl = ctls.find((x) => x.type !== 'radio' || x.checked) || ctls[0];
      if (ctl) ctl.focus();
    }

    /* Cuando ya no queda ningún campo con error, el resumen sobra. */
    function revisaResumen() {
      if (!$('[aria-invalid="true"]', form)) quitaResumen();
    }

    /* ----- Visibilidad condicional -----
       data-si="campo=valor|valor2" en cualquier elemento. El valor de un grupo
       de casillas cuenta si alguna marcada coincide. Oculto = inactivo, y lo
       escrito dentro se conserva (la opción «Otro» recupera su texto). */
    /* Un campo oculto no tiene valor para las condiciones: lo que dependía de
       él también se oculta (condiciones encadenadas, igual que en el servidor). */
    function valorParaCondicion(nombre) {
      if (envoltura(nombre)) { if (!activo(nombre)) return []; const v = valorDe(nombre); return Array.isArray(v) ? v : [v]; }
      const ctls = $$(`[name="${nombre}"]`, form);
      const marcados = ctls.filter((c) => (c.type === 'radio' || c.type === 'checkbox') ? c.checked : true);
      return marcados.map((c) => c.value);
    }
    function aplicaCondicionales() {
      /* Se repite hasta que nada cambie: ocultar un campo puede ocultar lo que dependía de él. */
      for (let vuelta = 0, cambio = true; cambio && vuelta < 20; vuelta++) {
        cambio = false;
        for (const el of $$('[data-si]', form)) {
          const [campo, lista] = el.dataset.si.split('=');
          const admitidos = (lista || '').split('|');
          const actuales = valorParaCondicion(campo.trim());
          const visible = actuales.some((v) => admitidos.includes(v));
          if (el.hidden === visible) {
            el.hidden = !visible;
            cambio = true;
            /* Un campo que se oculta pierde su error: ya no cuenta. */
            if (!visible) for (const c of $$('[data-campo]', el)) limpia(c.dataset.campo);
            if (el.hasAttribute('data-campo') && !visible) limpia(el.dataset.campo);
          }
        }
      }
    }

    /* ----- Borrador local -----
       Se activa con data-borrador="clave" en el <form>. Versionado con
       data-borrador-version. Excluye campos data-sensible, los data-sin-borrador (lo que se
       contesta en cada visita, como el consentimiento) y archivos (éstos, sólo con un proveedor
       que dé la página: opciones.borradorArchivos, en archivos.js). */
    const claveBorrador = form.dataset.borrador || '';
    const versionBorrador = form.dataset.borradorVersion || '1';
    let temporizadorBorrador = 0;
    let temporizadorGuardado = 0;
    let sinAlmacenAvisado = false;
    let arrancado = false;
    let terminado = false;
    const indicador = $('[data-guardado]');
    const franja = $('[data-franja-borrador]');
    /* Lo que la página escribe sola (al precargar una solicitud para continuarla) no es
       un borrador de la persona: el borrador empieza con su primer gesto en el formulario
       (un evento confiable: escribir, elegir, tocar, soltar un archivo). Lo que cambien
       después la página o los módulos entra en el mismo borrador. */
    let personaActuo = false;
    /* Un formulario que sigue en pantalla después de un envío logrado (captura en
       serie) empieza otro registro con el siguiente gesto: vuelve el borrador y la
       clave de idempotencia es otra. */
    for (const t of ['input', 'change', 'click', 'drop']) form.addEventListener(t, (e) => { if (!e.isTrusted) return; personaActuo = true; if (terminado) { terminado = false; idempotencia = ''; } }, true);
    /* Mientras la franja espera que la persona elija «Recuperar» o «Empezar de nuevo»,
       no se escribe nada: lo que escriba antes no reemplaza al borrador guardado. */
    let franjaPendiente = false;
    /* Lo que va en el borrador además de los datos (los archivos, con su proveedor; las
       filas de un repetible): el módulo se suscribe y el núcleo le avisa al escribir,
       restaurar o borrar el borrador. Con estado() aporta campos propios al borrador y
       con prepara(b) rehace su estructura (las filas) antes de que se repongan los valores;
       con resumen(b) agrega una frase al aviso de recuperado («Sigues en el paso 2 de 4…») y
       con descarta() vuelve a su inicio cuando la persona empieza de nuevo. */
    const suscritosBorrador = [];
    const alBorrador = (def) => { suscritosBorrador.push(def); };
    const avisaBorrador = (accion, b) => { for (const x of suscritosBorrador) if (x[accion]) x[accion](b); };
    function borraBorrador() { almacen.borra(claveBorrador); avisaBorrador('borra'); }
    /* Lo que nunca va al borrador del dispositivo: lo sensible (data-sensible), toda
       contraseña o código aunque el campo no lo declare, y lo que se calcula de algo que
       no va (la fecha que sale de la CURP, la edad que sale de esa fecha). */
    function fueraDelBorrador() {
      const fuera = new Set();
      for (const n of nombres()) {
        const el = envoltura(n);
        const c = controlPrincipal(n);
        const ac = c ? c.getAttribute('autocomplete') || '' : '';
        if (el.hasAttribute('data-sensible') || el.dataset.formato === 'contrasena' || (c && c.type === 'password') || AUTOCOMPLETE_SECRETO.test(ac)) fuera.add(n);
      }
      const pendientes = [...fuera];
      while (pendientes.length) {
        const el = envoltura(pendientes.pop());
        const deriva = el && el.dataset.deriva ? el.dataset.deriva : '';
        for (const par of deriva.split(/\s+/).filter(Boolean)) {
          const destino = par.split('=')[1];
          if (destino && !fuera.has(destino) && envoltura(destino)) { fuera.add(destino); pendientes.push(destino); }
        }
      }
      return fuera;
    }
    /* «No guardar en este equipo» ([data-borrador="no-guardar"]): mientras la pestaña siga
       abierta, nada se guarda en el dispositivo. */
    const claveNoGuardar = `${claveBorrador}:no-guardar`;
    let noGuardar = false;
    try { noGuardar = !!claveBorrador && global.sessionStorage.getItem(claveNoGuardar) === '1'; } catch (e) { /* sin almacén de sesión */ }

    /* Dos pestañas con el mismo formulario: lo que guarda una reemplaza el borrador de la otra.
       Cuando otra pestaña guarda, ésta lo dice a la vista; cuando otra envía, ésta deja de
       guardar (no rehace el borrador de una solicitud ya enviada) y también lo dice. El envío
       se avisa con una señal que se escribe y se borra en el acto: no queda nada guardado. */
    const claveSenal = `${claveBorrador}:senal`;
    let enviadoEnOtra = false;
    let otraPestanaAvisada = false;
    function senal(tipo) { try { global.localStorage.setItem(claveSenal, JSON.stringify({ tipo, t: Date.now() })); global.localStorage.removeItem(claveSenal); } catch (e) { /* sin almacén: no hay otras pestañas que avisar */ } }
    if (claveBorrador) global.addEventListener('storage', (e) => {
      if (!arrancado || terminado) return;
      if (e.key === claveBorrador && e.newValue && !otraPestanaAvisada && !enviadoEnOtra) { otraPestanaAvisada = true; aviso(form, { tono: 'advertencia', texto: M.borradorOtraPestana }); }
      if (e.key !== claveSenal || !e.newValue) return;
      let s = null;
      try { s = JSON.parse(e.newValue); } catch (x) { return; }
      if (!s || s.tipo !== 'enviado') return;
      enviadoEnOtra = true;
      clearTimeout(temporizadorBorrador);
      aviso(form, { tono: 'advertencia', texto: M.borradorEnviadoOtraPestana });
    });

    function programaBorrador() {
      if (!claveBorrador || !arrancado || terminado || !personaActuo || franjaPendiente || noGuardar || enviadoEnOtra) return;
      clearTimeout(temporizadorBorrador);
      temporizadorBorrador = setTimeout(escribeBorrador, cfg.borrador.retardoMs);
    }
    function datosBorrador() {
      const datos = {};
      const fuera = fueraDelBorrador();
      for (const n of nombres()) {
        const el = envoltura(n);
        /* data-sin-borrador: lo que se contesta en cada visita (el consentimiento, «No soy un
           programa automático») vuelve sin marcar. */
        if (fuera.has(n) || el.hasAttribute('data-sin-borrador') || tipoDe(el) === 'auxiliar' || tipos.has(tipoDe(el)) && !tipos.get(tipoDe(el)).enBorrador) continue;
        datos[n] = valorDe(n);
      }
      return datos;
    }
    function escribeBorrador() {
      const extra = FormKit.ganchos.estadoBorrador ? FormKit.ganchos.estadoBorrador(form) : {};
      for (const x of suscritosBorrador) if (x.estado) Object.assign(extra, x.estado());
      const ok = almacen.escribe(claveBorrador, JSON.stringify({ v: versionBorrador, t: Date.now(), datos: datosBorrador(), ...extra }));
      avisaBorrador('escribe');
      /* Sin almacén (lleno o bloqueado), se dice una vez y queda a la vista: la persona sabe que no hay borrador. */
      if (!ok && !sinAlmacenAvisado) { sinAlmacenAvisado = true; if (indicador) { indicador.textContent = M.borradorSinAlmacen; indicador.setAttribute('data-visible', ''); } else aviso(form, { tono: 'advertencia', texto: M.borradorSinAlmacen }); }
      if (ok && indicador) {
        indicador.textContent = M.borradorGuardado;
        indicador.setAttribute('data-visible', '');
        clearTimeout(temporizadorGuardado);
        temporizadorGuardado = setTimeout(() => indicador.removeAttribute('data-visible'), cfg.borrador.visibleMs);
      }
    }
    /* Si la persona cierra o cambia de pestaña antes de que venza el retardo,
       el borrador pendiente se escribe en ese momento. */
    window.addEventListener('pagehide', () => { if (temporizadorBorrador && claveBorrador && arrancado && !terminado && !franjaPendiente && !noGuardar && !enviadoEnOtra) { clearTimeout(temporizadorBorrador); escribeBorrador(); } });
    function dejaDeGuardar() {
      noGuardar = true;
      clearTimeout(temporizadorBorrador);
      borraBorrador();
      try { global.sessionStorage.setItem(claveNoGuardar, '1'); } catch (e) { /* sin almacén de sesión: dura hasta recargar */ }
      if (franja) { franja.hidden = true; franjaPendiente = false; }
      aviso(form, { tono: 'neutro', texto: M.borradorNoGuardar, foco: true });
    }
    document.addEventListener('click', (e) => { const b = e.target.closest && e.target.closest('[data-borrador="no-guardar"]'); if (b && claveBorrador && (form.contains(b) || (franja && franja.contains(b)))) dejaDeGuardar(); });

    function leeBorrador() {
      const crudo = almacen.lee(claveBorrador);
      if (!crudo) return null;
      try {
        const b = JSON.parse(crudo);
        if (!esBorrador(b) || b.v !== versionBorrador || vencido(b.t, cfg.borrador.ttlDias)) { borraBorrador(); return null; }
        return b;
      } catch (e) { borraBorrador(); return null; }
    }
    /* Pone al día lo que depende de los valores (condiciones, listas vacías, contadores) cuando
       éstos cambian sin que la persona escriba: al volver con «Adelante» el navegador repone
       por su cuenta lo que había escrito, y al descartar el borrador la pantalla se vacía. */
    function resincroniza() {
      aplicaCondicionales();
      for (const s of $$('select', form)) s.toggleAttribute('data-vacio', !s.value);
      for (const n of nombres()) { actualizaContador(n); const a = $('textarea', envoltura(n)); if (a) autoAlto(a); }
    }
    window.addEventListener('pageshow', resincroniza);

    /* foco: true cuando la persona pidió recuperarlo (el aviso recibe el foco que tenía el botón). */
    function restauraBorrador(b, { foco = false } = {}) {
      avisaBorrador('prepara', b);
      for (const [n, v] of Object.entries(b.datos || {})) {
        const el = envoltura(n);
        /* Lo que se contesta en cada visita no vuelve, aunque lo traiga un borrador de otra versión. */
        if (!el || el.hasAttribute('data-sin-borrador')) continue;
        const t = tipoDe(el);
        if (tipos.has(t)) { if (tipos.get(t).restaura) tipos.get(t).restaura(el, v); continue; }
        if (t === 'opcion') { const r = $$('input[type="radio"]', el).find((x) => x.value === v); if (r) r.checked = true; }
        else if (t === 'multiple') $$('input[type="checkbox"]', el).forEach((c) => { c.checked = Array.isArray(v) && v.includes(c.value); });
        else if (t === 'casilla') $('input', el).checked = !!v;
        else { const c = controlPrincipal(n); if (c) { c.value = v; if (c.tagName === 'SELECT') c.toggleAttribute('data-vacio', !c.value); } }
      }
      aplicaCondicionales();
      for (const n of nombres()) { actualizaContador(n); const a = $('textarea', envoltura(n)); if (a) autoAlto(a); }
      if (FormKit.ganchos.restauraBorrador) FormKit.ganchos.restauraBorrador(form, b);
      avisaBorrador('restaura', b);
      /* A la vista: que se recuperó, dónde quedó la persona (lo dicen los módulos, como el de
         pasos) y qué tiene que volver a llenar porque no se guarda en el equipo (lo sensible; no
         lo que se calcula de ello ni lo que se contesta en cada visita). */
      const textos = [M.borradorRecuperado];
      for (const x of suscritosBorrador) if (x.resumen) { const t = x.resumen(b); if (t) textos.push(t); }
      const derivados = new Set(nombres().flatMap((m) => (envoltura(m).dataset.deriva || '').split(/\s+/).map((p) => p.split('=')[1]).filter(Boolean)));
      const falta = [...fueraDelBorrador()].filter((m) => activo(m) && !derivados.has(m) && !controlesDe(m).some((c) => c.readOnly)).map(etiquetaDe);
      if (falta.length) textos.push(plantilla(M.borradorRecuperadoFalta, { campos: falta.join(', ') }));
      aviso(form, { tono: 'neutro', texto: textos, foco });
    }
    /* «Empezar de nuevo» confirmado: se borra el borrador y también lo que haya en pantalla, aunque
       lo haya repuesto el navegador al volver con «Adelante»; los módulos vuelven a su inicio (el de
       pasos, al primero). El foco va al aviso, que lo dice. */
    function descarta() {
      clearTimeout(temporizadorBorrador);
      borraBorrador();
      form.reset();
      resincroniza();
      avisaBorrador('descarta');
      aviso(form, { tono: 'neutro', texto: M.borradorDescartado, foco: true });
    }
    function iniciaFranja(b) {
      franja.hidden = false;
      franjaPendiente = true;
      const f = $('[data-borrador-fecha]', franja);
      if (f) f.textContent = fechaHora(b.t, cfg);
      /* Con la respuesta de la persona, el borrador vuelve a guardarse con lo que haya en pantalla. */
      const contesta = () => { franja.hidden = true; franjaPendiente = false; programaBorrador(); };
      franja.addEventListener('click', (e) => {
        const a = e.target.closest('[data-borrador]');
        if (!a) return;
        const confirma = $('[data-borrador-confirma]', franja);
        if (a.dataset.borrador === 'recuperar') { contesta(); restauraBorrador(b, { foco: true }); }
        else if (a.dataset.borrador === 'descartar') {
          if (confirma) { confirma.hidden = false; const seguro = $('[data-borrador="conservar"]', franja); if (seguro) seguro.focus(); }
          /* Sin la confirmación en el HTML, se pregunta con el módulo modal; borrar sin preguntar no (FRM-38). */
          else if (FormKit.confirma) FormKit.confirma(a, { titulo: M.borradorDescartarTitulo, texto: M.borradorDescartarTexto, si: M.borradorDescartarSi, peligro: true }).then((ok) => { if (ok) { contesta(); descarta(); } });
          else console.warn('FormKit: la franja del borrador necesita [data-borrador-confirma] o el módulo «modal» para confirmar antes de descartar.');
        }
        else if (a.dataset.borrador === 'descartar-si') { contesta(); descarta(); }
        else if (a.dataset.borrador === 'conservar') { if (confirma) confirma.hidden = true; const r = $('[data-borrador="recuperar"]', franja); if (r) r.focus(); }
      });
    }

    /* ----- Envío ----- */
    function arma() {
      const datos = {};
      for (const n of nombres()) {
        if (!activo(n)) continue;
        const el = envoltura(n);
        const t = tipoDe(el);
        if (t === 'auxiliar' || (tipos.has(t) && tipos.get(t).fueraDeDatos)) continue;
        normalizaCampo(n);
        const v = valorDe(n);
        if (Array.isArray(v) ? v.length : v) datos[n] = v;
      }
      const trampa = $('[data-trampa] input, input[data-trampa]', form);
      const payload = { datos, meta: { version_formulario: versionBorrador, ms_en_formulario: Math.round(performance.now() - inicio), trampa: trampa ? trampa.value : '', idempotencia: claveIdempotencia() } };
      for (const def of tipos.values()) if (def.alArmar) def.alArmar(form, payload);
      return payload;
    }
    /* La clave de idempotencia es la misma mientras no se logre enviar: si
       la persona reintenta, el servidor reconoce el duplicado. */
    let idempotencia = '';
    function claveIdempotencia() { if (!idempotencia) idempotencia = (global.crypto && crypto.randomUUID) ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`; return idempotencia; }

    function envioPorOmision(payload, { signal }) {
      const destino = form.getAttribute('action');
      if (!destino || destino === '#') return Promise.reject(new Error('FormKit: el formulario no declara action ni opciones.enviar'));
      /* Con archivos, multipart: la parte «payload» lleva el JSON (cada archivo con su
         número de parte, sin los bytes) y cada archivo va como una parte «archivo», en ese
         orden. Sin archivos, JSON. En JSON un archivo llegaría como {} y se perdería. */
      const cabeceras = { 'Idempotency-Key': payload.meta.idempotencia };
      let cuerpo;
      if ((payload.archivos || []).some((a) => a && a.blob instanceof Blob)) {
        let parte = 0;
        cuerpo = new FormData();
        cuerpo.append('payload', JSON.stringify({ ...payload, archivos: payload.archivos.map(({ blob, ...resto }) => (blob instanceof Blob ? { ...resto, parte: parte++ } : resto)) }));
        for (const a of payload.archivos) if (a && a.blob instanceof Blob) cuerpo.append('archivo', a.blob, a.nombre);
      } else { cabeceras['Content-Type'] = 'application/json'; cuerpo = JSON.stringify(payload); }
      return fetch(destino, { method: form.getAttribute('method') || 'POST', headers: cabeceras, body: cuerpo, signal })
        .then(async (r) => {
          if (r.status === 429) { const e = new Error('limite'); e.limite = true; throw e; }
          if (!r.ok) {
            /* Un rechazo con {errores: [{campo, mensaje}]}, la misma forma que devuelve validar.mjs, se pinta en cada campo. */
            const e = new Error(`HTTP ${r.status}`);
            const cuerpo = await r.json().catch(() => null);
            if (cuerpo && Array.isArray(cuerpo.errores)) e.errores = cuerpo.errores;
            throw e;
          }
          /* Un 2xx es un envío recibido aunque no traiga JSON (204, «OK»): no se le dice a la persona que falló. */
          const texto = await r.text().catch(() => '');
          try { return texto ? JSON.parse(texto) : {}; } catch (e) { return {}; }
        });
    }

    /* Marca un campo con un error que viene de fuera (por ejemplo, del
       servidor: «Ya hay una cuenta con esta CURP»). Devuelve false si el
       campo no existe en este formulario. */
    function marcaError(n, mensaje) {
      if (!envoltura(n)) return false;
      estadoDe(n).tocado = true;
      marca(n, mensaje);
      return true;
    }

    function botonEnviar() { return $('[data-accion="enviar"],button[type="submit"]', form); }

    /* Un envío a la vez: mientras uno está en curso, otro clic o Enter no lo repite. Los
       módulos se enteran con formkit:enviando ({enviando}): el de pasos no deja cambiar de paso. */
    let enviandoAhora = false;
    const avisaEnviando = (enviando) => form.dispatchEvent(new CustomEvent('formkit:enviando', { detail: { enviando } }));
    async function enviar() {
      if (enviandoAhora) return false;
      /* Al enviar, la contraseña vuelve a ocultarse: que el navegador no la guarde ni la muestre como texto. */
      for (const b of $$('[data-ver-contrasena][aria-pressed="true"]', form)) verContrasena(b, false);
      /* Un módulo (pasos) puede validar por su cuenta; si devuelve null, el formulario no es suyo. */
      const porModulo = FormKit.ganchos.validaTodo ? FormKit.ganchos.validaTodo(form) : null;
      const fallos = porModulo || validaContenedor(form);
      if (fallos.length) { if (!porModulo) muestraResumen(form, fallos); return false; }
      const boton = botonEnviar();
      const avisoEnvio = $('[data-estado-envio]', form);
      if (avisoEnvio) avisoEnvio.hidden = true;
      const textoOriginal = boton ? boton.textContent : '';
      enviandoAhora = true;
      avisaEnviando(true);
      /* «Enviando…» se ve en el botón y se anuncia: el cambio de texto solo no lo oye el lector. */
      if (boton) { boton.setAttribute('aria-disabled', 'true'); boton.setAttribute('aria-busy', 'true'); boton.textContent = M.enviando; }
      anuncia(M.enviando);
      const control = new AbortController();
      let plazo = 0;
      /* El aviso de envío, con su texto (si el HTML no trae .aviso-texto, se crea). Si quedó en
         una parte que no se ve (la persona cambió de paso mientras se enviaba), los módulos la
         abren antes (formkit:muestra). */
      const pintaAvisoEnvio = (texto) => {
        if (!avisoEnvio) { anuncia(texto, true); return; }
        let t = $('.aviso-texto', avisoEnvio);
        if (!t) { t = document.createElement('span'); t.className = 'aviso-texto'; avisoEnvio.appendChild(t); }
        t.textContent = texto; avisoEnvio.hidden = false;
        form.dispatchEvent(new CustomEvent('formkit:muestra', { detail: { elemento: avisoEnvio } }));
        avisoEnvio.focus();
      };
      let respuesta;
      try {
        for (const def of tipos.values()) if (def.antesDeEnviar) await def.antesDeEnviar(form);
        const enviarFn = opciones.enviar || envioPorOmision;
        /* El plazo corre desde que se envía (no mientras se preparan las fotos) y vale aunque
           un enviar propio no atienda la señal: el botón no se queda en «Enviando…». */
        plazo = setTimeout(() => control.abort(), cfg.envio.timeoutMs);
        const vence = new Promise((ok, mal) => control.signal.addEventListener('abort', () => mal(new Error('plazo')), { once: true }));
        respuesta = await Promise.race([enviarFn(arma(), { signal: control.signal }), vence]);
      } catch (e) {
        /* Errores devueltos por el servidor: los de un campo, junto a él y en el resumen; los
           que no son de un campo de la página, con sus palabras en el aviso de envío. */
        const errores = e && Array.isArray(e.errores) ? e.errores.filter((x) => x && typeof x.mensaje === 'string' && x.mensaje) : [];
        const porCampo = errores.filter((x) => typeof x.campo === 'string' && x.campo && marcaError(x.campo, x.mensaje));
        const sinCampo = errores.filter((x) => !porCampo.includes(x)).map((x) => x.mensaje).join(' ');
        if (porCampo.length) {
          const fallos = porCampo.map((x) => ({ campo: x.campo, mensaje: x.mensaje }));
          if (!(FormKit.ganchos.erroresServidor && FormKit.ganchos.erroresServidor(form, fallos))) muestraResumen(form, fallos, 'servidor');
          if (sinCampo) pintaAvisoEnvio(sinCampo);
          if (opciones.alFallar) opciones.alFallar(e, form);
          return false;
        }
        pintaAvisoEnvio(sinCampo || (e && e.limite ? M.envioLimite : control.signal.aborted ? M.envioTimeout : M.envioError));
        if (opciones.alFallar) opciones.alFallar(e, form);
        return false;
      } finally {
        clearTimeout(plazo);
        enviandoAhora = false;
        avisaEnviando(false);
        if (boton) { boton.removeAttribute('aria-disabled'); boton.removeAttribute('aria-busy'); boton.textContent = textoOriginal; }
      }
      /* Recibido. Desde aquí nada cuenta como envío fallido: si la página falla al
         mostrar el acuse, la persona no debe reenviar. El borrador se borra después
         de mostrar el acuse, y la clave se renueva para el siguiente registro. */
      terminado = true;
      idempotencia = '';
      clearTimeout(temporizadorBorrador);
      const recibido = respuesta && typeof respuesta === 'object' ? respuesta : {};
      try {
        if (opciones.alEnviar) opciones.alEnviar(recibido, form);
        else {
          form.dispatchEvent(new CustomEvent('formkit:enviado', { detail: recibido }));
          /* La página tiene un acuse pero su módulo no cargó: al menos se dice que llegó, con su folio. */
          if ($('[data-acuse]')) aviso(form, { tono: 'ok', texto: recibido.folio ? plantilla(M.envioRecibidoFolio, { folio: recibido.folio }) : M.envioRecibido, foco: true });
        }
      } catch (e) { console.error('FormKit: el envío se recibió, pero falló lo que la página hace después (alEnviar).', e); if (!form.hidden) aviso(form, { tono: 'ok', texto: M.envioRecibido, foco: true }); }
      if (claveBorrador) { borraBorrador(); senal('enviado'); }
      if (franja) { franja.hidden = true; franjaPendiente = false; }
      return true;
    }

    /* ----- Eventos (todos aquí; ninguno en el HTML) ----- */
    form.addEventListener('submit', (e) => { e.preventDefault(); if (!(FormKit.ganchos.submit && FormKit.ganchos.submit(form, enviar))) enviar(); });

    /* Después de validar n: las cruzadas que otro campo declara con n se
       repiten si ese campo ya tiene valor (la CURP escrita y luego otra
       fecha), y los límites que dependen de otras respuestas se recalculan
       en los campos ya tocados. */
    function revalidaDependientes(n) {
      for (const d of declarantesDe(n)) if (activo(d) && valorDe(d)) validaYPinta(d);
      for (const el of $$('[data-min-segun],[data-max-segun]', form)) {
        const m = el.dataset.campo;
        if (m && m !== n && activo(m) && estadoDe(m).tocado && valorDe(m)) validaYPinta(m);
      }
    }

    /* Muestra u oculta la contraseña: tipo del control, texto del botón y aria-pressed. */
    function verContrasena(b, ver) {
      const c = document.getElementById(b.getAttribute('aria-controls'));
      if (!c) return;
      c.type = ver ? 'text' : 'password';
      b.setAttribute('aria-pressed', String(ver));
      const t = $('[data-ver-texto]', b);
      if (t) t.textContent = ver ? M.contrasenaOcultar : M.contrasenaMostrar;
    }

    form.addEventListener('click', (e) => {
      const ver = e.target.closest('[data-ver-contrasena]');
      if (ver && form.contains(ver)) { verContrasena(ver, ver.getAttribute('aria-pressed') !== 'true'); return; }
      const b = e.target.closest('[data-ir-campo],[data-accion="enviar"],[aria-disabled="true"]');
      if (!b || !form.contains(b)) return;
      if (b.getAttribute('aria-disabled') === 'true') { e.preventDefault(); e.stopImmediatePropagation(); return; }
      if (b.dataset.irCampo) { e.preventDefault(); enfocaCampo(b.dataset.irCampo); return; }
      if (b.dataset.accion === 'enviar' && b.type !== 'submit') enviar();
    });

    /* Decisión C5: el error aparece al salir del campo la primera vez; una vez
       marcado, se revalida en cada pulsación para que desaparezca en cuanto se
       corrige. Nunca aparece en un campo que la persona no ha tocado. */
    form.addEventListener('input', (e) => {
      const el = e.target.closest('[data-campo]');
      aplicaCondicionales();
      if (el) {
        const n = el.dataset.campo;
        estadoDe(n).dirty = true;
        if (e.target.matches('textarea')) { autoAlto(e.target); actualizaContador(n); }
        if (e.target.matches('select')) e.target.toggleAttribute('data-vacio', !e.target.value);
        const err = $('.err', el);
        if (err && err.dataset.nivel === 'error') { const msg = validaCampo(n); if (!msg) { limpia(n); const cruz = validaCruzadas(n).find((c) => c.nivel === 'error'); if (cruz) marca(n, cruz.mensaje); } else marca(n, msg); revisaResumen(); }
        for (const otro of camposCruzadosCon(n)) { const e2 = $('.err', envoltura(otro)); if (e2 && e2.dataset.cruzada) validaYPinta(otro); }
        /* Un dato calculado por la página no tiene «salir del campo»: lo que depende de él se revisa al cambiar. */
        if (tipoDe(el) === 'auxiliar') { revalidaDependientes(n); revisaResumen(); }
      }
      programaBorrador();
    });
    form.addEventListener('change', (e) => {
      const el = e.target.closest('[data-campo]');
      aplicaCondicionales();
      if (el) {
        const n = el.dataset.campo;
        estadoDe(n).dirty = true;
        /* Las opciones, casillas, selects y fechas se validan al cambiar: no hay «salir del campo» útil. */
        const err = $('.err', el);
        if (e.target.matches('input[type="radio"],input[type="checkbox"],select,input[type="date"],input[type="time"],input[type="file"]')) { if (estadoDe(n).tocado || (err && err.dataset.nivel)) validaYPinta(n); revalidaDependientes(n); revisaResumen(); }
        else if (err && err.dataset.nivel) { validaYPinta(n); revisaResumen(); }
      }
      programaBorrador();
    });
    form.addEventListener('focusout', (e) => {
      const el = e.target.closest('[data-campo]');
      if (!el || !e.target.matches('input,textarea,select')) return;
      /* Pasar a otro control del MISMO campo (día → mes) no es salir; pasar a su botón («Hoy») sí. */
      if (e.relatedTarget && el.contains(e.relatedTarget) && e.relatedTarget.matches('input,select,textarea')) return;
      const n = el.dataset.campo;
      const st = estadoDe(n);
      if (!st.dirty && !valorDe(n)) return; // ni tocó ni escribió: no se regaña
      st.tocado = true;
      normalizaCampo(n);
      if (e.target.matches('textarea')) actualizaContador(n);
      const msg = validaYPinta(n);
      if (msg) anuncia(`${M.prefijoError} ${msg}`);
      revalidaDependientes(n);
      revisaResumen();
    });

    /* Diálogos y copiado los atiende su módulo. El anuncio de envío fallido se
       oculta cuando la persona cambia un dato, no cuando otro elemento recibe
       el foco: al ocultarse con el foco, el botón de abajo subía a media
       pulsación y el clic se perdía. */
    const ocultaAvisoEnvio = () => { const a = $('[data-estado-envio]', form); if (a && !a.hidden) a.hidden = true; };
    form.addEventListener('input', ocultaAvisoEnvio);
    form.addEventListener('change', ocultaAvisoEnvio);

    /* ----- Contexto para los módulos ----- */
    const ctx = {
      form, cfg, M, opciones, opcionesPagina, tipos, sugerencias: [],
      $, $$, plantilla, icono, anuncia, almacen, idUnico, pesoTxt, normalizaBusqueda,
      envoltura, envolturas, nombres, tipoDe, controlesDe, controlPrincipal, valorDe, textoDeValor, etiquetaDe, esObligatorio, activo, atributosDe,
      validaCampo, validaYPinta, validaContenedor, marca, marcaError, limpia, muestraResumen, quitaResumen, revisaResumen, enfocaCampo,
      aplicaCondicionales, programaBorrador, alBorrador, leeBorrador, restauraBorrador, enviar, arma, preparaCampo, estadoDe, datosActuales
    };

    /* ----- Arranque ----- */
    const activos = [];
    for (const [nombre, def] of modulos) {
      const ambito = def.fueraDelFormulario ? document : form;
      /* También cuenta lo que trae la plantilla de una fila que se agregará después. */
      const enPlantilla = () => $$('template', form).some((t) => t.content.querySelector(def.selector));
      if (!def.selector || $(def.selector, ambito) || enPlantilla()) { if (def.tipos) for (const [t, d] of Object.entries(def.tipos)) tipos.set(t, d); activos.push([nombre, def]); }
    }
    for (const n of nombres()) preparaCampo(n);
    /* Cada módulo arranca por su cuenta: si uno falla (un catálogo con una fila rara), los
       demás y el formulario siguen funcionando, y la consola dice cuál fue. */
    for (const [nombre, def] of activos) {
      if (!def.iniciar) continue;
      try { def.iniciar(form, ctx); } catch (e) { console.error(`FormKit: el módulo «${nombre}» no arrancó.`, e); }
    }
    for (const s of $$('select', form)) s.toggleAttribute('data-vacio', !s.value);
    aplicaCondicionales();
    purgaBorradoresVencidos(cfg.borrador.ttlDias);
    if (claveBorrador && !noGuardar) {
      const previo = leeBorrador();
      if (previo) { if (franja) iniciaFranja(previo); else restauraBorrador(previo); }
    }
    arrancado = true;
    form.dataset.formkit = 'listo';
    /* El aviso «la página no terminó de cargar» ([data-carga-pendiente]) está en el HTML: si el
       núcleo arrancó, se oculta. En un formulario por pasos lo oculta el módulo de pasos al
       mostrar el primero (si pasos.js no cargó, el aviso se queda). */
    if (!$('[data-paso]', form)) for (const a of $$('[data-carga-pendiente]')) a.hidden = true;

    const instancia = {
      ctx,
      modulos: activos.map(([n]) => n),
      payload: arma,
      valida: () => validaContenedor(form),
      enviar,
      marcaError,
      /* Inventario de datos personales: qué se pide, para qué y con qué finalidad (FRM-55). */
      /* «sensible»: no va al borrador del dispositivo (también lo derivado de algo sensible).
         Los campos de un grupo repetible se listan una vez, con su patrón (grupo.#.campo),
         aunque todavía no haya filas. */
      inventario: () => {
        const fuera = fueraDelBorrador();
        const lista = nombres().filter((n) => !/\.\d+\./.test(n)).map((n) => { const d = envoltura(n).dataset; return { campo: n, etiqueta: etiquetaDe(n), obligatorio: esObligatorio(n), uso: d.uso || '', datoPersonal: d.finalidad !== undefined, finalidad: d.finalidad || '', sensible: fuera.has(n), formato: d.formato || '', autocomplete: controlPrincipal(n) ? controlPrincipal(n).getAttribute('autocomplete') || '' : '' }; });
        for (const tpl of $$('template[data-repetible-plantilla]', form)) {
          for (const el of tpl.content.querySelectorAll('[data-campo]')) {
            const d = el.dataset; const c = el.querySelector('input, select, textarea'); const et = el.querySelector('.etiqueta');
            lista.push({ campo: d.campo, etiqueta: et ? et.textContent.trim() : d.campo, obligatorio: d.requerido !== undefined, uso: d.uso || '', datoPersonal: d.finalidad !== undefined, finalidad: d.finalidad || '', sensible: d.sensible !== undefined || d.formato === 'contrasena', formato: d.formato || '', autocomplete: c ? c.getAttribute('autocomplete') || '' : '' });
          }
        }
        return lista;
      }
    };
    instancias.push(instancia);
    iniciados.set(form, { instancia, extra });
    return instancia;
  }

  /* Formularios iniciados en la página, para marcar un error desde fuera
     sin tener a mano la instancia. */
  const instancias = [];
  /* Cada formulario iniciado, con sus opciones: para no iniciarlo dos veces. */
  const iniciados = new WeakMap();
  const marcaErrorGlobal = (campo, mensaje) => instancias.some((i) => i.marcaError(campo, mensaje));

  const FormKit = {
    version: BASE.version,
    config: fusiona(BASE, global.FORMKIT_CONFIG || {}),
    registra, iniciar, anuncia, aviso, icono, almacen,
    /* FormKit.marcaError(campo, mensaje): pinta el error junto al campo, en el formulario que lo tenga. */
    marcaError: marcaErrorGlobal,
    utilidades: { $, $$, plantilla, pesoTxt, normalizaBusqueda, idUnico, fusiona, fechaHora, relojDe },
    /* Ganchos que un módulo puede ocupar: validaTodo (pasos), submit, estadoBorrador, restauraBorrador, erroresServidor. */
    ganchos: {}
  };
  global.FormKit = FormKit;

  /* Arranque declarativo: todo <form data-formkit> se inicia solo al cargar
     la página, con la configuración global. Quien necesite opciones (enviar,
     alEnviar) llama FormKit.iniciar(form, opciones) desde su arranque. */
  document.addEventListener('DOMContentLoaded', () => {
    for (const f of $$('form[data-formkit=""]')) if (f.dataset.formkit !== 'listo') iniciar(f, global.FORMKIT_OPCIONES || {});
  });
}(window));
