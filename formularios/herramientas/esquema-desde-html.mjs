#!/usr/bin/env node
/* =========================================================
   esquema-desde-html.mjs · Deriva el esquema de validación del HTML

   Lee un formulario del estándar y escribe un JSON con la declaración de
   cada campo (tipo, obligatorio, formato, condición, opciones, atributos,
   cruzadas), para que codigo/servidor/validar.mjs aplique en el servidor
   EXACTAMENTE lo que el HTML declara. Así el servidor no tiene una segunda
   lista de reglas que pueda desactualizarse: se regenera con cada cambio.

   Uso: node herramientas/esquema-desde-html.mjs codigo/plantillas/por-pasos.html [salida.json] [--comprobar]
   Con --comprobar no escribe: sale con 1 si el esquema guardado está atrasado.

   Limitaciones (documentadas): analiza el HTML con expresiones regulares
   sobre la estructura que el estándar prescribe (un [data-campo] por
   envoltura, controles dentro). HTML fuera del contrato puede leerse mal:
   la prueba del paquete compara este esquema con lo que el navegador
   expone para detectarlo.
   ========================================================= */
import { readFileSync, writeFileSync } from 'node:fs';
/* La configuración única: dice qué cruzadas no bloquean (son advertencia), como en el navegador. */
await import('../codigo/js/validaciones.config.js');
const CRUZADAS = globalThis.FORMKIT_VALIDACIONES.cruzadas;

const COMPROBAR = process.argv.includes('--comprobar');
const [entrada, salida] = process.argv.slice(2).filter((a) => a !== '--comprobar');
if (!entrada) { console.error('Uso: node herramientas/esquema-desde-html.mjs <formulario.html> [salida.json]'); process.exit(2); }
/* Lo comentado no es parte del formulario: un campo dentro de <!-- --> no se declara. */
const pagina = readFileSync(entrada, 'utf8').replace(/<!--[\s\S]*?-->/g, '');
/* Sólo cuenta lo que está dentro de los <form>: un control fuera del
   formulario (una casilla de la página) no es parte del último campo. Sin
   <form> se lee todo, para fragmentos y bloques sueltos. */
const formularios = [...pagina.matchAll(/<form\b[^>]*>[\s\S]*?<\/form>/gi)].map((m) => m[0]);
const html = formularios.length ? formularios.join('\n') : pagina;
/* Etiquetas sin cierre: no abren un ancestro. */
const VACIOS = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);

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
  /* Dato que calcula la página: no viaja; el servidor lo calcula con opciones.auxiliares. */
  if (d['data-auxiliar'] !== undefined) tipo = 'auxiliar';
  else if (/data-archivos/.test(bloque)) tipo = 'archivos';
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
  /* Condiciones: las de todos los ancestros con data-si (de afuera hacia
     adentro) y la del propio campo. El servidor exige todas, como el
     navegador, que oculta el campo si cualquiera de sus ancestros está oculto.
     «si» guarda la más cercana para quien lee el esquema. */
  const condicion = (texto) => { const [c, lista] = texto.split('='); return { campo: c.trim(), valores: (lista || '').split('|') }; };
  const condiciones = [...ancestrosSi(html, p.inicio), ...(d['data-si'] ? [d['data-si']] : [])].map(condicion);
  if (condiciones.length) { campo.si = condiciones.at(-1); campo.condiciones = condiciones; }
  if (d['data-cruzada']) {
    campo.cruzadas = d['data-cruzada'].split(/\s+/).filter(Boolean).map((clave) => {
      const mapa = {}; for (const par of (d['data-cruzada-campos'] || '').split(/\s+/).filter(Boolean)) { const [rol, c] = par.split('='); mapa[rol] = c || rol; }
      return { clave, mapa, nivel: d['data-cruzada-nivel'] || (CRUZADAS[clave] && CRUZADAS[clave].bloquea === false ? 'advertencia' : 'error'), catalogo: d['data-catalogo'] };
    });
  }
  if (tipo === 'select' && /data-nivel="(colonia)"/.test(bloque)) campo.opciones = null; /* las opciones vienen del catálogo en tiempo de ejecución */
  if (tipo === 'select' && /data-nivel="alcaldia"/.test(bloque)) campo.opciones = null;
  campos[p.nombre] = campo;
});

/* Las condiciones data-si de todos los elementos que siguen abiertos en pos
   (cualquier etiqueta: div, section, fieldset…), de afuera hacia adentro. */
function ancestrosSi(texto, pos) {
  const pila = [];
  for (const m of texto.slice(0, pos).matchAll(/<(\/?)([a-zA-Z][\w-]*)\b([^>]*)>/g)) {
    const [, cierra, etiqueta, resto] = m;
    const t = etiqueta.toLowerCase();
    if (cierra) { const i = pila.map((x) => x.t).lastIndexOf(t); if (i >= 0) pila.length = i; continue; }
    if (VACIOS.has(t) || /\/\s*$/.test(resto)) continue;
    pila.push({ t, si: (resto.match(/\sdata-si="([^"]*)"/) || [])[1] });
  }
  return pila.filter((x) => x.si !== undefined).map((x) => x.si);
}

/* Periodos: el módulo «fecha» declara al correr la cruzada rango-fechas en el
   campo final de un [data-rango="inicio,fin"] que no tenga otra; el esquema la
   reproduce para que el servidor también la revise. */
for (const m of html.matchAll(/\sdata-rango="([^"]+)"/g)) {
  const [ini, fin] = m[1].split(',').map((s) => s.trim());
  if (ini && fin && campos[fin] && !campos[fin].cruzadas) campos[fin].cruzadas = [{ clave: 'rango-fechas', mapa: { inicio: ini, fin }, nivel: 'error' }];
}

/* El <div> que abre en «desde» y dónde cierra. */
const finDelDiv = (desde, largo) => {
  let prof = 1;
  for (const t of html.slice(desde + largo).matchAll(/<div\b|<\/div>/g)) { prof += t[0] === '</div>' ? -1 : 1; if (prof === 0) return desde + largo + t.index; }
  return html.length;
};

/* Cascadas: el módulo declara en tiempo de ejecución la cruzada cp ↔ colonia
   (advertencia). El esquema la reproduce para que el servidor también la
   evalúe, leyendo el contenedor [data-cascada] y sus niveles. Cada select de la
   cascada guarda su nivel, su catálogo y, la colonia, la alcaldía de la que
   depende. Los campos de la lista ([data-cascada-lista]) y los de la captura
   manual ([data-cascada-manual]) quedan marcados con el número de su cascada:
   el servidor exige unos u otros según lo que llegue. */
let numeroCascada = 0;
for (const m of html.matchAll(/<div[^>]*\sdata-cascada(?![-\w])[^>]*>/g)) {
  const cat = (m[0].match(/data-catalogo="([^"]+)"/) || [])[1];
  const desde = m.index;
  const fin = finDelDiv(desde, m[0].length);
  const bloque = html.slice(desde, fin);
  /* El campo de cada nivel es el último data-campo abierto antes de su data-nivel. */
  const nivel = (n) => { const i = bloque.indexOf(`data-nivel="${n}"`); if (i < 0) return null; const antes = [...bloque.slice(0, i).matchAll(/data-campo="([^"]+)"/g)]; return antes.length ? antes.at(-1)[1] : null; };
  const alcaldia = nivel('alcaldia'), cp = nivel('cp'), colonia = nivel('colonia');
  for (const [n, campo] of [['alcaldia', alcaldia], ['colonia', colonia]]) if (campo && campos[campo] && campos[campo].tipo === 'select') Object.assign(campos[campo], { nivel: n, catalogo: cat });
  if (colonia && alcaldia && campos[colonia]) Object.assign(campos[colonia], { padre: alcaldia, nivelPadre: 'alcaldia' });
  if (cp && colonia && campos[cp] && !(campos[cp].cruzadas || []).some((c) => c.clave === 'cp-colonia')) {
    campos[cp].cruzadas = [...(campos[cp].cruzadas || []), { clave: 'cp-colonia', mapa: { cp, colonia }, nivel: 'advertencia', catalogo: cat }];
  }
  for (const [atributo, marca] of [['data-cascada-lista', 'cascadaLista'], ['data-cascada-manual', 'cascadaManual']]) {
    for (const z of bloque.matchAll(new RegExp(`<div[^>]*\\s${atributo}\\b[^>]*>`, 'g'))) {
      const ini = desde + z.index, hasta = finDelDiv(ini, z[0].length);
      for (const p of posiciones) if (p.inicio > ini && p.inicio < hasta && campos[p.nombre]) campos[p.nombre][marca] = numeroCascada;
    }
  }
  numeroCascada++;
}

const esquema = { formulario: entrada.replace(/\\/g, '/').split('/').pop(), generado: new Date().toISOString(), campos, repetibles, limitesRepetibles };
/* Si el esquema no cambió, se conserva el archivo con su fecha: así una
   construcción sin cambios no marca el archivo como cambiado. */
let previo = null;
if (salida) try { previo = JSON.parse(readFileSync(salida, 'utf8')); } catch { previo = null; }
const sinFecha = (e) => JSON.stringify({ ...e, generado: undefined });
if (previo && sinFecha(previo) === sinFecha(esquema)) console.log(`Esquema con ${Object.keys(campos).length} campos → ${salida} (sin cambios)`);
else if (COMPROBAR) { console.log(`Esquema ${salida} (atrasado)`); process.exit(1); }
else {
  const texto = JSON.stringify(esquema, null, 2);
  if (salida) { writeFileSync(salida, texto); console.log(`Esquema con ${Object.keys(campos).length} campos → ${salida}`); } else process.stdout.write(texto);
}
