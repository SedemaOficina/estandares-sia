/* =========================================================
   08-auditoria.prueba.mjs · Hallazgos de la auditoría del 19 oct 2026

   Una prueba por hallazgo corregido, con su clave del informe. Cada una
   falla con la versión 1.5.1 y pasa con la corrección. Casi todas usan
   pruebas/paginas/auditoria.html; las de franja, acuse y mapa, la
   plantilla por pasos.
   ========================================================= */
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { sirve, abreNavegador, abrePagina, abrePlantilla, PERFILES, RAIZ, visible, continuar, llenaSolicitud, llenaLugar, aceptaDeclaraciones, pngRuido, ocultosVisibles, FRASE_LEGIBLE } from './ayudas.mjs';

let servidor, navegador;
test.before(async () => { servidor = await sirve(); navegador = await abreNavegador(); });
test.after(async () => { await navegador.close(); await servidor.cierra(); });

const RUTA = 'pruebas/paginas/auditoria.html';
const CLAVE = 'prueba-auditoria';
const abre = (consulta = '') => abrePagina(navegador, servidor.url, RUTA, { consulta, contexto: PERFILES.escritorio.contexto });
const error = (p, campo) => p.locator(`[data-campo="${campo}"] .err`).textContent().then((t) => t.trim());
const instancia = (p, fn) => p.evaluate(fn);

/* El servidor, con el esquema de la página de prueba. */
async function servidorDePrueba() {
  await import(pathToFileURL(resolve(RAIZ, 'codigo/js/validaciones.config.js')).href);
  const { validaPayload } = await import(pathToFileURL(resolve(RAIZ, 'codigo/servidor/validar.mjs')).href);
  const esquema = JSON.parse(execFileSync(process.execPath, [resolve(RAIZ, 'herramientas/esquema-desde-html.mjs'), resolve(RAIZ, RUTA)], { encoding: 'utf8' }));
  return { valida: (datos) => validaPayload({ datos, meta: {} }, esquema), CFG: globalThis.FORMKIT_VALIDACIONES };
}
const dma = (d) => `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;

test('repetibles: quitar una fila de en medio y agregar otra no repite nombres; las tres viajan y vuelven del borrador, con su Sí/No (E3-01, F2-08)', async () => {
  const p = await abre();
  const agregar = p.locator('[data-repetible-agregar]');
  const filas = p.locator('.repetible-fila');
  for (let i = 0; i < 3; i++) await agregar.click();
  for (const [i, n] of ['Uno', 'Dos', 'Tres'].entries()) await filas.nth(i).locator('input[type="text"]').fill(n);
  await filas.nth(2).locator('input[value="no"]').check();
  await filas.nth(1).locator('[data-repetible-quitar]').click();
  await p.locator('dialog[open] [data-r="si"]').click();
  await agregar.click();
  const fallos = await instancia(p, () => FormKit.iniciar(document.querySelector('form')).valida().map((f) => f.campo));
  assert.ok(fallos.includes('personas.3.nombre'), 'la fila nueva, vacía, marca su nombre obligatorio');
  await filas.nth(2).locator('input[type="text"]').fill('Cuatro');
  const estado = await instancia(p, () => ({
    ids: [...document.querySelectorAll('.repetible-fila [id]')].map((e) => e.id),
    nombres: Object.entries(FormKit.iniciar(document.querySelector('form')).payload().datos).filter(([k]) => /^personas\.\d+\.nombre$/.test(k)).map(([, v]) => v)
  }));
  assert.equal(new Set(estado.ids).size, estado.ids.length, 'ningún id se repite');
  assert.deepEqual(estado.nombres, ['Uno', 'Tres', 'Cuatro'], 'viajan las tres personas que se ven');
  await p.waitForTimeout(900);
  await p.reload(); await p.waitForTimeout(400);
  assert.deepEqual(await filas.locator('input[type="text"]').evaluateAll((l) => l.map((i) => i.value)), ['Uno', 'Tres', 'Cuatro'], 'al recargar vuelven las tres filas con sus nombres');
  assert.ok(await filas.nth(1).locator('input[value="no"]').isChecked(), 'y el Sí/No de cada fila');
  assert.deepEqual(p.registro, [], 'consola limpia');
  await p.context().close();
});

test('repetibles: un borrador con más filas que el máximo no congela la página (E3-02)', async () => {
  const p = await abre();
  await p.evaluate((k) => localStorage.setItem(k, JSON.stringify({ v: '1', t: Date.now(), datos: {}, repetibles: { personas: 5 } })), CLAVE);
  await p.reload({ timeout: 5000 });
  await p.waitForSelector('form[data-formkit="listo"]', { timeout: 2000 });
  assert.equal(await p.locator('.repetible-fila').count(), 3, 'quedan las tres que permite el máximo');
  await p.context().close();
});

test('número: «1,500» pide escribirlo sin comas, en pantalla y en el servidor; «12,5» sigue siendo 12.5 (F2-01)', async () => {
  const p = await abre();
  await p.fill('#cantidad', '1,500'); await p.keyboard.press('Tab');
  assert.match(await error(p, 'cantidad'), /sin comas.*1500/, 'el mensaje pide escribirlo sin comas y da el ejemplo');
  await p.fill('#cantidad', '12,5'); await p.keyboard.press('Tab');
  assert.equal(await error(p, 'cantidad'), '', 'la coma decimal se acepta');
  assert.equal(await instancia(p, () => FormKit.iniciar(document.querySelector('form')).payload().datos.cantidad), '12.5');
  const { valida } = await servidorDePrueba();
  assert.equal(valida({ cantidad: '1,500' }).ok, false, 'el servidor no guarda 1.5');
  assert.equal(valida({ cantidad: '12,345.50' }).ok, false);
  assert.deepEqual(valida({ cantidad: '12,5' }).datos.cantidad, '12.5');
  await p.context().close();
});

test('fecha día/mes/año: la edad mínima y el periodo se revisan en pantalla y en el servidor (A1-01)', async () => {
  const p = await abre();
  const hace10 = new Date(); hace10.setFullYear(hace10.getFullYear() - 10);
  await p.fill('#fn', dma(hace10)); await p.keyboard.press('Tab');
  assert.match(await error(p, 'fn'), /edad mínima de 18/, 'una persona de 10 años no pasa');
  await p.fill('#desde', '15/01/2026'); await p.fill('#hasta', '01/02/2026'); await p.keyboard.press('Tab');
  assert.equal(await error(p, 'hasta'), '', 'un periodo válido no da error');
  await p.fill('#hasta', '01/01/2026'); await p.keyboard.press('Tab');
  assert.notEqual(await error(p, 'hasta'), '', 'un periodo invertido sí');
  const { valida } = await servidorDePrueba();
  assert.equal(valida({ fn: dma(hace10) }).ok, false, 'el servidor tampoco acepta la edad');
  const hace30 = new Date(); hace30.setFullYear(hace30.getFullYear() - 30);
  assert.equal(valida({ fn: dma(hace30) }).ok, true);
  assert.equal(valida({ desde: '15/01/2026', hasta: '01/02/2026' }).ok, true);
  await p.context().close();
});

test('un texto enorme en una fecha o en unas coordenadas no frena la página ni el servidor (E3-03)', async () => {
  const { valida, CFG } = await servidorDePrueba();
  const largo = `1${' '.repeat(1000000)}x`;
  let t0 = performance.now(); CFG.formatos['fecha-dma'].valida(CFG.formatos['fecha-dma'].normaliza(largo));
  assert.ok(performance.now() - t0 < 100, `fecha-dma con 1 MB tarda ${Math.round(performance.now() - t0)} ms`);
  t0 = performance.now(); const r = valida({ fn: largo });
  assert.ok(performance.now() - t0 < 100, `validaPayload con 1 MB tarda ${Math.round(performance.now() - t0)} ms`);
  assert.equal(r.ok, false, 'y se rechaza por largo');
  const p = await abrePlantilla(navegador, servidor.url, { contexto: PERFILES.escritorio.contexto });
  const ms = await p.evaluate(() => { const s = `1.5${' '.repeat(1000000)}x`; const t = performance.now(); FormKit.leeCoordenadas(s); return performance.now() - t; });
  assert.ok(ms < 100, `leer coordenadas de 1 MB tarda ${Math.round(ms)} ms`);
  await p.context().close();
});

test('un campo condicional oculto dentro de un renglón no se ve (B1-01)', async () => {
  const p = await abrePlantilla(navegador, servidor.url, { contexto: PERFILES.escritorio.contexto });
  await p.evaluate(() => { for (const s of document.querySelectorAll('[data-paso]')) s.hidden = false; });
  await p.locator('#colonia_libre').check();
  await p.waitForTimeout(150);
  assert.equal(await p.locator('[data-campo="colonia"]').evaluate((e) => getComputedStyle(e).display), 'none', 'la lista de colonias se oculta');
  assert.deepEqual(await ocultosVisibles(p), [], 'ningún elemento con hidden se ve');
  await p.context().close();
});

test('franja del borrador: escribir antes de contestar no reemplaza el borrador guardado (C4-01)', async () => {
  const p = await abrePlantilla(navegador, servidor.url, { contexto: PERFILES.escritorio.contexto });
  await p.fill('#descripcion', FRASE_LEGIBLE);
  await p.waitForTimeout(900);
  await p.reload(); await p.waitForTimeout(300);
  assert.ok(await p.locator('[data-franja-borrador]').isVisible(), 'se ofrece el borrador');
  await p.locator('#descripcion').pressSequentially('x');
  await p.waitForTimeout(900);
  await p.reload(); await p.waitForTimeout(300);
  await p.click('[data-borrador="recuperar"]'); await p.waitForTimeout(300);
  assert.equal(await p.inputValue('#descripcion'), FRASE_LEGIBLE, 'se recupera lo que la persona había capturado');
  await p.context().close();
});

test('el acuse sobrevive a una recarga y se puede empezar otra solicitud; la barra de pasos no se ve sobre él (C4-07, C4-03)', async () => {
  const p = await abrePlantilla(navegador, servidor.url, { contexto: PERFILES.escritorio.contexto });
  await llenaSolicitud(p); await continuar(p);
  await llenaLugar(p); await continuar(p);
  await p.setInputFiles('[data-archivos] input[type="file"]:not([data-entrada-camara])', [{ name: 'foto.png', mimeType: 'image/png', buffer: pngRuido(400, 300) }]);
  await p.waitForTimeout(900);
  await p.check('input[name="contacto"][value="no"]'); await continuar(p);
  await aceptaDeclaraciones(p);
  await visible(p, '[data-accion="enviar"]').click();
  await p.waitForSelector('[data-acuse]:not([hidden])', { timeout: 5000 });
  const folio = await p.locator('#folio').textContent();
  assert.match(folio, /^EJEMPLO-/);
  assert.ok(await p.locator('.barra-fija').isHidden(), 'la barra de pasos no se ve sobre el acuse');
  await p.reload(); await p.waitForTimeout(400);
  assert.ok(await p.locator('[data-acuse]').isVisible(), 'al recargar se vuelve a ver el acuse');
  assert.equal(await p.locator('#folio').textContent(), folio, 'con el mismo folio');
  assert.ok(await p.locator('form').isHidden());
  await p.click('[data-acuse-nuevo]');
  await p.waitForSelector('form[data-formkit="listo"]');
  await p.waitForTimeout(300);
  assert.ok(await p.locator('form').isVisible(), '«Llenar otra solicitud» abre el formulario');
  assert.ok(await p.locator('[data-acuse]').isHidden());
  await p.context().close();
});

test('un formulario que sigue en pantalla después de enviar: el siguiente registro lleva otra clave y vuelve a guardar borrador (C4-08)', async () => {
  const p = await abre();
  await p.fill('#cantidad', '5');
  const clave1 = await instancia(p, () => FormKit.iniciar(document.querySelector('form')).payload().meta.idempotencia);
  assert.equal(await instancia(p, () => FormKit.iniciar(document.querySelector('form')).enviar()), true);
  await p.fill('#cantidad', '6');
  const clave2 = await instancia(p, () => FormKit.iniciar(document.querySelector('form')).payload().meta.idempotencia);
  assert.notEqual(clave1, clave2, 'otra clave de idempotencia');
  await p.waitForTimeout(900);
  const b = await p.evaluate((k) => JSON.parse(localStorage.getItem(k) || 'null'), CLAVE);
  assert.equal(b && b.datos.cantidad, '6', 'la captura en curso vuelve al borrador');
  await p.context().close();
});

test('un envío recibido no se reporta como fallido: respuesta null, 204 sin cuerpo, o la página falla después (B5-05)', async () => {
  for (const [consulta, ruta] of [['?nulo', null], ['?omision', 204], ['?alEnviarFalla', null]]) {
    const p0 = await navegador.newContext(PERFILES.escritorio.contexto);
    const recibidos = [];
    await p0.route('**/recibe', (r) => { recibidos.push(r.request().method()); r.fulfill({ status: ruta || 200, body: '' }); });
    const p = await p0.newPage();
    await p.goto(`${servidor.url}/${RUTA}${consulta}`);
    await p.fill('#cantidad', '5');
    await p.waitForTimeout(900);
    await visible(p, '[data-accion="enviar"]').click();
    await p.waitForTimeout(500);
    assert.ok(await p.locator('[data-estado-envio]').isHidden(), `${consulta}: no aparece «No se pudo enviar»`);
    if (consulta === '?omision') assert.equal(recibidos.length, 1, 'el servidor recibió el envío');
    if (consulta === '?alEnviarFalla') assert.match(await p.locator('[data-aviso-formkit]').textContent(), /se recibió/, 'se dice que el envío se recibió');
    assert.equal(await p.evaluate((k) => localStorage.getItem(k), CLAVE), null, 'el borrador de lo ya enviado se borra');
    await p0.close();
  }
});

test('mapa: la revisión dice si el punto falta confirmar, y el borrador recupera el punto confirmado (F2-02)', async () => {
  const p = await abrePlantilla(navegador, servidor.url, { contexto: PERFILES.escritorio.contexto });
  await p.fill('#descripcion', FRASE_LEGIBLE);
  const texto = await p.evaluate(() => {
    const el = document.querySelector('[data-campo="punto"]');
    FormKit.mapa.estadoDe(el).coloca({ lat: 19.3257, lon: -99.1557 });
    return FormKit.iniciar(document.querySelector('form')).ctx.textoDeValor('punto');
  });
  assert.match(texto, /sin confirmar/, 'la revisión no presenta como enviado un punto sin confirmar');
  await p.evaluate(() => FormKit.mapa.estadoDe(document.querySelector('[data-campo="punto"]')).confirma());
  await p.waitForTimeout(900);
  await p.reload(); await p.waitForTimeout(300);
  await p.click('[data-borrador="recuperar"]'); await p.waitForTimeout(300);
  const despues = await p.evaluate(() => ({ valor: FormKit.iniciar(document.querySelector('form')).ctx.valorDe('punto'), boton: document.querySelector('[data-mapa-confirmar]').textContent }));
  assert.match(despues.valor, /^19\.325700,-99\.155700$/, 'el punto confirmado vuelve y cuenta para el envío');
  assert.equal(despues.boton, 'Punto confirmado');
  await p.context().close();
});

test('fecha día/mes/año: una fecha AAAA-MM-DD pegada y el botón «Hoy» quedan en día/mes/año (E3-06)', async () => {
  const p = await abre();
  await p.fill('#fn', '1985-07-23');
  assert.equal(await p.inputValue('#fn'), '23/07/1985');
  await p.click('[data-campo="dia"] [data-hoy]');
  const hoy = await p.evaluate(() => FormKit.config.dmaDeIso(FormKit.config.hoyISO()));
  assert.equal(await p.inputValue('#dia'), hoy);
  assert.equal(await error(p, 'dia'), '');
  await p.context().close();
});
