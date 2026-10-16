/* Código propio de la página de prueba: calcula el dato auxiliar
   «sin_materno» cada vez que cambia el apellido materno. */
document.addEventListener('DOMContentLoaded', () => {
  const materno = document.getElementById('materno');
  const sin = document.getElementById('sin_materno');
  const calcula = () => { sin.value = materno.value.trim() ? '' : 'si'; sin.dispatchEvent(new Event('input', { bubbles: true })); };
  materno.addEventListener('input', calcula);
  calcula();
});
