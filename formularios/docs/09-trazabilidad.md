# 09 · Trazabilidad y registro de decisiones

De dónde viene cada pieza del estándar (paquete A «Denuncias Ambientales», paquete B, o construido nuevo para este encargo), qué se decidió en los trece conflictos de la fase 0 y qué quedó fuera de la versión 1.0. El análisis completo de la fase 0 está en `00-fase-0-analisis-comparativo.md` (entregado aparte).

## 1. Decisiones de la fase 0 (confirmadas por la persona responsable)

| Id | Conflicto | Decisión | Dónde vive |
|---|---|---|---|
| C1 | Arquitectura: catálogo JS (A) o atributos HTML (B) | **Fusión**: el HTML declara cada campo con atributos; patrones, límites y mensajes en un solo `validaciones.config.js`; módulos independientes con manifiesto | `formkit.core.js`, `validaciones.config.js`, `manifiesto.json`; FRM-11, FRM-71 |
| C2 | Color del asterisco de obligatorio | **Guinda** (`--guinda`), con «(obligatorio)» para lectores. Revisada por la Secretaría el 14 oct 2026; en la fase 0 era gris porque el rojo se confundía con error | `nucleo.css .marca-oblig`; FRM-10 |
| C3 | Sí/No: radios (A) o botones `aria-pressed` (B) | **Radios nativos** de A con la sombra interior de B | `opciones.css .opcion-corta`; FRM-16 |
| C4 | Combo cerrado o con valor libre | **Cerrado por omisión**; `data-libre` lo abre | `combo.js`; FRM-19 |
| C5 | Momento de la validación | Regla del encargo: error al salir si se escribió; recalcular al corregir; nunca en campo intacto; todo al avanzar | `formkit.core.js`; FRM-26 |
| C6 | EXIF de las fotografías | **Configurable, desactivado** (`conservarExif: false`) | `validaciones.config.js ARCHIVOS`; FRM-53 |
| C7 | Botón secundario y «Atrás» | Secundario gris con borde (A); «Atrás» enlace azul con flecha (B) | `nucleo.css`; FRM-35 |
| C8 | Pasos futuros en la barra | **Habilitados**; avanzar exige lo mismo que «Continuar» | `pasos.js`; FRM-02 |
| C9 | `[hidden]` | **Sin `!important`**, al final del núcleo; los módulos usan `:not([hidden])` | `nucleo.css`; FRM-69; prueba 03 |
| C10 | Código postal | 5 dígitos como texto; **ámbito CDMX configurable** (01000–16999) | `validaciones.config.js ambito.cp`; FRM-48 |
| C11 | Texto de pendiente | La palabra **en el HTML**, no en CSS | `nucleo.css .pendiente`; FRM-75 |
| C12 | Pesos tipográficos | Cabin 600/700; Roboto 400/500/700 | `tokens.css`, `codigo/fuentes/`; FRM-78 |
| C13 | Nomenclatura de reglas | **FRM-NN corrida** | `reglas/reglas.json`; `docs/01` |

Decisiones adicionales tomadas durante la construcción (no estaban en la fase 0), para confirmar o revertir:

| Id | Decisión | Motivo |
|---|---|---|
| D1 | El ámbar (`--pend`) cubre advertencia **y** pendiente | Son la misma idea: atención sin bloqueo; una paleta de un color por trabajo |
| D2 | La geolocalización del dispositivo sólo con `data-geolocalizacion` | Pedir permiso sin motivo ahuyenta (B FRM-UBI-01) |
| D3 | El mapa base se declara en `FORMKIT_CONFIG.mapa` y está vacío por omisión | Ningún proveedor acordado; el punto se coloca igual sin teselas |
| D4 | Estructura y dígito verificador de la CURP marcados `[Fuente: __]` | No se consultó la fuente oficial (RENAPO); `curp.verificarDigito` se puede apagar |
| D5 | Los módulos de ámbito documento se inician una sola vez por página | Una página con dos formularios duplicaba escuchas (doble descarga); detectado al construir la guía |
| D6 | La guía visual puede definir variables `--guia-*` | El auditor exige una sola fuente de variables; la guía no viaja con el paquete y necesita medidas propias; declarado en `auditor-css.config.json` |
| D7 | `aria-expanded` sólo en `select`; en radios y casillas basta `aria-controls` | axe (aria-allowed-attr): el atributo no se admite en el rol radio/checkbox |
| D8 | Lo que exige leer el archivo (firma, dimensiones) queda en la lista con estado de error; lo demás se rechaza en el acto | Un rechazo asíncrono que desaparece de la lista no se entiende |
| D9 | La franja «Entorno de pruebas» es un `aside` con nombre | Debe estar en un landmark (axe region) |

## 2. Origen de cada pieza

Leyenda: **A** tomado del paquete A · **B** tomado del paquete B · **A+B** fusión · **Nuevo** construido para este encargo (ninguno lo tenía).

### Núcleo

| Pieza | Origen | Nota |
|---|---|---|
| Tokens, paleta, pie dorado, cabecera con logotipo | A | Reescritos móvil-primero; escala fluida nueva |
| Reinicio, tarjeta, jerarquía de seis niveles | A+B | Clases de A; niveles de B |
| Filas con subcuadrícula (`.fila`, `.fila-3`, `.fila-2-1`) | A | |
| Campo, etiqueta, ayuda antes del control, error con icono | A+B | Icono SVG nuevo |
| Marca de obligatorio guinda + leyenda | A+B (C2, revisada el 14 oct 2026) | |
| Select con flecha propia | A | |
| Casilla de declaración destacada | A+B | |
| Solo lectura frente a deshabilitado | Nuevo | |
| Pregunta condicional `data-si` | B (sintaxis) + A (semántica) | |
| Validación individual, resumen con foco y retiro automático | A+B | |
| Validaciones cruzadas | Nuevo | |
| Borrador local versionado, franja recuperar/descartar, sensibles fuera | A | `pagehide` nuevo |
| Envío con plazo, `aria-busy`, error, límite, idempotencia | A | `aria-disabled` sin perder foco (encargo); idempotencia nueva |
| Botones primario, secundario, atrás, enlace, icono | A+B (C7) | Variante peligro nueva |
| Avisos neutro, bloqueo, ok | A+B | Advertencia nueva |
| Pendiente visible | A (C11) | |
| Iconografía SVG (sprite) | Nuevo | |
| Autocompletado, `inputmode` | A+B | `enterkeyhint` y auditoría nuevos |
| `data-uso`, `data-finalidad`, `data-sensible`, inventario | A | Auditoría `auditar-campos.mjs` nueva |
| Registro de módulos, ganchos, manifiesto | Nuevo | |

### Módulos

| Módulo | Origen | Nota |
|---|---|---|
| opciones (tarjetas, lista, Sí/No) | A (tarjetas) + B (lista, sombra) | C3 |
| otro | Nuevo | A y B lo tenían parcial |
| combo | A (cerrado, ARIA 1.2) + B (libre) | C4 |
| fecha («Hoy», «Ahora», rango, atajos, no futura) | Nuevo | A y B sólo control nativo |
| identificadores (CURP, RFC, folio) | Nuevo | |
| repetibles | Nuevo | |
| toggle | Nuevo | |
| escala | Nuevo | |
| pasos | A | Recordatorio de A; acciones fijas opcionales |
| revision | A | |
| acuse | A | |
| modal (`dialog` + `confirma`) | A (`dialog`) + B (`confirma`) | |
| copiar / compartir | A (copiar) · Nuevo (compartir) | |
| descarga | Nuevo | |
| acordeon | A+B | |
| pestanas | Nuevo | |
| migas | Nuevo | |
| progreso | Nuevo | |
| paginacion | Nuevo | |
| tooltip | Nuevo | |
| tabla (consulta, tarjetas en teléfono, captura) | B (CSS) · Nuevo (tarjetas, orden, acciones) | |
| archivos (zona, cámara, firma, SHA-256, duplicados, optimización, vista previa, reintento) | A (zona, estado, optimización) · Nuevo (cámara, firma, duplicados, reintento, dimensión) | C6 |
| mapa (Leaflet, gestos, confirmación, ámbito) | A (reglas, vendor) + B (JS mínimo) · Nuevo (módulo) | |
| cascadas | Nuevo | |
| chips | Nuevo | |

### Herramientas y verificación

| Pieza | Origen |
|---|---|
| Auditor de CSS (A01–A16) | A, ampliado (A11 sólo `min-width`, A15 variables propias) |
| Contraste medido y tabla generada | A, con pares nuevos |
| Generador de reglas → `docs/01` | A, adaptado a niveles y a la numeración corrida |
| `vendor.mjs` con sumas | A |
| Servidor estático y navegador para pruebas, PNG de ruido, JPEG con EXIF | A |
| Pruebas en dos perfiles y siete anchos; prueba de `[hidden]`; objetivos táctiles; nombres de botones | Nuevo |
| `auditar-campos.mjs`, `esquema-desde-html.mjs`, `validar.mjs` | Nuevo |
| `construir.mjs` (iconos, manifiesto, dist, esquemas, catálogo, artefacto, ZIP) | Nuevo |
| Guía visual con árbol de decisión, fichas vivas, probador, sí y no, ejemplos con selector de ancho | Nuevo (la guía de A y la de B eran estáticas) |

## 3. Qué quedó fuera de la versión 1.0 (para 1.1)

Confirmado por la persona responsable: los huecos adicionales de la sección 8 de la fase 0 se difieren.

| Pieza | Nivel propuesto | Nota |
|---|---|---|
| Consulta de folio y seguimiento | OPCIONAL | Campo de folio + estado |
| Aviso de privacidad completo (integral/simplificado, versión y fecha aceptada en el envío) | BASE con datos personales | El diálogo simplificado ya está; falta registrar versión aceptada |
| Prueba de humanidad como módulo con punto de integración autoalojado | RECOMENDADO en públicos | Las señales (casilla, trampa, tiempo) ya viajan |
| Aviso de sesión por expirar | OPCIONAL | |
| Vista previa de PDF | OPCIONAL | La de imagen ya está |
| Calendario de citas | OPCIONAL | |
| Firma o conformidad | OPCIONAL | |
| Representante o tutor (bloque por edad) | OPCIONAL | La cruzada `edad` ya existe |
| Selector de lengua y texto alternativo | OPCIONAL | |
| Impresión del acuse ampliada | RECOMENDADO | La hoja `print` básica está |
| Indicador de entorno configurable | OPCIONAL | La franja fija está |
| Búsqueda de dirección (geocodificación) | OPCIONAL | Depende de un servicio del proyecto |
| Herencia de respuestas previas | OPCIONAL | |
| Variante de teléfono extranjero | OPCIONAL | |
| Pruebas con red lenta y con zoom al 400 % automatizadas | — | Quedan en la lista manual de `docs/08` |

## 4. Lo que la fase 0 no pudo comprobar y sigue abierto

Lectores de pantalla reales; dispositivos iOS y Android físicos; Firefox y Safari; mapa con teselas; estructura oficial de CURP y RFC; procedencia exacta de las tipografías; catálogo oficial de alcaldías y colonias. Cada punto tiene su forma de cierre en `docs/08`, sección 5.
