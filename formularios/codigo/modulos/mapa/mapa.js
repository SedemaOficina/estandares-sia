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
