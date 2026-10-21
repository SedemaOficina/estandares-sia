/* =========================================================
   01-por-pasos.prueba.mjs · Plantilla por pasos, recorrida como una persona

   El mismo recorrido corre en los dos perfiles (teléfono táctil y
   escritorio): pasos y barra, «Otro», cascada por código postal y de
   regreso, mapa con confirmación, archivos con rechazo motivado, contacto
   condicional, revisión con «Editar», diálogo de privacidad, resumen de
   errores con foco, borrador (recuperar, sensibles fuera), envío con error,
   límite y éxito con acuse y copiar.
   ========================================================= */
import test from 'node:test';
import assert from 'node:assert/strict';
import { sirve, abreNavegador, abrePlantilla, PERFILES, PNG_1x1, pngRuido, visible, continuar, llenaSolicitud, llenaLugar, llenaContacto, aceptaDeclaraciones, capturaPayload, validaEnServidor } from './ayudas.mjs';

let servidor, navegador;
test.before(async () => { servidor = await sirve(); navegador = await abreNavegador(); });
test.after(async () => { await navegador.close(); await servidor.cierra(); });

const pasoActual = (p) => p.locator('[data-paso-actual]').textContent().then((t) => t.trim());
const CLAVE = 'sia-plantilla-pasos';

for (const [clave, perfil] of Object.entries(PERFILES)) {
  test(`por pasos · ${perfil.nombre}: recorrido completo hasta el acuse`, async () => {
    const p = await abrePlantilla(navegador, servidor.url, { contexto: perfil.contexto });
    const movil = clave === 'movil';

    /* Paso 1 vacío: resumen con foco y enlaces; la barra marca el error. */
    await continuar(p);
    const resumen = p.locator('.resumen-errores');
    assert.equal(await resumen.count(), 1, 'aparece el resumen de errores');
    assert.ok(await p.evaluate(() => document.activeElement.classList.contains('resumen-errores')), 'el resumen recibe el foco');
    assert.ok((await resumen.locator('a').count()) >= 3, 'el resumen enlaza a cada campo');
    assert.equal(await pasoActual(p), 'Paso 1 de 4 · Solicitud');

    await llenaSolicitud(p);
    assert.equal(await resumen.count(), 0, 'el resumen desaparece al corregir');
    await continuar(p);
    assert.equal(await pasoActual(p), 'Paso 2 de 4 · Lugar');
    assert.equal(await p.evaluate(() => document.activeElement.className), 'titulo-paso', 'el foco va al título del paso');
    assert.match(await p.locator('.pasos-btn[data-hecho]').getAttribute('aria-label'), /completado/i);
    assert.equal(await p.locator('[data-recordatorio]').isHidden(), false, 'el recordatorio muestra lo elegido');

    /* Cascada: el código postal propone alcaldía y colonia; cambiar alcaldía reinicia. */
    await llenaLugar(p);
    assert.equal(await p.inputValue('#alcaldia'), 'Coyoacán');
    assert.equal(await p.inputValue('#colonia'), 'Villa de Prueba');
    await p.selectOption('#alcaldia', 'Cuauhtémoc');
    assert.equal(await p.inputValue('#colonia'), '', 'cambiar de alcaldía vacía la colonia');
    await p.selectOption('#colonia', 'Centro de Prueba');
    assert.equal(await p.inputValue('#cp'), '06000', 'la colonia propone el código postal');

    /* Mapa: tocar coloca el punto; hay que confirmarlo. */
    assert.ok(await p.locator('[data-mapa].leaflet-container').count(), 'el mapa cargó (Leaflet autoalojado)');
    if (movil) await p.locator('[data-mapa]').tap(); else await p.locator('[data-mapa]').click();
    await p.waitForTimeout(150);
    assert.match(await p.locator('[data-mapa-coords]').textContent(), /\d+\.\d+/, 'las coordenadas se enuncian en texto');
    assert.ok(await p.locator('[data-mapa-confirmar]').isVisible(), 'pide confirmar el punto');
    await p.click('[data-mapa-confirmar]');
    await continuar(p);
    assert.equal(await pasoActual(p), 'Paso 3 de 4 · Evidencia y contacto');

    /* Archivos: una imagen válida, una diminuta, una con extensión falsa, una vacía y un tipo no
       admitido. Lo que se sabe sin leer el archivo se rechaza en el acto con motivo; lo que exige
       leerlo (firma, dimensiones) queda en la lista en estado de error, también con motivo. */
    await p.setInputFiles('[data-archivos] input[type="file"]:not([data-entrada-camara])', [
      { name: 'foto.png', mimeType: 'image/png', buffer: pngRuido(400, 300) },
      { name: 'diminuta.png', mimeType: 'image/png', buffer: PNG_1x1 },
      { name: 'falso.jpg', mimeType: 'image/jpeg', buffer: Buffer.from('no soy una imagen') },
      { name: 'vacio.pdf', mimeType: 'application/pdf', buffer: Buffer.alloc(0) },
      { name: 'video.mov', mimeType: 'video/quicktime', buffer: Buffer.from('x') }
    ]);
    await p.waitForTimeout(1200);
    const rechazos = await p.locator('.arch-rechazo').allTextContents();
    assert.equal(rechazos.length, 2, `dos rechazos inmediatos: ${rechazos.join(' | ')}`);
    assert.ok(rechazos.every((t) => /vac.o|no se admite|s.lo se admiten/.test(t)), `cada rechazo explica el motivo: ${rechazos.join(' | ')}`);
    const conError = await p.locator('.arch[data-estado="error"]').allTextContents();
    assert.equal(conError.length, 2, `dos archivos en error tras leerlos: ${conError.join(' | ')}`);
    assert.ok(conError.some((t) => /pequeña/.test(t)) && conError.some((t) => /no corresponde a su extensión/.test(t)), 'dimensión y firma falsa, con motivo');
    assert.equal(await p.locator('.arch[data-estado="ok"], .arch[data-estado="listo"], .arch:not([data-estado="error"])').count(), 1, 'sólo la imagen válida queda lista');
    assert.equal(await p.locator('[data-camara]').isHidden(), !movil, movil ? 'en teléfono aparece el botón de cámara' : 'en escritorio no hay botón de cámara');

    await llenaContacto(p);
    await continuar(p);
    assert.equal(await pasoActual(p), 'Paso 4 de 4 · Revisión');
    const bloques = await p.locator('.rev-bloque').count();
    assert.ok(bloques >= 3, 'la revisión muestra los bloques de los pasos');
    assert.ok((await p.locator('.rev-dato-valor').allTextContents()).some((t) => /55 0000 0000|5500000000/.test(t)), 'el teléfono se muestra como se escribió o normalizado');

    /* «Editar» de cada bloque aterriza en su primer campo (uno por bloque, C3-01). */
    await p.locator('.rev-bloque').nth(1).locator('[data-editar]').click();
    await p.waitForTimeout(150);
    assert.equal(await p.evaluate(() => document.activeElement.id), 'calle');
    await p.click('.pasos-btn[data-ir="3"]');
    await p.waitForTimeout(200);

    /* Diálogo de privacidad: foco dentro, Escape cierra y devuelve el foco. */
    await p.click('[data-abre-dialogo]');
    await p.waitForTimeout(100);
    assert.ok(await p.locator('#dialogo-privacidad[open]').count(), 'el diálogo abre');
    assert.ok(await p.evaluate(() => document.activeElement.closest('dialog') !== null), 'el foco entra al diálogo');
    await p.keyboard.press('Escape');
    assert.equal(await p.locator('#dialogo-privacidad[open]').count(), 0);
    assert.ok(await p.evaluate(() => document.activeElement.hasAttribute('data-abre-dialogo')), 'el foco vuelve al botón que abrió');

    /* Enviar sin las declaraciones: nada sale. */
    await visible(p, '[data-accion="enviar"]').click();
    await p.waitForTimeout(150);
    const faltan = await p.locator('.resumen-errores a').allTextContents();
    assert.equal(faltan.length, 2, `faltan las dos casillas: ${faltan.join(' | ')}`);
    await aceptaDeclaraciones(p);

    /* Borrador: se guardó con el paso y los datos; al volver se ofrece y restaura; lo sensible no. */
    await p.waitForTimeout(900);
    const borrador = await p.evaluate((k) => JSON.parse(localStorage.getItem(k)), CLAVE);
    assert.equal(borrador.paso, 3);
    assert.equal(borrador.datos.contacto, 'si');
    assert.equal(borrador.datos.nombre, undefined, 'el nombre (sensible) no entra al borrador');
    await p.goto(`${servidor.url}/codigo/plantillas/por-pasos.html?simular=error`);
    await p.waitForTimeout(300);
    assert.ok(await p.locator('[data-franja-borrador]').isVisible(), 'se ofrece recuperar el borrador');
    await p.click('[data-borrador="recuperar"]');
    await p.waitForTimeout(300);
    assert.equal(await pasoActual(p), 'Paso 4 de 4 · Revisión', 'vuelve al paso donde estaba');
    assert.equal(await p.inputValue('#tipo_otro'), 'Una situación no prevista');
    assert.equal(await p.inputValue('#colonia'), 'Centro de Prueba', 'la cascada se restaura con sus hijos');
    assert.equal(await p.inputValue('#nombre'), '', 'lo sensible se pide de nuevo');

    /* Rellena lo sensible y envía con error simulado: aviso con foco, botón recuperado, nada se pierde. */
    const completa = async () => {
      await p.click('.pasos-btn[data-ir="2"]'); await p.waitForTimeout(150);
      if (!(await p.inputValue('#nombre'))) { await p.fill('#nombre', 'Fulana'); await p.fill('#apellido_paterno', 'de Tal'); await p.fill('#correo', 'fulana@ejemplo.local'); await p.fill('#telefono', '55 0000 0000'); }
      /* Los archivos no entran al borrador: se vuelven a adjuntar. */
      if (!(await p.locator('.arch').count())) { await p.setInputFiles('[data-archivos] input[type="file"]:not([data-entrada-camara])', [{ name: 'foto.png', mimeType: 'image/png', buffer: pngRuido(400, 300) }]); await p.waitForTimeout(900); }
      await p.click('.pasos-btn[data-ir="3"]'); await p.waitForTimeout(200);
      await aceptaDeclaraciones(p);
    };
    await completa();
    await visible(p, '[data-accion="enviar"]').click();
    await p.waitForTimeout(800);
    const aviso = p.locator('[data-estado-envio]');
    assert.equal(await aviso.isHidden(), false, 'el fallo se dice con palabras');
    assert.ok(await p.evaluate(() => document.activeElement.hasAttribute('data-estado-envio')), 'el aviso recibe el foco');
    assert.equal(await visible(p, '[data-accion="enviar"]').getAttribute('aria-disabled'), null, 'el botón se recupera');
    assert.equal(await p.inputValue('#descripcion'), (await import('./ayudas.mjs')).FRASE_LEGIBLE, 'lo capturado se conserva');

    /* Límite de envíos: pantalla propia con «Volver». */
    await p.goto(`${servidor.url}/codigo/plantillas/por-pasos.html?simular=limite`);
    await p.waitForTimeout(300);
    await p.click('[data-borrador="recuperar"]'); await p.waitForTimeout(300);
    await completa();
    await visible(p, '[data-accion="enviar"]').click();
    await p.waitForTimeout(800);
    assert.ok(await p.locator('[data-limite]').isVisible(), 'se muestra la pantalla de límite');
    await p.click('[data-limite] [data-accion="reintentar"]');
    assert.ok(await p.locator('form').isVisible(), '«Volver» regresa al formulario donde estaba');

    /* Éxito: acuse con folio, foco en el título, borrador borrado, copiar. */
    await p.goto(`${servidor.url}/codigo/plantillas/por-pasos.html`);
    await p.waitForTimeout(300);
    await p.click('[data-borrador="recuperar"]'); await p.waitForTimeout(300);
    await completa();
    const caja = await capturaPayload(p);
    await visible(p, '[data-accion="enviar"]').click();
    await p.waitForTimeout(1000);
    assert.ok(await p.locator('[data-acuse]').isVisible(), 'aparece el acuse');
    assert.match(await p.locator('#folio').textContent(), /^EJEMPLO-/, 'el acuse muestra el folio');
    assert.equal(await p.evaluate((k) => localStorage.getItem(k), CLAVE), null, 'el borrador se borra al enviar');
    assert.ok(caja.payload, 'el servidor recibiría un payload');
    assert.equal(caja.payload.datos.tipo, 'otro');
    assert.equal(caja.payload.datos.tipo_otro, 'Una situación no prevista');
    assert.equal(caja.payload.datos.contacto, 'si');
    assert.equal(caja.payload.datos.telefono, '5500000000', 'el teléfono viaja normalizado a diez dígitos');
    assert.ok(caja.payload.meta.idempotencia, 'lleva clave de idempotencia');
    assert.equal(caja.payload.archivos.length, 1, 'viaja la imagen adjuntada de nuevo (los archivos no se guardan en el borrador)');
    assert.equal(caja.payload.archivos[0].sha256.length, 64, 'cada archivo lleva su huella SHA-256');
    const enServidor = await validaEnServidor(caja.payload, 'por-pasos');
    assert.deepEqual(enServidor.errores, [], 'el servidor acepta lo que el navegador envía, punto del mapa incluido');
    await p.click('[data-copiar="#folio"]');
    await p.waitForTimeout(150);
    assert.match(await p.locator('[data-copiar="#folio"]').textContent(), /Copiado|No se pudo copiar/, 'copiar confirma con palabras');

    assert.deepEqual(p.registro, [], 'consola y red limpias durante todo el recorrido');
    await p.context().close();
  });
}

test('por pasos · la barra permite inspeccionar pasos futuros pero exige lo mismo que «Continuar»', async () => {
  const p = await abrePlantilla(navegador, servidor.url, { contexto: PERFILES.escritorio.contexto });
  assert.equal(await p.locator('.pasos-btn[data-ir="2"]').isDisabled(), false, 'los pasos futuros están habilitados (decisión C8)');
  await p.click('.pasos-btn[data-ir="2"]');
  await p.waitForTimeout(150);
  assert.equal(await pasoActual(p), 'Paso 1 de 4 · Solicitud', 'no avanza con el paso 1 incompleto');
  assert.equal(await p.locator('.resumen-errores').count(), 1);
  await llenaSolicitud(p);
  await p.click('.pasos-btn[data-ir="1"]');
  await p.waitForTimeout(150);
  assert.equal(await pasoActual(p), 'Paso 2 de 4 · Lugar');
  await p.click('.pasos-btn[data-ir="0"]');
  await p.waitForTimeout(150);
  assert.equal(await pasoActual(p), 'Paso 1 de 4 · Solicitud', 'retroceder siempre se permite');
  assert.equal(await p.locator('.resumen-errores').count(), 0, 'retroceder no castiga');
  assert.deepEqual(p.registro, []);
  await p.context().close();
});

test('por pasos · validación en el momento acordado: nada al escribir, error al salir, se limpia al corregir', async () => {
  const p = await abrePlantilla(navegador, servidor.url, { contexto: PERFILES.escritorio.contexto });
  const err = p.locator('[data-campo="descripcion"] .err');
  await p.focus('#descripcion'); await p.keyboard.press('Tab');
  assert.equal(await err.getAttribute('data-nivel'), null, 'salir de un campo sin tocar no regaña');
  await p.fill('#descripcion', 'asdf');
  assert.equal(await err.getAttribute('data-nivel'), null, 'mientras se escribe la primera vez no hay error');
  await p.keyboard.press('Tab');
  assert.equal(await err.getAttribute('data-nivel'), 'error', 'al salir con un valor insuficiente aparece el error');
  assert.match(await err.textContent(), /al menos|caracteres|palabras/, 'el mensaje dice qué hacer');
  await p.fill('#descripcion', 'Se observa una situación que requiere atención desde hace varias semanas en la zona.');
  assert.equal(await err.getAttribute('data-nivel'), null, 'el error se limpia en cuanto el campo queda bien');
  await p.context().close();
});
