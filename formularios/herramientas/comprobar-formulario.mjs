#!/usr/bin/env node
/* =========================================================
   comprobar-formulario.mjs · Comprueba el formulario de un proyecto

   npm run verificar comprueba las páginas del paquete; esta orden comprueba
   la página de un proyecto que copió el estándar, con las mismas medidas:
     1. consola sin errores ni avisos, ninguna petición fallida (404) y
        ninguna a otro servidor (salvo las que se permitan: el mapa base);
     2. sin desplazamiento horizontal a 320, 390, 768 y 1280 px;
     3. axe-core sin violaciones (WCAG 2.2 AA y buenas prácticas) en teléfono
        y en escritorio;
     4. objetivos táctiles de 44 px (FRM-62);
     5. sin guiones, estilos ni manejadores escritos en la página (política
        de seguridad estricta);
     6. enviar vacío muestra el resumen de errores y le pasa el foco;
     7. los catálogos que carga la página: filas completas y código postal
        de 5 dígitos; si es de ejemplo (es_ficticio), se dice;
     8. auditar-campos.mjs sobre el mismo archivo.

   Necesita lo que instala npm install en esta carpeta (Playwright y axe).
   Uso: node herramientas/comprobar-formulario.mjs <pagina.html | http://…> [--raiz carpeta]
            [--permitir servidor.de.teselas,otro] [--capturas carpeta]
     --raiz       carpeta que se sirve (por omisión, la de la página); úsala si la
                  página pide archivos de una carpeta de arriba (../formkit/…)
     --permitir   servidores externos admitidos (sólo el nombre: tile.ejemplo.mx)
     --capturas   guarda una captura de cada ancho
   Sale con 1 si algo falla.
   ========================================================= */
import { createServer } from 'node:http';
import { existsSync, mkdirSync, readFileSync, statSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { basename, dirname, extname, join, normalize, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { abreNavegador, objetivosPequenos } from '../pruebas/ayudas.mjs';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const opcion = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : null; };
const destino = args.find((a, i) => !a.startsWith('--') && !['--raiz', '--permitir', '--capturas'].includes(args[i - 1]));
if (!destino) { console.error('Uso: node herramientas/comprobar-formulario.mjs <pagina.html | http://…> [--raiz carpeta] [--permitir servidor,…] [--capturas carpeta]'); process.exit(2); }
const permitidos = new Set((opcion('--permitir') || '').split(',').map((s) => s.trim()).filter(Boolean));
const capturas = opcion('--capturas') ? resolve(opcion('--capturas')) : null;
if (capturas) mkdirSync(capturas, { recursive: true });

const fallas = [];
const avisos = [];
const bien = (t) => console.log(`✓ ${t}`);
const mal = (t) => { fallas.push(t); console.log(`✗ ${t}`); };

/* La página: una dirección, o un archivo que se sirve por HTTP desde su carpeta (o --raiz). */
let url = destino;
let servidor = null;
const esArchivo = !/^https?:\/\//.test(destino);
if (esArchivo) {
  const pagina = resolve(destino);
  if (!existsSync(pagina)) { console.error(`No existe ${pagina}`); process.exit(2); }
  const base = resolve(opcion('--raiz') || dirname(pagina));
  if (!pagina.startsWith(base + sep)) { console.error(`La página no está dentro de --raiz (${base})`); process.exit(2); }
  const TIPOS = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.pdf': 'application/pdf', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.pfb': 'application/octet-stream', '.txt': 'text/plain; charset=utf-8' };
  servidor = createServer((pet, res) => {
    let ruta;
    try { ruta = decodeURIComponent(new URL(pet.url, 'http://x').pathname); } catch { res.writeHead(400); res.end(); return; }
    let archivo = normalize(join(base, ruta));
    if (archivo !== base && !archivo.startsWith(base + sep)) { res.writeHead(403); res.end(); return; }
    try { if (statSync(archivo).isDirectory()) archivo = join(archivo, 'index.html'); res.writeHead(200, { 'Content-Type': TIPOS[extname(archivo).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store' }); res.end(readFileSync(archivo)); } catch { res.writeHead(404); res.end(); }
  });
  await new Promise((ok) => servidor.listen(0, '127.0.0.1', ok));
  url = `http://127.0.0.1:${servidor.address().port}/${relative(base, pagina).split(sep).join('/')}`;
}
const anfitrion = new URL(url).host;
console.log(`Comprobando ${destino}${esArchivo ? ` (servida en ${url})` : ''}\n`);

const navegador = await abreNavegador();
const consola = new Set();
const fallidas = new Set();
const externas = new Set();
async function abre(ancho, alto = 900, movil = ancho < 760) {
  const contexto = await navegador.newContext({ viewport: { width: ancho, height: alto }, locale: 'es-MX', hasTouch: movil, isMobile: movil });
  const p = await contexto.newPage();
  p.on('console', (m) => { if (['error', 'warning'].includes(m.type())) consola.add(`${m.type()}: ${m.text()}`); });
  p.on('pageerror', (e) => consola.add(`error en la página: ${e.message}`));
  p.on('requestfailed', (r) => fallidas.add(`${r.url()} (${r.failure()?.errorText})`));
  p.on('response', (r) => { if (r.status() >= 400) fallidas.add(`${r.status()} ${r.url()}`); });
  p.on('request', (r) => { const u = new URL(r.url()); if (/^https?:$/.test(u.protocol) && u.host !== anfitrion && !permitidos.has(u.hostname)) externas.add(r.url()); });
  await p.goto(url);
  await p.waitForFunction(() => window.FormKit && document.querySelector('form'), null, { timeout: 10000 }).catch(() => {});
  await p.waitForTimeout(300);
  return p;
}

try {
  /* 1, 2 y 4 · Anchos, objetivos y lo que pasa en la consola y en la red. */
  const desbordes = [];
  const pequenos = new Set();
  for (const ancho of [320, 390, 768, 1280]) {
    const p = await abre(ancho);
    if (!(await p.evaluate(() => !!window.FormKit))) mal(`a ${ancho} px no cargó el estándar (FormKit no existe): revisa las rutas de los <script>`);
    const d = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    if (d > 0) desbordes.push(`${ancho} px (${d} px de más)`);
    for (const o of await objetivosPequenos(p)) pequenos.add(o);
    if (capturas) await p.screenshot({ path: join(capturas, `${basename(destino).replace(/\.html?$/, '')}-${ancho}.png`), fullPage: true });
    await p.context().close();
  }
  if (desbordes.length) mal(`la página se desborda a lo ancho en ${desbordes.join(', ')}`); else bien('sin desplazamiento horizontal a 320, 390, 768 y 1280 px');
  if (pequenos.size) mal(`objetivos de menos de 44 px (FRM-62): ${[...pequenos].slice(0, 10).join('; ')}${pequenos.size > 10 ? ' …' : ''}`); else bien('todo lo que se toca mide 44 px o más');

  /* 3 · axe-core en teléfono y en escritorio. */
  const AXE = readFileSync(resolve(RAIZ, 'vendor/axe-core/axe.min.js'), 'utf8');
  for (const ancho of [390, 1280]) {
    const p = await abre(ancho);
    await p.addScriptTag({ content: AXE });
    const v = await p.evaluate(async () => (await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] } })).violations.map((x) => `${x.id} (${x.nodes.length}): ${x.help}`));
    if (v.length) mal(`axe-core a ${ancho} px: ${v.join('; ')}`); else bien(`axe-core sin violaciones a ${ancho} px`);
    await p.context().close();
  }

  /* 5 · Política de seguridad estricta: nada escrito dentro del HTML. Se lee el archivo tal como
     llega (lo que el código pone después con element.style sí lo admite la política). */
  const fuente = (await (await fetch(url)).text()).replace(/<!--[\s\S]*?-->/g, '');
  const enLinea = [
    ...[...fuente.matchAll(/<script\b(?![^>]*\ssrc=)(?![^>]*type="application\/(?:ld\+)?json")[^>]*>([\s\S]*?)<\/script>/gi)].map((m) => `<script> en línea: «${m[1].trim().slice(0, 40)}…»`),
    ...[...fuente.matchAll(/<([a-z][\w-]*)\b[^>]*\sstyle="/gi)].map((m) => `style= en <${m[1].toLowerCase()}>`),
    ...[...fuente.matchAll(/<([a-z][\w-]*)\b[^>]*\s(on[a-z]+)="/gi)].map((m) => `${m[2]}= en <${m[1].toLowerCase()}>`)
  ];
  if (enLinea.length) mal(`la política de seguridad estricta bloquearía: ${enLinea.slice(0, 6).join('; ')}${enLinea.length > 6 ? ' …' : ''} (pásalo a un archivo .js o .css)`); else bien('sin guiones, estilos ni manejadores escritos en el HTML');
  const p = await abre(390);

  /* 7 · Catálogos que cargó la página. */
  const catalogos = await p.evaluate(() => Object.entries(window.FORMKIT_CATALOGOS || {}).map(([nombre, c]) => {
    const filas = Array.isArray(c) ? c : (c && Array.isArray(c.filas) ? c.filas : []);
    const domicilio = filas.some((f) => f && typeof f === 'object' && 'cp' in f);
    const malas = domicilio ? filas.filter((f) => !f || !String(f.alcaldia || '').trim() || !String(f.colonia || '').trim() || !/^\d{5}$/.test(String(f.cp || ''))).length : 0;
    return { nombre, filas: filas.length, domicilio, malas, ficticio: !!(c && c.es_ficticio) };
  }));
  for (const c of catalogos) {
    if (!c.filas) mal(`el catálogo «${c.nombre}» está vacío`);
    else if (c.malas) mal(`el catálogo «${c.nombre}» tiene ${c.malas} fila(s) incompletas o con un código postal que no es de 5 dígitos`);
    else bien(`catálogo «${c.nombre}»: ${c.filas} filas${c.domicilio ? ' completas, códigos postales de 5 dígitos' : ''}`);
    if (c.ficticio) avisos.push(`el catálogo «${c.nombre}» es de ejemplo (es_ficticio: true): antes de publicar, cámbialo por el oficial`);
  }
  const usados = await p.evaluate(() => [...document.querySelectorAll('[data-catalogo]')].map((e) => e.dataset.catalogo));
  for (const n of new Set(usados)) if (!catalogos.some((c) => c.nombre === n)) mal(`la página usa el catálogo «${n}» y no se cargó: falta su archivo o su <script>`);

  /* 6 · Enviar vacío: resumen de errores con el foco. */
  const boton = p.locator('[data-accion="enviar"], [data-accion="siguiente"]').filter({ visible: true }).first();
  if (await boton.count()) {
    await boton.click();
    await p.waitForTimeout(400);
    const r = await p.evaluate(() => { const s = [...document.querySelectorAll('.resumen-errores')].find((x) => !x.hidden && x.offsetParent !== null); return { resumen: !!s, foco: !!(s && (s === document.activeElement || s.contains(document.activeElement))), obligatorios: document.querySelectorAll('[data-requerido], [required]').length }; });
    if (!r.obligatorios) bien('enviar vacío: el formulario no tiene respuestas obligatorias');
    else if (r.resumen && r.foco) bien('enviar vacío muestra el resumen de errores y le pasa el foco');
    else mal(`enviar vacío: ${r.resumen ? 'el resumen no recibe el foco' : 'no aparece el resumen de errores'}`);
  } else avisos.push('no hay botón [data-accion="enviar"] ni [data-accion="siguiente"] visible: no se probó enviar vacío');
  await p.context().close();

  /* 1 · Consola y red, de todas las aperturas. */
  if (consola.size) mal(`la consola dice: ${[...consola].slice(0, 8).join(' | ')}`); else bien('consola sin errores ni avisos');
  if (fallidas.size) mal(`peticiones que fallaron: ${[...fallidas].slice(0, 8).join(' | ')}`); else bien('ninguna petición falló');
  if (externas.size) mal(`peticiones a otros servidores (si es el mapa base, permítelo con --permitir): ${[...externas].slice(0, 6).join(' | ')}`); else bien('ninguna petición a otro servidor');
} finally {
  await navegador.close();
  if (servidor) servidor.close();
}

/* 8 · Campos: uso, finalidad, autocompletado, datos sensibles, teclado. */
if (esArchivo) {
  const r = spawnSync(process.execPath, [resolve(RAIZ, 'herramientas/auditar-campos.mjs'), resolve(destino)], { encoding: 'utf8' });
  if (r.status === 0) bien(`auditar-campos: ${(r.stdout.trim().split('\n').at(-1) || '').trim()}`);
  else mal(`auditar-campos:\n${(r.stdout + r.stderr).trim().split('\n').map((l) => `    ${l}`).join('\n')}`);
}

for (const a of avisos) console.log(`! ${a}`);
console.log(`\n${fallas.length ? `FALLA · ${fallas.length} comprobación(es) con problemas` : 'CORRECTO · el formulario pasa lo que la máquina puede comprobar'}`);
console.log('Queda para personas (docs/08): teléfono y lector de pantalla reales, Firefox y Safari, y el recorrido completo hasta el acuse.');
process.exit(fallas.length ? 1 : 0);
