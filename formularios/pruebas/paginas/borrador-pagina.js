/* Código propio de la página de prueba del borrador (P148): un proveedor de
   archivos que los guarda en sessionStorage, como lo haría un sistema en su
   servidor, y una precarga como la de «continuar una solicitud». */
const comoDatos = (f) => new Promise((ok) => { const r = new FileReader(); r.onload = () => ok({ nombre: f.name, tipo: f.type, datos: r.result }); r.readAsDataURL(f); });
const comoArchivo = async (x) => new File([await (await fetch(x.datos)).blob()], x.nombre, { type: x.tipo });
window.__proveedor = { guarda: [], borra: [] };
window.precarga = () => {
  const c = document.getElementById('nombre');
  c.value = 'Grupo precargado';
  c.dispatchEvent(new Event('input', { bubbles: true }));
  c.dispatchEvent(new Event('change', { bubbles: true }));
};
FormKit.iniciar(document.getElementById('solicitud'), {
  enviar: () => Promise.resolve({ folio: 'EJ-1', fecha: new Date().toISOString() }),
  borradorArchivos: {
    guarda: async (campo, archivos) => {
      window.__proveedor.guarda.push([campo, archivos.map((a) => a.name)]);
      sessionStorage.setItem(`arch-${campo}`, JSON.stringify(await Promise.all(archivos.map(comoDatos))));
    },
    lee: (campo) => Promise.all(JSON.parse(sessionStorage.getItem(`arch-${campo}`) || '[]').map(comoArchivo)),
    borra: (campo) => { window.__proveedor.borra.push(campo); sessionStorage.removeItem(`arch-${campo}`); }
  }
});
