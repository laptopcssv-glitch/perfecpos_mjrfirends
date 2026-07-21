// ── INIT ──
window.onload=function(){
  setLogoAll();
  if(typeof emailjs!=='undefined')emailjs.init(EJS_KEY);
  ['lUser','lPass','lCaja'].forEach(id=>g(id)?.addEventListener('keydown',e=>{if(e.key==='Enter')doLogin();}));
  ['suUser','suPass','suEmail'].forEach(id=>g(id)?.addEventListener('keydown',e=>{if(e.key==='Enter')doSetup();}));
  checkSetup();
  if(S&&S.user){
    g('loginOverlay').classList.add('hidden');
    startApp();
    checkStockAlerts();
    updateNotifBadge();
  }
};