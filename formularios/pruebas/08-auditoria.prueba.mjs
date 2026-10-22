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
import { mkdtempSync, writeFileSync, readFileSync, copyFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { createHash } from 'node:crypto';
import { sirve, abreNavegador, abrePagina, abrePlantilla, PERFILES, PAGINAS, RAIZ, visible, continuar, llenaSolicitud, llenaLugar, aceptaDeclaraciones, pngRuido, ocultosVisibles, FRASE_LEGIBLE, PNG_1x1, nuevaPagina, copiaCarpeta } from './ayudas.mjs';

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
  for (const h of ['construir.mjs', 'juntar.mjs', 'esquema-desde-html.mjs']) copyFileSync(resolve(RAIZ, 'herramientas', h), resolve(clon, 'formularios/herramientas', h));
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
  return { valida: (datos, opciones = {}, archivos = [], meta = {}) => validaPayload({ datos, archivos, meta }, esquema, opciones), C: globalThis.FORMKIT_CATALOGOS, esquema };
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
  assert.ok(de(valida({}, {}, [pdf('recibo\u202Efdp.pdf')]), 'docs').length, 'un nombre con un carácter que invierte el texto no pasa');
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

/* ----- Bloque 4 (1.6.1): robustez de carga y envío ----- */

const RUTA_ENVIO = 'pruebas/paginas/envio.html';
const abreEnvio = (consulta = '') => abrePagina(navegador, servidor.url, RUTA_ENVIO, { consulta, contexto: PERFILES.escritorio.contexto });
const ENTRADA_FOTOS = '[data-campo="fotos"] input[type="file"]';
const pdfDe = (marca, bytes = 2000) => Buffer.concat([Buffer.from('%PDF-1.4\n'), Buffer.alloc(bytes, marca)]);
const paginaErrores = (p) => p.registro.filter((x) => x.startsWith('pageerror'));
/* Una página escrita en la prueba, servida junto a las de prueba para que sus rutas relativas funcionen. */
async function enMemoria(html, contexto = {}) {
  const p = await nuevaPagina(navegador, { ...PERFILES.escritorio.contexto, ...contexto });
  const url = `${servidor.url}/pruebas/paginas/en-memoria.html`;
  await p.route(url, (r) => r.fulfill({ contentType: 'text/html; charset=utf-8', body: html }));
  await p.goto(url);
  return p;
}
const NUCLEO = '<script src="../../codigo/js/validaciones.config.js"></script><script src="../../codigo/js/iconos.js"></script><script src="../../codigo/js/formkit.core.js"></script>';

test('envío por omisión: los archivos viajan en multipart; un rechazo del servidor se dice completo, aunque el aviso no traiga dónde escribirlo (B5-07, B5-08, B5-12)', async () => {
  const p = await abreEnvio();
  const llegadas = [];
  await p.route('**/recibe', (r) => {
    llegadas.push({ tipo: r.request().headers()['content-type'] || '', cuerpo: r.request().postDataBuffer() || Buffer.alloc(0) });
    r.fulfill({ status: 422, contentType: 'application/json', body: JSON.stringify({ errores: [{ campo: 'nombre', mensaje: 'Ya hay un registro con ese nombre.' }, { campo: 'no_existe', mensaje: 'La convocatoria cerró el 1 de octubre.' }, { campo: 'a"b', mensaje: 'Revisa los datos.' }] }) });
  });
  await p.fill('#nombre', 'Grupo de prueba');
  await p.setInputFiles(ENTRADA_FOTOS, [{ name: 'oficio.pdf', mimeType: 'application/pdf', buffer: pdfDe('MARCA-DE-PRUEBA ') }]);
  await p.waitForSelector('[data-campo="fotos"] .arch[data-estado="listo"]', { state: 'attached' });
  await p.click('[data-accion="enviar"]');
  await p.waitForSelector('[data-estado-envio]:not([hidden])', { timeout: 5000 });
  const { tipo, cuerpo } = llegadas[0];
  assert.match(tipo, /^multipart\/form-data; boundary=/, 'con archivos, el envío por omisión es multipart');
  const texto = cuerpo.toString('latin1');
  assert.ok(texto.includes('MARCA-DE-PRUEBA'), 'los bytes del archivo llegan');
  assert.match(texto, /name="archivo"; filename="oficio\.pdf"/);
  const json = JSON.parse(texto.match(/name="payload"\r\n\r\n(.*?)\r\n--/s)[1]);
  assert.equal(json.datos.nombre, 'Grupo de prueba');
  assert.deepEqual([json.archivos[0].nombre, json.archivos[0].parte, 'blob' in json.archivos[0]], ['oficio.pdf', 0, false], 'el JSON dice qué parte es cada archivo');
  assert.match(await error(p, 'nombre'), /Ya hay un registro con ese nombre\./, 'el error de un campo va junto a él');
  assert.match(await p.locator('[data-estado-envio]').textContent(), /La convocatoria cerró el 1 de octubre\. Revisa los datos\./, 'los demás, con sus palabras, en el aviso de envío');
  assert.deepEqual(paginaErrores(p), []);
  await p.context().close();
});

test('un envío propio que nunca responde ni atiende la señal no deja el botón en «Enviando…» (B5-13)', async () => {
  const p = await abreEnvio('?colgado');
  await p.fill('#nombre', 'Grupo');
  const boton = p.locator('[data-accion="enviar"]');
  await boton.click();
  await p.waitForSelector('[data-estado-envio]:not([hidden])', { timeout: 4000 });
  assert.equal((await boton.textContent()).trim(), 'Enviar', 'el botón vuelve a su texto');
  assert.equal(await boton.getAttribute('aria-busy'), null);
  assert.match(await p.locator('[data-estado-envio]').textContent(), /tardó demasiado/);
  await p.context().close();
});

test('sin el módulo de acuse, un envío recibido se dice con su folio (B5-10)', async () => {
  const p = await abreEnvio();
  await p.route('**/recibe', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '{"folio":"F-77"}' }));
  await p.fill('#nombre', 'Grupo');
  await p.click('[data-accion="enviar"]');
  await p.waitForSelector('#formulario > [data-aviso-formkit]', { timeout: 5000 });
  assert.match(await p.locator('#formulario > [data-aviso-formkit]').textContent(), /se recibió con el folio F-77/);
  await p.context().close();
});

test('si falta un archivo del estándar la página lo dice, y sin el núcleo el botón de una página no envía (B5-04)', async () => {
  for (const [plantilla, falta] of [['por-pasos', 'pasos/pasos.js'], ['una-pagina', 'js/formkit.core.js'], ['por-pasos', 'js/formkit.core.js']]) {
    const p = await nuevaPagina(navegador, PERFILES.escritorio.contexto);
    await p.route(`**/${falta}`, (r) => r.abort());
    const envios = []; p.on('request', (r) => { if (r.method() === 'POST') envios.push(r.url()); });
    await p.goto(`${servidor.url}/${PAGINAS[plantilla]}`);
    await p.waitForLoadState('load');
    assert.ok(await p.locator('[data-carga-pendiente]').isVisible(), `${plantilla} sin ${falta}: el aviso se ve`);
    if (plantilla === 'una-pagina') {
      await p.fill('#nombre', 'Fulana');
      await p.click('[data-accion="enviar"]');
      await p.waitForTimeout(400);
      assert.deepEqual(envios, [], 'el botón no envía nada a medias');
      assert.equal(await p.inputValue('#nombre'), 'Fulana', 'y lo escrito sigue ahí');
    }
    await p.context().close();
  }
  for (const plantilla of ['por-pasos', 'una-pagina']) {
    const p = await abrePagina(navegador, servidor.url, PAGINAS[plantilla], { contexto: PERFILES.escritorio.contexto });
    await p.waitForSelector('form[data-formkit="listo"]');
    assert.ok(await p.locator('[data-carga-pendiente]').isHidden(), `${plantilla}: con todo cargado el aviso no se ve`);
    await p.context().close();
  }
});

test('lista cerrada sin catálogo: lo dice, acepta lo escrito y el servidor lo recibe con una señal; un módulo que falla no detiene a los demás (B5-02, B5-03)', async () => {
  const p = await nuevaPagina(navegador, PERFILES.escritorio.contexto);
  await p.route('**/tooltip/tooltip.js', async (r) => { const resp = await r.fetch(); r.fulfill({ response: resp, body: `${await resp.text()}\nFormKit.registra('roto', { iniciar() { throw new Error('módulo roto'); } });` }); });
  const consola = []; p.on('console', (m) => consola.push(m.text()));
  await p.goto(`${servidor.url}/${RUTA_ENVIO}`);
  await p.waitForSelector('form[data-formkit="listo"]', { timeout: 3000 });
  assert.ok(consola.some((t) => /«roto» no arrancó/.test(t)), 'la consola dice qué módulo falló');
  assert.match(await p.locator('[data-campo="alcaldia"] .combo-sin-lista').textContent(), /La lista no cargó/, 'el aviso está a la vista');
  await p.fill('#alcaldia', 'Coyoakan'); await p.keyboard.press('Tab');
  assert.equal(await error(p, 'alcaldia'), '', 'lo escrito se acepta');
  const meta = await instancia(p, () => FormKit.iniciar(document.querySelector('form')).payload().meta);
  assert.deepEqual(meta.sin_catalogo, ['alcaldia'], 'y el envío lo señala');
  await p.context().close();
  const { valida } = await servidorCon('<div class="campo" data-campo="alcaldia" data-uso="x."><label class="etiqueta" for="a">Alcaldía</label><div class="combo" data-combo data-catalogo="alcaldias"><input class="control" id="a" name="alcaldia"></div></div>');
  const r = valida({ alcaldia: 'Coyoakan' }, { catalogos: { alcaldias: ['Coyoacán', 'Tlalpan'] } }, [], { sin_catalogo: ['alcaldia'] });
  assert.deepEqual(de(r, 'alcaldia'), [], 'el servidor no lo rechaza');
  assert.ok(r.senales.some((s) => /a mano/.test(s)), 'pero lo señala para revisarlo');
  assert.ok(de(valida({ alcaldia: 'Coyoakan' }, { catalogos: { alcaldias: ['Coyoacán', 'Tlalpan'] } }), 'alcaldia').length, 'sin la señal, fuera del catálogo no pasa');
});

test('si el equipo no deja guardar el borrador, se dice (B5-14)', async () => {
  const p = await nuevaPagina(navegador, PERFILES.escritorio.contexto);
  await p.addInitScript(() => { Storage.prototype.setItem = function () { throw new DOMException('lleno', 'QuotaExceededError'); }; });
  await p.goto(`${servidor.url}/${RUTA_ENVIO}`);
  await p.fill('#nombre', 'Grupo');
  await p.waitForTimeout(1000);
  assert.match(await p.locator('[data-guardado]').textContent(), /no permite guardar el borrador/);
  assert.deepEqual(paginaErrores(p), []);
  await p.context().close();
});

test('un borrador alterado no deja la pantalla vacía ni detiene el formulario (E3-07)', async () => {
  const p = await abrePlantilla(navegador, servidor.url, { contexto: PERFILES.escritorio.contexto });
  await p.evaluate(() => localStorage.setItem('sia-plantilla-pasos', JSON.stringify({ v: '1', t: Date.now(), datos: {}, paso: -1, hechos: [0, 9, 'a'] })));
  await p.reload(); await p.waitForSelector('form[data-formkit="listo"]');
  await p.click('[data-borrador="recuperar"]');
  assert.equal(await p.locator('[data-paso]:not([hidden])').count(), 1, 'con «paso: -1» se ve el primer paso');
  await p.evaluate(() => localStorage.setItem('sia-plantilla-pasos', JSON.stringify({ v: '1', t: Date.now() + 30 * 86400000, datos: { descripcion: 'del futuro' } })));
  await p.reload(); await p.waitForSelector('form[data-formkit="listo"]');
  assert.ok(await p.locator('[data-franja-borrador]').isHidden(), 'un borrador con fecha en el futuro no se ofrece');
  assert.equal(await p.evaluate(() => localStorage.getItem('sia-plantilla-pasos')), null, 'y se borra');
  assert.deepEqual(paginaErrores(p), []);
  await p.context().close();

  const q = await abrePagina(navegador, servidor.url, PAGINAS['una-pagina'], { contexto: PERFILES.escritorio.contexto });
  await q.evaluate(() => {
    localStorage.setItem('sia-plantilla-una-pagina', JSON.stringify({ v: '1', t: Date.now(), datos: { intereses: 5, nombre: 'Fulana' } }));
    localStorage.setItem(`${FormKit.config.chips.clave}:sia-plantilla-una-pagina:alcaldia`, 'null');
  });
  await q.reload(); await q.waitForSelector('form[data-formkit="listo"]', { timeout: 3000 });
  await q.click('[data-borrador="recuperar"]');
  assert.equal(await q.inputValue('#nombre'), 'Fulana', 'lo demás se recupera');
  assert.equal(await q.locator('[data-campo="intereses"] input:checked').count(), 0, '«intereses: 5» no marca nada');
  assert.deepEqual(paginaErrores(q), [], 'sin errores con opciones que no son lista ni con un historial de sugerencias raro');
  await q.context().close();
});

test('«Hoy» después de medianoche, con la página abierta desde antes, no marca la fecha como futura (E3-08)', async () => {
  const p = await nuevaPagina(navegador, { ...PERFILES.escritorio.contexto, timezoneId: 'America/Mexico_City' });
  await p.clock.install({ time: new Date('2026-10-20T05:59:50Z') });
  await p.goto(`${servidor.url}/${RUTA}`);
  await p.waitForSelector('form[data-formkit="listo"]');
  await p.clock.fastForward(20000);
  await p.click('[data-campo="dia"] [data-hoy]');
  assert.equal(await p.inputValue('#dia'), '20/10/2026');
  assert.equal(await error(p, 'dia'), '', 'el nuevo día no es una fecha futura');
  await p.context().close();
  /* La fecha AAAA-MM-DD lleva su máximo en el control: también se recalcula. */
  const q = await nuevaPagina(navegador, { ...PERFILES.escritorio.contexto, timezoneId: 'America/Mexico_City' });
  await q.clock.install({ time: new Date('2026-10-20T05:59:50Z') });
  await q.goto(`${servidor.url}/${PAGINAS['por-pasos']}`);
  await q.waitForSelector('form[data-formkit="listo"]');
  await q.clock.fastForward(20000);
  await q.click('[data-campo="fecha_hechos"] [data-hoy]');
  assert.equal(await q.inputValue('#fecha_hechos'), '2026-10-20');
  assert.equal(await error(q, 'fecha_hechos'), '', 'en la plantilla por pasos, tampoco');
  assert.equal(await q.getAttribute('#fecha_hechos', 'max'), '2026-10-20', 'y el calendario ya permite el día nuevo');
  await q.context().close();
});

test('caracteres invisibles, dígitos de ancho completo, años fuera de rango y 100 000 claves desconocidas (E3-09, E3-10, E3-12)', async () => {
  const campo = (n, f) => `<div class="campo" data-campo="${n}"${f ? ` data-formato="${f}"` : ''} data-uso="x."><label class="etiqueta" for="${n}">${n}</label><input class="control" id="${n}" name="${n}"></div>`;
  const { valida } = await servidorCon(campo('texto') + campo('correo', 'correo') + campo('telefono', 'telefono') + campo('fecha', 'fecha') + campo('dma', 'fecha-dma'));
  const r = valida({ texto: 'Hola\u0000 mun\u0007do', correo: 'ana\u200B@ejemplo.mx', telefono: '\uFF15\uFF15\uFF11\uFF12\uFF13\uFF14\uFF15\uFF16\uFF17\uFF18' });
  assert.deepEqual(r.errores, []);
  assert.deepEqual([r.datos.texto, r.datos.correo, r.datos.telefono], ['Hola mundo', 'ana@ejemplo.mx', '5512345678'], 'sin caracteres de control ni invisibles; los dígitos de ancho completo cuentan');
  for (const [fecha, dma] of [['0100-01-01', '01/01/0100'], ['9999-12-31', '31/12/9999']]) {
    const x = valida({ fecha, dma });
    assert.match(de(x, 'fecha').join(), /entre 1900 y 2100/, `«${fecha}» no pasa`);
    assert.ok(de(x, 'dma').length, `«${dma}» no pasa`);
  }
  const muchas = Object.fromEntries(Array.from({ length: 100000 }, (_, i) => [`x${i}`, '1']));
  const t0 = Date.now();
  const y = valida(muchas);
  assert.ok(y.errores.length <= 21, `${y.errores.length} errores: los primeros y un resumen, no 100 000`);
  assert.ok(Date.now() - t0 < 1500, `${Date.now() - t0} ms`);
  const p = await abre();
  await p.fill('#dia', '01/01/0100'); await p.keyboard.press('Tab');
  assert.match(await error(p, 'dia'), /entre 1900 y 2100/, 'en pantalla también');
  await p.context().close();
});

test('archivos: un aviso para muchos rechazos, una imagen rechazada se puede volver a elegir, «más de 8 MB» y la revisión sólo dice lo que se envía (E3-11, E3-13, F2-03)', async () => {
  const p = await abreEnvio();
  await p.setInputFiles(ENTRADA_FOTOS, [{ name: 'grande.pdf', mimeType: 'application/pdf', buffer: pdfDe('a', 8 * 1048576 + 1 - 9) }]);
  const rechazo = await p.locator('[data-campo="fotos"] [data-rechazos]').textContent();
  assert.match(rechazo, /más de 8 MB/, `«${rechazo}»`);
  assert.doesNotMatch(rechazo, /8\.0 MB/);
  await p.setInputFiles(ENTRADA_FOTOS, Array.from({ length: 12 }, (_, i) => ({ name: `doc-${i}.pdf`, mimeType: 'application/pdf', buffer: pdfDe(`marca ${i} `) })));
  await p.waitForFunction(() => document.querySelectorAll('[data-campo="fotos"] .arch[data-estado="listo"]').length === 3);
  assert.equal(await p.locator('[data-campo="fotos"] .arch-rechazo').count(), 9, 'se dicen los 9 rechazos');
  assert.equal(await p.locator('[data-campo="fotos"] [data-rechazos][role="alert"]').count(), 1, 'en un solo aviso');
  assert.equal(await p.locator('[data-campo="fotos"] .arch-rechazo[role="alert"]').count(), 0, 'no nueve avisos a la vez');
  await p.context().close();

  const q = await abreEnvio();
  await q.setInputFiles(ENTRADA_FOTOS, [{ name: 'oficio.pdf', mimeType: 'application/pdf', buffer: pdfDe('oficio ') }, { name: 'falso.jpg', mimeType: 'image/jpeg', buffer: pdfDe('no es foto ') }]);
  await q.waitForFunction(() => !document.querySelector('[data-campo="fotos"] .arch[data-estado="procesando"]'));
  assert.equal(await instancia(q, () => FormKit.iniciar(document.querySelector('form')).ctx.textoDeValor('fotos')), 'oficio.pdf', 'la revisión no lista lo que no se envía');
  const chica = [{ name: 'chica.png', mimeType: 'image/png', buffer: pngRuido(100, 100) }];
  await q.setInputFiles(ENTRADA_FOTOS, chica);
  await q.waitForFunction(() => document.querySelectorAll('[data-campo="fotos"] .arch[data-estado="error"]').length === 2);
  await q.setInputFiles(ENTRADA_FOTOS, chica);
  await q.waitForFunction(() => document.querySelectorAll('[data-campo="fotos"] .arch[data-estado="error"]').length === 3);
  const ultimo = await q.locator('[data-campo="fotos"] .arch[data-estado="error"]').last().textContent();
  assert.doesNotMatch(ultimo, /ya adjuntaste/i, 'volver a elegirla no dice que está repetida');
  await q.context().close();
});

test('fotos: varias juntas no suman su peso original, y si una que se procesa falla, el envío se detiene y lo dice (E3-04)', async () => {
  const p = await abreEnvio();
  const envios = []; await p.route('**/recibe', (r) => { envios.push(1); r.fulfill({ status: 200, body: '{}' }); });
  await p.setInputFiles(ENTRADA_FOTOS, [1, 2, 3].map((i) => ({ name: `foto-${i}.png`, mimeType: 'image/png', buffer: pngRuido(2400, 1800) })));
  await p.waitForFunction(() => !document.querySelector('[data-campo="fotos"] .arch[data-estado="procesando"]'), null, { timeout: 30000 });
  assert.equal(await p.locator('[data-campo="fotos"] .arch[data-estado="listo"]').count(), 3, `ninguna se rechaza por «se superan los 25 MB»: ${await p.locator('[data-campo="fotos"] .lista-arch').textContent()}`);
  await p.context().close();

  const q = await abreEnvio();
  const llegadas = []; await q.route('**/recibe', (r) => { llegadas.push(1); r.fulfill({ status: 200, body: '{}' }); });
  await q.fill('#nombre', 'Grupo');
  await q.evaluate((bytes) => {
    const el = document.querySelector('[data-campo="fotos"]');
    FormKit.archivos.agrega([new File([new Uint8Array(bytes)], 'chica.png', { type: 'image/png' })], el);
    document.querySelector('[data-accion="enviar"]').click();
  }, [...PNG_1x1]);
  await q.waitForFunction(() => document.querySelector('[data-campo="fotos"] .err').textContent.trim());
  assert.match(await error(q, 'fotos'), /No se agregó «chica\.png»/, 'el error se dice junto al campo');
  assert.deepEqual(llegadas, [], 'y no se envía sin ella');
  await q.context().close();
});

test('archivos: si el proveedor no puede devolverlos al recuperar, se dice; el foco no se pierde cuando termina otro archivo (F2-06, F2-07)', async () => {
  const p = await nuevaPagina(navegador, PERFILES.escritorio.contexto);
  /* Un proveedor que no responde al recuperar (sin red, sesión vencida). */
  await p.route('**/borrador-pagina.js', async (r) => { const resp = await r.fetch(); r.fulfill({ response: resp, body: (await resp.text()).replace('lee: (campo) =>', "lee: () => Promise.reject(new Error('sin red')), leeAntes: (campo) =>") }); });
  await p.goto(`${servidor.url}/pruebas/paginas/borrador.html`);
  await p.fill('#nombre', 'Con proveedor');
  await p.waitForTimeout(900);
  await p.reload();
  await p.waitForSelector('[data-campo="documento"] [data-aviso-formkit]', { timeout: 3000 });
  assert.match(await p.locator('[data-campo="documento"] [data-aviso-formkit]').textContent(), /No se pudieron recuperar los archivos/);
  await p.context().close();

  const q = await abreEnvio();
  await q.setInputFiles(ENTRADA_FOTOS, [{ name: 'oficio.pdf', mimeType: 'application/pdf', buffer: pdfDe('oficio ') }]);
  await q.waitForSelector('[data-campo="fotos"] .arch[data-estado="listo"]', { state: 'attached' });
  await q.setInputFiles(ENTRADA_FOTOS, [{ name: 'foto.png', mimeType: 'image/png', buffer: pngRuido(2000, 1500) }]);
  await q.locator('[data-campo="fotos"] .arch').first().locator('[data-quitar]').focus();
  await q.waitForFunction(() => document.querySelectorAll('[data-campo="fotos"] .arch[data-estado="listo"]').length === 2, null, { timeout: 20000 });
  const foco = await q.evaluate(() => { const a = document.activeElement; return a && a.closest('.arch') ? a.closest('.arch').querySelector('.arch-nombre').textContent.trim() : a.tagName; });
  assert.equal(foco, 'oficio.pdf', 'el foco sigue en el botón de quitar del primer archivo');
  await q.context().close();
});

test('filas agregadas: la CURP pasa a mayúsculas, la ayuda «?» abre y la lista funciona aunque el nombre lleve puntos (F2-09, F2-12)', async () => {
  const p = await abreEnvio();
  await p.click('[data-repetible-agregar]');
  const fila = p.locator('.repetible-fila').first();
  await fila.locator('input[id$="-curp"]').fill('puef900515hdfrjl04');
  assert.equal(await fila.locator('input[id$="-curp"]').inputValue(), 'PUEF900515HDFRJL04');
  await fila.locator('.tooltip-btn').click();
  assert.ok(await fila.locator('.tooltip-texto').isVisible(), 'la ayuda abre');
  const lista = fila.locator('input[id$="-alc"]');
  await lista.click(); await lista.pressSequentially('coy');
  await p.keyboard.press('ArrowDown'); await p.keyboard.press('Enter');
  assert.equal(await lista.inputValue(), 'Coyoacán');
  assert.deepEqual(paginaErrores(p), []);
  await p.context().close();
});

test('mapa: coordenadas sin signo menos llegan al mapa corregidas, Enter en «+» no pone el punto y una ubicación fallida no borra el punto (F2-04, F2-05, F2-12)', async () => {
  const p = await nuevaPagina(navegador, PERFILES.escritorio.contexto);
  await p.route('**/plantillas/por-pasos.html', async (r) => { const resp = await r.fetch(); r.fulfill({ response: resp, body: (await resp.text()).replace('data-mapa data-confirmar', 'data-mapa data-confirmar data-geolocalizacion') }); });
  await p.goto(`${servidor.url}/${PAGINAS['por-pasos']}`);
  await p.evaluate(() => localStorage.clear());
  await llenaSolicitud(p); await continuar(p);
  const estado = () => p.evaluate(() => { const s = FormKit.mapa.estadoDe(document.querySelector('[data-campo="punto"]')); return { punto: s.punto, fuera: s.fuera }; });
  await p.locator('.leaflet-control-zoom-in').focus();
  await p.keyboard.press('Enter');
  assert.equal((await estado()).punto, null, 'Enter sobre «+» acerca y nada más');
  await p.fill('#coordenadas', '19.4326, 99.1332'); await p.keyboard.press('Tab');
  assert.match(await p.inputValue('#coordenadas'), /^19\.4326(00)?, ?-99\.1332(00)?$/, 'el campo queda corregido');
  const s = await estado();
  assert.ok(s.punto && s.punto.lon < 0 && !s.fuera, `el mapa recibe lo corregido: ${JSON.stringify(s)}`);
  const antes = await p.locator('[data-mapa-coords]').textContent();
  await p.click('[data-mapa-geolocalizar]');
  await p.waitForSelector('.mapa-geo-aviso:not([hidden])', { timeout: 12000 });
  assert.equal(await p.locator('[data-mapa-coords]').textContent(), antes, 'el texto del punto se queda');
  assert.match(await p.locator('.mapa-geo-aviso').textContent(), /No se pudo obtener tu ubicación/);
  await p.context().close();
});

test('visor: una imagen que no carga lo dice, y abrir varios PDF no deja vivos sus hilos (B5-11, F2-12)', async () => {
  const p = await nuevaPagina(navegador, PERFILES.escritorio.contexto);
  await p.route('**/muestras/identificacion-muestra.png', (r) => r.fulfill({ status: 404, body: '' }));
  await p.goto(`${servidor.url}/${PAGINAS.guia}`);
  const ver = (archivo) => p.evaluate((a) => document.querySelector(`[data-visor-url$="${a}"]`).click(), archivo);
  await ver('identificacion-muestra.png');
  await p.waitForFunction(() => /No se pudo mostrar/.test(document.querySelector('[data-visor-aviso]').textContent) && !document.querySelector('[data-visor-aviso]').hidden, null, { timeout: 5000 });
  for (const a of ['comprobante-muestra.pdf', 'identificacion-muestra.png', 'comprobante-muestra.pdf', 'identificacion-muestra.png', 'comprobante-muestra.pdf']) {
    await ver(a);
    if (a.endsWith('.pdf')) await p.waitForSelector('[data-visor-hojas] canvas', { timeout: 10000 });
  }
  let hilos = p.workers().length;
  for (let i = 0; i < 20 && hilos > 1; i++) { await p.waitForTimeout(150); hilos = p.workers().length; }
  assert.ok(hilos <= 1, `${hilos} hilos de pdf.js vivos`);
  await p.context().close();
});

test('fechas del servidor sin hora o mal escritas, tabla con todo filtrado, progreso sin valor y un solo «(se abre en otra pestaña)» (B5-09, F2-12)', async () => {
  const p = await enMemoria(`<!doctype html><html lang="es-MX"><head><meta charset="utf-8"><title>Prueba</title></head><body>
<form data-formkit action="#"><div class="campo" data-campo="a" data-uso="Prueba."><label class="etiqueta" for="a">A</label><input class="control" id="a" name="a"></div></form>
<form data-formkit action="#"><div class="campo" data-campo="b" data-uso="Prueba."><label class="etiqueta" for="b">B</label><input class="control" id="b" name="b"></div></form>
<div id="r1"></div><div id="r2"></div>
<div class="progreso" data-progreso><label class="progreso-etq" for="pg">Subiendo</label><progress class="progreso-barra" id="pg" max="100" value="40"></progress><span class="progreso-txt" data-progreso-texto aria-hidden="true">40 %</span></div>
<div class="tabla-marco" data-tabla><table class="tabla"><caption>Personas</caption><thead><tr><th scope="col">Nombre</th></tr></thead><tbody><tr><td>Ana</td></tr><tr><td>Beto</td></tr></tbody></table><p class="tabla-vacia" data-tabla-vacia hidden>No hay resultados con esos filtros.</p></div>
<a class="btn descarga" href="#" target="_blank" data-descarga data-formato="PDF" data-peso="120 KB">Descargar guía</a>
${NUCLEO}<script src="../../codigo/modulos/resultado/resultado.js"></script><script src="../../codigo/modulos/progreso/progreso.js"></script><script src="../../codigo/modulos/tabla/tabla.js"></script><script src="../../codigo/modulos/descarga/descarga.js"></script></body></html>`);
  await p.waitForFunction(() => [...document.querySelectorAll('form')].every((f) => f.dataset.formkit === 'listo'));
  const r = await p.evaluate(() => {
    FormKit.resultado(document.getElementById('r1'), { tono: 'terminado', titulo: 'Listo', hora: '2026-10-19' });
    FormKit.resultado(document.getElementById('r2'), { tono: 'terminado', titulo: 'Listo', hora: 'ayer por la tarde' });
    const el = document.querySelector('[data-progreso]'); FormKit.progreso(el, 70); FormKit.progreso(el, null);
    for (const tr of document.querySelectorAll('tbody tr')) tr.hidden = true;
    document.querySelector('[data-tabla]').dispatchEvent(new CustomEvent('formkit:tabla'));
    return {
      sinHora: document.querySelector('#r1 time').textContent, conTexto: document.querySelector('#r2 .resultado-titulo') && document.querySelector('#r2 time').dateTime,
      valuetext: el.querySelector('progress').getAttribute('aria-valuetext'),
      vacia: document.querySelector('[data-tabla-vacia]').hidden,
      descarga: document.querySelector('[data-descarga]').textContent.replace(/\s+/g, ' ').trim()
    };
  });
  assert.equal(r.sinHora, '19 de octubre de 2026', 'una fecha sin hora es ese día, no el anterior');
  assert.ok(r.conTexto, 'una fecha mal escrita no deja la pantalla sin resultado');
  assert.notEqual(r.valuetext, '70 por ciento', 'el progreso sin valor no repite el porcentaje anterior');
  assert.equal(r.vacia, false, 'con todas las filas ocultas se dice que no hay resultados');
  assert.equal((r.descarga.match(/otra pestaña/g) || []).length, 1, `«${r.descarga}»`);
  assert.deepEqual(paginaErrores(p), []);
  await p.context().close();
});

test('«Empezar de nuevo» sin la pregunta en el HTML pregunta con el módulo modal; no borra sin preguntar (B5-12)', async () => {
  const html = `<!doctype html><html lang="es-MX"><head><meta charset="utf-8"><title>Prueba</title><link rel="stylesheet" href="../../codigo/css/tokens.css"><link rel="stylesheet" href="../../codigo/css/base.css"><link rel="stylesheet" href="../../codigo/css/nucleo.css"><link rel="stylesheet" href="../../codigo/modulos/modal/modal.css"></head><body><main class="pagina">
<div class="franja" data-franja-borrador hidden><p class="franja-texto">Hay un borrador guardado el <span data-borrador-fecha></span>.</p>
<button type="button" class="btn btn-secundario" data-borrador="recuperar">Recuperar borrador</button><button type="button" class="btn btn-secundario" data-borrador="descartar">Empezar de nuevo</button></div>
<form data-formkit data-borrador="prueba-descartar" data-borrador-version="1" action="#"><div class="campo" data-campo="a" data-uso="Prueba."><label class="etiqueta" for="a">A</label><input class="control" id="a" name="a"></div></form>
</main>${NUCLEO}<script src="../../codigo/modulos/modal/modal.js"></script></body></html>`;
  const p = await enMemoria(html);
  await p.evaluate(() => localStorage.setItem('prueba-descartar', JSON.stringify({ v: '1', t: Date.now(), datos: { a: 'Lo de ayer' } })));
  await p.reload();
  await p.click('[data-borrador="descartar"]');
  await p.waitForSelector('dialog[open]', { timeout: 2000 });
  assert.notEqual(await p.evaluate(() => localStorage.getItem('prueba-descartar')), null, 'mientras pregunta, el borrador sigue');
  await p.click('dialog[open] [data-r="si"]');
  await p.waitForFunction(() => localStorage.getItem('prueba-descartar') === null);
  assert.ok(await p.locator('[data-franja-borrador]').isHidden(), 'al confirmar se borra y la franja se va');
  assert.deepEqual(paginaErrores(p), []);
  await p.context().close();
});

test('el código no lleva caracteres invisibles ni que inviertan el texto escritos tal cual', () => {
  const archivos = execFileSync('git', ['ls-files', 'codigo', 'herramientas', 'pruebas', 'guia-visual'], { cwd: RAIZ, encoding: 'utf8' }).trim().split('\n').filter((f) => /\.(m?js|html|css)$/.test(f) && !/artefacto\.html$/.test(f));
  const con = archivos.filter((f) => /[\u200B-\u200F\u202A-\u202E\u2060-\u2069\uFEFF]/.test(readFileSync(resolve(RAIZ, f), 'utf8')));
  assert.deepEqual(con, [], 'se escriben como \\u200B, que se ve al leer el código');
});

/* ---------- Bloque 5 (1.6.2): uso y textos ---------- */

const pasoVisible = (p) => p.evaluate(() => [...document.querySelectorAll('[data-paso]')].findIndex((s) => !s.hidden));
const hastaRevision = async (p) => { await llenaSolicitud(p); await continuar(p); await llenaLugar(p); await continuar(p); await p.check('input[name="contacto"][value="no"]'); await continuar(p); };
const textoVisible = (ruta) => readFileSync(resolve(RAIZ, ruta), 'utf8').replace(/<!--[\s\S]*?-->/g, ' ').replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<[^>]+>/g, ' ');

test('textos: sin «nosotros», con género parejo y un solo nombre para «fuera de la Ciudad» (C5-03, C5-05, C5-07)', async () => {
  await import(pathToFileURL(resolve(RAIZ, 'codigo/js/validaciones.config.js')).href);
  const M = globalThis.FORMKIT_VALIDACIONES.mensajes;
  const NOSOTROS = /\b(recibimos|podemos|encontramos|tomamos|cu[eé]ntanos|contactemos|pedimos|contarnos|nosotros|nuestr[oa]s?)\b/i;
  const fuentes = { mensajes: Object.values(M).join('\n'), 'por-pasos': textoVisible('codigo/plantillas/por-pasos.html'), 'una-pagina': textoVisible('codigo/plantillas/una-pagina.html'), encuesta: textoVisible('guia-visual/ejemplos/encuesta.html'), 'captura-interna': textoVisible('guia-visual/ejemplos/captura-interna.html') };
  for (const [donde, t] of Object.entries(fuentes)) {
    assert.doesNotMatch(t, NOSOTROS, `${donde} habla en «nosotros»: «${(t.match(NOSOTROS) || [])[0]}»`);
    assert.doesNotMatch(t, /incluida tú|estás segur[oa]/i, `${donde}: género no parejo`);
  }
  for (const k of ['curpDerivado', 'cascadaCpTomado', 'cascadaTomadaCp', 'repetibleAgregado', 'chipsAgregado', 'fechaEdadCalculada']) assert.doesNotMatch(M[k], /\b(tomad[oa]|agregad[oa]|calculad[oa])\b/, `${k} fija el género: «${M[k]}»`);
  assert.doesNotMatch(M.mapaFuera, /ámbito/, 'el punto fuera se dice como en el resto: fuera de la Ciudad');
});

test('textos: ninguno queda escrito en el código de un módulo; todos salen de los mensajes (C5-04)', () => {
  const BS = String.fromCharCode(92);
  function cadenas(src) {
    const out = []; let i = 0, linea = 1;
    while (i < src.length) {
      const c = src[i];
      if (c === '\n') { linea++; i++; continue; }
      if (c === '/' && src[i + 1] === '*') { const f = src.indexOf('*/', i + 2); for (const x of src.slice(i, f)) if (x === '\n') linea++; i = f + 2; continue; }
      if (c === '/' && src[i + 1] === '/') { i = src.indexOf('\n', i); continue; }
      if (c === '/' && /[=(,:!&|?{};]\s*$/.test(src.slice(Math.max(0, i - 3), i))) {
        let j = i + 1;
        while (j < src.length && src[j] !== '/') { if (src[j] === BS) j++; else if (src[j] === '[') { while (j < src.length && src[j] !== ']') { if (src[j] === BS) j++; j++; } } j++; }
        i = j + 1; continue;
      }
      if (c === "'" || c === '"' || c === '`') {
        let j = i + 1, s = ''; const l0 = linea;
        while (j < src.length && src[j] !== c) { if (src[j] === BS) { s += src[j + 1]; j += 2; continue; } if (src[j] === '\n') linea++; s += src[j]; j++; }
        out.push({ linea: l0, s, previo: src.slice(Math.max(0, src.lastIndexOf('\n', i)), i) });
        i = j + 1; continue;
      }
      i++;
    }
    return out;
  }
  const archivos = ['codigo/js/formkit.core.js', ...execFileSync('git', ['ls-files', 'codigo/modulos'], { cwd: RAIZ, encoding: 'utf8' }).trim().split('\n').filter((f) => /\/([\w-]+)\/\1\.js$/.test(f))];
  const fijos = [];
  for (const a of archivos) {
    for (const { linea, s, previo } of cadenas(readFileSync(resolve(RAIZ, a), 'utf8'))) {
      if (/console\.(warn|error|log)\(|new Error\(|throw /.test(previo)) continue;
      const t = s.replace(/\$\{[^}]*\}/g, ' ').trim();
      if (!t || t === 'use strict' || /^[A-Z][a-z]+(-[A-Z][a-z]+)+$/.test(t) || ['Files', 'Point'].includes(t)) continue;
      if (/className|classList|querySelector|closest\(|matches\(|\$\$?\(|setAttribute\('(class|role|aria-(?:controls|describedby|current|sort|checked|selected|expanded|pressed|busy|disabled|hidden|live|modal))'|createElement\(|createElementNS|addEventListener\(|dispatchEvent|CustomEvent\(|key ===|e\.key|tagName|type ===|type !==|dataset\.\w+ *(?:===|!==|=) *$|toggleAttribute|removeAttribute|hasAttribute|getAttribute/.test(previo.slice(-60))) continue;
      if (/^[A-Z]+$/.test(t) || /^[a-z]+[A-Z]\w*$/.test(t) || /^[A-Z][a-z]+([A-Z][a-z]+)+$/.test(t) || /^_\w+$/.test(t) || /\.\w{2,4}$/.test(t)) continue;
      const aPersona = /setAttribute\('(aria-label|aria-valuetext|title|alt|placeholder)', *$|textContent *= *$|createTextNode\($|= *$/.test(previo.trimEnd());
      if (!aPersona && /^[a-z0-9-]+( [a-z0-9-]+)*$/.test(t)) continue;
      if (/[[\]#:>=*()]|^\./.test(t) || !/[A-Za-zÁÉÍÓÚáéíóúñÑ]{3,}/.test(t)) continue;
      if (!/[áéíóúñ]|^[A-ZÁÉÍÓÚ¿¡][a-záéíóúñ]+|\s(de|del|la|el|por|para|con|un|una|sin)\s|^por /.test(t)) continue;
      fijos.push(`${a}:${linea} «${s}»`);
    }
  }
  assert.deepEqual(fijos, [], 'los textos que ve o escucha la persona salen de mensajes (un formulario de usted los cambia ahí)');
});

test('formatos: el apóstrofo del iPhone, correos mal escritos, «+52 1 55…», fechas día/mes/año y años de dos cifras (F2-11, C5-08, C5-01)', async () => {
  await import(pathToFileURL(resolve(RAIZ, 'codigo/js/validaciones.config.js')).href);
  const C = globalThis.FORMKIT_VALIDACIONES;
  const v = (f, x) => { const n = C.formatos[f].normaliza(x); return { n, m: C.formatos[f].valida(n, {}, C) }; };
  assert.deepEqual(v('nombre', 'D’Angelo'), { n: "D'Angelo", m: '' }, 'el apóstrofo tipográfico se acepta y se guarda simple');
  assert.equal(v('correo', 'ana lopez@gmail.com').m, C.mensajes.fmtCorreoEspacios, 'un espacio no se quita en silencio');
  for (const c of ['ana@b..com', 'ana..x@dominio.mx', 'a,b@dominio.mx', '.ana@dominio.mx', 'ana@-x.mx']) assert.ok(v('correo', c).m, `«${c}» se rechaza`);
  for (const c of ['Ana.Lopez@Gmail.com', 'nombre@sub.dominio.com.mx', 'a+b@dominio-uno.mx', 'josé@dominio.mx']) assert.equal(v('correo', c).m, '', `«${c}» se acepta`);
  for (const [t, n] of [['+52 1 55 1234 5678', '5512345678'], ['044 55 1234 5678', '5512345678'], ['01 55 1234 5678', '5512345678'], ['+52 55 1234 5678', '5512345678'], ['5212345678', '5212345678']]) assert.deepEqual(v('telefono', t), { n, m: '' }, `«${t}»`);
  assert.deepEqual(v('fecha', '15/03/2026'), { n: '2026-03-15', m: '' }, 'una fecha escrita día/mes/año se acepta y se guarda AAAA-MM-DD');
  assert.doesNotMatch(C.mensajes.fmtFecha, /AAAA/, 'el mensaje habla en día/mes/año');
  assert.equal(v('fecha-dma', '23/07/85').m, C.mensajes.fmtFechaDmaAnio, 'un año de dos cifras se pide completo');
});

test('a la vista: «Hoy» y la revisión dicen la fecha día/mes/año, el contador cuenta como el mensaje y la ayuda «?» no entra en el error (C5-01, C5-09, C5-02)', async () => {
  const p = await abrePlantilla(navegador, servidor.url, { contexto: PERFILES.escritorio.contexto });
  const hoy = await p.evaluate(() => FormKit.config.dmaDeIso(FormKit.config.hoyISO()));
  await p.click('[data-campo="fecha_hechos"] [data-hoy]'); await p.waitForTimeout(150);
  assert.ok((await p.locator('[data-anuncios]').textContent()).includes(hoy), 'el anuncio de «Hoy» dice día/mes/año');
  await p.fill('#descripcion', 'Una  fuga   de agua');
  assert.equal((await p.locator('[data-campo="descripcion"] .contador').textContent()).trim(), `${'Una fuga de agua'.length} / 600`, 'el contador no cuenta espacios repetidos');
  await hastaRevision(p);
  const fecha = await p.evaluate(() => [...document.querySelectorAll('[data-revision] .rev-dato-etq')].find((d) => /Cuándo/.test(d.textContent)).nextElementSibling.textContent);
  assert.equal(fecha, hoy, 'la revisión dice la fecha día/mes/año');
  await p.context().close();
  const u = await abrePagina(navegador, servidor.url, PAGINAS['una-pagina'], { contexto: PERFILES.escritorio.contexto });
  await u.click('[data-accion="enviar"]'); await u.waitForTimeout(200);
  const enlace = (await u.locator('.resumen-errores a').allTextContents()).find((t) => /Personas en tu hogar/.test(t));
  assert.equal(enlace, 'Completa «Personas en tu hogar».', 'la etiqueta del error no lleva el texto de la ayuda «?»');
  await u.context().close();
});

test('sugerencias de uso frecuente: salir del campo no mueve lo de abajo, y con teclado el foco no se pierde al elegir una (C2-02, B4-01)', async () => {
  const p = await abrePagina(navegador, servidor.url, PAGINAS['una-pagina'], { contexto: PERFILES.escritorio.contexto });
  await p.click('#alcaldia'); await p.locator('#alcaldia').pressSequentially('coy'); await p.keyboard.press('ArrowDown'); await p.keyboard.press('Enter');
  const y = () => p.locator('input[name="intereses"][value="talleres"]').evaluate((e) => Math.round(e.getBoundingClientRect().top + scrollY));
  const antes = await y();
  await p.locator('label:has(input[name="intereses"][value="talleres"])').click();
  assert.ok(await p.isChecked('input[name="intereses"][value="talleres"]'), 'el toque que sale del campo marca la opción tocada');
  assert.equal(await y(), antes, 'salir del campo no mueve lo de abajo');
  await p.waitForTimeout(700);
  await p.reload(); await p.waitForSelector('form[data-formkit="listo"]');
  const chip = p.locator('.chips:not(.chips-fijos) .chip').first();
  assert.equal(await chip.count(), 1, 'al volver, la sugerencia está');
  await chip.focus(); await p.keyboard.press('Enter'); await p.waitForTimeout(100);
  assert.equal(await p.inputValue('#alcaldia'), 'Coyoacán');
  assert.ok(await p.evaluate(() => document.activeElement.matches('.chip')), 'Enter deja el foco en la sugerencia');
  const ruta = [];
  for (let i = 0; i < 6; i++) { await p.keyboard.press('Tab'); const f = await p.evaluate(() => (document.activeElement === document.body ? 'body' : document.activeElement.id || document.activeElement.className)); ruta.push(f); if (f === 'alcaldia') break; }
  assert.ok(!ruta.includes('body') && ruta.includes('alcaldia'), `con Tab se llega al campo sin perder el foco: ${ruta.join(' → ')}`);
  await p.context().close();
});

test('revisión: un «Editar» por bloque, abierto, que lleva a su primer campo; la bajada dice lo que se ve (C3-01)', async () => {
  const p = await abrePlantilla(navegador, servidor.url, { contexto: PERFILES.movil.contexto });
  await hastaRevision(p);
  const r = await p.evaluate(() => { const s = document.querySelector('[data-revision]'); return { editar: s.querySelectorAll('[data-editar]').length, bloques: s.querySelectorAll('.rev-bloque').length, plegables: s.querySelectorAll('details').length, bajada: s.querySelector('.bajada').textContent }; });
  assert.ok(r.bloques >= 3 && r.editar === r.bloques, `un «Editar» por bloque: ${r.editar} en ${r.bloques}`);
  assert.equal(r.plegables, 0, 'los bloques están abiertos, sin plegar');
  assert.doesNotMatch(r.bajada, /Abre cada bloque/);
  await p.locator('.rev-bloque').nth(1).locator('[data-editar]').click(); await p.waitForTimeout(150);
  assert.equal(await p.evaluate(() => document.activeElement.id), 'calle');
  await p.context().close();
});

test('«Atrás» del navegador regresa un paso y «Adelante» vuelve a avanzar; desde el primero sale de la página (C4-05)', async () => {
  const p = await nuevaPagina(navegador, PERFILES.movil.contexto);
  await p.goto(`${servidor.origen}/guia-visual/index.html`);
  await p.goto(`${servidor.url}/${PAGINAS['por-pasos']}`);
  await p.waitForSelector('form[data-formkit="listo"]');
  await p.evaluate(() => localStorage.clear());
  await llenaSolicitud(p); await continuar(p);
  assert.equal(await pasoVisible(p), 1);
  await p.goBack(); await p.waitForTimeout(200);
  assert.match(p.url(), /por-pasos\.html/, '«Atrás» no saca del formulario');
  assert.equal(await pasoVisible(p), 0, 'regresa al paso anterior');
  await p.goForward(); await p.waitForTimeout(200);
  assert.equal(await pasoVisible(p), 1, '«Adelante» vuelve al paso siguiente');
  await visible(p, '[data-accion="atras"]').click(); await p.waitForTimeout(200);
  assert.equal(await pasoVisible(p), 0, 'el «Atrás» del formulario hace lo mismo');
  await p.goBack(); await p.waitForTimeout(400);
  assert.doesNotMatch(p.url(), /por-pasos\.html/, 'desde el primer paso, «Atrás» sale de la página');
  await p.context().close();
});

test('dos pestañas con el mismo formulario: cada una dice que la otra guardó y, si la otra envía, deja de guardar (C4-02)', async () => {
  const ctx = await navegador.newContext({ ...PERFILES.escritorio.contexto, locale: 'es-MX' });
  const url = `${servidor.url}/pruebas/paginas/en-memoria.html`;
  const html = `<!doctype html><html lang="es-MX"><head><meta charset="utf-8"><title>Prueba</title></head><body>
<form data-formkit data-borrador="prueba-pestanas" data-borrador-version="1" action="#"><div class="campo" data-campo="a" data-uso="Prueba."><label class="etiqueta" for="a">A</label><input class="control" id="a" name="a"></div><button type="submit" data-accion="enviar">Enviar</button></form>
<script>window.FORMKIT_CONFIG = { borrador: { retardoMs: 50 } }; window.FORMKIT_OPCIONES = { enviar: () => Promise.resolve({ folio: 'F-1' }) };</script>${NUCLEO}</body></html>`;
  await ctx.route(url, (r) => r.fulfill({ contentType: 'text/html; charset=utf-8', body: html }));
  const a = await ctx.newPage(); const b = await ctx.newPage();
  await a.goto(url); await b.goto(url);
  await b.evaluate(() => localStorage.clear());
  const avisoDe = (pg) => pg.evaluate(() => (document.querySelector('form [data-aviso-formkit]') || {}).textContent || '');
  await a.fill('#a', 'Escrito en A'); await a.waitForTimeout(400);
  assert.match(await avisoDe(b), /otra pestaña/, 'B dice que A guardó');
  await a.click('[data-accion="enviar"]'); await a.waitForTimeout(400);
  assert.match(await avisoDe(b), /ya se envió/, 'B dice que A envió');
  await b.fill('#a', 'Escrito en B'); await b.waitForTimeout(400);
  assert.equal(await b.evaluate(() => localStorage.getItem('prueba-pestanas')), null, 'B no rehace el borrador de lo que ya se envió');
  await ctx.close();
});

test('borrador: al recuperarlo, el foco va a un aviso que dice el paso y qué volver a llenar; el consentimiento no se guarda; «Empezar de nuevo» vacía la pantalla (C4-10, C4-04, C4-12, C4-05)', async () => {
  const p = await abrePlantilla(navegador, servidor.url, { contexto: PERFILES.escritorio.contexto });
  await llenaSolicitud(p); await continuar(p); await llenaLugar(p); await continuar(p);
  await p.setInputFiles('[data-archivos] input[type="file"]:not([data-entrada-camara])', [{ name: 'foto.png', mimeType: 'image/png', buffer: pngRuido(400, 300) }]); await p.waitForTimeout(900);
  await p.check('input[name="contacto"][value="si"]'); await p.fill('#nombre', 'Fulana'); await p.fill('#apellido_paterno', 'de Tal'); await p.fill('#correo', 'fulana@ejemplo.local');
  await continuar(p); await aceptaDeclaraciones(p); await p.waitForTimeout(900);
  const datos = await p.evaluate(() => JSON.parse(localStorage.getItem('sia-plantilla-pasos')).datos);
  assert.ok(!('aviso' in datos) && !('humano' in datos), `el consentimiento y la casilla de persona no van al borrador: ${Object.keys(datos).join(', ')}`);
  await p.reload(); await p.waitForSelector('form[data-formkit="listo"]');
  await p.click('[data-borrador="recuperar"]'); await p.waitForTimeout(150);
  const foco = await p.evaluate(() => (document.activeElement.closest('.aviso') ? document.activeElement.textContent : ''));
  assert.match(foco, /paso 4 de 4/, `el aviso con el foco dice dónde quedó: «${foco}»`);
  assert.match(foco, /Nombre\(s\).*Correo electrónico/, 'y qué hay que volver a llenar');
  assert.match(foco, /archivos no se guardan.*Fotografías o documentos/, 'y dónde volver a agregar los archivos');
  await p.reload(); await p.waitForSelector('form[data-formkit="listo"]');
  await p.fill('#descripcion', 'Escrito antes de decidir');
  await p.click('[data-borrador="descartar"]'); await p.click('[data-borrador="descartar-si"]'); await p.waitForTimeout(150);
  assert.equal(await p.inputValue('#descripcion'), '', '«Empezar de nuevo» vacía lo que se ve');
  assert.match(await p.evaluate(() => document.activeElement.textContent), /Se descartó el borrador/, 'y el foco va al aviso que lo dice');
  await p.context().close();
  /* Lo mismo con un interruptor: vuelve a como venía en el HTML. */
  const u = await abrePagina(navegador, servidor.url, PAGINAS['una-pagina'], { contexto: PERFILES.escritorio.contexto });
  await u.click('[data-toggle]'); await u.waitForTimeout(900);
  await u.reload(); await u.waitForSelector('form[data-formkit="listo"]');
  await u.click('[data-toggle]');
  await u.click('[data-borrador="descartar"]'); await u.click('[data-borrador="descartar-si"]'); await u.waitForTimeout(150);
  assert.equal(await u.getAttribute('[data-toggle]', 'aria-checked'), 'false', '«Empezar de nuevo» apaga el interruptor');
  await u.context().close();
});

test('mientras se envía, «Enviando…» se anuncia y se lee, y no se puede cambiar de paso (B4-04, C4-11)', async () => {
  const p = await abrePlantilla(navegador, servidor.url, { consulta: '?simular=lento', contexto: PERFILES.escritorio.contexto });
  await hastaRevision(p); await aceptaDeclaraciones(p);
  await visible(p, '[data-accion="enviar"]').click(); await p.waitForTimeout(250);
  const r = await p.evaluate(() => { const b = document.querySelector('[data-accion="enviar"]'); return { anuncio: document.querySelector('[data-anuncios]').textContent, opacidad: getComputedStyle(b).opacity, atras: document.querySelector('[data-paso]:not([hidden]) [data-accion="atras"]').getAttribute('aria-disabled') }; });
  assert.equal(r.anuncio, 'Enviando…', '«Enviando…» se anuncia');
  assert.equal(r.opacidad, '1', 'y no se ve apagado');
  assert.equal(r.atras, 'true', '«Atrás» queda inactivo mientras se envía');
  /* force: Playwright espera a que un botón con aria-disabled se habilite; aquí se toca como lo haría la persona. */
  await visible(p, '[data-accion="atras"]').click({ force: true }); await p.waitForTimeout(150);
  assert.equal(await pasoVisible(p), 3, 'sigue en la revisión, donde aparecerá el aviso si el envío falla');
  await p.context().close();
});

test('la plantilla de una página tiene su pantalla de límite, que regresa a lo capturado (C4-13)', async () => {
  const p = await abrePagina(navegador, servidor.url, PAGINAS['una-pagina'], { consulta: '?simular=limite', contexto: PERFILES.escritorio.contexto });
  await p.fill('#nombre', 'Fulano'); await p.fill('#apellido_paterno', 'Prueba'); await p.fill('#apellido_materno', 'Ejemplo');
  await p.fill('#curp', 'PUEF900515HDFRJL04'); await p.keyboard.press('Tab');
  await p.fill('#correo', 'fulano@ejemplo.local'); await p.fill('#correo2', 'fulano@ejemplo.local');
  await p.fill('#personas', '3');
  await p.click('#alcaldia'); await p.locator('#alcaldia').pressSequentially('coy'); await p.keyboard.press('ArrowDown'); await p.keyboard.press('Enter');
  await p.check('input[name="intereses"][value="talleres"]');
  await p.click('[data-atajo="7"]');
  await p.check('input[name="interes"][value="4"]');
  await p.check('input[name="aviso"]');
  await p.click('[data-accion="enviar"]'); await p.waitForTimeout(1000);
  assert.ok(await p.locator('[data-limite]').isVisible(), `aparece la pantalla de límite (errores: ${(await p.locator('.resumen-errores a').allTextContents()).join(' | ')})`);
  assert.match(await p.evaluate(() => document.activeElement.textContent), /no se reciben más envíos/);
  await p.click('[data-limite] [data-accion="reintentar"]');
  assert.ok(await p.locator('form').isVisible(), 'regresa al formulario');
  assert.equal(await p.inputValue('#nombre'), 'Fulano', 'con lo capturado');
  await p.context().close();
});

test('tabla: ordena como en español, las fechas día/mes/año como fechas, conserva el orden al repintar, y el foco se ve sobre la cabecera guinda (F2-10, A6-01)', async () => {
  const p = await enMemoria(`<!doctype html><html lang="es-MX"><head><meta charset="utf-8"><title>Prueba</title><link rel="stylesheet" href="../../codigo/css/tokens.css"><link rel="stylesheet" href="../../codigo/css/base.css"><link rel="stylesheet" href="../../codigo/css/nucleo.css"><link rel="stylesheet" href="../../codigo/modulos/tabla/tabla.css"></head><body>
<div class="tabla-marco" data-tabla><table class="tabla"><caption>Personas</caption><thead><tr><th scope="col" data-ordenable>Nombre</th><th scope="col" data-ordenable>Fecha</th></tr></thead><tbody>
<tr><td>Zamora</td><td>15/01/2026</td></tr><tr><td>Ñúñez</td><td>01/12/2025</td></tr><tr><td>Álvarez</td><td>05/03/2026</td></tr><tr><td>Beltrán</td><td>28/02/2026</td></tr></tbody></table></div>
${NUCLEO}<script src="../../codigo/modulos/tabla/tabla.js"></script></body></html>`);
  const col = (i) => p.locator(`tbody tr td:nth-child(${i})`).allTextContents().then((l) => l.map((t) => t.trim()));
  await p.keyboard.press('Tab');
  const foco = await p.evaluate(() => ({ en: document.activeElement.className, color: getComputedStyle(document.activeElement).outlineColor }));
  assert.equal(foco.en, 'tabla-orden');
  assert.equal(foco.color, 'rgb(255, 255, 255)', 'sobre la cabecera guinda el anillo de foco va en blanco');
  await p.click('th:nth-child(1) .tabla-orden');
  assert.deepEqual(await col(1), ['Álvarez', 'Beltrán', 'Ñúñez', 'Zamora'], 'la tilde y la Ñ van en su lugar');
  await p.click('th:nth-child(2) .tabla-orden');
  assert.deepEqual(await col(2), ['01/12/2025', '15/01/2026', '28/02/2026', '05/03/2026'], 'las fechas se ordenan como fechas');
  await p.click('th:nth-child(2) .tabla-orden');
  await p.evaluate(() => { const tr = document.createElement('tr'); tr.innerHTML = '<td>Nava</td><td>31/12/2026</td>'; document.querySelector('tbody').appendChild(tr); document.querySelector('[data-tabla]').dispatchEvent(new CustomEvent('formkit:tabla')); });
  assert.equal((await col(2))[0], '31/12/2026', 'la fila nueva toma el orden que dice el encabezado');
  assert.deepEqual(paginaErrores(p), []);
  await p.context().close();
});

test('mapa: acercar y alejar en español y de 44 px, la ubicación imprecisa se dice aproximada, y sin Leaflet la consola queda limpia (G2-02, B1-03, B6-03, B6-04)', async () => {
  const p = await nuevaPagina(navegador, { ...PERFILES.movil.contexto, geolocation: { latitude: 19.43, longitude: -99.13, accuracy: 3000 }, permissions: ['geolocation'] });
  await p.route('**/plantillas/por-pasos.html', async (r) => { const resp = await r.fetch(); r.fulfill({ response: resp, body: (await resp.text()).replace('data-mapa data-confirmar', 'data-mapa data-confirmar data-geolocalizacion') }); });
  await p.goto(`${servidor.url}/${PAGINAS['por-pasos']}`);
  await p.evaluate(() => localStorage.clear());
  await llenaSolicitud(p); await continuar(p);
  const z = await p.evaluate(() => { const a = document.querySelector('.leaflet-control-zoom-in'); const r = a.getBoundingClientRect(); return { titulo: a.title, nombre: a.getAttribute('aria-label'), ancho: r.width, alto: r.height }; });
  assert.equal(z.titulo, 'Acercar'); assert.equal(z.nombre, 'Acercar');
  assert.ok(z.ancho >= 44 && z.alto >= 44, `«Acercar» mide ${z.ancho}×${z.alto}`);
  assert.ok(await p.evaluate(() => !!window.leafletGestureHandling), 'el módulo cargó el complemento de gestos');
  await p.click('[data-mapa-geolocalizar]');
  await p.waitForSelector('.mapa-geo-aviso:not([hidden])', { timeout: 5000 });
  assert.match(await p.locator('.mapa-geo-aviso').textContent(), /aproximada.*3000 m/);
  await p.context().close();
  const q = await nuevaPagina(navegador, PERFILES.escritorio.contexto);
  await q.route('**/vendor/leaflet/leaflet.js', (r) => r.fulfill({ status: 404, body: '' }));
  await q.goto(`${servidor.url}/${PAGINAS['por-pasos']}`);
  await q.waitForSelector('form[data-formkit="listo"]');
  assert.deepEqual(paginaErrores(q), [], 'sin Leaflet no hay errores en la consola');
  await q.context().close();
});

test('pantalla: «Borrador guardado» tiene su renglón reservado, la barra deja de ser fija en pantallas bajas y las ayudas miden 14 px en el teléfono (C2-11, B4-03, decisión 27)', async () => {
  const p = await abrePlantilla(navegador, servidor.url, { contexto: PERFILES.movil.contexto });
  const alto = () => p.evaluate(() => Math.round(document.querySelector('[data-guardado]').getBoundingClientRect().height));
  const antes = await alto();
  await p.check('input[name="tipo"][value="visita"]');
  await p.waitForSelector('[data-guardado][data-visible]', { timeout: 3000 });
  assert.ok(antes > 0 && await alto() === antes, `aparecer no cambia su alto (${antes} → ${await alto()}): el formulario no se mueve`);
  assert.deepEqual(await p.evaluate(() => [getComputedStyle(document.querySelector('.ayuda')).fontSize, getComputedStyle(document.querySelector('.contador')).fontSize]), ['14px', '14px'], 'ayuda y contador a 14 px en el teléfono');
  const m = await p.evaluate(() => ({ margen: parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop), barra: document.querySelector('.barra-fija').getBoundingClientRect().height }));
  assert.ok(m.margen >= m.barra, `el margen de desplazamiento (${m.margen}) cubre la barra (${m.barra})`);
  await p.setViewportSize({ width: 640, height: 360 }); await p.waitForTimeout(300);
  assert.equal(await p.evaluate(() => getComputedStyle(document.querySelector('.barra-fija')).position), 'static', 'con menos de 500 px de alto la barra no es fija');
  assert.equal(await p.evaluate(() => parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop)), 0);
  await p.context().close();
});

test('compartir el acuse lleva el folio y la fecha, no la dirección del formulario (C2-01)', async () => {
  const p = await nuevaPagina(navegador, PERFILES.escritorio.contexto);
  await p.addInitScript(() => { window.__copiado = ''; Object.defineProperty(Navigator.prototype, 'share', { value: undefined, configurable: true }); Object.defineProperty(navigator, 'clipboard', { value: { writeText: (t) => { window.__copiado = t; return Promise.resolve(); } }, configurable: true }); });
  await p.goto(`${servidor.url}/${PAGINAS['por-pasos']}`);
  await p.evaluate(() => localStorage.clear());
  await hastaRevision(p); await aceptaDeclaraciones(p);
  await visible(p, '[data-accion="enviar"]').click();
  await p.waitForSelector('[data-acuse]:not([hidden])', { timeout: 5000 });
  const folio = (await p.locator('[data-acuse-folio]').textContent()).trim();
  await p.click('[data-compartir]'); await p.waitForTimeout(150);
  const copiado = await p.evaluate(() => window.__copiado);
  assert.ok(copiado.includes(folio), `lo compartido lleva el folio: «${copiado}»`);
  assert.doesNotMatch(copiado, /https?:\/\//, 'y no la dirección del formulario');
  await p.context().close();
});

test('ejemplos: la captura interna deja el folio a la vista y el registro en la consulta, «Ver» y «Editar» hacen algo; la encuesta no cuenta la pregunta opcional (C2-03, C2-10, C6-03, C2-05)', async () => {
  const p = await abrePagina(navegador, servidor.url, 'guia-visual/ejemplos/captura-interna.html', { contexto: PERFILES.escritorio.contexto });
  await p.waitForTimeout(300);
  assert.ok(await p.locator('tbody tr td .mono').count() > 0, 'el folio y la fecha van en .mono');
  await p.click('#t-captura');
  await p.click('#categoria'); await p.locator('#categoria').pressSequentially('Arbo'); await p.keyboard.press('ArrowDown'); await p.keyboard.press('Enter');
  await p.click('[data-campo="fecha"] [data-hoy]');
  await p.fill('#titulo', 'Registro de prueba nuevo');
  await p.click('[data-accion="enviar"]'); await p.waitForTimeout(800);
  const aviso = (await p.locator('#captura [data-aviso-formkit]').textContent()).trim();
  const folio = (aviso.match(/EJ-[A-Z0-9-]+/) || [])[0];
  assert.ok(folio, `el folio queda a la vista: «${aviso}»`);
  await p.click('#t-consulta'); await p.fill('#buscar', folio); await p.waitForTimeout(200);
  assert.equal(await p.locator('tbody tr').count(), 1, 'el registro aparece en la consulta');
  await p.click('tbody tr [data-accion-fila="ver"]');
  assert.ok(await p.locator('#dialogo-registro[open]').isVisible(), '«Ver» abre el registro');
  await p.keyboard.press('Escape');
  await p.click('tbody tr [data-accion-fila="editar"]');
  assert.equal(await p.inputValue('#titulo'), 'Registro de prueba nuevo', '«Editar» lo lleva a la captura');
  assert.deepEqual(paginaErrores(p), []);
  await p.context().close();
  const e = await abrePagina(navegador, servidor.url, 'guia-visual/ejemplos/encuesta.html', { contexto: PERFILES.escritorio.contexto });
  await e.check('input[name="limpieza"][value="4"]'); await e.check('input[name="motivo"][value="pasear"]'); await e.waitForTimeout(100);
  assert.equal(await e.evaluate(() => { const b = document.querySelector('progress'); return b.value / b.max; }), 1, 'con lo obligatorio contestado, la barra llega al final');
  await e.context().close();
});

test('salidas con destino: «Volver al inicio», migas y enlaces de la guía no llevan a «./» ni a «#» (C2-07)', () => {
  for (const ruta of ['codigo/plantillas/por-pasos.html', 'codigo/plantillas/una-pagina.html', 'guia-visual/ejemplos/encuesta.html', 'guia-visual/ejemplos/captura-interna.html', 'guia-visual/index.html']) {
    const html = readFileSync(resolve(RAIZ, ruta), 'utf8').replace(/<!--[\s\S]*?-->/g, '');
    assert.deepEqual(html.match(/href="(\.\/|#|#migas)"/g) || [], [], `${ruta}: enlaces sin destino`);
  }
});

test('guía en el teléfono: índice fijo con letrero, «Copiar HTML» arriba de cada ficha, nada se anuncia al cargar, recuerda el ancho y lo elegido va en azul (C3-02, C2-12, C4-06, C6-01)', async () => {
  const p = await abrePagina(navegador, servidor.url, PAGINAS.guia, { contexto: PERFILES.movil.contexto });
  await p.waitForTimeout(900);
  const r = await p.evaluate(() => ({ pos: getComputedStyle(document.querySelector('.guia-nav')).position, letrero: getComputedStyle(document.querySelector('label[for="guia-salto"]')).position, anuncio: (document.querySelector('[data-anuncios]') || {}).textContent || '', fichas: document.querySelectorAll('.guia-ficha:has(.guia-demo)').length, arriba: document.querySelectorAll('.guia-ficha-cab .guia-copiar-arriba').length }));
  assert.equal(r.pos, 'sticky', 'el índice queda fijo arriba');
  assert.notEqual(r.letrero, 'absolute', 'con su letrero a la vista');
  assert.equal(r.anuncio, '', 'al cargar no se anuncia nada');
  assert.ok(r.arriba > 0 && r.arriba === r.fichas, `«Copiar HTML» arriba en ${r.arriba} de ${r.fichas} fichas`);
  await p.selectOption('[data-nav-select]', 'validaciones');
  assert.match(p.url(), /#validaciones$/, 'el índice cambia la dirección');
  await p.click('.guia-ancho[data-ancho="768"]');
  await p.mouse.move(0, 0); await p.waitForTimeout(400);
  assert.equal(await p.locator('.guia-ancho[data-ancho="768"]').evaluate((b) => getComputedStyle(b).backgroundColor), 'rgb(26, 86, 168)', 'lo elegido va en azul');
  await p.reload(); await p.waitForTimeout(900);
  assert.equal(await p.getAttribute('.guia-ancho[data-ancho="768"]', 'aria-pressed'), 'true', 'al recargar recuerda el ancho');
  await p.context().close();
});

test('la guía en un solo archivo lleva sus documentos de muestra y sabe dónde está pdf.js (B1-04)', () => {
  const art = readFileSync(resolve(RAIZ, 'guia-visual/artefacto.html'), 'utf8');
  assert.match(art, /data-visor-url="data:application\/pdf;base64,/, 'el PDF de muestra va dentro');
  assert.match(art, /data-visor-url="data:image\/png;base64,/, 'la imagen de muestra va dentro');
  assert.match(readFileSync(resolve(RAIZ, 'guia-visual/guia-config.js'), 'utf8'), /visor:\s*\{\s*pdfjs:\s*'\.\.\/vendor\/pdfjs-dist\/'/, 'la guía dice dónde está pdf.js');
});

test('auditar-campos exige data-sin-borrador en el consentimiento y en «No soy un programa automático» (C4-12)', () => {
  const dir = mkdtempSync(resolve(tmpdir(), 'formkit-d7-'));
  const html = resolve(dir, 'f.html');
  writeFileSync(html, '<form><div class="destacado" data-campo="aviso" data-requerido data-uso="Constancia."><label class="casilla"><input class="casilla-input" type="checkbox" name="aviso" value="si"><span class="casilla-texto">Leí el aviso de privacidad</span></label></div></form>');
  const r = spawnSync(process.execPath, [resolve(RAIZ, 'herramientas/auditar-campos.mjs'), html], { encoding: 'utf8' });
  assert.equal(r.status, 1, 'sin la marca, falla');
  assert.match(r.stderr, /D7/);
});

/* ----- Bloque 6 (1.6.3): documentos, pruebas y entrega ----- */

/* Reglas que no tenían ninguna comprobación automática (A1-12: 10, 35, 59 y 76). */
test('lo obligatorio: asterisco guinda que el lector no oye, «(obligatorio)» para el lector, una leyenda por pantalla y ningún «(opcional)» (A1-12, FRM-10)', async () => {
  const p = await abrePlantilla(navegador, servidor.url, { contexto: PERFILES.escritorio.contexto });
  const r = await p.evaluate(() => {
    const campos = [...document.querySelectorAll('form [data-requerido]')].filter((el) => el.querySelector('.etiqueta'));
    const mal = campos.filter((el) => { const etq = el.querySelector('.etiqueta'); const a = etq.querySelector('.marca-oblig'); return !a || a.getAttribute('aria-hidden') !== 'true' || a.textContent !== '*' || !/\(obligatorio\)/.test(etq.querySelector('.solo-lector')?.textContent || ''); }).map((el) => el.dataset.campo);
    const pasos = [...document.querySelectorAll('[data-paso]')].map((s) => ({ obligatorios: s.querySelectorAll('[data-requerido]').length, leyendas: (s.textContent.match(/son obligatorios/g) || []).length }));
    return { campos: campos.length, mal, color: getComputedStyle(document.querySelector('.marca-oblig')).color, pasos, opcional: [...document.querySelectorAll('.etiqueta')].filter((e) => /opcional/i.test(e.textContent)).map((e) => e.textContent.trim()) };
  });
  assert.ok(r.campos > 5);
  assert.deepEqual(r.mal, [], 'cada obligatorio lleva su asterisco oculto al lector y la palabra para el lector');
  assert.equal(r.color, 'rgb(157, 33, 72)', 'el asterisco va en guinda');
  for (const [i, s] of r.pasos.entries()) if (s.obligatorios) assert.equal(s.leyendas, 1, `el paso ${i + 1} dice una vez qué significa el asterisco`);
  assert.deepEqual(r.opcional, [], 'ninguna etiqueta dice «(opcional)»');
  await p.context().close();
});

test('«Atrás» es un enlace azul con su flecha, no un botón gris (A1-12, FRM-35)', async () => {
  const p = await abrePlantilla(navegador, servidor.url, { contexto: PERFILES.escritorio.contexto });
  await llenaSolicitud(p); await continuar(p);
  const a = await visible(p, '[data-accion="atras"]').evaluate((b) => { const c = getComputedStyle(b); return { clase: b.className, color: c.color, fondo: c.backgroundColor, flecha: b.querySelector('svg use')?.getAttribute('href'), primero: b.firstElementChild?.tagName.toLowerCase() }; });
  assert.deepEqual(a, { clase: 'btn-atras', color: 'rgb(26, 86, 168)', fondo: 'rgba(0, 0, 0, 0)', flecha: '#i-flecha-izq', primero: 'svg' });
  await p.context().close();
});

test('cero valores fijos: ni el núcleo ni los módulos escriben una dirección; vive en la configuración (A1-12, FRM-59)', () => {
  const archivos = ['codigo/js/formkit.core.js', ...readdirSync(resolve(RAIZ, 'codigo/modulos')).map((m) => `codigo/modulos/${m}/${m}.js`).filter((f) => existsSync(resolve(RAIZ, f)))];
  const fijas = [];
  for (const f of archivos) {
    const codigo = readFileSync(resolve(RAIZ, f), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
    for (const m of codigo.matchAll(/https?:\/\/[^\s'"`)]+/g)) if (m[0] !== 'http://www.w3.org/2000/svg') fijas.push(`${f}: ${m[0]}`);
  }
  assert.deepEqual(fijas, [], 'direcciones escritas en el código');
});

test('datos de ejemplo ficticios: catálogos marcados, plantillas con su franja y teléfonos de ceros en las muestras (A1-12, FRM-76)', async () => {
  await import(pathToFileURL(resolve(RAIZ, 'codigo/catalogos/cdmx-ejemplo.js')).href);
  for (const [n, c] of Object.entries(globalThis.FORMKIT_CATALOGOS)) assert.equal(c.es_ficticio, true, `el catálogo «${n}» se declara de ejemplo`);
  for (const f of ['codigo/plantillas/por-pasos.html', 'codigo/plantillas/una-pagina.html', 'guia-visual/ejemplos/encuesta.html', 'guia-visual/ejemplos/captura-interna.html']) {
    const html = readFileSync(resolve(RAIZ, f), 'utf8');
    assert.match(html, /class="entorno-pruebas"/, `${f} dice que es de pruebas`);
  }
  for (const f of ['codigo/plantillas/por-pasos.html', 'codigo/plantillas/una-pagina.html', 'guia-visual/index.html', 'guia-visual/guia.js', 'guia-visual/ejemplos/encuesta.html', 'guia-visual/ejemplos/captura-interna.html', 'guia-visual/ejemplos/captura-interna.js']) {
    const telefonos = (readFileSync(resolve(RAIZ, f), 'utf8').match(/\b55[ -]?\d{4}[ -]?\d{4}\b/g) || []).filter((t) => /[1-9]/.test(t.slice(2)));
    assert.deepEqual(telefonos, [], `${f}: un teléfono de muestra que podría ser de alguien`);
  }
});

test('el guinda no pinta avisos, errores, el resumen, la franja ni el recordatorio: se parece al rojo de error (decisión 21, FRM-39)', () => {
  const hojas = ['codigo/css/base.css', 'codigo/css/nucleo.css', ...readdirSync(resolve(RAIZ, 'codigo/modulos')).map((m) => `codigo/modulos/${m}/${m}.css`).filter((f) => existsSync(resolve(RAIZ, f)))];
  const conGuinda = [];
  for (const h of hojas) {
    const css = readFileSync(resolve(RAIZ, h), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
    for (const m of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) if (/\.(aviso|err|resumen-errores|franja|recordatorio|estado-rechazo|resultado-rechazo)\b/.test(m[1]) && /--guinda/.test(m[2])) conGuinda.push(`${h}: ${m[1].trim()}`);
  }
  assert.deepEqual(conGuinda, []);
});

test('lista con búsqueda: un nombre repetido en el catálogo se ofrece una sola vez (A1-12, P37)', async () => {
  const p = await abrePagina(navegador, servidor.url, 'pruebas/paginas/correcciones.html', { contexto: PERFILES.escritorio.contexto });
  /* El repetido va en el catálogo desde que carga: la lista toma sus opciones al armarse, así que agregarlo después no probaría nada. */
  await p.route('**/correcciones-config.js', async (r) => {
    const res = await r.fetch();
    await r.fulfill({ response: res, body: `${await res.text()}\nwindow.FORMKIT_CATALOGOS.especies.filas.push('Jacaranda', { nombre: 'Jacaranda', detalle: 'repetida' });\n` });
  });
  await p.reload(); await p.waitForLoadState('load');
  assert.equal(await p.evaluate(() => window.FORMKIT_CATALOGOS.especies.filas.length), 5, 'el catálogo trae los repetidos');
  await p.click('#especie'); await p.type('#especie', 'jac');
  await p.locator('.combo-lista li', { hasText: 'Jacaranda' }).first().waitFor();
  assert.equal(await p.locator('.combo-lista li', { hasText: 'Jacaranda' }).count(), 1);
  assert.deepEqual(p.registro, [], 'consola limpia');
  await p.context().close();
});

test('por pasos: el rechazo del servidor abre el paso de la respuesta con error y pone ahí su resumen (A1-12, P41)', async () => {
  const p = await abrePlantilla(navegador, servidor.url, { contexto: PERFILES.escritorio.contexto });
  await hastaRevision(p); await aceptaDeclaraciones(p);
  await p.evaluate(() => FormKit.iniciar(document.querySelector('form'), { enviar: () => Promise.reject({ errores: [{ campo: 'descripcion', mensaje: 'Esa descripción ya se recibió en otra solicitud.' }] }) }));
  await visible(p, '[data-accion="enviar"]').click();
  await p.waitForFunction(() => /No se pudo enviar/.test((document.querySelector('[data-paso]:not([hidden]) .resumen-errores-titulo') || {}).textContent || ''));
  assert.equal(await pasoVisible(p), 0, 'se abre el paso donde está la descripción, no se queda en la revisión');
  assert.match(await error(p, 'descripcion'), /ya se recibió/, 'el error va junto a su respuesta');
  assert.match((await p.locator('[data-paso]:not([hidden]) .resumen-errores a').allTextContents()).join(' '), /ya se recibió/, 'y el resumen del paso lo enlaza');
  await p.context().close();
});

test('visor en la copia de un proyecto: el estándar en una carpeta con otro nombre encuentra pdf.js a su lado (A1-12, P96)', async () => {
  const sitio = mkdtempSync(resolve(tmpdir(), 'formkit-sitio-'));
  copiaCarpeta(resolve(RAIZ, 'codigo'), resolve(sitio, 'estandar'));
  copiaCarpeta(resolve(RAIZ, 'vendor/pdfjs-dist'), resolve(sitio, 'vendor/pdfjs-dist'));
  mkdirSync(resolve(sitio, 'docs')); mkdirSync(resolve(sitio, 'paginas'));
  copyFileSync(resolve(RAIZ, 'guia-visual/muestras/comprobante-muestra.pdf'), resolve(sitio, 'docs/comprobante.pdf'));
  /* La página va en su propia subcarpeta, como en un sistema: la ruta por omisión (relativa a la página) no acierta por casualidad. */
  writeFileSync(resolve(sitio, 'paginas/index.html'), `<!doctype html><html lang="es-MX"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Visor en un proyecto</title>
<link rel="stylesheet" href="../estandar/css/tokens.css"><link rel="stylesheet" href="../estandar/css/base.css"><link rel="stylesheet" href="../estandar/css/nucleo.css"><link rel="stylesheet" href="../estandar/modulos/visor/visor.css"></head>
<body><main class="pagina"><div class="visor-area"><div><button type="button" class="btn-enlace" data-visor-url="../docs/comprobante.pdf" data-visor-titulo="Comprobante" data-visor-archivo="comprobante.pdf">Ver documento</button></div>
<dialog class="visor" data-visor aria-labelledby="visor-titulo"><div class="visor-cabeza"><div class="visor-nombre"><h2 class="visor-titulo" id="visor-titulo" data-visor-titulo>Documento</h2><p class="visor-archivo mono" data-visor-archivo></p></div><button type="button" class="btn-enlace visor-cerrar" data-visor-accion="cerrar">Cerrar</button></div>
<div class="visor-barra" role="toolbar" aria-label="Herramientas del visor"><button type="button" class="btn btn-secundario" data-visor-accion="alejar" aria-label="Alejar">−</button><output class="visor-zoom" data-visor-zoom aria-live="polite">100 %</output><button type="button" class="btn btn-secundario" data-visor-accion="acercar" aria-label="Acercar">+</button><a class="btn-enlace visor-abrir" data-visor-abrir target="_blank" rel="noopener">Abrir en otra pestaña</a></div>
<p class="visor-pagina" data-visor-pagina aria-live="polite"></p><div class="aviso visor-aviso" data-visor-aviso hidden></div><div class="visor-hojas" data-visor-hojas role="region" tabindex="0" aria-label="Hojas del documento"></div><p class="visor-nota" data-visor-nota hidden></p></dialog></div></main>
<script src="../estandar/js/validaciones.config.js"></script><script src="../estandar/js/iconos.js"></script><script src="../estandar/js/formkit.core.js"></script><script src="../estandar/modulos/visor/visor.js"></script></body></html>`);
  /* Su propio servidor se cierra aunque la prueba falle: abierto, el proceso de pruebas no termina nunca. */
  const s = await sirve(sitio);
  const p = await nuevaPagina(navegador, PERFILES.escritorio.contexto);
  try {
    await p.goto(`${s.url}/paginas/index.html`);
    await p.click('[data-visor-url]');
    await p.waitForFunction(() => document.querySelectorAll('[data-visor-hojas] canvas').length === 2, null, { timeout: 15000 });
    assert.deepEqual(p.registro, [], 'sin avisos: pdf.js estaba junto a la carpeta del estándar');
  } finally {
    await p.context().close(); await s.cierra();
  }
});

test('visor: si pdf.js no carga, el documento se abre con el visor del navegador y se dice dónde se buscó (RODEO-05)', async () => {
  const p = await abrePagina(navegador, servidor.url, PAGINAS.guia, { contexto: PERFILES.escritorio.contexto });
  await p.route('**/pdf.min.mjs', (r) => r.abort());
  await p.click('#m-visor [data-visor-url$=".pdf"]');
  await p.locator('#m-visor .visor-marco').waitFor();
  assert.match(await p.locator('#m-visor [data-visor-aviso]').textContent(), /visor del navegador/, 'la persona sabe por qué se ve distinto');
  assert.ok(p.registro.some((l) => /no se pudo cargar pdf\.js desde/.test(l)), 'quien programa ve en la consola dónde se buscó pdf.js');
  await p.context().close();
});

test('una página: la lista con búsqueda y el interruptor vuelven del borrador y se leen en palabras (A1-12, combo y toggle)', async () => {
  const p = await abrePagina(navegador, servidor.url, PAGINAS['una-pagina'], { contexto: PERFILES.escritorio.contexto });
  await p.click('#alcaldia'); await p.type('#alcaldia', 'coy'); await p.keyboard.press('ArrowDown'); await p.keyboard.press('Enter'); await p.keyboard.press('Tab');
  await p.click('[data-toggle]');
  await p.waitForTimeout(900);
  await p.reload(); await p.waitForTimeout(300);
  await p.click('[data-borrador="recuperar"]'); await p.waitForTimeout(300);
  assert.equal(await p.inputValue('#alcaldia'), 'Coyoacán', 'la lista con búsqueda vuelve con el nombre del catálogo');
  assert.equal(await p.getAttribute('[data-toggle]', 'aria-checked'), 'true', 'el interruptor vuelve encendido');
  const palabras = await p.evaluate(() => { const i = FormKit.iniciar(document.getElementById('formulario')); return [i.ctx.textoDeValor('alcaldia'), i.ctx.textoDeValor('avisos')]; });
  assert.deepEqual(palabras, ['Coyoacán', 'Sí'], 'y se leen como la persona los eligió');
  await p.context().close();
});

test('FormKit.confirma avisa en la consola si «si» no dice qué pasa: sin él o con «Aceptar» (F2-13)', async () => {
  const p = await abrePagina(navegador, servidor.url, 'pruebas/paginas/desenlace.html', { contexto: PERFILES.escritorio.contexto });
  for (const si of [undefined, 'Aceptar', 'Rechazar solicitud']) {
    await p.evaluate((s) => { FormKit.confirma(document.querySelector('button'), { titulo: '¿Rechazar la solicitud EJ-1?', si: s }); }, si);
    await p.locator('dialog[role="alertdialog"][open]').waitFor();
    await p.keyboard.press('Escape');
    await p.locator('dialog[role="alertdialog"]').waitFor({ state: 'detached' });
  }
  const avisos = p.registro.filter((l) => /FormKit\.confirma/.test(l));
  assert.equal(avisos.length, 2, `sin «si» y con «Aceptar», no con «Rechazar solicitud»: ${avisos.join(' | ')}`);
  assert.match(avisos[1], /«Aceptar»/);
  await p.context().close();
});

test('un texto sin formato más largo que su máximo se marca también en el navegador, no sólo en el servidor (A1-14)', async () => {
  const p = await abre();
  const r = await p.evaluate(() => {
    const form = document.querySelector('form');
    const c = Object.assign(document.createElement('div'), { className: 'campo' });
    c.dataset.campo = 'clave_largo'; c.dataset.uso = 'Prueba.';
    c.innerHTML = '<label class="etiqueta" for="clave_largo">Clave</label><input class="control" id="clave_largo" name="clave_largo" type="text" maxlength="5"><p class="err" aria-live="polite"><svg class="icono" aria-hidden="true"><use href="#i-error"></use></svg><span></span></p>';
    form.prepend(c);
    const i = FormKit.iniciar(form);
    document.getElementById('clave_largo').value = 'demasiado largo';
    return i.valida().filter((f) => f.campo === 'clave_largo').map((f) => f.mensaje);
  });
  assert.deepEqual(r, ['Usa hasta 5 caracteres en «Clave».']);
  await p.context().close();
});

test('plantillas, ejemplos y guías sin guiones, estilos ni manejadores escritos en el HTML: la política de seguridad estricta no los bloquea (B9-01)', () => {
  const rutas = ['codigo/plantillas/por-pasos.html', 'codigo/plantillas/una-pagina.html', 'guia-visual/index.html', 'guia-visual/ejemplos/encuesta.html', 'guia-visual/ejemplos/captura-interna.html', '../guia-visual/index.html', '../geovisores/guia-visual/index.html'];
  for (const ruta of rutas.filter((r) => existsSync(resolve(RAIZ, r)))) {
    const html = readFileSync(resolve(RAIZ, ruta), 'utf8').replace(/<!--[\s\S]*?-->/g, '');
    assert.deepEqual(html.match(/<script\b(?![^>]*\ssrc=)[^>]*>/g) || [], [], `${ruta}: <script> en línea`);
    assert.deepEqual(html.match(/<[a-z][\w-]*\b[^>]*\s(style|on[a-z]+)="/gi) || [], [], `${ruta}: estilo o manejador en un atributo`);
  }
});

test('el árbol de la guía siempre agrega el acuse a un formulario que envía, también al de una página (F5-01)', async () => {
  const p = await abrePagina(navegador, servidor.url, PAGINAS.guia, { contexto: PERFILES.escritorio.contexto });
  await p.evaluate(() => { for (const c of document.querySelectorAll('[data-arbol] input')) c.checked = c.name === 'archivos'; document.querySelector('[data-arbol]').dispatchEvent(new Event('change', { bubbles: true })); });
  const codigo = await p.locator('[data-arbol-codigo]').textContent();
  assert.match(codigo, /modulos\/acuse\/acuse\.js/, 'con sólo «archivos», el árbol pide el acuse');
  assert.match(await p.locator('[data-arbol-nota]').textContent(), /acuse confirma el envío/);
  await p.evaluate(() => { for (const c of document.querySelectorAll('[data-arbol] input')) c.checked = c.name === 'interna'; document.querySelector('[data-arbol]').dispatchEvent(new Event('change', { bubbles: true })); });
  assert.doesNotMatch(await p.locator('[data-arbol-codigo]').textContent(), /acuse\.js/, 'una captura interna lo dice con un aviso, sin acuse');
  await p.evaluate(() => localStorage.removeItem('guia-formularios:arbol'));
  await p.context().close();
});

test('un catálogo de ejemplo en una página que no dice ser de pruebas se avisa en la consola (D3-01)', async () => {
  const conFranja = await abrePagina(navegador, servidor.url, PAGINAS['una-pagina'], { contexto: PERFILES.escritorio.contexto });
  assert.deepEqual(conFranja.registro, [], 'la plantilla dice que es de pruebas: no avisa');
  const ctx = await navegador.newContext(PERFILES.escritorio.contexto);
  const p = await ctx.newPage(); const registro = [];
  p.on('console', (m) => { if (m.type() === 'warning') registro.push(m.text()); });
  await p.route(/una-pagina\.html/, async (r) => { const resp = await r.fetch(); await r.fulfill({ response: resp, body: (await resp.text()).replace(/<aside class="entorno-pruebas"[^>]*>[^<]*<\/aside>/, '') }); });
  await p.goto(`${servidor.url}/${PAGINAS['una-pagina']}`); await p.waitForTimeout(300);
  assert.deepEqual(registro.filter((l) => /es de ejemplo/.test(l)).map((l) => (l.match(/catálogo «([^»]+)»/) || [])[1]), ['alcaldias'], `sin la franja, avisa una vez por catálogo que usa: ${registro.join(' | ')}`);
  await conFranja.context().close(); await ctx.close();
});

test('comprobar-formulario: el formulario de un proyecto se comprueba con una orden, y lo que falla se dice (F5-03)', async () => {
  const bien = spawnSync(process.execPath, [resolve(RAIZ, 'herramientas/comprobar-formulario.mjs'), resolve(RAIZ, 'codigo/plantillas/una-pagina.html'), '--raiz', RAIZ], { encoding: 'utf8' });
  assert.equal(bien.status, 0, bien.stdout + bien.stderr);
  assert.match(bien.stdout, /CORRECTO/);
  assert.match(bien.stdout, /es de ejemplo \(es_ficticio: true\)/, 'dice que el catálogo es de ejemplo');
  const sitio = mkdtempSync(resolve(tmpdir(), 'formkit-proyecto-'));
  copiaCarpeta(resolve(RAIZ, 'codigo'), resolve(sitio, 'formkit'));
  writeFileSync(resolve(sitio, 'malo.html'), `<!doctype html><html lang="es-MX"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Formulario con fallas</title>
<link rel="stylesheet" href="formkit/css/tokens.css"><link rel="stylesheet" href="formkit/css/base.css"><link rel="stylesheet" href="formkit/css/nucleo.css"><link rel="stylesheet" href="formkit/modulos/combo/combo.css"><link rel="stylesheet" href="formkit/modulos/no-existe/no-existe.css"></head>
<body><main class="pagina"><form class="tarjeta" data-formkit><h1 class="titulo-paso">Prueba</h1>
<div class="campo" data-campo="especie" data-requerido data-uso="Prueba."><label class="etiqueta" for="especie">Especie</label><div class="combo" data-combo data-catalogo="especies"><input class="control" id="especie" name="especie" type="text" autocomplete="off"><ul class="combo-lista" hidden></ul></div></div>
<div style="width:2000px">ancho</div>
<button type="submit" class="btn btn-primario" data-accion="enviar">Enviar</button></form></main>
<script>window.FORMKIT_CONFIG = {};</script>
<script src="formkit/js/validaciones.config.js"></script><script src="formkit/js/iconos.js"></script><script src="formkit/js/formkit.core.js"></script><script src="formkit/modulos/combo/combo.js"></script></body></html>`);
  const mal = spawnSync(process.execPath, [resolve(RAIZ, 'herramientas/comprobar-formulario.mjs'), resolve(sitio, 'malo.html')], { encoding: 'utf8' });
  assert.equal(mal.status, 1, mal.stdout);
  for (const [que, re] of [['el desborde', /se desborda a lo ancho/], ['el guion en línea', /<script> en línea/], ['el estilo en un atributo', /style= en <div>/], ['el archivo que falta', /404 .*no-existe\.css/], ['el catálogo que no cargó', /catálogo «especies» y no se cargó/]]) assert.match(mal.stdout, re, `dice ${que}`);
});

test('construir --comprobar no reescribe: dice qué derivado se atrasó, y se detiene con un archivo de más en un módulo (A3-01, A3-03)', () => {
  /* La copia repite la carpeta común: la guía incrusta también la lista de pendientes de ../guia-visual. */
  const comun = mkdtempSync(resolve(tmpdir(), 'formkit-construir-'));
  const copia = resolve(comun, 'formularios');
  for (const c of ['codigo', 'herramientas', 'guia-visual', 'docs', 'dist', 'vendor/leaflet', 'vendor/leaflet-gesture-handling']) copiaCarpeta(resolve(RAIZ, c), resolve(copia, c));
  if (existsSync(resolve(RAIZ, '../guia-visual'))) copiaCarpeta(resolve(RAIZ, '../guia-visual'), resolve(comun, 'guia-visual'));
  const corre = () => spawnSync(process.execPath, ['herramientas/construir.mjs', '--comprobar'], { cwd: copia, encoding: 'utf8' });
  assert.equal(corre().status, 0, 'recién copiado, todo está al día');
  const indice = resolve(copia, 'guia-visual/index.html');
  const antes = readFileSync(indice, 'utf8');
  writeFileSync(indice, antes.replace('</main>', '<p>Un cambio sin construir.</p></main>'));
  const atrasado = corre();
  assert.equal(atrasado.status, 1, 'un artefacto atrasado ya no pasa en verde');
  assert.match(atrasado.stdout, /ATRASADO.*artefacto\.html/);
  assert.equal(readFileSync(resolve(copia, 'guia-visual/artefacto.html'), 'utf8'), readFileSync(resolve(RAIZ, 'guia-visual/artefacto.html'), 'utf8'), 'y no lo reescribe en silencio');
  writeFileSync(indice, antes);
  writeFileSync(resolve(copia, 'codigo/modulos/tabla/copia-vieja.js'), '// sobra');
  const sobra = corre();
  assert.notEqual(sobra.status, 0);
  assert.match(sobra.stderr, /codigo\/modulos\/tabla\/ tiene archivos que el manifiesto no declara: copia-vieja\.js/);
});
