# Historial de cambios

## 1.0.0 · 2026-10-02

Primera versión del estándar genérico, construida a partir del análisis comparativo de los paquetes A («Denuncias Ambientales») y B (fase 0, trece conflictos decididos; ver `docs/09-trazabilidad.md`).

- **Arquitectura** (C1): núcleo obligatorio + 25 módulos independientes con manifiesto; campos declarados por atributos HTML; validación en un solo `validaciones.config.js` compartido con el servidor.
- **Móvil primero**: CSS con `min-width` únicamente, tres puntos de corte en tokens, escala tipográfica fluida, áreas seguras, objetivos de 44 px; verificado en 320, 360, 390, 768, 1024, 1280 y 1920 px y en dos perfiles (teléfono táctil y escritorio).
- **Tipos de pregunta**: texto, correo, teléfono, numérico, texto largo, opciones (tarjetas, lista, Sí/No), «Otro» con especificación, combo cerrado o libre, select, casilla de declaración, condicional, fecha con «Hoy» y rangos, hora, CURP/RFC/folio con derivados, repetibles, interruptor, escala, cascadas alcaldía → colonia → CP, archivos con cámara, firma, duplicados y optimización, mapa con gestos y confirmación, chips de uso frecuente, solo lectura frente a deshabilitado.
- **Navegación y retroalimentación**: pasos con barra navegable, revisión, acuse, diálogo y confirmación, copiar y compartir, descarga, acordeón, pestañas, migas, progreso, paginación, ayuda desplegable, tabla (tarjetas en teléfono), cuatro avisos, pendiente visible, iconografía SVG propia.
- **Validaciones**: 13 formatos, 8 cruzadas (CURP↔fecha, rango, igual, edad, cp↔colonia…), momento acordado (C5), resumen con foco, servidor que revalida con esquema derivado del HTML, idempotencia.
- **Protección de datos**: `data-uso`, `data-finalidad`, `data-sensible` exigidos por `auditar-campos.mjs`; borrador sin sensibles ni archivos; EXIF desactivado por omisión (C6); chips sólo locales.
- **Herramientas**: construcción (iconos, manifiesto, dist, esquemas, catálogo, artefacto, ZIP), auditor de CSS A01–A16, contraste, campos, bibliotecas, generador de reglas, verificación única, capturas.
- **Guía visual interactiva**: árbol de decisión con etiquetas para pegar, fundamentos leídos de la hoja real, fichas vivas con HTML para copiar, probador de validaciones, pares «sí y no», cuatro formularios de ejemplo con selector de ancho y vista lado a lado; publicada también como artefacto autocontenido.
- **Reglas**: 81 reglas FRM-01 a FRM-81 con nivel BASE / RECOMENDADO / OPCIONAL y origen trazado (A, B, encargo).

Corregido durante la construcción (defectos que habrían llegado a los proyectos): módulos de ámbito documento que duplicaban escuchas con dos formularios en la página (doble descarga); `display` de módulos que pisaba `[hidden]`; `aria-expanded` en radios; franja de entorno fuera de landmark; enlaces del resumen de errores por debajo de 24 px; validación cruzada que no se disparaba al salir hacia el botón «Hoy»; «Otro» que perdía su sugerencia al limpiar; mapa iniciado oculto sin recentrar; cascada que perdía los hijos al restaurar el borrador.

Pendiente para 1.1: ver `docs/09-trazabilidad.md`, sección 3.
