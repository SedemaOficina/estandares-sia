/* =========================================================
   06-servidor-y-herramientas.prueba.mjs · Lo que no necesita navegador

   · El servidor revalida con las mismas reglas: validar.mjs acepta un
     payload correcto, rechaza uno con errores (formato, obligatorio,
     opción ajena, condición incumplida, campo no declarado), degrada la
     cruzada cp↔colonia a señal y normaliza igual que el navegador.
   · Las herramientas del paquete terminan en verde: auditor de CSS,
     contraste, auditoría de campos, bibliotecas, documentos generados.
   · El manifiesto describe archivos que existen y dependencias reales.
   · Las tipografías autoalojadas traen su licencia.
   ========================================================= */
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { RAIZ } from './ayudas.mjs';

/* import() pide una dirección file://: en Windows una ruta C:\… no sirve. */
const { validaPayload } = await import(pathToFileURL(resolve(RAIZ, 'codigo/servidor/validar.mjs')).href);
await import(pathToFileURL(resolve(RAIZ, 'codigo/catalogos/cdmx-ejemplo.js')).href);
const CAT = { cdmx: globalThis.FORMKIT_CATALOGOS.cdmx.filas, alcaldias: globalThis.FORMKIT_CATALOGOS.alcaldias };
const esquema = (n) => JSON.parse(execFileSync(process.execPath, [resolve(RAIZ, 'herramientas/esquema-desde-html.mjs'), resolve(RAIZ, `codigo/plantillas/${n}.html`)], { encoding: 'utf8' }));
/* Esquema de un formulario de prueba escrito en la prueba misma. */
const TEMPORAL = mkdtempSync(join(tmpdir(), 'formkit-esquema-'));
let cuentaTemporal = 0;
const esquemaDe = (cuerpo) => {
  const archivo = join(TEMPORAL, `prueba-${++cuentaTemporal}.html`);
  writeFileSync(archivo, `<form data-formkit>\n${cuerpo}\n</form>\n`);
  return JSON.parse(execFileSync(process.execPath, [resolve(RAIZ, 'herramientas/esquema-desde-html.mjs'), archivo], { encoding: 'utf8' }));
};
const META = { idempotencia: 'abc' };

const BUENO = {
  datos: { tipo: 'otro', tipo_otro: 'Una situación no prevista', urgente: 'no', fecha_hechos: '2026-01-10', descripcion: 'El árbol frente a la escuela tiene una grieta grande en el tronco desde hace dos semanas.', alcaldia: 'Coyoacán', colonia: 'Villa de Prueba', cp: '04010', calle: 'Calle de Prueba', num_ext: '1', contacto: 'si', nombre: 'Fulana', apellido_paterno: 'de Tal', correo: 'Fulana@Ejemplo.local ', telefono: '+52 55 0000 0000', aviso: 'si', humano: 'si' },
  archivos: [],
  meta: { idempotencia: 'abc', version: '1' }
};

test('servidor · acepta un payload correcto y normaliza igual que el navegador', () => {
  const r = validaPayload(structuredClone(BUENO), esquema('por-pasos'), { catalogos: CAT });
  assert.deepEqual(r.errores, [], JSON.stringify(r.errores));
  assert.equal(r.ok, true);
  assert.equal(r.datos.correo, 'fulana@ejemplo.local', 'el correo se normaliza en minúsculas y sin espacios');
  assert.equal(r.datos.telefono, '5500000000', 'el teléfono queda en diez dígitos');
});

test('servidor · rechaza formato, obligatorio, opción ajena, condición incumplida y campo no declarado', () => {
  const malo = structuredClone(BUENO);
  malo.datos.cp = '1234';
  malo.datos.correo = 'sin-arroba';
  delete malo.datos.descripcion;
  malo.datos.urgente = 'quizá';
  malo.datos.inventado = 'x';
  const r = validaPayload(malo, esquema('por-pasos'), { catalogos: CAT });
  assert.equal(r.ok, false);
  const campos = r.errores.map((e) => e.campo).sort();
  for (const c of ['cp', 'correo', 'descripcion', 'urgente', 'inventado']) assert.ok(campos.includes(c), `error en «${c}»: ${JSON.stringify(r.errores)}`);
  assert.ok(r.errores.every((e) => e.mensaje.length > 10), 'cada error trae mensaje');
});

test('servidor · un campo condicional cuya condición no se cumple se descarta con señal; cp↔colonia es advertencia', () => {
  const p = structuredClone(BUENO);
  p.datos.contacto = 'no';
  p.datos.cp = '09999';
  const r = validaPayload(p, esquema('por-pasos'), { catalogos: CAT });
  assert.deepEqual(r.errores, [], JSON.stringify(r.errores));
  assert.equal(r.datos.nombre, undefined, 'el nombre no viaja si no se pidió contacto');
  assert.ok(r.senales.some((s) => /nombre/.test(s)), 'se señala que venía con valor');
  assert.ok(r.senales.some((s) => /Advertencia.*cp/.test(s)), 'cp ajeno a la colonia: señal, no error');
});

test('servidor · esquema de una página: CURP y su cruzada con la fecha de nacimiento', () => {
  const e = esquema('una-pagina');
  assert.equal(e.campos.curp.formato, 'curp');
  const base = { datos: { nombre: 'Juan', apellido_paterno: 'Pérez', apellido_materno: 'García', curp: 'pegj900515hdfrrn09', correo: 'a@ejemplo.local', correo2: 'a@ejemplo.local', aviso: 'si' }, archivos: [], meta: {} };
  const r1 = validaPayload(structuredClone(base), e, { catalogos: CAT });
  assert.equal(r1.datos.curp, 'PEGJ900515HDFRRN09');
  assert.ok(!r1.errores.some((x) => x.campo === 'curp'), JSON.stringify(r1.errores));
  const r2 = validaPayload({ ...structuredClone(base), datos: { ...base.datos, curp: 'PEGJ900515HDFRRN0' } }, e, { catalogos: CAT });
  assert.ok(r2.errores.some((x) => x.campo === 'curp' && /18/.test(x.mensaje)), 'la CURP corta se rechaza en el servidor');
  const r3 = validaPayload({ ...structuredClone(base), datos: { ...base.datos, correo2: 'otro@ejemplo.local' } }, e, { catalogos: CAT });
  assert.ok(r3.errores.some((x) => x.campo === 'correo2'), 'la confirmación distinta se rechaza');
});

/* Un registro de una página completo y correcto, tal como lo manda el navegador. */
const REGISTRO = { datos: { nombre: 'Juan', apellido_paterno: 'Pérez', apellido_materno: 'García', curp: 'PEGJ900515HDFRRN09', nacimiento: '1990-05-15', edad: '36', correo: 'a@ejemplo.local', correo2: 'a@ejemplo.local', personas: '3', alcaldia: 'Coyoacán', intereses: ['reforestacion'], desde: '2026-10-20', hasta: '2026-10-27', interes: '4', aviso: 'si' }, archivos: [], meta: { idempotencia: 'abc' } };

test('servidor · grupos repetibles: cada fila se valida con su patrón, con mínimo y máximo de filas', () => {
  const e = esquema('una-pagina');
  const r0 = validaPayload(structuredClone(REGISTRO), e, { catalogos: CAT });
  assert.deepEqual(r0.errores, [], `un registro completo sin acompañantes se acepta: ${JSON.stringify(r0.errores)}`);
  const con = (extra) => validaPayload({ ...structuredClone(REGISTRO), datos: { ...REGISTRO.datos, ...extra } }, e, { catalogos: CAT });
  assert.deepEqual(con({ 'acompanantes.0.nombre': 'Persona Uno', 'acompanantes.0.edad': '12' }).errores, [], 'una fila completa se acepta');
  assert.ok(con({ 'acompanantes.0.edad': '12' }).errores.some((x) => x.campo === 'acompanantes.0.nombre'), 'una fila sin su dato obligatorio se rechaza');
  assert.ok(con({ 'acompanantes.0.nombre': 'Persona Uno', 'acompanantes.0.edad': '500' }).errores.some((x) => x.campo === 'acompanantes.0.edad'), 'el dato de una fila cumple su formato');
  assert.ok(con({ 'acompanantes.0.inventado': 'x' }).errores.some((x) => x.campo === 'acompanantes.0.inventado'), 'un campo que la fila no declara se rechaza');
  assert.ok(con({ 'acompanantes.#.nombre': 'x' }).errores.some((x) => x.campo === 'acompanantes.#.nombre'), 'el patrón no se acepta como dato');
  const cuatro = Object.fromEntries([0, 1, 2, 3].map((i) => [`acompanantes.${i}.nombre`, `Persona ${i}`]));
  assert.ok(con(cuatro).errores.some((x) => x.campo === 'acompanantes' && /máximo/.test(x.mensaje)), 'más filas que el máximo se rechazan');
});

test('servidor · el punto del mapa llega como {type, coordinates}, con números en rango y dentro del ámbito', () => {
  const e = esquema('por-pasos');
  const punto = (v) => validaPayload({ ...structuredClone(BUENO), datos: { ...BUENO.datos, punto: v } }, e, { catalogos: CAT });
  assert.deepEqual(punto({ type: 'Point', coordinates: [-99.1332, 19.4326] }).errores, [], 'el punto que manda el navegador se acepta');
  for (const malo of [{ tipo: 'Point', coordinates: [-99.13, 19.43] }, { type: 'Point', coordinates: ['<b>', {}] }, { type: 'Point', coordinates: [-99.13, 19.43], extra: 1 }, '19.43,-99.13']) {
    assert.ok(punto(malo).errores.some((x) => x.campo === 'punto'), `punto mal formado se rechaza: ${JSON.stringify(malo)}`);
  }
  assert.ok(punto({ type: 'Point', coordinates: [-103.35, 20.67] }).errores.some((x) => x.campo === 'punto'), 'un punto fuera de la Ciudad se rechaza');
});

test('servidor · envíos mal formados o con claves especiales se rechazan sin detener el proceso', () => {
  const e = esquema('por-pasos');
  for (const malo of [null, [], 'texto', { datos: [] }, { datos: {}, archivos: {} }, { datos: {}, meta: 'x' }]) {
    const r = validaPayload(malo, e, { catalogos: CAT });
    assert.equal(r.ok, false, `se rechaza: ${JSON.stringify(malo)}`);
  }
  const especiales = JSON.parse('{"__proto__": {"x": 1}, "constructor": "c", "toString": "t", "hasOwnProperty": "h"}');
  const r = validaPayload({ ...structuredClone(BUENO), datos: { ...BUENO.datos, ...especiales } }, e, { catalogos: CAT });
  for (const k of ['__proto__', 'constructor', 'toString', 'hasOwnProperty']) assert.ok(r.errores.some((x) => x.campo === k), `«${k}» no cuenta como campo declarado`);
  assert.equal(Object.getPrototypeOf(r.datos), Object.prototype, 'los datos devueltos son un objeto común');
  assert.equal(Object.hasOwn(r.datos, '__proto__'), false, 'sin la clave __proto__');
  const archivos = validaPayload({ ...structuredClone(BUENO), archivos: [{ campo: 'constructor', nombre: 'a.jpg', size: 10 }, { campo: 'nombre', nombre: 'a.jpg', size: 10 }, { campo: 'fotos', nombre: 'a.jpg', size: '10' }, null] }, e, { catalogos: CAT });
  assert.equal(archivos.ok, false);
  assert.equal(archivos.errores.length, 4, `cada archivo mal dirigido o mal formado es un error: ${JSON.stringify(archivos.errores)}`);
});

test('servidor · el tipo de cada dato: listas u objetos donde va texto se rechazan; opciones repetidas no cuentan', () => {
  const e = esquema('por-pasos');
  const con = (extra) => validaPayload({ ...structuredClone(BUENO), datos: { ...BUENO.datos, ...extra } }, e, { catalogos: CAT });
  assert.ok(con({ calle: ['Calle', 'de', 'Prueba'] }).errores.some((x) => x.campo === 'calle'), 'una lista donde va texto se rechaza');
  assert.ok(con({ num_ext: { $gt: '' } }).errores.some((x) => x.campo === 'num_ext'), 'un objeto donde va texto se rechaza');
  assert.ok(con({ urgente: ['no'] }).errores.some((x) => x.campo === 'urgente'), 'una lista en una opción única se rechaza');
  const u = esquema('una-pagina');
  const rep = validaPayload({ ...structuredClone(REGISTRO), datos: { ...REGISTRO.datos, intereses: ['reforestacion', 'reforestacion', 'reforestacion', 'reforestacion'] } }, u, { catalogos: CAT });
  assert.deepEqual(rep.datos.intereses, ['reforestacion'], 'las opciones repetidas cuentan una vez');
  const toggle = validaPayload({ ...structuredClone(REGISTRO), datos: { ...REGISTRO.datos, avisos: { a: 1 } } }, u, { catalogos: CAT });
  assert.ok(toggle.errores.some((x) => x.campo === 'avisos'), 'el interruptor sólo acepta «si»');
});

test('servidor · un archivo obligatorio se busca en payload.archivos, que es donde lo manda el navegador (P46)', () => {
  const e = esquema('por-pasos');
  e.campos.fotos.requerido = true;
  const con = validaPayload({ ...structuredClone(BUENO), archivos: [{ campo: 'fotos', nombre: 'foto.jpg', size: 1000, sha256_original: 'a' }] }, e, { catalogos: CAT });
  assert.deepEqual(con.errores, [], `con el archivo se acepta: ${JSON.stringify(con.errores)}`);
  const sin = validaPayload(structuredClone(BUENO), e, { catalogos: CAT });
  assert.equal(sin.errores.filter((x) => x.campo === 'fotos').length, 1, 'sin el archivo hay un solo error, no dos');
});

test('servidor · condiciones anidadas: un campo exige las de todos sus ancestros (P38) y lo comentado no cuenta', () => {
  const e = esquemaDe(`
    <fieldset class="grupo" data-campo="modalidad" data-uso="Prueba."><legend class="etiqueta">Modalidad</legend>
      <label><input type="radio" name="modalidad" value="nueva">Nueva</label><label><input type="radio" name="modalidad" value="renovacion">Renovación</label></fieldset>
    <div data-si="modalidad=nueva">
      <fieldset class="grupo" data-campo="tipo" data-uso="Prueba."><legend class="etiqueta">Tipo</legend>
        <label><input type="radio" name="tipo" value="poda">Poda</label><label><input type="radio" name="tipo" value="dictamen">Dictamen</label></fieldset>
      <section data-si="tipo=poda">
        <div class="campo" data-campo="experiencia" data-requerido data-uso="Prueba."><label class="etiqueta" for="experiencia">Experiencia</label><input id="experiencia" name="experiencia" type="text"></div>
      </section>
    </div>
    <!-- <div class="campo" data-campo="viejo" data-requerido data-uso="Prueba."><input name="viejo"></div> -->`);
  assert.equal(e.campos.experiencia.condiciones.length, 2, 'guarda las dos condiciones');
  assert.equal(e.campos.viejo, undefined, 'un campo comentado no se declara');
  const v = (datos) => validaPayload({ datos, archivos: [], meta: META }, e);
  assert.ok(v({ modalidad: 'nueva', tipo: 'poda' }).errores.some((x) => x.campo === 'experiencia'), 'visible y vacío: se exige');
  assert.deepEqual(v({ modalidad: 'renovacion', tipo: 'poda' }).errores, [], 'con el ancestro de afuera oculto no se exige');
  const r = v({ modalidad: 'renovacion', tipo: 'poda', experiencia: '3' });
  assert.equal(r.datos.experiencia, undefined, 'y lo que llegue se descarta');
});

test('servidor · datos calculados (data-auxiliar) y cruzadas con un rol opcional vacío', () => {
  const e = esquemaDe(`
    <div class="campo" data-campo="paterno" data-requerido data-uso="Prueba."><label class="etiqueta" for="paterno">Paterno</label><input id="paterno" name="paterno"></div>
    <div class="campo" data-campo="materno" data-uso="Prueba."><label class="etiqueta" for="materno">Materno</label><input id="materno" name="materno"></div>
    <input type="hidden" data-campo="sin_materno" data-auxiliar>
    <div class="campo" data-campo="motivo" data-requerido data-si="sin_materno=si" data-uso="Prueba." data-cruzada="opcional" data-cruzada-campos="motivo=motivo materno=materno"><label class="etiqueta" for="motivo">Motivo</label><input id="motivo" name="motivo"></div>`);
  assert.equal(e.campos.sin_materno.tipo, 'auxiliar');
  const CFG = globalThis.FORMKIT_VALIDACIONES;
  const config = { ...CFG, cruzadas: { ...CFG.cruzadas, opcional: { campos: ['motivo', 'materno'], opcionales: ['materno'], valida: ({ motivo, materno }) => (!materno && motivo === 'no tengo' ? '' : 'Sin apellido materno, escribe «no tengo».') } } };
  const auxiliares = { sin_materno: (d) => (d.materno ? '' : 'si') };
  const v = (datos) => validaPayload({ datos, archivos: [], meta: META }, e, { config, auxiliares });
  assert.ok(v({ paterno: 'Tal' }).errores.some((x) => x.campo === 'motivo'), 'el servidor calcula el dato y su condición exige «motivo»');
  assert.deepEqual(v({ paterno: 'Tal', materno: 'Cual' }).errores, [], 'con materno, el dato calculado apaga la condición');
  assert.ok(v({ paterno: 'Tal', motivo: 'otro' }).errores.some((x) => x.campo === 'motivo' && /no tengo/.test(x.mensaje)), 'la cruzada corre con el rol opcional vacío');
  const bien = v({ paterno: 'Tal', motivo: 'no tengo' });
  assert.deepEqual(bien.errores, []);
  assert.equal(Object.hasOwn(bien.datos, 'sin_materno'), false, 'el dato calculado no se devuelve');
  assert.ok(v({ paterno: 'Tal', materno: 'Cual', sin_materno: 'si' }).errores.some((x) => x.campo === 'sin_materno'), 'el dato calculado no se acepta del navegador');
});

test('servidor · mínimo que depende de otra respuesta (data-min-segun) y paso decimal (P61, P40)', () => {
  const e = esquemaDe(`
    <div class="campo" data-campo="nivel" data-requerido data-uso="Prueba."><label class="etiqueta" for="nivel">Nivel</label><select id="nivel" name="nivel"><option value="">Elige</option><option value="basico">Básico</option><option value="avanzado">Avanzado</option></select></div>
    <div class="campo" data-campo="anios" data-formato="numero" data-requerido data-min-segun="experiencia" data-uso="Prueba."><label class="etiqueta" for="anios">Años</label><input id="anios" name="anios" min="0" step="0.5"></div>`);
  const limitesSegun = { experiencia: (d) => (d.nivel === 'avanzado' ? 5 : 2) };
  const v = (datos, op = { limitesSegun }) => validaPayload({ datos, archivos: [], meta: META }, e, op);
  assert.deepEqual(v({ nivel: 'basico', anios: '3' }).errores, [], 'básico: 3 años bastan');
  assert.ok(v({ nivel: 'avanzado', anios: '3' }).errores.some((x) => x.campo === 'anios' && /mínimo es 5/.test(x.mensaje)), 'avanzado: el mínimo es 5');
  assert.ok(v({ nivel: 'basico', anios: '2.3' }).errores.some((x) => x.campo === 'anios' && /múltiplos de 0.5/.test(x.mensaje)), 'el paso de 0.5 rechaza 2.3');
  assert.deepEqual(v({ nivel: 'basico', anios: '2.5' }).errores, [], 'y acepta 2.5');
  assert.ok(v({ nivel: 'avanzado', anios: '6' }, {}).senales.some((s) => /limitesSegun/.test(s)), 'sin la función, el servidor lo señala');
});

test('servidor · combo con el catálogo documentado {filas}, y mensajes de archivos en singular (P37, P39)', () => {
  const e = esquemaDe(`
    <div class="campo" data-campo="especie" data-requerido data-uso="Prueba."><label class="etiqueta" for="especie">Especie</label><div class="combo" data-combo data-catalogo="especies"><input id="especie" name="especie"><ul class="combo-lista" hidden></ul></div></div>
    <div class="campo" data-campo="retrato" data-requerido data-max="1" data-uso="Prueba."><span class="etiqueta">Fotografía de frente</span><div data-archivos><button type="button" class="zona-carga">Elegir</button><input type="file" hidden></div></div>`);
  const catalogos = { especies: { filas: ['Fresno', { nombre: 'Jacaranda' }], fuente: 'prueba', corte: '2026-10-16', es_ficticio: true } };
  const v = (datos, archivos = [{ campo: 'retrato', nombre: 'a.jpg', size: 10, sha256_original: 'a' }]) => validaPayload({ datos, archivos, meta: META }, e, { catalogos });
  assert.deepEqual(v({ especie: 'Jacaranda' }).errores, [], 'el objeto {filas} se acepta');
  assert.ok(v({ especie: 'Pino' }).errores.some((x) => x.campo === 'especie'), 'y sigue cerrado al catálogo');
  const dos = v({ especie: 'Fresno' }, [{ campo: 'retrato', nombre: 'a.jpg', size: 10, sha256_original: 'a' }, { campo: 'retrato', nombre: 'b.jpg', size: 10, sha256_original: 'b' }]);
  assert.ok(dos.errores.some((x) => /sólo se admite un archivo/.test(x.mensaje)), `singular cuando el máximo es 1: ${JSON.stringify(dos.errores)}`);
  assert.equal(globalThis.FORMKIT_VALIDACIONES.formatosArchivo(['jpg', 'jpeg', 'png']), 'JPEG, PNG', 'JPEG una sola vez');
});

test('CURP contra nombre y apellidos: letras, partículas, MARÍA y JOSÉ, Ñ, palabra altisonante y sin segundo apellido (P43)', () => {
  const V = globalThis.FORMKIT_VALIDACIONES;
  const nombre = (curp, n, primer) => V.cruzadas['curp-nombre'].valida({ curp, nombre: n, primer });
  const segundo = (curp, s) => V.cruzadas['curp-segundo-apellido'].valida({ curp, segundo: s });
  /* CURP ficticia completa, con su dígito verificador, para unos datos dados. */
  const curpDe = (datos, fecha = '1985-02-03', sexo = 'M') => { const c = `${V.prefijoCurp(datos, fecha, sexo, 'DF')}0`; return c + V.digitoCurp(`${c}0`); };
  assert.equal(nombre('PEGJ900515HDFRRN09', 'Juan', 'Pérez'), '', 'la CURP de prueba corresponde a Juan Pérez');
  assert.equal(segundo('PEGJ900515HDFRRN09', 'García'), '', 'y a García como segundo apellido');
  assert.match(nombre('PEGJ900515HDFRRN09', 'Pedro', 'Pérez'), /no corresponde/, 'otro nombre no corresponde');
  assert.match(segundo('PEGJ900515HDFRRN09', 'López'), /no corresponde/, 'otro segundo apellido no corresponde');
  assert.match(segundo('PEGJ900515HDFRRN09', ''), /segundo apellido/, 'sin segundo apellido, la CURP debe llevar X en 3 y 15');
  const maria = { nombre: 'María de los Ángeles', primer: 'de la Peña', segundo: '' };
  const c1 = curpDe(maria);
  assert.equal(c1.slice(0, 4) + c1.slice(13, 16), 'PEXAXXN', `partículas fuera, MARÍA se salta, la Ñ cuenta como X: ${c1}`);
  assert.equal(V.formatos.curp.valida(c1), '', 'la CURP armada es válida por sí misma');
  assert.equal(nombre(c1, maria.nombre, maria.primer) + segundo(c1, ''), '', 'una sola persona con un apellido pasa');
  const yolanda = { nombre: 'Yolanda', primer: 'Buendía', segundo: 'Espinoza' };
  const c2 = curpDe(yolanda);
  assert.equal(c2.slice(0, 4), 'BXEY', 'la palabra altisonante cambia su segunda letra por X');
  assert.equal(nombre(c2, yolanda.nombre, yolanda.primer) + segundo(c2, yolanda.segundo), '', 'y la cruzada la reconoce');
  /* En el servidor, con el esquema de la plantilla de una página. */
  const e = esquema('una-pagina');
  const con = (datos) => validaPayload({ ...structuredClone(REGISTRO), datos: { ...REGISTRO.datos, ...datos } }, e, { catalogos: CAT });
  assert.deepEqual(con({}).errores, [], 'el registro coherente se acepta');
  assert.ok(con({ nombre: 'Pedro' }).errores.some((x) => x.campo === 'curp' && /no corresponde/.test(x.mensaje)), 'el servidor rechaza un nombre que no corresponde');
  assert.ok(con({ apellido_materno: '' }).errores.some((x) => x.campo === 'curp' && /segundo apellido/.test(x.mensaje)), 'y un segundo apellido que falta');
});

const herramienta = (nombre, args) => test(`herramientas · ${nombre}`, () => {
  const r = spawnSync(process.execPath, args, { cwd: RAIZ, encoding: 'utf8' });
  assert.equal(r.status, 0, (r.stdout + r.stderr).split('\n').slice(-30).join('\n'));
});
herramienta('auditor de CSS en verde', ['herramientas/auditor-css.mjs']);
herramienta('contraste de todos los pares', ['herramientas/contraste.mjs']);
herramienta('auditoría de campos (uso, finalidad, autocomplete, sensible, inputmode, ayudas sin repetir)', ['herramientas/auditar-campos.mjs']);

test('auditoría de campos · el «?» que repite la ayuda visible y la misma ayuda en campos seguidos (S2-4, S2-1)', () => {
  const archivo = join(TEMPORAL, `prueba-${++cuentaTemporal}.html`);
  writeFileSync(archivo, [
    '<div class="campo" data-campo="a" data-uso="x."><label class="etiqueta" for="a">A <span class="tooltip" data-tooltip><button type="button" aria-label="Ayuda">?</button><span class="tooltip-texto" role="tooltip" hidden>Son 18 caracteres, como en tu acta.</span></span></label><p class="ayuda">Son 18 caracteres, como aparecen en tu acta.</p><input class="control" id="a" name="a"></div>',
    '<div class="campo" data-campo="b" data-uso="x."><label class="etiqueta" for="b">B</label><p class="ayuda">Escríbelo como aparece en tu identificación.</p><input class="control" id="b" name="b"></div>',
    '<div class="campo" data-campo="c" data-uso="x."><label class="etiqueta" for="c">C</label><p class="ayuda">Escríbelo como aparece en tu identificación.</p><input class="control" id="c" name="c"></div>',
    '<div class="campo" data-campo="d" data-uso="x."><label class="etiqueta" for="d">D <span class="tooltip" data-tooltip><button type="button" aria-label="Ayuda">?</button><span class="tooltip-texto" role="tooltip" hidden>Está en la esquina superior de tu acuse.</span></span></label><p class="ayuda">Letras y números, sin espacios.</p><input class="control" id="d" name="d"></div>'
  ].join('\n'));
  const r = spawnSync(process.execPath, [resolve(RAIZ, 'herramientas/auditar-campos.mjs'), archivo], { encoding: 'utf8' });
  assert.equal(r.status, 1, 'sale con 1');
  assert.match(r.stderr, /D5 .*«a»/, 'el «?» de «a» repite su ayuda');
  assert.match(r.stderr, /D6 .*«c».*«b»/, '«c» repite la ayuda de «b»');
  assert.doesNotMatch(r.stderr, /«d»/, 'un «?» que dice algo nuevo pasa');
});
herramienta('bibliotecas coinciden con el manifiesto', ['herramientas/vendor.mjs', '--verificar']);
herramienta('documentos generados al día', ['herramientas/generar-reglas.mjs', '--comprobar']);

test('manifiesto · archivos existentes, dependencias reales y niveles admitidos', () => {
  const m = JSON.parse(readFileSync(resolve(RAIZ, 'codigo/manifiesto.json'), 'utf8'));
  for (const a of m.nucleo.archivos) assert.ok(existsSync(resolve(RAIZ, a)), a);
  const nombres = new Set(m.modulos.map((x) => x.nombre));
  for (const mod of m.modulos) {
    assert.ok(['BASE', 'RECOMENDADO', 'OPCIONAL'].includes(mod.nivel), `${mod.nombre}: nivel`);
    for (const a of Object.values(mod.archivos)) if (a) assert.ok(existsSync(resolve(RAIZ, a)), a);
    for (const d of mod.dependencias) assert.ok(nombres.has(d), `${mod.nombre} depende de ${d}`);
    for (const k of ['titulo', 'proposito', 'cuando', 'cuandoNo', 'accesibilidad', 'movil', 'escritorio']) assert.ok(mod[k], `${mod.nombre}: falta ${k}`);
    assert.ok(mod.errores.length >= 2, `${mod.nombre}: errores frecuentes`);
  }
  const carpetas = readdirSync(resolve(RAIZ, 'codigo/modulos'));
  assert.deepEqual(carpetas.filter((c) => !nombres.has(c)), [], 'toda carpeta de módulo está en el manifiesto');
});

test('tipografías · cada familia autoalojada trae su licencia y los pesos declarados', () => {
  const dir = resolve(RAIZ, 'codigo/fuentes');
  const archivos = readdirSync(dir);
  assert.ok(archivos.some((f) => /^LICEN|OFL|LICENSE/i.test(f)) || existsSync(resolve(dir, 'LEEME.md')), 'hay licencia o LEEME con la licencia');
  const tokens = readFileSync(resolve(RAIZ, 'codigo/css/tokens.css'), 'utf8');
  for (const m of tokens.matchAll(/url\('\.\.\/fuentes\/([\w-]+\.woff2)'\)/g)) assert.ok(archivos.includes(m[1]), `falta ${m[1]}`);
});

test('reglas · cada regla FRM citada en el paquete existe en reglas/reglas.json (las citas «A FRM-xx» y «B FRM-xx» son del origen)', () => {
  const ids = new Set(JSON.parse(readFileSync(resolve(RAIZ, 'reglas/reglas.json'), 'utf8')).reglas.map((r) => r.id));
  const huerfanas = [];
  const recorre = (dir) => { for (const n of readdirSync(dir, { withFileTypes: true })) { if (['node_modules', 'verificacion', '_humo', 'dist', '_to_delete'].includes(n.name)) continue; const ruta = resolve(dir, n.name); if (n.isDirectory()) recorre(ruta); else if (/\.(css|js|mjs|html|md|json)$/.test(n.name) && n.name !== 'reglas.json' && n.name !== 'artefacto.html') for (const m of readFileSync(ruta, 'utf8').matchAll(/(?<![AB] )FRM-(\d{2})/g)) if (!ids.has(`FRM-${m[1]}`)) huerfanas.push(`${ruta.replace(RAIZ + '/', '')}: FRM-${m[1]}`); } };
  recorre(RAIZ);
  assert.deepEqual([...new Set(huerfanas)], []);
});
