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
  const sinAcentos = (v) => String(v ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '');
  const esFechaReal = (a, m, d) => { const f = new Date(Date.UTC(a, m - 1, d)); return f.getUTCFullYear() === a && f.getUTCMonth() === m - 1 && f.getUTCDate() === d; };
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
    sexos: ['H', 'M', 'X'],
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

  /* ---------- Formatos por tipo de dato ---------- */
  const FORMATOS = {
    nombre: {
      descripcion: 'Nombre o apellido de persona',
      inputmode: 'text', autocomplete: 'given-name',
      normaliza: (v) => recorta(v),
      valida: (v, a = {}) => {
        if (!/^[\p{L}\p{M}' .\-]+$/u.test(v)) return 'Escribe sólo letras, espacios, apóstrofe, guion o punto. Ejemplo: María José';
        if (v.length > (a.maxlength || 80)) return `El nombre es demasiado largo: usa hasta ${a.maxlength || 80} caracteres.`;
        return '';
      }
    },
    correo: {
      descripcion: 'Correo electrónico',
      inputmode: 'email', autocomplete: 'email',
      dominiosFrecuentes: ['gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com', 'icloud.com', 'live.com.mx', 'hotmail.es'],
      normaliza: (v) => recorta(v).toLowerCase().replace(/\s/g, ''),
      valida: (v, a = {}) => {
        if (v.length > (a.maxlength || 120)) return `El correo es demasiado largo: usa hasta ${a.maxlength || 120} caracteres.`;
        const partes = v.split('@');
        if (partes.length !== 2 || !partes[0] || !partes[1]) return 'El correo necesita una sola arroba, con texto antes y después. Ejemplo: nombre@dominio.mx';
        if (!/^[^\s@]+\.[^\s@.]{2,}$/.test(partes[1])) return 'Revisa el dominio después de la arroba: debe llevar un punto. Ejemplo: nombre@dominio.mx';
        return '';
      },
      /* Sugerencia sin bloqueo para errores de dedo frecuentes («gmial.com»). */
      sugiere: (v) => {
        const dom = (v.split('@')[1] || '').toLowerCase();
        if (!dom || FORMATOS.correo.dominiosFrecuentes.includes(dom)) return '';
        const cerca = FORMATOS.correo.dominiosFrecuentes.find((d) => distancia(d, dom) === 1);
        return cerca ? `¿Quisiste escribir ${v.split('@')[0]}@${cerca}?` : '';
      }
    },
    telefono: {
      descripcion: 'Teléfono de México: diez dígitos',
      inputmode: 'tel', autocomplete: 'tel-national',
      /* Se aceptan espacios, guiones y paréntesis al escribir; un prefijo
         +52 o 52 se retira. La regla de diez dígitos es la de México y debe
         confirmarse con el plan de numeración vigente [Fuente: __]. */
      normaliza: (v) => { let d = soloDigitos(String(v).replace(/^\s*\+?52\s*/, '')); if (d.length === 12 && d.startsWith('52')) d = d.slice(2); return d; },
      valida: (v) => (/^\d{10}$/.test(v) ? '' : 'Escribe 10 dígitos, sin lada internacional. Ejemplo: 5512345678')
    },
    cp: {
      descripcion: 'Código postal: cinco dígitos, se conserva como texto',
      inputmode: 'numeric', autocomplete: 'postal-code',
      normaliza: (v) => soloDigitos(v),
      /* Con data-ambito="nacional" en el campo se acepta cualquier código del
         país (domicilio fuera de la Ciudad); si no, sólo los del ámbito. */
      valida: (v, a = {}) => {
        if (!/^\d{5}$/.test(v)) return 'El código postal lleva 5 dígitos. Ejemplo: 01000';
        const am = a.ambito === 'nacional' ? null : CONFIG.ambito.cp;
        if (am && (v < am.min || v > am.max)) return am.mensaje;
        return '';
      }
    },
    curp: {
      descripcion: 'CURP: 18 caracteres',
      inputmode: 'text', autocomplete: 'off',
      normaliza: (v) => sinAcentos(recorta(v)).toUpperCase().replace(/\s/g, ''),
      valida: (v) => {
        if (v.length !== CURP.largo) return `La CURP tiene ${CURP.largo} caracteres; escribiste ${v.length}.`;
        if (!CURP.re.test(v)) return 'La CURP no tiene la estructura esperada. Revísala tal como aparece en tu documento.';
        if (!fechaDeCurp(v)) return 'La fecha dentro de la CURP (posiciones 5 a 10) no es una fecha real. Revísala.';
        if (fechaDeCurp(v) > hoyISO()) return 'La fecha de nacimiento dentro de la CURP está en el futuro. Revísala.';
        if (!CURP.entidades.includes(v.slice(11, 13))) return 'La entidad de nacimiento dentro de la CURP (posiciones 12 y 13) no corresponde a ninguna clave. Revísala.';
        if (CURP.verificarDigito && digitoCurp(v) !== v[17]) return 'El último carácter de la CURP no coincide con el resto. Revisa que la hayas copiado completa y sin cambiar letras por números.';
        return '';
      },
      /* Datos derivables para mostrarlos en solo lectura (minimización). */
      deriva: (v) => ({ fechaNacimiento: fechaDeCurp(v), sexo: v[10], entidad: v.slice(11, 13) })
    },
    rfc: {
      descripcion: 'RFC: 12 caracteres (persona moral) o 13 (persona física). Estructura a confirmar con el emisor [Fuente: __]',
      inputmode: 'text', autocomplete: 'off',
      normaliza: (v) => sinAcentos(recorta(v)).toUpperCase().replace(/[\s-]/g, ''),
      valida: (v) => {
        if (!/^([A-ZÑ&]{3,4})(\d{6})([A-Z0-9]{3})$/.test(v)) return 'El RFC lleva 3 o 4 letras, 6 dígitos de fecha y 3 caracteres finales. Ejemplo: XAXX010101000';
        const aa = Number(v.slice(-9, -7)), mm = Number(v.slice(-7, -5)), dd = Number(v.slice(-5, -3));
        if (!esFechaReal(2000 + aa, mm, dd) && !esFechaReal(1900 + aa, mm, dd)) return 'La fecha dentro del RFC no es una fecha real. Revísala.';
        return '';
      }
    },
    numero: {
      descripcion: 'Número entero o decimal con mínimo, máximo y paso configurables en el campo',
      inputmode: 'decimal', autocomplete: 'off',
      normaliza: (v) => recorta(v).replace(/\s/g, '').replace(',', '.'),
      valida: (v, a = {}) => {
        if (!/^-?\d+(\.\d+)?$/.test(v)) return 'Escribe sólo números; para decimales usa punto. Ejemplo: 12.5';
        const n = Number(v);
        if (a.step && a.step !== 'any' && Number(a.step) >= 1 && !Number.isInteger(n)) return 'Escribe un número entero, sin decimales.';
        if (a.min !== undefined && a.min !== '' && n < Number(a.min)) return `El valor mínimo es ${a.min}.`;
        if (a.max !== undefined && a.max !== '' && n > Number(a.max)) return `El valor máximo es ${a.max}.`;
        return '';
      }
    },
    fecha: {
      descripcion: 'Fecha real en formato AAAA-MM-DD con límites configurables',
      inputmode: 'numeric', autocomplete: 'off',
      normaliza: (v) => recorta(v),
      valida: (v, a = {}) => {
        const m = v.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (!m || !esFechaReal(Number(m[1]), Number(m[2]), Number(m[3]))) return 'Escribe una fecha real con el formato AAAA-MM-DD. Ejemplo: 2026-03-15';
        if (a.max && v > a.max) return a.max === hoyISO() ? 'La fecha no puede ser posterior a hoy.' : `La fecha no puede ser posterior al ${a.max}.`;
        if (a.min && v < a.min) return `La fecha no puede ser anterior al ${a.min}.`;
        return '';
      }
    },
    hora: {
      descripcion: 'Hora en formato de 24 horas',
      inputmode: 'numeric', autocomplete: 'off',
      normaliza: (v) => recorta(v),
      valida: (v) => (/^([01]\d|2[0-3]):[0-5]\d$/.test(v) ? '' : 'Escribe la hora en formato de 24 horas, HH:MM. Ejemplo: 14:30')
    },
    texto: {
      descripcion: 'Texto libre con longitud mínima y máxima; neutraliza marcado y caracteres de control',
      inputmode: 'text', autocomplete: 'off',
      normaliza: (v) => String(v ?? '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim(),
      valida: (v, a = {}) => {
        if (a.minlength && v.length < Number(a.minlength)) return `Escribe al menos ${a.minlength} caracteres; van ${v.length}.`;
        if (a.maxlength && v.length > Number(a.maxlength)) return `Usa hasta ${a.maxlength} caracteres; van ${v.length}.`;
        if (a.legible !== undefined && !pareceTexto(v)) return 'Descríbelo con tus palabras, en una o dos frases completas.';
        return '';
      }
    },
    coordenadas: {
      descripcion: 'Latitud y longitud dentro del rectángulo envolvente configurado',
      inputmode: 'decimal', autocomplete: 'off',
      normaliza: (v) => recorta(v).replace(/\s/g, ''),
      valida: (v) => {
        const m = v.match(/^(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)$/);
        if (!m) return 'Escribe latitud y longitud separadas por coma. Ejemplo: 19.4326,-99.1332';
        const lat = Number(m[1]), lon = Number(m[2]);
        if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return 'Las coordenadas están fuera de rango: la latitud va de -90 a 90 y la longitud de -180 a 180.';
        const b = CONFIG.ambito.coordenadas;
        if (b && (lat < b.latMin || lat > b.latMax || lon < b.lonMin || lon > b.lonMax)) return b.mensaje;
        return '';
      }
    },
    folio: {
      descripcion: 'Folio o clave alfanumérica con guiones',
      inputmode: 'text', autocomplete: 'off',
      normaliza: (v) => recorta(v).toUpperCase().replace(/\s/g, ''),
      valida: (v, a = {}) => (/^[A-Z0-9][A-Z0-9-]{2,}$/.test(v) && v.length <= (a.maxlength || 40) ? '' : 'Escribe el folio tal como aparece en tu acuse, con letras, números y guiones.')
    },
    contrasena: {
      descripcion: 'Contraseña: sin límite máximo restrictivo ni bloqueo del pegado',
      inputmode: 'text', autocomplete: 'new-password',
      normaliza: (v) => String(v ?? ''),
      valida: (v, a = {}) => {
        const min = Number(a.minlength || 12);
        if (v.length < min) return `La contraseña necesita al menos ${min} caracteres. Una frase larga es más segura que una palabra con símbolos.`;
        if (a.maxlength && v.length > Number(a.maxlength)) return `La contraseña admite hasta ${a.maxlength} caracteres.`;
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
      valida: ({ curp, fecha }) => (fechaDeCurp(curp) === fecha ? '' : 'La fecha de nacimiento no coincide con la CURP. Revisa que ambos datos estén correctos.')
    },
    'curp-sexo': {
      descripcion: 'El sexo declarado coincide con la posición 11 de la CURP',
      campos: ['curp', 'sexo'], bloquea: false,
      valida: ({ curp, sexo }) => (!sexo || curp[10] === String(sexo).toUpperCase()[0] ? '' : 'El sexo indicado no coincide con el de la CURP. Revisa ambos datos.')
    },
    'curp-entidad': {
      descripcion: 'La entidad de nacimiento coincide con las posiciones 12 y 13 de la CURP',
      campos: ['curp', 'entidad'], bloquea: false,
      valida: ({ curp, entidad }) => (!entidad || curp.slice(11, 13) === String(entidad).toUpperCase() ? '' : 'La entidad de nacimiento no coincide con la de la CURP. Revisa ambos datos.')
    },
    'rango-fechas': {
      descripcion: 'La fecha final no es anterior a la inicial',
      campos: ['inicio', 'fin'], bloquea: true,
      valida: ({ inicio, fin }) => (fin >= inicio ? '' : 'La fecha final no puede ser anterior a la fecha inicial.')
    },
    'rango-horas': {
      descripcion: 'La hora final es posterior a la inicial cuando es el mismo día',
      campos: ['inicio', 'fin'], bloquea: true,
      valida: ({ inicio, fin }) => (fin > inicio ? '' : 'La hora final debe ser posterior a la hora inicial.')
    },
    'igual': {
      descripcion: 'Confirmación idéntica al original (correo, contraseña)',
      campos: ['original', 'confirmacion'], bloquea: true,
      valida: ({ original, confirmacion }) => (original === confirmacion ? '' : 'Los dos valores no coinciden. Escríbelos igual en ambos campos.')
    },
    'edad': {
      descripcion: 'Edad calculada dentro de la mínima y máxima que exige el formulario',
      campos: ['fecha'], bloquea: true,
      valida: ({ fecha }, a = {}) => {
        const e = edadEn(fecha, hoyISO());
        if (a.edadMin !== undefined && e < Number(a.edadMin)) return plantilla(CONFIG.mensajes.edadMinima, { edad: a.edadMin });
        if (a.edadMax !== undefined && e > Number(a.edadMax)) return plantilla(CONFIG.mensajes.edadMaxima, { edad: a.edadMax });
        return '';
      }
    },
    'cp-colonia': {
      descripcion: 'El código postal pertenece a la alcaldía y colonia elegidas (advertencia, no bloqueo)',
      campos: ['cp', 'colonia'], bloquea: false,
      valida: ({ cp, colonia }, a = {}) => {
        const cat = a.catalogo || [];
        if (!cat.length) return '';
        const ok = cat.some((fila) => fila.cp === cp && fila.colonia === colonia);
        return ok ? '' : 'El código postal no corresponde a la colonia elegida según el catálogo. Revisa ambos datos; puedes continuar si estás seguro.';
      }
    }
  };

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
    version: '1.0.0',
    idioma: 'es-MX',
    fechas: { zonaHoraria: 'America/Mexico_City' },
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
    anuncios: { retardoMs: 50 },
    combo: { maxResultados: 8 },
    chips: { max: 5, clave: 'sia-chips' },
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
      edadMinima: 'Se requiere una edad mínima de {edad} años. Si la persona tiene menos, su madre, padre o tutor debe llenar el formulario.',
      edadMaxima: 'La edad máxima es de {edad} años.',
      advertencia: 'Advertencia:',
      resumenUno: 'Falta revisar 1 campo para continuar.',
      resumenVarios: 'Faltan por revisar {n} campos para continuar.',
      pasoAnuncio: 'Paso {n} de {total}: {titulo}.',
      pasoTexto: 'Paso {n} de {total}',
      pasoHecho: 'completado',
      pasoError: 'con errores',
      palabraObligatorio: 'obligatorio',
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
      archOptimizando: 'Optimizando…',
      archOptimizada: '{peso} · optimizada',
      archPeso: '{peso}',
      archQuitar: 'Quitar archivo {nombre}',
      archRechazoTitulo: 'No se agregó «{nombre}»:',
      archRechazoMax: 'sólo se admiten {max} archivos.',
      archRechazoTipo: 'ese tipo de archivo no se admite. Los formatos son {formatos}.',
      archRechazoFirma: 'el contenido del archivo no corresponde a su extensión. Elige el archivo original.',
      archRechazoPeso: 'pesa {peso} y el máximo es {mb} MB. Reduce su tamaño o elige otro.',
      archRechazoTotal: 'con él se superan los {mb} MB en total.',
      archRechazoVacio: 'el archivo está vacío.',
      archRechazoDuplicado: 'ya adjuntaste ese mismo archivo.',
      archRechazoDimension: 'la imagen es demasiado pequeña (mínimo {ancho} × {alto} píxeles).',
      archRechazoOptimizada: 'aun optimizada pesa {peso} y el máximo es {mb} MB.',
      archLimite: 'Formatos admitidos: {formatos}. Hasta {max} archivos de {mb} MB cada uno.',
      archAgregado: 'Se agregó {nombre}.',
      archQuitado: 'Se quitó {nombre}.',
      archReintentar: 'Reintentar',
      comboUno: 'Un resultado disponible.',
      comboVarios: '{n} resultados disponibles.',
      comboNinguno: 'Sin resultados para «{texto}».',
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
      mapaSinPunto: 'Sin punto marcado.',
      mapaPunto: 'Punto marcado: {lat}, {lon}.',
      mapaFuera: 'El punto queda fuera del ámbito. Muévelo o escribe la dirección.',
      chipsBorrar: 'Borrar historial',
      chipsQuitar: 'Quitar {texto} de las sugerencias',
      sesionExpira: 'Tu sesión terminará en {min} minutos. Guarda o continúa para mantenerla.'
    }
  };

  return Object.assign(CONFIG, { pareceTexto, fechaDeCurp, digitoCurp, hoyISO, ahoraHM, edadEn, plantilla, recorta, soloDigitos, distancia });
}));


/* ===== codigo/js/iconos.js ===== */
/* GENERADO por herramientas/construir.mjs desde codigo/iconos/sprite.svg. No se edita a mano.
   Catálogo cerrado de 29 iconos: i-alerta, i-error, i-ok, i-info, i-ayuda, i-cerrar, i-palomita, i-flecha-izq, i-flecha-der, i-abajo, i-descarga, i-copiar, i-compartir, i-eliminar, i-editar, i-ubicacion, i-fecha, i-adjunto, i-camara, i-buscar, i-mas, i-cargando, i-reloj, i-externo, i-facebook, i-x, i-instagram, i-tiktok, i-youtube.
   formkit.core.js lo inyecta una vez por página. */
window.FORMKIT_ICONOS = "<svg xmlns=\"http://www.w3.org/2000/svg\" hidden> <symbol id=\"i-alerta\" viewBox=\"0 0 24 24\"><path d=\"M12 3 2.5 20h19L12 3z\"/><path d=\"M12 9v5\"/><path d=\"M12 17.5h.01\"/></symbol> <symbol id=\"i-error\" viewBox=\"0 0 24 24\"><circle cx=\"12\" cy=\"12\" r=\"9\"/><path d=\"M12 7v6\"/><path d=\"M12 16.5h.01\"/></symbol> <symbol id=\"i-ok\" viewBox=\"0 0 24 24\"><circle cx=\"12\" cy=\"12\" r=\"9\"/><path d=\"m8 12.5 2.5 2.5L16 9.5\"/></symbol> <symbol id=\"i-info\" viewBox=\"0 0 24 24\"><circle cx=\"12\" cy=\"12\" r=\"9\"/><path d=\"M12 11v6\"/><path d=\"M12 7.5h.01\"/></symbol> <symbol id=\"i-ayuda\" viewBox=\"0 0 24 24\"><circle cx=\"12\" cy=\"12\" r=\"9\"/><path d=\"M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .9-1 1.7\"/><path d=\"M12 17h.01\"/></symbol> <symbol id=\"i-cerrar\" viewBox=\"0 0 24 24\"><path d=\"m6 6 12 12\"/><path d=\"M18 6 6 18\"/></symbol> <symbol id=\"i-palomita\" viewBox=\"0 0 24 24\"><path d=\"m5 12.5 4.5 4.5L19 7.5\"/></symbol> <symbol id=\"i-flecha-izq\" viewBox=\"0 0 24 24\"><path d=\"M19 12H5\"/><path d=\"m11 6-6 6 6 6\"/></symbol> <symbol id=\"i-flecha-der\" viewBox=\"0 0 24 24\"><path d=\"M5 12h14\"/><path d=\"m13 6 6 6-6 6\"/></symbol> <symbol id=\"i-abajo\" viewBox=\"0 0 24 24\"><path d=\"m6 9 6 6 6-6\"/></symbol> <symbol id=\"i-descarga\" viewBox=\"0 0 24 24\"><path d=\"M12 4v11\"/><path d=\"m7 10 5 5 5-5\"/><path d=\"M4 19h16\"/></symbol> <symbol id=\"i-copiar\" viewBox=\"0 0 24 24\"><rect x=\"9\" y=\"9\" width=\"11\" height=\"11\" rx=\"2\"/><path d=\"M5 15V6a2 2 0 0 1 2-2h9\"/></symbol> <symbol id=\"i-compartir\" viewBox=\"0 0 24 24\"><circle cx=\"18\" cy=\"5\" r=\"2.5\"/><circle cx=\"6\" cy=\"12\" r=\"2.5\"/><circle cx=\"18\" cy=\"19\" r=\"2.5\"/><path d=\"m8.3 10.8 7.4-4.6\"/><path d=\"m8.3 13.2 7.4 4.6\"/></symbol> <symbol id=\"i-eliminar\" viewBox=\"0 0 24 24\"><path d=\"M4 7h16\"/><path d=\"M9 7V4h6v3\"/><path d=\"M6 7l1 13h10l1-13\"/></symbol> <symbol id=\"i-editar\" viewBox=\"0 0 24 24\"><path d=\"M4 20h4l11-11-4-4L4 16v4z\"/><path d=\"m13 7 4 4\"/></symbol> <symbol id=\"i-ubicacion\" viewBox=\"0 0 24 24\"><path d=\"M12 21s-6-6.3-6-11a6 6 0 0 1 12 0c0 4.7-6 11-6 11z\"/><circle cx=\"12\" cy=\"10\" r=\"2.2\"/></symbol> <symbol id=\"i-fecha\" viewBox=\"0 0 24 24\"><rect x=\"4\" y=\"5\" width=\"16\" height=\"15\" rx=\"2\"/><path d=\"M4 10h16\"/><path d=\"M8 3v4\"/><path d=\"M16 3v4\"/></symbol> <symbol id=\"i-adjunto\" viewBox=\"0 0 24 24\"><path d=\"m20 11-8.5 8.5a5 5 0 0 1-7-7L13 4a3.3 3.3 0 0 1 4.7 4.7L9.5 17a1.6 1.6 0 0 1-2.3-2.3L15 7\"/></symbol> <symbol id=\"i-camara\" viewBox=\"0 0 24 24\"><path d=\"M4 8h3l2-3h6l2 3h3v11H4z\"/><circle cx=\"12\" cy=\"13\" r=\"3.5\"/></symbol> <symbol id=\"i-buscar\" viewBox=\"0 0 24 24\"><circle cx=\"11\" cy=\"11\" r=\"6\"/><path d=\"m20 20-4.5-4.5\"/></symbol> <symbol id=\"i-mas\" viewBox=\"0 0 24 24\"><path d=\"M12 5v14\"/><path d=\"M5 12h14\"/></symbol> <symbol id=\"i-cargando\" viewBox=\"0 0 24 24\"><path d=\"M12 3a9 9 0 1 0 9 9\"/></symbol> <symbol id=\"i-reloj\" viewBox=\"0 0 24 24\"><circle cx=\"12\" cy=\"12\" r=\"9\"/><path d=\"M12 7v5l3 2\"/></symbol> <symbol id=\"i-externo\" viewBox=\"0 0 24 24\"><path d=\"M14 4h6v6\"/><path d=\"M20 4 10 14\"/><path d=\"M19 14v5H5V5h5\"/></symbol> <symbol id=\"i-facebook\" viewBox=\"0 0 24 24\"><path fill=\"currentColor\" stroke=\"none\" d=\"M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5 3.66 9.15 8.44 9.94v-7.03H7.9v-2.91h2.54V9.85c0-2.52 1.5-3.91 3.77-3.91 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.78-1.63 1.57v1.89h2.78l-.45 2.91h-2.33V22c4.78-.79 8.44-4.93 8.44-9.94Z\"/></symbol> <symbol id=\"i-x\" viewBox=\"0 0 24 24\"><path fill=\"currentColor\" stroke=\"none\" d=\"M17.53 3h3.03l-6.62 7.57L21.75 21h-6.09l-4.77-6.24L5.42 21H2.38l7.08-8.09L2.25 3h6.24l4.31 5.7L17.53 3Zm-1.07 16.17h1.68L7.62 4.73H5.82l10.64 14.44Z\"/></symbol> <symbol id=\"i-instagram\" viewBox=\"0 0 24 24\"><path fill=\"currentColor\" stroke=\"none\" d=\"M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41-.56-.22-.96-.48-1.38-.9-.42-.42-.68-.82-.9-1.38-.16-.42-.36-1.06-.41-2.23C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16Zm0 3.29a6.55 6.55 0 1 0 0 13.1 6.55 6.55 0 0 0 0-13.1Zm0 10.8a4.25 4.25 0 1 1 0-8.5 4.25 4.25 0 0 1 0 8.5Zm8.34-11.06a1.53 1.53 0 1 1-3.06 0 1.53 1.53 0 0 1 3.06 0Z\"/></symbol> <symbol id=\"i-tiktok\" viewBox=\"0 0 24 24\"><path fill=\"currentColor\" stroke=\"none\" d=\"M16.6 5.82A4.28 4.28 0 0 1 15.54 3h-3.1v12.4a2.59 2.59 0 1 1-1.84-2.48V9.75a5.72 5.72 0 1 0 4.94 5.66V9.01a7.35 7.35 0 0 0 4.3 1.38V7.28a4.29 4.29 0 0 1-3.24-1.46Z\"/></symbol> <symbol id=\"i-youtube\" viewBox=\"0 0 24 24\"><path fill=\"currentColor\" stroke=\"none\" d=\"M23.5 6.5a3.02 3.02 0 0 0-2.12-2.14C19.5 3.85 12 3.85 12 3.85s-7.5 0-9.38.51A3.02 3.02 0 0 0 .5 6.5C0 8.39 0 12 0 12s0 3.61.5 5.5a3.02 3.02 0 0 0 2.12 2.14c1.88.51 9.38.51 9.38.51s7.5 0 9.38-.51a3.02 3.02 0 0 0 2.12-2.14C24 15.61 24 12 24 12s0-3.61-.5-5.5ZM9.6 15.57V8.43L15.82 12 9.6 15.57Z\"/></symbol> </svg>";


/* ===== codigo/js/formkit.core.js ===== */
/* =========================================================
   formkit.core.js · Estándar de formularios del SIA (SEDEMA) · v1.0.0

   Núcleo obligatorio. Lee la declaración de cada campo de sus ATRIBUTOS
   (required, data-formato, data-si, data-cruzada, data-uso…) y toma
   patrones, límites y mensajes de validaciones.config.js. Decisión C1:
   la superficie para quien programa es el HTML; la fuente de verdad de la
   validación es un solo archivo de configuración.

   Qué hace el núcleo: anuncios para lector de pantalla, preparación de cada
   campo (marca de obligatorio, ayuda, error, contador), visibilidad
   condicional, validación individual y cruzada con el momento acordado
   (decisión C5), resumen de errores con foco, borrador local, envío sin
   duplicados y registro de módulos. Todo lo demás es un módulo opcional
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
  const pesoTxt = (b) => (b < BYTES_POR_MB ? `${Math.max(1, Math.round(b / BYTES_POR_KB))} KB` : `${(b / BYTES_POR_MB).toFixed(1)} MB`);
  const normalizaBusqueda = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  let contadorIds = 0;
  const idUnico = (p) => `${p}-${++contadorIds}`;

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

  /* ---------- Anuncios para lector de pantalla ---------- */
  let regionAnuncios = null;
  let temporizadorAnuncio = 0;
  function anuncia(texto, cortes = false) {
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

  /* ---------- Registro de módulos ----------
     Un módulo declara el selector que lo activa y una función iniciar(form,
     ctx). El núcleo lo llama sólo si el formulario contiene ese selector. */
  const modulos = new Map();
  function registra(nombre, def) { modulos.set(nombre, def); }

  /* ---------- Instancia ---------- */
  function iniciar(formulario, opciones = {}) {
    const form = typeof formulario === 'string' ? $(formulario) : formulario;
    if (!form) throw new Error(`FormKit: no existe el formulario «${formulario}»`);
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

    function tipoDe(el) {
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
      if (tipos.has(t)) return tipos.get(t).controles(el);
      if (t === 'opcion') return $$('input[type="radio"]', el);
      if (t === 'multiple') return $$('input[type="checkbox"]', el);
      return $$('input:not([type="hidden"]),select,textarea', el).filter((c) => !c.closest('[data-trampa]'));
    }
    const controlPrincipal = (n) => controlesDe(n)[0] || null;

    function valorDe(n) {
      const el = envoltura(n);
      const t = tipoDe(el);
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
      return a;
    }

    /* ----- Preparación de cada campo ----- */
    function preparaCampo(n) {
      const el = envoltura(n);
      const t = tipoDe(el);
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

      for (const c of controlesDe(n)) {
        const ids = [ayuda && ayuda.textContent.trim() ? ayuda.id : '', err.id].filter(Boolean).join(' ');
        c.setAttribute('aria-describedby', ids);
        if (esObligatorio(n) && c.type !== 'radio' && c.type !== 'checkbox') c.setAttribute('aria-required', 'true');
        const f = cfg.formatos[el.dataset.formato];
        if (f && f.inputmode && !c.hasAttribute('inputmode') && c.tagName === 'INPUT') c.setAttribute('inputmode', f.inputmode);
        if (c.tagName === 'INPUT' && !c.hasAttribute('enterkeyhint') && c.type !== 'radio' && c.type !== 'checkbox' && c.type !== 'file') c.setAttribute('enterkeyhint', 'next');
      }

      /* Fecha y hora: límites por omisión (hoy) cuando el campo lo declara. */
      const ctl = controlPrincipal(n);
      if (ctl && el.dataset.formato === 'fecha' && el.hasAttribute('data-no-futura') && !ctl.max) ctl.max = cfg.hoyISO();

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
        const msg = f.valida(f.normaliza(v), a);
        if (msg) return msg;
      } else if (a.minlength && v.length < Number(a.minlength)) return plantilla('Escribe al menos {min} caracteres en «{etiqueta}»; van {n}.', { ...datos, min: a.minlength, n: v.length });
      return '';
    }

    /* Sugerencia sin bloqueo (por ejemplo, dominio de correo mal escrito). */
    function sugerenciaDe(n) {
      const el = envoltura(n);
      const f = cfg.formatos[el.dataset.formato];
      return f && f.sugiere ? f.sugiere(valorDe(n)) : '';
    }

    function marca(n, mensaje, nivel = 'error') {
      const el = envoltura(n);
      const err = $('.err', el);
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
    function validaCruzadas(n) {
      const resultados = [];
      for (const c of cruzadasDe(n)) {
        const def = cfg.cruzadas[c.clave];
        if (!def) continue;
        const valores = {};
        let listo = true;
        for (const rol of def.campos) {
          const campo = c.mapa[rol] || rol;
          if (!envoltura(campo) || !activo(campo)) { listo = false; break; }
          const v = valorDe(campo);
          if (!v || validaCampo(campo)) { listo = false; break; }
          const f = cfg.formatos[envoltura(campo).dataset.formato];
          valores[rol] = f ? f.normaliza(v) : v;
        }
        if (!listo) continue;
        const extra = { ...envoltura(n).dataset };
        if (extra.catalogo && global.FORMKIT_CATALOGOS) { const cat = global.FORMKIT_CATALOGOS[extra.catalogo]; extra.catalogo = cat && cat.filas ? cat.filas : cat; }
        const msg = def.valida(valores, extra);
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

    function muestraResumen(cont, fallos) {
      quitaResumen(cont);
      if (!fallos.length) return null;
      const r = document.createElement('div');
      r.className = 'resumen-errores';
      r.setAttribute('role', 'alert');
      r.tabIndex = -1;
      const tit = document.createElement('p');
      tit.className = 'resumen-errores-titulo';
      tit.append(icono('error'), document.createTextNode(fallos.length === 1 ? M.resumenUno : plantilla(M.resumenVarios, { n: fallos.length })));
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
        a.textContent = f.mensaje;
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
    function valorParaCondicion(nombre) {
      if (envoltura(nombre)) { const v = valorDe(nombre); return Array.isArray(v) ? v : [v]; }
      const ctls = $$(`[name="${nombre}"]`, form);
      const marcados = ctls.filter((c) => (c.type === 'radio' || c.type === 'checkbox') ? c.checked : true);
      return marcados.map((c) => c.value);
    }
    function aplicaCondicionales() {
      for (const el of $$('[data-si]', form)) {
        const [campo, lista] = el.dataset.si.split('=');
        const admitidos = (lista || '').split('|');
        const actuales = valorParaCondicion(campo.trim());
        const visible = actuales.some((v) => admitidos.includes(v));
        if (el.hidden === visible) {
          el.hidden = !visible;
          /* Un campo que se oculta pierde su error: ya no cuenta. */
          if (!visible) for (const c of $$('[data-campo]', el)) limpia(c.dataset.campo);
          if (el.hasAttribute('data-campo') && !visible) limpia(el.dataset.campo);
        }
      }
    }

    /* ----- Borrador local -----
       Se activa con data-borrador="clave" en el <form>. Versionado con
       data-borrador-version. Excluye campos data-sensible y archivos. */
    const claveBorrador = form.dataset.borrador || '';
    const versionBorrador = form.dataset.borradorVersion || '1';
    let temporizadorBorrador = 0;
    let temporizadorGuardado = 0;
    let arrancado = false;
    let terminado = false;
    const indicador = $('[data-guardado]');
    const franja = $('[data-franja-borrador]');

    function programaBorrador() {
      if (!claveBorrador || !arrancado || terminado) return;
      clearTimeout(temporizadorBorrador);
      temporizadorBorrador = setTimeout(escribeBorrador, cfg.borrador.retardoMs);
    }
    function datosBorrador() {
      const datos = {};
      for (const n of nombres()) {
        const el = envoltura(n);
        if (el.hasAttribute('data-sensible') || tipos.has(tipoDe(el)) && !tipos.get(tipoDe(el)).enBorrador) continue;
        datos[n] = valorDe(n);
      }
      return datos;
    }
    function escribeBorrador() {
      const extra = FormKit.ganchos.estadoBorrador ? FormKit.ganchos.estadoBorrador(form) : {};
      const ok = almacen.escribe(claveBorrador, JSON.stringify({ v: versionBorrador, t: Date.now(), datos: datosBorrador(), ...extra }));
      if (ok && indicador) {
        indicador.textContent = M.borradorGuardado;
        indicador.setAttribute('data-visible', '');
        clearTimeout(temporizadorGuardado);
        temporizadorGuardado = setTimeout(() => indicador.removeAttribute('data-visible'), cfg.borrador.visibleMs);
      }
    }
    /* Si la persona cierra o cambia de pestaña antes de que venza el retardo,
       el borrador pendiente se escribe en ese momento. */
    window.addEventListener('pagehide', () => { if (temporizadorBorrador && claveBorrador && arrancado && !terminado) { clearTimeout(temporizadorBorrador); escribeBorrador(); } });

    function leeBorrador() {
      const crudo = almacen.lee(claveBorrador);
      if (!crudo) return null;
      try {
        const b = JSON.parse(crudo);
        if (b.v !== versionBorrador || Date.now() - b.t > cfg.borrador.ttlDias * MS_POR_DIA) { almacen.borra(claveBorrador); return null; }
        return b;
      } catch (e) { almacen.borra(claveBorrador); return null; }
    }
    function restauraBorrador(b) {
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
      anuncia(M.borradorGuardado.replace('guardado', 'recuperado'));
    }
    function iniciaFranja(b) {
      franja.hidden = false;
      const f = $('[data-borrador-fecha]', franja);
      if (f) f.textContent = new Date(b.t).toLocaleString(cfg.idioma, { dateStyle: 'long', timeStyle: 'short' });
      franja.addEventListener('click', (e) => {
        const a = e.target.closest('[data-borrador]');
        if (!a) return;
        const confirma = $('[data-borrador-confirma]', franja);
        if (a.dataset.borrador === 'recuperar') { restauraBorrador(b); franja.hidden = true; }
        else if (a.dataset.borrador === 'descartar') { if (confirma) { confirma.hidden = false; const si = $('[data-borrador="descartar-si"]', franja); if (si) si.focus(); } else { almacen.borra(claveBorrador); franja.hidden = true; } }
        else if (a.dataset.borrador === 'descartar-si') { almacen.borra(claveBorrador); franja.hidden = true; }
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
        if (tipos.has(t) && tipos.get(t).fueraDeDatos) continue;
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
        .then((r) => { if (r.status === 429) { const e = new Error('limite'); e.limite = true; throw e; } if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); });
    }

    function botonEnviar() { return $('[data-accion="enviar"],button[type="submit"]', form); }

    async function enviar() {
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
      try {
        for (const def of tipos.values()) if (def.antesDeEnviar) await def.antesDeEnviar(form);
        const enviarFn = opciones.enviar || envioPorOmision;
        const respuesta = await enviarFn(arma(), { signal: control.signal });
        terminado = true;
        clearTimeout(temporizadorBorrador);
        if (claveBorrador) almacen.borra(claveBorrador);
        if (opciones.alEnviar) opciones.alEnviar(respuesta, form); else form.dispatchEvent(new CustomEvent('formkit:enviado', { detail: respuesta }));
        return true;
      } catch (e) {
        const texto = e && e.limite ? M.envioLimite : control.signal.aborted ? M.envioTimeout : M.envioError;
        if (avisoEnvio) { $('.aviso-texto', avisoEnvio).textContent = texto; avisoEnvio.hidden = false; avisoEnvio.focus(); } else anuncia(texto, true);
        if (opciones.alFallar) opciones.alFallar(e, form);
        return false;
      } finally {
        clearTimeout(plazo);
        if (boton) { boton.removeAttribute('aria-disabled'); boton.removeAttribute('aria-busy'); boton.textContent = textoOriginal; }
      }
    }

    /* ----- Eventos (todos aquí; ninguno en el HTML) ----- */
    form.addEventListener('submit', (e) => { e.preventDefault(); if (!(FormKit.ganchos.submit && FormKit.ganchos.submit(form, enviar))) enviar(); });

    form.addEventListener('click', (e) => {
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
        if (e.target.matches('input[type="radio"],input[type="checkbox"],select,input[type="date"],input[type="time"],input[type="file"]')) { if (estadoDe(n).tocado || $('.err', el).dataset.nivel) validaYPinta(n); revisaResumen(); }
        else if ($('.err', el).dataset.nivel) { validaYPinta(n); revisaResumen(); }
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
      revisaResumen();
    });

    /* Diálogos y copiado los atiende su módulo; el anuncio de envío fallido
       se vuelve a ocultar al retomar la captura. */
    form.addEventListener('focusin', () => { const a = $('[data-estado-envio]', form); if (a && !a.hidden && document.activeElement !== a) a.hidden = true; });

    /* ----- Contexto para los módulos ----- */
    const ctx = {
      form, cfg, M, opciones, tipos, sugerencias: [],
      $, $$, plantilla, icono, anuncia, almacen, idUnico, pesoTxt, normalizaBusqueda,
      envoltura, envolturas, nombres, tipoDe, controlesDe, controlPrincipal, valorDe, textoDeValor, etiquetaDe, esObligatorio, activo, atributosDe,
      validaCampo, validaYPinta, validaContenedor, marca, limpia, muestraResumen, quitaResumen, revisaResumen, enfocaCampo,
      aplicaCondicionales, programaBorrador, leeBorrador, restauraBorrador, enviar, arma, preparaCampo, estadoDe
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
    if (claveBorrador) {
      const previo = leeBorrador();
      if (previo) { if (franja) iniciaFranja(previo); else restauraBorrador(previo); }
    }
    arrancado = true;
    form.dataset.formkit = 'listo';

    return {
      ctx,
      modulos: activos.map(([n]) => n),
      payload: arma,
      valida: () => validaContenedor(form),
      enviar,
      /* Inventario de datos personales: qué se pide, para qué y con qué finalidad (FRM-55). */
      inventario: () => nombres().map((n) => { const d = envoltura(n).dataset; return { campo: n, etiqueta: etiquetaDe(n), obligatorio: esObligatorio(n), uso: d.uso || '', datoPersonal: d.finalidad !== undefined, finalidad: d.finalidad || '', sensible: d.sensible !== undefined, formato: d.formato || '', autocomplete: controlPrincipal(n) ? controlPrincipal(n).getAttribute('autocomplete') || '' : '' }; })
    };
  }

  const FormKit = {
    version: BASE.version,
    config: fusiona(BASE, global.FORMKIT_CONFIG || {}),
    registra, iniciar, anuncia, icono, almacen,
    utilidades: { $, $$, plantilla, pesoTxt, normalizaBusqueda, idUnico, fusiona },
    /* Ganchos que un módulo puede ocupar: validaTodo (pasos), submit, estadoBorrador, restauraBorrador. */
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
   cadenas o de objetos {nombre, detalle, valor}. Nunca se escribe a mano en
   el código: viene de la fuente oficial que declara codigo/catalogos.

   Modo (decisión C4): cerrado por omisión (sólo valores del catálogo; la
   vía de escape es la opción «Otro»). Con data-libre acepta lo escrito y lo
   dice con un renglón «No está en la lista: se guarda como lo escribiste».
   El servidor debe conocer el modo para rechazar valores fuera de catálogo.
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
            v.textContent = libre && q ? 'No está en la lista: se guarda como lo escribiste.' : plantilla(M.comboNinguno, { texto: entrada.value });
            lista.appendChild(v);
          }
          lista.hidden = false;
          entrada.setAttribute('aria-expanded', 'true');
          marcaActiva(-1);
          anuncia(visibles.length === 0 ? plantilla(M.comboNinguno, { texto: entrada.value }) : visibles.length === 1 ? M.comboUno : plantilla(M.comboVarios, { n: visibles.length }));
        }

        entrada.addEventListener('input', pinta);
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
        entrada.addEventListener('blur', cierra);
      }
    }
  });

  function catalogo(wrap) {
    const fuente = (window.FORMKIT_CATALOGOS || {})[wrap.dataset.catalogo] || [];
    return fuente.map((o) => (typeof o === 'string' ? { nombre: o } : o));
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
   ========================================================= */
(function () {
  'use strict';
  FormKit.registra('fecha', {
    selector: '[data-hoy],[data-ahora],[data-rango],[data-formato="fecha"][data-deriva]',
    iniciar(form, ctx) {
      const { $, $$, cfg, M, anuncia, envoltura, controlPrincipal, validaYPinta, programaBorrador } = ctx;

      form.addEventListener('click', (e) => {
        const b = e.target.closest('[data-hoy],[data-ahora],[data-atajo]');
        if (!b || !form.contains(b)) return;
        if (b.hasAttribute('data-atajo')) { aplicaAtajo(b); return; }
        const campo = b.closest('[data-campo]');
        const ctl = campo && controlPrincipal(campo.dataset.campo);
        if (!ctl) return;
        ctl.value = b.hasAttribute('data-hoy') ? cfg.hoyISO() : cfg.ahoraHM();
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
      for (const campo of $$('[data-campo][data-formato="fecha"][data-deriva]', form)) {
        const ctl = controlPrincipal(campo.dataset.campo);
        const destinos = campo.dataset.deriva.split(/\s+/).filter((p) => p.startsWith('edad=')).map((p) => p.slice(5));
        if (!ctl || !destinos.length) continue;
        const calcula = () => {
          const v = ctl.value;
          const edad = /^\d{4}-\d{2}-\d{2}$/.test(v) && v <= cfg.hoyISO() ? String(cfg.edadEn(v, cfg.hoyISO())) : '';
          for (const d of destinos) {
            const c = controlPrincipal(d);
            if (!c || c.value === edad) continue;
            c.value = edad;
            c.dispatchEvent(new Event('change', { bubbles: true }));
            if (edad) anuncia(`${ctx.etiquetaDe(d)}: ${edad} años, calculada con la fecha de nacimiento.`);
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
        caja.setAttribute('aria-label', 'Atajos de periodo');
        for (const d of dias) {
          const b = document.createElement('button');
          b.type = 'button';
          b.className = 'btn btn-secundario fecha-atajo';
          b.dataset.atajo = String(d);
          b.dataset.rangoIni = ini; b.dataset.rangoFin = fin;
          b.textContent = `Últimos ${d} días`;
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
        anuncia(`Periodo: del ${ini.value} al ${fin.value}`);
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
        const textos = { H: 'Hombre', M: 'Mujer', X: 'No binario' };
        for (const par of campo.dataset.deriva.split(/\s+/).filter(Boolean)) {
          const [clave, destino] = par.split('=');
          const envDestino = envoltura(destino);
          const ctlDestino = envDestino && controlPrincipal(destino);
          if (!ctlDestino) continue;
          const bruto = datos[clave] || '';
          const valor = clave === 'sexo' && ctlDestino.tagName !== 'SELECT' ? (textos[bruto] || bruto) : bruto;
          if (ctlDestino.value !== valor) {
            ctlDestino.value = valor;
            ctlDestino.dispatchEvent(new Event('change', { bubbles: true }));
            if (valor) anuncia(`${etiquetaDe(destino)}: ${valor}, tomado de la CURP.`);
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
   configurables; quitar una fila con datos pide confirmación en línea; el
   foco vuelve a un lugar sensato tras agregar o quitar.

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
   El carácter # se sustituye por el índice de la fila.
   ========================================================= */
(function () {
  'use strict';
  FormKit.registra('repetibles', {
    selector: '[data-repetible]',
    iniciar(form, ctx) {
      const { $, $$, M, plantilla, anuncia, preparaCampo, icono, valorDe, limpia, programaBorrador } = ctx;

      for (const rep of $$('[data-repetible]', form)) {
        const lista = $('[data-repetible-lista]', rep);
        const tpl = $('template[data-repetible-plantilla]', rep);
        const btnAgregar = $('[data-repetible-agregar]', rep);
        const min = Number(rep.dataset.min || 0), max = Number(rep.dataset.max || 0);
        lista.setAttribute('aria-label', rep.dataset.etiqueta || rep.dataset.repetible);
        if (btnAgregar && !btnAgregar.textContent.trim()) btnAgregar.textContent = M.filaAgregar;

        function filas() { return $$(':scope > .repetible-fila', lista); }
        function renumera() {
          filas().forEach((fila, i) => {
            const cab = $('.repetible-titulo', fila);
            if (cab) cab.textContent = `${rep.dataset.etiqueta || rep.dataset.repetible} ${i + 1}`;
            const q = $('[data-repetible-quitar]', fila);
            if (q) q.setAttribute('aria-label', plantilla(M.filaQuitar, { n: i + 1 }));
          });
          if (btnAgregar) { const lleno = max && filas().length >= max; btnAgregar.setAttribute('aria-disabled', String(!!lleno)); }
        }
        function agrega(foco = true) {
          if (max && filas().length >= max) { anuncia(plantilla(M.repetibleMax, { max, etiqueta: rep.dataset.etiqueta || '' })); return null; }
          const i = filas().length;
          const html = tpl.innerHTML.replace(/#/g, String(i));
          const cont = document.createElement('div'); cont.innerHTML = html;
          const fila = cont.firstElementChild;
          fila.classList.add('repetible-fila');
          /* Encabezado de la fila y botón de quitar, si la plantilla no los trae. */
          if (!$('.repetible-cabecera', fila)) {
            const cab = document.createElement('div'); cab.className = 'repetible-cabecera';
            const tit = document.createElement('p'); tit.className = 'repetible-titulo';
            const q = document.createElement('button'); q.type = 'button'; q.className = 'btn-icono'; q.dataset.repetibleQuitar = '';
            q.append(icono('eliminar'));
            cab.append(tit, q); fila.prepend(cab);
          }
          lista.appendChild(fila);
          for (const c of $$('[data-campo]', fila)) preparaCampo(c.dataset.campo);
          renumera();
          if (foco) { const primero = $('input,select,textarea', fila); if (primero) primero.focus(); }
          anuncia(`${rep.dataset.etiqueta || rep.dataset.repetible} ${i + 1} agregado.`);
          programaBorrador();
          return fila;
        }
        function tieneDatos(fila) { return $$('[data-campo]', fila).some((c) => { const v = valorDe(c.dataset.campo); return Array.isArray(v) ? v.length : v; }); }
        function quita(fila) {
          const idx = filas().indexOf(fila);
          if (min && filas().length <= min) { anuncia(plantilla(M.repetibleMin, { min, etiqueta: rep.dataset.etiqueta || '' })); return; }
          for (const c of $$('[data-campo]', fila)) limpia(c.dataset.campo);
          fila.remove();
          renumera();
          const siguiente = filas()[Math.min(idx, filas().length - 1)];
          (siguiente ? $('[data-repetible-quitar]', siguiente) : btnAgregar).focus();
          anuncia(`Fila ${idx + 1} quitada.`);
          programaBorrador();
        }

        rep.addEventListener('click', (e) => {
          const ag = e.target.closest('[data-repetible-agregar]');
          if (ag && ag.getAttribute('aria-disabled') !== 'true') { agrega(); return; }
          const q = e.target.closest('[data-repetible-quitar]');
          if (!q) return;
          const fila = q.closest('.repetible-fila');
          if (tieneDatos(fila) && FormKit.confirma) FormKit.confirma(q, { titulo: M.filaConfirma, si: 'Quitar', no: 'Conservar', peligro: true }).then((ok) => { if (ok) quita(fila); });
          else if (tieneDatos(fila)) { if (window.confirm(M.filaConfirma)) quita(fila); } /* sin módulo modal: confirmación nativa como último recurso */
          else quita(fila);
        });

        /* Filas iniciales: las que exija el mínimo (al menos una si el grupo es obligatorio). */
        const iniciales = Math.max(min, rep.hasAttribute('data-requerido') ? 1 : 0);
        while (filas().length < iniciales) agrega(false);
        renumera();

      }

      /* Las filas que el borrador no conoce se recrean al restaurar: se
         guardan cuántas filas tenía cada repetible. */
      FormKit.ganchos.estadoBorrador = (f) => ({ repetibles: Object.fromEntries($$('[data-repetible]', f).map((r) => [r.dataset.repetible, $$(':scope > .repetible-fila', $('[data-repetible-lista]', r)).length])) });
      const anterior = FormKit.ganchos.restauraBorrador;
      FormKit.ganchos.restauraBorrador = (f, b) => {
        if (anterior) anterior(f, b);
        for (const r of $$('[data-repetible]', f)) {
          const n = (b.repetibles || {})[r.dataset.repetible] || 0;
          const lista = $('[data-repetible-lista]', r);
          while ($$(':scope > .repetible-fila', lista).length < n) $('[data-repetible-agregar]', r).click();
          for (const c of $$('[data-campo]', r)) { const v = (b.datos || {})[c.dataset.campo]; const ctl = ctx.controlPrincipal(c.dataset.campo); if (ctl && v !== undefined && ctl.type !== 'radio' && ctl.type !== 'checkbox') ctl.value = v; }
        }
      };
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
   (paso actual y pasos hechos).
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
       <a class="btn btn-secundario" data-acuse-descarga hidden download>Descargar acuse (PDF)</a>
     </section>
   La respuesta del servidor debe traer {folio, fecha} y opcionalmente
   {acuseUrl, acusePeso}.
   ========================================================= */
(function () {
  'use strict';
  FormKit.registra('acuse', {
    selector: '[data-acuse]',
    fueraDelFormulario: true,
    iniciar(form, ctx) {
      const { $, cfg, anuncia, opciones } = ctx;
      const sec = $('[data-acuse]');
      const limite = $('[data-limite]');
      if (!sec) return;

      function muestraSolo(destino) {
        for (const s of [form, sec, limite]) if (s) s.hidden = s !== destino;
        const h = $('.titulo-paso', destino);
        if (h) { h.tabIndex = -1; h.focus(); anuncia(h.textContent); }
      }

      function pinta(respuesta) {
        const folio = $('[data-acuse-folio]', sec);
        if (folio) folio.textContent = respuesta.folio || '';
        const fecha = $('[data-acuse-fecha]', sec);
        if (fecha) fecha.textContent = respuesta.fecha ? new Date(respuesta.fecha).toLocaleString(cfg.idioma, { dateStyle: 'long', timeStyle: 'short', timeZone: cfg.fechas.zonaHoraria }) : '';
        const desc = $('[data-acuse-descarga]', sec);
        if (desc) {
          desc.hidden = !respuesta.acuseUrl;
          if (respuesta.acuseUrl) { desc.href = respuesta.acuseUrl; desc.download = respuesta.acuseNombre || `acuse-${respuesta.folio || ''}.pdf`; if (respuesta.acusePeso) { const peso = $('[data-acuse-peso]', desc); if (peso) peso.textContent = respuesta.acusePeso; } }
        }
        muestraSolo(sec);
      }

      /* Si el formulario ya define alEnviar, se respeta y se encadena. */
      const alEnviarAnterior = opciones.alEnviar;
      opciones.alEnviar = (r, f) => { if (alEnviarAnterior) alEnviarAnterior(r, f); pinta(r); };
      const alFallarAnterior = opciones.alFallar;
      opciones.alFallar = (e, f) => { if (alFallarAnterior) alFallarAnterior(e, f); if (e && e.limite && limite) muestraSolo(limite); };

      /* «Volver» desde la pantalla de límite devuelve al formulario donde estaba. */
      if (limite) limite.addEventListener('click', (e) => { if (e.target.closest('[data-accion="reintentar"]')) muestraSolo(form); });

      FormKit.acuse = { pinta, muestraSolo };
    }
  });
}());


/* ===== codigo/modulos/modal/modal.js ===== */
/* =========================================================
   modal.js · Módulo «modal» · nivel RECOMENDADO

   Diálogos con <dialog> nativo: el navegador atrapa el foco, cierra con
   Escape y devuelve el foco a quien lo abrió. Dos usos:
     1. Contenido que hay que leer (aviso de privacidad): botones con
        data-abre-dialogo="id" y data-cierra-dialogo dentro del <dialog>.
     2. Confirmación de una acción que no se deshace:
        FormKit.confirma(ancla, {titulo, texto, si, no, peligro}) → Promise<boolean>
        Crea un <dialog role="alertdialog"> en el momento y lo retira al cerrar.
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
    return new Promise((resolve) => {
      const d = document.createElement('dialog');
      d.className = 'dialogo dialogo-confirma';
      d.setAttribute('role', 'alertdialog');
      const idT = FormKit.utilidades.idUnico('conf-t'), idD = FormKit.utilidades.idUnico('conf-d');
      d.setAttribute('aria-labelledby', idT);
      if (cfg.texto) d.setAttribute('aria-describedby', idD);
      const h = document.createElement('h2'); h.className = 'titulo-bloque dialogo-titulo'; h.id = idT; h.textContent = cfg.titulo || '¿Confirmas?';
      const p = document.createElement('p'); p.className = 'texto-gris'; p.id = idD; p.textContent = cfg.texto || '';
      const acc = document.createElement('div'); acc.className = 'acciones dialogo-acciones';
      const no = document.createElement('button'); no.type = 'button'; no.className = 'btn btn-secundario'; no.textContent = cfg.no || 'Cancelar'; no.dataset.r = 'no';
      const si = document.createElement('button'); si.type = 'button'; si.className = cfg.peligro ? 'btn btn-peligro' : 'btn btn-primario'; si.textContent = cfg.si || 'Confirmar'; si.dataset.r = 'si';
      acc.append(no, si);
      d.append(h, p, acc);
      document.body.appendChild(d);
      const termina = (ok) => { cierra(d); d.remove(); if (ancla && ancla.focus) ancla.focus(); resolve(ok); };
      d.addEventListener('click', (e) => { const b = e.target.closest('[data-r]'); if (b) termina(b.dataset.r === 'si'); });
      d.addEventListener('cancel', (e) => { e.preventDefault(); termina(false); });
      abre(d);
      /* El foco inicial va a la opción segura (cancelar), no a la destructiva. */
      no.focus();
      FormKit.anuncia(`${h.textContent} ${p.textContent}`, true);
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
          if (navigator.share) { try { await navigator.share(datos); confirma(sh, 'Compartido.', true); } catch (err) { /* la persona canceló */ } }
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
        nodo.textContent = ok ? ' Copiado' : ' No se pudo copiar';
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
   estado de carga; si abre en otra pestaña, lo dice.

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
        if (b.target === '_blank') { const s = document.createElement('span'); s.className = 'solo-lector'; s.textContent = ' (se abre en otra pestaña)'; b.appendChild(s); }
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
        b.setAttribute('aria-busy', 'true'); b.setAttribute('aria-disabled', 'true');
        const texto = [...b.childNodes].find((x) => x.nodeType === 3);
        const original = texto ? texto.textContent : '';
        if (texto) texto.textContent = ' Preparando…';
        anuncia('Preparando el archivo…');
        try {
          const r = await gen();
          const a = document.createElement('a'); a.href = r.url; a.download = r.nombre || 'archivo'; document.body.appendChild(a); a.click(); a.remove();
          if (r.peso) { b.dataset.peso = r.peso; pintaDetalle(b); }
          anuncia('Descarga iniciada.');
        } catch (err) { anuncia('No se pudo preparar el archivo. Intenta de nuevo.', true); }
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
          anuncia(`Pestaña ${tab.textContent.trim()}`);
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
    if (valor === null || valor === undefined) { barra.removeAttribute('value'); if (txt) txt.textContent = 'Cargando…'; return; }
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
      if (cfg.actual) { b.setAttribute('aria-current', 'page'); b.setAttribute('aria-label', `Página ${texto}, actual`); }
      if (cfg.deshabilitado) { b.setAttribute('aria-disabled', 'true'); } else b.dataset.ir = String(ir);
      if (cfg.etiqueta) b.setAttribute('aria-label', cfg.etiqueta);
      li.appendChild(b); return li;
    };
    lista.appendChild(boton('Anterior', pagina - 1, { deshabilitado: pagina === 1, icono: 'flecha-izq', clase: 'paginacion-prev' }));
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
    lista.appendChild(boton(nav.dataset.modo === 'mas' ? 'Cargar más' : 'Siguiente', pagina + 1, { deshabilitado: pagina >= paginas, icono: nav.dataset.modo === 'mas' ? 'mas' : 'flecha-der', clase: 'paginacion-next' }));
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
   llenar el campo (van en la ayuda visible) ni para textos largos.

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

   Contrato HTML:
     <div class="tabla-marco" data-tabla data-clave="folio">
       <table class="tabla"><caption class="tabla-titulo">Solicitudes</caption>
         <thead><tr><th scope="col" data-ordenable>Folio</th>…<th scope="col">Acciones</th></tr></thead>
         <tbody>…<td><button type="button" class="btn-icono" data-accion-fila="ver">…</button></td></tr></tbody>
       </table>
       <p class="tabla-vacia" data-tabla-vacia hidden>No hay resultados con esos filtros.</p>
     </div>
   ========================================================= */
(function () {
  'use strict';
  FormKit.registra('tabla', {
    selector: '[data-tabla]',
    fueraDelFormulario: true,
    iniciar(form, ctx) {
      const { $, $$, anuncia, icono } = ctx;
      for (const marco of $$('[data-tabla]')) {
        const tabla = $('table', marco);
        if (!tabla || marco.dataset.listo !== undefined) continue; /* ya iniciada por otro formulario de la página */
        marco.dataset.listo = '';
        const ths = $$('thead th', tabla);
        const clave = marco.dataset.clave;

        function etiquetaCeldas() {
          for (const tr of $$('tbody tr', tabla)) $$('td', tr).forEach((td, i) => { if (ths[i] && !td.dataset.etiqueta) td.dataset.etiqueta = ths[i].textContent.trim(); });
          /* Acciones por fila: «Ver», no basta; «Ver solicitud 123» sí. */
          for (const tr of $$('tbody tr', tabla)) {
            const id = clave ? (tr.dataset[clave] || ($$('td', tr)[ths.findIndex((t) => t.textContent.trim().toLowerCase() === clave)] || {}).textContent) : '';
            for (const b of $$('[data-accion-fila]', tr)) if (!b.getAttribute('aria-label')) b.setAttribute('aria-label', `${b.textContent.trim() || b.dataset.accionFila} ${id || ''}`.trim());
          }
          const vacio = $('[data-tabla-vacia]', marco);
          if (vacio) vacio.hidden = $$('tbody tr', tabla).length > 0;
        }

        /* Orden por columna: botón dentro del th, aria-sort en el th. */
        ths.forEach((th, i) => {
          if (!th.hasAttribute('data-ordenable')) return;
          const texto = th.textContent.trim();
          th.textContent = '';
          const b = document.createElement('button'); b.type = 'button'; b.className = 'tabla-orden';
          b.append(document.createTextNode(texto), icono('abajo', 'icono icono-sm tabla-orden-icono'));
          th.appendChild(b);
          th.setAttribute('aria-sort', 'none');
          b.addEventListener('click', () => {
            const asc = th.getAttribute('aria-sort') !== 'ascending';
            for (const o of ths) o.setAttribute('aria-sort', o === th ? (asc ? 'ascending' : 'descending') : 'none');
            const filas = $$('tbody tr', tabla);
            const val = (tr) => { const td = $$('td', tr)[i]; const t = td ? td.textContent.trim() : ''; const n = Number(t.replace(/[^\d.-]/g, '')); return t && !Number.isNaN(n) && /^[\d.,\s$-]+$/.test(t) ? n : t.toLowerCase(); };
            filas.sort((a, b2) => { const x = val(a), y = val(b2); return (x > y ? 1 : x < y ? -1 : 0) * (asc ? 1 : -1); });
            const tb = $('tbody', tabla); for (const f of filas) tb.appendChild(f);
            anuncia(`Ordenado por ${texto}, ${asc ? 'ascendente' : 'descendente'}.`);
          });
        });

        etiquetaCeldas();
        marco.addEventListener('formkit:tabla', etiquetaCeldas);
        FormKit.tabla = Object.assign(FormKit.tabla || {}, {
          /* Estados de carga y error: el contenido se oculta y se anuncia qué pasa. */
          estado(m, estado, texto) {
            const car = $('[data-tabla-cargando]', m), err = $('[data-tabla-error]', m), t = $('table', m);
            if (car) car.hidden = estado !== 'cargando';
            if (err) { err.hidden = estado !== 'error'; if (texto) $('.aviso-texto', err).textContent = texto; }
            if (t) t.toggleAttribute('aria-busy', estado === 'cargando');
            if (estado === 'error' && err) err.focus();
          }
        });
      }
    }
  });
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
       configuración lo pide (archivos.conservarExif, decisión C6).
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
   Configuración por campo (opcional): data-extensiones="jpg,png", data-mb,
   data-max, data-total-mb. Lo demás viene de validaciones.config.js.
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
      const formatosTxt = (c) => c.extensiones.map((e) => e.toUpperCase()).join(', ');
      /* Nombre saneado: sin rutas, sin caracteres de control, acotado. */
      const saneaNombre = (n) => String(n || 'archivo').split(/[\\/]/).pop().replace(/[\u0000-\u001F\u007F]/g, '').replace(/\s+/g, ' ').trim().slice(0, A.nombreMax) || 'archivo';
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
            if (opt && opt.blob.size < f.size) { a.blob = opt.blob; a.size = opt.blob.size; a.tipo = 'image/jpeg'; a.optimizada = true; a.dimensiones = `${opt.ancho}x${opt.alto}`; }
            else { a.blob = f; a.optimizada = false; }
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
          a.motivo = err.motivo || 'no se pudo procesar el archivo. Intenta de nuevo.';
          a.archivoOriginal = f;
        }).then(() => { delete a.promesa; pinta(el); if (a.estado === 'listo') limpia(el.dataset.campo); });
      }

      function agrega(archivos, el) {
        const c = configDe(el);
        const lista = archivosPorCampo.get(el);
        const rechazos = [];
        for (const f of archivos) {
          const nombre = saneaNombre(f.name);
          if (lista.filter((x) => x.estado !== 'error').length >= c.max) { rechazos.push({ nombre, motivo: plantilla(M.archRechazoMax, { max: c.max }) }); continue; }
          if (!c.extensiones.includes(ext(f.name))) { rechazos.push({ nombre, motivo: plantilla(M.archRechazoTipo, { formatos: formatosTxt(c) }) }); continue; }
          if (f.size < A.minBytes) { rechazos.push({ nombre, motivo: M.archRechazoVacio }); continue; }
          const esFoto = A.optimiza.tipos.includes(ext(f.name));
          if (!esFoto && f.size > c.mb * BYTES_POR_MB) { rechazos.push({ nombre, motivo: plantilla(M.archRechazoPeso, { peso: pesoTxt(f.size), mb: c.mb }) }); continue; }
          const a = { nombre, size: f.size, original: f.size, tipo: f.type };
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
        if (lim) lim.textContent = plantilla(M.archLimite, { formatos: formatosTxt(c), max: c.max, mb: c.mb });
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

      FormKit.archivos = { de: (el) => archivosPorCampo.get(el) || [], agrega };
    }
  });
}());


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
        textoDe: (el) => { const s = estadoDe.get(el); return s && s.punto ? `${s.punto.lat.toFixed(5)}, ${s.punto.lon.toFixed(5)}` : ''; },
        enBorrador: true,
        restaura: (el, v) => { const s = estadoDe.get(el); if (s && v) { const [lat, lon] = v.split(',').map(Number); s.coloca({ lat, lon }, true); } },
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
        const mapa = L.map(cont, { center: conf.centro, zoom: conf.zoom, gestureHandling: true, gestureHandlingOptions: { text: { touch: 'Usa dos dedos para mover el mapa', scroll: 'Usa Ctrl + rueda para acercar', scrollMac: 'Usa ⌘ + rueda para acercar' } }, zoomControl: true, attributionControl: !!conf.atribucion, tap: true });
        if (mapa.gestureHandling && !mapa.gestureHandling.enabled()) mapa.gestureHandling.enable();
        const limites = bbox ? L.latLngBounds([bbox.latMin, bbox.lonMin], [bbox.latMax, bbox.lonMax]) : null;
        const encuadra = () => { mapa.invalidateSize(); if (s.punto) mapa.setView([s.punto.lat, s.punto.lon], Math.max(mapa.getZoom(), 14)); else if (limites) mapa.fitBounds(limites); };
        if (limites) { mapa.setMaxBounds(limites.pad(0.1)); mapa.fitBounds(limites); }
        if (conf.teselas) L.tileLayer(conf.teselas, { attribution: conf.atribucion, maxZoom: 19 }).on('tileerror', () => { if (sin) sin.hidden = false; }).addTo(mapa);
        else if (sin) { sin.hidden = false; sin.textContent = 'Sin mapa base configurado: puedes colocar y mover el punto igual, o escribir la dirección.'; }
        /* Marcador propio en guinda (SVG en línea): no depende de imágenes externas. */
        const icono = L.divIcon({ className: 'mapa-marcador', html: '<svg viewBox="0 0 24 24" width="32" height="32" aria-hidden="true" focusable="false"><path d="M12 22s-7-7.3-7-12.5a7 7 0 0 1 14 0C19 14.7 12 22 12 22z" fill="currentColor"/><circle cx="12" cy="9.5" r="2.6" fill="#fff"/></svg>', iconSize: [32, 32], iconAnchor: [16, 32] });
        let marcador = null;

        s.coloca = (p, silencioso = false) => {
          s.punto = p; s.confirmado = false;
          if (marcador) marcador.setLatLng([p.lat, p.lon]); else { marcador = L.marker([p.lat, p.lon], { icon: icono, draggable: true, keyboard: true, title: 'Punto marcado; arrástralo para moverlo' }).addTo(mapa); marcador.on('dragend', () => { const ll = marcador.getLatLng(); s.coloca({ lat: ll.lat, lon: ll.lng }); }); }
          s.fuera = !!bbox && (p.lat < bbox.latMin || p.lat > bbox.latMax || p.lon < bbox.lonMin || p.lon > bbox.lonMax);
          if (inLat) inLat.value = p.lat.toFixed(6); if (inLon) inLon.value = p.lon.toFixed(6);
          const texto = plantilla(M.mapaPunto, { lat: p.lat.toFixed(5), lon: p.lon.toFixed(5) });
          if (salida) salida.textContent = s.fuera ? `${texto} ${M.mapaFuera}` : texto;
          if (btnConfirmar) { btnConfirmar.hidden = !s.exigeConfirmar || s.fuera; btnConfirmar.textContent = 'Confirmar punto'; btnConfirmar.removeAttribute('aria-pressed'); }
          if (s.fuera) marca(el.dataset.campo, bbox.mensaje); else limpia(el.dataset.campo);
          if (!silencioso) anuncia(salida ? salida.textContent : texto);
          programaBorrador();
        };

        mapa.on('click', (e) => s.coloca({ lat: e.latlng.lat, lon: e.latlng.lng }));
        /* Teclado: con el mapa enfocado, Enter coloca el punto en el centro; las flechas lo desplazan (Leaflet). */
        cont.addEventListener('keydown', (e) => { if (e.key === 'Enter') { const c = mapa.getCenter(); s.coloca({ lat: c.lat, lon: c.lng }); } });
        if (btnConfirmar) btnConfirmar.addEventListener('click', () => { if (!s.punto) return; s.confirmado = true; btnConfirmar.textContent = 'Punto confirmado'; btnConfirmar.setAttribute('aria-pressed', 'true'); limpia(el.dataset.campo); anuncia('Punto confirmado.'); programaBorrador(); });
        if (btnGeo && cont.hasAttribute('data-geolocalizacion') && navigator.geolocation) {
          btnGeo.hidden = false;
          btnGeo.addEventListener('click', () => { btnGeo.setAttribute('aria-busy', 'true'); navigator.geolocation.getCurrentPosition((pos) => { btnGeo.removeAttribute('aria-busy'); s.coloca({ lat: pos.coords.latitude, lon: pos.coords.longitude }); mapa.setView([pos.coords.latitude, pos.coords.longitude], 16); }, () => { btnGeo.removeAttribute('aria-busy'); anuncia('No se pudo obtener tu ubicación. Toca el mapa o escribe la dirección.', true); }, { timeout: 10000 }); });
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
       «19 99» suele ser parte de una dirección, no coordenadas. */
    m = s.match(/^\(?\s*(-?\d{1,3}[.,]\d+)\s*[,;\s]\s*(-?\d{1,3}[.,]\d+)\s*\)?$/);
    return m ? par(m[1], m[2], 'texto') : null;
  }
  const fmt = (r) => `${r.lat.toFixed(6)}, ${r.lon.toFixed(6)}`;
  FormKit.leeCoordenadas = lee;

  /* ---------- Pantalla ---------- */
  FormKit.registra('enlace-mapa', {
    selector: '[data-enlace-mapa]',
    iniciar(form, ctx) {
      const { $$, anuncia, controlPrincipal } = ctx;
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
          if (!r) return dice('advertencia', 'No encontramos coordenadas en ese texto. Pega el enlace completo de Google Maps (el que empieza con google.com/maps) o escribe las coordenadas.');
          if (r.corto) return dice('advertencia', 'Los enlaces cortos de Google Maps no traen las coordenadas. Ábrelo en Google Maps: en el celular, mantén presionado el punto y copia los números que aparecen; en la computadora, haz clic derecho sobre el punto. Pégalos en «Coordenadas».');
          escribe(r);
          if (r.origen === 'centro') dice('advertencia', `Ese enlace marca el centro de la pantalla, no un punto: tomamos ${fmt(r)}. Revisa que sea el lugar.`);
          else dice('ok', `Coordenadas tomadas del enlace: ${fmt(r)}.`);
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
            r.notas.includes('orden') ? 'se acomodaron latitud y longitud' : '',
            r.notas.includes('menos') ? 'se agregó el signo menos a la longitud, que en la Ciudad siempre es negativa' : ''
          ].filter(Boolean).join(' y ');
          anuncia(`Coordenadas: ${nuevo}${que ? `; ${que}` : ''}.`);
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
     · si el catálogo no carga, se muestra la captura manual (bloque
       data-cascada-manual) y la cascada se oculta.

   Contrato HTML:
     <div data-cascada data-catalogo="cdmx">
       <div class="campo" data-campo="alcaldia" data-requerido>
         <label class="etiqueta" for="alcaldia">Alcaldía</label>
         <div class="select"><select class="control control-select" id="alcaldia" name="alcaldia" data-nivel="alcaldia" autocomplete="address-level2"><option value="">Elige una opción</option></select></div>
       </div>
       <div class="campo" data-campo="colonia" data-requerido>…<select data-nivel="colonia" autocomplete="address-level3">…</div>
       <div class="campo" data-campo="cp" data-formato="cp" data-requerido>…<input data-nivel="cp" autocomplete="postal-code">…</div>
       <div data-cascada-manual hidden>…campos de texto equivalentes…</div>
     </div>
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

        if (!cat || !Array.isArray(cat.filas) || !cat.filas.length) {
          /* Sin catálogo: captura manual y la cascada fuera del camino. */
          for (const c of niveles) campoDe(c).hidden = true;
          if (manual) manual.hidden = false;
          anuncia(M.cascadaSinCatalogo);
          continue;
        }
        const filas = cat.filas;
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
            if (co && co.value && cps.length === 1 && cp.value !== cps[0]) { cp.value = cps[0]; limpia(campoDe(cp).dataset.campo); anuncia(`${etiquetaDe(campoDe(cp).dataset.campo)}: ${cps[0]}, tomado del catálogo. Puedes corregirlo.`); }
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
          if (a && alcs.length === 1 && a.value !== alcs[0]) { a.value = alcs[0]; a.toggleAttribute('data-vacio', false); limpia(campoDe(a).dataset.campo); anuncia(`${etiquetaDe(campoDe(a).dataset.campo)}: ${alcs[0]}, tomada del código postal.`); }
          pinta('cp');
          const cols = unicos(coinciden, 'colonia');
          if (co && cols.length === 1 && co.value !== cols[0]) { co.value = cols[0]; co.toggleAttribute('data-vacio', false); limpia(campoDe(co).dataset.campo); anuncia(`${etiquetaDe(campoDe(co).dataset.campo)}: ${cols[0]}, tomada del código postal.`); }
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
   ========================================================= */
(function () {
  'use strict';
  FormKit.registra('chips', {
    selector: '[data-chips]',
    iniciar(form, ctx) {
      const { $$, cfg, M, plantilla, anuncia, almacen, controlPrincipal, valorDe, validaCampo, icono, programaBorrador } = ctx;
      const clave = (n) => `${cfg.chips.clave}:${form.dataset.borrador || form.id || 'form'}:${n}`;

      for (const campo of $$('[data-chips]', form)) {
        const n = campo.dataset.campo;
        if (campo.hasAttribute('data-finalidad') || campo.hasAttribute('data-sensible')) { console.warn(`FormKit: el campo «${n}» es dato personal; no se guardan sugerencias.`); continue; }
        const ctl = controlPrincipal(n);
        if (!ctl) continue;
        const caja = document.createElement('div');
        caja.className = 'chips';
        caja.setAttribute('role', 'group');
        caja.setAttribute('aria-label', `Usados antes en ${ctx.etiquetaDe(n).toLowerCase()}`);
        ctl.closest('.select,.combo,.control-grupo,.fecha-grupo') ? ctl.closest('.select,.combo,.control-grupo,.fecha-grupo').insertAdjacentElement('beforebegin', caja) : ctl.insertAdjacentElement('beforebegin', caja);

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
          if (q) { escribe(lee().filter((v) => v !== q.dataset.chipQuitar)); pinta(); anuncia(`Sugerencia quitada.`); return; }
          if (e.target.closest('[data-chips-borrar]')) { almacen.borra(clave(n)); pinta(); anuncia('Historial borrado.'); ctl.focus(); return; }
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
