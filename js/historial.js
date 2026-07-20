// ── HISTORIAL ──
function clearHist(){g('histF1').value='';g('histF2').value='';g('histMes').value='';renderHistorial();}
function setHistMes(){
  const mes=g('histMes').value;
  if(!mes){clearHist();return;}
  const yr=new Date().getFullYear();
  g('histF1').value=`${yr}-${mes}-01`;
  const last=new Date(yr,parseInt(mes),0).getDate();
  g('histF2').value=`${yr}-${mes}-${String(last).padStart(2,'0')}`;
  g('histMes').value='';
  renderHistorial();
}
function getHistFiltered(){
  const f1=g('histF1').value, f2=g('histF2').value;
  const sq=(g('histSearch')?.value||'').toLowerCase().trim();
  let hist=dba('historial');
  if(f1&&f2)hist=hist.filter(v=>v.fechaISO>=f1&&v.fechaISO<=f2);
  else if(f1)hist=hist.filter(v=>v.fechaISO>=f1);
  else if(f2)hist=hist.filter(v=>v.fechaISO<=f2);
  if(sq)hist=hist.filter(v=>(v.seqLabel||'').toLowerCase().includes(sq)||v.id.toLowerCase().includes(sq));
  return hist;
}
function renderHistorial(){
  const list=getHistFiltered();
  const total=list.reduce((s,v)=>s+v.total,0);
  g('histRes').textContent=list.length?list.length+' ventas — $'+total.toFixed(2):'';
  const c=g('histContainer');
  if(!list.length){c.innerHTML='<p class="empty">Sin ventas en este período</p>';return;}
  c.innerHTML=[...list].reverse().map(v=>`
    <div class="hcard">
      <div class="hcard-hdr">
        <div>
          <span class="idbadge">${v.seqLabel||v.id}</span>
          <strong>${v.id}</strong>
          <span style="font-size:11px;color:#bbb;margin-left:8px">${v.fecha}</span>
          <span style="font-size:11px;color:#999;margin-left:6px">Caja ${v.caja} — ${v.cajero}</span>
        </div>
        <div style="display:flex;gap:6px">
          <button class="bc" style="padding:4px 10px;border:none;border-radius:6px;cursor:pointer;color:white;font-size:11px" onclick="reprintTicket('${v.id}')">🖨 Reimprimir</button>
          ${S.role==='admin'?`<button class="br" style="padding:4px 10px;border:none;border-radius:6px;cursor:pointer;color:white;font-size:11px" onclick="openDelSale('${v.id}')">🗑</button>`:''}
        </div>
      </div>
      <div class="hcard-items">${v.items.map(i=>`${i.descripcion||i.nombre||i.name||''} x${i.qty||i.cantidad||0}${i.descPct?' (-'+i.descPct+'%)':''}`).join(' &nbsp;|&nbsp; ')}</div>
      <div class="hcard-ftr">
        <strong style="font-size:15px">$${v.total.toFixed(2)}</strong>
        <span style="color:#aaa">${(v.metodo||'').replace(/\n/g,' · ')}</span>
      </div>
    </div>`).join('');
}
function reprintTicket(id){const v=dba('historial').find(x=>x.id===id);if(v)printTicket(v);}

// Eliminar venta con motivo
let delSaleId='';
function openDelSale(id){
  if(S.role!=='admin'){toast('Sin permisos');return;}
  delSaleId=id;
  const v=dba('historial').find(x=>x.id===id);
  g('mDelSaleInfo').textContent='Venta: '+id+' — $'+v.total.toFixed(2)+' — '+v.fecha;
  g('mDelSaleMotivo').value='';
  openModal('mDelSale');
}
function confirmDelSale(){
  const motivo=g('mDelSaleMotivo').value.trim();
  if(!motivo){toast('El motivo es requerido');return;}
  let hist=dba('historial');
  const v=hist.find(x=>x.id===delSaleId);
  hist=hist.filter(x=>x.id!==delSaleId);
  db('historial',hist);
  addMov({tipo:'ajuste',
    desc:'Venta eliminada: '+delSaleId+(v?' ($'+v.total.toFixed(2)+')'||'':'')+' | Motivo: '+motivo,
    monto:0,fechaISO:today(),fecha:nowStr(),caja:S.caja});
  closeModal('mDelSale');
  renderHistorial();renderCorte();
  toast('🗑 Venta eliminada');
}

