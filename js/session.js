// ── SESSION ──
let S=db('session')||{};

function checkSetup(){
  if(!dba('usuarios').length){
    setLogoAll();
    g('setupOverlay').classList.remove('hidden');
  }
}
function setLogoAll(){
  const logoData = getLogoDataUrl();
  const src = logoData || 'data:image/jpeg;base64,'+LOGO;
  ['loginLogo','setupLogo','sidebarLogo'].forEach(id=>{const el=g(id);if(el)el.src=src;});
}
function doSetup(){
  const u=g('suUser').value.trim(),p=g('suPass').value.trim(),e=g('suEmail').value.trim();
  if(!u||!p){toast('Usuario y contraseña son requeridos');return;}
  const users=dba('usuarios');
  users.push({id:Date.now(),user:u,pass:p,email:e,role:'admin',isPrimerAdmin:true});
  db('usuarios',users);
  g('setupOverlay').classList.add('hidden');
  toast('✅ Administrador creado. Inicia sesión.');
}
function doLogin(){
  const u=g('lUser').value.trim(),p=g('lPass').value.trim(),c=g('lCaja').value.trim();
  if(!c){toast('Ingresa número de caja');return;}
  const found=dba('usuarios').find(x=>x.user===u&&x.pass===p);
  if(!found){toast('❌ Credenciales incorrectas');return;}
  S={user:u,role:found.role,caja:c,id:found.id};
  db('session',S);
  g('loginOverlay').classList.add('hidden');
  startApp();
}
function doLogout(){db('session',null);location.reload();}
function startApp(){
  const config = getCompanyConfig();
  setLogoAll();
  document.title = config.companyName + ' - Sistema POS';
  g('sidebarTxt').textContent=S.user+' | Caja '+S.caja + ' | ' + config.companyName;
  g('corteCajaLbl').textContent='— Caja '+S.caja;
  g('movCajaLbl').textContent='— Caja '+S.caja;
  if(S.role==='admin'){
    g('adminSep').style.display='';
    g('btnUsuarios').style.display='';
    g('btnConfiguracion').style.display='';
  }
  buildDenomGrid();
  renderInventory();
  checkStockAlerts();
}
function resetSetup(){
  if(!confirm('¿Restablecer configuración inicial? Se eliminarán todos los usuarios. El inventario e historial se conservan.'))return;
  ['usuarios','session','pp_v3'].forEach(k=>localStorage.removeItem(k));
  location.reload();
}

// ── RECUPERAR CONTRASEÑA (EmailJS) ──
let recTempCode='', recTempUser='';

function showRecovery(){
  g('loginOverlay').classList.add('hidden');
  g('recStep1').style.display='';g('recStep2').style.display='none';g('recStep3').style.display='none';
  g('recUser').value='';g('recEmail').value='';g('recCode').value='';
  g('recoveryOverlay').classList.remove('hidden');
}
function hideRecovery(){
  g('recoveryOverlay').classList.add('hidden');
  g('loginOverlay').classList.remove('hidden');
}
function sendRecoveryCode(){
  const u=g('recUser').value.trim(), e=g('recEmail').value.trim();
  if(!u||!e){toast('Ingresa usuario y correo');return;}
  const found=dba('usuarios').find(x=>x.user===u&&(x.email||'').toLowerCase()===e.toLowerCase());
  if(!found){toast('❌ Usuario o correo no coinciden');return;}
  recTempCode=String(Math.floor(100000+Math.random()*900000));
  recTempUser=u;
  toast('📧 Enviando código...');
  const config = getCompanyConfig();
  emailjs.init(config.emailjs.publicKey);
  emailjs.send(config.emailjs.serviceId, config.emailjs.templateId,{to_name:u,to_email:e,code:recTempCode})
    .then(()=>{
      toast('✅ Código enviado a tu correo');
      g('recStep1').style.display='none';
      g('recStep2').style.display='';
      g('recCode').focus();
    }).catch(err=>{console.error(err);toast('❌ Error al enviar correo.');});
}
function verifyCode(){
  const entered=g('recCode').value.trim();
  if(!entered){toast('Ingresa el código');return;}
  if(entered!==recTempCode){toast('❌ Código incorrecto');return;}
  g('recStep2').style.display='none';
  g('recStep3').style.display='';
  g('recNewPass').focus();
  toast('✅ Código verificado');
}
function saveNewPassword(){
  const p1=g('recNewPass').value.trim(), p2=g('recNewPass2').value.trim();
  if(!p1){toast('Ingresa una contraseña');return;}
  if(p1!==p2){toast('❌ Las contraseñas no coinciden');return;}
  const users=dba('usuarios');
  const idx=users.findIndex(x=>x.user===recTempUser);
  if(idx>=0){users[idx].pass=p1;db('usuarios',users);}
  recTempCode='';recTempUser='';
  g('recoveryOverlay').classList.add('hidden');
  g('loginOverlay').classList.remove('hidden');
  toast('✅ Contraseña actualizada. Inicia sesión.');
}