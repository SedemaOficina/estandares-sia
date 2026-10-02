#!/usr/bin/env node
/* vendor.mjs · Obtiene las bibliotecas de terceros declaradas en vendor.json.
   Por qué existe: copiar archivos a mano de una CDN no deja rastro de versión,
   licencia ni integridad. Aquí cada archivo sale del tarball oficial de npm
   con la versión exacta y queda registrado con su SHA-256.
   Uso: node herramientas/vendor.mjs            (descarga y escribe vendor/)
        node herramientas/vendor.mjs --verificar (sólo comprueba sumas)      */
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DESTINO = join(RAIZ, 'vendor');
const MANIFIESTO = join(DESTINO, 'MANIFIESTO.json');
const config = JSON.parse(readFileSync(join(RAIZ, 'herramientas/vendor.json'), 'utf8'));
const suma = (ruta) => createHash('sha256').update(readFileSync(ruta)).digest('hex');

if (process.argv.includes('--verificar')) {
  const m = JSON.parse(readFileSync(MANIFIESTO, 'utf8'));
  let mal = 0;
  for (const b of m.bibliotecas) for (const a of b.archivos) {
    const ok = existsSync(join(DESTINO, a.ruta)) && suma(join(DESTINO, a.ruta)) === a.sha256;
    if (!ok) { mal++; console.error(`✗ ${a.ruta}: falta o no coincide con el manifiesto`); }
  }
  console.log(mal ? `${mal} archivo(s) con problema` : 'vendor/ coincide con el manifiesto');
  process.exit(mal ? 1 : 0);
}

const trabajo = mkdtempSync(join(tmpdir(), 'vendor-'));
const manifiesto = { generado: new Date().toISOString(), origen: 'registro de npm (tarball oficial)', bibliotecas: [] };
for (const b of config.bibliotecas) {
  const carpeta = join(DESTINO, b.paquete);
  mkdirSync(carpeta, { recursive: true });
  // --json da el nombre exacto del tarball; adivinarlo falla con paquetes con alcance (@x/y).
  const tgz = JSON.parse(execFileSync('npm', ['pack', `${b.paquete}@${b.version}`, '--json'], { cwd: trabajo, encoding: 'utf8' }))[0].filename;
  execFileSync('tar', ['-xzf', join(trabajo, tgz), '-C', trabajo]);
  const pkg = join(trabajo, 'package');
  const real = JSON.parse(readFileSync(join(pkg, 'package.json'), 'utf8'));
  if (real.version !== b.version) throw new Error(`${b.paquete}: se pidió ${b.version} y llegó ${real.version}`);
  const licenciaReal = typeof real.license === 'string' ? real.license : real.license?.type;
  if (licenciaReal !== b.licencia) throw new Error(`${b.paquete}: la licencia declarada (${b.licencia}) no coincide con la del paquete (${licenciaReal})`);
  const archivos = [...b.archivos, b.archivoLicencia].map((rel) => {
    const nombre = rel.split('/').pop();
    cpSync(join(pkg, rel), join(carpeta, nombre));
    return { ruta: `${b.paquete}/${nombre}`, sha256: suma(join(carpeta, nombre)) };
  });
  manifiesto.bibliotecas.push({ paquete: b.paquete, version: b.version, licencia: b.licencia, uso: b.uso, archivos });
  execFileSync('rm', ['-rf', pkg]);
  console.log(`✓ ${b.paquete}@${b.version} (${b.licencia})`);
}
writeFileSync(MANIFIESTO, JSON.stringify(manifiesto, null, 2) + '\n');
console.log(`Manifiesto escrito en ${MANIFIESTO}`);
