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
  const nota = p.locator('[data-campo="retrato"] .arch-lleno');
  assert.match((await nota.textContent()).trim(), /^Ya adjuntaste el archivo/, 'y lo que se anuncia también se lee en pantalla (P117)');
  const fondo = await p.locator('[data-campo="retrato"] .arch').evaluate((li) => getComputedStyle(li).backgroundColor);
  assert.equal(fondo, 'rgb(241, 248, 244)', 'el archivo listo se ve en verde (--ok-bg)');
  await p.click('[data-campo="retrato"] .arch-quitar');
  assert.ok(await zona.isVisible(), 'al quitarlo, vuelve');
  assert.ok(await nota.isHidden(), 'y la frase de lleno se va');
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

/* ----- Versión 1.3.3: P99, P102, P103 y P104 ----- */

test('la lista con búsqueda no se abre si la página llena el campo sin que la persona esté en él (P99)', async () => {
  const p = await abre();
  await p.focus('#materno');
  await p.evaluate(() => { const c = document.getElementById('especie'); c.value = 'Ahuehuete gigante'; c.dispatchEvent(new Event('input', { bubbles: true })); });
  assert.ok(await p.locator('[data-campo="especie"] .combo-lista').isHidden(), 'al llenarlo la página, la lista sigue cerrada');
  await p.click('#especie'); await p.fill('#especie', ''); await p.type('#especie', 'jac');
  assert.ok(await p.locator('.combo-lista li', { hasText: 'Jacaranda' }).isVisible(), 'al escribir la persona, sí se abre');
  await p.context().close();
});

test('cabecera, contenido y pie empiezan en la misma línea en computadora (P102)', async () => {
  const p = await abrePagina(navegador, servidor.url, PAGINAS['una-pagina'], { contexto: PERFILES.escritorio.contexto });
  const x = await p.evaluate(() => {
    const izq = (el) => el.getBoundingClientRect().left;
    const pag = document.querySelector('.pagina');
    return { cabecera: izq(document.querySelector('.cabecera-int')), contenido: izq(pag) + parseFloat(getComputedStyle(pag).paddingLeft), pie: izq(document.querySelector('.pie-int')) };
  });
  assert.ok(Math.abs(x.cabecera - x.contenido) < 1 && Math.abs(x.pie - x.contenido) < 1, JSON.stringify(x));
  await p.context().close();
});

test('tabla: en computadora la línea llega bajo las acciones y todo va centrado; en teléfono, rótulo | valor en cada renglón (P103, P104)', async () => {
  const p = await abreGuia();
  const ultima = await p.locator('#m-tabla tr[data-folio="EJ-001"] td').last().evaluate((td) => ({ borde: getComputedStyle(td).borderBottomWidth, alto: getComputedStyle(td).verticalAlign }));
  assert.equal(ultima.borde, '1px', 'la última celda también lleva la línea de la fila');
  assert.equal(ultima.alto, 'middle', 'y el contenido va centrado en vertical');
  await p.context().close();
  const t = await abreGuia(PERFILES.movil);
  const celda = await t.locator('#m-tabla tr[data-folio="EJ-003"] td').nth(1).evaluate((td) => {
    const v = td.querySelector(':scope > .tabla-valor').getBoundingClientRect(), c = td.getBoundingClientRect(), pad = parseFloat(getComputedStyle(td).paddingTop);
    return { arriba: Math.round(v.top - c.top - pad), izquierda: Math.round((v.left - c.left) / c.width * 100) };
  });
  assert.equal(celda.arriba, 0, `el valor largo empieza en el renglón de su rótulo, no abajo: ${JSON.stringify(celda)}`);
  assert.ok(celda.izquierda >= 35, `y en la columna del valor: ${JSON.stringify(celda)}`);
  await t.context().close();
});

/* ----- Versión 1.3.4: P110 y P111 ----- */

test('tabla en una página sin formulario, con un encabezado que la página pinta después (P110)', async () => {
  const p = await abrePagina(navegador, servidor.url, 'pruebas/paginas/consulta.html', { contexto: PERFILES.movil.contexto });
  await p.waitForFunction(() => document.querySelector('#grupos td:nth-child(2)').dataset.etiqueta === 'Personas inscritas');
  const celda = p.locator('#grupos tr[data-folio="G-001"] td').nth(1);
  assert.equal(await celda.evaluate((td) => getComputedStyle(td, '::before').content), '"Personas inscritas"', 'en teléfono la celda muestra el encabezado que la página pintó después');
  assert.equal(await p.locator('#grupos tr[data-folio="G-001"] td').first().getAttribute('data-etiqueta'), 'Folio', 'sin formulario, la tabla se inició sola');
  assert.equal(await p.locator('#calculado .tabla-orden').count(), 1, 'la columna que no tenía texto ya se puede ordenar');
  assert.equal(await p.locator('#grupos [data-accion-fila]').first().getAttribute('aria-label'), 'Ver G-001', 'las acciones dicen de qué fila son');
  assert.deepEqual(p.registro, [], 'consola limpia');
  await p.context().close();
});

test('un formulario que ya arrancó solo no se inicia otra vez: la llamada de la página suma sus opciones (P111)', async () => {
  const p = await abre();
  const r = await p.evaluate(() => {
    const form = document.getElementById('formulario');
    window.__envios = 0;
    const a = FormKit.iniciar(form, { enviar: () => { window.__envios++; return Promise.resolve({ folio: 'X' }); } });
    const b = FormKit.iniciar(form, {});
    return { misma: a === b, botones: form.querySelectorAll('[data-ver-contrasena]').length };
  });
  assert.ok(r.misma, 'la segunda llamada devuelve la misma instancia');
  assert.equal(r.botones, 2, 'no se duplican los botones «Mostrar»');
  await p.fill('#curp', 'PEGJ900515HDFRRN09');
  await p.fill('#nacimiento', '1990-05-15');
  await p.fill('#materno', 'Cual');
  await p.setInputFiles('[data-campo="retrato"] input[type="file"]:not([data-entrada-camara])', [{ name: 'retrato.png', mimeType: 'image/png', buffer: pngRuido(400, 300) }]);
  await p.waitForSelector('[data-campo="retrato"] .arch[data-estado="listo"]');
  await p.click('[data-accion="enviar"]');
  await p.waitForFunction(() => window.__envios > 0);
  await p.waitForTimeout(200);
  assert.equal(await p.evaluate(() => window.__envios), 1, 'un clic, un envío, con la función que pasó la página');
  await p.context().close();
});

/* ----- Versión 1.4.0: P113 a P118 (avisos, confirmaciones y desenlaces) ----- */

const abreDesenlace = (perfil = PERFILES.escritorio) => abrePagina(navegador, servidor.url, 'pruebas/paginas/desenlace.html', { contexto: perfil.contexto });

test('confirmar con consecuencias y foco en «Volver sin cambios»; el resultado dice qué pasó, a qué hora y quién (P113)', async () => {
  const p = await abreDesenlace();
  await p.click('#rechazar');
  const d = p.locator('dialog[role="alertdialog"][open]');
  await d.waitFor();
  assert.equal(await p.evaluate(() => document.activeElement.textContent), 'Volver sin cambios', 'el foco inicial va a la salida segura');
  assert.deepEqual(await d.locator('.dialogo-consecuencias li').allTextContents(), ['La persona recibe el motivo por correo.', 'La solicitud pasa a «Rechazada» y ya no se puede editar.'], 'lista las consecuencias');
  assert.ok(await d.locator('.dialogo-irreversible', { hasText: 'No se puede deshacer.' }).isVisible(), 'dice que no se puede deshacer');
  const desc = await d.evaluate((x) => document.getElementById(x.getAttribute('aria-describedby')).textContent);
  assert.match(desc, /Qué pasará:.*correo.*No se puede deshacer/, 'y el lector lo oye como descripción del diálogo');
  assert.equal(await d.locator('[data-r="si"]').textContent(), 'Rechazar solicitud', 'el botón repite el verbo');
  await d.locator('[data-r="si"]').click();
  const res = p.locator('#resultado');
  await res.waitFor();
  assert.equal(await p.evaluate(() => document.activeElement.className), 'resultado-titulo', 'el foco va al título del resultado');
  assert.equal(await res.locator('.resultado-titulo').textContent(), 'Solicitud EJ-2026-000123 rechazada');
  assert.match(await res.locator('.resultado-meta').textContent(), /^Quedó guardado a las \d{2}:\d{2} · Ana Revisora$/, 'hora y quién');
  assert.equal(await res.locator('.resultado-motivo-texto').textContent(), 'La identificación oficial está vencida.', 'el motivo, citado tal cual');
  assert.equal(await res.locator('[data-resultado-acciones] .btn-primario').textContent(), 'Volver a la bandeja', 'la acción para seguir se conserva');
  assert.ok(await res.evaluate((x) => x.classList.contains('resultado-rechazo')), 'con el tono del rechazo');
  assert.ok(await p.locator('#decision').isHidden(), 'el panel de decisión ya no se ofrece');
  const otroDia = await p.evaluate(() => { const el = document.createElement('section'); document.body.append(el); FormKit.resultado(el, { tono: 'ok', titulo: 'Validada', hora: '2026-01-05T17:30:00Z' }); return el.querySelector('.resultado-meta').textContent; });
  assert.equal(otroDia, 'Quedó guardado el 5 de enero de 2026 a las 11:30', 'si no fue hoy, también dice la fecha, en la hora de la Ciudad');
  assert.deepEqual(p.registro, [], 'consola limpia');
  await p.context().close();
});

test('el botón de peligro es rojo relleno dentro de la confirmación y de contorno fuera de ella (P114)', async () => {
  const p = await abreDesenlace();
  const color = (sel) => p.locator(sel).first().evaluate((b) => { const c = getComputedStyle(b); return [c.backgroundColor, c.color]; });
  assert.deepEqual(await color('#rechazar'), ['rgb(255, 255, 255)', 'rgb(140, 29, 24)'], 'el que abre la confirmación va con contorno');
  await p.click('#rechazar');
  assert.deepEqual(await color('dialog[open] .btn-peligro'), ['rgb(179, 38, 30)', 'rgb(255, 255, 255)'], 'el que hace el daño, relleno rojo con texto blanco');
  await p.keyboard.press('Escape');
  assert.equal(await p.evaluate(() => document.activeElement.id), 'rechazar', 'Escape vuelve sin cambios al botón que abrió');
  await p.context().close();
});

test('avisos con título y el icono de su tono; el que responde a una acción recibe el foco (P115)', async () => {
  const p = await abreDesenlace();
  const leer = () => p.evaluate(() => { const a = document.querySelectorAll('#avisos > .aviso'); const x = a[0]; return { n: a.length, clase: x.className, rol: x.getAttribute('role'), titulo: x.querySelector('.aviso-titulo').textContent, icono: x.querySelector('svg use').getAttribute('href'), foco: document.activeElement === x, texto: x.textContent }; });
  await p.evaluate(() => FormKit.aviso(document.getElementById('avisos'), { tono: 'ok', titulo: 'Nota guardada', texto: 'Sólo la ve el personal.', foco: true }));
  const ok = await leer();
  assert.deepEqual([ok.n, ok.clase, ok.rol, ok.titulo, ok.icono, ok.foco], [1, 'aviso aviso-ok', 'status', 'Nota guardada', '#i-ok', true]);
  assert.equal(ok.texto, 'Nota guardadaSólo la ve el personal.');
  assert.equal(await p.locator('#avisos .aviso-titulo').evaluate((t) => getComputedStyle(t).display), 'block', 'el título va en su propio renglón');
  await p.evaluate(() => FormKit.aviso(document.getElementById('avisos'), { tono: 'bloqueo', titulo: 'No se pudo guardar', texto: 'Intenta de nuevo.' }));
  const bloqueo = await leer();
  assert.deepEqual([bloqueo.n, bloqueo.clase, bloqueo.rol, bloqueo.icono], [1, 'aviso aviso-bloqueo', 'alert', '#i-error'], 'el mismo lugar se vuelve a pintar con otro tono, sin acumular avisos');
  await p.context().close();
});

test('el resumen dice de qué respuesta se trata, no habla de «campos» y tiene su título cuando rechaza el servidor (P116)', async () => {
  const p = await abreDesenlace();
  await p.click('[data-accion="enviar"]');
  const resumen = p.locator('.resumen-errores');
  await resumen.waitFor();
  assert.equal(await resumen.locator('.resumen-errores-titulo').textContent(), 'Para continuar, revisa 2 respuestas.');
  assert.deepEqual(await resumen.locator('a').allTextContents(), ['Identificación oficial: Completa «Observación».', 'Comprobante de domicilio: Completa «Observación».'], 'cada enlace con su contexto, del campo o de su sección');
  assert.doesNotMatch(await resumen.textContent(), /campo/i);
  await p.fill('#obs_ine', 'Legible');
  await p.fill('#obs_dom', 'Folio repetido');
  await p.evaluate(() => FormKit.iniciar(document.getElementById('revision'), { enviar: () => Promise.reject({ errores: [{ campo: 'obs_dom', mensaje: 'Ese comprobante ya se usó en otra solicitud.' }] }) }));
  await p.click('[data-accion="enviar"]');
  await p.waitForFunction(() => /No se pudo enviar/.test((document.querySelector('.resumen-errores-titulo') || {}).textContent || ''));
  assert.equal(await resumen.locator('.resumen-errores-titulo').textContent(), 'No se pudo enviar: revisa 1 respuesta.', 'el rechazo del servidor tiene su propio título');
  assert.deepEqual(await resumen.locator('a').allTextContents(), ['Comprobante de domicilio: Ese comprobante ya se usó en otra solicitud.']);
  await p.context().close();
});

test('lo que se anuncia también se ve: anuncio con su elemento, límite de filas y descarga fallida (P117)', async () => {
  const p = await abreDesenlace();
  await p.evaluate(() => FormKit.anuncia('Enviamos un código nuevo a tu correo.', { visible: document.getElementById('codigo-visible') }));
  assert.equal(await p.locator('#codigo-visible').textContent(), 'Enviamos un código nuevo a tu correo.', 'el texto anunciado queda en pantalla');
  assert.ok(await p.locator('#codigo-visible').isVisible());
  await p.waitForFunction(() => document.querySelector('[data-anuncios]').textContent === 'Enviamos un código nuevo a tu correo.');
  const agregar = p.locator('[data-repetible-agregar]');
  await agregar.click();
  assert.equal(await agregar.getAttribute('aria-disabled'), 'true', 'con el máximo, «Agregar» queda deshabilitado accesible');
  await agregar.click({ force: true }); /* aria-disabled: sigue enfocable y se puede tocar */
  assert.equal((await p.locator('.repetible-limite').textContent()).trim(), 'Como máximo se admiten 2 elementos en «Personas».', 'al tocarlo dice por qué no agrega, en pantalla');
  await p.click('[data-generar="falla"]');
  const av = p.locator('[data-descarga-aviso]');
  await av.waitFor();
  assert.match(await av.textContent(), /No se pudo preparar el archivo\. Intenta de nuevo\./, 'la descarga fallida se dice junto al botón');
  assert.equal(await av.locator('use').getAttribute('href'), '#i-alerta', 'con el icono de su tono');
  assert.deepEqual(p.registro, [], 'consola limpia');
  await p.context().close();
});

test('etiquetas de estado: cinco familias, cada una con su icono, y FormKit.estado las cambia (P118)', async () => {
  const p = await abreDesenlace();
  const leer = (id) => p.locator(`#${id}`).evaluate((x) => ({ clase: x.className, iconos: x.querySelectorAll('.icono').length, icono: x.querySelector('use').getAttribute('href'), texto: x.textContent, color: getComputedStyle(x).color }));
  assert.deepEqual(await leer('estado-solicitud'), { clase: 'estado estado-proceso', iconos: 1, icono: '#i-reloj', texto: 'En revisión', color: 'rgb(26, 86, 168)' }, 'en marcha: el módulo pone el icono de su familia');
  assert.deepEqual(await leer('estado-expediente'), { clase: 'estado estado-terminado', iconos: 1, icono: '#i-archivo', texto: 'Expediente concluido', color: 'rgb(43, 45, 46)' }, 'terminado: gris, con el archivo');
  await p.evaluate(() => FormKit.estado(document.getElementById('estado-solicitud'), { tono: 'ok', texto: 'Validada', anuncia: true }));
  assert.deepEqual(await leer('estado-solicitud'), { clase: 'estado estado-ok', iconos: 1, icono: '#i-ok', texto: 'Validada', color: 'rgb(20, 80, 50)' }, 'hecho: cambia de familia, de icono y de palabra, sin acumular iconos');
  await p.waitForFunction(() => document.querySelector('[data-anuncios]').textContent === 'Validada');
  const familias = await p.evaluate(() => ['ok', 'atencion', 'proceso', 'rechazo', 'terminado'].map((t) => FormKit.estado(document.createElement('span'), { tono: t, texto: t }).querySelector('use').getAttribute('href')));
  assert.deepEqual(familias, ['#i-ok', '#i-alerta', '#i-reloj', '#i-error', '#i-archivo'], 'cada familia con su icono');
  assert.deepEqual(p.registro, [], 'consola limpia mientras cada etiqueta tiene su familia');
  await p.evaluate(() => { const s = document.createElement('span'); s.className = 'estado'; s.textContent = 'Sin familia'; document.body.append(s); FormKit.estado.inicia(document.body); });
  assert.match(p.registro.join(' '), /le falta su familia/, 'una etiqueta sin familia se avisa en la consola');
  await p.context().close();
});

test('la secuencia «qué sigue» sirve fuera del acuse: en el resultado y en un aviso, sin perder su forma en el acuse (P119)', async () => {
  const p = await abreDesenlace();
  await p.click('#rechazar');
  await p.locator('dialog[open] [data-r="si"]').click();
  const sec = p.locator('#resultado .secuencia');
  await sec.waitFor();
  assert.equal(await p.locator('#resultado .resultado-pasos-titulo').textContent(), 'Qué sigue');
  assert.deepEqual(await sec.locator('li.secuencia-item').allTextContents(), ['La persona recibe el motivo por correo.', 'Si quiere seguir, abre una solicitud nueva.'], 'cada acción en su renglón');
  const forma = await sec.evaluate((ol) => { const li = ol.querySelector('li'); const n = getComputedStyle(li, '::before'); return { numero: n.content, borde: n.borderTopStyle, acuse: getComputedStyle(ol).maxWidth }; });
  assert.deepEqual(forma, { numero: 'counter(sec)', borde: 'solid', acuse: 'none' }, 'el número viene del núcleo, sin cargar el acuse, y fuera del acuse no se limita su ancho');
  assert.deepEqual(p.registro, [], 'consola limpia');
  await p.context().close();
  const t = await abrePlantilla(navegador, servidor.url, { contexto: PERFILES.escritorio.contexto });
  const enAcuse = await t.locator('.acuse .secuencia').evaluate((ol) => { const c = getComputedStyle(ol); return { ancho: c.maxWidth !== 'none', filete: c.borderTopStyle }; });
  assert.deepEqual(enAcuse, { ancho: true, filete: 'solid' }, 'en el acuse conserva su ancho y su filete');
  await t.context().close();
});
