/* Código propio de la página de prueba de desenlaces: rechazar pide
   confirmación con sus consecuencias y luego muestra el resultado (P113). */
FormKit.descargas.falla = () => Promise.reject(new Error('sin servidor'));
document.getElementById('rechazar').addEventListener('click', async (e) => {
  const ok = await FormKit.confirma(e.currentTarget, {
    titulo: '¿Rechazar la solicitud EJ-2026-000123?',
    consecuencias: ['La persona recibe el motivo por correo.', 'La solicitud pasa a «Rechazada» y ya no se puede editar.'],
    irreversible: true, si: 'Rechazar solicitud', peligro: true
  });
  if (!ok) return;
  FormKit.estado(document.getElementById('estado-solicitud'), { tono: 'rechazo', texto: 'Rechazada', anuncia: true });
  FormKit.resultado(document.getElementById('resultado'), {
    tono: 'rechazo', titulo: 'Solicitud EJ-2026-000123 rechazada', quien: 'Ana Revisora',
    motivo: 'La identificación oficial está vencida.', oculta: document.getElementById('decision')
  });
});
