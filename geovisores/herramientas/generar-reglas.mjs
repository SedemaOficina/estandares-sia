#!/usr/bin/env node
/* generar-reglas.mjs · Escribe docs/01-reglas.md desde reglas/reglas.json y
   actualiza, entre sus marcas, las tablas medidas de docs/02-guia-de-estilo.md
   (contraste y rampas) y la lista de reglas por tipo de visor de
   docs/03-guia-de-decision.md. Por qué: un documento escrito a mano y la
   regla que describe se desacuerdan; aquí hay una sola fuente y el documento
   es su reflejo. Adaptado del de formularios 1.0.0.
   Uso: node herramientas/generar-reglas.mjs            (escribe)
        node herramientas/generar-reglas.mjs --comprobar (falla si hay diferencias) */
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { RAIZ } from './color.mjs';

const COMPROBAR = process.argv.includes('--comprobar');
const fuente = JSON.parse(readFileSync(resolve(RAIZ, 'reglas/reglas.json'), 'utf8'));
const { secciones, reglas, niveles, tipos, aplica, proyectos } = fuente;

/* ---------- Validación ---------- */
const CAMPOS = ['id', 'seccion', 'nivel', 'aplica', 'titulo', 'regla', 'porque', 'origen', 'tipo', 'verificacion'];
const NIVELES = niveles.map((n) => n.id);
const TIPOS = tipos.map((t) => t.id);
const APLICA = aplica.map((a) => a.id);
const SIGLAS = proyectos.map((p) => p.sigla);
const FRM = new Set(JSON.parse(readFileSync(resolve(RAIZ, '../formularios/reglas/reglas.json'), 'utf8')).reglas.map((r) => r.id));
const errores = [];
const ids = new Set();
for (const r of reglas) {
  for (const c of CAMPOS) if (r[c] === undefined || r[c] === '' || (Array.isArray(r[c]) && !r[c].length)) errores.push(`${r.id}: falta «${c}»`);
  if (!/^GEO-\d{2,3}$/.test(r.id)) errores.push(`${r.id}: el identificador no tiene la forma GEO-nn`);
  if (ids.has(r.id)) errores.push(`${r.id}: identificador repetido`);
  ids.add(r.id);
  if (!NIVELES.includes(r.nivel)) errores.push(`${r.id}: nivel «${r.nivel}» no admitido`);
  if (!TIPOS.includes(r.tipo)) errores.push(`${r.id}: tipo «${r.tipo}» no admitido`);
  for (const a of r.aplica || []) if (!APLICA.includes(a)) errores.push(`${r.id}: «aplica» no admite «${a}»`);
  if (!secciones.some((s) => s.id === r.seccion)) errores.push(`${r.id}: sección ${r.seccion} no existe`);
  const origen = r.origen || [];
  if (r.tipo === 'decisión del estándar' && !origen.some((o) => /^D\d+$/.test(o))) errores.push(`${r.id}: una decisión del estándar debe citar su Dn`);
  if (r.tipo === 'aprendizaje de proyecto' && !origen.some((o) => SIGLAS.includes(o.split(' ')[0]))) errores.push(`${r.id}: un aprendizaje debe citar al menos un proyecto (${SIGLAS.join(', ')})`);
  for (const o of origen) {
    const cabeza = o.split(' ')[0];
    if (/^FRM-\d+$/.test(cabeza) && !FRM.has(cabeza)) errores.push(`${r.id}: cita ${cabeza}, que no existe en formularios`);
    if (!/^(D\d+|FRM-\d+)$/.test(cabeza) && !SIGLAS.includes(cabeza)) errores.push(`${r.id}: origen «${o}» no empieza con una sigla de proyecto, una Dn ni una FRM-nn`);
  }
  for (const m of `${r.regla} ${r.porque}`.matchAll(/GEO-(\d+)/g)) if (!reglas.some((x) => x.id === `GEO-${m[1]}`)) errores.push(`${r.id}: menciona GEO-${m[1]}, que no existe`);
  for (const m of `${r.regla} ${r.porque}`.matchAll(/FRM-(\d+)/g)) if (!FRM.has(`FRM-${m[1]}`)) errores.push(`${r.id}: menciona FRM-${m[1]}, que no existe en formularios`);
}
if (errores.length) { console.error(errores.join('\n')); process.exit(1); }

/* ---------- docs/01-reglas.md ---------- */
const cuenta = (campo, valor) => reglas.filter((r) => r[campo] === valor).length;
/* La última decisión citada (Dn) sale de los orígenes, para que el texto no
   se quede atrás cuando la Secretaría toma una decisión nueva. */
const ultimaD = Math.max(...reglas.flatMap((r) => r.origen).map((o) => o.match(/^D(\d+)$/)).filter(Boolean).map((m) => Number(m[1])));
/* Ancla como la arma GitHub: minúsculas, sin puntuación, con acentos, cada espacio un guion. */
const ancla = (s) => `${s.id}-${s.titulo.toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, '').trim().replace(/\s/g, '-')}`;
const lineas = [
  '# 01 · Reglas de los geovisores del SIA',
  '',
  '> Este documento se **genera** de `reglas/reglas.json` (`node herramientas/generar-reglas.mjs`). No se edita a mano: se corrige la regla en el JSON y se vuelve a generar.',
  '',
  `El estándar tiene **${reglas.length} reglas**: ${NIVELES.map((n) => `${cuenta('nivel', n)} ${n}`).join(', ')}. ${cuenta('tipo', TIPOS[0])} salieron de lo que pasó en los proyectos, ${cuenta('tipo', TIPOS[1])} son decisiones del estándar (D1 a D${ultimaD}) y ${cuenta('tipo', TIPOS[2])} son mejores prácticas adicionales. No repiten las reglas de formularios: cuando una regla del mapa amplía una de formularios, la cita (FRM-xx).`,
  '',
  '**Niveles.**',
  '',
  ...niveles.map((n) => `- **${n.id}.** ${n.texto}`),
  '',
  '**Cómo leer cada regla.** *Regla*: qué se hace. *Por qué*: la historia que la hizo necesaria, o la razón cuando no hay historia; una regla sin su historia se desobedece en cuanto estorba. *Aplica a*: qué visores la siguen. *Origen*: proyecto (con su versión, decisión o bitácora), decisión del estándar (Dn) o regla de formularios (FRM-xx). *Verificación*: cómo se comprueba; las herramientas de verificación de las fases 2 a 4 se construyen sobre esta columna.',
  '',
  '**Proyectos de origen.** ' + proyectos.map((p) => `${p.sigla}: ${p.nombre}, ${p.motor}`).join(' · ') + '. La historia completa de cada regla está en `docs/00-aprendizajes.md`.',
  '',
  '## Índice',
  '',
  ...secciones.map((s) => {
    const rs = reglas.filter((r) => r.seccion === s.id);
    return `${s.id}. [${s.titulo}](#${ancla(s)}) · ${rs[0].id} a ${rs.at(-1).id} (${rs.length})`;
  }),
  ''
];
for (const s of secciones) {
  lineas.push(`## ${s.id}. ${s.titulo}`, '');
  for (const r of reglas.filter((x) => x.seccion === s.id)) {
    lineas.push(
      `### ${r.id} · ${r.titulo}`,
      '',
      `**${r.nivel}** · aplica a: ${r.aplica.join(', ')}`,
      '',
      `**Regla.** ${r.regla}`,
      '',
      `**Por qué.** ${r.porque}`,
      '',
      `**Origen.** ${r.origen.join('; ')} · *${r.tipo}*`,
      '',
      `**Verificación.** ${r.verificacion}`,
      ''
    );
  }
}
const doc01 = lineas.join('\n') + '\n';

/* ---------- Tablas entre marcas ---------- */
function reemplaza(texto, nombre, contenido, ruta) {
  const marca = new RegExp(`(<!-- ${nombre}:inicio -->\\r?\\n)[\\s\\S]*?(<!-- ${nombre}:fin -->)`);
  if (!marca.test(texto)) { console.error(`${ruta} no tiene las marcas <!-- ${nombre}:inicio --> / <!-- ${nombre}:fin -->`); process.exit(1); }
  return texto.replace(marca, (_, a, b) => a + contenido.trim() + '\n' + b);
}
function salidaDe(guion) {
  /* --md siempre escribe la tabla completa; el código de salida dice si todo
     cumple, pero aquí solo se copia la tabla: el veredicto lo da verificar. */
  const r = spawnSync(process.execPath, [resolve(RAIZ, guion), '--md'], { encoding: 'utf8' });
  if (!r.stdout.trim()) { console.error(`${guion} no escribió nada:\n${r.stderr}`); process.exit(1); }
  return r.stdout;
}

const destinos = [[resolve(RAIZ, 'docs/01-reglas.md'), doc01]];

const ruta02 = resolve(RAIZ, 'docs/02-guia-de-estilo.md');
if (existsSync(ruta02)) {
  let t = readFileSync(ruta02, 'utf8');
  t = reemplaza(t, 'contraste', salidaDe('herramientas/contraste.mjs'), ruta02);
  t = reemplaza(t, 'rampas', salidaDe('herramientas/rampas.mjs'), ruta02);
  destinos.push([ruta02, t]);
}

const ruta03 = resolve(RAIZ, 'docs/03-guia-de-decision.md');
if (existsSync(ruta03)) {
  const filas = ['| Aplica a | BASE | RECOMENDADO | OPCIONAL |', '|---|---|---|---|'];
  for (const a of aplica) {
    const de = (n) => reglas.filter((r) => r.aplica.includes(a.id) && r.nivel === n).map((r) => r.id).join(', ') || '—';
    filas.push(`| **${a.id}** · ${a.texto} | ${de('BASE')} | ${de('RECOMENDADO')} | ${de('OPCIONAL')} |`);
  }
  destinos.push([ruta03, reemplaza(readFileSync(ruta03, 'utf8'), 'aplica', filas.join('\n'), ruta03)]);
}

let distinto = 0;
for (const [ruta, contenido] of destinos) {
  const hay = existsSync(ruta) ? readFileSync(ruta, 'utf8') : null;
  if (hay !== contenido) {
    distinto++;
    if (COMPROBAR) console.error(`✗ ${ruta.slice(RAIZ.length + 1)} no está al día`);
    else writeFileSync(ruta, contenido);
  }
}
if (COMPROBAR) { console.log(distinto ? `${distinto} documento(s) desactualizado(s)` : 'documentos generados al día'); process.exit(distinto ? 1 : 0); }
console.log(`✓ ${reglas.length} reglas → docs/01-reglas.md${destinos.length > 1 ? ` · tablas de ${destinos.slice(1).map(([r]) => r.slice(RAIZ.length + 1)).join(' y ')} actualizadas` : ''}`);
