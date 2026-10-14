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
        codigo/servidor/esquemas/*.json ← esquema de cada plantilla
     4. guia-visual/artefacto.html ← guía visual autocontenida (--artefacto):
        CSS, JS, iconos, catálogos y tipografías incrustados, sin recursos
        externos, para publicarla como artefacto
     5. ../estandar-formularios-vX.zip (--zip)

   Uso: node herramientas/construir.mjs [--artefacto] [--zip] [--todo]
   ========================================================= */
import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync, existsSync } from 'node:fs';
import { resolve, dirname, relative, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const todo = args.includes('--todo');
const lee = (r) => readFileSync(resolve(RAIZ, r), 'utf8');
/* Sólo escribe lo que cambió: una construcción sin cambios no toca ningún archivo. */
const escribe = (r, t) => {
  const ruta = resolve(RAIZ, r);
  const igual = existsSync(ruta) && readFileSync(ruta, 'utf8') === t;
  if (!igual) { mkdirSync(dirname(ruta), { recursive: true }); writeFileSync(ruta, t); }
  console.log(`· ${r} (${(Buffer.byteLength(t) / 1024).toFixed(1)} KB)${igual ? ' · sin cambios' : ''}`);
};
const manifiesto = JSON.parse(lee('codigo/manifiesto.json'));
const manifiestoAnterior = JSON.parse(lee('codigo/manifiesto.json'));

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

/* 3b. Esquemas de las plantillas para la validación en el servidor */
for (const f of readdirSync(resolve(RAIZ, 'codigo/plantillas')).filter((x) => x.endsWith('.html'))) {
  const salida = `codigo/servidor/esquemas/${f.replace(/\.html$/, '.json')}`;
  mkdirSync(resolve(RAIZ, 'codigo/servidor/esquemas'), { recursive: true });
  const aviso = execSync(`node "${resolve(RAIZ, 'herramientas/esquema-desde-html.mjs')}" "${resolve(RAIZ, 'codigo/plantillas', f)}" "${resolve(RAIZ, salida)}"`, { encoding: 'utf8', stdio: 'pipe' });
  console.log(`· ${salida} (${(peso(salida) / 1024).toFixed(1)} KB)${/sin cambios/.test(aviso) ? ' · sin cambios' : ''}`);
}

/* 4. Artefacto autocontenido de la guía visual */
if (todo || args.includes('--artefacto')) {
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
    return `<style data-origen="${relative(RAIZ, r)}">\n${incrustaCss(readFileSync(r, 'utf8'))}\n</style>`;
  });
  /* Guiones locales se incrustan; los iframes de las plantillas llevan su documento en srcdoc. */
  salida = salida.replace(/<script src="([^"]+)"><\/script>/g, (m, src) => {
    const r = resolve(RAIZ, 'guia-visual', src);
    if (!existsSync(r)) return m;
    return `<script data-origen="${relative(RAIZ, r)}">\n${readFileSync(r, 'utf8').replace(/<\/script>/g, '<\\/script>')}\n</script>`;
  });
  /* Tanto los iframes con src como los diferidos (data-src) llevan su documento completo en srcdoc. */
  salida = salida.replace(/<iframe([^>]*) (?:data-)?src="([^"]+)"([^>]*)><\/iframe>/g, (m, a, src, b) => {
    const r = resolve(RAIZ, 'guia-visual', src.split('?')[0]);
    if (!existsSync(r)) return m;
    const doc = incrustaDocumento(r);
    return `<iframe${a} data-src="${src}" data-incrustado srcdoc="${doc.replace(/&/g, '&amp;').replace(/"/g, '&quot;')}"${b}></iframe>`;
  });
  salida = salida.replace(/<img([^>]*) src="([^"]+\.png)"/g, (m, a, src) => { const r = resolve(RAIZ, 'guia-visual', src); return existsSync(r) ? `<img${a} src="${b64(relative(RAIZ, r), 'image/png')}"` : m; });
  salida = salida.replace('<html lang="es-MX">', '<html lang="es-MX" data-artefacto>');
  escribe('guia-visual/artefacto.html', salida);

  function incrustaDocumento(ruta) {
    const base = dirname(ruta);
    let d = readFileSync(ruta, 'utf8');
    d = d.replace(/<link rel="stylesheet" href="([^"]+)">/g, (m, href) => { const r = resolve(base, href); return existsSync(r) ? `<style>${incrustaCss(readFileSync(r, 'utf8'))}</style>` : m; });
    d = d.replace(/<script src="([^"]+)"><\/script>/g, (m, src) => { const r = resolve(base, src); return existsSync(r) ? `<script>${readFileSync(r, 'utf8').replace(/<\/script>/g, '<\\/script>')}</script>` : m; });
    d = d.replace(/<img([^>]*) src="([^"]+\.png)"/g, (m, a, src) => { const r = resolve(base, src); return existsSync(r) ? `<img${a} src="${b64(relative(RAIZ, r), 'image/png')}"` : m; });
    return d;
  }
}

/* 5. ZIP */
if (todo || args.includes('--zip')) {
  const nombre = `estandar-formularios-v${manifiesto.version}.zip`;
  const destino = resolve(RAIZ, '..', nombre);
  execSync(`cd "${resolve(RAIZ, '..')}" && rm -f "${nombre}" && zip -qr "${nombre}" "${basename(RAIZ)}" -x "${basename(RAIZ)}/node_modules/*" "${basename(RAIZ)}/pruebas/_humo/*" "${basename(RAIZ)}/.git/*"`);
  console.log(`· ${relative(RAIZ, destino)} (${(statSync(destino).size / 1024 / 1024).toFixed(1)} MB)`);
}
