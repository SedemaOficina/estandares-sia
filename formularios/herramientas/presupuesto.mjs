#!/usr/bin/env node
/* =========================================================
   presupuesto.mjs · Peso y velocidad de las plantillas en producción

   Presupuesto que fijó la Secretaría (20 oct 2026), por plantilla, en un
   teléfono de 390 px sin caché y con el sitio sirviendo texto comprimido:
     · a lo más 300 KB descargados y 20 archivos;
     · lista para usarse (fin de la carga) en 5 s o menos con 4G lenta y en
       12 s o menos con 3G, con el procesador cuatro veces más lento.
   En producción las hojas y los guiones del estándar que carga la página van
   juntos (juntar.mjs; los de cada plantilla, en dist/plantillas/): esta orden
   arma esa versión de cada plantilla en la respuesta, sin tocar el disco, y
   la mide. También comprueba que esa
   versión funciona igual (consola limpia; «Continuar» o «Enviar» vacío
   muestra el resumen de errores).

   Uso: node herramientas/presupuesto.mjs [--sin-tiempos] [--corridas 3]
     --sin-tiempos  sólo peso, archivos y funcionamiento (lo que corre
                    npm run verificar; los tiempos dependen del equipo y se
                    miden en cada versión con npm run presupuesto)
   Sale con 1 si una plantilla se pasa del presupuesto o no funciona.
   ========================================================= */
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { sirve, abreNavegador } from '../pruebas/ayudas.mjs';
import { paginaJunta } from './juntar.mjs';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const SIN_TIEMPOS = args.includes('--sin-tiempos');
const CORRIDAS = Number(args[args.indexOf('--corridas') + 1]) || 3;
export const LIMITES = { kb: 300, archivos: 20, ms4g: 5000, ms3g: 12000 };
/* Perfiles de red de las herramientas del navegador (los mismos de la auditoría del 19 oct 2026). */
const RED = {
  '4G lenta': { offline: false, latency: 562.5, downloadThroughput: (1.6 * 1000 * 1000 / 8) * 0.9, uploadThroughput: (750 * 1000 / 8) * 0.9 },
  '3G': { offline: false, latency: 2000, downloadThroughput: (400 * 1000 / 8) * 0.8, uploadThroughput: (400 * 1000 / 8) * 0.8 }
};

/* La plantilla en producción: sus hojas y guiones del estándar se cambian por los juntos de
   dist/plantillas/<plantilla>/ (construir.mjs con juntar.mjs). Lo demás queda igual. */
export const produccion = (html, nombre) => paginaJunta(html, `../../dist/plantillas/${nombre}/`);

const mediana = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];

async function mide(navegador, url, { red = null } = {}) {
  const ctx = await navegador.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2, locale: 'es-MX' });
  const p = await ctx.newPage();
  const consola = [];
  p.on('console', (m) => { if (['error', 'warning'].includes(m.type())) consola.push(`${m.type()}: ${m.text()}`); });
  p.on('pageerror', (e) => consola.push(`error: ${e.message}`));
  await p.route(/\/codigo\/plantillas\/[^/]+\.html(\?.*)?$/, async (ruta) => { const r = await ruta.fetch(); await ruta.fulfill({ response: r, body: produccion(await r.text(), new URL(ruta.request().url()).pathname.split('/').pop().replace(/\.html$/, '')) }); });
  const cdp = await ctx.newCDPSession(p);
  await cdp.send('Network.enable');
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
  const bytes = new Map();
  cdp.on('Network.responseReceived', (e) => { if (/^https?:/.test(e.response.url)) bytes.set(e.requestId, 0); });
  cdp.on('Network.loadingFinished', (e) => { if (bytes.has(e.requestId)) bytes.set(e.requestId, e.encodedDataLength); });
  if (red) { await cdp.send('Network.emulateNetworkConditions', RED[red]); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 }); }
  await p.goto(url, { waitUntil: 'load', timeout: 180000 });
  const listo = await p.evaluate(() => Math.round(performance.getEntriesByType('navigation')[0].loadEventEnd));
  let funciona = true;
  if (!red) {
    await p.waitForTimeout(300);
    const b = p.locator('[data-accion="siguiente"], [data-accion="enviar"]').filter({ visible: true }).first();
    await b.click();
    funciona = await p.waitForSelector('.resumen-errores:not([hidden])', { timeout: 5000 }).then(() => true).catch(() => false);
  }
  await ctx.close();
  return { archivos: bytes.size, kb: [...bytes.values()].reduce((s, x) => s + x, 0) / 1024, listo, consola, funciona };
}

const esPrincipal = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (esPrincipal) {
  const servidor = await sirve(undefined, { gzip: true });
  const navegador = await abreNavegador();
  const fallas = [];
  try {
    for (const f of readdirSync(resolve(RAIZ, 'codigo/plantillas')).filter((x) => x.endsWith('.html'))) {
      if (!readFileSync(resolve(RAIZ, 'codigo/plantillas', f), 'utf8').includes('data-formkit')) continue;
      const url = `${servidor.url}/codigo/plantillas/${f}`;
      const m = await mide(navegador, url);
      const linea = [`${f}: ${m.kb.toFixed(0)} KB en ${m.archivos} archivos`];
      if (m.kb > LIMITES.kb) fallas.push(`${f} descarga ${m.kb.toFixed(0)} KB (máximo ${LIMITES.kb})`);
      if (m.archivos > LIMITES.archivos) fallas.push(`${f} pide ${m.archivos} archivos (máximo ${LIMITES.archivos})`);
      if (m.consola.length) fallas.push(`${f} en producción: ${m.consola.join(' | ')}`);
      if (!m.funciona) fallas.push(`${f} en producción no muestra el resumen de errores al enviar vacío`);
      if (!SIN_TIEMPOS) {
        for (const [red, limite] of [['4G lenta', LIMITES.ms4g], ['3G', LIMITES.ms3g]]) {
          const t = [];
          for (let i = 0; i < CORRIDAS; i++) t.push((await mide(navegador, url, { red })).listo);
          const ms = mediana(t);
          linea.push(`${red}: ${(ms / 1000).toFixed(1)} s (corridas: ${t.map((x) => (x / 1000).toFixed(1)).join(', ')})`);
          if (ms > limite) fallas.push(`${f} tarda ${(ms / 1000).toFixed(1)} s con ${red} (máximo ${limite / 1000} s)`);
        }
      }
      console.log(`${fallas.some((x) => x.startsWith(f)) ? '✗' : '✓'} ${linea.join(' · ')}`);
    }
  } finally { await navegador.close(); await servidor.cierra(); }
  for (const f of fallas) console.log(`  ${f}`);
  console.log(`\n${fallas.length ? `FALLA · ${fallas.length} punto(s) fuera del presupuesto` : `CORRECTO · cada plantilla en producción: ≤ ${LIMITES.kb} KB y ≤ ${LIMITES.archivos} archivos${SIN_TIEMPOS ? ' (tiempos: npm run presupuesto)' : `, ≤ ${LIMITES.ms4g / 1000} s con 4G lenta y ≤ ${LIMITES.ms3g / 1000} s con 3G`}`}`);
  process.exit(fallas.length ? 1 : 0);
}
