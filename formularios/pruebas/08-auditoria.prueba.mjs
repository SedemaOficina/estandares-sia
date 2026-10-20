/* =========================================================
   08-auditoria.prueba.mjs · Hallazgos de la auditoría del 19 oct 2026

   Una prueba por hallazgo corregido, con su clave del informe. Cada una
   falla con la versión 1.5.1 y pasa con la corrección. Casi todas usan
   pruebas/paginas/auditoria.html; las de franja, acuse y mapa, la
   plantilla por pasos.
   ========================================================= */
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { mkdtempSync, writeFileSync, readFileSync, copyFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { createHash } from 'node:crypto';
import { sirve, abreNavegador, abrePagina, abrePlantilla, PERFILES, PAGINAS, RAIZ, visible, continuar, llenaSolicitud, llenaLugar, aceptaDeclaraciones, pngRuido, jpegConExif, ocultosVisibles, FRASE_LEGIBLE } from './ayudas.mjs';

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

/* ----- Bloque 2 (1.5.3): datos personales y paquete ----- */

test('la plantilla de una página no deja en el equipo la fecha de nacimiento ni a los acompañantes, y ofrece el borrador en vez de restaurarlo solo (E1-01)', async () => {
  const p = await abrePagina(navegador, servidor.url, PAGINAS['una-pagina'], { contexto: PERFILES.escritorio.contexto });
  await p.fill('#nombre', 'Fulano'); await p.fill('#apellido_paterno', 'Prueba'); await p.fill('#apellido_materno', 'Ejemplo');
  await p.fill('#curp', 'PUEF900515HDFRJL04'); await p.keyboard.press('Tab');
  await p.locator('[data-repetible-agregar]').click();
  await p.locator('.repetible-fila input').first().fill('Nombre De Acompañante');
  await p.waitForTimeout(900);
  const b = await p.evaluate(() => JSON.parse(localStorage.getItem('sia-plantilla-una-pagina') || 'null'));
  assert.ok(b, 'hay borrador');
  assert.deepEqual(Object.keys(b.datos).filter((k) => /nacimiento|edad|acompanantes/.test(k)), [], 'ni la fecha que sale de la CURP, ni la edad, ni los acompañantes');
  const inventario = await p.evaluate(() => FormKit.iniciar(document.querySelector('form')).inventario());
  const de = (c) => inventario.find((x) => x.campo === c);
  assert.equal(de('nacimiento').sensible, true, 'el inventario dice que la fecha no va al borrador');
  assert.equal(de('acompanantes.#.nombre').datoPersonal, true, 'y lista a los acompañantes como dato personal, aunque no haya filas');
  await p.reload(); await p.waitForTimeout(300);
  assert.ok(await p.locator('[data-franja-borrador]').isVisible(), 'al volver, se ofrece el borrador: no se restaura solo');
  assert.equal(await p.inputValue('#nombre'), '', 'nada aparece sin que la persona lo pida');
  await p.context().close();
  const dir = mkdtempSync(resolve(tmpdir(), 'auditar-campos-'));
  writeFileSync(resolve(dir, 'f.html'), '<form><div class="campo" data-campo="otro_nombre" data-formato="nombre" data-uso="x."><label class="etiqueta" for="otro_nombre">Nombre</label><input class="control" id="otro_nombre" name="otro_nombre" autocomplete="name"></div></form>');
  const r = spawnSync(process.execPath, [resolve(RAIZ, 'herramientas/auditar-campos.mjs'), resolve(dir, 'f.html')], { encoding: 'utf8' });
  assert.notEqual(r.status, 0, 'auditar-campos falla con un nombre sin data-finalidad');
  assert.match(r.stdout + r.stderr, /D3.*sin data-finalidad/);
});

test('una contraseña nunca entra al borrador, aunque el campo no lo declare (E1-02)', async () => {
  const p = await abre();
  await p.fill('#clave', 'Mi frase secreta de prueba 2026');
  await p.fill('#cantidad', '7');
  await p.waitForTimeout(900);
  const b = await p.evaluate((k) => JSON.parse(localStorage.getItem(k) || 'null'), CLAVE);
  assert.equal(b.datos.cantidad, '7');
  assert.equal(b.datos.clave, undefined, 'la contraseña no está');
  await p.context().close();
  const dir = mkdtempSync(resolve(tmpdir(), 'auditar-campos-'));
  writeFileSync(resolve(dir, 'f.html'), '<form><div class="campo" data-campo="c" data-formato="contrasena" data-uso="x."><label class="etiqueta" for="c">Contraseña</label><input class="control" id="c" name="c" type="password" autocomplete="new-password"></div></form>');
  const r = spawnSync(process.execPath, [resolve(RAIZ, 'herramientas/auditar-campos.mjs'), resolve(dir, 'f.html')], { encoding: 'utf8' });
  assert.match(r.stdout + r.stderr, /contraseña sin data-sensible/, 'auditar-campos pide declararla');
});

/* PNG con un bloque eXIf (donde viajaría la ubicación), insertado tras IHDR. */
function crc32(buf) { let c = ~0; for (const b of buf) { c ^= b; for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xEDB88320 & -(c & 1)); } return ~c >>> 0; }
function pngConExif(png) {
  const datos = Buffer.concat([Buffer.from('Exif\0\0'), Buffer.from('GPS de prueba 19.4326 -99.1332')]);
  const tipo = Buffer.from('eXIf');
  const largo = Buffer.alloc(4); largo.writeUInt32BE(datos.length);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([tipo, datos])));
  return Buffer.concat([png.subarray(0, 33), largo, tipo, datos, crc, png.subarray(33)]);
}

test('el proveedor del borrador recibe lo mismo que se envía: un PNG con ubicación llega limpio y como JPG, y vuelve igual (E1-03, E1-04, E3-05)', async () => {
  const p = await abrePagina(navegador, servidor.url, 'pruebas/paginas/borrador.html', { contexto: PERFILES.escritorio.contexto });
  await p.fill('#nombre', 'Con captura');
  await p.setInputFiles('[data-campo="documento"] input[type="file"]', [{ name: 'captura.png', mimeType: 'image/png', buffer: pngConExif(pngRuido(400, 300)) }]);
  await p.waitForSelector('[data-campo="documento"] .arch[data-estado="listo"]');
  await p.waitForFunction(() => JSON.parse(sessionStorage.getItem('arch-documento') || '[]').length);
  const guardada = await p.evaluate(() => JSON.parse(sessionStorage.getItem('arch-documento'))[0]);
  const bytes = Buffer.from(guardada.datos.split(',')[1], 'base64');
  assert.equal(guardada.nombre, 'captura.jpg', 'con el nombre de lo que es');
  assert.equal(bytes[0], 0xFF, 'un JPG');
  assert.ok(!bytes.includes(Buffer.from('eXIf')) && !bytes.includes(Buffer.from('Exif\0')) && !bytes.includes(Buffer.from('GPS de prueba')), 'sin la ubicación');
  const enviado = await p.evaluate(() => { const a = FormKit.archivos.de(document.querySelector('[data-campo="documento"]'))[0]; return { nombre: a.nombre, size: a.size, tipo: a.tipo }; });
  assert.deepEqual(enviado, { nombre: 'captura.jpg', size: bytes.length, tipo: 'image/jpeg' }, 'lo mismo que se envía: nombre, peso y tipo');
  await p.reload();
  await p.waitForSelector('[data-campo="documento"] .arch[data-estado="listo"]');
  assert.equal((await p.locator('[data-campo="documento"] .arch-nombre').textContent()).trim(), 'captura.jpg', 'y vuelve del proveedor sin rechazo');
  await p.context().close();
});

test('borradores de equipos compartidos: se borran los vencidos de todo el sitio y «No guardar en este equipo» no deja nada (E1-05)', async () => {
  const p = await abre();
  const viejo = Date.now() - 15 * 86400000;
  await p.evaluate((t) => {
    localStorage.setItem('otro-formulario', JSON.stringify({ v: '1', t, datos: { nombre: 'Persona anterior' } }));
    localStorage.setItem('del-futuro', JSON.stringify({ v: '1', t: Date.now() + 10 * 365 * 86400000, datos: {} }));
    localStorage.setItem('otra-cosa', JSON.stringify({ t: 1, preferencia: 'oscuro' }));
  }, viejo);
  await p.reload(); await p.waitForTimeout(200);
  const quedan = await p.evaluate(() => ['otro-formulario', 'del-futuro', 'otra-cosa'].filter((k) => localStorage.getItem(k) !== null));
  assert.deepEqual(quedan, ['otra-cosa'], 'se borran los borradores vencidos de otros formularios; lo que no es un borrador se queda');
  await p.context().close();

  const q = await abrePlantilla(navegador, servidor.url, { contexto: PERFILES.escritorio.contexto });
  await q.fill('#descripcion', FRASE_LEGIBLE);
  await q.waitForTimeout(900);
  await q.reload(); await q.waitForTimeout(300);
  await q.click('[data-borrador="no-guardar"]');
  assert.equal(await q.evaluate(() => localStorage.getItem('sia-plantilla-pasos')), null, 'se borra el borrador anterior');
  assert.match(await q.locator('[data-aviso-formkit]').textContent(), /Nada se guarda en este equipo/, 'y se dice con palabras');
  await q.fill('#descripcion', `${FRASE_LEGIBLE} Otra vez.`);
  await q.waitForTimeout(900);
  assert.equal(await q.evaluate(() => localStorage.getItem('sia-plantilla-pasos')), null, 'lo que se escriba después tampoco se guarda');
  await q.context().close();
});

/* Nombres de los archivos dentro de un ZIP (directorio central). */
function nombresEnZip(buf) {
  const nombres = [];
  const fin = buf.lastIndexOf(Buffer.from([0x50, 0x4B, 0x05, 0x06]));
  let o = buf.readUInt32LE(fin + 16);
  for (let k = 0, n = buf.readUInt16LE(fin + 10); k < n; k++) {
    const largo = buf.readUInt16LE(o + 28), extra = buf.readUInt16LE(o + 30), coment = buf.readUInt16LE(o + 32);
    nombres.push(buf.subarray(o + 46, o + 46 + largo).toString('utf8'));
    o += 46 + largo + extra + coment;
  }
  return nombres;
}

test('el paquete sólo lleva lo guardado en Git, se arma en Windows, sale igual dos veces y lleva sus huellas; la revisión de secretos los detecta (F4-01, F4-02, F4-03, F4-04)', () => {
  const raizRepo = resolve(RAIZ, '..');
  const dir = mkdtempSync(resolve(tmpdir(), 'paquete-'));
  const clon = resolve(dir, 'clon');
  const firma = ['-c', 'user.name=prueba', '-c', 'user.email=prueba@ejemplo.local'];
  execFileSync('git', ['clone', '-q', raizRepo, clon]);
  /* Las herramientas que se prueban son las de esta copia de trabajo. */
  copyFileSync(resolve(RAIZ, 'herramientas/construir.mjs'), resolve(clon, 'formularios/herramientas/construir.mjs'));
  mkdirSync(resolve(clon, 'herramientas'), { recursive: true });
  copyFileSync(resolve(raizRepo, 'herramientas/secretos.mjs'), resolve(clon, 'herramientas/secretos.mjs'));
  copyFileSync(resolve(raizRepo, '.gitignore'), resolve(clon, '.gitignore'));
  execFileSync('git', ['add', '-A'], { cwd: clon });
  execFileSync('git', [...firma, 'commit', '-qm', 'herramientas', '--allow-empty'], { cwd: clon });
  const limpio = spawnSync(process.execPath, ['herramientas/secretos.mjs'], { cwd: clon, encoding: 'utf8' });
  assert.equal(limpio.status, 0, `sin testigos, la revisión de secretos pasa: ${limpio.stdout}`);
  /* Los testigos se arman al correr: escritos tal cual, la revisión de secretos señalaría este archivo. */
  const llave = ['-----BEGIN', 'PRIVATE', 'KEY-----'].join(' ');
  const asignacion = `const ${['api', 'key'].join('_')} = "${'abcdefghij'.repeat(2)}12345";`;
  const testigos = { 'formularios/claves.local.json': '{"llave":"x"}', 'formularios/.env': 'CLAVE=1', 'formularios/llave.pem': 'x', 'formularios/notas.txt': llave, 'formularios/respaldo.orig': 'x', 'formularios/codigo/secreto.js': asignacion, 'formularios/notas-de-trabajo.md': 'notas sin guardar' };
  for (const [f, t] of Object.entries(testigos)) writeFileSync(resolve(clon, f), t);
  const conTestigos = spawnSync(process.execPath, ['herramientas/secretos.mjs'], { cwd: clon, encoding: 'utf8' });
  assert.notEqual(conTestigos.status, 0, 'con testigos, falla');
  for (const f of ['formularios/notas.txt', 'formularios/codigo/secreto.js']) assert.ok(conTestigos.stdout.includes(f), `señala ${f}`);
  const arma = () => { const r = spawnSync(process.execPath, ['herramientas/construir.mjs', '--zip'], { cwd: resolve(clon, 'formularios'), encoding: 'utf8' }); assert.equal(r.status, 0, r.stderr || r.stdout); };
  arma();
  const version = JSON.parse(readFileSync(resolve(clon, 'formularios/codigo/manifiesto.json'), 'utf8')).version;
  const zip = resolve(clon, `estandar-formularios-v${version}.zip`);
  const huella1 = createHash('sha256').update(readFileSync(zip)).digest('hex');
  assert.equal(readFileSync(`${zip}.sha256`, 'utf8').split(' ')[0], huella1, 'junto al ZIP va su huella');
  const nombres = nombresEnZip(readFileSync(zip));
  for (const f of Object.keys(testigos)) assert.ok(!nombres.includes(f), `${f} no entra al paquete`);
  assert.ok(nombres.includes('formularios/HUELLAS.sha256') && nombres.includes('formularios/codigo/js/formkit.core.js'), 'lleva sus huellas y el núcleo');
  arma();
  assert.equal(createHash('sha256').update(readFileSync(zip)).digest('hex'), huella1, 'dos construcciones del mismo commit dan el mismo ZIP');
});

/* ----- Bloque 3 (1.6.0): el servidor valida igual que la pantalla ----- */

/* El servidor con el esquema de una plantilla o de un HTML de prueba, y los catálogos de ejemplo. */
async function servidorCon(origen) {
  await import(pathToFileURL(resolve(RAIZ, 'codigo/js/validaciones.config.js')).href);
  await import(pathToFileURL(resolve(RAIZ, 'codigo/catalogos/cdmx-ejemplo.js')).href);
  const { validaPayload } = await import(pathToFileURL(resolve(RAIZ, 'codigo/servidor/validar.mjs')).href);
  let ruta = resolve(RAIZ, 'codigo/plantillas', `${origen}.html`);
  if (origen.startsWith('<')) { const dir = mkdtempSync(resolve(tmpdir(), 'esquema-')); ruta = resolve(dir, 'f.html'); writeFileSync(ruta, `<form>${origen}</form>`); }
  const esquema = JSON.parse(execFileSync(process.execPath, [resolve(RAIZ, 'herramientas/esquema-desde-html.mjs'), ruta], { encoding: 'utf8' }));
  return { valida: (datos, opciones = {}, archivos = []) => validaPayload({ datos, archivos, meta: {} }, esquema, opciones), C: globalThis.FORMKIT_CATALOGOS, esquema };
}
const de = (r, campo) => r.errores.filter((e) => e.campo === campo).map((e) => e.mensaje);

test('servidor: la cascada se contrasta con su catálogo, sea arreglo u objeto, aunque haya otro, y la colonia con su alcaldía (A1-02)', async () => {
  const { valida, C } = await servidorCon('por-pasos');
  const fila = C.cdmx.filas[0];
  const otraAlcaldia = C.cdmx.filas.find((f) => f.alcaldia !== fila.alcaldia);
  assert.ok(de(valida({ alcaldia: 'Alcaldía Inventada' }, { catalogos: { cdmx: C.cdmx.filas } }), 'alcaldia').length, 'con el catálogo como arreglo, una alcaldía inventada no pasa');
  assert.ok(de(valida({ alcaldia: 'Alcaldía Inventada' }, { catalogos: { cdmx: C.cdmx } }), 'alcaldia').length, 'tampoco con el objeto {filas}');
  const dos = valida({ alcaldia: fila.alcaldia, colonia: fila.colonia }, { catalogos: { otro: { filas: [{ alcaldia: 'Otra', colonia: 'Otra', cp: '00000' }] }, cdmx: C.cdmx } });
  assert.deepEqual([...de(dos, 'alcaldia'), ...de(dos, 'colonia')], [], 'con dos catálogos, se usa el que la cascada nombra');
  assert.ok(de(valida({ alcaldia: otraAlcaldia.alcaldia, colonia: fila.colonia }, { catalogos: { cdmx: C.cdmx } }), 'colonia').length, 'una colonia de otra alcaldía no pasa');
  const sin = valida({ alcaldia: 'Lo que sea' }, {});
  assert.deepEqual(de(sin, 'alcaldia'), [], 'sin catálogo no se rechaza en silencio…');
  assert.ok(sin.senales.some((s) => /alcaldia.*catálogo/.test(s)), '…ni se acepta en silencio: queda una señal');
});

test('servidor: una cruzada que en pantalla sólo advierte no rechaza el envío (A1-03)', async () => {
  const { valida } = await servidorCon('<div class="campo" data-campo="curp" data-formato="curp" data-cruzada="curp-sexo" data-cruzada-campos="curp=curp sexo=sexo" data-uso="x."><label class="etiqueta" for="curp">CURP</label><input class="control" id="curp" name="curp"></div><fieldset class="grupo" data-campo="sexo" data-uso="x."><legend class="etiqueta">Sexo</legend><input type="radio" name="sexo" value="H"><input type="radio" name="sexo" value="M"></fieldset>');
  const r = valida({ curp: 'PUEF900515HDFRJL04', sexo: 'M' });
  assert.equal(r.ok, true, 'una CURP de hombre con «Mujer» se acepta, como en pantalla');
  assert.ok(r.senales.some((s) => /Advertencia/.test(s)), 'y deja una señal');
});

test('servidor: mínimo y máximo de opciones, periodo y CURP contra nacimiento y edad (A1-04, A1-05, A1-08)', async () => {
  const { valida } = await servidorCon('una-pagina');
  assert.ok(de(valida({ intereses: ['reforestacion', 'monitoreo', 'talleres', 'otro'], intereses_otro: 'x' }), 'intereses').length, '4 intereses con máximo 3 no pasan');
  assert.ok(de(valida({ desde: '2026-10-10', hasta: '2026-10-01' }), 'hasta').length, 'un periodo invertido no pasa');
  const r = valida({ nombre: 'Fulano', apellido_paterno: 'Prueba', apellido_materno: 'Ejemplo', curp: 'PUEF900515HDFRJL04', nacimiento: '2010-05-05', edad: '3' });
  assert.ok(de(r, 'nacimiento').length, 'una fecha que no sale de la CURP no pasa');
  const r2 = valida({ nombre: 'Fulano', apellido_paterno: 'Prueba', apellido_materno: 'Ejemplo', curp: 'PUEF900515HDFRJL04', nacimiento: '1990-05-15', edad: '3' });
  assert.deepEqual(de(r2, 'nacimiento'), [], 'con la fecha de la CURP, la fecha pasa…');
  assert.ok(de(r2, 'edad').length, '…pero no una edad que no sale de ella');
});

test('servidor: las cruzadas se aplican en cada fila de un grupo repetible (A1-09)', async () => {
  const { valida } = await servidorCon('<div class="repetible" data-repetible="personas" data-max="3"><ol data-repetible-lista></ol><template data-repetible-plantilla><li><div class="campo" data-campo="personas.#.curp" data-formato="curp" data-uso="x."><label class="etiqueta" for="p-#-c">CURP</label><input class="control" id="p-#-c" name="personas[#][curp]"></div><div class="campo" data-campo="personas.#.nac" data-formato="fecha" data-cruzada="curp-fecha" data-cruzada-campos="curp=personas.#.curp fecha=personas.#.nac" data-uso="x."><label class="etiqueta" for="p-#-f">Nacimiento</label><input class="control" id="p-#-f" name="personas[#][nac]" type="date"></div></li></template></div>');
  const r = valida({ 'personas.0.curp': 'PUEF900515HDFRJL04', 'personas.0.nac': '1990-05-15', 'personas.2.curp': 'PUEF900515HDFRJL04', 'personas.2.nac': '1991-01-01' });
  assert.deepEqual(de(r, 'personas.0.nac'), [], 'la fila que coincide pasa');
  assert.ok(de(r, 'personas.2.nac').length, 'la que no coincide, no');
});

test('servidor: límites de archivos del campo y de la configuración del formulario, extensiones, nombres y datos de captura (A1-06, A1-07, E1-06, A1-16)', async () => {
  const pdf = (nombre, mb = 0.1) => ({ campo: 'docs', nombre, size: Math.round(mb * 1048576), tipo: 'application/pdf' });
  const { valida } = await servidorCon('<div class="campo" data-campo="docs" data-max="3" data-total-mb="2" data-extensiones="PDF, JPG" data-conservar-exif="false" data-uso="x."><label class="etiqueta">Documentos</label><div data-archivos><input type="file" multiple></div></div>');
  assert.ok(de(valida({}, {}, [pdf('a.pdf'), pdf('b.pdf'), pdf('c.pdf'), pdf('d.pdf')]), 'docs').length, '4 con data-max 3 no pasan');
  assert.ok(de(valida({}, {}, [pdf('a.pdf', 1.5), pdf('b.pdf', 1.5)]), 'docs').some((m) => /2 MB/.test(m)), 'el total del campo (data-total-mb) se respeta');
  assert.deepEqual(de(valida({}, {}, [pdf('oficio.pdf'), { ...pdf('foto.jpg'), tipo: 'image/jpeg' }]), 'docs'), [], 'con «PDF, JPG», pdf y jpg pasan');
  assert.ok(de(valida({}, {}, [pdf('recibo‮fdp.pdf')]), 'docs').length, 'un nombre con un carácter que invierte el texto no pasa');
  const r = valida({}, {}, [{ ...pdf('foto.jpg'), lat_captura: 19.4, lon_captura: -99.1, fecha_captura: '2026-10-01T10:00:00' }]);
  assert.ok(r.senales.some((s) => /ubicación de captura/.test(s)), 'la ubicación que el campo no pide deja una señal');
  assert.equal(r.archivos[0].lat_captura, undefined, 'y se quita de la copia que recibe el sistema');
  const { valida: v2 } = await servidorCon('<div class="campo" data-campo="docs" data-uso="x."><label class="etiqueta">Documentos</label><div data-archivos><input type="file" multiple></div></div>');
  let r2;
  assert.doesNotThrow(() => { r2 = v2({}, { config: { archivos: { mb: 1 } } }, [pdf('a.pdf', 1.5)]); }, 'una configuración parcial no lanza excepción');
  assert.ok(de(r2, 'docs').some((m) => /1 MB/.test(m)), 'y su límite se aplica');
});

test('lista cerrada: queda el nombre del catálogo y viaja su clave, en pantalla y en el servidor (A1-10)', async () => {
  const p = await abrePagina(navegador, servidor.url, PAGINAS['una-pagina'], { contexto: PERFILES.escritorio.contexto });
  await p.fill('#alcaldia', 'coyoacan'); await p.keyboard.press('Tab');
  assert.equal(await p.inputValue('#alcaldia'), 'Coyoacán', 'al salir, lo escrito queda como en el catálogo');
  await p.context().close();
  const { valida } = await servidorCon('<div class="campo" data-campo="ocupacion" data-uso="x."><label class="etiqueta" for="o">Ocupación</label><div class="combo" data-combo data-catalogo="ocupaciones"><input class="control" id="o" name="ocupacion"></div></div>');
  const r = valida({ ocupacion: 'DOCENCIA' }, { catalogos: { ocupaciones: [{ nombre: 'Docencia', valor: 'OC-07' }, { nombre: 'Jardinería', valor: 'OC-11' }] } });
  assert.equal(r.datos.ocupacion, 'Docencia', 'el servidor guarda el nombre oficial');
  assert.equal(r.claves.ocupacion, 'OC-07', 'y devuelve la clave del catálogo');
});

test('cascada sin catálogo: la captura manual llega al paso siguiente y el servidor la acepta; una fila rara no deja la página en blanco (B5-01, B5-03)', async () => {
  const ctx0 = await navegador.newContext(PERFILES.escritorio.contexto);
  await ctx0.route('**/cdmx-ejemplo.js', (r) => r.abort());
  const p = await ctx0.newPage();
  await p.goto(`${servidor.url}/${PAGINAS['por-pasos']}`);
  await llenaSolicitud(p); await continuar(p);
  assert.ok(await p.locator('[data-cascada-lista]').isHidden(), 'la lista se oculta entera');
  assert.ok(await p.locator('#cp').isVisible(), 'el código postal se queda');
  await p.fill('#alcaldia_manual', 'Coyoacán'); await p.fill('#colonia_manual', 'Del Carmen'); await p.fill('#cp', '04100');
  await p.fill('#calle', 'Calle de Prueba'); await p.fill('#num_ext', '1');
  await continuar(p);
  assert.match(await p.locator('[data-paso]:not([hidden]) .titulo-paso').first().textContent(), /contacto|evidencia/i, 'avanza al paso siguiente');
  const datos = await p.evaluate(() => FormKit.iniciar(document.querySelector('form')).payload().datos);
  await ctx0.close();
  const { valida } = await servidorCon('por-pasos');
  const r = valida(datos, {});
  assert.deepEqual(['alcaldia', 'colonia', 'cp', 'alcaldia_manual', 'colonia_manual'].flatMap((c) => de(r, c)), [], 'el servidor acepta la captura manual sin pedir la lista');

  const ctx1 = await navegador.newContext(PERFILES.escritorio.contexto);
  await ctx1.route('**/cdmx-ejemplo.js', async (r) => { const resp = await r.fetch(); r.fulfill({ response: resp, body: `${await resp.text()}\n;window.FORMKIT_CATALOGOS.cdmx.filas.push({ alcaldia: 'Coyoacán', colonia: 'Fila rara', cp: 4100 }, null, { alcaldia: null });` }); });
  const q = await ctx1.newPage();
  const errores = []; q.on('pageerror', (e) => errores.push(e.message));
  await q.goto(`${servidor.url}/${PAGINAS['por-pasos']}`);
  await q.waitForSelector('form[data-formkit="listo"]');
  assert.deepEqual(errores, [], 'sin errores de página');
  assert.ok(await q.locator('[data-paso]:not([hidden])').count(), 'el formulario se ve');
  await ctx1.close();
});

test('el nombre de un archivo largo se recorta conservando su extensión (A1-07)', async () => {
  const p = await abrePlantilla(navegador, servidor.url, { contexto: PERFILES.escritorio.contexto });
  await p.setInputFiles('[data-campo="fotos"] input[type="file"]:not([data-entrada-camara])', [{ name: `${'informe de la visita '.repeat(10)}.pdf`, mimeType: 'application/pdf', buffer: Buffer.concat([Buffer.from('%PDF-1.4\n'), Buffer.alloc(2000, 65)]) }]);
  await p.waitForSelector('[data-campo="fotos"] .arch[data-estado="listo"]', { state: 'attached' });
  const nombre = (await p.locator('[data-campo="fotos"] .arch-nombre').textContent()).trim();
  assert.ok(nombre.length <= 120 && nombre.endsWith('.pdf'), `«${nombre}»`);
  await p.context().close();
});
