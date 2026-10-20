/* =========================================================
   validar.mjs · Segunda validación (servidor) con la MISMA configuración

   El navegador valida para ayudar; el servidor valida para defender
   (FRM-33). Este módulo aplica en Node las mismas reglas de
   validaciones.config.js a un payload {datos, archivos, meta} contra un
   esquema derivado del HTML del formulario (herramientas/esquema-desde-html.mjs),
   de modo que no haya una segunda copia de las reglas que pueda
   desactualizarse.

   Qué comprueba:
     · la forma del envío: datos y meta son objetos, archivos es una lista;
       un envío mal formado se rechaza con un error, nunca detiene el proceso;
     · que cada dato esté declarado (las claves __proto__, constructor y
       prototype nunca lo están) y tenga el tipo esperado: texto donde va
       texto, lista sólo en opción múltiple, punto con números válidos;
     · obligatoriedad, respetando todas las condiciones data-si del campo y
       de sus ancestros, y «Otro»; los archivos obligatorios se buscan en
       payload.archivos, que es donde los manda el navegador;
     · datos que calcula la página (data-auxiliar): el navegador no los manda
       y el servidor los calcula con opciones.auxiliares[campo](datos);
     · límites que dependen de otras respuestas (data-min-segun,
       data-max-segun), con opciones.limitesSegun[clave](datos);
     · formato y normalización por tipo de dato;
     · pertenencia al catálogo en opciones, selects y combos cerrados;
     · mínimo y máximo de opciones, sin contar repetidas;
     · grupos repetibles: cada fila «grupo.N.campo» se valida con la
       definición «grupo.#.campo», con el mínimo y el máximo de filas;
     · validaciones cruzadas declaradas;
     · señales anti-abuso: campo trampa lleno, tiempo mínimo de llenado;
     · archivos: campo que los recibe, extensión, tamaño, nombre, número y
       total, con los límites del campo (data-max, data-mb, data-total-mb) o
       los de la configuración (la firma se verifica sobre los bytes
       recibidos, fuera de este módulo);
     · una cascada sin catálogo: si llega su captura manual, se exige ésa y
       no la lista (el esquema sabe qué campos son de cada una).
   Devuelve {ok, datos (normalizados), claves (la clave de catálogo de cada
   lista cerrada que la tenga), archivos (copias, sin fecha ni ubicación de
   captura si el campo no las pide), errores:[{campo, mensaje}], senales:[]}.

   Uso:
     import { validaPayload } from './validar.mjs';
     const esquema = JSON.parse(fs.readFileSync('esquema.json'));
     const r = validaPayload(payload, esquema, { catalogos, auxiliares, limitesSegun, config: FORMKIT_CONFIG });
   config es la misma configuración que la página da a FORMKIT_CONFIG (basta lo que
   cambia); sin ella se usa la base. Sin un catálogo que el esquema pide, lo que
   depende de él no se acepta ni se rechaza en silencio: queda una señal.
   El esquema de cada plantilla se genera con:
     node herramientas/esquema-desde-html.mjs codigo/plantillas/por-pasos.html > esquema.json
   ========================================================= */
/* La configuración se carga como script global: así el mismo archivo sirve
   en el navegador y aquí, sin duplicarlo ni cambiar su formato. */
await import('../js/validaciones.config.js');
const CFG = globalThis.FORMKIT_VALIDACIONES;

const TIEMPO_MINIMO_MS = 3000; /* señal, no veredicto: nadie llena un formulario en menos */
const CLAVES_PROHIBIDAS = new Set(['__proto__', 'constructor', 'prototype']);

const esObjetoPlano = (x) => x !== null && typeof x === 'object' && !Array.isArray(x) && [Object.prototype, null].includes(Object.getPrototypeOf(x));
const esTexto = (v) => typeof v === 'string' || (typeof v === 'number' && Number.isFinite(v));
/* Caracteres que no se ven o que invierten el texto: un nombre de archivo no los lleva. */
const INVISIBLES = /[\u0000-\u001F\u007F-\u009F\u200B-\u200F\u202A-\u202E\u2060-\u2064\u2066-\u2069\uFEFF]/;
/* Filas de un catálogo: un arreglo o el objeto documentado {filas, fuente, corte}. */
const filasDe = (cat) => (Array.isArray(cat) ? cat : cat && Array.isArray(cat.filas) ? cat.filas : null);
/* Una configuración parcial (sólo lo que cambia, como FORMKIT_CONFIG en el navegador) se fusiona con la base. */
function fusiona(base, extra) {
  if (!esObjetoPlano(extra) || !esObjetoPlano(base)) return extra === undefined ? base : extra;
  const out = { ...base };
  for (const k of Object.keys(extra)) if (!CLAVES_PROHIBIDAS.has(k)) out[k] = fusiona(base[k], extra[k]);
  return out;
}

export function validaPayload(payload, esquema, opciones = {}) {
  /* opciones.config: la configuración del formulario (FORMKIT_CONFIG), completa o sólo lo que cambia.
     opciones.mensajes cambia textos sin pasar toda la configuración (por ejemplo, a «usted»). */
  const base = opciones.config ? fusiona(CFG, opciones.config) : CFG;
  const cfg = opciones.mensajes ? { ...base, mensajes: { ...base.mensajes, ...opciones.mensajes } } : base;
  const errores = [];
  const senales = [];
  const M = cfg.mensajes;
  const plantilla = cfg.plantilla;

  /* 0. Forma del envío. */
  if (!esObjetoPlano(payload) || (payload.datos !== undefined && !esObjetoPlano(payload.datos))
    || (payload.archivos !== undefined && !Array.isArray(payload.archivos)) || (payload.meta !== undefined && !esObjetoPlano(payload.meta))) {
    return { ok: false, datos: {}, errores: [{ campo: '', mensaje: 'Envío mal formado: se espera {datos: objeto, archivos: lista, meta: objeto}.' }], senales };
  }
  /* Copia sin prototipo: ninguna clave del envío puede hacerse pasar por un
     campo declarado ni alterar objetos del servidor. */
  const datos = Object.create(null);
  for (const [k, v] of Object.entries(payload.datos || {})) datos[k] = v;
  const campos = esquema.campos;
  const declarado = (n) => !CLAVES_PROHIBIDAS.has(n) && Object.hasOwn(campos, n);
  /* La clave de catálogo de cada lista cerrada (combo), si el catálogo la trae. */
  const claves = Object.create(null);
  /* Cascada sin catálogo: si llegó algo en su captura manual, la persona la usó; los
     campos de la lista no se exigen y los manuales sí (y al revés). */
  const manualUsada = Object.create(null);
  for (const [n, c] of Object.entries(campos)) if (c.cascadaManual !== undefined && datos[n] !== undefined && datos[n] !== null && datos[n] !== '') manualUsada[c.cascadaManual] = true;
  const modoCascada = (c) => !(c.cascadaLista !== undefined && manualUsada[c.cascadaLista]) && !(c.cascadaManual !== undefined && !manualUsada[c.cascadaManual]);

  /* Grupos repetibles: «grupo.#.campo» es un patrón y cada fila llega como
     «grupo.N.campo». */
  const esPatron = (n) => n.includes('.#.');
  const filaDe = (n) => {
    const m = /^([^.#]+)\.(\d{1,3})\.([^#]+)$/.exec(n);
    if (!m) return null;
    const patron = `${m[1]}.#.${m[3]}`;
    return declarado(patron) ? { patron, grupo: m[1], fila: m[2] } : null;
  };

  /* Lo que no viene en los datos cuenta como vacío, igual que en el
     navegador: una casilla sin marcar o un campo vacío no viajan, y una
     condición «campo=» (vacío) debe cumplirse con ellos. */
  const cumple = (si) => {
    const v = datos[si.campo] === undefined ? '' : datos[si.campo];
    const lista = Array.isArray(v) ? v : [v];
    return activo(si.campo) && lista.some((x) => si.valores.includes(x));
  };
  /* Un campo exige todas sus condiciones: la propia y las de sus ancestros,
     como en pantalla. (siPadre: esquemas anteriores a «condiciones».) */
  const activoDef = (c) => (c.condiciones || [c.si, c.siPadre].filter(Boolean)).every(cumple) && modoCascada(c);
  const activo = (n) => declarado(n) && activoDef(campos[n]);
  const vacio = (v) => v === undefined || v === null || v === '' || (Array.isArray(v) && !v.length);
  const noAdmitido = (n, c) => errores.push({ campo: n, mensaje: `Formato de dato no admitido en «${c.etiqueta}».` });

  /* 0b. Datos que calcula la página: no se reciben del navegador; el servidor
     los calcula por su cuenta y sólo los usa para condiciones y cruzadas. */
  const auxiliares = Object.entries(campos).filter(([, c]) => c.tipo === 'auxiliar').map(([n]) => n);
  for (const n of auxiliares) {
    if (Object.hasOwn(datos, n)) { errores.push({ campo: n, mensaje: 'Dato calculado: no se recibe del navegador.' }); delete datos[n]; }
    const fn = opciones.auxiliares && opciones.auxiliares[n];
    if (typeof fn === 'function') { const v = fn(Object.fromEntries(Object.entries(datos))); if (v !== undefined && v !== null && v !== '') datos[n] = String(v); }
    else senales.push(`«${n}» es un dato calculado y el servidor no recibió su función en opciones.auxiliares.`);
  }

  /* 1. Campos desconocidos: no se aceptan (un campo «por si acaso» es un dato personal sin uso). */
  /* Se dicen los primeros 20 por nombre y el resto en un solo error: un envío con miles de claves no produce miles de errores. */
  let desconocidos = 0;
  for (const n of Object.keys(datos)) {
    if (!(declarado(n) ? esPatron(n) : !filaDe(n))) continue;
    if (++desconocidos <= 20) errores.push({ campo: n, mensaje: 'Campo no declarado en el formulario.' });
  }
  if (desconocidos > 20) errores.push({ campo: '', mensaje: `Y ${desconocidos - 20} campos más no declarados en el formulario.` });

  /* 2. Campo por campo; las filas de los grupos repetibles, con su patrón.
     Los archivos se validan en el paso 6, con payload.archivos; los datos
     calculados no se validan. */
  for (const [n, c] of Object.entries(campos)) {
    if (esPatron(n) || c.tipo === 'archivos' || c.tipo === 'auxiliar') continue;
    if (!activo(n)) { if (!vacio(datos[n])) { delete datos[n]; senales.push(`«${n}» venía con valor aunque su condición no se cumple; se descartó.`); } continue; }
    validaUno(n, c);
  }
  const filasPorGrupo = {};
  for (const n of Object.keys(datos)) { const f = filaDe(n); if (f) (filasPorGrupo[f.grupo] = filasPorGrupo[f.grupo] || new Set()).add(f.fila); }
  for (const grupo of new Set([...(esquema.repetibles || []), ...Object.keys(filasPorGrupo)])) {
    const filas = [...(filasPorGrupo[grupo] || [])];
    const lim = (esquema.limitesRepetibles || {})[grupo] || {};
    if (lim.max && filas.length > lim.max) errores.push({ campo: grupo, mensaje: plantilla(M.repetibleMax, { max: lim.max, etiqueta: lim.etiqueta || grupo }) });
    if (lim.min && filas.length < lim.min) errores.push({ campo: grupo, mensaje: plantilla(M.repetibleMin, { min: lim.min, etiqueta: lim.etiqueta || grupo }) });
    for (const [patron, c] of Object.entries(campos)) {
      if (!patron.startsWith(`${grupo}.#.`) || c.tipo === 'archivos' || c.tipo === 'auxiliar' || !activoDef(c)) continue;
      for (const fila of filas) validaUno(patron.replace('.#.', `.${fila}.`), c);
    }
  }

  function validaUno(n, c) {
    let v = datos[n];
    if (vacio(v)) { if (c.requerido) errores.push({ campo: n, mensaje: plantilla(M[c.tipo === 'opcion' || c.tipo === 'multiple' || c.tipo === 'select' || c.tipo === 'combo' ? 'obligatorioOpcion' : c.tipo === 'casilla' ? 'obligatorioCasilla' : c.tipo === 'archivos' ? 'obligatorioArchivos' : 'obligatorioTexto'], { etiqueta: c.etiqueta }) }); return; }
    if (c.tipo === 'multiple') {
      const lista = Array.isArray(v) ? v : [v];
      if (!lista.every(esTexto)) { noAdmitido(n, c); return; }
      const unicas = [...new Set(lista.map(String))];
      if (unicas.some((x) => !c.opciones.includes(x))) errores.push({ campo: n, mensaje: plantilla(M.soloLista, { etiqueta: c.etiqueta }) });
      /* data-min-opciones y data-max-opciones llegan en los atributos del esquema. */
      const minO = Number(c.minOpciones ?? c.atributos?.minOpciones ?? 0), maxO = Number(c.maxOpciones ?? c.atributos?.maxOpciones ?? 0);
      if (minO && unicas.length < minO) errores.push({ campo: n, mensaje: plantilla(M.minimoOpciones, { etiqueta: c.etiqueta, min: minO }) });
      if (maxO && unicas.length > maxO) errores.push({ campo: n, mensaje: plantilla(M.maximoOpciones, { etiqueta: c.etiqueta, max: maxO }) });
      datos[n] = unicas;
      return;
    }
    if (c.tipo === 'mapa') { validaPunto(n, v); return; }
    /* Todo lo demás es un solo valor de texto: una lista o un objeto donde va texto no se acepta. */
    if (!esTexto(v)) { noAdmitido(n, c); return; }
    v = String(v);
    datos[n] = v;
    if (c.tipo === 'casilla' || c.tipo === 'toggle') { if (v !== 'si') errores.push({ campo: n, mensaje: 'Valor de casilla no admitido.' }); return; }
    if (c.tipo === 'opcion' || c.tipo === 'select') {
      /* opciones === null: la lista viene de un catálogo en tiempo de ejecución (cascadas); se contrasta con él.
         Sin el catálogo no se acepta ni se rechaza en silencio: queda una señal. */
      const admitidas = c.opciones || opcionesDeCatalogo(c, n, opciones.catalogos, datos);
      if (!admitidas) senales.push(`«${n}» se elige de un catálogo que el servidor no recibió en opciones.catalogos: no se pudo comprobar.`);
      else if (!admitidas.includes(v)) errores.push({ campo: n, mensaje: plantilla(M.soloLista, { etiqueta: c.etiqueta }) });
      return;
    }
    if (c.tipo === 'combo' && c.cerrado && c.catalogo) {
      /* Se guarda el nombre como está en el catálogo («coyoacan» → «Coyoacán») y, si el
         catálogo trae una clave propia ({nombre, valor}), también la clave. */
      const lista = filasDe((opciones.catalogos || {})[c.catalogo]);
      if (!lista) senales.push(`«${n}» es una lista cerrada del catálogo «${c.catalogo}», que el servidor no recibió en opciones.catalogos: no se pudo comprobar.`);
      else {
        const hallada = lista.map((o) => (typeof o === 'string' ? { nombre: o } : o && { nombre: o.nombre ?? o.alcaldia, valor: o.valor })).find((o) => o && o.nombre && normaliza(o.nombre) === normaliza(v));
        /* Si a la página no le cargó la lista, la persona lo escribió a mano (meta.sin_catalogo): se
           acepta y queda una señal para revisarlo, en lugar de impedir el trámite. */
        const sinLista = Array.isArray((payload.meta || {}).sin_catalogo) && payload.meta.sin_catalogo.includes(n);
        if (!hallada && sinLista) senales.push(`«${n}» se escribió a mano porque a la página no le cargó la lista: «${v}» no está en el catálogo; revisarlo.`);
        else if (!hallada) errores.push({ campo: n, mensaje: plantilla(M.soloLista, { etiqueta: c.etiqueta }) });
        else { v = hallada.nombre; datos[n] = v; if (hallada.valor !== undefined) claves[n] = hallada.valor; }
      }
    }
    /* Texto con formato: normalizar, validar y conservar lo normalizado. */
    const f = cfg.formatos[c.formato || (c.tipo === 'textarea' ? 'texto' : '')];
    if (f) {
      /* El largo se revisa antes de normalizar, como lo limita el navegador: un texto
         enorme no llega a la expresión del formato. */
      if (c.atributos?.maxlength && v.length > Number(c.atributos.maxlength)) { errores.push({ campo: n, mensaje: plantilla(M.maximoCaracteres, { max: c.atributos.maxlength, etiqueta: c.etiqueta }) }); return; }
      v = f.normaliza(v);
      datos[n] = v;
      const atr = { ...(c.atributos || {}) };
      if (atr.max === 'hoy') atr.max = cfg.hoyISO();
      if (atr.min === 'hoy') atr.min = cfg.hoyISO();
      /* Límites que dependen de otras respuestas: la misma función que usa el navegador. */
      for (const [lim, clave] of [['min', atr.minSegun], ['max', atr.maxSegun]]) {
        if (!clave) continue;
        const fn = opciones.limitesSegun && opciones.limitesSegun[clave];
        if (typeof fn !== 'function') { senales.push(`«${n}» declara un ${lim === 'min' ? 'mínimo' : 'máximo'} según «${clave}», pero el servidor no recibió esa función en opciones.limitesSegun.`); continue; }
        const r = fn(Object.fromEntries(Object.entries(datos)));
        if (r !== undefined && r !== null && r !== '') atr[lim] = String(r);
      }
      const msg = f.valida(v, atr, cfg);
      if (msg) errores.push({ campo: n, mensaje: msg });
    } else {
      v = cfg.recorta(v); datos[n] = v;
      if (c.atributos?.maxlength && v.length > Number(c.atributos.maxlength)) errores.push({ campo: n, mensaje: plantilla(M.maximoCaracteres, { max: c.atributos.maxlength, etiqueta: c.etiqueta }) });
      if (c.atributos?.minlength && v.length < Number(c.atributos.minlength)) errores.push({ campo: n, mensaje: plantilla(M.minimoCaracteres, { min: c.atributos.minlength, n: v.length, etiqueta: c.etiqueta }) });
    }
  }

  /* Punto del mapa: exactamente {type:'Point', coordinates:[lon, lat]}, con
     números finitos, en rango y dentro del ámbito configurado. */
  function validaPunto(n, v) {
    const forma = esObjetoPlano(v) && Object.keys(v).length === 2 && v.type === 'Point' && Array.isArray(v.coordinates) && v.coordinates.length === 2 && v.coordinates.every((x) => typeof x === 'number' && Number.isFinite(x));
    if (!forma) { errores.push({ campo: n, mensaje: 'Punto mal formado: se espera {type:"Point", coordinates:[lon, lat]}.' }); return; }
    const [lon, lat] = v.coordinates;
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) { errores.push({ campo: n, mensaje: M.fmtCoordenadasRango }); return; }
    const b = cfg.ambito?.coordenadas;
    if (b && (lat < b.latMin || lat > b.latMax || lon < b.lonMin || lon > b.lonMax)) errores.push({ campo: n, mensaje: b.mensaje });
  }

  /* 3. «Otro»: texto sólo si «Otro» fue elegida (ya lo cubre la condición) y exigido si lo fue (ya lo cubre requerido). Se registra como señal si llegó texto sin elección. */

  /* 4. Cruzadas. En un grupo repetible, la cruzada del patrón (grupo.#.campo) se
     aplica a cada fila, con los campos de esa fila. Sin nivel en el esquema, el de
     la cruzada: la que no bloquea en el navegador (bloquea: false) es advertencia. */
  const defDe = (n) => (declarado(n) ? campos[n] : filaDe(n) ? campos[filaDe(n).patron] : null);
  const activoN = (n) => (declarado(n) ? activo(n) : !!defDe(n) && activoDef(defDe(n)));
  for (const [n, c] of Object.entries(campos)) {
    if (!c.cruzadas) continue;
    const grupo = esPatron(n) ? n.split('.#.')[0] : null;
    const instancias = grupo ? [...(filasPorGrupo[grupo] || [])].map((fila) => ({ nombre: n.replace('.#.', `.${fila}.`), fila })) : [{ nombre: n, fila: null }];
    for (const { nombre, fila } of instancias) {
      if (!activoN(nombre)) continue;
      const enFila = (x) => (fila !== null && x.includes('.#.') ? x.replace('.#.', `.${fila}.`) : x);
      for (const cz of c.cruzadas) {
        const def = cfg.cruzadas[cz.clave];
        if (!def) continue;
        const valores = {};
        let listo = true;
        /* Un rol de def.opcionales corre vacío, como en el navegador. */
        const opcionalesCz = def.opcionales || [];
        for (const rol of def.campos) {
          const campo = enFila(cz.mapa[rol] || rol);
          const v = activoN(campo) ? datos[campo] : undefined;
          if (vacio(v) && opcionalesCz.includes(rol)) { valores[rol] = ''; continue; }
          if (vacio(v) || errores.some((e) => e.campo === campo)) { listo = false; break; }
          const ff = cfg.formatos[(defDe(campo) || {}).formato]; valores[rol] = ff ? ff.normaliza(String(v)) : v;
        }
        if (!listo) continue;
        const extra = { ...(c.atributos || {}) };
        if (cz.catalogo) extra.catalogo = filasDe((opciones.catalogos || {})[cz.catalogo]) || [];
        const msg = def.valida(valores, extra, cfg);
        const nivel = cz.nivel || (def.bloquea === false ? 'advertencia' : 'error');
        if (msg && nivel === 'error') errores.push({ campo: nombre, mensaje: msg });
        else if (msg) senales.push(`Advertencia en «${nombre}»: ${msg}`);
      }
    }
  }

  /* 5. Señales anti-abuso: nunca veredictos. */
  const meta = payload.meta || {};
  if (meta.trampa) senales.push('El campo trampa llegó con valor.');
  if (typeof meta.ms_en_formulario === 'number' && meta.ms_en_formulario < TIEMPO_MINIMO_MS) senales.push(`Formulario llenado en ${meta.ms_en_formulario} ms.`);
  if (!meta.idempotencia) senales.push('Sin clave de idempotencia: no se puede reconocer un reenvío.');

  /* 6. Archivos (metadatos; la firma se comprueba sobre los bytes recibidos).
     Sólo se aceptan en un campo de archivos declarado y activo. */
  const A = cfg.archivos;
  const porCampo = Object.create(null);
  /* Copia de cada archivo para el sistema: sin la fecha ni la ubicación de captura si el campo no las pide. */
  const archivos = [];
  for (const a of payload.archivos || []) {
    if (!esObjetoPlano(a) || typeof a.campo !== 'string' || typeof a.nombre !== 'string' || typeof a.size !== 'number' || !Number.isFinite(a.size)) { errores.push({ campo: esObjetoPlano(a) && typeof a.campo === 'string' ? a.campo : '', mensaje: 'Archivo mal formado.' }); continue; }
    if (!declarado(a.campo) || campos[a.campo].tipo !== 'archivos' || !activo(a.campo)) { errores.push({ campo: a.campo, mensaje: 'Archivo en un campo que no recibe archivos.' }); continue; }
    (porCampo[a.campo] = porCampo[a.campo] || []).push(a);
    const atrA = campos[a.campo].atributos || {};
    const copia = { ...a };
    const conservaExif = atrA.conservarExif !== undefined ? atrA.conservarExif !== 'false' : A.conservarExif;
    if (!conservaExif && ['lat_captura', 'lon_captura', 'fecha_captura'].some((k) => k in copia)) { for (const k of ['lat_captura', 'lon_captura', 'fecha_captura']) delete copia[k]; senales.push(`Archivo «${a.nombre}»: llegó con fecha o ubicación de captura, que «${a.campo}» no pide; se descartaron.`); }
    archivos.push(copia);
    const ext = a.nombre.split('.').pop().toLowerCase();
    /* Las extensiones, como las lee el navegador: sin espacios y en minúsculas. */
    const extensiones = atrA.extensiones ? atrA.extensiones.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean) : A.extensiones;
    /* El navegador recodifica a JPG las fotos (png, webp): un JPG vale donde se admite una de ellas. */
    const admite = extensiones.includes(ext) || (['jpg', 'jpeg'].includes(ext) && extensiones.some((x) => A.optimiza.tipos.includes(x)));
    if (!admite) errores.push({ campo: a.campo, mensaje: `Archivo «${a.nombre}»: ${plantilla(M.archRechazoTipo, { formatos: cfg.formatosArchivo(extensiones) })}` });
    if (!(a.size > 0)) errores.push({ campo: a.campo, mensaje: `Archivo «${a.nombre}»: ${M.archRechazoVacio}` });
    const mb = Number(campos[a.campo].atributos?.mb || A.mb);
    /* Apenas sobre el límite, el peso redondeado se vería igual al máximo: «más de 8 MB». */
    const peso = (a.size / 1048576).toFixed(1) === Number(mb).toFixed(1) ? plantilla(M.archMasDe, { mb }) : `${(a.size / 1048576).toFixed(1)} MB`;
    if (a.size > mb * 1048576) errores.push({ campo: a.campo, mensaje: `Archivo «${a.nombre}»: ${plantilla(M.archRechazoPeso, { peso, mb })}` });
    if (/[\\/]/.test(a.nombre) || INVISIBLES.test(a.nombre) || a.nombre.length > (A.nombreMax || 120)) errores.push({ campo: a.campo, mensaje: `Archivo «${a.nombre.slice(0, 60)}»: nombre no saneado.` });
  }
  for (const [campo, lista] of Object.entries(porCampo)) {
    /* El máximo y el total del campo (data-max, data-total-mb) o, si no los declara, los de la configuración. */
    const max = Number(campos[campo].atributos?.max || A.max);
    if (lista.length > max) errores.push({ campo, mensaje: plantilla(max === 1 ? M.archRechazoMaxUno : M.archRechazoMax, { max }) });
    const total = lista.reduce((s, a) => s + a.size, 0);
    const mbTotal = Number(campos[campo].atributos?.totalMb || A.mbTotal);
    if (total > mbTotal * 1048576) errores.push({ campo, mensaje: plantilla(M.archRechazoTotal, { mb: mbTotal }) });
    const huellas = lista.map((a) => a.sha256_original).filter(Boolean);
    if (new Set(huellas).size !== huellas.length) errores.push({ campo, mensaje: M.archRechazoDuplicado });
  }
  for (const [n, c] of Object.entries(campos)) if (c.tipo === 'archivos' && c.requerido && activo(n) && !(porCampo[n] || []).length) errores.push({ campo: n, mensaje: plantilla(M.obligatorioArchivos, { etiqueta: c.etiqueta }) });

  /* Se devuelve un objeto común, sin las claves prohibidas ni los datos calculados. */
  for (const k of [...CLAVES_PROHIBIDAS, ...auxiliares]) delete datos[k];
  return { ok: errores.length === 0, datos: Object.fromEntries(Object.entries(datos)), claves: Object.fromEntries(Object.entries(claves)), archivos, errores, senales };
}

/* Para selects de cascada, las opciones admitidas salen del catálogo que el esquema
   nombra (catalogo, nivel; la colonia, de la alcaldía elegida con padre y nivelPadre).
   El catálogo puede ser un arreglo de filas o {filas, fuente, corte}. null si no se recibió. */
function opcionesDeCatalogo(c, n, catalogos = {}, datos = {}) {
  const nivel = c.nivel || c.atributos?.nivel || (/alcaldia/.test(n) ? 'alcaldia' : /colonia/.test(n) ? 'colonia' : null);
  if (!nivel) return null;
  const tieneNivel = (x) => (filasDe(x) || []).some((f) => f && typeof f === 'object' && nivel in f);
  const filas = filasDe(c.catalogo ? catalogos[c.catalogo] : Object.values(catalogos).find(tieneNivel));
  if (!filas) return null;
  const padre = c.padre && c.nivelPadre && typeof datos[c.padre] === 'string' && datos[c.padre] ? datos[c.padre] : null;
  const delPadre = padre ? filas.filter((f) => f && f[c.nivelPadre] === padre) : filas;
  return [...new Set(delPadre.map((f) => f && f[nivel]).filter(Boolean))];
}

function normaliza(s) { return String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim(); }

/* Ejecución directa: node validar.mjs esquema.json payload.json */
if (process.argv[1] && process.argv[1].endsWith('validar.mjs') && process.argv.length >= 4) {
  const fs = await import('node:fs');
  const esquema = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
  const payload = JSON.parse(fs.readFileSync(process.argv[3], 'utf8'));
  await import('../catalogos/cdmx-ejemplo.js').catch(() => {});
  const r = validaPayload(payload, esquema, { catalogos: globalThis.FORMKIT_CATALOGOS || {} });
  console.log(JSON.stringify(r, null, 2));
  process.exit(r.ok ? 0 : 1);
}
