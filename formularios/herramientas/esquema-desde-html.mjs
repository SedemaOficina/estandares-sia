#!/usr/bin/env node
/* =========================================================
   esquema-desde-html.mjs · Deriva el esquema de validación del HTML

   Lee un formulario del estándar y escribe un JSON con la declaración de
   cada campo (tipo, obligatorio, formato, condición, opciones, atributos,
   cruzadas), para que codigo/servidor/validar.mjs aplique en el servidor
   EXACTAMENTE lo que el HTML declara. Así el servidor no tiene una segunda
   lista de reglas que pueda desactualizarse: se regenera con cada cambio.

   Uso: node herramientas/esquema-desde-html.mjs codigo/plantillas/por-pasos.html [salida.json]

   Limitaciones (documentadas): analiza el HTML con expresiones regulares
   sobre la estructura que el estándar prescribe (un [data-campo] por
   envoltura, controles dentro). HTML fuera del contrato puede leerse mal:
   la prueba del paquete compara este esquema con lo que el navegador
   expone para detectarlo.
   ========================================================= */
import { readFileSync, writeFileSync } from 'node:fs';

const [, , entrada, salida] = process.argv;
if (!entrada) { console.error('Uso: node herramientas/esquema-desde-html.mjs <formulario.html> [salida.json]'); process.exit(2); }
const html = readFileSync(entrada, 'utf8');

const atributos = (tag) => {
  const a = {};
  for (const m of tag.matchAll(/([a-zA-Z][\w-]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g)) if (m.index > 0 || !/^[a-z]+$/.test(m[1])) a[m[1]] = m[2] ?? m[3] ?? m[4] ?? '';
  return a;
};

/* Plantillas de repetibles: los campos con # se registran como patrón, y
   cada grupo guarda su mínimo y máximo de filas y su nombre para los mensajes. */
const repetibles = [...html.matchAll(/data-repetible="([^"]+)"/g)].map((m) => m[1]);
const limitesRepetibles = {};
for (const m of html.matchAll(/<\w+([^>]*\sdata-repetible="([^"]+)"[^>]*)>/g)) {
  const a = atributos(m[1]);
  limitesRepetibles[m[2]] = { min: Number(a['data-min'] || 0), max: a['data-max'] ? Number(a['data-max']) : null, etiqueta: a['data-etiqueta'] || m[2] };
}

const campos = {};
const re = /<(\w+)([^>]*\sdata-campo="([^"]+)"[^>]*)>/g;
let m;
const posiciones = [];
while ((m = re.exec(html))) posiciones.push({ tag: m[1], attrs: atributos(m[2]), nombre: m[3], inicio: m.index, fin: m.index + m[0].length });
posiciones.forEach((p, i) => {
  const hasta = posiciones[i + 1] ? posiciones[i + 1].inicio : html.length;
  const bloque = html.slice(p.fin, hasta);
  const d = p.attrs;
  const etiqueta = (bloque.match(/<(?:label|legend|span)[^>]*class="[^"]*etiqueta[^"]*"[^>]*>([\s\S]*?)<\/(?:label|legend|span)>/) || [])[1];
  const controles = [...bloque.matchAll(/<(input|select|textarea)([^>]*)>/g)].map((c) => ({ tag: c[1], a: atributos(c[2]) })).filter((c) => !/data-trampa|type="hidden"/.test(JSON.stringify(c.a)) || c.a.type !== 'hidden');
  const radios = controles.filter((c) => c.a.type === 'radio');
  const casillas = controles.filter((c) => c.a.type === 'checkbox');
  const opcionesSelect = [...bloque.matchAll(/<option value="([^"]*)"/g)].map((o) => o[1]).filter(Boolean);
  let tipo = 'texto';
  if (/data-archivos/.test(bloque)) tipo = 'archivos';
  else if (/data-combo/.test(bloque)) tipo = 'combo';
  else if (/data-mapa\b/.test(bloque)) tipo = 'mapa';
  else if (/data-toggle\b/.test(bloque)) tipo = 'toggle';
  else if (radios.length) tipo = 'opcion';
  else if (casillas.length > 1) tipo = 'multiple';
  else if (casillas.length === 1) tipo = 'casilla';
  else if (controles.some((c) => c.tag === 'select')) tipo = 'select';
  else if (controles.some((c) => c.tag === 'textarea')) tipo = 'textarea';
  const principal = controles.find((c) => c.a.type !== 'hidden') || { a: {} };
  const atr = {};
  for (const k of ['min', 'max', 'step', 'minlength', 'maxlength']) if (principal.a[k] !== undefined) atr[k] = principal.a[k];
  if (principal.a['data-legible'] !== undefined) atr.legible = true;
  /* data-no-futura: el máximo es «hoy» en el momento de validar; el servidor lo resuelve. */
  if (d['data-no-futura'] !== undefined) atr.max = 'hoy';
  for (const [k, v] of Object.entries(d)) if (k.startsWith('data-') && !['data-campo', 'data-si', 'data-formato', 'data-requerido', 'data-cruzada', 'data-cruzada-campos', 'data-cruzada-nivel', 'data-uso', 'data-finalidad', 'data-sensible'].includes(k)) atr[k.replace(/^data-/, '').replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = v;
  const campo = {
    etiqueta: (etiqueta || p.nombre).replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim(),
    tipo,
    requerido: d['data-requerido'] !== undefined || controles.some((c) => c.a.required !== undefined),
    formato: d['data-formato'] || (tipo === 'textarea' ? 'texto' : undefined),
    sensible: d['data-sensible'] !== undefined,
    uso: d['data-uso'] || '',
    finalidad: d['data-finalidad'],
    atributos: atr,
    opciones: tipo === 'opcion' ? radios.map((r) => r.a.value) : tipo === 'multiple' ? casillas.map((c) => c.a.value) : tipo === 'select' ? opcionesSelect : undefined,
    cerrado: tipo === 'combo' ? !/data-libre/.test(bloque) : undefined,
    catalogo: tipo === 'combo' ? (bloque.match(/data-catalogo="([^"]+)"/) || [])[1] : undefined,
    autocomplete: principal.a.autocomplete
  };
  /* Condición: el propio campo o un ancestro con data-si (se busca hacia atrás un div[data-si] abierto).
     Si hay las dos, la del ancestro va en siPadre y el servidor exige ambas. */
  const condicion = (texto) => { const [c, lista] = texto.split('='); return { campo: c.trim(), valores: (lista || '').split('|') }; };
  const padre = ancestroSi(html, p.inicio);
  const si = d['data-si'] || padre;
  if (si) campo.si = condicion(si);
  if (d['data-si'] && padre) campo.siPadre = condicion(padre);
  if (d['data-cruzada']) {
    campo.cruzadas = d['data-cruzada'].split(/\s+/).filter(Boolean).map((clave) => {
      const mapa = {}; for (const par of (d['data-cruzada-campos'] || '').split(/\s+/).filter(Boolean)) { const [rol, c] = par.split('='); mapa[rol] = c || rol; }
      return { clave, mapa, nivel: d['data-cruzada-nivel'] || 'error', catalogo: d['data-catalogo'] };
    });
  }
  if (tipo === 'select' && /data-nivel="(colonia)"/.test(bloque)) campo.opciones = null; /* las opciones vienen del catálogo en tiempo de ejecución */
  if (tipo === 'select' && /data-nivel="alcaldia"/.test(bloque)) campo.opciones = null;
  campos[p.nombre] = campo;
});

/* Un div[data-si] que envuelve varios campos: se busca el último abierto antes del campo sin cerrar. */
function ancestroSi(texto, pos) {
  const antes = texto.slice(0, pos);
  const aperturas = [...antes.matchAll(/<div[^>]*\sdata-si="([^"]+)"[^>]*>/g)];
  for (let i = aperturas.length - 1; i >= 0; i--) {
    const desde = aperturas[i].index + aperturas[i][0].length;
    const tramo = antes.slice(desde);
    let prof = 1;
    for (const t of tramo.matchAll(/<div\b|<\/div>/g)) { prof += t[0] === '</div>' ? -1 : 1; if (prof === 0) break; }
    if (prof > 0) return aperturas[i][1];
  }
  return '';
}

/* Cascadas: el módulo declara en tiempo de ejecución la cruzada cp ↔ colonia
   (advertencia). El esquema la reproduce para que el servidor también la
   evalúe, leyendo el contenedor [data-cascada] y sus niveles. */
for (const m of html.matchAll(/<div[^>]*\sdata-cascada\b[^>]*>/g)) {
  const cat = (m[0].match(/data-catalogo="([^"]+)"/) || [])[1];
  const desde = m.index;
  let prof = 1, fin = html.length;
  for (const t of html.slice(desde + m[0].length).matchAll(/<div\b|<\/div>/g)) { prof += t[0] === '</div>' ? -1 : 1; if (prof === 0) { fin = desde + m[0].length + t.index; break; } }
  const bloque = html.slice(desde, fin);
  /* El campo de cada nivel es el último data-campo abierto antes de su data-nivel. */
  const nivel = (n) => { const i = bloque.indexOf(`data-nivel="${n}"`); if (i < 0) return null; const antes = [...bloque.slice(0, i).matchAll(/data-campo="([^"]+)"/g)]; return antes.length ? antes.at(-1)[1] : null; };
  const cp = nivel('cp'), colonia = nivel('colonia');
  if (cp && colonia && campos[cp] && !(campos[cp].cruzadas || []).some((c) => c.clave === 'cp-colonia')) {
    campos[cp].cruzadas = [...(campos[cp].cruzadas || []), { clave: 'cp-colonia', mapa: { cp, colonia }, nivel: 'advertencia', catalogo: cat }];
  }
}

const esquema = { formulario: entrada.replace(/\\/g, '/').split('/').pop(), generado: new Date().toISOString(), campos, repetibles, limitesRepetibles };
/* Si el esquema no cambió, se conserva el archivo con su fecha: así una
   construcción sin cambios no marca el archivo como cambiado. */
let previo = null;
if (salida) try { previo = JSON.parse(readFileSync(salida, 'utf8')); } catch { previo = null; }
const sinFecha = (e) => JSON.stringify({ ...e, generado: undefined });
if (previo && sinFecha(previo) === sinFecha(esquema)) console.log(`Esquema con ${Object.keys(campos).length} campos → ${salida} (sin cambios)`);
else {
  const texto = JSON.stringify(esquema, null, 2);
  if (salida) { writeFileSync(salida, texto); console.log(`Esquema con ${Object.keys(campos).length} campos → ${salida}`); } else process.stdout.write(texto);
}
