/* =========================================================
   color.mjs · Lectura de tokens y fórmulas de color, sin dependencias

   Lo usan contraste.mjs, rampas.mjs y generar-reglas.mjs. La guía visual
   repite estas mismas fórmulas en el navegador (guia-visual/guia.js) y las
   pruebas exigen que den lo mismo.
   ========================================================= */
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/* Hojas que guardan valores, en el orden en que las carga un visor. */
export const HOJAS_DE_TOKENS = [
  '../formularios/codigo/css/tokens.css',
  'codigo/css/tokens-mapa.css',
  'codigo/css/temas.css'
];

/* ---------- Tokens ---------- */

function bloques(css) {
  const sin = css.replace(/\/\*[\s\S]*?\*\//g, '');
  return [...sin.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => ({ selector: m[1].trim(), cuerpo: m[2] }));
}
function declaraciones(cuerpo) {
  const t = {};
  for (const m of cuerpo.matchAll(/(--[\w-]+)\s*:\s*([^;]+);?/g)) t[m[1]] = m[2].trim();
  return t;
}

/* Variables de :root de todas las hojas; con «tema», además las del bloque
   [data-tema="tema"], que ganan. Devuelve los valores tal como se escriben. */
export function leeDeclarados(tema = null) {
  const raiz = {}; const temas = {};
  for (const hoja of HOJAS_DE_TOKENS) {
    for (const b of bloques(readFileSync(resolve(RAIZ, hoja), 'utf8'))) {
      if (b.selector === ':root') Object.assign(raiz, declaraciones(b.cuerpo));
      const m = b.selector.match(/^\[data-tema="([\w-]+)"\]$/);
      if (m) temas[m[1]] = { ...(temas[m[1]] || {}), ...declaraciones(b.cuerpo) };
    }
  }
  if (tema && !temas[tema]) throw new Error(`el tema «${tema}» no existe en temas.css`);
  return { valores: { ...raiz, ...(tema ? temas[tema] : {}) }, temas: Object.keys(temas) };
}

/* Resuelve var(--x) hasta llegar a un valor. Lanza si el token no existe. */
export function resuelve(valores, nombre, cadena = []) {
  if (cadena.includes(nombre)) throw new Error(`referencia circular: ${[...cadena, nombre].join(' → ')}`);
  const v = valores[nombre];
  if (v === undefined) throw new Error(`el token ${nombre} no existe`);
  const m = v.match(/^var\(\s*(--[\w-]+)\s*\)$/);
  return m ? resuelve(valores, m[1], [...cadena, nombre]) : v;
}

export function hexDe(valores, nombre) {
  const v = resuelve(valores, nombre);
  if (!/^#[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/.test(v)) throw new Error(`${nombre} no es un color hexadecimal (${v})`);
  return v.toUpperCase();
}

/* ---------- Contraste (WCAG 2.2, 1.4.3 y 1.4.11) ---------- */

export function hexARgb(hex) {
  let h = hex.replace('#', '').trim();
  if (h.length === 3) h = [...h].map((c) => c + c).join('');
  if (!/^[0-9a-fA-F]{6}$/.test(h)) throw new Error(`color no válido: ${hex}`);
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
}
const lineal = (v) => { const c = v / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
export function luminancia([r, g, b]) { return 0.2126 * lineal(r) + 0.7152 * lineal(g) + 0.0722 * lineal(b); }
export function ratio(hexA, hexB) {
  const a = luminancia(hexARgb(hexA)); const b = luminancia(hexARgb(hexB));
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

/* ---------- Daltonismo (Machado, Oliveira y Fernandes, 2009) ----------
   Matrices de severidad completa, aplicadas en RGB lineal; el resultado se
   recorta a [0, 1]. Es el mismo método de la auditoría de PR
   (auditoria_ux_calles.html), que no dejó un programa reutilizable. */
export const MACHADO = {
  protanopia: [[0.152286, 1.052583, -0.204868], [0.114503, 0.786281, 0.099216], [-0.003882, -0.048116, 1.051998]],
  deuteranopia: [[0.367322, 0.860646, -0.227968], [0.280085, 0.672501, 0.047413], [-0.011820, 0.042940, 0.968881]],
  tritanopia: [[1.255528, -0.076749, -0.178779], [-0.078411, 0.930809, 0.147602], [0.004733, 0.691367, 0.303900]]
};
const aSrgb = (c) => { const v = Math.min(1, Math.max(0, c)); return v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055; };

/* Devuelve el RGB lineal de un color visto con la condición dada (o tal cual). */
export function simulaLineal(hex, condicion = null) {
  const rgb = hexARgb(hex).map(lineal);
  if (!condicion) return rgb;
  const m = MACHADO[condicion];
  return m.map((fila) => Math.min(1, Math.max(0, fila[0] * rgb[0] + fila[1] * rgb[1] + fila[2] * rgb[2])));
}
export function simulaHex(hex, condicion) {
  return '#' + simulaLineal(hex, condicion).map((c) => Math.round(aSrgb(c) * 255).toString(16).padStart(2, '0')).join('').toUpperCase();
}

/* CIELAB con blanco D65 y ΔE CIE76 (distancia euclidiana en Lab). */
export function lab([r, g, b]) {
  const X = (0.4124564 * r + 0.3575761 * g + 0.1804375 * b) / 0.95047;
  const Y = 0.2126729 * r + 0.7151522 * g + 0.0721750 * b;
  const Z = (0.0193339 * r + 0.1191920 * g + 0.9503041 * b) / 1.08883;
  const f = (t) => (t > 216 / 24389 ? Math.cbrt(t) : (24389 / 27 * t + 16) / 116);
  return [116 * f(Y) - 16, 500 * (f(X) - f(Y)), 200 * (f(Y) - f(Z))];
}
export function deltaE(hexA, hexB, condicion = null) {
  const a = lab(simulaLineal(hexA, condicion)); const b = lab(simulaLineal(hexB, condicion));
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}
