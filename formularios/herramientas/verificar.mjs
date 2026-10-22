#!/usr/bin/env node
/* =========================================================
   verificar.mjs · Una sola orden para todas las comprobaciones

   Corre, de la más barata a la más cara, todo lo que el paquete sabe
   comprobar por sí mismo, y resume al final (no se detiene en la primera
   falla: se quiere ver todo lo que está mal de una vez):
     1. auditor de CSS (A01–A16)            2. contraste de todos los pares
     3. auditoría de campos                 4. bibliotecas contra su manifiesto y sus rodeos registrados
     5. documentos generados al día         6. derivados al día (manifiesto, dist, esquemas, artefacto):
                                               no los reescribe; si alguno se atrasó, falla y dice cuál
     7. presupuesto de peso de las plantillas en producción y pruebas en navegador
        (dos perfiles, siete anchos, axe-core), salvo --sin-pruebas
   Nada de esto escribe en el paquete: lo derivado se rehace con construir.mjs.
   En cada versión, además: npm run presupuesto (tiempos con red lenta) y
   npm run mutaciones (que las pruebas detecten lo que dicen proteger).
   Lo que NO puede comprobar y queda para personas está al final de la
   salida y en docs/08-verificacion-y-cierre.md.
   Uso: node herramientas/verificar.mjs [--sin-pruebas]
   ========================================================= */
import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SIN_PRUEBAS = process.argv.includes('--sin-pruebas');
const resultados = [];
const paso = (nombre, ok, detalle = '') => { resultados.push({ nombre, ok }); console.log(`${ok ? '✓' : '✗'} ${nombre}${detalle ? ` · ${detalle}` : ''}`); };

function externa(nombre, args, { ultimas = 25 } = {}) {
  const inicio = Date.now();
  const r = spawnSync(process.execPath, args, { cwd: RAIZ, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  const salida = (r.stdout + r.stderr).trim().split('\n').filter(Boolean);
  /* El resumen de node:test: «# pass 12» en TAP, «ℹ pass 12» en el formato de Node 23 en adelante. */
  const conteo = salida.map((l) => /^(?:#|ℹ) (tests|pass|fail) (\d+)/.exec(l)).filter(Boolean).map((m) => `${m[2]} ${{ tests: 'pruebas', pass: 'pasan', fail: 'fallan' }[m[1]]}`).join(' · ');
  paso(nombre, r.status === 0, `${conteo || (salida.at(-1) ?? '')} · ${((Date.now() - inicio) / 1000).toFixed(1)} s`);
  if (r.status !== 0) console.log(salida.filter((l) => !/agent-proxy|^- |^For details/.test(l)).slice(-ultimas).map((l) => '    ' + l).join('\n'));
}

externa('Auditor de CSS (A01–A16)', ['herramientas/auditor-css.mjs']);
externa('Contraste de todos los pares', ['herramientas/contraste.mjs']);
externa('Auditoría de campos (uso, finalidad, autocomplete, sensible, teclado)', ['herramientas/auditar-campos.mjs']);
externa('Bibliotecas coinciden con vendor/MANIFIESTO.json', ['herramientas/vendor.mjs', '--verificar']);
externa('Rodeos de las bibliotecas registrados en docs/07', ['herramientas/rodeos.mjs']);
externa('Documentos generados al día (01-reglas, tabla de contraste)', ['herramientas/generar-reglas.mjs', '--comprobar']);
externa('Derivados al día, sin reescribirlos (iconos, manifiesto, dist, esquemas, catálogo 04, artefacto)', ['herramientas/construir.mjs', '--comprobar']);
if (!SIN_PRUEBAS) {
  externa('Presupuesto de las plantillas en producción (≤ 300 KB y ≤ 20 archivos; los tiempos, con npm run presupuesto)', ['herramientas/presupuesto.mjs', '--sin-tiempos']);
  externa('Pruebas en navegador: flujos en dos perfiles, siete anchos, módulos, axe-core, servidor', ['pruebas/ejecutar.mjs'], { ultimas: 60 });
} else paso('Presupuesto y pruebas en navegador', true, 'omitidos (--sin-pruebas)');

const fallas = resultados.filter((r) => !r.ok);
console.log('');
console.log(fallas.length ? `FALLA · ${fallas.length} comprobación(es) con problemas: ${fallas.map((f) => f.nombre).join('; ')}` : `CORRECTO · ${resultados.length} comprobaciones en verde`);
console.log('');
console.log('Lo que esta orden no puede comprobar y queda para personas (docs/08-verificacion-y-cierre.md):');
console.log('  · recorrido completo con teclado y con lector de pantalla real (NVDA, VoiceOver, TalkBack);');
console.log('  · un iPhone y un Android reales, con red limitada, en los formularios finales;');
console.log('  · Firefox y Safari (aquí sólo Chromium);');
console.log('  · el mapa base con el proveedor que se decida; el catálogo oficial de alcaldías y colonias;');
console.log('  · las citas normativas del aviso de privacidad y la estructura de CURP y RFC con su emisor;');
console.log('  · la casilla «Verificado en móvil y en escritorio» del cierre de bloque.');
process.exit(fallas.length ? 1 : 0);
