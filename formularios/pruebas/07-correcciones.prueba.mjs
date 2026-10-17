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

test('«Mostrar» / «Ocultar» dentro del campo, con aria-pressed, y se vuelve a ocultar al enviar (P42, P73)', async () => {
  const p = await abre();
  const ver = p.locator('[data-campo="clave"] [data-ver-contrasena]');
  assert.equal((await ver.textContent()).trim(), 'Mostrar: Contraseña', 'el lector oye «Mostrar: Contraseña»');
  assert.equal(await ver.getAttribute('aria-pressed'), 'false');
  const dentro = await p.evaluate(() => { const c = document.getElementById('clave').getBoundingClientRect(); const b = document.querySelector('[data-campo="clave"] [data-ver-contrasena]').getBoundingClientRect(); return b.left >= c.left && b.right <= c.right + 1 && b.top >= c.top - 1 && b.bottom <= c.bottom + 1; });
  assert.ok(dentro, 'el botón va dentro del campo');
  await ver.click();
  assert.equal(await p.getAttribute('#clave', 'type'), 'text', 'se ve lo escrito');
  assert.equal(await ver.getAttribute('aria-pressed'), 'true');
  assert.equal((await ver.locator('[data-ver-texto]').textContent()).trim(), 'Ocultar');
  await ver.click();
  assert.equal(await p.getAttribute('#clave', 'type'), 'password', 'y se vuelve a ocultar');
  assert.equal((await ver.locator('[data-ver-texto]').textContent()).trim(), 'Mostrar');
  await ver.click();
  await p.click('[data-accion="enviar"]');
  assert.equal(await p.getAttribute('#clave', 'type'), 'password', 'al enviar, la contraseña vuelve a ocultarse');
  assert.equal(await ver.getAttribute('aria-pressed'), 'false');
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

test('la CURP se compara con el nombre y los apellidos, y se revisa de nuevo al cambiarlos (P43)', async () => {
  const p = await abrePagina(navegador, servidor.url, PAGINAS['una-pagina'], { contexto: PERFILES.escritorio.contexto });
  await p.fill('#nombre', 'Juan'); await p.fill('#apellido_paterno', 'Pérez');
  await p.fill('#curp', 'PEGJ900515HDFRRN09'); await p.keyboard.press('Tab');
  assert.match(await error(p, 'curp'), /segundo apellido/, 'sin segundo apellido escrito, esta CURP (G en la posición 3) no corresponde');
  await p.fill('#apellido_materno', 'García'); await p.keyboard.press('Tab');
  assert.equal(await error(p, 'curp'), '', 'al escribir el segundo apellido, el error se va');
  await p.fill('#nombre', 'Pedro'); await p.keyboard.press('Tab');
  assert.match(await error(p, 'curp'), /no corresponde/, 'al cambiar el nombre, la CURP se vuelve a revisar');
  await p.fill('#nombre', 'Juan'); await p.keyboard.press('Tab');
  assert.equal(await error(p, 'curp'), '', 'y al corregirlo, se libera');
  assert.deepEqual(p.registro, [], 'consola limpia');
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

/* ----- Versión 1.2.0: P65, P66, P67 y P70, sobre las muestras de la guía ----- */

const abreGuia = (perfil = PERFILES.escritorio) => abrePagina(navegador, servidor.url, PAGINAS.guia, { contexto: perfil.contexto });

test('respuestas frecuentes fijas: el chip agrega su texto al texto largo y no guarda nada (P65)', async () => {
  const p = await abreGuia();
  const chips = p.locator('#m-chips [data-chip-fijo]');
  assert.equal(await chips.count(), 4, 'la lista fija se ve siempre');
  await chips.filter({ hasText: 'No se lee completo' }).click();
  assert.equal(await p.inputValue('#m_observacion'), 'No se lee completo.');
  await chips.filter({ hasText: 'Falta una página' }).click();
  assert.equal(await p.inputValue('#m_observacion'), 'No se lee completo. Falta una página.', 'el segundo se agrega al final');
  assert.equal(await p.evaluate(() => document.activeElement.id), 'm_observacion', 'el foco queda en el texto para completarlo');
  assert.equal(await p.evaluate(() => Object.keys(localStorage).filter((k) => k.includes('m_observacion')).length), 0, 'no guarda nada en el dispositivo');
  await p.context().close();
});

test('tabla: el rayado cuenta sólo las filas visibles y la fila oculta no se ve; en teléfono, sin rótulo de acciones (P66)', async () => {
  const p = await abreGuia();
  const fondo = (folio) => p.locator(`#m-tabla tr[data-folio="${folio}"]`).evaluate((tr) => getComputedStyle(tr).backgroundColor);
  const sinFondo = 'rgba(0, 0, 0, 0)';
  assert.equal(await fondo('EJ-001'), sinFondo, '1.ª visible, sin fondo');
  assert.notEqual(await fondo('EJ-002'), sinFondo, '2.ª visible (después de la oculta), con fondo');
  assert.equal(await fondo('EJ-003'), sinFondo, '3.ª visible, sin fondo');
  await p.context().close();
  const t = await abreGuia(PERFILES.movil);
  assert.ok(await t.locator('#m-tabla tr[data-folio="EJ-004"]').isHidden(), 'la fila filtrada con hidden no se ve en teléfono');
  const rotulo = await t.locator('#m-tabla tr[data-folio="EJ-001"] td').last().evaluate((td) => getComputedStyle(td, '::before').display);
  assert.equal(rotulo, 'none', 'la columna de acciones no muestra su rótulo');
  const otro = await t.locator('#m-tabla tr[data-folio="EJ-001"] td').first().evaluate((td) => getComputedStyle(td, '::before').display);
  assert.notEqual(otro, 'none', 'las demás columnas sí');
  await t.context().close();
});

test('visor: todas las hojas del PDF, contador, acercar e imagen; en teléfono, pantalla completa que vuelve al botón (P67)', async () => {
  const p = await abreGuia();
  await p.click('#m-visor [data-visor-url$=".pdf"]');
  await p.waitForFunction(() => document.querySelectorAll('#m-visor canvas').length === 2, null, { timeout: 15000 });
  const d = p.locator('#m-visor [data-visor]');
  assert.equal(await d.evaluate((x) => x.open && !x.matches(':modal')), true, 'en computadora queda abierto junto a la revisión, sin ser modal');
  assert.equal((await p.locator('#m-visor [data-visor-pagina]').textContent()).trim(), 'Hoja 1 de 2');
  assert.equal(await p.locator('#m-visor canvas').first().getAttribute('aria-label'), 'Hoja 1 de 2', 'cada hoja tiene nombre');
  await p.click('#m-visor [data-visor-accion="acercar"]');
  await p.waitForFunction(() => document.querySelector('#m-visor [data-visor-hojas]').dataset.zoom === '125');
  assert.equal((await p.locator('#m-visor [data-visor-zoom]').textContent()).trim(), '125 %');
  await p.click('#m-visor [data-visor-url$=".png"]');
  await p.waitForSelector('#m-visor img.visor-imagen');
  assert.equal(await p.locator('#m-visor canvas').count(), 0, 'la imagen reemplaza al PDF');
  assert.deepEqual(p.registro, [], 'consola limpia');
  await p.context().close();

  const t = await abreGuia(PERFILES.movil);
  const boton = t.locator('#m-visor [data-visor-url$=".pdf"]');
  await boton.click();
  assert.equal(await t.locator('#m-visor [data-visor]').evaluate((x) => x.matches(':modal')), true, 'en teléfono es un diálogo a pantalla completa');
  await t.keyboard.press('Escape');
  assert.equal(await t.locator('#m-visor [data-visor]').evaluate((x) => x.open), false, 'Escape lo cierra');
  assert.equal(await boton.evaluate((b) => b === document.activeElement), true, 'el foco vuelve a «Ver documento»');
  await t.context().close();
});

test('fecha día/mes/año: escritura guiada, edad y validación, sin calendario (P70)', async () => {
  const p = await abreGuia();
  await p.click('#b_fn_fecha');
  await p.keyboard.type('2371985');
  assert.equal(await p.inputValue('#b_fn_fecha'), '23/07/1985', 'pasa sola al mes y al año');
  await p.keyboard.press('Tab');
  assert.match(await p.inputValue('#b_fn_edad'), /^\d+$/, 'la edad se calcula');
  assert.equal(await error(p, 'b_fn_fecha'), '', 'una fecha real pasa');
  await p.fill('#b_fn_fecha', '31/02/1990'); await p.keyboard.press('Tab');
  assert.match(await error(p, 'b_fn_fecha'), /fecha real/, 'el 31 de febrero no existe');
  await p.fill('#b_fn_fecha', '01/01/2099'); await p.keyboard.press('Tab');
  assert.match(await error(p, 'b_fn_fecha'), /posterior a hoy/, 'no acepta fechas futuras');
  assert.equal(await p.inputValue('#b_fn_edad'), '', 'con una fecha futura, la edad queda vacía');
  await p.context().close();
});

/* ----- Versión 1.2.1: P71, P72 y P73 ----- */

test('archivos: con el máximo cargado se oculta «Elegir archivo», el listo se ve en verde y vuelve al quitarlo (P71)', async () => {
  const p = await abre();
  const zona = p.locator('[data-campo="retrato"] .zona-carga');
  assert.ok(await zona.isVisible(), 'al principio se ofrece «Elegir archivo»');
  assert.match((await p.locator('[data-campo="retrato"] [data-limite-texto]').textContent()).trim(), /^Formatos admitidos: JPEG, PNG\. Un archivo de hasta/);
  await p.setInputFiles('[data-campo="retrato"] input[type="file"]:not([data-entrada-camara])', [{ name: 'retrato.png', mimeType: 'image/png', buffer: pngRuido(400, 300) }]);
  await p.waitForSelector('[data-campo="retrato"] .arch[data-estado="listo"]');
  assert.ok(await zona.isHidden(), 'con el máximo (1) ya no se ofrece');
  const fondo = await p.locator('[data-campo="retrato"] .arch').evaluate((li) => getComputedStyle(li).backgroundColor);
  assert.equal(fondo, 'rgb(241, 248, 244)', 'el archivo listo se ve en verde (--ok-bg)');
  await p.click('[data-campo="retrato"] .arch-quitar');
  assert.ok(await zona.isVisible(), 'al quitarlo, vuelve');
  await p.context().close();
});

test('acuse con relleno lateral y una acción para seguir; en la revisión, «Editar» no baja de renglón (P72)', async () => {
  const p = await abrePlantilla(navegador, servidor.url, { contexto: PERFILES.movil.contexto });
  const acuse = await p.evaluate(() => { const a = document.querySelector('.tarjeta.acuse'); return { relleno: parseFloat(getComputedStyle(a).paddingLeft), seguir: a.querySelectorAll('.btn-primario').length }; });
  assert.ok(acuse.relleno > 0, `la tarjeta del acuse conserva su relleno lateral: ${acuse.relleno}`);
  assert.equal(acuse.seguir, 1, 'el acuse trae una sola acción principal para seguir');
  const fila = await p.evaluate(() => {
    const dd = document.createElement('dd'); dd.className = 'rev-dato-valor';
    const v = document.createElement('span'); v.textContent = 'Calle de Prueba con un nombre muy largo que no cabe en un renglón del teléfono, número 1234';
    const b = document.createElement('button'); b.type = 'button'; b.className = 'btn-enlace'; b.textContent = 'Editar';
    dd.append(v, b); document.querySelector('main').append(dd);
    const r = { v: v.getBoundingClientRect(), b: b.getBoundingClientRect() }; dd.remove();
    return { mismoRenglon: Math.abs(r.v.top - r.b.top) < 8, aLaDerecha: r.b.left > r.v.left };
  });
  assert.ok(fila.mismoRenglon && fila.aLaDerecha, `«Editar» queda arriba y a la derecha del valor: ${JSON.stringify(fila)}`);
  await p.context().close();
});

/* ----- Versión 1.3.1: P87 ----- */

test('tras un envío fallido, el aviso no se oculta con el foco (el botón no salta) y sí al cambiar un dato (P87)', async () => {
  const p = await abre();
  await p.fill('#curp', 'PEGJ900515HDFRRN09');
  await p.fill('#nacimiento', '1990-05-15');
  await p.fill('#materno', 'Cual');
  await p.setInputFiles('[data-campo="retrato"] input[type="file"]:not([data-entrada-camara])', [{ name: 'retrato.png', mimeType: 'image/png', buffer: pngRuido(400, 300) }]);
  await p.waitForSelector('[data-campo="retrato"] .arch[data-estado="listo"]');
  await p.evaluate(() => { window.__rechazo = 'red'; });
  await p.click('[data-accion="enviar"]');
  const aviso = p.locator('[data-estado-envio]');
  await aviso.waitFor({ state: 'visible' });
  const antes = await p.locator('[data-accion="enviar"]').evaluate((b) => b.getBoundingClientRect().top + window.scrollY);
  await p.focus('#materno');
  assert.ok(await aviso.isVisible(), 'mover el foco no oculta el aviso');
  assert.equal(await p.locator('[data-accion="enviar"]').evaluate((b) => b.getBoundingClientRect().top + window.scrollY), antes, 'y el botón no se mueve');
  await p.keyboard.type('a');
  assert.ok(await aviso.isHidden(), 'al cambiar un dato, el aviso se oculta');
  await p.context().close();
});

/* ----- Versión 1.3.2: P95, P97 y P98 ----- */

test('un mensaje de formato se cambia a «usted» sólo con FORMKIT_CONFIG.mensajes (P95)', async () => {
  const p = await abre();
  await p.check('input[name="tiene"][value="si"]');
  await p.selectOption('#tipo', 'poda');
  await p.fill('#anios', '2.3'); await p.keyboard.press('Tab');
  assert.match(await error(p, 'anios'), /Use múltiplos de 0\.5\.$/, 'el texto propio del formulario («Use»), no el del estándar («Usa»)');
  await p.context().close();
});

test('grupos de motivos con la misma etiqueta y dos «Mostrar» tienen nombres distintos para el lector de pantalla (P97, P98)', async () => {
  const p = await abre();
  const grupos = await p.locator('.chips-fijos').evaluateAll((gs) => gs.map((g) => g.getAttribute('aria-label')));
  assert.equal(new Set(grupos).size, grupos.length, `cada grupo con su nombre: ${grupos.join(' | ')}`);
  assert.ok(grupos.some((g) => /Identificación oficial$/.test(g)) && grupos.some((g) => /Comprobante de domicilio$/.test(g)), 'el nombre lleva el título de su sección');
  const botones = await p.locator('[data-ver-contrasena]').evaluateAll((bs) => bs.map((b) => b.textContent.trim()));
  assert.deepEqual(botones, ['Mostrar: Contraseña', 'Mostrar: Confirma tu contraseña'], 'cada «Mostrar» dice de qué campo es');
  await p.context().close();
});
