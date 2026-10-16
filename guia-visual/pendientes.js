/* =========================================================
   pendientes.js · Lista común de pendientes de los estándares del SIA

   Una sola lista para la portada y la guía de formularios. Sólo lleva lo
   que falta: cuando algo se resuelve, se quita de aquí y lo que se hizo
   queda en el CHANGELOG de cada estándar. Cada guía muestra sólo lo suyo y
   lo de los dos.

   Campos: de (Formularios, Mapas o Los dos), tema, que (lo que falta, en
   palabras de quien lo lee) y quien (quién lo decide o lo resuelve).
   ========================================================= */
(function () {
  'use strict';
  const LISTA = [
    { de: 'Formularios', tema: 'Catálogo de colonias', quien: 'Lo construye el SIA',
      que: 'El catálogo oficial de alcaldías, colonias y códigos postales. Lo está construyendo el SIA y se publicará en su GeoServer; cuando esté, el bloque de domicilio lo usa en lugar del de ejemplo, que sólo sirve para probar.' },
    { de: 'Formularios', tema: 'Prueba en teléfono real', quien: 'Lo resuelve quien programa',
      que: 'Probar los bloques nuevos (identificación, domicilio, edad, enlace de Google Maps y redes sociales) y los formularios de ejemplo en un iPhone y un Android reales, y con lector de pantalla.' },
    { de: 'Mapas', tema: 'Mapas base', quien: 'Lo verifica quien programa',
      que: 'Confirmar en las páginas de cada proveedor las condiciones de los mapas base: CARTO (límites y costo de la llave), Esri (licencia, cuota y texto del crédito), EOX (crédito y licencia), OpenStreetMap (crédito y política de uso), INEGI (si ofrece mapas base y en qué condiciones) y la ortofoto de la Secretaría (que el SIA la publique). En la guía están marcados como pendientes.' },
    { de: 'Mapas', tema: 'Llaves de proveedores de mapas', quien: 'Lo revisa quien programa',
      que: 'Revisar que las llaves de los proveedores de mapas que usan los sitios existentes sólo funcionen en sus propios dominios, o pasarlas a la configuración de cada sitio.' },
    { de: 'Los dos', tema: 'Licencia', quien: 'Decide la Secretaría',
      que: 'Elegir la licencia del código y la de la documentación, con apoyo jurídico; el logotipo institucional y las marcas de redes sociales quedan fuera de ella.' },
    { de: 'Los dos', tema: 'Repositorio nuevo en GitHub', quien: 'Lo hace la Secretaría',
      que: 'El historial de la carpeta ya está limpio, sin la firma de la herramienta de trabajo ni el correo personal. El repositorio de GitHub todavía guarda los guardados viejos: hay que borrarlo y crearlo de nuevo vacío antes de subir esta carpeta.' },
    { de: 'Formularios', tema: 'Avisos de privacidad', quien: 'Lo resuelve la Unidad de Transparencia',
      que: 'Completar el fundamento legal de los avisos de privacidad de las plantillas y enlazar el aviso integral antes de usar un formulario en producción.' },
    { de: 'Los dos', tema: 'Trato de tú o de usted', quien: 'Decide la Secretaría',
      que: 'Formularios habla siempre de tú y mapas pide usted para personal interno. Decidir cómo se habla en los formularios internos.' },
    { de: 'Mapas', tema: 'Un solo nombre', quien: 'Decide la Secretaría',
      que: 'Elegir un solo nombre para el estándar de mapas: «mapas», «visores de mapas» o «geovisores».' },
    { de: 'Mapas', tema: 'Aprobar la fase 1', quien: 'Decide la Secretaría',
      que: 'Aprobar la fase 1 de geovisores, incluidas de forma explícita las decisiones D5, D6, D8, D9 y D10, para pasar a la fase 2.' },
    { de: 'Los dos', tema: 'Contacto y seguridad', quien: 'Decide la Secretaría',
      que: 'Definir un contacto institucional y un canal para reportar fallas de seguridad, para el README y la política de seguridad del repositorio.' },
    { de: 'Los dos', tema: 'GitHub', quien: 'Decide la Secretaría',
      que: 'El repositorio ya se llama estandares-sia y es público. Falta decidir la licencia y subir esta carpeta después de la auditoría; al subirla, se actualiza la herramienta que arma formularios nuevos para que use la carpeta formularios/.' }
  ];

  /* Dibuja la lista en el contenedor. «de»: qué estándares mostrar (todos si se omite). */
  function pinta(cont, { de } = {}) {
    const crea = (tag, clase, txt) => { const e = document.createElement(tag); if (clase) e.className = clase; if (txt !== undefined) e.textContent = txt; return e; };
    const lista = LISTA.filter((p) => !de || de.includes(p.de));
    cont.textContent = '';
    cont.append(crea('p', 'pendientes-cuenta', lista.length ? `${lista.length} por resolver` : 'No hay pendientes.'));
    const ul = crea('ul', 'pendientes-lista');
    for (const p of lista) {
      const li = crea('li', 'pendientes-item');
      const cab = crea('p', 'pendientes-cab');
      cab.append(crea('span', 'pendiente', 'Por resolver'), crea('span', 'pendientes-de', `${p.de} · ${p.tema}`));
      li.append(cab, crea('p', 'pendientes-texto', p.que), crea('p', 'pendientes-nota', p.quien));
      ul.append(li);
    }
    cont.append(ul);
  }

  window.SIA_PENDIENTES = { lista: LISTA, pinta };
}());
