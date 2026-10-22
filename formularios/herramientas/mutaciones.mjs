#!/usr/bin/env node
/* =========================================================
   mutaciones.mjs · ¿Las pruebas protegen lo que dicen?

   Una prueba que pasa con el código bueno no basta: también debe fallar si
   alguien rompe lo que protege. Esta orden rompe a propósito, una por una,
   correcciones conocidas (cada «mutación» deshace una corrección o una regla)
   en una COPIA del paquete, corre la prueba que la protege y exige que falle.
   Las seis primeras son las que la auditoría del 19 oct 2026 encontró en verde
   (A1-12); las demás, las del bloque 6.

   Antes corre las mismas pruebas sin mutar: deben pasar (si no, el resultado
   no diría nada). No toca el paquete: la copia vive en la carpeta temporal y
   se reutiliza en cada corrida.

   Uso: node herramientas/mutaciones.mjs        (npm run mutaciones; en cada versión)
   Sale con 1 si una mutación sigue en verde.
   ========================================================= */
import { spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const P06 = 'pruebas/06-servidor-y-herramientas.prueba.mjs', P07 = 'pruebas/07-correcciones.prueba.mjs', P08 = 'pruebas/08-auditoria.prueba.mjs', P04 = 'pruebas/04-modulos.prueba.mjs';

/* Cada mutación: qué rompe, en qué archivo, el texto exacto que cambia y la prueba (archivo y nombre) que debe fallar. */
export const MUTACIONES = [
  { id: 'P38', que: 'El servidor exige sólo la condición más cercana de un campo, no las de sus ancestros', archivo: 'codigo/servidor/validar.mjs', de: 'const activoDef = (c) => (c.condiciones || [c.si, c.siPadre].filter(Boolean)).every(cumple) && modoCascada(c);', a: 'const activoDef = (c) => [c.si].filter(Boolean).every(cumple) && modoCascada(c);', prueba: [P06, '\\(P38\\)'] },
  { id: 'P37', que: 'La lista con búsqueda ofrece dos veces un nombre repetido del catálogo', archivo: 'codigo/modulos/combo/combo.js', de: '.filter((o) => o && o.nombre && !vistos.has(o.nombre) && vistos.add(o.nombre));', a: '.filter((o) => o && o.nombre);', prueba: [P08, 'A1-12, P37'] },
  { id: 'P41', que: 'Por pasos, el rechazo del servidor ya no abre el paso con el error', archivo: 'codigo/modulos/pasos/pasos.js', de: 'FormKit.ganchos.erroresServidor = (f, fallos) => {', a: 'FormKit.ganchos.erroresServidor = (f, fallos) => { return false;', prueba: [P08, 'A1-12, P41'] },
  { id: 'P96', que: 'El visor sólo encuentra pdf.js si el estándar está en codigo/ o dist/', archivo: 'codigo/modulos/visor/visor.js', de: "const PDFJS_JUNTO = raiz ? new URL('../vendor/pdfjs-dist/', raiz[1]).href : '';", a: "const PDFJS_JUNTO = raiz && /\\/(codigo|dist)\\/$/.test(raiz[1]) ? new URL('../vendor/pdfjs-dist/', raiz[1]).href : '';", prueba: [P08, 'A1-12, P96'] },
  { id: 'P127', que: 'La foto recodificada sólo se usa si pesa menos (la que pesa más viaja sin recodificar)', archivo: 'codigo/modulos/archivos/archivos.js', de: 'if (opt && (opt.blob.size < f.size || !c.conservarExif)) {', a: 'if (opt && opt.blob.size < f.size) {', prueba: [P07, '\\(P127\\)'] },
  { id: 'P134', que: 'Un dato de la línea de datos se puede partir en dos renglones', archivo: 'codigo/css/base.css', de: '.linea-datos-item{white-space:nowrap}', a: '', prueba: [P07, '\\(P134\\)'] },
  { id: 'D1-05', que: 'El catálogo trae una fila sin colonia y un código postal de 4 dígitos', archivo: 'codigo/catalogos/cdmx-ejemplo.js', de: "{ alcaldia: 'Álvaro Obregón', colonia: 'Colonia de Prueba Uno', cp: '01000' }", a: "{ alcaldia: 'Álvaro Obregón', colonia: '', cp: '1400' }", prueba: [P06, 'D1-05'] },
  { id: 'G2-01', que: 'Un rodeo de Leaflet pierde su clave en el código', archivo: 'codigo/modulos/mapa/mapa.js', de: 'iniciado oculto calcula mal el encuadre (RODEO-01). */', a: 'iniciado oculto calcula mal el encuadre. */', prueba: [P06, 'G2-01'] },
  { id: 'A5-01', que: 'Dos muestras de la guía repiten un id', archivo: 'guia-visual/index.html', de: 'id="n_correo_contacto"', a: 'id="n_correo2"', prueba: [P06, 'A5-01'] },
  { id: 'A1-14 servidor', que: 'El servidor deja de revisar como texto legible un <input data-legible>', archivo: 'codigo/servidor/validar.mjs', de: "c.tipo === 'textarea' || c.atributos?.legible ? 'texto' : ''", a: "c.tipo === 'textarea' ? 'texto' : ''", prueba: [P06, 'A1-14'] },
  { id: 'A1-14 navegador', que: 'El navegador deja de revisar el largo máximo de un texto sin formato', archivo: 'codigo/js/formkit.core.js', de: 'if (a.maxlength && largo > Number(a.maxlength)) return', a: 'if (false) return', prueba: [P08, 'A1-14'] },
  { id: 'F2-13', que: 'La confirmación deja de avisar cuando el botón dice «Aceptar»', archivo: 'codigo/modulos/modal/modal.js', de: 'if (!cfg.si || /^(aceptar|confirmar|s[ií]|ok|de acuerdo|continuar|listo)$/i.test(String(cfg.si).trim()))', a: 'if (!cfg.si)', prueba: [P08, 'F2-13'] },
  { id: 'F5-01', que: 'El árbol de la guía deja de agregar el acuse', archivo: 'guia-visual/guia.js', de: 'const conAcuse = !form.elements.interna.checked || form.elements.pasos.checked;', a: 'const conAcuse = form.elements.pasos.checked;', prueba: [P08, 'F5-01'] },
  { id: 'D3-01', que: 'El catálogo de ejemplo deja de avisar en una página publicada', archivo: 'codigo/js/formkit.core.js', de: 'ficticiosAvisados.add(nombre);', a: 'ficticiosAvisados.add(nombre); return;', prueba: [P08, 'D3-01'] },
  { id: 'B9-01', que: 'Un ejemplo vuelve a llevar un guion escrito en la página', archivo: 'guia-visual/ejemplos/encuesta.html', de: '<script src="encuesta-config.js"></script>', a: '<script>window.FORMKIT_CONFIG = {};</script>\n<script src="encuesta-config.js"></script>', prueba: [P08, 'B9-01'] },
  { id: 'paginación', que: 'La captura interna repite la primera página en la segunda', archivo: 'guia-visual/ejemplos/captura-interna.js', de: 'const pag = lista.slice((pagina - 1) * tam, pagina * tam);', a: 'const pag = lista.slice(0, tam);', prueba: [P04, 'paginación: cambia de página'] }
];

/* Copia sin node_modules (se enlaza): fs.cpSync hace caer a Node en Windows con rutas con acentos. */
function copia(origen, destino) {
  mkdirSync(destino, { recursive: true });
  for (const e of readdirSync(origen, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name === 'verificacion') continue;
    const de = join(origen, e.name), a = join(destino, e.name);
    if (e.isDirectory()) copia(de, a); else copyFileSync(de, a);
  }
}

const esPrincipal = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (esPrincipal) {
  const comun = join(tmpdir(), 'formkit-mutaciones');
  const F = join(comun, 'formularios');
  copia(RAIZ, F);
  if (existsSync(resolve(RAIZ, '../guia-visual'))) copia(resolve(RAIZ, '../guia-visual'), join(comun, 'guia-visual'));
  if (!existsSync(join(F, 'node_modules'))) symlinkSync(resolve(RAIZ, 'node_modules'), join(F, 'node_modules'), process.platform === 'win32' ? 'junction' : 'dir');
  console.log(`Copia de trabajo: ${comun}\n`);

  /* «verde», «roja» o «colgada». Una prueba que deja algo abierto al fallar (un servidor, por ejemplo) no
     terminaría nunca: --test-force-exit la cierra al acabar y el límite de tiempo la corta si aun así se queda. */
  const LIMITE_MS = 5 * 60 * 1000;
  const corre = (pruebas) => {
    const porArchivo = new Map();
    for (const [archivo, patron] of pruebas) porArchivo.set(archivo, [...(porArchivo.get(archivo) || []), patron]);
    let estado = 'verde';
    for (const [archivo, patrones] of porArchivo) {
      const r = spawnSync(process.execPath, ['--test', '--test-concurrency=1', '--test-force-exit', ...patrones.map((x) => `--test-name-pattern=${x}`), archivo], { cwd: F, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, timeout: LIMITE_MS, killSignal: 'SIGKILL' });
      if (r.error && r.error.code === 'ETIMEDOUT') return 'colgada';
      const pasan = Number((/(?:#|ℹ) pass (\d+)/.exec(r.stdout) || [])[1] || 0);
      if (r.status !== 0 || !pasan) estado = 'roja';
    }
    return estado;
  };

  /* Control: sin mutar, todas las pruebas usadas pasan. */
  const inicio = Date.now();
  const control = corre(MUTACIONES.map((m) => m.prueba));
  if (control !== 'verde') { console.log(`FALLA · sin mutar, alguna de estas pruebas ${control === 'colgada' ? 'no termina' : 'no pasa'}: primero hay que dejarlas en verde (npm run verificar).`); process.exit(1); }
  console.log(`Control sin mutar: en verde (${((Date.now() - inicio) / 1000).toFixed(0)} s)\n`);

  const verdes = [], colgadas = [];
  for (const m of MUTACIONES) {
    const ruta = join(F, m.archivo);
    const original = readFileSync(ruta, 'utf8');
    if (original.split(m.de).length !== 2) { console.log(`✗ ${m.id}: el texto que muta ya no está igual en ${m.archivo}; actualiza la mutación`); verdes.push(m.id); continue; }
    writeFileSync(ruta, original.split(m.de).join(m.a));
    const t = Date.now();
    let estado;
    try { estado = corre([m.prueba]); } finally { writeFileSync(ruta, original); }
    const dice = { verde: 'SIGUE EN VERDE, la prueba no la detecta', roja: 'la prueba la detecta', colgada: `la prueba no terminó en ${LIMITE_MS / 60000} min: falla sin cerrar lo que abrió` }[estado];
    console.log(`${estado === 'roja' ? '✓' : '✗'} ${m.id} · ${m.que}: ${dice} (${((Date.now() - t) / 1000).toFixed(0)} s)`);
    if (estado === 'verde') verdes.push(m.id);
    if (estado === 'colgada') colgadas.push(m.id);
  }
  const fallas = [verdes.length && `${verdes.length} mutación(es) que ninguna prueba detecta: ${verdes.join(', ')}`, colgadas.length && `${colgadas.length} prueba(s) que se cuelgan al fallar: ${colgadas.join(', ')}`].filter(Boolean);
  console.log(`\n${fallas.length ? `FALLA · ${fallas.join(' · ')}` : `CORRECTO · ${MUTACIONES.length} mutaciones, todas detectadas por su prueba`}`);
  process.exit(fallas.length ? 1 : 0);
}
