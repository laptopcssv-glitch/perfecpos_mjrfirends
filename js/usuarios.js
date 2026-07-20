// ── USUARIOS ──
let userEditIdx=-1;
function renderUserList(){
  const c=g('userList');if(!c)return;
  const users=dba('usuarios');
  c.innerHTML=users.map((u,i)=>`
    <div class="uitem">
      <div>
        <strong>${u.user}</strong>
        <span class="urole ${u.role}">${u.role}</span>
        ${u.isPrimerAdmin?'<span style="font-size:10px;color:#00bcd4;margin-left:6px">⭐ Admin principal</span>':''}
        ${u.email?'<span style="font-size:11px;color:#aaa;margin-left:8px">✉️ '+u.email+'</span>':''}
      </div>
      <div style="display:flex;gap:6px">
        <button class="tedit" onclick="openUserModal(${i})">✏️ Editar</button>
        ${u.isPrimerAdmin?'':`<button class="tdel" onclick="delUser(${i})">🗑</button>`}
      </div>
    </div>`).join('');
}
function openUserModal(idx){
  userEditIdx=idx;
  g('mUserTitle').textContent=idx===-1?'Nuevo Usuario':'Editar Usuario';
  g('mUserNote').style.display='none';
  g('mUR').disabled=false;
  if(idx===-1){
    g('mUU').value='';g('mUP').value='';g('mUEmail').value='';g('mUR').value='cajero';
  } else {
    const u=dba('usuarios')[idx];
    g('mUU').value=u.user;g('mUP').value=u.pass;
    g('mUEmail').value=u.email||'';g('mUR').value=u.role;
    if(u.isPrimerAdmin){g('mUserNote').style.display='';g('mUR').disabled=true;}
  }
  openModal('mUser');
}
function saveUser(){
  const user=g('mUU').value.trim(), pass=g('mUP').value.trim(), email=g('mUEmail').value.trim();
  const role=g('mUR').disabled?dba('usuarios')[userEditIdx].role:g('mUR').value;
  if(!user||!pass){toast('Usuario y contraseña son requeridos');return;}
  const users=dba('usuarios');
  if(userEditIdx===-1){
    if(users.find(u=>u.user===user)){toast('Usuario ya existe');return;}
    users.push({id:Date.now(),user,pass,email,role});
  } else {
    users[userEditIdx]={...users[userEditIdx],user,pass,email,role};
  }
  db('usuarios',users);renderUserList();closeModal('mUser');toast('✅ Usuario guardado');
}
function delUser(idx){
  const users=dba('usuarios');
  if(users[idx]?.isPrimerAdmin){toast('No se puede eliminar el admin principal');return;}
  if(users.length<=1){toast('Debe existir al menos un usuario');return;}
  if(!confirm('¿Eliminar usuario?'))return;
  users.splice(idx,1);db('usuarios',users);renderUserList();toast('🗑 Eliminado');
}

// ================================================================
// INIT
// ================================================================
window.onload=function(){
  setLogoAll();
  // EmailJS init
  if(typeof emailjs!=='undefined')emailjs.init(EJS_KEY);
  // Enter keys
  ['lUser','lPass','lCaja'].forEach(id=>g(id)?.addEventListener('keydown',e=>{if(e.key==='Enter')doLogin();}));
  ['suUser','suPass','suEmail'].forEach(id=>g(id)?.addEventListener('keydown',e=>{if(e.key==='Enter')doSetup();}));
  checkSetup();
  if(S&&S.user){
    g('loginOverlay').classList.add('hidden');
    startApp();
    checkStockAlerts();
  }
};

