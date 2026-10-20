#!/usr/bin/env node
/* =========================================================
   secretos.mjs · Que no se publique una llave ni un respaldo

   El repositorio es público. Revisa lo que ya está guardado en Git y lo
   que entraría con un «git add» (archivos sin guardar que Git no ignora):
     · por nombre: llaves, archivos de entorno, respaldos y restos del
       sistema, aunque el .gitignore de este equipo no los cubra;
     · por contenido: llaves privadas y fichas de acceso de los servicios
       más comunes, y asignaciones de contraseñas o llaves con un valor.
   Las bibliotecas de terceros (vendor/) se revisan sólo por nombre.

   Uso: node herramientas/secretos.mjs        (lo corre npm run verificar)
   ========================================================= */
import { execFileSync } from 'node:child_process';
import { readFileSync, statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const git = (...a) => execFileSync('git', a, { cwd: RAIZ, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });

const NOMBRES = /(^|\/)(\.env(\..+)?|.+\.(pem|key|p12|pfx|orig|bak)|id_(rsa|ed25519|ecdsa)[^/]*|.+\.local\.json|~\$[^/]*|npm-debug\.log[^/]*|\.DS_Store|Thumbs\.db)$/i;
const CONTENIDO = [
  ['llave privada', /-----BEGIN (RSA |EC |DSA |OPENSSH |ENCRYPTED )?PRIVATE KEY-----/],
  ['llave de AWS', /\bAKIA[0-9A-Z]{16}\b/],
  ['llave de Google', /\bAIza[0-9A-Za-z_-]{35}\b/],
  ['ficha de GitHub', /\bgh[pousr]_[A-Za-z0-9]{36,}\b/],
  ['ficha de Slack', /\bxox[abprs]-[A-Za-z0-9-]{10,}\b/],
  ['llave de pago', /\b(sk|rk)_live_[0-9A-Za-z]{20,}\b/],
  ['contraseña o llave escrita', /\b(api[_-]?key|secret|client[_-]?secret|password|passwd|token)\b["']?\s*[:=]\s*["'][A-Za-z0-9+/_\-]{16,}["']/i]
];

const guardados = git('ls-files', '-z').split('\0').filter(Boolean);
const porGuardar = git('ls-files', '-z', '--others', '--exclude-standard').split('\0').filter(Boolean);
const hallazgos = [];
for (const [lista, donde] of [[guardados, 'guardado'], [porGuardar, 'sin guardar, entraría con git add']]) {
  for (const f of lista) {
    if (NOMBRES.test(f)) { hallazgos.push(`${f} (${donde}): el nombre es de una llave, un archivo de entorno o un respaldo`); continue; }
    if (/(^|\/)vendor\//.test(f)) continue;
    let tam = 0;
    try { tam = statSync(resolve(RAIZ, f)).size; } catch (e) { continue; }
    if (tam > 4 * 1024 * 1024) continue;
    const t = readFileSync(resolve(RAIZ, f));
    if (t.includes(0)) continue;
    const texto = t.toString('utf8');
    for (const [que, re] of CONTENIDO) if (re.test(texto)) hallazgos.push(`${f} (${donde}): parece contener una ${que}`);
  }
}
for (const h of hallazgos) console.log(`✗ ${h}`);
console.log(hallazgos.length ? `FALLA · ${hallazgos.length} archivo(s) que no deben publicarse` : `CORRECTO · ${guardados.length + porGuardar.length} archivos revisados, ninguno con llaves ni secretos`);
process.exitCode = hallazgos.length ? 1 : 0;
