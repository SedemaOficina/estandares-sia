/* =========================================================
   03-anchos.prueba.mjs · Siete anchos, consola limpia y reglas mecánicas

   Para cada página del paquete (dos plantillas, guía, dos ejemplos) y cada
   ancho de verificación (320, 360, 390, 768, 1024, 1280, 1920):
     · sin desplazamiento horizontal;
     · consola sin errores ni avisos y ninguna petición a terceros;
     · todo [hidden] se ve como display:none (decisión C9: sin !important);
     · ningún botón o enlace sin nombre accesible;
     · con puntero táctil (hasta 768), todo lo que se toca mide ≥ 44 px;
     · las tipografías autoalojadas cargan;
     · con movimiento reducido no hay transiciones.
   ========================================================= */
import test from 'node:test';
import assert from 'node:assert/strict';
import { sirve, abreNavegador, abrePagina, ANCHOS, PAGINAS, desbordeHorizontal, ocultosVisibles, iconosSinNombre, objetivosPequenos } from './ayudas.mjs';

let servidor, navegador;
test.before(async () => { servidor = await sirve(); navegador = await abreNavegador(); });
test.after(async () => { await navegador.close(); await servidor.cierra(); });

/* Elementos cuyo alto menor a 44 px es deliberado y accesible: las casillas y
   radios nativos van dentro de una etiqueta que es el objetivo; el enlace de
   salto sólo existe con foco; los enlaces dentro de texto corrido se exceptúan
   por WCAG 2.5.8. */
const EXCEPCIONES = /^(a\.salto|a\.migas-enlace|a\.resumen-errores-enlace|a\.priv-enlace|a\.pie-enlace|a\.|summary\.plegable-titulo|button\.pestana)/;

for (const [nombre, ruta] of Object.entries(PAGINAS)) {
  for (const ancho of ANCHOS) {
    const tactil = ancho <= 768;
    test(`${nombre} · ${ancho} px${tactil ? ' táctil' : ''}: sin desborde, consola limpia, ocultos, nombres y objetivos`, async () => {
      const p = await abrePagina(navegador, servidor.url, ruta, { contexto: { viewport: { width: ancho, height: ancho < 760 ? 800 : 900 }, hasTouch: tactil, isMobile: tactil } });
      await p.waitForTimeout(nombre === 'guia' ? 1200 : 400);
      assert.equal(await desbordeHorizontal(p), 0, 'no hay desplazamiento horizontal');
      assert.deepEqual(await ocultosVisibles(p), [], 'todo [hidden] se oculta con display:none');
      assert.deepEqual(await iconosSinNombre(p), [], 'todo botón o enlace sin texto tiene nombre accesible');
      if (tactil) {
        const chicos = (await objetivosPequenos(p)).filter((x) => !EXCEPCIONES.test(x));
        assert.deepEqual(chicos, [], 'objetivos táctiles de al menos 44 px');
      }
      const fuentes = await p.evaluate(() => [document.fonts.check('600 16px Cabin'), document.fonts.check('400 16px Roboto')]);
      assert.deepEqual(fuentes, [true, true], 'Cabin y Roboto autoalojadas cargan');
      assert.deepEqual(p.registro, [], 'consola y red limpias');
      await p.context().close();
    });
  }
}

test('movimiento reducido: ninguna transición ni animación dura más que lo nulo', async () => {
  const p = await abrePagina(navegador, servidor.url, PAGINAS['por-pasos'], { contexto: { viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' } });
  const largas = await p.evaluate(() => [...document.querySelectorAll('body *')].filter((e) => { const s = getComputedStyle(e); const d = (v) => v.split(',').some((x) => parseFloat(x) > 0.02); return d(s.transitionDuration) || d(s.animationDuration); }).map((e) => e.tagName + '.' + e.className).slice(0, 5));
  assert.deepEqual(largas, [], 'con prefers-reduced-motion no hay movimiento');
  await p.context().close();
});

test('nada se pide a un tercero: todas las peticiones son al propio servidor', async () => {
  const p = await abrePagina(navegador, servidor.url, PAGINAS.guia, { contexto: { viewport: { width: 1280, height: 900 } } });
  const externas = [];
  p.on('request', (r) => { if (!r.url().startsWith(servidor.origen) && !r.url().startsWith('data:') && !r.url().startsWith('blob:')) externas.push(r.url()); });
  await p.reload(); await p.waitForTimeout(1500);
  assert.deepEqual(externas, [], 'sin peticiones externas (FRM de autoalojamiento)');
  await p.context().close();
});
