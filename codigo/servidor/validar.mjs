/* =========================================================
   validar.mjs · Segunda validación (servidor) con la MISMA configuración

   El navegador valida para ayudar; el servidor valida para defender
   (FRM-33). Este módulo aplica en Node las mismas reglas de
   validaciones.config.js a un payload {datos, archivos, meta} contra un
   esquema derivado del HTML del formulario (herramientas/esquema-desde-html.mjs),
   de modo que no haya una segunda copia de las reglas que pueda
   desactualizarse.

   Qué comprueba:
     · obligatoriedad (respetando condicionales data-si y «Otro»);
     · formato y normalización por tipo de dato;
     · pertenencia al catálogo en opciones, selects y combos cerrados;
     · mínimo y máximo de opciones;
     · validaciones cruzadas declaradas;
     · texto de «Otro» sólo si «Otro» fue elegida, y exigido si lo fue;
     · señales anti-abuso: campo trampa lleno, tiempo mínimo de llenado;
     · archivos: extensión, tamaño, número y total (la firma se verifica
       sobre los bytes recibidos, fuera de este módulo).
   Devuelve {ok, datos (normalizados), errores:[{campo, mensaje}], senales:[]}.

   Uso:
     import { validaPayload } from './validar.mjs';
     const esquema = JSON.parse(fs.readFileSync('esquema.json'));
     const r = validaPayload(payload, esquema);
   El esquema de cada plantilla se genera con:
     node herramientas/esquema-desde-html.mjs codigo/plantillas/por-pasos.html > esquema.json
   ========================================================= */
/* La configuración se carga como script global: así el mismo archivo sirve
   en el navegador y aquí, sin duplicarlo ni cambiar su formato. */
await import('../js/validaciones.config.js');
const CFG = globalThis.FORMKIT_VALIDACIONES;

const TIEMPO_MINIMO_MS = 3000; /* señal, no veredicto: nadie llena un formulario en menos */

export function validaPayload(payload, esquema, opciones = {}) {
  const cfg = opciones.config || CFG;
  const datos = { ...(payload.datos || {}) };
  const errores = [];
  const senales = [];
  const campos = esquema.campos;
  const M = cfg.mensajes;
  const plantilla = cfg.plantilla;

  const activo = (n) => {
    const c = campos[n];
    if (!c) return false;
    if (!c.si) return true;
    const v = datos[c.si.campo];
    const lista = Array.isArray(v) ? v : [v];
    return activo(c.si.campo) && lista.some((x) => c.si.valores.includes(x));
  };
  const vacio = (v) => v === undefined || v === null || v === '' || (Array.isArray(v) && !v.length);

  /* 1. Campos desconocidos: no se aceptan (un campo «por si acaso» es un dato personal sin uso). */
  for (const n of Object.keys(datos)) if (!campos[n] && !esquema.repetibles?.some((r) => n.startsWith(`${r}.`))) errores.push({ campo: n, mensaje: 'Campo no declarado en el formulario.' });

  /* 2. Campo por campo. */
  for (const [n, c] of Object.entries(campos)) {
    if (!activo(n)) { if (!vacio(datos[n])) { delete datos[n]; senales.push(`«${n}» venía con valor aunque su condición no se cumple; se descartó.`); } continue; }
    let v = datos[n];
    if (vacio(v)) { if (c.requerido) errores.push({ campo: n, mensaje: plantilla(M[c.tipo === 'opcion' || c.tipo === 'multiple' || c.tipo === 'select' || c.tipo === 'combo' ? 'obligatorioOpcion' : c.tipo === 'casilla' ? 'obligatorioCasilla' : c.tipo === 'archivos' ? 'obligatorioArchivos' : 'obligatorioTexto'], { etiqueta: c.etiqueta }) }); continue; }
    if (c.tipo === 'casilla') { if (v !== 'si') errores.push({ campo: n, mensaje: 'Valor de casilla no admitido.' }); continue; }
    if (c.tipo === 'opcion' || c.tipo === 'select') {
      /* opciones === null: la lista viene de un catálogo en tiempo de ejecución (cascadas); se contrasta con él si se pasó. */
      const admitidas = c.opciones || opcionesDeCatalogo(c, n, opciones.catalogos);
      if (admitidas && !admitidas.includes(String(v))) errores.push({ campo: n, mensaje: plantilla(M.soloLista, { etiqueta: c.etiqueta }) });
      continue;
    }
    if (c.tipo === 'multiple') {
      const lista = Array.isArray(v) ? v : [v];
      if (lista.some((x) => !c.opciones.includes(String(x)))) errores.push({ campo: n, mensaje: plantilla(M.soloLista, { etiqueta: c.etiqueta }) });
      if (c.minOpciones && lista.length < c.minOpciones) errores.push({ campo: n, mensaje: plantilla(M.minimoOpciones, { etiqueta: c.etiqueta, min: c.minOpciones }) });
      if (c.maxOpciones && lista.length > c.maxOpciones) errores.push({ campo: n, mensaje: plantilla(M.maximoOpciones, { etiqueta: c.etiqueta, max: c.maxOpciones }) });
      datos[n] = lista;
      continue;
    }
    if (c.tipo === 'combo' && c.cerrado && c.catalogo) {
      const cat = (opciones.catalogos || {})[c.catalogo] || [];
      const nombres = (cat.filas ? [...new Set(cat.filas.map((f) => f.alcaldia))] : cat).map((o) => (typeof o === 'string' ? o : o.nombre));
      if (!nombres.some((o) => normaliza(o) === normaliza(v))) errores.push({ campo: n, mensaje: plantilla(M.soloLista, { etiqueta: c.etiqueta }) });
    }
    if (c.tipo === 'mapa') { if (!(v && v.type === 'Point' && Array.isArray(v.coordinates) && v.coordinates.length === 2)) errores.push({ campo: n, mensaje: 'Punto mal formado: se espera {type:"Point", coordinates:[lon, lat]}.' }); continue; }
    /* Texto con formato: normalizar, validar y conservar lo normalizado. */
    const f = cfg.formatos[c.formato || (c.tipo === 'textarea' ? 'texto' : '')];
    if (f) {
      v = f.normaliza(String(v));
      datos[n] = v;
      const atr = { ...(c.atributos || {}) };
      if (atr.max === 'hoy') atr.max = cfg.hoyISO();
      if (atr.min === 'hoy') atr.min = cfg.hoyISO();
      const msg = f.valida(v, atr);
      if (msg) errores.push({ campo: n, mensaje: msg });
    } else if (typeof v === 'string') {
      v = cfg.recorta(v); datos[n] = v;
      if (c.atributos?.maxlength && v.length > Number(c.atributos.maxlength)) errores.push({ campo: n, mensaje: `Usa hasta ${c.atributos.maxlength} caracteres en «${c.etiqueta}».` });
      if (c.atributos?.minlength && v.length < Number(c.atributos.minlength)) errores.push({ campo: n, mensaje: `Escribe al menos ${c.atributos.minlength} caracteres en «${c.etiqueta}».` });
    }
  }

  /* 3. «Otro»: texto sólo si «Otro» fue elegida (ya lo cubre la condición) y exigido si lo fue (ya lo cubre requerido). Se registra como señal si llegó texto sin elección. */

  /* 4. Cruzadas. */
  for (const [n, c] of Object.entries(campos)) {
    if (!c.cruzadas || !activo(n)) continue;
    for (const cz of c.cruzadas) {
      const def = cfg.cruzadas[cz.clave];
      if (!def) continue;
      const valores = {};
      let listo = true;
      for (const rol of def.campos) { const campo = cz.mapa[rol] || rol; const v = datos[campo]; if (vacio(v) || errores.some((e) => e.campo === campo)) { listo = false; break; } const ff = cfg.formatos[campos[campo]?.formato]; valores[rol] = ff ? ff.normaliza(String(v)) : v; }
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

  /* 6. Archivos (metadatos; la firma se comprueba sobre los bytes recibidos). */
  const A = cfg.archivos;
  const archivos = payload.archivos || [];
  const porCampo = {};
  for (const a of archivos) {
    (porCampo[a.campo] = porCampo[a.campo] || []).push(a);
    const ext = String(a.nombre || '').split('.').pop().toLowerCase();
    const extensiones = campos[a.campo]?.atributos?.extensiones?.split(',') || A.extensiones;
    if (!extensiones.includes(ext)) errores.push({ campo: a.campo, mensaje: `Archivo «${a.nombre}»: ${plantilla(M.archRechazoTipo, { formatos: extensiones.join(', ').toUpperCase() })}` });
    if (!(a.size > 0)) errores.push({ campo: a.campo, mensaje: `Archivo «${a.nombre}»: ${M.archRechazoVacio}` });
    const mb = Number(campos[a.campo]?.atributos?.mb || A.mb);
    if (a.size > mb * 1048576) errores.push({ campo: a.campo, mensaje: `Archivo «${a.nombre}»: ${plantilla(M.archRechazoPeso, { peso: `${(a.size / 1048576).toFixed(1)} MB`, mb })}` });
    if (/[\\/\u0000-\u001F]/.test(a.nombre || '')) errores.push({ campo: a.campo, mensaje: `Archivo «${a.nombre}»: nombre no saneado.` });
  }
  for (const [campo, lista] of Object.entries(porCampo)) {
    const max = Number(campos[campo]?.atributos?.max || A.max);
    if (lista.length > max) errores.push({ campo, mensaje: plantilla(M.archRechazoMax, { max }) });
    const total = lista.reduce((s, a) => s + (a.size || 0), 0);
    if (total > A.mbTotal * 1048576) errores.push({ campo, mensaje: plantilla(M.archRechazoTotal, { mb: A.mbTotal }) });
    const huellas = lista.map((a) => a.sha256_original).filter(Boolean);
    if (new Set(huellas).size !== huellas.length) errores.push({ campo, mensaje: M.archRechazoDuplicado });
  }
  for (const [n, c] of Object.entries(campos)) if (c.tipo === 'archivos' && c.requerido && activo(n) && !(porCampo[n] || []).length) errores.push({ campo: n, mensaje: plantilla(M.obligatorioArchivos, { etiqueta: c.etiqueta }) });

  return { ok: errores.length === 0, datos, errores, senales };
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
