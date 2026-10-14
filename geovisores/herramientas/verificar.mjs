#!/usr/bin/env node
/* =========================================================
   verificar.mjs · Una orden, una señal (GEO-124)

   Corre todas las comprobaciones del paquete y da un solo veredicto por el
   código de salida. Lo que no corre cuenta como falla.

   Fase 1: formularios presente en ../formularios, documentos generados al día,
   contraste, rampas, fichas de tema claras (D11), auditor de CSS, guía visual
   al día y sintaxis de los guiones. Las pruebas en navegador (Playwright y axe) llegan en la fase 2.

   Uso: node herramientas/verificar.mjs        (o npm run verificar)
   ========================================================= */
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { RAIZ, leeDeclarados, resuelve } from './color.mjs';
import { leePares, mide as mideContraste } from './contraste.mjs';

const resultados = [];
function paso(nombre, fn) {
  let ok = false; let detalle = '';
  try { [ok, detalle] = fn(); } catch (e) { ok = false; detalle = `no corrió: ${e.message}`; }
  resultados.push({ nombre, ok, detalle });
  console.log(`${ok ? '✓' : '✗'} ${nombre}${detalle ? ` · ${detalle}` : ''}`);
}
function corre(guion, ...args) {
  const r = spawnSync(process.execPath, [resolve(RAIZ, guion), ...args], { encoding: 'utf8' });
  if (r.error) throw r.error;
  const ultima = (r.stdout.trim().split('\n').at(-1) || r.stderr.trim().split('\n').at(-1) || '').trim();
  return [r.status === 0, ultima];
}

paso('Formularios a un lado (../formularios)', () => { const v = JSON.parse(readFileSync(resolve(RAIZ, '../formularios/package.json'), 'utf8')).version; return [true, `formularios ${v}`]; });
paso('Documentos generados al día', () => corre('herramientas/generar-reglas.mjs', '--comprobar'));
paso('Contraste sobre cada fondo real', () => corre('herramientas/contraste.mjs'));
paso('Rampas y daltonismo', () => corre('herramientas/rampas.mjs'));

/* D11: la ficha de tema es siempre clara. Cada tema de temas.css (y el
   institucional) mide el azul de lo tocable y la marca sobre su ficha, a
   4.5:1; un tema nuevo sin esos dos pares no pasa. */
paso('Fichas de tema claras (D11)', () => {
  const filas = mideContraste();
  const faltan = [];
  for (const tema of [null, ...leeDeclarados().temas]) {
    for (const texto of ['--azul', '--tema-marca']) {
      const f = filas.find((x) => (x.tema || null) === tema && x.texto === texto && x.fondo === '--tema-ficha' && x.minimo >= 4.5);
      if (!f) faltan.push(`${tema || 'institucional'}: falta el par ${texto} sobre --tema-ficha`);
      else if (!f.cumple) faltan.push(`${tema || 'institucional'}: ${texto} sobre su ficha da ${f.ratio.toFixed(2)}:1`);
    }
  }
  return faltan.length ? [false, faltan.join('; ')] : [true, `${1 + leeDeclarados().temas.length} temas`];
});
paso('Auditor de CSS', () => corre('herramientas/auditor-css.mjs'));

paso('Guía visual: pares.js al día', () => {
  const esperado = `/* Generado por herramientas/contraste.mjs --guia desde pares-contraste.json. No se edita a mano. */\nwindow.GUIA_PARES = ${JSON.stringify(leePares(), null, 1)};\n`;
  const hay = readFileSync(resolve(RAIZ, 'guia-visual/pares.js'), 'utf8');
  return hay === esperado ? [true, ''] : [false, 'correr node herramientas/contraste.mjs --guia'];
});

paso('Guía visual: cada color del mapa está en la paleta', () => {
  const guia = readFileSync(resolve(RAIZ, 'guia-visual/guia.js'), 'utf8');
  const css = readFileSync(resolve(RAIZ, 'codigo/css/tokens-mapa.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  const { valores } = leeDeclarados();
  const deColor = [...css.matchAll(/(--[\w-]+)\s*:/g)].map((m) => m[1]).filter((t) => { try { return /^#[0-9a-f]{3,6}$/i.test(resuelve(valores, t)); } catch { return false; } });
  const faltan = deColor.filter((t) => !guia.includes(`'${t}'`));
  return faltan.length ? [false, `faltan en guia.js: ${faltan.join(', ')}`] : [true, `${deColor.length} colores`];
});

paso('Sintaxis de los guiones', () => {
  const malos = ['guia-visual/guia.js', 'guia-visual/pares.js'].filter((f) => spawnSync(process.execPath, ['--check', resolve(RAIZ, f)]).status !== 0);
  return malos.length ? [false, malos.join(', ')] : [true, ''];
});

const fallan = resultados.filter((r) => !r.ok);
console.log(`\n${fallan.length ? 'FALLA' : 'CORRECTO'} · ${resultados.length} comprobaciones, ${fallan.length} con falla`);
process.exit(fallan.length ? 1 : 0);
