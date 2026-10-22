#!/usr/bin/env node
/* =========================================================
   citas-formularios.mjs · Que geovisores no cite una regla de formularios
   que ya cambió de sentido

   Geovisores cita reglas FRM de ../formularios sin repetirlas («complementa
   FRM-38»). Si formularios cambia el texto de una regla citada, la cita puede
   quedar diciendo otra cosa y nadie se entera. Aquí se guarda, por cada FRM
   citada, una huella de su título y su texto tal como estaban cuando se
   revisó la cita (reglas/citas-formularios.json). Si la regla cambió, o si
   se cita una nueva sin revisar, la verificación falla y dice qué revisar.

   Uso: node herramientas/citas-formularios.mjs              (lo corre verificar)
        node herramientas/citas-formularios.mjs --actualizar (después de revisar
        cada cita contra la regla vigente: guarda las huellas nuevas)
   ========================================================= */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';
import { RAIZ } from './color.mjs';

const ARCHIVO = resolve(RAIZ, 'reglas/citas-formularios.json');
const FRM = JSON.parse(readFileSync(resolve(RAIZ, '../formularios/reglas/reglas.json'), 'utf8')).reglas;
const huella = (r) => createHash('sha256').update(`${r.titulo}\n${r.regla}`).digest('hex').slice(0, 16);

/* Dónde cita geovisores: todo lo que se escribe a mano (docs/01 se genera de reglas.json). */
const citas = new Map();
const recorre = (dir) => {
  for (const f of readdirSync(dir)) {
    const ruta = join(dir, f);
    if (statSync(ruta).isDirectory()) { recorre(ruta); continue; }
    if (!/\.(json|md|css|js|mjs|html)$/.test(f) || f === '01-reglas.md' || f === 'citas-formularios.json' || f === 'citas-formularios.mjs') continue;
    for (const m of readFileSync(ruta, 'utf8').matchAll(/FRM-\d{2}/g)) citas.set(m[0], [...new Set([...(citas.get(m[0]) || []), relative(RAIZ, ruta).split(sep).join('/')])]);
  }
};
for (const c of ['reglas', 'docs', 'codigo', 'guia-visual', 'herramientas']) if (existsSync(resolve(RAIZ, c))) recorre(resolve(RAIZ, c));

const vigentes = Object.fromEntries([...citas.keys()].sort().map((id) => { const r = FRM.find((x) => x.id === id); return [id, r ? { huella: huella(r), titulo: r.titulo } : null]; }));

if (process.argv.includes('--actualizar')) {
  const faltan = Object.entries(vigentes).filter(([, v]) => !v).map(([id]) => id);
  if (faltan.length) { console.log(`FALLA · geovisores cita reglas que no existen en formularios: ${faltan.join(', ')}`); process.exit(1); }
  writeFileSync(ARCHIVO, JSON.stringify({ _nota: 'Huella del título y el texto de cada regla FRM que geovisores cita, tal como estaba cuando se revisó la cita. La escribe herramientas/citas-formularios.mjs --actualizar después de revisar; no se edita a mano.', revisado: new Date().toISOString().slice(0, 10), citas: vigentes }, null, 1) + '\n');
  console.log(`${Object.keys(vigentes).length} citas guardadas en reglas/citas-formularios.json`);
  process.exit(0);
}

const guardadas = existsSync(ARCHIVO) ? JSON.parse(readFileSync(ARCHIVO, 'utf8')).citas : {};
const avisos = [];
for (const [id, v] of Object.entries(vigentes)) {
  const donde = citas.get(id).join(', ');
  if (!v) avisos.push(`${id} (${donde}) no existe en formularios`);
  else if (!guardadas[id]) avisos.push(`${id} (${donde}) es una cita nueva sin revisar`);
  else if (guardadas[id].huella !== v.huella) avisos.push(`${id} cambió en formularios desde que se revisó la cita: revisa ${donde}`);
}
for (const id of Object.keys(guardadas)) if (!vigentes[id]) avisos.push(`${id} ya no se cita: quítala con --actualizar`);
for (const a of avisos) console.log(`✗ ${a}`);
console.log(avisos.length ? `FALLA · ${avisos.length} cita(s) por revisar; al terminar: node herramientas/citas-formularios.mjs --actualizar` : `CORRECTO · ${Object.keys(vigentes).length} reglas de formularios citadas, sin cambios desde su revisión`);
process.exit(avisos.length ? 1 : 0);
