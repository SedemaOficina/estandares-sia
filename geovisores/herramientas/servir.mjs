#!/usr/bin/env node
/* =========================================================
   servir.mjs · Servidor local del paquete, sin dependencias

   Para ver la guía visual y, desde la fase 2, correr las pruebas. Sirve la
   carpeta común estandares-sia (portada, formularios y geovisores) sin caché y con 256 conexiones en espera (GEO-127:
   http.server de Python deja 5 y rechazaba archivos cuando la página pedía
   decenas a la vez, PL B188–B192). Solo escucha en 127.0.0.1.

   Uso: node herramientas/servir.mjs [puerto]      (8090 por omisión)
   ========================================================= */
import { createServer } from 'node:http';
import { createReadStream, statSync } from 'node:fs';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { RAIZ as RAIZ_GEOVISORES } from './color.mjs';

const RAIZ = resolve(RAIZ_GEOVISORES, '..');

const PUERTO = Number(process.argv[2] || process.env.PORT || 8090);
const TIPOS = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.md': 'text/markdown; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.pdf': 'application/pdf', '.ttf': 'font/ttf', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8'
};

const servidor = createServer((pet, res) => {
  /* Una dirección mal escrita («/%E0%A4%A») se contesta con 400; antes tumbaba el servidor. */
  let ruta;
  try { ruta = decodeURIComponent(new URL(pet.url, 'http://x').pathname); } catch { res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' }); res.end('Dirección mal escrita'); return; }
  if (ruta === '/') { res.writeHead(302, { Location: '/guia-visual/' }); res.end(); return; }
  if (ruta.endsWith('/')) ruta += 'index.html';
  const archivo = normalize(join(RAIZ, ruta));
  if (!archivo.startsWith(RAIZ + sep)) { res.writeHead(403); res.end(); return; }
  let datos;
  try { datos = statSync(archivo); } catch { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); res.end('No existe'); return; }
  if (!datos.isFile()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': TIPOS[extname(archivo).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
  createReadStream(archivo).pipe(res);
});
servidor.listen({ port: PUERTO, host: '127.0.0.1', backlog: 256 }, () => console.log(`Sirviendo ${RAIZ} en http://127.0.0.1:${PUERTO}/`));
