/* =========================================================
   07-correcciones.prueba.mjs · Correcciones de la versión 1.1

   Las fallas que encontró un proyecto real, una por prueba, sobre
   pruebas/paginas/correcciones.html: condiciones encadenadas (P52),
   mínimo que depende de otra respuesta y paso decimal (P61, P40), la
   cruzada que se repite al cambiar el otro dato (P44), el dato calculado
   (data-auxiliar), «Mostrar contraseña» (P42), la lista con búsqueda con
   el catálogo {filas} (P37), el archivo obligatorio sin aria-required en
   su botón y en singular (P47, P39), los errores del servidor junto a su
   campo (P41) y la opción deshabilitada de la lista (P56). De la segunda
   tanda, sobre las plantillas: la ayuda de bloque con los datos hermanos en
   una fila (S2-1, S2-3) y el Sí/No en línea (S2-2).
   ========================================================= */
import test from 'node:test';
import assert from 'node:assert/strict';
import { sirve, abreNavegador, abrePagina, abrePlantilla, PERFILES, PAGINAS, pngRuido } from './ayudas.mjs';

let servidor, navegador;
test.before(async () => { servidor = await sirve(); navegador = await abreNavegador(); });
test.after(async () => { await navegador.close(); await servidor.cierra(); });

const RUTA = 'pruebas/paginas/correcciones.html';
const abre = () => abrePagina(navegador, servidor.url, RUTA, { contexto: PERFILES.escritorio.contexto });
const error = (p, campo) => p.locator(`[data-campo="${campo}"] .err`).textContent().then((t) => t.trim());

test('condiciones encadenadas: lo que dependía de una pregunta oculta también se oculta (P52)', async () => {
  const p = await abre();
  await p.check('input[name="tiene"][value="si"]');
  await p.selectOption('#tipo', 'poda');
  assert.ok(await p.locator('[data-campo="anios"]').isVisible(), 'con «Sí» y «Poda» se pide la experiencia');
  await p.check('input[name="tiene"][value="no"]');
  assert.ok(await p.locator('[data-campo="tipo"]').isHidden(), 'con «No» se oculta el tipo');
  assert.ok(await p.locator('[data-campo="anios"]').isHidden(), 'y también lo que dependía del tipo, aunque el tipo siga en «Poda»');
  assert.equal(await p.locator('.opcion-fila:has(input:disabled)').evaluate((el) => getComputedStyle(el).cursor), 'not-allowed', 'la opción deshabilitada de la lista se ve deshabilitada (P56)');
  assert.deepEqual(p.registro, [], 'consola limpia');
  await p.context().close();
});

test('mínimo según otra respuesta y paso decimal, en el navegador (P61, P40)', async () => {
  const p = await abre();
  await p.check('input[name="tiene"][value="si"]');
  await p.selectOption('#tipo', 'poda');
  await p.selectOption('#nivel', 'avanzado');
  await p.fill('#anios', '3'); await p.keyboard.press('Tab');
  assert.match(await error(p, 'anios'), /mínimo es 5/, 'avanzado: el mínimo es 5');
  await p.selectOption('#nivel', 'basico');
  assert.equal(await error(p, 'anios'), '', 'al cambiar el nivel, el mínimo se recalcula y el error se va');
  await p.fill('#anios', '2.3'); await p.keyboard.press('Tab');
  assert.match(await error(p, 'anios'), /múltiplos de 0.5/, 'el paso de 0.5 rechaza 2.3');
  await p.fill('#anios', '2.5'); await p.keyboard.press('Tab');
  assert.equal(await error(p, 'anios'), '', 'y acepta 2.5');
  await p.context().close();
});

test('la cruzada CURP–fecha se repite al cambiar la fecha (P44)', async () => {
  const p = await abre();
  await p.fill('#curp', 'PEGJ900515HDFRRN09'); await p.keyboard.press('Tab');
  await p.fill('#nacimiento', '1990-05-15'); await p.keyboard.press('Tab');
  assert.equal(await error(p, 'curp'), '', 'CURP y fecha coinciden');
  await p.fill('#nacimiento', '1991-01-01'); await p.keyboard.press('Tab');
  assert.match(await error(p, 'curp'), /no coincide/, 'al salir de la fecha, la CURP se vuelve a revisar');
  await p.context().close();
});

test('dato calculado por la página: cuenta en condiciones y no se envía', async () => {
  const p = await abre();
  assert.ok(await p.locator('#aviso-materno').isVisible(), 'sin apellido materno, el aviso se ve');
  await p.fill('#materno', 'Cual');
  assert.ok(await p.locator('#aviso-materno').isHidden(), 'con apellido materno, el dato calculado apaga el aviso');
  await p.context().close();
});

test('«Mostrar contraseña» alterna lo que se ve y lo dice con aria-pressed (P42)', async () => {
  const p = await abre();
  const ver = p.locator('[data-campo="clave"] [data-ver-contrasena]');
  assert.equal((await ver.textContent()).trim(), 'Mostrar contraseña');
  assert.equal(await ver.getAttribute('aria-pressed'), 'false');
  await ver.click();
  assert.equal(await p.getAttribute('#clave', 'type'), 'text', 'se ve lo escrito');
  assert.equal(await ver.getAttribute('aria-pressed'), 'true');
  await ver.click();
  assert.equal(await p.getAttribute('#clave', 'type'), 'password', 'y se vuelve a ocultar');
  await p.context().close();
});

test('lista con búsqueda con el catálogo {filas}, archivo obligatorio y textos en singular (P37, P47, P39)', async () => {
  const p = await abre();
  await p.click('#especie'); await p.type('#especie', 'jac');
  assert.ok(await p.locator('.combo-lista li', { hasText: 'Jacaranda' }).isVisible(), 'el catálogo {filas} carga');
  assert.equal(await p.locator('[data-campo="retrato"] .zona-carga').getAttribute('aria-required'), null, 'el botón de la zona de carga no lleva aria-required');
  const limite = (await p.locator('[data-campo="retrato"] [data-limite-texto]').textContent()).trim();
  assert.match(limite, /Un archivo de hasta/, `en singular: ${limite}`);
  assert.match(limite, /JPEG, PNG/, 'JPEG una sola vez');
  assert.deepEqual(p.registro, [], 'consola limpia');
  await p.context().close();
});

test('los errores que devuelve el servidor se pintan junto a su campo y en el resumen (P41)', async () => {
  const p = await abre();
  await p.fill('#curp', 'PEGJ900515HDFRRN09');
  await p.fill('#nacimiento', '1990-05-15');
  await p.fill('#materno', 'Cual');
  await p.setInputFiles('[data-campo="retrato"] input[type="file"]:not([data-entrada-camara])', [{ name: 'retrato.png', mimeType: 'image/png', buffer: pngRuido(400, 300) }]);
  await p.waitForTimeout(900);
  await p.evaluate(() => { window.__rechazo = [{ campo: 'curp', mensaje: 'Ya hay una cuenta con esta CURP.' }]; });
  await p.click('[data-accion="enviar"]'); await p.waitForTimeout(400);
  assert.match(await error(p, 'curp'), /Ya hay una cuenta con esta CURP/, 'el error va junto a la CURP');
  assert.ok(await p.locator('.resumen-errores').isVisible(), 'y en el resumen');
  const enviado = await p.evaluate(() => window.__payload.datos);
  assert.equal(Object.hasOwn(enviado, 'sin_materno'), false, 'el dato calculado no viaja');
  await p.evaluate(() => FormKit.marcaError('materno', 'Revisa el apellido.'));
  assert.match(await error(p, 'materno'), /Revisa el apellido/, 'FormKit.marcaError marca un campo desde fuera');
  await p.context().close();
});

/* ----- Segunda tanda: estilo de «Crea tu cuenta» ----- */

test('ayuda de bloque: se dice una vez y cada campo de su sección la lee (S2-1), con los datos hermanos en una fila (S2-3)', async () => {
  const p = await abrePagina(navegador, servidor.url, PAGINAS['una-pagina'], { contexto: PERFILES.escritorio.contexto });
  const id = await p.getAttribute('.ayuda-bloque', 'id');
  assert.ok(id, 'el núcleo le da un id');
  const describe = async (c) => (await p.getAttribute(`#${c}`, 'aria-describedby')).split(' ');
  for (const c of ['nombre', 'apellido_paterno', 'apellido_materno', 'curp', 'nacimiento']) assert.ok((await describe(c)).includes(id), `«${c}» la lee`);
  const materno = await describe('apellido_materno');
  assert.equal(materno[0], id, 'la de bloque va antes de la propia');
  assert.equal(materno.length, 3, 'de bloque, propia y error');
  assert.ok(!(await describe('correo')).includes(id), 'fuera de su contenedor no aplica');
  const arriba = await p.locator('#nombre, #apellido_paterno, #apellido_materno').evaluateAll((cs) => cs.map((c) => Math.round(c.getBoundingClientRect().top)));
  assert.equal(new Set(arriba).size, 1, `nombre y apellidos en un renglón, alineados aunque sólo uno lleve ayuda: ${arriba}`);
  assert.deepEqual(p.registro, [], 'consola limpia');
  await p.context().close();
});

test('Sí/No en línea: una columna por opción en escritorio y una por renglón en teléfono (S2-2)', async () => {
  for (const [perfil, enLinea] of [[PERFILES.escritorio, true], [PERFILES.movil, false]]) {
    const p = await abrePlantilla(navegador, servidor.url, { contexto: perfil.contexto });
    const cajas = await p.locator('[data-campo="urgente"] .opcion-fila').evaluateAll((ls) => ls.map((l) => { const r = l.getBoundingClientRect(); return { arriba: Math.round(r.top), alto: Math.round(r.height) }; }));
    assert.equal(cajas.length, 2);
    assert.equal(cajas[0].arriba === cajas[1].arriba, enLinea, `${perfil.nombre}: ${JSON.stringify(cajas)}`);
    assert.ok(cajas.every((c) => c.alto >= 44), `${perfil.nombre}: cada opción mide 44 px o más`);
    await p.check('input[name="urgente"][value="no"]');
    assert.ok(await p.isChecked('input[name="urgente"][value="no"]'), 'se elige como cualquier radio');
    await p.context().close();
  }
});
