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
     · obligatoriedad (respetando condicionales data-si y «Otro»);
     · formato y normalización por tipo de dato;
     · pertenencia al catálogo en opciones, selects y combos cerrados;
     · mínimo y máximo de opciones, sin contar repetidas;
     · grupos repetibles: cada fila «grupo.N.campo» se valida con la
       definición «grupo.#.campo», con el mínimo y el máximo de filas;
     · validaciones cruzadas declaradas;
     · señales anti-abuso: campo trampa lleno, tiempo mínimo de llenado;
     · archivos: campo que los recibe, extensión, tamaño, número y total
       (la firma se verifica sobre los bytes recibidos, fuera de este módulo).
   Devuelve {ok, datos (normalizados), errores:[{campo, mensaje}], senales:[]}.

   Uso:
     import { validaPayload } from './validar.mjs';
     const esquema = JSON.parse(fs.readFileSync('esquema.json'));
     const r = validaPayload(payload, esquema, { catalogos });
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

export function validaPayload(payload, esquema, opciones = {}) {
  const cfg = opciones.config || CFG;
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
  /* Un campo con su propia condición dentro de un bloque condicional exige
     las dos (siPadre), como en pantalla. */
  const activoDef = (c) => !c.si || (cumple(c.si) && (!c.siPadre || cumple(c.siPadre)));
  const activo = (n) => declarado(n) && activoDef(campos[n]);
  const vacio = (v) => v === undefined || v === null || v === '' || (Array.isArray(v) && !v.length);
  const noAdmitido = (n, c) => errores.push({ campo: n, mensaje: `Formato de dato no admitido en «${c.etiqueta}».` });

  /* 1. Campos desconocidos: no se aceptan (un campo «por si acaso» es un dato personal sin uso). */
  for (const n of Object.keys(datos)) {
    if (declarado(n) ? esPatron(n) : !filaDe(n)) errores.push({ campo: n, mensaje: 'Campo no declarado en el formulario.' });
  }

  /* 2. Campo por campo; las filas de los grupos repetibles, con su patrón. */
  for (const [n, c] of Object.entries(campos)) {
    if (esPatron(n)) continue;
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
      if (!patron.startsWith(`${grupo}.#.`) || !activoDef(c)) continue;
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
      if (c.minOpciones && unicas.length < c.minOpciones) errores.push({ campo: n, mensaje: plantilla(M.minimoOpciones, { etiqueta: c.etiqueta, min: c.minOpciones }) });
      if (c.maxOpciones && unicas.length > c.maxOpciones) errores.push({ campo: n, mensaje: plantilla(M.maximoOpciones, { etiqueta: c.etiqueta, max: c.maxOpciones }) });
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
      /* opciones === null: la lista viene de un catálogo en tiempo de ejecución (cascadas); se contrasta con él si se pasó. */
      const admitidas = c.opciones || opcionesDeCatalogo(c, n, opciones.catalogos);
      if (admitidas && !admitidas.includes(v)) errores.push({ campo: n, mensaje: plantilla(M.soloLista, { etiqueta: c.etiqueta }) });
      return;
    }
    if (c.tipo === 'combo' && c.cerrado && c.catalogo) {
      const cat = (opciones.catalogos || {})[c.catalogo] || [];
      const nombres = (cat.filas ? [...new Set(cat.filas.map((f) => f.alcaldia))] : cat).map((o) => (typeof o === 'string' ? o : o.nombre));
      if (!nombres.some((o) => normaliza(o) === normaliza(v))) errores.push({ campo: n, mensaje: plantilla(M.soloLista, { etiqueta: c.etiqueta }) });
    }
    /* Texto con formato: normalizar, validar y conservar lo normalizado. */
    const f = cfg.formatos[c.formato || (c.tipo === 'textarea' ? 'texto' : '')];
    if (f) {
      v = f.normaliza(v);
      datos[n] = v;
      const atr = { ...(c.atributos || {}) };
      if (atr.max === 'hoy') atr.max = cfg.hoyISO();
      if (atr.min === 'hoy') atr.min = cfg.hoyISO();
      const msg = f.valida(v, atr);
      if (msg) errores.push({ campo: n, mensaje: msg });
    } else {
      v = cfg.recorta(v); datos[n] = v;
      if (c.atributos?.maxlength && v.length > Number(c.atributos.maxlength)) errores.push({ campo: n, mensaje: `Usa hasta ${c.atributos.maxlength} caracteres en «${c.etiqueta}».` });
      if (c.atributos?.minlength && v.length < Number(c.atributos.minlength)) errores.push({ campo: n, mensaje: `Escribe al menos ${c.atributos.minlength} caracteres en «${c.etiqueta}».` });
    }
  }

  /* Punto del mapa: exactamente {type:'Point', coordinates:[lon, lat]}, con
     números finitos, en rango y dentro del ámbito configurado. */
  function validaPunto(n, v) {
    const forma = esObjetoPlano(v) && Object.keys(v).length === 2 && v.type === 'Point' && Array.isArray(v.coordinates) && v.coordinates.length === 2 && v.coordinates.every((x) => typeof x === 'number' && Number.isFinite(x));
    if (!forma) { errores.push({ campo: n, mensaje: 'Punto mal formado: se espera {type:"Point", coordinates:[lon, lat]}.' }); return; }
    const [lon, lat] = v.coordinates;
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) { errores.push({ campo: n, mensaje: 'Las coordenadas están fuera de rango: la latitud va de -90 a 90 y la longitud de -180 a 180.' }); return; }
    const b = cfg.ambito?.coordenadas;
    if (b && (lat < b.latMin || lat > b.latMax || lon < b.lonMin || lon > b.lonMax)) errores.push({ campo: n, mensaje: b.mensaje });
  }

  /* 3. «Otro»: texto sólo si «Otro» fue elegida (ya lo cubre la condición) y exigido si lo fue (ya lo cubre requerido). Se registra como señal si llegó texto sin elección. */

  /* 4. Cruzadas. */
  for (const [n, c] of Object.entries(campos)) {
    if (!c.cruzadas || esPatron(n) || !activo(n)) continue;
    for (const cz of c.cruzadas) {
      const def = cfg.cruzadas[cz.clave];
      if (!def) continue;
      const valores = {};
      let listo = true;
      for (const rol of def.campos) { const campo = cz.mapa[rol] || rol; const v = datos[campo]; if (vacio(v) || errores.some((e) => e.campo === campo)) { listo = false; break; } const ff = cfg.formatos[declarado(campo) ? campos[campo].formato : '']; valores[rol] = ff ? ff.normaliza(String(v)) : v; }
      if (!listo) continue;
      const extra = { ...(c.atributos || {}) };
      if (cz.catalogo) { const cat = (opciones.catalogos || {})[cz.catalogo]; extra.catalogo = Array.isArray(cat) ? cat : (cat && cat.filas) || []; }
      const msg = def.valida(valores, extra);
      if (msg && cz.nivel === 'error') errores.push({ campo: n, mensaje: msg });
      else if (msg) senales.push(`Advertencia en «${n}»: ${msg}`);
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
  for (const a of payload.archivos || []) {
    if (!esObjetoPlano(a) || typeof a.campo !== 'string' || typeof a.nombre !== 'string' || typeof a.size !== 'number' || !Number.isFinite(a.size)) { errores.push({ campo: esObjetoPlano(a) && typeof a.campo === 'string' ? a.campo : '', mensaje: 'Archivo mal formado.' }); continue; }
    if (!declarado(a.campo) || campos[a.campo].tipo !== 'archivos' || !activo(a.campo)) { errores.push({ campo: a.campo, mensaje: 'Archivo en un campo que no recibe archivos.' }); continue; }
    (porCampo[a.campo] = porCampo[a.campo] || []).push(a);
    const ext = a.nombre.split('.').pop().toLowerCase();
    const extensiones = campos[a.campo].atributos?.extensiones?.split(',') || A.extensiones;
    if (!extensiones.includes(ext)) errores.push({ campo: a.campo, mensaje: `Archivo «${a.nombre}»: ${plantilla(M.archRechazoTipo, { formatos: extensiones.join(', ').toUpperCase() })}` });
    if (!(a.size > 0)) errores.push({ campo: a.campo, mensaje: `Archivo «${a.nombre}»: ${M.archRechazoVacio}` });
    const mb = Number(campos[a.campo].atributos?.mb || A.mb);
    if (a.size > mb * 1048576) errores.push({ campo: a.campo, mensaje: `Archivo «${a.nombre}»: ${plantilla(M.archRechazoPeso, { peso: `${(a.size / 1048576).toFixed(1)} MB`, mb })}` });
    if (/[\\/\u0000-\u001F]/.test(a.nombre)) errores.push({ campo: a.campo, mensaje: `Archivo «${a.nombre}»: nombre no saneado.` });
  }
  for (const [campo, lista] of Object.entries(porCampo)) {
    const max = Number(campos[campo].atributos?.max || A.max);
    if (lista.length > max) errores.push({ campo, mensaje: plantilla(M.archRechazoMax, { max }) });
    const total = lista.reduce((s, a) => s + a.size, 0);
    if (total > A.mbTotal * 1048576) errores.push({ campo, mensaje: plantilla(M.archRechazoTotal, { mb: A.mbTotal }) });
    const huellas = lista.map((a) => a.sha256_original).filter(Boolean);
    if (new Set(huellas).size !== huellas.length) errores.push({ campo, mensaje: M.archRechazoDuplicado });
  }
  for (const [n, c] of Object.entries(campos)) if (c.tipo === 'archivos' && c.requerido && activo(n) && !(porCampo[n] || []).length) errores.push({ campo: n, mensaje: plantilla(M.obligatorioArchivos, { etiqueta: c.etiqueta }) });

  /* Se devuelve un objeto común, sin las claves prohibidas. */
  for (const k of CLAVES_PROHIBIDAS) delete datos[k];
  return { ok: errores.length === 0, datos: Object.fromEntries(Object.entries(datos)), errores, senales };
}

/* Para selects de cascada, las opciones admitidas salen del catálogo declarado en el esquema (atributos.catalogo / nivel). */
function opcionesDeCatalogo(c, n, catalogos = {}) {
  const nivel = c.atributos?.nivel || (/alcaldia/.test(n) ? 'alcaldia' : /colonia/.test(n) ? 'colonia' : null);
  const cat = Object.values(catalogos).find((x) => x && x.filas);
  if (!cat || !nivel) return null;
  return [...new Set(cat.filas.map((f) => f[nivel]).filter(Boolean))];
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
