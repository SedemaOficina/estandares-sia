#!/usr/bin/env node
/* generar-reglas.mjs · Escribe docs/01-reglas.md desde reglas/reglas.json y
   actualiza la tabla de contraste de docs/02-guia-de-estilo.md y la lista
   guia-visual/pares.js desde contraste.mjs. Por qué: un documento escrito a mano y la regla que describe
   se desacuerdan; aquí hay una sola fuente y el documento es su reflejo.
   Uso: node herramientas/generar-reglas.mjs            (escribe)
        node herramientas/generar-reglas.mjs --comprobar (falla si hay diferencias) */
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { textoParesGuia } from './contraste.mjs';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const COMPROBAR = process.argv.includes('--comprobar');
const { secciones, reglas } = JSON.parse(readFileSync(resolve(RAIZ, 'reglas/reglas.json'), 'utf8'));

const CAMPOS = ['id', 'seccion', 'titulo', 'regla', 'porque', 'nivel', 'origen', 'tipo', 'verificacion'];
const TIPOS = ['decisión heredada', 'decisión del encargo', 'mejor práctica adicional'];
const NIVELES = ['BASE', 'RECOMENDADO', 'OPCIONAL'];
/* «FRM-34 a FRM-41, FRM-82 a FRM-84»: los tramos seguidos de una sección. */
const rangos = (rs) => {
  const tramos = [];
  for (const r of rs) {
    const n = Number(r.id.slice(4));
    const ultimo = tramos.at(-1);
    if (ultimo && n === ultimo.hasta + 1) ultimo.hasta = n; else tramos.push({ desde: n, hasta: n });
  }
  const id = (n) => `FRM-${String(n).padStart(2, '0')}`;
  return tramos.map((t) => (t.desde === t.hasta ? id(t.desde) : `${id(t.desde)} a ${id(t.hasta)}`)).join(', ');
};
const errores = [];
const ids = new Set();
for (const r of reglas) {
  for (const c of CAMPOS) if (r[c] === undefined || r[c] === '' || (Array.isArray(r[c]) && !r[c].length)) errores.push(`${r.id}: falta «${c}»`);
  if (ids.has(r.id)) errores.push(`${r.id}: identificador repetido`);
  ids.add(r.id);
  if (!TIPOS.includes(r.tipo)) errores.push(`${r.id}: tipo «${r.tipo}» no admitido`);
  if (!secciones.some((s) => s.id === r.seccion)) errores.push(`${r.id}: sección ${r.seccion} no existe`);
  if (!NIVELES.includes(r.nivel)) errores.push(`${r.id}: nivel «${r.nivel}» no admitido`);
  if (r.tipo === TIPOS[0] && !r.origen.some((o) => /^(A|B) FRM-/.test(o))) errores.push(`${r.id}: una decisión heredada debe citar una regla de A o de B`);
  if (r.tipo === TIPOS[1] && !r.origen.some((o) => /^(encargo|C\d+)/.test(o))) errores.push(`${r.id}: una decisión del encargo debe citar su sección o el conflicto Cn`);
  if (!/^FRM-\d{2}$/.test(r.id)) errores.push(`${r.id}: identificador fuera de la numeración corrida FRM-NN`);
}
reglas.forEach((r, i) => { if (r.id !== `FRM-${String(i + 1).padStart(2, '0')}`) errores.push(`${r.id}: la numeración debe ser corrida (se esperaba FRM-${String(i + 1).padStart(2, '0')})`); });
if (errores.length) { console.error(errores.join('\n')); process.exit(1); }

const cuenta = (campo, valor) => reglas.filter((r) => r[campo] === valor).length;
const lineas = [
  '# 01 · Reglas del estándar de formularios del SIA',
  '',
  '> Este documento se **genera** de `reglas/reglas.json` (`node herramientas/generar-reglas.mjs`). No se edita a mano: se corrige la regla en el JSON y se vuelve a generar.',
  '',
  `El estándar tiene **${reglas.length} reglas** con numeración corrida FRM-NN (decisión C13). Por nivel de exigencia: **${cuenta('nivel', 'BASE')} BASE** (obligatorias en todo formulario), **${cuenta('nivel', 'RECOMENDADO')} RECOMENDADAS** (se cumplen salvo justificación escrita) y **${cuenta('nivel', 'OPCIONAL')} OPCIONALES** (aplican si el formulario usa la pieza). Por origen: ${cuenta('tipo', TIPOS[0])} son decisiones heredadas de los paquetes A (Denuncias Ambientales) o B, ${cuenta('tipo', TIPOS[1])} las fija el encargo del estándar genérico y ${cuenta('tipo', TIPOS[2])} son mejores prácticas adicionales.`,
  '',
  '**Cómo leer cada regla.** *Regla*: qué se hace. *Por qué*: el daño que evita. *Nivel*: BASE, RECOMENDADO u OPCIONAL (quien programa elige los módulos, no el nivel). *Origen*: `A FRM-xx` regla del paquete A; `B FRM-XXX-xx` regla del paquete B; `Cn` conflicto decidido en la fase 0 (ver `docs/09-trazabilidad.md`); `encargo n` sección del encargo; `norma n` norma de construcción de sistemas. *Verificación*: la prueba, herramienta o revisión que la comprueba.',
  '',
  '## Índice',
  '',
  /* Las reglas nuevas se suman al final de la numeración, así que una sección puede tener tramos sueltos. */
  ...secciones.map((s) => {
    const rs = reglas.filter((r) => r.seccion === s.id);
    /* Ancla como la arma GitHub: minúsculas, sin puntuación, con acentos, cada espacio un guion. */
    return `${s.id}. [${s.titulo}](#${s.id}-${s.titulo.toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, '').trim().replace(/\s/g, '-')}) · ${rangos(rs)}`;
  }),
  '',
  '## Resumen por nivel',
  '',
  ...NIVELES.map((n) => `- **${n}**: ${reglas.filter((r) => r.nivel === n).map((r) => r.id).join(', ')}`),
  ''
];
for (const s of secciones) {
  lineas.push(`## ${s.id}. ${s.titulo}`, '');
  for (const r of reglas.filter((x) => x.seccion === s.id)) {
    lineas.push(
      `### ${r.id} · ${r.titulo}`,
      '',
      `**Regla.** ${r.regla}`,
      '',
      `**Por qué.** ${r.porque}`,
      '',
      `**Nivel.** ${r.nivel} · **Origen.** ${r.origen.join('; ')} · *${r.tipo}*`,
      '',
      `**Verificación.** ${r.verificacion}`,
      ''
    );
  }
}
const salida = lineas.join('\n');

/* Tabla de contraste del documento 02: se reemplaza lo que haya entre marcas. */
const rutaGuia = resolve(RAIZ, 'docs/02-guia-de-estilo.md');
let guia = null;
if (existsSync(rutaGuia)) {
  const r = spawnSync(process.execPath, [resolve(RAIZ, 'herramientas/contraste.mjs'), '--md'], { encoding: 'utf8' });
  if (r.status !== 0) { console.error('contraste.mjs falló:\n' + r.stdout + r.stderr); process.exit(1); }
  const actual = readFileSync(rutaGuia, 'utf8');
  const marca = /(<!-- contraste:inicio -->\n)[\s\S]*?(\n<!-- contraste:fin -->)/;
  if (!marca.test(actual)) { console.error('docs/02-guia-de-estilo.md no tiene las marcas <!-- contraste:inicio --> / <!-- contraste:fin -->'); process.exit(1); }
  guia = actual.replace(marca, (_, a, b) => a + r.stdout.trim() + b);
}

const destinos = [[resolve(RAIZ, 'docs/01-reglas.md'), salida + '\n']];
if (guia !== null) destinos.push([rutaGuia, guia]);
/* La lista de pares que lee la guía visual sale del mismo archivo que la tabla. */
destinos.push([resolve(RAIZ, 'guia-visual/pares.js'), textoParesGuia()]);
let distinto = 0;
for (const [ruta, contenido] of destinos) {
  const hay = existsSync(ruta) ? readFileSync(ruta, 'utf8') : null;
  if (hay !== contenido) {
    distinto++;
    if (COMPROBAR) console.error(`✗ ${relative(RAIZ, ruta)} no está al día`);
    else writeFileSync(ruta, contenido);
  }
}
if (COMPROBAR) { console.log(distinto ? `${distinto} documento(s) desactualizado(s)` : 'documentos generados al día'); process.exit(distinto ? 1 : 0); }
console.log(`✓ ${reglas.length} reglas → docs/01-reglas.md${guia !== null ? ' · tabla de contraste actualizada' : ''}`);
