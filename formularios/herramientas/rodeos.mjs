#!/usr/bin/env node
/* =========================================================
   rodeos.mjs · Cada rodeo de una biblioteca, registrado

   Cuando una biblioteca de vendor/ (o una herramienta de verificación) hace
   algo mal y el estándar lo rodea en su código, el comentario del rodeo
   lleva su clave (RODEO-01…) y la tabla «Fallas conocidas y rodeos» de
   docs/07 dice qué falla, en qué versión, dónde está el rodeo y cuándo se
   quita. Así, al actualizar una biblioteca, se sabe qué revisar.

   Comprueba: que cada clave del código esté en la tabla, que cada fila de la
   tabla esté en los archivos que cita, y que ninguna clave se repita en la
   tabla. Sin dependencias.

   Uso: node herramientas/rodeos.mjs        (lo corre npm run verificar)
   ========================================================= */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DOC = 'docs/07-bibliotecas-y-tipografias.md';
const CARPETAS = ['codigo', 'herramientas', 'pruebas', 'guia-visual'];
const fallas = [];

const doc = readFileSync(resolve(RAIZ, DOC), 'utf8');
const tabla = (/<!-- rodeos:inicio -->([\s\S]*?)<!-- rodeos:fin -->/.exec(doc) || [])[1];
if (!tabla) { console.log(`FALLA · ${DOC} no tiene la tabla de rodeos (marcas <!-- rodeos:inicio --> y <!-- rodeos:fin -->)`); process.exit(1); }
const filas = new Map();
for (const linea of tabla.split('\n')) {
  const m = /^\| (RODEO-\d{2}) \|(.*)\|\s*$/.exec(linea.trim());
  if (!m) continue;
  if (filas.has(m[1])) fallas.push(`${m[1]} está dos veces en la tabla de ${DOC}`);
  const archivos = [...m[2].matchAll(/`([\w./-]+\/[\w.-]+\.(?:js|mjs|css|html|json))`/g)].map((x) => x[1]);
  if (!archivos.length) fallas.push(`${m[1]}: la fila no dice en qué archivo está el rodeo`);
  filas.set(m[1], archivos);
}

/* Las claves que aparecen en el código (lo generado no cuenta: repite lo de su fuente). */
const GENERADOS = new Set(['guia-visual/artefacto.html', 'guia-visual/manifiesto.js', 'herramientas/rodeos.mjs']);
const enCodigo = new Map();
const recorre = (dir) => {
  for (const f of readdirSync(dir)) {
    const ruta = join(dir, f);
    if (statSync(ruta).isDirectory()) { if (f !== 'node_modules') recorre(ruta); continue; }
    if (!/\.(js|mjs|css|html)$/.test(f)) continue;
    const rel = relative(RAIZ, ruta).split(sep).join('/');
    if (GENERADOS.has(rel)) continue;
    for (const m of readFileSync(ruta, 'utf8').matchAll(/RODEO-\d{2}/g)) enCodigo.set(m[0], [...new Set([...(enCodigo.get(m[0]) || []), rel])]);
  }
};
for (const c of CARPETAS) if (existsSync(resolve(RAIZ, c))) recorre(resolve(RAIZ, c));

for (const [clave, donde] of enCodigo) if (!filas.has(clave)) fallas.push(`${clave} (${donde.join(', ')}) no está en la tabla de ${DOC}`);
for (const [clave, archivos] of filas) {
  for (const a of archivos) {
    if (!existsSync(resolve(RAIZ, a))) fallas.push(`${clave}: la tabla cita ${a}, que no existe`);
    else if (!readFileSync(resolve(RAIZ, a), 'utf8').includes(clave)) fallas.push(`${clave}: la tabla lo pone en ${a}, pero ese archivo no lleva la clave`);
  }
}

for (const f of fallas) console.log(`✗ ${f}`);
console.log(fallas.length ? `FALLA · ${fallas.length} rodeo(s) sin registrar o mal registrados` : `CORRECTO · ${filas.size} rodeos registrados en ${DOC}, cada uno en su archivo`);
process.exit(fallas.length ? 1 : 0);
