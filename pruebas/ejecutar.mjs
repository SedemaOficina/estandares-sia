#!/usr/bin/env node
/* ejecutar.mjs · Corre todas las pruebas del paquete (node:test), en serie:
   todas abren Chromium y un servidor local; en paralelo se pisarían.
   Uso: node pruebas/ejecutar.mjs            (todas)
        node pruebas/ejecutar.mjs --test-name-pattern="pasos"  (filtra) */
import { spawnSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const aqui = dirname(fileURLToPath(import.meta.url));
const archivos = readdirSync(aqui).filter((f) => f.endsWith('.prueba.mjs')).sort().map((f) => resolve(aqui, f));
const r = spawnSync(process.execPath, ['--test', '--test-concurrency=1', ...process.argv.slice(2), ...archivos], { stdio: 'inherit' });
process.exit(r.status ?? 1);
