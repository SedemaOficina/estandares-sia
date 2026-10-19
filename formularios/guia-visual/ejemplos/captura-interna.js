/* Cableado del ejemplo de consulta interna: 37 registros FICTICIOS,
   filtros que se conservan al cambiar de página y tabla que se repinta.
   En un sistema real los datos vienen del servidor con los mismos
   parámetros (pagina, tamano, filtros). */
(function () {
  'use strict';
  const ESTADOS = ['recibido', 'atencion', 'cerrado'];
  const TXT = { recibido: 'Recibido', atencion: 'En atención', cerrado: 'Cerrado' };
  const TITULOS = ['Árbol de prueba inclinado', 'Residuos de prueba en vía pública', 'Ruido de prueba nocturno', 'Fauna de prueba en parque', 'Fuga de prueba', 'Registro de prueba con un título muy largo que no cabe en una sola línea de la tabla'];
  const REGISTROS = Array.from({ length: 37 }, (_, i) => ({ folio: `EJ-2026-${String(i + 1).padStart(6, '0')}`, titulo: TITULOS[i % TITULOS.length], fecha: `2026-0${1 + (i % 9)}-${String(1 + (i % 27)).padStart(2, '0')}`, estado: ESTADOS[i % 3], es_ficticio: true }));

  const nav = document.querySelector('[data-paginacion]');
  const cuerpo = document.querySelector('[data-filas]');
  const marco = document.querySelector('[data-tabla]');
  const filtros = document.getElementById('filtros');

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
      const celda = (t) => { const td = document.createElement('td'); td.textContent = t; return td; };
      tr.append(celda(r.folio), celda(r.titulo), celda(r.fecha), celda(TXT[r.estado]));
      const acc = document.createElement('td'); const caja = document.createElement('div'); caja.className = 'tabla-acciones';
      for (const [a, ic] of [['Ver', 'buscar'], ['Editar', 'editar'], ['Eliminar', 'eliminar']]) { const b = document.createElement('button'); b.type = 'button'; b.className = 'btn-icono'; b.dataset.accionFila = a.toLowerCase(); b.textContent = ''; b.setAttribute('aria-label', `${a} registro ${r.folio}`); b.append(FormKit.icono(ic)); caja.appendChild(b); }
      acc.appendChild(caja); tr.appendChild(acc); cuerpo.appendChild(tr);
    }
    FormKit.paginacion(nav, { total: lista.length, pagina });
    marco.dispatchEvent(new CustomEvent('formkit:tabla'));
  }
  nav.addEventListener('formkit:pagina', pinta);
  filtros.addEventListener('input', () => { nav.dataset.pagina = '1'; pinta(); });
  filtros.addEventListener('change', () => { nav.dataset.pagina = '1'; pinta(); });
  marco.addEventListener('click', (e) => {
    const b = e.target.closest('[data-accion-fila="eliminar"]');
    if (!b) return;
    const folio = b.closest('tr').dataset.folio;
    FormKit.confirma(b, { titulo: `¿Eliminar el registro ${folio}?`, irreversible: true, si: 'Eliminar registro', peligro: true }).then((ok) => { if (ok) { const i = REGISTROS.findIndex((r) => r.folio === folio); if (i >= 0) REGISTROS.splice(i, 1); pinta(); FormKit.anuncia(`Registro ${folio} eliminado.`); } });
  });
  const captura = document.getElementById('captura');
  captura.addEventListener('click', (e) => { if (e.target.closest('[data-limpiar]')) FormKit.confirma(e.target, { titulo: '¿Descartar la captura?', consecuencias: ['Se borra lo escrito en este formulario.'], irreversible: true, si: 'Descartar captura', peligro: true }).then((ok) => { if (ok) { captura.reset(); FormKit.anuncia('Captura descartada.'); } }); });
  captura.addEventListener('formkit:enviado', (e) => { FormKit.anuncia(`Registro guardado con folio ${e.detail.folio}.`, true); captura.reset(); });
  document.addEventListener('DOMContentLoaded', pinta);
}());
