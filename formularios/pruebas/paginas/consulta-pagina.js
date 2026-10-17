/* Código propio de la página de consulta: pinta un encabezado calculado
   después de cargar y avisa a la tabla con formkit:tabla (P110). */
window.addEventListener('load', () => {
  setTimeout(() => {
    document.getElementById('calculado').textContent = 'Personas inscritas';
    document.getElementById('grupos').dispatchEvent(new CustomEvent('formkit:tabla'));
  }, 50);
});
