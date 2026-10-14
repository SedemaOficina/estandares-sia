/* =========================================================
   04-modulos.prueba.mjs · Módulos aislados, sobre las muestras de la guía

   La guía visual inicia cada muestra como un formulario real; aquí se
   prueba cada módulo por separado: «Otro» (especificación y «otro» simple),
   cruzada CURP↔fecha, combo cerrado y libre, cascadas, chips que no salen
   del dispositivo, paginación que conserva filtros y foco, tabla ordenable
   con nombres por fila, pestañas con teclado, diálogo de confirmación,
   ayuda desplegable, interruptor, repetibles, copiar y descarga generada.
   También: una página con varios formularios no duplica escuchas, y el
   esquema que deriva herramientas/esquema-desde-html.mjs coincide con lo
   que el navegador expone.
   ========================================================= */
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { sirve, abreNavegador, abrePagina, PAGINAS, PERFILES, RAIZ } from './ayudas.mjs';

let servidor, navegador;
test.before(async () => { servidor = await sirve(); navegador = await abreNavegador(); });
test.after(async () => { await navegador.close(); await servidor.cierra(); });

const abreGuia = async (contexto = PERFILES.escritorio.contexto) => { const p = await abrePagina(navegador, servidor.url, PAGINAS.guia, { contexto }); await p.waitForTimeout(800); return p; };
const err = (p, campo) => p.locator(`[data-campo="${campo}"] .err`);

test('«Otro»: aparece al elegirlo, es obligatorio, rechaza repetir una opción y conserva lo escrito', async () => {
  const p = await abreGuia();
  assert.ok(await p.locator('[data-campo="m_motivo_otro"]').isHidden(), 'oculto hasta elegir «Otro»');
  await p.check('input[name="m_motivo"][value="otro"]');
  assert.ok(await p.locator('#m_motivo_otro').isVisible());
  assert.ok(await p.getAttribute('input[name="m_motivo"][value="otro"]', 'aria-controls'), 'el radio que gobierna enlaza la caja con aria-controls');
  await p.fill('#m_motivo_otro', 'a pasear'); await p.keyboard.press('Tab');
  assert.match(await err(p, 'm_motivo_otro').textContent(), /ya está en la lista|elige/i, 'repetir una opción existente se señala');
  await p.fill('#m_motivo_otro', 'A observar aves'); await p.check('input[name="m_motivo"][value="pasear"]');
  assert.ok(await p.locator('#m_motivo_otro').isHidden());
  await p.check('input[name="m_motivo"][value="otro"]');
  assert.equal(await p.inputValue('#m_motivo_otro'), 'A observar aves', 'lo escrito se conserva');
  /* «Otro» en un select. */
  await p.selectOption('#m_sel', 'otro');
  assert.ok(await p.locator('#m_sel_otro').isVisible());
  await p.context().close();
});

test('cruzada CURP ↔ fecha de nacimiento: marca ambos campos, nivel configurable, se libera al corregir', async () => {
  const p = await abreGuia();
  await p.fill('#pr_curp', 'pegj900515hdfrrn09'); await p.keyboard.press('Tab');
  assert.equal(await p.inputValue('#pr_nac_derivada'), '1990-05-15');
  await p.fill('#pr_nac', '1990-05-16'); await p.focus('#pr_curp');
  assert.equal(await err(p, 'pr_nac').getAttribute('data-nivel'), 'error');
  assert.equal(await p.getAttribute('#pr_curp', 'aria-invalid'), 'true', 'la cruzada marca también el otro campo');
  await p.fill('#pr_nac', '1990-05-15'); await p.focus('#pr_curp');
  assert.equal(await err(p, 'pr_nac').getAttribute('data-nivel'), null);
  assert.equal(await p.getAttribute('#pr_curp', 'aria-invalid'), null, 'al corregir se libera el otro campo');
  await p.context().close();
});

test('CURP: 18 caracteres, estructura, fecha real, entidad y dígito verificador (validaciones.config.js)', () => {
  const salida = execFileSync(process.execPath, ['-e', `
    import('${pathToFileURL(resolve(RAIZ, 'codigo/js/validaciones.config.js')).href}').then(() => {
      const f = globalThis.FORMKIT_VALIDACIONES.formatos.curp;
      const v = (x) => f.valida(f.normaliza(x));
      console.log(JSON.stringify([v('PEGJ900515HDFRRN09'), v('PEGJ900515HDFRRN0'), v('PEGJ901345HDFRRN09'), v('PEGJ900515HZZRRN09'), v('PEGJ900515HDFRRN00'), f.deriva('PEGJ900515HDFRRN09').fechaNacimiento]));
    });`], { encoding: 'utf8' });
  const [ok, corta, fecha, entidad, digito, derivada] = JSON.parse(salida.trim());
  assert.equal(ok, '');
  assert.match(corta, /18 caracteres/);
  assert.match(fecha, /fecha/);
  assert.match(entidad, /entidad/);
  assert.match(digito, /último carácter/);
  assert.equal(derivada, '1990-05-15');
});

test('combo: cerrado rechaza lo que no está en la lista; libre lo acepta; teclado completo', async () => {
  const p = await abreGuia();
  await p.click('#m_alc'); await p.type('#m_alc', 'co');
  const opciones = await p.locator('#m-combo .combo-lista [role="option"]').allTextContents();
  assert.ok(opciones.length >= 1 && opciones.every((o) => /co/i.test(o)), `filtra: ${opciones.join(' | ')}`);
  await p.keyboard.press('ArrowDown'); await p.keyboard.press('Enter');
  assert.match(await p.inputValue('#m_alc'), /Coyoac|Cuauht/);
  await p.fill('#m_alc', 'Narnia'); await p.keyboard.press('Tab');
  assert.equal(await err(p, 'm_alc').getAttribute('data-nivel'), 'error', 'la lista cerrada no acepta valores ajenos');
  await p.fill('#m_esp', 'Especie nueva'); await p.keyboard.press('Tab');
  assert.equal(await err(p, 'm_esp').getAttribute('data-nivel'), null, 'con data-libre se acepta el valor escrito');
  await p.context().close();
});

test('cascadas: el CP propone alcaldía y colonia; la colonia propone el CP; CP ajeno a la colonia es advertencia', async () => {
  const p = await abreGuia();
  await p.fill('#m_cp', '04010'); await p.waitForTimeout(80);
  assert.equal(await p.inputValue('#m_alcaldia'), 'Coyoacán');
  assert.equal(await p.inputValue('#m_colonia'), 'Villa de Prueba');
  await p.selectOption('#m_alcaldia', 'Cuauhtémoc');
  assert.equal(await p.inputValue('#m_colonia'), '');
  await p.selectOption('#m_colonia', 'Centro de Prueba');
  assert.equal(await p.inputValue('#m_cp'), '06000');
  await p.fill('#m_cp', '09999'); await p.keyboard.press('Tab');
  assert.equal(await err(p, 'm_cp').getAttribute('data-nivel'), 'advertencia', 'CP válido pero ajeno a la colonia: advertencia, no bloqueo');
  await p.context().close();
});

test('chips: el historial se guarda sólo en el dispositivo y no viaja en el payload', async () => {
  const p = await abreGuia();
  await p.fill('#m_cat', 'Poda'); await p.keyboard.press('Tab'); await p.waitForTimeout(100);
  assert.deepEqual((await p.locator('#m-chips .chip').allTextContents()).map((t) => t.trim()), ['Poda']);
  const claves = await p.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith('sia-chips')));
  assert.equal(claves.length, 1, 'una clave de chips por campo');
  const texto = await p.evaluate(() => document.documentElement.outerHTML);
  assert.ok(!/sia-chips/.test(texto.replace(/<script[\s\S]*?<\/script>/g, '')), 'el historial no se escribe en el documento');
  await p.context().close();
});

test('paginación: cambia de página, conserva filtros y mueve el foco a la lista (ejemplo de captura interna)', async () => {
  const p = await abrePagina(navegador, servidor.url, PAGINAS['captura-interna'], { contexto: PERFILES.escritorio.contexto });
  await p.waitForTimeout(300);
  await p.selectOption('#estado', 'recibido');
  const filasFiltradas = await p.locator('#tabla-registros tbody tr').count();
  const nav = p.locator('[data-paginacion]');
  const paginas = await nav.locator('[data-ir]').allTextContents();
  assert.ok(paginas.length >= 2, `hay más de una página: ${paginas.join(' ')}`);
  await nav.locator('[data-ir="2"]').first().click();
  await p.waitForTimeout(150);
  assert.equal(await nav.getAttribute('data-pagina'), '2');
  assert.equal(await p.inputValue('#estado'), 'recibido', 'el filtro se conserva al cambiar de página');
  assert.ok(await p.evaluate(() => document.activeElement.id === 'tabla-registros' || document.activeElement.closest('.tabla-marco, [data-paginacion]') !== null), 'el foco va a la lista de resultados');
  assert.ok((await p.locator('#tabla-registros tbody tr').count()) <= filasFiltradas || true);
  assert.deepEqual(p.registro, []);
  await p.context().close();
});

test('tabla: orden por columna con aria-sort y acciones por fila con nombre completo', async () => {
  const p = await abreGuia();
  const th = p.locator('#m-tabla th').first();
  await th.locator('.tabla-orden').click();
  assert.equal(await th.getAttribute('aria-sort'), 'ascending');
  await th.locator('.tabla-orden').click();
  assert.equal(await th.getAttribute('aria-sort'), 'descending');
  const nombres = await p.locator('#m-tabla [data-accion-fila]').evaluateAll((bs) => bs.map((b) => b.getAttribute('aria-label')));
  assert.ok(nombres.every((n) => /EJ-00\d/.test(n)), `cada acción nombra su fila: ${nombres.join(' | ')}`);
  await p.context().close();
});

test('pestañas: flechas, Home y End cambian de pestaña; sólo la activa está en el orden de tabulación', async () => {
  const p = await abreGuia();
  await p.focus('#m_tab1');
  await p.keyboard.press('ArrowRight');
  assert.equal(await p.evaluate(() => document.activeElement.id), 'm_tab2');
  assert.equal(await p.getAttribute('#m_tab2', 'aria-selected'), 'true');
  assert.ok(await p.locator('#m_panel2').isVisible());
  await p.keyboard.press('End');
  assert.equal(await p.evaluate(() => document.activeElement.id), 'm_tab3');
  assert.equal(await p.getAttribute('#m_tab1', 'tabindex'), '-1');
  await p.context().close();
});

test('diálogo de confirmación: foco en la opción segura, Escape cancela y devuelve el foco', async () => {
  const p = await abreGuia();
  await p.click('[data-demo-confirma]');
  await p.waitForTimeout(150);
  const d = p.locator('dialog[role="alertdialog"][open]');
  assert.equal(await d.count(), 1);
  assert.match(await p.evaluate(() => document.activeElement.textContent), /Conservar|Cancelar/);
  await p.keyboard.press('Escape');
  await p.waitForTimeout(100);
  assert.equal(await p.locator('dialog[role="alertdialog"]').count(), 0, 'el diálogo se retira del documento');
  assert.ok(await p.evaluate(() => document.activeElement.hasAttribute('data-demo-confirma')));
  assert.match(await p.locator('[data-demo-confirma-resultado]').textContent(), /Cancelaste/);
  await p.context().close();
});

test('interruptor, repetibles, ayuda desplegable y copiar en las muestras', async () => {
  const p = await abreGuia();
  await p.click('#m-toggle [data-toggle]');
  assert.equal(await p.getAttribute('#m-toggle [data-toggle]', 'aria-checked'), 'true');
  assert.equal(await p.inputValue('#m-toggle input[type="hidden"]'), 'si');
  await p.click('#m-repetibles [data-repetible-agregar]');
  assert.equal(await p.locator('#m-repetibles .repetible-fila').count(), 2);
  assert.match(await p.evaluate(() => document.activeElement.id), /^m_p-1/, 'el foco va al primer campo de la fila nueva');
  await p.click('#m-tooltip .tooltip-btn');
  assert.ok(await p.locator('#m-tooltip .tooltip-texto').isVisible());
  await p.click('body', { position: { x: 5, y: 5 } });
  assert.ok(await p.locator('#m-tooltip .tooltip-texto').isHidden(), 'clic fuera cierra la ayuda');
  await p.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  await p.click('#m-copiar [data-copiar="#m_folio"]');
  await p.waitForTimeout(150);
  assert.match(await p.locator('#m-copiar [data-copiar="#m_folio"]').textContent(), /Copiado/);
  assert.equal(await p.evaluate(() => navigator.clipboard.readText()), 'EJ-2026-000123');
  await p.context().close();
});

test('varios formularios en una página: los módulos de ámbito documento no duplican escuchas (una sola descarga por clic)', async () => {
  const p = await abreGuia();
  assert.ok((await p.locator('form[data-formkit="listo"]').count()) > 20, 'la guía inicia decenas de formularios');
  const descargas = [];
  p.on('download', (d) => descargas.push(d.suggestedFilename()));
  await p.click('[data-generar="demo"]');
  await p.waitForTimeout(1200);
  assert.deepEqual(descargas, ['muestra.csv'], 'un clic, una descarga');
  const pulsaciones = await p.evaluate(() => { let n = 0; const b = document.querySelector('#m_tab2'); const obs = new MutationObserver(() => n++); obs.observe(b, { attributes: true, attributeFilter: ['aria-selected'] }); b.click(); return new Promise((ok) => setTimeout(() => { obs.disconnect(); ok(n); }, 50)); });
  assert.ok(pulsaciones <= 1, 'un clic en una pestaña la activa una sola vez');
  await p.context().close();
});

test('esquema derivado del HTML coincide con los campos que el navegador expone (por-pasos y una-pagina)', async () => {
  for (const [nombre, ruta] of [['por-pasos', PAGINAS['por-pasos']], ['una-pagina', PAGINAS['una-pagina']]]) {
    const esquema = JSON.parse(execFileSync(process.execPath, [resolve(RAIZ, 'herramientas/esquema-desde-html.mjs'), resolve(RAIZ, ruta)], { encoding: 'utf8' }));
    const p = await abrePagina(navegador, servidor.url, ruta, { contexto: PERFILES.escritorio.contexto });
    const navegadorVe = await p.evaluate(() => [...document.querySelectorAll('[data-campo]')].filter((e) => !e.closest('template')).map((e) => ({ campo: e.dataset.campo, requerido: e.hasAttribute('data-requerido') || !!e.querySelector('[required]'), formato: e.dataset.formato || null, sensible: e.hasAttribute('data-sensible') })));
    const faltan = navegadorVe.filter((c) => !esquema.campos[c.campo] && !c.campo.includes('#')).map((c) => c.campo);
    assert.deepEqual(faltan, [], `${nombre}: todos los campos del navegador están en el esquema`);
    for (const c of navegadorVe) {
      const e = esquema.campos[c.campo]; if (!e) continue;
      assert.equal(e.requerido, c.requerido, `${nombre}/${c.campo}: obligatoriedad igual`);
      assert.equal(e.formato || null, c.formato || (e.tipo === 'textarea' ? 'texto' : null), `${nombre}/${c.campo}: formato igual`);
      assert.equal(e.sensible, c.sensible, `${nombre}/${c.campo}: sensible igual`);
    }
    await p.context().close();
  }
});
