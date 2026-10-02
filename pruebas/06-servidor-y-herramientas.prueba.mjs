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
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { RAIZ } from './ayudas.mjs';

const { validaPayload } = await import(resolve(RAIZ, 'codigo/servidor/validar.mjs'));
await import(resolve(RAIZ, 'codigo/catalogos/cdmx-ejemplo.js'));
const CAT = { cdmx: globalThis.FORMKIT_CATALOGOS.cdmx.filas, alcaldias: globalThis.FORMKIT_CATALOGOS.alcaldias };
const esquema = (n) => JSON.parse(execFileSync(process.execPath, [resolve(RAIZ, 'herramientas/esquema-desde-html.mjs'), resolve(RAIZ, `codigo/plantillas/${n}.html`)], { encoding: 'utf8' }));

const BUENO = {
  datos: { tipo: 'otro', tipo_otro: 'Una situación no prevista', urgente: 'no', fecha_hechos: '2026-01-10', descripcion: 'El árbol frente a la escuela tiene una grieta grande en el tronco desde hace dos semanas.', alcaldia: 'Coyoacán', colonia: 'Villa de Prueba', cp: '04010', calle: 'Calle de Prueba 1', contacto: 'si', nombre: 'Fulana de Tal', correo: 'Fulana@Ejemplo.local ', telefono: '+52 55 0000 0000', aviso: 'si', humano: 'si' },
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
  const base = { datos: { nombre: 'Fulana', apellidos: 'de Tal', curp: 'pegj900515hdfrrn09', correo: 'a@ejemplo.local', correo2: 'a@ejemplo.local', aviso: 'si' }, archivos: [], meta: {} };
  const r1 = validaPayload(structuredClone(base), e, { catalogos: CAT });
  assert.equal(r1.datos.curp, 'PEGJ900515HDFRRN09');
  assert.ok(!r1.errores.some((x) => x.campo === 'curp'), JSON.stringify(r1.errores));
  const r2 = validaPayload({ ...structuredClone(base), datos: { ...base.datos, curp: 'PEGJ900515HDFRRN0' } }, e, { catalogos: CAT });
  assert.ok(r2.errores.some((x) => x.campo === 'curp' && /18/.test(x.mensaje)), 'la CURP corta se rechaza en el servidor');
  const r3 = validaPayload({ ...structuredClone(base), datos: { ...base.datos, correo2: 'otro@ejemplo.local' } }, e, { catalogos: CAT });
  assert.ok(r3.errores.some((x) => x.campo === 'correo2'), 'la confirmación distinta se rechaza');
});

const herramienta = (nombre, args) => test(`herramientas · ${nombre}`, () => {
  const r = spawnSync(process.execPath, args, { cwd: RAIZ, encoding: 'utf8' });
  assert.equal(r.status, 0, (r.stdout + r.stderr).split('\n').slice(-30).join('\n'));
});
herramienta('auditor de CSS en verde', ['herramientas/auditor-css.mjs']);
herramienta('contraste de todos los pares', ['herramientas/contraste.mjs']);
herramienta('auditoría de campos (uso, finalidad, autocomplete, sensible, inputmode)', ['herramientas/auditar-campos.mjs']);
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
