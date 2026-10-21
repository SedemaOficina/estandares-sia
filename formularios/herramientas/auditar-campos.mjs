#!/usr/bin/env node
/* =========================================================
   auditar-campos.mjs · Minimización y autocompletado, campo por campo

   Recorre el HTML de las plantillas, los ejemplos y las muestras de la guía
   y exige, por cada [data-campo]:
     D1 · data-uso: para qué se pide (sin uso declarado, el dato no se pide).
     D2 · si es dato personal (data-finalidad), su control declara autocomplete
          (el valor que corresponde para quien llena; «off» para terceros) y,
          si es «off», un comentario HTML en el mismo bloque dice el motivo.
     D3 · si es dato personal de identidad o contacto (formato nombre, correo,
          telefono, curp, rfc, cp o autocomplete de identidad) y no está en
          borrador excluido, debe llevar data-sensible, salvo que un comentario
          lo justifique (texto «no sensible:»).
     D4 · el control principal lleva inputmode cuando el formato lo define
          (numeric, tel, email, decimal) o el type ya lo aporta.
     D5 · el icono de ayuda («?», .tooltip-texto) no repite la ayuda visible
          del mismo campo: si la ayuda visible basta, no lleva icono.
     D6 · dos campos seguidos no repiten la misma ayuda: si vale para toda
          la sección, va una vez como ayuda de bloque (.ayuda-bloque).
     D7 · una casilla de consentimiento (aviso de privacidad, «acepto») o de
          «No soy un programa automático» lleva data-sin-borrador: se contesta
          en cada visita y no vuelve marcada desde el borrador.
   Uso: node herramientas/auditar-campos.mjs [archivo.html …]
        (sin argumentos revisa codigo/plantillas, guia-visual/ejemplos y guia-visual/index.html)
   Sale con 1 si hay hallazgos. No modifica nada.
   ========================================================= */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const TYPES_CON_TECLADO = { email: 'email', tel: 'tel', number: 'numeric', date: '', time: '', url: 'url', search: '' };
const INPUTMODE_POR_FORMATO = { cp: 'numeric', telefono: 'tel', correo: 'email', numero: 'decimal', coordenadas: 'decimal', fecha: '', 'fecha-dma': 'numeric', hora: '' };
const IDENTIDAD = /^(nombre|correo|telefono|curp|rfc)$/;
const AUTOCOMPLETE_IDENTIDAD = /^(name|given-name|family-name|additional-name|email|tel|tel-national|street-address|address-line\d|postal-code|bday|sex|username)$/;

const argumentos = process.argv.slice(2);
const archivos = argumentos.length ? argumentos.map((a) => resolve(a)) : [
  ...readdirSync(resolve(RAIZ, 'codigo/plantillas')).filter((f) => f.endsWith('.html')).map((f) => resolve(RAIZ, 'codigo/plantillas', f)),
  ...readdirSync(resolve(RAIZ, 'guia-visual/ejemplos')).filter((f) => f.endsWith('.html')).map((f) => resolve(RAIZ, 'guia-visual/ejemplos', f)),
  resolve(RAIZ, 'guia-visual/index.html')
].filter(existsSync);

const atributos = (tag) => { const a = {}; for (const m of tag.matchAll(/\s([a-zA-Z][\w-]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g)) a[m[1]] = m[2] ?? m[3] ?? m[4] ?? ''; return a; };
const hallazgos = [];
let campos = 0;

/* Texto comparable: sin etiquetas, acentos, signos ni mayúsculas. */
const plano = (t) => t.replace(/<[^>]+>/g, ' ').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9ñ]+/g, ' ').trim();
const textoDe = (bloque, re) => { const m = bloque.match(re); return m ? plano(m[1]) : ''; };
const AYUDA = /<p class="ayuda"[^>]*>([\s\S]*?)<\/p>/;
const TOOLTIP = /<span class="tooltip-texto"[^>]*>([\s\S]*?)<\/span>/;
/* Dos textos dicen lo mismo si uno contiene al otro o si comparten la mayoría de sus palabras con contenido. */
function repite(a, b) {
  if (!a || !b) return false;
  if (a === b || a.includes(b) || b.includes(a)) return true;
  const pal = (t) => new Set(t.split(' ').filter((w) => w.length > 3));
  const A = pal(a), B = pal(b);
  const comunes = [...A].filter((w) => B.has(w)).length;
  return comunes / Math.min(A.size, B.size || 1) >= 0.6 && Math.min(A.size, B.size) >= 3;
}

for (const ruta of archivos) {
  const html = readFileSync(ruta, 'utf8');
  const rel = relative(RAIZ, ruta);
  const re = /<(\w+)([^>]*\sdata-campo="([^"]+)"[^>]*)>/g;
  const posiciones = [];
  let m;
  while ((m = re.exec(html))) posiciones.push({ attrs: atributos(m[2]), nombre: m[3], inicio: m.index, fin: m.index + m[0].length, linea: html.slice(0, m.index).split('\n').length });
  posiciones.forEach((p, i) => {
    campos++;
    const hasta = posiciones[i + 1] ? posiciones[i + 1].inicio : html.length;
    const bloque = html.slice(p.fin, hasta);
    const d = p.attrs;
    const falla = (regla, texto) => hallazgos.push(`${regla} ${rel}:${p.linea} «${p.nombre}»: ${texto}`);
    if (d['data-uso'] === undefined || !d['data-uso'].trim()) falla('D1', 'no declara data-uso (para qué se pide el dato)');
    const controles = [...bloque.matchAll(/<(input|select|textarea)([^>]*)>/g)].map((c) => ({ tag: c[1], a: atributos(c[2]) })).filter((c) => c.a.type !== 'hidden');
    const principal = controles[0];
    const personal = d['data-finalidad'] !== undefined;
    if (personal && principal) {
      const ac = principal.a.autocomplete;
      if (ac === undefined) falla('D2', 'dato personal sin autocomplete en su control (el que corresponda, u «off» con motivo)');
      else if (ac === 'off' && !/<!--[^>]*(tercer|autocomplete off|sin autocompletar|motivo)[^>]*-->/i.test(bloque) && !/<!--[^>]*(tercer|autocomplete off|motivo)[^>]*-->/i.test(html.slice(Math.max(0, p.inicio - 300), p.inicio))) falla('D2', 'autocomplete="off" en un dato personal sin comentario que diga el motivo (p. ej. datos de terceros)');
    }
    const esIdentidad = IDENTIDAD.test(d['data-formato'] || '') || (principal && AUTOCOMPLETE_IDENTIDAD.test(principal.a.autocomplete || ''));
    if (personal && esIdentidad && d['data-sensible'] === undefined && !/<!--[^>]*no sensible:[^>]*-->/i.test(bloque) && !/<!--[^>]*no sensible:[^>]*-->/i.test(html.slice(Math.max(0, p.inicio - 300), p.inicio))) falla('D3', 'dato personal de identidad o contacto sin data-sensible (quedaría en el borrador local); si es deliberado, comentario «no sensible: motivo»');
    /* Un dato de identidad es personal aunque el campo no lo declare: sin data-finalidad no entra en el inventario del aviso de privacidad. */
    if (!personal && esIdentidad && !/<!--[^>]*no personal:[^>]*-->/i.test(bloque) && !/<!--[^>]*no personal:[^>]*-->/i.test(html.slice(Math.max(0, p.inicio - 300), p.inicio))) falla('D3', 'dato de identidad o contacto sin data-finalidad: no entraría en el inventario del aviso de privacidad; si no es de una persona, comentario «no personal: motivo»');
    if ((d['data-formato'] === 'contrasena' || (principal && principal.a.type === 'password')) && d['data-sensible'] === undefined) falla('D3', 'contraseña sin data-sensible: el núcleo la deja fuera del borrador, pero el HTML debe declararlo');
    const esperado = INPUTMODE_POR_FORMATO[d['data-formato']];
    if (principal && principal.tag === 'input' && esperado && principal.a.inputmode === undefined && TYPES_CON_TECLADO[principal.a.type] !== esperado && !principal.a.readonly) falla('D4', `formato ${d['data-formato']} sin inputmode="${esperado}" (teclado adecuado en el teléfono)`);
    p.ayuda = textoDe(bloque, AYUDA);
    if (repite(p.ayuda, textoDe(bloque, TOOLTIP))) falla('D5', 'el icono de ayuda («?») repite la ayuda visible; si la ayuda visible basta, quita el icono');
    /* Consentimiento y comprobación de persona: se contestan en cada visita, no vuelven del borrador. */
    /* Se lee sólo la etiqueta de la casilla (.casilla): el bloque del último campo llega hasta el final del archivo. */
    const casilla = (bloque.match(/<label[^>]*class="casilla"[^>]*>[\s\S]*?<\/label>/) || [''])[0];
    if (/type="checkbox"/.test(casilla) && /aviso de privacidad|acepto|consiento|autorizo|no soy un programa/i.test(casilla.replace(/<[^>]+>/g, ' ')) && d['data-sin-borrador'] === undefined) falla('D7', 'casilla de consentimiento o de «No soy un programa automático» sin data-sin-borrador: volvería marcada desde el borrador');
    const previo = posiciones[i - 1];
    if (previo && p.ayuda && previo.ayuda === p.ayuda) falla('D6', `repite la ayuda de «${previo.nombre}»; si vale para toda la sección, ponla una vez como ayuda de bloque (.ayuda-bloque)`);
  });
}

if (hallazgos.length) { console.error(hallazgos.join('\n')); console.error(`\nFALLA · ${hallazgos.length} hallazgo(s) en ${campos} campos de ${archivos.length} archivo(s)`); process.exit(1); }
console.log(`CORRECTO · ${campos} campos en ${archivos.length} archivo(s): todos declaran uso; los personales, autocompletado y sensibilidad; los formatos, su teclado; ninguna ayuda se repite; los consentimientos no vuelven del borrador`);
