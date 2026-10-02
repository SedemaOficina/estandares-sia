/* =========================================================
   05-accesibilidad.prueba.mjs · Auditoría con axe-core (WCAG 2.2 AA)

   axe-core detecta lo que una máquina puede detectar: etiquetas ausentes,
   roles mal usados, contraste, nombres de botones, identificadores
   duplicados. NO sustituye la prueba con teclado y lector de pantalla real
   (docs/08-verificacion-y-cierre.md); la complementa.

   Se corre sobre la plantilla por pasos en cada estado que cambia el árbol
   de accesibilidad (reposo, errores, archivos, revisión, diálogo, acuse),
   sobre la plantilla de una página, los dos ejemplos, la guía completa y
   el artefacto autocontenido, en teléfono y en escritorio.
   ========================================================= */
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { sirve, abreNavegador, abrePagina, abrePlantilla, PERFILES, PAGINAS, RAIZ, continuar, llenaSolicitud, llenaLugar, llenaContacto, aceptaDeclaraciones, visible, pngRuido } from './ayudas.mjs';

const RUTA_AXE = resolve(RAIZ, 'vendor/axe-core/axe.min.js');
const ETIQUETAS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'];
/* Reglas que no aplican a páginas de muestra: la guía repite a propósito los
   mismos id de región en demos independientes (cada formulario es una
   instancia) y «region» exige que todo contenido esté en un landmark, lo que
   las plantillas cumplen pero la guía, con decenas de muestras, documenta aparte. */
const DESACTIVADAS_GUIA = ['region', 'landmark-unique', 'duplicate-id-aria', 'duplicate-id'];

let servidor, navegador;
test.before(async () => { servidor = await sirve(); navegador = await abreNavegador(); });
test.after(async () => { await navegador.close(); await servidor.cierra(); });

async function axe(p, { desactivadas = [] } = {}) {
  if (!(await p.evaluate(() => !!window.axe))) await p.addScriptTag({ path: RUTA_AXE });
  return p.evaluate(async ({ etiquetas, desactivadas }) => {
    const res = await window.axe.run(document, { runOnly: { type: 'tag', values: etiquetas }, rules: Object.fromEntries(desactivadas.map((r) => [r, { enabled: false }])) });
    return { violaciones: res.violations.map((v) => ({ id: v.id, impacto: v.impact, ayuda: v.help, nodos: v.nodes.slice(0, 4).map((n) => n.target.join(' ') + ' → ' + (n.failureSummary || '').split('\n').slice(0, 2).join(' | ')) })), version: window.axe.version, pasaron: res.passes.length };
  }, { etiquetas: ETIQUETAS, desactivadas });
}
const sinViolaciones = (r, donde) => assert.deepEqual(r.violaciones, [], `${donde}: ${JSON.stringify(r.violaciones, null, 1)}`);

test('axe-core: versión fijada por el paquete (vendor/MANIFIESTO.json)', async () => {
  const p = await abrePlantilla(navegador, servidor.url);
  const r = await axe(p);
  assert.equal(r.version, '4.13.0');
  assert.ok(r.pasaron > 20);
  await p.context().close();
});

for (const perfil of Object.values(PERFILES)) {
  test(`plantilla por pasos · ${perfil.nombre}: reposo, errores, lugar, archivos, contacto, revisión, diálogo y acuse`, async () => {
    const p = await abrePlantilla(navegador, servidor.url, { contexto: perfil.contexto });
    sinViolaciones(await axe(p), 'paso 1 en reposo');
    await continuar(p);
    sinViolaciones(await axe(p), 'paso 1 con errores y resumen');
    await llenaSolicitud(p); await continuar(p);
    await llenaLugar(p);
    sinViolaciones(await axe(p), 'paso 2 con cascada y mapa');
    await p.locator('[data-mapa]').click(); await p.waitForTimeout(100); await p.click('[data-mapa-confirmar]');
    await continuar(p);
    await p.setInputFiles('[data-archivos] input[type="file"]:not([data-entrada-camara])', [{ name: 'foto.png', mimeType: 'image/png', buffer: pngRuido(400, 300) }, { name: 'video.mov', mimeType: 'video/quicktime', buffer: Buffer.from('x') }]);
    await p.waitForTimeout(900);
    await llenaContacto(p);
    sinViolaciones(await axe(p), 'paso 3 con archivos (uno rechazado) y contacto');
    await continuar(p);
    sinViolaciones(await axe(p), 'paso 4 revisión');
    await p.click('[data-abre-dialogo]'); await p.waitForTimeout(100);
    sinViolaciones(await axe(p), 'diálogo de privacidad abierto');
    await p.keyboard.press('Escape');
    await aceptaDeclaraciones(p);
    await visible(p, '[data-accion="enviar"]').click(); await p.waitForTimeout(900);
    assert.ok(await p.locator('[data-acuse]').isVisible());
    sinViolaciones(await axe(p), 'acuse');
    await p.context().close();
  });

  test(`una página, encuesta y captura interna · ${perfil.nombre}`, async () => {
    for (const ruta of [PAGINAS['una-pagina'], PAGINAS.encuesta, PAGINAS['captura-interna']]) {
      const p = await abrePagina(navegador, servidor.url, ruta, { contexto: perfil.contexto });
      sinViolaciones(await axe(p), `${ruta} en reposo`);
      const enviar = visible(p, '[data-accion="enviar"]');
      if (await enviar.count()) { await enviar.click(); await p.waitForTimeout(200); sinViolaciones(await axe(p), `${ruta} con errores`); }
      await p.context().close();
    }
  });

  test(`guía visual · ${perfil.nombre}`, async () => {
    const p = await abrePagina(navegador, servidor.url, PAGINAS.guia, { contexto: perfil.contexto });
    await p.waitForTimeout(1200);
    sinViolaciones(await axe(p, { desactivadas: DESACTIVADAS_GUIA }), 'guía completa');
    await p.context().close();
  });
}

test('artefacto autocontenido (si está construido)', { skip: !existsSync(resolve(RAIZ, 'guia-visual/artefacto.html')) && 'falta guia-visual/artefacto.html (node herramientas/construir.mjs --artefacto)' }, async () => {
  const p = await abrePagina(navegador, servidor.url, 'guia-visual/artefacto.html', { contexto: PERFILES.escritorio.contexto });
  await p.waitForTimeout(1500);
  sinViolaciones(await axe(p, { desactivadas: DESACTIVADAS_GUIA }), 'artefacto');
  assert.deepEqual(p.registro, []);
  await p.context().close();
});
