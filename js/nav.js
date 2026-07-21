// ── NAV ──
function nav(page,btn){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('show'));
  document.querySelectorAll('.menu button').forEach(b=>b.classList.remove('active'));
  g('page'+page.charAt(0).toUpperCase()+page.slice(1)).classList.add('show');
  if(btn)btn.classList.add('active');
  ({
    corte:renderCorte,
    movimientos:renderMov,
    historial:renderHistorial,
    devoluciones:renderDev,
    inventario:renderInventory,
    usuarios:renderUserList,
    cortesHist:renderCortesHistorial,
    notificaciones:renderNotificaciones,
    configuracion:loadConfigForm,
  })[page]?.();
}