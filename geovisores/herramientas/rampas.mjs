#!/usr/bin/env node
/* =========================================================
   rampas.mjs · Rampas de datos probadas para daltonismo (GEO-68)

   Toma de tokens-mapa.css cada rampa (--rampa-<nombre>-<n>) y la mide tal
   cual y con la simulación de Machado (2009) para protanopia, deuteranopia
   y tritanopia. Criterio de PR: clases vecinas a ΔE ≥ 15 y extremos a
   ΔE ≥ 50 (CIE76). Mide también qué tan lejos queda «sin dato» de la clase
   más parecida (informativo).

   Uso:
     node herramientas/rampas.mjs          # tabla en pantalla
     node herramientas/rampas.mjs --md     # tabla en markdown (para docs)
     node herramientas/rampas.mjs --json
     node herramientas/rampas.mjs '#F9E7BF' '#7F1D12'   # ΔE de un par, en las cuatro visiones

   Código de salida: 0 si todas las rampas cumplen; 1 si alguna no.
   ========================================================= */
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { leeDeclarados, hexDe, deltaE } from './color.mjs';

export const VISIONES = [
  { id: null, nombre: 'visión típica' },
  { id: 'protanopia', nombre: 'protanopia' },
  { id: 'deuteranopia', nombre: 'deuteranopia' },
  { id: 'tritanopia', nombre: 'tritanopia' }
];
export const MIN_VECINAS = 15;
export const MIN_EXTREMOS = 50;

export function leeRampas() {
  const { valores } = leeDeclarados();
  const rampas = new Map();
  for (const nombre of Object.keys(valores)) {
    const m = nombre.match(/^--rampa-([\w-]+?)-(\d+)$/);
    if (!m) continue;
    if (!rampas.has(m[1])) rampas.set(m[1], []);
    rampas.get(m[1]).push({ token: nombre, clase: Number(m[2]), hex: hexDe(valores, nombre) });
  }
  for (const r of rampas.values()) r.sort((a, b) => a.clase - b.clase);
  return { rampas, sinDato: hexDe(valores, '--mapa-sin-dato') };
}

export function mide() {
  const { rampas, sinDato } = leeRampas();
  const salida = [];
  for (const [nombre, clases] of rampas) {
    const visiones = VISIONES.map((v) => {
      const vecinas = clases.slice(1).map((c, i) => deltaE(clases[i].hex, c.hex, v.id));
      const extremos = deltaE(clases[0].hex, clases.at(-1).hex, v.id);
      const sinDatoMin = Math.min(...clases.map((c) => deltaE(sinDato, c.hex, v.id)));
      const minVecinas = Math.min(...vecinas);
      return { vision: v.nombre, vecinas, minVecinas, extremos, sinDatoMin, cumple: minVecinas >= MIN_VECINAS && extremos >= MIN_EXTREMOS };
    });
    salida.push({ nombre, clases, visiones, cumple: visiones.every((v) => v.cumple) });
  }
  return salida;
}

const esPrincipal = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (esPrincipal) {
  const args = process.argv.slice(2);
  if (args.length === 2 && args.every((a) => a.startsWith('#'))) {
    for (const v of VISIONES) console.log(`${v.nombre.padEnd(14)} ΔE ${deltaE(args[0], args[1], v.id).toFixed(1)}`);
    process.exit(0);
  }
  /* --candidata '#E3ECDF,#C3D9BC,…' mide una rampa que todavía no es token
     (para decidir si entra), con el «sin dato» del estándar. */
  const iCand = args.indexOf('--candidata');
  if (iCand >= 0) {
    const colores = (args[iCand + 1] || '').split(',').map((s) => s.trim()).filter(Boolean);
    if (colores.length < 2) { console.error('--candidata necesita dos colores o más, separados por comas'); process.exit(1); }
    const sinDato = leeRampas().sinDato;
    let falla = false;
    console.log(`candidata: ${colores.join(' ')}`);
    for (const v of VISIONES) {
      const vecinas = colores.slice(1).map((c, i) => deltaE(colores[i], c, v.id));
      const extremos = deltaE(colores[0], colores.at(-1), v.id);
      const sd = Math.min(...colores.map((c) => deltaE(sinDato, c, v.id)));
      const ok = Math.min(...vecinas) >= MIN_VECINAS && extremos >= MIN_EXTREMOS;
      falla ||= !ok;
      console.log(`  ${v.nombre.padEnd(14)} vecinas ${vecinas.map((d) => d.toFixed(1).padStart(5)).join(' ')}  extremos ${extremos.toFixed(1).padStart(5)}  sin dato ${sd.toFixed(1).padStart(5)}  ${ok ? 'cumple' : 'FALLA'}`);
    }
    process.exit(falla ? 1 : 0);
  }
  const rampas = mide();
  const fallan = rampas.filter((r) => !r.cumple);
  if (args.includes('--json')) console.log(JSON.stringify(rampas, null, 2));
  else if (args.includes('--md')) {
    console.log(`| Rampa | Visión | ΔE entre vecinas (1→2 … 4→5) | Mínimo entre vecinas (≥ ${MIN_VECINAS}) | Extremos (≥ ${MIN_EXTREMOS}) | «Sin dato» a la clase más parecida | Resultado |\n|---|---|---|---|---|---|---|`);
    for (const r of rampas) for (const v of r.visiones)
      console.log(`| ${r.nombre} | ${v.vision} | ${v.vecinas.map((d) => d.toFixed(1)).join(' · ')} | ${v.minVecinas.toFixed(1)} | ${v.extremos.toFixed(1)} | ${v.sinDatoMin.toFixed(1)} | ${v.cumple ? 'cumple' : '**NO CUMPLE**'} |`);
  } else {
    for (const r of rampas) {
      console.log(`\n${r.nombre}: ${r.clases.map((c) => c.hex).join(' ')}`);
      for (const v of r.visiones) console.log(`  ${v.vision.padEnd(14)} vecinas ${v.vecinas.map((d) => d.toFixed(1).padStart(5)).join(' ')}  mín ${v.minVecinas.toFixed(1).padStart(5)}  extremos ${v.extremos.toFixed(1).padStart(5)}  sin dato ${v.sinDatoMin.toFixed(1).padStart(5)}  ${v.cumple ? 'cumple' : 'FALLA'}`);
    }
    console.log(`\n${fallan.length ? 'FALLA' : 'CORRECTO'} · ${rampas.length} rampas, ${fallan.length} sin cumplir (vecinas ≥ ${MIN_VECINAS}, extremos ≥ ${MIN_EXTREMOS}, ΔE CIE76, Machado 2009)`);
  }
  process.exit(fallan.length ? 1 : 0);
}
