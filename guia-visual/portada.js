/* =========================================================
   portada.js · Portada común de la guía de los estándares del SIA

   Pinta los colores compartidos y la tabla de anchos leyendo los valores de
   las hojas cargadas en este momento: si formularios cambia un color o un
   corte, la portada lo muestra sin tocarla. Los textos de cada fila son
   documentación escrita a mano.
   ========================================================= */
(function () {
  'use strict';

  const estilo = getComputedStyle(document.documentElement);
  const valor = (token) => estilo.getPropertyValue(token).trim();
  const crea = (etiqueta, clase, texto) => {
    const el = document.createElement(etiqueta);
    if (clase) el.className = clase;
    if (texto !== undefined) el.textContent = texto;
    return el;
  };

  /* ----- Íconos: el catálogo de formularios, insertado una vez, igual que
     lo hace formkit.core.js (inyectaSprite). ----- */
  if (window.FORMKIT_ICONOS && !document.querySelector('[data-sprite-iconos]')) {
    const sprite = crea('div');
    sprite.setAttribute('data-sprite-iconos', '');
    sprite.hidden = true;
    sprite.innerHTML = window.FORMKIT_ICONOS;
    document.body.prepend(sprite);
  }

  /* ----- Colores compartidos ----- */
  const colores = document.getElementById('portada-colores');
  for (const [token, nombre, trabajo] of [
    ['--guinda', 'Guinda', 'Identidad y la única acción principal.'],
    ['--azul', 'Azul', 'Lo que se toca y lo elegido.'],
    ['--foco', 'Azul de foco', 'Solo el anillo que dice dónde está el teclado.'],
    ['--dorado', 'Dorado', 'Solo líneas y adornos; nunca texto.'],
    ['--texto', 'Texto', 'Lo que se lee.'],
    ['--gris', 'Gris', 'Texto secundario y ayudas.'],
    ['--error', 'Rojo', 'Error: lo que impide continuar.'],
    ['--pend', 'Ámbar', 'Pendiente o advertencia.'],
    ['--ok', 'Verde', 'El sistema confirma que recibió o guardó.'],
    ['--fondo', 'Fondo', 'Fondo de la página.']
  ]) {
    const caja = crea('div', 'portada-color');
    const muestra = crea('span', 'portada-color-muestra');
    muestra.setAttribute('aria-hidden', 'true');
    muestra.style.background = `var(${token})`;
    const texto = crea('span', 'portada-color-texto');
    texto.append(crea('span', 'portada-color-nombre', nombre), crea('span', '', trabajo), crea('span', 'portada-color-valor', `${token} ${valor(token)}`));
    caja.append(muestra, texto);
    colores.appendChild(caja);
  }

  /* ----- Anchos de pantalla ----- */
  const cortes = document.getElementById('portada-cortes');
  for (const [token, formularios, mapas] of [
    [null, 'Una sola columna; los botones ocupan todo el ancho, uno debajo de otro.', 'Visor de consulta en dos pantallas: información y mapa.'],
    ['--bp-sm', 'Igual que en el teléfono.', 'Igual que en el teléfono.'],
    ['--bp-md', 'Los renglones de campos pasan a dos o tres columnas; los botones toman su ancho y se ponen en fila.', 'Panel a la izquierda (320 px) y mapa a la derecha.'],
    ['--bp-lg', 'Igual que en 760; la página no pasa de su ancho máximo.', 'Panel de 400 px.']
  ]) {
    const tr = document.createElement('tr');
    for (const c of [token ? `${valor(token)} (${token})` : 'El teléfono', formularios, mapas]) tr.appendChild(crea('td', '', c));
    cortes.appendChild(tr);
  }

  /* ----- Pendientes: la lista común, completa ----- */
  const pendientes = document.querySelector('[data-pendientes]');
  if (pendientes && window.SIA_PENDIENTES) window.SIA_PENDIENTES.pinta(pendientes);

  document.documentElement.dataset.listo = 'si';
}());
