#!/usr/bin/env node
/* =========================================================
   juntar.mjs · Los archivos de una página, juntos, para producción

   En desarrollo una página carga cada hoja y cada guion del estándar por
   separado (para copiar sólo lo que usa). En producción van juntos: una hoja
   y un guion con exactamente lo que la página carga, en su mismo orden. Así
   la plantilla por pasos baja de 43 archivos a 15 y cabe en el presupuesto
   de peso y velocidad (docs/08). No se reescribe el código: se concatena sin
   sus comentarios, y las direcciones relativas de las hojas (tipografías) se
   ajustan a la carpeta de salida. Lo que no es del estándar (la configuración propia, Leaflet,
   el catálogo) se queda como está.

   Uso: node herramientas/juntar.mjs <pagina.html> <carpeta-de-salida>
     Escribe <salida>/formkit.css y <salida>/formkit.js, y dice qué etiquetas
     poner en la página en lugar de las que junta. Las plantillas del paquete
     se juntan en dist/plantillas/ con cada construcción (construir.mjs).
   ========================================================= */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Script } from 'node:vm';

const posix = (r) => r.split(sep).join('/');
/* Hojas y guiones del estándar: los de css/, js/ y modulos/ de la carpeta del estándar. */
const DEL_ESTANDAR = /(?:^|\/)(?:css|js|modulos\/[\w-]+)\/[\w.-]+\.(?:css|js)$/;

/* Devuelve {css, js, quitar} sin escribir nada: quitar son las etiquetas tal como están en la página. */
export function junta(pagina, salida) {
  const html = readFileSync(pagina, 'utf8').replace(/\r\n/g, '\n');
  const sinComentarios = html.replace(/<!--[\s\S]*?-->/g, '');
  const base = dirname(pagina);
  const hojas = [...sinComentarios.matchAll(/<link rel="stylesheet" href="([^"]+)">/g)].filter((m) => DEL_ESTANDAR.test(m[1]) && !/^https?:/.test(m[1]));
  const guiones = [...sinComentarios.matchAll(/<script src="([^"]+)"><\/script>/g)].filter((m) => DEL_ESTANDAR.test(m[1]) && !/^https?:/.test(m[1]) && !/configuracion/.test(m[1]));
  const lee = (href) => readFileSync(resolve(base, href), 'utf8').replace(/\r\n/g, '\n');
  /* Sin comentarios: la explicación vive en los archivos de codigo/ y en producción sólo pesa. En
     JS se quitan sólo los que ocupan renglones enteros (nunca uno junto a código ni dentro de un
     texto), y el resultado se compila antes de escribirlo. */
  const sinComentariosCss = (t) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\n[ \t]*\n+/g, '\n');
  const sinComentariosJs = (t) => t.replace(/^[ \t]*\/\*(?:(?!\*\/)[\s\S])*\*\/[ \t]*\n/gm, '').replace(/^[ \t]*\/\/.*\n/gm, '').replace(/\n[ \t]*\n+/g, '\n');
  /* url('…') relativa a la hoja → relativa a la carpeta de salida. */
  const ajusta = (css, href) => css.replace(/url\((['"]?)([^'")]+)\1\)/g, (m, q, u) => {
    if (/^(data:|https?:|#|\/)/.test(u) || isAbsolute(u)) return m;
    return `url(${q}${posix(relative(salida, resolve(base, dirname(href), u)))}${q})`;
  });
  const css = hojas.map((m) => `/* ${m[1]} */\n${sinComentariosCss(ajusta(lee(m[1]), m[1])).trim()}`).join('\n');
  const js = guiones.map((m) => `/* ${m[1]} */\n${sinComentariosJs(lee(m[1])).trim()}`).join('\n');
  const salidaJs = `/* GENERADO por herramientas/juntar.mjs: los guiones del estándar que carga la página, en su orden y sin comentarios (el código comentado está en codigo/). */\n${js}\n`;
  new Script(salidaJs, { filename: 'formkit.js' });
  return { css: `/* GENERADO por herramientas/juntar.mjs: las hojas del estándar que carga la página, en su orden y sin comentarios (el código comentado está en codigo/). */\n${css}\n`, js: salidaJs, hojas: hojas.map((m) => m[1]), guiones: guiones.map((m) => m[1]) };
}

/* La página en producción: la primera hoja del estándar se vuelve formkit.css y las demás se quitan;
   igual con los guiones y formkit.js. hacia es la ruta de la carpeta de salida vista desde la página. */
export function paginaJunta(html, hacia) {
  let css = false, js = false;
  return html
    .replace(/<link rel="stylesheet" href="([^"]+)">\n?/g, (m, href) => (!DEL_ESTANDAR.test(href) ? m : css ? '' : ((css = true), `<link rel="stylesheet" href="${hacia}formkit.css">\n`)))
    .replace(/<script src="([^"]+)"><\/script>\n?/g, (m, src) => (!DEL_ESTANDAR.test(src) || /configuracion/.test(src) ? m : js ? '' : ((js = true), `<script src="${hacia}formkit.js"></script>\n`)));
}

const esPrincipal = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (esPrincipal) {
  const [pagina, salida] = process.argv.slice(2).map((a) => a && resolve(a));
  if (!pagina || !salida) { console.error('Uso: node herramientas/juntar.mjs <pagina.html> <carpeta-de-salida>'); process.exit(2); }
  const r = junta(pagina, salida);
  mkdirSync(salida, { recursive: true });
  writeFileSync(resolve(salida, 'formkit.css'), r.css);
  writeFileSync(resolve(salida, 'formkit.js'), r.js);
  const hacia = `${posix(relative(dirname(pagina), salida)) || '.'}/`;
  console.log(`${r.hojas.length} hojas → ${posix(relative(process.cwd(), resolve(salida, 'formkit.css')))}; ${r.guiones.length} guiones → ${posix(relative(process.cwd(), resolve(salida, 'formkit.js')))}`);
  console.log('En la página, en lugar de esas hojas y esos guiones (la configuración propia, Leaflet y el catálogo se quedan):');
  console.log(`  <link rel="stylesheet" href="${hacia}formkit.css">   (donde estaba la primera hoja)`);
  console.log(`  <script src="${hacia}formkit.js"></script>   (donde estaba el primer guion del estándar, después de tu configuración)`);
}
