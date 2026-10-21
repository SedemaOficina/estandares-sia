/* Cableado del ejemplo de consulta interna: 37 registros FICTICIOS,
   filtros que se conservan al cambiar de página y tabla que se repinta.
   Lo que se guarda en «Captura rápida» aparece en la consulta y su folio
   queda a la vista; «Ver» abre el registro y «Editar» lo lleva a la captura.
   En un sistema real los datos vienen del servidor con los mismos
   parámetros (pagina, tamano, filtros). */
(function () {
  'use strict';
  const ESTADOS = ['recibido', 'atencion', 'cerrado'];
  /* Cada estado cae en una familia del módulo «estado»: la palabra dice el estado. */
  const TXT = { recibido: ['Recibido', 'proceso'], atencion: ['En atención', 'proceso'], cerrado: ['Cerrado', 'terminado'] };
  const CATEGORIAS = ['Arbolado', 'Residuos', 'Ruido', 'Fauna', 'Agua'];
  const TITULOS = ['Árbol de prueba inclinado', 'Residuos de prueba en vía pública', 'Ruido de prueba nocturno', 'Fauna de prueba en parque', 'Fuga de prueba', 'Registro de prueba con un título muy largo que no cabe en una sola línea de la tabla'];
  const REGISTROS = Array.from({ length: 37 }, (_, i) => ({ folio: `EJ-2026-${String(i + 1).padStart(6, '0')}`, titulo: TITULOS[i % TITULOS.length], categoria: CATEGORIAS[i % CATEGORIAS.length], fecha: `2026-0${1 + (i % 9)}-${String(1 + (i % 27)).padStart(2, '0')}`, estado: ESTADOS[i % 3], es_ficticio: true }));

  const nav = document.querySelector('[data-paginacion]');
  const cuerpo = document.querySelector('[data-filas]');
  const marco = document.querySelector('[data-tabla]');
  const filtros = document.getElementById('filtros');
  const captura = document.getElementById('captura');
  const dialogo = document.getElementById('dialogo-registro');
  /* Las fechas se ven como día/mes/año (FRM-30); se guardan como AAAA-MM-DD. */
  const dma = (iso) => FormKit.config.dmaDeIso(iso) || iso;
  const el = (tag, clase, texto) => { const e = document.createElement(tag); if (clase) e.className = clase; if (texto !== undefined) e.textContent = texto; return e; };
  let editando = '';

  function filtrados() {
    const q = (filtros.elements.buscar.value || '').toLowerCase();
    const e = filtros.elements.estado.value;
    return REGISTROS.filter((r) => (!q || r.folio.toLowerCase().includes(q) || r.titulo.toLowerCase().includes(q)) && (!e || r.estado === e));
  }
  function pinta() {
    const lista = filtrados();
    const tam = Number(nav.dataset.tamano || 10);
    const pagina = Math.min(Number(nav.dataset.pagina || 1), Math.max(1, Math.ceil(lista.length / tam)));
    nav.dataset.pagina = String(pagina);
    const pag = lista.slice((pagina - 1) * tam, pagina * tam);
    cuerpo.textContent = '';
    for (const r of pag) {
      const tr = document.createElement('tr'); tr.dataset.folio = r.folio;
      const celda = (contenido) => { const td = document.createElement('td'); td.append(contenido); return td; };
      /* Folio y fecha en .mono: no se parten en la computadora. */
      const estado = el('span', `estado estado-${TXT[r.estado][1]}`, TXT[r.estado][0]);
      tr.append(celda(el('span', 'mono', r.folio)), celda(r.titulo), celda(el('span', 'mono', dma(r.fecha))), celda(estado));
      /* «Ver» y «Editar» llevan su palabra; sólo «Eliminar» puede ir con su icono solo (FRM-72). */
      const acc = document.createElement('td'); const caja = el('div', 'tabla-acciones');
      for (const [a, t] of [['ver', 'Ver'], ['editar', 'Editar']]) { const b = el('button', 'btn-enlace', t); b.type = 'button'; b.dataset.accionFila = a; b.setAttribute('aria-label', `${t} registro ${r.folio}`); caja.appendChild(b); }
      const del = el('button', 'btn-icono'); del.type = 'button'; del.dataset.accionFila = 'eliminar'; del.setAttribute('aria-label', `Eliminar registro ${r.folio}`); del.append(FormKit.icono('eliminar')); caja.appendChild(del);
      acc.appendChild(caja); tr.appendChild(acc); cuerpo.appendChild(tr);
    }
    if (FormKit.estado && FormKit.estado.inicia) FormKit.estado.inicia(cuerpo);
    FormKit.paginacion(nav, { total: lista.length, pagina });
    marco.dispatchEvent(new CustomEvent('formkit:tabla'));
  }
  nav.addEventListener('formkit:pagina', pinta);
  /* Sólo con «input» (también lo lanza la lista de estado): el «change» que llega al salir del
     buscador volvía a pintar las filas a media pulsación y el clic en «Ver» se perdía. */
  filtros.addEventListener('input', () => { nav.dataset.pagina = '1'; pinta(); });

  marco.addEventListener('click', (e) => {
    const b = e.target.closest('[data-accion-fila]');
    if (!b) return;
    const folio = b.closest('tr').dataset.folio;
    const r = REGISTROS.find((x) => x.folio === folio);
    if (!r) return;
    if (b.dataset.accionFila === 'ver') {
      dialogo.querySelector('[data-registro-titulo]').textContent = `Registro ${r.folio}`;
      const dl = dialogo.querySelector('[data-registro-datos]'); dl.textContent = '';
      for (const [k, v] of [['Título', r.titulo], ['Categoría', r.categoria], ['Fecha', dma(r.fecha)], ['Estado', TXT[r.estado][0]]]) dl.append(el('dt', '', k), el('dd', '', v));
      dialogo.showModal();
    } else if (b.dataset.accionFila === 'editar') {
      /* Editar lleva el registro a la captura: al guardar, se actualiza el mismo. */
      document.getElementById('t-captura').click();
      captura.elements.categoria.value = r.categoria;
      captura.elements.fecha.value = r.fecha;
      captura.elements.titulo.value = r.titulo;
      captura.elements.folio_ref.value = r.folio;
      editando = r.folio;
      FormKit.aviso(captura, { tono: 'neutro', texto: `Editas el registro ${r.folio}: al guardar se actualiza, no se crea otro.`, foco: true });
    } else if (b.dataset.accionFila === 'eliminar') {
      FormKit.confirma(b, { titulo: `¿Eliminar el registro ${folio}?`, irreversible: true, si: 'Eliminar registro', peligro: true }).then((ok) => { if (ok) { REGISTROS.splice(REGISTROS.indexOf(r), 1); pinta(); FormKit.anuncia(`Registro ${folio} eliminado.`); } });
    }
  });

  captura.addEventListener('click', (e) => { if (e.target.closest('[data-limpiar]')) FormKit.confirma(e.target, { titulo: '¿Descartar la captura?', consecuencias: ['Se borra lo escrito en este formulario.'], irreversible: true, si: 'Descartar captura', peligro: true }).then((ok) => { if (ok) { captura.reset(); editando = ''; FormKit.anuncia('Captura descartada.'); } }); });
  /* Guardado: el registro entra a la consulta (o se actualiza) y el folio queda a la vista, no sólo anunciado (FRM-40). */
  captura.addEventListener('formkit:enviado', (e) => {
    const datos = { titulo: captura.elements.titulo.value.trim(), categoria: captura.elements.categoria.value.trim(), fecha: captura.elements.fecha.value };
    const previo = editando && REGISTROS.find((x) => x.folio === editando);
    const folio = previo ? previo.folio : e.detail.folio;
    if (previo) Object.assign(previo, datos); else REGISTROS.unshift({ folio, ...datos, estado: 'recibido', es_ficticio: true });
    FormKit.aviso(captura, { tono: 'ok', texto: `${previo ? 'Registro actualizado' : 'Registro guardado'} con folio ${folio}. Ya aparece en «Consulta».`, foco: true });
    editando = '';
    captura.reset();
    nav.dataset.pagina = '1';
    pinta();
  });
  document.addEventListener('DOMContentLoaded', pinta);
}());
