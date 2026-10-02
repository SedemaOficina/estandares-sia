/* =========================================================
   ayudas.mjs · Servidor estático y navegador para las pruebas

   Sirve la raíz del paquete por HTTP (la plantilla también abre desde
   archivo local, pero las pruebas usan HTTP para poder medir la red) y abre
   Chromium. El navegador se busca en este orden: variable
   NAVEGADOR_EJECUTABLE, la carpeta de Playwright, el que trae Playwright.
   ========================================================= */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { existsSync, readdirSync } from 'node:fs';
import { dirname, extname, join, resolve, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

export const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const TIPOS = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.txt': 'text/plain; charset=utf-8' };

export function sirve() {
  const servidor = createServer(async (req, res) => {
    try {
      const ruta = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname));
      let archivo = join(RAIZ, ruta);
      if (!archivo.startsWith(RAIZ)) { res.writeHead(403); return res.end(); }
      if ((await stat(archivo)).isDirectory()) archivo = join(archivo, 'index.html');
      res.writeHead(200, { 'content-type': TIPOS[extname(archivo)] || 'application/octet-stream' });
      res.end(await readFile(archivo));
    } catch (e) { res.writeHead(404); res.end('no existe'); }
  });
  return new Promise((ok) => servidor.listen(0, '127.0.0.1', () => ok({ servidor, url: `http://127.0.0.1:${servidor.address().port}`, cierra: () => new Promise((r) => servidor.close(r)) })));
}

function ejecutable() {
  if (process.env.NAVEGADOR_EJECUTABLE) return process.env.NAVEGADOR_EJECUTABLE;
  const base = process.env.PLAYWRIGHT_BROWSERS_PATH || '/opt/pw-browsers';
  if (existsSync(base)) {
    for (const d of readdirSync(base).filter((x) => /^chromium-\d+$/.test(x)).sort().reverse()) {
      const c = join(base, d, 'chrome-linux', 'chrome');
      if (existsSync(c)) return c;
    }
  }
  return undefined; // el que trae Playwright
}

export async function abreNavegador() {
  return chromium.launch({ executablePath: ejecutable(), args: ['--no-sandbox'] });
}

/* Pagina con registro de consola: todo error de consola o de página, y toda
   petición fallida, queda en `pagina.registro` para que una prueba exija que
   la consola esté limpia. */
export async function nuevaPagina(navegador, opciones = {}) {
  const contexto = await navegador.newContext({ viewport: { width: 1000, height: 900 }, locale: 'es-MX', ...opciones });
  const pagina = await contexto.newPage();
  pagina.registro = [];
  pagina.on('console', (m) => { if (['error', 'warning'].includes(m.type())) pagina.registro.push(`${m.type()}: ${m.text()}`); });
  pagina.on('pageerror', (e) => pagina.registro.push(`pageerror: ${e.message}`));
  pagina.on('requestfailed', (r) => pagina.registro.push(`requestfailed: ${r.url()} ${r.failure()?.errorText}`));
  return pagina;
}

/* ---------- Perfiles y anchos de verificación (decisión del encargo) ---------- */

/* Dos perfiles: teléfono con puntero táctil y escritorio con ratón. Toda
   prueba de flujo corre en ambos. */
export const PERFILES = {
  movil: { nombre: 'móvil 390 táctil', contexto: { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 } },
  escritorio: { nombre: 'escritorio 1280', contexto: { viewport: { width: 1280, height: 900 } } }
};
/* Siete anchos: los tres teléfonos frecuentes, tableta, portátil, escritorio y pantalla ancha. */
export const ANCHOS = [320, 360, 390, 768, 1024, 1280, 1920];
export const PAGINAS = {
  'por-pasos': 'codigo/plantillas/por-pasos.html',
  'una-pagina': 'codigo/plantillas/una-pagina.html',
  guia: 'guia-visual/index.html',
  encuesta: 'guia-visual/ejemplos/encuesta.html',
  'captura-interna': 'guia-visual/ejemplos/captura-interna.html'
};

/* Abre una página del paquete con el almacén local limpio (los borradores y
   las sugerencias de una prueba no deben contaminar la siguiente). */
export async function abrePagina(navegador, url, ruta, { consulta = '', contexto = {} } = {}) {
  const p = await nuevaPagina(navegador, contexto);
  await p.goto(`${url}/${ruta}${consulta}`);
  await p.evaluate(() => localStorage.clear());
  await p.reload();
  await p.waitForLoadState('load');
  return p;
}
export const abrePlantilla = (navegador, url, opc = {}) => abrePagina(navegador, url, PAGINAS['por-pasos'], opc);

export const FRASE_LEGIBLE = 'El árbol frente a la escuela tiene una grieta grande en el tronco desde hace dos semanas.';
export const PNG_1x1 = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');

/* Botón visible del paso actual (los pasos ocultos también tienen botones). */
export const visible = (p, sel) => p.locator(sel).filter({ visible: true }).first();
export async function continuar(p) { await visible(p, '[data-accion="siguiente"]').click(); await p.waitForTimeout(150); }

/* Paso 1 de la plantilla por pasos, lleno como lo haría una persona. */
export async function llenaSolicitud(p) {
  await p.check('input[name="tipo"][value="otro"]');
  await p.fill('#tipo_otro', 'Una situación no prevista');
  await p.check('input[name="urgente"][value="no"]');
  await visible(p, '[data-hoy]').click();
  await p.fill('#descripcion', FRASE_LEGIBLE);
}
export async function llenaLugar(p) {
  await p.fill('#cp', '04010');
  await p.waitForTimeout(80);
  await p.fill('#calle', 'Calle de Prueba 1');
}
export async function llenaContacto(p) {
  await p.check('input[name="contacto"][value="si"]');
  await p.fill('#nombre', 'Fulana de Tal');
  await p.fill('#correo', 'fulana@ejemplo.local');
  await p.fill('#telefono', '55 0000 0000');
}
export async function aceptaDeclaraciones(p) {
  for (const s of ['input[name="aviso"]', 'input[name="humano"]']) if (!(await p.isChecked(s))) await p.check(s);
}

/* Captura el payload que la plantilla entregaría al servidor sin alterar el envío simulado. */
export async function capturaPayload(p) {
  const caja = { payload: null };
  await p.exposeFunction('__capturaPayload', (x) => { caja.payload = x; });
  await p.evaluate(() => {
    const original = window.FORMKIT_OPCIONES.enviar;
    window.FORMKIT_OPCIONES.enviar = (pl, o) => { window.__capturaPayload(JSON.parse(JSON.stringify({ datos: pl.datos, meta: pl.meta, archivos: (pl.archivos || []).map((a) => ({ nombre: a.nombre, size: a.size, sha256: a.sha256_original, lat: a.lat_captura })) }))); return original(pl, o); };
  });
  return caja;
}

/* Medidas de accesibilidad operables por máquina. */
export async function objetivosPequenos(p, minimo = 44) {
  return p.evaluate((min) => {
    const out = [];
    for (const e of document.querySelectorAll('button, a[href], input:not([type=hidden]), select, textarea, [role=button], [role=tab], summary')) {
      if (e.closest('[hidden]') || e.closest('iframe')) continue;
      const r = e.getBoundingClientRect();
      if (!r.width || !r.height) continue;
      /* Los radios y casillas nativos viven dentro de una etiqueta que es el objetivo real. */
      const obj = (e.matches('input[type=radio],input[type=checkbox]') && e.closest('label')) ? e.closest('label').getBoundingClientRect() : r;
      if (Math.max(obj.width, obj.height) < min || Math.min(obj.width, obj.height) < 24) out.push(`${e.tagName.toLowerCase()}${e.id ? '#' + e.id : ''}.${e.className && e.className.baseVal === undefined ? String(e.className).split(' ')[0] : ''} ${Math.round(obj.width)}×${Math.round(obj.height)}`);
    }
    return out;
  }, minimo);
}
export const desbordeHorizontal = (p) => p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
export const ocultosVisibles = (p) => p.evaluate(() => [...document.querySelectorAll('[hidden]')].filter((e) => getComputedStyle(e).display !== 'none').map((e) => e.tagName + '.' + e.className));
export const iconosSinNombre = (p) => p.evaluate(() => [...document.querySelectorAll('button, a[href]')].filter((b) => !b.closest('[hidden]') && !b.textContent.trim() && !b.getAttribute('aria-label') && !b.getAttribute('aria-labelledby') && !b.getAttribute('title') && !b.querySelector('img[alt]:not([alt=""]), svg title')).map((b) => b.outerHTML.slice(0, 80)));

/* PNG sin compresión útil (ruido): pesa lo bastante para pasar del límite y
   obligar a optimizar. Se arma a mano para no depender de bibliotecas. */
import zlib from 'node:zlib';
import crypto from 'node:crypto';
export function pngRuido(ancho, alto) {
  const crc = (b) => { const v = Buffer.alloc(4); v.writeUInt32BE(zlib.crc32(b) >>> 0); return v; };
  const trozo = (tipo, datos) => { const l = Buffer.alloc(4); l.writeUInt32BE(datos.length); const t = Buffer.concat([Buffer.from(tipo), datos]); return Buffer.concat([l, t, crc(t)]); };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(ancho, 0); ihdr.writeUInt32BE(alto, 4); ihdr[8] = 8; ihdr[9] = 2;
  const fila = ancho * 3 + 1;
  /* Bytes al azar: el ruido no se comprime y el PNG pesa lo que debe. */
  const crudo = crypto.randomBytes(fila * alto);
  for (let y = 0; y < alto; y++) crudo[y * fila] = 0; // filtro «ninguno» en cada fila
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), trozo('IHDR', ihdr), trozo('IDAT', zlib.deflateSync(crudo, { level: 1 })), trozo('IEND', Buffer.alloc(0))]);
}

/* Inserta un bloque EXIF (fecha y GPS conocidos) tras el SOI de un JPG. */
export function jpegConExif(jpg) {
  const u16 = (n) => { const b = Buffer.alloc(2); b.writeUInt16LE(n); return b; };
  const u32 = (n) => { const b = Buffer.alloc(4); b.writeUInt32LE(n); return b; };
  const ent = (tag, tipo, cuenta, valor) => Buffer.concat([u16(tag), u16(tipo), u32(cuenta), valor]);
  const racs = (...p) => Buffer.concat(p.flatMap(([n, d]) => [u32(n), u32(d)]));
  const tiff = Buffer.concat([
    Buffer.from('II'), u16(42), u32(8),
    u16(2), ent(0x8769, 4, 1, u32(38)), ent(0x8825, 4, 1, u32(56)), u32(0),                         // IFD0 (8..38)
    u16(1), ent(0x9003, 2, 20, u32(110)), u32(0),                                                       // Exif (38..56)
    u16(4), ent(1, 2, 2, Buffer.from('N\0\0\0')), ent(2, 5, 3, u32(130)), ent(3, 2, 2, Buffer.from('W\0\0\0')), ent(4, 5, 3, u32(154)), u32(0), // GPS (56..110)
    Buffer.from('2026:09:15 10:30:00\0'),                                                               // 110..130
    racs([19, 1], [25, 1], [3000, 100]),                                                                // 130..154
    racs([99, 1], [7, 1], [4800, 100])                                                                  // 154..178
  ]);
  const cuerpo = Buffer.concat([Buffer.from('Exif\0\0'), tiff]);
  const l = Buffer.alloc(2); l.writeUInt16BE(cuerpo.length + 2);
  return Buffer.concat([jpg.subarray(0, 2), Buffer.from([0xff, 0xe1]), l, cuerpo, jpg.subarray(2)]);
}
export const EXIF_ESPERADO = { fecha: '2026-09-15T10:30:00', lat: 19.425, lon: -99.13 };
