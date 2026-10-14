#!/usr/bin/env node
/* =========================================================
   contraste.mjs · Calculadora de contraste (WCAG 2.2, 1.4.3 y 1.4.11)

   Lee los valores de tokens.css (único origen de color) y mide cada par de
   pares-contraste.json con la fórmula de luminancia relativa de WCAG. Sin
   dependencias.

   Uso:
     node herramientas/contraste.mjs            # tabla en pantalla
     node herramientas/contraste.mjs --md       # tabla en markdown (para docs)
     node herramientas/contraste.mjs --json     # salida de máquina
     node herramientas/contraste.mjs --guia     # escribe guia-visual/pares.js
     node herramientas/contraste.mjs '#9D2148' '#FFFFFF'   # un par suelto

   Código de salida: 0 si todos los pares exigidos cumplen; 1 si alguno falla.
   ========================================================= */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');

export function hexARgb(hex) {
  let h = hex.replace('#', '').trim();
  if (h.length === 3) h = [...h].map((c) => c + c).join('');
  if (!/^[0-9a-fA-F]{6}$/.test(h)) throw new Error(`color no válido: ${hex}`);
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
}

/* Luminancia relativa: cada canal se linealiza antes de ponderarlo. */
export function luminancia([r, g, b]) {
  const f = (v) => { const c = v / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

export function ratio(hexA, hexB) {
  const a = luminancia(hexARgb(hexA)); const b = luminancia(hexARgb(hexB));
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

/* Variables de :root con valor hexadecimal. */
export function lee_tokens() {
  const css = readFileSync(resolve(RAIZ, 'codigo/css/tokens.css'), 'utf8');
  const t = {};
  for (const m of css.matchAll(/(--[\w-]+)\s*:\s*(#[0-9a-fA-F]{3,6})\b/g)) t[m[1]] = m[2];
  return t;
}

export function mide() {
  const tokens = lee_tokens();
  const { pares } = JSON.parse(readFileSync(resolve(RAIZ, 'herramientas/pares-contraste.json'), 'utf8'));
  return pares.map((p) => {
    for (const k of [p.texto, p.fondo]) if (!tokens[k]) throw new Error(`${p.id}: el token ${k} no existe en tokens.css`);
    const r = ratio(tokens[p.texto], tokens[p.fondo]);
    return { ...p, textoHex: tokens[p.texto], fondoHex: tokens[p.fondo], ratio: r, cumple: p.minimo === null ? null : r >= p.minimo };
  });
}

const esPrincipal = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (esPrincipal) {
  const args = process.argv.slice(2);
  if (args.length === 2 && args.every((a) => a.startsWith('#'))) {
    console.log(`${ratio(args[0], args[1]).toFixed(2)}:1`);
    process.exit(0);
  }
  const filas = mide();
  const fallan = filas.filter((f) => f.cumple === false);
  if (args.includes('--guia')) {
    /* La guía visual abre también desde archivo local, donde el navegador no
       deja leer un JSON: se le entrega la lista de pares como script. Las
       razones las calcula la guía en el navegador con los colores reales. */
    const { pares } = JSON.parse(readFileSync(resolve(RAIZ, 'herramientas/pares-contraste.json'), 'utf8'));
    writeFileSync(resolve(RAIZ, 'guia-visual/pares.js'), `/* Generado por herramientas/contraste.mjs --guia desde pares-contraste.json. No se edita a mano. */\nwindow.GUIA_PARES = ${JSON.stringify(pares, null, 1)};\n`);
    console.log(`guia-visual/pares.js escrito: ${pares.length} pares`);
    process.exit(0);
  }
  if (args.includes('--json')) console.log(JSON.stringify(filas, null, 2));
  else if (args.includes('--md')) {
    console.log('| Id | Primer plano | Fondo | Razón | Mínimo | Resultado | Dónde |\n|---|---|---|---|---|---|---|');
    for (const f of filas) console.log(`| ${f.id} | \`${f.texto}\` ${f.textoHex} | \`${f.fondo}\` ${f.fondoHex} | ${f.ratio.toFixed(2)}:1 | ${f.minimo === null ? '—' : `${f.minimo}:1`} | ${f.cumple === null ? 'informativo' : f.cumple ? 'cumple' : '**NO CUMPLE**'} | ${f.donde} |`);
  } else {
    for (const f of filas) console.log(`${f.id}  ${f.ratio.toFixed(2).padStart(5)}:1  mín ${f.minimo === null ? ' — ' : f.minimo.toFixed(1)}  ${f.cumple === null ? 'info ' : f.cumple ? 'cumple' : 'FALLA '}  ${f.texto} sobre ${f.fondo} · ${f.donde}`);
    console.log(`\n${fallan.length ? 'FALLA' : 'CORRECTO'} · ${filas.length} pares, ${fallan.length} sin cumplir`);
  }
  process.exit(fallan.length ? 1 : 0);
}
