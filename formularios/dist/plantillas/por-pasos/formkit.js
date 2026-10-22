/* GENERADO por herramientas/juntar.mjs: los guiones del estándar que carga la página, en su orden y sin comentarios (el código comentado está en codigo/). */
/* ../js/validaciones.config.js */
(function (raiz, fabrica) {
  const cfg = fabrica();
  if (typeof module === 'object' && module.exports) module.exports = cfg;
  raiz.FORMKIT_VALIDACIONES = cfg;
}(typeof globalThis !== 'undefined' ? globalThis : (typeof self !== 'undefined' ? self : this), function () {
  'use strict';
  const INVISIBLES = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\u200B-\u200D\u2060\uFEFF]/g;
  const recorta = (v) => String(v ?? '').replace(INVISIBLES, '').replace(/\s+/g, ' ').trim();
  const soloDigitos = (v) => String(v ?? '').normalize('NFKC').replace(/\D/g, '');
  const formatosArchivo = (exts) => [...new Set((exts || []).map((e) => String(e).trim().toUpperCase()).map((e) => (e === 'JPG' ? 'JPEG' : e)))].join(', ');
  const sinAcentos = (v) => String(v ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '');
  const sinAcentosSalvoEnie = (v) => [...String(v ?? '').normalize('NFC')].map((c) => (c === 'Ñ' || c === 'ñ' ? c : sinAcentos(c))).join('');
  const esFechaReal = (a, m, d) => { const f = new Date(Date.UTC(a, m - 1, d)); return f.getUTCFullYear() === a && f.getUTCMonth() === m - 1 && f.getUTCDate() === d; };
  function partesDma(v) {
    const t = String(v || '').trim();
    if (t.length > 20) return null;
    let m = t.match(/^(\d{1,2})(?:\s*[/.\-]\s*|\s+)(\d{1,2})(?:\s*[/.\-]\s*|\s+)(\d{4})$/) || t.match(/^(\d{2})(\d{2})(\d{4})$/);
    if (m) return { d: Number(m[1]), m: Number(m[2]), a: Number(m[3]) };
    m = t.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    return m ? { d: Number(m[3]), m: Number(m[2]), a: Number(m[1]) } : null;
  }
  const dosCifras = (n) => String(n).padStart(2, '0');
  const CON_MILES = /^-?\d{1,3}(,\d{3})+(\.\d+)?$/;
  const isoDeDma = (v) => { const p = partesDma(v); return p && esFechaReal(p.a, p.m, p.d) ? `${String(p.a).padStart(4, '0')}-${dosCifras(p.m)}-${dosCifras(p.d)}` : ''; };
  const dmaDeIso = (iso) => { const m = String(iso || '').match(/^(\d{4})-(\d{2})-(\d{2})$/); return m ? `${m[3]}/${m[2]}/${m[1]}` : ''; };
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
  function letrasDeNombre(t) {
    return String(t || '').toUpperCase()
      .replace(/Ñ/g, '\u0001').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\u0001/g, 'Ñ')
      .replace(/[^A-ZÑ ]/g, ' ').replace(/\s+/g, ' ').trim();
  }
  function palabraDeCurp(t, esNombre) {
    let p = letrasDeNombre(t).split(' ').filter((w) => w && !CURP_NOMBRE.particulas.includes(w));
    if (esNombre && p.length > 1 && CURP_NOMBRE.nombresComunes.includes(p[0])) p = p.slice(1);
    return p[0] || '';
  }
  const letraDeCurp = (c) => (!c || c === 'Ñ' ? 'X' : c);
  const vocalInterna = (p) => letraDeCurp([...p.slice(1)].find((c) => CURP_NOMBRE.vocales.includes(c)));
  const consonanteInterna = (p) => letraDeCurp([...p.slice(1)].find((c) => !CURP_NOMBRE.vocales.includes(c)));
  function letrasDeCurp({ nombre, primer, segundo }) {
    const n = palabraDeCurp(nombre, true), a1 = palabraDeCurp(primer), a2 = palabraDeCurp(segundo);
    if (!n || !a1) return null;
    return {
      p1: letraDeCurp(a1[0]), p2: vocalInterna(a1), p3: a2 ? letraDeCurp(a2[0]) : 'X', p4: letraDeCurp(n[0]),
      p14: consonanteInterna(a1), p15: a2 ? consonanteInterna(a2) : 'X', p16: consonanteInterna(n)
    };
  }
  function prefijoCurp(datos, fechaISO, sexo, entidad) {
    const e = letrasDeCurp(datos);
    let cuatro = e.p1 + e.p2 + e.p3 + e.p4;
    if (CURP_NOMBRE.altisonantes.includes(cuatro)) cuatro = `${cuatro[0]}X${cuatro.slice(2)}`;
    return cuatro + fechaISO.slice(2, 4) + fechaISO.slice(5, 7) + fechaISO.slice(8, 10) + sexo + entidad + e.p14 + e.p15 + e.p16;
  }
  const FORMATOS = {
    nombre: {
      descripcion: 'Nombre o apellido de persona',
      inputmode: 'text', autocomplete: 'given-name',
      normaliza: (v) => recorta(v).replace(/[\u2018\u2019\u02BC\u00B4`]/g, "'"),
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
      normaliza: (v) => recorta(v).toLowerCase(),
      valida: (v, a = {}, cfg = CONFIG) => {
        const M = cfg.mensajes;
        if (v.length > (a.maxlength || 120)) return plantilla(M.fmtCorreoLargo, { max: a.maxlength || 120 });
        if (/\s/.test(v)) return M.fmtCorreoEspacios;
        const partes = v.split('@');
        if (partes.length !== 2 || !partes[0] || !partes[1]) return M.fmtCorreoArroba;
        if (/[,;:<>()[\]\\"]/.test(partes[0]) || /^\.|\.$|\.\./.test(partes[0])) return M.fmtCorreoUsuario;
        if (!/^[\p{L}\p{N}](?:[\p{L}\p{N}-]*[\p{L}\p{N}])?(?:\.[\p{L}\p{N}](?:[\p{L}\p{N}-]*[\p{L}\p{N}])?)*\.(?:\p{L}{2,}|xn--[a-z0-9-]+)$/u.test(partes[1])) return M.fmtCorreoDominio;
        return '';
      },
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
      normaliza: (v) => {
        const d = soloDigitos(v);
        if (d.length === 12 && (d.startsWith('52') || d.startsWith('01'))) return d.slice(2);
        if (d.length === 13 && (d.startsWith('521') || d.startsWith('044') || d.startsWith('045'))) return d.slice(3);
        return d;
      },
      valida: (v, a = {}, cfg = CONFIG) => (/^\d{10}$/.test(v) ? '' : cfg.mensajes.fmtTelefono)
    },
    cp: {
      descripcion: 'Código postal: cinco dígitos, se conserva como texto',
      inputmode: 'numeric', autocomplete: 'postal-code',
      normaliza: (v) => soloDigitos(v),
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
      normaliza: (v) => { const t = recorta(v).replace(/\s/g, ''); return CON_MILES.test(t) ? t : t.replace(',', '.'); },
      valida: (v, a = {}, cfg = CONFIG) => {
        const M = cfg.mensajes;
        if (CON_MILES.test(v)) return plantilla(M.fmtNumeroMiles, { numero: v.replace(/,/g, '') });
        if (!/^-?\d+(\.\d+)?$/.test(v)) return M.fmtNumero;
        const n = Number(v);
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
      descripcion: 'Fecha real con límites configurables: se guarda como AAAA-MM-DD y la persona la ve como día/mes/año',
      inputmode: 'numeric', autocomplete: 'off',
      normaliza: (v) => { const t = recorta(v); return isoDeDma(t) || t; },
      valida: (v, a = {}, cfg = CONFIG) => {
        const M = cfg.mensajes;
        const m = v.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (!m || !esFechaReal(Number(m[1]), Number(m[2]), Number(m[3]))) return M.fmtFecha;
        if (a.max && v > a.max) return a.max === hoyISO() ? M.fmtFechaFutura : plantilla(M.fmtFechaMax, { fecha: dmaDeIso(a.max) || a.max });
        if (a.min && v < a.min) return plantilla(M.fmtFechaMin, { fecha: dmaDeIso(a.min) || a.min });
        if (Number(m[1]) < 1900 || Number(m[1]) > 2100) return M.fmtFechaAnio;
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
        if (!iso && /^\d{1,2}\s*[/.\- ]\s*\d{1,2}\s*[/.\- ]\s*\d{2}$/.test(v)) return M.fmtFechaDmaAnio;
        if (!iso) return M.fmtFechaDma;
        if (Number(iso.slice(0, 4)) < 1900) return M.fmtFechaDmaAnio;
        const max = a.max || (a.noFutura !== undefined ? hoyISO() : '');
        if (max && iso > max) return max === hoyISO() ? M.fmtFechaFutura : plantilla(M.fmtFechaMax, { fecha: dmaDeIso(max) });
        if (a.min && iso < a.min) return plantilla(M.fmtFechaMin, { fecha: dmaDeIso(a.min) });
        if (Number(iso.slice(0, 4)) > 2100) return M.fmtFechaDmaAnio;
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
  const CRUZADAS = {
    'curp-fecha': {
      descripcion: 'La fecha de nacimiento coincide con la contenida en la CURP',
      campos: ['curp', 'fecha'], bloquea: true,
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
    'curp-nombre': {
      descripcion: 'Las letras de la CURP corresponden al nombre y al primer apellido (posiciones 1, 2, 4, 14 y 16)',
      campos: ['curp', 'nombre', 'primer'], bloquea: true,
      valida: ({ curp, nombre, primer }, a = {}, cfg = CONFIG) => {
        const e = letrasDeCurp({ nombre, primer, segundo: '' });
        if (!e) return '';
        const p2 = CURP_NOMBRE.altisonantes.includes(e.p1 + e.p2 + curp[2] + e.p4) ? 'X' : e.p2;
        return curp[0] === e.p1 && curp[1] === p2 && curp[3] === e.p4 && curp[13] === e.p14 && curp[15] === e.p16 ? '' : cfg.mensajes.curpNombre;
      }
    },
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
  CRUZADAS['curp-fecha-dma'] = { ...CRUZADAS['curp-fecha'], descripcion: 'La fecha de nacimiento (día/mes/año) coincide con la contenida en la CURP' };
  const ARCHIVOS = {
    extensiones: ['jpg', 'jpeg', 'png', 'pdf'],
    mb: 8,                 /* máximo por archivo, medido después de optimizar */
    mbTotal: 25,
    max: 5,
    minBytes: 1,           /* un archivo vacío se rechaza */
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
  const CONFIG = {
    version: '1.6.3',
    idioma: 'es-MX',
    fechas: { zonaHoraria: 'America/Mexico_City', horas24: true },
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
    acuse: { horasVisible: 24 },
    anuncios: { retardoMs: 50 },
    combo: { maxResultados: 8 },
    chips: { max: 5, clave: 'sia-chips' },
    visor: { pdfjs: '', fijoDesde: '(min-width: 1024px)', retardoMs: 250 },
    mensajes: {
      prefijoError: 'Error:',
      obligatorioTexto: 'Completa «{etiqueta}».',
      obligatorioOpcion: 'Elige una opción en «{etiqueta}».',
      obligatorioCasilla: 'Marca la casilla «{etiqueta}» para continuar.',
      obligatorioArchivos: 'Agrega al menos un archivo en «{etiqueta}».',
      obligatorioOtro: 'Escribe cuál es la otra opción en «{etiqueta}».',
      minimoOpciones: 'Elige al menos {min} opciones en «{etiqueta}».',
      maximoOpciones: 'Elige como máximo {max} opciones en «{etiqueta}».',
      soloLista: 'Elige una opción de la lista en «{etiqueta}».',
      repiteOpcion: '«{texto}» ya está en la lista: elige esa opción.',
      edadMinima: 'Se requiere una edad mínima de {edad} años.',
      edadMaxima: 'La edad máxima es de {edad} años.',
      curpNombre: 'La CURP no corresponde con el nombre y los apellidos que escribiste. Escríbelos tal como aparecen en tu CURP.',
      curpSinSegundo: 'Tu CURP indica que tienes segundo apellido. Escríbelo tal como aparece en tu CURP.',
      fmtNombre: 'Escribe sólo letras, espacios, apóstrofe, guion o punto. Ejemplo: María José',
      fmtNombreLargo: 'El nombre es demasiado largo: usa hasta {max} caracteres.',
      fmtCorreoLargo: 'El correo es demasiado largo: usa hasta {max} caracteres.',
      fmtCorreoArroba: 'El correo necesita una sola arroba, con texto antes y después. Ejemplo: nombre@dominio.mx',
      fmtCorreoDominio: 'Revisa lo que va después de la arroba: nombres separados por un punto, sin puntos seguidos. Ejemplo: nombre@dominio.mx',
      fmtCorreoUsuario: 'Revisa lo que va antes de la arroba: sin comas ni espacios, y sin un punto al principio, al final o dos seguidos. Ejemplo: nombre.apellido@dominio.mx',
      fmtCorreoEspacios: 'El correo no lleva espacios: revísalo y quítalos. Ejemplo: nombre@dominio.mx',
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
      fmtFecha: 'Escribe una fecha real como día/mes/año. Ejemplo: 15/03/2026',
      fmtFechaAnio: 'Revisa el año: escribe una fecha entre 1900 y 2100.',
      fmtFechaDma: 'Escribe una fecha real como día/mes/año. Ejemplo: 23/07/1985',
      fmtFechaDmaAnio: 'Revisa el año: escribe los cuatro dígitos, entre 1900 y 2100. Ejemplo: 1985',
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
      czCpColonia: 'El código postal no corresponde a la colonia elegida según el catálogo. Revisa ambos datos; si son correctos, puedes continuar.',
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
      compartirFallo: 'Tu navegador no permite compartir desde aquí.',
      borradorGuardado: 'Borrador guardado en este dispositivo.',
      enviando: 'Enviando…',
      envioError: 'No se pudo enviar. Lo que capturaste sigue aquí; intenta de nuevo.',
      envioTimeout: 'El envío tardó demasiado y se detuvo. Lo que capturaste sigue aquí; intenta de nuevo.',
      envioLimite: 'Por ahora no se reciben más envíos desde este dispositivo. Lo que capturaste no se perdió; intenta más tarde.',
      envioRecibido: 'Tu envío se recibió. No lo envíes de nuevo.',
      envioRecibidoFolio: 'Tu envío se recibió con el folio {folio}. Guárdalo; no lo envíes de nuevo.',
      borradorSinAlmacen: 'Este equipo no permite guardar el borrador: si cierras la página antes de enviar, lo que capturaste se pierde.',
      borradorDescartarTitulo: '¿Descartar el borrador?',
      borradorDescartarTexto: 'Se borra lo que capturaste en este dispositivo y no se puede deshacer.',
      borradorDescartarSi: 'Descartar borrador',
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
      archMasDe: 'más de {mb} MB',
      archFalloAlEnviar: 'No se agregó «{nombre}»: {motivo} Revísalo antes de enviar.',
      archProveedorFallo: 'No se pudieron recuperar los archivos que habías agregado. Agrégalos de nuevo.',
      archRechazoTotal: 'con él se superan los {mb} MB en total.',
      archRechazoVacio: 'el archivo está vacío.',
      archRechazoDuplicado: 'ya agregaste ese mismo archivo.',
      archRechazoDimension: 'la imagen es demasiado pequeña (mínimo {ancho} × {alto} píxeles).',
      archRechazoOptimizada: 'aun optimizada pesa {peso} y el máximo es {mb} MB.',
      archLimite: '{admitidos}: {formatos}. Hasta {max} archivos de {mb} MB cada uno.',
      archLimiteUno: '{admitidos}: {formatos}. Un archivo de hasta {mb} MB.',
      archFormatos: 'Formatos admitidos',
      archFormato: 'Formato admitido',
      archLleno: 'Ya agregaste los {max} archivos. Para cambiar uno, quítalo.',
      archLlenoUno: 'Ya agregaste el archivo. Para cambiarlo, quítalo.',
      archAgregado: 'Se agregó {nombre}.',
      archQuitado: 'Se quitó {nombre}.',
      archReintentar: 'Reintentar',
      comboUno: 'Un resultado disponible.',
      comboVarios: '{n} resultados disponibles.',
      comboNinguno: 'Sin resultados para «{texto}».',
      comboLibre: 'No está en la lista: se guarda como lo escribiste.',
      comboSinLista: 'La lista no cargó: escribe el nombre como lo conoces. Se revisará al recibir tu envío.',
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
      mapaFuera: 'El punto queda fuera de la Ciudad de México. Muévelo o escribe la dirección.',
      chipsBorrar: 'Borrar historial',
      chipsQuitar: 'Quitar {texto} de las sugerencias',
      chipsFijos: 'Respuestas frecuentes para {etiqueta}',
      chipsFijosContexto: '{nombre}, {contexto}',
      chipsFijosOrden: '{n} de {total}',
      chipsAgregado: 'Se agregó: {texto}',
      visorCargando: 'Cargando el documento…',
      visorError: 'No se pudo mostrar el documento aquí. Ábrelo en otra pestaña con el enlace de arriba.',
      visorNavegador: 'Se muestra con el visor del navegador. Si no lo ves completo, ábrelo en otra pestaña con el enlace de arriba.',
      visorHoja: 'Hoja {n} de {total}',
      archRechazoProceso: 'no se pudo procesar el archivo. Intenta de nuevo.',
      copiarBoton: 'Copiado',
      copiarBotonFallo: 'No se pudo copiar',
      enlaceNuevaPestana: '(se abre en otra pestaña)',
      descargaBoton: 'Preparando…',
      enlaceMapaSin: 'Ese texto no trae coordenadas. Pega el enlace completo de Google Maps (el que empieza con google.com/maps) o escribe las coordenadas.',
      enlaceMapaCorto: 'Los enlaces cortos de Google Maps no traen las coordenadas. Ábrelo en Google Maps: en el celular, mantén presionado el punto y copia los números que aparecen; en la computadora, haz clic derecho sobre el punto. Pégalos en «Coordenadas».',
      enlaceMapaCentro: 'Ese enlace marca el centro de la pantalla, no un punto: se tomaron las coordenadas {coordenadas}. Revisa que sea el lugar.',
      enlaceMapaTomadas: 'Coordenadas tomadas del enlace: {coordenadas}.',
      enlaceMapaOrden: 'se acomodaron latitud y longitud',
      enlaceMapaSigno: 'se agregó el signo menos a la longitud, que en la Ciudad siempre es negativa',
      enlaceMapaAnuncio: 'Coordenadas: {coordenadas}{notas}.',
      conjuncion: ' y ',
      fechaEdadCalculada: '{etiqueta}: {edad} años, según la fecha de nacimiento.',
      fechaAtajos: 'Atajos de periodo',
      fechaUltimos: 'Últimos {n} días',
      fechaPeriodo: 'Periodo: del {desde} al {hasta}',
      curpDerivado: '{etiqueta}: {valor}, según la CURP.',
      sexoH: 'Hombre',
      sexoM: 'Mujer',
      sexoX: 'No binario',
      cascadaCpTomado: '{etiqueta}: {valor}, según el catálogo. Puedes corregirlo.',
      cascadaTomadaCp: '{etiqueta}: {valor}, según el código postal.',
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
      repetibleAgregado: 'Se agregó {etiqueta} {n}.',
      repetibleQuitado: 'Fila {n} quitada.',
      pestanaAnuncio: 'Pestaña {nombre}',
      paginacionAnterior: 'Anterior',
      paginacionSiguiente: 'Siguiente',
      paginacionMas: 'Cargar más',
      paginacionActual: 'Página {n}, actual',
      compartido: 'Compartido.',
      borradorRecuperado: 'Borrador recuperado en este dispositivo.',
      fechaHora: '{fecha} a las {hora}',
      borradorNoGuardar: 'Nada se guarda en este equipo mientras esta pestaña siga abierta. Si la cierras antes de enviar, lo que capturaste se pierde.',
      borradorRecuperadoPaso: 'Sigues en el paso {n} de {total}: «{titulo}».',
      borradorRecuperadoFalta: 'Por seguridad esto no se guarda en el equipo; vuelve a llenarlo: {campos}.',
      borradorArchivosFalta: 'Los archivos no se guardan en el equipo; vuelve a agregarlos en «{campos}».',
      borradorDescartado: 'Se descartó el borrador: el formulario empieza vacío.',
      borradorOtraPestana: 'Este formulario también está abierto en otra pestaña o ventana. Usa sólo una: lo que se guarda en una reemplaza el borrador de la otra.',
      borradorEnviadoOtraPestana: 'Este formulario ya se envió desde otra pestaña o ventana, y aquí ya no se guarda el borrador. Si lo envías también desde aquí, llegará dos veces.',
      acuseCompartir: 'Folio: {folio}. Recibido el {fecha}.',
      cascadaElige: 'Elige una opción',
      copiarTexto: 'Copiar',
      paginacionPorPagina: 'Por página',
      pasosBarra: 'Avance del formulario',
      progresoPorCiento: '{n} por ciento',
      visorDocumento: 'Documento',
      mapaAcercar: 'Acercar',
      mapaAlejar: 'Alejar',
      mapaAproximada: 'Tu ubicación es aproximada (unos {metros} m a la redonda): revisa que el punto esté en el sitio y muévelo si hace falta.'
    }
  };
  return Object.assign(CONFIG, { pareceTexto, fechaDeCurp, digitoCurp, letrasDeCurp, prefijoCurp, isoDeDma, dmaDeIso, guiaFechaDma, hoyISO, ahoraHM, edadEn, plantilla, recorta, soloDigitos, distancia, formatosArchivo });
}));
/* ../js/iconos.js */
window.FORMKIT_ICONOS = "<svg xmlns=\"http://www.w3.org/2000/svg\" hidden> <symbol id=\"i-alerta\" viewBox=\"0 0 24 24\"><path d=\"M12 3 2.5 20h19L12 3z\"/><path d=\"M12 9v5\"/><path d=\"M12 17.5h.01\"/></symbol> <symbol id=\"i-error\" viewBox=\"0 0 24 24\"><circle cx=\"12\" cy=\"12\" r=\"9\"/><path d=\"M12 7v6\"/><path d=\"M12 16.5h.01\"/></symbol> <symbol id=\"i-ok\" viewBox=\"0 0 24 24\"><circle cx=\"12\" cy=\"12\" r=\"9\"/><path d=\"m8 12.5 2.5 2.5L16 9.5\"/></symbol> <symbol id=\"i-info\" viewBox=\"0 0 24 24\"><circle cx=\"12\" cy=\"12\" r=\"9\"/><path d=\"M12 11v6\"/><path d=\"M12 7.5h.01\"/></symbol> <symbol id=\"i-ayuda\" viewBox=\"0 0 24 24\"><circle cx=\"12\" cy=\"12\" r=\"9\"/><path d=\"M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .9-1 1.7\"/><path d=\"M12 17h.01\"/></symbol> <symbol id=\"i-cerrar\" viewBox=\"0 0 24 24\"><path d=\"m6 6 12 12\"/><path d=\"M18 6 6 18\"/></symbol> <symbol id=\"i-palomita\" viewBox=\"0 0 24 24\"><path d=\"m5 12.5 4.5 4.5L19 7.5\"/></symbol> <symbol id=\"i-flecha-izq\" viewBox=\"0 0 24 24\"><path d=\"M19 12H5\"/><path d=\"m11 6-6 6 6 6\"/></symbol> <symbol id=\"i-flecha-der\" viewBox=\"0 0 24 24\"><path d=\"M5 12h14\"/><path d=\"m13 6 6 6-6 6\"/></symbol> <symbol id=\"i-abajo\" viewBox=\"0 0 24 24\"><path d=\"m6 9 6 6 6-6\"/></symbol> <symbol id=\"i-descarga\" viewBox=\"0 0 24 24\"><path d=\"M12 4v11\"/><path d=\"m7 10 5 5 5-5\"/><path d=\"M4 19h16\"/></symbol> <symbol id=\"i-copiar\" viewBox=\"0 0 24 24\"><rect x=\"9\" y=\"9\" width=\"11\" height=\"11\" rx=\"2\"/><path d=\"M5 15V6a2 2 0 0 1 2-2h9\"/></symbol> <symbol id=\"i-compartir\" viewBox=\"0 0 24 24\"><circle cx=\"18\" cy=\"5\" r=\"2.5\"/><circle cx=\"6\" cy=\"12\" r=\"2.5\"/><circle cx=\"18\" cy=\"19\" r=\"2.5\"/><path d=\"m8.3 10.8 7.4-4.6\"/><path d=\"m8.3 13.2 7.4 4.6\"/></symbol> <symbol id=\"i-eliminar\" viewBox=\"0 0 24 24\"><path d=\"M4 7h16\"/><path d=\"M9 7V4h6v3\"/><path d=\"M6 7l1 13h10l1-13\"/></symbol> <symbol id=\"i-editar\" viewBox=\"0 0 24 24\"><path d=\"M4 20h4l11-11-4-4L4 16v4z\"/><path d=\"m13 7 4 4\"/></symbol> <symbol id=\"i-ubicacion\" viewBox=\"0 0 24 24\"><path d=\"M12 21s-6-6.3-6-11a6 6 0 0 1 12 0c0 4.7-6 11-6 11z\"/><circle cx=\"12\" cy=\"10\" r=\"2.2\"/></symbol> <symbol id=\"i-fecha\" viewBox=\"0 0 24 24\"><rect x=\"4\" y=\"5\" width=\"16\" height=\"15\" rx=\"2\"/><path d=\"M4 10h16\"/><path d=\"M8 3v4\"/><path d=\"M16 3v4\"/></symbol> <symbol id=\"i-adjunto\" viewBox=\"0 0 24 24\"><path d=\"m20 11-8.5 8.5a5 5 0 0 1-7-7L13 4a3.3 3.3 0 0 1 4.7 4.7L9.5 17a1.6 1.6 0 0 1-2.3-2.3L15 7\"/></symbol> <symbol id=\"i-camara\" viewBox=\"0 0 24 24\"><path d=\"M4 8h3l2-3h6l2 3h3v11H4z\"/><circle cx=\"12\" cy=\"13\" r=\"3.5\"/></symbol> <symbol id=\"i-buscar\" viewBox=\"0 0 24 24\"><circle cx=\"11\" cy=\"11\" r=\"6\"/><path d=\"m20 20-4.5-4.5\"/></symbol> <symbol id=\"i-mas\" viewBox=\"0 0 24 24\"><path d=\"M12 5v14\"/><path d=\"M5 12h14\"/></symbol> <symbol id=\"i-cargando\" viewBox=\"0 0 24 24\"><path d=\"M12 3a9 9 0 1 0 9 9\"/></symbol> <symbol id=\"i-reloj\" viewBox=\"0 0 24 24\"><circle cx=\"12\" cy=\"12\" r=\"9\"/><path d=\"M12 7v5l3 2\"/></symbol> <symbol id=\"i-externo\" viewBox=\"0 0 24 24\"><path d=\"M14 4h6v6\"/><path d=\"M20 4 10 14\"/><path d=\"M19 14v5H5V5h5\"/></symbol> <symbol id=\"i-archivo\" viewBox=\"0 0 24 24\"><rect x=\"3\" y=\"4\" width=\"18\" height=\"5\" rx=\"1\"/><path d=\"M5 9v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9\"/><path d=\"M10 13h4\"/></symbol> <symbol id=\"i-facebook\" viewBox=\"0 0 24 24\"><path fill=\"currentColor\" stroke=\"none\" d=\"M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5 3.66 9.15 8.44 9.94v-7.03H7.9v-2.91h2.54V9.85c0-2.52 1.5-3.91 3.77-3.91 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.78-1.63 1.57v1.89h2.78l-.45 2.91h-2.33V22c4.78-.79 8.44-4.93 8.44-9.94Z\"/></symbol> <symbol id=\"i-x\" viewBox=\"0 0 24 24\"><path fill=\"currentColor\" stroke=\"none\" d=\"M17.53 3h3.03l-6.62 7.57L21.75 21h-6.09l-4.77-6.24L5.42 21H2.38l7.08-8.09L2.25 3h6.24l4.31 5.7L17.53 3Zm-1.07 16.17h1.68L7.62 4.73H5.82l10.64 14.44Z\"/></symbol> <symbol id=\"i-instagram\" viewBox=\"0 0 24 24\"><path fill=\"currentColor\" stroke=\"none\" d=\"M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41-.56-.22-.96-.48-1.38-.9-.42-.42-.68-.82-.9-1.38-.16-.42-.36-1.06-.41-2.23C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16Zm0 3.29a6.55 6.55 0 1 0 0 13.1 6.55 6.55 0 0 0 0-13.1Zm0 10.8a4.25 4.25 0 1 1 0-8.5 4.25 4.25 0 0 1 0 8.5Zm8.34-11.06a1.53 1.53 0 1 1-3.06 0 1.53 1.53 0 0 1 3.06 0Z\"/></symbol> <symbol id=\"i-tiktok\" viewBox=\"0 0 24 24\"><path fill=\"currentColor\" stroke=\"none\" d=\"M16.6 5.82A4.28 4.28 0 0 1 15.54 3h-3.1v12.4a2.59 2.59 0 1 1-1.84-2.48V9.75a5.72 5.72 0 1 0 4.94 5.66V9.01a7.35 7.35 0 0 0 4.3 1.38V7.28a4.29 4.29 0 0 1-3.24-1.46Z\"/></symbol> <symbol id=\"i-youtube\" viewBox=\"0 0 24 24\"><path fill=\"currentColor\" stroke=\"none\" d=\"M23.5 6.5a3.02 3.02 0 0 0-2.12-2.14C19.5 3.85 12 3.85 12 3.85s-7.5 0-9.38.51A3.02 3.02 0 0 0 .5 6.5C0 8.39 0 12 0 12s0 3.61.5 5.5a3.02 3.02 0 0 0 2.12 2.14c1.88.51 9.38.51 9.38.51s7.5 0 9.38-.51a3.02 3.02 0 0 0 2.12-2.14C24 15.61 24 12 24 12s0-3.61-.5-5.5ZM9.6 15.57V8.43L15.82 12 9.6 15.57Z\"/></symbol> </svg>";
/* ../js/formkit.core.js */
(function (global) {
  'use strict';
  const BASE = global.FORMKIT_VALIDACIONES;
  if (!BASE) throw new Error('FormKit: falta validaciones.config.js; debe cargarse antes que formkit.core.js');
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const plantilla = BASE.plantilla;
  const BYTES_POR_MB = 1048576;
  const BYTES_POR_KB = 1024;
  const MS_POR_DIA = 86400000;
  const AUTOCOMPLETE_SECRETO = /(^|\s)(current-password|new-password|one-time-code|cc-[a-z-]+)$/;
  const esBorrador = (b) => !!b && typeof b === 'object' && typeof b.v === 'string' && typeof b.t === 'number' && !!b.datos && typeof b.datos === 'object';
  const vencido = (t, ttlDias) => Date.now() - t > ttlDias * MS_POR_DIA || t > Date.now() + MS_POR_DIA;
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
  const ficticiosAvisados = new Set();
  const avisaFicticio = (nombre, cat) => {
    if (!cat || cat.es_ficticio !== true || ficticiosAvisados.has(nombre)) return;
    if (document.querySelector('.entorno-pruebas') || document.documentElement.hasAttribute('data-muestras')) return;
    ficticiosAvisados.add(nombre);
    console.warn(`FormKit: el catálogo «${nombre}» es de ejemplo (es_ficticio: true) y esta página no dice que es de pruebas. Antes de publicar, cámbialo por el oficial (codigo/catalogos/LEEME.md).`);
  };
  const relojDe = (cfg) => ((cfg.fechas || {}).horas24 === false ? 'h12' : 'h23');
  function fechaHora(valor, cfg = FormKit.config) {
    const soloFecha = typeof valor === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(valor);
    const f = soloFecha ? new Date(`${valor}T12:00:00Z`) : new Date(typeof valor === 'string' && /^\d+$/.test(valor) ? Number(valor) : valor);
    if (valor === null || valor === undefined || valor === '' || Number.isNaN(f.getTime())) return '';
    const partes = new Intl.DateTimeFormat(cfg.idioma, { day: 'numeric', month: 'long', year: 'numeric', hour: 'numeric', minute: '2-digit', hourCycle: relojDe(cfg), timeZone: soloFecha ? 'UTC' : (cfg.fechas || {}).zonaHoraria }).formatToParts(f);
    const g = (t) => (partes.find((p) => p.type === t) || {}).value || '';
    const fecha = `${g('day')} de ${g('month')} de ${g('year')}`;
    if (soloFecha) return fecha;
    const doce = relojDe(cfg) === 'h12';
    const hora = `${doce ? g('hour') : g('hour').padStart(2, '0')}:${g('minute')}${doce ? ` ${g('dayPeriod')}` : ''}`;
    return plantilla((cfg.mensajes || {}).fechaHora || '{fecha} a las {hora}', { fecha, hora });
  }
  function fusiona(base, extra) {
    if (!extra || typeof extra !== 'object' || Array.isArray(extra)) return extra === undefined ? base : extra;
    const out = Array.isArray(base) ? [...base] : { ...base };
    for (const k of Object.keys(extra)) out[k] = fusiona(base ? base[k] : undefined, extra[k]);
    return out;
  }
  const memoria = new Map();
  const almacen = {
    lee(k) { try { return global.localStorage.getItem(k); } catch (e) { return memoria.has(k) ? memoria.get(k) : null; } },
    escribe(k, v) { try { global.localStorage.setItem(k, v); return true; } catch (e) { memoria.set(k, v); return false; } },
    borra(k) { try { global.localStorage.removeItem(k); } catch (e) { /* sin almacén */ } memoria.delete(k); }
  };
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
  function inyectaSprite() {
    if (!global.FORMKIT_ICONOS || $('[data-sprite-iconos]')) return;
    const cont = document.createElement('div');
    cont.setAttribute('data-sprite-iconos', '');
    cont.hidden = true;
    cont.innerHTML = global.FORMKIT_ICONOS;
    document.body.prepend(cont);
  }
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
    else if (!t.rol) anuncia([...cuerpo.querySelectorAll(':scope > *, li')].filter((e) => e.tagName !== 'OL').map((e) => e.textContent.trim()).join(' '));
    return a;
  }
  const modulos = new Map();
  function registra(nombre, def) { modulos.set(nombre, def); }
  function iniciar(formulario, opciones = {}) {
    const form = typeof formulario === 'string' ? $(formulario) : formulario;
    if (!form) throw new Error(`FormKit: no existe el formulario «${formulario}»`);
    const previa = iniciados.get(form);
    if (previa) { Object.assign(previa.extra, opciones); return previa.instancia; }
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
    const estado = new Map();
    const estadoDe = (n) => { if (!estado.has(n)) estado.set(n, { dirty: false, tocado: false }); return estado.get(n); };
    const tipos = new Map();
    const envolturas = () => $$('[data-campo]', form);
    const escapa = (n) => (global.CSS && CSS.escape ? CSS.escape(String(n)) : String(n).replace(/["\\]/g, '\\$&'));
    const envoltura = (n) => $(`[data-campo="${escapa(n)}"]`, form);
    const nombres = () => envolturas().map((el) => el.dataset.campo);
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
      if (el.dataset.formato === 'fecha') { const v = valorDe(n); return cfg.dmaDeIso(v) || v; }
      return valorDe(n);
    }
    function textoDeOpcion(input) {
      const lab = input.closest('label') || (input.id && $(`label[for="${input.id}"]`, form));
      const nombre = lab && ($('.opcion-nombre', lab) || lab);
      return nombre ? nombre.textContent.trim() : input.value;
    }
    function etiquetaDe(n) {
      const el = envoltura(n);
      const e = $('.etiqueta', el) || $('legend,label', el);
      if (!e) return el.dataset.etiqueta || n;
      const c = e.cloneNode(true);
      $$('.marca-oblig,.solo-lector,[data-tooltip]', c).forEach((x) => x.remove());
      const texto = c.textContent.replace(/\s+/g, ' ').trim();
      const fila = el.closest('.repetible-fila');
      const tituloFila = fila && $('.repetible-titulo', fila);
      return tituloFila && tituloFila.textContent.trim() ? `${texto} (${tituloFila.textContent.trim()})` : texto;
    }
    const esObligatorio = (n) => { const el = envoltura(n); return el.hasAttribute('data-requerido') || controlesDe(n).some((c) => c.required); };
    function activo(n) {
      let el = envoltura(n);
      while (el && el !== form) { if (el.hidden && !el.hasAttribute('data-paso')) return false; el = el.parentElement; }
      return true;
    }
    function atributosDe(n) {
      const c = controlPrincipal(n) || envoltura(n);
      const a = {};
      for (const k of ['min', 'max', 'step', 'minlength', 'maxlength']) if (c.hasAttribute(k)) a[k] = c.getAttribute(k);
      if (c.hasAttribute('data-legible')) a.legible = true;
      for (const [k, v] of Object.entries(envoltura(n).dataset)) a[k] = v;
      if (c.hasAttribute && c.hasAttribute('data-max-hoy')) { const hoy = cfg.hoyISO(); a.max = hoy; if (c.max !== hoy) c.max = hoy; }
      for (const [lim, clave] of [['min', a.minSegun], ['max', a.maxSegun]]) {
        const fn = clave && cfg.limitesSegun && cfg.limitesSegun[clave];
        if (typeof fn !== 'function') continue;
        const r = fn(datosActuales());
        if (r !== undefined && r !== null && r !== '') a[lim] = String(r);
      }
      return a;
    }
    const datosActuales = () => Object.fromEntries(nombres().filter((m) => activo(m)).map((m) => [m, valorDe(m)]));
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
        el.appendChild(err);
      }
      err.id = err.id || idUnico(`err-${n}`);
      const deBloque = ayudasDeBloque(el);
      for (const c of controlesDe(n)) {
        const ids = [...deBloque, ayuda && ayuda.textContent.trim() ? ayuda.id : '', err.id].filter(Boolean).join(' ');
        c.setAttribute('aria-describedby', ids);
        if (esObligatorio(n) && /^(INPUT|SELECT|TEXTAREA)$/.test(c.tagName) && c.type !== 'radio' && c.type !== 'checkbox') c.setAttribute('aria-required', 'true');
        const f = cfg.formatos[el.dataset.formato];
        if (f && f.inputmode && !c.hasAttribute('inputmode') && c.tagName === 'INPUT') c.setAttribute('inputmode', f.inputmode);
        if (c.tagName === 'INPUT' && !c.hasAttribute('enterkeyhint') && c.type !== 'radio' && c.type !== 'checkbox' && c.type !== 'file') c.setAttribute('enterkeyhint', 'next');
      }
      const ctl = controlPrincipal(n);
      if (ctl && el.dataset.formato === 'fecha' && el.hasAttribute('data-no-futura') && !ctl.max) { ctl.max = cfg.hoyISO(); ctl.dataset.maxHoy = ''; }
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
      const f = cfg.formatos[el.dataset.formato || 'texto'];
      if (cont && area) cont.textContent = `${(f ? f.normaliza(area.value) : area.value).length} / ${area.maxLength}`;
    }
    function autoAlto(area) { area.style.height = 'auto'; area.style.height = `${area.scrollHeight}px`; }
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
        return '';
      }
      const largo = cfg.recorta(v).length;
      if (a.maxlength && largo > Number(a.maxlength)) return plantilla(M.maximoCaracteres, { ...datos, max: a.maxlength });
      if (a.minlength && largo < Number(a.minlength)) return plantilla(M.minimoCaracteres, { ...datos, min: a.minlength, n: largo });
      return '';
    }
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
        for (const otro of (err.dataset.cruzadaCampos || '').split(' ').filter(Boolean)) if (otro !== n && envoltura(otro)) for (const c of controlesDe(otro)) { c.removeAttribute('aria-invalid'); c.setAttribute('aria-describedby', (c.getAttribute('aria-describedby') || '').split(' ').filter((x) => x && x !== err.id).join(' ')); }
        err.lastElementChild.textContent = ''; delete err.dataset.nivel; delete err.dataset.cruzada; delete err.dataset.cruzadaCampos;
      }
      for (const otro of camposCruzadosCon(n)) { const e2 = $('.err', envoltura(otro)); if (e2 && e2.dataset.cruzada === n) { e2.lastElementChild.textContent = ''; delete e2.dataset.cruzada; delete e2.dataset.nivel; for (const c of controlesDe(otro)) c.removeAttribute('aria-invalid'); } }
    }
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
      let sug = sugerenciaDe(n);
      for (const fn of ctx.sugerencias) if (!sug) sug = fn(n) || '';
      if (sug) marca(n, sug, 'advertencia');
      return '';
    }
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
    function quitaResumen(cont = form) { for (const r of $$('.resumen-errores', cont)) r.remove(); }
    function contextoDe(n) {
      const e = envoltura(n);
      const c = e && e.closest('[data-contexto]');
      return c ? c.dataset.contexto.trim() : '';
    }
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
    function revisaResumen() {
      if (!$('[aria-invalid="true"]', form)) quitaResumen();
    }
    function valorParaCondicion(nombre) {
      if (envoltura(nombre)) { if (!activo(nombre)) return []; const v = valorDe(nombre); return Array.isArray(v) ? v : [v]; }
      const ctls = $$(`[name="${nombre}"]`, form);
      const marcados = ctls.filter((c) => (c.type === 'radio' || c.type === 'checkbox') ? c.checked : true);
      return marcados.map((c) => c.value);
    }
    function aplicaCondicionales() {
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
            if (!visible) for (const c of $$('[data-campo]', el)) limpia(c.dataset.campo);
            if (el.hasAttribute('data-campo') && !visible) limpia(el.dataset.campo);
          }
        }
      }
    }
    const claveBorrador = form.dataset.borrador || '';
    const versionBorrador = form.dataset.borradorVersion || '1';
    let temporizadorBorrador = 0;
    let temporizadorGuardado = 0;
    let sinAlmacenAvisado = false;
    let arrancado = false;
    let terminado = false;
    const indicador = $('[data-guardado]');
    const franja = $('[data-franja-borrador]');
    let personaActuo = false;
    for (const t of ['input', 'change', 'click', 'drop']) form.addEventListener(t, (e) => { if (!e.isTrusted) return; personaActuo = true; if (terminado) { terminado = false; idempotencia = ''; } }, true);
    let franjaPendiente = false;
    const suscritosBorrador = [];
    const alBorrador = (def) => { suscritosBorrador.push(def); };
    const avisaBorrador = (accion, b) => { for (const x of suscritosBorrador) if (x[accion]) x[accion](b); };
    function borraBorrador() { almacen.borra(claveBorrador); avisaBorrador('borra'); }
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
    const claveNoGuardar = `${claveBorrador}:no-guardar`;
    let noGuardar = false;
    try { noGuardar = !!claveBorrador && global.sessionStorage.getItem(claveNoGuardar) === '1'; } catch (e) { /* sin almacén de sesión */ }
    const claveSenal = `${claveBorrador}:senal`;
    let enviadoEnOtra = false;
    let otraPestanaAvisada = false;
    function senal(tipo) { try { global.localStorage.setItem(claveSenal, JSON.stringify({ tipo, t: Date.now() })); global.localStorage.removeItem(claveSenal); } catch (e) { /* sin almacén: no hay otras pestañas que avisar */ } }
    if (claveBorrador) global.addEventListener('storage', (e) => {
      if (!arrancado || terminado) return;
      if (e.key === claveBorrador && e.newValue && !otraPestanaAvisada && !enviadoEnOtra) { otraPestanaAvisada = true; aviso(form, { tono: 'advertencia', texto: M.borradorOtraPestana }); }
      if (e.key !== claveSenal || !e.newValue) return;
      let s = null;
      try { s = JSON.parse(e.newValue); } catch (x) { return; }
      if (!s || s.tipo !== 'enviado') return;
      enviadoEnOtra = true;
      clearTimeout(temporizadorBorrador);
      aviso(form, { tono: 'advertencia', texto: M.borradorEnviadoOtraPestana });
    });
    function programaBorrador() {
      if (!claveBorrador || !arrancado || terminado || !personaActuo || franjaPendiente || noGuardar || enviadoEnOtra) return;
      clearTimeout(temporizadorBorrador);
      temporizadorBorrador = setTimeout(escribeBorrador, cfg.borrador.retardoMs);
    }
    function datosBorrador() {
      const datos = {};
      const fuera = fueraDelBorrador();
      for (const n of nombres()) {
        const el = envoltura(n);
        if (fuera.has(n) || el.hasAttribute('data-sin-borrador') || tipoDe(el) === 'auxiliar' || tipos.has(tipoDe(el)) && !tipos.get(tipoDe(el)).enBorrador) continue;
        datos[n] = valorDe(n);
      }
      return datos;
    }
    function escribeBorrador() {
      const extra = FormKit.ganchos.estadoBorrador ? FormKit.ganchos.estadoBorrador(form) : {};
      for (const x of suscritosBorrador) if (x.estado) Object.assign(extra, x.estado());
      const ok = almacen.escribe(claveBorrador, JSON.stringify({ v: versionBorrador, t: Date.now(), datos: datosBorrador(), ...extra }));
      avisaBorrador('escribe');
      if (!ok && !sinAlmacenAvisado) { sinAlmacenAvisado = true; if (indicador) { indicador.textContent = M.borradorSinAlmacen; indicador.setAttribute('data-visible', ''); } else aviso(form, { tono: 'advertencia', texto: M.borradorSinAlmacen }); }
      if (ok && indicador) {
        indicador.textContent = M.borradorGuardado;
        indicador.setAttribute('data-visible', '');
        clearTimeout(temporizadorGuardado);
        temporizadorGuardado = setTimeout(() => indicador.removeAttribute('data-visible'), cfg.borrador.visibleMs);
      }
    }
    window.addEventListener('pagehide', () => { if (temporizadorBorrador && claveBorrador && arrancado && !terminado && !franjaPendiente && !noGuardar && !enviadoEnOtra) { clearTimeout(temporizadorBorrador); escribeBorrador(); } });
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
    function resincroniza() {
      aplicaCondicionales();
      for (const s of $$('select', form)) s.toggleAttribute('data-vacio', !s.value);
      for (const n of nombres()) { actualizaContador(n); const a = $('textarea', envoltura(n)); if (a) autoAlto(a); }
    }
    window.addEventListener('pageshow', resincroniza);
    function restauraBorrador(b, { foco = false } = {}) {
      avisaBorrador('prepara', b);
      for (const [n, v] of Object.entries(b.datos || {})) {
        const el = envoltura(n);
        if (!el || el.hasAttribute('data-sin-borrador')) continue;
        const t = tipoDe(el);
        if (tipos.has(t)) { if (tipos.get(t).restaura) tipos.get(t).restaura(el, v); continue; }
        if (t === 'opcion') { const r = $$('input[type="radio"]', el).find((x) => x.value === v); if (r) r.checked = true; }
        else if (t === 'multiple') $$('input[type="checkbox"]', el).forEach((c) => { c.checked = Array.isArray(v) && v.includes(c.value); });
        else if (t === 'casilla') $('input', el).checked = !!v;
        else { const c = controlPrincipal(n); if (c) { c.value = v; if (c.tagName === 'SELECT') c.toggleAttribute('data-vacio', !c.value); } }
      }
      aplicaCondicionales();
      for (const n of nombres()) { actualizaContador(n); const a = $('textarea', envoltura(n)); if (a) autoAlto(a); }
      if (FormKit.ganchos.restauraBorrador) FormKit.ganchos.restauraBorrador(form, b);
      avisaBorrador('restaura', b);
      const textos = [M.borradorRecuperado];
      for (const x of suscritosBorrador) if (x.resumen) { const t = x.resumen(b); if (t) textos.push(t); }
      const derivados = new Set(nombres().flatMap((m) => (envoltura(m).dataset.deriva || '').split(/\s+/).map((p) => p.split('=')[1]).filter(Boolean)));
      const falta = [...fueraDelBorrador()].filter((m) => activo(m) && !derivados.has(m) && !controlesDe(m).some((c) => c.readOnly)).map(etiquetaDe);
      if (falta.length) textos.push(plantilla(M.borradorRecuperadoFalta, { campos: falta.join(', ') }));
      aviso(form, { tono: 'neutro', texto: textos, foco });
    }
    function descarta() {
      clearTimeout(temporizadorBorrador);
      borraBorrador();
      form.reset();
      resincroniza();
      avisaBorrador('descarta');
      aviso(form, { tono: 'neutro', texto: M.borradorDescartado, foco: true });
    }
    function iniciaFranja(b) {
      franja.hidden = false;
      franjaPendiente = true;
      const f = $('[data-borrador-fecha]', franja);
      if (f) f.textContent = fechaHora(b.t, cfg);
      const contesta = () => { franja.hidden = true; franjaPendiente = false; programaBorrador(); };
      franja.addEventListener('click', (e) => {
        const a = e.target.closest('[data-borrador]');
        if (!a) return;
        const confirma = $('[data-borrador-confirma]', franja);
        if (a.dataset.borrador === 'recuperar') { contesta(); restauraBorrador(b, { foco: true }); }
        else if (a.dataset.borrador === 'descartar') {
          if (confirma) { confirma.hidden = false; const seguro = $('[data-borrador="conservar"]', franja); if (seguro) seguro.focus(); }
          else if (FormKit.confirma) FormKit.confirma(a, { titulo: M.borradorDescartarTitulo, texto: M.borradorDescartarTexto, si: M.borradorDescartarSi, peligro: true }).then((ok) => { if (ok) { contesta(); descarta(); } });
          else console.warn('FormKit: la franja del borrador necesita [data-borrador-confirma] o el módulo «modal» para confirmar antes de descartar.');
        }
        else if (a.dataset.borrador === 'descartar-si') { contesta(); descarta(); }
        else if (a.dataset.borrador === 'conservar') { if (confirma) confirma.hidden = true; const r = $('[data-borrador="recuperar"]', franja); if (r) r.focus(); }
      });
    }
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
    let idempotencia = '';
    function claveIdempotencia() { if (!idempotencia) idempotencia = (global.crypto && crypto.randomUUID) ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`; return idempotencia; }
    function envioPorOmision(payload, { signal }) {
      const destino = form.getAttribute('action');
      if (!destino || destino === '#') return Promise.reject(new Error('FormKit: el formulario no declara action ni opciones.enviar'));
      const cabeceras = { 'Idempotency-Key': payload.meta.idempotencia };
      let cuerpo;
      if ((payload.archivos || []).some((a) => a && a.blob instanceof Blob)) {
        let parte = 0;
        cuerpo = new FormData();
        cuerpo.append('payload', JSON.stringify({ ...payload, archivos: payload.archivos.map(({ blob, ...resto }) => (blob instanceof Blob ? { ...resto, parte: parte++ } : resto)) }));
        for (const a of payload.archivos) if (a && a.blob instanceof Blob) cuerpo.append('archivo', a.blob, a.nombre);
      } else { cabeceras['Content-Type'] = 'application/json'; cuerpo = JSON.stringify(payload); }
      return fetch(destino, { method: form.getAttribute('method') || 'POST', headers: cabeceras, body: cuerpo, signal })
        .then(async (r) => {
          if (r.status === 429) { const e = new Error('limite'); e.limite = true; throw e; }
          if (!r.ok) {
            const e = new Error(`HTTP ${r.status}`);
            const cuerpo = await r.json().catch(() => null);
            if (cuerpo && Array.isArray(cuerpo.errores)) e.errores = cuerpo.errores;
            throw e;
          }
          const texto = await r.text().catch(() => '');
          try { return texto ? JSON.parse(texto) : {}; } catch (e) { return {}; }
        });
    }
    function marcaError(n, mensaje) {
      if (!envoltura(n)) return false;
      estadoDe(n).tocado = true;
      marca(n, mensaje);
      return true;
    }
    function botonEnviar() { return $('[data-accion="enviar"],button[type="submit"]', form); }
    let enviandoAhora = false;
    const avisaEnviando = (enviando) => form.dispatchEvent(new CustomEvent('formkit:enviando', { detail: { enviando } }));
    async function enviar() {
      if (enviandoAhora) return false;
      for (const b of $$('[data-ver-contrasena][aria-pressed="true"]', form)) verContrasena(b, false);
      const porModulo = FormKit.ganchos.validaTodo ? FormKit.ganchos.validaTodo(form) : null;
      const fallos = porModulo || validaContenedor(form);
      if (fallos.length) { if (!porModulo) muestraResumen(form, fallos); return false; }
      const boton = botonEnviar();
      const avisoEnvio = $('[data-estado-envio]', form);
      if (avisoEnvio) avisoEnvio.hidden = true;
      const textoOriginal = boton ? boton.textContent : '';
      enviandoAhora = true;
      avisaEnviando(true);
      if (boton) { boton.setAttribute('aria-disabled', 'true'); boton.setAttribute('aria-busy', 'true'); boton.textContent = M.enviando; }
      anuncia(M.enviando);
      const control = new AbortController();
      let plazo = 0;
      const pintaAvisoEnvio = (texto) => {
        if (!avisoEnvio) { anuncia(texto, true); return; }
        let t = $('.aviso-texto', avisoEnvio);
        if (!t) { t = document.createElement('span'); t.className = 'aviso-texto'; avisoEnvio.appendChild(t); }
        t.textContent = texto; avisoEnvio.hidden = false;
        form.dispatchEvent(new CustomEvent('formkit:muestra', { detail: { elemento: avisoEnvio } }));
        avisoEnvio.focus();
      };
      let respuesta;
      try {
        for (const def of tipos.values()) if (def.antesDeEnviar) await def.antesDeEnviar(form);
        const enviarFn = opciones.enviar || envioPorOmision;
        plazo = setTimeout(() => control.abort(), cfg.envio.timeoutMs);
        const vence = new Promise((ok, mal) => control.signal.addEventListener('abort', () => mal(new Error('plazo')), { once: true }));
        respuesta = await Promise.race([enviarFn(arma(), { signal: control.signal }), vence]);
      } catch (e) {
        const errores = e && Array.isArray(e.errores) ? e.errores.filter((x) => x && typeof x.mensaje === 'string' && x.mensaje) : [];
        const porCampo = errores.filter((x) => typeof x.campo === 'string' && x.campo && marcaError(x.campo, x.mensaje));
        const sinCampo = errores.filter((x) => !porCampo.includes(x)).map((x) => x.mensaje).join(' ');
        if (porCampo.length) {
          const fallos = porCampo.map((x) => ({ campo: x.campo, mensaje: x.mensaje }));
          if (!(FormKit.ganchos.erroresServidor && FormKit.ganchos.erroresServidor(form, fallos))) muestraResumen(form, fallos, 'servidor');
          if (sinCampo) pintaAvisoEnvio(sinCampo);
          if (opciones.alFallar) opciones.alFallar(e, form);
          return false;
        }
        pintaAvisoEnvio(sinCampo || (e && e.limite ? M.envioLimite : control.signal.aborted ? M.envioTimeout : M.envioError));
        if (opciones.alFallar) opciones.alFallar(e, form);
        return false;
      } finally {
        clearTimeout(plazo);
        enviandoAhora = false;
        avisaEnviando(false);
        if (boton) { boton.removeAttribute('aria-disabled'); boton.removeAttribute('aria-busy'); boton.textContent = textoOriginal; }
      }
      terminado = true;
      idempotencia = '';
      clearTimeout(temporizadorBorrador);
      const recibido = respuesta && typeof respuesta === 'object' ? respuesta : {};
      try {
        if (opciones.alEnviar) opciones.alEnviar(recibido, form);
        else {
          form.dispatchEvent(new CustomEvent('formkit:enviado', { detail: recibido }));
          if ($('[data-acuse]')) aviso(form, { tono: 'ok', texto: recibido.folio ? plantilla(M.envioRecibidoFolio, { folio: recibido.folio }) : M.envioRecibido, foco: true });
        }
      } catch (e) { console.error('FormKit: el envío se recibió, pero falló lo que la página hace después (alEnviar).', e); if (!form.hidden) aviso(form, { tono: 'ok', texto: M.envioRecibido, foco: true }); }
      if (claveBorrador) { borraBorrador(); senal('enviado'); }
      if (franja) { franja.hidden = true; franjaPendiente = false; }
      return true;
    }
    form.addEventListener('submit', (e) => { e.preventDefault(); if (!(FormKit.ganchos.submit && FormKit.ganchos.submit(form, enviar))) enviar(); });
    function revalidaDependientes(n) {
      for (const d of declarantesDe(n)) if (activo(d) && valorDe(d)) validaYPinta(d);
      for (const el of $$('[data-min-segun],[data-max-segun]', form)) {
        const m = el.dataset.campo;
        if (m && m !== n && activo(m) && estadoDe(m).tocado && valorDe(m)) validaYPinta(m);
      }
    }
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
        const err = $('.err', el);
        if (e.target.matches('input[type="radio"],input[type="checkbox"],select,input[type="date"],input[type="time"],input[type="file"]')) { if (estadoDe(n).tocado || (err && err.dataset.nivel)) validaYPinta(n); revalidaDependientes(n); revisaResumen(); }
        else if (err && err.dataset.nivel) { validaYPinta(n); revisaResumen(); }
      }
      programaBorrador();
    });
    form.addEventListener('focusout', (e) => {
      const el = e.target.closest('[data-campo]');
      if (!el || !e.target.matches('input,textarea,select')) return;
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
    const ocultaAvisoEnvio = () => { const a = $('[data-estado-envio]', form); if (a && !a.hidden) a.hidden = true; };
    form.addEventListener('input', ocultaAvisoEnvio);
    form.addEventListener('change', ocultaAvisoEnvio);
    const ctx = {
      form, cfg, M, opciones, opcionesPagina, tipos, sugerencias: [],
      $, $$, plantilla, icono, anuncia, almacen, idUnico, pesoTxt, normalizaBusqueda,
      envoltura, envolturas, nombres, tipoDe, controlesDe, controlPrincipal, valorDe, textoDeValor, etiquetaDe, esObligatorio, activo, atributosDe,
      validaCampo, validaYPinta, validaContenedor, marca, marcaError, limpia, muestraResumen, quitaResumen, revisaResumen, enfocaCampo,
      aplicaCondicionales, programaBorrador, alBorrador, leeBorrador, restauraBorrador, enviar, arma, preparaCampo, estadoDe, datosActuales
    };
    const activos = [];
    for (const [nombre, def] of modulos) {
      const ambito = def.fueraDelFormulario ? document : form;
      const enPlantilla = () => $$('template', form).some((t) => t.content.querySelector(def.selector));
      if (!def.selector || $(def.selector, ambito) || enPlantilla()) { if (def.tipos) for (const [t, d] of Object.entries(def.tipos)) tipos.set(t, d); activos.push([nombre, def]); }
    }
    for (const n of nombres()) preparaCampo(n);
    for (const [nombre, def] of activos) {
      if (!def.iniciar) continue;
      try { def.iniciar(form, ctx); } catch (e) { console.error(`FormKit: el módulo «${nombre}» no arrancó.`, e); }
    }
    for (const s of $$('select', form)) s.toggleAttribute('data-vacio', !s.value);
    aplicaCondicionales();
    purgaBorradoresVencidos(cfg.borrador.ttlDias);
    if (claveBorrador && !noGuardar) {
      const previo = leeBorrador();
      if (previo) { if (franja) iniciaFranja(previo); else restauraBorrador(previo); }
    }
    arrancado = true;
    form.dataset.formkit = 'listo';
    if (!$('[data-paso]', form)) for (const a of $$('[data-carga-pendiente]')) a.hidden = true;
    const instancia = {
      ctx,
      modulos: activos.map(([n]) => n),
      payload: arma,
      valida: () => validaContenedor(form),
      enviar,
      marcaError,
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
  const instancias = [];
  const iniciados = new WeakMap();
  const marcaErrorGlobal = (campo, mensaje) => instancias.some((i) => i.marcaError(campo, mensaje));
  const FormKit = {
    version: BASE.version,
    config: fusiona(BASE, global.FORMKIT_CONFIG || {}),
    registra, iniciar, anuncia, aviso, icono, almacen,
    marcaError: marcaErrorGlobal,
    utilidades: { $, $$, plantilla, pesoTxt, normalizaBusqueda, idUnico, fusiona, fechaHora, relojDe, avisaFicticio },
    ganchos: {}
  };
  global.FormKit = FormKit;
  document.addEventListener('DOMContentLoaded', () => {
    for (const f of $$('form[data-formkit=""]')) if (f.dataset.formkit !== 'listo') iniciar(f, global.FORMKIT_OPCIONES || {});
  });
}(window));
/* ../modulos/otro/otro.js */
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
        const gobierna = () => {
          const radio = $$('input[type="radio"],input[type="checkbox"]', grupo).find((i) => i.value === valorOtro);
          return radio || $('select', grupo);
        };
        const pinta = () => {
          const g = gobierna();
          if (!g) return;
          const v = valorDe(nombreOpciones);
          const abierto = Array.isArray(v) ? v.includes(valorOtro) : v === valorOtro;
          if (g.tagName === 'SELECT') g.setAttribute('aria-expanded', String(abierto));
          if (control) g.setAttribute('aria-controls', texto.id || (texto.id = ctx.idUnico(`otro-caja-${nombreTexto}`)));
        };
        pinta();
        grupo.addEventListener('change', pinta);
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
/* ../modulos/combo/combo.js */
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
          if (wrap.hasAttribute('data-libre') || wrap.hasAttribute('data-sin-catalogo')) return '';
          const lista = catalogo(wrap);
          const n = FormKit.utilidades.normalizaBusqueda(v);
          return lista.some((o) => FormKit.utilidades.normalizaBusqueda(o.nombre) === n) ? '' : FormKit.config.plantilla(FormKit.config.mensajes.soloLista, { etiqueta: etiquetaDe(el) });
        },
        alArmar: (form, payload) => {
          for (const wrap of form.querySelectorAll('[data-combo]:not([data-libre])')) {
            const campo = wrap.closest('[data-campo]').dataset.campo;
            if (!(campo in payload.datos)) continue;
            if (wrap.hasAttribute('data-sin-catalogo')) { (payload.meta.sin_catalogo = payload.meta.sin_catalogo || []).push(campo); continue; }
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
      for (const wrap of $$('[data-combo]', form)) arma(wrap);
      form.addEventListener('formkit:fila', (e) => { for (const wrap of $$('[data-combo]', e.detail.fila)) arma(wrap); });
      function arma(wrap) {
        if (wrap.dataset.comboListo !== undefined) return;
        wrap.dataset.comboListo = '';
        FormKit.utilidades.avisaFicticio(wrap.dataset.catalogo, (window.FORMKIT_CATALOGOS || {})[wrap.dataset.catalogo]);
        const campo = wrap.closest('[data-campo]');
        const n = campo.dataset.campo;
        const entrada = $('input', wrap);
        const lista = $('.combo-lista', wrap);
        const opciones = catalogo(wrap);
        if (!opciones.length && !wrap.hasAttribute('data-libre')) {
          wrap.setAttribute('data-sin-catalogo', '');
          const nota = document.createElement('div'); nota.className = 'combo-sin-lista';
          wrap.after(nota);
          FormKit.aviso(nota, { tono: 'advertencia', texto: M.comboSinLista });
          console.warn(`FormKit: el catálogo «${wrap.dataset.catalogo}» de «${n}» no cargó; la lista acepta lo escrito y el envío lo señala en meta.sin_catalogo.`);
        }
        const libre = wrap.hasAttribute('data-libre') || wrap.hasAttribute('data-sin-catalogo');
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
          const li = k >= 0 ? document.getElementById(`${lista.id}-${k}`) : null;
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
        entrada.addEventListener('input', () => { if (document.activeElement === entrada) pinta(); });
        entrada.addEventListener('click', () => { if (lista.hidden) pinta(); });
        entrada.addEventListener('keydown', (e) => {
          if (e.key === 'ArrowDown') { e.preventDefault(); if (lista.hidden) pinta(); marcaActiva(Math.min(activa + 1, visibles.length - 1)); }
          else if (e.key === 'ArrowUp' && !lista.hidden) { e.preventDefault(); marcaActiva(Math.max(activa - 1, 0)); }
          else if (e.key === 'Home' && !lista.hidden && activa >= 0) { e.preventDefault(); marcaActiva(0); }
          else if (e.key === 'End' && !lista.hidden && activa >= 0) { e.preventDefault(); marcaActiva(visibles.length - 1); }
          else if (e.key === 'Enter' && !lista.hidden) { e.preventDefault(); if (activa >= 0) elige(activa); else cierra(); }
          else if (e.key === 'Escape' && !lista.hidden) { e.preventDefault(); e.stopPropagation(); cierra(); }
        });
        lista.addEventListener('mousedown', (e) => { e.preventDefault(); const li = e.target.closest('[role="option"]'); if (li) elige(Number(li.id.split('-').pop())); });
        entrada.addEventListener('blur', () => {
          cierra();
          const o = libre ? null : opcionDe(wrap, entrada.value);
          if (o && entrada.value !== o.nombre) { entrada.value = o.nombre; entrada.dispatchEvent(new Event('change', { bubbles: true })); }
        });
      }
    }
  });
  function etiquetaDe(el) {
    const e = el.querySelector('.etiqueta');
    if (!e) return el.dataset.campo;
    const c = e.cloneNode(true);
    for (const x of c.querySelectorAll('.marca-oblig,.solo-lector')) x.remove();
    return c.textContent.replace(/\s+/g, ' ').trim();
  }
  function opcionDe(wrap, texto) {
    const n = FormKit.utilidades.normalizaBusqueda(String(texto || '').trim());
    return n ? catalogo(wrap).find((o) => FormKit.utilidades.normalizaBusqueda(o.nombre) === n) || null : null;
  }
  function catalogo(wrap) {
    const cat = (window.FORMKIT_CATALOGOS || {})[wrap.dataset.catalogo];
    FormKit.utilidades.avisaFicticio(wrap.dataset.catalogo, cat);
    const lista = Array.isArray(cat) ? cat : (cat && Array.isArray(cat.filas) ? cat.filas : []);
    const vistos = new Set();
    return lista.map((o) => (typeof o === 'string' ? { nombre: o } : o)).filter((o) => o && o.nombre && !vistos.has(o.nombre) && vistos.add(o.nombre));
  }
}());
/* ../modulos/cascadas/cascadas.js */
(function () {
  'use strict';
  FormKit.registra('cascadas', {
    selector: '[data-cascada]',
    iniciar(form, ctx) {
      const { $, $$, M, plantilla, anuncia, etiquetaDe, limpia, programaBorrador } = ctx;
      for (const cont of $$('[data-cascada]', form)) {
        const cat = (window.FORMKIT_CATALOGOS || {})[cont.dataset.catalogo];
        FormKit.utilidades.avisaFicticio(cont.dataset.catalogo, cat);
        const niveles = $$('[data-nivel]', cont);
        const por = Object.fromEntries(niveles.map((c) => [c.dataset.nivel, c]));
        const campoDe = (c) => c.closest('[data-campo]');
        const manual = $('[data-cascada-manual]', cont);
        const lista = $('[data-cascada-lista]', cont);
        const crudas = cat && (Array.isArray(cat) ? cat : cat.filas);
        const filas = Array.isArray(crudas) ? crudas.filter((f) => f && typeof f === 'object').map((f) => Object.fromEntries(Object.entries(f).map(([k, v]) => [k, v === null || v === undefined ? '' : String(v)]))).filter((f) => (!por.alcaldia || f.alcaldia) && (!por.colonia || f.colonia)) : [];
        if (Array.isArray(crudas) && filas.length < crudas.length) console.warn(`FormKit: el catálogo «${cont.dataset.catalogo}» tiene ${crudas.length - filas.length} fila(s) incompletas; se omitieron.`);
        if (!filas.length) {
          if (lista) lista.hidden = true; else for (const c of niveles) if (c.dataset.nivel !== 'cp') campoDe(c).hidden = true;
          if (manual) manual.hidden = false;
          anuncia(M.cascadaSinCatalogo);
          continue;
        }
        const orden = ['alcaldia', 'colonia', 'cp'].filter((n) => por[n]);
        const primeraDe = new Map(niveles.filter((c) => c.tagName === 'SELECT').map((c) => [c, c.options[0] && c.options[0].value === '' ? c.options[0].textContent.trim() : '']));
        const sel = (c, valores) => {
          if (c.tagName !== 'SELECT') return;
          const actual = c.value;
          c.textContent = '';
          const o0 = document.createElement('option'); o0.value = ''; o0.textContent = primeraDe.get(c) || M.cascadaElige; c.appendChild(o0);
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
          for (const h of orden.slice(i + 1)) { const hijo = por[h]; if (hijo && hijo.value && c.dataset.nivel !== 'cp') { hijo.value = ''; hijo.toggleAttribute('data-vacio', true); limpia(campoDe(hijo).dataset.campo); anuncia(plantilla(M.cascadaReiniciada, { etiqueta: etiquetaDe(campoDe(hijo).dataset.campo), padre: etiquetaDe(campoDe(c).dataset.campo) })); } }
          if (c.dataset.nivel === 'cp') desdeCp(); else pinta(c.dataset.nivel);
          programaBorrador();
        });
        if (por.cp) por.cp.addEventListener('input', () => { if (por.cp.value.length === 5) desdeCp(); });
        pinta();
        ctx.alBorrador({
          restaura: (b) => {
            pinta();
            for (const n of orden) { const c = por[n]; const v = (b.datos || {})[campoDe(c).dataset.campo]; if (c && typeof v === 'string' && c.value !== v) { c.value = v; c.toggleAttribute('data-vacio', !c.value); pinta(n); } }
          }
        });
        if (por.cp && por.colonia) { const campoCp = campoDe(por.cp); if (!campoCp.dataset.cruzada) { campoCp.dataset.cruzada = 'cp-colonia'; campoCp.dataset.cruzadaCampos = `cp=${campoCp.dataset.campo} colonia=${campoDe(por.colonia).dataset.campo}`; campoCp.dataset.catalogo = cont.dataset.catalogo; } }
      }
    }
  });
}());
/* ../modulos/fecha/fecha.js */
(function () {
  'use strict';
  FormKit.registra('fecha', {
    selector: '[data-hoy],[data-ahora],[data-rango],[data-formato="fecha"][data-deriva],[data-formato="fecha-dma"]',
    iniciar(form, ctx) {
      const { $$, cfg, M, plantilla, anuncia, envoltura, controlPrincipal, validaYPinta, programaBorrador } = ctx;
      form.addEventListener('click', (e) => {
        const b = e.target.closest('[data-hoy],[data-ahora],[data-atajo]');
        if (!b || !form.contains(b)) return;
        if (b.hasAttribute('data-atajo')) { aplicaAtajo(b); return; }
        const campo = b.closest('[data-campo]');
        const ctl = campo && controlPrincipal(campo.dataset.campo);
        if (!ctl) return;
        const hoy = campo.dataset.formato === 'fecha-dma' ? cfg.dmaDeIso(cfg.hoyISO()) : cfg.hoyISO();
        ctl.value = b.hasAttribute('data-hoy') ? hoy : cfg.ahoraHM();
        ctl.dispatchEvent(new Event('input', { bubbles: true }));
        ctl.dispatchEvent(new Event('change', { bubbles: true }));
        ctx.estadoDe(campo.dataset.campo).tocado = true;
        validaYPinta(campo.dataset.campo);
        anuncia(`${ctx.etiquetaDe(campo.dataset.campo)}: ${ctx.textoDeValor(campo.dataset.campo)}`);
        programaBorrador();
      });
      for (const b of $$('[data-hoy]', form)) if (!b.textContent.trim()) b.textContent = M.hoy;
      for (const b of $$('[data-ahora]', form)) if (!b.textContent.trim()) b.textContent = M.ahora;
      for (const campo of $$('[data-campo][data-formato="fecha"]', form)) {
        const ctl = controlPrincipal(campo.dataset.campo);
        if (ctl && campo.hasAttribute('data-no-futura') && !ctl.max) { ctl.max = cfg.hoyISO(); ctl.dataset.maxHoy = ''; }
      }
      for (const campo of $$('[data-campo][data-formato="fecha-dma"]', form)) {
        const ctl = controlPrincipal(campo.dataset.campo);
        if (!ctl || ctl.tagName !== 'INPUT') continue;
        ctl.addEventListener('input', (e) => {
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
/* ../modulos/pasos/pasos.js */
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
      function construyeBarra() {
        if (!barra) return;
        barra.textContent = '';
        const nav = document.createElement('nav');
        nav.setAttribute('aria-label', barra.dataset.barra || M.pasosBarra);
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
        lista.addEventListener('click', (e) => { const b = e.target.closest('[data-ir]'); if (b && !enviando) intentaIr(Number(b.dataset.ir)); });
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
      const idHistorial = form.id || 'formkit';
      const esNuestro = (st) => !!st && st.formkitForm === idHistorial && Number.isInteger(st.formkitEntrada) && Number.isInteger(st.formkitPaso);
      const estadoHistorial = (i) => ({ ...(history.state && typeof history.state === 'object' ? history.state : {}), formkitForm: idHistorial, formkitEntrada: entrada, formkitPaso: i });
      let entrada = esNuestro(history.state) ? history.state.formkitEntrada : 0;
      const pasoDeEntrada = new Map();
      if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
      let enviando = false;
      function ir(i, { foco = true, historial = true } = {}) {
        if (historial && i !== actual) { entrada++; pasoDeEntrada.set(entrada, i); history.pushState(estadoHistorial(i), ''); }
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
      function intentaIr(destino, { historial = true } = {}) {
        if (destino === actual) return true;
        if (destino < actual) { ir(destino, { historial }); return true; }
        for (let i = actual; i < destino; i++) {
          const fallos = validaContenedor(pasos[i]);
          if (fallos.length) { conError.add(i); ir(i, { foco: false, historial }); muestraResumen(pasos[i], fallos); pintaBarra(); return false; }
          conError.delete(i);
          hechos.add(i);
        }
        ir(destino, { historial });
        return true;
      }
      window.addEventListener('popstate', (e) => {
        if (!esNuestro(e.state)) return;
        const acuse = document.querySelector('[data-acuse]');
        if (form.hidden && acuse && !acuse.hidden) { history.go(-(e.state.formkitEntrada + 1)); return; }
        if (form.hidden && FormKit.acuse) FormKit.acuse.muestraSolo(form);
        entrada = e.state.formkitEntrada;
        pasoDeEntrada.set(entrada, e.state.formkitPaso);
        if (!intentaIr(Math.min(Math.max(e.state.formkitPaso, 0), pasos.length - 1), { historial: false })) history.replaceState(estadoHistorial(actual), '');
      });
      FormKit.ganchos.validaTodo = (f) => {
        if (f !== form) return null;
        for (let i = 0; i < pasos.length; i++) {
          const fallos = validaContenedor(pasos[i]);
          if (fallos.length) { conError.add(i); ir(i, { foco: false }); muestraResumen(pasos[i], fallos); pintaBarra(); return fallos; }
          conError.delete(i);
        }
        return [];
      };
      FormKit.ganchos.erroresServidor = (f, fallos) => {
        if (f !== form) return false;
        const i = pasos.findIndex((p) => fallos.some((x) => p.contains(envoltura(x.campo))));
        if (i < 0) return false;
        conError.add(i); ir(i, { foco: false }); muestraResumen(pasos[i], fallos.filter((x) => pasos[i].contains(envoltura(x.campo))), 'servidor'); pintaBarra();
        return true;
      };
      FormKit.ganchos.submit = (f, enviar) => { if (f !== form) return false; if (actual < pasos.length - 1) $('[data-accion="siguiente"]', pasos[actual])?.click(); else enviar(); return true; };
      form.addEventListener('click', (e) => {
        const b = e.target.closest('[data-accion="siguiente"],[data-accion="atras"],[data-editar]');
        if (!b || !form.contains(b) || enviando) return;
        if (b.dataset.accion === 'siguiente') intentaIr(actual + 1);
        else if (b.dataset.accion === 'atras') { if (entrada > 0 && pasoDeEntrada.get(entrada - 1) === actual - 1) history.back(); else ir(actual - 1); }
        else if (b.dataset.editar) { const n = b.dataset.editar; const i = pasos.findIndex((p) => p.contains(envoltura(n))); if (i >= 0) { ir(i, { foco: false }); enfocaCampo(n); } }
      });
      form.addEventListener('formkit:enviando', (e) => {
        enviando = e.detail.enviando;
        for (const b of [...$$('[data-accion="atras"]', form), ...(barra ? $$('.pasos-btn', barra) : [])]) { if (enviando) b.setAttribute('aria-disabled', 'true'); else b.removeAttribute('aria-disabled'); }
      });
      form.addEventListener('formkit:muestra', (e) => { const i = pasos.findIndex((p) => p.contains(e.detail.elemento)); if (i >= 0 && i !== actual) ir(i, { foco: false }); });
      if (recordatorio && recordatorio.dataset.recordatorio) {
        const n = recordatorio.dataset.recordatorio;
        const pinta = () => { const t = ctx.textoDeValor(n); recordatorio.hidden = !t || actual === 0; const dest = $('[data-recordatorio-texto]', recordatorio); if (dest) dest.textContent = t; };
        form.addEventListener('formkit:paso', pinta);
        form.addEventListener('change', pinta);
      }
      const pasoValido = (x) => (Number.isInteger(x) && x >= 0 && x < pasos.length ? x : 0);
      ctx.alBorrador({
        estado: () => ({ paso: actual, hechos: [...hechos] }),
        restaura: (b) => { if (Array.isArray(b.hechos)) b.hechos.filter((i) => Number.isInteger(i) && i >= 0 && i < pasos.length).forEach((i) => hechos.add(i)); ir(pasoValido(b.paso), { foco: false }); },
        resumen: () => plantilla(M.borradorRecuperadoPaso, { n: actual + 1, total: pasos.length, titulo: pasos[actual].dataset.titulo }),
        descarta: () => { hechos.clear(); conError.clear(); ir(0, { foco: false }); }
      });
      const fija = barra && barra.closest('.barra-fija');
      if (fija) {
        const mide = () => {
          const s = getComputedStyle(fija);
          const alto = s.position === 'sticky' && !fija.hidden ? fija.getBoundingClientRect().height + (parseFloat(s.marginBottom) || 0) : 0;
          for (const v of ['--alto-barra-fija', '--alto-barra-fija-movil']) document.documentElement.style.setProperty(v, `${Math.ceil(alto)}px`);
        };
        if ('ResizeObserver' in window) new ResizeObserver(mide).observe(fija);
        window.addEventListener('resize', mide);
        mide();
      }
      construyeBarra();
      ir(0, { foco: false, historial: false });
      history.replaceState(estadoHistorial(0), '');
      pasoDeEntrada.set(entrada, 0);
      for (const a of $$('[data-carga-pendiente]')) a.hidden = true;
      FormKit.pasos = { ir: intentaIr, actual: () => actual, total: pasos.length, elementos: pasos };
    }
  });
}());
/* ../modulos/archivos/archivos.js */
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
        textoDe: (el) => (archivosPorCampo.get(el) || []).filter((a) => a.estado !== 'error').map((a) => a.nombre).join(', '),
        enBorrador: false,
        fueraDeDatos: true,
        alArmar: (form, payload) => {
          payload.archivos = [];
          for (const el of form.querySelectorAll('[data-campo]')) {
            const lista = archivosPorCampo.get(el);
            if (lista) for (const a of lista) if (a.estado !== 'error') payload.archivos.push({ campo: el.dataset.campo, nombre: a.nombre, tipo: a.tipo, size: a.size, original: a.original, sha256_original: a.sha256_original, optimizada: !!a.optimizada, dimensiones: a.dimensiones, fecha_captura: a.fecha_captura, lat_captura: a.lat_captura, lon_captura: a.lon_captura, blob: a.blob });
          }
        },
        antesDeEnviar: async (form) => {
          const pendientes = [];
          for (const el of form.querySelectorAll('[data-campo]')) for (const a of archivosPorCampo.get(el) || []) if (a.promesa) pendientes.push({ el, a, promesa: a.promesa });
          for (const x of pendientes) await x.promesa;
          const fallidos = pendientes.filter((x) => x.a.estado === 'error');
          if (fallidos.length) throw Object.assign(new Error('archivos'), { errores: fallidos.map((x) => ({ campo: x.el.dataset.campo, mensaje: FormKit.config.plantilla(FormKit.config.mensajes.archFalloAlEnviar, { nombre: x.a.nombre, motivo: x.a.motivo }) })) });
        }
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
      const pesoSobre = (bytes, mb) => (pesoTxt(bytes) === pesoTxt(mb * BYTES_POR_MB) ? plantilla(M.archMasDe, { mb }) : pesoTxt(bytes));
      const formatosTxt = (c) => cfg.formatosArchivo(c.extensiones);
      const saneaNombre = (n) => {
        const limpio = String(n || 'archivo').split(/[\\/]/).pop().replace(/[\u0000-\u001F\u007F-\u009F\u200B-\u200F\u202A-\u202E\u2060-\u2064\u2066-\u2069\uFEFF]/g, '').replace(/\s+/g, ' ').trim() || 'archivo';
        if (limpio.length <= A.nombreMax) return limpio;
        const e = limpio.match(/\.[A-Za-z0-9]{1,10}$/);
        return e ? `${limpio.slice(0, A.nombreMax - e[0].length)}${e[0]}` : limpio.slice(0, A.nombreMax);
      };
      const hexDe = (buf) => Array.from(new Uint8Array(buf), (x) => x.toString(16).padStart(2, '0')).join('');
      const huellaDe = (buf) => ((window.crypto && crypto.subtle && crypto.subtle.digest) ? crypto.subtle.digest('SHA-256', buf).then(hexDe, () => '') : Promise.resolve(''));
      function firmaCoincide(buf, extension) {
        const firmas = A.firmas[extension];
        if (!firmas) return true; /* sin firma conocida no se rechaza: lo decide el servidor */
        const b = new Uint8Array(buf.slice(0, 12));
        if (extension === 'heic') return b.length > 8 && String.fromCharCode(b[4], b[5], b[6], b[7]) === 'ftyp';
        if (extension === 'webp') return b.length >= 12 && String.fromCharCode(...b.slice(0, 4)) === 'RIFF' && String.fromCharCode(...b.slice(8, 12)) === 'WEBP';
        return firmas.some((f) => f.every((x, i) => b[i] === x));
      }
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
          if (a.sha256_original && lista.some((x) => x !== a && x.estado !== 'error' && x.sha256_original === a.sha256_original)) throw Object.assign(new Error('duplicado'), { motivo: M.archRechazoDuplicado });
          const esFoto = A.optimiza.tipos.includes(e);
          if (esFoto) {
            const meta = ['jpg', 'jpeg'].includes(e) ? leeExif(buf) : {};
            if (c.conservarExif) { if (meta.fecha) a.fecha_captura = meta.fecha; if (meta.lat !== undefined) { a.lat_captura = meta.lat; a.lon_captura = meta.lon; } }
            const opt = await optimizaFoto(f).catch(() => null);
            if (opt && (opt.origen.ancho < A.imagen.anchoMin || opt.origen.alto < A.imagen.altoMin)) throw Object.assign(new Error('dimension'), { motivo: plantilla(M.archRechazoDimension, { ancho: A.imagen.anchoMin, alto: A.imagen.altoMin }) });
            if (opt && (opt.blob.size < f.size || !c.conservarExif)) { a.blob = opt.blob; a.size = opt.blob.size; a.tipo = 'image/jpeg'; a.optimizada = opt.blob.size < f.size; a.dimensiones = `${opt.ancho}x${opt.alto}`; if (!['jpg', 'jpeg'].includes(e)) a.nombre = `${a.nombre.replace(/\.[^.]*$/, '')}.jpg`; }
            else if (!c.conservarExif) {
              const limpio = ['jpg', 'jpeg'].includes(e) ? sinExif(buf) : null;
              a.blob = limpio || f; a.size = a.blob.size; a.optimizada = false;
            } else { a.blob = f; a.optimizada = false; }
            a.vista = URL.createObjectURL(a.blob);
          } else a.blob = f;
          if (a.size > c.mb * BYTES_POR_MB) throw Object.assign(new Error('peso'), { motivo: plantilla(a.optimizada ? M.archRechazoOptimizada : M.archRechazoPeso, { peso: pesoSobre(a.size, c.mb), mb: c.mb }) });
          const total = lista.filter((x) => x === a || x.estado === 'listo').reduce((s, x) => s + (x.size || 0), 0);
          if (total > c.mbTotal * BYTES_POR_MB) throw Object.assign(new Error('total'), { motivo: plantilla(M.archRechazoTotal, { mb: c.mbTotal }) });
          a.estado = 'listo';
          anuncia(plantilla(M.archAgregado, { nombre: a.nombre }));
        }).catch((err) => {
          a.estado = 'error';
          a.codigo = err.message;
          a.motivo = err.motivo || M.archRechazoProceso;
          a.archivoOriginal = f;
        }).then(() => {
          delete a.promesa;
          if (!lista.includes(a)) { if (a.vista) URL.revokeObjectURL(a.vista); return; }
          pinta(el);
          if (a.estado === 'listo') { limpia(el.dataset.campo); programaBorrador(); }
        });
      }
      function agrega(archivos, el) {
        const c = configDe(el);
        const lista = archivosPorCampo.get(el);
        const rechazos = [];
        for (const f of archivos) {
          const nombre = saneaNombre(f.name);
          if (lista.filter((x) => x.estado !== 'error').length >= c.max) { rechazos.push({ nombre, motivo: plantilla(c.max === 1 ? M.archRechazoMaxUno : M.archRechazoMax, { max: c.max }) }); continue; }
          const admite = c.extensiones.includes(ext(f.name)) || (['jpg', 'jpeg'].includes(ext(f.name)) && c.extensiones.some((x) => A.optimiza.tipos.includes(x)));
          if (!admite) { rechazos.push({ nombre, motivo: plantilla(M.archRechazoTipo, { formatos: formatosTxt(c) }) }); continue; }
          if (f.size < A.minBytes) { rechazos.push({ nombre, motivo: M.archRechazoVacio }); continue; }
          const esFoto = A.optimiza.tipos.includes(ext(f.name));
          if (!esFoto && f.size > c.mb * BYTES_POR_MB) { rechazos.push({ nombre, motivo: plantilla(M.archRechazoPeso, { peso: pesoSobre(f.size, c.mb), mb: c.mb }) }); continue; }
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
        if (rechazos.length) dest.setAttribute('role', 'alert');
        for (const r of rechazos) {
          const d = document.createElement('p');
          d.className = 'arch-rechazo';
          const t = document.createElement('strong'); t.textContent = plantilla(M.archRechazoTitulo, { nombre: r.nombre });
          d.append(icono('error', 'icono icono-sm'), t, document.createTextNode(` ${r.motivo}`));
          dest.appendChild(d);
        }
      }
      function pinta(el) {
        const ul = $('.lista-arch', el);
        const lista = archivosPorCampo.get(el);
        const conFocoEn = ul.contains(document.activeElement) ? (document.activeElement.dataset.quitar !== undefined ? `[data-quitar="${document.activeElement.dataset.quitar}"]` : document.activeElement.dataset.reintentar !== undefined ? `[data-reintentar="${document.activeElement.dataset.reintentar}"]` : null) : null;
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
          if (a.estado === 'error' && a.archivoOriginal && !['firma', 'duplicado', 'dimension', 'peso', 'total'].includes(a.codigo)) {
            const r = document.createElement('button'); r.type = 'button'; r.className = 'btn-enlace'; r.dataset.reintentar = String(i); r.textContent = M.archReintentar; li.appendChild(r);
          }
          const q = document.createElement('button'); q.type = 'button'; q.className = 'btn-icono arch-quitar'; q.dataset.quitar = String(i);
          q.setAttribute('aria-label', plantilla(M.archQuitar, { nombre: a.nombre }));
          q.appendChild(icono('cerrar'));
          li.appendChild(q);
          ul.appendChild(li);
        });
        if (conFocoEn) { const b = $(conFocoEn, ul) || $(`[data-quitar="${conFocoEn.match(/\d+/)[0]}"]`, ul); if (b) b.focus(); }
        const cont = $('[data-archivos]', el);
        const c = configDe(el);
        const lleno = lista.filter((x) => x.estado !== 'error').length >= c.max;
        if (cont && cont.hasAttribute('data-lleno') !== lleno) {
          const conFoco = cont.contains(document.activeElement) && document.activeElement.matches('.zona-carga,[data-camara]');
          cont.toggleAttribute('data-lleno', lleno);
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
      const traeArchivos = (e) => !!e.dataTransfer && [...(e.dataTransfer.types || [])].includes('Files');
      window.addEventListener('dragover', (e) => { if (traeArchivos(e) && (!e.target.closest || !e.target.closest('.zona-carga'))) e.preventDefault(); });
      window.addEventListener('drop', (e) => { if (traeArchivos(e) && (!e.target.closest || !e.target.closest('.zona-carga'))) e.preventDefault(); });
      if (!(window.crypto && crypto.subtle)) console.warn('FormKit: sin https no se calcula la huella SHA-256 de los archivos ni se detectan duplicados.');
      const camposArchivo = () => $$('[data-archivos]', form).map((c) => c.closest('[data-campo]'));
      const conProveedor = (fn) => { const p = ctx.opciones.borradorArchivos; if (!p) return; for (const el of camposArchivo()) Promise.resolve().then(() => fn(p, el)).catch(() => { /* un proveedor que falla no detiene el formulario */ }); };
      const paraProveedor = (a, c) => {
        if (c.conservarExif || !a.blob || a.blob === a.fuente) return a.fuente;
        const nombre = a.tipo === 'image/jpeg' && !/\.jpe?g$/i.test(a.nombre) ? `${a.nombre.replace(/\.[^.]*$/, '')}.jpg` : a.nombre;
        return new File([a.blob], nombre, { type: a.tipo || a.blob.type });
      };
      ctx.alBorrador({
        escribe: () => conProveedor((p, el) => p.guarda && p.guarda(el.dataset.campo, (archivosPorCampo.get(el) || []).filter((a) => a.estado === 'listo' && a.fuente).map((a) => paraProveedor(a, configDe(el))))),
        restaura: () => conProveedor((p, el) => p.lee && Promise.resolve().then(() => p.lee(el.dataset.campo)).then((archivos) => { if (archivos && archivos.length) agrega(Array.from(archivos), el); }, () => FormKit.aviso($('[data-rechazos]', el) || el, { tono: 'advertencia', texto: M.archProveedorFallo }))),
        estado: () => {
          if (ctx.opciones.borradorArchivos) return {};
          const cuantos = {};
          for (const el of camposArchivo()) { const n = (archivosPorCampo.get(el) || []).filter((a) => a.estado === 'listo').length; if (n) cuantos[el.dataset.campo] = n; }
          return Object.keys(cuantos).length ? { archivosSinGuardar: cuantos } : {};
        },
        resumen: (b) => {
          const campos = b && b.archivosSinGuardar && typeof b.archivosSinGuardar === 'object' && !ctx.opciones.borradorArchivos ? Object.keys(b.archivosSinGuardar).filter((n) => ctx.envoltura(n)) : [];
          return campos.length ? plantilla(M.borradorArchivosFalta, { campos: campos.map(ctx.etiquetaDe).join('», «') }) : '';
        },
        borra: () => conProveedor((p, el) => p.borra && p.borra(el.dataset.campo))
      });
      FormKit.archivos = { de: (el) => archivosPorCampo.get(el) || [], agrega };
    }
  });
}());
/* ../modulos/mapa/mapa.js */
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
        textoDe: (el) => { const s = estadoDe.get(el); if (!s || !s.punto) return ''; const t = `${s.punto.lat.toFixed(5)}, ${s.punto.lon.toFixed(5)}`; return s.exigeConfirmar && !s.confirmado ? `${t} · ${FormKit.config.mensajes.mapaSinConfirmar}` : t; },
        enBorrador: true,
        restaura: (el, v) => {
          const s = estadoDe.get(el);
          if (!s || !v || !/^-?[\d.]+,-?[\d.]+$/.test(v)) return;
          const [lat, lon] = v.split(',').map(Number);
          if (s.coloca) { s.coloca({ lat, lon }, true); if (s.exigeConfirmar && s.confirma) s.confirma(true); }
          else { s.punto = { lat, lon }; s.confirmado = true; }
        },
        valida: (el) => { const s = estadoDe.get(el); return s && s.fuera ? FormKit.config.ambito.coordenadas.mensaje : ''; },
        alArmar: (form, payload) => { for (const el of form.querySelectorAll('[data-campo]')) { const s = estadoDe.get(el); if (s && s.punto && payload.datos[el.dataset.campo]) payload.datos[el.dataset.campo] = { type: 'Point', coordinates: [Number(s.punto.lon.toFixed(6)), Number(s.punto.lat.toFixed(6))] }; } }
      }
    },
    iniciar(form, ctx) {
      const { $, $$, cfg, M, plantilla, anuncia, limpia, marca, programaBorrador } = ctx;
      const L = window.L;
      const conf = Object.assign({ teselas: '', atribucion: '', zoom: 11, centro: [19.4326, -99.1332], gestos: '', aproximadaM: 100 }, (window.FORMKIT_CONFIG || {}).mapa || {});
      const bbox = cfg.ambito.coordenadas;
      const gestos = new Promise((listo) => {
        if (!L || window.leafletGestureHandling || !conf.gestos) { listo(); return; }
        const s = document.createElement('script');
        s.src = conf.gestos;
        s.addEventListener('load', listo);
        s.addEventListener('error', () => { console.warn(`FormKit: no se pudo cargar el complemento de gestos del mapa desde ${conf.gestos}.`); listo(); });
        document.head.appendChild(s);
      });
      for (const cont of $$('[data-mapa]', form)) {
        const el = cont.closest('[data-campo]');
        const salida = $('[data-mapa-coords]', el);
        const sin = $('[data-mapa-sin]', el);
        const btnConfirmar = $('[data-mapa-confirmar]', el);
        const btnGeo = $('[data-mapa-geolocalizar]', el);
        const inLat = $('[data-mapa-lat]', el), inLon = $('[data-mapa-lon]', el);
        let geoAviso = null;
        const s = { punto: null, confirmado: false, fuera: false, exigeConfirmar: cont.hasAttribute('data-confirmar') };
        estadoDe.set(el, s);
        if (!L) { if (sin) sin.hidden = false; cont.hidden = true; continue; }
        const mapa = L.map(cont, { center: conf.centro, zoom: conf.zoom, gestureHandling: true, gestureHandlingOptions: { text: { touch: M.mapaGestoTactil, scroll: M.mapaGestoRueda, scrollMac: M.mapaGestoRuedaMac } }, zoomControl: false, attributionControl: !!conf.atribucion, tap: true });
        L.control.zoom({ zoomInTitle: M.mapaAcercar, zoomOutTitle: M.mapaAlejar }).addTo(mapa);
        gestos.then(() => {
          const G = window.leafletGestureHandling;
          if (!mapa.gestureHandling && G && G.GestureHandling) mapa.addHandler('gestureHandling', G.GestureHandling);
          if (mapa.gestureHandling && !mapa.gestureHandling.enabled()) mapa.gestureHandling.enable();
        });
        const limites = bbox ? L.latLngBounds([bbox.latMin, bbox.lonMin], [bbox.latMax, bbox.lonMax]) : null;
        const encuadra = () => { mapa.invalidateSize(); if (s.punto) mapa.setView([s.punto.lat, s.punto.lon], Math.max(mapa.getZoom(), 14)); else if (limites) mapa.fitBounds(limites); };
        if (limites) { mapa.setMaxBounds(limites.pad(0.1)); mapa.fitBounds(limites); }
        if (conf.teselas) L.tileLayer(conf.teselas, { attribution: conf.atribucion, maxZoom: 19 }).on('tileerror', () => { if (sin) sin.hidden = false; }).addTo(mapa);
        else if (sin) { sin.hidden = false; sin.textContent = M.mapaSinBase; }
        const icono = L.divIcon({ className: 'mapa-marcador', html: '<svg viewBox="0 0 24 24" width="32" height="32" aria-hidden="true" focusable="false"><path d="M12 22s-7-7.3-7-12.5a7 7 0 0 1 14 0C19 14.7 12 22 12 22z" fill="currentColor"/><circle cx="12" cy="9.5" r="2.6" fill="#fff"/></svg>', iconSize: [32, 32], iconAnchor: [16, 32] });
        let marcador = null;
        s.coloca = (p, silencioso = false) => {
          s.punto = p; s.confirmado = false;
          if (marcador) marcador.setLatLng([p.lat, p.lon]); else { marcador = L.marker([p.lat, p.lon], { icon: icono, draggable: true, keyboard: true, title: M.mapaMarcador }).addTo(mapa); marcador.on('dragend', () => { const ll = marcador.getLatLng(); s.coloca({ lat: ll.lat, lon: ll.lng }); }); }
          s.fuera = !!bbox && (p.lat < bbox.latMin || p.lat > bbox.latMax || p.lon < bbox.lonMin || p.lon > bbox.lonMax);
          if (inLat) inLat.value = p.lat.toFixed(6); if (inLon) inLon.value = p.lon.toFixed(6);
          const texto = plantilla(M.mapaPunto, { lat: p.lat.toFixed(5), lon: p.lon.toFixed(5) });
          if (salida) salida.textContent = s.fuera ? `${texto} ${M.mapaFuera}` : texto;
          if (geoAviso) geoAviso.hidden = true;
          if (btnConfirmar) { btnConfirmar.hidden = !s.exigeConfirmar || s.fuera; btnConfirmar.textContent = M.mapaConfirmar; btnConfirmar.removeAttribute('aria-pressed'); }
          if (s.fuera) marca(el.dataset.campo, bbox.mensaje); else limpia(el.dataset.campo);
          if (!silencioso) anuncia(salida ? salida.textContent : texto);
          programaBorrador();
        };
        mapa.on('click', (e) => s.coloca({ lat: e.latlng.lat, lon: e.latlng.lng }));
        cont.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.target.closest('.leaflet-control, a, button')) { const c = mapa.getCenter(); s.coloca({ lat: c.lat, lon: c.lng }); } });
        const avisoGeo = () => {
          if (!geoAviso) { geoAviso = document.createElement('p'); geoAviso.className = 'ayuda mapa-geo-aviso'; (salida || btnGeo).after(geoAviso); }
          return geoAviso;
        };
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
          btnGeo.addEventListener('click', () => {
            btnGeo.setAttribute('aria-busy', 'true');
            navigator.geolocation.getCurrentPosition((pos) => {
              btnGeo.removeAttribute('aria-busy');
              s.coloca({ lat: pos.coords.latitude, lon: pos.coords.longitude });
              mapa.setView([pos.coords.latitude, pos.coords.longitude], 16);
              if (pos.coords.accuracy > conf.aproximadaM) anuncia(plantilla(M.mapaAproximada, { metros: Math.round(pos.coords.accuracy) }), { visible: avisoGeo() });
            }, () => { btnGeo.removeAttribute('aria-busy'); anuncia(M.mapaSinUbicacion, { cortes: true, visible: avisoGeo() }); }, { timeout: 10000 });
          });
        }
        const manual = $$('[data-formato="coordenadas"] input', form)[0];
        if (manual) manual.addEventListener('change', () => { const m = cfg.formatos.coordenadas.normaliza(manual.value).match(/^(-?[\d.]+),(-?[\d.]+)$/); if (m) { s.coloca({ lat: Number(m[1]), lon: Number(m[2]) }); mapa.setView([Number(m[1]), Number(m[2])], 16); } });
        form.addEventListener('formkit:paso', () => setTimeout(encuadra, 50));
        window.addEventListener('resize', () => mapa.invalidateSize());
        s.mapa = mapa;
      }
      FormKit.mapa = { estadoDe: (el) => estadoDe.get(el) };
    }
  });
}());
/* ../modulos/enlace-mapa/enlace-mapa.js */
(function () {
  'use strict';
  const NUM = '(-?\\d{1,3}(?:\\.\\d+)?)';
  const numero = (t) => { const n = Number(String(t).replace(',', '.')); return Number.isFinite(n) ? n : NaN; };
  function par(a, b, origen) {
    let lat = numero(a), lon = numero(b);
    if (Number.isNaN(lat) || Number.isNaN(lon)) return null;
    const notas = [];
    if (Math.abs(lat) > 90 && Math.abs(lon) <= 90) { [lat, lon] = [lon, lat]; notas.push('orden'); } // longitud primero
    if (lat >= 19.0 && lat <= 19.6 && lon >= 98.9 && lon <= 99.4) { lon = -lon; notas.push('menos'); } // longitud de la Ciudad sin signo
    if (Math.abs(lat) > 90 || Math.abs(lon) > 180) return null;
    return { lat, lon, origen, notas };
  }
  function lee(texto) {
    let s = String(texto == null ? '' : texto).trim();
    if (s.length < 5) return null;
    try { s = decodeURIComponent(s.replace(/\+/g, ' ')); } catch (e) { /* se deja como venía */ }
    s = s.replace(/[−‒–—]/g, '-');
    if (/(maps\.app\.goo\.gl|goo\.gl\/maps|g\.co\/kgs)\//i.test(s)) return { corto: true };
    const pins = [...s.matchAll(new RegExp(`!3d${NUM}!4d${NUM}`, 'g'))];
    if (pins.length) { const p = pins[pins.length - 1]; return par(p[1], p[2], 'pin'); }
    let m = s.match(new RegExp(`[?&](?:q|query|ll|destination|daddr)=\\s*${NUM}\\s*,\\s*${NUM}(?![\\d.])`, 'i'))
         || s.match(new RegExp(`\\/(?:place|search)\\/\\s*${NUM}\\s*,\\s*${NUM}(?![\\d.])`, 'i'));
    if (m) return par(m[1], m[2], 'pin');
    m = s.match(new RegExp(`@${NUM},${NUM}(?![\\d.])`)) || s.match(new RegExp(`[?&](?:center|sll)=${NUM},${NUM}(?![\\d.])`, 'i'));
    if (m) return par(m[1], m[2], 'centro');
    m = s.match(new RegExp(`^geo:${NUM},${NUM}`, 'i'));
    if (m) return par(m[1], m[2], 'texto');
    const g = [...s.matchAll(/(\d+(?:\.\d+)?)\s*°\s*(?:(\d+(?:\.\d+)?)\s*['′’]\s*)?(?:(\d+(?:\.\d+)?)\s*(?:["″”]|'')\s*)?([NSEOW])/gi)];
    if (g.length === 2) {
      const v = (x) => (Number(x[1]) + (Number(x[2]) || 0) / 60 + (Number(x[3]) || 0) / 3600) * (/[SWO]/i.test(x[4]) ? -1 : 1);
      const esLat = (x) => /[NS]/i.test(x[4]);
      if (esLat(g[0]) !== esLat(g[1])) return esLat(g[0]) ? par(v(g[0]), v(g[1]), 'texto') : par(v(g[1]), v(g[0]), 'texto');
    }
    if (s.length > 80) return null;
    m = s.match(/^\(?\s*(-?\d{1,3}[.,]\d+)(?:\s*[,;]\s*|\s+)(-?\d{1,3}[.,]\d+)\s*\)?$/);
    return m ? par(m[1], m[2], 'texto') : null;
  }
  const fmt = (r) => `${r.lat.toFixed(6)}, ${r.lon.toFixed(6)}`;
  FormKit.leeCoordenadas = lee;
  FormKit.registra('enlace-mapa', {
    selector: '[data-enlace-mapa]',
    iniciar(form, ctx) {
      const { $$, M, plantilla, anuncia, controlPrincipal } = ctx;
      for (const caja of $$('[data-enlace-mapa]', form)) {
        const destino = controlPrincipal(caja.dataset.enlaceMapa);
        const entrada = caja.querySelector('input');
        const estado = caja.querySelector('[data-enlace-mapa-estado]');
        if (!destino || !entrada) continue;
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
        entrada.addEventListener('paste', () => setTimeout(desdeEnlace, 0));
        destino.addEventListener('change', () => {
          const r = lee(destino.value);
          if (!r || r.corto) return;
          const nuevo = fmt(r);
          if (destino.value.replace(/\s/g, '') === nuevo.replace(/\s/g, '')) return;
          destino.value = nuevo;
          destino.dispatchEvent(new Event('input', { bubbles: true }));
          destino.dispatchEvent(new Event('change', { bubbles: true }));
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
/* ../modulos/revision/revision.js */
(function () {
  'use strict';
  FormKit.registra('revision', {
    selector: '[data-revision]',
    iniciar(form, ctx) {
      const { $, $$, M, envoltura, etiquetaDe, textoDeValor, activo, icono, idUnico } = ctx;
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
          const bloque = document.createElement('section');
          bloque.className = 'rev-bloque';
          const cab = document.createElement('div');
          cab.className = 'rev-titulo';
          const rot = document.createElement('h3'); rot.className = 'rev-rotulo'; rot.id = idUnico('rev'); rot.textContent = p.dataset.titulo;
          bloque.setAttribute('aria-labelledby', rot.id);
          const ed = document.createElement('button');
          ed.type = 'button'; ed.className = 'btn-enlace'; ed.dataset.editar = nombres[0];
          ed.append(icono('editar', 'icono icono-sm'), document.createTextNode(M.editar));
          const oculto = document.createElement('span'); oculto.className = 'solo-lector'; oculto.textContent = ` ${p.dataset.titulo}`;
          ed.appendChild(oculto);
          cab.append(rot, ed);
          const dl = document.createElement('dl');
          dl.className = 'rev-datos';
          for (const n of nombres) {
            const dt = document.createElement('dt'); dt.className = 'rev-dato-etq'; dt.textContent = etiquetaDe(n);
            const dd = document.createElement('dd'); dd.className = 'rev-dato-valor'; dd.textContent = texto(n) || M.sinValor;
            dl.append(dt, dd);
          }
          bloque.append(cab, dl);
          dest.appendChild(bloque);
        });
      }
      form.addEventListener('formkit:paso', (e) => { if (e.detail.paso === sec) pinta(); });
      FormKit.revision = { pinta };
    }
  });
}());
/* ../modulos/acuse/acuse.js */
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
        const fechaTexto = FormKit.utilidades.fechaHora(fechaValida, cfg);
        const fecha = $('[data-acuse-fecha]', sec);
        if (fecha) fecha.textContent = fechaTexto;
        const compartir = $('[data-compartir]', sec);
        if (compartir) {
          if (compartir.dataset.compartirPlantilla === undefined) compartir.dataset.compartirPlantilla = compartir.dataset.compartirTexto || M.acuseCompartir;
          const p = compartir.dataset.compartirPlantilla;
          compartir.dataset.compartirTexto = FormKit.utilidades.plantilla(/\{folio\}/.test(p) ? p : `${p}: {folio}`, { folio: r.folio || '', fecha: fechaTexto });
          compartir.dataset.compartirUrl = '';
          compartir.hidden = !r.folio;
        }
        const desc = $('[data-acuse-descarga]', sec);
        if (desc) {
          desc.hidden = !r.acuseUrl;
          if (r.acuseUrl) { desc.href = r.acuseUrl; desc.download = r.acuseNombre || `acuse-${r.folio || ''}.pdf`; if (r.acusePeso) { const peso = $('[data-acuse-peso]', desc); if (peso) peso.textContent = r.acusePeso; } }
        }
        if (clave && !recuperado) almacen.escribe(clave, JSON.stringify({ folio: r.folio || '', fecha: fechaValida, t: Date.now() }));
        muestraSolo(sec);
      }
      const dePagina = (k) => (ctx.opcionesPagina || {})[k];
      opciones.alEnviar = (r, f) => { const previo = dePagina('alEnviar'); if (previo) previo(r, f); pinta(r); };
      opciones.alFallar = (e, f) => { const previo = dePagina('alFallar'); if (previo) previo(e, f); if (e && e.limite && limite) muestraSolo(limite); };
      if (limite) limite.addEventListener('click', (e) => { if (e.target.closest('[data-accion="reintentar"]')) muestraSolo(form); });
      sec.addEventListener('click', (e) => { if (!e.target.closest('[data-acuse-nuevo]')) return; if (clave) almacen.borra(clave); location.reload(); });
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
/* ../modulos/modal/modal.js */
(function () {
  'use strict';
  function abre(d) { if (d.showModal) d.showModal(); else d.setAttribute('open', ''); }
  function cierra(d) { if (d.close) d.close(); else d.removeAttribute('open'); }
  FormKit.registra('modal', {
    selector: '[data-abre-dialogo],dialog',
    fueraDelFormulario: true,
    iniciar() {
      if (document.documentElement.dataset.modalListo !== undefined) return;
      document.documentElement.dataset.modalListo = '';
      document.addEventListener('click', (e) => {
        const ab = e.target.closest('[data-abre-dialogo]');
        if (ab) { const d = document.getElementById(ab.dataset.abreDialogo); if (d) abre(d); return; }
        const ce = e.target.closest('[data-cierra-dialogo]');
        if (ce) { const d = ce.closest('dialog'); if (d) cierra(d); }
      });
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
      if (!cfg.si || /^(aceptar|confirmar|s[ií]|ok|de acuerdo|continuar|listo)$/i.test(String(cfg.si).trim())) console.warn(`FormKit.confirma: «si» debe repetir el verbo de la acción («Rechazar solicitud»), no «${String(cfg.si || M.confirmaSi).trim()}».`);
      acc.append(no, si);
      d.append(h, desc, acc);
      document.body.appendChild(d);
      const termina = (ok) => { cierra(d); d.remove(); if (ancla && ancla.focus) ancla.focus(); resolve(ok); };
      d.addEventListener('click', (e) => { const b = e.target.closest('[data-r]'); if (b) termina(b.dataset.r === 'si'); });
      d.addEventListener('cancel', (e) => { e.preventDefault(); termina(false); });
      abre(d);
      no.focus();
      FormKit.anuncia(`${h.textContent} ${desc.textContent}`, true);
    });
  };
}());
/* ../modulos/copiar/copiar.js */
(function () {
  'use strict';
  FormKit.registra('copiar', {
    selector: '[data-copiar],[data-compartir],[data-copiable]',
    fueraDelFormulario: true,
    iniciar(form, ctx) {
      const { $$, M, anuncia, icono } = ctx;
      for (const campo of $$('[data-copiable]', form)) {
        const ctl = campo.querySelector('input[readonly],textarea[readonly]');
        if (!ctl || campo.querySelector('[data-copiar]')) continue;
        ctl.id = ctl.id || FormKit.utilidades.idUnico('copiable');
        const grupo = document.createElement('div'); grupo.className = 'copiar-grupo';
        ctl.parentNode.insertBefore(grupo, ctl); grupo.appendChild(ctl);
        const b = document.createElement('button'); b.type = 'button'; b.className = 'btn btn-secundario copiar-btn'; b.dataset.copiar = `#${ctl.id}`;
        b.append(icono('copiar'), document.createTextNode(M.copiarTexto));
        grupo.appendChild(b);
      }
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
          const url = sh.dataset.compartirUrl !== undefined ? sh.dataset.compartirUrl : location.href;
          const datos = { title: sh.dataset.compartirTitulo || document.title, text: sh.dataset.compartirTexto || '', ...(url ? { url } : {}) };
          if (navigator.share) { try { await navigator.share(datos); confirma(sh, M.compartido, true); } catch (err) { /* la persona canceló */ } }
          else { const ok = await copia([datos.text, datos.url].filter(Boolean).join(' ')); confirma(sh, `${M.compartirFallo} ${ok ? M.copiado : M.copiarFallo}`, ok); }
        }
      });
      async function copia(texto, origen) {
        try { await navigator.clipboard.writeText(texto); return true; }
        catch (err) {
          if (origen && origen.select) { origen.select(); try { return document.execCommand('copy'); } catch (e2) { return false; } }
          return false;
        }
      }
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
/* ../modulos/descarga/descarga.js */
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
        if (b.target === '_blank' && !b.querySelector('[data-nueva-pestana]')) { const s = document.createElement('span'); s.className = 'solo-lector'; s.dataset.nuevaPestana = ''; s.textContent = ` ${FormKit.config.mensajes.enlaceNuevaPestana}`; b.appendChild(s); }
      }
      function pintaDetalle(b) {
        const partes = [b.dataset.formato, b.dataset.peso].filter(Boolean);
        let det = b.querySelector('.descarga-detalle');
        if (!partes.length) return;
        if (!det) { det = document.createElement('span'); det.className = 'descarga-detalle'; b.appendChild(det); }
        det.textContent = ` (${partes.join(', ')})`;
      }
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
