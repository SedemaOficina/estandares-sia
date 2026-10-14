/* =========================================================
   guia.js · Guion de la guía visual de geovisores

   Arma lo que se deriva de los valores reales de las hojas (paleta, tabla de
   contraste, contraste por mapa base, rampas con daltonismo, nombres,
   medidas, capas y temas) para que la guía no pueda quedar atrasada respecto
   al CSS: lo que se muestra se lee de la hoja cargada. También mueve la
   muestra del mapa: capa de datos, menú de capas, mapa base, opacidad y
   crédito. Las fórmulas de contraste, daltonismo y ΔE son las
   mismas de herramientas/color.mjs; las pruebas exigen que den lo mismo.

   La lista de tokens y su función es DOCUMENTACIÓN escrita a mano; una prueba
   exige que no falte ningún token de color de tokens-mapa.css.
   ========================================================= */
(function () {
  'use strict';

  const raiz = document.documentElement;
  /* La copia publicada como página independiente recibe un esqueleto sin lang (GEO-110). */
  if (!raiz.lang) raiz.lang = 'es-MX';
  const crea =(etiqueta, clase, texto) => {
    const el = document.createElement(etiqueta);
    if (clase) el.className = clase;
    if (texto !== undefined) el.textContent = texto;
    return el;
  };
  const SVG = 'http://www.w3.org/2000/svg';
  const creaSvg = (etiqueta, atributos) => {
    const el = document.createElementNS(SVG, etiqueta);
    for (const [k, v] of Object.entries(atributos || {})) el.setAttribute(k, v);
    return el;
  };

  /* Valores con un tema aplicado: una sonda invisible con data-tema hereda
     los tokens de ese bloque. */
  const sondas = new Map();
  function valor(token, tema) {
    const k = tema || '';
    if (!sondas.has(k)) {
      const s = crea('span');
      s.hidden = true;
      if (tema) s.dataset.tema = tema;
      document.body.appendChild(s);
      sondas.set(k, s);
    }
    return getComputedStyle(sondas.get(k)).getPropertyValue(token).trim();
  }

  /* ----- Contraste (WCAG 2.2) ----- */
  function hexARgb(hex) {
    let h = hex.replace('#', '').trim();
    if (h.length === 3) h = [...h].map((c) => c + c).join('');
    return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  }
  const lineal = (v) => { const c = v / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
  const luminancia = ([r, g, b]) => 0.2126 * lineal(r) + 0.7152 * lineal(g) + 0.0722 * lineal(b);
  function razon(a, b) {
    const la = luminancia(hexARgb(a)); const lb = luminancia(hexARgb(b));
    return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
  }

  /* ----- Daltonismo (Machado 2009) y ΔE CIE76 ----- */
  const MACHADO = {
    protanopia: [[0.152286, 1.052583, -0.204868], [0.114503, 0.786281, 0.099216], [-0.003882, -0.048116, 1.051998]],
    deuteranopia: [[0.367322, 0.860646, -0.227968], [0.280085, 0.672501, 0.047413], [-0.011820, 0.042940, 0.968881]],
    tritanopia: [[1.255528, -0.076749, -0.178779], [-0.078411, 0.930809, 0.147602], [0.004733, 0.691367, 0.303900]]
  };
  function simulaLineal(hex, condicion) {
    const rgb = hexARgb(hex).map(lineal);
    if (!condicion) return rgb;
    return MACHADO[condicion].map((f) => Math.min(1, Math.max(0, f[0] * rgb[0] + f[1] * rgb[1] + f[2] * rgb[2])));
  }
  const aSrgb = (c) => { const v = Math.min(1, Math.max(0, c)); return v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055; };
  const simulaHex = (hex, condicion) => '#' + simulaLineal(hex, condicion).map((c) => Math.round(aSrgb(c) * 255).toString(16).padStart(2, '0')).join('');
  function lab([r, g, b]) {
    const X = (0.4124564 * r + 0.3575761 * g + 0.1804375 * b) / 0.95047;
    const Y = 0.2126729 * r + 0.7151522 * g + 0.0721750 * b;
    const Z = (0.0193339 * r + 0.1191920 * g + 0.9503041 * b) / 1.08883;
    const f = (t) => (t > 216 / 24389 ? Math.cbrt(t) : (24389 / 27 * t + 16) / 116);
    return [116 * f(Y) - 16, 500 * (f(X) - f(Y)), 200 * (f(Y) - f(Z))];
  }
  function deltaE(a, b, condicion) {
    const p = lab(simulaLineal(a, condicion)); const q = lab(simulaLineal(b, condicion));
    return Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]);
  }
  const VISIONES = [[null, 'Visión típica'], ['protanopia', 'Protanopia'], ['deuteranopia', 'Deuteranopia'], ['tritanopia', 'Tritanopia']];
  const MIN_VECINAS = 15;
  const MIN_EXTREMOS = 50;

  /* Lo que la hoja declara (para decir «es --blanco»). Desde file:// algunos
     navegadores no dejan leer las reglas de la hoja: entonces no se dice. */
  const declarado = {};
  try {
    for (const hoja of document.styleSheets) {
      if (!/tokens-mapa\.css$/.test(hoja.href || '')) continue;
      for (const regla of hoja.cssRules) if (regla.selectorText === ':root') for (const p of regla.style) declarado[p] = regla.style.getPropertyValue(p).trim();
    }
  } catch (e) { /* hoja no legible desde file://: la paleta se muestra sin alias */ }

  /* ----- Muestra del mapa ----- */
  const mapa = document.getElementById('guia-mapa');

  /* Capa de datos: ninguna, prioridad o verdor. */
  const VISTAS = {
    fondo: null,
    rampa: { titulo: 'Prioridad', extremos: 'Muy baja … Muy alta', nota: 'Cambia la opacidad de las colonias por prioridad.' },
    verdor: { titulo: 'Verdor', extremos: 'Menos … Más verdor', nota: 'Cambia la opacidad de las colonias por verdor.' }
  };
  const opacidad = document.getElementById('guia-opacidad');
  const opacidadValor = document.getElementById('guia-opacidad-valor');
  const opacidadNota = document.getElementById('guia-opacidad-nota');
  const notaSinCapa = opacidadNota.textContent;
  const botonesVista = document.querySelectorAll('#muestra [data-vista]:not(#guia-mapa)');
  for (const b of botonesVista) b.addEventListener('click', () => {
    const v = VISTAS[b.dataset.vista];
    mapa.dataset.vista = b.dataset.vista;
    for (const o of botonesVista) o.setAttribute('aria-pressed', String(o === b));
    document.getElementById('guia-simbologia-fondo').hidden = Boolean(v);
    document.getElementById('guia-simbologia-rampa').hidden = !v;
    if (v) {
      document.getElementById('guia-simbologia-titulo').textContent = v.titulo;
      document.getElementById('guia-simbologia-extremos').textContent = v.extremos;
    }
    opacidad.disabled = !v;
    opacidadNota.textContent = v ? v.nota : notaSinCapa;
  });

  /* Opacidad de la capa de datos (GEO-33): de 20 a 100 %, con el valor
     escrito. Solo cambia las colonias; límites, nombres y puntos no. */
  const capaDatos = document.getElementById('guia-capa-datos');
  opacidad.addEventListener('input', () => {
    const texto = `${opacidad.value} %`;
    capaDatos.setAttribute('opacity', String(opacidad.value / 100));
    opacidadValor.textContent = texto;
    opacidad.setAttribute('aria-valuetext', texto);
  });

  /* Mapa base y su crédito. Los mapas base distintos del fondo propio son
     dibujos: la guía no pide teselas a ningún servidor. */
  const CREDITOS = {
    propio: 'Manzanas: Catastro CDMX · ',
    claro: '© OSM · © CARTO · ',
    satelital: 'Imagen: Esri, Vantor, Earthstar Geographics y GIS User Community · Powered by Esri · ',
    ninguno: ''
  };
  const creditoBase = document.getElementById('guia-credito-base');
  const botonCapas = document.getElementById('guia-boton-capas');
  const menuCapas = document.getElementById('guia-menu-capas');
  let conPuntero = false;
  function abreMenu(abrir) {
    menuCapas.hidden = !abrir;
    botonCapas.setAttribute('aria-expanded', String(abrir));
    if (abrir) menuCapas.querySelector('input[name="guia-base"]:checked').focus();
  }
  botonCapas.addEventListener('click', () => abreMenu(menuCapas.hidden));
  menuCapas.addEventListener('pointerdown', () => { conPuntero = true; });
  menuCapas.addEventListener('keydown', () => { conPuntero = false; });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !menuCapas.hidden) { e.preventDefault(); abreMenu(false); botonCapas.focus(); }
  });
  for (const r of menuCapas.querySelectorAll('input[name="guia-base"]')) r.addEventListener('change', () => {
    mapa.dataset.base = r.value;
    creditoBase.textContent = CREDITOS[r.value];
    /* Con el ratón o el dedo, elegir el fondo cierra el menú (GEO-33); con
       el teclado no, porque las flechas cambian la opción a cada paso. */
    if (conPuntero) { abreMenu(false); botonCapas.focus(); }
  });
  document.addEventListener('pointerdown', (e) => {
    if (!menuCapas.hidden && !menuCapas.contains(e.target) && !botonCapas.contains(e.target)) abreMenu(false);
  });

  /* ----- Paleta ----- */
  const GRUPOS = [
    ['Fondo propio', [
      ['--mapa-suelo', 'Suelo dentro de la ciudad.'],
      ['--mapa-manzana', 'Manzanas, desde zoom 13–14.'],
      ['--mapa-verde', 'Parques y áreas verdes.'],
      ['--mapa-agua', 'Cuerpos de agua.'],
      ['--mapa-calle', 'Calles.'],
      ['--mapa-fuera', 'Fuera de la ciudad.']
    ]],
    ['Líneas y nombres', [
      ['--mapa-halo', 'Franja bajo los límites y contorno de los nombres.'],
      ['--mapa-limite-alcaldia', 'Límite de alcaldía.'],
      ['--mapa-limite-colonia', 'Límite de colonia.'],
      ['--mapa-nombre-fuerte', 'Nombre de alcaldía.'],
      ['--mapa-nombre', 'Nombre de colonia y de calle.']
    ]],
    ['Lo elegido, lo señalado y la ubicación', [
      ['--mapa-elegido', 'Contorno de lo elegido. Nunca relleno.'],
      ['--mapa-resalte', 'Línea al pasar el puntero. Nunca texto.'],
      ['--mapa-buscado', 'Marcador del lugar buscado.'],
      ['--mapa-aro', 'Aro oscuro de los puntos claros.'],
      ['--mapa-ubicacion', 'Punto de «mi ubicación» y su círculo. Nada más.'],
      ['--mapa-sin-dato', 'Área o punto sin dato. No es «cero».']
    ]],
    ['Crédito del mapa', [
      ['--mapa-credito', 'Texto del crédito.'],
      ['--mapa-credito-bg', 'Fondo sólido del crédito.']
    ]],
    ['Rampa de prioridad', [
      ['--rampa-prioridad-1', 'Clase 1 · texto oscuro encima.'],
      ['--rampa-prioridad-2', 'Clase 2 · texto oscuro encima.'],
      ['--rampa-prioridad-3', 'Clase 3 · texto oscuro encima.'],
      ['--rampa-prioridad-4', 'Clase 4 · texto blanco encima.'],
      ['--rampa-prioridad-5', 'Clase 5 · texto blanco encima.']
    ]],
    ['Rampa de verdor', [
      ['--rampa-verdor-1', 'Clase 1 · texto oscuro encima.'],
      ['--rampa-verdor-2', 'Clase 2 · texto oscuro encima.'],
      ['--rampa-verdor-3', 'Clase 3 · texto oscuro encima.'],
      ['--rampa-verdor-4', 'Clase 4 · texto blanco encima.'],
      ['--rampa-verdor-5', 'Clase 5 · texto blanco encima.']
    ]],
    ['Tema (valores institucionales)', [
      ['--tema-marca', 'Títulos y marca.'],
      ['--tema-marca-cl', 'Fondo tenue de marca.'],
      ['--tema-ficha', 'Superficie de la ficha.'],
      ['--tema-ficha-texto', 'Texto de la ficha.']
    ]]
  ];
  const paleta = document.getElementById('guia-paleta');
  for (const [titulo, tokens] of GRUPOS) {
    const g = crea('div', 'guia-grupo');
    g.appendChild(crea('h3', 'guia-grupo-titulo', titulo));
    const m = crea('div', 'guia-muestras');
    for (const [token, funcion] of tokens) {
      const f = crea('div', 'guia-ficha');
      const muestra = crea('div', 'guia-muestra');
      muestra.style.background = `var(${token})`;
      const alias = (declarado[token] || '').match(/^var\((--[\w-]+)\)$/);
      f.append(muestra, crea('span', 'guia-nombre', token), crea('span', 'guia-hex', valor(token) + (alias ? ` · es ${alias[1]}` : '')), crea('span', 'guia-funcion', funcion));
      m.appendChild(f);
    }
    g.appendChild(m);
    paleta.appendChild(g);
  }

  /* ----- Tabla de contraste ----- */
  const cuerpo = document.querySelector('#guia-tabla-contraste tbody');
  let fallan = 0; let pendientes = 0;
  for (const p of window.GUIA_PARES) {
    const texto = valor(p.texto, p.tema); const fondo = valor(p.fondo, p.tema);
    const r = razon(texto, fondo);
    const exigido = p.minimo !== null;
    const cumple = !exigido || r >= p.minimo;
    let estado = !exigido ? 'informativo' : cumple ? 'cumple' : 'falla';
    if (p.pendiente) estado = cumple ? 'falla' : 'pendiente';
    if (estado === 'falla') fallan++;
    if (estado === 'pendiente') pendientes++;
    const tr = document.createElement('tr');
    tr.dataset.par = p.id;
    tr.dataset.razon = r.toFixed(2);
    /* Un par de texto se muestra con texto; uno de línea o aro, como una
       línea sobre su fondo. */
    const muestra = crea('span', 'guia-par-muestra');
    if (p.tema) muestra.dataset.tema = p.tema;
    muestra.style.background = `var(${p.fondo})`;
    if (p.id.startsWith('MC')) { muestra.textContent = 'Aa'; muestra.style.color = `var(${p.texto})`; }
    else { muestra.setAttribute('aria-hidden', 'true'); const l = crea('span', 'guia-par-linea'); l.style.background = `var(${p.texto})`; muestra.appendChild(l); }
    const resultado = crea('span', 'guia-resultado', { cumple: 'Cumple', falla: 'No cumple', informativo: 'Informativo', pendiente: 'Pendiente de decisión' }[estado]);
    resultado.dataset.estado = estado;
    const donde = crea('span', '', p.donde);
    const celdaDonde = crea('span');
    celdaDonde.appendChild(donde);
    if (p.pendiente) celdaDonde.appendChild(crea('span', 'guia-nota-pendiente', p.pendiente));
    const celdas = [p.id, muestra, `${p.tema ? `[${p.tema}] ` : ''}${p.texto} ${texto} sobre ${p.fondo} ${fondo}`, `${r.toFixed(2)}:1`, exigido ? `${p.minimo}:1` : '—', resultado, celdaDonde];
    for (const c of celdas) {
      const td = document.createElement('td');
      if (typeof c === 'string') td.textContent = c; else td.appendChild(c);
      tr.appendChild(td);
    }
    cuerpo.appendChild(tr);
  }
  document.getElementById('guia-resumen-contraste').textContent =
    `${window.GUIA_PARES.length} pares medidos: ${fallan ? `${fallan} no cumplen` : 'todos los exigidos cumplen'}${pendientes ? `, salvo ${pendientes} pendiente${pendientes > 1 ? 's' : ''} de decisión` : ''}.`;

  /* ----- Rampas ----- */
  const rampas = document.getElementById('guia-rampas');
  const sinDato = valor('--mapa-sin-dato');
  function clasesDe(nombre) {
    const lista = [];
    for (let i = 1; valor(`--rampa-${nombre}-${i}`); i++) lista.push(valor(`--rampa-${nombre}-${i}`));
    return lista;
  }
  function pintaRampa(titulo, colores, nota, marca) {
    const caja = crea('div', 'guia-rampa');
    caja.dataset.rampa = titulo;
    caja.appendChild(crea('h3', 'rotulo', titulo));
    if (marca) caja.appendChild(crea('p', 'pendiente', marca));
    let todoCumple = true;
    for (const [condicion, nombre] of VISIONES) {
      const vecinas = colores.slice(1).map((c, i) => deltaE(colores[i], c, condicion));
      const extremos = deltaE(colores[0], colores[colores.length - 1], condicion);
      const aSinDato = Math.min(...colores.map((c) => deltaE(sinDato, c, condicion)));
      const cumple = Math.min(...vecinas) >= MIN_VECINAS && extremos >= MIN_EXTREMOS;
      todoCumple = todoCumple && cumple;
      const fila = crea('div', 'guia-rampa-fila');
      fila.dataset.vision = nombre;
      fila.dataset.minimo = Math.min(...vecinas).toFixed(1);
      fila.dataset.extremos = extremos.toFixed(1);
      fila.dataset.sinDato = aSinDato.toFixed(1);
      const clases = crea('div', 'guia-rampa-clases');
      clases.setAttribute('aria-hidden', 'true');
      for (const c of colores) { const celda = crea('span', 'guia-rampa-celda'); celda.style.background = simulaHex(c, condicion); clases.appendChild(celda); }
      const sd = crea('span', 'guia-rampa-sin');
      sd.setAttribute('aria-hidden', 'true');
      sd.style.background = simulaHex(sinDato, condicion);
      fila.append(crea('span', 'guia-rampa-vision', nombre), clases, sd,
        crea('span', 'guia-rampa-de', `vecinas ${vecinas.map((d) => d.toFixed(1)).join(' · ')} · mínimo ${Math.min(...vecinas).toFixed(1)} · extremos ${extremos.toFixed(1)} · «sin dato» a ${aSinDato.toFixed(1)} · ${cumple ? 'cumple' : 'no cumple'}`));
      caja.appendChild(fila);
    }
    const pie = crea('p', 'guia-pie', `${todoCumple ? 'Cumple con las cuatro visiones.' : 'No cumple.'} ${nota}`);
    caja.appendChild(pie);
    rampas.appendChild(caja);
  }
  /* Contraste del texto sobre cada clase: oscuro o blanco, el que llegue a
     4.5:1 (GEO-68, GEO-69). */
  function textoSobre(colores) {
    return colores.map((c, i) => {
      const oscuro = razon(valor('--texto'), c); const blanco = razon(valor('--blanco'), c);
      return `clase ${i + 1}: ${oscuro >= blanco ? `oscuro ${oscuro.toFixed(2)}` : `blanco ${blanco.toFixed(2)}`}:1`;
    }).join(' · ');
  }
  const prioridad = clasesDe('prioridad');
  pintaRampa('Prioridad · tokens-mapa.css (PR y PL)', prioridad, `Texto encima: ${textoSobre(prioridad)}.`);
  const verdor = clasesDe('verdor');
  pintaRampa('Verdor · tokens-mapa.css (GA)', verdor,
    `Texto encima: ${textoSobre(verdor)}. Es la rampa «verde continuo» de GA, aprobada por la Secretaría.`);
  /* Verdor anterior de GA, que se midió y no entra. Se muestra para que se
     vea por qué hizo falta cambiarlo. */
  pintaRampa('Verdor anterior de GA · no entra', ['#E3ECDF', '#C3D9BC', '#97BE8E', '#6A9E62', '#3E6B48'],
    'Las clases 1 y 2 quedan por debajo de 15 aun con visión típica, y sobre la clase 4 ningún texto de formularios llega a 4.5:1.');

  /* ----- Nombres del mapa ----- */
  const nombres = document.getElementById('guia-nombres');
  const FONDOS = [['suelo', 'Suelo'], ['manzana', 'Manzana'], ['verde', 'Área verde'], ['agua', 'Agua'], ['rampa-3', 'Prioridad, clase 3'], ['rampa-5', 'Prioridad, clase 5'], ['satelital', 'Fondo oscuro de muestra, con el halo de la satelital']];
  for (const [fondo, rotulo] of FONDOS) {
    const caja = crea('div', 'guia-fondo');
    caja.dataset.fondo = fondo === 'satelital' ? 'blanco' : fondo;
    caja.appendChild(crea('span', '', rotulo));
    const svg = creaSvg('svg', { class: 'guia-etiquetas', 'aria-hidden': 'true', focusable: 'false' });
    if (fondo === 'satelital') {
      /* No es una tesela real: un fondo oscuro para ver el filtro de halo
         que se aplica a todo lo que va sobre la satelital (GEO-79). */
      svg.appendChild(creaSvg('rect', { class: 'g-oscuro', x: 0, y: 0, width: '100%', height: '100%' }));
      const grupo = creaSvg('g', { class: 'g-satelital' });
      grupo.appendChild(creaSvg('path', { class: 'g-lim-col', d: 'M8,70 L200,40', 'stroke-width': 2 }));
      grupo.appendChild(creaSvg('circle', { class: 'g-punto', cx: 40, cy: 30, r: 7, 'stroke-width': 1.5 }));
      svg.appendChild(grupo);
      const t = creaSvg('text', { class: 'g-nombre', x: 70, y: 34 }); t.textContent = 'Roma Norte'; svg.appendChild(t);
    } else {
      const a = creaSvg('text', { class: 'g-nombre g-nombre-fuerte', x: 8, y: 26 }); a.textContent = 'CUAUHTÉMOC';
      const c = creaSvg('text', { class: 'g-nombre', x: 8, y: 54 }); c.textContent = 'Roma Norte';
      const k = creaSvg('text', { class: 'g-nombre g-nombre-calle', x: 8, y: 82 }); k.textContent = 'Av. Álvaro Obregón';
      svg.append(a, c, k);
    }
    caja.appendChild(svg);
    nombres.appendChild(caja);
  }
  const escalaNombres = document.getElementById('guia-escala-nombres');
  escalaNombres.appendChild(crea('h3', 'rotulo', 'Tamaños de los nombres'));
  for (const [token, uso] of [
    ['--mapa-nombre-alcaldia', 'Alcaldía · Cabin 700'],
    ['--mapa-nombre-alcaldia-lejos', 'Alcaldía a escala de ciudad · Cabin 700'],
    ['--mapa-nombre-colonia', 'Colonia · Roboto 500'],
    ['--mapa-nombre-calle', 'Calle · Roboto 500'],
    ['--mapa-nombre-contorno', 'Ancho del contorno en pantalla']
  ]) {
    const f = crea('div', 'guia-medida-fila');
    f.append(crea('span', 'guia-medida-nombre', `${token} ${valor(token)}`), crea('span', '', uso));
    escalaNombres.appendChild(f);
  }

  /* ----- Medidas ----- */
  const medidas = document.getElementById('guia-medidas');
  const bloque = (titulo, filas) => {
    medidas.appendChild(crea('h3', 'rotulo', titulo));
    for (const [token, pinta, nota] of filas) {
      const f = crea('div', 'guia-medida-fila');
      f.append(crea('span', 'guia-medida-nombre', `${token} ${valor(token)}`), pinta(token));
      if (nota) f.appendChild(crea('span', 'guia-funcion', nota));
      medidas.appendChild(f);
    }
  };
  const caja = (t) => { const c = crea('div', 'guia-caja', valor(t)); c.style.width = `var(${t})`; c.style.height = `var(${t})`; return c; };
  const barra = (t) => { const b = crea('div', 'guia-barra'); b.style.width = `var(${t})`; return b; };
  const nada = () => crea('span');
  bloque('Botones del mapa', [
    ['--ctrl-mapa', caja, 'Con ratón (PR, CP).'],
    ['--objetivo-min', caja, 'Con el dedo: el mínimo táctil de formularios.'],
    ['--ctrl-mapa-icono', (t) => { const s = creaSvg('svg', { class: 'guia-ctrl-icono g-icono', viewBox: '0 0 24 24', 'aria-hidden': 'true' }); s.appendChild(creaSvg('path', { d: 'M3 11l9-7 9 7M5 10v10h5v-6h4v6h5V10' })); return s; }, 'Ícono de línea; trazo de --ctrl-mapa-trazo (GA).']
  ]);
  bloque('Panel, ficha y simbología', [
    ['--panel-ancho', barra, 'Panel desde 1024 px.'],
    ['--panel-ancho-medio', barra, 'Panel de 760 a 1023 px.'],
    ['--ficha-ancho', barra, 'Tarjeta de la ficha en computadora.'],
    ['--cajon-ancho', barra, 'Cajón lateral para fichas largas.'],
    ['--simbologia-ancho-max', barra, 'Ancho máximo de la simbología.']
  ]);
  bloque('Deslizador de opacidad (PL)', [
    ['--deslizador-barra', () => { const d = crea('div', 'guia-deslizador'); d.append(crea('span', 'guia-deslizador-barra'), crea('span', 'guia-deslizador-boton')); return d; }, 'Barra de 8 px, botón de 28 y área táctil de 44 (línea punteada).'],
    ['--deslizador-boton', nada]
  ]);
  bloque('Movimiento', [
    ['--dur-pantalla', nada, 'Cambio entre las dos pantallas del celular.'],
    ['--dur-vuelo', nada, 'Vuelo del mapa; 0 con movimiento reducido.']
  ]);

  /* ----- Capas ----- */
  const cuerpoCapas = document.querySelector('#guia-tabla-capas tbody');
  for (const [token, que, de] of [
    ['--z-base', 'El mapa, aislado con isolation: isolate', 'formularios'],
    ['--z-mapa-simbologia', 'Simbología, escala y crédito', 'mapa'],
    ['--z-mapa-control', 'Columna de botones y tarjeta del lugar', 'mapa'],
    ['--z-pantalla', 'Pantalla de información en el celular', 'mapa'],
    ['--z-cargando', 'Aviso de carga', 'mapa'],
    ['--z-ficha', 'Ficha', 'mapa'],
    ['--z-aviso', 'Avisos', 'mapa'],
    ['--z-lista', 'Listas desplegables del buscador', 'formularios'],
    ['--z-barra', 'Barra fija', 'formularios']
  ]) {
    const tr = document.createElement('tr');
    for (const c of [token, valor(token), que, de]) tr.appendChild(crea('td', '', c));
    cuerpoCapas.appendChild(tr);
  }

  /* ----- Temas ----- */
  const temas = document.getElementById('guia-temas');
  for (const [tema, nombre, origen] of [
    [null, 'Institucional', 'Los valores de formularios. Sin data-tema.'],
    ['hoja', 'Hoja', 'Guardianes de árboles (GA).'],
    ['jacaranda', 'Jacarandá', 'Árboles patrimoniales (AP).'],
    ['crema', 'Crema', 'Categorías de protección ambiental (CP).']
  ]) {
    const t = crea('figure', 'guia-tema');
    if (tema) t.dataset.tema = tema;
    const ficha = crea('div', 'guia-tema-ficha');
    const enlace = crea('a', 'guia-tema-enlace', 'Ver en el mapa');
    enlace.href = '#temas';
    const boton = crea('button', 'btn btn-primario', 'Acción principal');
    boton.type = 'button';
    ficha.append(crea('strong', 'guia-tema-ficha-titulo', 'Ficha del elemento'), crea('span', '', 'Texto de la ficha.'), enlace, boton);
    t.append(crea('p', 'guia-tema-titulo', nombre), crea('span', 'guia-tema-chip', 'Marca tenue'), ficha, crea('figcaption', 'guia-pie', origen));
    /* Ficha siempre clara (D11): el azul y la marca llegan a 4.5:1 sobre ella. */
    const rAzul = razon(valor('--azul', tema), valor('--tema-ficha', tema));
    const rMarca = razon(valor('--tema-marca', tema), valor('--tema-ficha', tema));
    const medida = crea('p', 'guia-pie', `Sobre la ficha: enlace azul ${rAzul.toFixed(2)}:1 · título y franja de marca ${rMarca.toFixed(2)}:1.`);
    medida.dataset.azul = rAzul.toFixed(2);
    t.appendChild(medida);
    if (rAzul < 4.5 || rMarca < 4.5) t.appendChild(crea('p', 'pendiente', 'Esta ficha no cumple D11: debe ser clara, con el azul y la marca a 4.5:1 o más.'));
    temas.appendChild(t);
  }

  /* ----- Contraste sobre cada mapa base ----- */
  const BASES_CONTRASTE = [
    ['Cualquier mapa base', 'Lo que va sobre su franja o su contorno blanco: nombres, límites, lo elegido, «mi ubicación», el lugar buscado y el foco', ['MC06', 'MN01', 'MN02', 'MN11', 'MN12', 'MN13', 'MN18']],
    ['Fondo propio', 'Nombres, lo elegido, aros y foco sobre suelo, manzana, área verde y agua', ['MC01', 'MC02', 'MC03', 'MC04', 'MC05', 'MN03', 'MN04', 'MN05', 'MN06', 'MN07', 'MN08', 'MN09', 'MN10', 'MN15', 'MN16', 'MN17']],
    ['Sin mapa base', 'Nombres, lo elegido, aros y foco sobre el gris de formularios', ['MC39', 'MN20', 'MN21', 'MN22']],
    ['Calles claras de un proveedor', 'Los colores del proveedor no están en las fuentes del estándar', []],
    ['Satelital', 'Una foto no tiene un solo color de fondo: todo lo de encima lleva halo blanco (GEO-79)', []]
  ];
  const cuerpoBases = document.querySelector('#guia-tabla-bases-contraste tbody');
  let basesMedidas = 0;
  for (const [base, que, ids] of BASES_CONTRASTE) {
    const pares = window.GUIA_PARES.filter((p) => ids.includes(p.id));
    const tr = document.createElement('tr');
    tr.dataset.base = base;
    const celdas = [base, que];
    if (pares.length) {
      const razones = pares.map((p) => ({ p, r: razon(valor(p.texto, p.tema), valor(p.fondo, p.tema)) }));
      const peor = razones.reduce((a, b) => (b.r / b.p.minimo < a.r / a.p.minimo ? b : a));
      const todos = razones.every((x) => x.r >= x.p.minimo);
      basesMedidas++;
      celdas.push(ids.join(', '), `${peor.r.toFixed(2)}:1 (${peor.p.id}, mínimo ${peor.p.minimo}:1)`, todos ? 'Cumple' : 'No cumple');
    } else {
      const pendiente = crea('span', 'pendiente', 'Pendiente: medir con píxeles de teselas reales (fase 2)');
      celdas.push('—', '—', pendiente);
    }
    for (const c of celdas) {
      const td = document.createElement('td');
      if (typeof c === 'string') td.textContent = c; else td.appendChild(c);
      tr.appendChild(td);
    }
    cuerpoBases.appendChild(tr);
  }
  document.getElementById('guia-resumen-bases').textContent =
    `Medido aquí, con los pares de la tabla de contraste: ${basesMedidas} de ${BASES_CONTRASTE.length} filas. Lo que va sobre su franja o su contorno vale sobre cualquier mapa base, también los dibujados.`;

  /* ----- Componentes ----- */
  const cuerpoComp = document.querySelector('#guia-tabla-componentes tbody');
  for (const [nombre, reglas, de, fase] of [
    ['Columna de botones del mapa', 'GEO-27, GEO-28', 'GA, PR, CP', 'Fase 2'],
    ['Menú de capas: mapa base, capas y opacidad', 'GEO-33', 'CP, PL, PR', 'Fase 2'],
    ['Simbología', 'GEO-35', 'GA, PR', 'Fase 2'],
    ['Escala, norte y crédito', 'GEO-36, GEO-37', 'GA, PR, PL', 'Fase 2'],
    ['Tarjeta del lugar', 'GEO-38', 'GA, PR', 'Fase 2'],
    ['Dos pantallas del celular', 'GEO-17, GEO-18', 'GA, PR', 'Fase 2'],
    ['Mapa en página con dos dedos', 'GEO-19', 'CP, PL', 'Fase 2'],
    ['Ficha', 'GEO-49 a GEO-51', 'GA, CP', 'Fase 2'],
    ['Buscador', 'GEO-44, GEO-45', 'GA, PR, CP', 'Fase 2'],
    ['Lista', 'GEO-46', 'GA, PR', 'Fase 2'],
    ['Mi ubicación', 'GEO-31', 'GA, AP', 'Fase 2'],
    ['Marcador y captura del punto', 'GEO-32, GEO-75', 'PL, EF', 'Fase 2'],
    ['Vista a 390 px de la plantilla', 'GEO-121', 'Plantilla de la fase 2', 'Fase 2'],
    ['Etiquetas con colocador propio', 'GEO-78', 'PR', 'Fase 3'],
    ['Dedos fantasma', 'GEO-104', 'GA, PR', 'Fase 3']
  ]) {
    const tr = document.createElement('tr');
    for (const c of [nombre, reglas, de]) tr.appendChild(crea('td', '', c));
    const td = document.createElement('td');
    td.appendChild(crea('span', 'pendiente', fase));
    tr.appendChild(td);
    cuerpoComp.appendChild(tr);
  }

  raiz.dataset.listo = 'si';
}());
