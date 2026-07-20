// ── DEVOLUCIONES ──
let devPend=null;
function renderDev(){
  const hist=dba('historial'), devs=dba('devoluciones');
  const df=g('devDate').value, sf=(g('devSearch').value||'').toLowerCase();
  let list=hist.filter(v=>!devs.find(d=>d.ventaId===v.id));
  if(df)list=list.filter(v=>v.fechaISO===df);
  if(sf)list=list.filter(v=>v.id.toLowerCase().includes(sf)||(v.cajero||'').toLowerCase().includes(sf));
  const c=g('devContainer');
  if(!list.length){c.innerHTML='<p class="empty">Sin ventas disponibles para devolver</p>';return;}
  c.innerHTML=[...list].reverse().map(v=>`
    <div class="devcard">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px">
        <div>
          <span class="idbadge">${v.seqLabel||''}</span>
          <strong>${v.id}</strong>
          <span style="font-size:11px;color:#bbb;margin-left:8px">${v.fecha}</span>
          <span style="font-size:11px;color:#999;margin-left:6px">Caja ${v.caja} — ${v.cajero}</span>
        </div>
        <button class="br" style="padding:6px 12px;border:none;border-radius:6px;cursor:pointer;color:white;font-size:12px;font-weight:700" onclick="openDevModal('${v.id}')">↩️ Devolver</button>
      </div>
      <div style="margin-top:5px;font-size:12px;color:#888">${v.items.map(i=>(i.descripcion||i.nombre||i.name||'')+' x'+(i.qty||i.cantidad||0)).join(' | ')}</div>
      <div style="margin-top:5px;font-size:13px"><strong>$${v.total.toFixed(2)}</strong><span style="font-size:11px;color:#bbb;margin-left:8px">Efec: $${(v.efectivo||0).toFixed(2)}</span></div>
    </div>`).join('');
}
function openDevModal(id){
  const v=dba('historial').find(x=>x.id===id);devPend=v;
  g('mDevContent').innerHTML=`
    <div style="background:#fff8e1;padding:10px;border-radius:8px;margin-bottom:10px;font-size:13px">
      <strong>${v.id}</strong> — ${v.fecha}<br>
      <span style="color:#999">Cajero: ${v.cajero} | Caja ${v.caja}</span>
    </div>
    <div style="font-size:13px;color:#555;line-height:2">${v.items.map(i=>`• ${i.descripcion||i.nombre||i.name||''} x${i.qty||i.cantidad||0} — $${(i.total||0).toFixed(2)}`).join('<br>')}</div>
    <div style="margin-top:10px;padding:10px;background:#ffebee;border-radius:8px;font-size:13px">
      <strong>💵 Se devolverá: $${v.total.toFixed(2)}</strong><br>
      <span style="font-size:11px;color:#999">Stock de productos será restaurado.</span>
    </div>`;
  openModal('mDev');
}
function confirmDev(){
  if(!devPend)return;
  const v=devPend;
  const inv=dba('inventario');
  v.items.forEach(it=>{
    const idx=inv.findIndex(p=>(p.clave||p.code)===(it.clave||it.codigo));
    if(idx>=0)inv[idx].stock=(inv[idx].stock||0)+(it.qty||it.cantidad||0);
  });
  db('inventario',inv);
  const devs=dba('devoluciones');
  devs.push({ventaId:v.id,fecha:nowStr(),fechaISO:today(),monto:v.total,efectivo:v.efectivo||0,caja:S.caja,cajero:S.user});
  db('devoluciones',devs);
  addMov({tipo:'devolucion',desc:'Devolución '+v.id+' — orig: '+v.cajero,
    monto:-v.total,efectivo:-(v.efectivo||0),fechaISO:today(),fecha:nowStr(),caja:S.caja});
  closeModal('mDev');devPend=null;
  renderDev();renderInventory();renderCorte();
  toast('✅ Devolución registrada. Stock restaurado.');
}

