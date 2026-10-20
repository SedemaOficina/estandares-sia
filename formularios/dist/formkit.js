/* GENERADO: configuración + iconos + núcleo + todos los módulos. */
/* ===== codigo/js/validaciones.config.js ===== */
/* =========================================================
   validaciones.config.js · Estándar de formularios del SIA (SEDEMA)

   ÚNICO lugar donde viven los patrones, las longitudes, los límites, los
   mensajes y las validaciones cruzadas. formkit.core.js los lee en el
   navegador; codigo/servidor/validar.mjs los lee en Node para la segunda
   validación obligatoria. Así el navegador y el servidor no pueden decir
   cosas distintas (FRM-11).

   Reglas de redacción de cada validador:
     · normaliza(v) devuelve el dato limpio que se valida Y se conserva;
     · valida(v, a) recibe el dato ya normalizado y los atributos del campo
       (min, max, step, minlength, maxlength…) y devuelve '' o el mensaje;
     · el mensaje dice qué pasó y qué hacer, con ejemplo cuando ayuda;
     · se rechaza sólo lo inválido con certeza (FRM-26): una validación
       estricta excluye a personas reales.

   Es un script sin dependencias que expone la configuración como global
   (globalThis.FORMKIT_VALIDACIONES) en el navegador y en Node, y además
   como módulo CommonJS cuando se carga con require.
   ========================================================= */
(function (raiz, fabrica) {
  const cfg = fabrica();
  if (typeof module === 'object' && module.exports) module.exports = cfg;
  raiz.FORMKIT_VALIDACIONES = cfg;
}(typeof globalThis !== 'undefined' ? globalThis : (typeof self !== 'undefined' ? self : this), function () {
  'use strict';

  /* ---------- Utilidades compartidas ---------- */
  const recorta = (v) => String(v ?? '').replace(/\s+/g, ' ').trim();
  const soloDigitos = (v) => String(v ?? '').replace(/\D/g, '');
  /* Formatos de archivo para leerlos: en mayúsculas y sin repetir JPEG (jpg y jpeg son el mismo). */
  const formatosArchivo = (exts) => [...new Set((exts || []).map((e) => String(e).trim().toUpperCase()).map((e) => (e === 'JPG' ? 'JPEG' : e)))].join(', ');
  const sinAcentos = (v) => String(v ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '');
  /* La Ñ es letra, no acento: el RFC la admite y no se cambia por N. */
  const sinAcentosSalvoEnie = (v) => [...String(v ?? '').normalize('NFC')].map((c) => (c === 'Ñ' || c === 'ñ' ? c : sinAcentos(c))).join('');
  const esFechaReal = (a, m, d) => { const f = new Date(Date.UTC(a, m - 1, d)); return f.getUTCFullYear() === a && f.getUTCMonth() === m - 1 && f.getUTCDate() === d; };

  /* Fecha escrita como día/mes/año (formato «fecha-dma»): 23/07/1985,
     23-07-1985, 23.07.1985, 23 07 1985 o 23071985; también AAAA-MM-DD, que es
     lo que pone el autocompletado del navegador. Una fecha escrita no pasa de
     20 caracteres, y el separador no se traslapa con los espacios de alrededor:
     un texto largo no frena la página ni el servidor. */
  function partesDma(v) {
    const t = String(v || '').trim();
    if (t.length > 20) return null;
    let m = t.match(/^(\d{1,2})(?:\s*[/.\-]\s*|\s+)(\d{1,2})(?:\s*[/.\-]\s*|\s+)(\d{4})$/) || t.match(/^(\d{2})(\d{2})(\d{4})$/);
    if (m) return { d: Number(m[1]), m: Number(m[2]), a: Number(m[3]) };
    m = t.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    return m ? { d: Number(m[3]), m: Number(m[2]), a: Number(m[1]) } : null;
  }
  const dosCifras = (n) => String(n).padStart(2, '0');
  /* Número con comas de miles: 1,500 · 12,345 · 1,234.50. */
  const CON_MILES = /^-?\d{1,3}(,\d{3})+(\.\d+)?$/;
  /* «23/07/1985» → «1985-07-23»; '' si no es una fecha real. */
  const isoDeDma = (v) => { const p = partesDma(v); return p && esFechaReal(p.a, p.m, p.d) ? `${p.a}-${dosCifras(p.m)}-${dosCifras(p.d)}` : ''; };
  /* «1985-07-23» → «23/07/1985». */
  const dmaDeIso = (iso) => { const m = String(iso || '').match(/^(\d{4})-(\d{2})-(\d{2})$/); return m ? `${m[3]}/${m[2]}/${m[1]}` : ''; };
  /* Escritura guiada, sin calendario: al completar el día pasa al mes y al
     completar el mes pasa al año, poniendo las diagonales. Un primer dígito
     que no puede empezar un día de dos cifras (4 a 9) o un mes (2 a 9) se
     completa con cero: «4» → «04/». Una diagonal, punto, guion o espacio tras
     un solo dígito también lo cierra: «3/» → «03/». */
  function guiaFechaDma(texto) {
    const seg = ['', '', ''];
    const cerrado = [false, false];
    let i = 0;
    for (const c of String(texto)) {
      if (/\d/.test(c)) {
        if (i < 2 && cerrado[i]) i++;
        if (i === 2) { if (seg[2].length < 4) seg[2] += c; continue; }
        seg[i] += c;
        if (seg[i].length === 1 && Number(c) > (i === 0 ? 3 : 1)) seg[i] = `0${c}`;
        if (seg[i].length === 2) cerrado[i] = true;
      } else if (/[/.\- ]/.test(c) && i < 2 && seg[i].length === 1) {
        seg[i] = `0${seg[i]}`; cerrado[i] = true;
      }
    }
    return seg[0] + (cerrado[0] ? '/' : '') + seg[1] + (cerrado[1] ? '/' : '') + seg[2];
  }
  const hoyISO = () => {
    /* La fecha de «hoy» se toma en la zona horaria de la Ciudad de México,
       no en la del dispositivo: una persona que captura desde otro huso no
       debe ver una fecha distinta a la del acuse. */
    const p = new Intl.DateTimeFormat('en-CA', { timeZone: CONFIG.fechas.zonaHoraria, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
    const g = (t) => p.find((x) => x.type === t).value;
    return `${g('year')}-${g('month')}-${g('day')}`;
  };
  const ahoraHM = () => {
    const p = new Intl.DateTimeFormat('es-MX', { timeZone: CONFIG.fechas.zonaHoraria, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date());
    const g = (t) => p.find((x) => x.type === t).value;
    return `${g('hour')}:${g('minute')}`;
  };
  const edadEn = (nacISO, refISO) => {
    const [a, m, d] = nacISO.split('-').map(Number); const [ra, rm, rd] = refISO.split('-').map(Number);
    let e = ra - a; if (rm < m || (rm === m && rd < d)) e--; return e;
  };
  const plantilla = (t, v = {}) => String(t).replace(/\{(\w+)\}/g, (_, k) => (v[k] ?? ''));

  /* ---------- Texto legible: forma, no sentido ----------
     Rechaza el tecleo al azar; no juzga ortografía ni contenido. Los umbrales
     de ESTA prueba se publican; los de la protección en servidor, no. */
  const TEXTO_LEGIBLE = { minPalabras: 6, minLetras: 25, vocalMin: 0.28, vocalMax: 0.68, repeticion: 4, palabraMax: 24, sinVocalDesde: 5 };
  function pareceTexto(x) {
    const L = TEXTO_LEGIBLE;
    x = String(x || '').trim();
    const palabras = x.split(/\s+/).filter((p) => p.length > 1);
    if (palabras.length < L.minPalabras) return false;
    const letras = x.toLowerCase().replace(/[^a-záéíóúüñ]/g, '');
    if (letras.length < L.minLetras) return false;
    const proporcion = (letras.match(/[aeiouáéíóúü]/g) || []).length / letras.length;
    if (proporcion < L.vocalMin || proporcion > L.vocalMax) return false;
    if (new RegExp(`(.)\\1{${L.repeticion - 1},}`).test(x)) return false;
    if (palabras.some((p) => p.length > L.palabraMax)) return false;
    return !palabras.some((p) => { const s = p.toLowerCase().replace(/[^a-záéíóúüñ]/g, ''); return s.length >= L.sinVocalDesde && !/[aeiouáéíóúü]/.test(s); });
  }

  /* ---------- CURP ----------
     Estructura de referencia, A CONFIRMAR en la documentación oficial del
     emisor (RENAPO) antes de liberar un formulario que la exija [Fuente: __]:
       1-4 iniciales · 5-10 fecha AAMMDD · 11 sexo · 12-13 entidad ·
       14-16 consonantes internas · 17 diferenciador de siglo (dígito hasta
       1999, letra desde 2000) · 18 dígito verificador.
     Un formato correcto no prueba que exista ni que sea de la persona. */
  const CURP = {
    largo: 18,
    re: /^[A-Z][AEIOUX][A-Z]{2}\d{6}[HMX][A-Z]{2}[B-DF-HJ-NP-TV-Z]{3}[0-9A-Z]\d$/,
    entidades: ['AS', 'BC', 'BS', 'CC', 'CL', 'CM', 'CS', 'CH', 'DF', 'DG', 'GT', 'GR', 'HG', 'JC', 'MC', 'MN', 'MS', 'NT', 'NL', 'OC', 'PL', 'QT', 'QR', 'SP', 'SL', 'SR', 'TC', 'TS', 'TL', 'VZ', 'YN', 'ZS', 'NE'],
    verificarDigito: true,
    alfabeto: '0123456789ABCDEFGHIJKLMNÑOPQRSTUVWXYZ'
  };
  function fechaDeCurp(curp) {
    const aa = Number(curp.slice(4, 6)), mm = Number(curp.slice(6, 8)), dd = Number(curp.slice(8, 10));
    const siglo = /\d/.test(curp[16]) ? 1900 : 2000;
    const a = siglo + aa;
    return esFechaReal(a, mm, dd) ? `${a}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}` : '';
  }
  function digitoCurp(curp) {
    let suma = 0;
    for (let i = 0; i < 17; i++) suma += CURP.alfabeto.indexOf(curp[i]) * (18 - i);
    return String((10 - (suma % 10)) % 10);
  }

  /* ---------- CURP contra nombre y apellidos ----------
     Reglas de formación de las letras, simplificadas, A CONFIRMAR con el
     instructivo del emisor (RENAPO) [Fuente: __]:
       1 inicial del primer apellido · 2 su primera vocal interna ·
       3 inicial del segundo apellido (X si no hay) · 4 inicial del nombre ·
       14, 15 y 16 primera consonante interna del primer apellido, del segundo
       (X si no hay) y del nombre.
     Se omiten las partículas (DE, DEL, LA, LOS, Y, MC, VAN…); en un nombre
     compuesto que empieza con MARÍA o JOSÉ cuenta el segundo; la Ñ cuenta
     como X; si las cuatro primeras letras forman una palabra altisonante, la
     segunda cambia por X.
     Límite: comprueba que la CURP y el nombre sean coherentes entre sí, no
     que la CURP exista ni que sea de quien la escribe. */
  const CURP_NOMBRE = {
    particulas: ['DA', 'DAS', 'DE', 'DEL', 'DER', 'DI', 'DIE', 'DD', 'EL', 'LA', 'LAS', 'LE', 'LES', 'LOS', 'MAC', 'MC', 'VAN', 'VON', 'Y'],
    nombresComunes: ['MARIA', 'MA', 'MX', 'M', 'JOSE', 'J'],
    altisonantes: ['BACA', 'BAKA', 'BUEI', 'BUEY', 'CACA', 'CACO', 'CAGA', 'CAGO', 'CAKA', 'CAKO', 'COGE', 'COGI',
      'COJA', 'COJE', 'COJI', 'COJO', 'COLA', 'CULO', 'FALO', 'FETO', 'GETA', 'GUEI', 'GUEY', 'JETA', 'JOTO', 'KACA', 'KACO',
      'KAGA', 'KAGO', 'KAKA', 'KAKO', 'KOGE', 'KOGI', 'KOJA', 'KOJE', 'KOJI', 'KOJO', 'KOLA', 'KULO', 'LILO', 'LOCA', 'LOCO',
      'LOKA', 'LOKO', 'MAME', 'MAMO', 'MEAR', 'MEAS', 'MEON', 'MIAR', 'MION', 'MOCO', 'MOKO', 'MULA', 'MULO', 'NACA', 'NACO',
      'PEDA', 'PEDO', 'PENE', 'PIPI', 'PITO', 'POPO', 'PUTA', 'PUTO', 'QULO', 'RATA', 'ROBA', 'ROBE', 'ROBO', 'RUIN', 'SENO',
      'TETA', 'VACA', 'VAGA', 'VAGO', 'VAKA', 'VUEI', 'VUEY', 'WUEI', 'WUEY'],
    vocales: 'AEIOU'
  };
  /* Mayúsculas y sin acentos (la Ñ se conserva para tratarla aparte); sólo letras y espacios. */
  function letrasDeNombre(t) {
    return String(t || '').toUpperCase()
      .replace(/Ñ/g, '\u0001').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\u0001/g, 'Ñ')
      .replace(/[^A-ZÑ ]/g, ' ').replace(/\s+/g, ' ').trim();
  }
  /* La palabra que cuenta: la primera que no es partícula; en el nombre, la que sigue a MARÍA o JOSÉ. */
  function palabraDeCurp(t, esNombre) {
    let p = letrasDeNombre(t).split(' ').filter((w) => w && !CURP_NOMBRE.particulas.includes(w));
    if (esNombre && p.length > 1 && CURP_NOMBRE.nombresComunes.includes(p[0])) p = p.slice(1);
    return p[0] || '';
  }
  const letraDeCurp = (c) => (!c || c === 'Ñ' ? 'X' : c);
  const vocalInterna = (p) => letraDeCurp([...p.slice(1)].find((c) => CURP_NOMBRE.vocales.includes(c)));
  const consonanteInterna = (p) => letraDeCurp([...p.slice(1)].find((c) => !CURP_NOMBRE.vocales.includes(c)));
  /* Las letras que la CURP debe tener según el nombre; null si falta el nombre o el primer apellido. */
  function letrasDeCurp({ nombre, primer, segundo }) {
    const n = palabraDeCurp(nombre, true), a1 = palabraDeCurp(primer), a2 = palabraDeCurp(segundo);
    if (!n || !a1) return null;
    return {
      p1: letraDeCurp(a1[0]), p2: vocalInterna(a1), p3: a2 ? letraDeCurp(a2[0]) : 'X', p4: letraDeCurp(n[0]),
      p14: consonanteInterna(a1), p15: a2 ? consonanteInterna(a2) : 'X', p16: consonanteInterna(n)
    };
  }
  /* Las 16 primeras posiciones de una CURP coherente con los datos (sin diferenciador ni dígito): para armar datos ficticios de prueba. */
  function prefijoCurp(datos, fechaISO, sexo, entidad) {
    const e = letrasDeCurp(datos);
    let cuatro = e.p1 + e.p2 + e.p3 + e.p4;
    if (CURP_NOMBRE.altisonantes.includes(cuatro)) cuatro = `${cuatro[0]}X${cuatro.slice(2)}`;
    return cuatro + fechaISO.slice(2, 4) + fechaISO.slice(5, 7) + fechaISO.slice(8, 10) + sexo + entidad + e.p14 + e.p15 + e.p16;
  }

  /* ---------- Formatos por tipo de dato ---------- */
  /* Cada formato y cada cruzada reciben la configuración del formulario
     (cfg: la base fusionada con FORMKIT_CONFIG en el navegador; la del
     servidor en validar.mjs). Sus textos viven en cfg.mensajes, así que un
     formulario los cambia sin tocar este archivo (por ejemplo, a «usted»), y
     sus límites (ámbito, CURP) se leen de cfg, no de la base. */
  const FORMATOS = {
    nombre: {
      descripcion: 'Nombre o apellido de persona',
      inputmode: 'text', autocomplete: 'given-name',
      normaliza: (v) => recorta(v),
      valida: (v, a = {}, cfg = CONFIG) => {
        const M = cfg.mensajes;
        if (!/^[\p{L}\p{M}' .\-]+$/u.test(v)) return M.fmtNombre;
        if (v.length > (a.maxlength || 80)) return plantilla(M.fmtNombreLargo, { max: a.maxlength || 80 });
        return '';
      }
    },
    correo: {
      descripcion: 'Correo electrónico',
      inputmode: 'email', autocomplete: 'email',
      dominiosFrecuentes: ['gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com', 'icloud.com', 'live.com.mx', 'hotmail.es'],
      normaliza: (v) => recorta(v).toLowerCase().replace(/\s/g, ''),
      valida: (v, a = {}, cfg = CONFIG) => {
        const M = cfg.mensajes;
        if (v.length > (a.maxlength || 120)) return plantilla(M.fmtCorreoLargo, { max: a.maxlength || 120 });
        const partes = v.split('@');
        if (partes.length !== 2 || !partes[0] || !partes[1]) return M.fmtCorreoArroba;
        if (!/^[^\s@]+\.[^\s@.]{2,}$/.test(partes[1])) return M.fmtCorreoDominio;
        return '';
      },
      /* Sugerencia sin bloqueo para errores de dedo frecuentes («gmial.com»). */
      sugiere: (v, cfg = CONFIG) => {
        const dom = (v.split('@')[1] || '').toLowerCase();
        if (!dom || FORMATOS.correo.dominiosFrecuentes.includes(dom)) return '';
        const cerca = FORMATOS.correo.dominiosFrecuentes.find((d) => distancia(d, dom) === 1);
        return cerca ? plantilla(cfg.mensajes.fmtCorreoSugerencia, { correo: `${v.split('@')[0]}@${cerca}` }) : '';
      }
    },
    telefono: {
      descripcion: 'Teléfono de México: diez dígitos',
      inputmode: 'tel', autocomplete: 'tel-national',
      /* Se aceptan espacios, guiones y paréntesis al escribir; un prefijo
         +52 o 52 se retira. La regla de diez dígitos es la de México y debe
         confirmarse con el plan de numeración vigente [Fuente: __]. */
      normaliza: (v) => { let d = soloDigitos(String(v).replace(/^\s*\+?52\s*/, '')); if (d.length === 12 && d.startsWith('52')) d = d.slice(2); return d; },
      valida: (v, a = {}, cfg = CONFIG) => (/^\d{10}$/.test(v) ? '' : cfg.mensajes.fmtTelefono)
    },
    cp: {
      descripcion: 'Código postal: cinco dígitos, se conserva como texto',
      inputmode: 'numeric', autocomplete: 'postal-code',
      normaliza: (v) => soloDigitos(v),
      /* Con data-ambito="nacional" en el campo se acepta cualquier código del
         país (domicilio fuera de la Ciudad); si no, sólo los del ámbito. */
      valida: (v, a = {}, cfg = CONFIG) => {
        if (!/^\d{5}$/.test(v)) return cfg.mensajes.fmtCp;
        const am = a.ambito === 'nacional' ? null : cfg.ambito && cfg.ambito.cp;
        if (am && (v < am.min || v > am.max)) return am.mensaje;
        return '';
      }
    },
    curp: {
      descripcion: 'CURP: 18 caracteres',
      inputmode: 'text', autocomplete: 'off',
      normaliza: (v) => sinAcentos(recorta(v)).toUpperCase().replace(/\s/g, ''),
      valida: (v, a = {}, cfg = CONFIG) => {
        const M = cfg.mensajes, C = cfg.curp || CURP;
        if (v.length !== C.largo) return plantilla(M.fmtCurpLargo, { largo: C.largo, n: v.length });
        if (!C.re.test(v)) return M.fmtCurpEstructura;
        if (!fechaDeCurp(v)) return M.fmtCurpFecha;
        if (fechaDeCurp(v) > hoyISO()) return M.fmtCurpFutura;
        if (!C.entidades.includes(v.slice(11, 13))) return M.fmtCurpEntidad;
        if (C.verificarDigito && digitoCurp(v) !== v[17]) return M.fmtCurpDigito;
        return '';
      },
      /* Datos derivables para mostrarlos en solo lectura (minimización). */
      deriva: (v) => ({ fechaNacimiento: fechaDeCurp(v), sexo: v[10], entidad: v.slice(11, 13) })
    },
    rfc: {
      descripcion: 'RFC: 12 caracteres (persona moral) o 13 (persona física). Estructura a confirmar con el emisor [Fuente: __]',
      inputmode: 'text', autocomplete: 'off',
      normaliza: (v) => sinAcentosSalvoEnie(recorta(v)).toUpperCase().replace(/[\s-]/g, ''),
      valida: (v, a = {}, cfg = CONFIG) => {
        if (!/^([A-ZÑ&]{3,4})(\d{6})([A-Z0-9]{3})$/.test(v)) return cfg.mensajes.fmtRfc;
        const aa = Number(v.slice(-9, -7)), mm = Number(v.slice(-7, -5)), dd = Number(v.slice(-5, -3));
        if (!esFechaReal(2000 + aa, mm, dd) && !esFechaReal(1900 + aa, mm, dd)) return cfg.mensajes.fmtRfcFecha;
        return '';
      }
    },
    numero: {
      descripcion: 'Número entero o decimal con mínimo, máximo y paso configurables en el campo',
      inputmode: 'decimal', autocomplete: 'off',
      /* Una coma se toma como punto decimal («12,5» → 12.5), salvo que agrupe miles
         («1,500», «12,345.50»): eso no se adivina, se pide escribirlo sin comas. */
      normaliza: (v) => { const t = recorta(v).replace(/\s/g, ''); return CON_MILES.test(t) ? t : t.replace(',', '.'); },
      valida: (v, a = {}, cfg = CONFIG) => {
        const M = cfg.mensajes;
        if (CON_MILES.test(v)) return plantilla(M.fmtNumeroMiles, { numero: v.replace(/,/g, '') });
        if (!/^-?\d+(\.\d+)?$/.test(v)) return M.fmtNumero;
        const n = Number(v);
        /* El paso cuenta desde el mínimo, como en HTML; con tolerancia de redondeo para pasos decimales. */
        const paso = a.step && a.step !== 'any' ? Number(a.step) : 0;
        if (paso > 0) {
          const k = (n - (a.min !== undefined && a.min !== '' ? Number(a.min) : 0)) / paso;
          if (Math.abs(k - Math.round(k)) > 1e-9) return paso === 1 ? M.fmtNumeroEntero : plantilla(M.fmtNumeroPaso, { paso: a.step });
        }
        if (a.min !== undefined && a.min !== '' && n < Number(a.min)) return plantilla(M.fmtNumeroMin, { min: a.min });
        if (a.max !== undefined && a.max !== '' && n > Number(a.max)) return plantilla(M.fmtNumeroMax, { max: a.max });
        return '';
      }
    },
    fecha: {
      descripcion: 'Fecha real en formato AAAA-MM-DD con límites configurables',
      inputmode: 'numeric', autocomplete: 'off',
      normaliza: (v) => recorta(v),
      valida: (v, a = {}, cfg = CONFIG) => {
        const M = cfg.mensajes;
        const m = v.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (!m || !esFechaReal(Number(m[1]), Number(m[2]), Number(m[3]))) return M.fmtFecha;
        if (a.max && v > a.max) return a.max === hoyISO() ? M.fmtFechaFutura : plantilla(M.fmtFechaMax, { fecha: dmaDeIso(a.max) || a.max });
        if (a.min && v < a.min) return plantilla(M.fmtFechaMin, { fecha: dmaDeIso(a.min) || a.min });
        return '';
      }
    },
    'fecha-dma': {
      descripcion: 'Fecha real escrita como día/mes/año (DD/MM/AAAA), sin calendario; para la fecha de nacimiento',
      inputmode: 'numeric', autocomplete: 'off',
      normaliza: (v) => { const iso = isoDeDma(v); return iso ? dmaDeIso(iso) : recorta(v); },
      valida: (v, a = {}, cfg = CONFIG) => {
        const M = cfg.mensajes;
        const iso = isoDeDma(v);
        if (!iso) return M.fmtFechaDma;
        if (Number(iso.slice(0, 4)) < 1900) return M.fmtFechaDmaAnio;
        /* En el navegador llega data-no-futura; en el servidor, max ya resuelto a hoy. */
        const max = a.max || (a.noFutura !== undefined ? hoyISO() : '');
        if (max && iso > max) return max === hoyISO() ? M.fmtFechaFutura : plantilla(M.fmtFechaMax, { fecha: dmaDeIso(max) });
        if (a.min && iso < a.min) return plantilla(M.fmtFechaMin, { fecha: dmaDeIso(a.min) });
        return '';
      }
    },
    hora: {
      descripcion: 'Hora en formato de 24 horas',
      inputmode: 'numeric', autocomplete: 'off',
      normaliza: (v) => recorta(v),
      valida: (v, a = {}, cfg = CONFIG) => (/^([01]\d|2[0-3]):[0-5]\d$/.test(v) ? '' : cfg.mensajes.fmtHora)
    },
    texto: {
      descripcion: 'Texto libre con longitud mínima y máxima; neutraliza marcado y caracteres de control',
      inputmode: 'text', autocomplete: 'off',
      normaliza: (v) => String(v ?? '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim(),
      valida: (v, a = {}, cfg = CONFIG) => {
        const M = cfg.mensajes;
        if (a.minlength && v.length < Number(a.minlength)) return plantilla(M.fmtTextoMin, { min: a.minlength, n: v.length });
        if (a.maxlength && v.length > Number(a.maxlength)) return plantilla(M.fmtTextoMax, { max: a.maxlength, n: v.length });
        if (a.legible !== undefined && !pareceTexto(v)) return M.fmtTextoLegible;
        return '';
      }
    },
    coordenadas: {
      descripcion: 'Latitud y longitud dentro del rectángulo envolvente configurado',
      inputmode: 'decimal', autocomplete: 'off',
      normaliza: (v) => recorta(v).replace(/\s/g, ''),
      valida: (v, a = {}, cfg = CONFIG) => {
        const m = v.match(/^(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)$/);
        if (!m) return cfg.mensajes.fmtCoordenadas;
        const lat = Number(m[1]), lon = Number(m[2]);
        if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return cfg.mensajes.fmtCoordenadasRango;
        const b = cfg.ambito && cfg.ambito.coordenadas;
        if (b && (lat < b.latMin || lat > b.latMax || lon < b.lonMin || lon > b.lonMax)) return b.mensaje;
        return '';
      }
    },
    folio: {
      descripcion: 'Folio o clave alfanumérica con guiones',
      inputmode: 'text', autocomplete: 'off',
      normaliza: (v) => recorta(v).toUpperCase().replace(/\s/g, ''),
      valida: (v, a = {}, cfg = CONFIG) => (/^[A-Z0-9][A-Z0-9-]{2,}$/.test(v) && v.length <= (a.maxlength || 40) ? '' : cfg.mensajes.fmtFolio)
    },
    /* Folio fiscal (UUID) de una factura: 32 dígitos hexadecimales en grupos
       8-4-4-4-12, 36 caracteres. Se acepta en minúsculas y sin guiones, y se
       guarda en mayúsculas con ellos. Comprueba la forma, no que la factura exista. */
    'folio-fiscal': {
      descripcion: 'Folio fiscal (UUID) de una factura: 32 dígitos hexadecimales en grupos 8-4-4-4-12',
      inputmode: 'text', autocomplete: 'off',
      normaliza: (v) => {
        const t = recorta(v).toUpperCase().replace(/\s/g, '');
        const solo = t.replace(/-/g, '');
        return /^[0-9A-F]{32}$/.test(solo) ? `${solo.slice(0, 8)}-${solo.slice(8, 12)}-${solo.slice(12, 16)}-${solo.slice(16, 20)}-${solo.slice(20)}` : t;
      },
      valida: (v, a = {}, cfg = CONFIG) => (/^[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}$/.test(v) ? '' : cfg.mensajes.fmtFolioFiscal)
    },
    contrasena: {
      descripcion: 'Contraseña: sin límite máximo restrictivo ni bloqueo del pegado',
      inputmode: 'text', autocomplete: 'new-password',
      normaliza: (v) => String(v ?? ''),
      valida: (v, a = {}, cfg = CONFIG) => {
        const min = Number(a.minlength || 12);
        if (v.length < min) return plantilla(cfg.mensajes.fmtContrasenaMin, { min });
        if (a.maxlength && v.length > Number(a.maxlength)) return plantilla(cfg.mensajes.fmtContrasenaMax, { max: a.maxlength });
        return '';
      }
    }
  };

  /* Distancia de edición acotada a 1 para sugerir dominios de correo. */
  function distancia(a, b) {
    if (a === b) return 0;
    if (Math.abs(a.length - b.length) > 1) return 2;
    let i = 0, j = 0, d = 0;
    while (i < a.length && j < b.length) {
      if (a[i] === b[j]) { i++; j++; continue; }
      d++; if (d > 1) return 2;
      if (a.length > b.length) i++; else if (b.length > a.length) j++; else { if (a[i + 1] === b[j] && a[i] === b[j + 1]) { i += 2; j += 2; } else { i++; j++; } }
    }
    return d + (a.length - i) + (b.length - j);
  }

  /* ---------- Validaciones cruzadas ----------
     Reciben los valores ya normalizados de los campos que relacionan y
     devuelven '' o el mensaje. Nunca corren hasta que ambos campos tengan
     valor y hayan pasado su validación individual. `bloquea` indica si por
     omisión impide continuar; el campo puede degradarlo a advertencia. */
  const CRUZADAS = {
    'curp-fecha': {
      descripcion: 'La fecha de nacimiento coincide con la contenida en la CURP',
      campos: ['curp', 'fecha'], bloquea: true,
      /* La fecha puede venir como AAAA-MM-DD (formato «fecha») o DD/MM/AAAA («fecha-dma»). */
      valida: ({ curp, fecha }, a = {}, cfg = CONFIG) => (fechaDeCurp(curp) === (isoDeDma(fecha) || fecha) ? '' : cfg.mensajes.czCurpFecha)
    },
    'curp-sexo': {
      descripcion: 'El sexo declarado coincide con la posición 11 de la CURP',
      campos: ['curp', 'sexo'], bloquea: false,
      valida: ({ curp, sexo }, a = {}, cfg = CONFIG) => (!sexo || curp[10] === String(sexo).toUpperCase()[0] ? '' : cfg.mensajes.czCurpSexo)
    },
    'curp-entidad': {
      descripcion: 'La entidad de nacimiento coincide con las posiciones 12 y 13 de la CURP',
      campos: ['curp', 'entidad'], bloquea: false,
      valida: ({ curp, entidad }, a = {}, cfg = CONFIG) => (!entidad || curp.slice(11, 13) === String(entidad).toUpperCase() ? '' : cfg.mensajes.czCurpEntidad)
    },
    /* La CURP y el nombre son coherentes (no prueba que la CURP exista). */
    'curp-nombre': {
      descripcion: 'Las letras de la CURP corresponden al nombre y al primer apellido (posiciones 1, 2, 4, 14 y 16)',
      campos: ['curp', 'nombre', 'primer'], bloquea: true,
      valida: ({ curp, nombre, primer }, a = {}, cfg = CONFIG) => {
        const e = letrasDeCurp({ nombre, primer, segundo: '' });
        if (!e) return '';
        /* La posición 3 viene de la propia CURP: así se reconoce la palabra altisonante sin pedir el segundo apellido. */
        const p2 = CURP_NOMBRE.altisonantes.includes(e.p1 + e.p2 + curp[2] + e.p4) ? 'X' : e.p2;
        return curp[0] === e.p1 && curp[1] === p2 && curp[3] === e.p4 && curp[13] === e.p14 && curp[15] === e.p16 ? '' : cfg.mensajes.curpNombre;
      }
    },
    /* El segundo apellido es opcional: sin él, la CURP lleva X en las posiciones 3 y 15. */
    'curp-segundo-apellido': {
      descripcion: 'Las letras de la CURP corresponden al segundo apellido (posiciones 3 y 15); sin segundo apellido, la CURP lleva X en las dos',
      campos: ['curp', 'segundo'], opcionales: ['segundo'], bloquea: true,
      valida: ({ curp, segundo }, a = {}, cfg = CONFIG) => {
        const a2 = palabraDeCurp(segundo);
        if (!a2) return curp[2] === 'X' && curp[14] === 'X' ? '' : cfg.mensajes.curpSinSegundo;
        return curp[2] === letraDeCurp(a2[0]) && curp[14] === consonanteInterna(a2) ? '' : cfg.mensajes.curpNombre;
      }
    },
    'rango-fechas': {
      descripcion: 'La fecha final no es anterior a la inicial',
      campos: ['inicio', 'fin'], bloquea: true,
      /* Se comparan como AAAA-MM-DD aunque se escriban día/mes/año («fecha-dma»). */
      valida: ({ inicio, fin }, a = {}, cfg = CONFIG) => ((isoDeDma(fin) || fin) >= (isoDeDma(inicio) || inicio) ? '' : cfg.mensajes.czRangoFechas)
    },
    'rango-horas': {
      descripcion: 'La hora final es posterior a la inicial cuando es el mismo día',
      campos: ['inicio', 'fin'], bloquea: true,
      valida: ({ inicio, fin }, a = {}, cfg = CONFIG) => (fin > inicio ? '' : cfg.mensajes.czRangoHoras)
    },
    'igual': {
      descripcion: 'Confirmación idéntica al original (correo, contraseña)',
      campos: ['original', 'confirmacion'], bloquea: true,
      valida: ({ original, confirmacion }, a = {}, cfg = CONFIG) => (original === confirmacion ? '' : cfg.mensajes.czIgual)
    },
    'edad': {
      descripcion: 'Edad calculada dentro de la mínima y máxima que exige el formulario',
      campos: ['fecha'], bloquea: true,
      valida: ({ fecha }, a = {}, cfg = CONFIG) => {
        /* La fecha llega como AAAA-MM-DD o, con «fecha-dma», como día/mes/año. */
        const iso = isoDeDma(fecha);
        if (!iso) return '';
        const e = edadEn(iso, hoyISO());
        if (a.edadMin !== undefined && e < Number(a.edadMin)) return plantilla(cfg.mensajes.edadMinima, { edad: a.edadMin });
        if (a.edadMax !== undefined && e > Number(a.edadMax)) return plantilla(cfg.mensajes.edadMaxima, { edad: a.edadMax });
        return '';
      }
    },
    'edad-calculada': {
      descripcion: 'La edad es la que sale de la fecha de nacimiento (para un campo de edad que se calcula; el servidor no la acepta de otra)',
      campos: ['fecha', 'edad'], bloquea: true,
      valida: ({ fecha, edad }, a = {}, cfg = CONFIG) => {
        const iso = isoDeDma(fecha);
        if (!iso) return '';
        return String(edadEn(iso, hoyISO())) === String(Number(edad)) ? '' : cfg.mensajes.czEdadCalculada;
      }
    },
    'cp-colonia': {
      descripcion: 'El código postal pertenece a la alcaldía y colonia elegidas (advertencia, no bloqueo)',
      campos: ['cp', 'colonia'], bloquea: false,
      valida: ({ cp, colonia }, a = {}, cfg = CONFIG) => {
        const cat = a.catalogo || [];
        if (!cat.length) return '';
        const ok = cat.some((fila) => fila.cp === cp && fila.colonia === colonia);
        return ok ? '' : cfg.mensajes.czCpColonia;
      }
    }
  };

  /* «curp-fecha-dma»: el mismo cruce, para los formularios que piden la fecha como día/mes/año. */
  CRUZADAS['curp-fecha-dma'] = { ...CRUZADAS['curp-fecha'], descripcion: 'La fecha de nacimiento (día/mes/año) coincide con la contenida en la CURP' };

  /* ---------- Archivos ---------- */
  const ARCHIVOS = {
    extensiones: ['jpg', 'jpeg', 'png', 'pdf'],
    mb: 8,                 /* máximo por archivo, medido después de optimizar */
    mbTotal: 25,
    max: 5,
    minBytes: 1,           /* un archivo vacío se rechaza */
    /* Firmas (primeros bytes) por tipo real: la extensión se falsifica.
       El servidor repite esta comprobación. */
    firmas: {
      jpg: [[0xFF, 0xD8, 0xFF]], jpeg: [[0xFF, 0xD8, 0xFF]],
      png: [[0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]],
      pdf: [[0x25, 0x50, 0x44, 0x46]],
      webp: [[0x52, 0x49, 0x46, 0x46]],
      gif: [[0x47, 0x49, 0x46, 0x38]],
      heic: [[0x00, 0x00, 0x00]] /* HEIC lleva «ftyp» en el byte 4; se comprueba aparte */
    },
    optimiza: { tipos: ['jpg', 'jpeg', 'png', 'webp'], lado: 2048, calidad: 0.82 },
    imagen: { anchoMin: 320, altoMin: 240 },
    conservarExif: false,  /* decisión C6: la ubicación de la foto viaja sólo si el formulario la pide y la persona lo sabe */
    nombreMax: 120
  };

  /* ---------- Configuración ---------- */
  const CONFIG = {
    version: '1.6.0',
    idioma: 'es-MX',
    /* horas24: el reloj de las fechas que se muestran (acuse, borrador, resultado); false, con a.m. y p.m. */
    fechas: { zonaHoraria: 'America/Mexico_City', horas24: true },
    /* Ámbito territorial. `cp` restringe el rango; `coordenadas` el
       rectángulo envolvente. Un formulario de alcance nacional pone null. */
    ambito: {
      cp: { min: '01000', max: '16999', mensaje: 'Ese código postal no es de la Ciudad de México: los de la Ciudad van del 01000 al 16999.' },
      coordenadas: { latMin: 19.05, latMax: 19.6, lonMin: -99.37, lonMax: -98.94, mensaje: 'El punto queda fuera de la Ciudad de México. Revisa las coordenadas.' }
    },
    textoLegible: TEXTO_LEGIBLE,
    curp: CURP,
    formatos: FORMATOS,
    cruzadas: CRUZADAS,
    archivos: ARCHIVOS,
    borrador: { ttlDias: 14, retardoMs: 600, visibleMs: 2500 },
    envio: { timeoutMs: 15000 },
    /* El acuse (folio y fecha, sin datos de la persona) se guarda en el dispositivo
       y se vuelve a mostrar si la persona recarga la página durante estas horas. */
    acuse: { horasVisible: 24 },
    anuncios: { retardoMs: 50 },
    combo: { maxResultados: 8 },
    chips: { max: 5, clave: 'sia-chips' },
    /* Visor de documentos: dónde está pdf.js (vacío: vendor/pdfjs-dist/ junto
       al paquete), desde qué ancho queda fijo junto a lo que se revisa en lugar
       de abrirse a pantalla completa, y la espera para repintar al cambiar el tamaño. */
    visor: { pdfjs: '', fijoDesde: '(min-width: 1024px)', retardoMs: 250 },
    mensajes: {
      prefijoError: 'Error:',
      obligatorioTexto: 'Completa «{etiqueta}».',
      obligatorioOpcion: 'Elige una opción en «{etiqueta}».',
      obligatorioCasilla: 'Marca la casilla «{etiqueta}» para continuar.',
      obligatorioArchivos: 'Adjunta al menos un archivo en «{etiqueta}».',
      obligatorioOtro: 'Escribe cuál es la otra opción en «{etiqueta}».',
      minimoOpciones: 'Elige al menos {min} opciones en «{etiqueta}».',
      maximoOpciones: 'Elige como máximo {max} opciones en «{etiqueta}».',
      soloLista: 'Elige una opción de la lista en «{etiqueta}».',
      repiteOpcion: '«{texto}» ya está en la lista: elige esa opción.',
      edadMinima: 'Se requiere una edad mínima de {edad} años.',
      edadMaxima: 'La edad máxima es de {edad} años.',
      curpNombre: 'La CURP no corresponde con el nombre y los apellidos que escribiste. Escríbelos tal como aparecen en tu CURP.',
      curpSinSegundo: 'Tu CURP indica que tienes segundo apellido. Escríbelo tal como aparece en tu CURP.',
      /* Formatos (fmt…) y cruzadas (cz…): un formulario que habla de usted los cambia aquí. */
      fmtNombre: 'Escribe sólo letras, espacios, apóstrofe, guion o punto. Ejemplo: María José',
      fmtNombreLargo: 'El nombre es demasiado largo: usa hasta {max} caracteres.',
      fmtCorreoLargo: 'El correo es demasiado largo: usa hasta {max} caracteres.',
      fmtCorreoArroba: 'El correo necesita una sola arroba, con texto antes y después. Ejemplo: nombre@dominio.mx',
      fmtCorreoDominio: 'Revisa el dominio después de la arroba: debe llevar un punto. Ejemplo: nombre@dominio.mx',
      fmtCorreoSugerencia: '¿Quisiste escribir {correo}?',
      fmtTelefono: 'Escribe 10 dígitos, sin lada internacional. Ejemplo: 5512345678',
      fmtCp: 'El código postal lleva 5 dígitos. Ejemplo: 01000',
      fmtCurpLargo: 'La CURP tiene {largo} caracteres; escribiste {n}.',
      fmtCurpEstructura: 'La CURP no tiene la estructura esperada. Revísala tal como aparece en tu documento.',
      fmtCurpFecha: 'La fecha dentro de la CURP (posiciones 5 a 10) no es una fecha real. Revísala.',
      fmtCurpFutura: 'La fecha de nacimiento dentro de la CURP está en el futuro. Revísala.',
      fmtCurpEntidad: 'La entidad de nacimiento dentro de la CURP (posiciones 12 y 13) no corresponde a ninguna clave. Revísala.',
      fmtCurpDigito: 'El último carácter de la CURP no coincide con el resto. Revisa que la hayas copiado completa y sin cambiar letras por números.',
      fmtRfc: 'El RFC lleva 3 o 4 letras, 6 dígitos de fecha y 3 caracteres finales. Ejemplo: XAXX010101000',
      fmtRfcFecha: 'La fecha dentro del RFC no es una fecha real. Revísala.',
      fmtNumero: 'Escribe sólo números; para decimales usa punto. Ejemplo: 12.5',
      fmtNumeroMiles: 'Escribe el número sin comas, por ejemplo {numero}.',
      fmtNumeroEntero: 'Escribe un número entero, sin decimales.',
      fmtNumeroPaso: 'Usa múltiplos de {paso}.',
      fmtNumeroMin: 'El valor mínimo es {min}.',
      fmtNumeroMax: 'El valor máximo es {max}.',
      fmtFecha: 'Escribe una fecha real con el formato AAAA-MM-DD. Ejemplo: 2026-03-15',
      fmtFechaDma: 'Escribe una fecha real como día/mes/año. Ejemplo: 23/07/1985',
      fmtFechaDmaAnio: 'Revisa el año: escribe los cuatro dígitos, de 1900 en adelante. Ejemplo: 1985',
      fmtFechaFutura: 'La fecha no puede ser posterior a hoy.',
      fmtFechaMax: 'La fecha no puede ser posterior al {fecha}.',
      fmtFechaMin: 'La fecha no puede ser anterior al {fecha}.',
      fmtHora: 'Escribe la hora en formato de 24 horas, HH:MM. Ejemplo: 14:30',
      fmtTextoMin: 'Escribe al menos {min} caracteres; van {n}.',
      fmtTextoMax: 'Usa hasta {max} caracteres; van {n}.',
      fmtTextoLegible: 'Descríbelo con tus palabras, en una o dos frases completas.',
      fmtCoordenadas: 'Escribe latitud y longitud separadas por coma. Ejemplo: 19.4326,-99.1332',
      fmtCoordenadasRango: 'Las coordenadas están fuera de rango: la latitud va de -90 a 90 y la longitud de -180 a 180.',
      fmtFolio: 'Escribe el folio tal como aparece en tu acuse, con letras, números y guiones.',
      fmtFolioFiscal: 'El folio fiscal tiene 36 caracteres: números y letras de la A a la F, en grupos de 8, 4, 4, 4 y 12 separados por guiones. Cópialo como aparece en la factura.',
      fmtContrasenaMin: 'La contraseña necesita al menos {min} caracteres. Una frase larga es más segura que una palabra con símbolos.',
      fmtContrasenaMax: 'La contraseña admite hasta {max} caracteres.',
      czCurpFecha: 'La fecha de nacimiento no coincide con la CURP. Revisa que ambos datos estén correctos.',
      czCurpSexo: 'El sexo indicado no coincide con el de la CURP. Revisa ambos datos.',
      czCurpEntidad: 'La entidad de nacimiento no coincide con la de la CURP. Revisa ambos datos.',
      czRangoFechas: 'La fecha final no puede ser anterior a la fecha inicial.',
      czEdadCalculada: 'La edad no corresponde a la fecha de nacimiento.',
      czRangoHoras: 'La hora final debe ser posterior a la hora inicial.',
      czIgual: 'Los dos valores no coinciden. Escríbelos igual en ambos campos.',
      czCpColonia: 'El código postal no corresponde a la colonia elegida según el catálogo. Revisa ambos datos; puedes continuar si estás seguro.',
      minimoCaracteres: 'Escribe al menos {min} caracteres en «{etiqueta}»; van {n}.',
      maximoCaracteres: 'Usa hasta {max} caracteres en «{etiqueta}».',
      advertencia: 'Advertencia:',
      resumenUno: 'Para continuar, revisa 1 respuesta.',
      resumenVarios: 'Para continuar, revisa {n} respuestas.',
      resumenServidorUno: 'No se pudo enviar: revisa 1 respuesta.',
      resumenServidorVarios: 'No se pudo enviar: revisa {n} respuestas.',
      resumenContexto: '{contexto}: {mensaje}',
      confirmaTitulo: '¿Confirmas?',
      confirmaSi: 'Confirmar',
      confirmaNo: 'Volver sin cambios',
      confirmaConsecuencias: 'Qué pasará:',
      confirmaIrreversible: 'No se puede deshacer.',
      resultadoHora: 'Quedó guardado a las {hora}',
      resultadoFechaHora: 'Quedó guardado el {fecha} a las {hora}',
      resultadoMotivo: 'Motivo',
      resultadoQueSigue: 'Qué sigue',
      descargaPreparando: 'Preparando el archivo…',
      descargaLista: 'Descarga iniciada.',
      descargaError: 'No se pudo preparar el archivo. Intenta de nuevo.',
      pasoAnuncio: 'Paso {n} de {total}: {titulo}.',
      pasoTexto: 'Paso {n} de {total}',
      pasoHecho: 'completado',
      pasoError: 'con errores',
      palabraObligatorio: 'obligatorio',
      contrasenaMostrar: 'Mostrar',
      contrasenaOcultar: 'Ocultar',
      contrasenaLector: ': {etiqueta}',
      palabraSi: 'Sí',
      palabraNo: 'No',
      sinValor: 'No indicado',
      editar: 'Editar',
      hoy: 'Hoy',
      ahora: 'Ahora',
      copiado: 'Copiado al portapapeles.',
      copiarFallo: 'No se pudo copiar. Selecciona el texto y cópialo a mano.',
      compartirFallo: 'Tu navegador no permite compartir desde aquí. Copia el enlace.',
      borradorGuardado: 'Borrador guardado en este dispositivo.',
      enviando: 'Enviando…',
      envioError: 'No se pudo enviar. Lo que capturaste sigue aquí; intenta de nuevo.',
      envioTimeout: 'El envío tardó demasiado y se detuvo. Lo que capturaste sigue aquí; intenta de nuevo.',
      envioLimite: 'Por ahora no podemos recibir más envíos desde este dispositivo. Lo que capturaste no se perdió; intenta más tarde.',
      envioRecibido: 'Tu envío se recibió. No lo envíes de nuevo.',
      acuseSinFolio: 'No llegó el folio. Guarda esta pantalla como constancia de tu envío.',
      archOptimizando: 'Optimizando…',
      archOptimizada: '{peso} · optimizada',
      archPeso: '{peso}',
      archQuitar: 'Quitar archivo {nombre}',
      archRechazoTitulo: 'No se agregó «{nombre}»:',
      archRechazoMax: 'sólo se admiten {max} archivos.',
      archRechazoMaxUno: 'sólo se admite un archivo.',
      archRechazoTipo: 'ese tipo de archivo no se admite. Los formatos son {formatos}.',
      archRechazoFirma: 'el contenido del archivo no corresponde a su extensión. Elige el archivo original.',
      archRechazoPeso: 'pesa {peso} y el máximo es {mb} MB. Reduce su tamaño o elige otro.',
      archRechazoTotal: 'con él se superan los {mb} MB en total.',
      archRechazoVacio: 'el archivo está vacío.',
      archRechazoDuplicado: 'ya adjuntaste ese mismo archivo.',
      archRechazoDimension: 'la imagen es demasiado pequeña (mínimo {ancho} × {alto} píxeles).',
      archRechazoOptimizada: 'aun optimizada pesa {peso} y el máximo es {mb} MB.',
      archLimite: '{admitidos}: {formatos}. Hasta {max} archivos de {mb} MB cada uno.',
      archLimiteUno: '{admitidos}: {formatos}. Un archivo de hasta {mb} MB.',
      archFormatos: 'Formatos admitidos',
      archFormato: 'Formato admitido',
      archLleno: 'Ya adjuntaste los {max} archivos. Para cambiar uno, quítalo.',
      archLlenoUno: 'Ya adjuntaste el archivo. Para cambiarlo, quítalo.',
      archAgregado: 'Se agregó {nombre}.',
      archQuitado: 'Se quitó {nombre}.',
      archReintentar: 'Reintentar',
      comboUno: 'Un resultado disponible.',
      comboVarios: '{n} resultados disponibles.',
      comboNinguno: 'Sin resultados para «{texto}».',
      comboLibre: 'No está en la lista: se guarda como lo escribiste.',
      tablaOrdenada: 'Ordenado por {columna}, {sentido}.',
      tablaAscendente: 'ascendente',
      tablaDescendente: 'descendente',
      cascadaEspera: 'Primero elige {padre}.',
      cascadaReiniciada: 'Se reinició «{etiqueta}» porque cambió «{padre}».',
      cascadaSinCatalogo: 'No se pudo cargar la lista; escribe el dato a mano.',
      paginacionRango: 'Mostrando {desde}–{hasta} de {total}',
      paginacionPagina: 'Página {n} de {total}',
      paginacionAnuncio: 'Página {n} de {total} cargada.',
      filaQuitar: 'Quitar fila {n}',
      filaAgregar: 'Agregar otro',
      filaConfirma: '¿Quitar esta fila? Tiene datos capturados.',
      repetibleMin: 'Agrega al menos {min} elementos en «{etiqueta}».',
      repetibleMax: 'Como máximo se admiten {max} elementos en «{etiqueta}».',
      mapaPunto: 'Punto marcado: {lat}, {lon}.',
      mapaFuera: 'El punto queda fuera del ámbito. Muévelo o escribe la dirección.',
      chipsBorrar: 'Borrar historial',
      chipsQuitar: 'Quitar {texto} de las sugerencias',
      chipsFijos: 'Respuestas frecuentes para {etiqueta}',
      chipsFijosContexto: '{nombre}, {contexto}',
      chipsFijosOrden: '{n} de {total}',
      chipsAgregado: 'Agregado: {texto}',
      visorCargando: 'Cargando el documento…',
      visorError: 'No se pudo mostrar el documento aquí. Ábrelo en otra pestaña con el enlace de arriba.',
      visorNavegador: 'Se muestra con el visor del navegador. Si no lo ves completo, ábrelo en otra pestaña con el enlace de arriba.',
      visorHoja: 'Hoja {n} de {total}',
      /* Textos de los módulos que antes estaban escritos en su código: así también se cambian aquí. */
      archRechazoProceso: 'no se pudo procesar el archivo. Intenta de nuevo.',
      copiarBoton: 'Copiado',
      copiarBotonFallo: 'No se pudo copiar',
      enlaceNuevaPestana: '(se abre en otra pestaña)',
      descargaBoton: 'Preparando…',
      enlaceMapaSin: 'No encontramos coordenadas en ese texto. Pega el enlace completo de Google Maps (el que empieza con google.com/maps) o escribe las coordenadas.',
      enlaceMapaCorto: 'Los enlaces cortos de Google Maps no traen las coordenadas. Ábrelo en Google Maps: en el celular, mantén presionado el punto y copia los números que aparecen; en la computadora, haz clic derecho sobre el punto. Pégalos en «Coordenadas».',
      enlaceMapaCentro: 'Ese enlace marca el centro de la pantalla, no un punto: tomamos {coordenadas}. Revisa que sea el lugar.',
      enlaceMapaTomadas: 'Coordenadas tomadas del enlace: {coordenadas}.',
      enlaceMapaOrden: 'se acomodaron latitud y longitud',
      enlaceMapaSigno: 'se agregó el signo menos a la longitud, que en la Ciudad siempre es negativa',
      enlaceMapaAnuncio: 'Coordenadas: {coordenadas}{notas}.',
      conjuncion: ' y ',
      fechaEdadCalculada: '{etiqueta}: {edad} años, calculada con la fecha de nacimiento.',
      fechaAtajos: 'Atajos de periodo',
      fechaUltimos: 'Últimos {n} días',
      fechaPeriodo: 'Periodo: del {desde} al {hasta}',
      curpDerivado: '{etiqueta}: {valor}, tomado de la CURP.',
      sexoH: 'Hombre',
      sexoM: 'Mujer',
      sexoX: 'No binario',
      cascadaCpTomado: '{etiqueta}: {valor}, tomado del catálogo. Puedes corregirlo.',
      cascadaTomadaCp: '{etiqueta}: {valor}, tomada del código postal.',
      chipsHistorial: 'Usados antes en {etiqueta}',
      chipsQuitada: 'Sugerencia quitada.',
      chipsBorrado: 'Historial borrado.',
      mapaGestoTactil: 'Usa dos dedos para mover el mapa',
      mapaGestoRueda: 'Usa Ctrl + rueda para acercar',
      mapaGestoRuedaMac: 'Usa ⌘ + rueda para acercar',
      mapaSinBase: 'Sin mapa base configurado: puedes colocar y mover el punto igual, o escribir la dirección.',
      mapaMarcador: 'Punto marcado; arrástralo para moverlo',
      mapaConfirmar: 'Confirmar punto',
      mapaConfirmado: 'Punto confirmado',
      mapaSinConfirmar: 'sin confirmar: no se envía',
      mapaSinUbicacion: 'No se pudo obtener tu ubicación. Toca el mapa o escribe la dirección.',
      cargando: 'Cargando…',
      repetibleAgregado: '{etiqueta} {n} agregado.',
      repetibleQuitado: 'Fila {n} quitada.',
      pestanaAnuncio: 'Pestaña {nombre}',
      paginacionAnterior: 'Anterior',
      paginacionSiguiente: 'Siguiente',
      paginacionMas: 'Cargar más',
      paginacionActual: 'Página {n}, actual',
      compartido: 'Compartido.',
      borradorRecuperado: 'Borrador recuperado en este dispositivo.',
      borradorNoGuardar: 'Nada se guarda en este equipo mientras esta pestaña siga abierta. Si la cierras antes de enviar, lo que capturaste se pierde.'
    }
  };

  return Object.assign(CONFIG, { pareceTexto, fechaDeCurp, digitoCurp, letrasDeCurp, prefijoCurp, isoDeDma, dmaDeIso, guiaFechaDma, hoyISO, ahoraHM, edadEn, plantilla, recorta, soloDigitos, distancia, formatosArchivo });
}));


/* ===== codigo/js/iconos.js ===== */
/* GENERADO por herramientas/construir.mjs desde codigo/iconos/sprite.svg. No se edita a mano.
   Catálogo cerrado de 30 iconos: i-alerta, i-error, i-ok, i-info, i-ayuda, i-cerrar, i-palomita, i-flecha-izq, i-flecha-der, i-abajo, i-descarga, i-copiar, i-compartir, i-eliminar, i-editar, i-ubicacion, i-fecha, i-adjunto, i-camara, i-buscar, i-mas, i-cargando, i-reloj, i-externo, i-archivo, i-facebook, i-x, i-instagram, i-tiktok, i-youtube.
   formkit.core.js lo inyecta una vez por página. */
window.FORMKIT_ICONOS = "<svg xmlns=\"http://www.w3.org/2000/svg\" hidden> <symbol id=\"i-alerta\" viewBox=\"0 0 24 24\"><path d=\"M12 3 2.5 20h19L12 3z\"/><path d=\"M12 9v5\"/><path d=\"M12 17.5h.01\"/></symbol> <symbol id=\"i-error\" viewBox=\"0 0 24 24\"><circle cx=\"12\" cy=\"12\" r=\"9\"/><path d=\"M12 7v6\"/><path d=\"M12 16.5h.01\"/></symbol> <symbol id=\"i-ok\" viewBox=\"0 0 24 24\"><circle cx=\"12\" cy=\"12\" r=\"9\"/><path d=\"m8 12.5 2.5 2.5L16 9.5\"/></symbol> <symbol id=\"i-info\" viewBox=\"0 0 24 24\"><circle cx=\"12\" cy=\"12\" r=\"9\"/><path d=\"M12 11v6\"/><path d=\"M12 7.5h.01\"/></symbol> <symbol id=\"i-ayuda\" viewBox=\"0 0 24 24\"><circle cx=\"12\" cy=\"12\" r=\"9\"/><path d=\"M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .9-1 1.7\"/><path d=\"M12 17h.01\"/></symbol> <symbol id=\"i-cerrar\" viewBox=\"0 0 24 24\"><path d=\"m6 6 12 12\"/><path d=\"M18 6 6 18\"/></symbol> <symbol id=\"i-palomita\" viewBox=\"0 0 24 24\"><path d=\"m5 12.5 4.5 4.5L19 7.5\"/></symbol> <symbol id=\"i-flecha-izq\" viewBox=\"0 0 24 24\"><path d=\"M19 12H5\"/><path d=\"m11 6-6 6 6 6\"/></symbol> <symbol id=\"i-flecha-der\" viewBox=\"0 0 24 24\"><path d=\"M5 12h14\"/><path d=\"m13 6 6 6-6 6\"/></symbol> <symbol id=\"i-abajo\" viewBox=\"0 0 24 24\"><path d=\"m6 9 6 6 6-6\"/></symbol> <symbol id=\"i-descarga\" viewBox=\"0 0 24 24\"><path d=\"M12 4v11\"/><path d=\"m7 10 5 5 5-5\"/><path d=\"M4 19h16\"/></symbol> <symbol id=\"i-copiar\" viewBox=\"0 0 24 24\"><rect x=\"9\" y=\"9\" width=\"11\" height=\"11\" rx=\"2\"/><path d=\"M5 15V6a2 2 0 0 1 2-2h9\"/></symbol> <symbol id=\"i-compartir\" viewBox=\"0 0 24 24\"><circle cx=\"18\" cy=\"5\" r=\"2.5\"/><circle cx=\"6\" cy=\"12\" r=\"2.5\"/><circle cx=\"18\" cy=\"19\" r=\"2.5\"/><path d=\"m8.3 10.8 7.4-4.6\"/><path d=\"m8.3 13.2 7.4 4.6\"/></symbol> <symbol id=\"i-eliminar\" viewBox=\"0 0 24 24\"><path d=\"M4 7h16\"/><path d=\"M9 7V4h6v3\"/><path d=\"M6 7l1 13h10l1-13\"/></symbol> <symbol id=\"i-editar\" viewBox=\"0 0 24 24\"><path d=\"M4 20h4l11-11-4-4L4 16v4z\"/><path d=\"m13 7 4 4\"/></symbol> <symbol id=\"i-ubicacion\" viewBox=\"0 0 24 24\"><path d=\"M12 21s-6-6.3-6-11a6 6 0 0 1 12 0c0 4.7-6 11-6 11z\"/><circle cx=\"12\" cy=\"10\" r=\"2.2\"/></symbol> <symbol id=\"i-fecha\" viewBox=\"0 0 24 24\"><rect x=\"4\" y=\"5\" width=\"16\" height=\"15\" rx=\"2\"/><path d=\"M4 10h16\"/><path d=\"M8 3v4\"/><path d=\"M16 3v4\"/></symbol> <symbol id=\"i-adjunto\" viewBox=\"0 0 24 24\"><path d=\"m20 11-8.5 8.5a5 5 0 0 1-7-7L13 4a3.3 3.3 0 0 1 4.7 4.7L9.5 17a1.6 1.6 0 0 1-2.3-2.3L15 7\"/></symbol> <symbol id=\"i-camara\" viewBox=\"0 0 24 24\"><path d=\"M4 8h3l2-3h6l2 3h3v11H4z\"/><circle cx=\"12\" cy=\"13\" r=\"3.5\"/></symbol> <symbol id=\"i-buscar\" viewBox=\"0 0 24 24\"><circle cx=\"11\" cy=\"11\" r=\"6\"/><path d=\"m20 20-4.5-4.5\"/></symbol> <symbol id=\"i-mas\" viewBox=\"0 0 24 24\"><path d=\"M12 5v14\"/><path d=\"M5 12h14\"/></symbol> <symbol id=\"i-cargando\" viewBox=\"0 0 24 24\"><path d=\"M12 3a9 9 0 1 0 9 9\"/></symbol> <symbol id=\"i-reloj\" viewBox=\"0 0 24 24\"><circle cx=\"12\" cy=\"12\" r=\"9\"/><path d=\"M12 7v5l3 2\"/></symbol> <symbol id=\"i-externo\" viewBox=\"0 0 24 24\"><path d=\"M14 4h6v6\"/><path d=\"M20 4 10 14\"/><path d=\"M19 14v5H5V5h5\"/></symbol> <symbol id=\"i-archivo\" viewBox=\"0 0 24 24\"><rect x=\"3\" y=\"4\" width=\"18\" height=\"5\" rx=\"1\"/><path d=\"M5 9v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9\"/><path d=\"M10 13h4\"/></symbol> <symbol id=\"i-facebook\" viewBox=\"0 0 24 24\"><path fill=\"currentColor\" stroke=\"none\" d=\"M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5 3.66 9.15 8.44 9.94v-7.03H7.9v-2.91h2.54V9.85c0-2.52 1.5-3.91 3.77-3.91 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.78-1.63 1.57v1.89h2.78l-.45 2.91h-2.33V22c4.78-.79 8.44-4.93 8.44-9.94Z\"/></symbol> <symbol id=\"i-x\" viewBox=\"0 0 24 24\"><path fill=\"currentColor\" stroke=\"none\" d=\"M17.53 3h3.03l-6.62 7.57L21.75 21h-6.09l-4.77-6.24L5.42 21H2.38l7.08-8.09L2.25 3h6.24l4.31 5.7L17.53 3Zm-1.07 16.17h1.68L7.62 4.73H5.82l10.64 14.44Z\"/></symbol> <symbol id=\"i-instagram\" viewBox=\"0 0 24 24\"><path fill=\"currentColor\" stroke=\"none\" d=\"M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41-.56-.22-.96-.48-1.38-.9-.42-.42-.68-.82-.9-1.38-.16-.42-.36-1.06-.41-2.23C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16Zm0 3.29a6.55 6.55 0 1 0 0 13.1 6.55 6.55 0 0 0 0-13.1Zm0 10.8a4.25 4.25 0 1 1 0-8.5 4.25 4.25 0 0 1 0 8.5Zm8.34-11.06a1.53 1.53 0 1 1-3.06 0 1.53 1.53 0 0 1 3.06 0Z\"/></symbol> <symbol id=\"i-tiktok\" viewBox=\"0 0 24 24\"><path fill=\"currentColor\" stroke=\"none\" d=\"M16.6 5.82A4.28 4.28 0 0 1 15.54 3h-3.1v12.4a2.59 2.59 0 1 1-1.84-2.48V9.75a5.72 5.72 0 1 0 4.94 5.66V9.01a7.35 7.35 0 0 0 4.3 1.38V7.28a4.29 4.29 0 0 1-3.24-1.46Z\"/></symbol> <symbol id=\"i-youtube\" viewBox=\"0 0 24 24\"><path fill=\"currentColor\" stroke=\"none\" d=\"M23.5 6.5a3.02 3.02 0 0 0-2.12-2.14C19.5 3.85 12 3.85 12 3.85s-7.5 0-9.38.51A3.02 3.02 0 0 0 .5 6.5C0 8.39 0 12 0 12s0 3.61.5 5.5a3.02 3.02 0 0 0 2.12 2.14c1.88.51 9.38.51 9.38.51s7.5 0 9.38-.51a3.02 3.02 0 0 0 2.12-2.14C24 15.61 24 12 24 12s0-3.61-.5-5.5ZM9.6 15.57V8.43L15.82 12 9.6 15.57Z\"/></symbol> </svg>";


/* ===== codigo/js/formkit.core.js ===== */
/* =========================================================
   formkit.core.js · Estándar de formularios del SIA (SEDEMA) · v1.6.0

   Núcleo obligatorio. Lee la declaración de cada campo de sus ATRIBUTOS
   (required, data-formato, data-si, data-cruzada, data-uso…) y toma
   patrones, límites y mensajes de validaciones.config.js. Decisión C1:
   la superficie para quien programa es el HTML; la fuente de verdad de la
   validación es un solo archivo de configuración.

   Qué hace el núcleo: anuncios que también se ven, avisos (FormKit.aviso),
   preparación de cada campo (marca de obligatorio, ayuda, error, contador),
   visibilidad condicional, validación individual y cruzada con el momento
   acordado (decisión C5), resumen de errores con foco, borrador local, envío
   sin duplicados y registro de módulos. Todo lo demás es un módulo opcional
   (codigo/modulos/*) que se carga sólo si el formulario lo usa.

   Sin dependencias, sin manejadores en línea (eventos por delegación), sin
   valores fijos (todo viene de la configuración). Script clásico para que
   abra desde un archivo local.

   Orden del archivo: utilidades → configuración → instancia (campos,
   validación, resumen, condicionales, borrador, envío) → registro de
   módulos → arranque.
   ========================================================= */
(function (global) {
  'use strict';

  const BASE = global.FORMKIT_VALIDACIONES;
  if (!BASE) throw new Error('FormKit: falta validaciones.config.js; debe cargarse antes que formkit.core.js');

  /* ---------- Utilidades ---------- */
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const plantilla = BASE.plantilla;
  const BYTES_POR_MB = 1048576;
  const BYTES_POR_KB = 1024;
  const MS_POR_DIA = 86400000;
  /* Autocompletado de un secreto: nunca va al borrador del dispositivo. */
  const AUTOCOMPLETE_SECRETO = /(^|\s)(current-password|new-password|one-time-code|cc-[a-z-]+)$/;
  /* Un borrador del estándar: {v, t, datos}. */
  const esBorrador = (b) => !!b && typeof b === 'object' && typeof b.v === 'string' && typeof b.t === 'number' && !!b.datos && typeof b.datos === 'object';
  const vencido = (t, ttlDias) => Date.now() - t > ttlDias * MS_POR_DIA || t > Date.now() + MS_POR_DIA;
  /* Al abrir cualquier formulario se borran los borradores vencidos de todo el sitio, no
     sólo el suyo: en un equipo compartido no queda nada de nadie más allá de su caducidad. */
  let purgado = false;
  function purgaBorradoresVencidos(ttlDias) {
    if (purgado) return;
    purgado = true;
    try {
      const ls = global.localStorage;
      for (let i = ls.length - 1; i >= 0; i--) {
        const k = ls.key(i);
        let b = null;
        try { b = JSON.parse(ls.getItem(k)); } catch (e) { continue; }
        if (esBorrador(b) && vencido(b.t, ttlDias)) ls.removeItem(k);
      }
    } catch (e) { /* sin almacén */ }
  }
  const pesoTxt = (b) => (b < BYTES_POR_MB ? `${Math.max(1, Math.round(b / BYTES_POR_KB))} KB` : `${(b / BYTES_POR_MB).toFixed(1)} MB`);
  const normalizaBusqueda = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  let contadorIds = 0;
  const idUnico = (p) => `${p}-${++contadorIds}`;

  /* Fecha y hora para leer («17 de octubre de 2026 a las 23:27»), en la zona de la
     configuración y con su reloj: 24 horas salvo fechas.horas24 = false. */
  const relojDe = (cfg) => ((cfg.fechas || {}).horas24 === false ? 'h12' : 'h23');
  function fechaHora(valor, cfg = FormKit.config) {
    return new Date(valor).toLocaleString(cfg.idioma, { dateStyle: 'long', timeStyle: 'short', timeZone: (cfg.fechas || {}).zonaHoraria, hourCycle: relojDe(cfg) });
  }

  /* Fusión profunda de la configuración base con los ajustes del formulario
     (window.FORMKIT_CONFIG): el formulario sólo escribe lo que cambia. */
  function fusiona(base, extra) {
    if (!extra || typeof extra !== 'object' || Array.isArray(extra)) return extra === undefined ? base : extra;
    const out = Array.isArray(base) ? [...base] : { ...base };
    for (const k of Object.keys(extra)) out[k] = fusiona(base ? base[k] : undefined, extra[k]);
    return out;
  }

  /* localStorage puede no existir o lanzar (ventana privada). El formulario
     funciona sin él: sólo pierde el borrador y las sugerencias. */
  const memoria = new Map();
  const almacen = {
    lee(k) { try { return global.localStorage.getItem(k); } catch (e) { return memoria.has(k) ? memoria.get(k) : null; } },
    escribe(k, v) { try { global.localStorage.setItem(k, v); return true; } catch (e) { memoria.set(k, v); return false; } },
    borra(k) { try { global.localStorage.removeItem(k); } catch (e) { /* sin almacén */ } memoria.delete(k); }
  };

  /* Icono del sprite: <svg class="icono"><use href="#i-nombre"></use></svg> */
  function icono(nombre, clase = 'icono') {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', clase);
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    use.setAttribute('href', `#i-${nombre}`);
    svg.appendChild(use);
    return svg;
  }

  /* El sprite se inyecta una vez por página desde iconos.js (generado de
     codigo/iconos/sprite.svg). Si no se cargó, los iconos quedan vacíos y el
     texto que siempre los acompaña sigue diciendo lo mismo. */
  function inyectaSprite() {
    if (!global.FORMKIT_ICONOS || $('[data-sprite-iconos]')) return;
    const cont = document.createElement('div');
    cont.setAttribute('data-sprite-iconos', '');
    cont.hidden = true;
    cont.innerHTML = global.FORMKIT_ICONOS;
    document.body.prepend(cont);
  }

  /* ---------- Anuncios para lector de pantalla ----------
     Todo anuncio también se ve (FRM-40): lo que sólo oye el lector no existe
     para quien ve la pantalla. anuncia(texto, { visible: elemento }) escribe
     el texto también en ese elemento y lo muestra; sin él, lo anunciado ya
     debe estar en pantalla. El segundo argumento también puede ser true
     (asertivo), como antes. */
  let regionAnuncios = null;
  let temporizadorAnuncio = 0;
  function anuncia(texto, opciones = false) {
    const { cortes = false, visible = null } = opciones && typeof opciones === 'object' ? opciones : { cortes: opciones };
    if (visible) { ($('.aviso-texto', visible) || visible).textContent = texto; visible.hidden = false; }
    if (!regionAnuncios) {
      regionAnuncios = $('[data-anuncios]') || document.createElement('div');
      regionAnuncios.className = 'solo-lector';
      regionAnuncios.setAttribute('data-anuncios', '');
      if (!regionAnuncios.parentNode) document.body.appendChild(regionAnuncios);
    }
    regionAnuncios.setAttribute('aria-live', cortes ? 'assertive' : 'polite');
    clearTimeout(temporizadorAnuncio);
    regionAnuncios.textContent = '';
    temporizadorAnuncio = setTimeout(() => { regionAnuncios.textContent = texto; }, FormKit.config.anuncios.retardoMs);
  }

  /* ---------- Avisos (FRM-39) ----------
     FormKit.aviso(lugar, { tono, titulo, texto, pasos, foco }) pinta un aviso
     con el icono y el rol de su tono, su título, su texto y, si hay varias
     acciones en orden, su secuencia «qué sigue» (FRM-84). texto es una cadena
     (va en un <p>) o un nodo, por ejemplo un <p> con un enlace; pasos, una
     lista de cadenas o nodos. Si lugar ya es un .aviso, se pinta ahí; si no,
     va al principio de lugar y sustituye al que haya puesto antes. El cuerpo
     es un <div class="aviso-texto">: una lista no cabe en un <p>, así que un
     <p class="aviso"> se cambia por un <div> con sus mismos atributos (la
     función devuelve el aviso pintado). foco: true cuando responde a una
     acción de la persona. */
  const TONOS_AVISO = {
    neutro: { clase: '', icono: 'info', rol: '' },
    advertencia: { clase: 'aviso-advertencia', icono: 'alerta', rol: '' },
    bloqueo: { clase: 'aviso-bloqueo', icono: 'error', rol: 'alert' },
    ok: { clase: 'aviso-ok', icono: 'ok', rol: 'status' }
  };
  function aviso(lugar, { tono = 'neutro', titulo = '', texto = '', pasos = [], foco = false } = {}) {
    const t = TONOS_AVISO[tono] || TONOS_AVISO.neutro;
    let a = lugar.classList.contains('aviso') ? lugar : $(':scope > [data-aviso-formkit]', lugar);
    if (!a) { a = document.createElement('div'); a.dataset.avisoFormkit = ''; lugar.prepend(a); }
    if (a.tagName === 'P') { const d = document.createElement('div'); for (const at of [...a.attributes]) d.setAttribute(at.name, at.value); a.replaceWith(d); a = d; }
    a.className = ['aviso', t.clase, ...[...a.classList].filter((c) => !/^aviso(-|$)/.test(c))].filter(Boolean).join(' ');
    if (t.rol) a.setAttribute('role', t.rol); else a.removeAttribute('role');
    const cuerpo = document.createElement('div');
    cuerpo.className = 'aviso-texto';
    if (titulo) { const h = document.createElement('strong'); h.className = 'aviso-titulo'; h.textContent = titulo; cuerpo.appendChild(h); }
    for (const x of [].concat(texto)) if (x || x === 0) cuerpo.appendChild(x instanceof Node ? x : Object.assign(document.createElement('p'), { textContent: x }));
    const lista = [].concat(pasos).filter(Boolean);
    if (lista.length) {
      const ol = document.createElement('ol');
      ol.className = 'secuencia';
      for (const x of lista) { const li = document.createElement('li'); li.className = 'secuencia-item'; li.append(x instanceof Node ? x : String(x)); ol.appendChild(li); }
      cuerpo.appendChild(ol);
    }
    a.replaceChildren(icono(t.icono), cuerpo);
    a.hidden = false;
    if (foco) { a.tabIndex = -1; a.focus(); }
    /* Sin rol ni foco nadie lo leería: se anuncia, y ya está a la vista. */
    else if (!t.rol) anuncia([...cuerpo.querySelectorAll(':scope > *, li')].filter((e) => e.tagName !== 'OL').map((e) => e.textContent.trim()).join(' '));
    return a;
  }

  /* ---------- Registro de módulos ----------
     Un módulo declara el selector que lo activa y una función iniciar(form,
     ctx). El núcleo lo llama sólo si el formulario contiene ese selector. */
  const modulos = new Map();
  function registra(nombre, def) { modulos.set(nombre, def); }

  /* ---------- Instancia ---------- */
  function iniciar(formulario, opciones = {}) {
    const form = typeof formulario === 'string' ? $(formulario) : formulario;
    if (!form) throw new Error(`FormKit: no existe el formulario «${formulario}»`);
    /* Un formulario se inicia una sola vez: si ya arrancó solo al
       cargar, la llamada de la página le suma sus opciones (enviar, alEnviar…)
       y recibe la misma instancia, sin duplicar escuchas. */
    const previa = iniciados.get(form);
    if (previa) { Object.assign(previa.extra, opciones); return previa.instancia; }
    /* Opciones en dos capas. La de la página se lee en vivo (quien cambia
       FORMKIT_OPCIONES después de cargar lo ve aplicado) y una segunda llamada
       a iniciar le suma las suyas aparte, sin tocar las globales que comparten
       otros formularios. Encima, lo que escriben los módulos (el acuse
       encadena alEnviar), sólo para este formulario. */
    const base = opciones;
    const extra = {};
    const deModulos = {};
    const opcionesPagina = new Proxy({}, { get: (_, k) => (k in extra ? extra[k] : base[k]), has: (_, k) => k in extra || k in base });
    opciones = new Proxy({}, {
      get: (_, k) => (k in deModulos ? deModulos[k] : opcionesPagina[k]),
      set: (_, k, v) => { deModulos[k] = v; return true; },
      has: (_, k) => k in deModulos || k in opcionesPagina
    });
    const cfg = FormKit.config;
    const M = cfg.mensajes;
    const inicio = performance.now();
    form.setAttribute('novalidate', '');
    inyectaSprite();

    /* El estado de cada campo: dirty (se escribió), tocado (se salió de él). */
    const estado = new Map();
    const estadoDe = (n) => { if (!estado.has(n)) estado.set(n, { dirty: false, tocado: false }); return estado.get(n); };

    /* Tipos de campo que aportan los módulos (archivos, combo, mapa…).
       Cada uno declara cómo se lee su valor y su texto para la revisión. */
    const tipos = new Map();

    /* ----- Campos ----- */
    const envolturas = () => $$('[data-campo]', form);
    const envoltura = (n) => $(`[data-campo="${n}"]`, form);
    const nombres = () => envolturas().map((el) => el.dataset.campo);

    /* Un dato que calcula la página (data-auxiliar): no tiene controles, no
       se envía ni va al borrador, pero cuenta en condiciones y cruzadas. Su
       valor es el del input oculto (la envoltura misma o el que lleva dentro). */
    const valorAuxiliar = (el) => { const c = el.matches('input') ? el : $('input', el); return c ? String(c.value).trim() : String(el.dataset.valor || '').trim(); };

    function tipoDe(el) {
      if (el.hasAttribute('data-auxiliar')) return 'auxiliar';
      for (const [t, def] of tipos) if (def.detecta(el)) return t;
      if (el.matches('fieldset') || $$('input[type="radio"]', el).length > 1) return $$('input[type="checkbox"]', el).length > 1 ? 'multiple' : 'opcion';
      const c = $('input,select,textarea', el);
      if (c && c.type === 'checkbox') return $$('input[type="checkbox"]', el).length > 1 ? 'multiple' : 'casilla';
      if (c && c.tagName === 'SELECT') return 'select';
      return 'texto';
    }

    function controlesDe(n) {
      const el = envoltura(n);
      const t = tipoDe(el);
      if (t === 'auxiliar') return [];
      if (tipos.has(t)) return tipos.get(t).controles(el);
      if (t === 'opcion') return $$('input[type="radio"]', el);
      if (t === 'multiple') return $$('input[type="checkbox"]', el);
      return $$('input:not([type="hidden"]),select,textarea', el).filter((c) => !c.closest('[data-trampa]'));
    }
    const controlPrincipal = (n) => controlesDe(n)[0] || null;

    function valorDe(n) {
      const el = envoltura(n);
      const t = tipoDe(el);
      if (t === 'auxiliar') return valorAuxiliar(el);
      if (tipos.has(t)) return tipos.get(t).valorDe(el);
      if (t === 'opcion') { const r = $('input[type="radio"]:checked', el); return r ? r.value : ''; }
      if (t === 'multiple') return $$('input[type="checkbox"]:checked', el).map((c) => c.value);
      if (t === 'casilla') return $('input[type="checkbox"]', el).checked ? 'si' : '';
      const c = controlPrincipal(n);
      return c ? String(c.value).trim() : '';
    }

    function textoDeValor(n) {
      const el = envoltura(n);
      const t = tipoDe(el);
      if (t === 'auxiliar') return valorAuxiliar(el);
      if (tipos.has(t)) return tipos.get(t).textoDe(el);
      if (t === 'opcion') { const r = $('input[type="radio"]:checked', el); return r ? (textoDeOpcion(r)) : ''; }
      if (t === 'multiple') return $$('input[type="checkbox"]:checked', el).map(textoDeOpcion).join(', ');
      if (t === 'select') { const s = $('select', el); return s && s.value ? s.selectedOptions[0].textContent.trim() : ''; }
      if (t === 'casilla') return $('input', el).checked ? M.palabraSi : '';
      return valorDe(n);
    }
    function textoDeOpcion(input) {
      const lab = input.closest('label') || (input.id && $(`label[for="${input.id}"]`, form));
      const nombre = lab && ($('.opcion-nombre', lab) || lab);
      return nombre ? nombre.textContent.trim() : input.value;
    }

    /* Etiqueta visible del campo, sin la marca de obligatorio. */
    function etiquetaDe(n) {
      const el = envoltura(n);
      const e = $('.etiqueta', el) || $('legend,label', el);
      if (!e) return el.dataset.etiqueta || n;
      const c = e.cloneNode(true);
      $$('.marca-oblig,.solo-lector', c).forEach((x) => x.remove());
      const texto = c.textContent.replace(/\s+/g, ' ').trim();
      /* Dentro de un grupo repetible, la etiqueta dice de qué fila es: «Nombre (Acompañante 2)». */
      const fila = el.closest('.repetible-fila');
      const tituloFila = fila && $('.repetible-titulo', fila);
      return tituloFila && tituloFila.textContent.trim() ? `${texto} (${tituloFila.textContent.trim()})` : texto;
    }

    const esObligatorio = (n) => { const el = envoltura(n); return el.hasAttribute('data-requerido') || controlesDe(n).some((c) => c.required); };

    /* Un campo cuenta sólo si está activo: visible y sin un ancestro
       condicional oculto. El inactivo no se valida, no se revisa y no viaja. */
    function activo(n) {
      let el = envoltura(n);
      /* Un paso oculto no desactiva sus campos: sólo cambia qué se ve. */
      while (el && el !== form) { if (el.hidden && !el.hasAttribute('data-paso')) return false; el = el.parentElement; }
      return true;
    }

    /* Atributos de validación del control, leídos una vez por llamada. */
    function atributosDe(n) {
      const c = controlPrincipal(n) || envoltura(n);
      const a = {};
      for (const k of ['min', 'max', 'step', 'minlength', 'maxlength']) if (c.hasAttribute(k)) a[k] = c.getAttribute(k);
      if (c.hasAttribute('data-legible')) a.legible = true;
      for (const [k, v] of Object.entries(envoltura(n).dataset)) a[k] = v;
      /* Mínimo o máximo que dependen de otras respuestas: data-min-segun="clave"
         usa la función FORMKIT_CONFIG.limitesSegun[clave](datos); el servidor
         recibe la misma función en opciones.limitesSegun. */
      for (const [lim, clave] of [['min', a.minSegun], ['max', a.maxSegun]]) {
        const fn = clave && cfg.limitesSegun && cfg.limitesSegun[clave];
        if (typeof fn !== 'function') continue;
        const r = fn(datosActuales());
        if (r !== undefined && r !== null && r !== '') a[lim] = String(r);
      }
      return a;
    }
    /* Valores de los campos activos, para las funciones que dependen de otras respuestas. */
    const datosActuales = () => Object.fromEntries(nombres().filter((m) => activo(m)).map((m) => [m, valorDe(m)]));

    /* Ayuda de bloque (.ayuda-bloque): una sola ayuda bajo el título de una
       sección que vale igual para todos sus campos (nombre y apellidos). Cubre
       los campos que le siguen dentro de su contenedor, hasta el siguiente
       título o la siguiente ayuda de bloque, y se enlaza a cada uno. */
    function ayudasDeBloque(el) {
      const ids = [];
      for (const ab of $$('.ayuda-bloque', form)) {
        if (!ab.textContent.trim()) continue;
        for (let s = ab.nextElementSibling; s; s = s.nextElementSibling) {
          if (/^H[1-6]$/.test(s.tagName) || s.classList.contains('ayuda-bloque')) break;
          if (s === el || s.contains(el)) { ab.id = ab.id || idUnico('ayuda-bloque'); ids.push(ab.id); break; }
        }
      }
      return ids;
    }

    /* ----- Preparación de cada campo ----- */
    function preparaCampo(n) {
      const el = envoltura(n);
      const t = tipoDe(el);
      if (t === 'auxiliar') return;
      const etq = $('.etiqueta', el);
      if (etq && esObligatorio(n) && !$('.marca-oblig', etq)) {
        const ast = document.createElement('span');
        ast.className = 'marca-oblig';
        ast.setAttribute('aria-hidden', 'true');
        ast.textContent = '*';
        const pal = document.createElement('span');
        pal.className = 'solo-lector';
        pal.textContent = ` (${M.palabraObligatorio})`;
        etq.append(ast, pal);
      }
      const ayuda = $('.ayuda', el);
      if (ayuda && !ayuda.id) ayuda.id = idUnico(`ayuda-${n}`);

      let err = $('.err', el);
      if (!err) {
        err = document.createElement('p');
        err.className = 'err';
        err.append(icono('error', 'icono icono-sm err-icono'), document.createElement('span'));
        /* El error va al final de la envoltura: después del control y de la
           lista de opciones, nunca entre la etiqueta y el control. */
        el.appendChild(err);
      }
      err.id = err.id || idUnico(`err-${n}`);

      const deBloque = ayudasDeBloque(el);
      for (const c of controlesDe(n)) {
        const ids = [...deBloque, ayuda && ayuda.textContent.trim() ? ayuda.id : '', err.id].filter(Boolean).join(' ');
        c.setAttribute('aria-describedby', ids);
        /* aria-required sólo en controles de formulario: un botón (la zona de
           carga de archivos) no lo admite; ahí lo dicen el asterisco y el error. */
        if (esObligatorio(n) && /^(INPUT|SELECT|TEXTAREA)$/.test(c.tagName) && c.type !== 'radio' && c.type !== 'checkbox') c.setAttribute('aria-required', 'true');
        const f = cfg.formatos[el.dataset.formato];
        if (f && f.inputmode && !c.hasAttribute('inputmode') && c.tagName === 'INPUT') c.setAttribute('inputmode', f.inputmode);
        if (c.tagName === 'INPUT' && !c.hasAttribute('enterkeyhint') && c.type !== 'radio' && c.type !== 'checkbox' && c.type !== 'file') c.setAttribute('enterkeyhint', 'next');
      }

      /* Fecha y hora: límites por omisión (hoy) cuando el campo lo declara. */
      const ctl = controlPrincipal(n);
      if (ctl && el.dataset.formato === 'fecha' && el.hasAttribute('data-no-futura') && !ctl.max) ctl.max = cfg.hoyISO();

      /* Contraseña: botón «Mostrar» / «Ocultar» dentro del campo, a la derecha
         (aria-pressed), para revisar lo escrito; el control va en
         .contrasena-caja, que en una .fila ocupa el renglón del control. Se
         omite con data-sin-mostrar en el campo. */
      if (ctl && ctl.type === 'password' && !el.hasAttribute('data-sin-mostrar') && !$('[data-ver-contrasena]', el)) {
        if (!ctl.id) ctl.id = idUnico(`c-${n}`);
        let caja = ctl.closest('.contrasena-caja');
        if (!caja) { caja = document.createElement('div'); caja.className = 'contrasena-caja'; ctl.replaceWith(caja); caja.appendChild(ctl); }
        const ver = document.createElement('button');
        ver.type = 'button';
        ver.className = 'contrasena-ver';
        ver.dataset.verContrasena = '';
        ver.setAttribute('aria-pressed', 'false');
        ver.setAttribute('aria-controls', ctl.id);
        const t = document.createElement('span'); t.dataset.verTexto = ''; t.textContent = M.contrasenaMostrar;
        const lector = document.createElement('span'); lector.className = 'solo-lector'; lector.textContent = plantilla(M.contrasenaLector, { etiqueta: etiquetaDe(n) }); /* nombre único: «Mostrar: Contraseña», «Mostrar: Confirma tu contraseña» */
        ver.append(t, lector);
        caja.appendChild(ver);
      }

      /* Texto largo: contador y crecimiento automático. */
      const area = t === 'texto' ? $('textarea', el) : null;
      if (area) {
        if (area.maxLength > 0 && !$('.contador', el)) {
          const cont = document.createElement('p');
          cont.className = 'contador';
          cont.setAttribute('aria-hidden', 'true');
          area.insertAdjacentElement('afterend', cont);
        }
        actualizaContador(n);
        autoAlto(area);
      }
    }

    function actualizaContador(n) {
      const el = envoltura(n);
      const cont = $('.contador', el);
      const area = $('textarea', el);
      if (cont && area) cont.textContent = `${area.value.length} / ${area.maxLength}`;
    }
    function autoAlto(area) { area.style.height = 'auto'; area.style.height = `${area.scrollHeight}px`; }

    /* ----- Validación individual ----- */
    function normalizaCampo(n) {
      const el = envoltura(n);
      const f = cfg.formatos[el.dataset.formato];
      const c = controlPrincipal(n);
      if (!f || !c || c.tagName === 'SELECT' || c.type === 'file' || c.type === 'checkbox' || c.type === 'radio') return;
      const limpio = f.normaliza(c.value);
      if (limpio !== c.value) c.value = limpio;
    }

    function validaCampo(n) {
      if (!activo(n)) return '';
      const el = envoltura(n);
      const t = tipoDe(el);
      if (t === 'auxiliar') return '';
      const v = valorDe(n);
      const vacio = Array.isArray(v) ? v.length === 0 : !v;
      const datos = { etiqueta: etiquetaDe(n) };
      if (vacio) {
        if (!esObligatorio(n)) return '';
        if (el.dataset.mensaje) return el.dataset.mensaje;
        const clave = { opcion: 'obligatorioOpcion', multiple: 'obligatorioOpcion', select: 'obligatorioOpcion', casilla: 'obligatorioCasilla', archivos: 'obligatorioArchivos', combo: 'obligatorioOpcion' }[t] || 'obligatorioTexto';
        return plantilla(M[clave], datos);
      }
      if (t === 'multiple') {
        const a = atributosDe(n);
        if (a.minOpciones && v.length < Number(a.minOpciones)) return plantilla(M.minimoOpciones, { ...datos, min: a.minOpciones });
        if (a.maxOpciones && v.length > Number(a.maxOpciones)) return plantilla(M.maximoOpciones, { ...datos, max: a.maxOpciones });
        return '';
      }
      if (tipos.has(t) && tipos.get(t).valida) return tipos.get(t).valida(el, v, atributosDe(n)) || '';
      if (t === 'casilla' || t === 'opcion' || t === 'select') return '';
      const a = atributosDe(n);
      const nombreFormato = el.dataset.formato || ($('textarea', el) || a.legible ? 'texto' : '');
      const f = cfg.formatos[nombreFormato];
      if (f) {
        const msg = f.valida(f.normaliza(v), a, cfg);
        if (msg) return msg;
      } else if (a.minlength && v.length < Number(a.minlength)) return plantilla(M.minimoCaracteres, { ...datos, min: a.minlength, n: v.length });
      return '';
    }

    /* Sugerencia sin bloqueo (por ejemplo, dominio de correo mal escrito). */
    function sugerenciaDe(n) {
      const el = envoltura(n);
      const f = cfg.formatos[el.dataset.formato];
      return f && f.sugiere ? f.sugiere(valorDe(n), cfg) : '';
    }

    function marca(n, mensaje, nivel = 'error') {
      const el = envoltura(n);
      const err = $('.err', el);
      if (!err) return;
      if (nivel === 'error') for (const c of controlesDe(n)) c.setAttribute('aria-invalid', 'true');
      err.dataset.nivel = nivel;
      err.lastElementChild.textContent = `${nivel === 'error' ? M.prefijoError : M.advertencia} ${mensaje}`;
      $('use', err).setAttribute('href', nivel === 'error' ? '#i-error' : '#i-alerta');
    }

    function limpia(n) {
      const el = envoltura(n);
      for (const c of controlesDe(n)) c.removeAttribute('aria-invalid');
      const err = $('.err', el);
      if (err) {
        /* Si este campo mostraba una cruzada, los otros campos que marcó también se liberan. */
        for (const otro of (err.dataset.cruzadaCampos || '').split(' ').filter(Boolean)) if (otro !== n && envoltura(otro)) for (const c of controlesDe(otro)) { c.removeAttribute('aria-invalid'); c.setAttribute('aria-describedby', (c.getAttribute('aria-describedby') || '').split(' ').filter((x) => x && x !== err.id).join(' ')); }
        err.lastElementChild.textContent = ''; delete err.dataset.nivel; delete err.dataset.cruzada; delete err.dataset.cruzadaCampos;
      }
      /* Si este campo participa en una cruzada que marcó al otro, también se limpia. */
      for (const otro of camposCruzadosCon(n)) { const e2 = $('.err', envoltura(otro)); if (e2 && e2.dataset.cruzada === n) { e2.lastElementChild.textContent = ''; delete e2.dataset.cruzada; delete e2.dataset.nivel; for (const c of controlesDe(otro)) c.removeAttribute('aria-invalid'); } }
    }

    /* ----- Validaciones cruzadas -----
       Se declaran en el campo que muestra el mensaje:
         data-cruzada="curp-fecha" data-cruzada-campos="curp=curp fecha=nacimiento"
         data-cruzada-nivel="advertencia"  (opcional: degrada el bloqueo) */
    function cruzadasDe(n) {
      const el = envoltura(n);
      if (!el.dataset.cruzada) return [];
      return el.dataset.cruzada.split(/\s+/).filter(Boolean).map((clave, i) => {
        const mapa = {};
        for (const par of (el.dataset.cruzadaCampos || '').split(/\s+/).filter(Boolean)) { const [rol, campo] = par.split('='); mapa[rol] = campo || rol; }
        return { clave, mapa, nivel: el.dataset.cruzadaNivel || (cfg.cruzadas[clave] && cfg.cruzadas[clave].bloquea === false ? 'advertencia' : 'error'), indice: i };
      });
    }
    function camposCruzadosCon(n) {
      const out = new Set();
      for (const m of nombres()) for (const c of cruzadasDe(m)) if (Object.values(c.mapa).includes(n) || m === n) { out.add(m); for (const v of Object.values(c.mapa)) out.add(v); }
      out.delete(n);
      return [...out];
    }
    /* Campos que declaran una cruzada en la que participa n. */
    function declarantesDe(n) {
      return nombres().filter((m) => m !== n && cruzadasDe(m).some((c) => Object.values(c.mapa).includes(n)));
    }
    function validaCruzadas(n) {
      const resultados = [];
      for (const c of cruzadasDe(n)) {
        const def = cfg.cruzadas[c.clave];
        if (!def) continue;
        const valores = {};
        let listo = true;
        /* Un rol declarado en def.opcionales corre vacío: así se puede exigir
           algo justo cuando ese dato falta (sin segundo apellido, X en la CURP). */
        const opcionales = def.opcionales || [];
        for (const rol of def.campos) {
          const campo = c.mapa[rol] || rol;
          const v = envoltura(campo) && activo(campo) ? valorDe(campo) : '';
          if (!v && opcionales.includes(rol)) { valores[rol] = ''; continue; }
          if (!v || validaCampo(campo)) { listo = false; break; }
          const f = cfg.formatos[envoltura(campo).dataset.formato];
          valores[rol] = f ? f.normaliza(v) : v;
        }
        if (!listo) continue;
        const extra = { ...envoltura(n).dataset };
        if (extra.catalogo && global.FORMKIT_CATALOGOS) { const cat = global.FORMKIT_CATALOGOS[extra.catalogo]; extra.catalogo = cat && cat.filas ? cat.filas : cat; }
        const msg = def.valida(valores, extra, cfg);
        if (msg) resultados.push({ mensaje: msg, nivel: c.nivel, campos: Object.values(c.mapa) });
      }
      return resultados;
    }

    /* Valida un campo con sus cruzadas y pinta el resultado. Devuelve el
       mensaje bloqueante o ''. */
    function validaYPinta(n) {
      const msg = validaCampo(n);
      if (msg) { marca(n, msg); return msg; }
      limpia(n);
      const cruz = validaCruzadas(n);
      const bloquea = cruz.find((c) => c.nivel === 'error');
      const aviso = cruz.find((c) => c.nivel !== 'error');
      if (bloquea) {
        marca(n, bloquea.mensaje);
        const err = $('.err', envoltura(n));
        err.dataset.cruzada = n;
        err.dataset.cruzadaCampos = bloquea.campos.join(' ');
        for (const otro of bloquea.campos) if (otro !== n) for (const c of controlesDe(otro)) { c.setAttribute('aria-invalid', 'true'); if (!(c.getAttribute('aria-describedby') || '').includes(err.id)) c.setAttribute('aria-describedby', `${c.getAttribute('aria-describedby') || ''} ${err.id}`.trim()); }
        return bloquea.mensaje;
      }
      if (aviso) { marca(n, aviso.mensaje, 'advertencia'); return ''; }
      /* Sugerencias sin bloqueo: la del formato (dominio de correo) y las que
         registren los módulos (por ejemplo, «Otro» que repite una opción). */
      let sug = sugerenciaDe(n);
      for (const fn of ctx.sugerencias) if (!sug) sug = fn(n) || '';
      if (sug) marca(n, sug, 'advertencia');
      return '';
    }

    /* Valida todos los campos activos de un contenedor (paso o formulario). */
    function validaContenedor(cont) {
      const fallos = [];
      for (const el of $$('[data-campo]', cont)) {
        const n = el.dataset.campo;
        if (!activo(n)) { limpia(n); continue; }
        estadoDe(n).tocado = true;
        normalizaCampo(n);
        const msg = validaYPinta(n);
        if (msg) fallos.push({ campo: n, mensaje: msg });
      }
      return fallos;
    }

    /* ----- Resumen de errores (FRM-28) ----- */
    function quitaResumen(cont = form) { for (const r of $$('.resumen-errores', cont)) r.remove(); }

    /* El resumen dice de qué respuesta se trata: si varias tienen la misma
       etiqueta («Decisión» en cada documento), data-contexto en el campo o en
       un elemento que lo rodea («Identificación oficial») va antes del mensaje. */
    function contextoDe(n) {
      const e = envoltura(n);
      const c = e && e.closest('[data-contexto]');
      return c ? c.dataset.contexto.trim() : '';
    }

    /* origen 'servidor': el título dice que el envío no se completó. */
    function muestraResumen(cont, fallos, origen = '') {
      quitaResumen(cont);
      if (!fallos.length) return null;
      const r = document.createElement('div');
      r.className = 'resumen-errores';
      r.setAttribute('role', 'alert');
      r.tabIndex = -1;
      const tit = document.createElement('p');
      tit.className = 'resumen-errores-titulo';
      const n = fallos.length;
      const titulo = origen === 'servidor'
        ? (n === 1 ? M.resumenServidorUno : plantilla(M.resumenServidorVarios, { n }))
        : (n === 1 ? M.resumenUno : plantilla(M.resumenVarios, { n }));
      tit.append(icono('error'), document.createTextNode(titulo));
      const ul = document.createElement('ul');
      ul.className = 'resumen-errores-lista';
      for (const f of fallos) {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.className = 'resumen-errores-enlace';
        const c = controlPrincipal(f.campo);
        if (c && !c.id) c.id = idUnico(`c-${f.campo}`);
        a.href = `#${c ? c.id : ''}`;
        a.dataset.irCampo = f.campo;
        const contexto = contextoDe(f.campo);
        a.textContent = contexto ? plantilla(M.resumenContexto, { contexto, mensaje: f.mensaje }) : f.mensaje;
        li.appendChild(a);
        ul.appendChild(li);
      }
      r.append(tit, ul);
      /* Antes del primer campo del contenedor, después del título y la bajada. */
      const primero = $('[data-campo],.leyenda-oblig', cont);
      if (primero && primero.parentNode === cont) cont.insertBefore(r, primero); else cont.prepend(r);
      r.focus();
      return r;
    }

    function enfocaCampo(n) {
      const ctls = controlesDe(n);
      const ctl = ctls.find((x) => x.type !== 'radio' || x.checked) || ctls[0];
      if (ctl) ctl.focus();
    }

    /* Cuando ya no queda ningún campo con error, el resumen sobra. */
    function revisaResumen() {
      if (!$('[aria-invalid="true"]', form)) quitaResumen();
    }

    /* ----- Visibilidad condicional -----
       data-si="campo=valor|valor2" en cualquier elemento. El valor de un grupo
       de casillas cuenta si alguna marcada coincide. Oculto = inactivo, y lo
       escrito dentro se conserva (la opción «Otro» recupera su texto). */
    /* Un campo oculto no tiene valor para las condiciones: lo que dependía de
       él también se oculta (condiciones encadenadas, igual que en el servidor). */
    function valorParaCondicion(nombre) {
      if (envoltura(nombre)) { if (!activo(nombre)) return []; const v = valorDe(nombre); return Array.isArray(v) ? v : [v]; }
      const ctls = $$(`[name="${nombre}"]`, form);
      const marcados = ctls.filter((c) => (c.type === 'radio' || c.type === 'checkbox') ? c.checked : true);
      return marcados.map((c) => c.value);
    }
    function aplicaCondicionales() {
      /* Se repite hasta que nada cambie: ocultar un campo puede ocultar lo que dependía de él. */
      for (let vuelta = 0, cambio = true; cambio && vuelta < 20; vuelta++) {
        cambio = false;
        for (const el of $$('[data-si]', form)) {
          const [campo, lista] = el.dataset.si.split('=');
          const admitidos = (lista || '').split('|');
          const actuales = valorParaCondicion(campo.trim());
          const visible = actuales.some((v) => admitidos.includes(v));
          if (el.hidden === visible) {
            el.hidden = !visible;
            cambio = true;
            /* Un campo que se oculta pierde su error: ya no cuenta. */
            if (!visible) for (const c of $$('[data-campo]', el)) limpia(c.dataset.campo);
            if (el.hasAttribute('data-campo') && !visible) limpia(el.dataset.campo);
          }
        }
      }
    }

    /* ----- Borrador local -----
       Se activa con data-borrador="clave" en el <form>. Versionado con
       data-borrador-version. Excluye campos data-sensible y archivos (éstos, sólo
       con un proveedor que dé la página: opciones.borradorArchivos, en archivos.js). */
    const claveBorrador = form.dataset.borrador || '';
    const versionBorrador = form.dataset.borradorVersion || '1';
    let temporizadorBorrador = 0;
    let temporizadorGuardado = 0;
    let arrancado = false;
    let terminado = false;
    const indicador = $('[data-guardado]');
    const franja = $('[data-franja-borrador]');
    /* Lo que la página escribe sola (al precargar una solicitud para continuarla) no es
       un borrador de la persona: el borrador empieza con su primer gesto en el formulario
       (un evento confiable: escribir, elegir, tocar, soltar un archivo). Lo que cambien
       después la página o los módulos entra en el mismo borrador. */
    let personaActuo = false;
    /* Un formulario que sigue en pantalla después de un envío logrado (captura en
       serie) empieza otro registro con el siguiente gesto: vuelve el borrador y la
       clave de idempotencia es otra. */
    for (const t of ['input', 'change', 'click', 'drop']) form.addEventListener(t, (e) => { if (!e.isTrusted) return; personaActuo = true; if (terminado) { terminado = false; idempotencia = ''; } }, true);
    /* Mientras la franja espera que la persona elija «Recuperar» o «Empezar de nuevo»,
       no se escribe nada: lo que escriba antes no reemplaza al borrador guardado. */
    let franjaPendiente = false;
    /* Lo que va en el borrador además de los datos (los archivos, con su proveedor; las
       filas de un repetible): el módulo se suscribe y el núcleo le avisa al escribir,
       restaurar o borrar el borrador. Con estado() aporta campos propios al borrador y
       con prepara(b) rehace su estructura (las filas) antes de que se repongan los valores. */
    const suscritosBorrador = [];
    const alBorrador = (def) => { suscritosBorrador.push(def); };
    const avisaBorrador = (accion, b) => { for (const x of suscritosBorrador) if (x[accion]) x[accion](b); };
    function borraBorrador() { almacen.borra(claveBorrador); avisaBorrador('borra'); }
    /* Lo que nunca va al borrador del dispositivo: lo sensible (data-sensible), toda
       contraseña o código aunque el campo no lo declare, y lo que se calcula de algo que
       no va (la fecha que sale de la CURP, la edad que sale de esa fecha). */
    function fueraDelBorrador() {
      const fuera = new Set();
      for (const n of nombres()) {
        const el = envoltura(n);
        const c = controlPrincipal(n);
        const ac = c ? c.getAttribute('autocomplete') || '' : '';
        if (el.hasAttribute('data-sensible') || el.dataset.formato === 'contrasena' || (c && c.type === 'password') || AUTOCOMPLETE_SECRETO.test(ac)) fuera.add(n);
      }
      const pendientes = [...fuera];
      while (pendientes.length) {
        const el = envoltura(pendientes.pop());
        const deriva = el && el.dataset.deriva ? el.dataset.deriva : '';
        for (const par of deriva.split(/\s+/).filter(Boolean)) {
          const destino = par.split('=')[1];
          if (destino && !fuera.has(destino) && envoltura(destino)) { fuera.add(destino); pendientes.push(destino); }
        }
      }
      return fuera;
    }
    /* «No guardar en este equipo» ([data-borrador="no-guardar"]): mientras la pestaña siga
       abierta, nada se guarda en el dispositivo. */
    const claveNoGuardar = `${claveBorrador}:no-guardar`;
    let noGuardar = false;
    try { noGuardar = !!claveBorrador && global.sessionStorage.getItem(claveNoGuardar) === '1'; } catch (e) { /* sin almacén de sesión */ }

    function programaBorrador() {
      if (!claveBorrador || !arrancado || terminado || !personaActuo || franjaPendiente || noGuardar) return;
      clearTimeout(temporizadorBorrador);
      temporizadorBorrador = setTimeout(escribeBorrador, cfg.borrador.retardoMs);
    }
    function datosBorrador() {
      const datos = {};
      const fuera = fueraDelBorrador();
      for (const n of nombres()) {
        const el = envoltura(n);
        if (fuera.has(n) || tipoDe(el) === 'auxiliar' || tipos.has(tipoDe(el)) && !tipos.get(tipoDe(el)).enBorrador) continue;
        datos[n] = valorDe(n);
      }
      return datos;
    }
    function escribeBorrador() {
      const extra = FormKit.ganchos.estadoBorrador ? FormKit.ganchos.estadoBorrador(form) : {};
      for (const x of suscritosBorrador) if (x.estado) Object.assign(extra, x.estado());
      const ok = almacen.escribe(claveBorrador, JSON.stringify({ v: versionBorrador, t: Date.now(), datos: datosBorrador(), ...extra }));
      avisaBorrador('escribe');
      if (ok && indicador) {
        indicador.textContent = M.borradorGuardado;
        indicador.setAttribute('data-visible', '');
        clearTimeout(temporizadorGuardado);
        temporizadorGuardado = setTimeout(() => indicador.removeAttribute('data-visible'), cfg.borrador.visibleMs);
      }
    }
    /* Si la persona cierra o cambia de pestaña antes de que venza el retardo,
       el borrador pendiente se escribe en ese momento. */
    window.addEventListener('pagehide', () => { if (temporizadorBorrador && claveBorrador && arrancado && !terminado && !franjaPendiente && !noGuardar) { clearTimeout(temporizadorBorrador); escribeBorrador(); } });
    function dejaDeGuardar() {
      noGuardar = true;
      clearTimeout(temporizadorBorrador);
      borraBorrador();
      try { global.sessionStorage.setItem(claveNoGuardar, '1'); } catch (e) { /* sin almacén de sesión: dura hasta recargar */ }
      if (franja) { franja.hidden = true; franjaPendiente = false; }
      aviso(form, { tono: 'neutro', texto: M.borradorNoGuardar, foco: true });
    }
    document.addEventListener('click', (e) => { const b = e.target.closest && e.target.closest('[data-borrador="no-guardar"]'); if (b && claveBorrador && (form.contains(b) || (franja && franja.contains(b)))) dejaDeGuardar(); });

    function leeBorrador() {
      const crudo = almacen.lee(claveBorrador);
      if (!crudo) return null;
      try {
        const b = JSON.parse(crudo);
        if (!esBorrador(b) || b.v !== versionBorrador || vencido(b.t, cfg.borrador.ttlDias)) { borraBorrador(); return null; }
        return b;
      } catch (e) { borraBorrador(); return null; }
    }
    function restauraBorrador(b) {
      avisaBorrador('prepara', b);
      for (const [n, v] of Object.entries(b.datos || {})) {
        const el = envoltura(n);
        if (!el) continue;
        const t = tipoDe(el);
        if (tipos.has(t)) { if (tipos.get(t).restaura) tipos.get(t).restaura(el, v); continue; }
        if (t === 'opcion') { const r = $$('input[type="radio"]', el).find((x) => x.value === v); if (r) r.checked = true; }
        else if (t === 'multiple') $$('input[type="checkbox"]', el).forEach((c) => { c.checked = (v || []).includes(c.value); });
        else if (t === 'casilla') $('input', el).checked = !!v;
        else { const c = controlPrincipal(n); if (c) { c.value = v; if (c.tagName === 'SELECT') c.toggleAttribute('data-vacio', !c.value); } }
      }
      aplicaCondicionales();
      for (const n of nombres()) { actualizaContador(n); const a = $('textarea', envoltura(n)); if (a) autoAlto(a); }
      if (FormKit.ganchos.restauraBorrador) FormKit.ganchos.restauraBorrador(form, b);
      avisaBorrador('restaura', b);
      anuncia(M.borradorRecuperado);
    }
    function iniciaFranja(b) {
      franja.hidden = false;
      franjaPendiente = true;
      const f = $('[data-borrador-fecha]', franja);
      if (f) f.textContent = fechaHora(b.t, cfg);
      /* Con la respuesta de la persona, el borrador vuelve a guardarse con lo que haya en pantalla. */
      const contesta = () => { franja.hidden = true; franjaPendiente = false; programaBorrador(); };
      franja.addEventListener('click', (e) => {
        const a = e.target.closest('[data-borrador]');
        if (!a) return;
        const confirma = $('[data-borrador-confirma]', franja);
        if (a.dataset.borrador === 'recuperar') { restauraBorrador(b); contesta(); }
        else if (a.dataset.borrador === 'descartar') { if (confirma) { confirma.hidden = false; const seguro = $('[data-borrador="conservar"]', franja); if (seguro) seguro.focus(); } else { borraBorrador(); contesta(); } }
        else if (a.dataset.borrador === 'descartar-si') { borraBorrador(); contesta(); }
        else if (a.dataset.borrador === 'conservar') { confirma.hidden = true; $('[data-borrador="recuperar"]', franja).focus(); }
      });
    }

    /* ----- Envío ----- */
    function arma() {
      const datos = {};
      for (const n of nombres()) {
        if (!activo(n)) continue;
        const el = envoltura(n);
        const t = tipoDe(el);
        if (t === 'auxiliar' || (tipos.has(t) && tipos.get(t).fueraDeDatos)) continue;
        normalizaCampo(n);
        const v = valorDe(n);
        if (Array.isArray(v) ? v.length : v) datos[n] = v;
      }
      const trampa = $('[data-trampa] input, input[data-trampa]', form);
      const payload = { datos, meta: { version_formulario: versionBorrador, ms_en_formulario: Math.round(performance.now() - inicio), trampa: trampa ? trampa.value : '', idempotencia: claveIdempotencia() } };
      for (const def of tipos.values()) if (def.alArmar) def.alArmar(form, payload);
      return payload;
    }
    /* La clave de idempotencia es la misma mientras no se logre enviar: si
       la persona reintenta, el servidor reconoce el duplicado. */
    let idempotencia = '';
    function claveIdempotencia() { if (!idempotencia) idempotencia = (global.crypto && crypto.randomUUID) ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`; return idempotencia; }

    function envioPorOmision(payload, { signal }) {
      const destino = form.getAttribute('action');
      if (!destino || destino === '#') return Promise.reject(new Error('FormKit: el formulario no declara action ni opciones.enviar'));
      return fetch(destino, { method: form.getAttribute('method') || 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': payload.meta.idempotencia }, body: JSON.stringify(payload), signal })
        .then(async (r) => {
          if (r.status === 429) { const e = new Error('limite'); e.limite = true; throw e; }
          if (!r.ok) {
            /* Un rechazo con {errores: [{campo, mensaje}]}, la misma forma que devuelve validar.mjs, se pinta en cada campo. */
            const e = new Error(`HTTP ${r.status}`);
            const cuerpo = await r.json().catch(() => null);
            if (cuerpo && Array.isArray(cuerpo.errores)) e.errores = cuerpo.errores;
            throw e;
          }
          /* Un 2xx es un envío recibido aunque no traiga JSON (204, «OK»): no se le dice a la persona que falló. */
          const texto = await r.text().catch(() => '');
          try { return texto ? JSON.parse(texto) : {}; } catch (e) { return {}; }
        });
    }

    /* Marca un campo con un error que viene de fuera (por ejemplo, del
       servidor: «Ya hay una cuenta con esta CURP»). Devuelve false si el
       campo no existe en este formulario. */
    function marcaError(n, mensaje) {
      if (!envoltura(n)) return false;
      estadoDe(n).tocado = true;
      marca(n, mensaje);
      return true;
    }

    function botonEnviar() { return $('[data-accion="enviar"],button[type="submit"]', form); }

    async function enviar() {
      /* Al enviar, la contraseña vuelve a ocultarse: que el navegador no la guarde ni la muestre como texto. */
      for (const b of $$('[data-ver-contrasena][aria-pressed="true"]', form)) verContrasena(b, false);
      /* Un módulo (pasos) puede validar por su cuenta; si devuelve null, el formulario no es suyo. */
      const porModulo = FormKit.ganchos.validaTodo ? FormKit.ganchos.validaTodo(form) : null;
      const fallos = porModulo || validaContenedor(form);
      if (fallos.length) { if (!porModulo) muestraResumen(form, fallos); return false; }
      const boton = botonEnviar();
      const avisoEnvio = $('[data-estado-envio]', form);
      if (avisoEnvio) avisoEnvio.hidden = true;
      const textoOriginal = boton ? boton.textContent : '';
      if (boton) { boton.setAttribute('aria-disabled', 'true'); boton.setAttribute('aria-busy', 'true'); boton.textContent = M.enviando; }
      const control = new AbortController();
      const plazo = setTimeout(() => control.abort(), cfg.envio.timeoutMs);
      let respuesta;
      try {
        for (const def of tipos.values()) if (def.antesDeEnviar) await def.antesDeEnviar(form);
        const enviarFn = opciones.enviar || envioPorOmision;
        respuesta = await enviarFn(arma(), { signal: control.signal });
      } catch (e) {
        /* Errores por campo devueltos por el servidor: junto a cada campo y en el resumen. */
        const porCampo = e && Array.isArray(e.errores) ? e.errores.filter((x) => x && marcaError(x.campo, x.mensaje)) : [];
        if (porCampo.length) {
          const fallos = porCampo.map((x) => ({ campo: x.campo, mensaje: x.mensaje }));
          if (!(FormKit.ganchos.erroresServidor && FormKit.ganchos.erroresServidor(form, fallos))) muestraResumen(form, fallos, 'servidor');
          if (opciones.alFallar) opciones.alFallar(e, form);
          return false;
        }
        const texto = e && e.limite ? M.envioLimite : control.signal.aborted ? M.envioTimeout : M.envioError;
        if (avisoEnvio) { $('.aviso-texto', avisoEnvio).textContent = texto; avisoEnvio.hidden = false; avisoEnvio.focus(); } else anuncia(texto, true);
        if (opciones.alFallar) opciones.alFallar(e, form);
        return false;
      } finally {
        clearTimeout(plazo);
        if (boton) { boton.removeAttribute('aria-disabled'); boton.removeAttribute('aria-busy'); boton.textContent = textoOriginal; }
      }
      /* Recibido. Desde aquí nada cuenta como envío fallido: si la página falla al
         mostrar el acuse, la persona no debe reenviar. El borrador se borra después
         de mostrar el acuse, y la clave se renueva para el siguiente registro. */
      terminado = true;
      idempotencia = '';
      clearTimeout(temporizadorBorrador);
      const recibido = respuesta && typeof respuesta === 'object' ? respuesta : {};
      try { if (opciones.alEnviar) opciones.alEnviar(recibido, form); else form.dispatchEvent(new CustomEvent('formkit:enviado', { detail: recibido })); }
      catch (e) { console.error('FormKit: el envío se recibió, pero falló lo que la página hace después (alEnviar).', e); if (!form.hidden) aviso(form, { tono: 'ok', texto: M.envioRecibido, foco: true }); }
      if (claveBorrador) borraBorrador();
      if (franja) { franja.hidden = true; franjaPendiente = false; }
      return true;
    }

    /* ----- Eventos (todos aquí; ninguno en el HTML) ----- */
    form.addEventListener('submit', (e) => { e.preventDefault(); if (!(FormKit.ganchos.submit && FormKit.ganchos.submit(form, enviar))) enviar(); });

    /* Después de validar n: las cruzadas que otro campo declara con n se
       repiten si ese campo ya tiene valor (la CURP escrita y luego otra
       fecha), y los límites que dependen de otras respuestas se recalculan
       en los campos ya tocados. */
    function revalidaDependientes(n) {
      for (const d of declarantesDe(n)) if (activo(d) && valorDe(d)) validaYPinta(d);
      for (const el of $$('[data-min-segun],[data-max-segun]', form)) {
        const m = el.dataset.campo;
        if (m && m !== n && activo(m) && estadoDe(m).tocado && valorDe(m)) validaYPinta(m);
      }
    }

    /* Muestra u oculta la contraseña: tipo del control, texto del botón y aria-pressed. */
    function verContrasena(b, ver) {
      const c = document.getElementById(b.getAttribute('aria-controls'));
      if (!c) return;
      c.type = ver ? 'text' : 'password';
      b.setAttribute('aria-pressed', String(ver));
      const t = $('[data-ver-texto]', b);
      if (t) t.textContent = ver ? M.contrasenaOcultar : M.contrasenaMostrar;
    }

    form.addEventListener('click', (e) => {
      const ver = e.target.closest('[data-ver-contrasena]');
      if (ver && form.contains(ver)) { verContrasena(ver, ver.getAttribute('aria-pressed') !== 'true'); return; }
      const b = e.target.closest('[data-ir-campo],[data-accion="enviar"],[aria-disabled="true"]');
      if (!b || !form.contains(b)) return;
      if (b.getAttribute('aria-disabled') === 'true') { e.preventDefault(); e.stopImmediatePropagation(); return; }
      if (b.dataset.irCampo) { e.preventDefault(); enfocaCampo(b.dataset.irCampo); return; }
      if (b.dataset.accion === 'enviar' && b.type !== 'submit') enviar();
    });

    /* Decisión C5: el error aparece al salir del campo la primera vez; una vez
       marcado, se revalida en cada pulsación para que desaparezca en cuanto se
       corrige. Nunca aparece en un campo que la persona no ha tocado. */
    form.addEventListener('input', (e) => {
      const el = e.target.closest('[data-campo]');
      aplicaCondicionales();
      if (el) {
        const n = el.dataset.campo;
        estadoDe(n).dirty = true;
        if (e.target.matches('textarea')) { autoAlto(e.target); actualizaContador(n); }
        if (e.target.matches('select')) e.target.toggleAttribute('data-vacio', !e.target.value);
        const err = $('.err', el);
        if (err && err.dataset.nivel === 'error') { const msg = validaCampo(n); if (!msg) { limpia(n); const cruz = validaCruzadas(n).find((c) => c.nivel === 'error'); if (cruz) marca(n, cruz.mensaje); } else marca(n, msg); revisaResumen(); }
        for (const otro of camposCruzadosCon(n)) { const e2 = $('.err', envoltura(otro)); if (e2 && e2.dataset.cruzada) validaYPinta(otro); }
        /* Un dato calculado por la página no tiene «salir del campo»: lo que depende de él se revisa al cambiar. */
        if (tipoDe(el) === 'auxiliar') { revalidaDependientes(n); revisaResumen(); }
      }
      programaBorrador();
    });
    form.addEventListener('change', (e) => {
      const el = e.target.closest('[data-campo]');
      aplicaCondicionales();
      if (el) {
        const n = el.dataset.campo;
        estadoDe(n).dirty = true;
        /* Las opciones, casillas, selects y fechas se validan al cambiar: no hay «salir del campo» útil. */
        const err = $('.err', el);
        if (e.target.matches('input[type="radio"],input[type="checkbox"],select,input[type="date"],input[type="time"],input[type="file"]')) { if (estadoDe(n).tocado || (err && err.dataset.nivel)) validaYPinta(n); revalidaDependientes(n); revisaResumen(); }
        else if (err && err.dataset.nivel) { validaYPinta(n); revisaResumen(); }
      }
      programaBorrador();
    });
    form.addEventListener('focusout', (e) => {
      const el = e.target.closest('[data-campo]');
      if (!el || !e.target.matches('input,textarea,select')) return;
      /* Pasar a otro control del MISMO campo (día → mes) no es salir; pasar a su botón («Hoy») sí. */
      if (e.relatedTarget && el.contains(e.relatedTarget) && e.relatedTarget.matches('input,select,textarea')) return;
      const n = el.dataset.campo;
      const st = estadoDe(n);
      if (!st.dirty && !valorDe(n)) return; // ni tocó ni escribió: no se regaña
      st.tocado = true;
      normalizaCampo(n);
      if (e.target.matches('textarea')) actualizaContador(n);
      const msg = validaYPinta(n);
      if (msg) anuncia(`${M.prefijoError} ${msg}`);
      revalidaDependientes(n);
      revisaResumen();
    });

    /* Diálogos y copiado los atiende su módulo. El anuncio de envío fallido se
       oculta cuando la persona cambia un dato, no cuando otro elemento recibe
       el foco: al ocultarse con el foco, el botón de abajo subía a media
       pulsación y el clic se perdía. */
    const ocultaAvisoEnvio = () => { const a = $('[data-estado-envio]', form); if (a && !a.hidden) a.hidden = true; };
    form.addEventListener('input', ocultaAvisoEnvio);
    form.addEventListener('change', ocultaAvisoEnvio);

    /* ----- Contexto para los módulos ----- */
    const ctx = {
      form, cfg, M, opciones, opcionesPagina, tipos, sugerencias: [],
      $, $$, plantilla, icono, anuncia, almacen, idUnico, pesoTxt, normalizaBusqueda,
      envoltura, envolturas, nombres, tipoDe, controlesDe, controlPrincipal, valorDe, textoDeValor, etiquetaDe, esObligatorio, activo, atributosDe,
      validaCampo, validaYPinta, validaContenedor, marca, marcaError, limpia, muestraResumen, quitaResumen, revisaResumen, enfocaCampo,
      aplicaCondicionales, programaBorrador, alBorrador, leeBorrador, restauraBorrador, enviar, arma, preparaCampo, estadoDe, datosActuales
    };

    /* ----- Arranque ----- */
    const activos = [];
    for (const [nombre, def] of modulos) {
      const ambito = def.fueraDelFormulario ? document : form;
      if (!def.selector || $(def.selector, ambito)) { if (def.tipos) for (const [t, d] of Object.entries(def.tipos)) tipos.set(t, d); activos.push([nombre, def]); }
    }
    for (const n of nombres()) preparaCampo(n);
    for (const [, def] of activos) if (def.iniciar) def.iniciar(form, ctx);
    for (const s of $$('select', form)) s.toggleAttribute('data-vacio', !s.value);
    aplicaCondicionales();
    purgaBorradoresVencidos(cfg.borrador.ttlDias);
    if (claveBorrador && !noGuardar) {
      const previo = leeBorrador();
      if (previo) { if (franja) iniciaFranja(previo); else restauraBorrador(previo); }
    }
    arrancado = true;
    form.dataset.formkit = 'listo';

    const instancia = {
      ctx,
      modulos: activos.map(([n]) => n),
      payload: arma,
      valida: () => validaContenedor(form),
      enviar,
      marcaError,
      /* Inventario de datos personales: qué se pide, para qué y con qué finalidad (FRM-55). */
      /* «sensible»: no va al borrador del dispositivo (también lo derivado de algo sensible).
         Los campos de un grupo repetible se listan una vez, con su patrón (grupo.#.campo),
         aunque todavía no haya filas. */
      inventario: () => {
        const fuera = fueraDelBorrador();
        const lista = nombres().filter((n) => !/\.\d+\./.test(n)).map((n) => { const d = envoltura(n).dataset; return { campo: n, etiqueta: etiquetaDe(n), obligatorio: esObligatorio(n), uso: d.uso || '', datoPersonal: d.finalidad !== undefined, finalidad: d.finalidad || '', sensible: fuera.has(n), formato: d.formato || '', autocomplete: controlPrincipal(n) ? controlPrincipal(n).getAttribute('autocomplete') || '' : '' }; });
        for (const tpl of $$('template[data-repetible-plantilla]', form)) {
          for (const el of tpl.content.querySelectorAll('[data-campo]')) {
            const d = el.dataset; const c = el.querySelector('input, select, textarea'); const et = el.querySelector('.etiqueta');
            lista.push({ campo: d.campo, etiqueta: et ? et.textContent.trim() : d.campo, obligatorio: d.requerido !== undefined, uso: d.uso || '', datoPersonal: d.finalidad !== undefined, finalidad: d.finalidad || '', sensible: d.sensible !== undefined || d.formato === 'contrasena', formato: d.formato || '', autocomplete: c ? c.getAttribute('autocomplete') || '' : '' });
          }
        }
        return lista;
      }
    };
    instancias.push(instancia);
    iniciados.set(form, { instancia, extra });
    return instancia;
  }

  /* Formularios iniciados en la página, para marcar un error desde fuera
     sin tener a mano la instancia. */
  const instancias = [];
  /* Cada formulario iniciado, con sus opciones: para no iniciarlo dos veces. */
  const iniciados = new WeakMap();
  const marcaErrorGlobal = (campo, mensaje) => instancias.some((i) => i.marcaError(campo, mensaje));

  const FormKit = {
    version: BASE.version,
    config: fusiona(BASE, global.FORMKIT_CONFIG || {}),
    registra, iniciar, anuncia, aviso, icono, almacen,
    /* FormKit.marcaError(campo, mensaje): pinta el error junto al campo, en el formulario que lo tenga. */
    marcaError: marcaErrorGlobal,
    utilidades: { $, $$, plantilla, pesoTxt, normalizaBusqueda, idUnico, fusiona, fechaHora, relojDe },
    /* Ganchos que un módulo puede ocupar: validaTodo (pasos), submit, estadoBorrador, restauraBorrador, erroresServidor. */
    ganchos: {}
  };
  global.FormKit = FormKit;

  /* Arranque declarativo: todo <form data-formkit> se inicia solo al cargar
     la página, con la configuración global. Quien necesite opciones (enviar,
     alEnviar) llama FormKit.iniciar(form, opciones) desde su arranque. */
  document.addEventListener('DOMContentLoaded', () => {
    for (const f of $$('form[data-formkit=""]')) if (f.dataset.formkit !== 'listo') iniciar(f, global.FORMKIT_OPCIONES || {});
  });
}(window));


/* ===== codigo/modulos/otro/otro.js ===== */
/* =========================================================
   otro.js · Módulo «otro» · nivel RECOMENDADO

   Opción «Otro» con especificación. Sirve para opción única, opción
   múltiple, lista desplegable (select) y tarjetas seleccionables.

   Contrato HTML:
     · La opción lleva value="otro" (o el valor que declare data-otro-valor
       en el campo de texto) y va al final de la lista, nunca premarcada.
     · El campo de texto es un [data-campo] propio, con
         data-si="<campo de opciones>=otro"   → sólo existe mientras «Otro» esté elegida
         data-otro-de="<campo de opciones>"   → este módulo lo gobierna
         data-requerido                       → obligatorio sólo mientras exista
       y una etiqueta visible («Especifica cuál»).
   La variante simple («Otro» sin especificación) no necesita este módulo:
   es una opción más.

   Qué hace el módulo:
     · pone aria-controls (y aria-expanded si es un select) en el control que gobierna el
       texto, para que el lector de pantalla sepa que algo se desplegó;
     · no mueve el foco por la persona;
     · al desmarcar, el núcleo oculta el campo (no viaja) y lo escrito se
       conserva: si vuelve a elegir «Otro» lo recupera;
     · comprueba que lo especificado no repita una opción existente y lo
       sugiere sin bloquear;
     · el mensaje de obligatorio es propio («Escribe cuál es la otra opción»).

   El servidor repite las dos reglas: texto de «Otro» sólo si «Otro» fue
   elegida, y texto obligatorio cuando sí lo fue (ver codigo/servidor).
   ========================================================= */
(function () {
  'use strict';
  FormKit.registra('otro', {
    selector: '[data-otro-de]',
    iniciar(form, ctx) {
      const { $, $$, envoltura, valorDe, etiquetaDe, plantilla, M, normalizaBusqueda } = ctx;

      for (const texto of $$('[data-otro-de]', form)) {
        const nombreTexto = texto.dataset.campo;
        const nombreOpciones = texto.dataset.otroDe;
        const valorOtro = texto.dataset.otroValor || 'otro';
        const grupo = envoltura(nombreOpciones);
        if (!grupo) continue;
        const control = ctx.controlPrincipal(nombreTexto);
        if (control && !control.id) control.id = ctx.idUnico(`otro-${nombreTexto}`);
        texto.dataset.mensaje = plantilla(M.obligatorioOtro, { etiqueta: etiquetaDe(nombreOpciones) });

        /* El control que gobierna: el radio/casilla «otro» o el select. */
        const gobierna = () => {
          const radio = $$('input[type="radio"],input[type="checkbox"]', grupo).find((i) => i.value === valorOtro);
          return radio || $('select', grupo);
        };
        const pinta = () => {
          const g = gobierna();
          if (!g) return;
          const v = valorDe(nombreOpciones);
          const abierto = Array.isArray(v) ? v.includes(valorOtro) : v === valorOtro;
          /* aria-expanded sólo lo admite el select (rol combobox); en un radio o
             casilla no está permitido (axe aria-allowed-attr): ahí basta
             aria-controls, que es global, y el anuncio del bloque al aparecer. */
          if (g.tagName === 'SELECT') g.setAttribute('aria-expanded', String(abierto));
          if (control) g.setAttribute('aria-controls', texto.id || (texto.id = ctx.idUnico(`otro-caja-${nombreTexto}`)));
        };
        pinta();
        grupo.addEventListener('change', pinta);

        /* Lo especificado no debe repetir una opción que ya existe. */
        const opcionesVisibles = () => $$('input[type="radio"],input[type="checkbox"],option', grupo).filter((i) => i.value && i.value !== valorOtro).map((i) => {
          if (i.tagName === 'OPTION') return i.textContent.trim();
          const lab = i.closest('label');
          const nom = lab && ($('.opcion-nombre', lab) || lab);
          return nom ? nom.textContent.trim() : i.value;
        });
        ctx.sugerencias.push((n) => {
          if (n !== nombreTexto || !control) return '';
          const escrito = normalizaBusqueda(control.value);
          const repetida = escrito && opcionesVisibles().find((o) => normalizaBusqueda(o) === escrito);
          return repetida ? plantilla(M.repiteOpcion, { texto: repetida }) : '';
        });
      }
    }
  });
}());


/* ===== codigo/modulos/combo/combo.js ===== */
/* =========================================================
   combo.js · Módulo «combo» · nivel RECOMENDADO

   Lista desplegable con búsqueda (combobox ARIA 1.2) para catálogos largos:
   filtra al escribir sin acentos, flechas, Inicio/Fin, Enter elige, Escape
   cierra, y anuncia cuántos resultados hay. El select nativo y el datalist
   los pinta cada sistema a su manera; aquí hay una sola lista en todo el
   paquete.

   Contrato HTML (dentro de un [data-campo] con data-formato opcional):
     <div class="combo" data-combo data-catalogo="alcaldias">
       <input class="control" id="alcaldia" name="alcaldia" type="text">
       <ul class="combo-lista" hidden></ul>
     </div>
   El catálogo se toma de window.FORMKIT_CATALOGOS[nombre]: un arreglo de
   cadenas o de objetos {nombre, detalle, valor}, o el objeto documentado
   {filas, fuente, corte, es_ficticio} con ese arreglo en filas. Nunca se escribe a mano en
   el código: viene de la fuente oficial que declara codigo/catalogos.

   Modo (decisión C4): cerrado por omisión (sólo valores del catálogo; la
   vía de escape es la opción «Otro»). Con data-libre acepta lo escrito y lo
   dice con un renglón «No está en la lista: se guarda como lo escribiste».
   El servidor debe conocer el modo para rechazar valores fuera de catálogo.
   Cerrado, al salir del campo lo escrito queda como en el catálogo
   («coyoacan» → «Coyoacán»), y viaja ese nombre y, si la opción trae valor,
   su clave en payload.claves[campo].
   ========================================================= */
(function () {
  'use strict';
  FormKit.registra('combo', {
    selector: '[data-combo]',
    tipos: {
      combo: {
        detecta: (el) => !!el.querySelector('[data-combo]'),
        controles: (el) => [el.querySelector('[data-combo] input')],
        valorDe: (el) => { const i = el.querySelector('[data-combo] input'); return i ? i.value.trim() : ''; },
        textoDe: (el) => { const i = el.querySelector('[data-combo] input'); return i ? i.value.trim() : ''; },
        enBorrador: true,
        restaura: (el, v) => { const i = el.querySelector('[data-combo] input'); if (i) i.value = v || ''; },
        valida: (el, v) => {
          const wrap = el.querySelector('[data-combo]');
          if (wrap.hasAttribute('data-libre')) return '';
          const lista = catalogo(wrap);
          const n = FormKit.utilidades.normalizaBusqueda(v);
          return lista.some((o) => FormKit.utilidades.normalizaBusqueda(o.nombre) === n) ? '' : FormKit.config.plantilla(FormKit.config.mensajes.soloLista, { etiqueta: el.querySelector('.etiqueta') ? el.querySelector('.etiqueta').textContent.replace(/\*|\(obligatorio\)/g, '').trim() : el.dataset.campo });
        },
        /* En una lista cerrada viaja el nombre como está en el catálogo («Coyoacán», aunque se
           escriba «coyoacan») y, si el catálogo trae una clave propia ({nombre, valor}), también
           ésta, en payload.claves[campo]. */
        alArmar: (form, payload) => {
          for (const wrap of form.querySelectorAll('[data-combo]:not([data-libre])')) {
            const campo = wrap.closest('[data-campo]').dataset.campo;
            if (!(campo in payload.datos)) continue;
            const o = opcionDe(wrap, payload.datos[campo]);
            if (!o) continue;
            payload.datos[campo] = o.nombre;
            if (o.valor !== undefined) (payload.claves = payload.claves || {})[campo] = o.valor;
          }
        }
      }
    },
    iniciar(form, ctx) {
      const { $, $$, anuncia, plantilla, M, cfg, normalizaBusqueda, limpia, programaBorrador } = ctx;
      for (const wrap of $$('[data-combo]', form)) {
        const campo = wrap.closest('[data-campo]');
        const n = campo.dataset.campo;
        const entrada = $('input', wrap);
        const lista = $('.combo-lista', wrap);
        const opciones = catalogo(wrap);
        const libre = wrap.hasAttribute('data-libre');
        lista.id = lista.id || ctx.idUnico(`lista-${n}`);
        lista.setAttribute('role', 'listbox');
        const etq = $('.etiqueta', campo);
        if (etq) { etq.id = etq.id || ctx.idUnico(`etq-${n}`); lista.setAttribute('aria-labelledby', etq.id); }
        entrada.setAttribute('role', 'combobox');
        entrada.setAttribute('aria-autocomplete', 'list');
        entrada.setAttribute('aria-expanded', 'false');
        entrada.setAttribute('aria-controls', lista.id);
        entrada.autocomplete = 'off';
        let visibles = [];
        let activa = -1;

        function cierra() { lista.hidden = true; entrada.setAttribute('aria-expanded', 'false'); entrada.removeAttribute('aria-activedescendant'); activa = -1; }
        function marcaActiva(k) {
          $$('[role="option"]', lista).forEach((li, i) => li.setAttribute('aria-selected', String(i === k)));
          activa = k;
          const li = k >= 0 ? $(`#${lista.id}-${k}`) : null;
          if (li) { entrada.setAttribute('aria-activedescendant', li.id); li.scrollIntoView({ block: 'nearest' }); } else entrada.removeAttribute('aria-activedescendant');
        }
        function elige(k) {
          const o = visibles[k];
          if (!o) return;
          entrada.value = o.nombre;
          if (o.valor !== undefined) wrap.dataset.valor = o.valor;
          cierra(); limpia(n); programaBorrador();
          entrada.dispatchEvent(new Event('change', { bubbles: true }));
        }
        function pinta() {
          const q = normalizaBusqueda(entrada.value);
          visibles = opciones.filter((o) => normalizaBusqueda(o.nombre).includes(q)).slice(0, cfg.combo.maxResultados);
          lista.textContent = '';
          visibles.forEach((o, i) => {
            const li = document.createElement('li');
            li.className = 'combo-opcion';
            li.id = `${lista.id}-${i}`;
            li.setAttribute('role', 'option');
            li.setAttribute('aria-selected', 'false');
            const nom = document.createElement('span'); nom.className = 'combo-nombre'; nom.textContent = o.nombre; li.appendChild(nom);
            if (o.detalle) { const d = document.createElement('span'); d.className = 'combo-detalle'; d.textContent = o.detalle; li.appendChild(d); }
            lista.appendChild(li);
          });
          if (!visibles.length || (libre && q && !visibles.some((o) => normalizaBusqueda(o.nombre) === q))) {
            const v = document.createElement('li');
            v.className = 'combo-vacio';
            v.setAttribute('role', 'presentation');
            v.textContent = libre && q ? M.comboLibre : plantilla(M.comboNinguno, { texto: entrada.value });
            lista.appendChild(v);
          }
          lista.hidden = false;
          entrada.setAttribute('aria-expanded', 'true');
          marcaActiva(-1);
          anuncia(visibles.length === 0 ? plantilla(M.comboNinguno, { texto: entrada.value }) : visibles.length === 1 ? M.comboUno : plantilla(M.comboVarios, { n: visibles.length }));
        }

        /* Sólo cuando la persona escribe en el campo: si la página lo llena
           (al retomar un borrador), la lista no se abre ni anuncia ni tapa la
           pregunta siguiente. */
        entrada.addEventListener('input', () => { if (document.activeElement === entrada) pinta(); });
        /* Clic (no foco): al llegar desde el resumen de errores la lista no debe tapar el mensaje. */
        entrada.addEventListener('click', () => { if (lista.hidden) pinta(); });
        entrada.addEventListener('keydown', (e) => {
          if (e.key === 'ArrowDown') { e.preventDefault(); if (lista.hidden) pinta(); marcaActiva(Math.min(activa + 1, visibles.length - 1)); }
          else if (e.key === 'ArrowUp' && !lista.hidden) { e.preventDefault(); marcaActiva(Math.max(activa - 1, 0)); }
          else if (e.key === 'Home' && !lista.hidden && activa >= 0) { e.preventDefault(); marcaActiva(0); }
          else if (e.key === 'End' && !lista.hidden && activa >= 0) { e.preventDefault(); marcaActiva(visibles.length - 1); }
          else if (e.key === 'Enter' && !lista.hidden) { e.preventDefault(); if (activa >= 0) elige(activa); else cierra(); }
          else if (e.key === 'Escape' && !lista.hidden) { e.preventDefault(); e.stopPropagation(); cierra(); }
        });
        /* mousedown (no click) para que la entrada no pierda el foco antes de elegir. */
        lista.addEventListener('mousedown', (e) => { e.preventDefault(); const li = e.target.closest('[role="option"]'); if (li) elige(Number(li.id.split('-').pop())); });
        /* Al salir, lo escrito queda como en el catálogo: «coyoacan» → «Coyoacán». */
        entrada.addEventListener('blur', () => {
          cierra();
          const o = libre ? null : opcionDe(wrap, entrada.value);
          if (o && entrada.value !== o.nombre) { entrada.value = o.nombre; entrada.dispatchEvent(new Event('change', { bubbles: true })); }
        });
      }
    }
  });

  /* La opción del catálogo que corresponde a un texto, sin acentos ni mayúsculas. */
  function opcionDe(wrap, texto) {
    const n = FormKit.utilidades.normalizaBusqueda(String(texto || '').trim());
    return n ? catalogo(wrap).find((o) => FormKit.utilidades.normalizaBusqueda(o.nombre) === n) || null : null;
  }

  function catalogo(wrap) {
    const cat = (window.FORMKIT_CATALOGOS || {})[wrap.dataset.catalogo];
    const lista = Array.isArray(cat) ? cat : (cat && Array.isArray(cat.filas) ? cat.filas : []);
    const vistos = new Set();
    return lista.map((o) => (typeof o === 'string' ? { nombre: o } : o)).filter((o) => o && o.nombre && !vistos.has(o.nombre) && vistos.add(o.nombre));
  }
}());


/* ===== codigo/modulos/fecha/fecha.js ===== */
/* =========================================================
   fecha.js · Módulo «fecha» · nivel RECOMENDADO

   Fecha y hora sobre el control nativo (que en el teléfono abre la rueda del
   sistema) con: botón «Hoy» / «Ahora» en la zona horaria de la Ciudad de
   México, límites configurables por atributo (min, max, data-no-futura) y
   atajos de rango («Últimos 7 días») para pares inicio–fin.

   Contrato HTML:
     <div class="campo fecha" data-campo="fecha_hechos" data-formato="fecha" data-no-futura>
       <label class="etiqueta" for="fecha_hechos">Fecha</label>
       <p class="ayuda">Formato AAAA-MM-DD.</p>
       <div class="fecha-grupo">
         <input class="control" id="fecha_hechos" name="fecha_hechos" type="date">
         <button type="button" class="btn btn-secundario fecha-hoy" data-hoy>Hoy</button>
       </div>
     </div>
   Para hora: type="time", data-formato="hora" y data-ahora en el botón.
   Para rango: en el contenedor data-rango="inicio,fin" data-atajos="7,30,90".
   Para edad: data-deriva="edad=edad" en el campo de la fecha de nacimiento;
   el destino es un [data-campo] con <input readonly>. La edad nunca se
   escribe a mano: se calcula, también cuando la fecha viene de la CURP.
   Para la fecha de nacimiento, sin calendario: data-formato="fecha-dma" en
   un <input type="text" inputmode="numeric" maxlength="10">; se escribe
   día/mes/año (23/07/1985) y la escritura se acomoda sola.
   ========================================================= */
(function () {
  'use strict';
  FormKit.registra('fecha', {
    selector: '[data-hoy],[data-ahora],[data-rango],[data-formato="fecha"][data-deriva],[data-formato="fecha-dma"]',
    iniciar(form, ctx) {
      const { $, $$, cfg, M, plantilla, anuncia, envoltura, controlPrincipal, validaYPinta, programaBorrador } = ctx;

      form.addEventListener('click', (e) => {
        const b = e.target.closest('[data-hoy],[data-ahora],[data-atajo]');
        if (!b || !form.contains(b)) return;
        if (b.hasAttribute('data-atajo')) { aplicaAtajo(b); return; }
        const campo = b.closest('[data-campo]');
        const ctl = campo && controlPrincipal(campo.dataset.campo);
        if (!ctl) return;
        /* En una fecha día/mes/año, «Hoy» se escribe en ese formato. */
        const hoy = campo.dataset.formato === 'fecha-dma' ? cfg.dmaDeIso(cfg.hoyISO()) : cfg.hoyISO();
        ctl.value = b.hasAttribute('data-hoy') ? hoy : cfg.ahoraHM();
        ctl.dispatchEvent(new Event('input', { bubbles: true }));
        ctl.dispatchEvent(new Event('change', { bubbles: true }));
        ctx.estadoDe(campo.dataset.campo).tocado = true;
        validaYPinta(campo.dataset.campo);
        anuncia(`${ctx.etiquetaDe(campo.dataset.campo)}: ${ctl.value}`);
        programaBorrador();
      });

      /* Textos de los botones desde la configuración; límites por omisión. */
      for (const b of $$('[data-hoy]', form)) if (!b.textContent.trim()) b.textContent = M.hoy;
      for (const b of $$('[data-ahora]', form)) if (!b.textContent.trim()) b.textContent = M.ahora;
      for (const campo of $$('[data-campo][data-formato="fecha"]', form)) {
        const ctl = controlPrincipal(campo.dataset.campo);
        if (ctl && campo.hasAttribute('data-no-futura') && !ctl.max) ctl.max = cfg.hoyISO();
      }

      /* Edad cumplida desde la fecha de nacimiento, con «hoy» de la Ciudad de
         México. Con una fecha vacía, incompleta o futura, la edad queda vacía. */
      /* Fecha día/mes/año (formato «fecha-dma»), sin calendario: la escritura
         se acomoda sola (23 → 23/, 07 → 23/07/) mientras se escribe al final;
         al borrar o al editar en medio no se mueve nada. Corre en el control,
         antes de que el núcleo lea el valor. */
      for (const campo of $$('[data-campo][data-formato="fecha-dma"]', form)) {
        const ctl = controlPrincipal(campo.dataset.campo);
        if (!ctl || ctl.tagName !== 'INPUT') continue;
        ctl.addEventListener('input', (e) => {
          /* Una fecha AAAA-MM-DD completa (pegada o del autocompletado) se pasa a
             día/mes/año; la escritura guiada la leería como día 19, mes 85… */
          const dma = /^\d{4}-\d{2}-\d{2}$/.test(ctl.value.trim()) ? cfg.dmaDeIso(ctl.value.trim()) : '';
          if (dma) { ctl.value = dma; ctl.setSelectionRange(dma.length, dma.length); return; }
          if ((e.inputType && e.inputType.startsWith('delete')) || ctl.selectionStart !== ctl.value.length) return;
          const v = cfg.guiaFechaDma(ctl.value);
          if (v !== ctl.value) { ctl.value = v; ctl.setSelectionRange(v.length, v.length); }
        });
      }

      for (const campo of $$('[data-campo][data-formato="fecha"][data-deriva],[data-campo][data-formato="fecha-dma"][data-deriva]', form)) {
        const ctl = controlPrincipal(campo.dataset.campo);
        const destinos = campo.dataset.deriva.split(/\s+/).filter((p) => p.startsWith('edad=')).map((p) => p.slice(5));
        if (!ctl || !destinos.length) continue;
        const calcula = () => {
          const v = campo.dataset.formato === 'fecha-dma' ? cfg.isoDeDma(ctl.value) : ctl.value;
          const edad = /^\d{4}-\d{2}-\d{2}$/.test(v) && v <= cfg.hoyISO() ? String(cfg.edadEn(v, cfg.hoyISO())) : '';
          for (const d of destinos) {
            const c = controlPrincipal(d);
            if (!c || c.value === edad) continue;
            c.value = edad;
            c.dispatchEvent(new Event('change', { bubbles: true }));
            if (edad) anuncia(plantilla(M.fechaEdadCalculada, { etiqueta: ctx.etiquetaDe(d), edad }));
          }
        };
        ctl.addEventListener('input', calcula);
        ctl.addEventListener('change', calcula);
        calcula();
      }

      /* Rangos: construye los atajos y asegura la validación cruzada. */
      for (const r of $$('[data-rango]', form)) {
        const [ini, fin] = r.dataset.rango.split(',').map((s) => s.trim());
        const campoFin = envoltura(fin);
        if (campoFin && !campoFin.dataset.cruzada) { campoFin.dataset.cruzada = 'rango-fechas'; campoFin.dataset.cruzadaCampos = `inicio=${ini} fin=${fin}`; }
        const dias = (r.dataset.atajos || '').split(',').map((s) => Number(s.trim())).filter(Boolean);
        if (!dias.length) continue;
        const caja = document.createElement('div');
        caja.className = 'fecha-atajos';
        caja.setAttribute('role', 'group');
        caja.setAttribute('aria-label', M.fechaAtajos);
        for (const d of dias) {
          const b = document.createElement('button');
          b.type = 'button';
          b.className = 'btn btn-secundario fecha-atajo';
          b.dataset.atajo = String(d);
          b.dataset.rangoIni = ini; b.dataset.rangoFin = fin;
          b.textContent = plantilla(M.fechaUltimos, { n: d });
          caja.appendChild(b);
        }
        r.prepend(caja);
      }

      function aplicaAtajo(b) {
        const d = Number(b.dataset.atajo);
        const hoy = cfg.hoyISO();
        const desde = new Date(`${hoy}T00:00:00Z`); desde.setUTCDate(desde.getUTCDate() - (d - 1));
        const ini = controlPrincipal(b.dataset.rangoIni), fin = controlPrincipal(b.dataset.rangoFin);
        if (!ini || !fin) return;
        ini.value = desde.toISOString().slice(0, 10); fin.value = hoy;
        for (const c of [ini, fin]) { c.dispatchEvent(new Event('input', { bubbles: true })); c.dispatchEvent(new Event('change', { bubbles: true })); }
        validaYPinta(b.dataset.rangoIni); validaYPinta(b.dataset.rangoFin);
        anuncia(plantilla(M.fechaPeriodo, { desde: cfg.dmaDeIso(ini.value) || ini.value, hasta: cfg.dmaDeIso(fin.value) || fin.value }));
        $$('[data-atajo]', b.parentNode).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      }
    }
  });
}());


/* ===== codigo/modulos/identificadores/identificadores.js ===== */
/* =========================================================
   identificadores.js · Módulo «identificadores» · nivel OPCIONAL

   Campos con formato cerrado (CURP, RFC, folios, claves). La validación
   por capas vive en validaciones.config.js; este módulo añade lo que sólo
   tiene sentido en pantalla:
     · mayúsculas y sin espacios mientras se escribe (lo que la persona ve
       es lo que se conserva);
     · derivación de datos desde la CURP a campos de solo lectura
       (minimización: la fecha de nacimiento y el sexo no se piden dos
       veces), con aviso en pantalla y opción de corregir la CURP;
     · enmascarado opcional en revisión y acuse (data-enmascara).

   Contrato HTML:
     <div class="campo" data-campo="curp" data-formato="curp"
          data-deriva="fechaNacimiento=nacimiento sexo=sexo entidad=entidad_nac">
       <label class="etiqueta" for="curp">CURP</label>
       <input class="control" id="curp" name="curp" type="text" maxlength="18" autocomplete="off" spellcheck="false">
     </div>
   Los campos destino son [data-campo] con <input readonly>.
   Un formato correcto no prueba que la CURP exista: cuando eso importe, el
   servidor la contrasta con el servicio oficial de consulta [Fuente: __].
   ========================================================= */
(function () {
  'use strict';
  const MAYUSCULAS = ['curp', 'rfc', 'folio'];
  FormKit.registra('identificadores', {
    selector: '[data-formato="curp"],[data-formato="rfc"],[data-formato="folio"]',
    iniciar(form, ctx) {
      const { $$, cfg, anuncia, controlPrincipal, envoltura, etiquetaDe, validaCampo } = ctx;
      for (const campo of $$('[data-campo]', form)) {
        const f = campo.dataset.formato;
        if (!MAYUSCULAS.includes(f)) continue;
        const ctl = controlPrincipal(campo.dataset.campo);
        if (!ctl) continue;
        ctl.setAttribute('autocapitalize', 'characters');
        ctl.setAttribute('spellcheck', 'false');
        if (f === 'curp' && !ctl.maxLength) ctl.maxLength = cfg.curp.largo;
        ctl.addEventListener('input', () => {
          const pos = ctl.selectionStart;
          const v = cfg.formatos[f].normaliza(ctl.value);
          if (v !== ctl.value) { ctl.value = v; try { ctl.setSelectionRange(pos, pos); } catch (e) { /* tipos sin selección */ } }
          if (f === 'curp') deriva(campo, ctl);
        });
        if (f === 'curp') deriva(campo, ctl);
      }

      /* Rellena los campos derivados sólo con una CURP válida; los vacía si
         deja de serlo. Nunca en silencio: anuncia y muestra la ayuda. */
      function deriva(campo, ctl) {
        if (!campo.dataset.deriva) return;
        const valida = !validaCampo(campo.dataset.campo) && ctl.value.length === cfg.curp.largo;
        const datos = valida ? cfg.formatos.curp.deriva(ctl.value) : {};
        const textos = { H: cfg.mensajes.sexoH, M: cfg.mensajes.sexoM, X: cfg.mensajes.sexoX };
        for (const par of campo.dataset.deriva.split(/\s+/).filter(Boolean)) {
          const [clave, destino] = par.split('=');
          const envDestino = envoltura(destino);
          const ctlDestino = envDestino && controlPrincipal(destino);
          if (!ctlDestino) continue;
          const bruto = datos[clave] || '';
          /* La fecha de nacimiento va como el destino la pide: AAAA-MM-DD o, en «fecha-dma», DD/MM/AAAA. */
          const valor = clave === 'sexo' && ctlDestino.tagName !== 'SELECT' ? (textos[bruto] || bruto)
            : clave === 'fechaNacimiento' && envDestino.dataset.formato === 'fecha-dma' ? cfg.dmaDeIso(bruto) : bruto;
          if (ctlDestino.value !== valor) {
            ctlDestino.value = valor;
            ctlDestino.dispatchEvent(new Event('change', { bubbles: true }));
            if (valor) anuncia(FormKit.utilidades.plantilla(cfg.mensajes.curpDerivado, { etiqueta: etiquetaDe(destino), valor }));
          }
        }
      }
    }
  });

  /* Enmascara un identificador para revisión y acuse: deja visibles los
     primeros 4 y los últimos 2 caracteres. */
  FormKit.enmascara = (v) => (String(v || '').length > 8 ? `${v.slice(0, 4)}${'•'.repeat(v.length - 6)}${v.slice(-2)}` : v);
}());


/* ===== codigo/modulos/repetibles/repetibles.js ===== */
/* =========================================================
   repetibles.js · Módulo «repetibles» · nivel OPCIONAL

   Grupos repetibles («Agregar otro»): varias personas, varios domicilios,
   varias filas de una tabla de captura. Cada fila es una copia de una
   plantilla <template>; los campos de la fila son [data-campo] cuyo nombre
   se completa con el índice (personas.0.nombre). Mínimo y máximo de filas
   configurables; quitar una fila con datos pide confirmación con el módulo
   «modal» («Quitar fila N»); con el máximo, «Agregar» dice el límite junto
   a él (.repetible-limite); el foco vuelve a un lugar sensato tras agregar
   o quitar.

   Contrato HTML:
     <div class="repetible" data-repetible="personas" data-min="1" data-max="5"
          data-etiqueta="Personas">
       <ol class="repetible-lista" data-repetible-lista></ol>
       <template data-repetible-plantilla>
         <li class="repetible-fila">
           <div class="campo" data-campo="personas.#.nombre" data-formato="nombre">
             <label class="etiqueta" for="personas-#-nombre">Nombre</label>
             <input class="control" id="personas-#-nombre" name="personas[#][nombre]" type="text" required>
           </div>
         </li>
       </template>
       <button type="button" class="btn btn-secundario" data-repetible-agregar>Agregar otro</button>
     </div>
   El carácter # se sustituye por el número de la fila (no el que va antes de
   una letra, como en href="#i-ayuda"). El número de una fila no se reutiliza:
   si se quita la fila 1 de tres, la siguiente que se agregue es la 3, así cada
   fila conserva su nombre y su id, y el borrador guarda qué números tenía.
   ========================================================= */
(function () {
  'use strict';
  FormKit.registra('repetibles', {
    selector: '[data-repetible]',
    iniciar(form, ctx) {
      const { $, $$, M, plantilla, anuncia, preparaCampo, icono, valorDe, limpia, programaBorrador } = ctx;
      /* Por grupo: cómo agregar una fila con un número dado y qué números tiene. */
      const grupos = new Map();

      for (const rep of $$('[data-repetible]', form)) {
        const lista = $('[data-repetible-lista]', rep);
        const tpl = $('template[data-repetible-plantilla]', rep);
        const btnAgregar = $('[data-repetible-agregar]', rep);
        const min = Number(rep.dataset.min || 0), max = Number(rep.dataset.max || 0);
        lista.setAttribute('aria-label', rep.dataset.etiqueta || rep.dataset.repetible);
        if (btnAgregar && !btnAgregar.textContent.trim()) btnAgregar.textContent = M.filaAgregar;

        function filas() { return $$(':scope > .repetible-fila', lista); }
        const numeroDe = (fila) => Number(fila.dataset.numero);
        /* El siguiente número libre: nunca uno que ya se usó en este grupo. */
        let proximo = 0;
        /* El límite de filas se dice también en pantalla, junto a «Agregar» (FRM-40). */
        let notaLimite = null;
        function avisaLimite(texto) {
          if (!notaLimite) { notaLimite = document.createElement('p'); notaLimite.className = 'repetible-limite'; if (btnAgregar) btnAgregar.before(notaLimite); else rep.appendChild(notaLimite); }
          anuncia(texto, { visible: notaLimite });
        }
        const quitaLimite = () => { if (notaLimite) notaLimite.hidden = true; };
        function renumera() {
          filas().forEach((fila, i) => {
            const cab = $('.repetible-titulo', fila);
            if (cab) cab.textContent = `${rep.dataset.etiqueta || rep.dataset.repetible} ${i + 1}`;
            const q = $('[data-repetible-quitar]', fila);
            if (q) q.setAttribute('aria-label', plantilla(M.filaQuitar, { n: i + 1 }));
          });
          if (btnAgregar) { const lleno = max && filas().length >= max; btnAgregar.setAttribute('aria-disabled', String(!!lleno)); }
        }
        /* numero: el de una fila que se recupera del borrador; silencio: sin foco, anuncio
           ni borrador nuevo (al recuperar). */
        function agrega(foco = true, { numero = proximo, silencio = false } = {}) {
          if (max && filas().length >= max) { if (!silencio) avisaLimite(plantilla(M.repetibleMax, { max, etiqueta: rep.dataset.etiqueta || '' })); return null; }
          quitaLimite();
          const i = numero;
          proximo = Math.max(proximo, i + 1);
          const html = tpl.innerHTML.replace(/#(?![A-Za-z])/g, String(i));
          const cont = document.createElement('div'); cont.innerHTML = html;
          const fila = cont.firstElementChild;
          fila.classList.add('repetible-fila');
          fila.dataset.numero = String(i);
          /* Encabezado de la fila y botón de quitar, si la plantilla no los trae. */
          if (!$('.repetible-cabecera', fila)) {
            const cab = document.createElement('div'); cab.className = 'repetible-cabecera';
            const tit = document.createElement('p'); tit.className = 'repetible-titulo';
            const q = document.createElement('button'); q.type = 'button'; q.className = 'btn-icono'; q.dataset.repetibleQuitar = '';
            q.append(icono('eliminar'));
            cab.append(tit, q); fila.prepend(cab);
          }
          /* En orden de número, por si se recupera una fila de en medio. */
          lista.insertBefore(fila, filas().find((f) => numeroDe(f) > i) || null);
          for (const c of $$('[data-campo]', fila)) preparaCampo(c.dataset.campo);
          renumera();
          if (silencio) return fila;
          if (foco) { const primero = $('input,select,textarea', fila); if (primero) primero.focus(); }
          anuncia(plantilla(M.repetibleAgregado, { etiqueta: rep.dataset.etiqueta || rep.dataset.repetible, n: filas().indexOf(fila) + 1 }));
          programaBorrador();
          return fila;
        }
        function retira(fila) { for (const c of $$('[data-campo]', fila)) limpia(c.dataset.campo); fila.remove(); }
        function tieneDatos(fila) { return $$('[data-campo]', fila).some((c) => { const v = valorDe(c.dataset.campo); return Array.isArray(v) ? v.length : v; }); }
        function quita(fila) {
          const idx = filas().indexOf(fila);
          if (min && filas().length <= min) { avisaLimite(plantilla(M.repetibleMin, { min, etiqueta: rep.dataset.etiqueta || '' })); return; }
          quitaLimite();
          retira(fila);
          renumera();
          const siguiente = filas()[Math.min(idx, filas().length - 1)];
          (siguiente ? $('[data-repetible-quitar]', siguiente) : btnAgregar).focus();
          anuncia(plantilla(M.repetibleQuitado, { n: idx + 1 }));
          programaBorrador();
        }

        rep.addEventListener('click', (e) => {
          const ag = e.target.closest('[data-repetible-agregar]');
          /* Con el máximo, «Agregar» sigue enfocable (aria-disabled): al tocarlo se dice por qué no agrega. */
          if (ag) { agrega(); return; }
          const q = e.target.closest('[data-repetible-quitar]');
          if (!q) return;
          const fila = q.closest('.repetible-fila');
          /* Con datos, se confirma con el módulo modal (dependencia), nunca con window.confirm (FRM-38). */
          if (!tieneDatos(fila)) { quita(fila); return; }
          if (!FormKit.confirma) { console.warn('FormKit: «repetibles» necesita el módulo «modal» para confirmar antes de quitar una fila con datos.'); return; }
          FormKit.confirma(q, { titulo: M.filaConfirma, si: plantilla(M.filaQuitar, { n: filas().indexOf(fila) + 1 }), peligro: true }).then((ok) => { if (ok) quita(fila); });
        });

        /* Filas iniciales: las que exija el mínimo (al menos una si el grupo es obligatorio). */
        const iniciales = Math.max(min, rep.hasAttribute('data-requerido') ? 1 : 0);
        while (filas().length < iniciales) agrega(false);
        renumera();

        grupos.set(rep.dataset.repetible, {
          numeros: () => filas().map(numeroDe),
          /* Deja exactamente las filas que tenía el borrador, sin pasar del máximo ni
             bajar del mínimo; los valores los repone después el núcleo. */
          recupera(guardado) {
            const lista = Array.isArray(guardado) ? guardado : Array.from({ length: Number(guardado) || 0 }, (_, k) => k);
            let numeros = [...new Set(lista.map(Number).filter((n) => Number.isInteger(n) && n >= 0 && n < 10000))].sort((a, b) => a - b);
            if (max) numeros = numeros.slice(0, max);
            for (const f of filas()) if (!numeros.includes(numeroDe(f)) && filas().length > min) retira(f);
            for (const n of numeros) if (!filas().some((f) => numeroDe(f) === n) && !agrega(false, { numero: n, silencio: true })) break;
            renumera();
          }
        });
      }

      /* El borrador guarda qué números de fila tenía cada grupo y, al recuperarlo, las
         filas se rehacen antes de reponer los valores (también radios y casillas). */
      ctx.alBorrador({
        estado: () => ({ repetibles: Object.fromEntries([...grupos].map(([nombre, g]) => [nombre, g.numeros()])) }),
        prepara: (b) => { for (const [nombre, g] of grupos) if (b && b.repetibles && nombre in b.repetibles) g.recupera(b.repetibles[nombre]); }
      });
    }
  });
}());


/* ===== codigo/modulos/toggle/toggle.js ===== */
/* =========================================================
   toggle.js · Módulo «toggle» · nivel OPCIONAL

   Interruptor (role="switch"). CUÁNDO: un ajuste que surte efecto de
   inmediato y tiene dos estados evidentes (activar notificaciones, mostrar
   mapa). CUÁNDO NO: una respuesta del formulario que se envía al final —ahí
   va una casilla o la opción Sí/No, que el lector de pantalla anuncia como
   pregunta y que participa en la validación—.

   Contrato HTML:
     <div class="toggle" data-campo="notificar">
       <span class="etiqueta" id="t-notificar">Recibir avisos por correo</span>
       <button type="button" class="toggle-btn" role="switch" aria-checked="false" aria-labelledby="t-notificar" data-toggle>
         <span class="toggle-pista" aria-hidden="true"><span class="toggle-perilla"></span></span>
         <span class="toggle-estado" data-toggle-estado>No</span>
       </button>
       <input type="hidden" name="notificar" value="">
     </div>
   El estado se lee de aria-checked; el valor viaja en el input oculto.
   ========================================================= */
(function () {
  'use strict';
  FormKit.registra('toggle', {
    selector: '[data-toggle]',
    tipos: {
      toggle: {
        detecta: (el) => !!el.querySelector('[data-toggle]'),
        controles: (el) => [el.querySelector('[data-toggle]')],
        valorDe: (el) => (el.querySelector('[data-toggle]').getAttribute('aria-checked') === 'true' ? 'si' : ''),
        textoDe: (el) => (el.querySelector('[data-toggle]').getAttribute('aria-checked') === 'true' ? FormKit.config.mensajes.palabraSi : FormKit.config.mensajes.palabraNo),
        enBorrador: true,
        restaura: (el, v) => pon(el.querySelector('[data-toggle]'), v === 'si')
      }
    },
    iniciar(form, ctx) {
      const { $$ } = ctx;
      for (const b of $$('[data-toggle]', form)) pon(b, b.getAttribute('aria-checked') === 'true');
      form.addEventListener('click', (e) => {
        const b = e.target.closest('[data-toggle]');
        if (!b) return;
        pon(b, b.getAttribute('aria-checked') !== 'true');
        b.dispatchEvent(new Event('change', { bubbles: true }));
      });
    }
  });

  /* Un solo lugar escribe el estado: atributo, valor oculto y texto visible. */
  function pon(b, on) {
    const M = FormKit.config.mensajes;
    b.setAttribute('aria-checked', String(!!on));
    const h = b.parentElement.querySelector('input[type="hidden"]');
    if (h) h.value = on ? 'si' : '';
    const t = b.querySelector('[data-toggle-estado]');
    if (t) t.textContent = on ? M.palabraSi : M.palabraNo;
  }
}());


/* ===== codigo/modulos/pasos/pasos.js ===== */
/* =========================================================
   pasos.js · Módulo «pasos» · nivel RECOMENDADO (formularios de 2+ pasos)

   Formulario por pasos con barra de avance fija y navegable. Cada círculo
   es un botón: avanzar desde la barra exige lo mismo que «Continuar»;
   retroceder siempre se permite; los pasos futuros quedan habilitados para
   que el teclado pueda inspeccionarlos (decisión C8). Estados: completado
   (palomita), actual (círculo lleno), pendiente, con error (icono). En
   pantalla angosta las etiquetas ceden su lugar a «Paso X de N · Título».
   Al cambiar de paso, el foco va al título y se anuncia; en ningún otro
   momento se mueve el foco por la persona.

   Contrato HTML:
     <div class="barra-fija"><div data-barra="Avance del formulario"></div>
       <p class="recordatorio" data-recordatorio hidden>…</p></div>
     <form data-formkit data-borrador="…">
       <section class="tarjeta" data-paso data-titulo="Situación" hidden>
         <h2 class="titulo-paso">…</h2> …
         <div class="acciones"><button type="button" class="btn-atras" data-accion="atras">…</button>
           <button type="button" class="btn btn-primario" data-accion="siguiente">Continuar</button></div>
       </section>
       … el último paso lleva data-revision si usa el módulo «revision» y el botón data-accion="enviar".
     </form>
   Ganchos que ocupa: validaTodo (revalida todos los pasos al enviar),
   submit (Enter avanza en lugar de enviar), estadoBorrador/restauraBorrador
   (paso actual y pasos hechos) y erroresServidor (abre el primer paso con un
   error que devolvió el servidor).
   ========================================================= */
(function () {
  'use strict';
  FormKit.registra('pasos', {
    selector: '[data-paso]',
    iniciar(form, ctx) {
      const { $, $$, M, plantilla, anuncia, icono, validaContenedor, muestraResumen, quitaResumen, enfocaCampo, envoltura, programaBorrador } = ctx;
      const pasos = $$('[data-paso]', form);
      const barra = $('[data-barra]');
      const recordatorio = $('[data-recordatorio]');
      let actual = 0;
      const hechos = new Set();
      const conError = new Set();

      /* ----- Barra ----- */
      function construyeBarra() {
        if (!barra) return;
        barra.textContent = '';
        const nav = document.createElement('nav');
        nav.setAttribute('aria-label', barra.dataset.barra || 'Avance del formulario');
        const lista = document.createElement('ol');
        lista.className = 'pasos';
        pasos.forEach((p, i) => {
          const li = document.createElement('li');
          li.className = 'pasos-item';
          const b = document.createElement('button');
          b.type = 'button';
          b.className = 'pasos-btn';
          b.dataset.ir = String(i);
          const bol = document.createElement('span');
          bol.className = 'pasos-bolita';
          const num = document.createElement('span'); num.className = 'pasos-num'; num.textContent = String(i + 1);
          bol.append(num, icono('palomita', 'icono icono-sm pasos-icono pasos-hecho'), icono('alerta', 'icono icono-sm pasos-icono pasos-error'));
          const etq = document.createElement('span');
          etq.className = 'pasos-etq';
          etq.textContent = p.dataset.titulo;
          b.append(bol, etq);
          li.appendChild(b);
          lista.appendChild(li);
        });
        const txt = document.createElement('p');
        txt.className = 'pasos-actual';
        txt.dataset.pasoActual = '';
        txt.setAttribute('aria-hidden', 'true'); /* el botón actual ya lo dice en su nombre accesible */
        lista.addEventListener('click', (e) => { const b = e.target.closest('[data-ir]'); if (b) intentaIr(Number(b.dataset.ir)); });
        nav.append(lista, txt);
        barra.appendChild(nav);
      }

      function pintaBarra() {
        if (!barra) return;
        $$('.pasos-btn', barra).forEach((b, i) => {
          const hecho = hechos.has(i) && i !== actual && !conError.has(i);
          b.toggleAttribute('data-hecho', hecho);
          b.toggleAttribute('data-error', conError.has(i) && i !== actual);
          if (i === actual) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
          const estado = conError.has(i) && i !== actual ? `, ${M.pasoError}` : hecho ? `, ${M.pasoHecho}` : '';
          b.setAttribute('aria-label', `${plantilla(M.pasoTexto, { n: i + 1, total: pasos.length })}: ${pasos[i].dataset.titulo}${estado}`);
        });
        $('[data-paso-actual]', barra).textContent = `${plantilla(M.pasoTexto, { n: actual + 1, total: pasos.length })} · ${pasos[actual].dataset.titulo}`;
      }

      /* ----- Navegación ----- */
      function ir(i, { foco = true } = {}) {
        actual = i;
        pasos.forEach((p, k) => { p.hidden = k !== i; });
        quitaResumen();
        form.dispatchEvent(new CustomEvent('formkit:paso', { detail: { indice: i, paso: pasos[i], total: pasos.length } }));
        pintaBarra();
        if (foco) {
          const h = $('.titulo-paso', pasos[i]);
          if (h) { h.tabIndex = -1; h.focus(); }
          anuncia(plantilla(M.pasoAnuncio, { n: i + 1, total: pasos.length, titulo: pasos[i].dataset.titulo }));
        }
        programaBorrador();
      }

      /* Avanzar valida cada paso intermedio y se detiene en el primero con
         errores. Retroceder no valida: no se castiga volver. */
      function intentaIr(destino) {
        if (destino === actual) return true;
        if (destino < actual) { ir(destino); return true; }
        for (let i = actual; i < destino; i++) {
          const fallos = validaContenedor(pasos[i]);
          if (fallos.length) { conError.add(i); ir(i, { foco: false }); muestraResumen(pasos[i], fallos); pintaBarra(); return false; }
          conError.delete(i);
          hechos.add(i);
        }
        ir(destino);
        return true;
      }

      /* Al enviar se revalidan TODOS los pasos: la persona pudo saltar con la
         barra o editar desde la revisión. El primero con errores se abre. */
      FormKit.ganchos.validaTodo = (f) => {
        if (f !== form) return null;
        for (let i = 0; i < pasos.length; i++) {
          const fallos = validaContenedor(pasos[i]);
          if (fallos.length) { conError.add(i); ir(i, { foco: false }); muestraResumen(pasos[i], fallos); pintaBarra(); return fallos; }
          conError.delete(i);
        }
        return [];
      };
      /* Errores que devuelve el servidor: se abre el primer paso que tiene uno y ahí va el resumen. */
      FormKit.ganchos.erroresServidor = (f, fallos) => {
        if (f !== form) return false;
        const i = pasos.findIndex((p) => fallos.some((x) => p.contains(envoltura(x.campo))));
        if (i < 0) return false;
        conError.add(i); ir(i, { foco: false }); muestraResumen(pasos[i], fallos.filter((x) => pasos[i].contains(envoltura(x.campo))), 'servidor'); pintaBarra();
        return true;
      };
      /* Enter en un campo intermedio avanza; sólo en el último paso envía. */
      FormKit.ganchos.submit = (f, enviar) => { if (f !== form) return false; if (actual < pasos.length - 1) $('[data-accion="siguiente"]', pasos[actual])?.click(); else enviar(); return true; };

      form.addEventListener('click', (e) => {
        const b = e.target.closest('[data-accion="siguiente"],[data-accion="atras"],[data-editar]');
        if (!b || !form.contains(b)) return;
        if (b.dataset.accion === 'siguiente') intentaIr(actual + 1);
        else if (b.dataset.accion === 'atras') ir(actual - 1);
        else if (b.dataset.editar) { const n = b.dataset.editar; const i = pasos.findIndex((p) => p.contains(envoltura(n))); if (i >= 0) { ir(i, { foco: false }); enfocaCampo(n); } }
      });

      /* Recordatorio en la barra fija: lo que la persona está haciendo. */
      if (recordatorio && recordatorio.dataset.recordatorio) {
        const n = recordatorio.dataset.recordatorio;
        const pinta = () => { const t = ctx.textoDeValor(n); recordatorio.hidden = !t || actual === 0; const dest = $('[data-recordatorio-texto]', recordatorio); if (dest) dest.textContent = t; };
        form.addEventListener('formkit:paso', pinta);
        form.addEventListener('change', pinta);
      }

      /* Borrador: paso actual y pasos hechos. */
      const estadoAnterior = FormKit.ganchos.estadoBorrador;
      FormKit.ganchos.estadoBorrador = (f) => ({ ...(estadoAnterior ? estadoAnterior(f) : {}), paso: actual, hechos: [...hechos] });
      const restauraAnterior = FormKit.ganchos.restauraBorrador;
      FormKit.ganchos.restauraBorrador = (f, b) => { if (restauraAnterior) restauraAnterior(f, b); (b.hechos || []).forEach((i) => hechos.add(i)); ir(Math.min(b.paso || 0, pasos.length - 1), { foco: false }); };

      construyeBarra();
      ir(0, { foco: false });

      FormKit.pasos = { ir: intentaIr, actual: () => actual, total: pasos.length, elementos: pasos };
    }
  });
}());


/* ===== codigo/modulos/revision/revision.js ===== */
/* =========================================================
   revision.js · Módulo «revision» · nivel RECOMENDADO

   Pantalla de revisión antes de enviar: un bloque plegable por paso con el
   resumen de una línea y el detalle dentro; cada dato con «Editar», que
   aterriza en el campo (no al inicio del paso). Los identificadores con
   data-enmascara se muestran parcialmente ocultos.

   Contrato HTML (último paso del formulario):
     <section class="tarjeta" data-paso data-revision data-titulo="Revisión" hidden>
       <h2 class="titulo-paso">Revisa antes de enviar</h2>
       <div data-revision-lista></div> …
   Depende de: pasos.js (y de su evento formkit:paso).
   ========================================================= */
(function () {
  'use strict';
  FormKit.registra('revision', {
    selector: '[data-revision]',
    iniciar(form, ctx) {
      const { $, $$, M, envoltura, etiquetaDe, textoDeValor, activo, icono } = ctx;
      const sec = $('[data-revision]', form);
      const dest = $('[data-revision-lista]', sec);
      const pasos = $$('[data-paso]', form);

      function texto(n) {
        const el = envoltura(n);
        const t = textoDeValor(n);
        return el.hasAttribute('data-enmascara') && FormKit.enmascara ? FormKit.enmascara(t) : t;
      }

      function pinta() {
        dest.textContent = '';
        pasos.forEach((p) => {
          if (p === sec) return;
          const nombres = $$('[data-campo]', p).map((e) => e.dataset.campo).filter(activo);
          if (!nombres.length) return;
          const det = document.createElement('details');
          det.className = 'rev-bloque';
          det.open = true;
          const sum = document.createElement('summary');
          sum.className = 'rev-titulo';
          const rot = document.createElement('span'); rot.className = 'rev-rotulo'; rot.textContent = p.dataset.titulo;
          const res = document.createElement('span'); res.className = 'rev-resumen';
          res.textContent = nombres.map(texto).filter(Boolean).slice(0, 2).join(' · ') || M.sinValor;
          sum.append(rot, res, icono('abajo', 'icono rev-flecha'));
          const dl = document.createElement('dl');
          dl.className = 'rev-datos';
          for (const n of nombres) {
            const dt = document.createElement('dt'); dt.className = 'rev-dato-etq'; dt.textContent = etiquetaDe(n);
            const dd = document.createElement('dd'); dd.className = 'rev-dato-valor';
            const val = document.createElement('span'); val.textContent = texto(n) || M.sinValor;
            const ed = document.createElement('button');
            ed.type = 'button'; ed.className = 'btn-enlace'; ed.dataset.editar = n;
            ed.append(icono('editar', 'icono icono-sm'), document.createTextNode(M.editar));
            const oculto = document.createElement('span'); oculto.className = 'solo-lector'; oculto.textContent = ` ${etiquetaDe(n)}`;
            ed.appendChild(oculto);
            dd.append(val, ed);
            dl.append(dt, dd);
          }
          det.append(sum, dl);
          dest.appendChild(det);
        });
      }
      form.addEventListener('formkit:paso', (e) => { if (e.detail.paso === sec) pinta(); });
      FormKit.revision = { pinta };
    }
  });
}());


/* ===== codigo/modulos/acuse/acuse.js ===== */
/* =========================================================
   acuse.js · Módulo «acuse» · nivel RECOMENDADO

   Pantalla de acuse al terminar: marca de recibido, folio copiable, fecha,
   «qué sigue» como secuencia y, si el servidor lo da, descarga del acuse.
   El foco va al título del acuse y se anuncia; el borrador ya lo borró el
   núcleo. También muestra la pantalla de límite de envíos (data-limite).

   Contrato HTML (fuera del <form>):
     <section class="tarjeta acuse" data-acuse hidden>
       <div class="acuse-marca" aria-hidden="true">…icono ok…</div>
       <h2 class="titulo-paso" tabindex="-1">Recibimos tu información</h2>
       <div class="acuse-datos">
         <div class="acuse-dato"><span class="acuse-etq">Folio</span>
           <div class="acuse-fila"><span class="acuse-valor" id="folio" data-acuse-folio></span>
             <button type="button" class="btn-enlace" data-copiar="#folio">Copiar folio</button></div></div>
         <div class="acuse-dato"><span class="acuse-etq">Recibido el</span><span data-acuse-fecha></span></div>
       </div>
       <ol class="secuencia">…</ol>
       <div class="acuse-acciones">
         <a class="btn btn-secundario" data-acuse-descarga hidden download>Descargar acuse (PDF, <span data-acuse-peso></span>)</a>
         <a class="btn btn-primario" href="/">Volver al inicio</a>
       </div>
     </section>
     <section class="tarjeta" data-limite hidden>
       <h2 class="titulo-paso" tabindex="-1">Por ahora no podemos recibir más envíos</h2>
       <button type="button" class="btn btn-primario" data-accion="reintentar">Volver</button>
     </section>
   La respuesta del servidor debe traer {folio, fecha} y opcionalmente
   {acuseUrl, acusePeso, acuseNombre}. La fecha se escribe con
   FormKit.utilidades.fechaHora (zona de la Ciudad, 24 horas); sin folio, el
   acuse lo dice con palabras, y sin fecha válida usa la hora en que llegó.

   El folio y la fecha (no los datos de la persona) se guardan en el
   dispositivo: si la persona recarga la página, vuelve a ver su acuse durante
   cfg.acuse.horasVisible. Un botón [data-acuse-nuevo] en el acuse («Llenar
   otra solicitud») lo olvida y abre el formulario vacío.

   Mientras se ve el acuse o el límite, lo que acompaña al formulario fuera de
   él (la barra de pasos .barra-fija, la franja del borrador y el aviso de
   guardado) se oculta, y vuelve como estaba al regresar al formulario.
   ========================================================= */
(function () {
  'use strict';
  FormKit.registra('acuse', {
    selector: '[data-acuse]',
    fueraDelFormulario: true,
    iniciar(form, ctx) {
      const { $, $$, cfg, M, anuncia, opciones, almacen } = ctx;
      const sec = $('[data-acuse]');
      const limite = $('[data-limite]');
      if (!sec) return;
      const clave = form.dataset.borrador ? `${form.dataset.borrador}:acuse` : '';
      const acompana = $$('.barra-fija, [data-franja-borrador], [data-guardado]');
      const estabaOculto = new Map();

      /* El título que se ve: en un formulario por pasos, el del paso abierto. */
      const tituloVisible = (destino) => $$('.titulo-paso', destino).find((h) => !h.closest('[hidden]')) || $('.titulo-paso', destino);
      function muestraSolo(destino) {
        if (destino === form) { for (const el of acompana) if (estabaOculto.has(el)) el.hidden = estabaOculto.get(el); estabaOculto.clear(); }
        else for (const el of acompana) { if (!estabaOculto.has(el)) estabaOculto.set(el, el.hidden); el.hidden = true; }
        for (const s of [form, sec, limite]) if (s) s.hidden = s !== destino;
        const h = tituloVisible(destino);
        if (h) { h.tabIndex = -1; h.focus(); anuncia(h.textContent); }
      }

      function pinta(respuesta, { recuperado = false } = {}) {
        const r = respuesta && typeof respuesta === 'object' ? respuesta : {};
        const fechaValida = r.fecha && !Number.isNaN(new Date(r.fecha).getTime()) ? r.fecha : new Date().toISOString();
        const folio = $('[data-acuse-folio]', sec);
        if (folio) folio.textContent = r.folio || M.acuseSinFolio;
        const copiar = $('[data-copiar="#folio"]', sec);
        if (copiar) copiar.hidden = !r.folio;
        const fecha = $('[data-acuse-fecha]', sec);
        if (fecha) fecha.textContent = FormKit.utilidades.fechaHora(fechaValida, cfg);
        const desc = $('[data-acuse-descarga]', sec);
        if (desc) {
          desc.hidden = !r.acuseUrl;
          if (r.acuseUrl) { desc.href = r.acuseUrl; desc.download = r.acuseNombre || `acuse-${r.folio || ''}.pdf`; if (r.acusePeso) { const peso = $('[data-acuse-peso]', desc); if (peso) peso.textContent = r.acusePeso; } }
        }
        if (clave && !recuperado) almacen.escribe(clave, JSON.stringify({ folio: r.folio || '', fecha: fechaValida, t: Date.now() }));
        muestraSolo(sec);
      }

      /* Si la página define alEnviar o alFallar, se respeta y se encadena. Se
         lee al enviar, no al iniciar: así vale también el que la página pase
         después en otra llamada a FormKit.iniciar. */
      const dePagina = (k) => (ctx.opcionesPagina || {})[k];
      opciones.alEnviar = (r, f) => { const previo = dePagina('alEnviar'); if (previo) previo(r, f); pinta(r); };
      opciones.alFallar = (e, f) => { const previo = dePagina('alFallar'); if (previo) previo(e, f); if (e && e.limite && limite) muestraSolo(limite); };

      /* «Volver» desde la pantalla de límite devuelve al formulario donde estaba. */
      if (limite) limite.addEventListener('click', (e) => { if (e.target.closest('[data-accion="reintentar"]')) muestraSolo(form); });

      /* «Llenar otra solicitud»: se olvida el acuse y la página empieza de cero. */
      sec.addEventListener('click', (e) => { if (!e.target.closest('[data-acuse-nuevo]')) return; if (clave) almacen.borra(clave); location.reload(); });

      /* Acuse de un envío reciente: la persona recargó o volvió a la página. */
      if (clave) {
        let guardado = null;
        try { guardado = JSON.parse(almacen.lee(clave) || 'null'); } catch (e) { guardado = null; }
        const vigente = guardado && typeof guardado.t === 'number' && Date.now() - guardado.t >= 0 && Date.now() - guardado.t < cfg.acuse.horasVisible * 3600000;
        if (vigente) pinta(guardado, { recuperado: true });
        else if (guardado !== null) almacen.borra(clave);
      }

      FormKit.acuse = { pinta, muestraSolo };
    }
  });
}());


/* ===== codigo/modulos/resultado/resultado.js ===== */
/* =========================================================
   resultado.js · Módulo «resultado» · nivel RECOMENDADO

   El desenlace de una decisión del personal: validar, rechazar, devolver
   para corregir o cerrar un trámite. El acuse es para quien envía; esto es
   para quien decide. Dice con claridad qué pasó, a qué hora y quién lo
   hizo, cita el motivo si lo hay y, si hay varias acciones en orden, las
   pone como secuencia «qué sigue». El foco va al título y se anuncia.

   FormKit.resultado(lugar, { tono, titulo, texto, hora, quien, motivo, pasos, nivel, oculta })
     · tono: la misma familia que la etiqueta de estado (módulo «estado»):
       ok (hecho: validado, aprobado), atencion (te toca actuar: devuelto
       para corregir), proceso (en marcha: turnado a otra área), rechazo
       (cerrado sin éxito: rechazado, cancelado) o terminado (concluido,
       archivado);
     · titulo con el resultado y su objeto («Solicitud EJ-123 validada»);
     · hora: Date o fecha ISO del servidor (sin ella, ahora); si no es de
       hoy, también se dice la fecha;
     · quien: nombre de quien decidió, tal como lo da el servidor;
     · motivo: el texto que escribió quien decidió, citado tal cual;
     · pasos: lista de lo que sigue, en orden («La persona recibe…»), que
       va como secuencia numerada, no encadenada en un párrafo;
     · nivel del título (2 por omisión);
     · oculta: elemento o lista de elementos que ya no aplican (el panel de
       decisión), que se ocultan.
   Lo que la página ponga en lugar con data-resultado-acciones (por ejemplo,
   «Volver a la lista de solicitudes») se conserva al final.

   Contrato HTML:
     <section class="resultado" data-resultado hidden>
       <div class="acciones" data-resultado-acciones>
         <a class="btn btn-primario" href="solicitudes.html">Volver a la lista de solicitudes</a>
       </div>
     </section>
   ========================================================= */
(function () {
  'use strict';
  const TONOS = {
    ok: { icono: 'ok', clase: 'resultado-ok' },
    atencion: { icono: 'alerta', clase: 'resultado-atencion' },
    proceso: { icono: 'reloj', clase: 'resultado-proceso' },
    rechazo: { icono: 'error', clase: 'resultado-rechazo' },
    terminado: { icono: 'archivo', clase: '' }
  };

  function resultado(lugar, opciones = {}) {
    const cfg = FormKit.config;
    const M = cfg.mensajes;
    const { plantilla } = FormKit.utilidades;
    const { tono = 'terminado', titulo = '', texto = '', hora, quien = '', motivo = '', pasos = [], nivel = 2, oculta } = opciones;
    const t = TONOS[tono] ? tono : 'terminado';
    const acciones = [...lugar.querySelectorAll(':scope > [data-resultado-acciones]')];

    const cabeza = document.createElement('div');
    cabeza.className = 'resultado-cabeza';
    const marca = document.createElement('span');
    marca.className = 'resultado-marca';
    marca.appendChild(FormKit.icono(TONOS[t].icono));
    const h = document.createElement(`h${Math.min(6, Math.max(2, nivel))}`);
    h.className = 'resultado-titulo';
    h.tabIndex = -1;
    h.textContent = titulo;
    cabeza.append(marca, h);

    /* «Quedó guardado a las 14:30 · Ana López»: la hora en la zona del formulario. */
    const cuando = hora ? new Date(hora) : new Date();
    const zona = { timeZone: cfg.fechas.zonaHoraria };
    const horaTxt = cuando.toLocaleTimeString(cfg.idioma, { ...zona, hour: '2-digit', minute: '2-digit', hourCycle: FormKit.utilidades.relojDe(cfg) });
    const dia = (d) => d.toLocaleDateString(cfg.idioma, { ...zona, dateStyle: 'long' });
    const esHoy = dia(cuando) === dia(new Date());
    const meta = document.createElement('p');
    meta.className = 'resultado-meta';
    const tiempo = document.createElement('time');
    tiempo.dateTime = cuando.toISOString();
    tiempo.textContent = esHoy ? plantilla(M.resultadoHora, { hora: horaTxt }) : plantilla(M.resultadoFechaHora, { fecha: dia(cuando), hora: horaTxt });
    meta.appendChild(tiempo);
    if (quien) meta.append(document.createTextNode(' · '), Object.assign(document.createElement('span'), { className: 'resultado-quien', textContent: quien }));

    const partes = [cabeza, meta];
    if (texto) partes.push(Object.assign(document.createElement('p'), { className: 'resultado-texto', textContent: texto }));
    if (motivo) {
      const fig = document.createElement('figure');
      fig.className = 'resultado-motivo';
      const rot = document.createElement('figcaption');
      rot.className = 'resultado-motivo-rotulo';
      rot.textContent = M.resultadoMotivo;
      const cita = document.createElement('blockquote');
      cita.className = 'resultado-motivo-texto';
      cita.textContent = motivo;
      fig.append(rot, cita);
      partes.push(fig);
    }
    /* «Qué sigue»: cada acción en su renglón numerado (FRM-84). */
    const lista = [].concat(pasos).filter(Boolean);
    if (lista.length) {
      const rot = document.createElement('p');
      rot.className = 'resultado-pasos-titulo';
      rot.textContent = M.resultadoQueSigue;
      const ol = document.createElement('ol');
      ol.className = 'secuencia';
      for (const paso of lista) { const li = document.createElement('li'); li.className = 'secuencia-item'; li.textContent = paso; ol.appendChild(li); }
      partes.push(rot, ol);
    }

    lugar.classList.add('resultado');
    for (const x of Object.values(TONOS)) if (x.clase) lugar.classList.remove(x.clase);
    if (TONOS[t].clase) lugar.classList.add(TONOS[t].clase);
    lugar.replaceChildren(...partes, ...acciones);
    for (const el of [].concat(oculta || [])) if (el) el.hidden = true;
    lugar.hidden = false;
    h.focus();
    FormKit.anuncia(`${titulo}. ${meta.textContent}.`);
    return lugar;
  }

  FormKit.resultado = resultado;
}());


/* ===== codigo/modulos/modal/modal.js ===== */
/* =========================================================
   modal.js · Módulo «modal» · nivel RECOMENDADO

   Diálogos con <dialog> nativo: el navegador atrapa el foco, cierra con
   Escape y devuelve el foco a quien lo abrió. Dos usos:
     1. Contenido que hay que leer (aviso de privacidad): botones con
        data-abre-dialogo="id" y data-cierra-dialogo dentro del <dialog>.
     2. Confirmación de una acción con efecto:
        FormKit.confirma(ancla, {titulo, texto, consecuencias, irreversible, si, no, peligro}) → Promise<boolean>
        Crea un <dialog role="alertdialog"> en el momento y lo retira al cerrar.
        · titulo pregunta por la acción con su objeto («¿Rechazar la solicitud EJ-123?»);
        · consecuencias: lista de lo que pasará («La persona recibe el motivo por correo»);
        · irreversible: true agrega «No se puede deshacer.» con su icono;
        · si repite el verbo de la acción («Rechazar solicitud»), nunca «Aceptar»;
        · no es la salida segura («Volver sin cambios») y recibe el foco;
        · peligro: true para lo destructivo (rechazar, cancelar, eliminar).
        Guardar una nota no pide confirmación; cerrar un trámite sí, con sus consecuencias.
   CUÁNDO NO: para errores de campo (van en el campo), para avisos que no
   exigen decisión (van en línea) ni para confirmar acciones recuperables.
   En teléfono el diálogo baja como hoja inferior (modal.css).
   ========================================================= */
(function () {
  'use strict';
  function abre(d) { if (d.showModal) d.showModal(); else d.setAttribute('open', ''); }
  function cierra(d) { if (d.close) d.close(); else d.removeAttribute('open'); }

  FormKit.registra('modal', {
    selector: '[data-abre-dialogo],dialog',
    fueraDelFormulario: true,
    iniciar() {
      /* Los escuchas del documento se registran una sola vez aunque la página
         tenga varios formularios (cada uno inicia sus módulos). */
      if (document.documentElement.dataset.modalListo !== undefined) return;
      document.documentElement.dataset.modalListo = '';
      document.addEventListener('click', (e) => {
        const ab = e.target.closest('[data-abre-dialogo]');
        if (ab) { const d = document.getElementById(ab.dataset.abreDialogo); if (d) abre(d); return; }
        const ce = e.target.closest('[data-cierra-dialogo]');
        if (ce) { const d = ce.closest('dialog'); if (d) cierra(d); }
      });
      /* Clic en el velo (fuera de la caja) cierra los diálogos que no son de confirmación. */
      document.addEventListener('click', (e) => {
        if (!(e.target instanceof HTMLDialogElement) || e.target.getAttribute('role') === 'alertdialog') return;
        const r = e.target.getBoundingClientRect();
        if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) cierra(e.target);
      });
    }
  });

  FormKit.confirma = function (ancla, cfg = {}) {
    const M = FormKit.config.mensajes;
    const { idUnico } = FormKit.utilidades;
    return new Promise((resolve) => {
      const d = document.createElement('dialog');
      d.className = 'dialogo dialogo-confirma';
      d.setAttribute('role', 'alertdialog');
      const idT = idUnico('conf-t'), idD = idUnico('conf-d');
      d.setAttribute('aria-labelledby', idT);
      const h = document.createElement('h2'); h.className = 'titulo-bloque dialogo-titulo'; h.id = idT; h.textContent = cfg.titulo || M.confirmaTitulo;
      /* Texto, consecuencias e «irreversible» forman la descripción que oye el lector. */
      const desc = document.createElement('div'); desc.id = idD; desc.className = 'dialogo-desc';
      if (cfg.texto) { const p = document.createElement('p'); p.className = 'texto-gris'; p.textContent = cfg.texto; desc.appendChild(p); }
      const consecuencias = (cfg.consecuencias || []).filter(Boolean);
      if (consecuencias.length) {
        const t = document.createElement('p'); t.className = 'dialogo-consecuencias-titulo'; t.textContent = M.confirmaConsecuencias;
        const ul = document.createElement('ul'); ul.className = 'dialogo-consecuencias';
        for (const c of consecuencias) { const li = document.createElement('li'); li.textContent = c; ul.appendChild(li); }
        desc.append(t, ul);
      }
      if (cfg.irreversible) {
        const p = document.createElement('p'); p.className = 'dialogo-irreversible';
        p.append(FormKit.icono('alerta'), document.createTextNode(M.confirmaIrreversible));
        desc.appendChild(p);
      }
      if (desc.childNodes.length) d.setAttribute('aria-describedby', idD);
      const acc = document.createElement('div'); acc.className = 'acciones dialogo-acciones';
      const no = document.createElement('button'); no.type = 'button'; no.className = 'btn btn-secundario'; no.textContent = cfg.no || M.confirmaNo; no.dataset.r = 'no';
      const si = document.createElement('button'); si.type = 'button'; si.className = cfg.peligro ? 'btn btn-peligro' : 'btn btn-primario'; si.textContent = cfg.si || M.confirmaSi; si.dataset.r = 'si';
      if (!cfg.si) console.warn('FormKit.confirma: «si» debe repetir el verbo de la acción («Rechazar solicitud»), no «Confirmar».');
      acc.append(no, si);
      d.append(h, desc, acc);
      document.body.appendChild(d);
      const termina = (ok) => { cierra(d); d.remove(); if (ancla && ancla.focus) ancla.focus(); resolve(ok); };
      d.addEventListener('click', (e) => { const b = e.target.closest('[data-r]'); if (b) termina(b.dataset.r === 'si'); });
      d.addEventListener('cancel', (e) => { e.preventDefault(); termina(false); });
      abre(d);
      /* El foco inicial va a la opción segura («Volver sin cambios»), no a la que actúa. */
      no.focus();
      FormKit.anuncia(`${h.textContent} ${desc.textContent}`, true);
    });
  };
}());


/* ===== codigo/modulos/copiar/copiar.js ===== */
/* =========================================================
   copiar.js · Módulo «copiar» · nivel RECOMENDADO

   Botón de copiar y de compartir con confirmación visible y anunciada.
     <button type="button" class="btn-enlace" data-copiar="#folio">Copiar folio</button>
     <button type="button" class="btn-enlace" data-compartir data-compartir-titulo="…" data-compartir-texto="…">Compartir</button>
   Si el portapapeles no está disponible, selecciona el texto y lo dice; si
   compartir no existe, cae en copiar el enlace. Los campos de solo lectura
   con data-copiable reciben su botón «Copiar» automáticamente.
   ========================================================= */
(function () {
  'use strict';
  FormKit.registra('copiar', {
    selector: '[data-copiar],[data-compartir],[data-copiable]',
    fueraDelFormulario: true,
    iniciar(form, ctx) {
      const { $$, M, anuncia, icono } = ctx;

      /* Campos de solo lectura copiables: botón junto al control. */
      for (const campo of $$('[data-copiable]', form)) {
        const ctl = campo.querySelector('input[readonly],textarea[readonly]');
        if (!ctl || campo.querySelector('[data-copiar]')) continue;
        ctl.id = ctl.id || FormKit.utilidades.idUnico('copiable');
        const grupo = document.createElement('div'); grupo.className = 'copiar-grupo';
        ctl.parentNode.insertBefore(grupo, ctl); grupo.appendChild(ctl);
        const b = document.createElement('button'); b.type = 'button'; b.className = 'btn btn-secundario copiar-btn'; b.dataset.copiar = `#${ctl.id}`;
        b.append(icono('copiar'), document.createTextNode('Copiar'));
        grupo.appendChild(b);
      }

      /* Un solo escucha en el documento aunque haya varios formularios. */
      if (document.documentElement.dataset.copiarListo !== undefined) return;
      document.documentElement.dataset.copiarListo = '';
      document.addEventListener('click', async (e) => {
        const cp = e.target.closest('[data-copiar]');
        if (cp) {
          const origen = document.querySelector(cp.dataset.copiar);
          const texto = origen ? ('value' in origen && origen.value !== undefined && origen.tagName !== 'BUTTON' ? origen.value : origen.textContent).trim() : '';
          const ok = await copia(texto, origen);
          confirma(cp, ok ? M.copiado : M.copiarFallo, ok);
          return;
        }
        const sh = e.target.closest('[data-compartir]');
        if (sh) {
          const datos = { title: sh.dataset.compartirTitulo || document.title, text: sh.dataset.compartirTexto || '', url: sh.dataset.compartirUrl || location.href };
          if (navigator.share) { try { await navigator.share(datos); confirma(sh, M.compartido, true); } catch (err) { /* la persona canceló */ } }
          else { const ok = await copia(datos.url); confirma(sh, ok ? `${M.compartirFallo} ${M.copiado}` : M.compartirFallo, ok); }
        }
      });

      async function copia(texto, origen) {
        try { await navigator.clipboard.writeText(texto); return true; }
        catch (err) {
          if (origen && origen.select) { origen.select(); try { return document.execCommand('copy'); } catch (e2) { return false; } }
          return false;
        }
      }
      /* Confirmación visible en el propio botón y anunciada; vuelve al texto
         original pasado un momento. Se toca sólo el último nodo de texto: el
         icono se conserva. */
      function confirma(b, texto, ok) {
        anuncia(texto, !ok);
        const nodo = [...b.childNodes].reverse().find((x) => x.nodeType === 3 && x.textContent.trim()) || b.appendChild(document.createTextNode(''));
        if (b.dataset.textoOriginal === undefined) b.dataset.textoOriginal = nodo.textContent;
        nodo.textContent = ` ${ok ? M.copiarBoton : M.copiarBotonFallo}`;
        clearTimeout(Number(b.dataset.temporizador));
        b.dataset.temporizador = String(setTimeout(() => { nodo.textContent = b.dataset.textoOriginal; }, FormKit.config.borrador.visibleMs));
      }
    }
  });
}());


/* ===== codigo/modulos/descarga/descarga.js ===== */
/* =========================================================
   descarga.js · Módulo «descarga» · nivel OPCIONAL

   Botones de descarga y enlaces a archivos. El texto dice la acción, el
   formato y el peso («Descargar acuse (PDF, 120 KB)»); icono más texto,
   nunca icono solo. Si el archivo se genera al momento, el botón muestra
   estado de carga; si abre en otra pestaña, lo dice. Si no se pudo
   preparar, un aviso junto al botón lo dice ([data-descarga-aviso]). Sus
   textos están en mensajes (descargaBoton, descargaPreparando,
   descargaLista, descargaError, enlaceNuevaPestana).

   Contrato HTML:
     <a class="btn btn-secundario descarga" href="…" download="acuse-2026.pdf"
        data-descarga data-formato="PDF" data-peso="120 KB">Descargar acuse</a>
     <button type="button" class="btn btn-secundario descarga" data-descarga data-generar="acuse" data-formato="PDF">Descargar acuse</button>
   Para data-generar, FormKit.descargas[nombre] debe devolver una promesa
   con {url, nombre, peso}. El nombre del archivo es descriptivo y nunca
   lleva datos personales.
   ========================================================= */
(function () {
  'use strict';
  FormKit.descargas = FormKit.descargas || {};
  FormKit.registra('descarga', {
    selector: '[data-descarga]',
    fueraDelFormulario: true,
    iniciar(form, ctx) {
      const { $$, anuncia, icono } = ctx;
      for (const b of $$('[data-descarga]')) {
        if (!b.querySelector('.icono')) b.prepend(icono('descarga'));
        pintaDetalle(b);
        if (b.target === '_blank') { const s = document.createElement('span'); s.className = 'solo-lector'; s.textContent = ` ${FormKit.config.mensajes.enlaceNuevaPestana}`; b.appendChild(s); }
      }
      function pintaDetalle(b) {
        const partes = [b.dataset.formato, b.dataset.peso].filter(Boolean);
        let det = b.querySelector('.descarga-detalle');
        if (!partes.length) return;
        if (!det) { det = document.createElement('span'); det.className = 'descarga-detalle'; b.appendChild(det); }
        det.textContent = ` (${partes.join(', ')})`;
      }
      /* Un solo escucha en el documento: con dos formularios en la página,
         sin esta guarda el archivo se descargaría dos veces. */
      if (document.documentElement.dataset.descargaListo !== undefined) return;
      document.documentElement.dataset.descargaListo = '';
      document.addEventListener('click', async (e) => {
        const b = e.target.closest('[data-generar][data-descarga]');
        if (!b || b.getAttribute('aria-busy') === 'true') return;
        const gen = FormKit.descargas[b.dataset.generar];
        if (!gen) return;
        const M = FormKit.config.mensajes;
        b.setAttribute('aria-busy', 'true'); b.setAttribute('aria-disabled', 'true');
        const texto = [...b.childNodes].find((x) => x.nodeType === 3);
        const original = texto ? texto.textContent : '';
        if (texto) texto.textContent = ` ${M.descargaBoton}`;
        anuncia(M.descargaPreparando);
        /* Si falla, se dice en un aviso junto al botón, no sólo al lector (FRM-40). */
        const previo = b.nextElementSibling && b.nextElementSibling.matches('[data-descarga-aviso]') ? b.nextElementSibling : null;
        if (previo) previo.hidden = true;
        try {
          const r = await gen();
          const a = document.createElement('a'); a.href = r.url; a.download = r.nombre || 'archivo'; document.body.appendChild(a); a.click(); a.remove();
          if (r.peso) { b.dataset.peso = r.peso; pintaDetalle(b); }
          anuncia(M.descargaLista);
        } catch (err) {
          let av = previo;
          if (!av) { av = document.createElement('div'); av.className = 'aviso'; av.dataset.descargaAviso = ''; b.after(av); }
          FormKit.aviso(av, { tono: 'advertencia', texto: M.descargaError });
        }
        finally { b.removeAttribute('aria-busy'); b.removeAttribute('aria-disabled'); if (texto) texto.textContent = original; }
      });
    }
  });
}());


/* ===== codigo/modulos/pestanas/pestanas.js ===== */
/* =========================================================
   pestanas.js · Módulo «pestanas» · nivel OPCIONAL

   Pestañas (patrón ARIA tabs): una lista de botones con role="tab" y un
   panel por pestaña. Teclado: flechas izquierda/derecha mueven y activan,
   Inicio/Fin saltan a los extremos; sólo la pestaña activa está en el orden
   de tabulación (tabindex rotatorio). CUÁNDO: vistas alternativas del mismo
   contenido (consulta interna, ayuda). CUÁNDO NO: para dividir un
   formulario en partes que deben llenarse todas —eso son pasos—, porque lo
   que está en una pestaña no activa pasa inadvertido.

   Contrato HTML:
     <div class="pestanas" data-pestanas>
       <div class="pestanas-lista" role="tablist" aria-label="Vistas">
         <button type="button" class="pestana" role="tab" id="p1" aria-controls="panel1" aria-selected="true">Datos</button>
         <button type="button" class="pestana" role="tab" id="p2" aria-controls="panel2" aria-selected="false" tabindex="-1">Historial</button>
       </div>
       <div class="pestanas-panel" role="tabpanel" id="panel1" aria-labelledby="p1" tabindex="0">…</div>
       <div class="pestanas-panel" role="tabpanel" id="panel2" aria-labelledby="p2" tabindex="0" hidden>…</div>
     </div>
   ========================================================= */
(function () {
  'use strict';
  FormKit.registra('pestanas', {
    selector: '[data-pestanas]',
    fueraDelFormulario: true,
    iniciar(form, ctx) {
      const { $$, anuncia } = ctx;
      for (const cont of $$('[data-pestanas]')) {
        if (cont.dataset.listo !== undefined) continue; /* ya iniciado por otro formulario de la página */
        cont.dataset.listo = '';
        const tabs = $$('[role="tab"]', cont);
        const activa = (tab, foco = true) => {
          for (const t of tabs) {
            const es = t === tab;
            t.setAttribute('aria-selected', String(es));
            t.tabIndex = es ? 0 : -1;
            const panel = document.getElementById(t.getAttribute('aria-controls'));
            if (panel) panel.hidden = !es;
          }
          if (foco) tab.focus();
          anuncia(FormKit.utilidades.plantilla(FormKit.config.mensajes.pestanaAnuncio, { nombre: tab.textContent.trim() }));
        };
        cont.addEventListener('click', (e) => { const t = e.target.closest('[role="tab"]'); if (t && tabs.includes(t)) activa(t, false); });
        cont.addEventListener('keydown', (e) => {
          const t = e.target.closest('[role="tab"]');
          if (!t) return;
          const i = tabs.indexOf(t);
          const mapa = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 };
          if (!(e.key in mapa)) return;
          e.preventDefault();
          activa(tabs[(mapa[e.key] + tabs.length) % tabs.length]);
        });
        const inicial = tabs.find((t) => t.getAttribute('aria-selected') === 'true') || tabs[0];
        if (inicial) activa(inicial, false);
      }
    }
  });
}());


/* ===== codigo/modulos/progreso/progreso.js ===== */
/* =========================================================
   progreso.js · Módulo «progreso» · nivel OPCIONAL

   Barra de progreso: porcentaje de avance de una carga o de un formulario
   largo de una sola página. Usa <progress> nativo (lo anuncia el lector) y
   escribe el porcentaje en texto al lado. CUÁNDO NO: en un formulario por
   pasos, cuya barra ya dice cuánto falta.
     <div class="progreso" data-progreso>
       <label class="progreso-etq" for="pg1">Subiendo archivos</label>
       <progress class="progreso-barra" id="pg1" max="100" value="40"></progress>
       <span class="progreso-txt" data-progreso-texto aria-hidden="true">40 %</span>
     </div>
   FormKit.progreso(el, valor) actualiza barra y texto. Sin valor conocido
   (indeterminado) se quita el atributo value y el texto dice «Cargando…».
   ========================================================= */
(function () {
  'use strict';
  FormKit.progreso = function (el, valor) {
    const barra = el.querySelector('progress');
    const txt = el.querySelector('[data-progreso-texto]');
    if (!barra) return;
    if (valor === null || valor === undefined) { barra.removeAttribute('value'); if (txt) txt.textContent = FormKit.config.mensajes.cargando; return; }
    const max = Number(barra.max || 100);
    const v = Math.max(0, Math.min(max, Number(valor)));
    barra.value = v;
    const pct = Math.round((v / max) * 100);
    if (txt) txt.textContent = `${pct} %`;
    barra.setAttribute('aria-valuetext', `${pct} por ciento`);
  };
  FormKit.registra('progreso', {
    selector: '[data-progreso]',
    fueraDelFormulario: true,
    iniciar(form, ctx) { for (const el of ctx.$$('[data-progreso]')) { const b = el.querySelector('progress'); if (b) FormKit.progreso(el, b.hasAttribute('value') ? b.value : null); } }
  });
}());


/* ===== codigo/modulos/paginacion/paginacion.js ===== */
/* =========================================================
   paginacion.js · Módulo «paginacion» · nivel OPCIONAL

   Navegación de resultados para listas y tablas extensas (consulta
   interna). Paginación numerada por omisión; «Cargar más» con data-modo=
   "mas". El desplazamiento infinito no se ofrece: perjudica al teclado y
   al pie de página. Requisitos que cumple: contenedor <nav> con etiqueta,
   página actual con aria-current, «Anterior»/«Siguiente» deshabilitados de
   forma explícita, rango visible («Mostrando 21–40 de 312»), selector de
   tamaño de página, anuncio del cambio, foco devuelto al inicio de la lista
   y versión reducida en teléfono («Página X de N»). Los filtros y el orden
   los conserva quien escucha el evento: el módulo sólo dice qué página.

   Contrato HTML:
     <nav class="paginacion" data-paginacion data-total="312" data-pagina="2"
          data-tamano="20" data-tamanos="10,20,50" data-lista="#resultados" aria-label="Páginas de resultados"></nav>
   Evento: el <nav> emite «formkit:pagina» con {pagina, tamano, desde, hasta}.
   FormKit.paginacion(nav, {total, pagina}) actualiza desde fuera.
   ========================================================= */
(function () {
  'use strict';
  function pinta(nav, ctx) {
    const { M, plantilla, anuncia, icono } = ctx;
    const total = Number(nav.dataset.total || 0), tam = Number(nav.dataset.tamano || 20);
    const paginas = Math.max(1, Math.ceil(total / tam));
    const pagina = Math.min(paginas, Math.max(1, Number(nav.dataset.pagina || 1)));
    nav.dataset.pagina = String(pagina);
    const desde = total ? (pagina - 1) * tam + 1 : 0, hasta = Math.min(total, pagina * tam);
    nav.textContent = '';

    const rango = document.createElement('p'); rango.className = 'paginacion-rango'; rango.textContent = plantilla(M.paginacionRango, { desde, hasta, total });
    const lista = document.createElement('ul'); lista.className = 'paginacion-lista';
    const boton = (texto, ir, cfg = {}) => {
      const li = document.createElement('li');
      const b = document.createElement('button'); b.type = 'button'; b.className = `paginacion-btn${cfg.clase ? ` ${cfg.clase}` : ''}`;
      if (cfg.icono) b.append(icono(cfg.icono, 'icono icono-sm'));
      b.append(document.createTextNode(texto));
      if (cfg.actual) { b.setAttribute('aria-current', 'page'); b.setAttribute('aria-label', plantilla(M.paginacionActual, { n: texto })); }
      if (cfg.deshabilitado) { b.setAttribute('aria-disabled', 'true'); } else b.dataset.ir = String(ir);
      if (cfg.etiqueta) b.setAttribute('aria-label', cfg.etiqueta);
      li.appendChild(b); return li;
    };
    lista.appendChild(boton(M.paginacionAnterior, pagina - 1, { deshabilitado: pagina === 1, icono: 'flecha-izq', clase: 'paginacion-prev' }));
    if (nav.dataset.modo !== 'mas') {
      /* Primera, última, la actual y una a cada lado; puntos suspensivos entre huecos. */
      const visibles = new Set([1, paginas, pagina - 1, pagina, pagina + 1].filter((n) => n >= 1 && n <= paginas));
      let previo = 0;
      for (const n of [...visibles].sort((a, b) => a - b)) {
        if (n - previo > 1) { const li = document.createElement('li'); li.className = 'paginacion-salto'; li.setAttribute('aria-hidden', 'true'); li.textContent = '…'; lista.appendChild(li); }
        lista.appendChild(boton(String(n), n, { actual: n === pagina, clase: 'paginacion-num' }));
        previo = n;
      }
    }
    lista.appendChild(boton(nav.dataset.modo === 'mas' ? M.paginacionMas : M.paginacionSiguiente, pagina + 1, { deshabilitado: pagina >= paginas, icono: nav.dataset.modo === 'mas' ? 'mas' : 'flecha-der', clase: 'paginacion-next' }));
    const compacto = document.createElement('p'); compacto.className = 'paginacion-compacto'; compacto.textContent = plantilla(M.paginacionPagina, { n: pagina, total: paginas });

    const sel = document.createElement('label'); sel.className = 'paginacion-tamano';
    const tamanos = (nav.dataset.tamanos || '').split(',').map((s) => Number(s.trim())).filter(Boolean);
    if (tamanos.length) {
      sel.append(document.createTextNode('Por página '));
      const s = document.createElement('select'); s.className = 'control control-select paginacion-select';
      for (const t of tamanos) { const o = document.createElement('option'); o.value = String(t); o.textContent = String(t); o.selected = t === tam; s.appendChild(o); }
      s.addEventListener('change', () => { nav.dataset.tamano = s.value; nav.dataset.pagina = '1'; cambia(nav, ctx); });
      sel.appendChild(s);
    }
    nav.append(rango, lista, compacto, tamanos.length ? sel : document.createTextNode(''));
  }

  function cambia(nav, ctx, foco = false) {
    pinta(nav, ctx);
    const total = Number(nav.dataset.total || 0), tam = Number(nav.dataset.tamano || 20), pagina = Number(nav.dataset.pagina);
    nav.dispatchEvent(new CustomEvent('formkit:pagina', { bubbles: true, detail: { pagina, tamano: tam, desde: (pagina - 1) * tam, hasta: Math.min(total, pagina * tam) } }));
    ctx.anuncia(ctx.plantilla(ctx.M.paginacionAnuncio, { n: pagina, total: Math.max(1, Math.ceil(total / tam)) }));
    if (foco) {
      const lista = nav.dataset.lista && document.querySelector(nav.dataset.lista);
      const destino = lista || nav;
      if (!destino.hasAttribute('tabindex')) destino.tabIndex = -1;
      destino.focus({ preventScroll: false });
    }
  }

  FormKit.registra('paginacion', {
    selector: '[data-paginacion]',
    fueraDelFormulario: true,
    iniciar(form, ctx) {
      for (const nav of ctx.$$('[data-paginacion]')) {
        if (nav.dataset.listo !== undefined) continue; /* ya iniciada por otro formulario de la página */
        nav.dataset.listo = '';
        pinta(nav, ctx);
        nav.addEventListener('click', (e) => { const b = e.target.closest('[data-ir]'); if (!b) return; nav.dataset.pagina = b.dataset.ir; cambia(nav, ctx, true); });
      }
      FormKit.paginacion = (nav, datos = {}) => { Object.assign(nav.dataset, Object.fromEntries(Object.entries(datos).map(([k, v]) => [k, String(v)]))); pinta(nav, ctx); };
    }
  });
}());


/* ===== codigo/modulos/tooltip/tooltip.js ===== */
/* =========================================================
   tooltip.js · Módulo «tooltip» · nivel OPCIONAL

   Ayuda desplegable junto a una etiqueta: un botón «?» con nombre
   accesible que muestra y oculta un texto corto. Se abre con clic o toque y
   con Enter/espacio (no sólo al pasar el cursor, que el dedo no tiene);
   Escape lo cierra; el texto queda enlazado al botón con aria-describedby
   mientras está abierto. CUÁNDO NO: para instrucciones necesarias para
   llenar el campo (van en la ayuda visible), para repetir lo que la ayuda
   visible ya dice (si basta, no hay ícono; auditar-campos D5) ni para
   textos largos.

     <span class="tooltip" data-tooltip>
       <button type="button" class="btn-icono tooltip-btn" aria-expanded="false" aria-label="Ayuda sobre el folio">
         <svg class="icono icono-sm" aria-hidden="true"><use href="#i-ayuda"></use></svg></button>
       <span class="tooltip-texto" role="tooltip" hidden>El folio aparece en la esquina superior de tu acuse.</span>
     </span>
   ========================================================= */
(function () {
  'use strict';
  FormKit.registra('tooltip', {
    selector: '[data-tooltip]',
    fueraDelFormulario: true,
    iniciar(form, ctx) {
      const { $$ } = ctx;
      /* La lista se lee al momento: los tooltips que otro formulario de la
         misma página agregue después también se cierran con Escape o clic fuera. */
      const todos = () => $$('[data-tooltip]');
      for (const t of todos()) {
        const b = t.querySelector('button'); const txt = t.querySelector('.tooltip-texto');
        if (!b || !txt || t.dataset.listo !== undefined) continue;
        t.dataset.listo = '';
        txt.id = txt.id || FormKit.utilidades.idUnico('tt');
        b.addEventListener('click', () => pon(t, txt.hidden));
      }
      function pon(t, abrir) {
        const b = t.querySelector('button'); const txt = t.querySelector('.tooltip-texto');
        if (abrir) for (const o of todos()) if (o !== t) pon(o, false);
        txt.hidden = !abrir;
        b.setAttribute('aria-expanded', String(abrir));
        if (abrir) b.setAttribute('aria-describedby', txt.id); else b.removeAttribute('aria-describedby');
      }
      if (document.documentElement.dataset.tooltipListo !== undefined) return;
      document.documentElement.dataset.tooltipListo = '';
      document.addEventListener('keydown', (e) => { if (e.key === 'Escape') for (const t of todos()) if (!t.querySelector('.tooltip-texto').hidden) { pon(t, false); t.querySelector('button').focus(); } });
      document.addEventListener('click', (e) => { if (!e.target.closest('[data-tooltip]')) for (const t of todos()) pon(t, false); });
    }
  });
}());


/* ===== codigo/modulos/tabla/tabla.js ===== */
/* =========================================================
   tabla.js · Módulo «tabla» · nivel OPCIONAL

   Tabla de consulta y tabla de captura. Lo que el CSS no puede hacer solo:
     · en teléfono cada celda muestra su encabezado (data-etiqueta) para que
       la tabla se lea como tarjetas apiladas; el módulo lo copia de <th>;
     · orden accesible por columna: botones en <th> con aria-sort;
     · estados vacío, de carga y de error con mensajes útiles;
     · acciones por fila con nombre accesible que identifica la fila.
   La tabla de captura (filas editables) es el módulo «repetibles» con la
   clase .tabla-captura: aquí sólo se le da forma.

   Se inicia solo al cargar la página, haya o no formulario (una página de
   pura consulta también lo usa). Cuando la página pinta o vuelve a pintar
   filas o encabezados, avisa con el evento formkit:tabla en el [data-tabla]:
   el módulo vuelve a leer los encabezados y a preparar las celdas.

   Contrato HTML:
     <div class="tabla-marco" data-tabla data-clave="folio">
       <table class="tabla"><caption class="tabla-titulo">Solicitudes</caption>
         <thead><tr><th scope="col" data-ordenable>Folio</th>…<th scope="col">Acciones</th></tr></thead>
         <tbody><tr data-folio="EJ-123"><td><span class="mono">EJ-123</span></td>…<td><button type="button" class="btn-icono" data-accion-fila="ver">…</button></td></tr></tbody>
       </table>
       <p class="tabla-vacia" data-tabla-vacia hidden>No hay resultados con esos filtros.</p>
       <p data-tabla-cargando hidden>Cargando…</p>
       <div class="aviso aviso-bloqueo" data-tabla-error tabindex="-1" hidden>…<div class="aviso-texto"></div></div>
     </div>
   Una celda con data-etiqueta escrito en el HTML conserva ese rótulo. El
   contenido de cada celda va en .tabla-valor (lo pone el módulo). En
   computadora no se parten botones, folios (.mono) ni etiquetas, y la
   columna de acciones (encabezado sólo para el lector) toma el ancho de sus
   botones. Desde código: FormKit.tabla.inicia() para tablas agregadas
   después y FormKit.tabla.estado(marco, 'cargando' | 'error' | '', texto).
   ========================================================= */
(function () {
  'use strict';
  const { $, $$, plantilla } = FormKit.utilidades;
  /* Un encabezado cuyo texto es sólo para el lector de pantalla (.solo-lector) no se muestra en teléfono. */
  const soloLector = (th) => { const c = th.cloneNode(true); for (const s of $$('.solo-lector', c)) s.remove(); return !c.textContent.trim(); };
  const textoDe = (th) => th.textContent.replace(/\s+/g, ' ').trim();

  function prepara(marco) {
    const tabla = $('table', marco);
    if (!tabla) return;
    const M = FormKit.config.mensajes;
    const clave = marco.dataset.clave;
    const ths = () => $$('thead th', tabla);

    /* Rótulos de las celdas, leídos de los encabezados actuales cada vez: si la
       página los pinta después (un encabezado calculado), se actualizan. Los
       que puso el módulo llevan data-etiqueta-auto; los del HTML no se tocan. */
    function etiquetaCeldas() {
      const encabezados = ths();
      for (const tr of $$('tbody tr', tabla)) $$('td', tr).forEach((td, i) => {
        /* El contenido de la celda va junto en .tabla-valor: en teléfono es la columna del valor. */
        if (!(td.children.length === 1 && td.firstElementChild.classList.contains('tabla-valor') && td.childNodes.length === 1)) {
          const valor = document.createElement('div');
          valor.className = 'tabla-valor';
          valor.append(...td.childNodes);
          td.appendChild(valor);
        }
        const th = encabezados[i];
        if (!th || (td.dataset.etiqueta !== undefined && td.dataset.etiquetaAuto === undefined)) return;
        td.dataset.etiqueta = textoDe(th);
        td.dataset.etiquetaAuto = '';
        td.toggleAttribute('data-etiqueta-oculta', soloLector(th));
      });
      /* Acciones por fila: «Ver», no basta; «Ver solicitud 123» sí. */
      for (const tr of $$('tbody tr', tabla)) {
        const id = clave ? (tr.dataset[clave] || ($$('td', tr)[encabezados.findIndex((t) => textoDe(t).toLowerCase() === clave)] || {}).textContent) : '';
        for (const b of $$('[data-accion-fila]', tr)) if (!b.getAttribute('aria-label')) b.setAttribute('aria-label', `${b.textContent.trim() || b.dataset.accionFila} ${id || ''}`.trim());
      }
      const vacio = $('[data-tabla-vacia]', marco);
      if (vacio) vacio.hidden = $$('tbody tr', tabla).length > 0;
    }

    /* Orden por columna: botón dentro del th, aria-sort en el th. Un
       encabezado que todavía no tiene texto se prepara cuando lo tenga. */
    function preparaOrden() {
      ths().forEach((th, i) => {
        if (!th.hasAttribute('data-ordenable') || $('.tabla-orden', th)) return;
        const texto = textoDe(th);
        if (!texto) return;
        th.textContent = '';
        const b = document.createElement('button'); b.type = 'button'; b.className = 'tabla-orden';
        b.append(document.createTextNode(texto), FormKit.icono('abajo', 'icono icono-sm tabla-orden-icono'));
        th.appendChild(b);
        th.setAttribute('aria-sort', 'none');
        b.addEventListener('click', () => {
          const asc = th.getAttribute('aria-sort') !== 'ascending';
          for (const o of ths()) o.setAttribute('aria-sort', o === th ? (asc ? 'ascending' : 'descending') : 'none');
          const filas = $$('tbody tr', tabla);
          const val = (tr) => { const td = $$('td', tr)[i]; const t = td ? td.textContent.trim() : ''; const n = Number(t.replace(/[^\d.-]/g, '')); return t && !Number.isNaN(n) && /^[\d.,\s$-]+$/.test(t) ? n : t.toLowerCase(); };
          filas.sort((a, b2) => { const x = val(a), y = val(b2); return (x > y ? 1 : x < y ? -1 : 0) * (asc ? 1 : -1); });
          const tb = $('tbody', tabla); for (const f of filas) tb.appendChild(f);
          FormKit.anuncia(plantilla(M.tablaOrdenada, { columna: texto, sentido: asc ? M.tablaAscendente : M.tablaDescendente }));
        });
      });
    }

    const repinta = () => { preparaOrden(); etiquetaCeldas(); };
    repinta();
    marco.addEventListener('formkit:tabla', repinta);
  }

  /* Una sola vez por tabla, desde la carga o desde el primer formulario que la vea. */
  function iniciaTablas() {
    for (const marco of $$('[data-tabla]')) {
      if (marco.dataset.listo !== undefined) continue;
      marco.dataset.listo = '';
      prepara(marco);
    }
  }

  FormKit.tabla = Object.assign(FormKit.tabla || {}, {
    /* Estados de carga y error: el contenido se oculta y se anuncia qué pasa. */
    estado(m, estado, texto) {
      const car = $('[data-tabla-cargando]', m), err = $('[data-tabla-error]', m), t = $('table', m);
      if (car) car.hidden = estado !== 'cargando';
      if (err) { err.hidden = estado !== 'error'; if (texto) $('.aviso-texto', err).textContent = texto; }
      if (t) t.toggleAttribute('aria-busy', estado === 'cargando');
      if (estado === 'error' && err) err.focus();
    },
    /* Para tablas que la página agrega después de cargar. */
    inicia: iniciaTablas
  });
  FormKit.registra('tabla', { selector: '[data-tabla]', fueraDelFormulario: true, iniciar: iniciaTablas });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciaTablas); else iniciaTablas();
}());


/* ===== codigo/modulos/estado/estado.js ===== */
/* =========================================================
   estado.js · Módulo «estado» · nivel OPCIONAL

   Etiquetas de estado de un trámite o un registro («En revisión»,
   «Validada»). Cinco familias según a quién le toca qué, cada una con su
   tono y su icono:
     ok         · verde · palomita · hecho: validado, aprobado, pagado;
     atencion   · ámbar · alerta   · te toca actuar: corregir, completar,
                                     un borrador sin enviar;
     proceso    · azul  · reloj    · en marcha: en revisión, en trámite;
     rechazo    · rojo  · error    · cerrado sin éxito: rechazado,
                                     cancelado, vencido;
     terminado  · gris  · archivo  · terminado: concluido, archivado.
   La palabra dice el estado; el color y el icono sólo lo refuerzan. Un
   sistema no inventa tonos: cada estado suyo cae en una de las cinco.

   Se inicia solo al cargar la página: a la etiqueta que no trae su icono se
   le pone el de su familia. FormKit.estado(el, { tono, texto, anuncia }) la
   cambia después (anuncia: true cuando cambia por una acción de la persona)
   y FormKit.estado.inicia(contenedor) prepara las que la página pinte después.

   Contrato HTML:
     <span class="estado estado-proceso">En revisión</span>
   ========================================================= */
(function () {
  'use strict';
  const ICONOS = { ok: 'ok', atencion: 'alerta', proceso: 'reloj', rechazo: 'error', terminado: 'archivo' };
  const tonoDe = (el) => Object.keys(ICONOS).find((t) => el.classList.contains(`estado-${t}`));

  function pinta(el) {
    let tono = tonoDe(el);
    if (!tono) {
      console.warn(`FormKit.estado: a «${el.textContent.trim()}» le falta su familia (estado-ok, estado-atencion, estado-proceso, estado-rechazo o estado-terminado); queda como terminado.`);
      tono = 'terminado';
      el.classList.add('estado-terminado');
    }
    const previo = el.querySelector(':scope > .icono');
    const nuevo = FormKit.icono(ICONOS[tono], 'icono icono-sm');
    if (previo) previo.replaceWith(nuevo); else el.prepend(nuevo);
  }

  function estado(el, { tono, texto, anuncia = false } = {}) {
    if (tono && ICONOS[tono]) {
      for (const t of Object.keys(ICONOS)) el.classList.remove(`estado-${t}`);
      el.classList.add(`estado-${tono}`);
    }
    if (texto !== undefined) el.replaceChildren(document.createTextNode(texto));
    el.classList.add('estado');
    pinta(el);
    if (anuncia) FormKit.anuncia(el.textContent.trim());
    return el;
  }

  /* Las que aún no tienen icono; también sirve para etiquetas que la página pinta después. */
  function inicia(cont = document) {
    for (const el of cont.querySelectorAll('.estado')) if (!el.querySelector(':scope > .icono')) pinta(el);
  }

  FormKit.estado = Object.assign(estado, { inicia });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => inicia()); else inicia();
}());


/* ===== codigo/modulos/archivos/archivos.js ===== */
/* =========================================================
   archivos.js · Módulo «archivos» · nivel RECOMENDADO

   Zona de carga de archivos y fotografías. La zona es un botón real
   (teclado y lector de pantalla) que también recibe arrastrados; en el
   teléfono ofrece cámara y galería (botón aparte con capture). Dice los
   formatos y el límite ANTES de que la persona elija (FRM-51). Cada archivo
   tiene su estado (en espera, optimizando, listo, con error), vista previa
   si es imagen, botón de quitar y de reintentar.

   Validaciones en el navegador (el servidor las repite todas):
     · extensión en la lista; firma (primeros bytes) coherente con la
       extensión; tamaño mínimo (no vacío), máximo por archivo (medido
       DESPUÉS de optimizar) y total; número máximo;
     · duplicados por huella SHA-256 del original;
     · nombre saneado (sin rutas ni caracteres de control; el servidor
       asigna el nombre definitivo);
     · imágenes: dimensiones mínimas; optimización a --lado px / calidad;
       los metadatos EXIF (fecha y GPS) se leen y viajan sólo si la
       configuración lo pide (archivos.conservarExif, decisión C6); si no,
       la foto viaja sin ellos siempre que se puedan quitar.
   Un archivo soltado fuera de la zona no abre el navegador sobre él.

   Contrato HTML:
     <div class="campo" data-campo="fotos" data-requerido>
       <span class="etiqueta" id="et-fotos">Fotografías o documentos</span>
       <p class="ayuda">Ayudan a valorar el caso.</p>
       <div data-archivos>
         <button type="button" class="zona-carga" aria-describedby="…">
           <svg class="icono" aria-hidden="true"><use href="#i-adjunto"></use></svg>
           <span class="zona-carga-texto">Elegir archivos o arrastrarlos aquí</span>
           <span class="zona-carga-limite" data-limite-texto></span>
         </button>
         <button type="button" class="btn btn-secundario zona-camara" data-camara hidden>Tomar fotografía</button>
         <input type="file" hidden>
         <input type="file" accept="image/*" capture="environment" hidden data-entrada-camara>
         <div data-rechazos></div>
         <ul class="lista-arch"></ul>
       </div>
     </div>
   Para una fotografía de la persona (retrato) se usa la cámara frontal:
   capture="user" en lugar de capture="environment" (campo «Fotografía de frente»).
   Configuración por campo (opcional): data-extensiones="jpg,png", data-mb,
   data-max, data-total-mb. Lo demás viene de validaciones.config.js.
   Con el máximo cargado, [data-archivos] lleva data-lleno: se ocultan
   «Elegir archivo» y la cámara, y la frase .arch-lleno lo dice bajo la lista.
   Borrador: el estándar no guarda archivos en el dispositivo; la página
   puede dar un proveedor, FormKit.iniciar(form, { borradorArchivos:
   { guarda(campo, archivos), lee(campo), borra(campo) } }).
   Desde código: FormKit.archivos.de(el) (la lista de un campo) y
   FormKit.archivos.agrega(archivos, el).
   ========================================================= */
(function () {
  'use strict';
  const BYTES_POR_MB = 1048576;
  const archivosPorCampo = new WeakMap();

  FormKit.registra('archivos', {
    selector: '[data-archivos]',
    tipos: {
      archivos: {
        detecta: (el) => !!el.querySelector('[data-archivos]'),
        controles: (el) => [el.querySelector('.zona-carga')],
        valorDe: (el) => ((archivosPorCampo.get(el) || []).filter((a) => a.estado !== 'error').length ? String(archivosPorCampo.get(el).length) : ''),
        textoDe: (el) => (archivosPorCampo.get(el) || []).map((a) => a.nombre).join(', '),
        enBorrador: false,
        fueraDeDatos: true,
        alArmar: (form, payload) => {
          payload.archivos = [];
          for (const el of form.querySelectorAll('[data-campo]')) {
            const lista = archivosPorCampo.get(el);
            if (lista) for (const a of lista) if (a.estado !== 'error') payload.archivos.push({ campo: el.dataset.campo, nombre: a.nombre, tipo: a.tipo, size: a.size, original: a.original, sha256_original: a.sha256_original, optimizada: !!a.optimizada, dimensiones: a.dimensiones, fecha_captura: a.fecha_captura, lat_captura: a.lat_captura, lon_captura: a.lon_captura, blob: a.blob });
          }
        },
        antesDeEnviar: async (form) => { for (const el of form.querySelectorAll('[data-campo]')) for (const a of archivosPorCampo.get(el) || []) if (a.promesa) await a.promesa; }
      }
    },
    iniciar(form, ctx) {
      const { $, $$, cfg, M, plantilla, anuncia, pesoTxt, icono, limpia, programaBorrador } = ctx;
      const A = cfg.archivos;

      function configDe(el) {
        const d = el.dataset;
        return {
          extensiones: d.extensiones ? d.extensiones.split(',').map((s) => s.trim().toLowerCase()) : A.extensiones,
          mb: Number(d.mb || A.mb), mbTotal: Number(d.totalMb || A.mbTotal), max: Number(d.max || A.max),
          conservarExif: d.conservarExif !== undefined ? d.conservarExif !== 'false' : A.conservarExif
        };
      }
      const ext = (nombre) => String(nombre || '').split('.').pop().toLowerCase();
      const formatosTxt = (c) => cfg.formatosArchivo(c.extensiones);
      /* Nombre saneado: sin rutas ni caracteres que no se ven o que invierten el texto
         («recibo‮fdp.png» se leería «recibognp.pdf»), acotado y, si se recorta, con su
         extensión (el servidor la necesita para saber qué es). */
      const saneaNombre = (n) => {
        const limpio = String(n || 'archivo').split(/[\\/]/).pop().replace(/[\u0000-\u001F\u007F-\u009F​-‏‪-‮⁠-⁤⁦-⁩﻿]/g, '').replace(/\s+/g, ' ').trim() || 'archivo';
        if (limpio.length <= A.nombreMax) return limpio;
        const e = limpio.match(/\.[A-Za-z0-9]{1,10}$/);
        return e ? `${limpio.slice(0, A.nombreMax - e[0].length)}${e[0]}` : limpio.slice(0, A.nombreMax);
      };
      const hexDe = (buf) => Array.from(new Uint8Array(buf), (x) => x.toString(16).padStart(2, '0')).join('');
      const huellaDe = (buf) => ((window.crypto && crypto.subtle && crypto.subtle.digest) ? crypto.subtle.digest('SHA-256', buf).then(hexDe, () => '') : Promise.resolve(''));

      /* Firma del archivo: los primeros bytes dicen qué es de verdad. */
      function firmaCoincide(buf, extension) {
        const firmas = A.firmas[extension];
        if (!firmas) return true; /* sin firma conocida no se rechaza: lo decide el servidor */
        const b = new Uint8Array(buf.slice(0, 12));
        if (extension === 'heic') return b.length > 8 && String.fromCharCode(b[4], b[5], b[6], b[7]) === 'ftyp';
        return firmas.some((f) => f.every((x, i) => b[i] === x));
      }

      /* Lector mínimo de EXIF (JPG): fecha de captura y coordenadas GPS. */
      function leeExif(buf) {
        const r = {};
        try {
          const v = new DataView(buf);
          if (v.byteLength < 4 || v.getUint16(0) !== 0xFFD8) return r;
          let o = 2;
          while (o + 4 <= v.byteLength) {
            const m = v.getUint16(o);
            if ((m & 0xFF00) !== 0xFF00 || m === 0xFFDA) break;
            const largo = v.getUint16(o + 2);
            if (m === 0xFFE1 && v.getUint32(o + 4) === 0x45786966) {
              const t = o + 10;
              const le = v.getUint16(t) === 0x4949;
              const g16 = (p) => v.getUint16(p, le), g32 = (p) => v.getUint32(p, le);
              if (g16(t + 2) !== 42) return r;
              const ifd = (p) => { const n = g16(p); const e = {}; for (let i = 0; i < n; i++) { const q = p + 2 + i * 12; e[g16(q)] = { n: g32(q + 4), en: q + 8 }; } return e; };
              const txt = (x) => { const p = x.n > 4 ? t + g32(x.en) : x.en; let s = ''; for (let i = 0; i < x.n; i++) { const c = v.getUint8(p + i); if (!c) break; s += String.fromCharCode(c); } return s; };
              const racs = (x) => { const p = t + g32(x.en); const a = []; for (let i = 0; i < x.n; i++) { const d = g32(p + i * 8 + 4); a.push(d ? g32(p + i * 8) / d : 0); } return a; };
              const cero = ifd(t + g32(t + 4));
              let fecha = '';
              if (cero[0x8769]) { const ex = ifd(t + g32(cero[0x8769].en)); if (ex[0x9003]) fecha = txt(ex[0x9003]); }
              if (!fecha && cero[0x0132]) fecha = txt(cero[0x0132]);
              const f = fecha.match(/^(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2}):(\d{2})/);
              if (f) r.fecha = `${f[1]}-${f[2]}-${f[3]}T${f[4]}:${f[5]}:${f[6]}`;
              if (cero[0x8825]) {
                const g = ifd(t + g32(cero[0x8825].en));
                if (g[2] && g[4]) {
                  const la = racs(g[2]), lo = racs(g[4]);
                  let dla = la[0] + (la[1] || 0) / 60 + (la[2] || 0) / 3600, dlo = lo[0] + (lo[1] || 0) / 60 + (lo[2] || 0) / 3600;
                  if (g[1] && txt(g[1]) === 'S') dla = -dla;
                  if (g[3] && txt(g[3]) === 'W') dlo = -dlo;
                  if (dla || dlo) { r.lat = +dla.toFixed(6); r.lon = +dlo.toFixed(6); }
                }
              }
              return r;
            }
            o += 2 + largo;
          }
        } catch (e) { /* un EXIF dañado no impide agregar la foto */ }
        return r;
      }

      /* Quita de un JPG sus metadatos (APP1: EXIF y XMP; APP13: IPTC) sin tocar
         la imagen, y lo que venga pegado después de su fin (FFD9), como otra
         imagen con su propia ubicación. null si el archivo no se puede leer como JPG. */
      function sinExif(buf) {
        const v = new DataView(buf);
        if (v.byteLength < 4 || v.getUint16(0) !== 0xFFD8) return null;
        const partes = [buf.slice(0, 2)];
        let o = 2;
        while (o + 4 <= v.byteLength) {
          const m = v.getUint16(o);
          if ((m & 0xFF00) !== 0xFF00) return null;
          if (m === 0xFFDA) {
            const bytes = new Uint8Array(buf);
            let fin = bytes.length;
            for (let i = o + 2; i + 1 < bytes.length; i++) if (bytes[i] === 0xFF && bytes[i + 1] === 0xD9) { fin = i + 2; break; }
            partes.push(buf.slice(o, fin));
            return new Blob(partes, { type: 'image/jpeg' });
          }
          const fin = o + 2 + v.getUint16(o + 2);
          if (fin > v.byteLength) return null;
          if (m !== 0xFFE1 && m !== 0xFFED) partes.push(buf.slice(o, fin));
          o = fin;
        }
        return null;
      }

      /* Reduce y recodifica (lo que además retira el EXIF de la imagen). */
      function optimizaFoto(file) {
        const o = A.optimiza;
        if (typeof createImageBitmap !== 'function') return Promise.reject(new Error('sin createImageBitmap'));
        return createImageBitmap(file, { imageOrientation: 'from-image' }).then((bmp) => {
          const k = Math.min(1, o.lado / Math.max(bmp.width, bmp.height));
          const c = document.createElement('canvas');
          c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
          const x = c.getContext('2d');
          x.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--blanco').trim();
          x.fillRect(0, 0, c.width, c.height);
          x.drawImage(bmp, 0, 0, c.width, c.height);
          const dims = { ancho: bmp.width, alto: bmp.height };
          if (bmp.close) bmp.close();
          return new Promise((ok, mal) => c.toBlob((b) => (b ? ok({ blob: b, ancho: c.width, alto: c.height, origen: dims }) : mal(new Error('sin blob'))), 'image/jpeg', o.calidad));
        });
      }

      function procesa(f, a, el, c) {
        const lista = archivosPorCampo.get(el);
        a.estado = 'procesando';
        a.promesa = f.arrayBuffer().then(async (buf) => {
          const e = ext(f.name);
          if (!firmaCoincide(buf, e)) throw Object.assign(new Error('firma'), { motivo: M.archRechazoFirma });
          a.sha256_original = await huellaDe(buf);
          if (a.sha256_original && lista.some((x) => x !== a && x.sha256_original === a.sha256_original)) throw Object.assign(new Error('duplicado'), { motivo: M.archRechazoDuplicado });
          const esFoto = A.optimiza.tipos.includes(e);
          if (esFoto) {
            const meta = ['jpg', 'jpeg'].includes(e) ? leeExif(buf) : {};
            if (c.conservarExif) { if (meta.fecha) a.fecha_captura = meta.fecha; if (meta.lat !== undefined) { a.lat_captura = meta.lat; a.lon_captura = meta.lon; } }
            const opt = await optimizaFoto(f).catch(() => null);
            if (opt && (opt.origen.ancho < A.imagen.anchoMin || opt.origen.alto < A.imagen.altoMin)) throw Object.assign(new Error('dimension'), { motivo: plantilla(M.archRechazoDimension, { ancho: A.imagen.anchoMin, alto: A.imagen.altoMin }) });
            /* Sin conservarExif (decisión C6), la foto viaja siempre recodificada, sin EXIF ni ubicación,
               aunque así pese más que la original. Si no se pudo recodificar, al JPG se le quitan los
               metadatos; si tampoco se puede, la foto se agrega como está: la Secretaría decidió no
               rechazar una foto por sus metadatos (18 oct 2026). */
            /* Recodificada, es un JPG: el nombre lo dice, para que la firma que revisa el servidor coincida. */
            if (opt && (opt.blob.size < f.size || !c.conservarExif)) { a.blob = opt.blob; a.size = opt.blob.size; a.tipo = 'image/jpeg'; a.optimizada = opt.blob.size < f.size; a.dimensiones = `${opt.ancho}x${opt.alto}`; if (!['jpg', 'jpeg'].includes(e)) a.nombre = `${a.nombre.replace(/\.[^.]*$/, '')}.jpg`; }
            else if (!c.conservarExif) {
              const limpio = ['jpg', 'jpeg'].includes(e) ? sinExif(buf) : null;
              a.blob = limpio || f; a.size = a.blob.size; a.optimizada = false;
            } else { a.blob = f; a.optimizada = false; }
            a.vista = URL.createObjectURL(a.blob);
          } else a.blob = f;
          /* El límite se mide DESPUÉS de optimizar: una foto de 30 MB que queda en 1 MB no se rechaza por lo que pesaba. */
          if (a.size > c.mb * BYTES_POR_MB) throw Object.assign(new Error('peso'), { motivo: plantilla(a.optimizada ? M.archRechazoOptimizada : M.archRechazoPeso, { peso: pesoTxt(a.size), mb: c.mb }) });
          const total = lista.filter((x) => x.estado !== 'error').reduce((s, x) => s + (x.size || 0), 0);
          if (total > c.mbTotal * BYTES_POR_MB) throw Object.assign(new Error('total'), { motivo: plantilla(M.archRechazoTotal, { mb: c.mbTotal }) });
          a.estado = 'listo';
          anuncia(plantilla(M.archAgregado, { nombre: a.nombre }));
        }).catch((err) => {
          a.estado = 'error';
          a.codigo = err.message;
          a.motivo = err.motivo || M.archRechazoProceso;
          a.archivoOriginal = f;
        }).then(() => { delete a.promesa; pinta(el); if (a.estado === 'listo') { limpia(el.dataset.campo); programaBorrador(); } });
      }

      function agrega(archivos, el) {
        const c = configDe(el);
        const lista = archivosPorCampo.get(el);
        const rechazos = [];
        for (const f of archivos) {
          const nombre = saneaNombre(f.name);
          if (lista.filter((x) => x.estado !== 'error').length >= c.max) { rechazos.push({ nombre, motivo: plantilla(c.max === 1 ? M.archRechazoMaxUno : M.archRechazoMax, { max: c.max }) }); continue; }
          /* Un JPG también vale donde se admite una foto que se recodifica a JPG (png, webp): así vuelve del proveedor. */
          const admite = c.extensiones.includes(ext(f.name)) || (['jpg', 'jpeg'].includes(ext(f.name)) && c.extensiones.some((x) => A.optimiza.tipos.includes(x)));
          if (!admite) { rechazos.push({ nombre, motivo: plantilla(M.archRechazoTipo, { formatos: formatosTxt(c) }) }); continue; }
          if (f.size < A.minBytes) { rechazos.push({ nombre, motivo: M.archRechazoVacio }); continue; }
          const esFoto = A.optimiza.tipos.includes(ext(f.name));
          if (!esFoto && f.size > c.mb * BYTES_POR_MB) { rechazos.push({ nombre, motivo: plantilla(M.archRechazoPeso, { peso: pesoTxt(f.size), mb: c.mb }) }); continue; }
          const a = { nombre, size: f.size, original: f.size, tipo: f.type, fuente: f };
          lista.push(a);
          procesa(f, a, el, c);
        }
        pintaRechazos(el, rechazos);
        pinta(el);
        programaBorrador();
      }

      function pintaRechazos(el, rechazos) {
        const dest = $('[data-rechazos]', el);
        if (!dest) return;
        dest.textContent = '';
        for (const r of rechazos) {
          const d = document.createElement('p');
          d.className = 'arch-rechazo';
          d.setAttribute('role', 'alert');
          const t = document.createElement('strong'); t.textContent = plantilla(M.archRechazoTitulo, { nombre: r.nombre });
          d.append(icono('error', 'icono icono-sm'), t, document.createTextNode(` ${r.motivo}`));
          dest.appendChild(d);
        }
      }

      function pinta(el) {
        const ul = $('.lista-arch', el);
        const lista = archivosPorCampo.get(el);
        ul.textContent = '';
        lista.forEach((a, i) => {
          const li = document.createElement('li');
          li.className = 'arch';
          li.dataset.estado = a.estado || 'espera';
          if (a.vista) { const img = document.createElement('img'); img.className = 'arch-vista'; img.src = a.vista; img.alt = ''; img.width = 96; img.height = 96; li.appendChild(img); }
          else li.appendChild(icono(a.estado === 'procesando' ? 'cargando' : a.estado === 'error' ? 'error' : 'adjunto', `icono arch-icono${a.estado === 'procesando' ? ' icono-giro' : ''}`));
          const cuerpo = document.createElement('div'); cuerpo.className = 'arch-cuerpo';
          const n = document.createElement('span'); n.className = 'arch-nombre'; n.textContent = a.nombre;
          const e = document.createElement('span'); e.className = 'arch-estado';
          e.textContent = a.estado === 'procesando' ? M.archOptimizando : a.estado === 'error' ? `${M.prefijoError} ${a.motivo}` : plantilla(a.optimizada ? M.archOptimizada : M.archPeso, { peso: pesoTxt(a.size) });
          cuerpo.append(n, e);
          li.appendChild(cuerpo);
          /* Reintentar sólo tiene sentido ante un fallo de proceso, no ante un rechazo de regla. */
          if (a.estado === 'error' && a.archivoOriginal && !['firma', 'duplicado', 'dimension', 'peso', 'total'].includes(a.codigo)) {
            const r = document.createElement('button'); r.type = 'button'; r.className = 'btn-enlace'; r.dataset.reintentar = String(i); r.textContent = M.archReintentar; li.appendChild(r);
          }
          const q = document.createElement('button'); q.type = 'button'; q.className = 'btn-icono arch-quitar'; q.dataset.quitar = String(i);
          q.setAttribute('aria-label', plantilla(M.archQuitar, { nombre: a.nombre }));
          q.appendChild(icono('cerrar'));
          li.appendChild(q);
          ul.appendChild(li);
        });
        /* Con el máximo ya cargado, «Elegir archivo» y la cámara se ocultan (data-lleno): a la vista,
           la persona creía que no había subido nada. Vuelven al quitar un archivo. */
        const cont = $('[data-archivos]', el);
        const c = configDe(el);
        const lleno = lista.filter((x) => x.estado !== 'error').length >= c.max;
        if (cont && cont.hasAttribute('data-lleno') !== lleno) {
          const conFoco = cont.contains(document.activeElement) && document.activeElement.matches('.zona-carga,[data-camara]');
          cont.toggleAttribute('data-lleno', lleno);
          /* Lo que se anuncia también se ve (FRM-40): la frase queda bajo la lista mientras siga lleno. */
          let nota = $('.arch-lleno', el);
          if (!nota && lleno) { nota = document.createElement('p'); nota.className = 'arch-lleno'; ul.after(nota); }
          if (nota && !lleno) nota.hidden = true;
          if (lleno) {
            anuncia(plantilla(c.max === 1 ? M.archLlenoUno : M.archLleno, { max: c.max }), { visible: nota });
            if (conFoco) { const q = $$('.arch-quitar', ul).pop(); if (q) q.focus(); }
          }
        }
      }

      for (const cont of $$('[data-archivos]', form)) {
        const el = cont.closest('[data-campo]');
        archivosPorCampo.set(el, []);
        const c = configDe(el);
        const zona = $('.zona-carga', cont);
        const entrada = $('input[type="file"]:not([data-entrada-camara])', cont);
        const camara = $('[data-entrada-camara]', cont);
        const btnCamara = $('[data-camara]', cont);
        const lim = $('[data-limite-texto]', cont);
        entrada.accept = c.extensiones.map((e) => `.${e}`).join(',');
        entrada.multiple = c.max > 1;
        const fmts = formatosTxt(c);
        if (lim) lim.textContent = plantilla(c.max === 1 ? M.archLimiteUno : M.archLimite, { admitidos: fmts.includes(',') ? M.archFormatos : M.archFormato, formatos: fmts, max: c.max, mb: c.mb });
        const etq = $('.etiqueta', el);
        if (etq) { etq.id = etq.id || ctx.idUnico(`et-${el.dataset.campo}`); const zt = $('.zona-carga-texto', zona); if (zt) zt.id = zt.id || ctx.idUnico(`zt-${el.dataset.campo}`); zona.setAttribute('aria-labelledby', `${etq.id}${zt ? ` ${zt.id}` : ''}`); }
        /* La cámara se ofrece sólo donde existe: teléfonos y tabletas con puntero grueso. */
        if (btnCamara && camara && matchMedia('(pointer: coarse)').matches && c.extensiones.some((e) => A.optimiza.tipos.includes(e))) { btnCamara.hidden = false; if (!btnCamara.querySelector('.icono')) btnCamara.prepend(icono('camara')); }

        zona.addEventListener('click', () => entrada.click());
        if (btnCamara && camara) btnCamara.addEventListener('click', () => camara.click());
        entrada.addEventListener('change', () => { agrega(Array.from(entrada.files), el); entrada.value = ''; });
        if (camara) camara.addEventListener('change', () => { agrega(Array.from(camara.files), el); camara.value = ''; });
        zona.addEventListener('dragover', (e) => { e.preventDefault(); zona.setAttribute('data-encima', ''); });
        zona.addEventListener('dragleave', () => zona.removeAttribute('data-encima'));
        zona.addEventListener('drop', (e) => { e.preventDefault(); zona.removeAttribute('data-encima'); agrega(Array.from(e.dataTransfer.files), el); });

        cont.addEventListener('click', (e) => {
          const q = e.target.closest('[data-quitar]');
          if (q) {
            const lista = archivosPorCampo.get(el);
            const [quitado] = lista.splice(Number(q.dataset.quitar), 1);
            if (quitado && quitado.vista) URL.revokeObjectURL(quitado.vista);
            pinta(el);
            anuncia(plantilla(M.archQuitado, { nombre: quitado.nombre }));
            ($('.arch-quitar', cont) || zona).focus();
            programaBorrador();
            return;
          }
          const r = e.target.closest('[data-reintentar]');
          if (r) { const lista = archivosPorCampo.get(el); const a = lista[Number(r.dataset.reintentar)]; if (a && a.archivoOriginal) { delete a.motivo; procesa(a.archivoOriginal, a, el, configDe(el)); pinta(el); } }
        });
      }

      /* Un archivo soltado fuera de la zona haría que el navegador lo abriera y la persona perdiera todo. */
      window.addEventListener('dragover', (e) => { if (!e.target.closest || !e.target.closest('.zona-carga')) e.preventDefault(); });
      window.addEventListener('drop', (e) => { if (!e.target.closest || !e.target.closest('.zona-carga')) e.preventDefault(); });

      /* Archivos en el borrador. El estándar no los guarda en el dispositivo (FRM-43); si la
         página da un proveedor, FormKit.iniciar(form, { borradorArchivos: { guarda(campo, archivos),
         lee(campo), borra(campo) } }), al escribir el borrador se le pasan los archivos listos de
         cada campo tal como se enviarían: sin conservarExif, la foto ya limpia (sin ubicación, de
         cualquier formato) y derecha, y con nombre .jpg si se recodificó, para que al volver
         coincida su firma. Al restaurarlo se le piden (File o promesa de File) y al borrarlo se le avisa.
         El proveedor decide dónde guardarlos (en el servidor, en el almacén del sistema). */
      const camposArchivo = () => $$('[data-archivos]', form).map((c) => c.closest('[data-campo]'));
      const conProveedor = (fn) => { const p = ctx.opciones.borradorArchivos; if (!p) return; for (const el of camposArchivo()) Promise.resolve().then(() => fn(p, el)).catch(() => { /* un proveedor que falla no detiene el formulario */ }); };
      const paraProveedor = (a, c) => {
        if (c.conservarExif || !a.blob || a.blob === a.fuente) return a.fuente;
        const nombre = a.tipo === 'image/jpeg' && !/\.jpe?g$/i.test(a.nombre) ? `${a.nombre.replace(/\.[^.]*$/, '')}.jpg` : a.nombre;
        return new File([a.blob], nombre, { type: a.tipo || a.blob.type });
      };
      ctx.alBorrador({
        escribe: () => conProveedor((p, el) => p.guarda && p.guarda(el.dataset.campo, (archivosPorCampo.get(el) || []).filter((a) => a.estado === 'listo' && a.fuente).map((a) => paraProveedor(a, configDe(el))))),
        restaura: () => conProveedor((p, el) => p.lee && Promise.resolve(p.lee(el.dataset.campo)).then((archivos) => { if (archivos && archivos.length) agrega(Array.from(archivos), el); })),
        borra: () => conProveedor((p, el) => p.borra && p.borra(el.dataset.campo))
      });

      FormKit.archivos = { de: (el) => archivosPorCampo.get(el) || [], agrega };
    }
  });
}());


/* ===== codigo/modulos/visor/visor.js ===== */
/* =========================================================
   visor.js · Módulo «visor» · nivel OPCIONAL

   Visor de documentos para quien revisa lo que se cargó: muestra TODAS las
   hojas de un PDF, una debajo de otra, con contador de hoja, acercar y
   alejar, ajustar al ancho, girar y abrir en otra pestaña; también muestra
   imágenes (JPEG, PNG). En computadora (FORMKIT_CONFIG.visor.fijoDesde,
   1024 px) queda fijo junto a lo que se revisa, para decidir viendo el
   documento; en pantallas más chicas se abre a pantalla completa como
   diálogo (Escape cierra y el foco vuelve al botón que lo abrió).

   Usa pdf.js (vendor/pdfjs-dist, sin CDN) y lo carga sólo al abrir el
   primer PDF. Si no se puede cargar (por ejemplo, la página se abrió con
   doble clic, sin servidor), muestra el documento con el visor del
   navegador y lo dice.

   Contrato HTML (el visor va junto a lo que se revisa, en .visor-area):
     <div class="visor-area">
       <div>… <button type="button" class="btn-enlace" data-visor-url="docs/ine.pdf"
                 data-visor-titulo="Identificación oficial" data-visor-archivo="ine.pdf">Ver documento</button> …</div>
       <dialog class="visor" data-visor aria-labelledby="visor-titulo">
         <div class="visor-cabeza">
           <div class="visor-nombre"><h3 class="visor-titulo" id="visor-titulo" data-visor-titulo>Documento</h3>
             <p class="visor-archivo mono" data-visor-archivo></p></div>
           <button type="button" class="btn-enlace visor-cerrar" data-visor-accion="cerrar">Cerrar</button>
         </div>
         <div class="visor-barra" role="toolbar" aria-label="Herramientas del visor">
           <button type="button" class="btn btn-secundario" data-visor-accion="alejar" aria-label="Alejar"><span class="visor-paso" aria-hidden="true">−</span></button>
           <output class="visor-zoom" data-visor-zoom aria-live="polite">100 %</output>
           <button type="button" class="btn btn-secundario" data-visor-accion="acercar" aria-label="Acercar"><span class="visor-paso" aria-hidden="true">+</span></button>
           <button type="button" class="btn btn-secundario" data-visor-accion="ajustar">Ajustar al ancho</button>
           <button type="button" class="btn btn-secundario" data-visor-accion="girar">Girar</button>
           <a class="btn-enlace visor-abrir" data-visor-abrir href="#" target="_blank" rel="noopener">Abrir en otra pestaña …</a>
         </div>
         <p class="visor-pagina" data-visor-pagina aria-live="polite"></p>
         <div class="aviso visor-aviso" data-visor-aviso hidden></div>
         <div class="visor-hojas" data-visor-hojas tabindex="0" aria-label="Hojas del documento"></div>
         <p class="visor-nota" data-visor-nota hidden></p>
       </dialog>
     </div>
   Desde código: FormKit.visor.abre({ url, titulo, archivo, tipo, nota }, boton).
   Para una imagen sin extensión en la dirección (blob:), data-visor-tipo="image/png".
   ========================================================= */
(function (global) {
  'use strict';
  /* Acercamientos: la hoja de estilos da el ancho de cada uno (data-zoom), sin estilos en línea. */
  const ZOOMS = [0.5, 0.75, 1, 1.25, 1.5, 2, 3];
  const AJUSTAR = 2; /* 100 %: la hoja al ancho del visor */
  /* pdf.js se busca en vendor/pdfjs-dist/, junto a la carpeta que contiene
     modulos/: codigo/ en el estándar (formularios/vendor/) o una copia del
     estándar (<carpeta>/formkit/ → <carpeta>/vendor/); con dist/formkit.js, junto a
     dist/. Si está en otro lugar, FORMKIT_CONFIG.visor.pdfjs. */
  const src = document.currentScript && document.currentScript.src;
  const raiz = src && src.match(/^(.*\/)(?:modulos\/visor\/visor|formkit)\.js(?:\?.*)?$/);
  const PDFJS_JUNTO = raiz ? new URL('../vendor/pdfjs-dist/', raiz[1]).href : '';

  let listo = false;
  let pdfjs = null;
  let d, hojas, aviso, contador, ancho, cfg, M;
  let estado = { doc: null, imagen: false, url: '', zoom: AJUSTAR, giro: 0, tarea: 0 };
  let origen = null;
  let observador = null;

  const base = () => { const r = cfg.visor.pdfjs || PDFJS_JUNTO || 'vendor/pdfjs-dist/'; return new URL(r.endsWith('/') ? r : `${r}/`, document.baseURI).href; };
  /* Aviso con el icono de su tono (FRM-39), pintado por el núcleo. */
  const di = (texto) => { if (!texto) { aviso.hidden = true; return; } aviso = FormKit.aviso(aviso, { tono: 'advertencia', texto }); };
  const hoja = (n, total) => FormKit.utilidades.plantilla(M.visorHoja, { n, total });
  const esImagen = (tipo, nombre) => /^image\//.test(tipo || '') || /\.(jpe?g|png|webp|gif)(\?.*)?$/i.test(nombre || '');

  function carga() {
    if (pdfjs) return Promise.resolve(pdfjs);
    return import(new URL('pdf.min.mjs', base()).href).then((m) => {
      m.GlobalWorkerOptions.workerSrc = new URL('pdf.worker.min.mjs', base()).href;
      pdfjs = m;
      return m;
    });
  }

  /* Pinta todas las hojas al ancho disponible por el acercamiento elegido. */
  async function pinta() {
    const tarea = ++estado.tarea;
    const factor = ZOOMS[estado.zoom];
    d.querySelector('[data-visor-zoom]').textContent = `${Math.round(factor * 100)} %`;
    if (estado.imagen) {
      hojas.dataset.zoom = String(Math.round(factor * 100));
      const img = hojas.querySelector('img');
      if (img) img.dataset.giro = String(estado.giro);
      return;
    }
    const doc = estado.doc;
    if (!doc) return;
    const disponible = Math.max(hojas.clientWidth - 2 * parseFloat(getComputedStyle(hojas).paddingLeft || 0), 1);
    const dpr = global.devicePixelRatio || 1;
    const figuras = [];
    for (let n = 1; n <= doc.numPages; n++) {
      const pagina = await doc.getPage(n);
      if (tarea !== estado.tarea) return; /* llegó otro documento u otro acercamiento */
      const giro = (pagina.rotate + estado.giro) % 360;
      const medida = pagina.getViewport({ scale: 1, rotation: giro });
      const vista = pagina.getViewport({ scale: ((disponible * factor) / medida.width) * dpr, rotation: giro });
      const lienzo = document.createElement('canvas');
      lienzo.width = Math.floor(vista.width);
      lienzo.height = Math.floor(vista.height);
      lienzo.className = 'visor-lienzo';
      lienzo.setAttribute('role', 'img');
      lienzo.setAttribute('aria-label', hoja(n, doc.numPages));
      const fig = document.createElement('figure');
      fig.className = 'visor-hoja-pdf';
      fig.dataset.hoja = String(n);
      /* Sin pie «Hoja n de total»: ya lo dice el contador de la barra, y repetido debajo
         de la hoja confundía. Al lector se lo dice el nombre del lienzo. */
      fig.append(lienzo);
      figuras.push(fig);
      await pagina.render({ canvasContext: lienzo.getContext('2d'), viewport: vista }).promise;
    }
    if (tarea !== estado.tarea) return;
    hojas.replaceChildren(...figuras);
    hojas.dataset.zoom = String(Math.round(factor * 100));
    observa();
  }

  /* Contador: la hoja que más se ve. */
  function observa() {
    if (observador) observador.disconnect();
    const visibles = new Map();
    observador = new IntersectionObserver((entradas) => {
      if (!estado.doc) return;
      for (const e of entradas) visibles.set(e.target.dataset.hoja, e.intersectionRatio);
      const [h] = [...visibles.entries()].sort((a, b) => b[1] - a[1])[0] || ['1'];
      contador.textContent = hoja(h, estado.doc.numPages);
    }, { root: hojas, threshold: [0, 0.25, 0.5, 0.75, 1] });
    for (const f of hojas.querySelectorAll('figure')) observador.observe(f);
    contador.textContent = hoja(1, estado.doc.numPages);
  }

  /* En computadora queda abierto junto a lo que se revisa sin quitarle el foco a quien revisa (show() lo movería). */
  function abreDialogo() {
    if (ancho.matches) { if (!d.open) d.setAttribute('open', ''); } else if (!d.open) d.showModal();
  }

  /* Si pdf.js no se pudo cargar, el documento se muestra con el visor del navegador. */
  function enNavegador(url, titulo) {
    const marco = document.createElement('iframe');
    marco.className = 'visor-marco';
    marco.src = url;
    marco.title = titulo;
    hojas.replaceChildren(marco);
    di(M.visorNavegador);
  }

  async function abre({ url, titulo = 'Documento', archivo = '', tipo = '', nota = '' }, boton) {
    if (!prepara()) return;
    origen = boton || null;
    d.querySelector('[data-visor-titulo]').textContent = titulo;
    d.querySelector('[data-visor-archivo]').textContent = archivo;
    d.querySelector('[data-visor-abrir]').href = url;
    const n = d.querySelector('[data-visor-nota]');
    if (n) { n.textContent = nota; n.hidden = !nota; }
    abreDialogo();
    if (url === estado.url && (estado.doc || estado.imagen)) return;
    if (observador) observador.disconnect();
    estado = { doc: null, imagen: false, url, zoom: AJUSTAR, giro: 0, tarea: estado.tarea + 1 };
    hojas.replaceChildren();
    contador.textContent = '';
    if (esImagen(tipo, archivo || url)) {
      estado.imagen = true;
      const img = document.createElement('img');
      img.className = 'visor-lienzo visor-imagen';
      img.alt = titulo;
      img.src = url;
      hojas.replaceChildren(img);
      di('');
      pinta();
      return;
    }
    di(M.visorCargando);
    let m;
    try { m = await carga(); } catch (e) {
      /* Para quien programa: dónde se buscó pdf.js y cómo indicar otra carpeta. */
      console.warn(`FormKit: no se pudo cargar pdf.js desde ${base()}; indica su carpeta en FORMKIT_CONFIG.visor.pdfjs.`);
      if (estado.url === url) enNavegador(url, titulo);
      return;
    }
    try {
      const doc = await m.getDocument({ url, standardFontDataUrl: new URL('standard_fonts/', base()).href, isEvalSupported: false }).promise;
      if (estado.url !== url) return;
      estado.doc = doc;
      di('');
      await pinta();
    } catch (e) {
      if (estado.url === url) di(M.visorError);
    }
  }

  function prepara() {
    if (listo) return Boolean(d);
    listo = true;
    d = document.querySelector('[data-visor]');
    if (!d) return false;
    cfg = FormKit.config;
    M = cfg.mensajes;
    hojas = d.querySelector('[data-visor-hojas]');
    aviso = d.querySelector('[data-visor-aviso]');
    contador = d.querySelector('[data-visor-pagina]');
    ancho = global.matchMedia(cfg.visor.fijoDesde);

    /* Botones que abren un documento, en cualquier parte de la página. */
    document.addEventListener('click', (e) => {
      const b = e.target.closest('[data-visor-url]');
      if (!b) return;
      e.preventDefault();
      abre({ url: b.dataset.visorUrl, titulo: b.dataset.visorTitulo || b.textContent.trim(), archivo: b.dataset.visorArchivo || '', tipo: b.dataset.visorTipo || '' }, b);
    });
    /* Barra del visor. */
    d.addEventListener('click', (e) => {
      const b = e.target.closest('[data-visor-accion]');
      if (!b) return;
      const a = b.dataset.visorAccion;
      if (a === 'cerrar') { d.close(); return; }
      if (!estado.doc && !estado.imagen) return;
      if (a === 'acercar') estado.zoom = Math.min(estado.zoom + 1, ZOOMS.length - 1);
      if (a === 'alejar') estado.zoom = Math.max(estado.zoom - 1, 0);
      if (a === 'ajustar') estado.zoom = AJUSTAR;
      if (a === 'girar') estado.giro = (estado.giro + 90) % 360;
      pinta();
    });
    d.addEventListener('close', () => { if (origen && origen.focus) origen.focus(); });
    /* Al pasar de computadora a pantalla chica (o al revés), el visor cambia de forma. */
    ancho.addEventListener('change', () => { if (d.open) { d.close(); abreDialogo(); } });
    let espera = 0;
    global.addEventListener('resize', () => { clearTimeout(espera); espera = setTimeout(() => { if (d.open && estado.doc) pinta(); }, cfg.visor.retardoMs); });
    return true;
  }

  FormKit.registra('visor', { selector: '[data-visor],[data-visor-url]', fueraDelFormulario: true, iniciar() { prepara(); } });
  document.addEventListener('DOMContentLoaded', prepara);
  FormKit.visor = { abre, enComputadora: () => prepara() && ancho.matches };
}(window));


/* ===== codigo/modulos/mapa/mapa.js ===== */
/* =========================================================
   mapa.js · Módulo «mapa» · nivel OPCIONAL

   Mapa con selección de punto sobre Leaflet (autoalojado en vendor/) con
   leaflet-gesture-handling para que, en el teléfono, un dedo desplace la
   página y no el mapa. El mapa NUNCA es el único camino (FRM-46): junto a
   él van la dirección escrita y la captura manual de coordenadas, y todo
   lo que el mapa decide se dice con palabras.

   Reglas que aplica:
     · tocar o hacer clic coloca el punto; arrastrarlo lo mueve; cada
       movimiento se anuncia en texto («Punto marcado: 19.43, -99.13»);
     · el punto se puede confirmar con un botón (data-confirmar): hasta
       entonces el campo no cuenta como contestado;
     · ámbito acotado (ambito.coordenadas de la configuración): el mapa se
       limita a él y un punto fuera se rechaza en el momento, no al enviar;
     · marcador propio incrustado (SVG en guinda): sin mosaicos del mapa
       base el punto sigue viéndose y moviéndose;
     · el mapa base (teselas) se declara en configuración
       (FORMKIT_CONFIG.mapa.teselas y .atribucion); sin él, el mapa muestra
       un fondo neutro y lo dice;
     · no se pide geolocalización del dispositivo salvo data-geolocalizacion;
     · coordenadas en EPSG:4326, orden lon, lat al enviar, 6 decimales.

   Contrato HTML:
     <div class="campo" data-campo="punto">
       <span class="etiqueta" id="et-punto">Punto en el mapa</span>
       <p class="ayuda">Toca el sitio o arrastra el marcador. Si el mapa no carga, escribe la dirección o las coordenadas.</p>
       <div class="mapa" data-mapa data-confirmar role="application" aria-labelledby="et-punto" tabindex="0"></div>
       <p class="mapa-sin" data-mapa-sin hidden>El mapa no cargó. Puedes seguir: escribe la dirección o las coordenadas.</p>
       <div class="mapa-barra">
         <output class="coords" data-mapa-coords aria-live="polite">Sin punto marcado.</output>
         <button type="button" class="btn btn-secundario" data-mapa-confirmar hidden>Confirmar punto</button>
         <button type="button" class="btn btn-secundario" data-mapa-geolocalizar hidden>Usar mi ubicación</button>
       </div>
       <input type="hidden" name="lat" data-mapa-lat><input type="hidden" name="lon" data-mapa-lon>
     </div>
     <div class="campo" data-campo="coordenadas" data-formato="coordenadas">…alternativa manual…</div>
   ========================================================= */
(function () {
  'use strict';
  const estadoDe = new WeakMap();
  FormKit.registra('mapa', {
    selector: '[data-mapa]',
    tipos: {
      mapa: {
        detecta: (el) => !!el.querySelector('[data-mapa]'),
        controles: (el) => [el.querySelector('[data-mapa]')],
        valorDe: (el) => { const s = estadoDe.get(el); return s && s.punto && (!s.exigeConfirmar || s.confirmado) ? `${s.punto.lat.toFixed(6)},${s.punto.lon.toFixed(6)}` : ''; },
        /* La revisión dice lo mismo que se envía: un punto sin confirmar se ve como tal. */
        textoDe: (el) => { const s = estadoDe.get(el); if (!s || !s.punto) return ''; const t = `${s.punto.lat.toFixed(5)}, ${s.punto.lon.toFixed(5)}`; return s.exigeConfirmar && !s.confirmado ? `${t} · ${FormKit.config.mensajes.mapaSinConfirmar}` : t; },
        enBorrador: true,
        /* En el borrador sólo hay un punto si ya contaba (confirmado, si se pide): se recupera así. */
        restaura: (el, v) => { const s = estadoDe.get(el); if (s && v && s.coloca) { const [lat, lon] = v.split(',').map(Number); s.coloca({ lat, lon }, true); if (s.exigeConfirmar && s.confirma) s.confirma(true); } },
        valida: (el) => { const s = estadoDe.get(el); return s && s.fuera ? FormKit.config.ambito.coordenadas.mensaje : ''; },
        alArmar: (form, payload) => { for (const el of form.querySelectorAll('[data-campo]')) { const s = estadoDe.get(el); if (s && s.punto && payload.datos[el.dataset.campo]) payload.datos[el.dataset.campo] = { type: 'Point', coordinates: [Number(s.punto.lon.toFixed(6)), Number(s.punto.lat.toFixed(6))] }; } }
      }
    },
    iniciar(form, ctx) {
      const { $, $$, cfg, M, plantilla, anuncia, limpia, marca, programaBorrador } = ctx;
      const L = window.L;
      const conf = Object.assign({ teselas: '', atribucion: '', zoom: 11, centro: [19.4326, -99.1332] }, (window.FORMKIT_CONFIG || {}).mapa || {});
      const bbox = cfg.ambito.coordenadas;

      for (const cont of $$('[data-mapa]', form)) {
        const el = cont.closest('[data-campo]');
        const salida = $('[data-mapa-coords]', el);
        const sin = $('[data-mapa-sin]', el);
        const btnConfirmar = $('[data-mapa-confirmar]', el);
        const btnGeo = $('[data-mapa-geolocalizar]', el);
        const inLat = $('[data-mapa-lat]', el), inLon = $('[data-mapa-lon]', el);
        const s = { punto: null, confirmado: false, fuera: false, exigeConfirmar: cont.hasAttribute('data-confirmar') };
        estadoDe.set(el, s);

        if (!L) { if (sin) sin.hidden = false; cont.hidden = true; continue; }

        /* El plugin de gestos (leaflet-gesture-handling) se registra como
           manejador «gestureHandling»; si está cargado se activa: un dedo
           desplaza la página, dos el mapa. Sin él, Leaflet ignora la opción. */
        const mapa = L.map(cont, { center: conf.centro, zoom: conf.zoom, gestureHandling: true, gestureHandlingOptions: { text: { touch: M.mapaGestoTactil, scroll: M.mapaGestoRueda, scrollMac: M.mapaGestoRuedaMac } }, zoomControl: true, attributionControl: !!conf.atribucion, tap: true });
        if (mapa.gestureHandling && !mapa.gestureHandling.enabled()) mapa.gestureHandling.enable();
        const limites = bbox ? L.latLngBounds([bbox.latMin, bbox.lonMin], [bbox.latMax, bbox.lonMax]) : null;
        const encuadra = () => { mapa.invalidateSize(); if (s.punto) mapa.setView([s.punto.lat, s.punto.lon], Math.max(mapa.getZoom(), 14)); else if (limites) mapa.fitBounds(limites); };
        if (limites) { mapa.setMaxBounds(limites.pad(0.1)); mapa.fitBounds(limites); }
        if (conf.teselas) L.tileLayer(conf.teselas, { attribution: conf.atribucion, maxZoom: 19 }).on('tileerror', () => { if (sin) sin.hidden = false; }).addTo(mapa);
        else if (sin) { sin.hidden = false; sin.textContent = M.mapaSinBase; }
        /* Marcador propio en guinda (SVG en línea): no depende de imágenes externas. */
        const icono = L.divIcon({ className: 'mapa-marcador', html: '<svg viewBox="0 0 24 24" width="32" height="32" aria-hidden="true" focusable="false"><path d="M12 22s-7-7.3-7-12.5a7 7 0 0 1 14 0C19 14.7 12 22 12 22z" fill="currentColor"/><circle cx="12" cy="9.5" r="2.6" fill="#fff"/></svg>', iconSize: [32, 32], iconAnchor: [16, 32] });
        let marcador = null;

        s.coloca = (p, silencioso = false) => {
          s.punto = p; s.confirmado = false;
          if (marcador) marcador.setLatLng([p.lat, p.lon]); else { marcador = L.marker([p.lat, p.lon], { icon: icono, draggable: true, keyboard: true, title: M.mapaMarcador }).addTo(mapa); marcador.on('dragend', () => { const ll = marcador.getLatLng(); s.coloca({ lat: ll.lat, lon: ll.lng }); }); }
          s.fuera = !!bbox && (p.lat < bbox.latMin || p.lat > bbox.latMax || p.lon < bbox.lonMin || p.lon > bbox.lonMax);
          if (inLat) inLat.value = p.lat.toFixed(6); if (inLon) inLon.value = p.lon.toFixed(6);
          const texto = plantilla(M.mapaPunto, { lat: p.lat.toFixed(5), lon: p.lon.toFixed(5) });
          if (salida) salida.textContent = s.fuera ? `${texto} ${M.mapaFuera}` : texto;
          if (btnConfirmar) { btnConfirmar.hidden = !s.exigeConfirmar || s.fuera; btnConfirmar.textContent = M.mapaConfirmar; btnConfirmar.removeAttribute('aria-pressed'); }
          if (s.fuera) marca(el.dataset.campo, bbox.mensaje); else limpia(el.dataset.campo);
          if (!silencioso) anuncia(salida ? salida.textContent : texto);
          programaBorrador();
        };

        mapa.on('click', (e) => s.coloca({ lat: e.latlng.lat, lon: e.latlng.lng }));
        /* Teclado: con el mapa enfocado, Enter coloca el punto en el centro; las flechas lo desplazan (Leaflet). */
        cont.addEventListener('keydown', (e) => { if (e.key === 'Enter') { const c = mapa.getCenter(); s.coloca({ lat: c.lat, lon: c.lng }); } });
        s.confirma = (silencioso = false) => {
          if (!s.punto) return;
          s.confirmado = true;
          if (btnConfirmar) { btnConfirmar.textContent = M.mapaConfirmado; btnConfirmar.setAttribute('aria-pressed', 'true'); }
          limpia(el.dataset.campo);
          if (!silencioso) { anuncia(`${M.mapaConfirmado}.`); programaBorrador(); }
        };
        if (btnConfirmar) btnConfirmar.addEventListener('click', () => s.confirma());
        if (btnGeo && cont.hasAttribute('data-geolocalizacion') && navigator.geolocation) {
          btnGeo.hidden = false;
          btnGeo.addEventListener('click', () => { btnGeo.setAttribute('aria-busy', 'true'); navigator.geolocation.getCurrentPosition((pos) => { btnGeo.removeAttribute('aria-busy'); s.coloca({ lat: pos.coords.latitude, lon: pos.coords.longitude }); mapa.setView([pos.coords.latitude, pos.coords.longitude], 16); }, () => { btnGeo.removeAttribute('aria-busy'); anuncia(M.mapaSinUbicacion, { cortes: true, visible: salida }); }, { timeout: 10000 }); });
        }
        /* La alternativa manual (campo data-formato="coordenadas") también mueve el punto. */
        const manual = $$('[data-formato="coordenadas"] input', form)[0];
        if (manual) manual.addEventListener('change', () => { const m = cfg.formatos.coordenadas.normaliza(manual.value).match(/^(-?[\d.]+),(-?[\d.]+)$/); if (m) { s.coloca({ lat: Number(m[1]), lon: Number(m[2]) }); mapa.setView([Number(m[1]), Number(m[2])], 16); } });
        /* Leaflet necesita saber su tamaño cuando el paso se muestra: un mapa
           iniciado oculto calcula mal el encuadre. */
        form.addEventListener('formkit:paso', () => setTimeout(encuadra, 50));
        window.addEventListener('resize', () => mapa.invalidateSize());
        s.mapa = mapa;
      }
      FormKit.mapa = { estadoDe: (el) => estadoDe.get(el) };
    }
  });
}());


/* ===== codigo/modulos/enlace-mapa/enlace-mapa.js ===== */
/* =========================================================
   enlace-mapa.js · Módulo «enlace-mapa» · nivel OPCIONAL

   La persona pega el enlace de Google Maps del lugar y el módulo escribe
   sus coordenadas en el campo de coordenadas (data-formato="coordenadas"),
   que valida el núcleo. También acomoda lo que se escribe directo en ese
   campo: latitud y longitud al revés, grados-minutos-segundos, coma decimal
   o la longitud sin signo menos (el teclado numérico del iPhone no lo trae).

   Del enlace se toma el lugar marcado (el último !3d…!4d…), luego el punto
   pedido (q=, ll=, /place/) y sólo al final el centro de la pantalla (@,
   center=), con aviso: el centro puede quedar a cientos de metros del lugar.
   Los enlaces cortos (maps.app.goo.gl, goo.gl/maps, g.co/kgs) no traen
   coordenadas: resolverlos exige consultar a Google y ninguna página pide
   nada a un tercero salvo el mapa base (FRM-77). Se explica cómo copiarlas.

   Contrato HTML (el valor de data-enlace-mapa es el data-campo destino):
     <div class="campo" data-enlace-mapa="coordenadas">
       <label class="etiqueta" for="enlace">Enlace de Google Maps</label>
       <p class="ayuda">…</p>
       <input class="control" id="enlace" type="url" inputmode="url" autocomplete="off" spellcheck="false">
       <div data-enlace-mapa-estado></div>
     </div>
   El enlace no lleva data-campo ni name: no viaja en el envío. Sólo viajan
   las coordenadas, en el campo destino.
   ========================================================= */
(function () {
  'use strict';

  /* ---------- Lectura: función pura (FormKit.leeCoordenadas) ---------- */
  const NUM = '(-?\\d{1,3}(?:\\.\\d+)?)';
  const numero = (t) => { const n = Number(String(t).replace(',', '.')); return Number.isFinite(n) ? n : NaN; };

  /* Un par ya separado. Acomoda el orden y el signo; anota qué corrigió. */
  function par(a, b, origen) {
    let lat = numero(a), lon = numero(b);
    if (Number.isNaN(lat) || Number.isNaN(lon)) return null;
    const notas = [];
    if (Math.abs(lat) > 90 && Math.abs(lon) <= 90) { [lat, lon] = [lon, lat]; notas.push('orden'); } // longitud primero
    if (lat >= 19.0 && lat <= 19.6 && lon >= 98.9 && lon <= 99.4) { lon = -lon; notas.push('menos'); } // longitud de la Ciudad sin signo
    if (Math.abs(lat) > 90 || Math.abs(lon) > 180) return null;
    return { lat, lon, origen, notas };
  }

  /* Devuelve {lat, lon, origen: 'pin'|'centro'|'texto', notas}, {corto:true} o null. */
  function lee(texto) {
    let s = String(texto == null ? '' : texto).trim();
    if (s.length < 5) return null;
    try { s = decodeURIComponent(s.replace(/\+/g, ' ')); } catch (e) { /* se deja como venía */ }
    s = s.replace(/[−‒–—]/g, '-');
    if (/(maps\.app\.goo\.gl|goo\.gl\/maps|g\.co\/kgs)\//i.test(s)) return { corto: true };

    /* Enlaces: el último pin manda; luego el punto pedido; al final el centro de la vista. */
    const pins = [...s.matchAll(new RegExp(`!3d${NUM}!4d${NUM}`, 'g'))];
    if (pins.length) { const p = pins[pins.length - 1]; return par(p[1], p[2], 'pin'); }
    let m = s.match(new RegExp(`[?&](?:q|query|ll|destination|daddr)=\\s*${NUM}\\s*,\\s*${NUM}(?![\\d.])`, 'i'))
         || s.match(new RegExp(`\\/(?:place|search)\\/\\s*${NUM}\\s*,\\s*${NUM}(?![\\d.])`, 'i'));
    if (m) return par(m[1], m[2], 'pin');
    m = s.match(new RegExp(`@${NUM},${NUM}(?![\\d.])`)) || s.match(new RegExp(`[?&](?:center|sll)=${NUM},${NUM}(?![\\d.])`, 'i'));
    if (m) return par(m[1], m[2], 'centro');
    m = s.match(new RegExp(`^geo:${NUM},${NUM}`, 'i'));
    if (m) return par(m[1], m[2], 'texto');

    /* Grados, minutos y segundos: dos valores, uno N/S y otro E/O/W. */
    const g = [...s.matchAll(/(\d+(?:\.\d+)?)\s*°\s*(?:(\d+(?:\.\d+)?)\s*['′’]\s*)?(?:(\d+(?:\.\d+)?)\s*(?:["″”]|'')\s*)?([NSEOW])/gi)];
    if (g.length === 2) {
      const v = (x) => (Number(x[1]) + (Number(x[2]) || 0) / 60 + (Number(x[3]) || 0) / 3600) * (/[SWO]/i.test(x[4]) ? -1 : 1);
      const esLat = (x) => /[NS]/i.test(x[4]);
      if (esLat(g[0]) !== esLat(g[1])) return esLat(g[0]) ? par(v(g[0]), v(g[1]), 'texto') : par(v(g[1]), v(g[0]), 'texto');
    }

    /* Par suelto con punto o coma decimal. Sin decimales no se toma:
       «19 99» suele ser parte de una dirección, no coordenadas. Un par escrito
       no pasa de 80 caracteres, y el separador no se traslapa con los espacios
       de alrededor: un texto largo no frena la página. */
    if (s.length > 80) return null;
    m = s.match(/^\(?\s*(-?\d{1,3}[.,]\d+)(?:\s*[,;]\s*|\s+)(-?\d{1,3}[.,]\d+)\s*\)?$/);
    return m ? par(m[1], m[2], 'texto') : null;
  }
  const fmt = (r) => `${r.lat.toFixed(6)}, ${r.lon.toFixed(6)}`;
  FormKit.leeCoordenadas = lee;

  /* ---------- Pantalla ---------- */
  FormKit.registra('enlace-mapa', {
    selector: '[data-enlace-mapa]',
    iniciar(form, ctx) {
      const { $$, M, plantilla, anuncia, controlPrincipal } = ctx;
      for (const caja of $$('[data-enlace-mapa]', form)) {
        const destino = controlPrincipal(caja.dataset.enlaceMapa);
        const entrada = caja.querySelector('input');
        const estado = caja.querySelector('[data-enlace-mapa-estado]');
        if (!destino || !entrada) continue;

        /* Aviso visible con icono y palabras; el lector de pantalla lo oye por anuncia(). */
        const dice = (tipo, texto) => {
          if (!estado) { if (texto) anuncia(texto); return; }
          estado.textContent = '';
          if (!tipo) return;
          const p = document.createElement('p');
          p.className = `aviso ${tipo === 'ok' ? 'aviso-ok' : 'aviso-advertencia'}`;
          const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
          svg.setAttribute('class', 'icono');
          svg.setAttribute('aria-hidden', 'true');
          const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
          use.setAttribute('href', tipo === 'ok' ? '#i-ok' : '#i-alerta');
          svg.append(use);
          const span = document.createElement('span');
          span.className = 'aviso-texto';
          span.textContent = texto;
          p.append(svg, span);
          estado.append(p);
          anuncia(texto);
        };
        const escribe = (r) => {
          destino.value = fmt(r);
          destino.dispatchEvent(new Event('input', { bubbles: true }));
          destino.dispatchEvent(new Event('change', { bubbles: true }));
        };

        const desdeEnlace = () => {
          const t = entrada.value.trim();
          if (!t) { dice(null, ''); return; }
          const r = lee(t);
          if (!r) return dice('advertencia', M.enlaceMapaSin);
          if (r.corto) return dice('advertencia', M.enlaceMapaCorto);
          escribe(r);
          if (r.origen === 'centro') dice('advertencia', plantilla(M.enlaceMapaCentro, { coordenadas: fmt(r) }));
          else dice('ok', plantilla(M.enlaceMapaTomadas, { coordenadas: fmt(r) }));
        };
        entrada.addEventListener('change', desdeEnlace);
        /* Al pegar se lee de inmediato, sin esperar a salir del campo. */
        entrada.addEventListener('paste', () => setTimeout(desdeEnlace, 0));

        /* Lo escrito directo en «Coordenadas» también se acomoda. */
        destino.addEventListener('change', () => {
          const r = lee(destino.value);
          if (!r || r.corto) return;
          const nuevo = fmt(r);
          if (destino.value.replace(/\s/g, '') === nuevo.replace(/\s/g, '')) return;
          destino.value = nuevo;
          destino.dispatchEvent(new Event('input', { bubbles: true }));
          const que = [
            r.notas.includes('orden') ? M.enlaceMapaOrden : '',
            r.notas.includes('menos') ? M.enlaceMapaSigno : ''
          ].filter(Boolean).join(M.conjuncion);
          anuncia(plantilla(M.enlaceMapaAnuncio, { coordenadas: nuevo, notas: que ? `; ${que}` : '' }));
        });
      }
    }
  });
}());


/* ===== codigo/modulos/cascadas/cascadas.js ===== */
/* =========================================================
   cascadas.js · Módulo «cascadas» · nivel OPCIONAL

   Campos dependientes en cascada: alcaldía → colonia → código postal (o
   entidad → municipio). El catálogo viene de window.FORMKIT_CATALOGOS
   [nombre].filas, derivado de la fuente oficial (ver codigo/catalogos).

   Comportamiento:
     · el hijo permanece deshabilitado, con ayuda que explica por qué, hasta
       que el padre tenga valor;
     · al cambiar el padre se reinicia el hijo y se anuncia;
     · relación inversa: si se captura primero el código postal, se rellenan
       la alcaldía y la colonia que dependan de él, y la persona puede
       corregirlos; si un cp abarca varias colonias, se acota la lista;
     · si el catálogo no carga, la lista se oculta entera (data-cascada-lista)
       y se muestra la captura manual (data-cascada-manual); el código postal
       sigue en los dos casos. Una fila incompleta del catálogo se omite con
       un aviso en la consola.

   Contrato HTML:
     <div data-cascada data-catalogo="cdmx">
       <div data-cascada-lista>
         <div class="campo" data-campo="alcaldia" data-requerido>
           <label class="etiqueta" for="alcaldia">Alcaldía</label>
           <div class="select"><select class="control control-select" id="alcaldia" name="alcaldia" data-nivel="alcaldia" autocomplete="address-level2"><option value="">Elige una opción</option></select></div>
         </div>
         <div class="campo" data-campo="colonia" data-requerido>…<select data-nivel="colonia" autocomplete="address-level3">…</div>
       </div>
       <div data-cascada-manual hidden>…alcaldía y colonia de texto, data-requerido…</div>
       <div class="campo" data-campo="cp" data-formato="cp" data-requerido>…<input data-nivel="cp" autocomplete="postal-code">…</div>
     </div>
   El esquema del servidor marca qué campos son de la lista y cuáles de la
   captura manual: si llega la manual, exige ésa y no la lista.
   ========================================================= */
(function () {
  'use strict';
  FormKit.registra('cascadas', {
    selector: '[data-cascada]',
    iniciar(form, ctx) {
      const { $, $$, M, plantilla, anuncia, etiquetaDe, limpia, programaBorrador } = ctx;
      for (const cont of $$('[data-cascada]', form)) {
        const cat = (window.FORMKIT_CATALOGOS || {})[cont.dataset.catalogo];
        const niveles = $$('[data-nivel]', cont);
        const por = Object.fromEntries(niveles.map((c) => [c.dataset.nivel, c]));
        const campoDe = (c) => c.closest('[data-campo]');
        const manual = $('[data-cascada-manual]', cont);
        const lista = $('[data-cascada-lista]', cont);
        /* Filas completas, como texto: una fila rara (un CP numérico, una fila vacía) no detiene la página. */
        const crudas = cat && (Array.isArray(cat) ? cat : cat.filas);
        const filas = Array.isArray(crudas) ? crudas.filter((f) => f && typeof f === 'object').map((f) => Object.fromEntries(Object.entries(f).map(([k, v]) => [k, v === null || v === undefined ? '' : String(v)]))).filter((f) => (!por.alcaldia || f.alcaldia) && (!por.colonia || f.colonia)) : [];
        if (Array.isArray(crudas) && filas.length < crudas.length) console.warn(`FormKit: el catálogo «${cont.dataset.catalogo}» tiene ${crudas.length - filas.length} fila(s) incompletas; se omitieron.`);

        if (!filas.length) {
          /* Sin catálogo: la lista se oculta entera ([data-cascada-lista]) y queda la captura
             manual; el código postal sigue. Sin el envoltorio, se ocultan los niveles de la lista. */
          if (lista) lista.hidden = true; else for (const c of niveles) if (c.dataset.nivel !== 'cp') campoDe(c).hidden = true;
          if (manual) manual.hidden = false;
          anuncia(M.cascadaSinCatalogo);
          continue;
        }
        const orden = ['alcaldia', 'colonia', 'cp'].filter((n) => por[n]);
        const sel = (c, valores, placeholder) => {
          if (c.tagName !== 'SELECT') return;
          const actual = c.value;
          c.textContent = '';
          const o0 = document.createElement('option'); o0.value = ''; o0.textContent = placeholder || 'Elige una opción'; c.appendChild(o0);
          for (const v of valores) { const o = document.createElement('option'); o.value = v; o.textContent = v; c.appendChild(o); }
          if (valores.includes(actual)) c.value = actual;
          c.toggleAttribute('data-vacio', !c.value);
        };
        const unicos = (lista, k) => [...new Set(lista.map((f) => f[k]))].sort((a, b) => a.localeCompare(b, 'es'));

        function espera(c, padre) {
          const ayuda = $('.ayuda', campoDe(c));
          const texto = plantilla(M.cascadaEspera, { padre: etiquetaDe(campoDe(padre).dataset.campo).toLowerCase() });
          if (ayuda) { if (!ayuda.dataset.original) ayuda.dataset.original = ayuda.textContent; ayuda.textContent = c.disabled ? texto : ayuda.dataset.original; }
        }

        function pinta(origen) {
          const a = por.alcaldia, co = por.colonia, cp = por.cp;
          if (a) sel(a, unicos(filas, 'alcaldia'));
          if (co) {
            const base = a && a.value ? filas.filter((f) => f.alcaldia === a.value) : (cp && cp.value.length === 5 ? filas.filter((f) => f.cp === cp.value) : []);
            co.disabled = !base.length;
            sel(co, unicos(base, 'colonia'));
            if (a) espera(co, a);
          }
          if (cp && origen !== 'cp') {
            const base = filas.filter((f) => (!a || !a.value || f.alcaldia === a.value) && (!co || !co.value || f.colonia === co.value));
            const cps = unicos(base, 'cp');
            if (co && co.value && cps.length === 1 && cp.value !== cps[0]) { cp.value = cps[0]; limpia(campoDe(cp).dataset.campo); anuncia(plantilla(M.cascadaCpTomado, { etiqueta: etiquetaDe(campoDe(cp).dataset.campo), valor: cps[0] })); }
          }
        }

        /* Inversa: el código postal propone alcaldía y colonia. */
        function desdeCp() {
          const cp = por.cp;
          if (!cp || cp.value.length !== 5) return;
          const coinciden = filas.filter((f) => f.cp === cp.value);
          if (!coinciden.length) return;
          const a = por.alcaldia, co = por.colonia;
          const alcs = unicos(coinciden, 'alcaldia');
          if (a && alcs.length === 1 && a.value !== alcs[0]) { a.value = alcs[0]; a.toggleAttribute('data-vacio', false); limpia(campoDe(a).dataset.campo); anuncia(plantilla(M.cascadaTomadaCp, { etiqueta: etiquetaDe(campoDe(a).dataset.campo), valor: alcs[0] })); }
          pinta('cp');
          const cols = unicos(coinciden, 'colonia');
          if (co && cols.length === 1 && co.value !== cols[0]) { co.value = cols[0]; co.toggleAttribute('data-vacio', false); limpia(campoDe(co).dataset.campo); anuncia(plantilla(M.cascadaTomadaCp, { etiqueta: etiquetaDe(campoDe(co).dataset.campo), valor: cols[0] })); }
        }

        cont.addEventListener('change', (e) => {
          const c = e.target.closest('[data-nivel]');
          if (!c) return;
          const i = orden.indexOf(c.dataset.nivel);
          /* Al cambiar un padre, los hijos se reinician y se anuncia. */
          for (const h of orden.slice(i + 1)) { const hijo = por[h]; if (hijo && hijo.value && c.dataset.nivel !== 'cp') { hijo.value = ''; hijo.toggleAttribute('data-vacio', true); limpia(campoDe(hijo).dataset.campo); anuncia(plantilla(M.cascadaReiniciada, { etiqueta: etiquetaDe(campoDe(hijo).dataset.campo), padre: etiquetaDe(campoDe(c).dataset.campo) })); } }
          if (c.dataset.nivel === 'cp') desdeCp(); else pinta(c.dataset.nivel);
          programaBorrador();
        });
        if (por.cp) por.cp.addEventListener('input', () => { if (por.cp.value.length === 5) desdeCp(); });
        pinta();
        /* Al restaurar un borrador, las listas hijas se reconstruyen desde el
           padre restaurado y después se reponen los valores guardados. */
        const anterior = FormKit.ganchos.restauraBorrador;
        FormKit.ganchos.restauraBorrador = (f, b) => {
          if (anterior) anterior(f, b);
          pinta();
          for (const n of orden) { const c = por[n]; const v = (b.datos || {})[campoDe(c).dataset.campo]; if (c && v !== undefined && c.value !== v) { c.value = v; c.toggleAttribute('data-vacio', !c.value); pinta(n); } }
        };
        /* La cruzada cp ↔ colonia (advertencia) se declara sola si no está. */
        if (por.cp && por.colonia) { const campoCp = campoDe(por.cp); if (!campoCp.dataset.cruzada) { campoCp.dataset.cruzada = 'cp-colonia'; campoCp.dataset.cruzadaCampos = `cp=${campoCp.dataset.campo} colonia=${campoDe(por.colonia).dataset.campo}`; campoCp.dataset.catalogo = cont.dataset.catalogo; } }
      }
    }
  });
}());


/* ===== codigo/modulos/chips/chips.js ===== */
/* =========================================================
   chips.js · Módulo «chips» · nivel OPCIONAL

   Chips de uso frecuente: sugerencias de un toque para campos con
   respuestas repetidas (alcaldías, tipos, categorías) en formularios que
   la misma persona llena muchas veces (captura por personal). El historial
   vive SÓLO en el dispositivo (almacenamiento local), nunca viaja al
   servidor; se muestran como máximo N; cada chip es un botón con nombre
   accesible y estado aria-pressed; la persona puede quitar un chip o borrar
   todo el historial; sin historial, el campo funciona igual.

   Protección de datos: el módulo se niega a guardar historial de un campo
   marcado como dato personal (data-finalidad) o sensible (data-sensible).

   Contrato HTML: data-chips en el [data-campo]. El aviso de privacidad del
   formulario debe mencionar que se guardan sugerencias en el dispositivo.

   Respuestas frecuentes fijas: data-chips-fijos="Texto uno|Texto dos" en el
   [data-campo] muestra siempre esa lista (por ejemplo, los motivos para
   pedir que se corrija algo). Si varios campos comparten etiqueta,
   data-chips-etiqueta cambia la etiqueta en el nombre del grupo y
   data-chips-fijos-nombre le da un nombre propio. No guarda nada en el dispositivo, así que sirve
   también en datos personales. En un texto largo, el chip agrega su texto
   al final («… Falta una página.») para que la persona lo complete; en un
   campo corto, lo pone como respuesta.
   ========================================================= */
(function () {
  'use strict';
  FormKit.registra('chips', {
    selector: '[data-chips],[data-chips-fijos]',
    iniciar(form, ctx) {
      const { $$, cfg, M, plantilla, anuncia, almacen, controlPrincipal, valorDe, validaCampo, icono, programaBorrador } = ctx;
      const clave = (n) => `${cfg.chips.clave}:${form.dataset.borrador || form.id || 'form'}:${n}`;
      const antesDelControl = (ctl, caja) => (ctl.closest('.select,.combo,.control-grupo,.fecha-grupo') || ctl).insertAdjacentElement('beforebegin', caja);

      for (const campo of $$('[data-chips-fijos]', form)) {
        const n = campo.dataset.campo;
        const ctl = controlPrincipal(n);
        const lista = campo.dataset.chipsFijos.split('|').map((t) => t.trim()).filter(Boolean);
        if (!ctl || !lista.length) continue;
        const largo = ctl.tagName === 'TEXTAREA';
        const caja = document.createElement('div');
        caja.className = 'chips chips-fijos';
        caja.setAttribute('role', 'group');
        /* Nombre del grupo: data-chips-fijos-nombre (completo), o M.chipsFijos («Respuestas frecuentes para …»)
           con data-chips-etiqueta (por ejemplo, el documento: «… para Identificación oficial») o la etiqueta del campo. */
        caja.setAttribute('aria-label', campo.dataset.chipsFijosNombre || plantilla(M.chipsFijos, { etiqueta: campo.dataset.chipsEtiqueta || ctx.etiquetaDe(n).toLowerCase() }));
        for (const t of lista) {
          const b = document.createElement('button'); b.type = 'button'; b.className = 'chip chip-fijo'; b.dataset.chipFijo = t; b.textContent = t;
          caja.appendChild(b);
        }
        antesDelControl(ctl, caja);
        const marca = () => { if (!largo) for (const b of $$('[data-chip-fijo]', caja)) b.setAttribute('aria-pressed', String(valorDe(n) === b.dataset.chipFijo)); };
        caja.addEventListener('click', (e) => {
          const b = e.target.closest('[data-chip-fijo]');
          if (!b) return;
          const t = b.dataset.chipFijo;
          const previo = ctl.value.trim();
          ctl.value = largo ? `${previo ? `${previo} ` : ''}${t}${/[.!?]$/.test(t) ? '' : '.'}` : t;
          ctl.dispatchEvent(new Event('input', { bubbles: true }));
          ctl.dispatchEvent(new Event('change', { bubbles: true }));
          ctx.estadoDe(n).tocado = true;
          ctx.validaYPinta(n);
          marca();
          anuncia(plantilla(M.chipsAgregado, { texto: t }));
          if (largo) { ctl.focus(); ctl.setSelectionRange(ctl.value.length, ctl.value.length); }
          programaBorrador();
        });
        ctl.addEventListener('input', marca);
        marca();
      }

      /* Campos con la misma etiqueta (un «¿Qué debe corregir?» por documento):
         el lector de pantalla oiría grupos con el mismo nombre. Se les agrega
         el título de su sección o, si no hay, su número de orden. */
      const grupos = $$('.chips-fijos', form);
      const porNombre = new Map();
      for (const g of grupos) porNombre.set(g.getAttribute('aria-label'), [...(porNombre.get(g.getAttribute('aria-label')) || []), g]);
      for (const [nombre, iguales] of porNombre) {
        if (iguales.length < 2) continue;
        iguales.forEach((g, i) => {
          const zona = g.closest('[data-campo]').parentElement.closest('article,section,fieldset,[data-paso],.tarjeta');
          const titulo = zona && [...zona.querySelectorAll('h1,h2,h3,h4,h5,h6,legend')].find((h) => !h.closest('[data-campo]'));
          const contexto = titulo ? titulo.textContent.replace(/\s+/g, ' ').trim() : plantilla(M.chipsFijosOrden, { n: i + 1, total: iguales.length });
          g.setAttribute('aria-label', plantilla(M.chipsFijosContexto, { nombre, contexto }));
        });
      }

      for (const campo of $$('[data-chips]', form)) {
        const n = campo.dataset.campo;
        if (campo.hasAttribute('data-finalidad') || campo.hasAttribute('data-sensible')) { console.warn(`FormKit: el campo «${n}» es dato personal; no se guardan sugerencias.`); continue; }
        const ctl = controlPrincipal(n);
        if (!ctl) continue;
        const caja = document.createElement('div');
        caja.className = 'chips';
        caja.setAttribute('role', 'group');
        caja.setAttribute('aria-label', plantilla(M.chipsHistorial, { etiqueta: ctx.etiquetaDe(n).toLowerCase() }));
        antesDelControl(ctl, caja);

        const lee = () => { try { return JSON.parse(almacen.lee(clave(n)) || '[]'); } catch (e) { return []; } };
        const escribe = (lista) => almacen.escribe(clave(n), JSON.stringify(lista.slice(0, cfg.chips.max)));

        function pinta() {
          const lista = lee();
          caja.textContent = '';
          caja.hidden = !lista.length;
          if (!lista.length) return;
          for (const v of lista) {
            const b = document.createElement('button'); b.type = 'button'; b.className = 'chip'; b.dataset.chip = v;
            b.setAttribute('aria-pressed', String(valorDe(n) === v));
            const t = document.createElement('span'); t.className = 'chip-texto'; t.textContent = v;
            const q = document.createElement('span'); q.className = 'chip-quitar'; q.dataset.chipQuitar = v; q.setAttribute('role', 'button'); q.setAttribute('tabindex', '0'); q.setAttribute('aria-label', plantilla(M.chipsQuitar, { texto: v })); q.appendChild(icono('cerrar', 'icono icono-sm'));
            b.append(t); caja.append(b, q);
          }
          const borrar = document.createElement('button'); borrar.type = 'button'; borrar.className = 'btn-enlace chips-borrar'; borrar.dataset.chipsBorrar = ''; borrar.textContent = M.chipsBorrar;
          caja.appendChild(borrar);
        }

        caja.addEventListener('click', (e) => {
          const q = e.target.closest('[data-chip-quitar]');
          if (q) { escribe(lee().filter((v) => v !== q.dataset.chipQuitar)); pinta(); anuncia(M.chipsQuitada); return; }
          if (e.target.closest('[data-chips-borrar]')) { almacen.borra(clave(n)); pinta(); anuncia(M.chipsBorrado); ctl.focus(); return; }
          const b = e.target.closest('[data-chip]');
          if (!b) return;
          ctl.value = b.dataset.chip;
          ctl.dispatchEvent(new Event('input', { bubbles: true }));
          ctl.dispatchEvent(new Event('change', { bubbles: true }));
          ctx.estadoDe(n).tocado = true;
          ctx.validaYPinta(n);
          pinta();
          anuncia(`${ctx.etiquetaDe(n)}: ${b.dataset.chip}`);
          programaBorrador();
        });
        caja.addEventListener('keydown', (e) => { if ((e.key === 'Enter' || e.key === ' ') && e.target.closest('[data-chip-quitar]')) { e.preventDefault(); e.target.closest('[data-chip-quitar]').click(); } });

        /* Se guarda al salir del campo con un valor válido. */
        campo.addEventListener('focusout', () => {
          const v = valorDe(n);
          if (!v || validaCampo(n)) return;
          const lista = [v, ...lee().filter((x) => x !== v)];
          escribe(lista);
          pinta();
        });
        pinta();
      }
    }
  });
}());
