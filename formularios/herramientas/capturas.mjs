#!/usr/bin/env node
/* =========================================================
   capturas.mjs · Evidencia visual en verificacion/capturas/

   «Se ve bien» sin evidencia no es verificación. Cada captura se toma del
   paquete real servido por HTTP, con la consola vigilada: si la consola no
   queda limpia, el guion falla en lugar de entregar la imagen.
   Qué se captura: las dos plantillas en reposo y con errores a 320, 390,
   768 y 1280 px; revisión y acuse; los dos ejemplos a 390 y 1280; la guía
   visual a 390 y 1280 (inicio, fichas, probador, sí y no, ejemplos).
   Uso: node herramientas/capturas.mjs
   ========================================================= */
import { mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { sirve, abreNavegador, abrePagina, PAGINAS, RAIZ, continuar, llenaSolicitud, llenaLugar, llenaContacto, aceptaDeclaraciones, visible, pngRuido } from '../pruebas/ayudas.mjs';

const DESTINO = join(RAIZ, 'verificacion/capturas');
rmSync(DESTINO, { recursive: true, force: true });
mkdirSync(DESTINO, { recursive: true });
const { url, cierra } = await sirve();
const nav = await abreNavegador();
const fallas = [];
let n = 0;
const foto = async (p, nombre, opc = {}) => { const archivo = `${String(++n).padStart(2, '0')}-${nombre}.png`; await p.screenshot({ path: join(DESTINO, archivo), ...opc }); console.log('✓', archivo); };
const cierraPagina = async (p, donde) => { if (p.registro.length) fallas.push(`${donde}: ${p.registro.join(' | ')}`); await p.context().close(); };
const ctx = (ancho) => ({ viewport: { width: ancho, height: ancho < 760 ? 800 : 900 }, hasTouch: ancho <= 768, isMobile: ancho <= 768 });

/* 1. Plantillas en reposo y con errores, cuatro anchos. */
for (const [nombre, ruta] of [['por-pasos', PAGINAS['por-pasos']], ['una-pagina', PAGINAS['una-pagina']]]) {
  for (const ancho of [320, 390, 768, 1280]) {
    const p = await abrePagina(nav, url, ruta, { contexto: ctx(ancho) });
    await foto(p, `${nombre}-${ancho}-reposo`, { fullPage: ancho >= 768 });
    await visible(p, '[data-accion="siguiente"],[data-accion="enviar"]').click();
    await p.waitForTimeout(200);
    await foto(p, `${nombre}-${ancho}-errores`);
    await cierraPagina(p, `${nombre} ${ancho}`);
  }
}

/* 2. Recorrido por pasos en teléfono: lugar con mapa, archivos, revisión, acuse. */
{
  const p = await abrePagina(nav, url, PAGINAS['por-pasos'], { contexto: ctx(390) });
  await llenaSolicitud(p); await continuar(p); await llenaLugar(p);
  await p.locator('[data-mapa]').tap(); await p.waitForTimeout(150);
  await foto(p, 'por-pasos-390-lugar-mapa', { fullPage: true });
  await p.click('[data-mapa-confirmar]'); await continuar(p);
  await p.setInputFiles('[data-archivos] input[type="file"]:not([data-entrada-camara])', [{ name: 'foto.png', mimeType: 'image/png', buffer: pngRuido(400, 300) }, { name: 'video.mov', mimeType: 'video/quicktime', buffer: Buffer.from('x') }]);
  await p.waitForTimeout(900);
  await llenaContacto(p);
  await foto(p, 'por-pasos-390-archivos-contacto', { fullPage: true });
  await continuar(p);
  await foto(p, 'por-pasos-390-revision', { fullPage: true });
  await p.click('[data-abre-dialogo]'); await p.waitForTimeout(150);
  await foto(p, 'por-pasos-390-privacidad');
  await p.keyboard.press('Escape');
  await aceptaDeclaraciones(p);
  await visible(p, '[data-accion="enviar"]').click(); await p.waitForTimeout(900);
  await foto(p, 'por-pasos-390-acuse', { fullPage: true });
  await cierraPagina(p, 'recorrido 390');
}

/* 3. Ejemplos. */
for (const [nombre, ruta] of [['encuesta', PAGINAS.encuesta], ['captura-interna', PAGINAS['captura-interna']]]) {
  for (const ancho of [390, 1280]) {
    const p = await abrePagina(nav, url, ruta, { contexto: ctx(ancho) });
    await p.waitForTimeout(300);
    await foto(p, `${nombre}-${ancho}`, { fullPage: true });
    await cierraPagina(p, `${nombre} ${ancho}`);
  }
}

/* 4. Guía visual. */
for (const ancho of [390, 1280]) {
  const p = await abrePagina(nav, url, PAGINAS.guia, { contexto: ctx(ancho) });
  await p.waitForTimeout(1200);
  for (const [id, nombre] of [['inicio', 'inicio-arbol'], ['fundamentos', 'fundamentos'], ['n-campo', 'ficha-nucleo-campo'], ['m-opciones', 'ficha-modulo-opciones'], ['m-mapa', 'ficha-modulo-mapa'], ['validaciones', 'probador'], ['pares', 'si-y-no'], ['ejemplos', 'ejemplos']]) {
    await p.locator(`#${id}`).scrollIntoViewIfNeeded(); await p.waitForTimeout(250);
    await foto(p, `guia-${ancho}-${nombre}`);
  }
  await cierraPagina(p, `guía ${ancho}`);
}

await nav.close(); await cierra();
if (fallas.length) { console.error('\nConsola no limpia:\n' + fallas.join('\n')); process.exit(1); }
console.log(`\n${n} capturas en verificacion/capturas/`);
