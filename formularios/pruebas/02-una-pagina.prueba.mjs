/* =========================================================
   02-una-pagina.prueba.mjs · Plantilla de una página, en los dos perfiles

   CURP con derivados en solo lectura, confirmación de correo (cruzada
   «igual»), numérico con máximo, ayuda desplegable, combo con chips de uso
   frecuente, opción múltiple con máximo y «Otro», rango de fechas con
   atajos y cruzada, escala, repetibles con confirmación, interruptor,
   resumen de errores y envío con acuse.
   ========================================================= */
import test from 'node:test';
import assert from 'node:assert/strict';
import { sirve, abreNavegador, abrePagina, PERFILES, PAGINAS, capturaPayload, validaEnServidor } from './ayudas.mjs';

let servidor, navegador;
test.before(async () => { servidor = await sirve(); navegador = await abreNavegador(); });
test.after(async () => { await navegador.close(); await servidor.cierra(); });

const nivel = (p, campo) => p.locator(`[data-campo="${campo}"] .err`).getAttribute('data-nivel');
const mensaje = (p, campo) => p.locator(`[data-campo="${campo}"] .err`).textContent().then((t) => t.replace(/^Error:\s*/, '').trim());

for (const perfil of Object.values(PERFILES)) {
  test(`una página · ${perfil.nombre}: recorrido completo hasta el acuse`, async () => {
    const p = await abrePagina(navegador, servidor.url, PAGINAS['una-pagina'], { contexto: perfil.contexto });

    /* Nombre coherente con la CURP ficticia (cruzadas curp-nombre y curp-segundo-apellido). */
    await p.fill('#nombre', 'Fulano'); await p.fill('#apellido_paterno', 'Prueba'); await p.fill('#apellido_materno', 'Ejemplo');
    /* CURP: mayúsculas al escribir, 18 caracteres, deriva la fecha de nacimiento a un campo de solo lectura. */
    await p.fill('#curp', 'puef900515hdfrjl04'); await p.keyboard.press('Tab');
    assert.equal(await p.inputValue('#curp'), 'PUEF900515HDFRJL04', 'la CURP se normaliza a mayúsculas');
    assert.equal(await p.inputValue('#nacimiento'), '1990-05-15', 'la fecha de nacimiento se deriva');
    assert.match(await p.inputValue('#edad'), /^\d+$/, 'la edad se calcula con la fecha');
    assert.equal(await nivel(p, 'curp'), null, 'la CURP ficticia es estructuralmente válida');
    assert.equal(await p.getAttribute('#nacimiento', 'readonly'), '', 'el derivado es de solo lectura');

    /* Confirmación de correo: cruzada «igual», bloqueante. */
    await p.fill('#correo', 'fulana@ejemplo.local'); await p.fill('#correo2', 'fulana@ejemplo.loca'); await p.keyboard.press('Tab');
    assert.match(await mensaje(p, 'correo2'), /no coinciden/);
    await p.fill('#correo2', 'fulana@ejemplo.local');
    assert.equal(await nivel(p, 'correo2'), null, 'la cruzada se limpia al corregir');

    /* Numérico con máximo. */
    await p.fill('#telefono', '55 0000 0000'); await p.fill('#personas', '25'); await p.keyboard.press('Tab');
    assert.match(await mensaje(p, 'personas'), /máximo/);
    await p.fill('#personas', '3');

    /* Ayuda desplegable: clic abre y enlaza; Escape cierra. */
    await p.click('.tooltip-btn');
    assert.ok(await p.locator('.tooltip-texto').isVisible());
    assert.equal(await p.getAttribute('.tooltip-btn', 'aria-expanded'), 'true');
    assert.ok(await p.getAttribute('.tooltip-btn', 'aria-describedby'));
    await p.keyboard.press('Escape');
    assert.ok(await p.locator('.tooltip-texto').isHidden());

    /* Combo con teclado y chips de uso frecuente (sólo en este dispositivo). */
    assert.equal(await p.locator('.chip').count(), 0, 'sin historial no hay chips');
    await p.click('#alcaldia'); await p.type('#alcaldia', 'coy'); await p.keyboard.press('ArrowDown'); await p.keyboard.press('Enter'); await p.keyboard.press('Tab');
    await p.waitForTimeout(100);
    assert.equal(await p.inputValue('#alcaldia'), 'Coyoacán');
    /* La sugerencia se guarda, pero no aparece mientras se llena: crecer arriba del campo movería lo de abajo (C2-02). */
    assert.equal(await p.locator('.chip').count(), 0, 'mientras se llena, la fila de sugerencias no cambia');
    const claves = await p.evaluate(() => Object.keys(localStorage));
    assert.ok(claves.some((k) => /chips|sugerencias/i.test(k)), `el historial vive en el almacén local: ${claves.join(', ')}`);

    /* Opción múltiple con máximo 3 y «Otro». */
    for (const v of ['reforestacion', 'monitoreo', 'talleres', 'otro']) await p.check(`input[name="intereses"][value="${v}"]`);
    assert.ok(await p.locator('#intereses_otro').isVisible(), '«Otro» abre su especificación');
    await p.fill('#intereses_otro', 'Compostaje');

    /* Rango de fechas: atajo de 7 días; final anterior al inicio → cruzada. */
    await p.click('[data-atajo="7"]');
    assert.ok(await p.inputValue('#desde') && await p.inputValue('#hasta'), 'el atajo llena ambas fechas');
    assert.equal(await p.getAttribute('[data-atajo="7"]', 'aria-pressed'), 'true');
    await p.fill('#hasta', '2020-01-01'); await p.focus('[data-campo="hasta"] [data-hoy]');
    assert.match(await mensaje(p, 'hasta'), /anterior|posterior/);
    await p.click('[data-campo="hasta"] [data-hoy]');
    assert.equal(await nivel(p, 'hasta'), null);

    /* Escala. */
    await p.check('input[name="interes"][value="4"]');
    assert.equal(await p.locator('.escala-punto:has(input:checked) .escala-num').textContent(), '4');

    /* Repetibles: máximo, confirmación para quitar. */
    await p.click('[data-repetible-agregar]'); await p.fill('#ac-0-n', 'Mengano'); await p.fill('#ac-0-e', '12');
    await p.click('[data-repetible-agregar]'); await p.click('[data-repetible-agregar]');
    assert.equal(await p.locator('.repetible-fila').count(), 3);
    assert.equal(await p.getAttribute('[data-repetible-agregar]', 'aria-disabled'), 'true', 'al llegar al máximo el botón se marca, sin desaparecer');
    await p.click('.repetible-fila:nth-child(1) [data-repetible-quitar]');
    await p.waitForTimeout(200);
    const dlg = p.locator('dialog[role="alertdialog"][open]');
    assert.equal(await dlg.count(), 1, 'quitar pide confirmación');
    assert.ok(await p.evaluate(() => /^Volver sin cambios$/.test(document.activeElement.textContent)), 'el foco inicial va a la opción segura');
    await dlg.locator('[data-r="si"]').click();
    await p.waitForTimeout(100);
    assert.equal(await p.locator('.repetible-fila').count(), 2);

    /* Interruptor. */
    await p.click('[data-toggle]');
    assert.equal(await p.getAttribute('[data-toggle]', 'aria-checked'), 'true');

    /* Enviar con 4 intereses (máximo 3) y sin aviso: resumen con los dos. */
    await p.click('[data-accion="enviar"]'); await p.waitForTimeout(200);
    const faltan = await p.locator('.resumen-errores a').allTextContents();
    assert.ok(faltan.length >= 2, `el resumen lista lo que falta: ${faltan.join(' | ')}`);
    await p.uncheck('input[name="intereses"][value="talleres"]'); await p.check('input[name="aviso"]');
    for (const i of [1, 2]) if (await p.locator(`#ac-${i}-n`).count()) await p.fill(`#ac-${i}-n`, i === 1 ? 'Persona Uno' : 'Persona Dos');

    const caja = await capturaPayload(p);
    await p.click('[data-accion="enviar"]'); await p.waitForTimeout(1000);
    assert.equal(await p.locator('.resumen-errores').count(), 0, `no quedan errores: ${(await p.locator('.resumen-errores a').allTextContents()).join(' | ')}`);
    assert.ok(await p.locator('[data-acuse]').isVisible(), 'aparece el acuse');
    assert.ok(caja.payload);
    assert.equal(caja.payload.datos.curp, 'PUEF900515HDFRJL04');
    assert.equal(caja.payload.datos.intereses_otro, 'Compostaje');
    assert.equal(caja.payload.datos.intereses.length, 3);
    assert.equal(caja.payload.datos.avisos, 'si', 'el interruptor viaja como valor del campo oculto');
    /* No basta contar filas: viajan las que quedaron, con lo que se escribió, y no la que se quitó. */
    const acomp = Object.entries(caja.payload.datos).filter(([k]) => /^acompanantes\.\d+\.nombre$/.test(k)).map(([, v]) => v).sort();
    assert.deepEqual(acomp, ['Persona Dos', 'Persona Uno'], 'viajan las dos filas que quedaron');
    assert.ok(!Object.values(caja.payload.datos).includes('Mengano'), 'la fila quitada no viaja');
    const enServidor = await validaEnServidor(caja.payload, 'una-pagina');
    assert.deepEqual(enServidor.errores, [], 'el servidor acepta lo que el navegador envía, acompañantes incluidos');
    assert.deepEqual(p.registro, [], 'consola y red limpias');
    await p.context().close();
  });
}
