// ── NOTIFICACIONES ──
function getNotificaciones(){
  const inv=dba('inventario');
  const notifs=[];
  const hoy=new Date(); hoy.setHours(0,0,0,0);
  const warn7=new Date(hoy); warn7.setDate(warn7.getDate()+7);
  const warn30=new Date(hoy); warn30.setDate(warn30.getDate()+30);

  inv.forEach(p=>{
    const s=p.stock||0;
    const nombre=p.descripcion||p.name||p.clave||'';
    // Stock agotado
    if(s<=0){
      notifs.push({tipo:'danger',icon:'⛔',titulo:'Sin stock',msg:nombre,badge:'Stock: 0',ts:Date.now()});
    } else if(s<=2){
      notifs.push({tipo:'warning',icon:'⚠️',titulo:'Stock bajo',msg:nombre,badge:'Stock: '+s,ts:Date.now()});
    }
    // Caducidad
    if(p.caducidad){
      const cadDate=new Date(p.caducidad+'T12:00:00');
      if(cadDate<hoy){
        notifs.push({tipo:'danger',icon:'🔴',titulo:'Producto vencido',msg:nombre,badge:'Venció: '+p.caducidad,ts:Date.now()});
      } else if(cadDate<=warn7){
        const dias=Math.ceil((cadDate-hoy)/(1000*60*60*24));
        notifs.push({tipo:'danger',icon:'🟠',titulo:'Vence en '+dias+' día(s)',msg:nombre,badge:'Cad: '+p.caducidad,ts:Date.now()});
      } else if(cadDate<=warn30){
        const dias=Math.ceil((cadDate-hoy)/(1000*60*60*24));
        notifs.push({tipo:'warning',icon:'🟡',titulo:'Por vencer en '+dias+' días',msg:nombre,badge:'Cad: '+p.caducidad,ts:Date.now()});
      }
    }
  });

  // Ventas eliminadas hoy
  const movsHoy=dba('movimientos').filter(m=>m.fechaISO===today()&&m.tipo==='ajuste'&&m.desc.includes('eliminada'));
  movsHoy.forEach(m=>{
    notifs.push({tipo:'info',icon:'🗑',titulo:'Venta eliminada',msg:m.desc,badge:m.fecha,ts:Date.now()});
  });

  return notifs;
}

function renderNotificaciones(){
  const notifs=getNotificaciones();
  const c=g('notifContainer');
  if(!c)return;
  // Count badge
  const badge=g('notifBadge');
  const danger=notifs.filter(n=>n.tipo==='danger').length;
  const warning=notifs.filter(n=>n.tipo==='warning').length;
  const total=notifs.length;
  if(badge){
    badge.textContent=total>0?total:'';
    badge.style.display=total>0?'':'none';
    badge.style.background=danger>0?'#f44336':(warning>0?'#ff9800':'#4caf50');
  }
  if(!notifs.length){
    c.innerHTML=`<div style="text-align:center;padding:60px 20px;color:#bbb">
      <div style="font-size:48px;margin-bottom:12px">✅</div>
      <div style="font-size:16px;font-weight:600">Todo en orden</div>
      <div style="font-size:13px;margin-top:6px">No hay notificaciones pendientes</div>
    </div>`;
    return;
  }
  const colors={danger:'#ffebee',warning:'#fff8e1',info:'#e3f2fd'};
  const borders={danger:'#f44336',warning:'#ff9800',info:'#2196f3'};
  c.innerHTML=notifs.map(n=>`
    <div style="background:${colors[n.tipo]};border-left:4px solid ${borders[n.tipo]};border-radius:8px;padding:12px 16px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px">
      <div>
        <div style="font-weight:700;font-size:13px">${n.icon} ${n.titulo}</div>
        <div style="font-size:12px;color:#555;margin-top:2px">${n.msg}</div>
      </div>
      <span style="background:${borders[n.tipo]};color:white;border-radius:4px;padding:2px 8px;font-size:11px;font-weight:600;white-space:nowrap">${n.badge}</span>
    </div>`).join('');
}

function updateNotifBadge(){
  const notifs=getNotificaciones();
  const badge=g('notifBadge');
  if(!badge)return;
  const total=notifs.length;
  const danger=notifs.filter(n=>n.tipo==='danger').length;
  const warning=notifs.filter(n=>n.tipo==='warning').length;
  badge.textContent=total>0?total:'';
  badge.style.display=total>0?'':'none';
  badge.style.background=danger>0?'#f44336':(warning>0?'#ff9800':'#4caf50');
}
