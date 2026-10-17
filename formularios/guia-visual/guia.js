/* =========================================================
   guia.js · Lógica de la guía visual (NO viaja con el paquete)

   Dibuja la guía a partir de las MISMAS fuentes que usa un formulario:
     · tokens.css leídos con getComputedStyle (paleta, escala, medidas);
     · guia-visual/pares.js (pares de contraste medidos) y manifiesto.js
       (generados por herramientas/);
     · validaciones.config.js (probador) y los módulos reales (fichas vivas).
   Nada aquí redefine el estándar: si cambia un token o un módulo, cambia la
   guía. Las muestras se clonan de <template data-demo> y se inician con
   FormKit.iniciar; su HTML se muestra tal cual para copiar.

   Orden: utilidades → árbol de decisión → fundamentos → fichas (núcleo y
   módulos) → probador → sí y no → ejemplos → navegación → arranque.
   ========================================================= */
(function () {
  'use strict';
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const MAN = window.GUIA_MANIFIESTO;
  const PARES = window.GUIA_PARES || [];
  const V = window.FORMKIT_VALIDACIONES;
  const cfg = FormKit.config;
  const estilo = getComputedStyle(document.documentElement);
  const token = (n) => estilo.getPropertyValue(n).trim();
  const el = (tag, attrs = {}, hijos = []) => {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) { if (v === undefined || v === null || v === false) continue; if (k === 'texto') e.textContent = v; else if (k === 'html') e.innerHTML = v; else if (k === 'clase') e.className = v; else e.setAttribute(k, v === true ? '' : v); }
    for (const h of [].concat(hijos)) if (h !== null && h !== undefined) e.append(h);
    return e;
  };
  const badge = (nivel) => el('span', { clase: 'guia-nivel-badge', 'data-nivel': nivel, texto: nivel });
  const icono = (n, clase = 'icono') => FormKit.icono(n, clase);
  const texto = (s) => document.createTextNode(s);
  /* Sangra el HTML de una plantilla para mostrarlo: quita la sangría común y las líneas vacías de los extremos. */
  function codigoDe(tpl) {
    const lineas = tpl.innerHTML.replace(/\r/g, '').split('\n').filter((l, i, arr) => !((i === 0 || i === arr.length - 1) && !l.trim()));
    const sangria = Math.min(...lineas.filter((l) => l.trim()).map((l) => l.match(/^\s*/)[0].length));
    return lineas.map((l) => l.slice(sangria)).join('\n').trim();
  }
  const toast = $('[data-toast]');
  let toastT = 0;
  function avisa(txt) { if (!toast) return; toast.textContent = txt; toast.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => { toast.hidden = true; }, cfg.borrador.visibleMs * 2); }

  for (const v of $$('[data-version]')) v.textContent = MAN.version;

  /* ---------- Árbol de decisión ---------- */
  const modulosPorNombre = Object.fromEntries(MAN.modulos.map((m) => [m.nombre, m]));
  function conDependencias(nombres) {
    const out = new Set();
    const mete = (n) => { if (out.has(n) || !modulosPorNombre[n]) return; for (const d of modulosPorNombre[n].dependencias) mete(d); out.add(n); };
    nombres.forEach(mete);
    /* En el orden del manifiesto (de más a menos usado) con las dependencias antes. */
    return MAN.modulos.map((m) => m.nombre).filter((n) => out.has(n));
  }
  function pintaArbol() {
    const form = $('[data-arbol]');
    const marcados = $$('input:checked', form);
    const elegidos = conDependencias(marcados.flatMap((c) => c.value.split(',').filter(Boolean)));
    const lista = $('[data-arbol-piezas]');
    lista.textContent = '';
    lista.append(el('li', {}, [el('strong', { texto: 'Núcleo' }), texto(' · '), badge('BASE'), texto(` · ${MAN.nucleo.archivos.map((a) => a.split('/').pop()).join(', ')}`)]));
    for (const n of elegidos) { const m = modulosPorNombre[n]; lista.append(el('li', {}, [el('strong', { texto: m.titulo }), texto(' · '), badge(m.nivel), texto(` · ${[m.archivos.css, m.archivos.js].filter(Boolean).map((a) => a.split('/').pop()).join(' + ')}`)])); }
    const css = ['codigo/css/tokens.css', 'codigo/css/base.css', 'codigo/css/nucleo.css', ...elegidos.map((n) => modulosPorNombre[n].archivos.css).filter(Boolean)];
    if (elegidos.includes('mapa')) css.push('vendor/leaflet/leaflet.css', 'vendor/leaflet-gesture-handling/leaflet-gesture-handling.min.css');
    const js = ['configuracion.js  ← tus ajustes: envío, catálogos, mapa', 'codigo/js/validaciones.config.js', 'codigo/js/iconos.js'];
    if (elegidos.includes('cascadas') || elegidos.includes('combo')) js.push('codigo/catalogos/cdmx-ejemplo.js  ← sustituye por el catálogo oficial');
    js.push('codigo/js/formkit.core.js');
    if (elegidos.includes('mapa')) js.push('vendor/leaflet/leaflet.js', 'vendor/leaflet-gesture-handling/leaflet-gesture-handling.min.js');
    js.push(...elegidos.map((n) => modulosPorNombre[n].archivos.js).filter(Boolean));
    const lineas = [...css.map((c) => `<link rel="stylesheet" href="${c}">`), '', ...js.map((j) => { const [ruta, nota] = j.split('  ← '); return `<script src="${ruta}"></script>${nota ? `  <!-- ${nota} -->` : ''}`; })];
    $('[data-arbol-codigo]').textContent = lineas.join('\n');
    const notas = [];
    if (form.elements.terceros.checked) notas.push('Datos de terceros: en esos campos autocomplete="off" con el motivo en un comentario del HTML; en los de quien llena, el autocomplete correspondiente (name, email, tel-national, postal-code…).');
    if (elegidos.includes('mapa')) notas.push('El mapa base se declara en FORMKIT_CONFIG.mapa (teselas y atribución); sin él, el punto sigue pudiendo colocarse.');
    if (elegidos.includes('visor')) notas.push('El visor carga pdf.js de vendor/pdfjs-dist/: copia esa carpeta junto al paquete o indica su ruta en FORMKIT_CONFIG.visor.pdfjs.');
    if (elegidos.includes('pasos')) notas.push('Con pasos, copia la plantilla codigo/plantillas/por-pasos.html; si no, una-pagina.html.');
    notas.push(`${elegidos.length} módulo(s) además del núcleo. Las rutas son relativas a la carpeta del paquete; ajústalas a tu proyecto.`);
    $('[data-arbol-nota]').textContent = notas.join(' ');
  }
  $('[data-arbol]').addEventListener('change', pintaArbol);
  pintaArbol();

  /* ---------- Fundamentos ---------- */
  const PALETA = [
    ['--guinda', 'Identidad: títulos, encabezados de tabla, acción principal, filete de la cabecera.'],
    ['--guinda-osc', 'Acción principal al pasar el cursor.'],
    ['--guinda-cl', 'Fondo suave: filas alternas de tabla, panel de resultado.'],
    ['--dorado', 'Filete institucional y detalles (trazos, nunca texto sobre blanco).'],
    ['--dorado-txt', 'Dorado como texto: variante oscurecida que cumple 4.5:1 sobre blanco.'],
    ['--texto', 'Cuerpo y respuesta de la persona.'],
    ['--gris', 'Texto secundario: rótulos, pies, notas.'],
    ['--gris-cl', 'Ayuda de campo, contador, placeholder del select vacío.'],
    ['--linea', 'Separadores y bordes de tarjeta.'],
    ['--borde', 'Borde de control y de botón secundario (3:1 sobre blanco).'],
    ['--fondo', 'Fondo de página.'],
    ['--blanco', 'Tarjetas y controles.'],
    ['--beige', 'Pie institucional.'],
    ['--aviso-bg', 'Aviso neutro y control deshabilitado.'],
    ['--azul', 'Enlaces, casilla marcada, «Atrás», estado seleccionado.'],
    ['--azul-cl', 'Fondo de lo seleccionado (tarjeta, chip, opción del combo).'],
    ['--foco', 'Anillo de foco visible en todo elemento interactivo.'],
    ['--error', 'Error bloqueante: borde, mensaje, resumen, botón de peligro.'],
    ['--pend', 'Advertencia y «Pendiente»: ámbar, siempre con icono y texto.'],
    ['--ok', 'Éxito y «guardado».'],
    ['--mapa-bg', 'Fondo del mapa sin teselas.'],
    ['--carga-bg', 'Fondo de la zona de carga de archivos.'],
    ['--solo-lectura-bg', 'Control de solo lectura (borde discontinuo).'],
    ['--velo', 'Velo detrás de un diálogo.']
  ];
  const paleta = $('[data-paleta]');
  if (paleta) {
    paleta.className = 'guia-paleta';
    for (const [t, uso] of PALETA) {
      const m = el('div', { clase: 'guia-muestra' }, [el('span', { clase: 'guia-muestra-color', 'aria-hidden': 'true' }), el('span', {}, [el('span', { clase: 'guia-muestra-nombre', texto: t }), el('span', { clase: 'guia-muestra-valor', texto: token(t) }), el('span', { clase: 'guia-muestra-uso', texto: uso })])]);
      m.firstChild.style.setProperty('--guia-c', `var(${t})`);
      paleta.append(m);
    }
  }

  /* Contraste (WCAG 2.x) calculado sobre los valores reales de la hoja cargada. */
  function rgbDe(valor) {
    const h = valor.match(/^#([0-9a-f]{6})$/i);
    if (h) return [0, 2, 4].map((i) => parseInt(h[1].slice(i, i + 2), 16));
    const r = valor.match(/rgba?\(([^)]+)\)/);
    return r ? r[1].split(',').slice(0, 3).map(Number) : null;
  }
  function luminancia(rgb) { const [r, g, b] = rgb.map((c) => { const s = c / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; }
  function razon(a, b) { const l1 = luminancia(a), l2 = luminancia(b); return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05); }
  const cuerpoContraste = $('#guia-tabla-contraste tbody');
  if (cuerpoContraste) {
    let cumplen = 0;
    for (const p of PARES) {
      const a = rgbDe(token(p.texto)), b = rgbDe(token(p.fondo));
      const r = a && b ? razon(a, b) : NaN;
      const informativo = p.minimo === null || p.minimo === undefined;
      const ok = informativo ? null : r >= p.minimo;
      if (ok) cumplen++;
      /* Texto de muestra sólo cuando el par es de texto (4.5:1); los pares de
         borde, icono o informativos se muestran como bloque de color sin texto. */
      const deTexto = p.minimo === 4.5;
      const muestra = el('span', { clase: 'guia-contraste-muestra', texto: deTexto ? 'Texto Aa' : '', 'aria-hidden': deTexto ? undefined : 'true' });
      muestra.style.setProperty('--guia-c', `var(${p.texto})`); muestra.style.setProperty('--guia-f', `var(${p.fondo})`);
      if (!deTexto) muestra.style.setProperty('--guia-f', `var(${p.texto})`);
      cuerpoContraste.append(el('tr', {}, [el('td', { texto: p.id }), el('td', {}, muestra), el('td', { html: `<code>${p.texto}</code> sobre <code>${p.fondo}</code>` }), el('td', { texto: Number.isNaN(r) ? '—' : `${r.toFixed(2)}:1` }), el('td', { texto: informativo ? 'informativo' : `${p.minimo}:1` }), el('td', { 'data-resultado': informativo ? undefined : ok ? 'cumple' : 'falla', texto: informativo ? '—' : ok ? 'Cumple' : 'No cumple' }), el('td', { texto: p.donde })]));
    }
    const exigidos = PARES.filter((p) => p.minimo !== null && p.minimo !== undefined).length;
    $('[data-resumen-contraste]').textContent = `${cumplen} de ${exigidos} pares con mínimo exigido cumplen el mínimo (4.5:1 texto, 3:1 texto grande, bordes y gráficos). Medidos por herramientas/contraste.mjs y recalculados aquí con los valores de la hoja cargada.`;
  }

  /* Escala tipográfica: cada token con su definición y su tamaño calculado en este ancho. */
  const escala = $('[data-escala]');
  if (escala) {
    const ESCALA = [['--t-2xl', 'Título de página', 'titulo-pagina'], ['--t-xl', 'Título de paso', 'titulo-paso'], ['--t-lg', 'Título de bloque', 'titulo-bloque'], ['--t-base', 'Cuerpo, etiqueta y control (nunca menos de 16 px en el teléfono)', ''], ['--t-md', 'Botones secundarios, celdas', ''], ['--t-sm', 'Ayuda, contador, pies', ''], ['--t-xs', 'Rótulos y notas', '']];
    for (const [t, uso, clase] of ESCALA) {
      const fila = el('div', { clase: 'guia-escala-fila' });
      const muestra = el('p', { clase: clase || undefined, texto: uso });
      muestra.style.fontSize = `var(${t})`; muestra.style.margin = '0';
      fila.append(muestra, el('span', { clase: 'guia-escala-meta', texto: `${t}: ${token(t)}` }));
      escala.append(fila);
      requestAnimationFrame(() => { fila.lastChild.textContent += ` → ${Math.round(parseFloat(getComputedStyle(muestra).fontSize))} px en este ancho`; });
    }
  }

  /* Medidas: cada token con una caja que lo dibuja. */
  const medidas = $('[data-medidas]');
  if (medidas) {
    medidas.className = 'guia-medidas';
    const MEDIDAS = [
      ['--objetivo-min', 'Tamaño táctil mínimo de todo lo que se toca (44 px).', 'alto'],
      ['--alto-control', 'Alto del control de texto y del botón principal.', 'alto'],
      ['--alto-opcion', 'Alto de la opción corta Sí/No con ratón; con dedo sube a --alto-control.', 'alto'],
      ['--tam-casilla', 'Casilla y radio.', 'cuadro'],
      ['--e-1', 'Espaciado base (4 px): la escala es 4, 8, 12, 16, 20, 24, 32, 40, 48.', 'ancho'],
      ['--e-4', 'Separación entre etiqueta, ayuda y control.', 'ancho'],
      ['--e-6', 'Separación entre campos.', 'ancho'],
      ['--e-seccion', 'Relleno de tarjeta y separación entre bloques (fluido).', 'ancho'],
      ['--e-pagina', 'Margen lateral de la página (16 px mínimo en móvil).', 'ancho'],
      ['--r-ctrl', 'Radio de controles y botones.', 'radio'],
      ['--r-caja', 'Radio de tarjetas y diálogos.', 'radio'],
      ['--r-pill', 'Radio de chips e insignias.', 'radio'],
      ['--b-1', 'Trazo de bordes y separadores.', 'trazo'],
      ['--foco-ancho', 'Anillo de foco (3 px) separado --foco-sep del elemento.', 'trazo'],
      ['--bp-sm', 'Punto de corte: hoja inferior → diálogo centrado; chips en fila.', 'texto'],
      ['--bp-md', 'Punto de corte: campos a dos columnas; tabla real; botones en fila.', 'texto'],
      ['--bp-lg', 'Punto de corte: navegación lateral; tres columnas.', 'texto'],
      ['--ancho-pagina', 'Ancho máximo del contenido.', 'texto'],
      ['--ancho-lectura', 'Ancho máximo del texto corrido (70 caracteres).', 'texto']
    ];
    for (const [t, uso, forma] of MEDIDAS) {
      const caja = el('span', { clase: 'guia-caja-medida', 'aria-hidden': 'true' });
      if (forma === 'alto') { caja.style.height = `var(${t})`; caja.style.width = `var(${t})`; }
      else if (forma === 'cuadro') { caja.style.height = `var(${t})`; caja.style.width = `var(${t})`; caja.style.borderRadius = 'var(--r-ctrl)'; }
      else if (forma === 'ancho') { caja.style.width = `var(${t})`; }
      else if (forma === 'radio') { caja.style.borderRadius = `var(${t})`; }
      else if (forma === 'trazo') { caja.style.height = `var(${t})`; caja.style.background = 'var(--guinda)'; }
      else caja.hidden = true;
      medidas.append(el('div', { clase: 'guia-medida' }, [el('span', { clase: 'guia-medida-nombre', texto: t }), el('span', { clase: 'guia-medida-valor', texto: token(t) }), el('span', { clase: 'guia-medida-uso', texto: uso }), caja]));
    }
  }

  /* Iconos: el catálogo cerrado, leído del sprite inyectado. */
  const iconos = $('[data-iconos]');
  if (iconos) {
    /* Los ids se leen del propio sprite (iconos.js); el <use> resuelve cuando el núcleo lo inyecta. */
    const ids = [...(window.FORMKIT_ICONOS || '').matchAll(/id="(i-[\w-]+)"/g)].map((m) => m[1]);
    for (const id of ids) iconos.append(el('div', { clase: 'guia-icono-item' }, [icono(id.replace(/^i-/, ''), 'icono'), el('span', { texto: id })]));
  }

  /* ---------- Fichas ---------- */
  const formsDemo = [];
  function demoDe(nombre, rotulo) {
    const tpl = $(`template[data-demo="${nombre}"]`);
    if (!tpl) return null;
    const form = el('form', { clase: 'guia-demo-form', 'data-formkit': 'guia', action: '#', method: 'post', 'aria-label': `Muestra: ${rotulo}` });
    form.append(tpl.content.cloneNode(true));
    formsDemo.push(form);
    const conCampos = tpl.content.querySelector('input, select, textarea, [data-campo]');
    const cont = el('div', { clase: 'guia-demo' }, [el('p', { clase: 'guia-demo-rotulo', texto: conCampos ? 'Muestra viva · escribe, falla y corrige' : 'Muestra viva · tal como se ve' }), form]);
    const det = el('details', { clase: 'guia-detalles' }, [el('summary', { texto: 'Ver el HTML para copiar' })]);
    const pre = el('pre', { clase: 'guia-pre', tabindex: '0' }, el('code', { texto: codigoDe(tpl) }));
    pre.id = FormKit.utilidades.idUnico('cod');
    det.append(el('div', { clase: 'guia-codigo' }, [pre, el('button', { type: 'button', clase: 'btn btn-secundario guia-copiar', 'data-copiar': `#${pre.id}` }, [icono('copiar'), texto('Copiar HTML')])]));
    return [cont, det];
  }
  function metaDl(pares) {
    const dl = el('dl', { clase: 'guia-ficha-meta' });
    for (const [k, v] of pares) if (v !== undefined && v !== null && v !== '') { dl.append(el('dt', { texto: k })); dl.append(typeof v === 'string' ? el('dd', { texto: v }) : el('dd', {}, v)); }
    return dl;
  }
  function ficha({ id, titulo, nivel, proposito, meta, demo, errores, movil, escritorio, encabezado = 'h3' }) {
    const art = el('article', { clase: 'guia-ficha', id, 'aria-labelledby': `t-${id}` });
    art.append(el('div', { clase: 'guia-ficha-cab' }, [el(encabezado, { clase: 'guia-ficha-titulo', id: `t-${id}`, texto: titulo }), badge(nivel)]));
    if (proposito) art.append(el('p', { clase: 'guia-ficha-proposito', texto: proposito }));
    if (meta) art.append(metaDl(meta));
    if (movil || escritorio) art.append(el('div', { clase: 'guia-ficha-cols' }, [el('div', { clase: 'guia-col' }, [el('p', { clase: 'guia-col-titulo', texto: 'En teléfono' }), texto(movil || '—')]), el('div', { clase: 'guia-col' }, [el('p', { clase: 'guia-col-titulo', texto: 'En escritorio' }), texto(escritorio || '—')])]));
    const d = demo ? demoDe(demo.nombre, titulo) : null;
    if (d) art.append(...d);
    else if (demo) art.append(el('p', { clase: 'texto-gris' }, [texto('Esta pieza se ve completa, en contexto, en '), el('a', { href: '#ejemplos', texto: 'los formularios de ejemplo' }), texto('.')]));
    if (errores && errores.length) art.append(el('details', { clase: 'guia-detalles' }, [el('summary', { texto: `Errores frecuentes que el estándar evita (${errores.length})` }), el('ul', { clase: 'guia-errores' }, errores.map((e) => el('li', { texto: e })))]));
    return art;
  }

  /* Núcleo: fichas con lo que todo formulario lleva. */
  const nucleoArch = $('[data-nucleo-archivos]');
  if (nucleoArch) nucleoArch.append(...MAN.nucleo.archivos.map((a) => el('code', { clase: 'guia-tag', texto: a })));
  const FICHAS_NUCLEO = [
    { id: 'n-campo', titulo: 'El campo: etiqueta, ayuda, control, error', proposito: 'Toda pregunta sigue el mismo orden: etiqueta visible (con asterisco guinda si es obligatoria), ayuda antes del control, el control, y debajo el mensaje de error con icono. El mensaje dice qué hacer, aparece al salir del campo si se escribió algo, y se recalcula mientras se corrige. Texto largo con contador.', demo: { nombre: 'campo-texto' },
      meta: [['Atributos', [el('code', { texto: 'data-campo' }), texto(' '), el('code', { texto: 'data-formato' }), texto(' '), el('code', { texto: 'data-requerido' }), texto(' '), el('code', { texto: 'data-uso' }), texto(' '), el('code', { texto: 'data-finalidad' }), texto(' '), el('code', { texto: 'data-legible' }), texto(' '), el('code', { texto: 'data-mensaje' })]], ['Formatos', Object.keys(V.formatos).join(', ')], ['Autocompletado', 'given-name, family-name, email, tel-national, postal-code, street-address… en los datos de quien llena; off en datos de terceros con motivo en comentario.'],
        ['Filas', 'Sólo para datos hermanos: las partes de un mismo dato (nombre y apellidos en .fila-3; calle y número; manzana y lote), un dato y su confirmación (correo, contraseña) o un dato y el que sale de él (CURP y fecha de nacimiento), en .fila. Lo demás, en una columna.'],
        ['Ayuda de bloque', 'Si la misma ayuda vale para todos los campos de una sección, va una vez bajo su título (.ayuda-bloque) y el núcleo la enlaza a cada campo. Ver «Datos de identificación» en Bloques listos.']],
      movil: 'Una columna; teclado adecuado por inputmode (numérico para CP, teléfono para tel, correo con @); 48 px de alto; el error no empuja el diseño porque reserva su alto.', escritorio: 'Los datos hermanos en dos o tres columnas desde 760 px, con subgrid: los controles de una fila quedan alineados aunque una etiqueta ocupe dos líneas o sólo uno lleve ayuda.',
      errores: ['Placeholder en lugar de etiqueta.', 'Validar en cada tecla antes de que la persona termine.', 'Mensajes «Campo inválido» sin decir qué hacer.', 'Pedir un dato sin uso declarado (data-uso).', 'Juntar en una fila datos que no son hermanos sólo porque son cortos.'] },
    { id: 'n-select', titulo: 'Lista desplegable, solo lectura, deshabilitado, casilla de declaración', proposito: 'El select nativo con flecha propia y «Elige una opción» como primera opción vacía. Solo lectura (readonly, borde discontinuo, se envía, copiable) frente a deshabilitado (disabled, gris, no se envía). La casilla de declaración o consentimiento va destacada y nunca premarcada.', demo: { nombre: 'select-casilla' },
      movil: 'El select abre el selector nativo del sistema; la casilla y su texto son un solo objetivo táctil.', escritorio: 'Select con flecha propia; al pasar el cursor por la casilla cambia el fondo.',
      errores: ['Deshabilitar un campo que la persona debe ver y copiar (es solo lectura).', 'Premarcar el consentimiento.', 'Select sin opción vacía inicial: se envía la primera sin querer.'] },
    { id: 'n-condicional', titulo: 'Pregunta condicional', proposito: 'Un bloque con data-si="campo=valor|valor2" existe sólo mientras la respuesta coincida: no se valida, no viaja en el envío y lo escrito se conserva por si la persona vuelve a cambiar de opinión. Al mostrarse se anuncia al lector de pantalla.', demo: { nombre: 'condicional' },
      errores: ['Ocultar con display:none y seguir validando el campo oculto.', 'Borrar lo escrito al ocultar.', 'Mover el foco al mostrar el bloque.'] },
    { id: 'n-botones', titulo: 'Botones, avisos y pendiente visible', proposito: 'Una sola acción principal por pantalla (guinda, a la derecha o abajo). Secundario gris con borde; peligro rojo sólo para acciones destructivas y siempre con confirmación; «Atrás» como enlace azul con flecha, nunca como botón gris; enlace-botón para acciones ligeras; botón de icono sólo con nombre accesible y 44 px. Cuatro avisos, cada uno con icono, texto y rol correcto.', demo: { nombre: 'botones-avisos' },
      movil: 'Botones a lo ancho, apilados con la acción principal arriba (column-reverse: en el HTML va al final, para el teclado).', escritorio: 'En fila desde 760 px, principal a la derecha, ancho al contenido.',
      errores: ['Dos botones principales en la misma pantalla.', '«Aceptar», «OK» o «Enviar» sin decir qué se envía.', 'Deshabilitar el botón con disabled (desaparece para el teclado): se usa aria-disabled.', 'Comunicar estado sólo con color.'] },
    { id: 'n-resumen', titulo: 'Validación al enviar, resumen de errores y estados de envío', proposito: 'Al enviar se revalida todo. Si hay errores, aparece arriba un resumen con rol de alerta, recibe el foco y enlaza a cada campo. Si pasa, el botón entra en estado ocupado (aria-busy, texto «Enviando…»), el envío lleva plazo, clave de idempotencia y trato del límite de peticiones; el fallo se dice con palabras y lo escrito se conserva. Esta muestra envía de manera simulada.', demo: { nombre: 'resumen' },
      errores: ['Mostrar los errores sólo junto al campo, sin resumen ni foco.', 'Desactivar el botón y no decir por qué.', 'Perder lo capturado cuando falla la red.', 'Permitir el doble envío.'] }
  ];
  const contNucleo = $('[data-fichas-nucleo]');
  if (contNucleo) for (const f of FICHAS_NUCLEO) contNucleo.append(ficha({ nivel: 'BASE', ...f }));

  /* Módulos: una ficha por entrada del manifiesto, con su muestra si existe,
     agrupadas por tipo en el orden en que se arma un formulario. Dentro de
     cada grupo, primero lo más usado; un módulo nuevo que no esté en ORDEN
     cae al final de su grupo. */
  const GRUPOS = [['pregunta', 'Preguntas'], ['archivos', 'Ubicación y archivos'], ['navegacion', 'Recorrido de la página'], ['retroalimentacion', 'Respuesta a la persona']];
  const ORDEN = ['opciones', 'otro', 'combo', 'fecha', 'cascadas', 'identificadores', 'repetibles', 'chips', 'toggle', 'escala',
    'archivos', 'visor', 'mapa', 'enlace-mapa',
    'pasos', 'progreso', 'acordeon', 'pestanas', 'migas', 'paginacion', 'version',
    'revision', 'modal', 'acuse', 'copiar', 'descarga', 'tooltip', 'tabla'];
  const posicion = (n) => { const i = ORDEN.indexOf(n); return i < 0 ? ORDEN.length : i; };
  const nombreTipo = Object.fromEntries(GRUPOS);
  /* En el menú: sección → (grupo →) ficha. */
  const enNav = (lista, id, txt) => { if (lista) lista.append(el('li', {}, el('a', { href: `#${id}`, texto: txt }))); };
  const navSub = (seccion) => $(`[data-nav-sub="${seccion}"]`);
  const contModulos = $('[data-fichas-modulos]');
  const tipos = [...GRUPOS.map(([t]) => t), ...new Set(MAN.modulos.map((m) => m.tipo).filter((t) => !nombreTipo[t]))];
  if (contModulos) for (const tipo of tipos) {
    const delTipo = MAN.modulos.filter((m) => m.tipo === tipo).sort((a, b) => posicion(a.nombre) - posicion(b.nombre));
    if (!delTipo.length) continue;
    const grupo = nombreTipo[tipo] || tipo;
    contModulos.append(el('h3', { clase: 'rotulo guia-grupo', id: `g-${tipo}`, texto: `${grupo} (${delTipo.length})` }));
    const navGrupo = el('ol', { clase: 'guia-nav-sub' });
    navSub('modulos')?.append(el('li', {}, [el('span', { clase: 'guia-nav-grupo', texto: grupo }), navGrupo]));
    for (const m of delTipo) {
      const archivos = [m.archivos.css, m.archivos.js].filter(Boolean).map((a) => el('code', { clase: 'guia-tag', texto: `${a.split('/').pop()} (${FormKit.utilidades.pesoTxt(m.tamano[a.endsWith('.css') ? 'css' : 'js'])})` }));
      contModulos.append(ficha({
        id: `m-${m.nombre}`, titulo: m.titulo, nivel: m.nivel, proposito: m.proposito, encabezado: 'h4',
        meta: [['Tipo', grupo], ['Cuándo', m.cuando], ['Cuándo no', m.cuandoNo], ['Depende de', m.dependencias.length ? m.dependencias.join(', ') : 'sólo del núcleo'], ['Archivos', archivos], ['Accesibilidad', m.accesibilidad]],
        movil: m.movil, escritorio: m.escritorio, demo: { nombre: m.nombre }, errores: m.errores
      }));
      enNav(navGrupo, `m-${m.nombre}`, m.titulo);
    }
  }

  /* Bloques listos: secciones completas armadas sólo con piezas del núcleo
     y de los módulos, tomadas de proyectos que ya funcionan. */
  const FICHAS_BLOQUES = [
    { id: 'b-identificacion', titulo: 'Datos de identificación de una persona', nivel: 'OPCIONAL', demo: { nombre: 'bloque-identificacion' },
      proposito: 'Nombre(s), apellido paterno, apellido materno (opcional), CURP, fecha de nacimiento y edad. Los apellidos van en campos separados. La fecha de nacimiento se toma de la CURP y la edad, de la fecha, en campos de solo lectura: nada se escribe dos veces ni puede contradecir a la CURP. Si no necesitas la edad, quita ese campo. La CURP se compara con el nombre y los apellidos: si no corresponden, lo dice. Para probar: Juan Pérez García con la CURP ficticia PEGJ900515HDFRRN09.',
      meta: [['Usa', 'núcleo + identificadores + fecha'], ['CURP y nombre', 'Las cruzadas curp-nombre y curp-segundo-apellido comparan las letras de la CURP con el nombre y los apellidos (sin segundo apellido, la CURP lleva X). Comprueban que los datos sean coherentes entre sí, no que la CURP exista ni que sea de quien la escribe.'], ['Sin CURP', 'Quita la CURP y su fecha, y usa el bloque «Fecha de nacimiento y edad». Si basta el grupo de edad, usa «Rango de edad».'], ['Datos personales', 'Cada campo declara data-uso, data-finalidad y data-sensible, así que nada queda en el borrador del dispositivo (FRM-55). Cambia los textos de uso y finalidad por los de tu formulario.'], ['Si los datos son de otra persona', 'autocomplete="off" en cada campo, con el motivo en un comentario (FRM-12).']],
      movil: 'Una columna; la CURP pasa a mayúsculas mientras se escribe y la fecha y la edad aparecen solas.', escritorio: 'La ayuda común va una sola vez, arriba; nombre y apellidos en tres columnas alineadas aunque sólo uno lleve ayuda; la CURP y la fecha que sale de ella, en otra fila.',
      errores: ['Pedir «Apellido(s)» en un solo campo (FRM-13).', 'Hacer obligatorio el apellido materno: hay personas con un solo apellido.', 'Repetir «como aparece en tu identificación» en cada campo: va una vez, como ayuda de bloque.', 'Pedir la fecha de nacimiento y la CURP por separado sin cruzarlas.', 'Guardar la CURP en el borrador del dispositivo.', 'Pedir la edad escrita: se calcula con la fecha.'] },
    { id: 'b-nacimiento', titulo: 'Fecha de nacimiento y edad', nivel: 'OPCIONAL', demo: { nombre: 'bloque-nacimiento' },
      proposito: 'Para cuando el formulario no pide la CURP. La persona escribe su fecha de nacimiento como día/mes/año, sin calendario (formato «fecha-dma»): al escribir 2371985 queda 23/07/1985. La edad se calcula sola, en un campo de solo lectura, con la fecha de hoy en la Ciudad de México; nunca se escribe. No acepta fechas imposibles ni futuras.',
      meta: [['Usa', 'núcleo + fecha'], ['Sin calendario', 'Para llegar a una fecha de nacimiento, el calendario obliga a recorrer décadas; día/mes/año es como se escribe en México. Acepta también guiones, puntos o los ocho dígitos juntos.'], ['Edad mínima o máxima', 'Si el formulario la exige, agrega a la fecha data-cruzada="edad" data-cruzada-campos="fecha=…" y data-edad-min o data-edad-max: el mensaje dice qué hacer si la persona no cumple.'], ['Datos personales', 'Fecha y edad declaran data-uso, data-finalidad y data-sensible (FRM-55).']],
      movil: 'Teclado numérico; las diagonales se ponen solas y la edad aparece al lado en cuanto la fecha está completa.', escritorio: 'Fecha y edad en una fila.',
      errores: ['Pedir la fecha de nacimiento con el calendario.', 'Pedir la edad escrita además de la fecha: pueden contradecirse.', 'Calcular la edad con el reloj del dispositivo sin la zona horaria de la Ciudad.', 'Aceptar una fecha de nacimiento futura.'] },
    { id: 'b-rango-edad', titulo: 'Rango de edad', nivel: 'OPCIONAL', demo: { nombre: 'bloque-rango-edad' },
      proposito: 'Para cuando basta saber el grupo de edad (encuestas, registros de asistencia) y no hace falta la fecha: se pide menos dato personal. Una sola respuesta, en una lista de opciones. Los cortes de la muestra son un ejemplo: se ajustan a los que necesites, sin huecos y sin que se encimen.',
      meta: [['Usa', 'núcleo + opciones'], ['Datos personales', 'Declara data-uso y data-finalidad (FRM-55); como no identifica a la persona, no lleva data-sensible.']],
      movil: 'Una opción por renglón, cada una de 44 px o más.', escritorio: 'La misma lista, con el ancho del texto.',
      errores: ['Rangos que se enciman («18 a 30» y «30 a 45»).', 'Dejar huecos entre rangos.', 'Pedir la fecha de nacimiento cuando sólo se va a contar por grupo de edad.'] },
    { id: 'b-domicilio', titulo: 'Domicilio', nivel: 'OPCIONAL', demo: { nombre: 'bloque-domicilio' },
      proposito: 'Calle; número exterior («S/N» si no tiene) e interior; manzana y lote sólo si el domicilio se identifica así; y entre qué calles. En la Ciudad: alcaldía, colonia y código postal desde el catálogo (si la colonia no aparece, se escribe) y la ubicación exacta, con un enlace de Google Maps del que se toman las coordenadas o con las coordenadas escritas. Quien vive fuera de la Ciudad marca la casilla y da estado, municipio, colonia y un código postal de cualquier parte del país. Para probar: código postal 04010 (catálogo ficticio) o pega un enlace de Google Maps.',
      meta: [['Usa', 'núcleo + opciones + cascadas + enlace-mapa, y el catálogo oficial de colonias en lugar del ficticio (lo construye el SIA y se publicará en su GeoServer)'], ['Si es el domicilio de otra persona o de un sitio', 'autocomplete="off" en cada campo, con el motivo en un comentario (FRM-12).'], ['Si es un sitio que debe estar en la Ciudad', 'Quita la casilla «Vivo fuera de la Ciudad de México» y la rama de estado y municipio. Así está en la plantilla por pasos, paso «¿Dónde?».'],['Con mapa', 'Si además se pide el punto en el mapa, agrega el módulo «mapa»: las coordenadas mueven el punto. La dirección siempre va primero (FRM-46).']],
      movil: 'Una columna. Al pegar el enlace las coordenadas aparecen sin salir del campo, y la longitud sin signo menos se corrige sola.', escritorio: 'Número exterior e interior, manzana y lote, y alcaldía y colonia en dos columnas alineadas.',
      errores: ['«Calle y número» en un solo campo (FRM-13).', 'Mostrar manzana y lote a todas las personas: sólo aplican a una parte de los domicilios.', 'Rechazar el domicilio que no tiene número: se acepta «S/N».', 'Tomar del enlace el centro de la pantalla en lugar del lugar marcado.', 'Hacer del mapa la única forma de dar la ubicación.'] }
  ];
  FICHAS_BLOQUES.push({ id: 'b-redes', titulo: 'Redes sociales de la Secretaría', nivel: 'OPCIONAL', demo: { nombre: 'bloque-redes' },
    proposito: 'Los enlaces a las redes oficiales de la Secretaría, para el pie: íconos de 44 px, cada uno con su nombre accesible («Facebook de la Secretaría del Medio Ambiente»). Son la excepción a «el ícono va con texto», porque las marcas se reconocen solas. Las direcciones de las cuentas viven en la configuración del sitio, no escritas en cada página.',
    meta: [['Cuentas', 'Facebook, X (@SEDEMA_CDMX), Instagram (sedemacdmx), TikTok (@sedema_cdmx) y YouTube.'], ['Íconos', 'i-facebook, i-x, i-instagram, i-tiktok, i-youtube, en el mismo sprite que los demás.']],
    movil: 'Una fila que se parte en dos renglones si no cabe; cada ícono mide 44 px.', escritorio: 'Una fila; al pasar el cursor, fondo azul tenue.',
    errores: ['Ícono sin nombre accesible: el lector de pantalla sólo dice «enlace».', 'Usar una cuenta sin verificarla en el sitio oficial de la Secretaría.', 'Traer los íconos de otra fuente, con otro grosor o tamaño.'] });
  const contBloques = $('[data-fichas-bloques]');
  if (contBloques) for (const f of FICHAS_BLOQUES) contBloques.append(ficha(f));

  /* Menú del núcleo y de los bloques, con nombres cortos. */
  const CORTOS = { 'n-campo': 'El campo', 'n-select': 'Listas y casillas', 'n-condicional': 'Pregunta condicional', 'n-botones': 'Botones y avisos', 'n-resumen': 'Al enviar',
    'b-identificacion': 'Datos de identificación', 'b-nacimiento': 'Fecha de nacimiento y edad', 'b-rango-edad': 'Rango de edad', 'b-domicilio': 'Domicilio', 'b-redes': 'Redes sociales' };
  for (const f of FICHAS_NUCLEO) enNav(navSub('nucleo'), f.id, CORTOS[f.id] || f.titulo);
  for (const f of FICHAS_BLOQUES) enNav(navSub('bloques'), f.id, CORTOS[f.id] || f.titulo);

  /* Pendientes: la lista común de la carpeta, sólo lo de formularios y lo de los dos. */
  const contPend = $('[data-pendientes]');
  if (contPend && window.SIA_PENDIENTES) window.SIA_PENDIENTES.pinta(contPend, { de: ['Formularios', 'Los dos'] });

  /* Arranque de las muestras: cada formulario de demostración es una
     instancia real del núcleo con envío simulado. */
  for (const f of formsDemo) {
    FormKit.iniciar(f, { ...(window.FORMKIT_OPCIONES || {}), alEnviar: (r) => { avisa(`Envío simulado recibido. Folio ficticio ${r.folio}. Nada salió de tu navegador.`); FormKit.anuncia(`Envío simulado recibido, folio ${r.folio}`); } });
  }

  /* Muestras que necesitan algo más que el HTML. */
  FormKit.descargas.demo = () => new Promise((ok) => setTimeout(() => ok({ url: `data:text/csv;charset=utf-8,${encodeURIComponent('folio,titulo\nEJ-001,Ejemplo ficticio\n')}`, nombre: 'muestra.csv', peso: '1 KB' }), 600));
  document.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-demo-confirma]');
    if (!b) return;
    const salida = $('[data-demo-confirma-resultado]');
    const ok = await FormKit.confirma(b, { titulo: '¿Descartar lo capturado?', texto: 'Se perderán las respuestas de esta muestra. Esta acción no se puede deshacer.', si: 'Sí, descartar', no: 'Conservar', peligro: true });
    if (salida) salida.textContent = ok ? 'Confirmaste descartar (simulado): el foco volvió al botón.' : 'Cancelaste: no pasó nada y el foco volvió al botón.';
  });
  const listaPag = $('#m_resultados');
  const navPag = $('[data-paginacion][data-lista="#m_resultados"]');
  if (listaPag && navPag) {
    const pinta = (d) => { listaPag.textContent = ''; for (let i = d.desde + 1; i <= d.hasta && i <= d.desde + 5; i++) listaPag.append(el('li', { texto: `Resultado ficticio ${i}` })); if (d.hasta - d.desde > 5) listaPag.append(el('li', { texto: `… hasta el ${d.hasta}` })); };
    navPag.addEventListener('formkit:pagina', (e) => pinta(e.detail));
    const tam = Number(navPag.dataset.tamano), pag = Number(navPag.dataset.pagina), total = Number(navPag.dataset.total);
    pinta({ desde: (pag - 1) * tam, hasta: Math.min(total, pag * tam) });
  }

  /* ---------- Probador de validaciones ---------- */
  const CASOS = {
    nombre: [['valido', 'María José Pérez'], ['valido', "O'Connor"], ['invalido', 'Juan123'], ['limite', 'Ñandú de la Peña-Ruiz']],
    correo: [['valido', 'nombre@ejemplo.local'], ['invalido', 'nombre@'], ['invalido', 'sin arroba.mx'], ['limite', 'nombre@gmial.com']],
    telefono: [['valido', '55 1234 5678'], ['valido', '+52 5512345678'], ['invalido', '123'], ['limite', '(55) 1234-5678']],
    cp: [['valido', '01000'], ['valido', '16999'], ['invalido', '1234'], ['limite', '17000']],
    curp: [['valido', 'PEGJ900515HDFRRN09'], ['invalido', 'PEGJ900515HDFRRN0'], ['invalido', 'PEGJ901345HDFRRN09'], ['limite', 'pegj900515hdfrrn09']],
    rfc: [['valido', 'XAXX010101000'], ['valido', 'ABC010101AB1'], ['invalido', 'XAXX0101'], ['limite', 'xaxx-010101-000']],
    numero: [['valido', '12.5'], ['valido', '12,5'], ['invalido', 'doce'], ['limite', '-0']],
    fecha: [['valido', '2026-03-15'], ['invalido', '2026-02-30'], ['invalido', '15/03/2026'], ['limite', '2000-02-29']],
    hora: [['valido', '14:30'], ['valido', '00:00'], ['invalido', '24:00'], ['limite', '23:59']],
    texto: [['valido', 'El árbol de la banqueta está inclinado hacia la calle desde la lluvia del martes.'], ['invalido', 'asdfghjkl'], ['limite', 'Hola.']],
    coordenadas: [['valido', '19.4326,-99.1332'], ['invalido', '19.4326'], ['invalido', '91,0'], ['limite', '19.4326, -99.1332']],
    folio: [['valido', 'EJ-2026-000123'], ['valido', 'abc-123'], ['invalido', 'a'], ['limite', 'EJ 2026 000123']],
    contrasena: [['valido', 'una frase larga y memorable'], ['invalido', 'corta'], ['limite', 'exactamente12']]
  };
  const probador = $('[data-probador]');
  if (probador) {
    probador.className = 'guia-probador';
    for (const [nombre, f] of Object.entries(V.formatos)) {
      const id = `pb_${nombre}`;
      const entrada = el('input', { clase: 'control', id, type: nombre === 'contrasena' ? 'password' : 'text', inputmode: f.inputmode, autocomplete: 'off', 'aria-describedby': `${id}_d` });
      const salida = el('dl', { clase: 'guia-probador-salida', id: `${id}_d`, 'aria-live': 'polite' });
      const item = el('div', { clase: 'guia-probador-item' }, [el('label', { clase: 'etiqueta', for: id, texto: `data-formato="${nombre}"` }), el('p', { clase: 'guia-probador-desc', texto: f.descripcion }), entrada, salida]);
      const casos = el('div', { clase: 'guia-casos', role: 'group', 'aria-label': `Casos de ${nombre}` });
      for (const [estado, valor] of CASOS[nombre] || []) casos.append(el('button', { type: 'button', clase: 'guia-caso', 'data-estado': estado, 'data-valor': valor }, [el('span', { clase: 'guia-caso-estado', texto: estado === 'valido' ? 'Válido' : estado === 'invalido' ? 'Inválido' : 'Límite' }), texto(valor)]));
      item.append(casos);
      const evalua = () => {
        salida.textContent = '';
        const crudo = entrada.value;
        if (!crudo) return;
        const norm = f.normaliza ? f.normaliza(crudo) : crudo;
        const msj = norm === '' ? '' : f.valida(norm, {});
        const ok = !msj;
        salida.dataset.resultado = ok ? 'valido' : 'invalido';
        salida.append(el('dt', { texto: 'Resultado' }), el('dd', { clase: 'guia-probador-veredicto', texto: ok ? 'Válido' : 'Inválido' }));
        salida.append(el('dt', { texto: 'Mensaje' }), el('dd', { texto: msj || '—' }));
        salida.append(el('dt', { texto: 'Normalizado' }), el('dd', {}, el('code', { texto: JSON.stringify(norm) })));
        if (ok && f.sugiere) { const s = f.sugiere(norm); if (s) salida.append(el('dt', { texto: 'Sugerencia' }), el('dd', { texto: s })); }
        if (ok && f.deriva) salida.append(el('dt', { texto: 'Derivados' }), el('dd', {}, el('code', { texto: JSON.stringify(f.deriva(norm)) })));
      };
      entrada.addEventListener('input', evalua);
      casos.addEventListener('click', (e) => { const b = e.target.closest('[data-valor]'); if (b) { entrada.value = b.dataset.valor; evalua(); entrada.focus(); } });
      probador.append(item);
    }
  }
  /* Casos de CURP + fecha para la muestra cruzada. */
  const casosCurp = $('[data-casos-curp]');
  if (casosCurp) {
    const CC = [['valido', 'PEGJ900515HDFRRN09', '1990-05-15', 'CURP y fecha coinciden'], ['invalido', 'PEGJ900515HDFRRN09', '1990-05-16', 'La fecha escrita no coincide con la CURP'], ['limite', 'PEGJ900515HDFRRN09', '', 'Sólo CURP: la fecha se deriva y se muestra en solo lectura']];
    for (const [estado, curp, fecha, desc] of CC) casosCurp.append(el('button', { type: 'button', clase: 'guia-caso', 'data-estado': estado, 'data-curp': curp, 'data-fecha': fecha }, [el('span', { clase: 'guia-caso-estado', texto: estado === 'valido' ? 'Válido' : estado === 'invalido' ? 'Inválido' : 'Límite' }), texto(desc)]));
    casosCurp.addEventListener('click', (e) => {
      const b = e.target.closest('[data-curp]'); if (!b) return;
      const c = $('#pr_curp'), f = $('#pr_nac');
      c.value = b.dataset.curp; c.dispatchEvent(new Event('input', { bubbles: true })); c.dispatchEvent(new Event('change', { bubbles: true }));
      f.value = b.dataset.fecha; f.dispatchEvent(new Event('input', { bubbles: true })); f.dispatchEvent(new Event('change', { bubbles: true }));
      f.focus(); f.blur(); c.focus(); c.blur();
    });
  }

  /* ---------- Sí y no ---------- */
  const SINO = [
    { titulo: 'Etiqueta visible frente a placeholder', si: '<div class="campo"><label class="etiqueta" for="sn1">Correo electrónico</label><input class="control" id="sn1" type="email" autocomplete="off"></div>', no: '<div class="campo"><input class="control" type="email" placeholder="Correo electrónico" aria-label="Correo electrónico (ejemplo de lo que no se hace)" autocomplete="off"></div>', porque: 'El placeholder desaparece al escribir y no sirve de etiqueta; la persona olvida qué iba ahí y el lector de pantalla no siempre lo lee.' },
    { titulo: 'Error que dice qué hacer', si: '<div class="campo"><label class="etiqueta" for="sn2">Código postal</label><input class="control" id="sn2" value="1234" aria-invalid="true" aria-describedby="sn2e"><p class="err" id="sn2e" data-nivel="error"><svg class="icono icono-sm err-icono" aria-hidden="true"><use href="#i-error"></use></svg>El código postal lleva 5 dígitos. Ejemplo: 01000</p></div>', no: '<div class="campo"><label class="etiqueta" for="sn3">Código postal</label><input class="control" id="sn3" value="1234" aria-invalid="true" aria-describedby="sn3e"><p class="err" id="sn3e" data-nivel="error"><svg class="icono icono-sm err-icono" aria-hidden="true"><use href="#i-error"></use></svg>Campo inválido</p></div>', porque: '«Campo inválido» obliga a adivinar. El mensaje del estándar nombra la regla y da un ejemplo.' },
    { titulo: 'Una acción principal', si: '<div class="acciones guia-acciones-demo"><button type="button" class="btn-atras"><svg class="icono" aria-hidden="true"><use href="#i-flecha-izq"></use></svg>Atrás</button><button type="button" class="btn btn-primario">Continuar</button></div>', no: '<div class="acciones guia-acciones-demo"><button type="button" class="btn btn-primario">Atrás</button><button type="button" class="btn btn-primario">Continuar</button></div>', porque: 'Dos botones guinda compiten; «Atrás» es un enlace con flecha para que no se confunda con avanzar.' },
    { titulo: 'Solo lectura frente a deshabilitado', si: '<div class="campo"><label class="etiqueta" for="sn4">Folio</label><input class="control" id="sn4" value="EJ-2026-000123" readonly></div>', no: '<div class="campo"><label class="etiqueta" for="sn5">Folio</label><input class="control" id="sn5" value="EJ-2026-000123" disabled></div>', porque: 'Un dato que la persona debe ver y copiar se marca readonly: se lee, se copia, se envía. Deshabilitado es para lo que no aplica todavía: no se envía y el teclado lo salta.' },
    { titulo: 'Estado con icono y texto, no sólo color', si: '<p class="aviso aviso-ok" role="status"><svg class="icono" aria-hidden="true"><use href="#i-ok"></use></svg><span class="aviso-texto"><strong>Recibido.</strong> Tu solicitud quedó registrada.</span></p>', no: '<p class="aviso aviso-ok" role="status"><span class="aviso-texto">Tu solicitud quedó registrada.</span></p>', porque: 'Sin icono ni palabra de estado, quien no distingue el verde no sabe si fue bien o mal.' },
    { titulo: 'Casilla de consentimiento sin premarcar', si: '<div class="destacado"><label class="casilla"><input class="casilla-input" type="checkbox"><span class="casilla-texto"><span class="etiqueta destacado-nombre">Leí el aviso de privacidad</span></span></label></div>', no: '<div class="destacado"><label class="casilla"><input class="casilla-input" type="checkbox" checked><span class="casilla-texto"><span class="etiqueta destacado-nombre">Leí el aviso de privacidad</span></span></label></div>', porque: 'Un consentimiento premarcado no es consentimiento: la persona debe marcarlo.' },
    { titulo: 'Pendiente visible frente a dato inventado', si: '<p>Fundamento: <span class="pendiente">[Art. __, fracc. __]</span></p>', no: '<p>Fundamento: Art. 12, fracc. IV</p>', porque: 'Un artículo no verificado se deja como hueco visible. Un número inventado llega a un documento firmado.' },
    { titulo: 'Una ayuda para toda la sección frente a la misma ayuda en cada campo', si: '<p class="ayuda-bloque" id="snb0">Escríbelos como aparecen en tu identificación oficial.</p><div class="fila"><div class="campo"><label class="etiqueta" for="snb1">Nombre(s)</label><input class="control" id="snb1" type="text" autocomplete="off" aria-describedby="snb0"></div><div class="campo"><label class="etiqueta" for="snb2">Apellido paterno</label><input class="control" id="snb2" type="text" autocomplete="off" aria-describedby="snb0"></div></div>', no: '<div class="fila"><div class="campo"><label class="etiqueta" for="snb3">Nombre(s)</label><p class="ayuda" id="snb3a">Escríbelo como aparece en tu identificación oficial.</p><input class="control" id="snb3" type="text" autocomplete="off" aria-describedby="snb3a"></div><div class="campo"><label class="etiqueta" for="snb4">Apellido paterno</label><p class="ayuda" id="snb4a">Escríbelo como aparece en tu identificación oficial.</p><input class="control" id="snb4" type="text" autocomplete="off" aria-describedby="snb4a"></div></div>', porque: 'Si la misma ayuda vale para toda la sección, se dice una vez bajo su título y el núcleo la enlaza a cada campo para el lector de pantalla. La ayuda de cada campo queda para lo propio de él.' },
    { titulo: 'Sí / No en un renglón frente a dos renglones a todo lo ancho', si: '<fieldset class="grupo"><legend class="etiqueta">¿Tienes experiencia en poda?</legend><div class="opciones-lista opciones-en-linea"><label class="opcion-fila"><input class="opcion-fila-input" type="radio" name="snl1" value="si"><span><span class="opcion-nombre">Sí</span></span></label><label class="opcion-fila"><input class="opcion-fila-input" type="radio" name="snl1" value="no"><span><span class="opcion-nombre">No</span></span></label></div></fieldset>', no: '<fieldset class="grupo"><legend class="etiqueta">¿Tienes experiencia en poda?</legend><div class="opciones-lista"><label class="opcion-fila"><input class="opcion-fila-input" type="radio" name="snl2" value="si"><span><span class="opcion-nombre">Sí</span></span></label><label class="opcion-fila"><input class="opcion-fila-input" type="radio" name="snl2" value="no"><span><span class="opcion-nombre">No</span></span></label></div></fieldset>', porque: 'Dos o tres respuestas cortas sin descripción van en línea: una columna por opción desde tableta y una por renglón en teléfono. Con descripción, una por renglón.' },
    { titulo: 'Datos hermanos en una fila frente a todo en una columna', si: '<div class="fila"><div class="campo"><label class="etiqueta" for="snf1">Correo electrónico</label><input class="control" id="snf1" type="email" autocomplete="off"></div><div class="campo"><label class="etiqueta" for="snf2">Confirma tu correo</label><input class="control" id="snf2" type="email" autocomplete="off"></div></div>', no: '<div class="campo"><label class="etiqueta" for="snf3">Correo electrónico</label><input class="control" id="snf3" type="email" autocomplete="off"></div><div class="campo"><label class="etiqueta" for="snf4">Confirma tu correo</label><input class="control" id="snf4" type="email" autocomplete="off"></div>', porque: 'Las partes de un dato y un dato con su confirmación se leen juntos: desde tableta van lado a lado y el formulario se acorta. Lo que no es hermano va en su propio renglón, aunque sea corto.' },
    { titulo: 'El ícono de ayuda dice algo nuevo, o no va', si: '<div class="campo"><label class="etiqueta" for="snt1">CURP</label><p class="ayuda" id="snt1a">Son 18 caracteres, como aparecen en tu acta de nacimiento.</p><input class="control" id="snt1" type="text" autocomplete="off" aria-describedby="snt1a"></div>', no: '<div class="campo"><label class="etiqueta" for="snt2">CURP <span class="tooltip"><button type="button" class="btn-icono tooltip-btn" aria-expanded="true" aria-label="Ayuda sobre la CURP" aria-describedby="snt2t"><svg class="icono icono-sm" aria-hidden="true"><use href="#i-ayuda"></use></svg></button><span class="tooltip-texto" role="tooltip" id="snt2t">Son 18 caracteres; está en tu acta.</span></span></label><p class="ayuda" id="snt2a">Son 18 caracteres, como aparecen en tu acta de nacimiento.</p><input class="control" id="snt2" type="text" autocomplete="off" aria-describedby="snt2a"></div>', porque: 'Si la ayuda visible basta, el campo no lleva «?». El ícono que repite lo visible obliga a abrirlo para nada y el lector de pantalla lo lee dos veces.' }
  ];
  const sino = $('[data-pares-sino]');
  if (sino) for (const p of SINO) {
    const lado = (clase, rot, html) => { const d = el('div', { clase: `guia-par-lado ${clase}` }, [el('span', { clase: 'guia-par-rotulo', texto: rot }), el('div', { clase: 'guia-par-muestra', html })]); return d; };
    sino.append(el('section', { clase: 'guia-par' }, [el('h3', { clase: 'guia-par-titulo', texto: p.titulo }), el('div', { clase: 'guia-par-lados' }, [lado('guia-si', 'Sí · cumple el estándar', p.si), lado('guia-no', 'No · lo que el estándar evita', p.no)]), el('p', { clase: 'guia-par-porque', texto: p.porque })]));
  }

  /* ---------- Ejemplos: ancho de los marcos y carga diferida ---------- */
  const ANCHO_INICIAL = ($('.guia-ancho[aria-pressed="true"]') || {}).dataset?.ancho || '390';
  function cargaMarcos(panel) { for (const f of $$('.guia-marco[data-src]', panel)) if (!f.src && !f.hasAttribute('srcdoc')) f.src = f.dataset.src; }
  function ponAncho(ancho) {
    for (const b of $$('.guia-ancho')) b.setAttribute('aria-pressed', String(b.dataset.ancho === ancho));
    for (const m of $$('[data-marcos]')) {
      m.dataset.ancho = ancho;
      const base = $('.guia-marco', m);
      const extra = $('[data-marco-extra]', m);
      if (ancho === 'lado') {
        if (!extra) {
          const clon = base.cloneNode(false); clon.removeAttribute('src'); clon.dataset.marcoExtra = ''; clon.title = `${base.title} (escritorio)`;
          if (base.hasAttribute('srcdoc')) clon.setAttribute('srcdoc', base.getAttribute('srcdoc')); else clon.dataset.src = base.dataset.src || base.getAttribute('src');
          m.append(clon);
        }
        if (!m.closest('[hidden]')) cargaMarcos(m);
      } else if (extra) extra.remove();
    }
    FormKit.anuncia(ancho === 'lado' ? 'Vista en teléfono y escritorio, lado a lado' : `Vista a ${ancho} píxeles`);
  }
  $('.guia-ejemplos-barra')?.addEventListener('click', (e) => { const b = e.target.closest('.guia-ancho'); if (b) ponAncho(b.dataset.ancho); });
  ponAncho(ANCHO_INICIAL);
  /* Los iframes de las pestañas no visibles se cargan al mostrarlas. */
  const pestanasEj = $('#ejemplos [data-pestanas]');
  if (pestanasEj) { const carga = () => { for (const p of $$('.pestanas-panel:not([hidden])', pestanasEj)) cargaMarcos(p); }; pestanasEj.addEventListener('click', () => setTimeout(carga, 0)); pestanasEj.addEventListener('keyup', () => setTimeout(carga, 0)); carga(); }

  /* ---------- Navegación ---------- */
  const selNav = $('[data-nav-select]');
  /* El selector del teléfono repite el menú: cada ficha va debajo de su sección, con sangría. */
  if (selNav) for (const li of $$('[data-nav-lista] > li')) {
    let tras = $(`option[value="${$('a', li).getAttribute('href').slice(1)}"]`, selNav);
    if (tras) for (const a of $$('.guia-nav-sub a', li)) { const o = el('option', { value: a.getAttribute('href').slice(1), texto: `   ${a.textContent}` }); tras.after(o); tras = o; }
  }
  if (selNav) selNav.addEventListener('change', () => { const s = document.getElementById(selNav.value); if (s) { s.scrollIntoView({ block: 'start' }); $('h2, .guia-ficha-titulo', s)?.focus(); } });
  for (const h of $$('.guia-seccion > h2, .guia-ficha-titulo')) h.tabIndex = -1;
  /* Resalta la sección y la ficha que se están leyendo, y mantiene su enlace a la vista en el menú. */
  const nav = $('.guia-nav');
  const enlacesSeccion = $$('[data-nav-lista] > li > a');
  const enlacesFicha = $$('[data-nav-lista] .guia-nav-sub a');
  const aLaVista = (a) => {
    if (!nav || nav.scrollHeight <= nav.clientHeight) return;
    const r = a.getBoundingClientRect(); const n = nav.getBoundingClientRect();
    if (r.top < n.top || r.bottom > n.bottom) nav.scrollTop += r.top - n.top - n.height / 3;
  };
  const marca = (enlaces, id) => { for (const a of enlaces) { if (a.getAttribute('href') === `#${id}`) { a.setAttribute('aria-current', 'true'); aLaVista(a); } else a.removeAttribute('aria-current'); } };
  if ('IntersectionObserver' in window && enlacesSeccion.length) {
    const obs = new IntersectionObserver((entradas) => {
      for (const en of entradas) {
        if (!en.isIntersecting) continue;
        const id = en.target.id;
        if (en.target.matches('.guia-seccion')) {
          marca(enlacesSeccion, id);
          const fichaActual = enlacesFicha.find((a) => a.hasAttribute('aria-current'));
          if (fichaActual && !en.target.querySelector(fichaActual.getAttribute('href'))) fichaActual.removeAttribute('aria-current');
        } else marca(enlacesFicha, id);
        if (selNav && $(`option[value="${id}"]`, selNav)) selNav.value = id;
      }
    }, { rootMargin: '-20% 0px -70% 0px' });
    for (const s of $$('.guia-seccion, .guia-ficha')) obs.observe(s);
  }
}());
