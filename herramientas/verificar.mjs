#!/usr/bin/env node
/* =========================================================
   verificar.mjs · Una orden, una señal, para los dos estándares

   Corre las comprobaciones de geovisores y las de formularios que no
   necesitan instalar nada, más la portada común, y da un solo veredicto
   por el código de salida. Lo que no corre cuenta como falla.

   De formularios revisa, sin escribir nada, que lo derivado (dist,
   esquemas, artefacto) esté al día; sus pruebas en navegador (necesitan
   npm install) se corren dentro de formularios/ con npm run verificar.
   Las dos corren solas en GitHub con cada subida y antes de cada commit
   con el gancho de .githooks (npm run gancho, una vez por copia).

   Uso: node herramientas/verificar.mjs        (o npm run verificar)
   ========================================================= */
import { spawnSync, execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const resultados = [];

function corre(nombre, carpeta, args) {
  let ok = false; let detalle = '';
  try {
    const r = spawnSync(process.execPath, args, { cwd: resolve(RAIZ, carpeta), encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
    if (r.error) throw r.error;
    ok = r.status === 0;
    detalle = (r.stdout.trim().split('\n').at(-1) || r.stderr.trim().split('\n').at(-1) || '').trim();
    if (!ok) console.log((r.stdout + r.stderr).trim().split('\n').slice(-15).map((l) => '    ' + l).join('\n'));
  } catch (e) { detalle = `no corrió: ${e.message}`; }
  resultados.push({ nombre, ok });
  console.log(`${ok ? '✓' : '✗'} ${nombre}${detalle ? ` · ${detalle}` : ''}`);
}

console.log('— Geovisores —');
corre('Geovisores: verificación completa', 'geovisores', ['herramientas/verificar.mjs']);

console.log('— Formularios (sin pruebas en navegador) —');
corre('Formularios: auditor de CSS', 'formularios', ['herramientas/auditor-css.mjs']);
corre('Formularios: contraste', 'formularios', ['herramientas/contraste.mjs']);
corre('Formularios: auditoría de campos', 'formularios', ['herramientas/auditar-campos.mjs']);
corre('Formularios: bibliotecas contra su manifiesto', 'formularios', ['herramientas/vendor.mjs', '--verificar']);
corre('Formularios: rodeos de las bibliotecas registrados', 'formularios', ['herramientas/rodeos.mjs']);
corre('Formularios: documentos generados al día', 'formularios', ['herramientas/generar-reglas.mjs', '--comprobar']);
corre('Formularios: derivados al día (dist, esquemas, artefacto)', 'formularios', ['herramientas/construir.mjs', '--comprobar']);

console.log('— Portada común —');
const faltan = ['guia-visual/index.html', 'guia-visual/portada.css', 'guia-visual/portada.js', 'guia-visual/pendientes.css', 'guia-visual/pendientes.js'].filter((f) => !existsSync(resolve(RAIZ, f)));
resultados.push({ nombre: 'Portada: archivos', ok: !faltan.length });
console.log(`${faltan.length ? '✗' : '✓'} Portada: archivos${faltan.length ? ` · faltan ${faltan.join(', ')}` : ''}`);
corre('Portada: sintaxis del guion', '.', ['--check', 'guia-visual/portada.js']);
corre('Pendientes: sintaxis de la lista', '.', ['--check', 'guia-visual/pendientes.js']);

console.log('— Repositorio público —');
corre('Secretos y archivos que no deben subir', '.', ['herramientas/secretos.mjs']);

const fallan = resultados.filter((r) => !r.ok);
console.log(`\n${fallan.length ? 'FALLA' : 'CORRECTO'} · ${resultados.length} comprobaciones, ${fallan.length} con falla`);
console.log('Pendiente fuera de esta orden: en formularios/, «npm install» y «npm run verificar» (pruebas en navegador).');
/* El gancho que corre todo esto antes de cada commit se activa una vez por copia. */
let gancho = '';
try { gancho = execFileSync('git', ['config', 'core.hooksPath'], { cwd: RAIZ, encoding: 'utf8' }).trim(); } catch { gancho = ''; }
if (gancho !== '.githooks' && !process.env.CI) console.log('Aviso: el gancho de antes de guardar no está activo en esta copia; actívalo con «npm run gancho».');
process.exit(fallan.length ? 1 : 0);
