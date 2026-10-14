#!/usr/bin/env node
/* =========================================================
   contraste.mjs · Contraste de los colores del mapa (GEO-69)

   Adaptado de la calculadora de formularios: lee los valores de tokens.css
   de formularios, tokens-mapa.css y temas.css (resolviendo cada var()) y mide
   cada par de pares-contraste.json con la fórmula de WCAG 2.2. Un par con
   «tema» se mide con ese bloque [data-tema] aplicado.

   Uso:
     node herramientas/contraste.mjs            # tabla en pantalla
     node herramientas/contraste.mjs --md       # tabla en markdown (para docs)
     node herramientas/contraste.mjs --json     # salida de máquina
     node herramientas/contraste.mjs --guia     # escribe guia-visual/pares.js
     node herramientas/contraste.mjs '#1A56A8' '#173B2E'   # un par suelto

   Código de salida: 0 si todo par exigido cumple o está marcado como
   pendiente de decisión; 1 si alguno falla sin marca, o si un pendiente ya
   cumple (hay que quitarle la marca).
   ========================================================= */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { RAIZ, leeDeclarados, hexDe, ratio } from './color.mjs';

export function leePares() {
  return JSON.parse(readFileSync(resolve(RAIZ, 'herramientas/pares-contraste.json'), 'utf8')).pares;
}

export function mide() {
  const porTema = new Map();
  const valoresDe = (tema) => { const k = tema || ''; if (!porTema.has(k)) porTema.set(k, leeDeclarados(tema).valores); return porTema.get(k); };
  return leePares().map((p) => {
    const v = valoresDe(p.tema);
    const textoHex = hexDe(v, p.texto); const fondoHex = hexDe(v, p.fondo);
    const r = ratio(textoHex, fondoHex);
    const cumple = p.minimo === null ? null : r >= p.minimo;
    let estado = cumple === null ? 'informativo' : cumple ? 'cumple' : 'falla';
    if (p.pendiente) estado = cumple ? 'pendiente que ya cumple' : 'pendiente';
    return { ...p, textoHex, fondoHex, ratio: r, cumple, estado };
  });
}

const ETIQUETA = { cumple: 'cumple', falla: '**NO CUMPLE**', informativo: 'informativo', pendiente: '**pendiente de decisión**', 'pendiente que ya cumple': '**pendiente que ya cumple**' };

const esPrincipal = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (esPrincipal) {
  const args = process.argv.slice(2);
  if (args.length === 2 && args.every((a) => a.startsWith('#'))) {
    console.log(`${ratio(args[0], args[1]).toFixed(2)}:1`);
    process.exit(0);
  }
  if (args.includes('--guia')) {
    /* La guía abre también desde archivo local, donde el navegador no deja
       leer un JSON: se le entrega la lista como script. Las razones las
       calcula la guía con los colores que lee de la hoja cargada. */
    const pares = leePares();
    writeFileSync(resolve(RAIZ, 'guia-visual/pares.js'), `/* Generado por herramientas/contraste.mjs --guia desde pares-contraste.json. No se edita a mano. */\nwindow.GUIA_PARES = ${JSON.stringify(pares, null, 1)};\n`);
    console.log(`guia-visual/pares.js escrito: ${pares.length} pares`);
    process.exit(0);
  }
  const filas = mide();
  const fallan = filas.filter((f) => f.estado === 'falla' || f.estado === 'pendiente que ya cumple');
  const pendientes = filas.filter((f) => f.estado === 'pendiente');
  if (args.includes('--json')) console.log(JSON.stringify(filas, null, 2));
  else if (args.includes('--md')) {
    console.log('| Id | Tema | Primer plano | Fondo | Razón | Mínimo | Resultado | Dónde |\n|---|---|---|---|---|---|---|---|');
    for (const f of filas) console.log(`| ${f.id} | ${f.tema || 'institucional'} | \`${f.texto}\` ${f.textoHex} | \`${f.fondo}\` ${f.fondoHex} | ${f.ratio.toFixed(2)}:1 | ${f.minimo === null ? '—' : `${f.minimo}:1`} | ${ETIQUETA[f.estado]} | ${f.donde}${f.pendiente ? ` · *${f.pendiente}*` : ''} |`);
  } else {
    for (const f of filas) console.log(`${f.id}  ${f.ratio.toFixed(2).padStart(5)}:1  mín ${f.minimo === null ? ' — ' : f.minimo.toFixed(1)}  ${f.estado.padEnd(11)}  ${f.tema ? `[${f.tema}] ` : ''}${f.texto} sobre ${f.fondo} · ${f.donde}`);
    console.log(`\n${fallan.length ? 'FALLA' : 'CORRECTO'} · ${filas.length} pares, ${fallan.length} sin cumplir, ${pendientes.length} pendiente(s) de decisión`);
  }
  process.exit(fallan.length ? 1 : 0);
}
