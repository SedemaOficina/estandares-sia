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
