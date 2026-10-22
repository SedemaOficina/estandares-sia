#!/usr/bin/env node
/* =========================================================
   construir.mjs · Construcción del paquete

   A partir de los MISMOS archivos fuente genera lo derivado, para que nada
   se declare dos veces:
     1. codigo/js/iconos.js       ← codigo/iconos/sprite.svg
     2. codigo/manifiesto.json    ← tamaños reales de cada módulo
        guia-visual/manifiesto.js  ← el mismo manifiesto como variable global,
        para que la guía lo lea abierta desde un archivo local (sin fetch)
     3. dist/formkit.css y dist/formkit.js  ← núcleo + todos los módulos
        («todo en uno», para quien prefiere un solo archivo)
        dist/plantillas/<plantilla>/formkit.css y .js ← lo que carga cada
        plantilla, junto (juntar.mjs): su versión de producción
        codigo/servidor/esquemas/*.json ← esquema de cada plantilla
     4. guia-visual/artefacto.html ← guía visual autocontenida (--artefacto):
        CSS, JS, iconos, catálogos y tipografías incrustados, sin recursos
        externos, para publicarla como artefacto
     5. ../estandar-formularios-vX.zip (--zip)

   Antes de construir revisa que cada carpeta de codigo/modulos sea un módulo
   del manifiesto y lleve sólo su CSS y su JS: lo que sobre detiene todo.

   Uso: node herramientas/construir.mjs [--artefacto] [--zip] [--todo]
        node herramientas/construir.mjs --comprobar   (no escribe nada: sale con 1
        y dice qué derivado está atrasado, artefacto incluido; así lo usa verificar)
   ========================================================= */
import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync, existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, dirname, relative, basename, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { junta } from './juntar.mjs';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const todo = args.includes('--todo');
const COMPROBAR = args.includes('--comprobar');
const atrasados = [];
/* Lo incrustado lleva saltos de línea LF (RODEO-07: Leaflet trae CRLF) y rutas con «/»:
   el artefacto sale igual byte a byte en Windows y en Linux. */
const lee = (r) => readFileSync(resolve(RAIZ, r), 'utf8').replace(/\r\n/g, '\n');
const rel = (r) => relative(RAIZ, r).split(sep).join('/');
/* Sólo escribe lo que cambió: una construcción sin cambios no toca ningún archivo.
   Con --comprobar no escribe nunca: anota lo atrasado. */
const escribe = (r, t) => {
  const ruta = resolve(RAIZ, r);
  const igual = existsSync(ruta) && readFileSync(ruta, 'utf8') === t;
  if (!igual && COMPROBAR) atrasados.push(r);
  else if (!igual) { mkdirSync(dirname(ruta), { recursive: true }); writeFileSync(ruta, t); }
  console.log(`· ${r} (${(Buffer.byteLength(t) / 1024).toFixed(1)} KB)${igual ? ' · sin cambios' : COMPROBAR ? ' · ATRASADO' : ''}`);
};
const manifiesto = JSON.parse(lee('codigo/manifiesto.json'));
const manifiestoAnterior = JSON.parse(lee('codigo/manifiesto.json'));

/* 0. Cada carpeta de codigo/modulos es un módulo del manifiesto, con sólo sus archivos. */
{
  const declarados = new Map(manifiesto.modulos.map((m) => [m.nombre, [m.css === false ? null : `${m.nombre}.css`, m.js ? `${m.nombre}.js` : null].filter(Boolean)]));
  for (const d of readdirSync(resolve(RAIZ, 'codigo/modulos'))) {
    const ruta = resolve(RAIZ, 'codigo/modulos', d);
    if (!statSync(ruta).isDirectory()) throw new Error(`construir: codigo/modulos/${d} es un archivo suelto; cada módulo va en su carpeta`);
    if (!declarados.has(d)) throw new Error(`construir: la carpeta codigo/modulos/${d}/ no está en codigo/manifiesto.json`);
    const sobra = readdirSync(ruta).filter((f) => !declarados.get(d).includes(f));
    if (sobra.length) throw new Error(`construir: codigo/modulos/${d}/ tiene archivos que el manifiesto no declara: ${sobra.join(', ')}`);
  }
}

/* 1. Sprite → iconos.js */
const sprite = lee('codigo/iconos/sprite.svg').replace(/<!--[\s\S]*?-->/g, '').replace(/\s+/g, ' ').trim();
const ids = [...sprite.matchAll(/id="(i-[\w-]+)"/g)].map((m) => m[1]);
escribe('codigo/js/iconos.js', `/* GENERADO por herramientas/construir.mjs desde codigo/iconos/sprite.svg. No se edita a mano.\n   Catálogo cerrado de ${ids.length} iconos: ${ids.join(', ')}.\n   formkit.core.js lo inyecta una vez por página. */\nwindow.FORMKIT_ICONOS = ${JSON.stringify(sprite)};\n`);

/* 2. Tamaños en el manifiesto */
const peso = (r) => (existsSync(resolve(RAIZ, r)) ? statSync(resolve(RAIZ, r)).size : 0);
for (const m of manifiesto.modulos) {
  m.archivos = { css: m.css === false ? null : `codigo/modulos/${m.nombre}/${m.nombre}.css`, js: m.js ? `codigo/modulos/${m.nombre}/${m.nombre}.js` : null };
  for (const a of Object.values(m.archivos)) if (a && !existsSync(resolve(RAIZ, a))) throw new Error(`construir: falta ${a}`);
  m.tamano = { css: m.archivos.css ? peso(m.archivos.css) : 0, js: m.archivos.js ? peso(m.archivos.js) : 0 };
  for (const d of m.dependencias) if (!manifiesto.modulos.some((x) => x.nombre === d)) throw new Error(`construir: «${m.nombre}» depende de «${d}», que no existe`);
}
manifiesto.nucleo.tamano = Object.fromEntries(manifiesto.nucleo.archivos.map((a) => [basename(a), peso(a)]));
/* La fecha de generación cambia sólo cuando cambia algo más del manifiesto. */
const sinFecha = (m) => JSON.stringify({ ...m, generado: undefined });
manifiesto.generado = manifiestoAnterior.generado && sinFecha(manifiesto) === sinFecha(manifiestoAnterior) ? manifiestoAnterior.generado : new Date().toISOString();
escribe('codigo/manifiesto.json', JSON.stringify(manifiesto, null, 2) + '\n');
escribe('guia-visual/manifiesto.js', `/* GENERADO por herramientas/construir.mjs desde codigo/manifiesto.json. No se edita a mano. */\nwindow.GUIA_MANIFIESTO = ${JSON.stringify(manifiesto)};\n`);

/* 2b. Catálogo de componentes en markdown, desde el manifiesto */
{
  const peso = (b) => (b < 1024 ? `${b} B` : `${(b / 1024).toFixed(1)} KB`);
  const L = [
    '# 04 · Catálogo de componentes',
    '',
    '> Este documento se **genera** de `codigo/manifiesto.json` (`node herramientas/construir.mjs`). No se edita a mano: se corrige el manifiesto y se vuelve a construir. La versión interactiva, con muestras vivas y HTML para copiar, es `guia-visual/index.html`.',
    '',
    `El paquete tiene un **núcleo** obligatorio y **${manifiesto.modulos.length} módulos** que se copian sólo si el formulario los usa. Niveles: **BASE** obligatorio en todo formulario; **RECOMENDADO** salvo justificación escrita; **OPCIONAL** si el formulario necesita la pieza. Quien programa elige los módulos, no el nivel.`,
    '',
    '## Núcleo (BASE)',
    '',
    `Archivos, en este orden: ${manifiesto.nucleo.archivos.map((x) => `\`${x}\``).join(', ')}. Orden de carga: ${manifiesto.nucleo.orden}.`,
    '',
    '| Pieza | Nivel |', '|---|---|',
    ...manifiesto.nucleo.incluye.map((x) => `| ${x.pieza} | ${x.nivel} |`),
    '',
    '## Módulos',
    '',
    '| Módulo | Título | Nivel | Tipo | Depende de | CSS | JS |', '|---|---|---|---|---|---|---|',
    ...manifiesto.modulos.map((m) => `| \`${m.nombre}\` | ${m.titulo} | ${m.nivel} | ${m.tipo} | ${m.dependencias.length ? m.dependencias.join(', ') : '—'} | ${m.archivos.css ? peso(m.tamano.css) : '—'} | ${m.archivos.js ? peso(m.tamano.js) : '—'} |`),
    ''
  ];
  for (const m of manifiesto.modulos) {
    L.push(`### ${m.titulo} (\`${m.nombre}\`) · ${m.nivel}`, '', m.proposito, '', `**Cuándo.** ${m.cuando}`, '', `**Cuándo no.** ${m.cuandoNo}`, '', `**Depende de.** ${m.dependencias.length ? m.dependencias.join(', ') : 'sólo del núcleo'} · **Archivos.** ${[m.archivos.css, m.archivos.js].filter(Boolean).map((x) => `\`${x}\``).join(', ')}`, '', `**Accesibilidad.** ${m.accesibilidad}`, '', `**En teléfono.** ${m.movil}`, '', `**En escritorio.** ${m.escritorio}`, '', '**Errores frecuentes que evita.**', ...m.errores.map((e) => `- ${e}`), '');
  }
  escribe('docs/04-catalogo-de-componentes.md', L.join('\n'));
}

/* 3. Todo en uno */
const cssTodo = ['codigo/css/tokens.css', 'codigo/css/base.css', 'codigo/css/nucleo.css', ...manifiesto.modulos.filter((m) => m.archivos.css).map((m) => m.archivos.css)]
  .map((r) => `/* ===== ${r} ===== */\n${lee(r).replace(/url\('\.\.\/fuentes\//g, "url('../codigo/fuentes/")}`).join('\n\n');
escribe('dist/formkit.css', `/* GENERADO: núcleo + todos los módulos. Para copiar sólo lo que se usa, toma los archivos de codigo/. */\n${cssTodo}`);
const jsTodo = ['codigo/js/validaciones.config.js', 'codigo/js/iconos.js', 'codigo/js/formkit.core.js', ...manifiesto.modulos.filter((m) => m.archivos.js).map((m) => m.archivos.js)]
  .map((r) => `/* ===== ${r} ===== */\n${lee(r)}`).join('\n\n');
escribe('dist/formkit.js', `/* GENERADO: configuración + iconos + núcleo + todos los módulos. */\n${jsTodo}`);

/* 3a. Cada plantilla en producción: sólo las hojas y los guiones del estándar que carga, juntos
   (juntar.mjs). Son los que mide el presupuesto de peso y velocidad (presupuesto.mjs, docs/08). */
for (const f of readdirSync(resolve(RAIZ, 'codigo/plantillas')).filter((x) => x.endsWith('.html'))) {
  const nombre = f.replace(/\.html$/, '');
  const r = junta(resolve(RAIZ, 'codigo/plantillas', f), resolve(RAIZ, 'dist/plantillas', nombre));
  escribe(`dist/plantillas/${nombre}/formkit.css`, r.css);
  escribe(`dist/plantillas/${nombre}/formkit.js`, r.js);
}

/* 3b. Esquemas de las plantillas para la validación en el servidor */
for (const f of readdirSync(resolve(RAIZ, 'codigo/plantillas')).filter((x) => x.endsWith('.html'))) {
  const salida = `codigo/servidor/esquemas/${f.replace(/\.html$/, '.json')}`;
  mkdirSync(resolve(RAIZ, 'codigo/servidor/esquemas'), { recursive: true });
  const r = spawnSync(process.execPath, [resolve(RAIZ, 'herramientas/esquema-desde-html.mjs'), resolve(RAIZ, 'codigo/plantillas', f), resolve(RAIZ, salida), ...(COMPROBAR ? ['--comprobar'] : [])], { encoding: 'utf8' });
  if (r.status !== 0 && !COMPROBAR) throw new Error(`construir: el esquema de ${f} no se pudo generar:\n${r.stdout}${r.stderr}`);
  if (r.status !== 0) atrasados.push(salida);
  console.log(`· ${salida} (${(peso(salida) / 1024).toFixed(1)} KB)${/sin cambios/.test(r.stdout) ? ' · sin cambios' : COMPROBAR ? ' · ATRASADO' : ''}`);
}

/* 4. Artefacto autocontenido de la guía visual (con --comprobar se arma siempre, para compararlo) */
if (todo || args.includes('--artefacto') || COMPROBAR) {
  const html = lee('guia-visual/index.html');
  const b64 = (r, tipo) => `data:${tipo};base64,${readFileSync(resolve(RAIZ, r)).toString('base64')}`;
  /* Tipografías: sólo los pesos declarados en tokens.css. */
  const fuentes = {};
  for (const f of readdirSync(resolve(RAIZ, 'codigo/fuentes')).filter((x) => x.endsWith('.woff2'))) fuentes[f] = b64(`codigo/fuentes/${f}`, 'font/woff2');
  const incrustaCss = (css) => css.replace(/url\('[^']*fuentes\/([\w-]+\.woff2)'\)/g, (m, f) => `url('${fuentes[f] || ''}')`);
  let salida = html;
  /* Hojas: cada <link rel="stylesheet"> local se vuelve <style>. */
  salida = salida.replace(/<link rel="stylesheet" href="([^"]+)">/g, (m, href) => {
    const r = resolve(RAIZ, 'guia-visual', href);
    if (!existsSync(r)) return m;
    return `<style data-origen="${rel(r)}">\n${incrustaCss(lee(r))}\n</style>`;
  });
  /* Guiones locales se incrustan; los iframes de las plantillas llevan su documento en srcdoc. */
  salida = salida.replace(/<script src="([^"]+)"><\/script>/g, (m, src) => {
    const r = resolve(RAIZ, 'guia-visual', src);
    if (!existsSync(r)) return m;
    return `<script data-origen="${rel(r)}">\n${lee(r).replace(/<\/script>/g, '<\\/script>')}\n</script>`;
  });
  /* Tanto los iframes con src como los diferidos (data-src) llevan su documento completo en srcdoc. */
  salida = salida.replace(/<iframe([^>]*) (?:data-)?src="([^"]+)"([^>]*)><\/iframe>/g, (m, a, src, b) => {
    const r = resolve(RAIZ, 'guia-visual', src.split('?')[0]);
    if (!existsSync(r)) return m;
    const doc = incrustaDocumento(r);
    return `<iframe${a} data-src="${src}" data-incrustado srcdoc="${doc.replace(/&/g, '&amp;').replace(/"/g, '&quot;')}"${b}></iframe>`;
  });
  salida = salida.replace(/<img([^>]*) src="([^"]+\.png)"/g, (m, a, src) => { const r = resolve(RAIZ, 'guia-visual', src); return existsSync(r) ? `<img${a} src="${b64(relative(RAIZ, r), 'image/png')}"` : m; });
  /* Los documentos de muestra del visor van dentro: abierta sola, la guía los muestra igual. */
  salida = salida.replace(/data-visor-url="([^"]+\.(pdf|png))"/g, (m, src, ext) => { const r = resolve(RAIZ, 'guia-visual', src); return existsSync(r) ? `data-visor-url="${b64(relative(RAIZ, r), ext === 'pdf' ? 'application/pdf' : 'image/png')}"` : m; });
  salida = salida.replace('<html lang="es-MX"', '<html lang="es-MX" data-artefacto');
  escribe('guia-visual/artefacto.html', salida);

  function incrustaDocumento(ruta) {
    const base = dirname(ruta);
    let d = lee(ruta);
    d = d.replace(/<link rel="stylesheet" href="([^"]+)">/g, (m, href) => { const r = resolve(base, href); return existsSync(r) ? `<style>${incrustaCss(lee(r))}</style>` : m; });
    const enLinea = (r) => `<script>${lee(r).replace(/<\/script>/g, '<\\/script>')}</script>`;
    /* Leaflet va con su complemento de gestos: el módulo mapa lo carga desde la dirección de la
       configuración, que dentro del artefacto no existe; incrustado, el módulo lo encuentra ya cargado. */
    const gestos = resolve(RAIZ, 'vendor/leaflet-gesture-handling/leaflet-gesture-handling.min.js');
    d = d.replace(/<script src="([^"]+)"><\/script>/g, (m, src) => { const r = resolve(base, src); if (!existsSync(r)) return m; return /leaflet\/leaflet\.js$/.test(src) && existsSync(gestos) ? enLinea(r) + enLinea(gestos) : enLinea(r); });
    d = d.replace(/<img([^>]*) src="([^"]+\.png)"/g, (m, a, src) => { const r = resolve(base, src); return existsSync(r) ? `<img${a} src="${b64(relative(RAIZ, r), 'image/png')}"` : m; });
    return d;
  }
}

/* 5. ZIP: sólo lo guardado en Git, en el último commit (git archive, sin depender
   de que el sistema tenga «zip»). Lo que Git ignora o no se ha guardado (llaves, notas
   locales, respaldos) nunca entra. Las fechas son las del commit: dos construcciones del
   mismo commit dan el mismo ZIP. Lleva dentro HUELLAS.sha256 (una huella por archivo) y
   junto a él, <zip>.sha256 con la huella del ZIP. */
if (COMPROBAR) {
  if (atrasados.length) console.log(`\nATRASADO · ${atrasados.length} derivado(s): ${atrasados.join(', ')}. Corre node herramientas/construir.mjs --artefacto y guarda lo que cambie.`);
  else console.log('\nderivados al día');
  process.exit(atrasados.length ? 1 : 0);
}
if (todo || args.includes('--zip')) {
  const git = (...a) => execFileSync('git', a, { cwd: resolve(RAIZ, '..'), encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  const carpeta = basename(RAIZ);
  try { git('rev-parse', '--git-dir'); } catch (e) { throw new Error('El paquete se arma desde lo guardado en Git: esta carpeta no está en un repositorio.'); }
  if (git('status', '--porcelain', '--', carpeta).trim()) console.log(`  Hay cambios sin guardar en ${carpeta}/: el paquete lleva lo del último commit.`);
  const commit = git('rev-parse', 'HEAD').trim();
  const lista = git('ls-tree', '-r', 'HEAD', '--', carpeta).trim().split('\n').map((l) => { const [meta, ruta] = l.split('\t'); return { blob: meta.split(' ')[2], ruta }; });
  const contenido = execFileSync('git', ['cat-file', '--batch'], { cwd: resolve(RAIZ, '..'), input: lista.map((x) => x.blob).join('\n') + '\n', maxBuffer: 256 * 1024 * 1024 });
  const huellas = [];
  let p = 0;
  for (const x of lista) {
    const fin = contenido.indexOf(10, p);
    const tam = Number(contenido.subarray(p, fin).toString('latin1').split(' ')[2]);
    huellas.push(`${createHash('sha256').update(contenido.subarray(fin + 1, fin + 1 + tam)).digest('hex')}  ${x.ruta}`);
    p = fin + 1 + tam + 1;
  }
  const textoHuellas = `# Estándar de formularios del SIA ${manifiesto.version} · commit ${commit}\n# sha256sum -c HUELLAS.sha256 (desde la carpeta que contiene ${carpeta}/)\n${huellas.join('\n')}\n`;
  const nombre = `estandar-formularios-v${manifiesto.version}.zip`;
  const destino = resolve(RAIZ, '..', nombre);
  const temporal = mkdtempSync(resolve(tmpdir(), 'formkit-zip-'));
  writeFileSync(resolve(temporal, 'HUELLAS.sha256'), textoHuellas);
  try { git('archive', '--format=zip', '-o', destino, `--mtime=${git('log', '-1', '--format=%cI').trim()}`, `--prefix=${carpeta}/`, `--add-file=${resolve(temporal, 'HUELLAS.sha256')}`, `HEAD:${carpeta}`); }
  finally { rmSync(temporal, { recursive: true, force: true }); }
  const huella = createHash('sha256').update(readFileSync(destino)).digest('hex');
  writeFileSync(`${destino}.sha256`, `${huella}  ${nombre}\n`);
  console.log(`· ${relative(RAIZ, destino)} (${(statSync(destino).size / 1024 / 1024).toFixed(1)} MB, ${lista.length} archivos) · sha256 ${huella.slice(0, 12)}…`);
}
