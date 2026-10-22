#!/usr/bin/env node
/* =========================================================
   auditor-css.mjs · Auditoría de hojas de estilo (norma 8.3, FRM-66 a FRM-68 y FRM-70;
   FRM-69, que nada pise [hidden], la comprueban las pruebas de formularios)

   Por qué existe: el navegador NO avisa cuando un selector se declara dos
   veces, cuando un color se escribe suelto o cuando una regla nueva se
   añade al final del archivo. Gana la última y el resultado «se ve raro»
   sin que nada diga dónde. Este guion convierte cada regla del estándar
   en una comprobación que falla.

   Copiado del estándar de formularios 1.0.0. Lo propio de geovisores:
   varias hojas de tokens (las de formularios, de referencia, más
   tokens-mapa.css y temas.css), cortes solo con min-width (A11, GEO-21),
   sin transition: all (A17, GEO-58), temas de cuatro tokens (A18, GEO-70)
   y :hover solo con (hover: hover) (A19, GEO-25).

   Sin dependencias: lee los archivos que declara auditor-css.config.json.

   Uso:
     node herramientas/auditor-css.mjs                 # hojas del paquete
     node herramientas/auditor-css.mjs --json          # salida de máquina
     node herramientas/auditor-css.mjs ruta/a/hoja.css # otra hoja (sin A09/A16)

   Código de salida: 0 sin hallazgos de error; 1 con ellos.
   ========================================================= */
import { readFileSync, existsSync } from 'node:fs';
import { dirname, resolve, relative as relativoNativo } from 'node:path';
import { fileURLToPath } from 'node:url';

/* En Windows, path.relative devuelve diagonales invertidas; las rutas de la
   configuración usan diagonales normales. */
const relative = (desde, hasta) => relativoNativo(desde, hasta).split('\\').join('/');

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CFG = JSON.parse(readFileSync(resolve(RAIZ, 'herramientas/auditor-css.config.json'), 'utf8'));

/* ---------- Lectura y análisis sintáctico ---------- */

/* Devuelve el árbol de reglas con número de línea. No es un analizador
   completo de CSS: cubre lo que el estándar permite escribir (reglas,
   @media, @supports, @font-face, @keyframes) y falla en voz alta si
   encuentra llaves sin cerrar. */
export function analiza(texto, archivo) {
  let i = 0, linea = 1;
  const n = texto.length;
  const comentarios = []; // {linea, finLinea, texto}

  function avanza(k = 1) { for (let j = 0; j < k; j++) { if (texto[i] === '\n') linea++; i++; } }

  function saltaEspacioYComentarios() {
    for (;;) {
      while (i < n && /\s/.test(texto[i])) avanza();
      if (texto.startsWith('/*', i)) {
        const ini = linea, desde = i;
        const fin = texto.indexOf('*/', i + 2);
        if (fin < 0) throw new Error(`${archivo}: comentario sin cerrar en la línea ${ini}`);
        avanza(fin + 2 - i);
        comentarios.push({ linea: ini, finLinea: linea, texto: texto.slice(desde, fin + 2) });
      } else break;
    }
  }

  /* Lee hasta uno de los caracteres de parada, respetando paréntesis,
     corchetes y cadenas; devuelve el texto leído. */
  function leeHasta(paradas) {
    let prof = 0, ini = i, comilla = null;
    while (i < n) {
      const c = texto[i];
      if (comilla) { if (c === '\\') { avanza(2); continue; } if (c === comilla) comilla = null; avanza(); continue; }
      if (c === '"' || c === "'") { comilla = c; avanza(); continue; }
      if (texto.startsWith('/*', i)) {
        const ini2 = linea, desde = i; const fin = texto.indexOf('*/', i + 2);
        avanza(fin + 2 - i); comentarios.push({ linea: ini2, finLinea: linea, texto: texto.slice(desde, fin + 2) }); continue;
      }
      if (c === '(' || c === '[') prof++;
      if (c === ')' || c === ']') prof--;
      if (prof <= 0 && paradas.includes(c)) break;
      avanza();
    }
    return texto.slice(ini, i);
  }

  function leeBloque(contexto) {
    const reglas = [];
    for (;;) {
      saltaEspacioYComentarios();
      if (i >= n) return reglas;
      if (texto[i] === '}') return reglas;
      const lineaIni = linea;
      if (texto[i] === '@') {
        const cab = leeHasta(['{', ';']).trim();
        if (texto[i] === ';') { avanza(); reglas.push({ tipo: 'arroba', cabecera: cab, linea: lineaIni, contexto }); continue; }
        avanza(); // {
        const nombre = cab.split(/[\s(]/)[0];
        if (nombre === '@font-face') {
          const decl = leeDeclaraciones(); reglas.push({ tipo: 'font-face', decl, linea: lineaIni, contexto });
        } else {
          const hijos = leeBloque(contexto.concat(cab));
          if (texto[i] !== '}') throw new Error(`${archivo}: llave sin cerrar para ${cab} (línea ${lineaIni})`);
          avanza();
          reglas.push({ tipo: 'bloque-arroba', cabecera: cab, nombre, hijos, linea: lineaIni, contexto });
        }
        continue;
      }
      const sel = leeHasta(['{']).trim();
      if (i >= n) throw new Error(`${archivo}: selector sin cuerpo en la línea ${lineaIni}`);
      avanza(); // {
      const decl = leeDeclaraciones();
      reglas.push({ tipo: 'regla', selector: sel, selectores: partePorComas(sel), decl, linea: lineaIni, contexto });
    }
  }

  function leeDeclaraciones() {
    const decl = [];
    for (;;) {
      saltaEspacioYComentarios();
      if (i >= n) throw new Error(`${archivo}: llave sin cerrar`);
      if (texto[i] === '}') { avanza(); return decl; }
      const lineaIni = linea;
      const pr = leeHasta([':', '}', ';']);
      if (texto[i] !== ':') { if (texto[i] === ';') avanza(); continue; }
      avanza();
      let v = leeHasta([';', '}']).trim();
      if (texto[i] === ';') avanza();
      const imp = /!\s*important\s*$/i.test(v);
      if (imp) v = v.replace(/!\s*important\s*$/i, '').trim();
      decl.push({ prop: pr.trim().toLowerCase(), valor: v, importante: imp, linea: lineaIni });
    }
  }

  const arbol = leeBloque([]);
  if (i < n && texto[i] === '}') throw new Error(`${archivo}: llave de cierre sobrante (línea ${linea})`);
  return { arbol, comentarios };
}

function partePorComas(sel) {
  const out = []; let prof = 0, ini = 0;
  for (let j = 0; j < sel.length; j++) {
    const c = sel[j];
    if (c === '(' || c === '[') prof++;
    if (c === ')' || c === ']') prof--;
    if (c === ',' && prof === 0) { out.push(sel.slice(ini, j).trim()); ini = j + 1; }
  }
  out.push(sel.slice(ini).trim());
  return out.filter(Boolean);
}

/* Recorre las reglas con su contexto de @-bloque. */
function* reglasDe(arbol) {
  for (const r of arbol) {
    if (r.tipo === 'regla') yield r;
    else if (r.tipo === 'bloque-arroba') yield* reglasDe(r.hijos);
  }
}

/* ---------- Comprobaciones ---------- */

const hallazgos = [];
function hallazgo(id, archivo, linea, msg, gravedad = 'error') {
  hallazgos.push({ id, archivo, linea, msg, gravedad });
}

const esHojaDeTokens = (nombre) => (CFG.hojasDeTokens || []).includes(nombre.replace(/\\/g, '/'));
const esMovimientoReducido = (ctx) => ctx.some(c => /prefers-reduced-motion\s*:\s*reduce/.test(c));
const dentroDeMedia = (ctx) => ctx.some(c => /^@(media|supports)/.test(c));
const nombreRaiz = (sel) => sel.trim() === ':root';

function tieneExcepcionAnotada(comentarios, linea) {
  return comentarios.some(c => c.finLinea >= linea - 4 && c.finLinea <= linea && /excepci[oó]n deliberada/i.test(c.texto));
}

/* Cuenta niveles de descendencia de un selector: compuestos separados por
   espacio, >, + o ~ fuera de paréntesis y corchetes. */
function nivelesDe(sel) {
  /* «a > b» cuenta una sola vez: los espacios junto a un combinador se quitan antes de contar. */
  const compactado = sel.replace(/\s*([>+~])\s*/g, '$1');
  let pr = 0, k = 1, previoSep = false;
  for (let j = 0; j < compactado.length; j++) {
    const c = compactado[j];
    if (c === '(' || c === '[') pr++;
    if (c === ')' || c === ']') pr--;
    if (pr > 0) continue;
    if (/[\s>+~]/.test(c)) { if (!previoSep) k++; previoSep = true; } else previoSep = false;
  }
  return k;
}

const RE_HEX = /#[0-9a-fA-F]{3,8}\b/;
const RE_FUNC_COLOR = /\b(rgba?|hsla?|hwb|lab|lch|oklab|oklch|color|color-mix)\s*\(/i;

function nombresDeColor(valor) {
  const sinVar = valor.replace(/var\([^)]*\)/g, ' ').replace(/url\([^)]*\)/g, ' ').replace(/'[^']*'|"[^"]*"/g, ' ');
  const palabras = sinVar.toLowerCase().match(/[a-z]+/g) || [];
  const nombrados = new Set(CFG.coloresNombrados);
  return palabras.filter(p => nombrados.has(p));
}

function literalDeLongitud(valor) {
  const limpio = valor.replace(/var\([^)]*\)/g, ' ').replace(/url\([^)]*\)/g, ' ').replace(/'[^']*'|"[^"]*"/g, ' ');
  const re = new RegExp(`(?<![\\w.-])-?\\d*\\.?\\d+(${CFG.unidadesProhibidas.join('|')})\\b`, 'i');
  return limpio.match(re);
}

function auditaHoja(archivo, texto) {
  let analisis;
  try { analisis = analiza(texto, archivo); }
  catch (e) { hallazgo('A00', archivo, 0, `no se pudo analizar: ${e.message}`); return null; }
  const { arbol, comentarios } = analisis;

  /* A01 · un selector, una declaración (fuera de @media/@supports/@keyframes). */
  const vistos = new Map();
  for (const r of reglasDe(arbol)) {
    if (dentroDeMedia(r.contexto) || r.contexto.some(c => /^@keyframes/.test(c))) continue;
    for (const s of r.selectores) {
      const k = s.replace(/\s+/g, ' ');
      if (vistos.has(k) && !tieneExcepcionAnotada(comentarios, r.linea))
        hallazgo('A01', archivo, r.linea, `el selector «${k}» ya se declaró en la línea ${vistos.get(k)}. Un selector, una declaración; si es una excepción deliberada, se anota con ese comentario justo antes`);
      else if (!vistos.has(k)) vistos.set(k, r.linea);
    }
  }

  const todas = [...reglasDe(arbol)];
  const fuentes = arbol.filter(r => r.tipo === 'font-face');

  for (const r of todas) {
    const enRaiz = r.selectores.length === 1 && nombreRaiz(r.selectores[0]);

    /* A02 · una propiedad, una vez por regla. */
    const props = new Map();
    for (const d of r.decl) {
      if (d.prop.startsWith('--')) { if (props.has(d.prop)) hallazgo('A02', archivo, d.linea, `la variable ${d.prop} se declara dos veces en la misma regla`); props.set(d.prop, d.linea); continue; }
      if (props.has(d.prop)) hallazgo('A02', archivo, d.linea, `la propiedad «${d.prop}» se declara dos veces en «${r.selector}»`);
      props.set(d.prop, d.linea);
    }

    /* A07 · identificadores para dar estilo. */
    for (const s of r.selectores) if (/(^|[^\w-])#[\w-]+/.test(s.replace(/\[[^\]]*\]/g, ''))) hallazgo('A07', archivo, r.linea, `«${s}» usa #id para dar estilo; se estiliza por clase`);

    /* A08 · cadenas de más de dos niveles. */
    for (const s of r.selectores) { const nv = nivelesDe(s); if (nv > 2) hallazgo('A08', archivo, r.linea, `«${s}» encadena ${nv} niveles; el máximo son dos`); }

    /* A10 · clases que duplican un estado que ya vive en un atributo. */
    for (const s of r.selectores) {
      const m = [...s.matchAll(/\.([A-Za-z_][\w-]*)/g)].map(x => x[1]);
      for (const cl of m) if (CFG.clasesDeEstadoProhibidas.includes(cl)) hallazgo('A10', archivo, r.linea, `«${s}»: la clase .${cl} duplica un estado; se lee del atributo ([aria-pressed], :checked, [aria-invalid], [open]…)`);
    }

    for (const d of r.decl) {
      /* A03 · !important sólo en movimiento reducido. */
      if (d.importante && !esMovimientoReducido(r.contexto)) hallazgo('A03', archivo, d.linea, `!important en «${r.selector}» { ${d.prop} }; sólo se admite dentro de prefers-reduced-motion`);

      /* A17 · transiciones con propiedades nombradas (GEO-58): con
         transition: all el anillo de foco se desvanecía (AP). */
      if ((d.prop === 'transition' && /(^|[\s,])all(\s|,|$)/.test(d.valor)) || (d.prop === 'transition-property' && /\ball\b/.test(d.valor)))
        hallazgo('A17', archivo, d.linea, `«${r.selector}» { ${d.prop}: ${d.valor} }; se nombran las propiedades que cambian, nunca all`);

      // :root y las hojas de tokens son el único lugar de los valores
      if (enRaiz || esHojaDeTokens(archivo)) continue;

      const v = d.valor;
      /* A04 · color fuera de :root. */
      if (RE_HEX.test(v.replace(/url\([^)]*\)/g, ''))) hallazgo('A04', archivo, d.linea, `color literal (#hex) en «${r.selector}» { ${d.prop} }; los colores viven en :root`);
      if (RE_FUNC_COLOR.test(v)) hallazgo('A04', archivo, d.linea, `color funcional (rgb/hsl…) en «${r.selector}» { ${d.prop} }; los colores viven en :root`);
      const nom = nombresDeColor(v);
      if (nom.length && !/^(font-family|content|animation-name|transition-property|will-change|grid-area|counter-.*|list-style-type)$/.test(d.prop)) hallazgo('A04', archivo, d.linea, `color con nombre «${nom[0]}» en «${r.selector}» { ${d.prop} }; los colores viven en :root`);
      if (/url\(\s*['"]?data:/i.test(v)) hallazgo('A04', archivo, d.linea, `data: URI en «${r.selector}»; un dibujo con color propio es un color fuera de :root. Se dibuja con bordes y formas CSS`);

      /* A05 · longitudes literales. */
      if (CFG.propiedadesDeLongitud.includes(d.prop)) {
        const lit = literalDeLongitud(v);
        if (lit) hallazgo('A05', archivo, d.linea, `longitud literal «${lit[0]}» en «${r.selector}» { ${d.prop} }; se usa un token de tamaño, espaciado, radio o trazo`);
      }
      /* A06 · otras propiedades que sólo admiten token. */
      const soloToken = {
        'font-family': /^var\(--fuente-[\w-]+\)$|^inherit$/,
        'font-weight': /^var\(--peso-[\w-]+\)$|^inherit$/,
        'z-index': /^var\(--z-[\w-]+\)$|^0$|^-1$/,
        'opacity': /^var\(--op-[\w-]+\)$|^[01]$/,
        'transition-duration': /^var\(--dur-[\w-]+\)$/,
        'animation-duration': /^var\(--dur-[\w-]+\)$/
      };
      if (soloToken[d.prop] && !soloToken[d.prop].test(v.trim())) hallazgo('A06', archivo, d.linea, `«${d.prop}: ${v}» en «${r.selector}»; este valor viene de un token`);
      if (/^(transition|animation)$/.test(d.prop) && /(^|\s)\d*\.?\d+m?s\b/.test(v.replace(/var\([^)]*\)/g, ''))) hallazgo('A06', archivo, d.linea, `duración literal en «${r.selector}» { ${d.prop} }; se usa var(--dur-*)`);
      if (d.prop === 'line-height' && /^\d*\.?\d+$/.test(v.trim()) && v.trim() !== '0' && v.trim() !== '1') hallazgo('A06', archivo, d.linea, `interlineado literal «${v}» en «${r.selector}»; se usa var(--interlineado-*)`);
    }
  }

  /* A11 · @media/@supports: condiciones admitidas y sólo lo que cambia. */
  const bases = new Map();
  for (const r of todas) if (!r.contexto.length) for (const s of r.selectores) { if (!bases.has(s)) bases.set(s, r); }
  function revisaBloques(nodos) {
    for (const nodo of nodos) {
      if (nodo.tipo !== 'bloque-arroba') continue;
      if (nodo.nombre === '@media') {
        const cond = nodo.cabecera.replace(/^@media\s*/, '').trim();
        const piezas = cond.split(/\s+and\s+/).map(p => p.trim());
        for (const p of piezas) {
          const mw = p.match(/^\((min|max)-width:\s*([\d.]+px)\)$/);
          const ok = (mw && CFG.puntosDeCorte.includes(mw[2]) && !(CFG.soloMinWidth && mw[1] === 'max')) || CFG.condicionesMediaPermitidas.includes(p);
          if (!ok) hallazgo('A11', archivo, nodo.linea, `@media «${p}» no está declarada; los puntos de corte son ${CFG.puntosDeCorte.join(', ')}${CFG.soloMinWidth ? ', solo con min-width (GEO-21)' : ''}, y las condiciones admitidas están en la configuración`);
        }
      }
      for (const h of nodo.hijos) {
        if (h.tipo === 'regla') for (const s of h.selectores) {
          const base = bases.get(s);
          if (!base) continue;
          for (const d of h.decl) {
            const b = base.decl.find(x => x.prop === d.prop);
            if (b && b.valor.replace(/\s+/g, ' ') === d.valor.replace(/\s+/g, ' ') && !d.prop.startsWith('--'))
              hallazgo('A11', archivo, d.linea, `«${s}» repite dentro de ${nodo.cabecera} la declaración «${d.prop}: ${d.valor}» que ya hace su regla base; una adaptación sólo redeclara lo que cambia`);
          }
        }
      }
      revisaBloques(nodo.hijos);
    }
  }
  revisaBloques(arbol);

  /* A19 · :hover solo dentro de @media (hover: hover) (GEO-25): en el
     teléfono un toque deja pegado el estado. */
  for (const r of todas) for (const s of r.selectores)
    if (/:hover\b/.test(s) && !r.contexto.some(c => /\(hover:\s*hover\)/.test(c)))
      hallazgo('A19', archivo, r.linea, `«${s}» usa :hover fuera de @media (hover: hover)`);

  /* A18 · un bloque [data-tema] solo declara los tokens de tema (GEO-70). */
  for (const r of todas) for (const s of r.selectores) if (/\[data-tema/.test(s))
    for (const d of r.decl) if (!(CFG.tokensDeTema || []).includes(d.prop))
      hallazgo('A18', archivo, d.linea, `«${s}» declara ${d.prop}; un tema solo cambia ${(CFG.tokensDeTema || []).join(', ')}`);

  /* A13 · orden fijo de bloques. */
  const marcas = [];
  for (const c of comentarios) { const m = c.texto.match(/@bloque\s+([a-záéíóú]+)/i); if (m) marcas.push({ nombre: m[1].toLowerCase(), linea: c.linea }); }
  return { arbol, comentarios, todas, marcas, fuentes };
}

/* ---------- Ejecución ---------- */

const args = process.argv.slice(2);
const salidaJson = args.includes('--json');
const rutas = args.filter(a => !a.startsWith('--'));
const modoPaquete = rutas.length === 0;
const hojas = (modoPaquete ? CFG.hojas : rutas).map(h => resolve(modoPaquete ? RAIZ : process.cwd(), h)).filter(h => {
  if (existsSync(h)) return true;
  hallazgo('A00', relative(RAIZ, h), 0, 'la hoja declarada no existe'); return false;
});

const analisisPorHoja = [];
for (const h of hojas) {
  const nombre = relative(RAIZ, h);
  const a = auditaHoja(nombre, readFileSync(h, 'utf8'));
  if (a) analisisPorHoja.push({ nombre, ...a });
}

if (modoPaquete) {
  /* A13 · el orden de bloques se verifica a lo largo de todo el paquete. */
  const orden = CFG.bloques;
  let ultimo = -1, ultimaHoja = '';
  for (const a of analisisPorHoja) {
    /* Una hoja independiente (la de la guía visual) no es parte del paquete
       que se copia: su orden de bloques se verifica sola. */
    if ((CFG.hojasIndependientes || []).includes(a.nombre)) { ultimo = -1; ultimaHoja = ''; }
    if (!a.marcas.length) { hallazgo('A13', a.nombre, 1, 'la hoja no declara ningún bloque (/* @bloque nombre */)'); continue; }
    for (const m of a.marcas) {
      const idx = orden.indexOf(m.nombre);
      if (idx < 0) { hallazgo('A13', a.nombre, m.linea, `bloque «${m.nombre}» desconocido; los admitidos son ${orden.join(' → ')}`); continue; }
      if (idx < ultimo) hallazgo('A13', a.nombre, m.linea, `el bloque «${m.nombre}» va después de «${orden[ultimo]}» (${ultimaHoja}); el orden fijo es ${orden.join(' → ')}`);
      ultimo = Math.max(ultimo, idx); ultimaHoja = a.nombre;
    }
    /* Cada regla pertenece al bloque en curso: las adaptaciones sólo en su bloque; :root sólo en variables. */
    const marcas = a.marcas;
    const bloqueDe = (linea) => { let b = null; for (const m of marcas) if (m.linea <= linea) b = m.nombre; return b; };
    const recorre = (nodos) => { for (const nodo of nodos) {
      if (nodo.tipo === 'bloque-arroba' && /^@(media|supports)$/.test(nodo.nombre) && bloqueDe(nodo.linea) !== 'adaptaciones')
        hallazgo('A13', a.nombre, nodo.linea, `${nodo.cabecera} está en el bloque «${bloqueDe(nodo.linea)}»; las adaptaciones van juntas al final, en «adaptaciones»`);
      if (nodo.tipo === 'regla' && nodo.selectores.includes(':root') && bloqueDe(nodo.linea) !== 'variables' && bloqueDe(nodo.linea) !== 'adaptaciones')
        hallazgo('A13', a.nombre, nodo.linea, ':root fuera del bloque «variables»');
    } };
    recorre(a.arbol);
    for (const nodo of a.arbol) if (nodo.tipo === 'regla' && !a.marcas.some(m => m.linea <= nodo.linea)) hallazgo('A13', a.nombre, nodo.linea, 'regla antes del primer @bloque');
  }

  /* Variables: dónde se definen y si se usan. Las hojas de referencia
     (formularios) solo aportan definiciones: no se auditan ni se exige que
     este paquete use todas sus variables. */
  const definidas = new Map(); // nombre → {archivo, linea}
  const deReferencia = new Set();
  for (const ref of CFG.hojasDeReferencia || []) {
    const ruta = resolve(RAIZ, ref);
    if (!existsSync(ruta)) { hallazgo('A00', ref, 0, 'la hoja de referencia no existe'); continue; }
    for (const m of readFileSync(ruta, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/(--[\w-]+)\s*:/g)) deReferencia.add(m[1]);
  }
  const usadasCss = new Set();
  for (const a of analisisPorHoja) {
    for (const r of a.todas) for (const d of r.decl) {
      if (d.prop.startsWith('--')) {
        if (!esHojaDeTokens(a.nombre)) hallazgo('A15', a.nombre, d.linea, `la variable ${d.prop} se define fuera de las hojas de tokens (${CFG.hojasDeTokens.join(', ')})`);
        else if (deReferencia.has(d.prop) && r.selectores.includes(':root')) hallazgo('A15', a.nombre, d.linea, `la variable ${d.prop} ya la define formularios; no se redefine (se toma de ahí)`);
        else if (!definidas.has(d.prop) && !deReferencia.has(d.prop)) definidas.set(d.prop, { archivo: a.nombre, linea: d.linea });
      }
      for (const m of d.valor.matchAll(/var\(\s*(--[\w-]+)/g)) usadasCss.add(m[1]);
    }
  }
  for (const a of analisisPorHoja) for (const r of a.todas) for (const d of r.decl) for (const m of d.valor.matchAll(/var\(\s*(--[\w-]+)/g))
    if (!definidas.has(m[1]) && !deReferencia.has(m[1])) hallazgo('A15', a.nombre, d.linea, `se usa ${m[1]} y no está definida en ninguna hoja de tokens`);

  const textoUso = CFG.buscarUso.filter(f => existsSync(resolve(RAIZ, f))).map(f => ({ f, t: readFileSync(resolve(RAIZ, f), 'utf8') }));
  const usadasEnJs = (nombre) => textoUso.some(x => x.t.includes(nombre));
  for (const [nombre, d] of definidas) {
    if (usadasCss.has(nombre)) continue;
    if (usadasEnJs(nombre)) continue;
    if (CFG.tokensLeidosPorJs[nombre]) continue;
    hallazgo('A16', d.archivo, d.linea, `la variable ${nombre} no la usa ninguna regla ni ningún script: código sin uso`);
  }

  /* A09 · clases declaradas y no usadas. */
  const declaradas = new Map();
  for (const a of analisisPorHoja) for (const r of a.todas) for (const s of r.selectores)
    for (const m of s.matchAll(/\.([A-Za-z_][\w-]*)/g)) if (!declaradas.has(m[1])) declaradas.set(m[1], { archivo: a.nombre, linea: r.linea });
  for (const [cl, d] of declaradas) {
    if (CFG.clasesDinamicas.some(x => x.clase === cl)) continue;
    const re = new RegExp(`(?<![\\w-])${cl.replace(/[-]/g, '\\-')}(?![\\w-])`);
    if (!textoUso.some(x => re.test(x.t))) hallazgo('A09', d.archivo, d.linea, `la clase .${cl} se declara y ningún HTML ni script la nombra`);
  }

  /* A14 · estilos en línea repetidos y manejadores en línea. */
  const enLinea = new Map();
  for (const x of textoUso) {
    const lineas = x.t.split('\n');
    lineas.forEach((ln, idx) => {
      for (const m of ln.matchAll(/\sstyle\s*=\s*(["'])(.*?)\1/g)) {
        const k = m[2].replace(/\s+/g, '').toLowerCase();
        if (RE_HEX.test(m[2]) || RE_FUNC_COLOR.test(m[2])) hallazgo('A04', x.f, idx + 1, 'color literal en un atributo style; los colores viven en :root');
        const lista = enLinea.get(k) || []; lista.push(`${x.f}:${idx + 1}`); enLinea.set(k, lista);
      }
      if (/\son(click|change|input|blur|focus|submit|keydown|keyup|keypress|mousedown|mouseup|load|dblclick|touchstart)\s*=/i.test(ln) && !/^\s*(\/\/|\*|\/\*)/.test(ln))
        hallazgo('A14', x.f, idx + 1, 'manejador en línea (onclick=, onchange=…); los eventos se enlazan desde un archivo .js (GEO-06)');
      if (/href\s*=\s*["']javascript:/i.test(ln)) hallazgo('A14', x.f, idx + 1, 'enlace javascript:; es un botón');
    });
  }
  for (const [k, ubic] of enLinea) if (ubic.length > 1) hallazgo('A14', ubic[0].split(':')[0], Number(ubic[0].split(':')[1]), `el mismo estilo en línea «${k.slice(0, 50)}» aparece ${ubic.length} veces (${ubic.join(', ')}); a la segunda ocurrencia se convierte en clase`);
}

/* ---------- Informe ---------- */
const errores = hallazgos.filter(h => h.gravedad === 'error');
if (salidaJson) {
  console.log(JSON.stringify({ hojas: hojas.map(h => relative(RAIZ, h)), hallazgos }, null, 2));
} else {
  const porId = {};
  for (const h of hallazgos) (porId[h.id] ||= []).push(h);
  console.log(`Auditor de CSS · ${hojas.length} hoja(s): ${hojas.map(h => relative(RAIZ, h)).join(', ')}`);
  for (const id of Object.keys(porId).sort()) {
    console.log(`\n${id} · ${porId[id].length} hallazgo(s)`);
    for (const h of porId[id].slice(0, 60)) console.log(`  ${h.archivo}:${h.linea}  ${h.msg}`);
    if (porId[id].length > 60) console.log(`  … y ${porId[id].length - 60} más`);
  }
  console.log(`\n${errores.length ? 'FALLA' : 'CORRECTO'} · ${errores.length} hallazgo(s) de error`);
}
process.exit(errores.length ? 1 : 0);
